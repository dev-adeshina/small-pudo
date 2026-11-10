import { adminAuth } from "@/lib/firebase-admin";
import { commercialPricingStore } from "@/lib/server/commercial-pricing-store";

export type CommercialPricingPermission =
  | "commercial_pricing.view"
  | "commercial_pricing.propose";

export type CommercialPricingRequestAuthorization =
  | { ok: true; uid: string }
  | { ok: false; status: 401 | 403 | 503; error: string };

export async function authorizeCommercialPricingRequest(
  request: Request,
  permission: CommercialPricingPermission
): Promise<CommercialPricingRequestAuthorization> {
  const match = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return {
      ok: false,
      status: 401,
      error: "Authentication required.",
    };
  }

  let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;

  try {
    decoded = await adminAuth.verifyIdToken(match[1], true);
  } catch {
    return {
      ok: false,
      status: 401,
      error: "Your session is invalid, expired, or revoked.",
    };
  }

  try {
    const allowed = await commercialPricingStore.hasPermission(
      decoded.uid,
      permission
    );

    if (!allowed) {
      return {
        ok: false,
        status: 403,
        error: "You do not have the required commercial pricing permission.",
      };
    }
  } catch {
    return {
      ok: false,
      status: 503,
      error: "Commercial pricing authorization is temporarily unavailable.",
    };
  }

  return { ok: true, uid: decoded.uid };
}
