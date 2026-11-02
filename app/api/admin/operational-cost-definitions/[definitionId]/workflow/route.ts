import { NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase-admin";
import { operationalCostDefinitionWorkflowStore } from "@/lib/server/operational-cost-definition-workflow-store";

const ACTIONS = new Set([
  "submit",
  "validate",
  "finance_review",
  "approve",
  "request_changes",
  "reject",
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ definitionId: string }> }
) {
  const match = request.headers.get("authorization")?.match(/^Bearer\\s+(.+)$/i);
  if (!match) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(match[1], true);
  } catch {
    return NextResponse.json({ error: "Your session is invalid, expired, or revoked." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A request object is required." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  if (
    typeof input.versionId !== "string" ||
    typeof input.action !== "string" ||
    !ACTIONS.has(input.action) ||
    (input.reason !== undefined && typeof input.reason !== "string")
  ) {
    return NextResponse.json({ error: "A valid versionId, action and optional reason are required." }, { status: 400 });
  }

  const { definitionId } = await context.params;
  try {
    const result = await operationalCostDefinitionWorkflowStore.transition({
      definitionId,
      versionId: input.versionId,
      actorUid: decoded.uid,
      action: input.action as
        | "submit"
        | "validate"
        | "finance_review"
        | "approve"
        | "request_changes"
        | "reject",
      reason: input.reason as string | undefined,
    });

    if (result.outcome === "not_found") {
      return NextResponse.json({ error: "Operational cost definition version not found." }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The workflow action could not be completed.";
    const status = message.includes("required action permission") ? 403 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
