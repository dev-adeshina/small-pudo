import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import {
  createPudoLocationVerificationStore,
} from "@/lib/server/pudo-location-verification-store-core";

export const pudoLocationVerificationStore =
  createPudoLocationVerificationStore({
    db: adminDb,
    serverTimestamp: () => FieldValue.serverTimestamp(),
  });