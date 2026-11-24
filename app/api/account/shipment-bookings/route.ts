import { NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
import { shipmentQuoteStore } from "@/lib/server/shipment-quote-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token) => adminAuth.verifyIdToken(token),
  );
  if (!customer.success) {
    return NextResponse.json({ error: customer.error }, { status: customer.status });
  }

  try {
    const bookings = await shipmentQuoteStore.listCustomerBookings(customer.uid);
    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    console.error("Customer shipment booking history could not be loaded:", error);
    return NextResponse.json({ error: "Unable to retrieve your shipment bookings." }, { status: 500 });
  }
}
