import type { FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import {
  hasStaffActionPermission,
  hasStaffActionPermissionInTransaction,
} from "./staff-permission-grants-core.ts";

export const PUDO_LOCATION_CAPABILITIES = [
  "walk_in_intake",
  "parcel_measurement",
  "custody_acceptance",
  "payment_collection",
  "parcel_handover",
  "parcel_release",
] as const;

export type PudoLocationCapability =
  typeof PUDO_LOCATION_CAPABILITIES[number];

const CONFIGURE_PERMISSION = "pudo_location.capability_approve";
const READ_PERMISSIONS = [
  "pudo_location.verify",
  "pudo_location.activate",
  CONFIGURE_PERMISSION,
] as const;

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
    throw new TypeError("A valid PUDO location ID is required.");
  }
}

function validateCapabilities(value: unknown): PudoLocationCapability[] {
  if (!Array.isArray(value) || value.length > PUDO_LOCATION_CAPABILITIES.length) {
    throw new TypeError("Select a valid set of PUDO location capabilities.");
  }
  const selected = value as unknown[];
  if (selected.some((item) =>
    typeof item !== "string" ||
    !PUDO_LOCATION_CAPABILITIES.includes(item as PudoLocationCapability)
  ) || new Set(selected).size !== selected.length) {
    throw new TypeError("The capability selection contains an unsupported or duplicate activity.");
  }
  return [...selected].sort() as PudoLocationCapability[];
}

async function requireConfigurationPermission(
  actorUid: string,
  transaction: Transaction,
  db: Firestore,
): Promise<void> {
  assertActor(actorUid);
  const allowed = await hasStaffActionPermissionInTransaction(
    transaction, db, actorUid, CONFIGURE_PERMISSION,
  );
  if (!allowed) {
    throw new Error("You are not authorised to configure PUDO location capabilities.");
  }
}

export function createPudoLocationCapabilityStore({
  db,
  serverTimestamp,
}: Dependencies) {
  const candidates = db.collection("pudoLocations");
  const verifications = db.collection("pudoLocationVerifications");
  const configurations = db.collection("pudoLocationCapabilities");

  return {
    async getConfiguration(actorUid: string, locationId: string) {
      assertActor(actorUid);
      assertLocationId(locationId);
      const permissions = await Promise.all(READ_PERMISSIONS.map((permission) =>
        hasStaffActionPermission(db, actorUid, permission),
      ));
      if (!permissions.some(Boolean)) {
        throw new Error("You are not authorised to view PUDO location capabilities.");
      }

      const [candidate, verification, configuration, activation] = await Promise.all([
        candidates.doc(locationId).get(),
        verifications.doc(locationId).get(),
        configurations.doc(locationId).get(),
        db.collection("pudoLocationActivations").doc(locationId).get(),
      ]);
      if (!candidate.exists) throw new Error("PUDO location not found.");
      if (!verification.exists ||
        verification.data()?.status !== "approved_to_activate") {
        throw new Error("PUDO verification approval is required before capability configuration.");
      }

      const data = configuration.exists ? configuration.data()! : null;
      return {
        locationId,
        lifecycle: candidate.data()?.lifecycle ?? null,
        operationalStatus: activation.exists ? activation.data()?.status ?? "active" : "not_activated",
        capabilities: (data?.capabilities ?? []) as PudoLocationCapability[],
        version: typeof data?.version === "number" ? data.version : 0,
        configuredBy: data?.configuredBy ?? null,
        configuredAt: data?.configuredAt ?? null,
        reason: data?.reason ?? null,
        canManageActivation: permissions[1] === true,
        canConfigure: permissions[2] === true,
        history: configuration.exists
          ? (await configurations.doc(locationId).collection("versions")
            .orderBy("version", "desc").limit(25).get()).docs.map((item) => ({
              versionId: item.id,
              ...item.data(),
            }))
          : [],
      };
    },

    async configureCapabilities(
      actorUid: string,
      locationId: string,
      input: { capabilities: unknown; reason: unknown },
    ) {
      assertActor(actorUid);
      assertLocationId(locationId);
      const capabilities = validateCapabilities(input?.capabilities);
      if (typeof input?.reason !== "string" ||
        !input.reason.trim() || input.reason.length > 1000) {
        throw new TypeError("A reason for the capability change is required (maximum 1000 characters).");
      }
      const reason = input.reason.trim();

      const candidateRef = candidates.doc(locationId);
      const verificationRef = verifications.doc(locationId);
      const configurationRef = configurations.doc(locationId);
      const versionRef = configurationRef.collection("versions");
      const auditRef = candidateRef.collection("auditEvents").doc();

      return db.runTransaction(async (transaction) => {
        await requireConfigurationPermission(actorUid, transaction, db);
        const [candidate, verification, current, activation] = await Promise.all([
          transaction.get(candidateRef),
          transaction.get(verificationRef),
          transaction.get(configurationRef),
          transaction.get(db.collection("pudoLocationActivations").doc(locationId)),
        ]);
        if (!candidate.exists ||
          !["submitted", "active"].includes(String(candidate.data()?.lifecycle))) {
          throw new Error("Only an approved submitted or active PUDO location can be configured.");
        }
        if (!verification.exists ||
          verification.data()?.status !== "approved_to_activate") {
          throw new Error("PUDO verification approval is required before capability configuration.");
        }
        if (activation.data()?.status === "deactivated") {
          throw new Error("Capabilities cannot be changed after permanent PUDO deactivation.");
        }
        if (capabilities.length === 0 &&
          (!activation.exists || activation.data()?.status === "active")) {
          throw new Error("At least one capability must remain configured. Suspend the location before clearing all capabilities.");
        }

        const previous = current.exists
          ? (current.data()?.capabilities ?? []) as PudoLocationCapability[]
          : [];
        const same = previous.length === capabilities.length &&
          previous.every((item) => capabilities.includes(item));
        if (same) {
          return {
            locationId,
            capabilities,
            version: Number(current.data()?.version ?? 0),
            unchanged: true as const,
          };
        }

        const version = Number(current.data()?.version ?? 0) + 1;
        const now = serverTimestamp();
        const versionDocument = versionRef.doc(`v${String(version).padStart(6, "0")}`);
        const versionData = {
          locationId,
          version,
          capabilities,
          previousCapabilities: previous,
          reason,
          configuredBy: actorUid,
          configuredAt: now,
          schemaVersion: 1,
        };

        transaction.set(configurationRef, {
          locationId,
          version,
          capabilities,
          reason,
          configuredBy: actorUid,
          configuredAt: now,
          schemaVersion: 1,
        });
        transaction.create(versionDocument, versionData);
        transaction.create(auditRef, {
          action: "capabilities_configured",
          locationId,
          actorUid,
          timestamp: now,
          version,
          capabilities,
          previousCapabilities: previous,
          reason,
        });

        return { locationId, capabilities, version, unchanged: false as const };
      });
    },
  };
}
