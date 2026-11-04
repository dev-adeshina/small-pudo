import { cert,getApps,initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue,getFirestore } from "firebase-admin/firestore";

const confirmation="--confirm-initial-designation";
if(!process.argv.includes(confirmation)){
 console.error(`Refusing to provision. Re-run with ${confirmation} after reviewing the target and project.`);
 process.exit(1);
}
const projectId=process.env.FIREBASE_PROJECT_ID;
const clientEmail=process.env.FIREBASE_CLIENT_EMAIL;
const privateKey=process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,"\n");
const targetUid=process.env.STAFF_PERMISSION_ADMIN_UID;
const actorUid=process.env.STAFF_PERMISSION_ADMIN_PROVISIONED_BY_UID;
const reason=process.env.STAFF_PERMISSION_ADMIN_PROVISIONING_REASON?.trim();
const expectedProject=process.env.STAFF_PERMISSION_ADMIN_EXPECTED_PROJECT_ID;
const adminEmails=(process.env.ADMIN_EMAILS??"").split(",").map(value=>value.trim().toLowerCase()).filter(Boolean);
if(!projectId||!clientEmail||!privateKey||!targetUid||!actorUid||!reason||!expectedProject){
 console.error("Missing required Firebase credentials or STAFF_PERMISSION_ADMIN_* provisioning environment values.");
 process.exit(1);
}
if(projectId!==expectedProject){
 console.error("Firebase project ID does not match STAFF_PERMISSION_ADMIN_EXPECTED_PROJECT_ID. No changes made.");
 process.exit(1);
}
if(!adminEmails.length){
 console.error("ADMIN_EMAILS is empty. No changes made.");
 process.exit(1);
}
const app=getApps()[0]??initializeApp({credential:cert({projectId,clientEmail,privateKey}),projectId});
const auth=getAuth(app);
const db=getFirestore(app);

async function requireActiveAdmin(uid,label){
 const user=await auth.getUser(uid);
 const email=user.email?.trim().toLowerCase();
 if(!user.emailVerified||!email||!adminEmails.includes(email)||user.customClaims?.admin!==true){
  throw new Error(`${label} must be an email-verified, allowlisted Firebase Admin account with the admin custom claim.`);
 }
 const access=await db.collection("adminAccess").doc(uid).get();
 if(!access.exists||access.data()?.active!==true) throw new Error(`${label} must have an active adminAccess record.`);
 return user;
}

try{
 await requireActiveAdmin(targetUid,"Target account");
 await requireActiveAdmin(actorUid,"Provisioning actor");
 const designationRef=db.collection("staffPermissionAdministrators").doc(targetUid);
 const auditRef=db.collection("staffManagementAudit").doc();
 await db.runTransaction(async transaction=>{
  const existing=await transaction.get(designationRef);
  if(existing.exists&&existing.data()?.active===true) throw new Error("The target is already an active Staff Permission Administrator. No change made.");
  transaction.set(designationRef,{
   active:true,appointedBy:actorUid,appointedAt:FieldValue.serverTimestamp(),
   updatedAt:FieldValue.serverTimestamp(),reason,provisioningMethod:"controlled-cli",
  },{merge:true});
  transaction.create(auditRef,{
   action:"permission_administrator.appointed",actorUid,targetUid,scope:"platform",
   reason,outcome:"success",occurredAt:FieldValue.serverTimestamp(),
  });
 });
 console.log("Initial Staff Permission Administrator designation provisioned and audited.");
 console.log("No operational action permissions were assigned.");
}catch(error){
 console.error(error instanceof Error?error.message:"Provisioning failed.");
 process.exitCode=1;
}finally{
 await app.delete();
}
