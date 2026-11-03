import { adminAuth } from "@/lib/firebase-admin";
import { operationalCostDefinitionStore } from "@/lib/server/operational-cost-definition-store";

export type OperationalCostDefinitionPermission =
  | "operational_cost_definition.propose"
  | "operational_cost_definition.view";

export type OperationalCostDefinitionRequestAuthorization =
  | { ok: true; uid: string }
  | { ok: false; status: 401 | 403 | 503; error: string };

export async function authorizeOperationalCostDefinitionRequest(
  request: Request,
  permission: OperationalCostDefinitionPermission
): Promise<OperationalCostDefinitionRequestAuthorization> {
  const match = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, status: 401, error: "Authentication required." };
  }

  let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
  try {
    decoded = await adminAuth.verifyIdToken(match[1], true);
  } catch {
    return { ok: false, status: 401, error: "Your session is invalid, expired, or revoked." };
  }

  try {
    const allowed = await operationalCostDefinitionStore.hasPermission(decoded.uid, permission);
    if (!allowed) {
      return { ok: false, status: 403, error: "You do not have the required operational cost definition permission." };
    }
  } catch {
    return { ok: false, status: 503, error: "Operational cost definition authorization is temporarily unavailable." };
  }

  return { ok: true, uid: decoded.uid };
}
