import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { createOperationalCostDefinitionWorkflowStore } from "@/lib/server/operational-cost-definition-workflow-store-core";

export const operationalCostDefinitionWorkflowStore = createOperationalCostDefinitionWorkflowStore({
  db: adminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
});
