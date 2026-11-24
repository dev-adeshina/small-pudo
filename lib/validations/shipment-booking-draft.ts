export interface ShipmentBookingDraftMeasurement {
  value: number;
  unit: string;
}

export interface ShipmentBookingContact {
  name: string;
  phone: string;
  email?: string;
}

export interface ShipmentBookingDraftInput {
  serviceCode?: "standard" | "express" | "scheduled";
  sender?: ShipmentBookingContact;
  recipient?: ShipmentBookingContact;
  originHandoverMode?: "door_pickup" | "pudo_presentation";
  origin: string;
  destination: string;
  originPudoLocationId?: string;
  destinationPudoLocationId?: string;
  parcelDescription: string;
  declaredMeasurements?: Partial<Record<"weight" | "length" | "width" | "height", ShipmentBookingDraftMeasurement>>;
  parcelCharacteristics?: Record<string, string>;
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
    !["serviceCode", "sender", "recipient", "originHandoverMode", "origin", "destination", "originPudoLocationId", "destinationPudoLocationId", "parcelDescription", "declaredMeasurements", "parcelCharacteristics"].includes(key)
  )) {
    return { success: false, error: "The shipment draft contains an unsupported field." };
  }

  const serviceCode = candidate.serviceCode === undefined ? "standard" :
    candidate.serviceCode === "standard" || candidate.serviceCode === "express" || candidate.serviceCode === "scheduled"
      ? candidate.serviceCode : null;
  if (serviceCode === null) {
    return { success: false, error: "Choose a supported shipment quotation service." };
  }
  const origin = typeof candidate.origin === "string" ? candidate.origin.trim() : "";
  const destination = typeof candidate.destination === "string" ? candidate.destination.trim() : "";
  const parcelDescription = typeof candidate.parcelDescription === "string"
    ? candidate.parcelDescription.trim() : "";
  const originHandoverMode = candidate.originHandoverMode === undefined
    ? (typeof candidate.originPudoLocationId === "string" && candidate.originPudoLocationId ? "pudo_presentation" : "door_pickup")
    : candidate.originHandoverMode === "door_pickup" || candidate.originHandoverMode === "pudo_presentation"
      ? candidate.originHandoverMode : null;
  if (originHandoverMode === null) {
    return { success: false, error: "Choose door pickup or PUDO presentation for the shipment origin." };
  }

  function parseContact(value: unknown): ShipmentBookingContact | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const contact = value as Record<string, unknown>;
    if (Object.keys(contact).some((key) => !["name", "phone", "email"].includes(key))) return null;
    const name = typeof contact.name === "string" ? contact.name.trim() : "";
    const phone = typeof contact.phone === "string" ? contact.phone.trim() : "";
    const email = typeof contact.email === "string" ? contact.email.trim() : "";
    if (!name || name.length > 120 || !phone || phone.length > 40 ||
        (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))) return null;
    return { name, phone, ...(email ? { email } : {}) };
  }
  const hasSender = candidate.sender !== undefined;
  const hasRecipient = candidate.recipient !== undefined;
  if (hasSender !== hasRecipient) {
    return { success: false, error: "Enter both sender and recipient details together." };
  }
  const sender = hasSender ? parseContact(candidate.sender) : undefined;
  const recipient = hasRecipient ? parseContact(candidate.recipient) : undefined;
  if ((hasSender && !sender) || (hasRecipient && !recipient)) {
    return { success: false, error: "Enter a valid sender and recipient name and phone number. Email addresses are optional." };
  }
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
  if (originHandoverMode === "pudo_presentation" && !originPudoLocationId) {
    return { success: false, error: "Select an active origin PUDO for PUDO presentation." };
  }
  if (originHandoverMode === "door_pickup" && originPudoLocationId) {
    return { success: false, error: "Remove the origin PUDO selection when door pickup is selected." };
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

  let parcelCharacteristics: Record<string, string> | undefined;
  if (candidate.parcelCharacteristics !== undefined) {
    const raw = candidate.parcelCharacteristics;
    if (raw === null || typeof raw !== "object" || Array.isArray(raw) ||
        Object.getPrototypeOf(raw) !== Object.prototype && Object.getPrototypeOf(raw) !== null) {
      return { success: false, error: "Parcel characteristics must be a category-to-option selection map." };
    }
    const entries = raw as Record<string, unknown>;
    if (Object.keys(entries).length > 30) {
      return { success: false, error: "Too many parcel characteristic selections were supplied." };
    }
    parcelCharacteristics = {};
    for (const [categoryKey, optionKey] of Object.entries(entries)) {
      if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(categoryKey) ||
          typeof optionKey !== "string" || !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(optionKey)) {
        return { success: false, error: "A parcel characteristic selection is invalid." };
      }
      parcelCharacteristics[categoryKey] = optionKey;
    }
    if (Object.keys(parcelCharacteristics).length === 0) parcelCharacteristics = undefined;
  }

  return {
    success: true,
    data: {
      serviceCode,
      ...(sender ? { sender } : {}),
      ...(recipient ? { recipient } : {}),
      ...(candidate.originHandoverMode !== undefined || originPudoLocationId ? { originHandoverMode } : {}),
      origin,
      destination,
      ...(originPudoLocationId ? { originPudoLocationId } : {}),
      ...(destinationPudoLocationId ? { destinationPudoLocationId } : {}),
      parcelDescription,
      ...(declaredMeasurements ? { declaredMeasurements } : {}),
      ...(parcelCharacteristics ? { parcelCharacteristics } : {}),
    },
  };
}
