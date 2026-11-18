import type { FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import { hasStaffActionPermissionInTransaction } from "./staff-permission-grants-core.ts";
import {
  assertCommercialRouteDistanceEvidence,
  type CommercialRouteDistanceEvidence,
  type CommercialRouteDistanceMethod,
} from "./commercial-route-distance-input-core.ts";
import { calculateStraightLineDistance } from "./straight-line-distance.ts";

interface Dependencies {
  db: Firestore;
  serverTimestamp: () => FieldValue;
}

export interface RecordCommercialRouteDistanceInput {
  originOperationalPointRef: string;
  destinationOperationalPointRef: string;
  method: CommercialRouteDistanceMethod;
  distance?: { value: number; unit: string };
  source?: string;
}

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const LOCATION_ID = /^[A-Za-z0-9_-]{1,128}$/;

function assertActor(uid: string): void {
  if (typeof uid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
    throw new TypeError("A valid authenticated staff identity is required.");
  }
}

function assertLocationId(value: string, label: string): void {
  if (typeof value !== "string" || !LOCATION_ID.test(value)) {
    throw new TypeError(`${label} must be a valid PUDO location ID.`);
  }
}

function assertSource(value: unknown): asserts value is string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 80) {
    throw new TypeError("A measurement source of at most 80 characters is required.");
  }
}

function assertManualDistance(value: unknown): asserts value is { value: number; unit: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("A distance value and unit are required for this measurement method.");
  }
  const distance = value as Record<string, unknown>;
  if (
    Object.keys(distance).some((key) => key !== "value" && key !== "unit") ||
    typeof distance.value !== "number" ||
    !Number.isFinite(distance.value) ||
    distance.value <= 0 ||
    typeof distance.unit !== "string" ||
    !distance.unit.trim() ||
    distance.unit.length > 40
  ) {
    throw new TypeError("Distance must contain a positive finite value and a valid unit.");
  }
}

export function createCommercialRouteDistanceStore({
  db,
  serverTimestamp,
}: Dependencies) {
  const candidates = db.collection("pudoLocations");
  const activations = db.collection("pudoLocationActivations");
  const evidenceCollection = db.collection("commercialRouteDistanceEvidence");

  async function requireViewPermission(actorUid: string, transaction: Transaction) {
    const allowed = await hasStaffActionPermissionInTransaction(
      transaction, db, actorUid, "commercial_pricing.view",
    );
    if (!allowed) throw new Error("You are not authorised to view commercial route-distance evidence.");
  }

  async function requireProposePermission(actorUid: string, transaction: Transaction) {
    const allowed = await hasStaffActionPermissionInTransaction(
      transaction, db, actorUid, "commercial_pricing.propose",
    );
    if (!allowed) throw new Error("You are not authorised to record commercial route-distance evidence.");
  }

  async function readActiveLocation(
    transaction: Transaction,
    locationId: string,
    label: string,
  ): Promise<Record<string, unknown>> {
    assertLocationId(locationId, label);
    const candidateRef = candidates.doc(locationId);
    const activationRef = activations.doc(locationId);
    const [candidateSnapshot, activationSnapshot] = await Promise.all([
      transaction.get(candidateRef),
      transaction.get(activationRef),
    ]);

    if (!candidateSnapshot.exists || !activationSnapshot.exists) {
      throw new Error(`${label} PUDO location is not active.`);
    }

    const candidate = candidateSnapshot.data()!;
    const activation = activationSnapshot.data()!;
    if (candidate.lifecycle !== "active" || activation.status !== "active") {
      throw new Error(`${label} PUDO location is not active.`);
    }
    return candidate;
  }

  return {
    async listActiveLocations(actorUid: string, limit = 100) {
      assertActor(actorUid);
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
        throw new TypeError("Location list limit must be between 1 and 100.");
      }

      const allowed = await db.runTransaction(async (transaction) => {
        await requireViewPermission(actorUid, transaction);
        return true;
      });
      if (!allowed) return [];

      const snapshot = await candidates
        .where("lifecycle", "==", "active")
        .orderBy("name", "asc")
        .limit(limit)
        .get();

      const locations = await Promise.all(snapshot.docs.map(async (document) => {
        const activation = await activations.doc(document.id).get();
        if (!activation.exists || activation.data()?.status !== "active") return null;
        const data = document.data();
        const geo = data.geo as Record<string, unknown> | null;
        return {
          locationId: document.id,
          name: data.name ?? "",
          address: data.address ?? "",
          geo: geo && typeof geo.latitude === "number" && typeof geo.longitude === "number"
            ? { latitude: geo.latitude, longitude: geo.longitude }
            : null,
        };
      }));
      return locations.filter((location) => location !== null);
    },

    async listEvidence(
      actorUid: string,
      originOperationalPointRef: string,
      destinationOperationalPointRef: string,
      limit = 20,
    ) {
      assertActor(actorUid);
      assertLocationId(originOperationalPointRef, "Origin");
      assertLocationId(destinationOperationalPointRef, "Destination");
      if (originOperationalPointRef === destinationOperationalPointRef) {
        throw new TypeError("Route origin and destination must be different.");
      }
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
        throw new TypeError("Evidence list limit must be between 1 and 100.");
      }

      await db.runTransaction(async (transaction) => {
        await requireViewPermission(actorUid, transaction);
        await readActiveLocation(transaction, originOperationalPointRef, "Origin");
        await readActiveLocation(transaction, destinationOperationalPointRef, "Destination");
      });

      const snapshot = await evidenceCollection
        .where("originOperationalPointRef", "==", originOperationalPointRef)
        .where("destinationOperationalPointRef", "==", destinationOperationalPointRef)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((document) => {
        const data = document.data();
        const evidence = data.evidence as CommercialRouteDistanceEvidence;
        assertCommercialRouteDistanceEvidence(evidence);
        return { evidenceId: document.id, ...evidence };
      });
    },

    async recordEvidence(actorUid: string, input: RecordCommercialRouteDistanceInput) {
      assertActor(actorUid);
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new TypeError("A route-distance measurement is required.");
      }
      if (Object.keys(input).some((key) =>
        !["originOperationalPointRef", "destinationOperationalPointRef", "method", "distance", "source"].includes(key)
      )) {
        throw new TypeError("Route-distance measurement contains an unsupported field.");
      }

      const { originOperationalPointRef, destinationOperationalPointRef, method } = input;
      assertLocationId(originOperationalPointRef, "Origin");
      assertLocationId(destinationOperationalPointRef, "Destination");
      if (originOperationalPointRef === destinationOperationalPointRef) {
        throw new TypeError("Route origin and destination must be different.");
      }
      if (!["straight_line", "manual", "road_network"].includes(method)) {
        throw new TypeError("Unsupported route-distance measurement method.");
      }

      let distance: { value: number; unit: string };
      let source: string;

      if (method === "straight_line") {
        if (input.distance !== undefined) {
          throw new TypeError("Straight-line distance is calculated from the registered PUDO coordinates.");
        }
        const [origin, destination] = await db.runTransaction(async (transaction) => {
          await requireProposePermission(actorUid, transaction);
          const from = await readActiveLocation(transaction, originOperationalPointRef, "Origin");
          const to = await readActiveLocation(transaction, destinationOperationalPointRef, "Destination");
          return [from, to] as const;
        });
        const fromGeo = origin.geo as Record<string, unknown> | null;
        const toGeo = destination.geo as Record<string, unknown> | null;
        if (
          !fromGeo || !toGeo ||
          typeof fromGeo.latitude !== "number" || typeof fromGeo.longitude !== "number" ||
          typeof toGeo.latitude !== "number" || typeof toGeo.longitude !== "number"
        ) {
          throw new Error("Both active PUDO locations must have registered coordinates to calculate straight-line distance.");
        }
        const calculated = calculateStraightLineDistance(
          { latitude: fromGeo.latitude, longitude: fromGeo.longitude },
          { latitude: toGeo.latitude, longitude: toGeo.longitude },
        );
        distance = { value: calculated.distanceMeters, unit: calculated.unit };
        source = "WGS84 coordinates; Haversine calculation";
      } else {
        assertManualDistance(input.distance);
        assertSource(input.source);
        distance = { value: input.distance.value, unit: input.distance.unit.trim() };
        source = input.source.trim();
      }

      const evidence: CommercialRouteDistanceEvidence = {
        schemaVersion: 1,
        originOperationalPointRef,
        destinationOperationalPointRef,
        distance,
        method,
        recordedAt: new Date().toISOString(),
        recordedBy: actorUid,
        source,
      };
      assertCommercialRouteDistanceEvidence(evidence);

      const evidenceRef = evidenceCollection.doc();
      await db.runTransaction(async (transaction) => {
        await requireProposePermission(actorUid, transaction);
        await readActiveLocation(transaction, originOperationalPointRef, "Origin");
        await readActiveLocation(transaction, destinationOperationalPointRef, "Destination");
        transaction.create(evidenceRef, {
          evidence,
          createdAt: serverTimestamp(),
          createdBy: actorUid,
        });
      });

      return { evidenceId: evidenceRef.id, ...evidence };
    },
  };
}
