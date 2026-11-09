import { NextResponse } from "next/server";

import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { pudoLocationVerificationStore } from "@/lib/server/pudo-location-verification-store";
import { pudoVerificationErrorResponse } from "@/lib/server/pudo-verification-route-errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = await authorizeStaffWorkspace(request);

  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  try {
    const url = new URL(request.url);
    const requestedLimit = url.searchParams.get("limit");
    const limit = requestedLimit === null
      ? 50
      : Number(requestedLimit);

    const queue = await pudoLocationVerificationStore.listQueue(
      authorization.uid,
      limit,
    );

    return NextResponse.json(
      { queue },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return pudoVerificationErrorResponse(error);
  }
}