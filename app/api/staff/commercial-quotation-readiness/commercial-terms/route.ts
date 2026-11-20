import { NextResponse } from "next/server";

import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { commercialServiceTermsApprovalStore } from "@/lib/server/commercial-service-terms-approval-store";

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
    return NextResponse.json({ error: "DEC-048 commercial terms are required." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  try {
    const result = await commercialServiceTermsApprovalStore.approve({
      actorUid: auth.uid,
      serviceCode: input.serviceCode as "standard" | "express" | "scheduled",
      pricingDefinitionId: input.pricingDefinitionId as string,
      pricingVersionId: input.pricingVersionId as string,
      currency: input.currency as string,
      quoteValidityMinutes: input.quoteValidityMinutes as number,
      handoverWindowMinutes: input.handoverWindowMinutes as number,
      roundingPolicy: input.roundingPolicy as string,
      taxTreatment: input.taxTreatment as string,
      surchargeTreatment: input.surchargeTreatment as string,
      discountTreatment: input.discountTreatment as string,
      feeTreatment: input.feeTreatment as string,
      confirmation: input.confirmation as "DEC-048_TERMS_REVIEWED",
    });
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/not authorised/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
    if (/not found/i.test(message)) return NextResponse.json({ error: message }, { status: 404 });
    if (error instanceof TypeError) return NextResponse.json({ error: message }, { status: 400 });
    console.error("DEC-048 commercial terms approval failed:", error);
    return NextResponse.json({ error: "Unable to record DEC-048 commercial terms approval." }, { status: 409 });
  }
}
