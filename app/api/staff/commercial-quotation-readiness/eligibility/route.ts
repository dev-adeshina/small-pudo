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
    return NextResponse.json({ error: "A valid JSON body is required." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "An eligibility decision is required." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  try {
    const result = await commercialQuotationReadinessStore.recordEligibilityDecision({
      actorUid: auth.uid,
      serviceCode: input.serviceCode as "standard" | "express" | "scheduled",
      originType: input.originType as "address" | "pudo",
      destinationType: input.destinationType as "address" | "pudo",
      originPudoLocationId: input.originPudoLocationId as string | undefined,
      destinationPudoLocationId: input.destinationPudoLocationId as string | undefined,
      outcome: input.outcome as "pending_verification" | "eligible" | "conditionally_eligible" | "not_eligible" | "revoked",
      evidenceReferences: input.evidenceReferences as string[],
      serviceCoverageEvidenceReferences: input.serviceCoverageEvidenceReferences as string[],
      operatingAvailabilityEvidenceReferences: input.operatingAvailabilityEvidenceReferences as string[],
      capacityEvidenceReferences: input.capacityEvidenceReferences as string[],
      originRequiredActions: input.originRequiredActions as string[],
      destinationRequiredActions: input.destinationRequiredActions as string[],
      conditions: input.conditions as string[] | undefined,
      reason: input.reason as string,
      validUntil: typeof input.validUntil === "string" ? new Date(input.validUntil) : undefined,
    });
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/not authorised/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
    if (error instanceof TypeError) return NextResponse.json({ error: message }, { status: 400 });
    console.error("Service eligibility decision failed:", error);
    return NextResponse.json({ error: "Unable to record the eligibility decision." }, { status: 500 });
  }
}
