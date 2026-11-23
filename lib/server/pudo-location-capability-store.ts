import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import {
  createPudoLocationCapabilityStore,
} from "@/lib/server/pudo-location-capability-store-core";

export const pudoLocationCapabilityStore =
  createPudoLocationCapabilityStore({
    db: adminDb,
    serverTimestamp: () => FieldValue.serverTimestamp(),
  });
