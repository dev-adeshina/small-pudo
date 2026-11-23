import type { DocumentReference, FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import { hasStaffActionPermission, hasStaffActionPermissionInTransaction } from "./staff-permission-grants-core.ts";

export const PUDO_OPERATIONS_PERMISSION = "pudo_location.manage_operations";
const CAPABILITIES = [
  "walk_in_intake",
  "parcel_measurement",
  "custody_acceptance",
  "payment_collection",
  "parcel_handover",
  "parcel_release",
] as const;
type Capability = typeof CAPABILITIES[number];
type AvailabilityStatus = "available" | "unavailable";
type CapacityBasis = "at_a_time" | "per_hour" | "per_day";
type Interval = { start: string; end: string };
type WeeklyDay = { dayOfWeek: number; intervals: Interval[] };
type AvailabilityException = { date: string; status: "closed" | "hours"; intervals: Interval[] };
type Availability = {
  timezone: string;
  status: AvailabilityStatus;
  statusReason: string;
  weeklySchedule: WeeklyDay[];
  exceptions: AvailabilityException[];
};
type CapacityLimit = { capabilityId: Capability; maximum: number; unit: string; basis: CapacityBasis };

interface Dependencies { db: Firestore; serverTimestamp: () => FieldValue }

function assertActor(uid: string) {
  if (typeof uid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
    throw new TypeError("A valid authenticated staff identity is required.");
  }
}
function assertLocationId(id: string) {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
    throw new TypeError("A valid PUDO location ID is required.");
  }
}
function requiredReason(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 1000) {
    throw new TypeError("A reason for the operational configuration change is required (maximum 1000 characters).");
  }
  return value.trim();
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function validateTime(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new TypeError(`${label} must use 24-hour HH:mm format.`);
  }
  return value;
}
function validateIntervals(value: unknown, label: string): Interval[] {
  if (!Array.isArray(value) || value.length > 8) {
    throw new TypeError(`${label} must contain no more than eight opening intervals.`);
  }
  const intervals = value.map((item, index) => {
    if (!isRecord(item)) throw new TypeError(`${label} contains an invalid interval.`);
    const start = validateTime(item.start, `${label} interval ${index + 1} start`);
    const end = validateTime(item.end, `${label} interval ${index + 1} end`);
    if (start >= end) throw new TypeError(`${label} intervals must end after they start and cannot cross midnight.`);
    return { start, end };
  }).sort((a, b) => a.start.localeCompare(b.start));
  for (let index = 1; index < intervals.length; index++) {
    if (intervals[index - 1].end > intervals[index].start) {
      throw new TypeError(`${label} contains overlapping opening intervals.`);
    }
  }
  return intervals;
}
function validateAvailability(value: unknown): Availability {
  if (!isRecord(value)) throw new TypeError("A valid availability schedule is required.");
  const timezone = value.timezone;
  if (typeof timezone !== "string" || !timezone.trim() || timezone.length > 80) {
    throw new TypeError("Select a valid IANA time zone for this PUDO location.");
  }
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }).format(); }
  catch { throw new TypeError("The availability time zone is not recognised."); }
  if (value.status !== "available" && value.status !== "unavailable") {
    throw new TypeError("Availability status must be available or unavailable.");
  }
  const statusReason = typeof value.statusReason === "string" ? value.statusReason.trim() : "";
  if (statusReason.length > 500) throw new TypeError("Availability status reason cannot exceed 500 characters.");
  if (value.status === "unavailable" && !statusReason) {
    throw new TypeError("A reason is required when the PUDO location is marked unavailable.");
  }
  if (!Array.isArray(value.weeklySchedule) || value.weeklySchedule.length !== 7) {
    throw new TypeError("Provide one weekly schedule entry for every day of the week.");
  }
  const days = value.weeklySchedule.map((item, index) => {
    if (!isRecord(item) || !Number.isInteger(item.dayOfWeek) ||
      Number(item.dayOfWeek) < 0 || Number(item.dayOfWeek) > 6) {
      throw new TypeError("Weekly schedule days must use weekday numbers from 0 (Sunday) to 6 (Saturday).");
    }
    return {
      dayOfWeek: Number(item.dayOfWeek),
      intervals: validateIntervals(item.intervals, `Day ${item.dayOfWeek}`),
    };
  }).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  if (new Set(days.map((day) => day.dayOfWeek)).size !== 7) {
    throw new TypeError("Each weekday must appear exactly once in the weekly schedule.");
  }
  if (!Array.isArray(value.exceptions) || value.exceptions.length > 100) {
    throw new TypeError("Availability exceptions must be a list of no more than 100 dates.");
  }
  const exceptions = value.exceptions.map((item) => {
    if (!isRecord(item) || typeof item.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
      new Date(`${item.date}T00:00:00.000Z`).toISOString().slice(0, 10) !== item.date) {
      throw new TypeError("Each availability exception must have a real calendar date in YYYY-MM-DD format.");
    }
    if (item.status !== "closed" && item.status !== "hours") {
      throw new TypeError("An availability exception must be closed or provide replacement hours.");
    }
    const intervals = validateIntervals(item.intervals, `Exception ${item.date}`);
    if (item.status === "closed" && intervals.length !== 0) {
      throw new TypeError("A closed-date exception cannot contain opening intervals.");
    }
    if (item.status === "hours" && intervals.length === 0) {
      throw new TypeError("A replacement-hours exception must contain at least one opening interval.");
    }
    return { date: item.date, status: item.status, intervals };
  }).sort((a, b) => a.date.localeCompare(b.date));
  if (new Set(exceptions.map((item) => item.date)).size !== exceptions.length) {
    throw new TypeError("An availability date can have only one exception.");
  }
  return {
    timezone: timezone.trim(),
    status: value.status,
    statusReason,
    weeklySchedule: days,
    exceptions,
  };
}
function validateCapacity(value: unknown, capabilities: unknown): CapacityLimit[] {
  if (!Array.isArray(value) || value.length > CAPABILITIES.length) {
    throw new TypeError("Capacity limits must be a list of supported PUDO activities.");
  }
  const enabled = new Set(Array.isArray(capabilities) ? capabilities : []);
  const limits = value.map((item) => {
    if (!isRecord(item) || typeof item.capabilityId !== "string" ||
      !CAPABILITIES.includes(item.capabilityId as Capability) ||
      !enabled.has(item.capabilityId)) {
      throw new TypeError("Capacity can only be configured for a currently approved PUDO capability.");
    }
    const maximum = item.maximum;
    if (typeof maximum !== "number" || !Number.isFinite(maximum) || maximum <= 0 || maximum > 1_000_000_000) {
      throw new TypeError("Each capacity maximum must be a positive number no greater than 1,000,000,000.");
    }
    if (typeof item.unit !== "string" || !item.unit.trim() || item.unit.length > 40) {
      throw new TypeError("Enter the actual unit used to measure this capacity (maximum 40 characters).");
    }
    if (!["at_a_time", "per_hour", "per_day"].includes(String(item.basis))) {
      throw new TypeError("Capacity basis must be at a time, per hour or per day.");
    }
    return {
      capabilityId: item.capabilityId as Capability,
      maximum,
      unit: item.unit.trim(),
      basis: item.basis as CapacityBasis,
    };
  }).sort((a, b) => a.capabilityId.localeCompare(b.capabilityId));
  if (new Set(limits.map((item) => item.capabilityId)).size !== limits.length) {
    throw new TypeError("Each PUDO capability can have only one capacity limit.");
  }
  return limits;
}

export function createPudoLocationOperationsStore({ db, serverTimestamp }: Dependencies) {
  const candidates = db.collection("pudoLocations");
  const activations = db.collection("pudoLocationActivations");
  const verifications = db.collection("pudoLocationVerifications");
  const capabilities = db.collection("pudoLocationCapabilities");
  const operations = db.collection("pudoLocationOperations");

  async function requirePermission(actorUid: string, transaction?: Transaction) {
    assertActor(actorUid);
    const allowed = transaction
      ? await hasStaffActionPermissionInTransaction(transaction, db, actorUid, PUDO_OPERATIONS_PERMISSION)
      : await hasStaffActionPermission(db, actorUid, PUDO_OPERATIONS_PERMISSION);
    if (!allowed) throw new Error("You are not authorised to manage PUDO availability and capacity.");
  }

  async function activeLocation(locationId: string, transaction?: Transaction) {
    const read = (ref: DocumentReference) => transaction ? transaction.get(ref) : ref.get();
    const [candidate, activation, verification, capability] = await Promise.all([
      read(candidates.doc(locationId)),
      read(activations.doc(locationId)),
      read(verifications.doc(locationId)),
      read(capabilities.doc(locationId)),
    ]);
    if (!candidate.exists) throw new Error("PUDO location not found.");
    if (candidate.data()?.lifecycle !== "active" || !activation.exists ||
      activation.data()?.status !== "active") {
      throw new Error("Only an activated and operationally active PUDO location can manage availability and capacity.");
    }
    if (verification.data()?.status !== "approved_to_activate") {
      throw new Error("Operations verification approval is required.");
    }
    const enabled = capability.data()?.capabilities;
    if (!Array.isArray(enabled) || enabled.length === 0) {
      throw new Error("At least one approved PUDO capability is required.");
    }
    return { candidate, activation, verification, capability };
  }

  return {
    async listActiveLocations(actorUid: string) {
      await requirePermission(actorUid);
      const snapshot = await candidates.where("lifecycle", "==", "active").limit(200).get();
      const locations = await Promise.all(snapshot.docs.map(async (document) => {
        const activation = await activations.doc(document.id).get();
        if (!activation.exists || activation.data()?.status !== "active") return null;
        const data = document.data();
        return {
          locationId: document.id,
          name: typeof data.name === "string" ? data.name : "PUDO location",
          address: typeof data.address === "string" ? data.address : "",
          partnerBusinessName: typeof data.partnerBusinessName === "string" ? data.partnerBusinessName : "",
          operationalStatus: activation.data()?.status ?? "unknown",
        };
      }));
      return locations.filter((item) => item !== null).sort((a, b) => a.name.localeCompare(b.name));
    },

    async getOperations(actorUid: string, locationId: string) {
      assertLocationId(locationId);
      await requirePermission(actorUid);
      const records = await activeLocation(locationId);
      const snapshot = await operations.doc(locationId).get();
      const data = snapshot.exists ? snapshot.data()! : null;
      return {
        location: {
          locationId,
          name: records.candidate.data()?.name ?? "PUDO location",
          address: records.candidate.data()?.address ?? "",
          partnerBusinessName: records.candidate.data()?.partnerBusinessName ?? "",
          operationalStatus: records.activation.data()?.status ?? "unknown",
        },
        capabilities: records.capability.data()?.capabilities as Capability[],
        availability: data?.availability ?? null,
        capacity: (data?.capacity ?? []) as CapacityLimit[],
        version: typeof data?.version === "number" ? data.version : 0,
        configuredBy: data?.configuredBy ?? null,
        configuredAt: data?.configuredAt ?? null,
        reason: data?.reason ?? null,
        history: snapshot.exists
          ? (await operations.doc(locationId).collection("versions")
            .orderBy("version", "desc").limit(25).get()).docs.map((item) => ({
              versionId: item.id, ...item.data(),
            }))
          : [],
      };
    },

    async saveOperations(actorUid: string, locationId: string, input: {
      availability: unknown; capacity: unknown; reason: unknown;
    }) {
      assertActor(actorUid);
      assertLocationId(locationId);
      const availability = validateAvailability(input?.availability);
      const reason = requiredReason(input?.reason);
      const candidateRef = candidates.doc(locationId);
      const activationRef = activations.doc(locationId);
      const verificationRef = verifications.doc(locationId);
      const capabilityRef = capabilities.doc(locationId);
      const operationRef = operations.doc(locationId);
      const versionRef = operationRef.collection("versions");
      const auditRef = candidateRef.collection("auditEvents").doc();

      return db.runTransaction(async (transaction) => {
        await requirePermission(actorUid, transaction);
        const [candidate, activation, verification, capability, current] = await Promise.all([
          transaction.get(candidateRef),
          transaction.get(activationRef),
          transaction.get(verificationRef),
          transaction.get(capabilityRef),
          transaction.get(operationRef),
        ]);
        if (!candidate.exists) throw new Error("PUDO location not found.");
        if (candidate.data()?.lifecycle !== "active" || !activation.exists ||
          activation.data()?.status !== "active") {
          throw new Error("Only an activated and operationally active PUDO location can manage availability and capacity.");
        }
        if (verification.data()?.status !== "approved_to_activate") {
          throw new Error("Operations verification approval is required.");
        }
        const enabled = capability.data()?.capabilities;
        if (!Array.isArray(enabled) || enabled.length === 0) {
          throw new Error("At least one approved PUDO capability is required.");
        }
        const capacity = validateCapacity(input?.capacity, enabled);
        const previous = current.exists ? current.data()! : null;
        const version = Number(previous?.version ?? 0) + 1;
        const now = serverTimestamp();
        const versionDocument = versionRef.doc(`v${String(version).padStart(6, "0")}`);
        const versionData = {
          locationId, version, availability, capacity, reason,
          configuredBy: actorUid, configuredAt: now, schemaVersion: 1,
        };
        transaction.set(operationRef, {
          locationId, version, availability, capacity, reason,
          configuredBy: actorUid, configuredAt: now, schemaVersion: 1,
        });
        transaction.create(versionDocument, versionData);
        transaction.create(auditRef, {
          action: "availability_capacity_configured", locationId, actorUid,
          timestamp: now, version, availabilityStatus: availability.status,
          capacityLimitCount: capacity.length, reason,
        });
        return { locationId, version, availability, capacity };
      });
    },
  };
}
