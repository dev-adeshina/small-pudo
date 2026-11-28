import { NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
// @ts-expect-error -- Shipment Firestore runtime is an ESM domain module.
import { createShipmentFirestoreRuntime } from "@/lib/shipment/firestore-runtime.mjs";

export const runtime = "nodejs";
type Context = { params: Promise<{ shipmentId: string }> };

export async function GET(request: Request, context: Context) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token, checkRevoked) => adminAuth.verifyIdToken(token, checkRevoked),
  );
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });

  const { shipmentId } = await context.params;
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(shipmentId)) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });

  try {
    const runtime = createShipmentFirestoreRuntime();
    const shipmentRef = runtime.db.collection("verilyftShipmentData").doc("v1").collection("shipments").doc(shipmentId);
    const shipmentSnapshot = await shipmentRef.get();
    if (!shipmentSnapshot.exists || shipmentSnapshot.data()?.customerId !== customer.uid) {
      return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
    }
    const [parcels, events, documents] = await Promise.all([
      runtime.db.collection("verilyftShipmentData").doc("v1").collection("parcels").where("shipmentId", "==", shipmentId).get(),
      shipmentRef.collection("events").orderBy("occurredAt", "asc").get(),
      shipmentRef.collection("documents").orderBy("generatedAt", "asc").get(),
    ]);
    const shipmentData = shipmentSnapshot.data()!;
    const [originPudo, destinationPudo] = await Promise.all([
      shipmentData.origin?.type === "pudo" && typeof shipmentData.origin.pudoLocationId === "string"
        ? runtime.db.collection("pudoLocations").doc(shipmentData.origin.pudoLocationId).get()
        : Promise.resolve(null),
      shipmentData.destination?.type === "pudo" && typeof shipmentData.destination.pudoLocationId === "string"
        ? runtime.db.collection("pudoLocations").doc(shipmentData.destination.pudoLocationId).get()
        : Promise.resolve(null),
    ]);
    const displayEndpoint = (endpoint: Record<string, unknown>, location: { exists: boolean; data(): Record<string, unknown> | undefined } | null) => endpoint.type === "pudo" && location?.exists
      ? {
          ...endpoint,
          locationName: typeof location.data()?.name === "string" ? location.data().name : "PUDO location",
          address: typeof location.data()?.address === "string" ? location.data().address : "",
          city: typeof location.data()?.city === "string" ? location.data().city : "",
          state: typeof location.data()?.state === "string" ? location.data().state : "",
        }
      : endpoint;
    let currentQuote: Record<string, unknown> | null = null;
    if (typeof shipmentData.quoteId === "string") {
      const lineageRef = runtime.db.collection("verilyftShipmentData").doc("v1").collection("quoteLineages").doc(shipmentData.quoteId);
      const lineage = await lineageRef.get();
      const revisionId = lineage.data()?.currentRevisionId;
      if (lineage.exists && lineage.data()?.status === "active" && typeof revisionId === "string") {
        const revision = await lineageRef.collection("revisions").doc(revisionId).get();
        if (revision.exists) {
          const quote = revision.data()!;
          currentQuote = {
            revisionId: revision.id,
            revisionNumber: quote.revisionNumber,
            currency: quote.currency,
            totalMinor: quote.totalMinor,
            lineItems: quote.lineItems,
            distanceKm: quote.distanceKm,
            issuedAt: quote.issuedAt,
            validUntil: quote.validUntil,
          };
        }
      }
    }
    return NextResponse.json({
      success: true,
      shipment: {
        shipmentId,
        shipmentReference: shipmentData.shipmentReference,
        serviceType: shipmentData.serviceType,
        status: shipmentData.status,
        createdAt: shipmentData.createdAt,
        submittedAt: shipmentData.submittedAt,
        updatedAt: shipmentData.updatedAt,
        sender: shipmentData.sender,
        recipient: shipmentData.recipient,
        origin: displayEndpoint(shipmentData.origin, originPudo),
        destination: displayEndpoint(shipmentData.destination, destinationPudo),
        paymentStatus: shipmentData.paymentStatus,
        bookingConfirmedAt: shipmentData.bookingConfirmedAt,
        currentQuote,
        parcels: parcels.docs.map((item: { id: string; data(): Record<string, unknown> }) => ({ ...item.data(), parcelId: item.id })),
        events: events.docs.map((item: { id: string; data(): Record<string, unknown> }) => {
          const record = item.data();
          return { eventId: item.id, eventType: record.eventType, occurredAt: record.occurredAt, summary: record.summary, visibility: record.visibility };
        }).filter((item: Record<string, unknown>) => Array.isArray(item.visibility) && item.visibility.includes("customer"))
          .map((item: Record<string, unknown>) => { const customerEvent = { ...item }; delete customerEvent.visibility; return customerEvent; }),
        documents: documents.docs.map((item: { id: string; data(): Record<string, unknown> }) => {
          const record = item.data();
          return { documentId: item.id, documentType: record.documentType, version: record.version, contentType: record.contentType, sizeBytes: record.sizeBytes, generatedAt: record.generatedAt, access: record.access };
        }).filter((item: Record<string, unknown>) => Array.isArray(item.access) && item.access.includes("customer"))
          .map((item: Record<string, unknown>) => { const customerDocument = { ...item }; delete customerDocument.access; return customerDocument; }),
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Customer shipment detail retrieval failed:", error);
    return NextResponse.json({ error: "Unable to retrieve this shipment." }, { status: 500 });
  }
}
