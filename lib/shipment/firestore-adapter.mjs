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
  return { [idField]: snapshot.id, ...snapshot.data() };
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
  namespace = DEFAULT_NAMESPACE,
  version = DEFAULT_VERSION,
  maxTransactionAttempts = 5,
} = {}) {
  assertFirestore(db);
  requiredText(namespace, "namespace");
  requiredText(version, "version");
  if (!Number.isSafeInteger(maxTransactionAttempts) || maxTransactionAttempts < 1) {
    throw new TypeError("maxTransactionAttempts must be a positive integer");
  }

  const root = db.collection(namespace).doc(version);
  const collection = name => root.collection(name);
  const shipmentRef = id => collection("shipments").doc(requiredText(id, "shipmentId"));
  const parcelRef = id => collection("parcels").doc(requiredText(id, "parcelId"));
  const quoteRef = id => collection("quoteLineages").doc(requiredText(id, "quoteId"));
  const paymentRef = id => collection("payments").doc(requiredText(id, "paymentId"));
  const eventCollection = shipmentId => shipmentRef(shipmentId).collection("events");

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
        tx.get(db.collection("users").doc(id)),
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
      return { shipmentId: doc.id, ...doc.data() };
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
        .map(doc => ({ parcelId: doc.id, ...doc.data() }))
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
      return createOnly(tx, quoteRef(quoteId), {
        ...lineage,
        quoteId,
        status: "active",
        currentRevisionId: null,
        currentRevisionNumber: 0,
      }, quoteId);
    },
    appendRevision(tx, quoteId, revision) {
      const lineage = quoteRef(quoteId);
      const revisionId = requiredText(revision.revisionId, "revisionId");
      createOnly(tx, lineage.collection("revisions").doc(revisionId), revision, revisionId);
      // The lineage pointer is mutable; revision documents are append-only.
      tx.update(lineage, {
        currentRevisionId: revisionId,
        currentRevisionNumber: revision.revisionNumber,
        updatedAt: revision.issuedAt,
      });
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
      return result.docs.map(doc => ({ eventId: doc.id, ...doc.data() }));
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

  return Object.freeze({
    transaction,
    customers,
    shipments,
    parcels,
    quotes,
    payments,
    events,
    idempotency,
    references,
    metadata: Object.freeze({ namespace, version }),
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
});
