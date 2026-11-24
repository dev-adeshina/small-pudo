import { NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
import { shipmentQuoteStore } from "@/lib/server/shipment-quote-store";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ quoteId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token) => adminAuth.verifyIdToken(token),
  );
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "A valid booking handoff request is required." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A valid booking handoff request is required." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some((key) => key !== "acceptedVersionId") ||
      typeof input.acceptedVersionId !== "string" ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(input.acceptedVersionId)) {
    return NextResponse.json({ error: "The exact accepted quotation version is required." }, { status: 400 });
  }

  try {
    const { quoteId } = await context.params;
    const result = await shipmentQuoteStore.createBookingFromAcceptedQuote({
      quoteId,
      acceptedVersionId: input.acceptedVersionId,
      bookingPartyUid: customer.uid,
    });
    if (result.outcome === "not_found") return NextResponse.json({ error: "Quotation or accepted version not found." }, { status: 404 });
    if (result.outcome === "not_authorized") return NextResponse.json({ error: "You are not the booking party for this quotation." }, { status: 403 });
    if (result.outcome === "not_accepted") return NextResponse.json({ error: "Only an accepted quotation can be converted into a booking." }, { status: 409 });
    if (result.outcome === "stale_version") return NextResponse.json({ error: "The accepted quotation version is no longer current. Refresh your quotation." }, { status: 409 });
    if (result.outcome === "draft_unavailable") return NextResponse.json({ error: "The original shipment draft has changed or is missing required sender, recipient or intake details." }, { status: 409 });
    return NextResponse.json({ success: true, result }, { status: result.outcome === "created" ? 201 : 200 });
  } catch (error) {
    console.error("Accepted quotation booking handoff failed:", error);
    return NextResponse.json({ error: "The booking could not be confirmed from this quotation." }, { status: 409 });
  }
}
