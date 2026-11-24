import { NextResponse } from "next/server";

import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { commercialQuotationReadinessStore } from "@/lib/server/commercial-quotation-readiness-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const result = await commercialQuotationReadinessStore.listRouteEvidenceForReview(auth.uid);
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/not authorised/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
    console.error("Route evidence review queue lookup failed:", error);
    return NextResponse.json({ error: "Unable to load the route evidence review queue." }, { status: 500 });
  }
}
