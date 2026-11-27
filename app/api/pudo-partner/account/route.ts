import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { pudoPartnerPortalStore } from "@/lib/server/pudo-partner-portal-store";
import { authorizePudoPartner } from "@/lib/server/pudo-partner-workspace-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const match = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i);
  if (!match) return response({ error: "Registration authentication is required." }, 401);
  let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
  try {
    decoded = await adminAuth.verifyIdToken(match[1], true);
  } catch {
    return response({ error: "Your registration session is invalid or expired." }, 401);
  }
  if (!decoded.email) return response({ error: "A valid email address is required." }, 400);
  if (decoded.email_verified !== true) return response({ error: "Verify your email address before registering a PUDO partner account." }, 403);
  let body: unknown;
  try { body = await request.json(); } catch { return response({ error: "A valid JSON body is required." }, 400); }
  try {
    const profile = await pudoPartnerPortalStore.registerPartner(decoded.uid, decoded.email, body as {
      businessName: string; contactName: string; phone: string;
    });
    return response({ profile }, 201);
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "Unable to register partner account." }, 400);
  }
}

export async function GET(request: Request) {
  const auth = await authorizePudoPartner(request);
  if (!auth.ok) return response({ error: auth.error }, auth.status);
  try {
    return response({ profile: await pudoPartnerPortalStore.getPartner(auth.uid) });
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "Unable to load partner account." }, 403);
  }
}
