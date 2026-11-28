import { NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
import { createShipmentFirestoreRuntime } from "@/lib/shipment/firestore-runtime.mjs";

export const runtime = "nodejs";

type Context = { params: Promise<{ addressId: string }> };
const FIELDS = ["label", "fullName", "phone", "email", "country", "state", "city", "addressDescription"] as const;

function parseAddress(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Enter a valid saved address.");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !FIELDS.includes(key as typeof FIELDS[number]))) throw new TypeError("The address contains an unsupported field.");
  const result: Record<string, string> = {};
  for (const field of FIELDS) {
    const raw = input[field];
    if ((raw === undefined || raw === null || raw === "") && field === "email") continue;
    if (typeof raw !== "string" || !raw.trim() || raw.trim().length > (field === "addressDescription" ? 500 : field === "email" ? 254 : 160)) {
      throw new TypeError(`${field} is required or invalid.`);
    }
    result[field] = raw.trim();
  }
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) throw new TypeError("Enter a valid email address.");
  return result;
}

async function authenticate(request: Request) {
  return authenticateVerifiedCustomer(request.headers.get("authorization"), (token, checkRevoked) => adminAuth.verifyIdToken(token, checkRevoked));
}

export async function PATCH(request: Request, context: Context) {
  const customer = await authenticate(request);
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });
  const { addressId } = await context.params;
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(addressId)) return NextResponse.json({ error: "Saved address not found." }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "A valid address is required." }, { status: 400 }); }
  try {
    const address = parseAddress(body);
    const runtime = createShipmentFirestoreRuntime();
    const ref = runtime.db.collection("users").doc(customer.uid).collection("shipmentAddressBook").doc(addressId);
    const updatedAt = new Date().toISOString();
    // A single write avoids an extra Firestore round trip on every address edit.
    await ref.update({ ...address, updatedAt });
    return NextResponse.json({ success: true, address: { ...address, addressId, updatedAt } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update this address.";
    return NextResponse.json({ error: message }, { status: error instanceof TypeError ? 400 : 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const customer = await authenticate(request);
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });
  const { addressId } = await context.params;
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(addressId)) return NextResponse.json({ error: "Saved address not found." }, { status: 404 });
  try {
    const runtime = createShipmentFirestoreRuntime();
    const ref = runtime.db.collection("users").doc(customer.uid).collection("shipmentAddressBook").doc(addressId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ error: "Saved address not found." }, { status: 404 });
    await ref.delete();
    return NextResponse.json({ success: true, addressId });
  } catch (error) {
    console.error("Customer address deletion failed:", error);
    return NextResponse.json({ error: "Unable to remove this saved address." }, { status: 500 });
  }
}
