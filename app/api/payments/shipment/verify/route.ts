import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ success: false, error: "Payment verification is unavailable." }, { status: 500 });
    }

    const body = await request.json().catch(() => null);
    const reference = typeof body?.reference === "string" ? body.reference.trim() : "";
    if (!reference || reference.length > 200) {
      return NextResponse.json({ success: false, error: "A valid payment reference is required." }, { status: 400 });
    }

    const bookings = await adminDb.collection("shipmentBookings")
      .where("paymentReference", "==", reference).limit(1).get();
    if (bookings.empty) {
      return NextResponse.json({ success: false, error: "No shipment booking was found for this payment reference." }, { status: 404 });
    }

    const bookingRef = bookings.docs[0].ref;
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}`, Accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.status !== true || !result?.data) {
      return NextResponse.json({ success: false, error: "Paystack could not verify this transaction. Please try again later." }, { status: 502 });
    }

    const payment = result.data;
    if (payment.reference !== reference) {
      return NextResponse.json({ success: false, error: "The payment reference could not be verified." }, { status: 400 });
    }
    if (payment.status !== "success") {
      return NextResponse.json({ success: false, error: "Payment has not been confirmed as successful. Please check again later." }, { status: 400 });
    }

    const validTransactionId = typeof payment.id === "number" && Number.isSafeInteger(payment.id) && payment.id > 0;
    const outcome = await adminDb.runTransaction(async (transaction) => {
      const freshSnapshot = await transaction.get(bookingRef);
      if (!freshSnapshot.exists) throw new Error("BOOKING_NOT_FOUND");
      const booking = freshSnapshot.data()!;
      if (booking.paymentReference !== reference) throw new Error("REFERENCE_MISMATCH");

      const total = booking.shipmentSnapshot?.pricing?.total;
      const expectedAmount = typeof total === "number" && Number.isFinite(total) ? total * 100 : NaN;
      const amountMatches = Number.isSafeInteger(expectedAmount) && expectedAmount > 0 &&
        typeof payment.amount === "number" && Number.isSafeInteger(payment.amount) && payment.amount === expectedAmount;
      const currencyMatches = booking.shipmentSnapshot?.pricing?.currency === "NGN" && payment.currency === "NGN";

      if (!amountMatches || !currencyMatches || !validTransactionId) {
        const reason = !amountMatches
          ? "Verified shipment payment amount does not match the accepted quotation."
          : !currencyMatches
            ? "Verified shipment payment currency does not match the accepted quotation."
            : "Verified shipment payment has an invalid transaction ID.";
        transaction.update(bookingRef, {
          paymentReviewRequired: true,
          paymentReviewReason: reason,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return {
          success: false,
          reviewRequired: true,
          bookingId: bookingRef.id,
          bookingReference: booking.bookingReference ?? bookingRef.id,
          message: "Payment was reported as successful, but its details require manual review.",
        };
      }

      if (booking.paymentReviewRequired === true) {
        return {
          success: false,
          reviewRequired: true,
          bookingId: bookingRef.id,
          bookingReference: booking.bookingReference ?? bookingRef.id,
          message: "Your shipment payment requires manual review.",
        };
      }
      if (booking.paymentStatus === "paid") {
        return {
          success: true,
          bookingId: bookingRef.id,
          bookingReference: booking.bookingReference ?? bookingRef.id,
          message: "Your shipment payment has already been confirmed.",
        };
      }
      if (booking.status !== "confirmed" || booking.paymentStatus !== "pending") {
        transaction.update(bookingRef, {
          paymentReviewRequired: true,
          paymentReviewReason: "Successful payment received while the shipment booking was not in a payable state.",
          paystackTransactionId: payment.id,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return {
          success: false,
          reviewRequired: true,
          bookingId: bookingRef.id,
          bookingReference: booking.bookingReference ?? bookingRef.id,
          message: "Payment was received, but the booking state requires manual review.",
        };
      }

      transaction.update(bookingRef, {
        paymentStatus: "paid",
        paystackTransactionId: payment.id,
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return {
        success: true,
        bookingId: bookingRef.id,
        bookingReference: booking.bookingReference ?? bookingRef.id,
        message: "Your shipment payment has been confirmed. Physical parcel intake remains a separate step.",
      };
    });

    return NextResponse.json(outcome, { status: outcome.success ? 200 : 409 });
  } catch (error) {
    if (error instanceof Error && error.message === "BOOKING_NOT_FOUND") {
      return NextResponse.json({ success: false, error: "The shipment booking no longer exists." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "REFERENCE_MISMATCH") {
      return NextResponse.json({ success: false, error: "The payment reference does not match this shipment booking." }, { status: 409 });
    }
    console.error("Shipment payment verification failed:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred during shipment payment verification." }, { status: 500 });
  }
}
