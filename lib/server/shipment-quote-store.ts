import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { createShipmentQuoteStore } from "@/lib/server/shipment-quote-store-core";

export const shipmentQuoteStore = createShipmentQuoteStore({
  db: adminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
});
