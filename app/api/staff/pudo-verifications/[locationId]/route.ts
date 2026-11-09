import { NextResponse } from "next/server";

import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { pudoLocationVerificationStore } from "@/lib/server/pudo-location-verification-store";
import { pudoVerificationErrorResponse } from "@/lib/server/pudo-verification-route-errors";

interface RouteContext {
  params: Promise<{ locationId: string }>;
}

export const dynamic = "force-dynamic";

export async function GET(
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

    const result = await pudoLocationVerificationStore.getVerification(
      authorization.uid,
      locationId,
    );

    if (!result) {
      return NextResponse.json(
        { error: "The submitted PUDO candidate was not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      result,
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return pudoVerificationErrorResponse(error);
  }
}