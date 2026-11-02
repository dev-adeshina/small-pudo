import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { createOperationalCostDefinitionStore } from "@/lib/server/operational-cost-definition-store-core";

export const operationalCostDefinitionStore =
  createOperationalCostDefinitionStore({
    db: adminDb,
    serverTimestamp: () => FieldValue.serverTimestamp(),
  });
