import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { createCommercialRouteDistanceStore } from "@/lib/server/commercial-route-distance-store-core";

export const commercialRouteDistanceStore = createCommercialRouteDistanceStore({
  db: adminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
});
