import { NextResponse } from "next/server";

import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { commercialQuotationReadinessStore } from "@/lib/server/commercial-quotation-readiness-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ evidenceId: string }> };

export async function GET(request: Request, context: Context) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { evidenceId } = await context.params;
    const evidence = await commercialQuotationReadinessStore.getRouteEvidenceForReview(auth.uid, evidenceId);
    return NextResponse.json({ evidence });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/not authorised/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
    if (/not found/i.test(message)) return NextResponse.json({ error: message }, { status: 404 });
    if (error instanceof TypeError) return NextResponse.json({ error: message }, { status: 400 });
    console.error("Route evidence review lookup failed:", error);
    return NextResponse.json({ error: "Unable to load route evidence for review." }, { status: 500 });
  }
}

export async function POST(request: Request, context: Context) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "A valid JSON body is required." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A review decision is required." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  try {
    const { evidenceId } = await context.params;
    const result = await commercialQuotationReadinessStore.reviewRouteEvidence(
      auth.uid,
      evidenceId,
      input.decision as "approve" | "revoke",
      input.reason as string,
      typeof input.validUntil === "string" ? new Date(input.validUntil) : undefined,
    );
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/not authorised/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
    if (/must be performed by someone other than the evidence recorder|cannot be approved as operational road-route evidence/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (/not found/i.test(message)) return NextResponse.json({ error: message }, { status: 404 });
    if (error instanceof TypeError) return NextResponse.json({ error: message }, { status: 400 });
    console.error("Route evidence review failed:", error);
    return NextResponse.json({ error: "Unable to record the route evidence review." }, { status: 500 });
  }
}
