import { NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
import { shipmentQuoteStore } from "@/lib/server/shipment-quote-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token) => adminAuth.verifyIdToken(token),
  );
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });

  try {
    const quotes = await shipmentQuoteStore.listCustomerQuotes(customer.uid);
    return NextResponse.json({ success: true, quotes });
  } catch {
    return NextResponse.json({ error: "Unable to retrieve your quotations." }, { status: 500 });
  }
}
