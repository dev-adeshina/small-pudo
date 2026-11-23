import { NextResponse } from "next/server";
import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { pudoNetworkConnectionStore } from "@/lib/server/pudo-network-connection-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "PUDO network request failed.";
  const status = error instanceof TypeError ? 400 : /not authorised/i.test(message) ? 403 :
    /not found/i.test(message) ? 404 : /already exists|must be|no longer|cannot receive|different PUDO/i.test(message) ? 409 : 500;
  return NextResponse.json({ error: status === 500 ? "PUDO network request failed." : message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const [connections, locations] = await Promise.all([
      pudoNetworkConnectionStore.list(auth.uid),
      pudoNetworkConnectionStore.listEligibleLocations(auth.uid),
    ]);
    return NextResponse.json({ connections, locations }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400 }); }
  try {
    const result = await pudoNetworkConnectionStore.propose(auth.uid, body as Parameters<typeof pudoNetworkConnectionStore.propose>[1]);
    return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
