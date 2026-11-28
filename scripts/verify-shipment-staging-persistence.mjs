#!/usr/bin/env node
/**
 * Disposable Phase 3 Firestore adapter smoke test.
 *
 * Writes only to a unique verification version beneath the staging shipment
 * namespace, verifies every repository family, then recursively deletes that
 * verification version. It refuses to run against production.
 *
 * Synthetic photo/document identifiers are test fixtures only. This verifies
 * Firestore metadata persistence, not the external Cloudinary asset verifier.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const expectedStagingProject = "verilyft-minimal";
const expectedProductionProject = "verilyft-4e691";
if (process.env.SHIPMENT_ENVIRONMENT !== "staging") {
  throw new Error("Refusing to run: SHIPMENT_ENVIRONMENT must be exactly 'staging'.");
}
if (process.env.STAGING_FIREBASE_PROJECT_ID !== expectedStagingProject) {
  throw new Error(`Refusing to run: STAGING_FIREBASE_PROJECT_ID must be ${expectedStagingProject}.`);
}
if (process.env.PRODUCTION_FIREBASE_PROJECT_ID !== expectedProductionProject) {
  throw new Error(`Refusing to run: PRODUCTION_FIREBASE_PROJECT_ID must be ${expectedProductionProject}.`);
}
if (process.env.SHIPMENT_FIREBASE_PROJECT_ID !== expectedStagingProject) {
  throw new Error(`Refusing to run: shipment runtime must target ${expectedStagingProject}.`);
}

const { createShipmentFirestoreRuntime } = await import("../lib/shipment/firestore-runtime.mjs");
const runId = randomUUID().replaceAll("-", "");
const namespace = "verilyftShipmentData";
const version = `phase3Verification_${runId}`;
const runtime = createShipmentFirestoreRuntime({ namespace, version });
const { db, ports, config } = runtime;
if (config.environment !== "staging" || config.projectId !== expectedStagingProject) {
  throw new Error("Resolved shipment runtime is not the approved staging target.");
}

const ids = {
  customer: `test-customer-${runId}`,
  shipment: `test-shipment-${runId}`,
  parcel: `test-parcel-${runId}`,
  quote: `test-quote-${runId}`,
  revision: `test-revision-${runId}`,
  payment: `test-payment-${runId}`,
  intake: `test-intake-${runId}`,
  assignment: `test-assignment-${runId}`,
  document: `test-document-${runId}`,
  notification: `test-notification-${runId}`,
  event: `test-event-${runId}`,
};
const now = new Date().toISOString();
const reference = `VLY-TEST-${runId.toUpperCase()}`;
const actor = { type: "admin", id: `phase3-verification-${runId}` };
const checks = [];

try {
  await ports.transaction.run(async tx => {
    assert.equal(await ports.references.reserveUnique(tx, reference), true);
    ports.customers.create(tx, ids.customer, {
      customerId: ids.customer, accountStatus: "pending_registration",
      fullName: "Phase 3 verification fixture", authUid: null, createdAt: now,
    });
    ports.shipments.create(tx, ids.shipment, {
      shipmentId: ids.shipment, shipmentReference: reference,
      customerId: ids.customer, status: "Submitted", createdAt: now, updatedAt: now,
    });
    ports.parcels.createMany(tx, ids.shipment, [{
      parcelId: ids.parcel, shipmentId: ids.shipment, description: "Verification fixture",
      quantity: 1, declaredWeight: 1, weightUnit: "kg", createdAt: now,
    }]);
    ports.events.append(tx, {
      eventId: ids.event, shipmentId: ids.shipment, eventType: "phase3_verification",
      actor, occurredAt: now, visibility: ["admin"], summary: "Disposable persistence verification fixture.",
      evidenceRefs: [], idempotencyKey: `verify:${runId}`,
    });
    ports.idempotency.create(tx, `admin:${actor.id}:phase3_verify:${runId}`, {
      command: "phase3_verify", result: { shipmentId: ids.shipment }, completedAt: now,
    });
  });
  checks.push("shipment, parcel, customer, event, reference reservation and idempotency writes");

  await ports.transaction.run(async tx => {
    assert.equal((await ports.shipments.getById(tx, ids.shipment)).shipmentReference, reference);
    assert.equal((await ports.shipments.getByReference(tx, reference)).shipmentId, ids.shipment);
    assert.equal((await ports.parcels.listByShipment(tx, ids.shipment)).length, 1);
    assert.equal((await ports.events.listByShipment(tx, ids.shipment)).length, 1);
    assert.equal((await ports.customers.getById(tx, ids.customer)).customerId, ids.customer);
    assert.ok(await ports.idempotency.get(tx, `admin:${actor.id}:phase3_verify:${runId}`));
  });
  checks.push("shipment relationship and repository read-back");

  await ports.transaction.run(async tx => {
    assert.equal(await ports.references.reserveUnique(tx, reference), false);
  });
  checks.push("unique shipment reference collision protection");

  await ports.transaction.run(async tx => {
    ports.quotes.createLineage(tx, ids.quote, {
      quoteId: ids.quote, shipmentId: ids.shipment, createdAt: now,
    });
    ports.quotes.appendRevision(tx, ids.quote, {
      revisionId: ids.revision, revisionNumber: 1, shipmentId: ids.shipment,
      issuedAt: now, totalMinor: 25000, distanceKm: 18.5,
      pricingInputs: { ratePerKmMinor: 1000, fuelAdjustmentMinor: 500 }, currency: "NGN",
    });
  });
  await ports.transaction.run(async tx => {
    const quote = await ports.quotes.getCurrent(tx, ids.quote);
    assert.equal(quote.revisionId, ids.revision);
    assert.equal(quote.totalMinor, 25000);
    assert.equal(quote.distanceKm, 18.5);
    assert.deepEqual(quote.pricingInputs, { ratePerKmMinor: 1000, fuelAdjustmentMinor: 500 });
  });
  checks.push("quote lineage and immutable revision pointer");

  await ports.transaction.run(tx => ports.payments.createAttempt(tx, ids.payment, {
    paymentId: ids.payment, shipmentId: ids.shipment, quoteRevisionId: ids.revision,
    provider: "paystack", providerReference: `test-paystack-${runId}`,
    amountMinor: 25000, currency: "NGN", status: "initialised", createdAt: now,
  }));
  await ports.transaction.run(async tx => {
    assert.equal((await ports.payments.getByProviderReference(tx, `test-paystack-${runId}`)).paymentId, ids.payment);
  });
  checks.push("payment attempt and provider-reference index");

  await ports.transaction.run(tx => ports.intakes.create(tx, {
    intakeId: ids.intake, shipmentId: ids.shipment, parcelIds: [ids.parcel],
    pudoLocationId: `test-pudo-${runId}`, status: "completed",
    photoEvidenceRefs: [`test-fixture:cloudinary-photo:${runId}`], receivedAt: now, recordedAt: now,
  }));
  await ports.transaction.run(async tx => {
    assert.equal((await ports.intakes.listByShipment(tx, ids.shipment)).length, 1);
  });
  checks.push("immutable completed parcel intake record");

  await ports.transaction.run(tx => ports.assignments.create(tx, ids.shipment, {
    assignmentId: ids.assignment, shipmentId: ids.shipment, activityType: "verification_fixture",
    assignee: { type: "operator", id: actor.id }, assignedBy: actor,
    startsAt: now, endsAt: null, status: "active", createdAt: now,
  }));
  await ports.transaction.run(async tx => {
    assert.equal((await ports.assignments.listByShipment(tx, ids.shipment)).length, 1);
  });
  checks.push("shipment assignment history");

  await ports.transaction.run(tx => ports.documents.create(tx, ids.shipment, {
    documentId: ids.document, shipmentId: ids.shipment, documentType: "verification_fixture",
    version: 1, assetProvider: "cloudinary",
    cloudinaryPublicId: `phase3-verification/${runId}/fixture`, resourceType: "raw",
    contentType: "application/pdf", sizeBytes: 128, checksum: `sha256:${runId}`,
    generatedAt: now, generatedBy: actor, access: ["admin"],
  }));
  await ports.transaction.run(async tx => {
    const docs = await ports.documents.listByShipment(tx, ids.shipment);
    assert.equal(docs[0].cloudinaryPublicId, `phase3-verification/${runId}/fixture`);
  });
  checks.push("Cloudinary document metadata reference");

  await ports.transaction.run(tx => ports.notifications.create(tx, {
    notificationId: ids.notification, shipmentId: ids.shipment, recipientType: "admin",
    recipientId: actor.id, channel: "email", templateKey: "phase3_verification",
    deduplicationKey: `phase3-verification:${runId}`, payload: { shipmentReference: reference },
    status: "pending", createdAt: now, updatedAt: now,
  }));
  await ports.transaction.run(async tx => {
    const found = await ports.notifications.findByDeduplicationKey(tx, `phase3-verification:${runId}`);
    assert.equal(found.notificationId, ids.notification);
  });
  await ports.transaction.run(tx => {
    ports.notifications.appendAttempt(tx, ids.notification, {
      attemptId: `attempt-${runId}`, notificationId: ids.notification,
      attemptedAt: now, status: "failed", provider: "verification-fixture",
      errorCode: "TEST_ONLY", errorMessage: "Disposable verification attempt.",
    });
    ports.notifications.updateStatus(tx, ids.notification, {
      status: "failed", updatedAt: now, lastAttemptAt: now,
    });
  });
  await ports.transaction.run(async tx => {
    assert.equal((await ports.notifications.listAttempts(tx, ids.notification)).length, 1);
    assert.equal((await ports.notifications.getById(tx, ids.notification)).status, "failed");
  });
  checks.push("notification deduplication and append-only delivery attempts");

  console.log("PASS: staging shipment Firestore persistence verification");
  console.log(`Environment: ${config.environment}`);
  console.log(`Firebase project: ${config.projectId}`);
  console.log(`Firestore database: ${config.databaseId}`);
  for (const check of checks) console.log(`PASS: ${check}`);
} finally {
  await db.recursiveDelete(db.collection(namespace).doc(version));
  console.log(`CLEANUP: removed disposable verification namespace ${namespace}/${version}`);
}
