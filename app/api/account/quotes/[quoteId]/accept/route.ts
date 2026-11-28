import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
// @ts-expect-error -- Shipment domain commands are runtime-neutral ESM.
import { createQuoteCommands } from "@/lib/shipment/quote-commands.mjs";
// @ts-expect-error -- Shipment Firestore runtime selects the environment-specific database.
import { createShipmentFirestoreRuntime } from "@/lib/shipment/firestore-runtime.mjs";

export const runtime = "nodejs";

type Context = { params: Promise<{ quoteId: string }> };

export async function POST(request: Request, context: Context) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token, checkRevoked) => adminAuth.verifyIdToken(token, checkRevoked),
  );
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "A valid quote acceptance is required." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "A valid quote acceptance is required." }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some(key => !["shipmentId", "revisionId"].includes(key)) ||
      typeof input.shipmentId !== "string" || !/^[A-Za-z0-9_-]{1,160}$/.test(input.shipmentId) ||
      typeof input.revisionId !== "string" || !/^[A-Za-z0-9_-]{1,160}$/.test(input.revisionId)) {
    return NextResponse.json({ error: "Shipment and exact current quote revision references are required." }, { status: 400 });
  }

  try {
    const { quoteId } = await context.params;
    if (!/^[A-Za-z0-9_-]{1,160}$/.test(quoteId)) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    const runtime = createShipmentFirestoreRuntime();
    const shipment = await runtime.db.collection("verilyftShipmentData").doc("v1").collection("shipments").doc(input.shipmentId).get();
    if (!shipment.exists || shipment.data()?.customerId !== customer.uid || shipment.data()?.quoteId !== quoteId) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }
    const commands = createQuoteCommands({
      ports: runtime.ports,
      idFactory: (prefix: string) => `${prefix}_${randomUUID()}`,
    });
    const result = await commands.acceptQuote({
      actor: { type: "customer", id: customer.uid },
      idempotencyKey: request.headers.get("idempotency-key")?.trim() || randomUUID(),
      shipmentId: input.shipmentId,
      quoteRevisionId: input.revisionId,
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to accept this quotation.";
    const code = (error as { code?: string })?.code;
    const status = code === "FORBIDDEN_OWNER" ? 404 : code === "QUOTE_EXPIRED" ? 410 :
      code === "QUOTE_REVISION_STALE" || code === "QUOTE_NOT_ACCEPTABLE" ? 409 : error instanceof TypeError ? 400 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
