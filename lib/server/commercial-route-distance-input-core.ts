/**
 * Commercial route-distance evidence contract.
 *
 * This module validates route-distance evidence only.
 * It does not calculate routes, convert units, verify road networks,
 * determine operational movements, or calculate prices.
 */

export type CommercialRouteDistanceMethod =
  | "road_network"
  | "straight_line"
  | "manual";

export interface CommercialRouteDistanceEvidence {
  schemaVersion: 1;
  originOperationalPointRef: string;
  destinationOperationalPointRef: string;
  distance: {
    value: number;
    unit: string;
  };
  method: CommercialRouteDistanceMethod;
  recordedAt: string;
  recordedBy: string;
  source: string;
}

const ROUTE_DISTANCE_METHODS = new Set<CommercialRouteDistanceMethod>([
  "road_network",
  "straight_line",
  "manual",
]);

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;

function assertMap(
  value: unknown,
  label: string
): asserts value is Record<string, unknown> {
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
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  ) {
    throw new TypeError(
      label + " must be an ISO 8601 timestamp with timezone"
    );
  }
}

/**
 * Validates route-distance evidence while preserving its original values
 * and provenance.
 *
 * No distance conversion, route calculation, or verification is performed.
 */
export function assertCommercialRouteDistanceEvidence(
  value: unknown
): asserts value is CommercialRouteDistanceEvidence {
  assertMap(value, "Commercial route-distance evidence");

  const allowedFields = new Set([
    "schemaVersion",
    "originOperationalPointRef",
    "destinationOperationalPointRef",
    "distance",
    "method",
    "recordedAt",
    "recordedBy",
    "source",
  ]);

  if (Object.keys(value).some((key) => !allowedFields.has(key))) {
    throw new TypeError(
      "Commercial route-distance evidence contains an unsupported field"
    );
  }

  if (value.schemaVersion !== 1) {
    throw new TypeError(
      "Commercial route-distance evidence schema version is unsupported"
    );
  }

  assertIdentifier(
    value.originOperationalPointRef,
    "Route origin operational point reference"
  );

  assertIdentifier(
    value.destinationOperationalPointRef,
    "Route destination operational point reference"
  );

  if (
    value.originOperationalPointRef === value.destinationOperationalPointRef
  ) {
    throw new TypeError(
      "Route origin and destination operational points must be different"
    );
  }

  assertMap(value.distance, "Route distance");

  if (
    Object.keys(value.distance).some(
      (key) => key !== "value" && key !== "unit"
    )
  ) {
    throw new TypeError("Route distance contains an unsupported field");
  }

  if (
    typeof value.distance.value !== "number" ||
    !Number.isFinite(value.distance.value) ||
    value.distance.value <= 0
  ) {
    throw new TypeError(
      "Route distance value must be a finite positive number"
    );
  }

  if (
    typeof value.distance.unit !== "string" ||
    !value.distance.unit.trim() ||
    value.distance.unit.length > 40
  ) {
    throw new TypeError(
      "Route distance unit must be a non-empty string"
    );
  }

  if (
    typeof value.method !== "string" ||
    !ROUTE_DISTANCE_METHODS.has(
      value.method as CommercialRouteDistanceMethod
    )
  ) {
    throw new TypeError("Route distance method is unsupported");
  }

  assertTimestamp(value.recordedAt, "Route distance recordedAt");

  assertIdentifier(value.recordedBy, "Route distance recordedBy");

  if (
    typeof value.source !== "string" ||
    !value.source.trim() ||
    value.source.length > 80
  ) {
    throw new TypeError(
      "Route distance source must be a non-empty string"
    );
  }
}