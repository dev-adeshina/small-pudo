import { NextResponse } from "next/server";

import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { commercialQuotationReadinessStore } from "@/lib/server/commercial-quotation-readiness-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "A valid PUDO service capability request is required." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "A valid PUDO service capability request is required." }, { status: 400 });
  const input = body as Record<string, unknown>;
  try {
    const result = await commercialQuotationReadinessStore.recordPudoServiceCapability({
      actorUid: auth.uid,
      locationId: input.locationId as string,
      serviceCode: input.serviceCode as "standard" | "express" | "scheduled",
      supportedActions: input.supportedActions as string[],
      evidenceReferences: input.evidenceReferences as string[],
      validUntil: typeof input.validUntil === "string" ? new Date(input.validUntil) : new Date(Number.NaN),
      reason: input.reason as string,
    });
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/not authorised/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
    if (error instanceof TypeError) return NextResponse.json({ error: message }, { status: 400 });
    console.error("PUDO service capability approval failed:", error);
    return NextResponse.json({ error: "Unable to approve PUDO service capability." }, { status: 409 });
  }
}
