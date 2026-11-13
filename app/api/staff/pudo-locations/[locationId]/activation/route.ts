import { NextResponse } from "next/server";

import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { pudoLocationActivationStore } from "@/lib/server/pudo-location-activation-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ locationId: string }>;
};

function response(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await authorizeStaffWorkspace(request);

  if (!auth.ok) {
    return response({ error: auth.error }, auth.status);
  }

  try {
    const { locationId } = await context.params;
    const result = await pudoLocationActivationStore.activateLocation(
      auth.uid,
      locationId,
    );

    return response(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("not authorised to activate PUDO locations")) {
      return response(
        { error: "You do not have permission to activate PUDO locations." },
        403,
      );
    }

    if (message === "PUDO candidate not found.") {
      return response({ error: message }, 404);
    }

    if (
      message.includes("Only submitted PUDO candidates") ||
      message.includes("verification approval is required") ||
      message.includes("already been activated")
    ) {
      return response({ error: message }, 409);
    }

    if (error instanceof TypeError) {
      return response({ error: message }, 400);
    }

    console.error("PUDO location activation failed:", error);
    return response(
      { error: "An unexpected error occurred while activating the PUDO location." },
      500,
    );
  }
}
