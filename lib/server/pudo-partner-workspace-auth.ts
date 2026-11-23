import { adminAuth } from "@/lib/firebase-admin";

export type PudoPartnerAuthorization =
  | { ok: true; uid: string; email: string }
  | { ok: false; status: 401 | 403; error: string };

export async function authorizePudoPartner(request: Request): Promise<PudoPartnerAuthorization> {
  const match = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false, status: 401, error: "Partner sign-in is required." };
  try {
    const decoded = await adminAuth.verifyIdToken(match[1], true);
    if (decoded.email_verified !== true) {
      return { ok: false, status: 403, error: "Verify your email address before accessing the partner portal." };
    }
    if (typeof decoded.email !== "string" || !decoded.email) {
      return { ok: false, status: 403, error: "A verified email address is required." };
    }
    return { ok: true, uid: decoded.uid, email: decoded.email };
  } catch {
    return { ok: false, status: 401, error: "Your session is invalid, expired, or revoked. Sign in again." };
  }
}
