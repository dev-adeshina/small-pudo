import { NextResponse } from "next/server";

import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { pudoLocationVerificationStore } from "@/lib/server/pudo-location-verification-store";
import { pudoVerificationErrorResponse } from "@/lib/server/pudo-verification-route-errors";
import type { PudoVerificationDecision } from "@/lib/server/pudo-location-verification-store-core";

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
        { error: "A valid JSON decision is required." },
        { status: 400 },
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "A valid decision record is required." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    if (
      Object.keys(input).some((key) =>
        !["decision", "reason"].includes(key)
      )
    ) {
      return NextResponse.json(
        { error: "The decision contains an unsupported field." },
        { status: 400 },
      );
    }

    const result = await pudoLocationVerificationStore.recordDecision(
      authorization.uid,
      locationId,
      input.decision as PudoVerificationDecision,
      input.reason as string,
    );

    return NextResponse.json(result);
  } catch (error) {
    return pudoVerificationErrorResponse(error);
  }
}