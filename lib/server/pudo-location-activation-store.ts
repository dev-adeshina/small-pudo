import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import {
  createPudoLocationActivationStore,
} from "@/lib/server/pudo-location-activation-store-core";

export const pudoLocationActivationStore =
  createPudoLocationActivationStore({
    db: adminDb,
    serverTimestamp: () => FieldValue.serverTimestamp(),
  });
