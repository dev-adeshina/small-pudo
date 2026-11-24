import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ bookingId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  let customer;
  try {
    customer = await adminAuth.verifyIdToken(authorization.slice(7).trim());
  } catch {
    return NextResponse.json({ error: "Your session is invalid or expired." }, { status: 401 });
  }
  if (customer.email_verified !== true) {
    return NextResponse.json({ error: "Please verify your email address first." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!reason || reason.length > 1000 || Object.keys(body ?? {}).some((key) => key !== "reason")) {
    return NextResponse.json({ error: "A cancellation reason of at most 1,000 characters is required." }, { status: 400 });
  }

  try {
    const { bookingId } = await context.params;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(bookingId)) {
      return NextResponse.json({ error: "Shipment booking not found." }, { status: 404 });
    }
    const bookingRef = adminDb.collection("shipmentBookings").doc(bookingId);
    const eventRef = bookingRef.collection("events").doc();

    const outcome = await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(bookingRef);
      if (!snapshot.exists) return { outcome: "not_found" as const };
      const booking = snapshot.data()!;
      if (booking.bookingPartyUid !== customer.uid) return { outcome: "not_authorized" as const };
      if (booking.status === "cancelled") return { outcome: "already_cancelled" as const };
      if (booking.status !== "confirmed" || booking.intakeStatus !== "awaiting_physical_intake") {
        return { outcome: "not_cancellable" as const };
      }
      if (booking.paymentStatus === "paid" || booking.paymentReviewRequired === true) {
        return { outcome: "payment_review_required" as const };
      }

      const timestamp = FieldValue.serverTimestamp();
      transaction.update(bookingRef, {
        status: "cancelled",
        intakeStatus: "cancelled",
        cancellationReason: reason,
        cancelledAt: timestamp,
        cancelledBy: customer.uid,
        updatedAt: timestamp,
      });
      transaction.create(eventRef, {
        action: "customer_cancelled",
        actorUid: customer.uid,
        reason,
        timestamp,
      });
      return { outcome: "cancelled" as const };
    });

    if (outcome.outcome === "not_found") return NextResponse.json({ error: "Shipment booking not found." }, { status: 404 });
    if (outcome.outcome === "not_authorized") return NextResponse.json({ error: "You are not authorized to cancel this shipment booking." }, { status: 403 });
    if (outcome.outcome === "already_cancelled") return NextResponse.json({ success: true, outcome: outcome.outcome });
    if (outcome.outcome === "payment_review_required") return NextResponse.json({ error: "This booking has a completed or review-required payment. Contact support for a payment resolution; cancellation and refunds are not automatic." }, { status: 409 });
    if (outcome.outcome === "not_cancellable") return NextResponse.json({ error: "This booking can no longer be cancelled through the customer portal." }, { status: 409 });
    return NextResponse.json({ success: true, outcome: outcome.outcome });
  } catch (error) {
    console.error("Customer shipment booking cancellation failed:", error);
    return NextResponse.json({ error: "Unable to cancel this shipment booking." }, { status: 500 });
  }
}
