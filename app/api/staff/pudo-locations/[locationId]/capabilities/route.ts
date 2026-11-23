import { NextResponse } from "next/server";

import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { pudoLocationCapabilityStore } from "@/lib/server/pudo-location-capability-store";

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
  if (message.includes("not authorised to")) {
    return response({ error: message }, 403);
  }
  if (message.includes("not found")) {
    return response({ error: message }, 404);
  }
  if (message.includes("approval is required") ||
    message.includes("Only an approved")) {
    return response({ error: message }, 409);
  }
  if (error instanceof TypeError) {
    return response({ error: message }, 400);
  }
  console.error("PUDO capability request failed:", error);
  return response({ error: "Unable to process PUDO capability request." }, 500);
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return response({ error: auth.error }, auth.status);

  try {
    const { locationId } = await context.params;
    const configuration = await pudoLocationCapabilityStore.getConfiguration(
      auth.uid, locationId,
    );
    return response({ configuration });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await authorizeStaffWorkspace(request);
  if (!auth.ok) return response({ error: auth.error }, auth.status);

  let input: { capabilities?: unknown; reason?: unknown };
  try {
    input = await request.json() as typeof input;
  } catch {
    return response({ error: "A valid JSON body is required." }, 400);
  }

  try {
    const { locationId } = await context.params;
    const configuration = await pudoLocationCapabilityStore.configureCapabilities(
      auth.uid, locationId, {
        capabilities: input.capabilities,
        reason: input.reason,
      },
    );
    return response({ configuration });
  } catch (error) {
    return errorResponse(error);
  }
}
