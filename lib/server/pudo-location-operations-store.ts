import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { createPudoLocationOperationsStore } from "@/lib/server/pudo-location-operations-store-core";

export const pudoLocationOperationsStore = createPudoLocationOperationsStore({
  db: adminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
});
