import test from "node:test";
import assert from "node:assert/strict";
import {
  createShipmentContract, createParcelContract, createQuoteRevisionContract,
  createPaymentAttemptContract, createShipmentEventContract,
  assertEventAppendOnlyOperation, createIntakeMeasurementObservation,
} from "../lib/shipment/contracts.mjs";
import { generateShipmentReference, reserveUniqueShipmentReference } from "../lib/shipment/references.mjs";
import { assertRepositoryPorts, runIdempotentCommand } from "../lib/shipment/repositories.mjs";
import { createParcelIntakeContract, createShipmentAssignmentContract, createShipmentDocumentContract, createNotificationContract, createNotificationAttemptContract } from "../lib/shipment/records.mjs";

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
  assert.equal(createShipmentContract(baseShipment).measurementReviewStatus, "open");
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
  const ports = Object.fromEntries(["customers", "shipments", "parcels", "quotes", "payments", "events", "idempotency", "references"].map(name => [name, {}]));
  for (const [name, methods] of Object.entries({
    customers: ["create", "getById"], shipments: ["create", "getById", "getByReference", "update"], parcels: ["createMany", "listByShipment", "getById", "update"],
    quotes: ["createLineage", "appendRevision", "getCurrent", "withdraw"], payments: ["createAttempt", "getById", "getByProviderReference", "updateAttempt"],
    events: ["append", "listByShipment"], idempotency: ["get", "create"], references: ["reserveUnique"],
  })) for (const method of methods) ports[name][method] = async () => {};
  ports.transaction = { run: async callback => callback({}) };
  assert.equal(assertRepositoryPorts(ports), ports);
  const missingShipmentCreate = { ...ports, shipments: { ...ports.shipments } };
  delete missingShipmentCreate.shipments.create;
  assert.throws(() => assertRepositoryPorts(missingShipmentCreate), /Repository port shipments\.create is required/);
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

test("full parcel intake contract requires completion and photo evidence", () => {
  const input = {
    intakeId: "intake-1", shipmentId: "shipment-1", parcelIds: ["parcel-1"],
    intakeType: "station_drop_off", receivingLocationType: "pudo", pudoLocationId: "pudo-1",
    receivedBy: { type: "pudo_partner", id: "partner-1" },
    receivedAt: "2026-11-27T10:00:00Z", recordedAt: "2026-11-27T10:00:00Z",
    condition: "Good", measurements: [], discrepancies: [], photoEvidenceRefs: ["private/intake.jpg"],
    status: "completed", completedAt: "2026-11-27T10:01:00Z",
  };
  assert.equal(createParcelIntakeContract(input).photoEvidenceRefs.length, 1);
  assert.throws(() => createParcelIntakeContract({ ...input, photoEvidenceRefs: [] }), /at least one photo/);
  assert.throws(() => createParcelIntakeContract({ ...input, status: "draft" }), /must be completed/);
});

test("assignment contract captures bounded responsibility periods without custody claims", () => {
  const assignment = createShipmentAssignmentContract({
    assignmentId: "assignment-1", shipmentId: "shipment-1", activityType: "pickup",
    assignee: { type: "operator", id: "operator-1" }, assignedBy: { type: "admin", id: "admin-1" },
    startsAt: "2026-11-27T10:00:00Z", endsAt: "2026-11-27T11:00:00Z",
    status: "active", createdAt: "2026-11-27T09:00:00Z",
  });
  assert.equal(assignment.status, "active");
  assert.throws(() => createShipmentAssignmentContract({
    ...assignment, endsAt: "2026-11-27T09:00:00Z",
  }), /endsAt must be later/);
});

test("document metadata requires protected storage path, checksum and access classification", () => {
  const document = createShipmentDocumentContract({
    documentId: "document-1", shipmentId: "shipment-1", documentType: "waybill", version: 1,
    storagePath: "private/shipments/s1/waybill.pdf", contentType: "application/pdf",
    sizeBytes: 100, checksum: "sha256:abc", generatedAt: "2026-11-27T10:00:00Z",
    generatedBy: { type: "admin", id: "admin-1" }, access: ["customer", "admin"],
  });
  assert.equal(document.version, 1);
  assert.throws(() => createShipmentDocumentContract({
    ...document, access: [],
  }), /access must not be empty/);
});

test("notification contracts define recipient-specific deduplicated intent and immutable attempts", () => {
  const notification = createNotificationContract({
    notificationId: "notification-1", shipmentId: "shipment-1",
    recipientType: "customer", recipientId: "customer-1", channel: "email",
    templateKey: "shipment_submitted", deduplicationKey: "shipment-1:submitted:customer-1",
    payload: { shipmentReference: "VLY-1" }, createdAt: "2026-11-27T10:00:00Z",
  });
  assert.equal(notification.status, "pending");
  const attempt = createNotificationAttemptContract({
    attemptId: "attempt-1", notificationId: notification.notificationId,
    attemptedAt: "2026-11-27T10:01:00Z", status: "failed", provider: "email-provider",
    errorCode: "TEMPORARY",
  });
  assert.equal(attempt.status, "failed");
  assert.throws(() => createNotificationAttemptContract({
    ...attempt, status: "pending",
  }), /must be delivered or failed/);
});
