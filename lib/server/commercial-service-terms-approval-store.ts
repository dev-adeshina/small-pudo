import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { createCommercialServiceTermsApprovalStore } from "@/lib/server/commercial-service-terms-approval-core";

export const commercialServiceTermsApprovalStore = createCommercialServiceTermsApprovalStore({
  db: adminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
});
