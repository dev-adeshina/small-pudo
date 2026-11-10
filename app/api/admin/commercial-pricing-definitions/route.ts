import { NextResponse } from "next/server";

import { authorizeCommercialPricingRequest } from "@/lib/server/commercial-pricing-request-auth";
import { commercialPricingStore } from "@/lib/server/commercial-pricing-store";

export async function GET(request: Request) {
  const authorization = await authorizeCommercialPricingRequest(
    request,
    "commercial_pricing.view"
  );

  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status }
    );
  }

  const rawLimit = new URL(request.url).searchParams.get("limit");
  const limit = rawLimit === null ? 50 : Number(rawLimit);

  try {
    const definitions = await commercialPricingStore.listDefinitions(limit);
    return NextResponse.json({ definitions });
  } catch (error) {
    if (error instanceof TypeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unable to retrieve commercial pricing definitions." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeCommercialPricingRequest(
    request,
    "commercial_pricing.propose"
  );

  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status }
    );
  }

  let configuration: unknown;

  try {
    configuration = await request.json();
  } catch {
    return NextResponse.json(
      { error: "A valid JSON configuration is required." },
      { status: 400 }
    );
  }

  try {
    const result = await commercialPricingStore.createDefinition(
      authorization.uid,
      configuration as Record<string, unknown>
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof TypeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unable to create the commercial pricing definition." },
      { status: 500 }
    );
  }
}
