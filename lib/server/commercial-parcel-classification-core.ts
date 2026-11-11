/**
 * Parcel classification evidence contract.
 *
 * Classification records describe observed or declared parcel characteristics.
 * They do not infer bands from measurements or create commercial effects.
 */

export type CommercialParcelClassificationGroup = "handling" | "size" | "other";
export type CommercialParcelClassificationStatus = "present" | "absent" | "not_assessed";

export interface CommercialParcelClassificationEvidence {
  recordedAt: string;
  recordedBy: string;
  source: string;
}

export interface CommercialParcelClassification {
  code: string;
  group: CommercialParcelClassificationGroup;
  status: CommercialParcelClassificationStatus;
  evidence?: CommercialParcelClassificationEvidence;
}

export interface CommercialParcelClassificationInput {
  schemaVersion: 1;
  classifications: CommercialParcelClassification[];
}

export const COMMERCIAL_PARCEL_CLASSIFICATION_CATALOGUE: ReadonlyArray<{
  code: string;
  group: CommercialParcelClassificationGroup;
}> = [
  { code: "fragile", group: "handling" },
  { code: "durable", group: "handling" },
  { code: "bulky", group: "handling" },
  { code: "small", group: "size" },
  { code: "large", group: "size" },
];

const CODE_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/;
const MAX_CLASSIFICATIONS = 50;

function assertMap(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(label + " must be an object");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(label + " must be a plain object");
  }
}

function assertTimestamp(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
      !Number.isFinite(Date.parse(value))) {
    throw new TypeError(label + " must be an ISO 8601 timestamp with timezone");
  }
}

function assertEvidence(value: unknown): asserts value is CommercialParcelClassificationEvidence {
  assertMap(value, "Classification evidence");
  if (Object.keys(value).some((key) =>
    key !== "recordedAt" && key !== "recordedBy" && key !== "source"
  )) {
    throw new TypeError("Classification evidence contains an unsupported field");
  }
  assertTimestamp(value.recordedAt, "Classification evidence recordedAt");
  if (typeof value.recordedBy !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/.test(value.recordedBy)) {
    throw new TypeError("Classification evidence recordedBy must be a valid actor reference");
  }
  if (typeof value.source !== "string" || !value.source.trim() || value.source.length > 80) {
    throw new TypeError("Classification evidence source must be a non-empty string");
  }
}

/**
 * Validates explicit parcel classification evidence.
 *
 * Omitted classifications and "not_assessed" mean unknown, never absent.
 * Initial labels are a catalogue, not a closed set: additional stable codes
 * may be added using the "other" group. No classification affects price or
 * service eligibility through this contract.
 */
export function assertCommercialParcelClassification(
  value: unknown
): asserts value is CommercialParcelClassificationInput {
  assertMap(value, "Commercial parcel classification");
  if (Object.keys(value).some((key) => key !== "schemaVersion" && key !== "classifications")) {
    throw new TypeError("Commercial parcel classification contains an unsupported field");
  }
  if (value.schemaVersion !== 1) {
    throw new TypeError("Commercial parcel classification schema version is unsupported");
  }
  if (!Array.isArray(value.classifications) || value.classifications.length > MAX_CLASSIFICATIONS) {
    throw new TypeError("Parcel classifications must be an array of at most 50 entries");
  }

  const seen = new Set<string>();
  for (const item of value.classifications) {
    assertMap(item, "A parcel classification");
    if (Object.keys(item).some((key) =>
      key !== "code" && key !== "group" && key !== "status" && key !== "evidence"
    )) {
      throw new TypeError("Parcel classification contains an unsupported field");
    }
    if (typeof item.code !== "string" || !CODE_PATTERN.test(item.code)) {
      throw new TypeError("Parcel classification code must be a stable lowercase identifier");
    }
    if (seen.has(item.code)) {
      throw new TypeError("Parcel classification codes must be unique");
    }
    seen.add(item.code);

    if (!["handling", "size", "other"].includes(String(item.group))) {
      throw new TypeError("Parcel classification group is unsupported");
    }
    const catalogueItem = COMMERCIAL_PARCEL_CLASSIFICATION_CATALOGUE.find(
      (entry) => entry.code === item.code
    );
    if (catalogueItem && catalogueItem.group !== item.group) {
      throw new TypeError("Parcel classification group does not match its catalogue definition");
    }
    if (!["present", "absent", "not_assessed"].includes(String(item.status))) {
      throw new TypeError("Parcel classification status is unsupported");
    }

    if (item.status === "not_assessed") {
      if (item.evidence !== undefined) {
        throw new TypeError("A not-assessed classification cannot contain assessment evidence");
      }
    } else {
      if (item.evidence === undefined) {
        throw new TypeError("An assessed classification requires provenance evidence");
      }
      assertEvidence(item.evidence);
    }
  }
}
