import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import { createCommercialPricingStore } from "../lib/server/commercial-pricing-store-core.ts";

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

const validConfiguration = {
  configurationName: "Synthetic commercial pricing configuration",
  notes: "Test fixture only; not an approved price or rate.",
  configuration: {
    exampleSetting: "opaque-value",
    exampleOptions: ["option-one", "option-two"],
    exampleMetadata: {
      enabled: true,
      description: "Synthetic nested configuration",
    },
  },
};

describe(
  "commercial pricing definition Firestore store",
  { skip: !emulatorAvailable },
  () => {
    let app;
    let db;
    let store;
    const definitionIds = new Set();

    before(() => {
      app = initializeApp(
        { projectId: "demo-verilyft-commercial-pricing" },
        `commercial-pricing-tests-${randomUUID()}`
      );

      db = getFirestore(app);
      store = createCommercialPricingStore({
        db,
        serverTimestamp: () => FieldValue.serverTimestamp(),
      });
    });

    after(async () => {
      for (const definitionId of definitionIds) {
        const definitionRef = db
          .collection("commercialPricingDefinitions")
          .doc(definitionId);

        const versions = await definitionRef
          .collection("versions")
          .listDocuments();

        await Promise.all(versions.map((version) => version.delete()));
        await definitionRef.delete();
      }

      if (app) await deleteApp(app);
    });

    async function createDefinition(configuration = validConfiguration) {
      const created = await store.createDefinition(
        `actor-${randomUUID()}`,
        configuration
      );

      definitionIds.add(created.definitionId);
      return created;
    }

    it("creates a definition lineage and first version atomically", async () => {
      const actorUid = `actor-${randomUUID()}`;
      const created = await store.createDefinition(
        actorUid,
        validConfiguration
      );

      definitionIds.add(created.definitionId);

      const definitionRef = db
        .collection("commercialPricingDefinitions")
        .doc(created.definitionId);

      const versionRef = definitionRef
        .collection("versions")
        .doc(created.versionId);

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
      assert.equal(version.data().createdBy, actorUid);
      assert.equal(
        version.data().configurationName,
        validConfiguration.configurationName
      );
      assert.deepEqual(
        version.data().configuration,
        validConfiguration.configuration
      );
      assert.equal(typeof lineage.data().createdAt.toDate, "function");
      assert.equal(typeof version.data().createdAt.toDate, "function");
      assert.equal("status" in lineage.data(), false);
      assert.equal("approvedVersionId" in lineage.data(), false);
    });

    it("lists definitions with their current version", async () => {
      const created = await createDefinition();

      const definitions = await store.listDefinitions();

      const found = definitions.find(
        (definition) => definition.definitionId === created.definitionId
      );

      assert.ok(found);
      assert.equal(found.currentVersionId, created.versionId);
      assert.equal(found.currentVersionNumber, 1);
      assert.equal(found.currentVersion.versionNumber, 1);
      assert.equal(
        found.currentVersion.configurationName,
        validConfiguration.configurationName
      );
    });

    it("retrieves a definition with its version history", async () => {
      const created = await createDefinition();

      const definition = await store.getDefinition(created.definitionId);

      assert.ok(definition);
      assert.equal(definition.definitionId, created.definitionId);
      assert.equal(definition.currentVersionId, created.versionId);
      assert.equal(definition.versions.length, 1);
      assert.equal(definition.versions[0].versionId, created.versionId);
      assert.equal(definition.versions[0].versionNumber, 1);
      assert.deepEqual(
        definition.versions[0].configuration,
        validConfiguration.configuration
      );
    });

    it("returns null when retrieving a missing definition", async () => {
      const definition = await store.getDefinition(
        `missing-${randomUUID()}`
      );

      assert.equal(definition, null);
    });

    it("creates a new immutable version and preserves the previous snapshot", async () => {
      const created = await createDefinition();

      const definitionRef = db
        .collection("commercialPricingDefinitions")
        .doc(created.definitionId);

      const firstVersionRef = definitionRef
        .collection("versions")
        .doc(created.versionId);

      const beforeRevision = (await firstVersionRef.get()).data();

      const revisedConfiguration = {
        ...validConfiguration,
        configurationName: "Revised synthetic configuration",
        notes: "Second synthetic version.",
      };

      const revised = await store.reviseDefinition({
        definitionId: created.definitionId,
        expectedCurrentVersionNumber: 1,
        actorUid: "commercial-pricing-test-actor",
        configuration: revisedConfiguration,
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
      assert.deepEqual(previous.data(), beforeRevision);
      assert.equal(next.data().versionNumber, 2);
      assert.equal(
        next.data().configurationName,
        revisedConfiguration.configurationName
      );
      assert.equal(
        next.data().createdBy,
        "commercial-pricing-test-actor"
      );

      const definition = await store.getDefinition(created.definitionId);
      assert.equal(definition.versions.length, 2);
      assert.deepEqual(
        definition.versions.map((version) => version.versionNumber),
        [1, 2]
      );
    });

    it("rejects revisions based on a superseded version number", async () => {
      const created = await createDefinition();

      const first = await store.reviseDefinition({
        definitionId: created.definitionId,
        expectedCurrentVersionNumber: 1,
        actorUid: "actor-one",
        configuration: {
          ...validConfiguration,
          configurationName: "First revision",
        },
      });

      assert.equal(first.outcome, "updated");
      if (first.outcome !== "updated") return;

      const stale = await store.reviseDefinition({
        definitionId: created.definitionId,
        expectedCurrentVersionNumber: 1,
        actorUid: "actor-two",
        configuration: {
          ...validConfiguration,
          configurationName: "Stale revision must not persist",
        },
      });

      assert.deepEqual(stale, {
        outcome: "stale_version",
        currentVersionId: first.versionId,
        currentVersionNumber: 2,
      });

      const versions = await db
        .collection("commercialPricingDefinitions")
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
          configuration: {
            ...validConfiguration,
            configurationName: "Concurrent revision one",
          },
        }),
        store.reviseDefinition({
          definitionId: created.definitionId,
          expectedCurrentVersionNumber: 1,
          actorUid: "actor-two",
          configuration: {
            ...validConfiguration,
            configurationName: "Concurrent revision two",
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
        .collection("commercialPricingDefinitions")
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
        configuration: validConfiguration,
      });

      assert.deepEqual(result, { outcome: "not_found" });
    });

    it("rejects invalid actors, identifiers, and version numbers", async () => {
      await assert.rejects(
        store.createDefinition("", validConfiguration),
        /actor UID/
      );

      await assert.rejects(
        store.getDefinition("../invalid"),
        /definition ID/
      );

      await assert.rejects(
        store.reviseDefinition({
          definitionId: "valid-id",
          expectedCurrentVersionNumber: 0,
          actorUid: "actor-one",
          configuration: validConfiguration,
        }),
        /expected current version number/
      );
    });

    it("rejects invalid or non-Firestore configuration values", async () => {
      await assert.rejects(
        store.createDefinition("actor-one", null),
        /must be a map/
      );

      await assert.rejects(
        store.createDefinition("actor-one", []),
        /must be a map/
      );

      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validConfiguration,
          versionNumber: 99,
        }),
        /reserved version metadata/
      );

      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validConfiguration,
          invalidValue: undefined,
        }),
        /undefined values/
      );

      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validConfiguration,
          invalidValue: Number.POSITIVE_INFINITY,
        }),
        /non-finite numbers/
      );

      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validConfiguration,
          invalidValue: [["nested"]],
        }),
        /nested arrays/
      );

      await assert.rejects(
        store.createDefinition("actor-one", {
          ...validConfiguration,
          invalidValue: new Date(),
        }),
        /plain maps/
      );

      const circularConfiguration = {
        ...validConfiguration,
      };
      circularConfiguration.circular = circularConfiguration;

      await assert.rejects(
        store.createDefinition("actor-one", circularConfiguration),
        /circular references/
      );
    });


    it("requires an active audited assignment for commercial pricing permissions", async () => {
      const uid = `commercial-pricing-${randomUUID()}`;

      for (const permission of [
        "commercial_pricing.view",
        "commercial_pricing.propose",
      ]) {
        const permissionRef = db.collection("staffActionPermissions")
          .doc(uid)
          .collection("permissions")
          .doc(permission);

        assert.equal(await store.hasPermission(uid, permission), false);

        await permissionRef.set({
          active: true,
          assignedBy: "trusted-provisioning-actor",
          reason: `Synthetic ${permission} assignment`,
          assignedAt: FieldValue.serverTimestamp(),
        });

        assert.equal(await store.hasPermission(uid, permission), true);

        await permissionRef.update({ active: false });

        assert.equal(await store.hasPermission(uid, permission), false);
      }
    });

    it("rejects unaudited and invalid commercial pricing permissions", async () => {
      const uid = `commercial-pricing-${randomUUID()}`;

      const permissionRef = db.collection("staffActionPermissions")
        .doc(uid)
        .collection("permissions")
        .doc("commercial_pricing.propose");

      await permissionRef.set({
        active: true,
        assignedBy: "trusted-provisioning-actor",
        assignedAt: FieldValue.serverTimestamp(),
      });

      assert.equal(
        await store.hasPermission(uid, "commercial_pricing.propose"),
        false
      );

      await assert.rejects(
        store.hasPermission(uid, "operational_cost_definition.approve"),
        /Unsupported commercial pricing permission/
      );
    });
  }
);
