export interface ShipmentBookingDraftInput {
  origin: string;
  destination: string;
  parcelDescription: string;
}

export type ShipmentBookingDraftValidation =
  | { success: true; data: ShipmentBookingDraftInput }
  | { success: false; error: string };

export function validateShipmentBookingDraft(
  body: unknown
): ShipmentBookingDraftValidation {
  if (typeof body !== "object" || body === null) {
    return {
      success: false,
      error: "Enter the shipment details before saving.",
    };
  }

  const candidate = body as Record<string, unknown>;
  const origin =
    typeof candidate.origin === "string" ? candidate.origin.trim() : "";
  const destination =
    typeof candidate.destination === "string"
      ? candidate.destination.trim()
      : "";
  const parcelDescription =
    typeof candidate.parcelDescription === "string"
      ? candidate.parcelDescription.trim()
      : "";

  if (!origin || !destination || !parcelDescription) {
    return {
      success: false,
      error: "Origin, destination and parcel description are required.",
    };
  }

  if (origin.length > 180 || destination.length > 180) {
    return {
      success: false,
      error: "Origin and destination must each be 180 characters or fewer.",
    };
  }

  if (parcelDescription.length > 1000) {
    return {
      success: false,
      error: "Parcel description must be 1,000 characters or fewer.",
    };
  }

  return {
    success: true,
    data: { origin, destination, parcelDescription },
  };
}
