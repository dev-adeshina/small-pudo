import { createStaffPermissionAdministratorAuthorizer } from "./admin-authorization-core";

const adminEmails=(process.env.ADMIN_EMAILS??"").split(",").map(value=>value.trim().toLowerCase()).filter(Boolean);

export async function authorizeStaffPermissionAdministrator(request:Request){
 const {adminAuth,adminDb}=await import("../firebase-admin");
 const authorize=createStaffPermissionAdministratorAuthorizer({adminAuth,adminDb,adminEmails});
 return authorize(request);
}
