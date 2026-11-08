import { NextResponse } from "next/server";
import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { pudoLocationStore } from "@/lib/server/pudo-location-store";
import type { PudoLocationInput } from "@/lib/server/pudo-location-store-core";




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

async function getLocationId(context: RouteContext) {
  const { locationId } = await context.params;
  return locationId;
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await authorizeStaffWorkspace(request);

  if (!auth.ok) {
    return response({ error: auth.error }, auth.status);
  }

  try {
    const locationId = await getLocationId(context);
    const candidate = await pudoLocationStore.getCandidate(auth.uid, locationId);

    if (!candidate) {
      return response({ error: "PUDO candidate not found." }, 404);
    }

    return response({ candidate });
  } catch (error) {
    console.error("PUDO candidate retrieval failed:", error);
    return response({ error: "Unable to retrieve candidate." }, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authorizeStaffWorkspace(request);

  if (!auth.ok) {
    return response({ error: auth.error }, auth.status);
  }

  let input = (await request.json()) as PudoLocationInput;

  try {
    input = await request.json();
  } catch {
    return response({ error: "A valid JSON body is required." }, 400);
  }

  try {
    const locationId = await getLocationId(context);
    const candidate = await pudoLocationStore.saveCandidate(
      auth.uid,
      input,
      locationId,
    );

    return response({ candidate });
  } catch (error) {
    console.error("PUDO candidate update failed:", error);
    return response(
      { error: error instanceof Error ? error.message : "Unable to update candidate." },
      400,
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await authorizeStaffWorkspace(request);

  if (!auth.ok) {
    return response({ error: auth.error }, auth.status);
  }

  try {
    const locationId = await getLocationId(context);
    const candidate = await pudoLocationStore.submitCandidate(
      auth.uid,
      locationId,
    );

    return response({ candidate });
  } catch (error) {
    console.error("PUDO candidate submission failed:", error);
    return response(
      { error: error instanceof Error ? error.message : "Unable to submit candidate." },
      400,
    );
  }
}