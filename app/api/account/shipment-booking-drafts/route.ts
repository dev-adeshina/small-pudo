import { NextRequest } from "next/server";

import { createShipmentBookingDraftHandlers } from "@/lib/server/shipment-booking-draft-api";
import { shipmentBookingDraftStore } from "@/lib/server/shipment-booking-draft-store";

export const runtime = "nodejs";

const handlers = createShipmentBookingDraftHandlers(shipmentBookingDraftStore);

export async function GET(request: NextRequest) {
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  return handlers.POST(request);
}
