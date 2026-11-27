import test from "node:test";
import assert from "node:assert/strict";
import { createShipmentFirestorePorts, SHIPMENT_FIRESTORE_PATHS } from "../lib/shipment/firestore-adapter.mjs";
import { resolveShipmentFirebaseConfig } from "../lib/shipment/firestore-runtime.mjs";

class FakeSnapshot {
  constructor(id, value) {
    this.id = id;
    this.value = value;
    this.exists = value !== undefined;
  }
  data() { return this.value === undefined ? undefined : structuredClone(this.value); }
}

class FakeQuery {
  constructor(path, filters = [], sort = null, max = null) {
    this.path = path;
    this.filters = filters;
    this.sort = sort;
    this.max = max;
  }
  where(field, operator, value) {
    return new FakeQuery(this.path, [...this.filters, [field, operator, value]], this.sort, this.max);
  }
  orderBy(field, direction = "asc") {
    return new FakeQuery(this.path, this.filters, [field, direction], this.max);
  }
  limit(max) { return new FakeQuery(this.path, this.filters, this.sort, max); }
}

class FakeDocumentReference {
  constructor(db, path) {
    this.db = db;
    this.path = path;
    this.id = path.split("/").at(-1);
  }
  collection(name) { return new FakeCollectionReference(this.db, `${this.path}/${name}`); }
}

class FakeCollectionReference extends FakeQuery {
  constructor(db, path) {
    super(path);
    this.db = db;
  }
  doc(id) { return new FakeDocumentReference(this.db, `${this.path}/${id}`); }
}

class FakeTransaction {
  constructor(db) {
    this.db = db;
    this.writes = [];
  }
  async get(target) {
    if (this.writes.length) throw new Error("Firestore transactions must perform reads before writes.");
    if (target instanceof FakeDocumentReference) {
      return new FakeSnapshot(target.id, this.db.records.get(target.path));
    }
    const prefix = `${target.path}/`;
    let docs = [...this.db.records.entries()]
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes("/"))
      .map(([path, value]) => new FakeSnapshot(path.split("/").at(-1), value));
    for (const [field, operator, value] of target.filters) {
      if (operator !== "==") throw new Error("Unsupported fake query operator");
      docs = docs.filter(snapshot => snapshot.data()?.[field] === value);
    }
    if (target.sort) {
      const [field, direction] = target.sort;
      docs.sort((a, b) => String(a.data()?.[field] ?? "").localeCompare(String(b.data()?.[field] ?? "")) * (direction === "desc" ? -1 : 1));
    }
    if (target.max != null) docs = docs.slice(0, target.max);
    return { docs, empty: docs.length === 0 };
  }
  create(ref, data) { this.writes.push({ type: "create", ref, data: structuredClone(data) }); }
  update(ref, patch) { this.writes.push({ type: "update", ref, patch: structuredClone(patch) }); }
}

class FakeFirestore {
  constructor() { this.records = new Map(); }
  collection(name) { return new FakeCollectionReference(this, name); }
  async runTransaction(handler) {
    const tx = new FakeTransaction(this);
    const result = await handler(tx);
    for (const write of tx.writes) {
      if (write.type === "create") {
        if (this.records.has(write.ref.path)) throw new Error("ALREADY_EXISTS");
        this.records.set(write.ref.path, write.data);
      } else {
        const existing = this.records.get(write.ref.path);
        if (!existing) throw new Error("NOT_FOUND");
        this.records.set(write.ref.path, { ...existing, ...write.patch });
      }
    }
    return result;
  }
}

function portsFor(db) {
  return createShipmentFirestorePorts({ db });
}

test("shipment Firestore paths are isolated from legacy root collections", () => {
  assert.equal(SHIPMENT_FIRESTORE_PATHS.shipments, "verilyftShipmentData/v1/shipments");
  assert.equal(SHIPMENT_FIRESTORE_PATHS.quotes, "verilyftShipmentData/v1/quoteLineages");
  assert.notEqual(SHIPMENT_FIRESTORE_PATHS.quotes, "shipmentQuotes");
});

test("shipment, parcel and event repositories persist and retrieve their records", async () => {
  const db = new FakeFirestore();
  const ports = portsFor(db);
  await ports.transaction.run(async tx => {
    await ports.shipments.create(tx, "shipment-1", {
      shipmentReference: "VLY-20261127-ABC234",
      status: "Submitted",
      customerId: "customer-1",
    });
    await ports.parcels.createMany(tx, "shipment-1", [{
      parcelId: "parcel-1",
      shipmentId: "shipment-1",
      description: "Documents",
      createdAt: "2026-11-27T10:00:00.000Z",
    }]);
    await ports.events.append(tx, {
      eventId: "event-1",
      shipmentId: "shipment-1",
      eventType: "shipment_submitted",
      occurredAt: "2026-11-27T10:00:00.000Z",
    });
  });

  await ports.transaction.run(async tx => {
    assert.equal((await ports.shipments.getById(tx, "shipment-1")).status, "Submitted");
    assert.equal((await ports.shipments.getByReference(tx, "VLY-20261127-ABC234")).shipmentId, "shipment-1");
    assert.equal((await ports.parcels.getById(tx, "parcel-1")).shipmentId, "shipment-1");
    assert.equal((await ports.parcels.listByShipment(tx, "shipment-1")).length, 1);
    assert.equal((await ports.events.listByShipment(tx, "shipment-1"))[0].eventId, "event-1");
  });
});

test("event repository is append-only and reference reservations are unique", async () => {
  const ports = portsFor(new FakeFirestore());
  await ports.transaction.run(tx => ports.events.append(tx, {
    eventId: "event-immutable",
    shipmentId: "shipment-immutable",
    eventType: "submitted",
    occurredAt: "2026-11-27T10:00:00.000Z",
  }));
  await assert.rejects(
    ports.transaction.run(tx => ports.events.append(tx, {
      eventId: "event-immutable",
      shipmentId: "shipment-immutable",
      eventType: "changed",
      occurredAt: "2026-11-27T11:00:00.000Z",
    })),
    /ALREADY_EXISTS/
  );

  assert.equal(await ports.transaction.run(tx => ports.references.reserveUnique(tx, "VLY-ONE")), true);
  assert.equal(await ports.transaction.run(tx => ports.references.reserveUnique(tx, "VLY-ONE")), false);
});

test("idempotency repository returns the stored result for an actor-scoped key", async () => {
  const ports = portsFor(new FakeFirestore());
  await ports.transaction.run(tx => ports.idempotency.create(tx, "customer:c1:submit:k1", {
    command: "submit_shipment",
    result: { shipmentId: "s1" },
  }));
  await ports.transaction.run(async tx => {
    const result = await ports.idempotency.get(tx, "customer:c1:submit:k1");
    assert.deepEqual(result.result, { shipmentId: "s1" });
  });
});

test("quote lineage pointer advances while quote revisions remain separate documents", async () => {
  const ports = portsFor(new FakeFirestore());
  await ports.transaction.run(async tx => {
    await ports.quotes.createLineage(tx, "quote-1", {
      quoteId: "quote-1",
      shipmentId: "shipment-1",
      createdAt: "2026-11-27T10:00:00.000Z",
    });
    await ports.quotes.appendRevision(tx, "quote-1", {
      revisionId: "revision-1",
      revisionNumber: 1,
      shipmentId: "shipment-1",
      issuedAt: "2026-11-27T10:00:00.000Z",
      totalMinor: 150000,
      currency: "NGN",
    });
  });
  await ports.transaction.run(async tx => {
    const current = await ports.quotes.getCurrent(tx, "quote-1");
    assert.equal(current.revisionId, "revision-1");
    assert.equal(current.totalMinor, 150000);
  });
});

test("payment provider references resolve to one immutable attempt identity", async () => {
  const ports = portsFor(new FakeFirestore());
  await ports.transaction.run(tx => ports.payments.createAttempt(tx, "payment-1", {
    paymentId: "payment-1",
    shipmentId: "shipment-1",
    quoteRevisionId: "revision-1",
    provider: "paystack",
    providerReference: "paystack-ref-1",
    amountMinor: 150000,
    currency: "NGN",
    status: "initialised",
    createdAt: "2026-11-27T10:00:00.000Z",
  }));
  await ports.transaction.run(async tx => {
    const payment = await ports.payments.getByProviderReference(tx, "paystack-ref-1");
    assert.equal(payment.paymentId, "payment-1");
    assert.equal(payment.amountMinor, 150000);
  });
});

test("Firebase runtime configuration requires distinct explicit staging and production targets", () => {
  const base = {
    SHIPMENT_ENVIRONMENT: "staging",
    STAGING_FIREBASE_PROJECT_ID: "verilyft-stage-example",
    PRODUCTION_FIREBASE_PROJECT_ID: "verilyft-4e691",
    SHIPMENT_FIREBASE_PROJECT_ID: "verilyft-stage-example",
    SHIPMENT_FIRESTORE_DATABASE_ID: "(default)",
    SHIPMENT_FIREBASE_CLIENT_EMAIL: "shipment-admin@example.iam.gserviceaccount.com",
    SHIPMENT_FIREBASE_PRIVATE_KEY: "private\\nkey",
  };
  const config = resolveShipmentFirebaseConfig(base);
  assert.equal(config.environment, "staging");
  assert.equal(config.projectId, "verilyft-stage-example");
  assert.equal(config.databaseId, "(default)");
  assert.equal(config.privateKey, "private\nkey");

  assert.throws(
    () => resolveShipmentFirebaseConfig({ ...base, SHIPMENT_FIREBASE_PROJECT_ID: "verilyft-4e691" }),
    /project mismatch/
  );
  assert.throws(
    () => resolveShipmentFirebaseConfig({ ...base, STAGING_FIREBASE_PROJECT_ID: "verilyft-4e691" }),
    /must be different/
  );
});
