import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { createAdminRequestAuthorizer } from "@/lib/server/admin-authorization-core";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const authorizeAdminRequest = createAdminRequestAuthorizer({
  adminAuth,
  adminDb,
  adminEmails,
});
