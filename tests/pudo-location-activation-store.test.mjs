import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import { createPudoLocationStore } from "../lib/server/pudo-location-store-core.ts";
import {
  createPudoLocationVerificationStore,
} from "../lib/server/pudo-location-verification-store-core.ts";
import {
  createPudoLocationActivationStore,
} from "../lib/server/pudo-location-activation-store-core.ts";
import {
  createStaffManagementStore,
} from "../lib/server/staff-management-core.ts";

const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

describe("PUDO location activation store", { skip: !enabled }, () => {
  const prefix = randomUUID();
  const adminUid = `pudo-activation-admin-${prefix}`;
  const registerUid = `pudo-activation-register-${prefix}`;
  const verifierUid = `pudo-activation-verifier-${prefix}`;
  const activatorUid = `pudo-activator-${prefix}`;
  const deniedUid = `pudo-activation-denied-${prefix}`;
  const locationIds = [];

  let app;
  let db;
  let registrationStore;
  let verificationStore;
  let activationStore;
  let staffStore;

  after(async () => {
    for (const locationId of locationIds) {
      const candidateRef = db.collection("pudoLocations").doc(locationId);
      const candidateEvents = await candidateRef.collection("auditEvents").listDocuments();
      await Promise.all(candidateEvents.map((ref) => ref.delete()));
      await candidateRef.delete();

      const verificationRef = db.collection("pudoLocationVerifications").doc(locationId);

      for (const collectionName of ["inspectionRecords", "auditEvents"]) {
        const documents = await verificationRef.collection(collectionName).listDocuments();
        await Promise.all(documents.map((ref) => ref.delete()));
      }

      await verificationRef.delete();
      await db.collection("pudoLocationActivations").doc(locationId).delete();
    }

    for (const uid of [registerUid, verifierUid, activatorUid, deniedUid]) {
      const permissions = await db
        .collection("staffActionPermissions")
        .doc(uid)
        .collection("permissions")
        .listDocuments();

      await Promise.all(permissions.map((ref) => ref.delete()));
      await db.collection("staffActionPermissions").doc(uid).delete();
      await db.collection("staffDirectory").doc(uid).delete();

      const grants = await db
        .collection("staffActionPermissionGrants")
        .where("targetUid", "==", uid)
        .get();

      await Promise.all(grants.docs.map((document) => document.ref.delete()));
    }

    if (app) await deleteApp(app);
  });

  before(async () => {
    app = initializeApp(
      { projectId: "demo-verilyft-staff-management" },
      `pudo-activation-${prefix}`,
    );

    db = getFirestore(app);

    registrationStore = createPudoLocationStore({
      db,
      serverTimestamp: () => FieldValue.serverTimestamp(),
    });

    verificationStore = createPudoLocationVerificationStore({
      db,
      serverTimestamp: () => FieldValue.serverTimestamp(),
    });

    activationStore = createPudoLocationActivationStore({
      db,
      serverTimestamp: () => FieldValue.serverTimestamp(),
    });

    staffStore = createStaffManagementStore({
      db,
      serverTimestamp: () => FieldValue.serverTimestamp(),
    });

    for (const uid of [registerUid, verifierUid, activatorUid, deniedUid]) {
      await db.collection("staffDirectory").doc(uid).set({
        email: `${uid}@example.test`,
        status: "active",
      });
    }

    await staffStore.setPermission({
      targetUid: registerUid,
      actorUid: adminUid,
      permissionId: "pudo_location.register",
      status: "active",
      reason: "Activation test registration access",
    });

    await staffStore.setPermission({
      targetUid: verifierUid,
      actorUid: adminUid,
      permissionId: "pudo_location.verify",
      status: "active",
      reason: "Activation test verification access",
    });

    await staffStore.setPermission({
      targetUid: activatorUid,
      actorUid: adminUid,
      permissionId: "pudo_location.activate",
      status: "active",
      reason: "Activation test activation access",
    });

    await staffStore.setPermission({
      targetUid: deniedUid,
      actorUid: adminUid,
      permissionId: "pudo_location.register",
      status: "active",
      reason: "Registration does not grant activation",
    });
  });

  async function createCandidate(name = "Activation test PUDO") {
    const created = await registrationStore.saveCandidate(registerUid, {
      name,
      address: "12 Example Street, Test District",
      registrationNote: "Synthetic activation test",
      geo: {
        latitude: 6.5244,
        longitude: 3.3792,
        captureMethod: "manual",
      },
    });

    locationIds.push(created.locationId);

    await registrationStore.submitCandidate(registerUid, created.locationId);
    return created.locationId;
  }

  async function approveCandidate(locationId) {
    await verificationStore.recordInspection(verifierUid, locationId, {
      inspectedSite: "12 Example Street, Test District",
      inspectedAt: "2026-11-12T10:00:00.000Z",
      findings: "Physical premises inspected in person.",
      discrepancies: [],
      unresolvedDiscrepancies: [],
      limitations: "",
      evidenceReferences: [{
        label: "Inspection record",
        reference: "synthetic-activation-test",
      }],
      evidenceAssessment: "sufficient",
      assessmentNotes: "Evidence supports the inspection findings.",
    });

    await verificationStore.recordDecision(
      verifierUid,
      locationId,
      "approve_to_activate",
      "Verification requirements satisfied.",
    );
  }

  it("requires the separate activation permission", async () => {
    const locationId = await createCandidate();

    await assert.rejects(
      activationStore.activateLocation(verifierUid, locationId),
      /not authorised to activate PUDO locations/,
    );

    await assert.rejects(
      activationStore.activateLocation(deniedUid, locationId),
      /not authorised to activate PUDO locations/,
    );
  });

  it("rejects activation without verification approval", async () => {
    const locationId = await createCandidate();

    await assert.rejects(
      activationStore.activateLocation(activatorUid, locationId),
      /verification approval is required/,
    );

    const candidate = await db.collection("pudoLocations").doc(locationId).get();
    assert.equal(candidate.data().lifecycle, "submitted");

    const activation = await db.collection("pudoLocationActivations").doc(locationId).get();
    assert.equal(activation.exists, false);
  });

  it("activates an approved candidate with attributable audit evidence", async () => {
    const locationId = await createCandidate();
    await approveCandidate(locationId);

    const result = await activationStore.activateLocation(
      activatorUid,
      locationId,
    );

    assert.deepEqual(result, {
      locationId,
      lifecycle: "active",
      activatedBy: activatorUid,
    });

    const candidate = await db.collection("pudoLocations").doc(locationId).get();
    assert.equal(candidate.data().lifecycle, "active");
    assert.equal(candidate.data().activatedBy, activatorUid);
    assert.ok(candidate.data().activatedAt);

    const activation = await db.collection("pudoLocationActivations").doc(locationId).get();
    assert.equal(activation.exists, true);
    assert.equal(activation.data().status, "active");
    assert.equal(activation.data().activatedBy, activatorUid);
    assert.ok(activation.data().activatedAt);
    assert.equal(activation.data().verificationStatus, "approved_to_activate");

    const events = await db
      .collection("pudoLocations")
      .doc(locationId)
      .collection("auditEvents")
      .get();

    const event = events.docs.map((doc) => doc.data()).find(
      (item) => item.action === "activated",
    );

    assert.ok(event);
    assert.equal(event.actorUid, activatorUid);
    assert.equal(event.locationId, locationId);
    assert.equal(event.verificationStatus, "approved_to_activate");

    await assert.rejects(
      activationStore.activateLocation(activatorUid, locationId),
      /already been activated/,
    );
  });

  it("rejects activation of a draft candidate", async () => {
    const created = await registrationStore.saveCandidate(registerUid, {
      name: "Draft candidate",
      address: "12 Example Street, Test District",
    });

    locationIds.push(created.locationId);

    await assert.rejects(
      activationStore.activateLocation(activatorUid, created.locationId),
      /Only submitted PUDO candidates/,
    );
  });
});
