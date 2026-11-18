/**
 * Commercial route-distance evidence contract.
 *
 * Evidence records measurements and provenance only. It does not calculate
 * road routes, convert units, verify providers, determine operations or price.
 */
export type CommercialRouteDistanceMethod = "road_network" | "straight_line" | "manual";

export interface CommercialRouteDistanceEvidence {
  schemaVersion: 1;
  originOperationalPointRef: string;
  destinationOperationalPointRef: string;
  distance: { value: number; unit: string };
  method: CommercialRouteDistanceMethod;
  recordedAt: string;
  recordedBy: string;
  source: string;
  /** Date the measurement itself was made (distinct from recordedAt). */
  measuredOn?: string;
  /** External document, map result, route identifier or other supporting reference. */
  supportingReference?: string;
  /** Immutable WGS84 inputs used for a straight-line calculation. */
  coordinatesUsed?: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    coordinateReferenceSystem: "WGS84";
    calculation: "Haversine";
  };
}

const METHODS = new Set<CommercialRouteDistanceMethod>(["road_network", "straight_line", "manual"]);
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const UNITS = new Set(["m", "km", "mi"]);

function assertMap(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(label + " must be an object");
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(label + " must be a plain object");
}
function assertIdentifier(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) throw new TypeError(label + " must be a valid non-empty identifier");
}
function assertTimestamp(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) {
    throw new TypeError(label + " must be an ISO 8601 timestamp with timezone");
  }
}
function assertCoordinate(value: unknown, label: string): asserts value is {latitude:number;longitude:number} {
  assertMap(value, label);
  if (Object.keys(value).some(k => k !== "latitude" && k !== "longitude") ||
    typeof value.latitude !== "number" || !Number.isFinite(value.latitude) || value.latitude < -90 || value.latitude > 90 ||
    typeof value.longitude !== "number" || !Number.isFinite(value.longitude) || value.longitude < -180 || value.longitude > 180) {
    throw new TypeError(label + " must contain valid WGS84 latitude and longitude");
  }
}
export function assertCommercialRouteDistanceEvidence(value: unknown): asserts value is CommercialRouteDistanceEvidence {
  assertMap(value, "Commercial route-distance evidence");
  const allowed = new Set(["schemaVersion","originOperationalPointRef","destinationOperationalPointRef","distance","method","recordedAt","recordedBy","source","measuredOn","supportingReference","coordinatesUsed"]);
  if (Object.keys(value).some(k => !allowed.has(k))) throw new TypeError("Commercial route-distance evidence contains an unsupported field");
  if (value.schemaVersion !== 1) throw new TypeError("Commercial route-distance evidence schema version is unsupported");
  assertIdentifier(value.originOperationalPointRef, "Route origin operational point reference");
  assertIdentifier(value.destinationOperationalPointRef, "Route destination operational point reference");
  if (value.originOperationalPointRef === value.destinationOperationalPointRef) throw new TypeError("Route origin and destination operational points must be different");
  assertMap(value.distance, "Route distance");
  if (Object.keys(value.distance).some(k => k !== "value" && k !== "unit") || typeof value.distance.value !== "number" || !Number.isFinite(value.distance.value) || value.distance.value <= 0 || typeof value.distance.unit !== "string" || !UNITS.has(value.distance.unit)) {
    throw new TypeError("Route distance must contain a positive finite value and a supported unit (m, km or mi)");
  }
  if (typeof value.method !== "string" || !METHODS.has(value.method as CommercialRouteDistanceMethod)) throw new TypeError("Route distance method is unsupported");
  if (value.method === "straight_line" && value.distance.unit !== "m") throw new TypeError("Straight-line distance must be recorded in metres");
  assertTimestamp(value.recordedAt, "Route distance recordedAt");
  assertIdentifier(value.recordedBy, "Route distance recordedBy");
  if (typeof value.source !== "string" || !value.source.trim() || value.source.trim().length > 120) throw new TypeError("Route distance source must be a non-empty value of at most 120 characters");
  if (value.measuredOn !== undefined && (typeof value.measuredOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.measuredOn) || Number.isNaN(Date.parse(value.measuredOn + "T00:00:00Z")))) {
    throw new TypeError("Measurement date must be a valid calendar date");
  }
  if (value.supportingReference !== undefined && (typeof value.supportingReference !== "string" || !value.supportingReference.trim() || value.supportingReference.trim().length > 200)) throw new TypeError("Supporting reference must be 1–200 characters");
  if (value.coordinatesUsed !== undefined) {
    assertMap(value.coordinatesUsed, "Coordinates used");
    if (Object.keys(value.coordinatesUsed).some(k => !["origin","destination","coordinateReferenceSystem","calculation"].includes(k)) ||
      value.coordinatesUsed.coordinateReferenceSystem !== "WGS84" || value.coordinatesUsed.calculation !== "Haversine") throw new TypeError("Straight-line coordinate metadata is invalid");
    assertCoordinate(value.coordinatesUsed.origin, "Origin coordinates");
    assertCoordinate(value.coordinatesUsed.destination, "Destination coordinates");
  }
  if (value.method === "straight_line" && !value.coordinatesUsed) {
    // Legacy schema-1 records remain readable; new writes always include coordinatesUsed.
  }
}
