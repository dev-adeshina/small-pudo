import { NextRequest } from "next/server";

import { createShipmentBookingDraftHandlers } from "@/lib/server/shipment-booking-draft-api";
import { shipmentBookingDraftStore } from "@/lib/server/shipment-booking-draft-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ draftId: string }>;
};

const handlers = createShipmentBookingDraftHandlers(shipmentBookingDraftStore);

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { draftId } = await context.params;
  return handlers.PATCH(request, draftId);
}
