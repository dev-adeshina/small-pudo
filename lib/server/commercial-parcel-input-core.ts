/**
 * Parcel measurement evidence contract.
 *
 * This module validates evidence only. It does not convert units, classify
 * parcel size/weight, calculate volumetric weight, or determine a price.
 */

export type CommercialParcelMeasurementName =
  | "weight"
  | "length"
  | "width"
  | "height";

export interface CommercialParcelMeasurement {
  value: number;
  unit: string;
}

export interface CommercialParcelMeasurementEvidence {
  measurements: Partial<Record<CommercialParcelMeasurementName, CommercialParcelMeasurement>>;
  recordedAt: string;
  recordedBy: string;
  source: string;
  operationalPointRef?: string;
}

export interface CommercialParcelHandlingCharacteristic {
  code: string;
  value: string | boolean;
}

export interface CommercialParcelInput {
  schemaVersion: 1;
  declared?: CommercialParcelMeasurementEvidence;
  actual?: CommercialParcelMeasurementEvidence;
  handlingCharacteristics: CommercialParcelHandlingCharacteristic[];
}

const MEASUREMENT_NAMES = new Set(["weight", "length", "width", "height"]);
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const MAX_CHARACTERISTICS = 50;

function assertMap(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(label + " must be an object");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(label + " must be a plain object");
  }
}

function assertIdentifier(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    throw new TypeError(label + " must be a valid non-empty identifier");
  }
}

function assertTimestamp(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
      !Number.isFinite(Date.parse(value))) {
    throw new TypeError(label + " must be an ISO 8601 timestamp with timezone");
  }
}

function assertEvidence(value: unknown, label: string): asserts value is CommercialParcelMeasurementEvidence {
  assertMap(value, label);
  const allowed = new Set(["measurements", "recordedAt", "recordedBy", "source", "operationalPointRef"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new TypeError(label + " contains an unsupported field");
  }

  assertMap(value.measurements, label + " measurements");
  const measurementKeys = Object.keys(value.measurements);
  if (measurementKeys.length === 0 ||
      measurementKeys.some((key) => !MEASUREMENT_NAMES.has(key))) {
    throw new TypeError(label + " must contain at least one supported measurement");
  }
  for (const name of measurementKeys) {
    const measurement = value.measurements[name];
    assertMap(measurement, label + " " + name);
    if (Object.keys(measurement).some((key) => key !== "value" && key !== "unit")) {
      throw new TypeError(label + " " + name + " contains an unsupported field");
    }
    if (typeof measurement.value !== "number" || !Number.isFinite(measurement.value) ||
        measurement.value <= 0) {
      throw new TypeError(label + " " + name + " value must be a finite positive number");
    }
    if (typeof measurement.unit !== "string" || !measurement.unit.trim() ||
        measurement.unit.length > 40) {
      throw new TypeError(label + " " + name + " unit must be a non-empty string");
    }
  }

  assertTimestamp(value.recordedAt, label + " recordedAt");
  assertIdentifier(value.recordedBy, label + " recordedBy");
  if (typeof value.source !== "string" || !value.source.trim() || value.source.length > 80) {
    throw new TypeError(label + " source must be a non-empty string");
  }
  if (value.operationalPointRef !== undefined) {
    assertIdentifier(value.operationalPointRef, label + " operationalPointRef");
  }
}

/**
 * Validates declared and actual parcel evidence while preserving both records.
 * Missing measurements remain absent; they are never defaulted to zero.
 */
export function assertCommercialParcelInput(value: unknown): asserts value is CommercialParcelInput {
  assertMap(value, "Commercial parcel input");
  if (Object.keys(value).some((key) =>
    key !== "schemaVersion" && key !== "declared" &&
    key !== "actual" && key !== "handlingCharacteristics"
  )) {
    throw new TypeError("Commercial parcel input contains an unsupported field");
  }
  if (value.schemaVersion !== 1) {
    throw new TypeError("Commercial parcel input schema version is unsupported");
  }
  if (value.declared === undefined && value.actual === undefined) {
    throw new TypeError("Commercial parcel input requires declared or actual measurement evidence");
  }
  if (value.declared !== undefined) assertEvidence(value.declared, "Declared parcel evidence");
  if (value.actual !== undefined) assertEvidence(value.actual, "Actual parcel evidence");

  if (!Array.isArray(value.handlingCharacteristics) ||
      value.handlingCharacteristics.length > MAX_CHARACTERISTICS) {
    throw new TypeError("Handling characteristics must be an array of at most 50 entries");
  }
  const seen = new Set<string>();
  for (const characteristic of value.handlingCharacteristics) {
    assertMap(characteristic, "A parcel handling characteristic");
    if (Object.keys(characteristic).some((key) => key !== "code" && key !== "value")) {
      throw new TypeError("Parcel handling characteristic contains an unsupported field");
    }
    assertIdentifier(characteristic.code, "Handling characteristic code");
    if (seen.has(characteristic.code)) {
      throw new TypeError("Handling characteristic codes must be unique");
    }
    seen.add(characteristic.code);
    if (typeof characteristic.value !== "string" && typeof characteristic.value !== "boolean") {
      throw new TypeError("Handling characteristic value must be a string or boolean");
    }
    if (typeof characteristic.value === "string" &&
        (!characteristic.value.trim() || characteristic.value.length > 120)) {
      throw new TypeError("Handling characteristic text value must be non-empty and at most 120 characters");
    }
  }
}
