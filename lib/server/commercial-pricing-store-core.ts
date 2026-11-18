import type { FieldValue, Firestore } from "firebase-admin/firestore";

// import { hasStaffActionPermission } from "./staff-permission-grants-core.ts";
import {
  hasStaffActionPermission,
  hasStaffActionPermissionInTransaction,
} from "./staff-permission-grants-core.ts";

export type CommercialPricingConfiguration =
  Readonly<Record<string, unknown>>;

interface CommercialPricingStoreDependencies {
  db: Firestore;
  serverTimestamp: () => FieldValue;
}

interface CommercialPricingLineageData {
  currentVersionId?: unknown;
  currentVersionNumber?: unknown;
  approvedVersionId?: unknown;
  approvedVersionNumber?: unknown;
  approvedAt?: unknown;
  approvedBy?: unknown;
  publishedVersionId?: unknown;
  publishedVersionNumber?: unknown;
  publishedAt?: unknown;
  publishedBy?: unknown;
  createdAt?: unknown;
  createdBy?: unknown;
  updatedAt?: unknown;
  updatedBy?: unknown;
}

interface CommercialPricingVersionData {
  versionNumber?: unknown;
  createdAt?: unknown;
  createdBy?: unknown;
  [key: string]: unknown;
}

type CommercialPricingWorkflowState =
  | "draft"
  | "pending_approval"
  | "changes_requested"
  | "approved"
  | "rejected";

type CommercialPricingWorkflowDocument = {
  state: CommercialPricingWorkflowState;
  proposerUid?: string;
  approverUid?: string;
  reason?: string | null;
  createdAt?: unknown;
  createdBy?: string;
  updatedAt?: unknown;
  updatedBy?: string;
};

type CommercialPricingWorkflowAction =
  | "submit"
  | "approve"
  | "request_changes"
  | "reject";

type CommercialPricingWorkflowResult =
  | {
    outcome: "transitioned";
    state: CommercialPricingWorkflowState;
  }
  | { outcome: "not_found" };

type CommercialPricingPublicationResult =
  | {
    outcome: "published";
    versionId: string;
    versionNumber: number;
  }
  | { outcome: "not_found" };

export type ReviseCommercialPricingDefinitionResult =
  | {
    outcome: "updated";
    versionId: string;
    versionNumber: number;
  }
  | { outcome: "not_found" }
  | {
    outcome: "stale_version";
    currentVersionId: string;
    currentVersionNumber: number;
  };

const IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Accept only Firestore-compatible values.
 *
 * Supported values are null, strings, booleans, finite numbers, arrays,
 * and plain maps containing those values. Undefined values, custom objects,
 * nested arrays, functions, symbols, bigint values and circular references
 * are rejected rather than silently transformed.
 */
function assertFirestoreValue(
  value: unknown,
  label: string,
  ancestors = new WeakSet<object>(),
  arrayElement = false
): void {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`${label} must not contain non-finite numbers`);
    }
    return;
  }

  if (typeof value !== "object") {
    throw new TypeError(`${label} contains a value Firestore cannot persist`);
  }

  if (ancestors.has(value)) {
    throw new TypeError(`${label} must not contain circular references`);
  }

  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      if (arrayElement) {
        throw new TypeError(`${label} must not contain nested arrays`);
      }

      for (const item of value) {
        assertFirestoreValue(item, label, ancestors, true);
      }
      return;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`${label} must contain only plain maps`);
    }

    for (const child of Object.values(value)) {
      if (child === undefined) {
        throw new TypeError(`${label} must not contain undefined values`);
      }

      assertFirestoreValue(child, label, ancestors, false);
    }
  } finally {
    ancestors.delete(value);
  }
}

function assertConfiguration(
  value: CommercialPricingConfiguration
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("A commercial pricing configuration must be a map");
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("A commercial pricing configuration must be a plain map");
  }

  const reservedFields = new Set([
    "versionNumber",
    "createdAt",
    "createdBy",
  ]);

  if (Object.keys(value).some((key) => reservedFields.has(key))) {
    throw new TypeError(
      "A commercial pricing configuration contains a reserved version metadata field"
    );
  }

  assertFirestoreValue(value, "A commercial pricing configuration");
}

function assertActorUid(value: string): void {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > 128
  ) {
    throw new TypeError("A valid actor UID is required");
  }
}

function assertDefinitionId(value: string): void {
  if (
    typeof value !== "string" ||
    !IDENTIFIER_PATTERN.test(value)
  ) {
    throw new TypeError("A valid commercial pricing definition ID is required");
  }
}

function assertExpectedVersionNumber(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new TypeError("A valid expected current version number is required");
  }
}

/**
 * Server-side commercial pricing persistence and lifecycle primitives.
 *
 * These records support immutable pricing configurations, independent
 * approval and controlled publication. They do not issue customer
 * quotations or apply pricing to bookings or checkout.
 */


export function createCommercialPricingStore({
  db,
  serverTimestamp,
}: CommercialPricingStoreDependencies) {
  return {
    async hasPermission(
      actorUid: string,
      permissionId: string
    ): Promise<boolean> {
      assertActorUid(actorUid);

      // if (
      //   permissionId !== "commercial_pricing.view" &&
      //   permissionId !== "commercial_pricing.propose"
      // ) {
      //   throw new TypeError("Unsupported commercial pricing permission");
      // }

      if (
        ![
          "commercial_pricing.view",
          "commercial_pricing.propose",
          "commercial_pricing.approve",
          "commercial_pricing.publish",
        ].includes(permissionId)
      ) {
        throw new TypeError("Unsupported commercial pricing permission");
      }

      return hasStaffActionPermission(db, actorUid, permissionId);
    },

    async listDefinitions(
      limit = 50
    ): Promise<Array<Record<string, unknown>>> {
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
        throw new TypeError("Definition list limit must be between 1 and 100");
      }

      const snapshot = await db
        .collection("commercialPricingDefinitions")
        .orderBy("updatedAt", "desc")
        .limit(limit)
        .get();

      return Promise.all(
        snapshot.docs.map(async (document) => {
          const lineage = document.data();
          const versionId = lineage.currentVersionId;

          if (
            typeof versionId !== "string" ||
            !IDENTIFIER_PATTERN.test(versionId)
          ) {
            throw new Error(
              "Commercial pricing definition has an invalid current version reference"
            );
          }

          const version = await document.ref
            .collection("versions")
            .doc(versionId)
            .get();

          if (!version.exists) {
            throw new Error(
              "Commercial pricing definition points to a missing current version"
            );
          }

          return {
            definitionId: document.id,
            ...lineage,
            currentVersion: {
              versionId,
              ...version.data(),
            },
          };
        })
      );
    },

    async getDefinition(
      definitionId: string
    ): Promise<Record<string, unknown> | null> {
      assertDefinitionId(definitionId);

      const definitionRef = db
        .collection("commercialPricingDefinitions")
        .doc(definitionId);

      const lineage = await definitionRef.get();
      if (!lineage.exists) {
        return null;
      }

      const versionsSnapshot = await definitionRef
        .collection("versions")
        .orderBy("versionNumber", "asc")
        .get();

      const versions = versionsSnapshot.docs.map((version) => ({
        versionId: version.id,
        ...version.data(),
      }));

      return {
        definitionId,
        ...lineage.data(),
        versions,
      };
    },

    async createDefinition(
      actorUid: string,
      configuration: CommercialPricingConfiguration
    ): Promise<{
      definitionId: string;
      versionId: string;
      versionNumber: 1;
    }> {
      assertActorUid(actorUid);
      assertConfiguration(configuration);

      const definitionRef = db
        .collection("commercialPricingDefinitions")
        .doc();

      const versionRef = definitionRef.collection("versions").doc();
      const versionData = structuredClone(configuration);

      await db.runTransaction(async (transaction) => {
        transaction.create(definitionRef, {
          currentVersionId: versionRef.id,
          currentVersionNumber: 1,
          createdAt: serverTimestamp(),
          createdBy: actorUid,
          updatedAt: serverTimestamp(),
          updatedBy: actorUid,
        });

        transaction.create(versionRef, {
          versionNumber: 1,
          ...versionData,
          createdAt: serverTimestamp(),
          createdBy: actorUid,
        });
      });

      return {
        definitionId: definitionRef.id,
        versionId: versionRef.id,
        versionNumber: 1,
      };
    },

    async reviseDefinition(input: {
      definitionId: string;
      expectedCurrentVersionNumber: number;
      actorUid: string;
      configuration: CommercialPricingConfiguration;
    }): Promise<ReviseCommercialPricingDefinitionResult> {
      const {
        definitionId,
        expectedCurrentVersionNumber,
        actorUid,
        configuration,
      } = input;

      assertDefinitionId(definitionId);
      assertActorUid(actorUid);
      assertExpectedVersionNumber(expectedCurrentVersionNumber);
      assertConfiguration(configuration);

      const definitionRef = db
        .collection("commercialPricingDefinitions")
        .doc(definitionId);

      const nextVersionRef = definitionRef.collection("versions").doc();
      const versionData = structuredClone(configuration);

      return db.runTransaction(async (transaction) => {
        const definitionDocument = await transaction.get(definitionRef);

        if (!definitionDocument.exists) {
          return { outcome: "not_found" } as const;
        }

        const lineage =
          definitionDocument.data() as CommercialPricingLineageData;

        const currentVersionId = lineage.currentVersionId;
        const currentVersionNumber = lineage.currentVersionNumber;

        if (
          typeof currentVersionId !== "string" ||
          !IDENTIFIER_PATTERN.test(currentVersionId) ||
          typeof currentVersionNumber !== "number" ||
          !Number.isSafeInteger(currentVersionNumber) ||
          currentVersionNumber < 1
        ) {
          throw new Error("Commercial pricing definition lineage is invalid");
        }

        if (currentVersionNumber !== expectedCurrentVersionNumber) {
          return {
            outcome: "stale_version",
            currentVersionId,
            currentVersionNumber,
          } as const;
        }

        const currentVersionRef = definitionRef
          .collection("versions")
          .doc(currentVersionId);

        const currentVersionDocument =
          await transaction.get(currentVersionRef);

        if (!currentVersionDocument.exists) {
          throw new Error(
            "Commercial pricing definition points to a missing current version"
          );
        }


        const currentVersion =
          currentVersionDocument.data() as CommercialPricingVersionData;

        if (currentVersion.versionNumber !== currentVersionNumber) {
          throw new Error(
            "Commercial pricing version number does not match its lineage"
          );
        }

        const currentWorkflowRef = currentVersionRef
          .collection("approval")
          .doc("workflow");

        const currentWorkflowDocument =
          await transaction.get(currentWorkflowRef);

        const currentWorkflowState = currentWorkflowDocument.exists
          ? currentWorkflowDocument.data()?.state
          : "draft";

        if (currentWorkflowState === "pending_approval") {
          throw new Error(
            "A commercial pricing version cannot be revised while approval is pending"
          );
        }

        const nextVersionNumber = currentVersionNumber + 1;
        if (!Number.isSafeInteger(nextVersionNumber)) {
          throw new Error("Next commercial pricing version is out of range");
        }

        transaction.create(nextVersionRef, {
          versionNumber: nextVersionNumber,
          ...versionData,
          createdAt: serverTimestamp(),
          createdBy: actorUid,
        });

        transaction.update(definitionRef, {
          currentVersionId: nextVersionRef.id,
          currentVersionNumber: nextVersionNumber,
          approvedVersionId: null,
          approvedVersionNumber: null,
          approvedAt: null,
          approvedBy: null,
          updatedAt: serverTimestamp(),
          updatedBy: actorUid,
        });

        return {
          outcome: "updated",
          versionId: nextVersionRef.id,
          versionNumber: nextVersionNumber,
        } as const;
      });
    },

    async transitionWorkflow(input: {
      definitionId: string;
      versionId: string;
      actorUid: string;
      action: CommercialPricingWorkflowAction;
      reason?: string;
    }): Promise<CommercialPricingWorkflowResult> {
      const { definitionId, versionId, actorUid, action, reason } = input;

      assertDefinitionId(definitionId);
      assertDefinitionId(versionId);
      assertActorUid(actorUid);

      if (
        !["submit", "approve", "request_changes", "reject"].includes(action)
      ) {
        throw new TypeError("Unsupported commercial pricing workflow action");
      }

      if (
        (action === "request_changes" || action === "reject") &&
        (typeof reason !== "string" || !reason.trim() || reason.length > 1000)
      ) {
        throw new TypeError(
          "A reason of at most 1000 characters is required for this decision"
        );
      }

      const definitionRef = db
        .collection("commercialPricingDefinitions")
        .doc(definitionId);

      const versionRef = definitionRef.collection("versions").doc(versionId);
      const workflowRef = versionRef.collection("approval").doc("workflow");
      const eventRef = workflowRef.collection("events").doc();

      return db.runTransaction(async (transaction) => {
        const [definitionDocument, versionDocument, workflowDocument] =
          await Promise.all([
            transaction.get(definitionRef),
            transaction.get(versionRef),
            transaction.get(workflowRef),
          ]);

        if (!definitionDocument.exists || !versionDocument.exists) {
          return { outcome: "not_found" } as const;
        }

        const lineage =
          definitionDocument.data() as CommercialPricingLineageData;

        const version =
          versionDocument.data() as CommercialPricingVersionData;

        if (
          lineage.currentVersionId !== versionId ||
          typeof lineage.currentVersionNumber !== "number" ||
          version.versionNumber !== lineage.currentVersionNumber
        ) {
          throw new Error(
            "Only the current commercial pricing version may enter or advance approval"
          );
        }

        const current = (
          workflowDocument.exists
            ? workflowDocument.data()
            : { state: "draft" }
        ) as CommercialPricingWorkflowDocument;

        const permission =
          action === "submit"
            ? "commercial_pricing.propose"
            : "commercial_pricing.approve";

        const authorized = await hasStaffActionPermissionInTransaction(
          transaction,
          db,
          actorUid,
          permission
        );

        if (!authorized) {
          throw new Error(
            "The actor does not have the required active commercial pricing permission"
          );
        }

        let nextState: CommercialPricingWorkflowState;

        switch (action) {
          case "submit":
            if (current.state !== "draft" || version.createdBy !== actorUid) {
              throw new Error(
                "Only the version creator may submit a draft for approval"
              );
            }

            nextState = "pending_approval";
            break;

          case "approve":
            if (
              current.state !== "pending_approval" ||
              current.proposerUid === actorUid
            ) {
              throw new Error(
                "Approval requires an independent approver and a pending version"
              );
            }

            nextState = "approved";
            break;

          case "request_changes":
            if (
              current.state !== "pending_approval" ||
              current.proposerUid === actorUid
            ) {
              throw new Error(
                "Only an independent approver may request changes to a pending version"
              );
            }

            nextState = "changes_requested";
            break;

          case "reject":
            if (
              current.state !== "pending_approval" ||
              current.proposerUid === actorUid
            ) {
              throw new Error(
                "Only an independent approver may reject a pending version"
              );
            }

            nextState = "rejected";
            break;
        }

        const timestamp = serverTimestamp();

        transaction.set(workflowRef, {
          state: nextState,
          proposerUid:
            action === "submit" ? actorUid : current.proposerUid,
          ...(action === "approve" ||
            action === "request_changes" ||
            action === "reject"
            ? { approverUid: actorUid }
            : {}),
          reason:
            action === "request_changes" || action === "reject"
              ? reason!.trim()
              : null,
          ...(workflowDocument.exists
            ? {}
            : {
              createdAt: timestamp,
              createdBy: actorUid,
            }),
          updatedAt: timestamp,
          updatedBy: actorUid,
        });

        transaction.create(eventRef, {
          action,
          actorUid,
          previousState: current.state,
          resultingState: nextState,
          reason:
            action === "request_changes" || action === "reject"
              ? reason!.trim()
              : null,
          timestamp,
        });

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

        return {
          outcome: "transitioned",
          state: nextState,
        } as const;
      });
    },

    async publishVersion(input: {
      definitionId: string;
      versionId: string;
      actorUid: string;
    }): Promise<CommercialPricingPublicationResult> {
      const { definitionId, versionId, actorUid } = input;

      assertDefinitionId(definitionId);
      assertDefinitionId(versionId);
      assertActorUid(actorUid);

      const definitionRef = db
        .collection("commercialPricingDefinitions")
        .doc(definitionId);

      const versionRef = definitionRef.collection("versions").doc(versionId);
      const workflowRef = versionRef.collection("approval").doc("workflow");
      const publicationEventRef = definitionRef
        .collection("publication")
        .doc("events")
        .collection("entries")
        .doc();

      return db.runTransaction(async (transaction) => {
        const [definitionDocument, versionDocument, workflowDocument] =
          await Promise.all([
            transaction.get(definitionRef),
            transaction.get(versionRef),
            transaction.get(workflowRef),
          ]);

        if (!definitionDocument.exists || !versionDocument.exists) {
          return { outcome: "not_found" } as const;
        }

        const lineage =
          definitionDocument.data() as CommercialPricingLineageData;

        const version =
          versionDocument.data() as CommercialPricingVersionData;

        if (
          lineage.currentVersionId !== versionId ||
          lineage.currentVersionNumber !== version.versionNumber ||
          lineage.approvedVersionId !== versionId ||
          lineage.approvedVersionNumber !== version.versionNumber ||
          workflowDocument.data()?.state !== "approved" ||
          typeof version.versionNumber !== "number" ||
          !Number.isSafeInteger(version.versionNumber)
        ) {
          throw new Error(
            "Only the current approved commercial pricing version may be published"
          );
        }

        const authorized = await hasStaffActionPermissionInTransaction(
          transaction,
          db,
          actorUid,
          "commercial_pricing.publish"
        );

        if (!authorized) {
          throw new Error(
            "The actor does not have the required active publication permission"
          );
        }

        const timestamp = serverTimestamp();

        transaction.update(definitionRef, {
          publishedVersionId: versionId,
          publishedVersionNumber: version.versionNumber,
          publishedAt: timestamp,
          publishedBy: actorUid,
          updatedAt: timestamp,
          updatedBy: actorUid,
        });

        transaction.create(publicationEventRef, {
          action: "publish",
          versionId,
          versionNumber: version.versionNumber,
          actorUid,
          timestamp,
        });

        return {
          outcome: "published",
          versionId,
          versionNumber: version.versionNumber,
        } as const;
      });
    },
  };
}
