import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

type AuthorizationResult =
  | {
      ok: true;
      uid: string;
      email: string;
    }
  | {
      ok: false;
      response: NextResponse;
    };

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function authorizeAdminRequest(
  request: Request,
  unauthorizedMessage = "You are not authorized to access this resource."
): Promise<AuthorizationResult> {
  const adminEmails = getAdminEmails();

  if (adminEmails.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Admin access is not configured." },
        { status: 503 }
      ),
    };
  }

  const match = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;

  try {
    decoded = await adminAuth.verifyIdToken(match[1], true);
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Your session is invalid, expired, or revoked. Sign in again." },
        { status: 401 }
      ),
    };
  }

  const email = decoded.email?.trim().toLowerCase();

  if (
    !decoded.email_verified ||
    !email ||
    !adminEmails.includes(email) ||
    decoded.admin !== true
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: unauthorizedMessage },
        { status: 403 }
      ),
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
        response: NextResponse.json(
          { error: unauthorizedMessage },
          { status: 403 }
        ),
      };
    }
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Administrator access could not be verified. Try again." },
        { status: 503 }
      ),
    };
  }

  return {
    ok: true,
    uid: decoded.uid,
    email,
  };
}
