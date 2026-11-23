import type { FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import { hasStaffActionPermissionInTransaction } from "./staff-permission-grants-core.ts";

const PERMISSION = "pudo_location.activate";

interface Dependencies {
  db: Firestore;
  serverTimestamp: () => FieldValue;
}

type OperationalStatus = "active" | "suspended" | "deactivated";

function assertActor(uid: string): void {
  if (typeof uid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
    throw new TypeError("A valid authenticated staff identity is required.");
  }
}

function assertLocationId(id: string): void {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
    throw new TypeError("A valid PUDO location ID is required.");
  }
}

function assertReason(reason: unknown): asserts reason is string {
  if (typeof reason !== "string" || !reason.trim() || reason.length > 1000) {
    throw new TypeError("A reason is required (maximum 1000 characters).");
  }
}

export function createPudoLocationActivationStore({
  db,
  serverTimestamp,
}: Dependencies) {
  const candidates = db.collection("pudoLocations");
  const verifications = db.collection("pudoLocationVerifications");
  const activations = db.collection("pudoLocationActivations");
  const capabilityConfigurations = db.collection("pudoLocationCapabilities");

  async function requirePermission(
    actorUid: string,
    transaction: Transaction,
  ): Promise<void> {
    assertActor(actorUid);
    const allowed = await hasStaffActionPermissionInTransaction(
      transaction, db, actorUid, PERMISSION,
    );
    if (!allowed) {
      throw new Error("You are not authorised to activate PUDO locations.");
    }
  }

  async function requireApprovedAndCapable(
    transaction: Transaction,
    locationId: string,
  ) {
    const [candidateSnapshot, verificationSnapshot, capabilitySnapshot] =
      await Promise.all([
        transaction.get(candidates.doc(locationId)),
        transaction.get(verifications.doc(locationId)),
        transaction.get(capabilityConfigurations.doc(locationId)),
      ]);

    if (!candidateSnapshot.exists) throw new Error("PUDO candidate not found.");
    if (verificationSnapshot.data()?.status !== "approved_to_activate") {
      throw new Error("PUDO verification approval is required before activation.");
    }
    const capabilities = capabilitySnapshot.data()?.capabilities;
    if (!Array.isArray(capabilities) || capabilities.length === 0) {
      throw new Error("At least one approved PUDO capability must be configured before activation.");
    }
    return candidateSnapshot;
  }

  return {
    async activateLocation(actorUid: string, locationId: string, reasonValue: unknown) {
      assertActor(actorUid);
      assertLocationId(locationId);
      assertReason(reasonValue);
      const reason = reasonValue.trim();
      const candidateRef = candidates.doc(locationId);
      const activationRef = activations.doc(locationId);
      const eventRef = candidateRef.collection("auditEvents").doc();

      return db.runTransaction(async (transaction) => {
        await requirePermission(actorUid, transaction);
        const [candidateSnapshot, activationSnapshot] = await Promise.all([
          transaction.get(candidateRef),
          transaction.get(activationRef),
        ]);
        if (!candidateSnapshot.exists) throw new Error("PUDO candidate not found.");
        if (activationSnapshot.exists) {
          throw new Error("This PUDO location has already been activated.");
        }
        if (candidateSnapshot.data()?.lifecycle !== "submitted") {
          throw new Error("Only submitted PUDO candidates can be activated.");
        }

        await requireApprovedAndCapable(transaction, locationId);
        const now = serverTimestamp();
        transaction.create(activationRef, {
          locationId,
          status: "active" as const,
          activatedBy: actorUid,
          activatedAt: now,
          statusChangedBy: actorUid,
          statusChangedAt: now,
          statusReason: reason,
          verificationStatus: "approved_to_activate" as const,
          schemaVersion: 1,
        });
        transaction.update(candidateRef, {
          lifecycle: "active",
          activatedBy: actorUid,
          activatedAt: now,
          updatedBy: actorUid,
          updatedAt: now,
        });
        transaction.create(eventRef, {
          action: "activated",
          locationId,
          actorUid,
          timestamp: now,
          verificationStatus: "approved_to_activate",
          activationRecordId: activationRef.id,
          reason,
        });
        return { locationId, lifecycle: "active" as const, status: "active" as const, activatedBy: actorUid };
      });
    },

    async setOperationalStatus(
      actorUid: string,
      locationId: string,
      status: OperationalStatus,
      reasonValue: unknown,
    ) {
      assertActor(actorUid);
      assertLocationId(locationId);
      if (!["active", "suspended", "deactivated"].includes(status)) {
        throw new TypeError("A valid PUDO operational status is required.");
      }
      assertReason(reasonValue);
      const reason = reasonValue.trim();
      const candidateRef = candidates.doc(locationId);
      const activationRef = activations.doc(locationId);
      const eventRef = candidateRef.collection("auditEvents").doc();

      return db.runTransaction(async (transaction) => {
        await requirePermission(actorUid, transaction);
        const [candidate, activation, verification] = await Promise.all([
          transaction.get(candidateRef),
          transaction.get(activationRef),
          transaction.get(verifications.doc(locationId)),
        ]);
        if (!candidate.exists || candidate.data()?.lifecycle !== "active") {
          throw new Error("Only an activated PUDO location can change operational status.");
        }
        if (!activation.exists) throw new Error("PUDO activation record not found.");
        if (verification.data()?.status !== "approved_to_activate") {
          throw new Error("PUDO verification approval is required to manage operational status.");
        }
        const current = activation.data()!;
        const currentStatus = String(current.status ?? "active") as OperationalStatus;
        if (currentStatus === "deactivated") {
          throw new Error("A deactivated PUDO location cannot be reactivated.");
        }
        if (currentStatus === status) {
          return { locationId, status, unchanged: true as const };
        }
        if (status === "active") {
          const capabilitySnapshot = await transaction.get(
            capabilityConfigurations.doc(locationId),
          );
          const capabilities = capabilitySnapshot.data()?.capabilities;
          if (!Array.isArray(capabilities) || capabilities.length === 0) {
            throw new Error("At least one PUDO capability must remain configured before reactivation.");
          }
        }

        const now = serverTimestamp();
        transaction.update(activationRef, {
          status,
          statusChangedBy: actorUid,
          statusChangedAt: now,
          statusReason: reason,
          updatedAt: now,
        });
        transaction.create(eventRef, {
          action: "operational_status_changed",
          locationId,
          actorUid,
          timestamp: now,
          previousStatus: currentStatus,
          status,
          reason,
        });
        return { locationId, status, unchanged: false as const };
      });
    },
  };
}
