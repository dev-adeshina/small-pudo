import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after,before,describe,it } from "node:test";
import { deleteApp,initializeApp } from "firebase-admin/app";
import { FieldValue,getFirestore } from "firebase-admin/firestore";
import { createStaffManagementStore } from "../lib/server/staff-management-core.ts";
import { createOperationalCostDefinitionStore } from "../lib/server/operational-cost-definition-store-core.ts";
const enabled=Boolean(process.env.FIRESTORE_EMULATOR_HOST);
describe("staff invitation and permission lifecycle",{skip:!enabled},()=>{
 let app,db,store,costStore;const prefix=randomUUID(),actor=`perm-admin-${prefix}`,uid=`staff-${prefix}`,activeUid=`active-staff-${prefix}`,workspaceUid=`workspace-staff-${prefix}`,delegatorUid=`delegator-${prefix}`,delegateeUid=`delegatee-${prefix}`,thirdUid=`third-${prefix}`,invites=[];
 before(()=>{app=initializeApp({projectId:"demo-verilyft-staff-management"},`staff-management-${prefix}`);db=getFirestore(app);store=createStaffManagementStore({db,serverTimestamp:()=>FieldValue.serverTimestamp()});costStore=createOperationalCostDefinitionStore({db,serverTimestamp:()=>FieldValue.serverTimestamp()});});
 after(async()=>{
  for(const id of invites)await db.collection("staffInvitations").doc(id).delete();
  const staffUids=[uid,activeUid,workspaceUid,delegatorUid,delegateeUid,thirdUid];
  for(const staffUid of staffUids){
   const perms=await db.collection("staffActionPermissions").doc(staffUid).collection("permissions").listDocuments();
   await Promise.all(perms.map(d=>d.delete()));
   await db.collection("staffActionPermissions").doc(staffUid).delete();
   await db.collection("staffDirectory").doc(staffUid).delete();
  }
  const grants=await db.collection("staffActionPermissionGrants").get();
  await Promise.all(grants.docs.filter(d=>staffUids.includes(d.data().targetUid)).map(d=>d.ref.delete()));
  const audit=await db.collection("staffManagementAudit").get();
  await Promise.all(audit.docs.filter(d=>d.data().actorUid===actor||staffUids.includes(d.data().targetUid)).map(d=>d.ref.delete()));
  if(app)await deleteApp(app);
 });
 it("stores only a token hash and requires an explicit future expiry",async()=>{
  const expiry=new Date(Date.now()+3600000).toISOString();
  const created=await store.createInvitation({email:"Invited.Staff@example.com",expiresAt:expiry,reason:"Launch operations staff",actorUid:actor});invites.push(created.invitationId);
  const snap=await db.collection("staffInvitations").doc(created.invitationId).get();
  assert.equal(snap.data().email,"invited.staff@example.com");assert.equal(snap.data().status,"pending");assert.notEqual(snap.data().tokenHash,created.token);assert.equal("token" in snap.data(),false);assert.equal(snap.data().expiresAt.toDate().toISOString(),expiry);
  const listing=await store.listStaff();const listedInvite=listing.invitations.find(item=>item.invitationId===created.invitationId);assert.ok(listedInvite);assert.equal("tokenHash" in listedInvite,false);assert.equal("token" in listedInvite,false);
  await assert.rejects(store.createInvitation({email:"staff@example.com",expiresAt:new Date(Date.now()-1000).toISOString(),reason:"expired",actorUid:actor}),TypeError);
 });
 it("prevents duplicate pending invitations and invitations for active staff",async()=>{
  const invite=await store.createInvitation({email:"staff.duplicate@example.com",expiresAt:new Date(Date.now()+3600000).toISOString(),reason:"Duplicate invitation test",actorUid:actor});invites.push(invite.invitationId);
  await assert.rejects(
   store.createInvitation({email:"staff.duplicate@example.com",expiresAt:new Date(Date.now()+7200000).toISOString(),reason:"Second invitation",actorUid:actor}),
   /pending invitation already exists/
  );
  await store.revokeInvitation(invite.invitationId,actor,"Close duplicate test");
  const replacement=await store.createInvitation({email:"staff.duplicate@example.com",expiresAt:new Date(Date.now()+3600000).toISOString(),reason:"Replacement invitation test",actorUid:actor});invites.push(replacement.invitationId);
  await store.revokeInvitation(replacement.invitationId,actor,"Close replacement test");
  await db.collection("staffDirectory").doc(activeUid).set({email:"staff.already-active@example.com",status:"active"});
  await assert.rejects(
   store.createInvitation({email:"staff.already-active@example.com",expiresAt:new Date(Date.now()+3600000).toISOString(),reason:"Active account test",actorUid:actor}),
   /already belongs to an active staff account/
  );
 });

 it("activates only the matching invited identity and grants no permissions",async()=>{
  const invite=await store.createInvitation({email:"staff.activate@example.com",expiresAt:new Date(Date.now()+3600000).toISOString(),reason:"Activation test",actorUid:actor});invites.push(invite.invitationId);
  assert.deepEqual(await store.activateInvitation({token:invite.token,uid,email:"other@example.com"}),{outcome:"email_mismatch"});
  assert.deepEqual(await store.activateInvitation({token:invite.token,uid,email:"staff.activate@example.com"}),{outcome:"activated"});
  assert.equal((await db.collection("staffDirectory").doc(uid).get()).data().status,"active");
  assert.equal((await db.collection("staffActionPermissions").doc(uid).collection("permissions").get()).empty,true);
  assert.deepEqual(await store.activateInvitation({token:invite.token,uid,email:"staff.activate@example.com"}),{outcome:"already_active"});
 });
 it("detects and activates a pending invitation from the verified staff workspace identity",async()=>{
  const email="staff.workspace-activation@example.com";
  const invite=await store.createInvitation({email,expiresAt:new Date(Date.now()+3600000).toISOString(),reason:"Workspace activation test",actorUid:actor});invites.push(invite.invitationId);
  assert.deepEqual(await store.getInvitationStatus({uid:workspaceUid,email}),{status:"pending"});
  assert.deepEqual(await store.activatePendingInvitation({uid:workspaceUid,email}),{outcome:"activated"});
  assert.deepEqual(await store.getInvitationStatus({uid:workspaceUid,email}),{status:"active"});
  assert.deepEqual(await store.activatePendingInvitation({uid:workspaceUid,email}),{outcome:"already_active"});
  assert.equal((await db.collection("staffActionPermissions").doc(workspaceUid).collection("permissions").get()).empty,true);
 });
 it("assigns, expires, suspends and revokes only approved permissions with audit events",async()=>{
  await db.collection("staffDirectory").doc(uid).set({email:"staff.activate@example.com",status:"active",updatedAt:FieldValue.serverTimestamp()});
  const id="operational_cost_definition.view";
  await store.setPermission({targetUid:uid,actorUid:actor,permissionId:id,status:"active",reason:"View cost definitions"});
  assert.equal(await costStore.hasPermission(uid,id),true);
  const ref=db.collection("staffActionPermissions").doc(uid).collection("permissions").doc(id);
  const grantQuery=await db.collection("staffActionPermissionGrants").where("targetUid","==",uid).get();
  const rootGrant=grantQuery.docs.find(document=>document.data().permissionId===id);
  await ref.update({expiresAt:new Date(Date.now()-1000)});
  await rootGrant.ref.update({expiresAt:new Date(Date.now()-1000)});
  assert.equal(await costStore.hasPermission(uid,id),false);
  await store.setPermission({targetUid:uid,actorUid:actor,permissionId:id,status:"active",reason:"Renew access",expiresAt:new Date(Date.now()+3600000).toISOString()});
  assert.equal(await costStore.hasPermission(uid,id),true);
  await store.setPermission({targetUid:uid,actorUid:actor,permissionId:id,status:"suspended",reason:"Temporary suspension"});assert.equal(await costStore.hasPermission(uid,id),false);
  await store.setPermission({targetUid:uid,actorUid:actor,permissionId:id,status:"revoked",reason:"Role ended"});assert.equal(await costStore.hasPermission(uid,id),false);
  await assert.rejects(store.setPermission({targetUid:actor,actorUid:actor,permissionId:id,status:"active",reason:"Self grant"}),/cannot assign or change their own/);
  await assert.rejects(store.setPermission({targetUid:uid,actorUid:actor,permissionId:"unknown.permission",status:"active",reason:"Invalid catalogue"}),TypeError);
  const events=await db.collection("staffManagementAudit").where("permissionId","==",id).get();assert.equal(events.size,4);assert.ok(events.docs.every(d=>d.data().actorUid===actor&&d.data().reason));
 });
 it("enforces activity-specific delegation lineage and upstream revocation",async()=>{
  for(const staffUid of [delegatorUid,delegateeUid,thirdUid]){
   await db.collection("staffDirectory").doc(staffUid).set({email:`${staffUid}@example.test`,status:"active"});
  }
  const id="pudo_location.register";
  const rootExpiry=new Date(Date.now()+2*3600000);
  const root=await store.setPermission({targetUid:delegatorUid,actorUid:actor,permissionId:id,status:"active",reason:"Authorise PUDO registration delegation",expiresAt:rootExpiry.toISOString(),delegable:true});
  assert.equal(root.delegable,true);
  await assert.rejects(
   store.delegatePermission({targetUid:thirdUid,actorUid:delegatorUid,permissionId:id,reason:"Attempt to exceed authority",expiresAt:new Date(Date.now()+3*3600000).toISOString()}),
   /cannot outlive/
  );
  await assert.rejects(
   store.delegatePermission({targetUid:thirdUid,actorUid:delegatorUid,permissionId:"operational_cost_definition.view",reason:"Attempt to escalate into another activity"}),
   /explicitly delegable/
  );
  const first=await store.delegatePermission({targetUid:delegateeUid,actorUid:delegatorUid,permissionId:id,reason:"Delegate registration activity",expiresAt:new Date(Date.now()+3600000).toISOString(),allowFurtherDelegation:true});
  assert.equal(first.outcome,"delegated");
  assert.equal(await costStore.hasPermission(delegateeUid,id),true);
  const second=await store.delegatePermission({targetUid:thirdUid,actorUid:delegateeUid,permissionId:id,reason:"Sub-delegate registration activity",allowFurtherDelegation:false});
  assert.equal(second.outcome,"delegated");
  assert.equal(second.expiresAt,first.expiresAt);
  assert.equal(await costStore.hasPermission(thirdUid,id),true);
  await assert.rejects(
   store.delegatePermission({targetUid:delegateeUid,actorUid:delegateeUid,permissionId:id,reason:"Self delegation"}),
   /themselves/
  );
  await store.setPermission({targetUid:delegatorUid,actorUid:actor,permissionId:id,status:"revoked",reason:"Revoke upstream authority"});
  assert.equal(await costStore.hasPermission(delegatorUid,id),false);
  assert.equal(await costStore.hasPermission(delegateeUid,id),false);
  assert.equal(await costStore.hasPermission(thirdUid,id),false);
  const descendants=await db.collection("staffActionPermissionGrants").where("rootGrantId","==",root.grantId).get();
  assert.equal(descendants.size,3);
  assert.ok(descendants.docs.filter(d=>d.id!==root.grantId).every(d=>d.data().status==="active"));
  await assert.rejects(
   store.delegatePermission({targetUid:thirdUid,actorUid:delegateeUid,permissionId:id,reason:"Attempt after upstream revocation"}),
   /explicitly delegable/
  );
 });
 it("lets a grantor revoke a delegation and invalidates its descendants",async()=>{
  for(const staffUid of [delegatorUid,delegateeUid,thirdUid]){
   await db.collection("staffDirectory").doc(staffUid).set({email:`${staffUid}@example.test`,status:"active"});
  }
  const id="operational_cost_definition.view";
  await store.setPermission({targetUid:delegatorUid,actorUid:actor,permissionId:id,status:"active",reason:"Delegation revocation test",delegable:true});
  const first=await store.delegatePermission({targetUid:delegateeUid,actorUid:delegatorUid,permissionId:id,reason:"Grant first level",allowFurtherDelegation:true});
  const second=await store.delegatePermission({targetUid:thirdUid,actorUid:delegateeUid,permissionId:id,reason:"Grant second level"});
  assert.equal(await costStore.hasPermission(thirdUid,id),true);
  await assert.rejects(
   store.revokeDelegatedPermission({grantId:first.grantId,actorUid:delegateeUid,reason:"Not the grantor"}),
   /personally issued/
  );
  assert.deepEqual(
   await store.revokeDelegatedPermission({grantId:first.grantId,actorUid:delegatorUid,reason:"Delegation no longer required"}),
   {outcome:"revoked"}
  );
  assert.equal(await costStore.hasPermission(delegateeUid,id),false);
  assert.equal(await costStore.hasPermission(thirdUid,id),false);
  const secondGrant=await db.collection("staffActionPermissionGrants").doc(second.grantId).get();
  assert.equal(secondGrant.data().status,"active");
  const events=await db.collection("staffManagementAudit").where("grantId","==",first.grantId).get();
  assert.equal(events.docs.filter(document=>document.data().action==="permission.delegation_revoked").length,1);
 });
 it("does not allow delegation from an ordinary non-delegable assignment",async()=>{
  await db.collection("staffDirectory").doc(workspaceUid).set({email:"nondelegable@example.test",status:"active"});
  await db.collection("staffDirectory").doc(thirdUid).set({email:"recipient@example.test",status:"active"});
  await store.setPermission({targetUid:workspaceUid,actorUid:actor,permissionId:"pudo_location.register",status:"active",reason:"Registration activity without delegation"});
  await assert.rejects(
   store.delegatePermission({targetUid:thirdUid,actorUid:workspaceUid,permissionId:"pudo_location.register",reason:"Should be denied"}),
   /explicitly delegable/
  );
 });
 it("revokes only pending invitations and records the reason",async()=>{
  const invite=await store.createInvitation({email:"staff.revoke@example.com",expiresAt:new Date(Date.now()+3600000).toISOString(),reason:"Revocation test",actorUid:actor});invites.push(invite.invitationId);
  assert.deepEqual(await store.revokeInvitation(invite.invitationId,actor,"No longer required"),{outcome:"revoked"});
  assert.deepEqual(await store.revokeInvitation(invite.invitationId,actor,"Repeat"),{outcome:"not_pending"});
  assert.equal((await db.collection("staffInvitations").doc(invite.invitationId).get()).data().status,"revoked");
 });
});