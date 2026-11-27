/**
 * Pure shipment-domain rules.
 *
 * Deliberately database-agnostic: callers must inject persistence and must not
 * initialise Firebase/Firestore from this module.
 */

export const SHIPMENT_SERVICES = Object.freeze([
  "pudo_to_pudo",
  "door_to_pudo",
  "pudo_to_door",
  "door_to_door",
]);

export const SHIPMENT_STATUSES = Object.freeze([
  "Submitted",
  "Under Review",
  "Quoted",
  "Awaiting Payment",
  "Confirmed",
  "Awaiting Collection",
  "Collected",
  "Received at PUDO",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Rejected",
  "Cancelled",
  "Payment Failed",
  "Collection Failed",
  "Delivery Failed",
  "Returned",
]);

const CANCELLABLE_STATUSES = new Set([
  "Submitted",
  "Under Review",
  "Quoted",
  "Awaiting Payment",
]);

const PUDO_ORIGIN_SERVICES = new Set(["pudo_to_pudo", "pudo_to_door"]);
const DOOR_ORIGIN_SERVICES = new Set(["door_to_pudo", "door_to_door"]);

export class ShipmentDomainError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ShipmentDomainError";
    this.code = code;
  }
}

function requireText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ShipmentDomainError("INVALID_INPUT", `${field} is required.`);
  }
  return value.trim();
}

/**
 * Creates a minimal customer profile for a PUDO walk-in submission.
 * This is a profile proposal only; it must never create Firebase Auth users.
 */
export function createWalkInCustomerProfile({ fullName, phone, email = null }, actor) {
  if (actor?.type !== "pudo_partner" || !actor?.id) {
    throw new ShipmentDomainError(
      "FORBIDDEN_ACTOR",
      "Only an authenticated PUDO partner may register a walk-in customer."
    );
  }

  const normalizedEmail =
    typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;

  return Object.freeze({
    fullName: requireText(fullName, "Customer name"),
    phone: requireText(phone, "Customer phone"),
    email: normalizedEmail,
    authUid: null,
    accountStatus: "pending_registration",
    createdVia: "pudo_walk_in",
    createdBy: { type: "pudo_partner", id: actor.id },
  });
}

export function assertCanCancelShipment(shipment, actor, reason) {
  requireText(reason, "Cancellation reason");
  if (!["customer", "admin"].includes(actor?.type) || !actor?.id) {
    throw new ShipmentDomainError("FORBIDDEN_ACTOR", "Only the owning customer or Admin may cancel.");
  }
  if (!CANCELLABLE_STATUSES.has(shipment?.status)) {
    throw new ShipmentDomainError("CANCELLATION_CLOSED", "This shipment is no longer cancellable.");
  }
  if (
    shipment?.paymentStatus === "successful" ||
    shipment?.bookingConfirmedAt ||
    shipment?.status === "Confirmed"
  ) {
    throw new ShipmentDomainError("PAYMENT_OR_CONFIRMATION_EXISTS", "A paid or confirmed shipment cannot be cancelled in the initial release.");
  }
  if (actor.type === "customer" && shipment.customerId !== actor.id) {
    throw new ShipmentDomainError("FORBIDDEN_OWNER", "Customers may cancel only their own shipment.");
  }

  return Object.freeze({
    status: "Cancelled",
    quoteAction: shipment.quoteId ? "withdraw" : "none",
    audit: Object.freeze({
      actor: { type: actor.type, id: actor.id },
      reason: reason.trim(),
    }),
  });
}

export function assertCanRejectShipment(shipment, actor, reason) {
  requireText(reason, "Rejection reason");
  if (actor?.type !== "admin" || !actor?.id) {
    throw new ShipmentDomainError("FORBIDDEN_ACTOR", "Only Admin may reject a shipment.");
  }
  if (!["Quoted", "Awaiting Payment"].includes(shipment?.status) || !shipment?.quoteId) {
    throw new ShipmentDomainError("REJECTION_NOT_ALLOWED", "Rejection is allowed only after quotation and before acceptance/payment.");
  }
  if (shipment.quoteAcceptedAt || shipment.paymentStatus === "successful" || shipment.bookingConfirmedAt) {
    throw new ShipmentDomainError("REJECTION_NOT_ALLOWED", "An accepted, paid or confirmed shipment cannot be rejected.");
  }

  return Object.freeze({
    status: "Rejected",
    quoteAction: "withdraw",
    audit: Object.freeze({
      actor: { type: "admin", id: actor.id },
      reason: reason.trim(),
    }),
  });
}

export function assertCanEditDeclaredMeasurements({ reviewStatus, actor }) {
  if (actor?.type !== "admin" || !actor?.id) {
    throw new ShipmentDomainError("FORBIDDEN_ACTOR", "Only Admin may amend declared measurements during review.");
  }
  if (reviewStatus !== "open") {
    throw new ShipmentDomainError("MEASUREMENT_REVIEW_LOCKED", "Declared measurements are locked after review is closed.");
  }
  return true;
}

export function closeMeasurementReview({ reviewStatus, actor }) {
  if (actor?.type !== "admin" || !actor?.id) {
    throw new ShipmentDomainError("FORBIDDEN_ACTOR", "Only Admin may close the declared-measurement review.");
  }
  if (reviewStatus !== "open") {
    throw new ShipmentDomainError("MEASUREMENT_REVIEW_NOT_OPEN", "Only an open measurement review can be closed.");
  }
  return Object.freeze({
    reviewStatus: "closed",
    locked: true,
    closedBy: { type: "admin", id: actor.id },
  });
}

/**
 * Returns the next handover status only when the service-specific physical
 * evidence is present. This does not create custody evidence or persist data.
 */
export function deriveHandoverStatus({ serviceType, evidence }) {
  if (!SHIPMENT_SERVICES.includes(serviceType)) {
    throw new ShipmentDomainError("INVALID_SERVICE", "Unsupported shipment service type.");
  }

  if (PUDO_ORIGIN_SERVICES.has(serviceType)) {
    if (
      evidence?.kind !== "pudo_intake" ||
      evidence?.completed !== true ||
      !Array.isArray(evidence.photoEvidenceRefs) ||
      evidence.photoEvidenceRefs.length === 0 ||
      !evidence.pudoLocationId
    ) {
      throw new ShipmentDomainError(
        "PUDO_INTAKE_EVIDENCE_REQUIRED",
        "PUDO-origin handover requires completed intake, a PUDO location and photo evidence."
      );
    }
    return "Received at PUDO";
  }

  if (DOOR_ORIGIN_SERVICES.has(serviceType)) {
    if (
      evidence?.kind !== "door_pickup" ||
      evidence?.physicallyCollected !== true ||
      !evidence.assignmentId ||
      !evidence.operatorId
    ) {
      throw new ShipmentDomainError(
        "PHYSICAL_COLLECTION_EVIDENCE_REQUIRED",
        "Door-origin handover requires an assigned operator and proof of actual physical collection."
      );
    }
    return "Collected";
  }

  throw new ShipmentDomainError("INVALID_SERVICE", "Unsupported shipment service type.");
}

export function isPudoOriginService(serviceType) {
  return PUDO_ORIGIN_SERVICES.has(serviceType);
}

export function isDoorOriginService(serviceType) {
  return DOOR_ORIGIN_SERVICES.has(serviceType);
}
