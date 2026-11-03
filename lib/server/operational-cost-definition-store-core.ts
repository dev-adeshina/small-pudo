import type { FieldValue, Firestore } from "firebase-admin/firestore";

export type OperationalCostInputType =
  | "string"
  | "number"
  | "boolean"
  | "date";

export type OperationalCostActivityCode =
  | "ACT-01"
  | "ACT-02"
  | "ACT-03"
  | "ACT-04"
  | "ACT-05"
  | "ACT-06"
  | "ACT-07"
  | "ACT-08"
  | "ACT-09"
  | "ACT-10"
  | "ACT-11";

export interface OperationalCostInputDefinition {
  key: string;
  label: string;
  description?: string;
  valueType: OperationalCostInputType;
  required: boolean;
  source?: string;
  unit?: string;
  precision?: number;
  conversion?: string;
}

export interface OperationalCostComponentInput {
  key: string;
  label: string;
  description?: string;
  amount?: string;
  currencyCode?: string;
  basis?: string;
  treatment?: string;
  evidenceDescription?: string;
}

export interface OperationalCostDefinitionInput {
  activityCode: OperationalCostActivityCode;
  activityName: string;
  activityDescription?: string;
  applicability: "general";
  inputs: OperationalCostInputDefinition[];
  costComponents: OperationalCostComponentInput[];
}

interface OperationalCostDefinitionStoreDependencies {
  db: Firestore;
  serverTimestamp: () => FieldValue;
}

interface DefinitionLineageData {
  currentVersionId?: unknown;
  currentVersionNumber?: unknown;
  approvedVersionId?: unknown;
  approvedVersionNumber?: unknown;
  createdAt?: unknown;
  createdBy?: unknown;
  updatedAt?: unknown;
  updatedBy?: unknown;
}

interface DefinitionVersionData {
  versionNumber?: unknown;
  createdAt?: unknown;
  createdBy?: unknown;
  [key: string]: unknown;
}

export type ReviseOperationalCostDefinitionResult =
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

const INPUT_TYPES = new Set<OperationalCostInputType>([
  "string",
  "number",
  "boolean",
  "date",
]);
const ACTIVITY_CODES = new Set<OperationalCostActivityCode>([
  "ACT-01", "ACT-02", "ACT-03", "ACT-04", "ACT-05", "ACT-06",
  "ACT-07", "ACT-08", "ACT-09", "ACT-10", "ACT-11",
]);

function assertNonEmptyString(
  value: unknown,
  label: string,
  maximumLength = 200
): asserts value is string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > maximumLength
  ) {
    throw new TypeError(`${label} must be a non-empty string of at most ${maximumLength} characters`);
  }
}

function assertPlainMap(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be a map`);
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain map`);
  }
}

function assertOnlyKeys(
  value: object,
  allowedKeys: readonly string[],
  label: string
): void {
  const allowed = new Set(allowedKeys);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new TypeError(`${label} contains an unsupported field`);
  }
}

function assertOptionalString(
  value: unknown,
  label: string,
  maximumLength = 500
): void {
  if (
    value !== undefined &&
    (typeof value !== "string" || value.length > maximumLength)
  ) {
    throw new TypeError(`${label} must be a string of at most ${maximumLength} characters`);
  }
}

function assertDefinitionInput(
  value: OperationalCostDefinitionInput
): void {
  assertPlainMap(value, "An operational cost definition");
  assertOnlyKeys(
    value,
    ["activityCode", "activityName", "activityDescription", "applicability", "inputs", "costComponents"],
    "An operational cost definition"
  );

  if (!ACTIVITY_CODES.has(value.activityCode)) {
    throw new TypeError("Activity code must reference an active catalogue activity (ACT-01 to ACT-11)");
  }
  assertNonEmptyString(value.activityName, "Activity name", 120);
  assertOptionalString(value.activityDescription, "Activity description");

  if (value.applicability !== "general") {
    throw new TypeError("Only general applicability is supported until an authoritative PUDO location identity exists");
  }

  if (!Array.isArray(value.inputs)) {
    throw new TypeError("Activity inputs must be an array");
  }

  const inputKeys = new Set<string>();
  for (const input of value.inputs) {
    assertPlainMap(input, "Each activity input");
    assertOnlyKeys(
      input,
      ["key", "label", "description", "valueType", "required", "source", "unit", "precision", "conversion"],
      "An activity input"
    );

    if (
      typeof input.key !== "string" ||
      !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(input.key)
    ) {
      throw new TypeError("Input keys must be stable identifier strings");
    }
    if (inputKeys.has(input.key)) {
      throw new TypeError("Activity input keys must be unique");
    }
    inputKeys.add(input.key);

    assertNonEmptyString(input.label, "Input label", 120);
    assertOptionalString(input.description, "Input description");

    if (!INPUT_TYPES.has(input.valueType)) {
      throw new TypeError("Activity input value type is unsupported");
    }
    if (typeof input.required !== "boolean") {
      throw new TypeError("Activity input required must be a boolean");
    }

    assertOptionalString(input.source, "Input source", 200);
    assertOptionalString(input.unit, "Input unit", 80);
    assertOptionalString(input.conversion, "Input conversion", 200);

    if (
      input.precision !== undefined &&
      (!Number.isSafeInteger(input.precision) || input.precision < 0)
    ) {
      throw new TypeError("Input precision must be a non-negative safe integer");
    }
    if (input.precision !== undefined && input.valueType !== "number") {
      throw new TypeError("Input precision is only valid for number inputs");
    }
  }

  if (!Array.isArray(value.costComponents)) {
    throw new TypeError("Cost components must be an array");
  }

  const componentKeys = new Set<string>();
  for (const component of value.costComponents) {
    assertPlainMap(component, "Each operational cost component");
    assertOnlyKeys(
      component,
      ["key", "label", "description", "amount", "currencyCode", "basis", "treatment", "evidenceDescription"],
      "An operational cost component"
    );

    if (
      typeof component.key !== "string" ||
      !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(component.key)
    ) {
      throw new TypeError("Cost component keys must be stable identifier strings");
    }
    if (componentKeys.has(component.key)) {
      throw new TypeError("Cost component keys must be unique");
    }
    componentKeys.add(component.key);

    assertNonEmptyString(component.label, "Cost component label", 120);
    assertOptionalString(component.description, "Cost component description");
    assertOptionalString(component.basis, "Cost component basis", 120);
    assertOptionalString(component.treatment, "Cost component treatment", 80);
    assertOptionalString(component.evidenceDescription, "Cost evidence description", 1000);

    if (component.amount !== undefined) {
      if (
        typeof component.amount !== "string" ||
        component.amount.length > 40 ||
        !/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(component.amount)
      ) {
        throw new TypeError("Cost component amount must be a non-negative decimal string");
      }
      assertNonEmptyString(component.currencyCode, "Cost component currency code", 3);
      if (!/^[A-Z]{3}$/.test(component.currencyCode)) {
        throw new TypeError("Cost component currency code must be a three-letter uppercase code");
      }
      assertNonEmptyString(component.basis, "Cost component basis", 120);
    } else if (component.currencyCode !== undefined) {
      if (!/^[A-Z]{3}$/.test(component.currencyCode)) {
        throw new TypeError("Cost component currency code must be a three-letter uppercase code");
      }
    }
  }
}

/**
 * A draft may be incomplete. Submission is the point at which the proposed
 * cost must carry an explicit amount, currency, basis and evidence description.
 */
export function assertOperationalCostDefinitionReadyForSubmission(
  value: unknown
): asserts value is OperationalCostDefinitionInput {
  assertDefinitionInput(value as OperationalCostDefinitionInput);
  const definition = value as OperationalCostDefinitionInput;
  if (definition.costComponents.length === 0) {
    throw new TypeError("At least one cost component is required before submission");
  }
  for (const component of definition.costComponents) {
    if (
      component.amount === undefined ||
      component.currencyCode === undefined ||
      component.basis === undefined ||
      component.evidenceDescription === undefined ||
      !component.evidenceDescription.trim()
    ) {
      throw new TypeError("Each cost component needs an amount, explicit currency, basis and evidence description before submission");
    }
  }
}

function assertActorUid(value: string): void {
  assertNonEmptyString(value, "An actor UID", 128);
}

function assertDefinitionId(value: string): void {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(value)
  ) {
    throw new TypeError("A valid operational cost definition ID is required");
  }
}

function hasAuditedActiveAssignment(value: Record<string, unknown> | undefined): boolean {
  return value?.active === true &&
    typeof value.assignedBy === "string" && Boolean(value.assignedBy.trim()) &&
    typeof value.reason === "string" && Boolean(value.reason.trim()) &&
    Boolean(value.assignedAt);
}

/**
 * Server-side persistence primitives only. These records do not calculate
 * costs, publish configurations or apply them to customer quotations.
 */
export function createOperationalCostDefinitionStore({
  db,
  serverTimestamp,
}: OperationalCostDefinitionStoreDependencies) {
  return {
    async hasPermission(actorUid: string, permissionId: string): Promise<boolean> {
      assertActorUid(actorUid);
      assertNonEmptyString(permissionId, "A staff action permission ID", 128);
      const snapshot = await db.collection("staffActionPermissions")
        .doc(actorUid).collection("permissions").doc(permissionId).get();
      return snapshot.exists && hasAuditedActiveAssignment(snapshot.data());
    },

    async listDefinitions(limit = 50): Promise<Array<Record<string, unknown>>> {
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
        throw new TypeError("Definition list limit must be between 1 and 100");
      }
      const snapshot = await db.collection("operationalCostDefinitions")
        .orderBy("updatedAt", "desc").limit(limit).get();
      return Promise.all(snapshot.docs.map(async (document) => {
        const lineage = document.data();
        const versionId = lineage.currentVersionId;
        if (typeof versionId !== "string") {
          throw new Error("Operational cost definition has an invalid current version reference");
        }
        const version = await document.ref.collection("versions").doc(versionId).get();
        if (!version.exists) {
          throw new Error("Operational cost definition points to a missing current version");
        }
        const workflow = await version.ref.collection("approval").doc("workflow").get();
        return {
          definitionId: document.id,
          ...lineage,
          currentVersion: { versionId, ...version.data() },
          workflow: workflow.exists ? workflow.data() : { state: "draft" },
        };
      }));
    },

    async getDefinition(definitionId: string): Promise<Record<string, unknown> | null> {
      assertDefinitionId(definitionId);
      const definitionRef = db.collection("operationalCostDefinitions").doc(definitionId);
      const lineage = await definitionRef.get();
      if (!lineage.exists) return null;

      const versionsSnapshot = await definitionRef.collection("versions")
        .orderBy("versionNumber", "asc").get();
      const versions = await Promise.all(versionsSnapshot.docs.map(async (version) => {
        const workflowRef = version.ref.collection("approval").doc("workflow");
        const workflow = await workflowRef.get();
        const events = await workflowRef.collection("events").orderBy("timestamp", "asc").get();
        return {
          versionId: version.id,
          ...version.data(),
          workflow: workflow.exists ? workflow.data() : { state: "draft" },
          events: events.docs.map((event) => ({ eventId: event.id, ...event.data() })),
        };
      }));

      return {
        definitionId,
        ...lineage.data(),
        versions,
      };
    },

    async createDefinition(
      actorUid: string,
      input: OperationalCostDefinitionInput
    ): Promise<{
      definitionId: string;
      versionId: string;
      versionNumber: 1;
    }> {
      assertActorUid(actorUid);
      assertDefinitionInput(input);

      const definitionRef = db.collection("operationalCostDefinitions").doc();
      const versionRef = definitionRef.collection("versions").doc();
      const versionData = structuredClone(input);

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
      definition: OperationalCostDefinitionInput;
    }): Promise<ReviseOperationalCostDefinitionResult> {
      const {
        definitionId,
        expectedCurrentVersionNumber,
        actorUid,
        definition,
      } = input;

      assertDefinitionId(definitionId);
      assertActorUid(actorUid);
      assertDefinitionInput(definition);

      if (
        !Number.isSafeInteger(expectedCurrentVersionNumber) ||
        expectedCurrentVersionNumber < 1
      ) {
        throw new TypeError("A valid expected current version number is required");
      }

      const definitionRef = db.collection("operationalCostDefinitions").doc(definitionId);
      const nextVersionRef = definitionRef.collection("versions").doc();
      const versionData = structuredClone(definition);

      return db.runTransaction(async (transaction) => {
        const definitionDocument = await transaction.get(definitionRef);

        if (!definitionDocument.exists) {
          return { outcome: "not_found" } as const;
        }

        const lineage = definitionDocument.data() as DefinitionLineageData;
        const currentVersionId = lineage.currentVersionId;
        const currentVersionNumber = lineage.currentVersionNumber;

        if (
          typeof currentVersionId !== "string" ||
          !/^[A-Za-z0-9_-]{1,128}$/.test(currentVersionId) ||
          typeof currentVersionNumber !== "number" ||
          !Number.isSafeInteger(currentVersionNumber) ||
          currentVersionNumber < 1
        ) {
          throw new Error("Operational cost definition lineage is invalid");
        }

        if (currentVersionNumber !== expectedCurrentVersionNumber) {
          return {
            outcome: "stale_version",
            currentVersionId,
            currentVersionNumber,
          } as const;
        }

        const currentVersionRef = definitionRef.collection("versions").doc(currentVersionId);
        const currentVersionDocument = await transaction.get(currentVersionRef);

        if (!currentVersionDocument.exists) {
          throw new Error("Operational cost definition points to a missing current version");
        }

        const currentVersion = currentVersionDocument.data() as DefinitionVersionData;
        if (currentVersion.versionNumber !== currentVersionNumber) {
          throw new Error("Operational cost definition version number does not match its lineage");
        }

        const currentWorkflowRef = currentVersionRef.collection("approval").doc("workflow");
        const currentWorkflowDocument = await transaction.get(currentWorkflowRef);
        const currentWorkflowState = currentWorkflowDocument.exists
          ? currentWorkflowDocument.data()?.state
          : "draft";
        if (!["draft", "changes_requested", "approved"].includes(currentWorkflowState)) {
          throw new Error("An operational cost definition version cannot be revised while review is in progress or after rejection");
        }

        const nextVersionNumber = currentVersionNumber + 1;
        if (!Number.isSafeInteger(nextVersionNumber)) {
          throw new Error("Next operational cost definition version is out of range");
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
  };
}
