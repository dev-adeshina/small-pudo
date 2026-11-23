import { NextResponse } from "next/server";

import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { pudoLocationActivationStore } from "@/lib/server/pudo-location-activation-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ locationId: string }> };

function response(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("not authorised to activate")) {
    return response({ error: "You do not have permission to manage PUDO activation." }, 403);
  }
  if (message.includes("not found")) return response({ error: message }, 404);
  if (message.includes("requires") || message.includes("approval is required") || message.includes("Only submitted") ||
    message.includes("Only an activated") || message.includes("cannot be reactivated") ||
    message.includes("already been activated") || message.includes("At least one")) {
    return response({ error: message }, 409);
  }
  if (error instanceof TypeError) return response({ error: message }, 400);
  console.error("PUDO activation request failed:", error);
  return response({ error: "Unable to process PUDO activation request." }, 500);
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return response({ error: auth.error }, auth.status);

  let input: { reason?: unknown };
  try {
    input = await request.json() as typeof input;
  } catch {
    return response({ error: "A valid JSON body is required." }, 400);
  }

  try {
    const { locationId } = await context.params;
    return response(await pudoLocationActivationStore.activateLocation(
      auth.uid, locationId, input.reason,
    ));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return response({ error: auth.error }, auth.status);

  let input: { status?: unknown; reason?: unknown };
  try {
    input = await request.json() as typeof input;
  } catch {
    return response({ error: "A valid JSON body is required." }, 400);
  }

  try {
    const { locationId } = await context.params;
    const result = await pudoLocationActivationStore.setOperationalStatus(
      auth.uid,
      locationId,
      input.status as "active" | "suspended" | "deactivated",
      input.reason,
    );
    return response(result);
  } catch (error) {
    return errorResponse(error);
  }
}
