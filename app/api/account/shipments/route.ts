import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
// @ts-ignore The shipment domain is intentionally authored as runtime-neutral ESM.
import { createShipmentCommands } from "@/lib/shipment/commands.mjs";
// @ts-ignore The shipment runtime selects the explicitly configured staging/production project.
import { createShipmentFirestoreRuntime } from "@/lib/shipment/firestore-runtime.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICE_TYPES = ["pudo_to_pudo", "door_to_pudo", "pudo_to_door", "door_to_door"] as const;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function validText(value: unknown, max = 300): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

function validateEndpoint(value: unknown, label: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} endpoint is required.`);
  const endpoint = value as Record<string, unknown>;
  if (endpoint.type === "pudo") {
    if (!validText(endpoint.pudoLocationId, 128) || !ID_PATTERN.test(endpoint.pudoLocationId)) {
      throw new TypeError(`${label} PUDO location is invalid.`);
    }
    return { type: "pudo" as const, pudoLocationId: endpoint.pudoLocationId };
  }
  if (endpoint.type === "address") {
    for (const field of ["country", "state", "city", "addressDescription"]) {
      if (!validText(endpoint[field], field === "addressDescription" ? 500 : 100)) {
        throw new TypeError(`${label} ${field} is required.`);
      }
    }
    return {
      type: "address" as const,
      country: (endpoint.country as string).trim(),
      state: (endpoint.state as string).trim(),
      city: (endpoint.city as string).trim(),
      addressDescription: (endpoint.addressDescription as string).trim(),
    };
  }
  throw new TypeError(`${label} must be a PUDO location or a complete address.`);
}

function validateContact(value: unknown, label: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} details are required.`);
  const contact = value as Record<string, unknown>;
  if (!validText(contact.fullName, 160) || !validText(contact.phone, 40)) {
    throw new TypeError(`${label} name and phone number are required.`);
  }
  if (contact.email !== undefined && contact.email !== null && contact.email !== "" &&
      (!validText(contact.email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()))) {
    throw new TypeError(`${label} email address is invalid.`);
  }
  return {
    fullName: contact.fullName.trim(),
    phone: contact.phone.trim(),
    email: typeof contact.email === "string" && contact.email.trim() ? contact.email.trim().toLowerCase() : null,
    country: validText(contact.country, 100) ? contact.country.trim() : null,
    state: validText(contact.state, 100) ? contact.state.trim() : null,
    city: validText(contact.city, 100) ? contact.city.trim() : null,
    addressDescription: validText(contact.addressDescription, 500) ? contact.addressDescription.trim() : null,
  };
}

function validateParcels(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) throw new TypeError("Add between 1 and 20 parcels.");
  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new TypeError(`Parcel ${index + 1} is invalid.`);
    const parcel = item as Record<string, unknown>;
    const measurements = parcel.measurements;
    if (!measurements || typeof measurements !== "object" || Array.isArray(measurements)) throw new TypeError(`Parcel ${index + 1} dimensions are required.`);
    const dimensions = measurements as Record<string, unknown>;
    if (!validText(parcel.description, 500) ||
        typeof parcel.declaredWeight !== "number" || !Number.isFinite(parcel.declaredWeight) || parcel.declaredWeight <= 0 ||
        !["kg", "g"].includes(String(parcel.weightUnit)) ||
        !["cm", "in"].includes(String(parcel.measurementUnit)) ||
        !["length", "width", "height"].every((key) => typeof dimensions[key] === "number" && Number.isFinite(dimensions[key]) && (dimensions[key] as number) > 0) ||
        (parcel.quantity !== undefined && (!Number.isSafeInteger(parcel.quantity) || (parcel.quantity as number) < 1 || (parcel.quantity as number) > 1000)) ||
        (parcel.declaredValueMinor !== undefined && (!Number.isSafeInteger(parcel.declaredValueMinor) || (parcel.declaredValueMinor as number) < 0))) {
      throw new TypeError(`Parcel ${index + 1} requires a description, positive weight and dimensions, and valid units.`);
    }
    return {
      description: parcel.description.trim(),
      quantity: parcel.quantity ?? 1,
      declaredWeight: parcel.declaredWeight,
      weightUnit: parcel.weightUnit,
      measurements: {
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
      },
      measurementUnit: parcel.measurementUnit,
      declaredValueMinor: parcel.declaredValueMinor ?? 0,
      currency: "NGN",
    };
  });
}


export async function GET(request: Request) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token, checkRevoked) => adminAuth.verifyIdToken(token, checkRevoked),
  );
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });

  try {
    const runtime = createShipmentFirestoreRuntime();
    const snapshot = await runtime.db.collection("verilyftShipmentData").doc("v1")
      .collection("shipments").where("customerId", "==", customer.uid).limit(100).get();
    const shipments = await Promise.all(snapshot.docs.map(async (document: { id: string; data(): Record<string, unknown>; ref: any }) => {
      const data = document.data();
      const [parcels, events] = await Promise.all([
        runtime.db.collection("verilyftShipmentData").doc("v1").collection("parcels")
          .where("shipmentId", "==", document.id).get(),
        document.ref.collection("events").orderBy("occurredAt", "asc").get(),
      ]);
      return {
        shipmentId: document.id,
        shipmentReference: data.shipmentReference,
        serviceType: data.serviceType,
        status: data.status,
        createdAt: data.createdAt,
        submittedAt: data.submittedAt,
        paymentStatus: data.paymentStatus,
        origin: data.origin,
        destination: data.destination,
        parcels: parcels.docs.map((parcel: { id: string; data(): Record<string, unknown> }) => ({ ...parcel.data(), parcelId: parcel.id })),
        events: events.docs.map((event: { id: string; data(): Record<string, any> }) => {
          const record = event.data();
          return { eventId: event.id, eventType: record.eventType, occurredAt: record.occurredAt, summary: record.summary, visibility: record.visibility };
        }).filter((event: Record<string, any>) => Array.isArray(event.visibility) && event.visibility.includes("customer"))
          .map(({ visibility: _visibility, ...event }: Record<string, any>) => event),
      };
    }));
    shipments.sort((a: any, b: any) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    return NextResponse.json({ success: true, shipments }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Customer shipment history retrieval failed:", error);
    return NextResponse.json({ error: "Unable to retrieve your shipment history." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token, checkRevoked) => adminAuth.verifyIdToken(token, checkRevoked),
  );
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "A valid shipment submission is required." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A valid shipment submission is required." }, { status: 400 });
  }

  try {
    const input = body as Record<string, unknown>;
    const allowed = ["serviceType", "sender", "recipient", "origin", "destination", "parcels"];
    if (Object.keys(input).some((key) => !allowed.includes(key))) throw new TypeError("The shipment contains unsupported fields.");
    if (!SERVICE_TYPES.includes(input.serviceType as typeof SERVICE_TYPES[number])) throw new TypeError("Choose one of the four supported shipment services.");
    const origin = validateEndpoint(input.origin, "Origin");
    const destination = validateEndpoint(input.destination, "Destination");
    const expected: Record<string, [string, string]> = {
      pudo_to_pudo: ["pudo", "pudo"],
      door_to_pudo: ["address", "pudo"],
      pudo_to_door: ["pudo", "address"],
      door_to_door: ["address", "address"],
    };
    const [expectedOrigin, expectedDestination] = expected[input.serviceType as string];
    if (origin.type !== expectedOrigin || destination.type !== expectedDestination) {
      throw new TypeError("The selected origin and destination must match the shipment service.");
    }
    if (origin.type === "pudo" && destination.type === "pudo" && origin.pudoLocationId === destination.pudoLocationId) {
      throw new TypeError("Choose two different PUDO locations for a PUDO-to-PUDO shipment.");
    }

    const runtime = createShipmentFirestoreRuntime();
    for (const endpoint of [origin, destination]) {
      if (endpoint.type !== "pudo") continue;
      const [location, activation] = await Promise.all([
        runtime.db.collection("pudoLocations").doc(endpoint.pudoLocationId).get(),
        runtime.db.collection("pudoLocationActivations").doc(endpoint.pudoLocationId).get(),
      ]);
      if (!location.exists || location.data()?.lifecycle !== "active" ||
          !activation.exists || activation.data()?.status !== "active") {
        return NextResponse.json({ error: "One of the selected PUDO locations is not currently active." }, { status: 409 });
      }
    }

    const idempotencyKey = request.headers.get("idempotency-key")?.trim() || randomUUID();
    if (idempotencyKey.length > 160) throw new TypeError("The shipment submission idempotency key is invalid.");
    const commands = createShipmentCommands({
      ports: runtime.ports,
      idFactory: (prefix: string) => `${prefix}_${randomUUID()}`,
    });
    const result = await commands.submitShipment({
      actor: { type: "customer", id: customer.uid },
      idempotencyKey,
      shipment: {
        serviceType: input.serviceType,
        sender: validateContact(input.sender, "Sender"),
        recipient: validateContact(input.recipient, "Recipient"),
        origin,
        destination,
      },
      parcels: validateParcels(input.parcels),
    });
    return NextResponse.json({ success: true, shipment: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit this shipment.";
    const status = error instanceof TypeError ? 400 : 409;
    if (status === 409) console.error("Canonical customer shipment submission failed:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
