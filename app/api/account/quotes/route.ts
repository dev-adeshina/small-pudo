import { NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
// @ts-ignore Shipment Firestore runtime is an ESM domain module.
import { createShipmentFirestoreRuntime } from "@/lib/shipment/firestore-runtime.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token, checkRevoked) => adminAuth.verifyIdToken(token, checkRevoked),
  );
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });

  try {
    const runtime = createShipmentFirestoreRuntime();
    const shipments = await runtime.db.collection("verilyftShipmentData").doc("v1").collection("shipments")
      .where("customerId", "==", customer.uid).limit(100).get();
    const quotes = await Promise.all(shipments.docs.map(async (shipment: { id: string; data(): Record<string, any> }) => {
      const data = shipment.data();
      if (typeof data.quoteId !== "string" || !data.quoteId) return null;
      const lineageRef = runtime.db.collection("verilyftShipmentData").doc("v1").collection("quoteLineages").doc(data.quoteId);
      const lineage = await lineageRef.get();
      if (!lineage.exists) return null;
      const lineageData = lineage.data() ?? {};
      if (lineageData.status !== "active" || typeof lineageData.currentRevisionId !== "string") return null;
      const revision = await lineageRef.collection("revisions").doc(lineageData.currentRevisionId).get();
      if (!revision.exists) return null;
      const quoteRevision = revision.data()!;
      return {
        quoteId: data.quoteId,
        shipmentId: shipment.id,
        shipmentReference: data.shipmentReference,
        shipmentStatus: data.status,
        accepted: data.acceptedQuoteRevisionId === revision.id,
        revision: {
          revisionId: revision.id,
          revisionNumber: quoteRevision.revisionNumber,
          currency: quoteRevision.currency,
          totalMinor: quoteRevision.totalMinor,
          validUntil: quoteRevision.validUntil,
          issuedAt: quoteRevision.issuedAt,
          distanceKm: quoteRevision.distanceKm,
          lineItems: quoteRevision.lineItems,
        },
      };
    }));
    return NextResponse.json({
      success: true,
      quotes: quotes.filter(Boolean).sort((a: any, b: any) => String(b.revision.issuedAt).localeCompare(String(a.revision.issuedAt))),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Customer canonical quote retrieval failed:", error);
    return NextResponse.json({ error: "Unable to retrieve your shipment quotations." }, { status: 500 });
  }
}
