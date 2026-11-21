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
    return NextResponse.json({ error: "A valid DEC-048 revocation request is required." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "A valid DEC-048 revocation request is required." }, { status: 400 });
  const input = body as Record<string, unknown>;
  try {
    const result = await commercialServiceTermsApprovalStore.revoke({
      actorUid: auth.uid,
      serviceCode: input.serviceCode as "standard" | "express" | "scheduled",
      reason: input.reason as string,
    });
    if (result.outcome === "not_active") return NextResponse.json({ error: "No active DEC-048 commercial terms approval exists for this service." }, { status: 409 });
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/not authorised/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
    if (error instanceof TypeError) return NextResponse.json({ error: message }, { status: 400 });
    console.error("DEC-048 commercial terms revocation failed:", error);
    return NextResponse.json({ error: "Unable to revoke DEC-048 commercial terms." }, { status: 500 });
  }
}
