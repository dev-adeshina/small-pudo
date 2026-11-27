/**
 * Canonical, database-independent shipment record contracts.
 * Monetary amounts are integer minor units (NGN kobo for NGN).
 * These validators normalise input but do not persist or authorise it.
 */
import { ShipmentDomainError, SHIPMENT_SERVICES, SHIPMENT_STATUSES } from "./domain.mjs";

export const SHIPMENT_CHANNELS = Object.freeze(["customer_portal", "admin_assisted", "pudo_walk_in"]);
export const ACTOR_TYPES = Object.freeze(["customer", "admin", "pudo_partner", "system"]);
export const ENDPOINT_TYPES = Object.freeze(["pudo", "address"]);
export const PARCEL_MEASUREMENT_UNITS = Object.freeze(["cm", "in"]);
export const WEIGHT_UNITS = Object.freeze(["kg", "g"]);
export const PAYMENT_STATUSES = Object.freeze(["initialised", "pending", "successful", "failed", "abandoned", "refunded", "partially_refunded"]);
export const EVENT_VISIBILITY = Object.freeze(["customer", "recipient", "pudo", "admin"]);
export const MEASUREMENT_REVIEW_STATUSES = Object.freeze(["open", "closed"]);

function invalid(field, message = "is invalid") {
  throw new ShipmentDomainError("INVALID_CONTRACT", `${field} ${message}.`);
}
function text(value, field) {
  if (typeof value !== "string" || !value.trim()) invalid(field, "is required");
  return value.trim();
}
function enumValue(value, values, field) {
  if (!values.includes(value)) invalid(field, "has an unsupported value");
  return value;
}
function finitePositive(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) invalid(field, "must be a positive number");
  return value;
}
function nonNegativeInteger(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) invalid(field, "must be a non-negative safe integer");
  return value;
}
function timestamp(value, field) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) invalid(field, "must be an ISO-compatible timestamp");
  return new Date(value).toISOString();
}
function actor(value, field = "actor") {
  if (!value || !ACTOR_TYPES.includes(value.type)) invalid(field, "has an unsupported type");
  return Object.freeze({ type: value.type, id: text(value.id, `${field}.id`) });
}
function contact(value, field) {
  if (!value || typeof value !== "object") invalid(field, "is required");
  return Object.freeze({
    customerId: value.customerId == null ? null : text(value.customerId, `${field}.customerId`),
    fullName: text(value.fullName, `${field}.fullName`),
    phone: text(value.phone, `${field}.phone`),
    email: value.email == null || value.email === "" ? null : text(value.email, `${field}.email`).toLowerCase(),
    country: value.country == null ? null : text(value.country, `${field}.country`),
    state: value.state == null ? null : text(value.state, `${field}.state`),
    city: value.city == null ? null : text(value.city, `${field}.city`),
    addressDescription: value.addressDescription == null ? null : text(value.addressDescription, `${field}.addressDescription`),
  });
}
function endpoint(value, field) {
  if (!value || typeof value !== "object") invalid(field, "is required");
  const type = enumValue(value.type, ENDPOINT_TYPES, `${field}.type`);
  if (type === "pudo") return Object.freeze({ type, pudoLocationId: text(value.pudoLocationId, `${field}.pudoLocationId`) });
  return Object.freeze({
    type,
    country: text(value.country, `${field}.country`),
    state: text(value.state, `${field}.state`),
    city: text(value.city, `${field}.city`),
    addressDescription: text(value.addressDescription, `${field}.addressDescription`),
  });
}

export function createShipmentContract(input) {
  if (!input || typeof input !== "object") invalid("shipment");
  const serviceType = enumValue(input.serviceType, SHIPMENT_SERVICES, "serviceType");
  const createdVia = enumValue(input.createdVia, SHIPMENT_CHANNELS, "createdVia");
  const createdBy = actor(input.createdBy, "createdBy");
  if (createdVia === "customer_portal" && createdBy.type !== "customer") invalid("createdBy", "must be a customer for customer_portal");
  if (createdVia === "admin_assisted" && createdBy.type !== "admin") invalid("createdBy", "must be an admin for admin_assisted");
  if (createdVia === "pudo_walk_in" && createdBy.type !== "pudo_partner") invalid("createdBy", "must be a PUDO partner for pudo_walk_in");
  if (input.status !== "Submitted") invalid("status", "must begin at Submitted");
  const customerId = text(input.customerId, "customerId");
  const origin = endpoint(input.origin, "origin");
  const destination = endpoint(input.destination, "destination");
  const expectedEndpoints = {
    pudo_to_pudo: ["pudo", "pudo"],
    door_to_pudo: ["address", "pudo"],
    pudo_to_door: ["pudo", "address"],
    door_to_door: ["address", "address"],
  }[serviceType];
  if (origin.type !== expectedEndpoints[0] || destination.type !== expectedEndpoints[1]) {
    invalid("origin/destination", `must match the ${serviceType} service endpoints`);
  }
  if (createdVia === "pudo_walk_in" && input.customerAccountStatus !== "pending_registration" && input.customerAccountStatus !== "registered") {
    invalid("customerAccountStatus", "must identify a pending or registered customer");
  }
  return Object.freeze({
    shipmentReference: text(input.shipmentReference, "shipmentReference"),
    customerId,
    createdBy,
    createdVia,
    status: "Submitted",
    measurementReviewStatus: enumValue(input.measurementReviewStatus ?? "open", MEASUREMENT_REVIEW_STATUSES, "measurementReviewStatus"),
    serviceType,
    sender: contact(input.sender, "sender"),
    recipient: contact(input.recipient, "recipient"),
    origin,
    destination,
    submittedAt: timestamp(input.submittedAt, "submittedAt"),
    createdAt: timestamp(input.createdAt ?? input.submittedAt, "createdAt"),
    updatedAt: timestamp(input.updatedAt ?? input.submittedAt, "updatedAt"),
    quoteId: null,
    acceptedQuoteRevisionId: null,
    paymentId: null,
    bookingConfirmedAt: null,
  });
}

export function createParcelContract(input) {
  if (!input || typeof input !== "object") invalid("parcel");
  const quantity = input.quantity ?? 1;
  if (!Number.isSafeInteger(quantity) || quantity < 1) invalid("quantity", "must be a positive integer");
  const measurementUnit = enumValue(input.measurementUnit ?? "cm", PARCEL_MEASUREMENT_UNITS, "measurementUnit");
  const weightUnit = enumValue(input.weightUnit ?? "kg", WEIGHT_UNITS, "weightUnit");
  const measurements = input.measurements;
  if (!measurements || typeof measurements !== "object") invalid("measurements");
  return Object.freeze({
    parcelReference: text(input.parcelReference, "parcelReference"),
    description: text(input.description, "description"),
    quantity,
    declaredWeight: finitePositive(input.declaredWeight, "declaredWeight"),
    weightUnit,
    dimensions: Object.freeze({
      length: finitePositive(measurements.length, "dimensions.length"),
      width: finitePositive(measurements.width, "dimensions.width"),
      height: finitePositive(measurements.height, "dimensions.height"),
      unit: measurementUnit,
    }),
    declaredValueMinor: nonNegativeInteger(input.declaredValueMinor, "declaredValueMinor"),
    currency: text(input.currency ?? "NGN", "currency").toUpperCase(),
    measurementReview: Object.freeze({
      status: enumValue(input.measurementReview?.status ?? "open", MEASUREMENT_REVIEW_STATUSES, "measurementReview.status"),
      lockedAt: input.measurementReview?.lockedAt ? timestamp(input.measurementReview.lockedAt, "measurementReview.lockedAt") : null,
    }),
    intakeMeasurements: null,
  });
}

export function createQuoteRevisionContract(input) {
  if (!input || typeof input !== "object") invalid("quoteRevision");
  const validUntil = timestamp(input.validUntil, "validUntil");
  const issuedAt = timestamp(input.issuedAt, "issuedAt");
  if (Date.parse(validUntil) <= Date.parse(issuedAt)) invalid("validUntil", "must be later than issuedAt");
  const lineItems = Array.isArray(input.lineItems) ? input.lineItems.map((item, index) => Object.freeze({
    code: text(item.code, `lineItems[${index}].code`),
    description: text(item.description, `lineItems[${index}].description`),
    amountMinor: nonNegativeInteger(item.amountMinor, `lineItems[${index}].amountMinor`),
  })) : invalid("lineItems", "must be an array");
  const totalMinor = nonNegativeInteger(input.totalMinor, "totalMinor");
  if (lineItems.reduce((sum, item) => sum + item.amountMinor, 0) !== totalMinor) invalid("totalMinor", "must equal the sum of line items");
  return Object.freeze({
    revisionId: text(input.revisionId, "revisionId"),
    revisionNumber: nonNegativeInteger(input.revisionNumber, "revisionNumber") || invalid("revisionNumber", "must be at least 1"),
    shipmentId: text(input.shipmentId, "shipmentId"),
    currency: text(input.currency ?? "NGN", "currency").toUpperCase(),
    lineItems: Object.freeze(lineItems),
    totalMinor,
    pricingVersion: text(input.pricingVersion, "pricingVersion"),
    issuedBy: actor(input.issuedBy, "issuedBy"),
    issuedAt,
    validUntil,
    acceptedAt: null,
    acceptedBy: null,
  });
}

export function createPaymentAttemptContract(input) {
  if (!input || typeof input !== "object") invalid("payment");
  return Object.freeze({
    paymentId: text(input.paymentId, "paymentId"),
    shipmentId: text(input.shipmentId, "shipmentId"),
    quoteRevisionId: text(input.quoteRevisionId, "quoteRevisionId"),
    provider: enumValue(input.provider, ["paystack"], "provider"),
    providerReference: text(input.providerReference, "providerReference"),
    amountMinor: nonNegativeInteger(input.amountMinor, "amountMinor"),
    currency: text(input.currency ?? "NGN", "currency").toUpperCase(),
    status: enumValue(input.status, PAYMENT_STATUSES, "status"),
    createdAt: timestamp(input.createdAt, "createdAt"),
    verifiedAt: input.verifiedAt ? timestamp(input.verifiedAt, "verifiedAt") : null,
  });
}

export function createShipmentEventContract(input) {
  if (!input || typeof input !== "object") invalid("event");
  const visibility = Array.isArray(input.visibility) ? [...new Set(input.visibility.map(value => enumValue(value, EVENT_VISIBILITY, "visibility")))] : invalid("visibility", "must be an array");
  if (!visibility.length) invalid("visibility", "must not be empty");
  return Object.freeze({
    eventId: text(input.eventId, "eventId"),
    shipmentId: text(input.shipmentId, "shipmentId"),
    eventType: text(input.eventType, "eventType"),
    actor: actor(input.actor),
    occurredAt: timestamp(input.occurredAt, "occurredAt"),
    visibility: Object.freeze(visibility),
    summary: text(input.summary, "summary"),
    evidenceRefs: Object.freeze([...(input.evidenceRefs ?? [])].map((ref, index) => text(ref, `evidenceRefs[${index}]`))),
    idempotencyKey: text(input.idempotencyKey, "idempotencyKey"),
  });
}

/** Event records are append-only: corrections are compensating events, never edits. */
export function assertEventAppendOnlyOperation(operation) {
  if (operation !== "create") invalid("event", "records are append-only and may only be created");
  return true;
}

/** Physical intake observations are separate from declared parcel measurements. */
export function createIntakeMeasurementObservation(input) {
  if (!input || typeof input !== "object") invalid("intakeMeasurement");
  const photoEvidenceRefs = [...(input.photoEvidenceRefs ?? [])].map((ref, index) => text(ref, `photoEvidenceRefs[${index}]`));
  if (photoEvidenceRefs.length === 0) invalid("photoEvidenceRefs", "must contain at least one intake photo");
  return Object.freeze({
    intakeId: text(input.intakeId, "intakeId"),
    parcelId: text(input.parcelId, "parcelId"),
    measuredWeight: finitePositive(input.measuredWeight, "measuredWeight"),
    weightUnit: enumValue(input.weightUnit, WEIGHT_UNITS, "weightUnit"),
    dimensions: Object.freeze({
      length: finitePositive(input.dimensions?.length, "dimensions.length"),
      width: finitePositive(input.dimensions?.width, "dimensions.width"),
      height: finitePositive(input.dimensions?.height, "dimensions.height"),
      unit: enumValue(input.dimensions?.unit, PARCEL_MEASUREMENT_UNITS, "dimensions.unit"),
    }),
    measuredAt: timestamp(input.measuredAt, "measuredAt"),
    measuredBy: actor(input.measuredBy, "measuredBy"),
    photoEvidenceRefs: Object.freeze(photoEvidenceRefs),
  });
}
