import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import { createShipmentQuoteStore } from "../lib/server/shipment-quote-store-core.ts";

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

describe(
  "shipment quote lineage Firestore store",
  { skip: !emulatorAvailable },
  () => {
    let app;
    let db;
    let store;
    const quoteIds = new Set();

    before(() => {
      app = initializeApp(
        { projectId: "demo-verilyft-shipment-quote-store" },
        `shipment-quote-store-tests-${randomUUID()}`
      );
      db = getFirestore(app);
      store = createShipmentQuoteStore({
        db,
        serverTimestamp: () => FieldValue.serverTimestamp(),
      });
    });

    after(async () => {
      for (const quoteId of quoteIds) {
        const quoteRef = db.collection("shipmentQuotes").doc(quoteId);
        const versions = await quoteRef.collection("versions").listDocuments();
        await Promise.all(versions.map((version) => version.delete()));
        await quoteRef.delete();
      }

      if (app) await deleteApp(app);
    });

    async function createQuote(snapshot = { description: "Documents" }) {
      const created = await store.createLineage(
        `customer-${randomUUID()}`,
        snapshot
      );
      quoteIds.add(created.quoteId);
      return created;
    }

    it("creates a lineage and its first immutable version atomically", async () => {
      const bookingPartyUid = `customer-${randomUUID()}`;
      const snapshot = {
        request: { origin: "Lagos", destination: "Abuja" },
        notes: "Synthetic fixture",
      };

      const created = await store.createLineage(bookingPartyUid, snapshot);
      quoteIds.add(created.quoteId);

      const quoteRef = db.collection("shipmentQuotes").doc(created.quoteId);
      const versionRef = quoteRef.collection("versions").doc(created.versionId);
      const [quoteDocument, versionDocument] = await Promise.all([
        quoteRef.get(),
        versionRef.get(),
      ]);

      assert.equal(quoteDocument.exists, true);
      assert.equal(versionDocument.exists, true);
      assert.deepEqual(quoteDocument.data(), {
        bookingPartyUid,
        currentVersionId: created.versionId,
        createdAt: quoteDocument.data().createdAt,
        updatedAt: quoteDocument.data().updatedAt,
      });
      assert.equal(created.sequence, 1);
      assert.equal(versionDocument.data().sequence, 1);
      assert.deepEqual(versionDocument.data().snapshot, snapshot);
      assert.equal(typeof quoteDocument.data().createdAt.toDate, "function");
      assert.equal(typeof versionDocument.data().createdAt.toDate, "function");
      assert.equal("bookingId" in quoteDocument.data(), false);
      assert.equal("acceptedVersionId" in quoteDocument.data(), false);
    });

    it("adds a new version without changing the previous version", async () => {
      const created = await createQuote({
        serviceSelection: "synthetic-before",
      });
      const quoteRef = db.collection("shipmentQuotes").doc(created.quoteId);
      const originalVersionRef = quoteRef
        .collection("versions")
        .doc(created.versionId);
      const originalBefore = (await originalVersionRef.get()).data();

      const revised = await store.reviseLineage({
        quoteId: created.quoteId,
        expectedCurrentVersionId: created.versionId,
        snapshot: { serviceSelection: "synthetic-after" },
      });

      assert.equal(revised.outcome, "updated");
      if (revised.outcome !== "updated") return;

      const [quoteDocument, originalAfter, nextVersion] = await Promise.all([
        quoteRef.get(),
        originalVersionRef.get(),
        quoteRef.collection("versions").doc(revised.versionId).get(),
      ]);

      assert.equal(quoteDocument.data().currentVersionId, revised.versionId);
      assert.equal(revised.sequence, 2);
      assert.deepEqual(originalAfter.data(), originalBefore);
      assert.deepEqual(nextVersion.data().snapshot, {
        serviceSelection: "synthetic-after",
      });
      assert.equal(nextVersion.data().sequence, 2);
    });

    it("rejects a revision based on a superseded version", async () => {
      const created = await createQuote();
      const firstRevision = await store.reviseLineage({
        quoteId: created.quoteId,
        expectedCurrentVersionId: created.versionId,
        snapshot: { revision: 2 },
      });
      assert.equal(firstRevision.outcome, "updated");
      if (firstRevision.outcome !== "updated") return;

      const staleRevision = await store.reviseLineage({
        quoteId: created.quoteId,
        expectedCurrentVersionId: created.versionId,
        snapshot: { revision: "stale" },
      });

      assert.deepEqual(staleRevision, {
        outcome: "stale_version",
        currentVersionId: firstRevision.versionId,
      });
      const versions = await db
        .collection("shipmentQuotes")
        .doc(created.quoteId)
        .collection("versions")
        .get();
      assert.equal(versions.size, 2);
    });

    it("does not revise a lineage once its accepted link exists", async () => {
      const created = await createQuote();
      await db.collection("shipmentQuotes").doc(created.quoteId).update({
        acceptedVersionId: created.versionId,
        bookingId: "synthetic-booking",
      });

      const result = await store.reviseLineage({
        quoteId: created.quoteId,
        expectedCurrentVersionId: created.versionId,
        snapshot: { revision: "must-not-be-written" },
      });

      assert.deepEqual(result, { outcome: "already_accepted" });
      const versions = await db
        .collection("shipmentQuotes")
        .doc(created.quoteId)
        .collection("versions")
        .get();
      assert.equal(versions.size, 1);
    });

    it("serializes concurrent revisions against the same current version", async () => {
      const created = await createQuote();
      const results = await Promise.all([
        store.reviseLineage({
          quoteId: created.quoteId,
          expectedCurrentVersionId: created.versionId,
          snapshot: { contender: "first" },
        }),
        store.reviseLineage({
          quoteId: created.quoteId,
          expectedCurrentVersionId: created.versionId,
          snapshot: { contender: "second" },
        }),
      ]);

      assert.equal(
        results.filter((result) => result.outcome === "updated").length,
        1
      );
      assert.equal(
        results.filter((result) => result.outcome === "stale_version").length,
        1
      );

      const versions = await db
        .collection("shipmentQuotes")
        .doc(created.quoteId)
        .collection("versions")
        .get();
      assert.equal(versions.size, 2);
    });

    it("returns not_found for a missing lineage", async () => {
      const result = await store.reviseLineage({
        quoteId: `missing-${randomUUID()}`,
        expectedCurrentVersionId: "version-1",
        snapshot: { test: true },
      });

      assert.deepEqual(result, { outcome: "not_found" });
    });

    it("rejects an empty booking-party UID or a non-map snapshot", async () => {
      await assert.rejects(
        store.createLineage(" ", { description: "Invalid owner" }),
        /booking-party UID is required/
      );
      await assert.rejects(
        store.createLineage("customer-1", null),
        /quote snapshot must be a map/
      );
      await assert.rejects(
        store.createLineage("customer-1", new Date()),
        /quote snapshot must be a plain map/
      );
    });
  }
);
