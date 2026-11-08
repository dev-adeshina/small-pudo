import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { createPudoLocationStore } from "@/lib/server/pudo-location-store-core";

export const pudoLocationStore = createPudoLocationStore({
  db: adminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
});