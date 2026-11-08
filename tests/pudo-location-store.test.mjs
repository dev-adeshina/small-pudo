import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { createPudoLocationStore } from "../lib/server/pudo-location-store-core.ts";
import { createStaffManagementStore } from "../lib/server/staff-management-core.ts";

const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

describe("PUDO candidate registration store", { skip: !enabled }, () => {
  const prefix = randomUUID();
  const actor = `pudo-admin-${prefix}`;
  const staffUid = `pudo-staff-${prefix}`;
  const deniedUid = `pudo-denied-${prefix}`;
  const locationIds = [];

  let app;
  let db;
  let store;
  let staffStore;

  before(async () => {
    app = initializeApp(
      { projectId: "demo-verilyft-staff-management" },
      `pudo-location-${prefix}`,
    );

    db = getFirestore(app);

    store = createPudoLocationStore({
      db,
      serverTimestamp: () => FieldValue.serverTimestamp(),
    });

    staffStore = createStaffManagementStore({
      db,
      serverTimestamp: () => FieldValue.serverTimestamp(),
    });

    await db.collection("staffDirectory").doc(staffUid).set({
      email: `${staffUid}@example.test`,
      status: "active",
    });

    await staffStore.setPermission({
      targetUid: staffUid,
      actorUid: actor,
      permissionId: "pudo_location.register",
      status: "active",
      reason: "PUDO candidate registration tests",
    });
  });

  after(async () => {
    for (const locationId of locationIds) {
      const ref = db.collection("pudoLocations").doc(locationId);
      const events = await ref.collection("auditEvents").listDocuments();
      await Promise.all(events.map((event) => event.delete()));
      await ref.delete();
    }

    const permissions = await db
      .collection("staffActionPermissions")
      .doc(staffUid)
      .collection("permissions")
      .listDocuments();

    await Promise.all(permissions.map((ref) => ref.delete()));

    await db.collection("staffActionPermissions").doc(staffUid).delete();
    await db.collection("staffDirectory").doc(staffUid).delete();

    const grants = await db
      .collection("staffActionPermissionGrants")
      .where("targetUid", "==", staffUid)
      .get();

    await Promise.all(grants.docs.map((document) => document.ref.delete()));

    if (app) await deleteApp(app);
  });

  it("denies registration access without the required activity permission", async () => {
    await assert.rejects(
      store.listCandidates(deniedUid),
      /not authorised/,
    );
  });

  it("creates, reopens, updates and submits a candidate with an append-only audit trail", async () => {
    const created = await store.saveCandidate(staffUid, {
      name: "Test collection point",
      address: "12 Example Street, Test District",
      registrationNote: "Synthetic registration test",
      geo: {
        latitude: 6.5244,
        longitude: 3.3792,
        captureMethod: "manual",
      },
    });

    locationIds.push(created.locationId);

    assert.equal(created.lifecycle, "draft");

    const reopened = await store.getCandidate(staffUid, created.locationId);

    assert.equal(reopened.name, "Test collection point");
    assert.equal(reopened.lifecycle, "draft");
    assert.equal(reopened.geo.latitude, 6.5244);
    assert.equal(reopened.geo.longitude, 3.3792);
    assert.equal(reopened.geo.captureMethod, "manual");

    // An ordinary text edit must preserve previously captured coordinates.
    await store.saveCandidate(
      staffUid,
      {
        name: "Updated collection point",
        address: "14 Example Street, Test District",
        registrationNote: "Updated registration note",
      },
      created.locationId,
    );

    const textUpdated = await store.getCandidate(staffUid, created.locationId);
    assert.equal(textUpdated.geo.latitude, 6.5244);
    assert.equal(textUpdated.geo.longitude, 3.3792);
    assert.equal(textUpdated.geo.captureMethod, "manual");

    // Explicitly clearing coordinates must remove previously captured coordinates.
    await store.saveCandidate(
      staffUid,
      {
        geo: null,
      },
      created.locationId,
    );

    const cleared = await store.getCandidate(
      staffUid,
      created.locationId,
    );

    assert.equal(cleared.geo, null);

    // Coordinates can subsequently be recorded again before submission.
    await store.saveCandidate(
      staffUid,
      {
        geo: {
          latitude: 6.5244,
          longitude: 3.3792,
          captureMethod: "manual",
        },
      },
      created.locationId,
    );

    const restored = await store.getCandidate(
      staffUid,
      created.locationId,
    );

    assert.equal(restored.geo.latitude, 6.5244);
    assert.equal(restored.geo.longitude, 3.3792);

    const updated = await store.getCandidate(staffUid, created.locationId);

    assert.equal(updated.name, "Updated collection point");
    assert.equal(updated.geo.latitude, 6.5244);
    assert.equal(updated.geo.longitude, 3.3792);
    assert.equal(updated.geo.captureMethod, "manual");

    const submitted = await store.submitCandidate(
      staffUid,
      created.locationId,
    );

    assert.deepEqual(submitted, {
      locationId: created.locationId,
      lifecycle: "submitted",
    });

    const finalCandidate = await store.getCandidate(
      staffUid,
      created.locationId,
    );

    assert.equal(finalCandidate.lifecycle, "submitted");
    assert.equal(finalCandidate.submittedBy, staffUid);
    assert.ok(finalCandidate.submittedAt);

    // Submission must not be repeatable or reversible through ordinary saves.
    await assert.rejects(
      store.submitCandidate(staffUid, created.locationId),
      /Only a draft candidate can be submitted/,
    );

    await assert.rejects(
      store.saveCandidate(
        staffUid,
        { name: "Attempted post-submission edit" },
        created.locationId,
      ),
      /Submitted PUDO candidates cannot be edited/,
    );

    const events = await db
      .collection("pudoLocations")
      .doc(created.locationId)
      .collection("auditEvents")
      .orderBy("timestamp")
      .get();

    assert.equal(events.size, 5);
    assert.deepEqual(
      events.docs.map((document) => document.data().action),
      ["created", "updated", "updated", "updated", "submitted"],
    );
    assert.ok(events.docs.every(
      (document) => document.data().actorUid === staffUid,
    ));
  });

  it("rejects incomplete submissions and invalid coordinates", async () => {
    const created = await store.saveCandidate(staffUid, {
      name: "Incomplete candidate",
    });

    locationIds.push(created.locationId);

    await assert.rejects(
      store.submitCandidate(staffUid, created.locationId),
      /A physical address is required/,
    );

    await assert.rejects(
      store.saveCandidate(staffUid, {
        name: "Invalid coordinates",
        geo: {
          latitude: 91,
          longitude: 3.3,
          captureMethod: "manual",
        },
      }),
      /Latitude must be between/,
    );

    await assert.rejects(
      store.saveCandidate(staffUid, {
        name: "Unsupported field",
        unsupported: true,
      }),
      /unsupported field/,
    );
  });
});