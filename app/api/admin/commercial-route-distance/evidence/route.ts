import { NextResponse } from "next/server";

import { authorizeCommercialPricingRequest } from "@/lib/server/commercial-pricing-request-auth";
import { commercialRouteDistanceStore } from "@/lib/server/commercial-route-distance-store";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "The route-distance request could not be completed.";
  const status = error instanceof TypeError ? 400 : 400;
  return NextResponse.json({ error: message }, { status });
}

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

  const url = new URL(request.url);
  const origin = url.searchParams.get("origin");
  const destination = url.searchParams.get("destination");

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Origin and destination location IDs are required." },
      { status: 400 },
    );
  }

  try {
    const evidence = await commercialRouteDistanceStore.listEvidence(
      authorization.uid,
      origin,
      destination,
    );
    return NextResponse.json({ evidence });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeCommercialPricingRequest(
    request,
    "commercial_pricing.propose",
  );

  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "A valid JSON request body is required." },
      { status: 400 },
    );
  }

  try {
    const evidence = await commercialRouteDistanceStore.recordEvidence(
      authorization.uid,
      body as Parameters<typeof commercialRouteDistanceStore.recordEvidence>[1],
    );
    return NextResponse.json({ evidence }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
