import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { createPudoPersonnelStore } from "@/lib/server/pudo-personnel-store-core";

export const pudoPersonnelStore = createPudoPersonnelStore({
  db: adminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
});
