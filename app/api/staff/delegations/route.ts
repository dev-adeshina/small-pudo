import { NextResponse } from "next/server";
import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { staffManagementStore } from "@/lib/server/staff-management-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const result = await staffManagementStore.listDelegationOptions(auth.uid);
    if (result.outcome === "delegator_unavailable") {
      return NextResponse.json({ error: "An active staff account is required." }, { status: 403 });
    }
    return NextResponse.json({ success: true, ...result }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Delegation options could not be loaded." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "A valid delegation request is required." }, { status: 400 });
  }

  try {
    const result = await staffManagementStore.delegatePermission({
      actorUid: auth.uid,
      targetUid: typeof body.targetUid === "string" ? body.targetUid : "",
      permissionId: body.permissionId,
      reason: body.reason,
      expiresAt: body.expiresAt,
      allowFurtherDelegation: body.allowFurtherDelegation,
    });
    if (result.outcome === "staff_unavailable") {
      return NextResponse.json({ error: "The target is not an active staff account." }, { status: 404 });
    }
    if (result.outcome === "delegator_unavailable") {
      return NextResponse.json({ error: "Your active staff authority could not be verified." }, { status: 403 });
    }
    return NextResponse.json({ success: true, ...result }, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "The activity could not be delegated.",
    }, { status: 403 });
  }
}
