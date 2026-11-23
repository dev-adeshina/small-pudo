import { NextResponse } from "next/server";
import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { pudoLocationOperationsStore } from "@/lib/server/pudo-location-operations-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ locationId: string }> };
function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("not authorised")) return response({ error: message }, 403);
  if (message.includes("not found")) return response({ error: message }, 404);
  if (message.includes("Only an activated") || message.includes("approval is required") ||
    message.includes("At least one") || message.includes("Only an activated") ||
    message.includes("operationally active")) return response({ error: message }, 409);
  if (error instanceof TypeError) return response({ error: message }, 400);
  console.error("PUDO operations request failed:", error);
  return response({ error: "Unable to process PUDO availability and capacity." }, 500);
}
export async function GET(request: Request, context: RouteContext) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return response({ error: auth.error }, auth.status);
  try {
    const { locationId } = await context.params;
    return response(await pudoLocationOperationsStore.getOperations(auth.uid, locationId));
  } catch (error) { return errorResponse(error); }
}
export async function PUT(request: Request, context: RouteContext) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return response({ error: auth.error }, auth.status);
  let input: { availability?: unknown; capacity?: unknown; reason?: unknown };
  try { input = await request.json() as typeof input; }
  catch { return response({ error: "A valid JSON body is required." }, 400); }
  try {
    const { locationId } = await context.params;
    return response(await pudoLocationOperationsStore.saveOperations(auth.uid, locationId, {
      availability: input.availability,
      capacity: input.capacity,
      reason: input.reason,
    }));
  } catch (error) { return errorResponse(error); }
}
