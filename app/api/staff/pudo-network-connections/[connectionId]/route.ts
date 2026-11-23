import { NextResponse } from "next/server";
import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { pudoNetworkConnectionStore } from "@/lib/server/pudo-network-connection-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ connectionId: string }> }) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400 }); }
  try {
    const { connectionId } = await context.params;
    const result = await pudoNetworkConnectionStore.decide(auth.uid, connectionId, body as Parameters<typeof pudoNetworkConnectionStore.decide>[2]);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PUDO network decision failed.";
    const status = error instanceof TypeError ? 400 : /not authorised/i.test(message) ? 403 :
      /not found/i.test(message) ? 404 : /must be|no longer|cannot receive/i.test(message) ? 409 : 500;
    return NextResponse.json({ error: status === 500 ? "PUDO network decision failed." : message }, { status });
  }
}
