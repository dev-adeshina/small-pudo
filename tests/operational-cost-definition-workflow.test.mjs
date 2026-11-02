import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import { createOperationalCostDefinitionStore } from "../lib/server/operational-cost-definition-store-core.ts";
import { createOperationalCostDefinitionWorkflowStore } from "../lib/server/operational-cost-definition-workflow-store-core.ts";

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const permissions = [
  "operational_cost_definition.propose",
  "operational_cost_definition.validate",
  "operational_cost_definition.finance_review",
  "operational_cost_definition.approve",
];
const definition = {
  activityName: "Synthetic workflow activity",
  inputs: [{ key: "parcelCount", label: "Parcel count", valueType: "number", required: true }],
};

describe("operational cost definition approval workflow", { skip: !emulatorAvailable }, () => {
  let app;
  let db;
  let definitions;
  let workflow;
  const definitionIds = new Set();

  before(() => {
    app = initializeApp(
      { projectId: "demo-verilyft-operational-cost-workflow" },
      `operational-cost-workflow-${randomUUID()}`
    );
    db = getFirestore(app);
    definitions = createOperationalCostDefinitionStore({
      db,
      serverTimestamp: () => FieldValue.serverTimestamp(),
    });
    workflow = createOperationalCostDefinitionWorkflowStore({
      db,
      serverTimestamp: () => FieldValue.serverTimestamp(),
    });
  });

  after(async () => {
    for (const id of definitionIds) {
      const ref = db.collection("operationalCostDefinitions").doc(id);
      const versions = await ref.collection("versions").listDocuments();
      for (const version of versions) {
        const approval = version.collection("approval").doc("workflow");
        const events = await approval.collection("events").listDocuments();
        await Promise.all(events.map((event) => event.delete()));
        await approval.delete();
        await version.delete();
      }
      await ref.delete();
    }
    if (app) await deleteApp(app);
  });

  async function grant(uid, permission) {
    await db.collection("staffActionPermissions").doc(uid)
      .collection("permissions").doc(permission).set({
        active: true,
        assignedBy: "trusted-provisioning-actor",
        reason: "Synthetic emulator test assignment",
        assignedAt: FieldValue.serverTimestamp(),
      });
  }

  async function createDraft() {
    const proposer = `proposer-${randomUUID()}`;
    const created = await definitions.createDefinition(proposer, definition);
    definitionIds.add(created.definitionId);
    await grant(proposer, permissions[0]);
    return { ...created, proposer };
  }

  it("enforces four distinct actors and preserves the approved version and event history", async () => {
    const draft = await createDraft();
    const operations = `operations-${randomUUID()}`;
    const finance = `finance-${randomUUID()}`;
    const approver = `approver-${randomUUID()}`;
    await grant(operations, permissions[1]);
    await grant(finance, permissions[2]);
    await grant(approver, permissions[3]);

    await assert.rejects(
      workflow.transition({
        definitionId: draft.definitionId,
        versionId: draft.versionId,
        actorUid: draft.proposer,
        action: "validate",
      }),
      /required action permission/
    );

    const submitted = await workflow.transition({
      definitionId: draft.definitionId,
      versionId: draft.versionId,
      actorUid: draft.proposer,
      action: "submit",
    });
    assert.deepEqual(submitted, { outcome: "transitioned", state: "pending_operations_validation" });

    await assert.rejects(
      workflow.transition({
        definitionId: draft.definitionId,
        versionId: draft.versionId,
        actorUid: draft.proposer,
        action: "request_changes",
        reason: "Self-review is not permitted",
      }),
      /proposer cannot validate/
    );

    await workflow.transition({
      definitionId: draft.definitionId,
      versionId: draft.versionId,
      actorUid: operations,
      action: "validate",
    });
    await assert.rejects(
      workflow.transition({
        definitionId: draft.definitionId,
        versionId: draft.versionId,
        actorUid: operations,
        action: "finance_review",
      }),
      /required action permission|distinct reviewer/
    );

    await workflow.transition({
      definitionId: draft.definitionId,
      versionId: draft.versionId,
      actorUid: finance,
      action: "finance_review",
    });
    await assert.rejects(
      workflow.transition({
        definitionId: draft.definitionId,
        versionId: draft.versionId,
        actorUid: finance,
        action: "approve",
      }),
      /required action permission|independent authorized approver/
    );

    await workflow.transition({
      definitionId: draft.definitionId,
      versionId: draft.versionId,
      actorUid: approver,
      action: "approve",
    });

    const [lineage, workflowSnapshot, events] = await Promise.all([
      db.collection("operationalCostDefinitions").doc(draft.definitionId).get(),
      db.collection("operationalCostDefinitions").doc(draft.definitionId)
        .collection("versions").doc(draft.versionId)
        .collection("approval").doc("workflow").get(),
      db.collection("operationalCostDefinitions").doc(draft.definitionId)
        .collection("versions").doc(draft.versionId)
        .collection("approval").doc("workflow").collection("events").get(),
    ]);
    assert.equal(lineage.data().approvedVersionId, draft.versionId);
    assert.equal(lineage.data().approvedVersionNumber, 1);
    assert.equal(workflowSnapshot.data().state, "approved");
    assert.equal(workflowSnapshot.data().proposerUid, draft.proposer);
    assert.equal(workflowSnapshot.data().operationsValidatorUid, operations);
    assert.equal(workflowSnapshot.data().financeReviewerUid, finance);
    assert.equal(workflowSnapshot.data().independentApproverUid, approver);
    assert.equal(events.size, 5);

    await assert.rejects(
      workflow.transition({
        definitionId: draft.definitionId,
        versionId: draft.versionId,
        actorUid: approver,
        action: "approve",
      }),
      /current workflow state/
    );
  });

  it("requires a new version after changes are requested before resubmission", async () => {
    const draft = await createDraft();
    const operations = `operations-${randomUUID()}`;
    await grant(operations, permissions[1]);
    await workflow.transition({
      definitionId: draft.definitionId,
      versionId: draft.versionId,
      actorUid: draft.proposer,
      action: "submit",
    });
    await workflow.transition({
      definitionId: draft.definitionId,
      versionId: draft.versionId,
      actorUid: operations,
      action: "request_changes",
      reason: "Please revise the activity inputs",
    });

    const revised = await definitions.reviseDefinition({
      definitionId: draft.definitionId,
      expectedCurrentVersionNumber: 1,
      actorUid: draft.proposer,
      definition: { ...definition, activityName: "Revised synthetic workflow activity" },
    });
    assert.equal(revised.outcome, "updated");
    if (revised.outcome !== "updated") return;

    const resubmitted = await workflow.transition({
      definitionId: draft.definitionId,
      versionId: revised.versionId,
      actorUid: draft.proposer,
      action: "submit",
    });
    assert.deepEqual(resubmitted, { outcome: "transitioned", state: "pending_operations_validation" });

    const oldWorkflow = await db.collection("operationalCostDefinitions").doc(draft.definitionId)
      .collection("versions").doc(draft.versionId)
      .collection("approval").doc("workflow").get();
    assert.equal(oldWorkflow.data().state, "changes_requested");
  });

  it("does not let an Admin claim or adminAccess record replace an action permission", async () => {
    const draft = await createDraft();
    const adminUid = `admin-${randomUUID()}`;
    await db.collection("adminAccess").doc(adminUid).set({ active: true });
    await assert.rejects(
      workflow.transition({
        definitionId: draft.definitionId,
        versionId: draft.versionId,
        actorUid: adminUid,
        action: "submit",
      }),
      /required action permission/
    );
  });

  it("serializes concurrent attempts so a workflow stage advances only once", async () => {
    const draft = await createDraft();
    const operations = `operations-${randomUUID()}`;
    await grant(operations, permissions[1]);
    await workflow.transition({
      definitionId: draft.definitionId,
      versionId: draft.versionId,
      actorUid: draft.proposer,
      action: "submit",
    });
    const results = await Promise.allSettled([
      workflow.transition({
        definitionId: draft.definitionId,
        versionId: draft.versionId,
        actorUid: operations,
        action: "validate",
      }),
      workflow.transition({
        definitionId: draft.definitionId,
        versionId: draft.versionId,
        actorUid: operations,
        action: "validate",
      }),
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  });
});
