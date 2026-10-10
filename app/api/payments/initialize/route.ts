import { NextResponse } from "next/server";
import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

interface InitializePaymentBody {
  orderId?: unknown;
  orderAccessToken?: unknown;
}

interface PaystackInitializeResponse {
  status?: boolean;
  message?: string;
  data?: {
    authorization_url?: string;
    reference?: string;
  };
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function tokenMatches(
  token: string,
  storedHash: unknown
): boolean {
  if (
    typeof storedHash !== "string" ||
    !/^[a-f0-9]{64}$/i.test(storedHash)
  ) {
    return false;
  }

  const suppliedHash = createHash("sha256")
    .update(token)
    .digest();

  const expectedHash = Buffer.from(storedHash, "hex");

  return timingSafeEqual(suppliedHash, expectedHash);
}

export async function POST(request: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!secretKey || !appUrl) {
      console.error(
        "Paystack configuration is missing."
      );

      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 500 }
      );
    }

    let body: InitializePaymentBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    if (
      typeof body.orderId !== "string" ||
      !body.orderId.trim() ||
      typeof body.orderAccessToken !== "string" ||
      !body.orderAccessToken.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Order ID and order access token are required.",
        },
        { status: 400 }
      );
    }

    const orderId = body.orderId.trim();
    const orderAccessToken = body.orderAccessToken.trim();

    const orderRef = adminDb
      .collection("orders")
      .doc(orderId);

    const orderSnapshot = await orderRef.get();

    if (!orderSnapshot.exists) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const order = orderSnapshot.data();

    if (!order) {
      return NextResponse.json(
        { error: "Unable to read order." },
        { status: 500 }
      );
    }

    // Only the customer holding the original order token
    // can initialize payment for this order.
    if (
      !tokenMatches(
        orderAccessToken,
        order.orderAccessTokenHash
      )
    ) {
      return NextResponse.json(
        { error: "Invalid order access token." },
        { status: 403 }
      );
    }

    if (
      order.orderStatus !== "pending" ||
      order.paymentStatus !== "pending"
    ) {
      return NextResponse.json(
        {
          error:
            "This order is no longer available for payment.",
        },
        { status: 409 }
      );
    }

    // Reuse the existing checkout URL if this order has
    // already been initialized successfully.
    if (
      typeof order.paymentReference === "string" &&
      order.paymentReference &&
      typeof order.paymentAuthorizationUrl === "string" &&
      order.paymentAuthorizationUrl
    ) {
      return NextResponse.json({
        success: true,
        authorizationUrl: order.paymentAuthorizationUrl,
        reference: order.paymentReference,
      });
    }

    if (
      typeof order.customer?.email !== "string" ||
      !order.customer.email.trim()
    ) {
      return NextResponse.json(
        { error: "Order customer email is missing." },
        { status: 400 }
      );
    }

    if (
      typeof order.total !== "number" ||
      !Number.isSafeInteger(order.total) ||
      order.total <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid order total." },
        { status: 400 }
      );
    }

    if (order.currency !== "NGN") {
      return NextResponse.json(
        { error: "Only NGN payments are currently supported." },
        { status: 400 }
      );
    }

    // Firestore stores the order total in naira.
    // Paystack expects the amount in kobo.
    const amountInKobo = order.total * 100;

    if (!Number.isSafeInteger(amountInKobo)) {
      return NextResponse.json(
        { error: "Payment amount is invalid." },
        { status: 400 }
      );
    }

    const reference =
      `ord_${orderId}_${randomBytes(12).toString("hex")}`;

    const baseUrl = appUrl.replace(/\/+$/, "");

    // Initialize the transaction using the secret key
    // exclusively on the server.
    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: order.customer.email,
          amount: String(amountInKobo),
          currency: "NGN",
          reference,
          callback_url: `${baseUrl}/payment/callback`,
          metadata: {
            orderId,
          },
        }),
        cache: "no-store",
      }
    );

    let paystackData: PaystackInitializeResponse;

    try {
      paystackData = await paystackResponse.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid response from payment provider." },
        { status: 502 }
      );
    }

    if (
      !paystackResponse.ok ||
      paystackData.status !== true ||
      typeof paystackData.data?.authorization_url !==
        "string" ||
      typeof paystackData.data?.reference !== "string"
    ) {
      console.error(
        "Paystack initialization failed:",
        paystackData.message
      );

      return NextResponse.json(
        {
          error:
            "Unable to initialize payment. Please try again.",
        },
        { status: 502 }
      );
    }

    const authorizationUrl =
      paystackData.data.authorization_url;

    const returnedReference =
      paystackData.data.reference;

    // Do not accept an unexpected checkout URL.
    const checkoutUrl = new URL(authorizationUrl);

    if (
      checkoutUrl.protocol !== "https:" ||
      checkoutUrl.hostname !== "checkout.paystack.com"
    ) {
      console.error(
        "Paystack returned an unexpected checkout URL."
      );

      return NextResponse.json(
        { error: "Invalid payment checkout URL." },
        { status: 502 }
      );
    }

    // Recheck the order transactionally. Cancellation
    // might have occurred while Paystack was responding.
    const saved = await adminDb.runTransaction(
      async (transaction) => {
        const latestSnapshot =
          await transaction.get(orderRef);

        if (!latestSnapshot.exists) {
          return false;
        }

        const latestOrder = latestSnapshot.data();

        if (
          !latestOrder ||
          latestOrder.orderStatus !== "pending" ||
          latestOrder.paymentStatus !== "pending"
        ) {
          return false;
        }

        // Another request may have initialized payment.
        if (
          typeof latestOrder.paymentReference ===
            "string" &&
          latestOrder.paymentReference
        ) {
          return (
            latestOrder.paymentReference ===
              returnedReference &&
            latestOrder.paymentAuthorizationUrl ===
              authorizationUrl
          );
        }

        transaction.update(orderRef, {
          paymentReference: returnedReference,
          paymentAuthorizationUrl: authorizationUrl,
          paymentProvider: "paystack",
          updatedAt: FieldValue.serverTimestamp(),
        });

        return true;
      }
    );

    if (!saved) {
      return NextResponse.json(
        {
          error:
            "The order has changed or payment was already initialized. Please check your order status.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      authorizationUrl,
      reference: returnedReference,
    });
  } catch (error) {
    console.error(
      "Failed to initialize Paystack payment:",
      error
    );

    return NextResponse.json(
      { error: "Unable to initialize payment." },
      { status: 500 }
    );
  }
}