import { NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
import { shipmentQuoteStore } from "@/lib/server/shipment-quote-store";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ quoteId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token, checkRevoked) => adminAuth.verifyIdToken(token, checkRevoked),
  );
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });

  try {
    const { quoteId } = await context.params;
    const quote = await shipmentQuoteStore.getCustomerQuote(customer.uid, quoteId);
    if (!quote) return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    return NextResponse.json({ success: true, quote });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof TypeError ? error.message : "Unable to retrieve this quotation." },
      { status: error instanceof TypeError ? 400 : 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token, checkRevoked) => adminAuth.verifyIdToken(token, checkRevoked),
  );
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400 }); }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "The decision request must be an object." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  if (
    typeof input.expectedCurrentVersionId !== "string" ||
    (input.decision !== "accept" && input.decision !== "reject") ||
    (input.reason !== undefined && typeof input.reason !== "string")
  ) {
    return NextResponse.json({ error: "A current quote version and accept/reject decision are required." }, { status: 400 });
  }

  try {
    const { quoteId } = await context.params;
    const result = await shipmentQuoteStore.respondToQuote({
      quoteId,
      expectedCurrentVersionId: input.expectedCurrentVersionId,
      bookingPartyUid: customer.uid,
      decision: input.decision,
      ...(typeof input.reason === "string" ? { reason: input.reason } : {}),
    });

    if (result.outcome === "not_found") return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    if (result.outcome === "not_authorized") return NextResponse.json({ error: "You are not the booking party for this quotation." }, { status: 403 });
    if (result.outcome === "stale_version") return NextResponse.json({ error: "This quotation has a newer version. Refresh before deciding.", currentVersionId: result.currentVersionId }, { status: 409 });
    if (result.outcome === "expired") return NextResponse.json({ error: "This quotation has expired. A new quotation is required." }, { status: 410 });
    if (result.outcome === "already_decided") return NextResponse.json({ error: "This quotation is no longer awaiting a customer decision." }, { status: 409 });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record your quotation decision.";
    return NextResponse.json({ error: error instanceof TypeError ? message : "Unable to record your quotation decision." }, { status: error instanceof TypeError ? 400 : 409 });
  }
}
