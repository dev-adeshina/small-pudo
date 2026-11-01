import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import { createShipmentBookingDraftStore } from "../lib/server/shipment-booking-draft-store-core.ts";
import { updateDraftOnlyWhileEditable } from "../lib/server/shipment-booking-drafts.ts";

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const validDraft = {
  origin: "Lagos",
  destination: "Abuja",
  parcelDescription: "Documents",
};

describe(
  "shipment booking draft Firestore store",
  { skip: !emulatorAvailable },
  () => {
    let app;
    let db;
    let store;
    const customerUids = new Set();

    before(() => {
      app = initializeApp(
        { projectId: process.env.GCLOUD_PROJECT || "demo-verilyft-shipment-draft-store" },
        `shipment-draft-store-tests-${randomUUID()}`
      );
      db = getFirestore(app);
      store = createShipmentBookingDraftStore({
        db,
        serverTimestamp: () => FieldValue.serverTimestamp(),
        updateDraftOnlyWhileEditable,
      });
    });

    after(async () => {
      for (const customerUid of customerUids) {
        const drafts = db
          .collection("users")
          .doc(customerUid)
          .collection("shipmentBookingDrafts");
        const documents = await drafts.listDocuments();
        await Promise.all(documents.map((document) => document.delete()));
      }

      if (app) await deleteApp(app);
    });

    function customerUid() {
      const uid = `test-${randomUUID()}`;
      customerUids.add(uid);
      return uid;
    }

    function pause(milliseconds = 25) {
      return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }

    it("creates a draft under the correct customer with server timestamps", async () => {
      const uid = customerUid();
      const created = await store.createDraft(uid, validDraft);
      const reference = db
        .collection("users")
        .doc(uid)
        .collection("shipmentBookingDrafts")
        .doc(created.id);
      const snapshot = await reference.get();
      const data = snapshot.data();

      assert.equal(snapshot.exists, true);
      assert.equal(data.bookingPartyUid, uid);
      assert.equal(data.status, "draft");
      assert.equal(data.origin, validDraft.origin);
      assert.equal(data.destination, validDraft.destination);
      assert.equal(data.parcelDescription, validDraft.parcelDescription);
      assert.equal(typeof data.createdAt.toDate, "function");
      assert.equal(typeof data.updatedAt.toDate, "function");
    });

    it("lists only the requested customer's drafts", async () => {
      const firstCustomer = customerUid();
      const secondCustomer = customerUid();

      await store.createDraft(firstCustomer, validDraft);
      await store.createDraft(secondCustomer, {
        ...validDraft,
        destination: "Ibadan",
      });

      const firstCustomerDrafts = await store.listDrafts(firstCustomer);

      assert.equal(firstCustomerDrafts.length, 1);
      assert.equal(firstCustomerDrafts[0].destination, "Abuja");
    });

    it("does not update a draft stored under another customer's UID", async () => {
      const ownerUid = customerUid();
      const otherUid = customerUid();
      const created = await store.createDraft(ownerUid, validDraft);

      const updated = await store.updateDraft(otherUid, created.id, {
        ...validDraft,
        destination: "Ibadan",
      });
      const ownerDrafts = await store.listDrafts(ownerUid);

      assert.equal(updated, false);
      assert.equal(ownerDrafts.length, 1);
      assert.equal(ownerDrafts[0].destination, "Abuja");
    });

    it("returns timestamps as ISO strings", async () => {
      const uid = customerUid();
      await store.createDraft(uid, validDraft);

      const [draft] = await store.listDrafts(uid);

      assert.match(draft.createdAt, /^\d{4}-\d{2}-\d{2}T/);
      assert.match(draft.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
      assert.equal(Number.isNaN(Date.parse(draft.createdAt)), false);
      assert.equal(Number.isNaN(Date.parse(draft.updatedAt)), false);
    });

    it("orders drafts by most recently updated first", async () => {
      const uid = customerUid();
      const first = await store.createDraft(uid, validDraft);
      await pause();
      const second = await store.createDraft(uid, {
        ...validDraft,
        destination: "Ibadan",
      });
      await pause();
      const third = await store.createDraft(uid, {
        ...validDraft,
        destination: "Kano",
      });
      await pause();

      const updated = await store.updateDraft(uid, first.id, {
        ...validDraft,
        destination: "Port Harcourt",
      });

      assert.equal(updated, true);
      const drafts = await store.listDrafts(uid);

      assert.deepEqual(
        drafts.map((draft) => draft.id),
        [first.id, third.id, second.id]
      );
    });

    it("returns no more than the latest 50 drafts", async () => {
      const uid = customerUid();

      let oldestDraftId;
      let newestDraftId;

      for (let index = 0; index < 51; index += 1) {
        const created = await store.createDraft(uid, {
          ...validDraft,
          parcelDescription: `Parcel ${index}`,
        });

        if (index === 0) oldestDraftId = created.id;
        if (index === 50) newestDraftId = created.id;
      }

      const drafts = await store.listDrafts(uid);
      const returnedIds = drafts.map((draft) => draft.id);

      assert.equal(drafts.length, 50);
      assert.equal(returnedIds.includes(oldestDraftId), false);
      assert.equal(returnedIds.includes(newestDraftId), true);
    });

    it("updates editable fields while preserving creation and ownership data", async () => {
      const uid = customerUid();
      const created = await store.createDraft(uid, validDraft);
      const reference = db
        .collection("users")
        .doc(uid)
        .collection("shipmentBookingDrafts")
        .doc(created.id);
      const before = (await reference.get()).data();

      await pause();
      const updated = await store.updateDraft(uid, created.id, {
        ...validDraft,
        destination: "Ibadan",
        parcelDescription: "Two shopper parcels",
      });
      const afterSnapshot = await reference.get();
      const afterData = afterSnapshot.data();

      assert.equal(updated, true);
      assert.equal(afterData.destination, "Ibadan");
      assert.equal(afterData.parcelDescription, "Two shopper parcels");
      assert.equal(afterData.bookingPartyUid, uid);
      assert.equal(afterData.status, "draft");
      assert.equal(
        afterData.createdAt.toMillis(),
        before.createdAt.toMillis()
      );
      assert.ok(
        afterData.updatedAt.toMillis() > before.updatedAt.toMillis()
      );
    });

    it("refuses to update a missing draft", async () => {
      const uid = customerUid();

      const updated = await store.updateDraft(uid, "missing-draft", validDraft);

      assert.equal(updated, false);
    });

    it("refuses to update a draft that is no longer editable", async () => {
      const uid = customerUid();
      const created = await store.createDraft(uid, validDraft);
      const reference = db
        .collection("users")
        .doc(uid)
        .collection("shipmentBookingDrafts")
        .doc(created.id);

      await reference.update({ status: "cancelled" });
      const updated = await store.updateDraft(uid, created.id, {
        ...validDraft,
        destination: "Ibadan",
      });
      const afterSnapshot = await reference.get();

      assert.equal(updated, false);
      assert.equal(afterSnapshot.data().status, "cancelled");
      assert.equal(afterSnapshot.data().destination, "Abuja");
    });
  }
);
