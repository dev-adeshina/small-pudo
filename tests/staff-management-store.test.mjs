import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after,before,describe,it } from "node:test";
import { deleteApp,initializeApp } from "firebase-admin/app";
import { FieldValue,getFirestore } from "firebase-admin/firestore";
import { createStaffManagementStore } from "../lib/server/staff-management-core.ts";
import { createOperationalCostDefinitionStore } from "../lib/server/operational-cost-definition-store-core.ts";
const enabled=Boolean(process.env.FIRESTORE_EMULATOR_HOST);
describe("staff invitation and permission lifecycle",{skip:!enabled},()=>{
 let app,db,store,costStore;const prefix=randomUUID(),actor=`perm-admin-${prefix}`,uid=`staff-${prefix}`,activeUid=`active-staff-${prefix}`,invites=[];
 before(()=>{app=initializeApp({projectId:"demo-verilyft-staff-management"},`staff-management-${prefix}`);db=getFirestore(app);store=createStaffManagementStore({db,serverTimestamp:()=>FieldValue.serverTimestamp()});costStore=createOperationalCostDefinitionStore({db,serverTimestamp:()=>FieldValue.serverTimestamp()});});
 after(async()=>{
  for(const id of invites)await db.collection("staffInvitations").doc(id).delete();
  const perms=await db.collection("staffActionPermissions").doc(uid).collection("permissions").listDocuments();await Promise.all(perms.map(d=>d.delete()));
  await db.collection("staffActionPermissions").doc(uid).delete();await db.collection("staffDirectory").doc(uid).delete();await db.collection("staffDirectory").doc(activeUid).delete();
  const audit=await db.collection("staffManagementAudit").where("actorUid","==",actor).get();
  const targetAudit=await db.collection("staffManagementAudit").where("targetUid","==",uid).get();
  await Promise.all([...audit.docs,...targetAudit.docs].map(d=>d.ref.delete()));
  if(app)await deleteApp(app);
 });
 it("stores only a token hash and requires an explicit future expiry",async()=>{
  const expiry=new Date(Date.now()+3600000).toISOString();
  const created=await store.createInvitation({email:"Invited.Staff@example.com",expiresAt:expiry,reason:"Launch operations staff",actorUid:actor});invites.push(created.invitationId);
  const snap=await db.collection("staffInvitations").doc(created.invitationId).get();
  assert.equal(snap.data().email,"invited.staff@example.com");assert.equal(snap.data().status,"pending");assert.notEqual(snap.data().tokenHash,created.token);assert.equal("token" in snap.data(),false);assert.equal(snap.data().expiresAt.toDate().toISOString(),expiry);
  await assert.rejects(store.createInvitation({email:"staff@example.com",expiresAt:new Date(Date.now()-1000).toISOString(),reason:"expired",actorUid}),TypeError);
 });
 it("prevents duplicate pending invitations and invitations for active staff",async()=>{
  const invite=await store.createInvitation({email:"staff.duplicate@example.com",expiresAt:new Date(Date.now()+3600000).toISOString(),reason:"Duplicate invitation test",actorUid});invites.push(invite.invitationId);
  await assert.rejects(
   store.createInvitation({email:"staff.duplicate@example.com",expiresAt:new Date(Date.now()+7200000).toISOString(),reason:"Second invitation",actorUid}),
   /pending invitation already exists/
  );
  await store.revokeInvitation(invite.invitationId,actor,"Close duplicate test");
  const replacement=await store.createInvitation({email:"staff.duplicate@example.com",expiresAt:new Date(Date.now()+3600000).toISOString(),reason:"Replacement invitation test",actorUid});invites.push(replacement.invitationId);
  await store.revokeInvitation(replacement.invitationId,actor,"Close replacement test");
  await db.collection("staffDirectory").doc(activeUid).set({email:"staff.already-active@example.com",status:"active"});
  await assert.rejects(
   store.createInvitation({email:"staff.already-active@example.com",expiresAt:new Date(Date.now()+3600000).toISOString(),reason:"Active account test",actorUid}),
   /already belongs to an active staff account/
  );
 });

 it("activates only the matching invited identity and grants no permissions",async()=>{
  const invite=await store.createInvitation({email:"staff.activate@example.com",expiresAt:new Date(Date.now()+3600000).toISOString(),reason:"Activation test",actorUid});invites.push(invite.invitationId);
  assert.deepEqual(await store.activateInvitation({token:invite.token,uid,email:"other@example.com"}),{outcome:"email_mismatch"});
  assert.deepEqual(await store.activateInvitation({token:invite.token,uid,email:"staff.activate@example.com"}),{outcome:"activated"});
  assert.equal((await db.collection("staffDirectory").doc(uid).get()).data().status,"active");
  assert.equal((await db.collection("staffActionPermissions").doc(uid).collection("permissions").get()).empty,true);
  assert.deepEqual(await store.activateInvitation({token:invite.token,uid,email:"staff.activate@example.com"}),{outcome:"already_active"});
 });
 it("assigns, expires, suspends and revokes only approved permissions with audit events",async()=>{
  await db.collection("staffDirectory").doc(uid).set({email:"staff.activate@example.com",status:"active",updatedAt:FieldValue.serverTimestamp()});
  const id="operational_cost_definition.view";
  await store.setPermission({targetUid:uid,actorUid:actor,permissionId:id,status:"active",reason:"View cost definitions"});
  assert.equal(await costStore.hasPermission(uid,id),true);
  const ref=db.collection("staffActionPermissions").doc(uid).collection("permissions").doc(id);
  await ref.update({expiresAt:new Date(Date.now()-1000)});assert.equal(await costStore.hasPermission(uid,id),false);
  await store.setPermission({targetUid:uid,actorUid:actor,permissionId:id,status:"active",reason:"Renew access",expiresAt:new Date(Date.now()+3600000).toISOString()});
  assert.equal(await costStore.hasPermission(uid,id),true);
  await store.setPermission({targetUid:uid,actorUid:actor,permissionId:id,status:"suspended",reason:"Temporary suspension"});assert.equal(await costStore.hasPermission(uid,id),false);
  await store.setPermission({targetUid:uid,actorUid:actor,permissionId:id,status:"revoked",reason:"Role ended"});assert.equal(await costStore.hasPermission(uid,id),false);
  await assert.rejects(store.setPermission({targetUid:actor,actorUid:actor,permissionId:id,status:"active",reason:"Self grant"}),/cannot assign or change their own/);
  await assert.rejects(store.setPermission({targetUid:uid,actorUid:actor,permissionId:"unknown.permission",status:"active",reason:"Invalid catalogue"}),TypeError);
  const events=await db.collection("staffManagementAudit").where("permissionId","==",id).get();assert.equal(events.size,4);assert.ok(events.docs.every(d=>d.data().actorUid===actor&&d.data().reason));
 });
 it("revokes only pending invitations and records the reason",async()=>{
  const invite=await store.createInvitation({email:"staff.revoke@example.com",expiresAt:new Date(Date.now()+3600000).toISOString(),reason:"Revocation test",actorUid:actor});invites.push(invite.invitationId);
  assert.deepEqual(await store.revokeInvitation(invite.invitationId,actor,"No longer required"),{outcome:"revoked"});
  assert.deepEqual(await store.revokeInvitation(invite.invitationId,actor,"Repeat"),{outcome:"not_pending"});
  assert.equal((await db.collection("staffInvitations").doc(invite.invitationId).get()).data().status,"revoked");
 });
});