import { NextRequest } from "next/server";

import { adminAuth } from "@/lib/firebase-admin";
// @ts-expect-error -- Shipment runtime selects the configured Firebase environment.
import { createShipmentFirestoreRuntime } from "@/lib/shipment/firestore-runtime.mjs";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token) => adminAuth.verifyIdToken(token, true),
  );
  if (!customer.success) {
    return Response.json({ error: customer.error }, { status: customer.status });
  }

  try {
    const runtime = createShipmentFirestoreRuntime();
    const candidates = await runtime.db.collection("pudoLocations")
      .where("lifecycle", "==", "active")
      .limit(100)
      .get();

    const locations = await Promise.all(candidates.docs.map(async (document) => {
      const activation = await runtime.db.collection("pudoLocationActivations")
        .doc(document.id).get();
      if (!activation.exists || activation.data()?.status !== "active") return null;
      const data = document.data();
      return {
        locationId: document.id,
        name: typeof data.name === "string" ? data.name : "PUDO location",
        address: typeof data.address === "string" ? data.address : "",
        city: typeof data.city === "string" ? data.city : "",
        state: typeof data.state === "string" ? data.state : "",
        country: typeof data.country === "string" ? data.country : "Nigeria",
      };
    }));

    return Response.json({
      success: true,
      locations: locations.filter((location) => location !== null)
        .sort((left, right) => left.name.localeCompare(right.name)),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Failed to retrieve active PUDO locations for shipment draft:", error);
    return Response.json({ error: "Unable to retrieve active PUDO locations right now." }, { status: 500 });
  }
}
