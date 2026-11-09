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
    createStaffManagementStore,
} from "../lib/server/staff-management-core.ts";

const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

describe("PUDO physical verification store", { skip: !enabled }, () => {
    const prefix = randomUUID();
    const actor = `pudo-verify-admin-${prefix}`;
    const registerUid = `pudo-register-${prefix}`;
    const verifierUid = `pudo-verifier-${prefix}`;
    const deniedUid = `pudo-no-verify-${prefix}`;
    const locationIds = [];

    let app;
    let db;
    let registrationStore;
    let verificationStore;
    let staffStore;

    const inspectionInput = (overrides = {}) => ({
        inspectedSite: "12 Example Street, Test District",
        inspectedAt: "2026-11-08T10:00:00.000Z",
        findings: "The physical premises were inspected in person.",
        discrepancies: [],
        unresolvedDiscrepancies: [],
        limitations: "",
        evidenceReferences: [
            {
                label: "Premises inspection notes",
                reference: "test-reference-001",
                notes: "Synthetic test evidence",
            },
        ],
        evidenceAssessment: "sufficient",
        assessmentNotes: "Evidence supports the inspection findings.",
        ...overrides,
    });

    async function createSubmittedCandidate(name = "Test PUDO location") {
        const created = await registrationStore.saveCandidate(registerUid, {
            name,
            address: "12 Example Street, Test District",
            registrationNote: "Synthetic PUDO verification test",
            geo: {
                latitude: 6.5244,
                longitude: 3.3792,
                captureMethod: "manual",
            },
        });

        locationIds.push(created.locationId);

        await registrationStore.submitCandidate(
            registerUid,
            created.locationId,
        );

        return created.locationId;
    }

    async function recordInspection(locationId, overrides = {}) {
        return verificationStore.recordInspection(
            verifierUid,
            locationId,
            inspectionInput(overrides),
        );
    }

    after(async () => {
        for (const locationId of locationIds) {
            const verificationRef = db
                .collection("pudoLocationVerifications")
                .doc(locationId);

            for (const collectionName of [
                "inspectionRecords",
                "auditEvents",
            ]) {
                const documents = await verificationRef
                    .collection(collectionName)
                    .listDocuments();

                await Promise.all(documents.map((document) => document.delete()));
            }

            await verificationRef.delete();

            const candidateRef = db.collection("pudoLocations").doc(locationId);
            const candidateEvents = await candidateRef
                .collection("auditEvents")
                .listDocuments();

            await Promise.all(
                candidateEvents.map((document) => document.delete()),
            );

            await candidateRef.delete();
        }

        for (const uid of [registerUid, verifierUid, deniedUid]) {
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
            `pudo-verification-${prefix}`,
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

        staffStore = createStaffManagementStore({
            db,
            serverTimestamp: () => FieldValue.serverTimestamp(),
        });

        for (const uid of [registerUid, verifierUid, deniedUid]) {
            await db.collection("staffDirectory").doc(uid).set({
                email: `${uid}@example.test`,
                status: "active",
            });
        }

        await staffStore.setPermission({
            targetUid: registerUid,
            actorUid: actor,
            permissionId: "pudo_location.register",
            status: "active",
            reason: "PUDO verification test registration access",
        });

        await staffStore.setPermission({
            targetUid: verifierUid,
            actorUid: actor,
            permissionId: "pudo_location.verify",
            status: "active",
            reason: "PUDO physical verification tests",
        });

        // This identity has registration permission only.
        await staffStore.setPermission({
            targetUid: deniedUid,
            actorUid: actor,
            permissionId: "pudo_location.register",
            status: "active",
            reason: "Verify that registration does not grant verification",
        });
    });

    it("requires the separate verification activity permission", async () => {
        await assert.rejects(
            verificationStore.listQueue(registerUid),
            /not authorised to verify PUDO locations/,
        );

        await assert.rejects(
            verificationStore.listQueue(deniedUid),
            /not authorised to verify PUDO locations/,
        );

        await assert.rejects(
            verificationStore.listQueue(""),
            /valid authenticated staff identity/,
        );
    });

    it("queues submitted candidates and records attributable inspections", async () => {
        const locationId = await createSubmittedCandidate();

        const queue = await verificationStore.listQueue(verifierUid);

        const queued = queue.find((item) => item.locationId === locationId);

        assert.ok(queued);
        assert.equal(queued.candidate.lifecycle, "submitted");
        assert.equal(queued.verification.status, "pending_inspection");

        const result = await recordInspection(locationId);

        assert.equal(result.locationId, locationId);
        assert.equal(result.status, "inspection_recorded");
        assert.ok(result.inspectionId);

        const detail = await verificationStore.getVerification(
            verifierUid,
            locationId,
        );

        assert.equal(detail.verification.status, "inspection_recorded");
        assert.equal(detail.inspections.length, 1);
        assert.equal(detail.inspections[0].inspectorUid, verifierUid);
        assert.equal(
            detail.inspections[0].inspectedSite,
            "12 Example Street, Test District",
        );
        assert.equal(
            detail.inspections[0].evidenceAssessment,
            "sufficient",
        );
        assert.equal(detail.events.length, 1);
        assert.equal(detail.events[0].action, "inspection_recorded");
        assert.equal(detail.events[0].actorUid, verifierUid);

        // A second inspection cannot overwrite an inspection awaiting a decision.
        await assert.rejects(
            recordInspection(locationId),
            /current status/,
        );
    });

    it("blocks approval when evidence is insufficient or conflicting", async () => {
        for (const assessment of ["insufficient", "conflicting"]) {
            const locationId = await createSubmittedCandidate(
                `Evidence ${assessment} candidate`,
            );

            await recordInspection(locationId, {
                evidenceAssessment: assessment,
                assessmentNotes: `Evidence assessment: ${assessment}`,
            });

            await assert.rejects(
                verificationStore.recordDecision(
                    verifierUid,
                    locationId,
                    "approve_to_activate",
                    "Attempted approval",
                ),
                /sufficient evidence and no unresolved discrepancies/,
            );

            const detail = await verificationStore.getVerification(
                verifierUid,
                locationId,
            );

            assert.equal(detail.verification.status, "inspection_recorded");
            assert.equal(detail.events.length, 1);
        }
    });

    it("blocks approval while discrepancies remain unresolved", async () => {
        const locationId = await createSubmittedCandidate(
            "Unresolved discrepancy candidate",
        );

        await recordInspection(locationId, {
            discrepancies: ["The displayed operating hours differ from the premises."],
            unresolvedDiscrepancies: [
                "Operating hours require confirmation.",
            ],
            evidenceAssessment: "sufficient",
        });

        await assert.rejects(
            verificationStore.recordDecision(
                verifierUid,
                locationId,
                "approve_to_activate",
                "Attempted approval with unresolved discrepancy",
            ),
            /sufficient evidence and no unresolved discrepancies/,
        );

        const detail = await verificationStore.getVerification(
            verifierUid,
            locationId,
        );

        assert.equal(detail.verification.status, "inspection_recorded");
    });

    it("preserves inspection history through clarification and re-inspection", async () => {
        const locationId = await createSubmittedCandidate(
            "Clarification workflow candidate",
        );

        const candidateBefore = await registrationStore.getCandidate(
            registerUid,
            locationId,
        );

        const first = await recordInspection(locationId, {
            evidenceAssessment: "insufficient",
            assessmentNotes: "Additional evidence is required.",
            discrepancies: ["Supporting operating evidence is incomplete."],
            unresolvedDiscrepancies: [
                "Operating arrangement needs clarification.",
            ],
        });

        await verificationStore.recordDecision(
            verifierUid,
            locationId,
            "return_for_clarification",
            "Please clarify the operating arrangement and provide supporting evidence.",
        );

        let detail = await verificationStore.getVerification(
            verifierUid,
            locationId,
        );

        assert.equal(
            detail.verification.status,
            "clarification_required",
        );

        assert.equal(detail.inspections.length, 1);

        const second = await recordInspection(locationId, {
            inspectedAt: "2026-11-08T12:00:00.000Z",
            findings: "Clarification was reviewed during a follow-up inspection.",
            discrepancies: [],
            unresolvedDiscrepancies: [],
            evidenceAssessment: "sufficient",
            assessmentNotes: "The additional evidence resolves the earlier concern.",
        });

        assert.notEqual(first.inspectionId, second.inspectionId);

        await verificationStore.recordDecision(
            verifierUid,
            locationId,
            "approve_to_activate",
            "Physical verification is satisfactory. May proceed to PUDO-3 activation.",
        );

        detail = await verificationStore.getVerification(
            verifierUid,
            locationId,
        );

        assert.equal(
            detail.verification.status,
            "approved_to_activate",
        );

        assert.equal(detail.inspections.length, 2);
        assert.equal(detail.events.length, 4);

        assert.deepEqual(
            detail.inspections.map((item) => item.inspectorUid),
            [verifierUid, verifierUid],
        );

        assert.ok(
            detail.inspections.some(
                (item) => item.inspectionId === first.inspectionId,
            ),
        );

        assert.ok(
            detail.inspections.some(
                (item) => item.inspectionId === second.inspectionId,
            ),
        );

        assert.equal(
            detail.verification.decisionMakerUid,
            verifierUid,
        );

        assert.equal(
            detail.verification.decision,
            "approve_to_activate",
        );

        assert.equal(
            detail.events.filter((event) => event.action === "inspection_recorded").length,
            2,
        );

        assert.equal(
            detail.events.filter((event) => event.action === "decision_recorded").length,
            2,
        );

        // Verification must never modify the original submitted candidate.
        const candidateAfter = await registrationStore.getCandidate(
            registerUid,
            locationId,
        );

        assert.deepEqual(candidateAfter, candidateBefore);
        assert.equal(candidateAfter.lifecycle, "submitted");

        // Approval is not PUDO activation.
        assert.equal(candidateAfter.lifecycle, "submitted");

        // Approved candidates no longer appear in the verification queue.
        const queue = await verificationStore.listQueue(verifierUid);

        assert.equal(
            queue.some((item) => item.locationId === locationId),
            false,
        );

        // Terminal approval cannot be followed by another decision.
        await assert.rejects(
            verificationStore.recordDecision(
                verifierUid,
                locationId,
                "not_approved",
                "Attempted second decision",
            ),
            /recorded inspection is required/,
        );
    });

    it("records a not-approved outcome and excludes it from the queue", async () => {
        const locationId = await createSubmittedCandidate(
            "Not approved candidate",
        );

        await recordInspection(locationId, {
            evidenceAssessment: "insufficient",
        });

        const result = await verificationStore.recordDecision(
            verifierUid,
            locationId,
            "not_approved",
            "The available evidence does not support proceeding.",
        );

        assert.equal(result.status, "not_approved");

        const detail = await verificationStore.getVerification(
            verifierUid,
            locationId,
        );

        assert.equal(detail.verification.status, "not_approved");
        assert.equal(detail.verification.decisionMakerUid, verifierUid);

        const decisionEvent = detail.events.find(
            (event) => event.action === "decision_recorded",
        );

        assert.ok(decisionEvent);
        assert.equal(decisionEvent.outcome, "not_approved");
        assert.equal(decisionEvent.actorUid, verifierUid);

        const queue = await verificationStore.listQueue(verifierUid);

        assert.equal(
            queue.some((item) => item.locationId === locationId),
            false,
        );
    });

    it("rejects malformed inspection data and unsupported identity fields", async () => {
        const locationId = await createSubmittedCandidate(
            "Invalid inspection candidate",
        );

        await assert.rejects(
            verificationStore.recordInspection(
                verifierUid,
                locationId,
                inspectionInput({
                    evidenceAssessment: "unknown",
                }),
            ),
            /valid evidence assessment/,
        );

        await assert.rejects(
            verificationStore.recordInspection(
                verifierUid,
                locationId,
                inspectionInput({
                    inspectorUid: "forged-inspector",
                }),
            ),
            /unsupported field/,
        );

        await assert.rejects(
            verificationStore.recordInspection(
                verifierUid,
                locationId,
                inspectionInput({
                    inspectedAt: "not-a-date",
                }),
            ),
            /valid ISO timestamp/,
        );

        await assert.rejects(
            verificationStore.recordInspection(
                verifierUid,
                locationId,
                inspectionInput({
                    evidenceReferences: [
                        {
                            label: "Invalid reference",
                            reference: "reference",
                            unsupported: true,
                        },
                    ],
                }),
            ),
            /invalid fields/,
        );

        const detail = await verificationStore.getVerification(
            verifierUid,
            locationId,
        );

        assert.equal(detail.inspections.length, 0);
        assert.equal(detail.events.length, 0);
    });

    it("rejects decisions without a recorded inspection or a valid reason", async () => {
        const locationId = await createSubmittedCandidate(
            "Decision without inspection candidate",
        );

        await assert.rejects(
            verificationStore.recordDecision(
                verifierUid,
                locationId,
                "approve_to_activate",
                "Attempted premature approval",
            ),
            /recorded inspection is required/,
        );

        await recordInspection(locationId);

        await assert.rejects(
            verificationStore.recordDecision(
                verifierUid,
                locationId,
                "approve_to_activate",
                "",
            ),
            /Decision reason must be a non-empty string/,
        );

        await assert.rejects(
            verificationStore.recordDecision(
                verifierUid,
                locationId,
                "unsupported_decision",
                "Invalid decision",
            ),
            /valid verification decision/,
        );
    });

    it("does not verify a draft or a missing candidate", async () => {
        const draft = await registrationStore.saveCandidate(registerUid, {
            name: "Draft candidate",
            address: "15 Example Street",
        });

        locationIds.push(draft.locationId);

        await assert.rejects(
            recordInspection(draft.locationId),
            /submitted PUDO candidate was not found/,
        );

        await assert.rejects(
            recordInspection(`missing-${prefix}`),
            /submitted PUDO candidate was not found/,
        );
    });
});




