import { NextResponse } from "next/server";
import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { pudoLocationOperationsStore } from "@/lib/server/pudo-location-operations-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const locations = await pudoLocationOperationsStore.listActiveLocations(auth.uid);
    return NextResponse.json({ locations }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message.includes("not authorised") ? 403 : 500;
    if (status === 500) console.error("PUDO operations listing failed:", error);
    return NextResponse.json({ error: status === 403 ? message : "Unable to retrieve active PUDO locations." }, { status });
  }
}
