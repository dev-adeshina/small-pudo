import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { createPudoPartnerPortalStore } from "@/lib/server/pudo-partner-portal-store-core";

export const pudoPartnerPortalStore = createPudoPartnerPortalStore({
  db: adminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
});
