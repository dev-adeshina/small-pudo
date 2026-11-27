/**
 * Firestore implementation of the Phase 3 shipment repository ports.
 *
 * This module accepts an explicitly selected Firestore instance. It never
 * initialises Firebase, selects a project/database, or falls back to the
 * application's default Admin SDK connection.
 *
 * All authoritative shipment data is stored below:
 *   verilyftShipmentData/v1/*
 *
 * This namespace deliberately avoids collisions with legacy shipmentQuotes,
 * customer drafts, storefront orders and existing operational collections.
 */
import { createHash } from "node:crypto";

const DEFAULT_NAMESPACE = "verilyftShipmentData";
const DEFAULT_VERSION = "v1";

function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} is required`);
  }
  return value.trim();
}

function assertFirestore(db) {
  if (!db || typeof db.collection !== "function" || typeof db.runTransaction !== "function") {
    throw new TypeError("An explicitly selected Firestore instance is required.");
  }
}

function hashKey(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, clean(item)])
  );
}

function snapshotData(snapshot, idField) {
  if (!snapshot?.exists) return null;
  return { ...snapshot.data(), [idField]: snapshot.id };
}

function createOnly(tx, ref, data, label) {
  if (typeof tx.create !== "function") {
    throw new TypeError("Firestore transaction.create is required for immutable/unique records.");
  }
  tx.create(ref, clean(data));
  return label;
}

export function createShipmentFirestorePorts({
  db,
  identityDb = db,
  namespace = DEFAULT_NAMESPACE,
  version = DEFAULT_VERSION,
  maxTransactionAttempts = 5,
} = {}) {
  assertFirestore(db);
  assertFirestore(identityDb);
  if (identityDb !== db) throw new TypeError("Identity authorities must be read from the same Firestore database transaction; cross-database transactions are not supported.");
  requiredText(namespace, "namespace");
  requiredText(version, "version");
  if (namespace.includes("/") || version.includes("/")) {
    throw new TypeError("Firestore namespace and version must each be a single path segment.");
  }
  if (!Number.isSafeInteger(maxTransactionAttempts) || maxTransactionAttempts < 1) {
    throw new TypeError("maxTransactionAttempts must be a positive integer");
  }

  const root = db.collection(namespace).doc(version);
  const collection = name => root.collection(name);
  const shipmentRef = id => collection("shipments").doc(requiredText(id, "shipmentId"));
  const parcelRef = id => collection("parcels").doc(requiredText(id, "parcelId"));
  const quoteRef = id => collection("quoteLineages").doc(requiredText(id, "quoteId"));
  const paymentRef = id => collection("payments").doc(requiredText(id, "paymentId"));
  const intakeRef = id => collection("parcelIntakes").doc(requiredText(id, "intakeId"));
  const assignmentRef = (shipmentId, id) => shipmentRef(shipmentId).collection("assignments").doc(requiredText(id, "assignmentId"));
  const documentRef = (shipmentId, id) => shipmentRef(shipmentId).collection("documents").doc(requiredText(id, "documentId"));
  const notificationRef = id => collection("notifications").doc(requiredText(id, "notificationId"));
  const eventCollection = shipmentId => shipmentRef(shipmentId).collection("events");
  const pendingQuoteLineages = new WeakMap();

  const transaction = Object.freeze({
    run(handler) {
      if (typeof handler !== "function") throw new TypeError("transaction handler is required");
      return db.runTransaction(tx => handler(tx), { maxAttempts: maxTransactionAttempts });
    },
  });

  const customers = Object.freeze({
    async getById(tx, customerId) {
      const id = requiredText(customerId, "customerId");
      // Registered customers remain authoritative in the existing users store.
      // PUDO walk-in profiles are held in this shipment namespace.
      const [userSnapshot, walkInSnapshot] = await Promise.all([
        tx.get(identityDb.collection("users").doc(id)),
        tx.get(collection("walkInCustomers").doc(id)),
      ]);
      if (userSnapshot.exists) {
        return { customerId: id, ...userSnapshot.data(), accountStatus: "registered" };
      }
      return snapshotData(walkInSnapshot, "customerId");
    },
    create(tx, customerId, profile) {
      return createOnly(tx, collection("walkInCustomers").doc(requiredText(customerId, "customerId")), {
        ...profile,
        customerId,
      }, customerId);
    },
  });

  const shipments = Object.freeze({
    create(tx, shipmentId, record) {
      return createOnly(tx, shipmentRef(shipmentId), { ...record, shipmentId }, shipmentId);
    },
    async getById(tx, shipmentId) {
      return snapshotData(await tx.get(shipmentRef(shipmentId)), "shipmentId");
    },
    async getByReference(tx, reference) {
      const query = collection("shipments")
        .where("shipmentReference", "==", requiredText(reference, "shipmentReference"))
        .limit(1);
      const result = await tx.get(query);
      if (result.empty) return null;
      const doc = result.docs[0];
      return { ...doc.data(), shipmentId: doc.id };
    },
    update(tx, shipmentId, patch) {
      tx.update(shipmentRef(shipmentId), clean(patch));
      return shipmentId;
    },
  });

  const parcels = Object.freeze({
    createMany(tx, shipmentId, records) {
      const parentId = requiredText(shipmentId, "shipmentId");
      if (!Array.isArray(records) || records.length === 0) {
        throw new TypeError("At least one parcel record is required.");
      }
      for (const record of records) {
        const parcelId = requiredText(record.parcelId, "parcelId");
        createOnly(tx, parcelRef(parcelId), { ...record, parcelId, shipmentId: parentId }, parcelId);
      }
      return records.length;
    },
    async listByShipment(tx, shipmentId) {
      const query = collection("parcels")
        .where("shipmentId", "==", requiredText(shipmentId, "shipmentId"));
      const result = await tx.get(query);
      return result.docs
        .map(doc => ({ ...doc.data(), parcelId: doc.id }))
        .sort((left, right) => String(left.createdAt ?? "").localeCompare(String(right.createdAt ?? "")));
    },
    async getById(tx, parcelId) {
      return snapshotData(await tx.get(parcelRef(parcelId)), "parcelId");
    },
    update(tx, parcelId, patch) {
      tx.update(parcelRef(parcelId), clean(patch));
      return parcelId;
    },
  });

  const quotes = Object.freeze({
    createLineage(tx, quoteId, lineage) {
      // Stage lineage metadata in memory so the first transaction write can
      // create it with its initial revision pointer in one operation.
      let pending = pendingQuoteLineages.get(tx);
      if (!pending) {
        pending = new Map();
        pendingQuoteLineages.set(tx, pending);
      }
      pending.set(requiredText(quoteId, "quoteId"), clean({
        ...lineage,
        quoteId,
        status: "active",
        currentRevisionId: null,
        currentRevisionNumber: 0,
      }));
      return quoteId;
    },
    appendRevision(tx, quoteId, revision) {
      const lineageRef = quoteRef(quoteId);
      const revisionId = requiredText(revision.revisionId, "revisionId");
      createOnly(tx, lineageRef.collection("revisions").doc(revisionId), revision, revisionId);
      const pending = pendingQuoteLineages.get(tx);
      const stagedLineage = pending?.get(quoteId);
      const pointer = {
        currentRevisionId: revisionId,
        currentRevisionNumber: revision.revisionNumber,
        updatedAt: revision.issuedAt,
      };
      if (stagedLineage) {
        // A new lineage is created once, already pointing at revision 1.
        createOnly(tx, lineageRef, { ...stagedLineage, ...pointer }, quoteId);
        pending.delete(quoteId);
      } else {
        // Existing lineage pointer advances; prior revision docs are untouched.
        tx.update(lineageRef, pointer);
      }
      return revisionId;
    },
    async getCurrent(tx, quoteId) {
      const lineageSnapshot = await tx.get(quoteRef(quoteId));
      if (!lineageSnapshot.exists || lineageSnapshot.data().status !== "active") return null;
      const currentRevisionId = lineageSnapshot.data().currentRevisionId;
      if (!currentRevisionId) return null;
      const revisionSnapshot = await tx.get(
        quoteRef(quoteId).collection("revisions").doc(currentRevisionId)
      );
      return snapshotData(revisionSnapshot, "revisionId");
    },
    withdraw(tx, quoteId, details = {}) {
      tx.update(quoteRef(quoteId), {
        status: "withdrawn",
        withdrawnAt: details.withdrawnAt ?? new Date().toISOString(),
        withdrawnBy: details.withdrawnBy ?? null,
        withdrawalReason: details.reason ?? null,
      });
      return quoteId;
    },
  });

  const payments = Object.freeze({
    createAttempt(tx, paymentId, attempt) {
      const id = requiredText(paymentId, "paymentId");
      const providerKey = `${attempt.provider}:${attempt.providerReference}`;
      const providerIndex = collection("paymentProviderReferences").doc(hashKey(providerKey));
      createOnly(tx, paymentRef(id), { ...attempt, paymentId: id }, id);
      createOnly(tx, providerIndex, {
        provider: attempt.provider,
        providerReference: attempt.providerReference,
        paymentId: id,
        shipmentId: attempt.shipmentId,
      }, id);
      return id;
    },
    async getById(tx, paymentId) {
      return snapshotData(await tx.get(paymentRef(paymentId)), "paymentId");
    },
    async getByProviderReference(tx, providerReference) {
      const index = collection("paymentProviderReferences").doc(
        hashKey(`paystack:${requiredText(providerReference, "providerReference")}`)
      );
      const indexSnapshot = await tx.get(index);
      if (!indexSnapshot.exists) return null;
      const { paymentId } = indexSnapshot.data();
      return snapshotData(await tx.get(paymentRef(paymentId)), "paymentId");
    },
    updateAttempt(tx, paymentId, patch) {
      const allowed = ["status", "verifiedAt", "failedAt", "abandonedAt", "refundedAt", "providerStatus"];
      const safePatch = Object.fromEntries(
        Object.entries(patch ?? {}).filter(([key]) => allowed.includes(key))
      );
      if (Object.keys(safePatch).length === 0) throw new TypeError("No permitted payment-attempt fields supplied.");
      tx.update(paymentRef(paymentId), clean(safePatch));
      return paymentId;
    },
  });

  const events = Object.freeze({
    append(tx, event) {
      const shipmentId = requiredText(event.shipmentId, "shipmentId");
      const eventId = requiredText(event.eventId, "eventId");
      return createOnly(tx, eventCollection(shipmentId).doc(eventId), event, eventId);
    },
    async listByShipment(tx, shipmentId) {
      const query = eventCollection(shipmentId).orderBy("occurredAt", "asc");
      const result = await tx.get(query);
      return result.docs.map(doc => ({ ...doc.data(), eventId: doc.id }));
    },
  });

  const idempotency = Object.freeze({
    async get(tx, scopedKey) {
      const ref = collection("idempotency").doc(hashKey(requiredText(scopedKey, "scopedKey")));
      const snapshot = await tx.get(ref);
      return snapshotData(snapshot, "idempotencyId");
    },
    create(tx, scopedKey, record) {
      const key = requiredText(scopedKey, "scopedKey");
      const id = hashKey(key);
      return createOnly(tx, collection("idempotency").doc(id), {
        ...record,
        idempotencyId: id,
        scopedKey: key,
      }, id);
    },
  });

  const references = Object.freeze({
    async reserveUnique(tx, candidate) {
      const reference = requiredText(candidate, "shipmentReference");
      const ref = collection("shipmentReferenceReservations").doc(hashKey(reference.toUpperCase()));
      const snapshot = await tx.get(ref);
      if (snapshot.exists) return false;
      createOnly(tx, ref, {
        shipmentReference: reference,
        reservedAt: new Date().toISOString(),
      }, reference);
      return true;
    },
  });


  // Completed intake records are immutable; corrections are new linked records.
  const intakes = Object.freeze({
    create(tx, record) {
      const id = requiredText(record.intakeId, "intakeId");
      if (!Array.isArray(record.photoEvidenceRefs) || record.photoEvidenceRefs.length === 0) throw new TypeError("A completed parcel intake requires at least one photo evidence reference.");
      if (record.status !== "completed") throw new TypeError("Only completed intake records may be persisted.");
      return createOnly(tx, intakeRef(id), record, id);
    },
    async getById(tx, intakeId) { return snapshotData(await tx.get(intakeRef(intakeId)), "intakeId"); },
    async listByShipment(tx, shipmentId) {
      const result = await tx.get(collection("parcelIntakes").where("shipmentId", "==", requiredText(shipmentId, "shipmentId")));
      return result.docs.map(doc => ({ ...doc.data(), intakeId: doc.id }));
    },
    async appendCorrection(tx, originalIntakeId, correction) {
      const original = await tx.get(intakeRef(originalIntakeId));
      if (!original.exists || correction.correctionOfIntakeId !== originalIntakeId) throw new TypeError("Correction must reference an existing original intake.");
      const id = requiredText(correction.intakeId, "intakeId");
      return createOnly(tx, intakeRef(id), correction, id);
    },
  });

  // Assignment history is retained; only operational status can change.
  const assignments = Object.freeze({
    create(tx, shipmentId, record) {
      const id = requiredText(record.assignmentId, "assignmentId");
      return createOnly(tx, assignmentRef(shipmentId, id), { ...record, shipmentId }, id);
    },
    async getById(tx, shipmentId, assignmentId) { return snapshotData(await tx.get(assignmentRef(shipmentId, assignmentId)), "assignmentId"); },
    async listByShipment(tx, shipmentId) {
      const result = await tx.get(shipmentRef(shipmentId).collection("assignments").orderBy("startsAt", "asc"));
      return result.docs.map(doc => ({ ...doc.data(), assignmentId: doc.id }));
    },
    updateStatus(tx, shipmentId, assignmentId, status, updatedAt) {
      if (!["active", "completed", "cancelled", "superseded"].includes(status)) throw new TypeError("Unsupported assignment status.");
      tx.update(assignmentRef(shipmentId, assignmentId), { status, updatedAt: requiredText(updatedAt, "updatedAt") });
      return assignmentId;
    },
  });

  // Document metadata is immutable and contains no file bytes or public URL.
  const documents = Object.freeze({
    create(tx, shipmentId, record) {
      if (!record.storagePath || !record.checksum || !record.access?.length) throw new TypeError("Shipment document requires protected storage metadata, checksum and access classification.");
      const id = requiredText(record.documentId, "documentId");
      return createOnly(tx, documentRef(shipmentId, id), { ...record, shipmentId }, id);
    },
    async getById(tx, shipmentId, documentId) { return snapshotData(await tx.get(documentRef(shipmentId, documentId)), "documentId"); },
    async listByShipment(tx, shipmentId) {
      const result = await tx.get(shipmentRef(shipmentId).collection("documents").orderBy("generatedAt", "asc"));
      return result.docs.map(doc => ({ ...doc.data(), documentId: doc.id }));
    },
  });

  // Notification intent is deduplicated; delivery attempts are append-only.
  const notifications = Object.freeze({
    create(tx, record) {
      const id = requiredText(record.notificationId, "notificationId");
      const dedupe = collection("notificationDeduplication").doc(hashKey(requiredText(record.deduplicationKey, "deduplicationKey")));
      createOnly(tx, notificationRef(id), record, id);
      createOnly(tx, dedupe, { notificationId: id, deduplicationKey: record.deduplicationKey }, id);
      return id;
    },
    async getById(tx, notificationId) { return snapshotData(await tx.get(notificationRef(notificationId)), "notificationId"); },
    async findByDeduplicationKey(tx, key) {
      const ref = collection("notificationDeduplication").doc(hashKey(requiredText(key, "deduplicationKey")));
      const index = await tx.get(ref);
      if (!index.exists) return null;
      return snapshotData(await tx.get(notificationRef(index.data().notificationId)), "notificationId");
    },
    updateStatus(tx, notificationId, patch) {
      const allowed = ["status", "updatedAt", "nextAttemptAt", "lastAttemptAt"];
      const safePatch = Object.fromEntries(Object.entries(patch ?? {}).filter(([key]) => allowed.includes(key)));
      if (!Object.keys(safePatch).length) throw new TypeError("No permitted notification status fields supplied.");
      if (safePatch.status && !["pending", "processing", "delivered", "failed", "cancelled"].includes(safePatch.status)) throw new TypeError("Unsupported notification status.");
      tx.update(notificationRef(notificationId), clean(safePatch));
      return notificationId;
    },
    appendAttempt(tx, notificationId, attempt) {
      const id = requiredText(attempt.attemptId, "attemptId");
      return createOnly(tx, notificationRef(notificationId).collection("attempts").doc(id), { ...attempt, notificationId }, id);
    },
    async listAttempts(tx, notificationId) {
      const result = await tx.get(notificationRef(notificationId).collection("attempts").orderBy("attemptedAt", "asc"));
      return result.docs.map(doc => ({ ...doc.data(), attemptId: doc.id }));
    },
  });


  // Read-only references to existing authorities in this same database.
  // Firestore transactions cannot span database instances; callers must
  // provision the environment project with its own identity collections.
  const authorities = Object.freeze({
    async getCustomerByAuthUid(tx, uid) {
      return snapshotData(await tx.get(identityDb.collection("users").doc(requiredText(uid, "uid"))), "customerId");
    },
    async getAdminAccessByAuthUid(tx, uid) {
      return snapshotData(await tx.get(identityDb.collection("adminAccess").doc(requiredText(uid, "uid"))), "adminUid");
    },
    async getPudoPartnerByAuthUid(tx, uid) {
      return snapshotData(await tx.get(identityDb.collection("pudoPartnerAccounts").doc(requiredText(uid, "uid"))), "partnerUid");
    },
    async getPudoLocationById(tx, locationId) {
      return snapshotData(await tx.get(identityDb.collection("pudoLocations").doc(requiredText(locationId, "locationId"))), "pudoLocationId");
    },
  });

  return Object.freeze({
    transaction,
    customers,
    authorities,
    shipments,
    parcels,
    quotes,
    payments,
    events,
    idempotency,
    references,
    intakes,
    assignments,
    documents,
    notifications,
    metadata: Object.freeze({ namespace, version, identityDbSameDatabase: true }),
  });
}

export const SHIPMENT_FIRESTORE_PATHS = Object.freeze({
  root: "verilyftShipmentData/v1",
  customers: "verilyftShipmentData/v1/walkInCustomers",
  shipments: "verilyftShipmentData/v1/shipments",
  parcels: "verilyftShipmentData/v1/parcels",
  quotes: "verilyftShipmentData/v1/quoteLineages",
  payments: "verilyftShipmentData/v1/payments",
  events: "verilyftShipmentData/v1/shipments/{shipmentId}/events",
  idempotency: "verilyftShipmentData/v1/idempotency",
  shipmentReferenceReservations: "verilyftShipmentData/v1/shipmentReferenceReservations",
  paymentProviderReferences: "verilyftShipmentData/v1/paymentProviderReferences",
  intakes: "verilyftShipmentData/v1/parcelIntakes",
  assignments: "verilyftShipmentData/v1/shipments/{shipmentId}/assignments",
  documents: "verilyftShipmentData/v1/shipments/{shipmentId}/documents",
  notifications: "verilyftShipmentData/v1/notifications",
  notificationAttempts: "verilyftShipmentData/v1/notifications/{notificationId}/attempts",
});
