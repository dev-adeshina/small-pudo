import { NextResponse } from "next/server";

import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { commercialQuotationReadinessStore } from "@/lib/server/commercial-quotation-readiness-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const url = new URL(request.url);
  try {
    const result = await commercialQuotationReadinessStore.listOperationalEvidence(auth.uid, {
      ...(url.searchParams.has("kind") ? { kind: url.searchParams.get("kind") as "service_coverage" | "operating_availability" | "capacity" } : {}),
      ...(url.searchParams.has("serviceCode") ? { serviceCode: url.searchParams.get("serviceCode") as "standard" | "express" | "scheduled" } : {}),
      ...(url.searchParams.has("locationId") ? { locationId: url.searchParams.get("locationId")! } : {}),
    });
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/not authorised/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
    console.error("Operational evidence list failed:", error);
    return NextResponse.json({ error: "Unable to load operational evidence." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "A valid operational evidence request is required." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A valid operational evidence request is required." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  try {
    const result = await commercialQuotationReadinessStore.recordOperationalEvidence({
      actorUid: auth.uid,
      kind: input.kind as "service_coverage" | "operating_availability" | "capacity",
      serviceCode: input.serviceCode as "standard" | "express" | "scheduled",
      source: input.source as string,
      supportingReference: input.supportingReference as string,
      validFrom: typeof input.validFrom === "string" ? new Date(input.validFrom) : new Date(Number.NaN),
      validUntil: typeof input.validUntil === "string" ? new Date(input.validUntil) : new Date(Number.NaN),
      scope: input.scope as Record<string, unknown>,
      details: input.details as Record<string, unknown>,
    });
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/not authorised/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
    if (error instanceof TypeError) return NextResponse.json({ error: message }, { status: 400 });
    console.error("Operational evidence recording failed:", error);
    return NextResponse.json({ error: "Unable to record operational evidence." }, { status: 500 });
  }
}
