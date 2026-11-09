import { NextResponse } from "next/server";

import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { pudoLocationVerificationStore } from "@/lib/server/pudo-location-verification-store";
import { pudoVerificationErrorResponse } from "@/lib/server/pudo-verification-route-errors";
import type { PudoInspectionInput } from "@/lib/server/pudo-location-verification-store-core";

interface RouteContext {
  params: Promise<{ locationId: string }>;
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const authorization = await authorizeStaffWorkspace(request);

  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  try {
    const { locationId } = await context.params;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "A valid JSON inspection record is required." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "A valid inspection record is required." },
        { status: 400 },
      );
    }

    const result = await pudoLocationVerificationStore.recordInspection(
      authorization.uid,
      locationId,
      body as PudoInspectionInput,
    );

    return NextResponse.json(
      result,
      { status: 201 },
    );
  } catch (error) {
    return pudoVerificationErrorResponse(error);
  }
}