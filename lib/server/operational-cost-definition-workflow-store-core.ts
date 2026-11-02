import type { FieldValue, Firestore } from "firebase-admin/firestore";

export const OPERATIONAL_COST_ACTION_PERMISSIONS = {
  submit: "operational_cost_definition.propose",
  validate: "operational_cost_definition.validate",
  finance_review: "operational_cost_definition.finance_review",
  approve: "operational_cost_definition.approve",
} as const;

export type OperationalCostWorkflowAction =
  | "submit"
  | "validate"
  | "finance_review"
  | "approve"
  | "request_changes"
  | "reject";

export type OperationalCostWorkflowState =
  | "draft"
  | "pending_operations_validation"
  | "pending_finance_review"
  | "pending_independent_approval"
  | "changes_requested"
  | "approved"
  | "rejected";

type WorkflowDocument = {
  state: OperationalCostWorkflowState;
  proposerUid?: string;
  operationsValidatorUid?: string;
  financeReviewerUid?: string;
  independentApproverUid?: string;
};

type VersionDocument = {
  versionNumber?: number;
  createdBy?: string;
};

type LineageDocument = {
  currentVersionId?: string;
  currentVersionNumber?: number;
  approvedVersionId?: string;
  approvedVersionNumber?: number;
};

export type WorkflowTransitionResult =
  | { outcome: "transitioned"; state: OperationalCostWorkflowState }
  | { outcome: "not_found" };

function permissionFor(
  action: OperationalCostWorkflowAction,
  state: OperationalCostWorkflowState
): string {
  if (action === "submit") return OPERATIONAL_COST_ACTION_PERMISSIONS.submit;
  if (action === "validate") return OPERATIONAL_COST_ACTION_PERMISSIONS.validate;
  if (action === "finance_review") return OPERATIONAL_COST_ACTION_PERMISSIONS.finance_review;
  if (action === "approve" || action === "reject") return OPERATIONAL_COST_ACTION_PERMISSIONS.approve;
  if (action === "request_changes" && state === "pending_operations_validation") {
    return OPERATIONAL_COST_ACTION_PERMISSIONS.validate;
  }
  if (action === "request_changes" && state === "pending_finance_review") {
    return OPERATIONAL_COST_ACTION_PERMISSIONS.finance_review;
  }
  throw new Error("This action is not valid for the current workflow state");
}

function assertUid(uid: string): void {
  if (typeof uid !== "string" || !uid.trim() || uid.length > 128) {
    throw new TypeError("A valid authenticated actor UID is required");
  }
}

export function createOperationalCostDefinitionWorkflowStore({
  db,
  serverTimestamp,
}: {
  db: Firestore;
  serverTimestamp: () => FieldValue;
}) {
  return {
    async transition(input: {
      definitionId: string;
      versionId: string;
      actorUid: string;
      action: OperationalCostWorkflowAction;
      reason?: string;
    }): Promise<WorkflowTransitionResult> {
      const { definitionId, versionId, actorUid, action, reason } = input;
      assertUid(actorUid);
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(definitionId) ||
          !/^[A-Za-z0-9_-]{1,128}$/.test(versionId)) {
        throw new TypeError("A valid definition ID and version ID are required");
      }
      if (!["submit", "validate", "finance_review", "approve", "request_changes", "reject"].includes(action)) {
        throw new TypeError("Unsupported operational cost workflow action");
      }
      if ((action === "request_changes" || action === "reject") &&
          (typeof reason !== "string" || !reason.trim() || reason.length > 1000)) {
        throw new TypeError("A reason of at most 1000 characters is required for this decision");
      }

      const definitionRef = db.collection("operationalCostDefinitions").doc(definitionId);
      const versionRef = definitionRef.collection("versions").doc(versionId);
      const workflowRef = versionRef.collection("approval").doc("workflow");
      const eventRef = workflowRef.collection("events").doc();
      const timestamp = serverTimestamp();

      return db.runTransaction(async (transaction) => {
        const [definitionSnapshot, versionSnapshot, workflowSnapshot] = await Promise.all([
          transaction.get(definitionRef),
          transaction.get(versionRef),
          transaction.get(workflowRef),
        ]);
        if (!definitionSnapshot.exists || !versionSnapshot.exists) return { outcome: "not_found" } as const;

        const lineage = definitionSnapshot.data() as LineageDocument;
        const version = versionSnapshot.data() as VersionDocument;
        const versionNumber = version.versionNumber;
        if (lineage.currentVersionId !== versionId ||
            typeof versionNumber !== "number" ||
            !Number.isSafeInteger(versionNumber) ||
            versionNumber !== lineage.currentVersionNumber) {
          throw new Error("Only the current operational cost definition version may enter or advance review");
        }

        const current = (workflowSnapshot.exists
          ? workflowSnapshot.data()
          : { state: "draft" }) as WorkflowDocument;
        const permission = permissionFor(action, current.state);
        const permissionRef = db.collection("staffActionPermissions")
          .doc(actorUid).collection("permissions").doc(permission);
        const permissionSnapshot = await transaction.get(permissionRef);
        const assignment = permissionSnapshot.data();
        if (
          !permissionSnapshot.exists ||
          assignment?.active !== true ||
          typeof assignment.assignedBy !== "string" ||
          !assignment.assignedBy.trim() ||
          typeof assignment.reason !== "string" ||
          !assignment.reason.trim() ||
          !assignment.assignedAt
        ) {
          throw new Error("The actor does not have the required active, audited action permission");
        }

        const next: WorkflowDocument = { ...current };
        let nextState: OperationalCostWorkflowState;

        switch (action) {
          case "submit": {
            if (current.state !== "draft" || version.createdBy !== actorUid) {
              throw new Error("Only the version creator may submit a draft version");
            }
            if (versionNumber > 1) {
              const previousVersionQuery = definitionRef.collection("versions")
                .where("versionNumber", "==", versionNumber - 1).limit(1);
              const previous = await transaction.get(previousVersionQuery);
              if (previous.empty) throw new Error("The previous version required for resubmission was not found");
              const previousWorkflowRef = previous.docs[0].ref.collection("approval").doc("workflow");
              const previousWorkflow = await transaction.get(previousWorkflowRef);
              const previousState = previousWorkflow.exists
                ? previousWorkflow.data()?.state
                : "draft";
              if (!["draft", "changes_requested", "approved"].includes(previousState)) {
                throw new Error("A revised version may only be submitted when its predecessor was an unsubmitted draft, had changes requested, or was previously approved");
              }
            }
            next.proposerUid = actorUid;
            nextState = "pending_operations_validation";
            break;
          }
          case "validate":
            if (current.state !== "pending_operations_validation" ||
                current.proposerUid === actorUid) {
              throw new Error("Operations validation is not permitted for this actor or state");
            }
            next.operationsValidatorUid = actorUid;
            nextState = "pending_finance_review";
            break;
          case "finance_review":
            if (current.state !== "pending_finance_review" ||
                current.proposerUid === actorUid ||
                current.operationsValidatorUid === actorUid) {
              throw new Error("Finance review requires a distinct authorized reviewer");
            }
            next.financeReviewerUid = actorUid;
            nextState = "pending_independent_approval";
            break;
          case "approve":
          case "reject":
            if (current.state !== "pending_independent_approval") {
              throw new Error("Final approval or rejection is only permitted in the pending independent approval state");
            }
            if (current.proposerUid === actorUid ||
                current.operationsValidatorUid === actorUid ||
                current.financeReviewerUid === actorUid) {
              throw new Error("Final approval requires an independent authorized approver");
            }
            next.independentApproverUid = actorUid;
            nextState = action === "approve" ? "approved" : "rejected";
            break;
          case "request_changes":
            if (current.state === "pending_operations_validation") {
              if (current.proposerUid === actorUid) throw new Error("The proposer cannot validate their own proposal");
            } else if (current.state === "pending_finance_review") {
              if (current.proposerUid === actorUid || current.operationsValidatorUid === actorUid) {
                throw new Error("Finance review requires a distinct reviewer");
              }
            } else {
              throw new Error("Changes can only be requested during Operations or Finance review");
            }
            nextState = "changes_requested";
            break;
          default:
            throw new Error("Unsupported operational cost workflow action");
        }

        const event = {
          action,
          actorUid,
          previousState: current.state,
          resultingState: nextState,
          reason: reason?.trim() || null,
          timestamp,
        };
        transaction.set(workflowRef, {
          ...next,
          state: nextState,
          updatedAt: timestamp,
          updatedBy: actorUid,
          ...(workflowSnapshot.exists ? {} : { createdAt: timestamp, createdBy: actorUid }),
        });
        transaction.create(eventRef, event);
        if (nextState === "approved") {
          transaction.update(definitionRef, {
            approvedVersionId: versionId,
            approvedVersionNumber: version.versionNumber,
            approvedAt: timestamp,
            approvedBy: actorUid,
            updatedAt: timestamp,
            updatedBy: actorUid,
          });
        }
        return { outcome: "transitioned", state: nextState } as const;
      });
    },
  };
}
