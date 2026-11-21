import { NextResponse } from "next/server";

import { authorizeCommercialPricingRequest } from "@/lib/server/commercial-pricing-request-auth";
import { commercialRouteDistanceStore } from "@/lib/server/commercial-route-distance-store";

export async function GET(request: Request) {
  const authorization = await authorizeCommercialPricingRequest(
    request,
    "commercial_pricing.view",
  );

  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  try {
    const locations = await commercialRouteDistanceStore.listActiveLocations(
      authorization.uid,
    );
    return NextResponse.json({ locations });
  } catch {
    return NextResponse.json(
      { error: "Active PUDO locations could not be loaded." },
      { status: 503 },
    );
  }
}
