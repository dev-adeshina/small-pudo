import { NextRequest } from "next/server";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
import { validateShipmentBookingDraft } from "@/lib/validations/shipment-booking-draft";

import { createShipmentBookingDraftHandlers } from "@/lib/server/shipment-booking-draft-api";
import { shipmentBookingDraftStore } from "@/lib/server/shipment-booking-draft-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ draftId: string }>;
};

const handlers = createShipmentBookingDraftHandlers({
  ...shipmentBookingDraftStore,
  authenticateCustomer: (authorization) =>
    authenticateVerifiedCustomer(
      authorization,
      (token) => adminAuth.verifyIdToken(token)
    ),
  validateDraft: validateShipmentBookingDraft,
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { draftId } = await context.params;
  return handlers.PATCH(request, draftId);
}
