export interface ShipmentBookingDraftMeasurement {
  value: number;
  unit: string;
}

export interface ShipmentBookingDraftInput {
  origin: string;
  destination: string;
  originPudoLocationId?: string;
  destinationPudoLocationId?: string;
  parcelDescription: string;
  declaredMeasurements?: Partial<Record<"weight" | "length" | "width" | "height", ShipmentBookingDraftMeasurement>>;
}

export type ShipmentBookingDraftValidation =
  | { success: true; data: ShipmentBookingDraftInput }
  | { success: false; error: string };

const MEASUREMENT_NAMES = ["weight", "length", "width", "height"] as const;
const LOCATION_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function validateShipmentBookingDraft(
  body: unknown
): ShipmentBookingDraftValidation {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { success: false, error: "Enter the shipment details before saving." };
  }

  const candidate = body as Record<string, unknown>;
  if (Object.keys(candidate).some((key) =>
    !["origin", "destination", "originPudoLocationId", "destinationPudoLocationId", "parcelDescription", "declaredMeasurements"].includes(key)
  )) {
    return { success: false, error: "The shipment draft contains an unsupported field." };
  }

  const origin = typeof candidate.origin === "string" ? candidate.origin.trim() : "";
  const destination = typeof candidate.destination === "string" ? candidate.destination.trim() : "";
  const parcelDescription = typeof candidate.parcelDescription === "string"
    ? candidate.parcelDescription.trim() : "";
  const rawOriginPudoLocationId = candidate.originPudoLocationId;
  const rawDestinationPudoLocationId = candidate.destinationPudoLocationId;

  if (!origin || !destination || !parcelDescription) {
    return { success: false, error: "Origin, destination and parcel description are required." };
  }
  if (origin.length > 180 || destination.length > 180) {
    return { success: false, error: "Origin and destination must each be 180 characters or fewer." };
  }
  if (parcelDescription.length > 1000) {
    return { success: false, error: "Parcel description must be 1,000 characters or fewer." };
  }
  for (const [value, label] of [
    [rawOriginPudoLocationId, "Origin"],
    [rawDestinationPudoLocationId, "Destination"],
  ] as const) {
    if (value !== undefined && (typeof value !== "string" || !LOCATION_ID.test(value))) {
      return { success: false, error: `${label} PUDO reference is invalid.` };
    }
  }
  const originPudoLocationId = typeof rawOriginPudoLocationId === "string" && rawOriginPudoLocationId !== ""
    ? rawOriginPudoLocationId : undefined;
  const destinationPudoLocationId = typeof rawDestinationPudoLocationId === "string" && rawDestinationPudoLocationId !== ""
    ? rawDestinationPudoLocationId : undefined;

  if (originPudoLocationId && originPudoLocationId === destinationPudoLocationId) {
    return { success: false, error: "Origin and destination PUDO locations must be different." };
  }

  let declaredMeasurements: ShipmentBookingDraftInput["declaredMeasurements"];
  if (candidate.declaredMeasurements !== undefined) {
    const raw = candidate.declaredMeasurements;
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      return { success: false, error: "Declared parcel measurements must be an object." };
    }
    const entries = raw as Record<string, unknown>;
    if (Object.keys(entries).some((key) => !MEASUREMENT_NAMES.includes(key as typeof MEASUREMENT_NAMES[number]))) {
      return { success: false, error: "A declared parcel measurement is unsupported." };
    }
    const parsed: NonNullable<ShipmentBookingDraftInput["declaredMeasurements"]> = {};
    for (const name of MEASUREMENT_NAMES) {
      const item = entries[name];
      if (item === undefined) continue;
      if (item === null || typeof item !== "object" || Array.isArray(item)) {
        return { success: false, error: `Declared ${name} must include a value and unit.` };
      }
      const measurement = item as Record<string, unknown>;
      if (Object.keys(measurement).some((key) => key !== "value" && key !== "unit") ||
          typeof measurement.value !== "number" || !Number.isFinite(measurement.value) ||
          measurement.value <= 0 || typeof measurement.unit !== "string" ||
          !measurement.unit.trim() || measurement.unit.length > 40) {
        return { success: false, error: `Declared ${name} must have a positive value and an explicit unit.` };
      }
      parsed[name] = { value: measurement.value, unit: measurement.unit.trim() };
    }
    if (Object.keys(parsed).length > 0) declaredMeasurements = parsed;
  }

  return {
    success: true,
    data: {
      origin,
      destination,
      ...(originPudoLocationId ? { originPudoLocationId } : {}),
      ...(destinationPudoLocationId ? { destinationPudoLocationId } : {}),
      parcelDescription,
      ...(declaredMeasurements ? { declaredMeasurements } : {}),
    },
  };
}
