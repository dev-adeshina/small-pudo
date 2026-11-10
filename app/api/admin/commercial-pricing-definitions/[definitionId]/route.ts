import { NextResponse } from "next/server";

import { authorizeCommercialPricingRequest } from "@/lib/server/commercial-pricing-request-auth";
import { commercialPricingStore } from "@/lib/server/commercial-pricing-store";

interface RouteContext {
  params: Promise<{ definitionId: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
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

  try {
    const { definitionId } = await context.params;
    const definition = await commercialPricingStore.getDefinition(definitionId);

    if (!definition) {
      return NextResponse.json(
        { error: "Commercial pricing definition not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ definition });
  } catch (error) {
    if (error instanceof TypeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unable to retrieve the commercial pricing definition." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
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

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "A valid JSON request body is required." },
      { status: 400 }
    );
  }

  if (
    body === null ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      { error: "The request body must be an object." },
      { status: 400 }
    );
  }

  const input = body as Record<string, unknown>;

  if (
    typeof input.expectedCurrentVersionNumber !== "number" ||
    !Number.isSafeInteger(input.expectedCurrentVersionNumber) ||
    input.expectedCurrentVersionNumber < 1 ||
    input.configuration === null ||
    typeof input.configuration !== "object" ||
    Array.isArray(input.configuration)
  ) {
    return NextResponse.json(
      {
        error:
          "A valid expected current version number and configuration object are required.",
      },
      { status: 400 }
    );
  }

  try {
    const { definitionId } = await context.params;

    const result = await commercialPricingStore.reviseDefinition({
      definitionId,
      expectedCurrentVersionNumber:
        input.expectedCurrentVersionNumber,
      actorUid: authorization.uid,
      configuration: input.configuration as Record<string, unknown>,
    });

    if (result.outcome === "not_found") {
      return NextResponse.json(
        { error: "Commercial pricing definition not found." },
        { status: 404 }
      );
    }

    if (result.outcome === "stale_version") {
      return NextResponse.json(
        {
          error: "The definition has changed. Retrieve the latest version before revising it.",
          currentVersionId: result.currentVersionId,
          currentVersionNumber: result.currentVersionNumber,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TypeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unable to revise the commercial pricing definition." },
      { status: 500 }
    );
  }
}
