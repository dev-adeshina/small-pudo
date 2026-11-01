import { NextRequest } from "next/server";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
import { validateShipmentBookingDraft } from "@/lib/validations/shipment-booking-draft";

import { createShipmentBookingDraftHandlers } from "@/lib/server/shipment-booking-draft-api";
import { shipmentBookingDraftStore } from "@/lib/server/shipment-booking-draft-store";

export const runtime = "nodejs";

const handlers = createShipmentBookingDraftHandlers({
  ...shipmentBookingDraftStore,
  authenticateCustomer: (authorization) =>
    authenticateVerifiedCustomer(
      authorization,
      (token) => adminAuth.verifyIdToken(token)
    ),
  validateDraft: validateShipmentBookingDraft,
});

export async function GET(request: NextRequest) {
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  return handlers.POST(request);
}
