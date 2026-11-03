import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import { createOperationalCostDefinitionStore } from "../lib/server/operational-cost-definition-store-core.ts";

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

const validDefinition = {
  activityCode: "ACT-02",
  activityName: "Synthetic parcel handling",
  applicability: "general",
  costComponents: [{ key: "handling", label: "Synthetic handling", amount: "1250.50", currencyCode: "NGN", basis: "Synthetic unit", evidenceDescription: "Synthetic invoice reference" }],
  activityDescription: "Test-only activity description",
  inputs: [
    {
      key: "parcelCount",
      label: "Parcel count",
      description: "Synthetic test input",
      valueType: "number",
      required: true,
      source: "Test fixture",
      unit: "test unit",
      precision: 0,
    },
    {
      key: "requiresSpecialHandling",
      label: "Special handling required",
      valueType: "boolean",
      required: false,
    },
  ],
};

describe(
  "operational cost definition Firestore store",
  { skip: !emulatorAvailable },
  () => {
    let app;
    let db;
    let store;
    const definitionIds = new Set();

    before(() => {
      app = initializeApp(
        { projectId: "demo-verilyft-operational-cost-definitions" },
        `operational-cost-definition-tests-${randomUUID()}`
      );
      db = getFirestore(app);
      store = createOperationalCostDefinitionStore({
        db,
        serverTimestamp: () => FieldValue.serverTimestamp(),
      });
    });

    after(async () => {
      for (const definitionId of definitionIds) {
        const definitionRef = db
          .collection("operationalCostDefinitions")
          .doc(definitionId);
        const versions = await definitionRef.collection("versions").listDocuments();
        await Promise.all(versions.map((version) => version.delete()));
        await definitionRef.delete();
      }

      if (app) await deleteApp(app);
    });

    async function createDefinition(definition = validDefinition) {
      const created = await store.createDefinition(
        `actor-${randomUUID()}`,
        definition
      );
      definitionIds.add(created.definitionId);
      return created;
    }

    it("creates a definition lineage and first version atomically", async () => {
      const actorUid = `actor-${randomUUID()}`;
      const created = await store.createDefinition(actorUid, validDefinition);
      definitionIds.add(created.definitionId);

      const definitionRef = db
        .collection("operationalCostDefinitions")
        .doc(created.definitionId);
      const versionRef = definitionRef.collection("versions").doc(created.versionId);
      const [lineage, version] = await Promise.all([
        definitionRef.get(),
        versionRef.get(),
      ]);

      assert.equal(lineage.exists, true);
      assert.equal(version.exists, true);
      assert.equal(lineage.data().currentVersionId, created.versionId);
      assert.equal(lineage.data().currentVersionNumber, 1);
      assert.equal(lineage.data().createdBy, actorUid);
      assert.equal(lineage.data().updatedBy, actorUid);
      assert.equal(version.data().versionNumber, 1);
      assert.equal(version.data().activityCode, validDefinition.activityCode);
      assert.equal(version.data().applicability, "general");
      assert.deepEqual(version.data().costComponents, validDefinition.costComponents);
      assert.equal(version.data().activityName, validDefinition.activityName);
      assert.deepEqual(version.data().inputs, validDefinition.inputs);
      assert.equal(version.data().createdBy, actorUid);
      assert.equal(typeof lineage.data().createdAt.toDate, "function");
      assert.equal(typeof version.data().createdAt.toDate, "function");
      assert.equal("status" in lineage.data(), false);
    });

    it("creates a new immutable version and preserves the previous snapshot", async () => {
      const created = await createDefinition();
      const definitionRef = db
        .collection("operationalCostDefinitions")
        .doc(created.definitionId);
      const firstVersionRef = definitionRef.collection("versions").doc(created.versionId);
      const before = (await firstVersionRef.get()).data();

      const revised = await store.reviseDefinition({
        definitionId: created.definitionId,
        expectedCurrentVersionNumber: 1,
        actorUid: "operations-test-actor",
        definition: {
          ...validDefinition,
          activityName: "Revised synthetic parcel handling",
        },
      });

      assert.equal(revised.outcome, "updated");
      if (revised.outcome !== "updated") return;

      const [lineage, previous, next] = await Promise.all([
        definitionRef.get(),
        firstVersionRef.get(),
        definitionRef.collection("versions").doc(revised.versionId).get(),
      ]);

      assert.equal(lineage.data().currentVersionId, revised.versionId);
      assert.equal(lineage.data().currentVersionNumber, 2);
      assert.deepEqual(previous.data(), before);
      assert.equal(next.data().activityName, "Revised synthetic parcel handling");
      assert.equal(next.data().versionNumber, 2);
      assert.equal(next.data().createdBy, "operations-test-actor");
    });

    it("rejects revisions based on a superseded version number", async () => {
      const created = await createDefinition();
      const first = await store.reviseDefinition({
        definitionId: created.definitionId,
        expectedCurrentVersionNumber: 1,
        actorUid: "actor-one",
        definition: validDefinition,
      });
      assert.equal(first.outcome, "updated");

      const stale = await store.reviseDefinition({
        definitionId: created.definitionId,
        expectedCurrentVersionNumber: 1,
        actorUid: "actor-two",
        definition: {
          ...validDefinition,
          activityName: "Stale revision must not persist",
        },
      });

      assert.deepEqual(stale, {
        outcome: "stale_version",
        currentVersionId: first.versionId,
        currentVersionNumber: 2,
      });
      const versions = await db
        .collection("operationalCostDefinitions")
        .doc(created.definitionId)
        .collection("versions")
        .get();
      assert.equal(versions.size, 2);
    });

    it("serializes concurrent revisions against the same current version", async () => {
      const created = await createDefinition();
      const results = await Promise.all([
        store.reviseDefinition({
          definitionId: created.definitionId,
          expectedCurrentVersionNumber: 1,
          actorUid: "actor-one",
          definition: {
            ...validDefinition,
            activityName: "Concurrent revision one",
          },
        }),
        store.reviseDefinition({
          definitionId: created.definitionId,
          expectedCurrentVersionNumber: 1,
          actorUid: "actor-two",
          definition: {
            ...validDefinition,
            activityName: "Concurrent revision two",
          },
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
        .collection("operationalCostDefinitions")
        .doc(created.definitionId)
        .collection("versions")
        .get();
      assert.equal(versions.size, 2);
    });

    it("returns not_found when revising a missing definition", async () => {
      const result = await store.reviseDefinition({
        definitionId: `missing-${randomUUID()}`,
        expectedCurrentVersionNumber: 1,
        actorUid: "actor-one",
        definition: validDefinition,
      });

      assert.deepEqual(result, { outcome: "not_found" });
    });

    it("rejects invalid activity and input metadata", async () => {
      await assert.rejects(
        store.createDefinition("", validDefinition),
        /actor UID/
      );
      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validDefinition,
          activityName: " ",
        }),
        /Activity name/
      );
      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validDefinition,
          inputs: [
            validDefinition.inputs[0],
            validDefinition.inputs[0],
          ],
        }),
        /keys must be unique/
      );
      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validDefinition,
          inputs: [{
            key: "invalid key",
            label: "Invalid key",
            valueType: "string",
            required: true,
          }],
        }),
        /stable identifier/
      );
      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validDefinition,
          inputs: [{
            key: "precisionOnText",
            label: "Text input",
            valueType: "string",
            required: true,
            precision: 2,
          }],
        }),
        /only valid for number/
      );
    });

    it("allows incomplete draft cost components but rejects unsafe or malformed monetary values", async () => {
      const draft = {
        ...validDefinition,
        costComponents: [{ key: "handling", label: "Handling" }],
      };
      const created = await createDefinition(draft);
      assert.equal(created.versionNumber, 1);

      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validDefinition,
          costComponents: [{ ...validDefinition.costComponents[0], amount: 12.5 }],
        }),
        /decimal string/
      );
      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validDefinition,
          costComponents: [{ ...validDefinition.costComponents[0], amount: "1e3" }],
        }),
        /decimal string/
      );
      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validDefinition,
          costComponents: [{ key: "handling", label: "Handling", amount: "100.00", basis: "Synthetic unit" }],
        }),
        /currency code/
      );
      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validDefinition,
          costComponents: [{ ...validDefinition.costComponents[0], currencyCode: "ngn" }],
        }),
        /three-letter uppercase code/
      );
      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validDefinition,
          activityCode: "ACT-12",
        }),
        /ACT-01 to ACT-11/
      );
      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validDefinition,
          applicability: "location",
        }),
        /Only general applicability/
      );
    });

    it("lists and retrieves version history only through the server store", async () => {
      const created = await createDefinition();
      const [list, detail] = await Promise.all([
        store.listDefinitions(),
        store.getDefinition(created.definitionId),
      ]);
      assert.ok(list.some((item) => item.definitionId === created.definitionId));
      assert.equal(detail?.definitionId, created.definitionId);
      assert.equal((detail?.versions as Array<Record<string, unknown>>).length, 1);
    });

    it("requires an active audited view permission", async () => {
      const uid = `viewer-${randomUUID()}`;
      assert.equal(await store.hasPermission(uid, "operational_cost_definition.view"), false);
      await db.collection("staffActionPermissions").doc(uid)
        .collection("permissions").doc("operational_cost_definition.view").set({
          active: true,
          assignedBy: "trusted-provisioning-actor",
          reason: "Synthetic view assignment",
          assignedAt: FieldValue.serverTimestamp(),
        });
      assert.equal(await store.hasPermission(uid, "operational_cost_definition.view"), true);
      await db.collection("staffActionPermissions").doc(uid)
        .collection("permissions").doc("operational_cost_definition.view").update({ active: false });
      assert.equal(await store.hasPermission(uid, "operational_cost_definition.view"), false);
    });

    it("rejects invalid definition IDs and expected version numbers", async () => {
      await assert.rejects(
        store.reviseDefinition({
          definitionId: "../invalid",
          expectedCurrentVersionNumber: 1,
          actorUid: "actor-one",
          definition: validDefinition,
        }),
        /valid operational cost definition ID/
      );
      const created = await createDefinition();
      await assert.rejects(
        store.reviseDefinition({
          definitionId: created.definitionId,
          expectedCurrentVersionNumber: 0,
          actorUid: "actor-one",
          definition: validDefinition,
        }),
        /expected current version number/
      );
    });

    it("rejects a lineage that points to a missing current version", async () => {
      const created = await createDefinition();
      await db
        .collection("operationalCostDefinitions")
        .doc(created.definitionId)
        .update({ currentVersionId: "missing-version" });

      await assert.rejects(
        store.reviseDefinition({
          definitionId: created.definitionId,
          expectedCurrentVersionNumber: 1,
          actorUid: "actor-one",
          definition: validDefinition,
        }),
        /missing current version/
      );
    });
  }
);
