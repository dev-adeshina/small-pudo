import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { createCommercialPricingStore } from "@/lib/server/commercial-pricing-store-core";

export const commercialPricingStore = createCommercialPricingStore({
  db: adminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
});
