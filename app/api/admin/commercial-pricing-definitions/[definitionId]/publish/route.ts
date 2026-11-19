import { NextResponse } from "next/server";

import { authorizeCommercialPricingRequest } from "@/lib/server/commercial-pricing-request-auth";
import { commercialPricingStore } from "@/lib/server/commercial-pricing-store";

interface RouteContext {
  params: Promise<{ definitionId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const authorization = await authorizeCommercialPricingRequest(request, "commercial_pricing.publish");
  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body) || typeof (body as Record<string, unknown>).versionId !== "string") {
    return NextResponse.json({ error: "A version ID is required." }, { status: 400 });
  }

  try {
    const { definitionId } = await context.params;
    const result = await commercialPricingStore.publishVersion({
      definitionId,
      versionId: (body as { versionId: string }).versionId,
      actorUid: authorization.uid,
    });
    if (result.outcome === "not_found") {
      return NextResponse.json({ error: "Commercial pricing definition or version not found." }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish pricing version.";
    if (error instanceof TypeError) return NextResponse.json({ error: message }, { status: 400 });
    if (/permission|authoriz/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
