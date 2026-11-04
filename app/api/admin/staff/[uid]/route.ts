import { NextResponse } from "next/server";
import { authorizeStaffPermissionAdministrator } from "@/lib/server/staff-management-auth";
import { staffManagementStore } from "@/lib/server/staff-management-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function PATCH(request:Request,context:{params:Promise<{uid:string}>}){
 const auth=await authorizeStaffPermissionAdministrator(request);
 if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status});
 let body:Record<string,unknown>;
 try{const parsed:unknown=await request.json();if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error();body=parsed as Record<string,unknown>;}
 catch{return NextResponse.json({error:"A valid permission update is required."},{status:400});}
 try{
  const {uid}=await context.params;
  const result=await staffManagementStore.setPermission({targetUid:uid,actorUid:auth.uid,permissionId:body.permissionId,status:body.status,reason:body.reason,expiresAt:body.expiresAt});
  if(result.outcome==="staff_unavailable")return NextResponse.json({error:"The target is not an active staff account."},{status:404});
  return NextResponse.json({success:true,...result},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"The permission could not be updated."},{status:400});}
}