/**
 * Remaining Phase 3 foundational record contracts.
 * These records are database-independent; binary files remain in protected Storage.
 */
import { ShipmentDomainError } from "./domain.mjs";

function invalid(field, message = "is invalid") {
  throw new ShipmentDomainError("INVALID_CONTRACT", `${field} ${message}.`);
}
function text(value, field) {
  if (typeof value !== "string" || !value.trim()) invalid(field, "is required");
  return value.trim();
}
function actor(value, field = "actor") {
  if (!value || !["customer", "admin", "pudo_partner", "system"].includes(value.type)) invalid(field, "has an unsupported type");
  return Object.freeze({ type: value.type, id: text(value.id, `${field}.id`) });
}
function timestamp(value, field) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) invalid(field, "must be an ISO-compatible timestamp");
  return new Date(value).toISOString();
}
function positive(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) invalid(field, "must be positive");
  return value;
}

/** One completed physical intake record may cover one or more parcels. */
export function createParcelIntakeContract(input) {
  if (!input || typeof input !== "object") invalid("parcelIntake");
  const parcelIds = [...new Set((input.parcelIds ?? []).map((id, i) => text(id, `parcelIds[${i}]`)))];
  if (!parcelIds.length) invalid("parcelIds", "must contain at least one parcel");
  const photos = [...new Set((input.photoEvidenceRefs ?? []).map((ref, i) => text(ref, `photoEvidenceRefs[${i}]`)))];
  if (!photos.length) invalid("photoEvidenceRefs", "must contain at least one photo");
  if (!Array.isArray(input.measurements ?? [])) invalid("measurements", "must be an array");
  if ((input.measurements ?? []).some(item => !parcelIds.includes(item.parcelId))) invalid("measurements.parcelId", "must reference a parcel included in this intake");
  if (input.status !== "completed") invalid("status", "must be completed when persisted as an intake record");
  const type = input.intakeType;
  if (!["station_drop_off", "door_pickup_arrival", "transfer_arrival"].includes(type)) invalid("intakeType", "is unsupported");
  if (!["pudo", "door_pickup_operator"].includes(input.receivingLocationType)) invalid("receivingLocationType", "is unsupported");
  return Object.freeze({
    intakeId: text(input.intakeId, "intakeId"),
    shipmentId: text(input.shipmentId, "shipmentId"),
    parcelIds: Object.freeze(parcelIds),
    intakeType: type,
    receivingLocationType: input.receivingLocationType,
    pudoLocationId: input.pudoLocationId == null ? null : text(input.pudoLocationId, "pudoLocationId"),
    receivedBy: actor(input.receivedBy, "receivedBy"),
    personnelId: input.personnelId == null ? null : text(input.personnelId, "personnelId"),
    receivedAt: timestamp(input.receivedAt, "receivedAt"),
    recordedAt: timestamp(input.recordedAt, "recordedAt"),
    condition: text(input.condition, "condition"),
    measurements: Object.freeze((input.measurements ?? []).map((measurement, i) => Object.freeze({
      parcelId: text(measurement.parcelId, `measurements[${i}].parcelId`),
      measuredWeight: positive(measurement.measuredWeight, `measurements[${i}].measuredWeight`),
      weightUnit: text(measurement.weightUnit, `measurements[${i}].weightUnit`),
      dimensions: Object.freeze({
        length: positive(measurement.dimensions?.length, `measurements[${i}].dimensions.length`),
        width: positive(measurement.dimensions?.width, `measurements[${i}].dimensions.width`),
        height: positive(measurement.dimensions?.height, `measurements[${i}].dimensions.height`),
        unit: text(measurement.dimensions?.unit, `measurements[${i}].dimensions.unit`),
      }),
    }))),
    discrepancies: Object.freeze([...(input.discrepancies ?? [])].map((item, i) => text(item, `discrepancies[${i}]`))),
    notes: input.notes == null ? null : text(input.notes, "notes"),
    photoEvidenceRefs: Object.freeze(photos),
    status: "completed",
    completedAt: timestamp(input.completedAt, "completedAt"),
    correctionOfIntakeId: input.correctionOfIntakeId == null ? null : text(input.correctionOfIntakeId, "correctionOfIntakeId"),
  });
}

/** Assignment describes responsibility only; it never asserts physical custody. */
export function createShipmentAssignmentContract(input) {
  if (!input || typeof input !== "object") invalid("assignment");
  const startsAt = timestamp(input.startsAt, "startsAt");
  const endsAt = input.endsAt == null ? null : timestamp(input.endsAt, "endsAt");
  if (endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) invalid("endsAt", "must be later than startsAt");
  const assigneeType = input.assignee?.type;
  if (!["pudo_location", "pudo_personnel", "operator"].includes(assigneeType)) invalid("assignee.type", "is unsupported");
  return Object.freeze({
    assignmentId: text(input.assignmentId, "assignmentId"),
    shipmentId: text(input.shipmentId, "shipmentId"),
    activityType: text(input.activityType, "activityType"),
    assignee: Object.freeze({ type: assigneeType, id: text(input.assignee.id, "assignee.id") }),
    assignedBy: actor(input.assignedBy, "assignedBy"),
    startsAt,
    endsAt,
    status: ["active", "completed", "cancelled", "superseded"].includes(input.status) ? input.status : invalid("status", "is unsupported"),
    createdAt: timestamp(input.createdAt, "createdAt"),
    reason: input.reason == null ? null : text(input.reason, "reason"),
    supersedesAssignmentId: input.supersedesAssignmentId == null ? null : text(input.supersedesAssignmentId, "supersedesAssignmentId"),
  });
}

/** Firestore stores metadata only; file bytes live in protected object storage. */
export function createShipmentDocumentContract(input) {
  if (!input || typeof input !== "object") invalid("shipmentDocument");
  const access = [...new Set((input.access ?? []).map((item, i) => {
    if (!["customer", "recipient", "admin", "pudo"].includes(item)) invalid(`access[${i}]`, "is unsupported");
    return item;
  }))];
  if (!access.length) invalid("access", "must not be empty");
  if (input.version < 1 || !Number.isSafeInteger(input.version)) invalid("version", "must be a positive integer");
  return Object.freeze({
    documentId: text(input.documentId, "documentId"),
    shipmentId: text(input.shipmentId, "shipmentId"),
    documentType: text(input.documentType, "documentType"),
    version: input.version,
    storagePath: text(input.storagePath, "storagePath"),
    contentType: text(input.contentType, "contentType"),
    sizeBytes: Number.isSafeInteger(input.sizeBytes) && input.sizeBytes > 0 ? input.sizeBytes : invalid("sizeBytes", "must be a positive integer"),
    checksum: text(input.checksum, "checksum"),
    generatedAt: timestamp(input.generatedAt, "generatedAt"),
    generatedBy: actor(input.generatedBy, "generatedBy"),
    access: Object.freeze(access),
    supersedesDocumentId: input.supersedesDocumentId == null ? null : text(input.supersedesDocumentId, "supersedesDocumentId"),
  });
}

/** Notification intent is persisted separately from each immutable delivery attempt. */
export function createNotificationContract(input) {
  if (!input || typeof input !== "object") invalid("notification");
  const channel = input.channel;
  if (!["email", "in_app"].includes(channel)) invalid("channel", "is unsupported");
  const status = input.status ?? "pending";
  if (input.payload != null && (typeof input.payload !== "object" || Array.isArray(input.payload))) invalid("payload", "must be an object");
  if (!["pending", "processing", "delivered", "failed", "cancelled"].includes(status)) invalid("status", "is unsupported");
  return Object.freeze({
    notificationId: text(input.notificationId, "notificationId"),
    shipmentId: text(input.shipmentId, "shipmentId"),
    recipientType: ["customer", "recipient", "admin", "pudo"].includes(input.recipientType) ? input.recipientType : invalid("recipientType", "is unsupported"),
    recipientId: text(input.recipientId, "recipientId"),
    channel,
    templateKey: text(input.templateKey, "templateKey"),
    deduplicationKey: text(input.deduplicationKey, "deduplicationKey"),
    payload: Object.freeze({ ...(input.payload ?? {}) }),
    status,
    createdAt: timestamp(input.createdAt, "createdAt"),
    updatedAt: timestamp(input.updatedAt ?? input.createdAt, "updatedAt"),
    nextAttemptAt: input.nextAttemptAt == null ? null : timestamp(input.nextAttemptAt, "nextAttemptAt"),
  });
}

export function createNotificationAttemptContract(input) {
  if (!input || typeof input !== "object") invalid("notificationAttempt");
  if (!["delivered", "failed"].includes(input.status)) invalid("status", "must be delivered or failed");
  return Object.freeze({
    attemptId: text(input.attemptId, "attemptId"),
    notificationId: text(input.notificationId, "notificationId"),
    attemptedAt: timestamp(input.attemptedAt, "attemptedAt"),
    status: input.status,
    provider: text(input.provider, "provider"),
    providerMessageId: input.providerMessageId == null ? null : text(input.providerMessageId, "providerMessageId"),
    errorCode: input.errorCode == null ? null : text(input.errorCode, "errorCode"),
    errorMessage: input.errorMessage == null ? null : text(input.errorMessage, "errorMessage"),
  });
}
