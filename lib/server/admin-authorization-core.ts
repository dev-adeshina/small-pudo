type AdminToken = {
  uid: string;
  email?: string;
  email_verified?: boolean;
  admin?: boolean;
};

type AdminAuthorizationDependencies = {
  adminAuth: {
    verifyIdToken(token: string, checkRevoked?: boolean): Promise<AdminToken>;
  };
  adminDb: {
    collection(name: string): {
      doc(uid: string): {
        get(): Promise<{
          exists: boolean;
          data(): { active?: unknown } | undefined;
        }>;
      };
    };
  };
  adminEmails: readonly string[];
};

export type AuthorizationResult =
  | {
      ok: true;
      uid: string;
      email: string;
    }
  | {
      ok: false;
      status: 401 | 403 | 503;
      error: string;
    };

export function createAdminRequestAuthorizer({
  adminAuth,
  adminDb,
  adminEmails,
}: AdminAuthorizationDependencies) {
  const allowedEmails = adminEmails
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return async function authorizeAdminRequest(
    request: Request,
    unauthorizedMessage = "You are not authorized to access this resource."
  ): Promise<AuthorizationResult> {
    if (allowedEmails.length === 0) {
      return {
        ok: false,
        status: 503,
        error: "Admin access is not configured.",
      };
    }

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

    let decoded: AdminToken;

    try {
      decoded = await adminAuth.verifyIdToken(match[1], true);
    } catch {
      return {
        ok: false,
        status: 401,
        error: "Your session is invalid, expired, or revoked. Sign in again.",
      };
    }

    const email = decoded.email?.trim().toLowerCase();

    if (
      !decoded.email_verified ||
      !email ||
      !allowedEmails.includes(email) ||
      decoded.admin !== true
    ) {
      return {
        ok: false,
        status: 403,
        error: unauthorizedMessage,
      };
    }

    try {
      const accessSnapshot = await adminDb
        .collection("adminAccess")
        .doc(decoded.uid)
        .get();

      if (!accessSnapshot.exists || accessSnapshot.data()?.active !== true) {
        return {
          ok: false,
          status: 403,
          error: unauthorizedMessage,
        };
      }
    } catch {
      return {
        ok: false,
        status: 503,
        error: "Administrator access could not be verified. Try again.",
      };
    }

    return {
      ok: true,
      uid: decoded.uid,
      email,
    };
  };
}
