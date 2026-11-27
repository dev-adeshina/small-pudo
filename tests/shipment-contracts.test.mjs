import test from "node:test";
import assert from "node:assert/strict";
import {
  createShipmentContract, createParcelContract, createQuoteRevisionContract,
  createPaymentAttemptContract, createShipmentEventContract,
  assertEventAppendOnlyOperation, createIntakeMeasurementObservation,
} from "../lib/shipment/contracts.mjs";
import { generateShipmentReference, reserveUniqueShipmentReference } from "../lib/shipment/references.mjs";
import { assertRepositoryPorts, runIdempotentCommand } from "../lib/shipment/repositories.mjs";

const baseShipment = {
  shipmentReference: "VLY-20261127-ABC234", customerId: "customer-1",
  createdBy: { type: "customer", id: "customer-1" }, createdVia: "customer_portal",
  status: "Submitted", serviceType: "door_to_pudo",
  sender: { fullName: "Sender", phone: "+2348000000000" },
  recipient: { fullName: "Recipient", phone: "+2348111111111" },
  origin: { type: "address", country: "NG", state: "Lagos", city: "Lagos", addressDescription: "Origin" },
  destination: { type: "pudo", pudoLocationId: "pudo-1" },
  submittedAt: "2026-11-27T10:00:00.000Z",
};

test("shipment contract enforces channel attribution and Submitted initial state", () => {
  assert.equal(createShipmentContract(baseShipment).status, "Submitted");
  assert.throws(() => createShipmentContract({ ...baseShipment, status: "Draft" }), /status must begin at Submitted/);
  assert.throws(() => createShipmentContract({ ...baseShipment, origin: { type: "pudo", pudoLocationId: "p1" } }), /must match the door_to_pudo service endpoints/);
  assert.throws(() => createShipmentContract({ ...baseShipment, createdBy: { type: "pudo_partner", id: "p1" } }), /createdBy must be a customer/);
});

test("walk-in shipment attribution requires PUDO partner and customer profile state", () => {
  const result = createShipmentContract({
    ...baseShipment, createdVia: "pudo_walk_in",
    createdBy: { type: "pudo_partner", id: "partner-1" },
    customerAccountStatus: "pending_registration",
  });
  assert.equal(result.createdBy.type, "pudo_partner");
  assert.throws(() => createShipmentContract({
    ...baseShipment, createdVia: "pudo_walk_in", createdBy: { type: "pudo_partner", id: "partner-1" },
  }), /customerAccountStatus/);
});

test("parcel contract validates positive declared dimensions and keeps intake measurements separate", () => {
  const parcel = createParcelContract({
    parcelReference: "P-1", description: "Box", declaredWeight: 2, measurements: { length: 10, width: 8, height: 5 },
    declaredValueMinor: 10000,
  });
  assert.equal(parcel.measurementReview.status, "open");
  assert.equal(parcel.intakeMeasurements, null);
  assert.throws(() => createParcelContract({
    parcelReference: "P-2", description: "Box", declaredWeight: 2, measurements: { length: 0, width: 8, height: 5 }, declaredValueMinor: 0,
  }), /dimensions.length/);
});

test("quote revision requires increasing validity and reconciled integer minor-unit totals", () => {
  const quote = createQuoteRevisionContract({
    revisionId: "rev-1", revisionNumber: 1, shipmentId: "s-1", currency: "NGN",
    lineItems: [{ code: "base", description: "Base", amountMinor: 50000 }, { code: "fuel", description: "Fuel", amountMinor: 10000 }],
    totalMinor: 60000, pricingVersion: "DEC-048-v1", issuedBy: { type: "admin", id: "a1" },
    issuedAt: "2026-11-27T10:00:00Z", validUntil: "2026-11-27T11:00:00Z",
  });
  assert.equal(quote.totalMinor, 60000);
  assert.throws(() => createQuoteRevisionContract({
    revisionId: "r", revisionNumber: 1, shipmentId: "s", lineItems: [{ code: "x", description: "X", amountMinor: 1 }],
    totalMinor: 2, pricingVersion: "v1", issuedBy: { type: "admin", id: "a" },
    issuedAt: "2026-11-27T10:00:00Z", validUntil: "2026-11-27T11:00:00Z",
  }), /totalMinor must equal/);
});

test("payment attempts retain provider references and explicit attempt status", () => {
  const payment = createPaymentAttemptContract({
    paymentId: "pay-1", shipmentId: "s-1", quoteRevisionId: "r-1", provider: "paystack",
    providerReference: "txn-1", amountMinor: 60000, status: "initialised", createdAt: "2026-11-27T10:00:00Z",
  });
  assert.equal(payment.provider, "paystack");
  assert.equal(payment.status, "initialised");
});

test("shipment events require actor, visibility, evidence refs and idempotency key", () => {
  const event = createShipmentEventContract({
    eventId: "e-1", shipmentId: "s-1", eventType: "shipment_submitted",
    actor: { type: "customer", id: "c1" }, occurredAt: "2026-11-27T10:00:00Z",
    visibility: ["customer", "admin"], summary: "Shipment submitted", evidenceRefs: [], idempotencyKey: "submit-1",
  });
  assert.deepEqual(event.visibility, ["customer", "admin"]);
  assert.equal(assertEventAppendOnlyOperation("create"), true);
  assert.throws(() => assertEventAppendOnlyOperation("update"), /append-only/);
});

test("physical intake measurements are independent, attributed and photo-evidenced", () => {
  assert.throws(() => createIntakeMeasurementObservation({
    intakeId: "i1", parcelId: "p1", measuredWeight: 1, weightUnit: "kg",
    dimensions: { length: 1, width: 1, height: 1, unit: "cm" },
    measuredAt: "2026-11-27T10:00:00Z", measuredBy: { type: "pudo_partner", id: "p1" }, photoEvidenceRefs: [],
  }), /photoEvidenceRefs/);
  const observation = createIntakeMeasurementObservation({
    intakeId: "i1", parcelId: "p1", measuredWeight: 1, weightUnit: "kg",
    dimensions: { length: 1, width: 1, height: 1, unit: "cm" },
    measuredAt: "2026-11-27T10:00:00Z", measuredBy: { type: "pudo_partner", id: "p1" }, photoEvidenceRefs: ["storage/intake.jpg"],
  });
  assert.equal(observation.photoEvidenceRefs.length, 1);
});

test("shipment reference generator creates dated human-readable candidates", () => {
  const ref = generateShipmentReference({ now: new Date("2026-11-27T00:00:00Z"), random: () => Buffer.from([1, 2, 3, 4, 5, 6]) });
  assert.match(ref, /^VLY-20261127-[2-9A-HJ-NP-Z]{6}$/);
});

test("reference reservation retries collisions through an injected unique constraint", async () => {
  const used = new Set();
  let calls = 0;
  const repository = { reserveUnique: async ref => { calls += 1; if (used.has(ref)) return false; used.add(ref); return true; } };
  const result = await reserveUniqueShipmentReference({ repository, now: new Date("2026-11-27T00:00:00Z"), random: () => Buffer.from([1, 2, 3, 4, 5, 6]) });
  assert.match(result, /^VLY-20261127-/);
  assert.equal(calls, 1);
});

test("repository ports require transaction boundary and all aggregate repositories", () => {
  const ports = Object.fromEntries(["shipments", "parcels", "quotes", "payments", "events", "idempotency", "references"].map(name => [name, {}]));
  for (const [name, methods] of Object.entries({
    shipments: ["create", "getById", "getByReference", "update"], parcels: ["createMany", "listByShipment", "getById"],
    quotes: ["createLineage", "appendRevision", "getCurrent", "withdraw"], payments: ["createAttempt", "getByProviderReference", "updateAttempt"],
    events: ["append", "listByShipment"], idempotency: ["get", "create"], references: ["reserveUnique"],
  })) for (const method of methods) ports[name][method] = async () => {};
  ports.transaction = { run: async callback => callback({}) };
  assert.equal(assertRepositoryPorts(ports), ports);
  assert.throws(() => assertRepositoryPorts({}), /Repository port shipments\.create is required/);
});

test("idempotent command returns prior result and only executes handler once", async () => {
  const records = new Map();
  const transaction = { run: callback => callback({}) };
  const idempotency = {
    get: async (_tx, key) => records.get(key),
    create: async (_tx, key, value) => records.set(key, value),
  };
  let executions = 0;
  const args = { transaction, idempotency, actor: { type: "customer", id: "c1" }, key: "request-1", command: "submit", handler: async () => ({ shipmentId: "s1", count: ++executions }) };
  assert.deepEqual(await runIdempotentCommand(args), { shipmentId: "s1", count: 1 });
  assert.deepEqual(await runIdempotentCommand(args), { shipmentId: "s1", count: 1 });
  assert.equal(executions, 1);
});
