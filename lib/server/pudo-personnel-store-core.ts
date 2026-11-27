import type { FieldValue, Firestore } from "firebase-admin/firestore";

export interface PudoPersonnelInput {
  name: string;
  role: string;
}

function assertId(value: string, label: string) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
    throw new TypeError(`A valid ${label} is required.`);
  }
}

function assertText(value: unknown, label: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new TypeError(`${label} is required and must be at most ${max} characters.`);
  }
}

function validateInput(input: PudoPersonnelInput) {
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).some((key) => !["name", "role"].includes(key))) {
    throw new TypeError("A valid personnel record is required.");
  }
  assertText(input.name, "Personnel name", 120);
  assertText(input.role, "Operational role", 80);
}

function timestampMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value &&
      typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return 0;
}

/**
 * A PUDO partner manages a roster of named workers beneath each location.
 * Roster entries are not Firebase Auth identities and cannot sign in.
 * All operational API actions remain attributable to the partner account.
 */
export function createPudoPersonnelStore({
  db,
  serverTimestamp,
}: {
  db: Firestore;
  serverTimestamp: () => FieldValue;
}) {
  const partners = db.collection("pudoPartnerAccounts");
  const locations = db.collection("pudoLocations");

  async function requireOwnedLocation(partnerUid: string, locationId: string) {
    assertId(partnerUid, "partner identity");
    assertId(locationId, "PUDO location ID");
    const [partner, location] = await Promise.all([
      partners.doc(partnerUid).get(),
      locations.doc(locationId).get(),
    ]);
    if (!partner.exists || partner.data()?.accountStatus !== "active") {
      throw new Error("An active PUDO partner account is required.");
    }
    if (!location.exists || location.data()?.partnerUid !== partnerUid) {
      throw new Error("This PUDO location is not available to your partner account.");
    }
    return locations.doc(locationId);
  }

  function mapPersonnel(id: string, data: FirebaseFirestore.DocumentData) {
    return {
      personnelId: id,
      name: data.name,
      role: data.role,
      status: data.status === "inactive" ? "inactive" as const : "active" as const,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  return {
    async list(partnerUid: string, locationId: string) {
      const locationRef = await requireOwnedLocation(partnerUid, locationId);
      const snapshot = await locationRef.collection("personnel").limit(200).get();
      return snapshot.docs
        .map((doc) => mapPersonnel(doc.id, doc.data()))
        .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
    },

    async create(partnerUid: string, locationId: string, input: PudoPersonnelInput) {
      validateInput(input);
      const locationRef = await requireOwnedLocation(partnerUid, locationId);
      const personnelRef = locationRef.collection("personnel").doc();
      const auditRef = locationRef.collection("auditEvents").doc();
      const now = serverTimestamp();
      await db.runTransaction(async (transaction) => {
        const [partner, location] = await Promise.all([
          transaction.get(partners.doc(partnerUid)),
          transaction.get(locationRef),
        ]);
        if (!partner.exists || partner.data()?.accountStatus !== "active" ||
            !location.exists || location.data()?.partnerUid !== partnerUid) {
          throw new Error("Your partner account is not authorised to manage this location.");
        }
        transaction.create(personnelRef, {
          name: input.name.trim(),
          role: input.role.trim(),
          status: "active",
          partnerUid,
          createdBy: partnerUid,
          createdAt: now,
          updatedBy: partnerUid,
          updatedAt: now,
        });
        transaction.create(auditRef, {
          action: "pudo_personnel_registered",
          actorType: "pudo_partner",
          actorUid: partnerUid,
          locationId,
          personnelId: personnelRef.id,
          timestamp: now,
        });
      });
      return { personnelId: personnelRef.id, name: input.name.trim(), role: input.role.trim(), status: "active" as const };
    },

    async update(partnerUid: string, locationId: string, personnelId: string, input: PudoPersonnelInput) {
      validateInput(input);
      const locationRef = await requireOwnedLocation(partnerUid, locationId);
      assertId(personnelId, "personnel ID");
      const personnelRef = locationRef.collection("personnel").doc(personnelId);
      const auditRef = locationRef.collection("auditEvents").doc();
      const now = serverTimestamp();
      await db.runTransaction(async (transaction) => {
        const [partner, location, personnel] = await Promise.all([
          transaction.get(partners.doc(partnerUid)),
          transaction.get(locationRef),
          transaction.get(personnelRef),
        ]);
        if (!partner.exists || partner.data()?.accountStatus !== "active" ||
            !location.exists || location.data()?.partnerUid !== partnerUid ||
            !personnel.exists || personnel.data()?.partnerUid !== partnerUid) {
          throw new Error("Personnel record not found for this PUDO location.");
        }
        if (personnel.data()?.status !== "active") {
          throw new Error("Inactive personnel records cannot be edited. Register a new record if needed.");
        }
        transaction.update(personnelRef, {
          name: input.name.trim(),
          role: input.role.trim(),
          updatedBy: partnerUid,
          updatedAt: now,
        });
        transaction.create(auditRef, {
          action: "pudo_personnel_updated",
          actorType: "pudo_partner",
          actorUid: partnerUid,
          locationId,
          personnelId,
          timestamp: now,
        });
      });
      return { personnelId, name: input.name.trim(), role: input.role.trim(), updated: true as const };
    },

    async deactivate(partnerUid: string, locationId: string, personnelId: string) {
      const locationRef = await requireOwnedLocation(partnerUid, locationId);
      assertId(personnelId, "personnel ID");
      const personnelRef = locationRef.collection("personnel").doc(personnelId);
      const auditRef = locationRef.collection("auditEvents").doc();
      const now = serverTimestamp();
      await db.runTransaction(async (transaction) => {
        const [partner, location, personnel] = await Promise.all([
          transaction.get(partners.doc(partnerUid)),
          transaction.get(locationRef),
          transaction.get(personnelRef),
        ]);
        if (!partner.exists || partner.data()?.accountStatus !== "active" ||
            !location.exists || location.data()?.partnerUid !== partnerUid ||
            !personnel.exists || personnel.data()?.partnerUid !== partnerUid) {
          throw new Error("Personnel record not found for this PUDO location.");
        }
        if (personnel.data()?.status === "inactive") return;
        transaction.update(personnelRef, {
          status: "inactive",
          deactivatedBy: partnerUid,
          deactivatedAt: now,
          updatedBy: partnerUid,
          updatedAt: now,
        });
        transaction.create(auditRef, {
          action: "pudo_personnel_deactivated",
          actorType: "pudo_partner",
          actorUid: partnerUid,
          locationId,
          personnelId,
          timestamp: now,
        });
      });
      return { personnelId, status: "inactive" as const };
    },
  };
}
