import { adminAuth } from "@/lib/firebase-admin";

export type StaffWorkspaceAuthorization =
  | { ok: true; uid: string }
  | { ok: false; status: 401 | 403; error: string };

export async function authorizeStaffWorkspace(request: Request): Promise<StaffWorkspaceAuthorization> {
  const match = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false, status: 401, error: "Authentication required." };
  try {
    const decoded = await adminAuth.verifyIdToken(match[1], true);
    if (decoded.email_verified !== true) {
      return { ok: false, status: 403, error: "A verified staff email address is required." };
    }
    return { ok: true, uid: decoded.uid };
  } catch {
    return { ok: false, status: 401, error: "Your session is invalid, expired, or revoked. Sign in again." };
  }
}
