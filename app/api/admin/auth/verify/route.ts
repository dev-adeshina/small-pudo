import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function jsonResponse(
  body: { authorized: boolean; email?: string; error?: string },
  status: number
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function GET(request: Request) {
  if (ADMIN_EMAILS.length === 0) {
    return jsonResponse(
      {
        authorized: false,
        error: "Admin access is not configured.",
      },
      503
    );
  }

  const match = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return jsonResponse(
      {
        authorized: false,
        error: "Authentication required.",
      },
      401
    );
  }

  try {
    const decoded = await adminAuth.verifyIdToken(match[1]);
    const email = decoded.email?.trim().toLowerCase();

    if (
      !decoded.email_verified ||
      !email ||
      !ADMIN_EMAILS.includes(email)
    ) {
      return jsonResponse(
        {
          authorized: false,
          error: "You are not authorized to access the admin workspace.",
        },
        403
      );
    }

    return jsonResponse(
      {
        authorized: true,
        email,
      },
      200
    );
  } catch {
    return jsonResponse(
      {
        authorized: false,
        error: "Your session is invalid or expired. Sign in again.",
      },
      401
    );
  }
}
