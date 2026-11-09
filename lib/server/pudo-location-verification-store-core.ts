import type { FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import { hasStaffActionPermissionInTransaction } from "./staff-permission-grants-core.ts";

const PERMISSION = "pudo_location.verify";

export type PudoVerificationStatus =
  | "pending_inspection"
  | "inspection_recorded"
  | "clarification_required"
  | "approved_to_activate"
  | "not_approved";

export type PudoEvidenceAssessment =
  | "sufficient"
  | "insufficient"
  | "conflicting";

export interface PudoEvidenceReference {
  label: string;
  reference: string;
  notes?: string;
}

export interface PudoInspectionInput {
  inspectedSite: string;
  inspectedAt: string;
  findings: string;
  discrepancies: string[];
  unresolvedDiscrepancies: string[];
  limitations: string;
  evidenceReferences: PudoEvidenceReference[];
  evidenceAssessment: PudoEvidenceAssessment;
  assessmentNotes: string;
}

export type PudoVerificationDecision =
  | "approve_to_activate"
  | "return_for_clarification"
  | "not_approved";

interface Dependencies {
  db: Firestore;
  serverTimestamp: () => FieldValue;
}

function assertActor(uid: string): void {
  if (typeof uid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
    throw new TypeError("A valid authenticated staff identity is required.");
  }
}

function assertLocationId(id: string): void {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
    throw new TypeError("A valid PUDO candidate ID is required.");
  }
}

function assertText(
  value: unknown,
  label: string,
  max: number,
  required = true,
): asserts value is string {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  ) {
    throw new TypeError(
      `${label} must be a non-empty string of at most ${max} characters.`,
    );
  }
}

function assertStringList(
  value: unknown,
  label: string,
  maxItems = 50,
): asserts value is string[] {
  if (
    !Array.isArray(value) ||
    value.length > maxItems ||
    value.some((item) =>
      typeof item !== "string" || !item.trim() || item.length > 1000
    )
  ) {
    throw new TypeError(`${label} must be a list of valid text entries.`);
  }
}

function validateInspection(input: PudoInspectionInput): void {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("A valid inspection record is required.");
  }

  const allowed = [
    "inspectedSite",
    "inspectedAt",
    "findings",
    "discrepancies",
    "unresolvedDiscrepancies",
    "limitations",
    "evidenceReferences",
    "evidenceAssessment",
    "assessmentNotes",
  ];

  if (Object.keys(input).some((key) => !allowed.includes(key))) {
    throw new TypeError("The inspection contains an unsupported field.");
  }

  assertText(input.inspectedSite, "Inspected site", 1000);
  assertText(input.inspectedAt, "Inspection date and time", 64);

  if (
    !/^\d{4}-\d{2}-\d{2}T/.test(input.inspectedAt) ||
    !Number.isFinite(Date.parse(input.inspectedAt))
  ) {
    throw new TypeError("Inspection date and time must be a valid ISO timestamp.");
  }

  assertText(input.findings, "Inspection findings", 5000);
  assertStringList(input.discrepancies, "Discrepancies");
  assertStringList(input.unresolvedDiscrepancies, "Unresolved discrepancies");
  assertText(input.limitations, "Inspection limitations", 3000, false);
  assertText(input.assessmentNotes, "Evidence assessment notes", 3000, false);

  if (
    !Array.isArray(input.evidenceReferences) ||
    input.evidenceReferences.length > 30
  ) {
    throw new TypeError("Evidence references must be a list of at most 30 items.");
  }

  for (const item of input.evidenceReferences) {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item) ||
      Object.keys(item).some((key) =>
        !["label", "reference", "notes"].includes(key)
      )
    ) {
      throw new TypeError("An evidence reference contains invalid fields.");
    }

    assertText(item.label, "Evidence label", 160);
    assertText(item.reference, "Evidence reference", 1000);
    assertText(item.notes ?? "", "Evidence notes", 1000, false);
  }

  if (
    !["sufficient", "insufficient", "conflicting"].includes(
      input.evidenceAssessment,
    )
  ) {
    throw new TypeError("A valid evidence assessment is required.");
  }
}

function validateDecision(
  decision: PudoVerificationDecision,
  reason: string,
): void {
  if (
    ![
      "approve_to_activate",
      "return_for_clarification",
      "not_approved",
    ].includes(decision)
  ) {
    throw new TypeError("A valid verification decision is required.");
  }

  assertText(reason, "Decision reason", 3000);
}

export function createPudoLocationVerificationStore({
  db,
  serverTimestamp,
}: Dependencies) {
  const candidates = db.collection("pudoLocations");
  const verifications = db.collection("pudoLocationVerifications");

  async function requirePermission(
    actorUid: string,
    transaction?: Transaction,
  ): Promise<void> {
    assertActor(actorUid);

    const allowed = transaction
      ? await hasStaffActionPermissionInTransaction(
        transaction,
        db,
        actorUid,
        PERMISSION,
      )
      : await db.runTransaction((tx) =>
        hasStaffActionPermissionInTransaction(tx, db, actorUid, PERMISSION),
      );

    if (!allowed) {
      throw new Error("You are not authorised to verify PUDO locations.");
    }
  }

  async function requireSubmittedCandidate(
    transaction: Transaction,
    locationId: string,
  ) {
    const snapshot = await transaction.get(candidates.doc(locationId));

    if (!snapshot.exists || snapshot.data()?.lifecycle !== "submitted") {
      throw new Error("A submitted PUDO candidate was not found.");
    }

    return snapshot;
  }

  return {
    async listQueue(actorUid: string, limit = 50) {
      await requirePermission(actorUid);

      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
        throw new TypeError("List limit must be between 1 and 100.");
      }

      const snapshot = await candidates
        .where("lifecycle", "==", "submitted")
        .orderBy("submittedAt", "desc")
        .limit(limit)
        .get();

      const queue = await Promise.all(snapshot.docs.map(async (document) => {
        const verification = await verifications.doc(document.id).get();
        const state = verification.exists
          ? verification.data()
          : { status: "pending_inspection" as const };

        return {
          locationId: document.id,
          candidate: document.data(),
          verification: state,
        };
      }));


      return queue.filter((item) =>
        !["approved_to_activate", "not_approved"].includes(
          String(item.verification?.status ?? "pending_inspection"),
        )
      );
    },

    async getVerification(actorUid: string, locationId: string) {
      await requirePermission(actorUid);
      assertLocationId(locationId);

      const candidateSnapshot = await candidates.doc(locationId).get();

      if (
        !candidateSnapshot.exists ||
        candidateSnapshot.data()?.lifecycle !== "submitted"
      ) {
        return null;
      }

      const verificationRef = verifications.doc(locationId);
      const [verificationSnapshot, inspectionsSnapshot, eventsSnapshot] =
        await Promise.all([
          verificationRef.get(),
          verificationRef.collection("inspectionRecords")
            .orderBy("recordedAt", "desc").get(),
          verificationRef.collection("auditEvents")
            .orderBy("timestamp", "desc").get(),
        ]);

      return {
        locationId,
        candidate: candidateSnapshot.data(),
        verification: verificationSnapshot.exists
          ? verificationSnapshot.data()
          : { status: "pending_inspection" as const },
        inspections: inspectionsSnapshot.docs.map((doc) => ({
          inspectionId: doc.id,
          ...doc.data(),
        })),
        events: eventsSnapshot.docs.map((doc) => ({
          eventId: doc.id,
          ...doc.data(),
        })),
      };
    },

    async recordInspection(
      actorUid: string,
      locationId: string,
      input: PudoInspectionInput,
    ) {
      assertActor(actorUid);
      assertLocationId(locationId);
      validateInspection(input);

      const verificationRef = verifications.doc(locationId);
      const inspectionRef = verificationRef.collection("inspectionRecords").doc();
      const eventRef = verificationRef.collection("auditEvents").doc();

      return db.runTransaction(async (transaction) => {
        await requirePermission(actorUid, transaction);
        await requireSubmittedCandidate(transaction, locationId);

        const currentSnapshot = await transaction.get(verificationRef);
        const current = currentSnapshot.data();
        const status = (current?.status ?? "pending_inspection") as
          PudoVerificationStatus;

        if (
          status !== "pending_inspection" &&
          status !== "clarification_required"
        ) {
          throw new Error("A new inspection cannot be recorded in the current status.");
        }

        const now = serverTimestamp();

        const inspection = {
          ...input,
          inspectorUid: actorUid,
          recordedAt: now,
        };

        transaction.create(inspectionRef, inspection);
        transaction.set(verificationRef, {
          status: "inspection_recorded",
          latestInspectionId: inspectionRef.id,
          updatedAt: now,
          updatedBy: actorUid,
        });

        transaction.create(eventRef, {
          action: "inspection_recorded",
          actorUid,
          inspectionId: inspectionRef.id,
          timestamp: now,
        });

        return {
          locationId,
          inspectionId: inspectionRef.id,
          status: "inspection_recorded" as const,
        };
      });
    },

    async recordDecision(
      actorUid: string,
      locationId: string,
      decision: PudoVerificationDecision,
      reason: string,
    ) {
      assertActor(actorUid);
      assertLocationId(locationId);
      validateDecision(decision, reason);

      const verificationRef = verifications.doc(locationId);
      const eventRef = verificationRef.collection("auditEvents").doc();

      return db.runTransaction(async (transaction) => {
        await requirePermission(actorUid, transaction);
        await requireSubmittedCandidate(transaction, locationId);

        const verificationSnapshot = await transaction.get(verificationRef);
        const current = verificationSnapshot.data();

        if (
          !verificationSnapshot.exists ||
          current?.status !== "inspection_recorded" ||
          typeof current.latestInspectionId !== "string"
        ) {
          throw new Error("A recorded inspection is required before a decision.");
        }

        const inspectionRef = verificationRef
          .collection("inspectionRecords")
          .doc(current.latestInspectionId);
        const inspectionSnapshot = await transaction.get(inspectionRef);

        if (!inspectionSnapshot.exists) {
          throw new Error("The latest inspection record could not be found.");
        }

        const inspection = inspectionSnapshot.data()!;

        if (
          decision === "approve_to_activate" &&
          (
            inspection.evidenceAssessment !== "sufficient" ||
            !Array.isArray(inspection.unresolvedDiscrepancies) ||
            inspection.unresolvedDiscrepancies.length > 0
          )
        ) {
          throw new Error(
            "Approval requires sufficient evidence and no unresolved discrepancies.",
          );
        }


        const status = ({
          approve_to_activate: "approved_to_activate",
          return_for_clarification: "clarification_required",
          not_approved: "not_approved",
        } satisfies Record<PudoVerificationDecision, PudoVerificationStatus>)[decision];

        const now = serverTimestamp();

        transaction.update(verificationRef, {
          status,
          decision,
          decisionReason: reason.trim(),
          decisionMakerUid: actorUid,
          decidedAt: now,
          updatedAt: now,
          updatedBy: actorUid,
        });

        transaction.create(eventRef, {
          action: "decision_recorded",
          actorUid,
          decision,
          outcome: status,
          reason: reason.trim(),
          inspectionId: current.latestInspectionId,
          timestamp: now,
        });

        return { locationId, status, decision };
      });
    },
  };
}