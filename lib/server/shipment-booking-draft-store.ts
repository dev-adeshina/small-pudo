import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { updateDraftOnlyWhileEditable } from "@/lib/server/shipment-booking-drafts";
import { createShipmentBookingDraftStore } from "@/lib/server/shipment-booking-draft-store-core";

export const shipmentBookingDraftStore = createShipmentBookingDraftStore({
  db: adminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
  updateDraftOnlyWhileEditable,
});
