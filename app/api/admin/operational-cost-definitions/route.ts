import { NextResponse } from "next/server";

import { operationalCostDefinitionStore } from "@/lib/server/operational-cost-definition-store";
import { authorizeOperationalCostDefinitionRequest } from "@/lib/server/operational-cost-definition-request-auth";

export async function GET(request: Request) {
  const authorization = await authorizeOperationalCostDefinitionRequest(
    request,
    "operational_cost_definition.view"
  );
  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  }

  const rawLimit = new URL(request.url).searchParams.get("limit");
  const limit = rawLimit === null ? 50 : Number(rawLimit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    return NextResponse.json({ error: "Limit must be an integer between 1 and 100." }, { status: 400 });
  }

  try {
    const definitions = await operationalCostDefinitionStore.listDefinitions(limit);
    return NextResponse.json({ success: true, definitions });
  } catch {
    return NextResponse.json({ error: "Unable to retrieve operational cost definitions." }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    return NextResponse.json({ error: "A valid definition request body is required." }, { status: 400 });
  }

  try {
    const created = await operationalCostDefinitionStore.createDefinition(
      authorization.uid,
      body as Parameters<typeof operationalCostDefinitionStore.createDefinition>[1]
    );
    return NextResponse.json({ success: true, ...created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The definition could not be created.";
    const status = error instanceof TypeError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
