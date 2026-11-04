import assert from "node:assert/strict";
import { describe,it } from "node:test";
import { createStaffPermissionAdministratorAuthorizer } from "../lib/server/admin-authorization-core.ts";
const token={uid:"designated-admin",email:"ADMIN@example.com",email_verified:true,admin:true};
function harness({designation={exists:true,data:()=>({active:true})},adminAccess={exists:true,data:()=>({active:true})},verifyError,lookupError}={}){
 const calls=[];
 const authorize=createStaffPermissionAdministratorAuthorizer({
  adminEmails:["admin@example.com"],
  adminAuth:{async verifyIdToken(value,revoked){calls.push({value,revoked});if(verifyError)throw verifyError;return token;}},
  adminDb:{collection(name){return{doc(uid){assert.equal(uid,token.uid);return{async get(){if(lookupError)throw lookupError;return name==="adminAccess"?adminAccess:designation;}};}};}},
 });
 return{authorize,calls};
}
const request=(bearer="id-token")=>new Request("https://example.test/api/admin/staff",{headers:bearer?{Authorization:`Bearer ${bearer}`}:{}});
describe("designated Staff Permission Administrator authorization",()=>{
 it("requires a bearer token and verifies token revocation",async()=>{
  const{authorize,calls}=harness();assert.equal((await authorize(request(null))).status,401);
  assert.deepEqual(await authorize(request()),{ok:true,uid:token.uid,email:"admin@example.com"});
  assert.deepEqual(calls,[{value:"id-token",revoked:true}]);
 });
 it("does not treat Admin status alone as permission-administrator authority",async()=>{
  const{authorize}=harness({designation:{exists:false,data:()=>undefined}});
  const result=await authorize(request());assert.equal(result.ok,false);assert.equal(result.status,403);
 });
 it("requires active Admin access as well as the designation",async()=>{
  const{authorize}=harness({adminAccess:{exists:true,data:()=>({active:false})}});
  const result=await authorize(request());assert.equal(result.ok,false);assert.equal(result.status,403);
 });
 it("fails closed when designation lookup is unavailable",async()=>{
  const{authorize}=harness({lookupError:new Error("offline")});assert.equal((await authorize(request())).status,503);
 });
 it("rejects invalid or revoked tokens",async()=>{
  const{authorize}=harness({verifyError:new Error("revoked")});assert.equal((await authorize(request())).status,401);
 });
});
