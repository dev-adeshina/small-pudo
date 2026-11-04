import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { staffManagementStore } from "@/lib/server/staff-management-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 const match=request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i);
 if(!match)return NextResponse.json({error:"Sign in with the invited account first."},{status:401});
 let decoded;try{decoded=await adminAuth.verifyIdToken(match[1],true);}catch{return NextResponse.json({error:"Your session is invalid, expired, or revoked. Sign in again."},{status:401});}
 if(!decoded.email_verified||!decoded.email)return NextResponse.json({error:"Verify your email address before activating staff access."},{status:403});
 let body:Record<string,unknown>;
 try{const parsed:unknown=await request.json();if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error();body=parsed as Record<string,unknown>;}
 catch{return NextResponse.json({error:"A valid invitation token is required."},{status:400});}
 try{
  const result=await staffManagementStore.activateInvitation({token:body.token,uid:decoded.uid,email:decoded.email});
  if(result.outcome==="invalid")return NextResponse.json({error:"This invitation link is invalid."},{status:404});
  if(result.outcome==="email_mismatch")return NextResponse.json({error:"The signed-in verified email does not match the invitation."},{status:403});
  if(result.outcome==="expired")return NextResponse.json({error:"This invitation has expired. Ask a designated administrator for a new invitation."},{status:410});
  if(result.outcome!=="activated"&&result.outcome!=="already_active")return NextResponse.json({error:"This invitation is no longer available for activation."},{status:409});
  return NextResponse.json({success:true,message:"Your staff account is active. No operational permissions have been assigned."},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Staff activation could not be completed. Try again."},{status:503});}
}