import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { createPudoNetworkConnectionStore } from "@/lib/server/pudo-network-connection-store-core";
import { commercialQuotationReadinessStore } from "@/lib/server/commercial-quotation-readiness-store";

export const pudoNetworkConnectionStore = createPudoNetworkConnectionStore({
  db: adminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
  getUsableRouteEvidence: (originId, destinationId) =>
    commercialQuotationReadinessStore.getUsableRouteEvidence(originId, destinationId),
});
