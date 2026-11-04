import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { staffManagementStore } from "@/lib/server/staff-management-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";

async function verifiedUser(request:Request) {
 const match=request.headers.get("authorization")?.match(/^Bearer\\s+(.+)$/i);
 if(!match) return {error:NextResponse.json({error:"Sign in with the invited account first."},{status:401})};
 try {
  const decoded=await adminAuth.verifyIdToken(match[1],true);
  if(!decoded.email_verified||!decoded.email) {
   return {error:NextResponse.json({error:"Verify your email address before accessing staff activation."},{status:403})};
  }
  return {uid:decoded.uid,email:decoded.email};
 } catch {
  return {error:NextResponse.json({error:"Your session is invalid, expired, or revoked. Sign in again."},{status:401})};
 }
}

export async function GET(request:Request) {
 const identity=await verifiedUser(request);
 if("error" in identity) return identity.error;
 try {
  const result=await staffManagementStore.getInvitationStatus({uid:identity.uid,email:identity.email});
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 } catch {
  return NextResponse.json({error:"Unable to check staff activation status."},{status:503});
 }
}

export async function POST(request:Request) {
 const identity=await verifiedUser(request);
 if("error" in identity) return identity.error;
 const parsed:unknown=await request.json().catch(()=>({}));
 const body:Record<string,unknown>=parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed as Record<string,unknown>:{};
 try {
  // Keep accepting the original invitation token during the transition.
  const result=typeof body.token==="string"
   ? await staffManagementStore.activateInvitation({token:body.token,uid:identity.uid,email:identity.email})
   : await staffManagementStore.activatePendingInvitation({uid:identity.uid,email:identity.email});
  if(result.outcome==="invalid") return NextResponse.json({error:"There is no valid pending staff invitation for this verified email address."},{status:404});
  if(result.outcome==="email_mismatch") return NextResponse.json({error:"The signed-in verified email does not match the invitation."},{status:403});
  if(result.outcome==="expired") return NextResponse.json({error:"This invitation has expired. Ask a designated administrator for a new invitation."},{status:410});
  if(result.outcome!=="activated"&&result.outcome!=="already_active") return NextResponse.json({error:"This invitation is no longer available for activation."},{status:409});
  return NextResponse.json({success:true,message:"Your staff account is active. No operational permissions have been assigned."},{headers:{"Cache-Control":"no-store"}});
 } catch {
  return NextResponse.json({error:"Staff activation could not be completed. Try again."},{status:503});
 }
}
