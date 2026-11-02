import type { FieldValue, Firestore } from "firebase-admin/firestore";

export type OperationalCostInputType =
  | "string"
  | "number"
  | "boolean"
  | "date";

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

export interface OperationalCostDefinitionInput {
  activityName: string;
  activityDescription?: string;
  inputs: OperationalCostInputDefinition[];
}

interface OperationalCostDefinitionStoreDependencies {
  db: Firestore;
  serverTimestamp: () => FieldValue;
}

interface DefinitionLineageData {
  currentVersionId?: unknown;
  currentVersionNumber?: unknown;
}

interface DefinitionVersionData {
  versionNumber?: unknown;
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
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("An operational cost definition must be a map");
  }

  assertNonEmptyString(value.activityName, "Activity name", 120);
  assertOptionalString(value.activityDescription, "Activity description");

  if (!Array.isArray(value.inputs)) {
    throw new TypeError("Activity inputs must be an array");
  }

  const keys = new Set<string>();

  for (const input of value.inputs) {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError("Each activity input must be a map");
    }

    if (
      typeof input.key !== "string" ||
      !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(input.key)
    ) {
      throw new TypeError("Input keys must be stable identifier strings");
    }
    if (keys.has(input.key)) {
      throw new TypeError("Activity input keys must be unique");
    }
    keys.add(input.key);

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

/**
 * Server-side persistence primitives only.
 *
 * Definitions and versions are configuration records, not approved or active
 * cost rules. This store does not calculate costs, publish configurations,
 * authorize staff roles, expose an API, or apply data to customer quotations.
 */
export function createOperationalCostDefinitionStore({
  db,
  serverTimestamp,
}: OperationalCostDefinitionStoreDependencies) {
  return {
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

      const definitionRef = db
        .collection("operationalCostDefinitions")
        .doc(definitionId);
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
          !Number.isSafeInteger(currentVersionNumber) ||
          typeof currentVersionNumber !== "number" ||
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

        const currentVersionRef = definitionRef
          .collection("versions")
          .doc(currentVersionId);
        const currentVersionDocument =
          await transaction.get(currentVersionRef);

        if (!currentVersionDocument.exists) {
          throw new Error(
            "Operational cost definition points to a missing current version"
          );
        }

        const currentVersion =
          currentVersionDocument.data() as DefinitionVersionData;
        if (currentVersion.versionNumber !== currentVersionNumber) {
          throw new Error(
            "Operational cost definition version number does not match its lineage"
          );
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
