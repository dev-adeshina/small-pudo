import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentCommands } from "../lib/shipment/payment-commands.mjs";

function fixture({
  status = "Awaiting Payment",
  customerId = "customer-1",
  paymentId = null,
  previousPayment = null,
  now = "2026-11-27T10:00:00.000Z",
  verifier = async ({ providerReference }) => ({
    verified: true, provider: "paystack", providerReference,
    status: "successful", amountMinor: 50000, currency: "NGN",
    verifiedAt: "2026-11-27T10:05:00.000Z",
  }),
} = {}) {
  const state = {
    shipment: {
      shipmentId: "shipment-1", customerId, status, quoteId: "quote-1",
      acceptedQuoteRevisionId: "revision-1", paymentId,
    },
    quote: {
      revisionId: "revision-1", revisionNumber: 1, totalMinor: 50000,
      currency: "NGN", validUntil: "2026-11-27T11:00:00.000Z",
    },
    payments: new Map(),
    events: [],
    updates: [],
    idempotency: new Map(),
  };
  if (previousPayment) state.payments.set(previousPayment.paymentId, previousPayment);

  const ports = {
    transaction: { run: callback => callback({ id: "tx-1" }) },
    customers: { create: async () => {}, getById: async () => null },
    shipments: {
      create: async () => {}, getById: async () => state.shipment,
      getByReference: async () => null,
      update: async (_tx, id, patch) => {
        assert.equal(id, "shipment-1");
        state.updates.push(patch);
        state.shipment = { ...state.shipment, ...patch };
      },
    },
    parcels: { createMany: async () => {}, listByShipment: async () => [], getById: async () => null, update: async () => {} },
    quotes: {
      createLineage: async () => {}, appendRevision: async () => {},
      getCurrent: async () => state.quote, withdraw: async () => {},
    },
    payments: {
      createAttempt: async (_tx, id, value) => state.payments.set(id, value),
      getById: async (_tx, id) => state.payments.get(id) ?? null,
      getByProviderReference: async (_tx, reference) => [...state.payments.values()].find(value => value.providerReference === reference) ?? null,
      updateAttempt: async (_tx, id, patch) => state.payments.set(id, { ...state.payments.get(id), ...patch }),
    },
    events: { append: async (_tx, event) => state.events.push(event), listByShipment: async () => [] },
    idempotency: {
      get: async (_tx, key) => state.idempotency.get(key) ?? null,
      create: async (_tx, key, value) => state.idempotency.set(key, value),
    },
    references: { reserveUnique: async () => true },
  };
  let id = 0;
  const commands = createPaymentCommands({
    ports,
    idFactory: kind => `${kind}-${++id}`,
    paymentVerifier: verifier,
    clock: () => new Date(now),
  });
  return { state, commands };
}

test("customer creates a payment attempt for the exact accepted quote and amount", async () => {
  const { state, commands } = fixture();
  const result = await commands.createPaymentAttempt({
    actor: { type: "customer", id: "customer-1" },
    idempotencyKey: "payment-init-1",
    shipmentId: "shipment-1",
  });
  assert.equal(result.status, "initialised");
  assert.equal(result.amountMinor, 50000);
  assert.equal(result.currency, "NGN");
  assert.equal(state.shipment.paymentId, result.paymentId);
  assert.equal(state.payments.get(result.paymentId).quoteRevisionId, "revision-1");
  assert.equal(state.events[0].eventType, "payment_attempt_created");
});

test("only the owning customer may create a payment attempt", async () => {
  const { commands } = fixture();
  await assert.rejects(commands.createPaymentAttempt({
    actor: { type: "customer", id: "other-customer" },
    idempotencyKey: "foreign-payment",
    shipmentId: "shipment-1",
  }), error => error.code === "FORBIDDEN_OWNER");
});

test("payment attempt requires an accepted quote and Awaiting Payment status", async () => {
  const { commands } = fixture({ status: "Quoted" });
  await assert.rejects(commands.createPaymentAttempt({
    actor: { type: "customer", id: "customer-1" },
    idempotencyKey: "not-accepted",
    shipmentId: "shipment-1",
  }), error => error.code === "PAYMENT_NOT_ALLOWED");
});

test("a new attempt is blocked while the previous attempt is still active", async () => {
  const previousPayment = {
    paymentId: "payment-old", provider: "paystack", status: "pending",
    providerReference: "old-reference", amountMinor: 50000, currency: "NGN",
    quoteRevisionId: "revision-1",
  };
  const { commands } = fixture({ paymentId: "payment-old", previousPayment });
  await assert.rejects(commands.createPaymentAttempt({
    actor: { type: "customer", id: "customer-1" },
    idempotencyKey: "duplicate-active",
    shipmentId: "shipment-1",
  }), error => error.code === "PAYMENT_ATTEMPT_ACTIVE");
});

test("failed or abandoned attempts may be retried with a new provider reference", async () => {
  const previousPayment = {
    paymentId: "payment-old", provider: "paystack", status: "failed",
    providerReference: "old-reference", amountMinor: 50000, currency: "NGN",
    quoteRevisionId: "revision-1",
  };
  const { state, commands } = fixture({ paymentId: "payment-old", previousPayment });
  const result = await commands.createPaymentAttempt({
    actor: { type: "customer", id: "customer-1" },
    idempotencyKey: "retry-payment",
    shipmentId: "shipment-1",
  });
  assert.notEqual(result.paymentId, "payment-old");
  assert.notEqual(result.providerReference, "old-reference");
  assert.equal(state.shipment.paymentId, result.paymentId);
});

test("booking is confirmed only after server-side provider verification matches amount and currency", async () => {
  const { state, commands } = fixture();
  const attempt = await commands.createPaymentAttempt({
    actor: { type: "customer", id: "customer-1" },
    idempotencyKey: "create-for-confirm",
    shipmentId: "shipment-1",
  });
  const result = await commands.confirmVerifiedPayment({ providerReference: attempt.providerReference });
  assert.equal(result.status, "Confirmed");
  assert.equal(result.paymentStatus, "successful");
  assert.equal(state.shipment.bookingConfirmedAt, "2026-11-27T10:05:00.000Z");
  assert.equal(state.payments.get(attempt.paymentId).status, "successful");
  assert.equal(state.events.at(-1).eventType, "payment_verified_booking_confirmed");
});

test("unverified provider responses and mismatched amounts cannot confirm a booking", async () => {
  const unverified = fixture({ verifier: async ({ providerReference }) => ({
    verified: false, provider: "paystack", providerReference,
    status: "successful", amountMinor: 50000, currency: "NGN",
  }) });
  const attempt = await unverified.commands.createPaymentAttempt({
    actor: { type: "customer", id: "customer-1" },
    idempotencyKey: "unverified-create",
    shipmentId: "shipment-1",
  });
  await assert.rejects(unverified.commands.confirmVerifiedPayment({
    providerReference: attempt.providerReference,
  }), error => error.code === "PAYMENT_NOT_VERIFIED");
  assert.equal(unverified.state.shipment.status, "Awaiting Payment");

  const mismatch = fixture({ verifier: async ({ providerReference }) => ({
    verified: true, provider: "paystack", providerReference,
    status: "successful", amountMinor: 49999, currency: "NGN",
  }) });
  const mismatchAttempt = await mismatch.commands.createPaymentAttempt({
    actor: { type: "customer", id: "customer-1" },
    idempotencyKey: "mismatch-create",
    shipmentId: "shipment-1",
  });
  await assert.rejects(mismatch.commands.confirmVerifiedPayment({
    providerReference: mismatchAttempt.providerReference,
  }), error => error.code === "PAYMENT_AMOUNT_MISMATCH");
  assert.equal(mismatch.state.shipment.status, "Awaiting Payment");
});

test("browser/client claims alone are not accepted as payment verification", async () => {
  const { commands } = fixture({ verifier: async () => ({ verified: true, status: "successful" }) });
  await assert.rejects(commands.confirmVerifiedPayment({
    providerReference: "client-supplied-reference",
  }), error => error.code === "PAYMENT_NOT_VERIFIED");
});

test("a verified payment remains idempotently confirmed across callback and webhook deliveries", async () => {
  const { state, commands } = fixture();
  const attempt = await commands.createPaymentAttempt({
    actor: { type: "customer", id: "customer-1" },
    idempotencyKey: "create-for-repeat-confirm",
    shipmentId: "shipment-1",
  });
  const first = await commands.confirmVerifiedPayment({
    providerReference: attempt.providerReference,
    idempotencyKey: "callback-confirmation",
  });
  const eventCount = state.events.length;
  const repeated = await commands.confirmVerifiedPayment({
    providerReference: attempt.providerReference,
    idempotencyKey: "webhook-confirmation",
  });
  assert.equal(first.status, "Confirmed");
  assert.equal(repeated.status, "Confirmed");
  assert.equal(repeated.alreadyConfirmed, true);
  assert.equal(state.events.length, eventCount);
});

test("failed or abandoned attempts cannot later confirm a booking through a stale success response", async () => {
  const { state, commands } = fixture();
  const attempt = await commands.createPaymentAttempt({
    actor: { type: "customer", id: "customer-1" },
    idempotencyKey: "create-then-fail",
    shipmentId: "shipment-1",
  });
  state.payments.set(attempt.paymentId, {
    ...state.payments.get(attempt.paymentId),
    status: "abandoned",
  });
  await assert.rejects(commands.confirmVerifiedPayment({
    providerReference: attempt.providerReference,
  }), error => error.code === "PAYMENT_STATE_INVALID");
  assert.equal(state.shipment.status, "Awaiting Payment");
});
