import type { FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import { hasStaffActionPermissionInTransaction } from "./staff-permission-grants-core.ts";

const PERMISSION = "pudo_location.activate";

interface Dependencies {
  db: Firestore;
  serverTimestamp: () => FieldValue;
}

function assertActor(uid: string): void {
  if (typeof uid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
    throw new TypeError("A valid authenticated staff identity is required.");
  }
}

function assertLocationId(id: string): void {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
    throw new TypeError("A valid PUDO candidate ID is required.");
  }
}

export function createPudoLocationActivationStore({
  db,
  serverTimestamp,
}: Dependencies) {
  const candidates = db.collection("pudoLocations");
  const verifications = db.collection("pudoLocationVerifications");
  const activations = db.collection("pudoLocationActivations");

  async function requirePermission(
    actorUid: string,
    transaction: Transaction,
  ): Promise<void> {
    assertActor(actorUid);

    const allowed = await hasStaffActionPermissionInTransaction(
      transaction,
      db,
      actorUid,
      PERMISSION,
    );

    if (!allowed) {
      throw new Error("You are not authorised to activate PUDO locations.");
    }
  }

  return {
    async activateLocation(actorUid: string, locationId: string) {
      assertActor(actorUid);
      assertLocationId(locationId);

      const candidateRef = candidates.doc(locationId);
      const verificationRef = verifications.doc(locationId);
      const activationRef = activations.doc(locationId);
      const eventRef = candidateRef.collection("auditEvents").doc();

      return db.runTransaction(async (transaction) => {
        await requirePermission(actorUid, transaction);

        const [candidateSnapshot, verificationSnapshot, activationSnapshot] =
          await Promise.all([
            transaction.get(candidateRef),
            transaction.get(verificationRef),
            transaction.get(activationRef),
          ]);

        if (!candidateSnapshot.exists) {
          throw new Error("PUDO candidate not found.");
        }

        const candidate = candidateSnapshot.data()!;

        if (activationSnapshot.exists) {
          throw new Error("This PUDO location has already been activated.");
        }

        if (candidate.lifecycle !== "submitted") {
          throw new Error("Only submitted PUDO candidates can be activated.");
        }

        if (
          !verificationSnapshot.exists ||
          verificationSnapshot.data()?.status !== "approved_to_activate"
        ) {
          throw new Error(
            "PUDO verification approval is required before activation.",
          );
        }

        const now = serverTimestamp();

        const activation = {
          locationId,
          status: "active" as const,
          activatedBy: actorUid,
          activatedAt: now,
          verificationStatus: "approved_to_activate" as const,
          schemaVersion: 1,
        };

        transaction.create(activationRef, activation);

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
        });

        return {
          locationId,
          lifecycle: "active" as const,
          activatedBy: actorUid,
        };
      });
    },
  };
}
