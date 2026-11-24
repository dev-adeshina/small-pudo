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
      !Number.isFinite(new Date(`${item.date}T00:00:00.000Z`).getTime()) ||
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
    const status: AvailabilityException["status"] = item.status;
    return { date: item.date, status, intervals };
  }).sort((a, b) => a.date.localeCompare(b.date));
  if (new Set(exceptions.map((item) => item.date)).size !== exceptions.length) {
    throw new TypeError("An availability date can have only one exception.");
  }
  if (value.status === "available" &&
    days.every((day) => day.intervals.length === 0) &&
    exceptions.every((item) => item.status !== "hours")) {
    throw new TypeError("An available PUDO location must have at least one opening interval in its weekly schedule or date exceptions.");
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

const PUDO_DIRECTORY_PERMISSION = "pudo_location.view_directory";

export function resolveCurrentAvailability(availability: unknown, now = new Date()):
  "not_configured" | "temporarily_unavailable" | "open_now" | "closed_now" {
  if (!isRecord(availability)) return "not_configured";
  if (availability.status === "unavailable") return "temporarily_unavailable";
  if (availability.status !== "available" ||
    typeof availability.timezone !== "string" || !Array.isArray(availability.weeklySchedule)) {
    return "not_configured";
  }

  let parts: Record<string, string> = {};
  try {
    parts = Object.fromEntries(new Intl.DateTimeFormat("en", {
      timeZone: availability.timezone,
      year: "numeric", month: "2-digit", day: "2-digit",
      weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(now).map((part) => [part.type, part.value]));
  } catch {
    return "not_configured";
  }

  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  const minuteOfDay = Number(parts.hour) * 60 + Number(parts.minute);
  if (weekday < 0 || !Number.isFinite(minuteOfDay)) return "not_configured";

  const exceptions = availability.exceptions;
  const exception = Array.isArray(exceptions)
    ? exceptions.find((item) => isRecord(item) && item.date === date)
    : undefined;
  let intervals: unknown;
  if (exception && isRecord(exception)) {
    if (exception.status === "closed") return "closed_now";
    intervals = exception.status === "hours" ? exception.intervals : undefined;
  } else {
    const day = availability.weeklySchedule.find((item) =>
      isRecord(item) && item.dayOfWeek === weekday);
    intervals = isRecord(day) ? day.intervals : undefined;
  }

  if (!Array.isArray(intervals) || intervals.length === 0) return "closed_now";
  const open = intervals.some((item) => {
    if (!isRecord(item) || typeof item.start !== "string" || typeof item.end !== "string") return false;
    const start = Number(item.start.slice(0, 2)) * 60 + Number(item.start.slice(3, 5));
    const end = Number(item.end.slice(0, 2)) * 60 + Number(item.end.slice(3, 5));
    return Number.isFinite(start) && Number.isFinite(end) && minuteOfDay >= start && minuteOfDay < end;
  });
  return open ? "open_now" : "closed_now";
}

export function createPudoLocationOperationsStore({ db, serverTimestamp }: Dependencies) {
  const candidates = db.collection("pudoLocations");
  const activations = db.collection("pudoLocationActivations");
  const verifications = db.collection("pudoLocationVerifications");
  const capabilities = db.collection("pudoLocationCapabilities");
  const operations = db.collection("pudoLocationOperations");
  const operationsReviews = db.collection("pudoLocationOperationsReviews");
  const OPERATIONS_REVIEW_PERMISSION = "commercial_operational_evidence.review";

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

    async listOperationalDirectory(actorUid: string) {
      assertActor(actorUid);
      if (!await hasStaffActionPermission(db, actorUid, PUDO_DIRECTORY_PERMISSION)) {
        throw new Error("You are not authorised to view the operational PUDO directory.");
      }

      const snapshot = await candidates.where("lifecycle", "==", "active").limit(200).get();
      const records = await Promise.all(snapshot.docs.map(async (document) => {
        const [activation, verification, capability, operation] = await Promise.all([
          activations.doc(document.id).get(),
          verifications.doc(document.id).get(),
          capabilities.doc(document.id).get(),
          operations.doc(document.id).get(),
        ]);
        if (!activation.exists || activation.data()?.status !== "active" ||
          verification.data()?.status !== "approved_to_activate") return null;

        const enabled = capability.data()?.capabilities;
        if (!Array.isArray(enabled) || enabled.length === 0) return null;

        const candidate = document.data();
        const geo = isRecord(candidate.geo) ? candidate.geo : null;
        const latitude = typeof geo?.latitude === "number" &&
          Number.isFinite(geo.latitude) && geo.latitude >= -90 && geo.latitude <= 90
          ? geo.latitude : null;
        const longitude = typeof geo?.longitude === "number" &&
          Number.isFinite(geo.longitude) && geo.longitude >= -180 && geo.longitude <= 180
          ? geo.longitude : null;
        const operationData = operation.exists ? operation.data()! : null;
        const capabilityVersion = Number(capability.data()?.version ?? 0);
        const capacityConfigurationStale = Boolean(operation.exists &&
          Number(operationData?.capabilityVersion ?? 0) !== capabilityVersion);
        const availability = operationData?.availability ?? null;

        return {
          locationId: document.id,
          name: typeof candidate.name === "string" ? candidate.name : "PUDO location",
          partnerBusinessName: typeof candidate.partnerBusinessName === "string" ? candidate.partnerBusinessName : "",
          address: typeof candidate.address === "string" ? candidate.address : "",
          operationalStatus: "active" as const,
          geo: latitude !== null && longitude !== null ? {
            latitude, longitude,
            captureMethod: geo?.captureMethod === "device" || geo?.captureMethod === "manual"
              ? geo.captureMethod : null,
            accuracyMeters: typeof geo?.accuracyMeters === "number" &&
              Number.isFinite(geo.accuracyMeters) && geo.accuracyMeters >= 0
              ? geo.accuracyMeters : null,
          } : null,
          capabilities: enabled.filter((item): item is Capability =>
            typeof item === "string" && CAPABILITIES.includes(item as Capability)),
          availabilityState: resolveCurrentAvailability(availability),
          availabilityConfigured: Boolean(availability),
          capacity: capacityConfigurationStale ? [] :
            (Array.isArray(operationData?.capacity) ? operationData.capacity : []),
          capacityConfigurationStale,
          configurationVersion: typeof operationData?.version === "number" ? operationData.version : 0,
        };
      }));

      return records.filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    async getOperations(actorUid: string, locationId: string) {
      assertLocationId(locationId);
      await requirePermission(actorUid);
      const records = await activeLocation(locationId);
      const snapshot = await operations.doc(locationId).get();
      const data = snapshot.exists ? snapshot.data()! : null;
      const capabilityVersion = Number(records.capability.data()?.version ?? 0);
      const capacityConfigurationStale = Boolean(snapshot.exists &&
        Number(data?.capabilityVersion ?? 0) !== capabilityVersion);
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
        capacity: capacityConfigurationStale ? [] : (data?.capacity ?? []) as CapacityLimit[],
        capacityConfigurationStale,
        version: typeof data?.version === "number" ? data.version : 0,
        configuredBy: data?.configuredBy ?? null,
        configuredAt: data?.configuredAt ?? null,
        reason: data?.reason ?? null,
        history: snapshot.exists
          ? await Promise.all((await operations.doc(locationId).collection("versions")
            .orderBy("version", "desc").limit(25).get()).docs.map(async (item) => {
              const review = await operationsReviews.doc(locationId + "__" + item.id).get();
              const reviewData = review.data();
              return {
                versionId: item.id, ...item.data(),
                review: review.exists ? {
                  status: reviewData?.status ?? "pending_review",
                  reviewedBy: reviewData?.reviewedBy ?? null,
                  validUntil: reviewData?.validUntil ?? null,
                  reason: reviewData?.reason ?? null,
                } : { status: "pending_review", reviewedBy: null, validUntil: null, reason: null },
              };
            }))
          : [],
      };
    },

    async reviewOperationsVersion(actorUid: string, locationId: string, versionId: string, input: {
      decision: "approve" | "reject"; reason: string; validUntil?: Date;
    }) {
      assertActor(actorUid);
      assertLocationId(locationId);
      if (typeof versionId !== "string" || !/^v\\d{6}$/.test(versionId)) {
        throw new TypeError("A valid immutable PUDO operations version is required.");
      }
      if (input.decision !== "approve" && input.decision !== "reject") {
        throw new TypeError("Choose approve or reject for the operational configuration review.");
      }
      const reason = requiredReason(input.reason);
      if (input.decision === "approve" &&
        (!(input.validUntil instanceof Date) || !Number.isFinite(input.validUntil.getTime()) || input.validUntil <= new Date())) {
        throw new TypeError("Approval requires an explicit future validity end.");
      }
      const versionRef = operations.doc(locationId).collection("versions").doc(versionId);
      const operationRef = operations.doc(locationId);
      const reviewRef = operationsReviews.doc(locationId + "__" + versionId);
      const eventRef = reviewRef.collection("events").doc();
      return db.runTransaction(async (transaction) => {
        if (!await hasStaffActionPermissionInTransaction(transaction, db, actorUid, OPERATIONS_REVIEW_PERMISSION)) {
          throw new Error("You are not authorised to review PUDO availability and capacity.");
        }
        const [versionSnapshot, current, candidate, activation, verification, capability, previous] = await Promise.all([
          transaction.get(versionRef), transaction.get(operationRef),
          transaction.get(candidates.doc(locationId)), transaction.get(activations.doc(locationId)),
          transaction.get(verifications.doc(locationId)), transaction.get(capabilities.doc(locationId)),
          transaction.get(reviewRef),
        ]);
        if (!versionSnapshot.exists) throw new Error("PUDO operations configuration version not found.");
        const version = versionSnapshot.data()!;
        if (!current.exists || Number(current.data()?.version) !== Number(version.version) ||
          Number(current.data()?.capabilityVersion) !== Number(version.capabilityVersion) ||
          Number(capability.data()?.version ?? 0) !== Number(version.capabilityVersion)) {
          throw new Error("Only the current configuration with its current approved capability version can be reviewed.");
        }
        if (!candidate.exists || candidate.data()?.lifecycle !== "active" ||
          !activation.exists || activation.data()?.status !== "active" ||
          verification.data()?.status !== "approved_to_activate") {
          throw new Error("PUDO operations review requires an active, physically verified and activated location.");
        }
        if (version.configuredBy === actorUid) {
          throw new Error("PUDO availability and capacity review must be independent of the configuration author.");
        }
        if (previous.data()?.status === "revoked") {
          throw new Error("A revoked configuration review cannot be reinstated; save a new configuration version.");
        }
        const timestamp = serverTimestamp();
        transaction.set(reviewRef, {
          schemaVersion: 1, locationId, versionId, decision: input.decision,
          status: input.decision === "approve" ? "approved" : "rejected",
          configurationSnapshot: version,
          validUntil: input.decision === "approve" ? input.validUntil : null,
          reason, reviewedBy: actorUid, reviewedAt: timestamp, updatedAt: timestamp,
        });
        transaction.create(eventRef, {
          action: input.decision, locationId, versionId, actorUid, reason, timestamp,
        });
        return { locationId, versionId, status: input.decision === "approve" ? "approved" : "rejected" };
      });
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
        const capabilityVersion = Number(capability.data()?.version ?? 0);
        const now = serverTimestamp();
        const versionDocument = versionRef.doc(`v${String(version).padStart(6, "0")}`);
        const versionData = {
          locationId, version, capabilityVersion, availability, capacity, reason,
          configuredBy: actorUid, configuredAt: now, schemaVersion: 1,
        };
        transaction.set(operationRef, {
          locationId, version, capabilityVersion, availability, capacity, reason,
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
