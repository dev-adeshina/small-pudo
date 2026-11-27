import test from "node:test";
import assert from "node:assert/strict";
import { createShipmentCommands } from "../lib/shipment/commands.mjs";

const shipmentInput = {
  serviceType: "door_to_pudo",
  sender: { fullName: "Sender", phone: "+2348000000000" },
  recipient: { fullName: "Recipient", phone: "+2348111111111" },
  origin: { type: "address", country: "NG", state: "Lagos", city: "Lagos", addressDescription: "Origin" },
  destination: { type: "pudo", pudoLocationId: "pudo-1" },
};
const parcelInput = {
  description: "Carton", declaredWeight: 2,
  measurements: { length: 10, width: 8, height: 5 },
  declaredValueMinor: 10000,
};

function fixture() {
  const state = {
    customers: new Map([["customer-1", { accountStatus: "registered" }]]),
    shipments: new Map(), parcels: new Map(), events: [],
    references: new Set(), idempotency: new Map(), transactionCount: 0,
    transactionTokens: [],
  };
  const ports = {
    transaction: {
      run: async callback => {
        state.transactionCount += 1;
        const tx = { id: state.transactionCount };
        return callback(tx);
      },
    },
    customers: {
      create: async (tx, id, value) => { state.transactionTokens.push(tx); state.customers.set(id, value); },
      getById: async (tx, id) => { state.transactionTokens.push(tx); return state.customers.get(id) ?? null; },
    },
    shipments: {
      create: async (tx, id, value) => { state.transactionTokens.push(tx); state.shipments.set(id, value); },
      getById: async () => null, getByReference: async () => null, update: async () => {},
    },
    parcels: {
      createMany: async (tx, id, values) => { state.transactionTokens.push(tx); state.parcels.set(id, values); },
      listByShipment: async () => [], getById: async () => null,
    },
    quotes: { createLineage: async () => {}, appendRevision: async () => {}, getCurrent: async () => null, withdraw: async () => {} },
    payments: { createAttempt: async () => {}, getByProviderReference: async () => null, updateAttempt: async () => {} },
    events: {
      append: async (tx, value) => { state.transactionTokens.push(tx); state.events.push(value); },
      listByShipment: async () => [],
    },
    idempotency: {
      get: async (tx, key) => { state.transactionTokens.push(tx); return state.idempotency.get(key) ?? null; },
      create: async (tx, key, value) => { state.transactionTokens.push(tx); state.idempotency.set(key, value); },
    },
    references: {
      reserveUnique: async (tx, ref) => {
        state.transactionTokens.push(tx);
        if (state.references.has(ref)) return false;
        state.references.add(ref);
        return true;
      },
    },
  };
  let id = 0;
  const commands = createShipmentCommands({
    ports,
    idFactory: kind => `${kind}-${++id}`,
    clock: () => new Date("2026-11-27T10:00:00.000Z"),
  });
  return { state, commands };
}

test("customer submission derives actor/channel, creates shipment, parcels and initial event transactionally", async () => {
  const { state, commands } = fixture();
  const result = await commands.submitShipment({
    actor: { type: "customer", id: "customer-1" },
    idempotencyKey: "submit-001",
    shipment: { ...shipmentInput, customerId: "attacker-supplied-customer" },
    parcels: [parcelInput],
  });
  assert.equal(result.customerId, "customer-1");
  assert.equal(result.status, "Submitted");
  assert.equal(state.shipments.get(result.shipmentId).createdVia, "customer_portal");
  assert.equal(state.shipments.get(result.shipmentId).createdBy.id, "customer-1");
  assert.equal(state.parcels.get(result.shipmentId).length, 1);
  assert.equal(state.events.length, 1);
  assert.ok(state.transactionTokens.every(token => token.id === 1));
});

test("PUDO walk-in submission creates a pending profile without an Auth UID", async () => {
  const { state, commands } = fixture();
  const result = await commands.submitShipment({
    actor: { type: "pudo_partner", id: "partner-1", pudoLocationId: "pudo-1" },
    idempotencyKey: "walkin-001",
    shipment: {
      ...shipmentInput,
      serviceType: "pudo_to_pudo",
      origin: { type: "pudo", pudoLocationId: "pudo-1" },
      destination: { type: "pudo", pudoLocationId: "pudo-2" },
      walkInCustomer: { fullName: "Walk-in Customer", phone: "+2348000000001" },
    },
    parcels: [parcelInput],
  });
  const customer = state.customers.get(result.customerId);
  assert.equal(customer.accountStatus, "pending_registration");
  assert.equal(customer.authUid, null);
  assert.equal(customer.createdBy.id, "partner-1");
  assert.equal(state.shipments.get(result.shipmentId).createdVia, "pudo_walk_in");
});


test("PUDO walk-in submission cannot originate from another location", async () => {
  const { commands } = fixture();
  await assert.rejects(
    commands.submitShipment({
      actor: { type: "pudo_partner", id: "partner-1", pudoLocationId: "pudo-1" },
      idempotencyKey: "walkin-wrong-location",
      shipment: {
        ...shipmentInput,
        serviceType: "pudo_to_pudo",
        origin: { type: "pudo", pudoLocationId: "pudo-foreign" },
        destination: { type: "pudo", pudoLocationId: "pudo-2" },
        walkInCustomer: { fullName: "Walk-in Customer", phone: "+2348000000001" },
      },
      parcels: [parcelInput],
    }),
    error => error.code === "PUDO_ORIGIN_MISMATCH"
  );
});

test("Admin-assisted submission requires an existing customer", async () => {
  const { commands } = fixture();
  await assert.rejects(
    commands.submitShipment({
      actor: { type: "admin", id: "admin-1" },
      idempotencyKey: "admin-001",
      shipment: { ...shipmentInput, customerId: "missing-customer" },
      parcels: [parcelInput],
    }),
    error => error.code === "CUSTOMER_NOT_FOUND"
  );
});

test("idempotent resubmission returns the original shipment and does not duplicate records", async () => {
  const { state, commands } = fixture();
  const input = {
    actor: { type: "customer", id: "customer-1" },
    idempotencyKey: "submit-repeat",
    shipment: shipmentInput,
    parcels: [parcelInput],
  };
  const first = await commands.submitShipment(input);
  const second = await commands.submitShipment(input);
  assert.deepEqual(second, first);
  assert.equal(state.shipments.size, 1);
  assert.equal(state.events.length, 1);
  assert.equal(state.transactionCount, 2);
});

test("submission rejects empty parcel lists and unsupported actors", async () => {
  const { commands } = fixture();
  await assert.rejects(commands.submitShipment({
    actor: { type: "system", id: "system-1" }, idempotencyKey: "bad-actor",
    shipment: shipmentInput, parcels: [parcelInput],
  }), error => error.code === "FORBIDDEN_ACTOR");
  await assert.rejects(commands.submitShipment({
    actor: { type: "customer", id: "customer-1" }, idempotencyKey: "no-parcels",
    shipment: shipmentInput, parcels: [],
  }), error => error.code === "INVALID_INPUT");
});
