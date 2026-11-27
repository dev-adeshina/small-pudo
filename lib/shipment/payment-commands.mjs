/**
 * Payment attempt and verified-payment application commands.
 *
 * These commands are database/provider-SDK independent. The caller must
 * supply verified actor context and a server-side Paystack verifier. Browser
 * redirects and client-supplied "successful" flags are never payment proof.
 */
import { createPaymentAttemptContract, createShipmentEventContract } from "./contracts.mjs";
import { assertRepositoryPorts, runIdempotentCommand } from "./repositories.mjs";

function commandError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function actorContext(actor, allowed) {
  if (!actor || !allowed.includes(actor.type) || typeof actor.id !== "string" || !actor.id.trim()) {
    throw commandError("FORBIDDEN_ACTOR", "A verified authorised actor is required.");
  }
  return Object.freeze({ type: actor.type, id: actor.id.trim() });
}

function validDate(clock) {
  const now = clock();
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new TypeError("clock must return a valid Date");
  return now;
}

export function createPaymentCommands({ ports, idFactory, paymentVerifier, clock = () => new Date() }) {
  assertRepositoryPorts(ports);
  if (typeof idFactory !== "function") throw new TypeError("idFactory is required");
  if (typeof paymentVerifier !== "function") throw new TypeError("paymentVerifier is required");
  if (typeof clock !== "function") throw new TypeError("clock must be a function");

  async function createPaymentAttempt({ actor: actorInput, idempotencyKey, shipmentId }) {
    const actor = actorContext(actorInput, ["customer"]);
    const createdAt = validDate(clock).toISOString();

    return runIdempotentCommand({
      transaction: ports.transaction,
      idempotency: ports.idempotency,
      actor,
      key: idempotencyKey,
      command: "create_shipment_payment_attempt",
      handler: async tx => {
        const shipment = await ports.shipments.getById(tx, shipmentId);
        if (!shipment) throw commandError("SHIPMENT_NOT_FOUND", "Shipment does not exist.");
        if (shipment.customerId !== actor.id) throw commandError("FORBIDDEN_OWNER", "Customers may pay only for their own shipment.");
        if (shipment.status !== "Awaiting Payment" || !shipment.quoteId || !shipment.acceptedQuoteRevisionId) {
          throw commandError("PAYMENT_NOT_ALLOWED", "Payment can be initiated only for an accepted quote awaiting payment.");
        }

        if (shipment.paymentId) {
          const previous = await ports.payments.getById(tx, shipment.paymentId);
          if (!previous) throw commandError("PAYMENT_RECORD_MISSING", "The linked payment attempt could not be found.");
          if (!["failed", "abandoned"].includes(previous.status)) {
            throw commandError("PAYMENT_ATTEMPT_ACTIVE", "An existing payment attempt must fail or be abandoned before retrying.");
          }
        }

        const quote = await ports.quotes.getCurrent(tx, shipment.quoteId);
        if (!quote || quote.revisionId !== shipment.acceptedQuoteRevisionId) {
          throw commandError("QUOTE_REVISION_STALE", "The accepted quote revision is no longer current.");
        }
        const paymentId = idFactory("payment");
        const providerReference = idFactory("paystack_reference");
        const attempt = createPaymentAttemptContract({
          paymentId,
          shipmentId,
          quoteRevisionId: quote.revisionId,
          provider: "paystack",
          providerReference,
          amountMinor: quote.totalMinor,
          currency: quote.currency,
          status: "initialised",
          createdAt,
        });
        await ports.payments.createAttempt(tx, paymentId, attempt);
        await ports.shipments.update(tx, shipmentId, {
          paymentId,
          paymentStatus: "initialised",
          updatedAt: createdAt,
        });
        await ports.events.append(tx, createShipmentEventContract({
          eventId: idFactory("shipment_event"),
          shipmentId,
          eventType: "payment_attempt_created",
          actor,
          occurredAt: createdAt,
          visibility: ["customer", "admin"],
          summary: "A payment attempt was created for the accepted quote.",
          evidenceRefs: [paymentId, quote.revisionId],
          idempotencyKey,
        }));

        return Object.freeze({
          paymentId,
          shipmentId,
          provider: "paystack",
          providerReference,
          amountMinor: attempt.amountMinor,
          currency: attempt.currency,
          status: attempt.status,
        });
      },
    });
  }

  /**
   * The verifier is a trusted server-side integration. It must verify the
   * provider transaction (and webhook authenticity where applicable) against
   * Paystack, not merely echo a browser redirect or webhook request body.
   */
  async function confirmVerifiedPayment({ providerReference, idempotencyKey }) {
    if (typeof providerReference !== "string" || !providerReference.trim()) {
      throw commandError("INVALID_PAYMENT_REFERENCE", "A provider reference is required.");
    }
    const reference = providerReference.trim();
    const evidence = await paymentVerifier({ provider: "paystack", providerReference: reference });
    if (
      evidence?.verified !== true ||
      evidence.provider !== "paystack" ||
      evidence.status !== "successful" ||
      evidence.providerReference !== reference ||
      !Number.isSafeInteger(evidence.amountMinor) ||
      typeof evidence.currency !== "string"
    ) {
      throw commandError("PAYMENT_NOT_VERIFIED", "The payment provider has not confirmed a successful matching transaction.");
    }

    const actor = Object.freeze({ type: "system", id: "paystack-verifier" });
    const verifiedAt = evidence.verifiedAt && !Number.isNaN(Date.parse(evidence.verifiedAt))
      ? new Date(evidence.verifiedAt).toISOString()
      : validDate(clock).toISOString();

    return runIdempotentCommand({
      transaction: ports.transaction,
      idempotency: ports.idempotency,
      actor,
      key: idempotencyKey ?? reference,
      command: "confirm_verified_shipment_payment",
      handler: async tx => {
        const payment = await ports.payments.getByProviderReference(tx, reference);
        if (!payment) throw commandError("PAYMENT_ATTEMPT_NOT_FOUND", "No payment attempt matches this provider reference.");
        if (payment.provider !== "paystack" || payment.status === "successful") {
          throw commandError("PAYMENT_STATE_INVALID", "This payment attempt cannot be confirmed in its current state.");
        }
        if (payment.amountMinor !== evidence.amountMinor || payment.currency !== evidence.currency.toUpperCase()) {
          throw commandError("PAYMENT_AMOUNT_MISMATCH", "Verified provider amount or currency does not match the recorded attempt.");
        }

        const shipment = await ports.shipments.getById(tx, payment.shipmentId);
        if (!shipment) throw commandError("SHIPMENT_NOT_FOUND", "Shipment does not exist.");
        if (
          shipment.status !== "Awaiting Payment" ||
          shipment.paymentId !== payment.paymentId ||
          shipment.acceptedQuoteRevisionId !== payment.quoteRevisionId
        ) {
          throw commandError("PAYMENT_NO_LONGER_CURRENT", "This payment attempt is no longer the active attempt for the accepted quote.");
        }

        await ports.payments.updateAttempt(tx, payment.paymentId, {
          status: "successful",
          verifiedAt,
        });
        await ports.shipments.update(tx, shipment.shipmentId ?? payment.shipmentId, {
          status: "Confirmed",
          paymentStatus: "successful",
          bookingConfirmedAt: verifiedAt,
          updatedAt: verifiedAt,
        });
        await ports.events.append(tx, createShipmentEventContract({
          eventId: idFactory("shipment_event"),
          shipmentId: payment.shipmentId,
          eventType: "payment_verified_booking_confirmed",
          actor,
          occurredAt: verifiedAt,
          visibility: ["customer", "admin"],
          summary: "Payment was verified by the provider and the shipment booking was confirmed.",
          evidenceRefs: [payment.paymentId, payment.providerReference, payment.quoteRevisionId],
          idempotencyKey: idempotencyKey ?? reference,
        }));

        return Object.freeze({
          shipmentId: payment.shipmentId,
          paymentId: payment.paymentId,
          status: "Confirmed",
          paymentStatus: "successful",
          bookingConfirmedAt: verifiedAt,
        });
      },
    });
  }

  return Object.freeze({ createPaymentAttempt, confirmVerifiedPayment });
}
