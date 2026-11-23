import { createHash } from "node:crypto";
import type { FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import { hasStaffActionPermissionInTransaction } from "./staff-permission-grants-core.ts";

const VIEW = "pudo_network_connection.view";
const PROPOSE = "pudo_network_connection.propose";
const APPROVE = "pudo_network_connection.approve";
const LOCATION_ID = /^[A-Za-z0-9_-]{1,128}$/;

type Decision = "approve" | "reject" | "suspend" | "reactivate";

function assertUid(value: string) {
  if (typeof value !== "string" || !LOCATION_ID.test(value)) throw new TypeError("A valid authenticated staff identity is required.");
}
function assertLocationId(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !LOCATION_ID.test(value)) throw new TypeError(label + " must be a valid PUDO location ID.");
}
function requiredReason(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 1000) throw new TypeError("A reason of 1–1000 characters is required.");
  return value.trim();
}
async function requirePermission(db: Firestore, transaction: Transaction, uid: string, permission: string) {
  if (!await hasStaffActionPermissionInTransaction(transaction, db, uid, permission)) {
    throw new Error("You are not authorised to perform this PUDO network action.");
  }
}
async function readEligibleLocation(db: Firestore, transaction: Transaction, locationId: string, label: string) {
  const [candidate, activation, verification, capabilities] = await Promise.all([
    transaction.get(db.collection("pudoLocations").doc(locationId)),
    transaction.get(db.collection("pudoLocationActivations").doc(locationId)),
    transaction.get(db.collection("pudoLocationVerifications").doc(locationId)),
    transaction.get(db.collection("pudoLocationCapabilities").doc(locationId)),
  ]);
  if (!candidate.exists || candidate.data()?.lifecycle !== "active" ||
      !activation.exists || activation.data()?.status !== "active") {
    throw new Error(label + " PUDO location must be activated and operationally active.");
  }
  if (verification.data()?.status !== "approved_to_activate") {
    throw new Error(label + " PUDO location must have Operations verification approval.");
  }
  const enabled = capabilities.data()?.capabilities;
  if (!Array.isArray(enabled)) throw new Error(label + " PUDO capabilities could not be confirmed.");
  return { candidate: candidate.data()!, capabilities: enabled.filter((item): item is string => typeof item === "string") };
}
function snapshotTime(value: unknown): string | null {
  if (value && typeof value === "object" && "toDate" in value &&
      typeof (value as {toDate?: unknown}).toDate === "function") {
    return (value as {toDate(): Date}).toDate().toISOString();
  }
  return null;
}

export function createPudoNetworkConnectionStore({ db, serverTimestamp }: {
  db: Firestore; serverTimestamp: () => FieldValue;
}) {
  const connections = db.collection("pudoNetworkConnections");

  return {
    async list(actorUid: string) {
      assertUid(actorUid);
      await db.runTransaction(transaction => requirePermission(db, transaction, actorUid, VIEW));
      const snapshot = await connections.orderBy("updatedAt", "desc").limit(200).get();
      return snapshot.docs.map(document => {
        const data = document.data();
        return {
          connectionId: document.id,
          originLocationId: data.originLocationId,
          originName: data.originName ?? "",
          destinationLocationId: data.destinationLocationId,
          destinationName: data.destinationName ?? "",
          status: data.status,
          version: data.version ?? 1,
          reason: data.reason ?? "",
          proposedBy: data.proposedBy ?? "",
          proposedAt: snapshotTime(data.proposedAt),
          reviewedBy: data.reviewedBy ?? null,
          reviewedAt: snapshotTime(data.reviewedAt),
          reviewReason: data.reviewReason ?? null,
          updatedAt: snapshotTime(data.updatedAt),
        };
      });
    },

    async listEligibleLocations(actorUid: string) {
      assertUid(actorUid);
      const canPropose = await db.runTransaction(transaction => hasStaffActionPermissionInTransaction(transaction, db, actorUid, PROPOSE));
      if (!canPropose) return [];
      const candidates = await db.collection("pudoLocations").where("lifecycle", "==", "active").limit(200).get();
      const rows = await Promise.all(candidates.docs.map(async document => {
        const id = document.id;
        const [activation, verification, capabilities] = await Promise.all([
          db.collection("pudoLocationActivations").doc(id).get(),
          db.collection("pudoLocationVerifications").doc(id).get(),
          db.collection("pudoLocationCapabilities").doc(id).get(),
        ]);
        if (!activation.exists || activation.data()?.status !== "active" ||
            verification.data()?.status !== "approved_to_activate") return null;
        const enabled = capabilities.data()?.capabilities;
        if (!Array.isArray(enabled) || !enabled.includes("parcel_handover") && !enabled.includes("custody_acceptance")) return null;
        const data = document.data();
        return { locationId: id, name: typeof data.name === "string" ? data.name : "PUDO location",
          address: typeof data.address === "string" ? data.address : "",
          capabilities: enabled.filter((item): item is string => typeof item === "string") };
      }));
      return rows.filter((row): row is NonNullable<typeof row> => row !== null).sort((a,b) => a.name.localeCompare(b.name));
    },

    async propose(actorUid: string, input: { originLocationId: unknown; destinationLocationId: unknown; reason: unknown }) {
      assertUid(actorUid);
      assertLocationId(input?.originLocationId, "Origin");
      assertLocationId(input?.destinationLocationId, "Destination");
      if (input.originLocationId === input.destinationLocationId) throw new TypeError("Origin and destination must be different PUDO locations.");
      const reason = requiredReason(input.reason);
      const originId = input.originLocationId;
      const destinationId = input.destinationLocationId;
      const connectionId = createHash("sha256").update(originId + "->" + destinationId).digest("hex");
      const connectionRef = connections.doc(connectionId);
      const versionRef = connectionRef.collection("versions");
      const eventRef = connectionRef.collection("events").doc();
      return db.runTransaction(async transaction => {
        await requirePermission(db, transaction, actorUid, PROPOSE);
        const [origin, destination, current] = await Promise.all([
          readEligibleLocation(db, transaction, originId, "Origin"),
          readEligibleLocation(db, transaction, destinationId, "Destination"),
          transaction.get(connectionRef),
        ]);
        if (!origin.capabilities.includes("parcel_handover")) {
          throw new Error("Origin PUDO must have the approved parcel handover capability.");
        }
        if (!destination.capabilities.includes("custody_acceptance")) {
          throw new Error("Destination PUDO must have the approved physical custody acceptance capability.");
        }
        const previous = current.exists ? current.data()! : null;
        if (previous && !["rejected"].includes(String(previous.status))) {
          throw new Error("A connection for this directed PUDO pair already exists and is not rejected.");
        }
        const version = Number(previous?.version ?? 0) + 1;
        const now = serverTimestamp();
        const record = {
          schemaVersion: 1, connectionId, originLocationId: originId,
          originName: typeof origin.candidate.name === "string" ? origin.candidate.name : "PUDO location",
          destinationLocationId: destinationId,
          destinationName: typeof destination.candidate.name === "string" ? destination.candidate.name : "PUDO location",
          relationshipType: "parcel_transfer", status: "pending_review",
          requiredOriginCapability: "parcel_handover",
          requiredDestinationCapability: "custody_acceptance",
          version, reason, proposedBy: actorUid, proposedAt: now,
          reviewedBy: null, reviewedAt: null, reviewReason: null, updatedAt: now,
        };
        transaction.set(connectionRef, record);
        transaction.create(versionRef.doc("v" + String(version).padStart(6, "0")), record);
        transaction.create(eventRef, { action: "connection_proposed", actorUid, reason, version, occurredAt: now });
        return { connectionId, status: "pending_review", version };
      });
    },

    async decide(actorUid: string, connectionId: string, input: { decision: unknown; reason: unknown }) {
      assertUid(actorUid);
      if (typeof connectionId !== "string" || !/^[a-f0-9]{64}$/.test(connectionId)) throw new TypeError("A valid network connection ID is required.");
      if (!["approve", "reject", "suspend", "reactivate"].includes(String(input?.decision))) throw new TypeError("Unsupported network connection decision.");
      const decision = input.decision as Decision;
      const reason = requiredReason(input.reason);
      const ref = connections.doc(connectionId);
      const eventRef = ref.collection("events").doc();
      return db.runTransaction(async transaction => {
        await requirePermission(db, transaction, actorUid, APPROVE);
        const current = await transaction.get(ref);
        if (!current.exists) throw new Error("PUDO network connection not found.");
        const data = current.data()!;
        if (decision === "approve" || decision === "reactivate") {
          const [origin, destination] = await Promise.all([
            readEligibleLocation(db, transaction, String(data.originLocationId), "Origin"),
            readEligibleLocation(db, transaction, String(data.destinationLocationId), "Destination"),
          ]);
          if (!origin.capabilities.includes("parcel_handover")) throw new Error("Origin PUDO no longer has approved parcel handover capability.");
          if (!destination.capabilities.includes("custody_acceptance")) throw new Error("Destination PUDO no longer has approved physical custody acceptance capability.");
        }
        const allowed: Record<Decision, string[]> = {
          approve: ["pending_review"], reject: ["pending_review"],
          suspend: ["active"], reactivate: ["suspended"],
        };
        if (!allowed[decision].includes(String(data.status))) throw new Error("This connection cannot receive that decision from its current status.");
        const status = decision === "approve" || decision === "reactivate" ? "active" :
          decision === "reject" ? "rejected" : "suspended";
        const version = Number(data.version ?? 0) + 1;
        const now = serverTimestamp();
        const updated = { ...data, status, version, reviewedBy: actorUid, reviewedAt: now,
          reviewReason: reason, updatedAt: now };
        transaction.update(ref, { status, version, reviewedBy: actorUid, reviewedAt: now,
          reviewReason: reason, updatedAt: now });
        transaction.create(ref.collection("versions").doc("v" + String(version).padStart(6, "0")), updated);
        transaction.create(eventRef, { action: "connection_" + decision, actorUid, reason, version, occurredAt: now });
        return { connectionId, status, version };
      });
    },
  };
}
