import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ bookingId: string }>;
}

interface PaystackInitializeResponse {
  status?: boolean;
  message?: string;
  data?: { authorization_url?: string; reference?: string };
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!secretKey || !appUrl) {
      return NextResponse.json({ error: "Payment service is not configured." }, { status: 500 });
    }

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
    if (customer.email_verified !== true || typeof customer.email !== "string" || !customer.email.trim()) {
      return NextResponse.json({ error: "A verified customer email is required for payment." }, { status: 403 });
    }

    const { bookingId } = await context.params;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(bookingId)) {
      return NextResponse.json({ error: "A valid shipment booking is required." }, { status: 400 });
    }

    const bookingRef = adminDb.collection("shipmentBookings").doc(bookingId);
    const bookingSnapshot = await bookingRef.get();
    if (!bookingSnapshot.exists) return NextResponse.json({ error: "Shipment booking not found." }, { status: 404 });
    const booking = bookingSnapshot.data()!;
    if (booking.bookingPartyUid !== customer.uid) {
      return NextResponse.json({ error: "You are not authorized to pay for this shipment booking." }, { status: 403 });
    }
    if (booking.status !== "confirmed") {
      return NextResponse.json({ error: "Only confirmed shipment bookings can be paid." }, { status: 409 });
    }
    if (booking.paymentStatus === "paid" || booking.paymentReviewRequired === true) {
      return NextResponse.json({ error: "This shipment payment is already complete or requires review." }, { status: 409 });
    }

    if (typeof booking.paymentReference === "string" && booking.paymentReference &&
        typeof booking.paymentAuthorizationUrl === "string" && booking.paymentAuthorizationUrl) {
      return NextResponse.json({
        success: true,
        authorizationUrl: booking.paymentAuthorizationUrl,
        reference: booking.paymentReference,
      });
    }

    const pricing = booking.shipmentSnapshot?.pricing;
    const total = pricing?.total;
    const currency = pricing?.currency;
    if (typeof total !== "number" || !Number.isFinite(total) || total <= 0 ||
        !Number.isSafeInteger(total * 100) || currency !== "NGN") {
      return NextResponse.json({ error: "The accepted quotation does not contain a payable NGN amount." }, { status: 409 });
    }

    const reference = `shp_${bookingId}_${randomBytes(12).toString("hex")}`;
    const baseUrl = appUrl.replace(/\/+$/, "");
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: customer.email,
        amount: String(total * 100),
        currency: "NGN",
        reference,
        callback_url: `${baseUrl}/payment/callback?type=shipment`,
        metadata: {
          paymentType: "shipment_booking",
          bookingId,
          bookingReference: booking.bookingReference ?? bookingId,
        },
      }),
      cache: "no-store",
    });

    const paystackData = await paystackResponse.json().catch(() => null) as PaystackInitializeResponse | null;
    if (!paystackResponse.ok || paystackData?.status !== true ||
        typeof paystackData.data?.authorization_url !== "string" ||
        typeof paystackData.data?.reference !== "string" ||
        paystackData.data.reference !== reference) {
      console.error("Shipment Paystack initialization failed:", paystackData?.message);
      return NextResponse.json({ error: "Unable to initialize shipment payment. Please try again." }, { status: 502 });
    }

    const checkoutUrl = new URL(paystackData.data.authorization_url);
    if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.paystack.com") {
      return NextResponse.json({ error: "Invalid payment checkout URL." }, { status: 502 });
    }

    const saved = await adminDb.runTransaction(async (transaction) => {
      const latestSnapshot = await transaction.get(bookingRef);
      if (!latestSnapshot.exists) return false;
      const latest = latestSnapshot.data()!;
      if (latest.bookingPartyUid !== customer.uid || latest.status !== "confirmed" ||
          latest.paymentStatus === "paid" || latest.paymentReviewRequired === true) return false;
      if (typeof latest.paymentReference === "string" && latest.paymentReference) {
        return latest.paymentReference === reference && latest.paymentAuthorizationUrl === paystackData.data!.authorization_url;
      }
      transaction.update(bookingRef, {
        paymentReference: reference,
        paymentAuthorizationUrl: paystackData.data!.authorization_url,
        paymentProvider: "paystack",
        paymentInitializedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });

    if (!saved) {
      return NextResponse.json({ error: "The shipment booking changed or payment was initialized elsewhere. Refresh its status." }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      reference,
    });
  } catch (error) {
    console.error("Shipment payment initialization failed:", error);
    return NextResponse.json({ error: "Unable to initialize shipment payment." }, { status: 500 });
  }
}
