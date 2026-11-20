import { NextResponse } from "next/server";

import { authorizeCommercialPricingRequest } from "@/lib/server/commercial-pricing-request-auth";
import { commercialPricingStore } from "@/lib/server/commercial-pricing-store";

interface RouteContext {
  params: Promise<{ definitionId: string }>;
}

const ACTIONS = ["submit", "approve", "request_changes", "reject"] as const;
type Action = (typeof ACTIONS)[number];

export async function POST(request: Request, context: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "The request body must be an object." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  if (
    typeof input.versionId !== "string" ||
    !input.versionId.trim() ||
    typeof input.action !== "string" ||
    !ACTIONS.includes(input.action as Action) ||
    (input.reason !== undefined && typeof input.reason !== "string")
  ) {
    return NextResponse.json({ error: "A version ID and supported workflow action are required." }, { status: 400 });
  }

  const action = input.action as Action;
  const permission = action === "submit" ? "commercial_pricing.propose" : "commercial_pricing.approve";
  const authorization = await authorizeCommercialPricingRequest(request, permission);
  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  }

  try {
    const { definitionId } = await context.params;
    const result = await commercialPricingStore.transitionWorkflow({
      definitionId,
      versionId: input.versionId,
      actorUid: authorization.uid,
      action,
      ...(typeof input.reason === "string" ? { reason: input.reason } : {}),
    });

    if (result.outcome === "not_found") {
      return NextResponse.json({ error: "Commercial pricing definition or version not found." }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update pricing approval workflow.";
    if (error instanceof TypeError) return NextResponse.json({ error: message }, { status: 400 });
    if (/permission|authoriz|independent approver|creator|pending version|current commercial pricing version|Only the version creator/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
