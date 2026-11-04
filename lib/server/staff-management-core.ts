import { createHash, randomBytes } from "node:crypto";
import type { Firestore, FieldValue } from "firebase-admin/firestore";
export const STAFF_ACTION_PERMISSIONS = ["operational_cost_definition.view","operational_cost_definition.propose","operational_cost_definition.validate","operational_cost_definition.finance_review","operational_cost_definition.approve"] as const;
export type StaffActionPermission = typeof STAFF_ACTION_PERMISSIONS[number];
export type StaffPermissionStatus = "active" | "suspended" | "revoked";
type Dependencies = { db: Firestore; serverTimestamp: () => FieldValue };
function requiredString(value: unknown, label: string, max = 500): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new TypeError(`${label} is required (maximum ${max} characters).`);
  return value.trim();
}
function permissionId(value: unknown): StaffActionPermission {
  if (typeof value !== "string" || !STAFF_ACTION_PERMISSIONS.includes(value as StaffActionPermission)) throw new TypeError("The requested staff permission is not supported.");
  return value as StaffActionPermission;
}
function iso(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("toDate" in value) || typeof (value as { toDate?: unknown }).toDate !== "function") return null;
  return (value as { toDate(): Date }).toDate().toISOString();
}
function tokenHash(token: string): string { return createHash("sha256").update(token).digest("hex"); }
export function createStaffManagementStore({ db, serverTimestamp }: Dependencies) {
  return {
    async listStaff() {
      const [staffSnapshot, invitationSnapshot, auditSnapshot] = await Promise.all([
        db.collection("staffDirectory").orderBy("updatedAt","desc").limit(100).get(),
        db.collection("staffInvitations").orderBy("createdAt","desc").limit(100).get(),
        db.collection("staffManagementAudit").orderBy("occurredAt","desc").limit(100).get(),
      ]);
      const expiredInvitations = invitationSnapshot.docs.filter(document => {
        const data = document.data();
        return data.status === "pending" && data.expiresAt?.toDate &&
          data.expiresAt.toDate().getTime() <= Date.now();
      });
      await Promise.all(expiredInvitations.map(async document => {
        const auditRef = db.collection("staffManagementAudit").doc();
        await db.runTransaction(async transaction => {
          const current = await transaction.get(document.ref);
          const data = current.data();
          if (!current.exists || data?.status !== "pending" ||
              !data.expiresAt?.toDate || data.expiresAt.toDate().getTime() > Date.now()) return;
          transaction.update(document.ref, { status: "expired", updatedAt: serverTimestamp() });
          transaction.create(auditRef, {
            action: "invitation.expired", actorUid: "system:invitation-expiry",
            targetEmail: data.email, invitationId: document.id,
            reason: "Invitation expiry was reached before activation.",
            outcome: "expired", occurredAt: serverTimestamp(),
          });
        });
      }));
      const staff = await Promise.all(staffSnapshot.docs.map(async document => {
        const permissions = await db.collection("staffActionPermissions").doc(document.id).collection("permissions").get();
        const data = document.data();
        return { uid: document.id, ...data, createdAt: iso(data.createdAt), updatedAt: iso(data.updatedAt), activatedAt: iso(data.activatedAt),
          permissions: permissions.docs.map(item => ({ permissionId: item.id, ...item.data(), assignedAt: iso(item.data().assignedAt), updatedAt: iso(item.data().updatedAt), revokedAt: iso(item.data().revokedAt), expiresAt: iso(item.data().expiresAt) })) };
      }));
      return {
        staff,
        invitations: invitationSnapshot.docs.map(document => {
          const data = document.data();
          const safeData = Object.fromEntries(Object.entries(data).filter(([key]) => key !== "tokenHash"));
          return {
            invitationId: document.id,
            ...safeData,
            status: data.status === "pending" && data.expiresAt?.toDate && data.expiresAt.toDate().getTime() <= Date.now() ? "expired" : data.status,
            createdAt: iso(data.createdAt),
            expiresAt: iso(data.expiresAt),
            revokedAt: iso(data.revokedAt),
            acceptedAt: iso(data.acceptedAt),
          };
        }),
        audit: auditSnapshot.docs.map(document => { const data=document.data(); return { auditId:document.id,...data,occurredAt:iso(data.occurredAt) }; }),
      };
    },
    async createInvitation(input: { email: unknown; expiresAt: unknown; reason: unknown; actorUid: string }) {
      const email=requiredString(input.email,"An invitation email",254).toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new TypeError("Enter a valid invitation email address.");
      const reason=requiredString(input.reason,"An invitation reason",1000);
      const expiry=new Date(requiredString(input.expiresAt,"An expiry date",80));
      if(!Number.isFinite(expiry.getTime())||expiry.getTime()<=Date.now()) throw new TypeError("The invitation expiry must be a valid future date and time.");
      const rawToken=randomBytes(32).toString("base64url");
      const invitationRef=db.collection("staffInvitations").doc(), auditRef=db.collection("staffManagementAudit").doc();
      await db.runTransaction(async transaction=>{
        const existingStaff = await transaction.get(
          db.collection("staffDirectory").where("email", "==", email)
        );
        if (existingStaff.docs.some(document => document.data().status === "active")) {
          throw new TypeError("This email already belongs to an active staff account.");
        }

        const existingInvitations = await transaction.get(
          db.collection("staffInvitations").where("email", "==", email)
        );
        for (const document of existingInvitations.docs) {
          const data = document.data();
          if (data.status !== "pending") continue;
          const storedExpiry = data.expiresAt;
          const expiryTime = storedExpiry && typeof storedExpiry.toDate === "function"
            ? storedExpiry.toDate().getTime()
            : storedExpiry instanceof Date ? storedExpiry.getTime() : 0;
          if (expiryTime > Date.now()) {
            throw new TypeError("A pending invitation already exists for this email address.");
          }
          const expiryAuditRef = db.collection("staffManagementAudit").doc();
          transaction.update(document.ref, { status: "expired", updatedAt: serverTimestamp() });
          transaction.create(expiryAuditRef, {
            action: "invitation.expired",
            actorUid: "system:invitation-expiry",
            targetEmail: email,
            invitationId: document.id,
            reason: "Invitation expiry was reached before a replacement invitation was created.",
            outcome: "expired",
            occurredAt: serverTimestamp(),
          });
        }

        transaction.create(invitationRef,{email,tokenHash:tokenHash(rawToken),status:"pending",createdBy:input.actorUid,reason,createdAt:serverTimestamp(),expiresAt:expiry});
        transaction.create(auditRef,{action:"invitation.created",actorUid:input.actorUid,targetEmail:email,invitationId:invitationRef.id,reason,outcome:"success",occurredAt:serverTimestamp()});
      });
      return {invitationId:invitationRef.id,token:rawToken,email,expiresAt:expiry.toISOString()};
    },
    async markInvitationDeliveryFailed(invitationId:string,actorUid:string,reason:string) {
      const invitationRef=db.collection("staffInvitations").doc(invitationId), auditRef=db.collection("staffManagementAudit").doc();
      await db.runTransaction(async transaction=>{
        const invitation=await transaction.get(invitationRef);
        if(!invitation.exists||invitation.data()?.status!=="pending") return;
        transaction.update(invitationRef,{status:"delivery_failed",deliveryFailure:reason.slice(0,300),updatedAt:serverTimestamp()});
        transaction.create(auditRef,{action:"invitation.delivery_failed",actorUid,invitationId,reason:"Invitation email delivery was not confirmed.",outcome:"failure",occurredAt:serverTimestamp()});
      });
    },
    async revokeInvitation(invitationId:string,actorUid:string,reasonValue:unknown) {
      const reason=requiredString(reasonValue,"A revocation reason",1000), invitationRef=db.collection("staffInvitations").doc(invitationId), auditRef=db.collection("staffManagementAudit").doc();
      return db.runTransaction(async transaction=>{
        const snapshot=await transaction.get(invitationRef);
        if(!snapshot.exists) return {outcome:"not_found" as const};
        const current=snapshot.data()!;
        if(current.status!=="pending") return {outcome:"not_pending" as const};
        transaction.update(invitationRef,{status:"revoked",revokedBy:actorUid,revokedAt:serverTimestamp(),revocationReason:reason});
        transaction.create(auditRef,{action:"invitation.revoked",actorUid,targetEmail:current.email,invitationId,reason,outcome:"success",occurredAt:serverTimestamp()});
        return {outcome:"revoked" as const};
      });
    },
    async setPermission(input:{targetUid:string;actorUid:string;permissionId:unknown;status:unknown;reason:unknown;expiresAt?:unknown}) {
      const targetUid=requiredString(input.targetUid,"A target staff UID",128);
      if(targetUid===input.actorUid) throw new TypeError("A permission administrator cannot assign or change their own operational permissions.");
      const permission=permissionId(input.permissionId);
      if(!["active","suspended","revoked"].includes(String(input.status))) throw new TypeError("Permission status must be active, suspended, or revoked.");
      const status=input.status as StaffPermissionStatus, reason=requiredString(input.reason,"A permission-change reason",1000);
      let expiry:Date|null=null;
      if(status==="active"&&input.expiresAt!==undefined&&input.expiresAt!==null&&input.expiresAt!==""){
        expiry=new Date(requiredString(input.expiresAt,"Permission expiry",80));
        if(!Number.isFinite(expiry.getTime())||expiry.getTime()<=Date.now()) throw new TypeError("Permission expiry must be a valid future date and time.");
      }
      const staffRef=db.collection("staffDirectory").doc(targetUid);
      const permissionRef=db.collection("staffActionPermissions").doc(targetUid).collection("permissions").doc(permission);
      const auditRef=db.collection("staffManagementAudit").doc();
      return db.runTransaction(async transaction=>{
        const staff=await transaction.get(staffRef);
        if(!staff.exists||staff.data()?.status!=="active") return {outcome:"staff_unavailable" as const};
        const current=await transaction.get(permissionRef);
        const action=status==="active"?(current.exists?"permission.changed":"permission.assigned"):status==="suspended"?"permission.suspended":"permission.revoked";
        const next:Record<string,unknown>={active:status==="active",status,assignedBy:current.exists?current.data()?.assignedBy??input.actorUid:input.actorUid,reason,updatedBy:input.actorUid,updatedAt:serverTimestamp()};
        if(!current.exists) next.assignedAt=serverTimestamp();
        if(status==="active") next.expiresAt=expiry;
        if(status==="revoked"){next.revokedBy=input.actorUid;next.revokedAt=serverTimestamp();} else {next.revokedBy=null;next.revokedAt=null;}
        transaction.set(permissionRef,next,{merge:true});
        transaction.create(auditRef,{action,actorUid:input.actorUid,targetUid,permissionId:permission,scope:"platform",reason,previousStatus:current.exists?current.data()?.status??"active":"unassigned",resultingStatus:status,expiresAt:expiry?.toISOString()??null,outcome:"success",occurredAt:serverTimestamp()});
        return {outcome:"updated" as const,status};
      });
    },
    async activateInvitation(input:{token:unknown;uid:string;email:unknown}) {
      const token=requiredString(input.token,"An invitation token",256), email=requiredString(input.email,"A verified account email",254).toLowerCase();
      const matches=await db.collection("staffInvitations").where("tokenHash","==",tokenHash(token)).limit(1).get();
      if(matches.empty) return {outcome:"invalid" as const};
      const invitationRef=matches.docs[0].ref, staffRef=db.collection("staffDirectory").doc(input.uid), auditRef=db.collection("staffManagementAudit").doc();
      return db.runTransaction(async transaction=>{
        const invitation=await transaction.get(invitationRef);
        if(!invitation.exists) return {outcome:"invalid" as const};
        const data=invitation.data()!;
        // A successful activation retry is idempotent only for the same
        // verified email and Firebase UID that originally accepted it.
        if(data.status==="accepted"&&data.acceptedBy===input.uid&&data.email===email) {
          return {outcome:"already_active" as const};
        }
        if(data.status!=="pending") return {outcome:"unavailable" as const};
        if(data.email!==email) return {outcome:"email_mismatch" as const};
        if(!data.expiresAt||typeof data.expiresAt.toDate!=="function"||data.expiresAt.toDate().getTime()<=Date.now()){
          transaction.update(invitationRef,{status:"expired",updatedAt:serverTimestamp()});
          transaction.create(auditRef,{action:"invitation.expired",actorUid:input.uid,targetEmail:email,invitationId:invitationRef.id,reason:"Invitation expiry was reached before activation.",outcome:"denied",occurredAt:serverTimestamp()});
          return {outcome:"expired" as const};
        }
        const existing=await transaction.get(staffRef);
        if(existing.exists) return {outcome:"already_active" as const};
        transaction.create(staffRef,{email,status:"active",invitationId:invitationRef.id,activatedAt:serverTimestamp(),updatedAt:serverTimestamp(),createdAt:serverTimestamp()});
        transaction.update(invitationRef,{status:"accepted",acceptedBy:input.uid,acceptedAt:serverTimestamp()});
        transaction.create(auditRef,{action:"invitation.accepted",actorUid:input.uid,targetUid:input.uid,targetEmail:email,invitationId:invitationRef.id,reason:"Verified invited account activated.",outcome:"success",occurredAt:serverTimestamp()});
        return {outcome:"activated" as const};
      });
    },
  };
}
