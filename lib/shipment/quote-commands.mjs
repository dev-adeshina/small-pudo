/**
 * Quote lifecycle application commands.
 *
 * Database-independent orchestration over the injected shipment repository
 * ports. Callers must construct actor context from verified server credentials.
 */
import { createQuoteRevisionContract, createShipmentEventContract } from "./contracts.mjs";
import { assertRepositoryPorts, runIdempotentCommand } from "./repositories.mjs";

function actorContext(actor, allowed) {
  if (!actor || !allowed.includes(actor.type) || typeof actor.id !== "string" || !actor.id.trim()) {
    const error = new Error("A verified authorised actor is required.");
    error.code = "FORBIDDEN_ACTOR";
    throw error;
  }
  return { type: actor.type, id: actor.id.trim() };
}

function domainError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function createQuoteCommands({ ports, idFactory, clock = () => new Date() }) {
  assertRepositoryPorts(ports);
  if (typeof idFactory !== "function") throw new TypeError("idFactory is required");
  if (typeof clock !== "function") throw new TypeError("clock must be a function");

  async function issueQuote({ actor: actorInput, idempotencyKey, shipmentId, quote: quoteInput }) {
    const actor = actorContext(actorInput, ["admin"]);
    const now = clock();
    if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new TypeError("clock must return a valid Date");
    const issuedAt = now.toISOString();

    return runIdempotentCommand({
      transaction: ports.transaction,
      idempotency: ports.idempotency,
      actor,
      key: idempotencyKey,
      command: "issue_shipment_quote",
      handler: async tx => {
        const shipment = await ports.shipments.getById(tx, shipmentId);
        if (!shipment) throw domainError("SHIPMENT_NOT_FOUND", "Shipment does not exist.");
        if (!["Submitted", "Under Review", "Quoted"].includes(shipment.status)) {
          throw domainError("QUOTE_NOT_ALLOWED", "A quote can be issued only while the shipment is under review or awaiting a quote.");
        }

        const current = shipment.quoteId ? await ports.quotes.getCurrent(tx, shipment.quoteId) : null;
        const revisionNumber = current ? current.revisionNumber + 1 : 1;
        const quoteId = shipment.quoteId ?? idFactory("quote");
        const revision = createQuoteRevisionContract({
          ...quoteInput,
          revisionId: idFactory("quote_revision"),
          revisionNumber,
          shipmentId,
          issuedBy: actor,
          issuedAt,
        });

        if (!shipment.quoteId) {
          await ports.quotes.createLineage(tx, quoteId, {
            quoteId, shipmentId, createdBy: actor, createdAt: issuedAt,
          });
        }
        await ports.quotes.appendRevision(tx, quoteId, revision);
        await ports.shipments.update(tx, shipmentId, {
          status: "Quoted", quoteId, updatedAt: issuedAt,
        });
        await ports.events.append(tx, createShipmentEventContract({
          eventId: idFactory("shipment_event"),
          shipmentId,
          eventType: "quote_issued",
          actor,
          occurredAt: issuedAt,
          visibility: ["customer", "admin"],
          summary: `Quote revision ${revisionNumber} issued.`,
          evidenceRefs: [revision.revisionId],
          idempotencyKey,
        }));
        return Object.freeze({ shipmentId, quoteId, revisionId: revision.revisionId, revisionNumber, totalMinor: revision.totalMinor, currency: revision.currency, status: "Quoted" });
      },
    });
  }

  async function acceptQuote({ actor: actorInput, idempotencyKey, shipmentId, quoteRevisionId }) {
    const actor = actorContext(actorInput, ["customer"]);
    const now = clock();
    if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new TypeError("clock must return a valid Date");
    const acceptedAt = now.toISOString();

    return runIdempotentCommand({
      transaction: ports.transaction,
      idempotency: ports.idempotency,
      actor,
      key: idempotencyKey,
      command: "accept_shipment_quote",
      handler: async tx => {
        const shipment = await ports.shipments.getById(tx, shipmentId);
        if (!shipment) throw domainError("SHIPMENT_NOT_FOUND", "Shipment does not exist.");
        if (shipment.customerId !== actor.id) throw domainError("FORBIDDEN_OWNER", "Customers may accept only their own shipment quote.");
        if (shipment.status !== "Quoted" || !shipment.quoteId) throw domainError("QUOTE_NOT_ACCEPTABLE", "Shipment has no currently acceptable quote.");
        const current = await ports.quotes.getCurrent(tx, shipment.quoteId);
        if (!current || current.revisionId !== quoteRevisionId) throw domainError("QUOTE_REVISION_STALE", "Only the current quote revision may be accepted.");
        if (Date.parse(current.validUntil) <= now.getTime()) throw domainError("QUOTE_EXPIRED", "This quote has expired.");
        await ports.shipments.update(tx, shipmentId, {
          status: "Awaiting Payment",
          acceptedQuoteRevisionId: current.revisionId,
          quoteAcceptedAt: acceptedAt,
          quoteAcceptedBy: actor,
          updatedAt: acceptedAt,
        });
        await ports.events.append(tx, createShipmentEventContract({
          eventId: idFactory("shipment_event"),
          shipmentId,
          eventType: "quote_accepted",
          actor,
          occurredAt: acceptedAt,
          visibility: ["customer", "admin"],
          summary: "Customer accepted the current quote; payment is now awaited.",
          evidenceRefs: [current.revisionId],
          idempotencyKey,
        }));
        return Object.freeze({ shipmentId, quoteRevisionId: current.revisionId, status: "Awaiting Payment" });
      },
    });
  }

  return Object.freeze({ issueQuote, acceptQuote });
}
