import { NextResponse } from "next/server";

import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { commercialQuotationReadinessStore } from "@/lib/server/commercial-quotation-readiness-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ evidenceId: string }> }) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "A valid evidence revocation is required." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A valid evidence revocation is required." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  try {
    const { evidenceId } = await context.params;
    const result = await commercialQuotationReadinessStore.revokeOperationalEvidence(
      auth.uid, evidenceId, input.reason as string,
    );
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/not authorised/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
    if (error instanceof TypeError) return NextResponse.json({ error: message }, { status: 400 });
    console.error("Operational evidence revocation failed:", error);
    return NextResponse.json({ error: "Unable to revoke operational evidence." }, { status: 409 });
  }
}
