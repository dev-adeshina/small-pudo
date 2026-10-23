import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request: Request) {
  if (ADMIN_EMAILS.length === 0) {
    return NextResponse.json(
      { error: "Administrator registration is unavailable." },
      { status: 503 }
    );
  }

  let body: { email?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  if (typeof body.email !== "string" || !body.email.trim()) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 }
    );
  }

  const email = body.email.trim().toLowerCase();

  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json(
      {
        error:
          "Administrator registration is restricted to approved email addresses.",
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { allowed: true },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}