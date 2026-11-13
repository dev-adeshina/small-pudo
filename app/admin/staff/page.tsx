"use client";
import Link from "next/link";
import { useCallback,useEffect,useState,type FormEvent } from "react";
import { ArrowLeft,RefreshCw,UserPlus,Users } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { verifyAdminAccess } from "@/lib/admin-auth";
const permissions=[
    "operational_cost_definition.view",
    "operational_cost_definition.propose",
    "operational_cost_definition.validate",
    "operational_cost_definition.finance_review",
    "operational_cost_definition.approve",
    "pudo_location.register",
    "pudo_location.verify",
    "pudo_location.activate",
    "commercial_pricing.view",
    "commercial_pricing.propose",
] as const;
type Staff={uid:string;email:string;status:string;permissions:Array<{permissionId:string;status:string;effectiveActive?:boolean;reason?:string;expiresAt?:string|null}>};
type Invite={invitationId:string;email:string;status:string;expiresAt:string|null};
export default function StaffManagementPage(){
 const [loading,setLoading]=useState(true),[authorized,setAuthorized]=useState(false),[staff,setStaff]=useState<Staff[]>([]),[invitations,setInvitations]=useState<Invite[]>([]),[audit,setAudit]=useState<Array<Record<string,unknown>>>([]);
 const [email,setEmail]=useState(""),[expiresAt,setExpiresAt]=useState(""),[inviteReason,setInviteReason]=useState("");
 const [targetUid,setTargetUid]=useState(""),[permissionId,setPermissionId]=useState<string>(permissions[0]),[permissionStatus,setPermissionStatus]=useState("active"),[permissionExpiresAt,setPermissionExpiresAt]=useState(""),[permissionReason,setPermissionReason]=useState(""),[allowDelegation,setAllowDelegation]=useState(false);
 const [feedback,setFeedback]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const api=useCallback(async(path:string,method="GET",body?:unknown)=>{
  const user=auth.currentUser;if(!user)throw new Error("Your Admin session has ended. Sign in again.");
  const response=await fetch(path,{method,headers:{Authorization:`Bearer ${await user.getIdToken()}`,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:"no-store"});
  const result=await response.json();if(!response.ok)throw new Error(result.error??"The request could not be completed.");return result;
 },[]);
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{const result=await api("/api/admin/staff");setStaff(result.staff);setInvitations(result.invitations);setAudit(result.audit);setAuthorized(true);}
  catch(cause){setAuthorized(false);setError(cause instanceof Error?cause.message:"Unable to load staff management.");}
  finally{setLoading(false);}
 },[api]);
 useEffect(()=>{let active=true;const unsubscribe=onAuthStateChanged(auth,async user=>{
  if(!user){window.location.replace("/admin/sign-in");return;}
  try{await verifyAdminAccess(user);if(active)await load();}
  catch{if(active){setLoading(false);setError("Admin workspace access could not be verified.");}}
 });return()=>{active=false;unsubscribe();};},[load]);
 async function submitInvitation(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");setFeedback("");
  try{await api("/api/admin/staff","POST",{email,expiresAt:new Date(expiresAt).toISOString(),reason:inviteReason});setEmail("");setExpiresAt("");setInviteReason("");setFeedback("Invitation email sent successfully.");await load();}
  catch(cause){setError(cause instanceof Error?cause.message:"Invitation could not be sent.");}finally{setBusy(false);}
 }
 async function changePermission(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!targetUid)return;setBusy(true);setError("");setFeedback("");
  try{await api(`/api/admin/staff/${encodeURIComponent(targetUid)}`,"PATCH",{permissionId,status:permissionStatus,reason:permissionReason,expiresAt:permissionStatus==="active"&&permissionExpiresAt?new Date(permissionExpiresAt).toISOString():null,delegable:permissionStatus==="active"&&allowDelegation});setPermissionReason("");setAllowDelegation(false);setPermissionExpiresAt("");setFeedback("Staff permission updated and audited.");await load();}
  catch(cause){setError(cause instanceof Error?cause.message:"Permission update failed.");}finally{setBusy(false);}
 }
 async function revokeInvitation(id:string){
  const reason=window.prompt("Reason for revoking this invitation:");if(!reason?.trim())return;setBusy(true);setError("");setFeedback("");
  try{await api(`/api/admin/staff/invitations/${encodeURIComponent(id)}`,"PATCH",{reason});setFeedback("Invitation revoked.");await load();}
  catch(cause){setError(cause instanceof Error?cause.message:"Invitation revocation failed.");}finally{setBusy(false);}
 }
 return <main className="admin-page"><header className="admin-header"><Link href="/admin" className="admin-logo">VERILyFT / ADMIN</Link><Link href="/admin" className="admin-action"><ArrowLeft size={16}/> Dashboard</Link></header>
 <div className="admin-shell cost-admin-shell">
  <div className="cost-page-topline"><span className="section-label">ADMIN / STAFF ACCESS</span><button className="cost-secondary-button" type="button" onClick={load} disabled={loading||busy}><RefreshCw size={16}/> Refresh</button></div>
  <div className="cost-page-heading"><div><h1>Staff <em>management.</em></h1><p>Invite staff, manage approved platform activity permissions, and review attributable access history.</p></div></div>
  <div className="cost-boundary-note"><Users size={22}/><div><strong>Restricted administration</strong><p>Admin status alone does not grant staff permission-management authority. Staff activation grants no operational permissions. Supported assignments have platform-wide scope. Delegation is granted separately for each activity.</p></div></div>
  {feedback&&<div className="cost-feedback cost-feedback-success">{feedback}</div>}{error&&<div className="cost-feedback cost-feedback-error">{error}</div>}
  {loading?<div className="cost-panel">Loading staff access records…</div>:!authorized?<div className="cost-panel"><h2>Permission administrator access required</h2><p className="cost-subtitle">{error||"This account is not technically designated to manage staff access."}</p></div>:<>
   <section className="cost-panel"><div className="cost-panel-heading"><div><span className="section-label">01 / INVITATIONS</span><h2>Invite a staff member</h2></div><UserPlus size={22}/></div>
    <form className="cost-form-grid" onSubmit={submitInvitation}>
     <label className="cost-field">Staff email<input type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
     <label className="cost-field">Invitation expiry<input type="datetime-local" required value={expiresAt} onChange={e=>setExpiresAt(e.target.value)}/><small>Choose expiry explicitly; no default duration is imposed.</small></label>
     <label className="cost-field cost-field-wide">Reason for invitation<textarea required maxLength={1000} value={inviteReason} onChange={e=>setInviteReason(e.target.value)}/></label>
     <div className="cost-form-actions cost-field-wide"><button className="cost-primary-button" disabled={busy}>Send invitation</button></div>
    </form>
   </section>
   <section className="cost-panel" style={{marginTop:22}}><div className="cost-panel-heading"><div><span className="section-label">02 / STAFF DIRECTORY</span><h2>Staff accounts</h2></div><span className="cost-state-badge">{staff.length} records</span></div>
    {!staff.length?<div className="cost-empty"><strong>No staff accounts yet</strong><p>Invited staff appear here after verified activation.</p></div>:staff.map(person=><article className="cost-readonly-row" key={person.uid}><strong>{person.email}</strong><span>Account: {person.status} · UID: {person.uid}</span>
     <div className="cost-version-list">{permissions.map(id=>{const item=person.permissions.find(p=>p.permissionId===id);return <div className="cost-version-row" key={id}><span>{id}</span><strong>{item?(item.effectiveActive?"active":item.status==="active"?"inactive":item.status):"unassigned"}</strong><small>{item?.expiresAt?`Expires ${new Date(item.expiresAt).toLocaleString()}`:item?.reason??"No assignment"}</small></div>;})}</div>
     <button className="cost-secondary-button" type="button" onClick={()=>setTargetUid(person.uid)}>Manage permissions</button>
    </article>)}
   </section>
   <section className="cost-panel" style={{marginTop:22}}><div className="cost-panel-heading"><div><span className="section-label">03 / PERMISSION CONTROL</span><h2>Assign or change access</h2></div></div>
    <form className="cost-form-grid" onSubmit={changePermission}>
     <label className="cost-field cost-field-wide">Target staff member<select required value={targetUid} onChange={e=>setTargetUid(e.target.value)}><option value="">Select active staff</option>{staff.filter(p=>p.status==="active").map(p=><option value={p.uid} key={p.uid}>{p.email}</option>)}</select></label>
     <label className="cost-field">Permission<select value={permissionId} onChange={e=>setPermissionId(e.target.value)}>{permissions.map(id=><option key={id}>{id}</option>)}</select></label>
     <label className="cost-field">New status<select value={permissionStatus} onChange={e=>setPermissionStatus(e.target.value)}><option value="active">Active / assign</option><option value="suspended">Suspend</option><option value="revoked">Revoke</option></select></label>
     {permissionStatus==="active"&&<label className="cost-field cost-field-wide">Permission expiry (optional)<input type="datetime-local" value={permissionExpiresAt} onChange={e=>setPermissionExpiresAt(e.target.value)}/><small>Leave blank for no scheduled expiry.</small></label>}
     <label className="cost-field cost-field-wide"><span><input type="checkbox" checked={allowDelegation} onChange={e=>setAllowDelegation(e.target.checked)} disabled={permissionStatus!=="active"}/> Allow this staff member to delegate this activity to another staff member</span><small>Delegation remains limited to this activity and cannot outlive this grant.</small></label><label className="cost-field cost-field-wide">Reason<textarea required maxLength={1000} value={permissionReason} onChange={e=>setPermissionReason(e.target.value)}/></label>
     <div className="cost-form-actions cost-field-wide"><button className="cost-primary-button" disabled={busy||!targetUid}>Save permission change</button></div>
    </form><p className="cost-footer-note">Self-assignment is denied. The server validates the active designation, staff account and approved activity catalogue. Delegation authority is explicit, activity-specific and audited.</p>
   </section>
   <section className="cost-panel" style={{marginTop:22}}><div className="cost-panel-heading"><div><span className="section-label">04 / INVITATION HISTORY</span><h2>Invitations</h2></div></div>
    {!invitations.length?<div className="cost-empty"><strong>No invitations</strong></div>:invitations.map(invite=><div className="cost-version-row" key={invite.invitationId}><strong>{invite.email}</strong><span>{invite.status}</span><small>Expires: {invite.expiresAt?new Date(invite.expiresAt).toLocaleString():"—"}</small>{invite.status==="pending"&&<button type="button" className="cost-danger-button" disabled={busy} onClick={()=>revokeInvitation(invite.invitationId)}>Revoke</button>}</div>)}
   </section>
   <section className="cost-panel" style={{marginTop:22}}><div className="cost-panel-heading"><div><span className="section-label">05 / AUDIT HISTORY</span><h2>Recent access events</h2></div></div>
    {!audit.length?<div className="cost-empty"><strong>No access events recorded</strong></div>:<div className="cost-event-list">{audit.map((event,index)=><article className="cost-event" key={String(event.auditId??index)}><span className="cost-event-marker"/><div><strong>{String(event.action)}</strong><small>Actor: {String(event.actorUid)} · Target: {String(event.targetUid??event.targetEmail??"—")} · Permission: {String(event.permissionId??"—")} · Scope: {String(event.scope??"—")} · {event.occurredAt?new Date(String(event.occurredAt)).toLocaleString():"time unavailable"}</small><p>{String(event.reason)} · Outcome: {String(event.outcome)}</p></div></article>)}</div>}
   </section>
  </>}
 </div></main>;
}
