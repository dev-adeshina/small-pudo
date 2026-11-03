import { NextResponse } from "next/server";

import { operationalCostDefinitionStore } from "@/lib/server/operational-cost-definition-store";
import { authorizeOperationalCostDefinitionRequest } from "@/lib/server/operational-cost-definition-request-auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ definitionId: string }> }
) {
  const authorization = await authorizeOperationalCostDefinitionRequest(
    request,
    "operational_cost_definition.view"
  );
  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  }

  const { definitionId } = await context.params;
  try {
    const definition = await operationalCostDefinitionStore.getDefinition(definitionId);
    if (!definition) {
      return NextResponse.json({ error: "Operational cost definition not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, definition });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The definition could not be retrieved.";
    const status = error instanceof TypeError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ definitionId: string }> }
) {
  const authorization = await authorizeOperationalCostDefinitionRequest(
    request,
    "operational_cost_definition.propose"
  );
  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid revision request body is required." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A revision request object is required." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  if (!Number.isSafeInteger(input.expectedCurrentVersionNumber) ||
      typeof input.expectedCurrentVersionNumber !== "number" ||
      input.expectedCurrentVersionNumber < 1 ||
      !input.definition || typeof input.definition !== "object" || Array.isArray(input.definition)) {
    return NextResponse.json({ error: "A valid expected version number and definition are required." }, { status: 400 });
  }

  const { definitionId } = await context.params;
  try {
    const result = await operationalCostDefinitionStore.reviseDefinition({
      definitionId,
      expectedCurrentVersionNumber: input.expectedCurrentVersionNumber,
      actorUid: authorization.uid,
      definition: input.definition as Parameters<typeof operationalCostDefinitionStore.reviseDefinition>[0]["definition"],
    });

    if (result.outcome === "not_found") {
      return NextResponse.json({ error: "Operational cost definition not found." }, { status: 404 });
    }
    if (result.outcome === "stale_version") {
      return NextResponse.json({ error: "The definition changed. Reload it before revising.", ...result }, { status: 409 });
    }
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The definition could not be revised.";
    const status = error instanceof TypeError ? 400 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
