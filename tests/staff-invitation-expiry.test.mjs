import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after,before,describe,it } from "node:test";
import { deleteApp,initializeApp } from "firebase-admin/app";
import { FieldValue,getFirestore } from "firebase-admin/firestore";
import { createStaffManagementStore } from "../lib/server/staff-management-core.ts";

const enabled=Boolean(process.env.FIRESTORE_EMULATOR_HOST);
describe("staff invitation expiry", { skip: !enabled }, () => {
 let app,db,store;
 const id=`expired-${randomUUID()}`;
 before(()=>{
  app=initializeApp({projectId:"demo-verilyft-staff-management"},`staff-invite-expiry-${randomUUID()}`);
  db=getFirestore(app);
  store=createStaffManagementStore({db,serverTimestamp:()=>FieldValue.serverTimestamp()});
 });
 after(async()=>{
  await db.collection("staffInvitations").doc(id).delete();
  const events=await db.collection("staffManagementAudit").where("invitationId","==",id).get();
  await Promise.all(events.docs.map(event=>event.ref.delete()));
  if(app)await deleteApp(app);
 });
 it("expires a pending invitation during directory refresh and records the system audit event",async()=>{
  await db.collection("staffInvitations").doc(id).set({
   email:"expired.staff@example.com",tokenHash:"test-hash",status:"pending",
   createdAt:FieldValue.serverTimestamp(),expiresAt:new Date(Date.now()-1000),
  });
  const result=await store.listStaff();
  assert.equal(result.invitations.find(item=>item.invitationId===id)?.status,"expired");
  assert.equal((await db.collection("staffInvitations").doc(id).get()).data().status,"expired");
  const events=await db.collection("staffManagementAudit").where("invitationId","==",id).get();
  assert.equal(events.size,1);
  assert.equal(events.docs[0].data().actorUid,"system:invitation-expiry");
  assert.equal(events.docs[0].data().outcome,"expired");
 });
});