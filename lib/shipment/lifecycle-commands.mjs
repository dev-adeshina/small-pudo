/**
 * Shipment lifecycle application commands for cancellation, rejection and
 * declared-measurement review. All writes are injected and transaction-scoped.
 */
import {
  assertCanCancelShipment,
  assertCanRejectShipment,
  assertCanEditDeclaredMeasurements,
  closeMeasurementReview,
} from "./domain.mjs";
import { createParcelContract, createShipmentEventContract } from "./contracts.mjs";
import { assertRepositoryPorts, runIdempotentCommand } from "./repositories.mjs";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}
function actorContext(actor, allowed) {
  if (!actor || !allowed.includes(actor.type) || typeof actor.id !== "string" || !actor.id.trim()) {
    fail("FORBIDDEN_ACTOR", "A verified authorised actor is required.");
  }
  return Object.freeze({ type: actor.type, id: actor.id.trim() });
}
function nowIso(clock) {
  const value = clock();
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) throw new TypeError("clock must return a valid Date");
  return value.toISOString();
}

export function createShipmentLifecycleCommands({ ports, idFactory, clock = () => new Date() }) {
  assertRepositoryPorts(ports);
  if (typeof idFactory !== "function") throw new TypeError("idFactory is required");
  if (typeof clock !== "function") throw new TypeError("clock must be a function");

  async function cancelShipment({ actor: actorInput, idempotencyKey, shipmentId, reason }) {
    const actor = actorContext(actorInput, ["customer", "admin"]);
    const occurredAt = nowIso(clock);
    return runIdempotentCommand({
      transaction: ports.transaction, idempotency: ports.idempotency,
      actor, key: idempotencyKey, command: "cancel_shipment",
      handler: async tx => {
        const shipment = await ports.shipments.getById(tx, shipmentId);
        if (!shipment) fail("SHIPMENT_NOT_FOUND", "Shipment does not exist.");
        const decision = assertCanCancelShipment(shipment, actor, reason);
        let resultingPaymentStatus = shipment.paymentStatus ?? null;
        if (shipment.paymentId) {
          const payment = await ports.payments.getById(tx, shipment.paymentId);
          if (!payment) fail("PAYMENT_RECORD_MISSING", "The linked payment attempt could not be found.");
          if (payment.status === "successful") fail("PAYMENT_OR_CONFIRMATION_EXISTS", "A successful payment cannot be cancelled.");
          if (["initialised", "pending"].includes(payment.status)) {
            await ports.payments.updateAttempt(tx, payment.paymentId, { status: "abandoned" });
            resultingPaymentStatus = "abandoned";
          } else {
            resultingPaymentStatus = payment.status;
          }
        }
        if (decision.quoteAction === "withdraw") {
          await ports.quotes.withdraw(tx, shipment.quoteId, {
            reason: decision.audit.reason, actor, withdrawnAt: occurredAt,
          });
        }
        await ports.shipments.update(tx, shipmentId, {
          status: "Cancelled",
          paymentStatus: resultingPaymentStatus,
          cancellationReason: decision.audit.reason,
          cancelledAt: occurredAt,
          cancelledBy: actor,
          updatedAt: occurredAt,
        });
        await ports.events.append(tx, createShipmentEventContract({
          eventId: idFactory("shipment_event"), shipmentId,
          eventType: "shipment_cancelled", actor, occurredAt,
          visibility: ["customer", "admin"],
          summary: "Shipment cancelled: " + decision.audit.reason,
          evidenceRefs: shipment.quoteId ? [shipment.quoteId] : [],
          idempotencyKey,
        }));
        return Object.freeze({ shipmentId, status: "Cancelled", cancelledAt: occurredAt });
      },
    });
  }

  async function rejectShipment({ actor: actorInput, idempotencyKey, shipmentId, reason }) {
    const actor = actorContext(actorInput, ["admin"]);
    const occurredAt = nowIso(clock);
    return runIdempotentCommand({
      transaction: ports.transaction, idempotency: ports.idempotency,
      actor, key: idempotencyKey, command: "reject_shipment",
      handler: async tx => {
        const shipment = await ports.shipments.getById(tx, shipmentId);
        if (!shipment) fail("SHIPMENT_NOT_FOUND", "Shipment does not exist.");
        const decision = assertCanRejectShipment(shipment, actor, reason);
        if (shipment.paymentId) {
          const payment = await ports.payments.getById(tx, shipment.paymentId);
          if (!payment) fail("PAYMENT_RECORD_MISSING", "The linked payment attempt could not be found.");
          if (!["failed", "abandoned"].includes(payment.status)) {
            fail("PAYMENT_ATTEMPT_ACTIVE", "A shipment with an active payment attempt cannot be rejected.");
          }
        }
        await ports.quotes.withdraw(tx, shipment.quoteId, {
          reason: decision.audit.reason, actor, withdrawnAt: occurredAt,
        });
        await ports.shipments.update(tx, shipmentId, {
          status: "Rejected",
          rejectionReason: decision.audit.reason,
          rejectedAt: occurredAt,
          rejectedBy: actor,
          updatedAt: occurredAt,
        });
        await ports.events.append(tx, createShipmentEventContract({
          eventId: idFactory("shipment_event"), shipmentId,
          eventType: "shipment_rejected", actor, occurredAt,
          visibility: ["customer", "admin"],
          summary: "Shipment rejected: " + decision.audit.reason,
          evidenceRefs: [shipment.quoteId],
          idempotencyKey,
        }));
        return Object.freeze({ shipmentId, status: "Rejected", rejectedAt: occurredAt });
      },
    });
  }

  async function amendDeclaredMeasurements({
    actor: actorInput, idempotencyKey, shipmentId, parcelId, measurements,
  }) {
    const actor = actorContext(actorInput, ["admin"]);
    const occurredAt = nowIso(clock);
    return runIdempotentCommand({
      transaction: ports.transaction, idempotency: ports.idempotency,
      actor, key: idempotencyKey, command: "amend_declared_measurements",
      handler: async tx => {
        const shipment = await ports.shipments.getById(tx, shipmentId);
        if (!shipment) fail("SHIPMENT_NOT_FOUND", "Shipment does not exist.");
        const parcel = await ports.parcels.getById(tx, parcelId);
        if (!parcel || parcel.shipmentId !== shipmentId) fail("PARCEL_NOT_FOUND", "Parcel does not belong to this shipment.");
        const reviewStatus = parcel.measurementReview?.status ?? shipment.measurementReviewStatus ?? "open";
        assertCanEditDeclaredMeasurements({ reviewStatus, actor });
        const validated = createParcelContract({
          ...parcel,
          measurements: measurements?.dimensions ?? parcel.dimensions,
          declaredWeight: measurements?.declaredWeight ?? parcel.declaredWeight,
          weightUnit: measurements?.weightUnit ?? parcel.weightUnit,
          declaredValueMinor: measurements?.declaredValueMinor ?? parcel.declaredValueMinor,
          measurementUnit: measurements?.measurementUnit ?? parcel.dimensions?.unit,
          measurementReview: parcel.measurementReview ?? { status: "open" },
        });
        const patch = {
          declaredWeight: validated.declaredWeight,
          weightUnit: validated.weightUnit,
          dimensions: validated.dimensions,
          declaredValueMinor: validated.declaredValueMinor,
          measurementAmendedAt: occurredAt,
          measurementAmendedBy: actor,
        };
        await ports.parcels.update(tx, parcelId, patch);
        await ports.events.append(tx, createShipmentEventContract({
          eventId: idFactory("shipment_event"), shipmentId,
          eventType: "declared_measurements_amended", actor, occurredAt,
          visibility: ["customer", "admin"],
          summary: "Declared parcel measurements were amended during review.",
          evidenceRefs: [parcelId], idempotencyKey,
        }));
        return Object.freeze({ shipmentId, parcelId, ...patch });
      },
    });
  }

  async function closeDeclaredMeasurementReview({ actor: actorInput, idempotencyKey, shipmentId }) {
    const actor = actorContext(actorInput, ["admin"]);
    const occurredAt = nowIso(clock);
    return runIdempotentCommand({
      transaction: ports.transaction, idempotency: ports.idempotency,
      actor, key: idempotencyKey, command: "close_declared_measurement_review",
      handler: async tx => {
        const shipment = await ports.shipments.getById(tx, shipmentId);
        if (!shipment) fail("SHIPMENT_NOT_FOUND", "Shipment does not exist.");
        const decision = closeMeasurementReview({
          reviewStatus: shipment.measurementReviewStatus ?? "open", actor,
        });
        const parcels = await ports.parcels.listByShipment(tx, shipmentId);
        if (!Array.isArray(parcels) || parcels.length === 0) fail("PARCELS_NOT_FOUND", "Shipment has no parcel records to lock.");
        for (const parcel of parcels) {
          if ((parcel.measurementReview?.status ?? "open") !== "open") {
            fail("MEASUREMENT_REVIEW_INCONSISTENT", "All parcel measurement reviews must be open when the shipment review is closed.");
          }
          await ports.parcels.update(tx, parcel.parcelId, {
            measurementReview: { status: "closed", lockedAt: occurredAt },
          });
        }
        await ports.shipments.update(tx, shipmentId, {
          measurementReviewStatus: decision.reviewStatus,
          measurementReviewLockedAt: occurredAt,
          measurementReviewClosedBy: decision.closedBy,
          updatedAt: occurredAt,
        });
        await ports.events.append(tx, createShipmentEventContract({
          eventId: idFactory("shipment_event"), shipmentId,
          eventType: "declared_measurement_review_closed", actor, occurredAt,
          visibility: ["customer", "admin"],
          summary: "Declared measurement review closed; declared values are locked.",
          evidenceRefs: parcels.map(parcel => parcel.parcelId), idempotencyKey,
        }));
        return Object.freeze({ shipmentId, reviewStatus: "closed", lockedParcelCount: parcels.length });
      },
    });
  }

  return Object.freeze({
    cancelShipment,
    rejectShipment,
    amendDeclaredMeasurements,
    closeDeclaredMeasurementReview,
  });
}
