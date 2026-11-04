import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { createAdminRequestAuthorizer } from "@/lib/server/admin-authorization-core";

const adminEmails=(process.env.ADMIN_EMAILS??"").split(",").map(value=>value.trim().toLowerCase()).filter(Boolean);
const authorizeAdmin=createAdminRequestAuthorizer({adminAuth,adminDb,adminEmails});

export type StaffManagementAuthorization=
 | {ok:true;uid:string;email:string}
 | {ok:false;status:401|403|503;error:string};

export function createStaffPermissionAdministratorAuthorizer(dependencies:{
 adminAuth:Parameters<typeof createAdminRequestAuthorizer>[0]["adminAuth"];
 adminDb:Parameters<typeof createAdminRequestAuthorizer>[0]["adminDb"];
 adminEmails:readonly string[];
}){
 const authorizeAdminCore=createAdminRequestAuthorizer(dependencies);
 return async function authorize(request:Request):Promise<StaffManagementAuthorization>{
  const admin=await authorizeAdminCore(request,"An active Admin account is required for staff permission administration.");
  if(!admin.ok)return admin;
  try{
   const designation=await dependencies.adminDb.collection("staffPermissionAdministrators").doc(admin.uid).get();
   if(!designation.exists||designation.data()?.active!==true){
    return{ok:false,status:403,error:"Only an actively designated Staff Permission Administrator may manage staff access."};
   }
   return{ok:true,uid:admin.uid,email:admin.email};
  }catch{
   return{ok:false,status:503,error:"Staff permission-administrator authority could not be verified."};
  }
 };
}

const authorize=createStaffPermissionAdministratorAuthorizer({adminAuth,adminDb,adminEmails});
export async function authorizeStaffPermissionAdministrator(request:Request){return authorize(request);}
