import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request: Request) {
  if (ADMIN_EMAILS.length === 0) {
    return NextResponse.json(
      { error: "Admin access is not configured." },
      { status: 503 }
    );
  }

  const match = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
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
      return NextResponse.json(
        { error: "You are not authorized to access the admin workspace." },
        { status: 403 }
      );
    }

    const user = await adminAuth.getUser(decoded.uid);
    const existingClaims = user.customClaims ?? {};

    if (existingClaims.admin !== true) {
      await adminAuth.setCustomUserClaims(decoded.uid, {
        ...existingClaims,
        admin: true,
      });
    }

    return NextResponse.json(
      { authorized: true },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to verify administrator access." },
      { status: 401 }
    );
  }
}