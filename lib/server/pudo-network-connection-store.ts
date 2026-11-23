import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { createPudoNetworkConnectionStore } from "@/lib/server/pudo-network-connection-store-core";

export const pudoNetworkConnectionStore = createPudoNetworkConnectionStore({
  db: adminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
});
