import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { createCommercialQuotationReadinessStore } from "@/lib/server/commercial-quotation-readiness-core";

export const commercialQuotationReadinessStore = createCommercialQuotationReadinessStore({
  db: adminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
});
