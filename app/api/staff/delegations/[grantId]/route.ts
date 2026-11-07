import { NextResponse } from "next/server";
import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { staffManagementStore } from "@/lib/server/staff-management-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ grantId: string }> },
) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "A revocation reason is required." }, { status: 400 });
  }
  try {
    const { grantId } = await context.params;
    const result = await staffManagementStore.revokeDelegatedPermission({
      grantId, actorUid: auth.uid, reason: body.reason,
    });
    if (result.outcome === "not_found") return NextResponse.json({ error: "Delegation grant was not found." }, { status: 404 });
    if (result.outcome === "not_active") return NextResponse.json({ error: "This delegation is no longer active." }, { status: 409 });
    return NextResponse.json({ success: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "The delegation could not be revoked.",
    }, { status: 403 });
  }
}
