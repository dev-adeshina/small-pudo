import { NextResponse } from "next/server";
import { authorizeStaffPermissionAdministrator } from "@/lib/server/staff-management-auth";
import { staffManagementStore } from "@/lib/server/staff-management-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function PATCH(request:Request,context:{params:Promise<{invitationId:string}>}){
 const auth=await authorizeStaffPermissionAdministrator(request);
 if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status});
 let body:Record<string,unknown>;
 try{const parsed:unknown=await request.json();if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error();body=parsed as Record<string,unknown>;}
 catch{return NextResponse.json({error:"A revocation reason is required."},{status:400});}
 try{
  const {invitationId}=await context.params;
  const result=await staffManagementStore.revokeInvitation(invitationId,auth.uid,body.reason);
  if(result.outcome==="not_found")return NextResponse.json({error:"Invitation not found."},{status:404});
  if(result.outcome==="not_pending")return NextResponse.json({error:"Only a pending invitation can be revoked."},{status:409});
  return NextResponse.json({success:true,...result});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"The invitation could not be revoked."},{status:400});}
}