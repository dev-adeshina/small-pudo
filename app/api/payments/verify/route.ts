// import { NextResponse } from "next/server";
// import { FieldValue } from "firebase-admin/firestore";
// import { adminDb } from "@/lib/firebase-admin";

// export const runtime = "nodejs";

// export async function POST(request: Request) {
//   try {
//     const secretKey = process.env.PAYSTACK_SECRET_KEY;

//     if (!secretKey) {
//       console.error("PAYSTACK_SECRET_KEY is not configured.");

//       return NextResponse.json(
//         { success: false, error: "Payment verification is unavailable." },
//         { status: 500 }
//       );
//     }

//     const body = await request.json().catch(() => null);
//     const reference =
//       typeof body?.reference === "string" ? body.reference.trim() : "";

//     if (!reference) {
//       return NextResponse.json(
//         { success: false, error: "Payment reference is required." },
//         { status: 400 }
//       );
//     }

//     // Find the order using the reference saved during initialization.
//     const ordersSnapshot = await adminDb
//       .collection("orders")
//       .where("paymentReference", "==", reference)
//       .limit(1)
//       .get();

//     if (ordersSnapshot.empty) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "No order was found for this payment reference. Check that payment initialization saved the reference.",
//         },
//         { status: 404 }
//       );
//     }

//     const orderDocument = ordersSnapshot.docs[0];
//     const orderRef = orderDocument.ref;
//     const order = orderDocument.data();

//     // Ask Paystack directly; never trust the browser redirect alone.
//     const paystackResponse = await fetch(
//       `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${secretKey}`,
//           Accept: "application/json",
//         },
//         cache: "no-store",
//       }
//     );

//     const paystackResult = await paystackResponse.json().catch(() => null);

//     if (
//       !paystackResponse.ok ||
//       paystackResult?.status !== true ||
//       !paystackResult?.data
//     ) {
//       console.error("Paystack verification request failed:", {
//         httpStatus: paystackResponse.status,
//         message: paystackResult?.message,
//       });

//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "Paystack could not verify this transaction. Please try again later.",
//         },
//         { status: 502 }
//       );
//     }

//     const payment = paystackResult.data;
//     const expectedAmount = Math.round(Number(order.total) * 100);

//     if (
//       payment.reference !== reference ||
//       payment.status !== "success" ||
//       payment.currency !== "NGN" ||
//       !Number.isSafeInteger(expectedAmount) ||
//       expectedAmount <= 0 ||
//       payment.amount !== expectedAmount
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "The payment could not be confirmed against the order amount and currency.",
//         },
//         { status: 400 }
//       );
//     }

//     const result = await adminDb.runTransaction(async (transaction) => {
//       // Re-read the order to avoid relying on stale order status.
//       const freshSnapshot = await transaction.get(orderRef);

//       if (!freshSnapshot.exists) {
//         throw new Error("ORDER_NOT_FOUND");
//       }

//       const freshOrder = freshSnapshot.data()!;

//       if (freshOrder.paymentReference !== reference) {
//         throw new Error("REFERENCE_MISMATCH");
//       }

//       // Make repeated callback requests safe.
//       if (freshOrder.paymentStatus === "paid") {
//         return {
//           success: true,
//           message: "Your payment has already been confirmed.",
//           orderId: orderRef.id,
//         };
//       }

//       // Payment can occasionally succeed after cancellation.
//       // Record the payment for reconciliation without restoring
//       // the order to the normal fulfilment flow.
//       if (freshOrder.orderStatus === "cancelled") {
//         transaction.update(orderRef, {
//           paymentStatus: "paid",
//           paymentReviewRequired: true,
//           paymentReviewReason:
//             "Payment succeeded after the order was cancelled. Review for refund or other resolution.",
//           paystackTransactionId: payment.id ?? null,
//           paidAt: FieldValue.serverTimestamp(),
//           updatedAt: FieldValue.serverTimestamp(),
//         });

//         return {
//           success: false,
//           message:
//             "Payment was received, but this order was already cancelled. Please contact support to resolve it.",
//           orderId: orderRef.id,
//           reviewRequired: true,
//         };
//       }

//       if (
//         freshOrder.paymentStatus !== "pending" ||
//         freshOrder.orderStatus !== "pending"
//       ) {
//         throw new Error("ORDER_STATUS_CONFLICT");
//       }

//       transaction.update(orderRef, {
//         paymentStatus: "paid",
//         orderStatus: "processing",
//         paystackTransactionId: payment.id ?? null,
//         paidAt: FieldValue.serverTimestamp(),
//         updatedAt: FieldValue.serverTimestamp(),
//       });

//       return {
//         success: true,
//         message: "Your payment has been confirmed.",
//         orderId: orderRef.id,
//       };
//     });

//     return NextResponse.json(result, {
//       status: result.success ? 200 : 409,
//     });
//   } catch (error) {
//     if (error instanceof Error) {
//       if (error.message === "ORDER_NOT_FOUND") {
//         return NextResponse.json(
//           { success: false, error: "The order no longer exists." },
//           { status: 404 }
//         );
//       }

//       if (error.message === "REFERENCE_MISMATCH") {
//         return NextResponse.json(
//           {
//             success: false,
//             error: "The payment reference does not match this order.",
//           },
//           { status: 409 }
//         );
//       }

//       if (error.message === "ORDER_STATUS_CONFLICT") {
//         return NextResponse.json(
//           {
//             success: false,
//             error:
//               "The order status has changed. Please contact support to confirm the payment.",
//           },
//           { status: 409 }
//         );
//       }
//     }

//     console.error("Payment verification error:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: "An unexpected error occurred during payment verification.",
//       },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY is not configured.");

      return NextResponse.json(
        {
          success: false,
          error: "Payment verification is unavailable.",
        },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);

    const reference =
      typeof body?.reference === "string"
        ? body.reference.trim()
        : "";

    if (!reference || reference.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid payment reference is required.",
        },
        { status: 400 }
      );
    }

    // Find the order using its saved Paystack reference.
    const ordersSnapshot = await adminDb
      .collection("orders")
      .where("paymentReference", "==", reference)
      .limit(1)
      .get();

    if (ordersSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          error: "No order was found for this payment reference.",
        },
        { status: 404 }
      );
    }

    const orderRef = ordersSnapshot.docs[0].ref;
    const order = ordersSnapshot.docs[0].data();

    // Verify the transaction directly with Paystack.
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        reference
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const paystackResult = await paystackResponse
      .json()
      .catch(() => null);

    if (
      !paystackResponse.ok ||
      paystackResult?.status !== true ||
      !paystackResult?.data
    ) {
      console.error("Paystack verification request failed:", {
        httpStatus: paystackResponse.status,
        message: paystackResult?.message,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "Paystack could not verify this transaction. Please try again later.",
        },
        { status: 502 }
      );
    }

    const payment = paystackResult.data;

    // Never accept a transaction for a different reference.
    if (payment.reference !== reference) {
      return NextResponse.json(
        {
          success: false,
          error: "The payment reference could not be verified.",
        },
        { status: 400 }
      );
    }

    // A transaction that has not succeeded must not mark an order paid.
    if (payment.status !== "success") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment has not been confirmed as successful. Please check again later.",
        },
        { status: 400 }
      );
    }

    // Validate the expected order amount without rounding invalid values.
    const orderTotal = order.total;

    const expectedAmount =
      typeof orderTotal === "number" &&
        Number.isSafeInteger(orderTotal) &&
        orderTotal > 0
        ? orderTotal * 100
        : NaN;

    const validExpectedAmount =
      Number.isSafeInteger(expectedAmount) &&
      expectedAmount > 0;

    const validTransactionId =
      typeof payment.id === "number" &&
      Number.isSafeInteger(payment.id) &&
      payment.id > 0;

    const amountMatches =
      validExpectedAmount &&
      typeof payment.amount === "number" &&
      Number.isSafeInteger(payment.amount) &&
      payment.amount === expectedAmount;

    const currencyMatches = payment.currency === "NGN";

    /*
     * Paystack confirmed a successful transaction, but one or more
     * critical payment details do not match the order.
     *
     * Flag the order for review without approving it for fulfilment.
     */
    if (
      !amountMatches ||
      !currencyMatches ||
      !validTransactionId
    ) {
      const reason = !amountMatches
        ? "Verified payment amount does not match the order total."
        : !currencyMatches
          ? "Verified payment currency does not match the order currency."
          : "Verified payment has an invalid transaction ID.";

      await adminDb.runTransaction(async (transaction) => {
        const freshSnapshot = await transaction.get(orderRef);

        if (!freshSnapshot.exists) {
          throw new Error("ORDER_NOT_FOUND");
        }

        const freshOrder = freshSnapshot.data()!;

        if (freshOrder.paymentReference !== reference) {
          throw new Error("REFERENCE_MISMATCH");
        }

        transaction.update(orderRef, {
          paymentReviewRequired: true,
          paymentReviewReason: reason,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      console.error("Payment flagged for manual review:", {
        orderId: orderRef.id,
        reference,
        reason,
      });

      return NextResponse.json(
        {
          success: false,
          reviewRequired: true,
          orderId: orderRef.id,
          message:
            "Payment was reported as successful, but its details require manual review. Please contact support.",
        },
        { status: 409 }
      );
    }

    const result = await adminDb.runTransaction(
      async (transaction) => {
        // Always use the latest order state.
        const freshSnapshot = await transaction.get(orderRef);

        if (!freshSnapshot.exists) {
          throw new Error("ORDER_NOT_FOUND");
        }

        const freshOrder = freshSnapshot.data()!;

        if (freshOrder.paymentReference !== reference) {
          throw new Error("REFERENCE_MISMATCH");
        }

        /*
         * A cancelled order must never return to normal fulfilment
         * just because Paystack subsequently confirms payment.
         */
        if (freshOrder.orderStatus === "cancelled") {
          if (freshOrder.paymentStatus !== "paid") {
            transaction.update(orderRef, {
              paymentStatus: "paid",
              paymentReviewRequired: true,
              paymentReviewReason:
                "Payment succeeded after the order was cancelled. Review for refund or other resolution.",
              paystackTransactionId: payment.id,
              paidAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          } else {
            transaction.update(orderRef, {
              paymentReviewRequired: true,
              paymentReviewReason:
                freshOrder.paymentReviewReason ||
                "Payment is associated with a cancelled order. Review for refund or other resolution.",
              updatedAt: FieldValue.serverTimestamp(),
            });
          }

          return {
            success: false,
            reviewRequired: true,
            orderId: orderRef.id,
            message:
              "Payment was received, but this order was cancelled. Please contact support to resolve it.",
          };
        }

        /*
         * A payment already marked for review must not be presented
         * as an ordinary successful order confirmation.
         */
        if (freshOrder.paymentReviewRequired === true) {
          return {
            success: false,
            reviewRequired: true,
            orderId: orderRef.id,
            message:
              "Your payment requires manual review. Please contact support before assuming your order is confirmed.",
          };
        }

        // Repeated verification must not process the order twice.
        if (freshOrder.paymentStatus === "paid") {
          return {
            success: true,
            message: "Your payment has already been confirmed.",
            orderId: orderRef.id,
          };
        }

        // Only pending orders may transition to processing.
        if (
          freshOrder.paymentStatus !== "pending" ||
          freshOrder.orderStatus !== "pending"
        ) {
          throw new Error("ORDER_STATUS_CONFLICT");
        }

        transaction.update(orderRef, {
          paymentStatus: "paid",
          orderStatus: "processing",
          paystackTransactionId: payment.id,
          paidAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          message: "Your payment has been confirmed.",
          orderId: orderRef.id,
        };
      }
    );

    return NextResponse.json(result, {
      status: result.success ? 200 : 409,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ORDER_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            error: "The order no longer exists.",
          },
          { status: 404 }
        );
      }

      if (error.message === "REFERENCE_MISMATCH") {
        return NextResponse.json(
          {
            success: false,
            error: "The payment reference does not match this order.",
          },
          { status: 409 }
        );
      }

      if (error.message === "ORDER_STATUS_CONFLICT") {
        return NextResponse.json(
          {
            success: false,
            error:
              "The order status has changed. Please contact support to confirm the payment.",
          },
          { status: 409 }
        );
      }
    }

    console.error("Payment verification error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "An unexpected error occurred during payment verification.",
      },
      { status: 500 }
    );
  }
}