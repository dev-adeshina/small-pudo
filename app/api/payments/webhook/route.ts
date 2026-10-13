import { NextResponse } from "next/server";
import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

function verifySignature(
  rawBody: string,
  signature: string | null,
  secretKey: string
): boolean {
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) {
    return false;
  }

  const expected = createHmac("sha512", secretKey)
    .update(rawBody)
    .digest();

  const received = Buffer.from(signature, "hex");

  return (
    received.length === expected.length &&
    timingSafeEqual(received, expected)
  );
}

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error("Paystack webhook secret is not configured.");

    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 500 }
    );
  }

  // Read the original body before parsing JSON.
  const rawBody = await request.text();

  if (
    !verifySignature(
      rawBody,
      request.headers.get("x-paystack-signature"),
      secretKey
    )
  ) {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 }
    );
  }

  let event: {
    event?: unknown;
    data?: {
      id?: unknown;
      reference?: unknown;
      status?: unknown;
      amount?: unknown;
      currency?: unknown;
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook payload." },
      { status: 400 }
    );
  }

  // Ignore events that this endpoint does not process.
  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const payment = event.data;

  if (
    !payment ||
    typeof payment.reference !== "string" ||
    !payment.reference ||
    payment.status !== "success" ||
    !Number.isSafeInteger(payment.id) ||
    !Number.isSafeInteger(payment.amount) ||
    typeof payment.currency !== "string"
  ) {
    return NextResponse.json(
      { error: "Invalid payment event." },
      { status: 400 }
    );
  }

  const reference = payment.reference;

  try {
    // Find the order associated with this payment.
    const orders = await adminDb
      .collection("orders")
      .where("paymentReference", "==", reference)
      .limit(1)
      .get();

    if (orders.empty) {
      // Do not retry indefinitely for an unrecognized reference.
      // Investigate this event in server logs.
      console.error(
        "Successful Paystack payment has no matching order:",
        reference
      );

      return NextResponse.json({ received: true });
    }

    const orderRef = orders.docs[0].ref;

    // A deterministic key makes repeated delivery of this event safe.
    const eventKey = createHash("sha256")
      .update(
        `charge.success:${reference}:${String(payment.id)}`
      )
      .digest("hex");

    const eventRef = adminDb
      .collection("paymentWebhookEvents")
      .doc(eventKey);

    await adminDb.runTransaction(async (transaction) => {
      // All reads must happen before writes.
      const eventSnapshot = await transaction.get(eventRef);
      const orderSnapshot = await transaction.get(orderRef);

      if (eventSnapshot.exists) {
        return;
      }

      if (!orderSnapshot.exists) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const order = orderSnapshot.data()!;

      if (order.paymentReference !== reference) {
        throw new Error("REFERENCE_MISMATCH");
      }

      const expectedAmount =
        typeof order.total === "number"
          ? order.total * 100
          : NaN;

      const amountMatches =
        Number.isSafeInteger(expectedAmount) &&
        expectedAmount > 0 &&
        payment.amount === expectedAmount;

      const currencyMatches =
        order.currency === "NGN" &&
        payment.currency === "NGN";

      if (!amountMatches || !currencyMatches) {
        transaction.update(orderRef, {
          paymentReviewRequired: true,
          paymentReviewReason:
            "Successful Paystack payment requires review because its amount or currency does not match the order.",
          updatedAt: FieldValue.serverTimestamp(),
        });

        transaction.create(eventRef, {
          event: "charge.success",
          reference,
          transactionId: payment.id,
          outcome: "review_required",
          receivedAt: FieldValue.serverTimestamp(),
        });

        return;
      }

      // A successful payment must never restore a cancelled
      // order to normal fulfilment.
      if (order.orderStatus === "cancelled") {
        transaction.update(orderRef, {
          paymentStatus: "paid",
          paymentReviewRequired: true,
          paymentReviewReason:
            "Payment succeeded after the order was cancelled. Review for refund or other resolution.",
          paystackTransactionId: payment.id,
          paidAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        transaction.create(eventRef, {
          event: "charge.success",
          reference,
          transactionId: payment.id,
          outcome: "cancelled_order_review",
          receivedAt: FieldValue.serverTimestamp(),
        });

        return;
      }

      // Already-paid orders must not be processed again.
      if (order.paymentStatus === "paid") {
        transaction.create(eventRef, {
          event: "charge.success",
          reference,
          transactionId: payment.id,
          outcome: "already_paid",
          receivedAt: FieldValue.serverTimestamp(),
        });

        return;
      }

      // Only pending orders may enter normal processing.
      if (
        order.paymentStatus !== "pending" ||
        order.orderStatus !== "pending"
      ) {
        transaction.update(orderRef, {
          paymentReviewRequired: true,
          paymentReviewReason:
            "Successful payment received while the order was not in a payable state.",
          updatedAt: FieldValue.serverTimestamp(),
        });

        transaction.create(eventRef, {
          event: "charge.success",
          reference,
          transactionId: payment.id,
          outcome: "status_conflict",
          receivedAt: FieldValue.serverTimestamp(),
        });

        return;
      }

      transaction.update(orderRef, {
        paymentStatus: "paid",
        orderStatus: "processing",
        paystackTransactionId: payment.id,
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.create(eventRef, {
        event: "charge.success",
        reference,
        transactionId: payment.id,
        outcome: "paid",
        receivedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed:", error);

    // A server error allows Paystack to retry delivery.
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}