import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { createOperationalCostDefinitionStore } from "../lib/server/operational-cost-definition-store-core.ts";
import { createOperationalCostDefinitionWorkflowStore } from "../lib/server/operational-cost-definition-workflow-store-core.ts";

const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const definition = { activityCode: "ACT-02", activityName: "Synthetic workflow activity", applicability: "general", inputs: [{ key: "count", label: "Count", valueType: "number", required: true }], costComponents: [{ key: "handling", label: "Synthetic handling", amount: "100.00", currencyCode: "NGN", basis: "Synthetic unit", evidenceDescription: "Synthetic supporting evidence" }] };
const permissions = ["operational_cost_definition.propose", "operational_cost_definition.validate", "operational_cost_definition.finance_review", "operational_cost_definition.approve"];

describe("operational cost approval workflow", { skip: !enabled }, () => {
  let app, db, definitions, workflow;
  const ids = new Set();
  before(() => {
    app = initializeApp({ projectId: "demo-verilyft-operational-cost-workflow" }, `workflow-${randomUUID()}`);
    db = getFirestore(app);
    definitions = createOperationalCostDefinitionStore({ db, serverTimestamp: () => FieldValue.serverTimestamp() });
    workflow = createOperationalCostDefinitionWorkflowStore({ db, serverTimestamp: () => FieldValue.serverTimestamp() });
  });
  after(async () => {
    for (const id of ids) {
      const ref = db.collection("operationalCostDefinitions").doc(id);
      for (const version of await ref.collection("versions").listDocuments()) {
        const wf = version.collection("approval").doc("workflow");
        for (const event of await wf.collection("events").listDocuments()) await event.delete();
        await wf.delete();
        await version.delete();
      }
      await ref.delete();
    }
    await deleteApp(app);
  });
  async function grant(uid, permission) {
    await db.collection("staffActionPermissions").doc(uid).collection("permissions").doc(permission).set({
      active: true, assignedBy: "trusted-provisioning-actor",
      reason: "Synthetic test assignment", assignedAt: FieldValue.serverTimestamp(),
    });
  }
  async function draft() {
    const proposer = `proposer-${randomUUID()}`;
    const result = await definitions.createDefinition(proposer, definition);
    ids.add(result.definitionId);
    for (const permission of permissions.slice(0, 2)) await grant(proposer, permission);
    return { ...result, proposer };
  }
  it("requires four distinct authorized people and records immutable decision events", async () => {
    const d = await draft();
    const ops = `ops-${randomUUID()}`, finance = `finance-${randomUUID()}`, approver = `approver-${randomUUID()}`;
    await grant(ops, permissions[1]); await grant(ops, permissions[2]);
    await grant(finance, permissions[2]); await grant(finance, permissions[3]);
    await grant(approver, permissions[3]);
    await workflow.transition({ definitionId: d.definitionId, versionId: d.versionId, actorUid: d.proposer, action: "submit" });
    await assert.rejects(workflow.transition({ definitionId: d.definitionId, versionId: d.versionId, actorUid: d.proposer, action: "request_changes", reason: "self review" }), /proposer cannot validate/);
    await workflow.transition({ definitionId: d.definitionId, versionId: d.versionId, actorUid: ops, action: "validate" });
    await assert.rejects(workflow.transition({ definitionId: d.definitionId, versionId: d.versionId, actorUid: ops, action: "finance_review" }), /distinct authorized reviewer/);
    await workflow.transition({ definitionId: d.definitionId, versionId: d.versionId, actorUid: finance, action: "finance_review" });
    await assert.rejects(workflow.transition({ definitionId: d.definitionId, versionId: d.versionId, actorUid: finance, action: "approve" }), /independent authorized approver/);
    await workflow.transition({ definitionId: d.definitionId, versionId: d.versionId, actorUid: approver, action: "approve" });
    const ref = db.collection("operationalCostDefinitions").doc(d.definitionId);
    const [lineage, wf, events] = await Promise.all([
      ref.get(), ref.collection("versions").doc(d.versionId).collection("approval").doc("workflow").get(),
      ref.collection("versions").doc(d.versionId).collection("approval").doc("workflow").collection("events").get(),
    ]);
    assert.equal(lineage.data().approvedVersionId, d.versionId);
    assert.equal(wf.data().state, "approved");
    assert.equal(wf.data().proposerUid, d.proposer);
    assert.equal(wf.data().operationsValidatorUid, ops);
    assert.equal(wf.data().financeReviewerUid, finance);
    assert.equal(wf.data().independentApproverUid, approver);
    assert.equal(events.size, 4);
    await assert.rejects(workflow.transition({ definitionId: d.definitionId, versionId: d.versionId, actorUid: approver, action: "approve" }), /pending independent approval state/);
  });
  it("rejects workflow actions when the assigned permission has expired", async () => {
    const d = await draft();
    await db.collection("staffActionPermissions").doc(d.proposer)
      .collection("permissions").doc(permissions[0]).set({
        active: true,
        assignedBy: "trusted-provisioning-actor",
        reason: "Expired synthetic test assignment",
        assignedAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() - 1000),
      });
    await assert.rejects(
      workflow.transition({
        definitionId: d.definitionId,
        versionId: d.versionId,
        actorUid: d.proposer,
        action: "submit",
      }),
      /active, audited action permission/
    );
    const state = await db.collection("operationalCostDefinitions").doc(d.definitionId)
      .collection("versions").doc(d.versionId).collection("approval").doc("workflow").get();
    assert.equal(state.exists, false);
  });

  it("blocks submission until every cost component has amount, currency, basis and evidence", async () => {
    const incomplete = {
      ...definition,
      costComponents: [{ key: "handling", label: "Handling" }],
    };
    const proposer = `proposer-${randomUUID()}`;
    const created = await definitions.createDefinition(proposer, incomplete);
    ids.add(created.definitionId);
    await grant(proposer, permissions[0]);
    await assert.rejects(
      workflow.transition({ definitionId: created.definitionId, versionId: created.versionId, actorUid: proposer, action: "submit" }),
      /amount, explicit currency, basis and evidence description/
    );
    const state = await db.collection("operationalCostDefinitions").doc(created.definitionId)
      .collection("versions").doc(created.versionId).collection("approval").doc("workflow").get();
    assert.equal(state.exists, false);
  });

  it("allows an unsubmitted draft to be superseded and the new version submitted", async () => {
    const d = await draft();
    const revised = await definitions.reviseDefinition({ definitionId: d.definitionId, expectedCurrentVersionNumber: 1, actorUid: d.proposer, definition: { ...definition, activityName: "Revised unsubmitted draft" } });
    assert.equal(revised.outcome, "updated");
    await workflow.transition({ definitionId: d.definitionId, versionId: revised.versionId, actorUid: d.proposer, action: "submit" });
    const previousWorkflow = await db.collection("operationalCostDefinitions").doc(d.definitionId).collection("versions").doc(d.versionId).collection("approval").doc("workflow").get();
    assert.equal(previousWorkflow.exists, false);
  });

  it("prevents superseding a version while review is active or after rejection", async () => {
    const d = await draft(), ops = `ops-${randomUUID()}`, finance = `finance-${randomUUID()}`, approver = `approver-${randomUUID()}`;
    await grant(ops, permissions[1]); await grant(finance, permissions[2]); await grant(approver, permissions[3]);
    const revise = () => definitions.reviseDefinition({ definitionId: d.definitionId, expectedCurrentVersionNumber: 1, actorUid: d.proposer, definition });
    await workflow.transition({ definitionId: d.definitionId, versionId: d.versionId, actorUid: d.proposer, action: "submit" });
    await assert.rejects(revise(), /cannot be revised while review is in progress/);
    await workflow.transition({ definitionId: d.definitionId, versionId: d.versionId, actorUid: ops, action: "validate" });
    await assert.rejects(revise(), /cannot be revised while review is in progress/);
    await workflow.transition({ definitionId: d.definitionId, versionId: d.versionId, actorUid: finance, action: "finance_review" });
    await assert.rejects(revise(), /cannot be revised while review is in progress/);
    await workflow.transition({ definitionId: d.definitionId, versionId: d.versionId, actorUid: approver, action: "reject", reason: "Not approved" });
    await assert.rejects(revise(), /cannot be revised while review is in progress/);
  });

  it("requires a revised version after a changes-requested decision", async () => {
    const d = await draft(), ops = `ops-${randomUUID()}`;
    await grant(ops, permissions[1]);
    await workflow.transition({ definitionId: d.definitionId, versionId: d.versionId, actorUid: d.proposer, action: "submit" });
    await workflow.transition({ definitionId: d.definitionId, versionId: d.versionId, actorUid: ops, action: "request_changes", reason: "Revise inputs" });
    const revised = await definitions.reviseDefinition({ definitionId: d.definitionId, expectedCurrentVersionNumber: 1, actorUid: d.proposer, definition: { ...definition, activityName: "Revised activity" } });
    assert.equal(revised.outcome, "updated");
    await workflow.transition({ definitionId: d.definitionId, versionId: revised.versionId, actorUid: d.proposer, action: "submit" });
    const old = await db.collection("operationalCostDefinitions").doc(d.definitionId).collection("versions").doc(d.versionId).collection("approval").doc("workflow").get();
    assert.equal(old.data().state, "changes_requested");
  });
});
