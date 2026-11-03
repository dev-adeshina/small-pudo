import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { createAdminRequestAuthorizer } from "@/lib/server/admin-authorization-core";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const authorizeAdminRequestCore = createAdminRequestAuthorizer({
  adminAuth,
  adminDb,
  adminEmails,
});

export async function authorizeAdminRequest(
  request: Request,
  unauthorizedMessage?: string
) {
  const result = await authorizeAdminRequestCore(request, unauthorizedMessage);

  if (!result.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: result.error },
        { status: result.status }
      ),
    };
  }

  return result;
}
