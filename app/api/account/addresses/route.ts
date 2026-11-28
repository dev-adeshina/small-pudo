import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
// @ts-expect-error -- Shipment Firestore runtime is an ESM domain module.
import { createShipmentFirestoreRuntime } from "@/lib/shipment/firestore-runtime.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADDRESS_FIELDS = ["label", "fullName", "phone", "email", "country", "state", "city", "addressDescription"] as const;

function parseAddress(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Enter a valid saved address.");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !ADDRESS_FIELDS.includes(key as typeof ADDRESS_FIELDS[number]))) {
    throw new TypeError("The address contains an unsupported field.");
  }
  const result: Record<string, string> = {};
  for (const field of ADDRESS_FIELDS) {
    const raw = input[field];
    const required = field !== "email";
    if (raw === undefined || raw === null || raw === "") {
      if (required) throw new TypeError(`${field} is required.`);
      continue;
    }
    if (typeof raw !== "string" || raw.trim().length > (field === "addressDescription" ? 500 : field === "email" ? 254 : 160)) {
      throw new TypeError(`${field} is invalid.`);
    }
    result[field] = raw.trim();
  }
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) {
    throw new TypeError("Enter a valid email address.");
  }
  return result;
}

async function authenticate(request: Request) {
  return authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token, checkRevoked) => adminAuth.verifyIdToken(token, checkRevoked),
  );
}

export async function GET(request: Request) {
  const customer = await authenticate(request);
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });
  try {
    const runtime = createShipmentFirestoreRuntime();
    const snapshot = await runtime.db.collection("users").doc(customer.uid)
      .collection("shipmentAddressBook").orderBy("updatedAt", "desc").limit(100).get();
    const addresses = snapshot.docs.map((document: { id: string; data(): Record<string, unknown> }) => ({
      ...document.data(),
      addressId: document.id,
    }));
    return NextResponse.json({ success: true, addresses }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Customer address book retrieval failed:", error);
    return NextResponse.json({ error: "Unable to retrieve your saved addresses." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const customer = await authenticate(request);
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "A valid address is required." }, { status: 400 }); }
  try {
    const address = parseAddress(body);
    const runtime = createShipmentFirestoreRuntime();
    const userRef = runtime.db.collection("users").doc(customer.uid);
    const addressRef = userRef.collection("shipmentAddressBook").doc(`address_${randomUUID()}`);
    const user = await userRef.get();
    if (!user.exists) return NextResponse.json({ error: "The customer account could not be found." }, { status: 404 });
    const now = new Date().toISOString();
    await addressRef.create({ ...address, createdAt: now, updatedAt: now });
    return NextResponse.json({ success: true, address: { ...address, addressId: addressRef.id, createdAt: now, updatedAt: now } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save this address.";
    return NextResponse.json({ error: message }, { status: error instanceof TypeError ? 400 : 500 });
  }
}
