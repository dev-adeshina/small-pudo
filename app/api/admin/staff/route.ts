import { NextResponse } from "next/server";
import { Resend } from "resend";
import { authorizeStaffPermissionAdministrator } from "@/lib/server/staff-management-auth";
import { staffManagementStore } from "@/lib/server/staff-management-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const auth=await authorizeStaffPermissionAdministrator(request);
 if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status});
 try{return NextResponse.json({success:true,...await staffManagementStore.listStaff()},{headers:{"Cache-Control":"no-store"}});}
 catch{return NextResponse.json({error:"Unable to retrieve staff management records."},{status:503});}
}
export async function POST(request:Request){
 const auth=await authorizeStaffPermissionAdministrator(request);
 if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status});
 const apiKey=process.env.RESEND_API_KEY,from=process.env.STAFF_INVITATION_FROM_EMAIL,appUrl=process.env.APP_URL;
 if(!apiKey||!from||!appUrl)return NextResponse.json({error:"Staff invitation email is not configured. Set RESEND_API_KEY, STAFF_INVITATION_FROM_EMAIL and APP_URL."},{status:503});
 let base:URL;try{base=new URL(appUrl);}catch{return NextResponse.json({error:"APP_URL must be a valid absolute application URL."},{status:503});}
 if(base.protocol!=="https:"&&base.hostname!=="localhost"&&base.hostname!=="127.0.0.1")return NextResponse.json({error:"APP_URL must use HTTPS outside local development."},{status:503});
 let body:Record<string,unknown>;
 try{const parsed:unknown=await request.json();if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error();body=parsed as Record<string,unknown>;}
 catch{return NextResponse.json({error:"A valid invitation request is required."},{status:400});}
 let invite;
 try{invite=await staffManagementStore.createInvitation({email:body.email,expiresAt:body.expiresAt,reason:body.reason,actorUid:auth.uid});}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:"The invitation could not be created."},{status:400});}
 const url=new URL("/staff/accept-invitation",base);url.searchParams.set("token",invite.token);
 try{
  const result=await new Resend(apiKey).emails.send({from,to:invite.email,subject:"Your VeriLyft staff invitation",html:`<p>You have been invited to join the VeriLyft staff workspace.</p><p><a href="${url.toString()}">Accept your invitation and set up your staff account</a></p><p>This invitation expires at ${new Date(invite.expiresAt).toLocaleString("en-NG",{timeZone:"Africa/Lagos"})} (Lagos time).</p><p>If you were not expecting this invitation, you can ignore this email.</p>`});
  if(result.error||!result.data?.id)throw new Error(result.error?.message??"Resend did not confirm the invitation request.");
 }catch{
  try{await staffManagementStore.markInvitationDeliveryFailed(invite.invitationId,auth.uid,"Resend did not confirm delivery.");}catch{}
  return NextResponse.json({error:"The invitation was recorded but email delivery was not confirmed. It has been marked delivery_failed; create a new invitation after checking email configuration."},{status:502});
 }
 return NextResponse.json({success:true,invitation:{invitationId:invite.invitationId,email:invite.email,expiresAt:invite.expiresAt,status:"pending"}},{status:201,headers:{"Cache-Control":"no-store"}});
}