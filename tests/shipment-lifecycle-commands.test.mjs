import test from "node:test";
import assert from "node:assert/strict";
import { createShipmentLifecycleCommands } from "../lib/shipment/lifecycle-commands.mjs";

function fixture({
  shipment = {
    shipmentId: "shipment-1", customerId: "customer-1", status: "Quoted",
    quoteId: "quote-1", paymentId: null, measurementReviewStatus: "open",
  },
  payment = null,
  parcels = [{
    parcelId: "parcel-1", shipmentId: "shipment-1", parcelReference: "VLY-01",
    description: "Carton", quantity: 1, declaredWeight: 2, weightUnit: "kg",
    dimensions: { length: 10, width: 8, height: 5, unit: "cm" },
    declaredValueMinor: 10000, currency: "NGN",
    measurementReview: { status: "open", lockedAt: null },
  }],
} = {}) {
  const state = {
    shipment: { ...shipment },
    payment: payment ? { ...payment } : null,
    parcels: new Map(parcels.map(parcel => [parcel.parcelId, { ...parcel }])),
    withdrawnQuotes: [], events: [], idempotency: new Map(),
  };
  const ports = {
    transaction: { run: callback => callback({ id: "tx-1" }) },
    customers: { create: async () => {}, getById: async () => null },
    shipments: {
      create: async () => {}, getById: async () => state.shipment,
      getByReference: async () => null,
      update: async (_tx, id, patch) => {
        assert.equal(id, "shipment-1");
        state.shipment = { ...state.shipment, ...patch };
      },
    },
    parcels: {
      createMany: async () => {},
      listByShipment: async () => [...state.parcels.values()],
      getById: async (_tx, id) => state.parcels.get(id) ?? null,
      update: async (_tx, id, patch) => state.parcels.set(id, { ...state.parcels.get(id), ...patch }),
    },
    quotes: {
      createLineage: async () => {}, appendRevision: async () => {},
      getCurrent: async () => null,
      withdraw: async (_tx, id, data) => state.withdrawnQuotes.push({ id, ...data }),
    },
    payments: {
      createAttempt: async () => {},
      getById: async () => state.payment,
      getByProviderReference: async () => null,
      updateAttempt: async (_tx, id, patch) => { state.payment = { ...state.payment, paymentId: id, ...patch }; },
    },
    events: {
      append: async (_tx, event) => state.events.push(event),
      listByShipment: async () => [],
    },
    idempotency: {
      get: async (_tx, key) => state.idempotency.get(key) ?? null,
      create: async (_tx, key, value) => state.idempotency.set(key, value),
    },
    references: { reserveUnique: async () => true },
  };
  let id = 0;
  const commands = createShipmentLifecycleCommands({
    ports, idFactory: kind => `${kind}-${++id}`,
    clock: () => new Date("2026-11-27T10:00:00.000Z"),
  });
  return { state, commands };
}

test("owning customer cancels an unpaid shipment, withdraws its quote and records an event", async () => {
  const { state, commands } = fixture();
  const result = await commands.cancelShipment({
    actor: { type: "customer", id: "customer-1" },
    idempotencyKey: "cancel-1", shipmentId: "shipment-1", reason: "Customer changed plans",
  });
  assert.equal(result.status, "Cancelled");
  assert.equal(state.shipment.cancellationReason, "Customer changed plans");
  assert.equal(state.withdrawnQuotes.length, 1);
  assert.equal(state.events[0].eventType, "shipment_cancelled");
});

test("customer cannot cancel another customer's shipment", async () => {
  const { commands } = fixture();
  await assert.rejects(commands.cancelShipment({
    actor: { type: "customer", id: "other-customer" },
    idempotencyKey: "foreign-cancel", shipmentId: "shipment-1", reason: "Cancel",
  }), error => error.code === "FORBIDDEN_OWNER");
});

test("cancellation cannot proceed after successful payment or confirmation", async () => {
  const paid = fixture({ shipment: {
    shipmentId: "shipment-1", customerId: "customer-1", status: "Confirmed",
    quoteId: "quote-1", paymentStatus: "successful",
  } });
  await assert.rejects(paid.commands.cancelShipment({
    actor: { type: "admin", id: "admin-1" },
    idempotencyKey: "paid-cancel", shipmentId: "shipment-1", reason: "Cancel",
  }), error => error.code === "CANCELLATION_CLOSED" || error.code === "PAYMENT_OR_CONFIRMATION_EXISTS");
});

test("Admin may reject a quoted shipment only before acceptance and active payment", async () => {
  const { state, commands } = fixture();
  const result = await commands.rejectShipment({
    actor: { type: "admin", id: "admin-1" },
    idempotencyKey: "reject-1", shipmentId: "shipment-1", reason: "Outside service scope",
  });
  assert.equal(result.status, "Rejected");
  assert.equal(state.withdrawnQuotes.length, 1);
  assert.equal(state.events[0].eventType, "shipment_rejected");

  const active = fixture({
    shipment: { shipmentId: "shipment-1", customerId: "customer-1", status: "Awaiting Payment", quoteId: "quote-1", paymentId: "payment-1" },
    payment: { paymentId: "payment-1", status: "pending" },
  });
  await assert.rejects(active.commands.rejectShipment({
    actor: { type: "admin", id: "admin-1" },
    idempotencyKey: "reject-active", shipmentId: "shipment-1", reason: "Reject",
  }), error => error.code === "PAYMENT_ATTEMPT_ACTIVE");
});

test("only Admin may amend declared parcel measurements while review is open", async () => {
  const { state, commands } = fixture();
  await assert.rejects(commands.amendDeclaredMeasurements({
    actor: { type: "pudo_partner", id: "partner-1" },
    idempotencyKey: "partner-edit", shipmentId: "shipment-1",
    parcelId: "parcel-1", measurements: { declaredWeight: 3 },
  }), error => error.code === "FORBIDDEN_ACTOR");

  const result = await commands.amendDeclaredMeasurements({
    actor: { type: "admin", id: "admin-1" },
    idempotencyKey: "admin-edit", shipmentId: "shipment-1",
    parcelId: "parcel-1", measurements: { declaredWeight: 3, dimensions: { length: 12, width: 8, height: 5 } },
  });
  assert.equal(result.declaredWeight, 3);
  assert.equal(state.parcels.get("parcel-1").dimensions.length, 12);
  assert.equal(state.events[0].eventType, "declared_measurements_amended");
});

test("measurement review closure locks every parcel and later amendments are rejected", async () => {
  const { state, commands } = fixture();
  const result = await commands.closeDeclaredMeasurementReview({
    actor: { type: "admin", id: "admin-1" },
    idempotencyKey: "close-review", shipmentId: "shipment-1",
  });
  assert.equal(result.reviewStatus, "closed");
  assert.equal(state.parcels.get("parcel-1").measurementReview.status, "closed");
  assert.equal(state.shipment.measurementReviewStatus, "closed");
  await assert.rejects(commands.amendDeclaredMeasurements({
    actor: { type: "admin", id: "admin-1" },
    idempotencyKey: "edit-after-close", shipmentId: "shipment-1",
    parcelId: "parcel-1", measurements: { declaredWeight: 4 },
  }), error => error.code === "MEASUREMENT_REVIEW_LOCKED");
});
