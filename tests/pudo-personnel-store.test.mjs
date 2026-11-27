import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createPudoPersonnelStore } from "../lib/server/pudo-personnel-store-core.ts";

function createFirestore(seed = {}) {
  const records = new Map(Object.entries(seed));
  let nextId = 0;
  const ref = (path) => ({
    path,
    id: path.split("/").at(-1),
    async get() {
      const value = records.get(path);
      return { exists: value !== undefined, data: () => value };
    },
    collection(name) { return collection(`${path}/${name}`); },
  });
  const collection = (path) => ({
    doc(id) { return ref(`${path}/${id ?? `generated-${++nextId}`}`); },
    limit() { return this; },
    async get() {
      const prefix = `${path}/`;
      const docs = [...records.entries()]
        .filter(([key]) => key.startsWith(prefix) && !key.slice(prefix.length).includes("/"))
        .map(([key, value]) => ({ id: key.split("/").at(-1), data: () => value }));
      return { docs };
    },
  });
  return {
    records,
    collection,
    async runTransaction(callback) {
      const transaction = {
        async get(documentRef) { return documentRef.get(); },
        create(documentRef, value) {
          if (records.has(documentRef.path)) throw new Error("already exists");
          records.set(documentRef.path, value);
        },
        update(documentRef, value) {
          const current = records.get(documentRef.path);
          if (!current) throw new Error("missing");
          records.set(documentRef.path, { ...current, ...value });
        },
      };
      return callback(transaction);
    },
  };
}

function setup() {
  const db = createFirestore({
    "pudoPartnerAccounts/partner-1": { accountStatus: "active" },
    "pudoPartnerAccounts/partner-2": { accountStatus: "active" },
    "pudoLocations/location-1": { partnerUid: "partner-1" },
  });
  const store = createPudoPersonnelStore({ db, serverTimestamp: () => new Date("2026-11-27T12:00:00Z") });
  return { db, store };
}

describe("PUDO personnel roster", () => {
  it("creates roster entries beneath a location owned by the authenticated partner", async () => {
    const { db, store } = setup();
    const created = await store.create("partner-1", "location-1", { name: "Ada Worker", role: "Station staff" });
    assert.equal(created.status, "active");
    assert.equal(db.records.get(`pudoLocations/location-1/personnel/${created.personnelId}`).createdBy, "partner-1");
    assert.equal((await store.list("partner-1", "location-1")).length, 1);
  });

  it("prevents a different partner from reading or managing the location roster", async () => {
    const { store } = setup();
    await assert.rejects(
      store.list("partner-2", "location-1"),
      /not available to your partner account/,
    );
    await assert.rejects(
      store.create("partner-2", "location-1", { name: "Ada Worker", role: "Station staff" }),
      /not available to your partner account/,
    );
  });

  it("updates records and deactivates without deleting the audit trail or roster entry", async () => {
    const { db, store } = setup();
    const created = await store.create("partner-1", "location-1", { name: "Ada Worker", role: "Station staff" });
    await store.update("partner-1", "location-1", created.personnelId, { name: "Ada A.", role: "Bike man" });
    await store.deactivate("partner-1", "location-1", created.personnelId);
    const path = `pudoLocations/location-1/personnel/${created.personnelId}`;
    assert.equal(db.records.get(path).name, "Ada A.");
    assert.equal(db.records.get(path).status, "inactive");
    assert.ok([...db.records.keys()].some(key => key.startsWith("pudoLocations/location-1/auditEvents/")));
  });
});
