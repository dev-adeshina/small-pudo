import test from "node:test";
import assert from "node:assert/strict";
import { createQuoteCommands } from "../lib/shipment/quote-commands.mjs";

function fixture({ status = "Submitted", customerId = "customer-1", currentQuote = null, now = "2026-11-27T10:00:00.000Z" } = {}) {
  const state = {
    shipment: { shipmentId: "shipment-1", customerId, status, quoteId: currentQuote ? "quote-1" : null },
    currentQuote,
    lineages: [], revisions: [], events: [], idempotency: new Map(), updates: [],
  };
  const ports = {
    transaction: { run: callback => callback({ id: "tx-1" }) },
    customers: { create: async () => {}, getById: async () => ({ accountStatus: "registered" }) },
    shipments: {
      create: async () => {}, getById: async () => state.shipment,
      getByReference: async () => null,
      update: async (_tx, id, patch) => { assert.equal(id, "shipment-1"); state.updates.push(patch); state.shipment = { ...state.shipment, ...patch }; },
    },
    parcels: { createMany: async () => {}, listByShipment: async () => [], getById: async () => null },
    quotes: {
      createLineage: async (_tx, id, value) => state.lineages.push({ id, value }),
      appendRevision: async (_tx, id, value) => { state.revisions.push({ id, value }); state.currentQuote = value; },
      getCurrent: async () => state.currentQuote,
      withdraw: async () => {},
    },
    payments: { createAttempt: async () => {}, getByProviderReference: async () => null, updateAttempt: async () => {} },
    events: { append: async (_tx, event) => state.events.push(event), listByShipment: async () => [] },
    idempotency: {
      get: async (_tx, key) => state.idempotency.get(key) ?? null,
      create: async (_tx, key, value) => state.idempotency.set(key, value),
    },
    references: { reserveUnique: async () => true },
  };
  let id = 0;
  const commands = createQuoteCommands({ ports, idFactory: kind => `${kind}-${++id}`, clock: () => new Date(now) });
  return { state, commands };
}

const quoteInput = {
  currency: "NGN",
  lineItems: [{ code: "base", description: "Base delivery", amountMinor: 50000 }],
  totalMinor: 50000,
  pricingVersion: "DEC-048-v1",
  validUntil: "2026-11-27T11:00:00.000Z",
};

test("Admin issues first quote and atomically records lineage, revision, shipment status and event", async () => {
  const { state, commands } = fixture();
  const result = await commands.issueQuote({
    actor: { type: "admin", id: "admin-1" }, idempotencyKey: "quote-1",
    shipmentId: "shipment-1", quote: quoteInput,
  });
  assert.equal(result.status, "Quoted");
  assert.equal(result.revisionNumber, 1);
  assert.equal(state.lineages.length, 1);
  assert.equal(state.revisions.length, 1);
  assert.equal(state.shipment.status, "Quoted");
  assert.equal(state.events[0].eventType, "quote_issued");
});

test("non-Admin cannot issue a quote", async () => {
  const { commands } = fixture();
  await assert.rejects(commands.issueQuote({
    actor: { type: "customer", id: "customer-1" }, idempotencyKey: "no",
    shipmentId: "shipment-1", quote: quoteInput,
  }), error => error.code === "FORBIDDEN_ACTOR");
});

test("customer can accept only their own current unexpired quote revision", async () => {
  const currentQuote = { revisionId: "revision-1", revisionNumber: 1, validUntil: "2026-11-27T11:00:00.000Z" };
  const { state, commands } = fixture({ status: "Quoted", currentQuote });
  const result = await commands.acceptQuote({
    actor: { type: "customer", id: "customer-1" }, idempotencyKey: "accept-1",
    shipmentId: "shipment-1", quoteRevisionId: "revision-1",
  });
  assert.equal(result.status, "Awaiting Payment");
  assert.equal(state.shipment.acceptedQuoteRevisionId, "revision-1");
  assert.equal(state.events[0].eventType, "quote_accepted");
});

test("customer cannot accept another customer's quote", async () => {
  const { commands } = fixture({
    status: "Quoted", customerId: "someone-else",
    currentQuote: { revisionId: "revision-1", validUntil: "2026-11-27T11:00:00.000Z" },
  });
  await assert.rejects(commands.acceptQuote({
    actor: { type: "customer", id: "customer-1" }, idempotencyKey: "accept-foreign",
    shipmentId: "shipment-1", quoteRevisionId: "revision-1",
  }), error => error.code === "FORBIDDEN_OWNER");
});

test("stale and expired quote revisions cannot be accepted", async () => {
  const stale = fixture({ status: "Quoted", currentQuote: { revisionId: "current", validUntil: "2026-11-27T11:00:00.000Z" } });
  await assert.rejects(stale.commands.acceptQuote({
    actor: { type: "customer", id: "customer-1" }, idempotencyKey: "stale",
    shipmentId: "shipment-1", quoteRevisionId: "old",
  }), error => error.code === "QUOTE_REVISION_STALE");

  const expired = fixture({ status: "Quoted", currentQuote: { revisionId: "expired", validUntil: "2026-11-27T09:59:59.000Z" } });
  await assert.rejects(expired.commands.acceptQuote({
    actor: { type: "customer", id: "customer-1" }, idempotencyKey: "expired",
    shipmentId: "shipment-1", quoteRevisionId: "expired",
  }), error => error.code === "QUOTE_EXPIRED");
});
