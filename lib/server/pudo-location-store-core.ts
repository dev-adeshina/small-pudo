import type { FieldValue, Firestore } from "firebase-admin/firestore";
import { hasStaffActionPermissionInTransaction } from "./staff-permission-grants-core.ts";

const PERMISSION = "pudo_location.register";

export type PudoCoordinateCaptureMethod = "device" | "manual";
export type PudoLocationLifecycle = "draft" | "submitted";

export interface PudoLocationInput {
  name?: string;
  address?: string;
  registrationNote?: string;
  geo?: {
    latitude?: number | null;
    longitude?: number | null;
    captureMethod?: PudoCoordinateCaptureMethod;
    accuracyMeters?: number | null;
  } | null;
}

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

function assertInput(input: PudoLocationInput): void {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("A valid PUDO candidate is required.");
  }

  const allowed = ["name", "address", "registrationNote", "geo"];
  if (Object.keys(input).some((key) => !allowed.includes(key))) {
    throw new TypeError("The candidate contains an unsupported field.");
  }

  for (const [value, label, max] of [
    [input.name, "Location name", 160],
    [input.address, "Physical address", 1000],
    [input.registrationNote, "Registration note", 1000],
  ] as const) {
    if (value !== undefined &&
      (typeof value !== "string" || value.length > max)) {
      throw new TypeError(`${label} must be a string of at most ${max} characters.`);
    }
  }

  if (input.geo !== undefined && input.geo !== null) {
    if (!input.geo || typeof input.geo !== "object" || Array.isArray(input.geo)) {
      throw new TypeError("Geographic coordinates must be a valid object.");
    }

    const allowedGeo = ["latitude", "longitude", "captureMethod", "accuracyMeters"];
    if (Object.keys(input.geo).some((key) => !allowedGeo.includes(key))) {
      throw new TypeError("Geographic coordinates contain an unsupported field.");
    }

    const { latitude, longitude, captureMethod, accuracyMeters } = input.geo;

    if (latitude !== undefined && latitude !== null &&
      (typeof latitude !== "number" || !Number.isFinite(latitude) ||
        latitude < -90 || latitude > 90)) {
      throw new TypeError("Latitude must be between -90 and 90.");
    }

    if (longitude !== undefined && longitude !== null &&
      (typeof longitude !== "number" || !Number.isFinite(longitude) ||
        longitude < -180 || longitude > 180)) {
      throw new TypeError("Longitude must be between -180 and 180.");
    }

    if (captureMethod !== undefined &&
      captureMethod !== "device" && captureMethod !== "manual") {
      throw new TypeError("Coordinate capture method must be device or manual.");
    }

    if (accuracyMeters !== undefined && accuracyMeters !== null &&
      (typeof accuracyMeters !== "number" ||
        !Number.isFinite(accuracyMeters) || accuracyMeters < 0)) {
      throw new TypeError("Device accuracy must be a non-negative number.");
    }

    if (accuracyMeters != null && captureMethod !== "device") {
      throw new TypeError("Accuracy metadata is only valid for device-captured coordinates.");
    }
  }
}

function validateSubmission(input: PudoLocationInput): void {
  if (!input.name?.trim()) {
    throw new TypeError("A location name is required before submission.");
  }
  if (!input.address?.trim()) {
    throw new TypeError("A physical address is required before submission.");
  }

  const geo = input.geo;
  if (typeof geo?.latitude !== "number" ||
    typeof geo.longitude !== "number") {
    throw new TypeError("Valid latitude and longitude are required before submission.");
  }

  if (!geo.captureMethod) {
    throw new TypeError("The coordinate capture method must be recorded.");
  }
}

export function createPudoLocationStore({
  db,
  serverTimestamp,
}: Dependencies) {
  const collection = db.collection("pudoLocations");

  async function requirePermission(
    actorUid: string,
    transaction?: FirebaseFirestore.Transaction,
  ): Promise<void> {
    assertActor(actorUid);

    const allowed = transaction
      ? await hasStaffActionPermissionInTransaction(
        transaction, db, actorUid, PERMISSION,
      )
      : await (async () => {
        return db.runTransaction((tx) =>
          hasStaffActionPermissionInTransaction(tx, db, actorUid, PERMISSION),
        );
      })();

    if (!allowed) {
      throw new Error("You are not authorised to register PUDO locations.");
    }
  }



  function candidateData(
    input: PudoLocationInput,
    actorUid: string,
    previousGeo?: Record<string, unknown>,
  ) {
    const geo = input.geo;
    const hasCoordinates =
      typeof geo?.latitude === "number" ||
      typeof geo?.longitude === "number";

    return {
      name: input.name?.trim() ?? "",
      address: input.address?.trim() ?? "",
      registrationNote: input.registrationNote?.trim() ?? "",
      geo: geo === undefined
        ? previousGeo ?? null
        : hasCoordinates
          ? {
            latitude: geo.latitude ?? null,
            longitude: geo.longitude ?? null,
            captureMethod: geo.captureMethod ?? previousGeo?.captureMethod ?? null,
            capturedAt: serverTimestamp(),
            capturedBy: actorUid,
            ...(geo.accuracyMeters != null
              ? { accuracyMeters: geo.accuracyMeters }
              : {}),
          }
          : null,
    };
  }
  return {
    async listCandidates(actorUid: string, limit = 50) {
      await requirePermission(actorUid);

      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
        throw new TypeError("List limit must be between 1 and 100.");
      }

      const snapshot = await collection
        .orderBy("updatedAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((document) => ({
        locationId: document.id,
        ...document.data(),
      }));
    },

    async getCandidate(actorUid: string, locationId: string) {
      await requirePermission(actorUid);
      assertLocationId(locationId);

      const snapshot = await collection.doc(locationId).get();
      return snapshot.exists
        ? { locationId: snapshot.id, ...snapshot.data() }
        : null;
    },

    async saveCandidate(
      actorUid: string,
      input: PudoLocationInput,
      locationId?: string,
    ) {
      assertActor(actorUid);
      assertInput(input);

      if (locationId) assertLocationId(locationId);

      const candidateRef = locationId
        ? collection.doc(locationId)
        : collection.doc();

      const eventRef = candidateRef.collection("auditEvents").doc();

      return db.runTransaction(async (transaction) => {
        await requirePermission(actorUid, transaction);

        const existing = locationId
          ? await transaction.get(candidateRef)
          : null;

        if (existing && !existing.exists) {
          throw new Error("PUDO candidate not found.");
        }

        const previous = existing?.data();
        const previousGeo = previous?.geo as Record<string, unknown> | undefined;
        const lifecycle = (previous?.lifecycle ?? "draft") as PudoLocationLifecycle;

        if (lifecycle !== "draft") {
          throw new Error("Submitted PUDO candidates cannot be edited.");
        }

        const changes = candidateData(input, actorUid, previousGeo);
        const now = serverTimestamp();

        const next = {
          ...changes,
          lifecycle,
          schemaVersion: 1,
          createdBy: previous?.createdBy ?? actorUid,
          createdAt: previous?.createdAt ?? now,
          updatedBy: actorUid,
          updatedAt: now,
          // updatedAt: now,
          // ...(lifecycle === "submitted" ? {
          //   submittedBy: previous?.submittedBy,
          //   submittedAt: previous?.submittedAt,
          // } : {}),
        };

        if (existing?.exists) {
          transaction.update(candidateRef, next);
        } else {
          transaction.create(candidateRef, next);
        }

        transaction.create(eventRef, {
          action: existing?.exists ? "updated" : "created",
          locationId: candidateRef.id,
          actorUid,
          timestamp: now,
          before: previous ?? null,
          after: next,
        });

        return {
          locationId: candidateRef.id,
          lifecycle,
        };
      });
    },

    async submitCandidate(actorUid: string, locationId: string) {
      assertActor(actorUid);
      assertLocationId(locationId);

      const candidateRef = collection.doc(locationId);
      const eventRef = candidateRef.collection("auditEvents").doc();

      return db.runTransaction(async (transaction) => {
        await requirePermission(actorUid, transaction);

        const snapshot = await transaction.get(candidateRef);
        if (!snapshot.exists) throw new Error("PUDO candidate not found.");

        const previous = snapshot.data()!;
        if (previous.lifecycle !== "draft") {
          throw new Error("Only a draft candidate can be submitted.");
        }


        const storedGeo = previous.geo as
          | {
            latitude?: number | null;
            longitude?: number | null;
            captureMethod?: PudoCoordinateCaptureMethod | null;
            accuracyMeters?: number | null;
          }
          | null
          | undefined;

        const input: PudoLocationInput = {
          name: previous.name,
          address: previous.address,
          registrationNote: previous.registrationNote,
          ...(storedGeo
            ? {
              geo: {
                latitude: storedGeo.latitude,
                longitude: storedGeo.longitude,
                captureMethod: storedGeo.captureMethod ?? undefined,
                accuracyMeters: storedGeo.accuracyMeters,
              },
            }
            : {}),
        };
        assertInput(input);
        validateSubmission(input);

        const now = serverTimestamp();
        const next = {
          ...previous,
          lifecycle: "submitted" as const,
          submittedBy: actorUid,
          submittedAt: now,
          updatedBy: actorUid,
          updatedAt: now,
        };

        transaction.update(candidateRef, next);
        transaction.create(eventRef, {
          action: "submitted",
          locationId,
          actorUid,
          timestamp: now,
          before: previous,
          after: next,
        });

        return { locationId, lifecycle: "submitted" as const };
      });
    },
  };
}