import type { FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import { hasStaffActionPermissionInTransaction } from "./staff-permission-grants-core.ts";
import { assertCommercialPricingConfiguration } from "./commercial-pricing-engine-core.ts";

export type CommercialServiceCode = "standard" | "express" | "scheduled";

interface Dependencies {
  db: Firestore;
  serverTimestamp: () => FieldValue;
}

function assertActor(uid: string) {
  if (typeof uid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new TypeError("A valid owner-authorised identity is required.");
}
function assertId(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw new TypeError(label + " is invalid.");
}
function assertText(value: unknown, label: string, max = 500): asserts value is string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new TypeError(label + " must be explicitly specified.");
}
function assertMinutes(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > 525600) throw new TypeError(label + " must be an explicitly approved positive duration in minutes.");
}

export function createCommercialServiceTermsApprovalStore({ db, serverTimestamp }: Dependencies) {
  const definitions = db.collection("commercialPricingDefinitions");
  const approvals = db.collection("commercialServiceCommercialApprovals");

  return {
    async approve(input: {
      actorUid: string;
      serviceCode: CommercialServiceCode;
      pricingDefinitionId: string;
      pricingVersionId: string;
      currency: string;
      quoteValidityMinutes: number;
      handoverWindowMinutes: number;
      roundingPolicy: string;
      taxTreatment: string;
      surchargeTreatment: string;
      discountTreatment: string;
      feeTreatment: string;
      confirmation: "DEC-048_TERMS_REVIEWED";
    }) {
      const { actorUid, serviceCode, pricingDefinitionId, pricingVersionId } = input;
      assertActor(actorUid);
      if (!["standard", "express", "scheduled"].includes(serviceCode)) throw new TypeError("Unsupported service code.");
      assertId(pricingDefinitionId, "Pricing definition ID");
      assertId(pricingVersionId, "Pricing version ID");
      assertText(input.currency, "Currency", 12);
      assertMinutes(input.quoteValidityMinutes, "Quote validity");
      assertMinutes(input.handoverWindowMinutes, "Physical handover window");
      assertText(input.roundingPolicy, "Rounding policy");
      assertText(input.taxTreatment, "Tax treatment");
      assertText(input.surchargeTreatment, "Surcharge treatment");
      assertText(input.discountTreatment, "Discount treatment");
      assertText(input.feeTreatment, "Fee treatment");
      if (input.confirmation !== "DEC-048_TERMS_REVIEWED") throw new TypeError("Explicit DEC-048 confirmation is required.");

      const definitionRef = definitions.doc(pricingDefinitionId);
      const versionRef = definitionRef.collection("versions").doc(pricingVersionId);
      const workflowRef = versionRef.collection("approval").doc("workflow");
      const approvalRef = approvals.doc(serviceCode);
      const eventRef = approvalRef.collection("events").doc();

      return db.runTransaction(async (transaction: Transaction) => {
        const allowed = await hasStaffActionPermissionInTransaction(
          transaction, db, actorUid, "commercial_pricing.owner_approve",
        );
        if (!allowed) throw new Error("You are not authorised to approve DEC-048 service commercial terms.");
        const [definition, version, workflow] = await Promise.all([
          transaction.get(definitionRef), transaction.get(versionRef), transaction.get(workflowRef),
        ]);
        if (!definition.exists || !version.exists) throw new Error("The selected pricing definition or version was not found.");
        const lineage = definition.data()!;
        const configuration = version.data()!;
        const workflowData = workflow.data();
        const pricingConfiguration = Object.fromEntries(Object.entries(configuration).filter(([key]) =>
          !["versionNumber", "createdAt", "createdBy"].includes(key)
        ));
        assertCommercialPricingConfiguration(pricingConfiguration);
        if (configuration.createdBy === actorUid || workflowData?.proposerUid === actorUid) {
          throw new Error("DEC-048 owner approval must be independent of the pricing configuration proposer.");
        }
        if (lineage.currentVersionId !== pricingVersionId ||
            lineage.approvedVersionId !== pricingVersionId ||
            lineage.publishedVersionId !== pricingVersionId ||
            lineage.currentVersionNumber !== configuration.versionNumber ||
            lineage.approvedVersionNumber !== configuration.versionNumber ||
            lineage.publishedVersionNumber !== configuration.versionNumber ||
            workflow.data()?.state !== "approved" ||
            configuration.serviceCode !== serviceCode ||
            !configuration.pricingModel ||
            !Array.isArray(configuration.components) ||
            configuration.components.length === 0) {
          throw new Error("Only the current, approved and published complete pricing version for this service can receive DEC-048 commercial approval.");
        }
        const timestamp = serverTimestamp();
        const record = {
          schemaVersion: 1,
          status: "approved",
          serviceCode,
          pricingDefinitionId,
          pricingVersionId,
          currency: input.currency.trim().toUpperCase(),
          quoteValidityMinutes: input.quoteValidityMinutes,
          handoverWindowMinutes: input.handoverWindowMinutes,
          roundingPolicy: input.roundingPolicy.trim(),
          taxTreatment: input.taxTreatment.trim(),
          surchargeTreatment: input.surchargeTreatment.trim(),
          discountTreatment: input.discountTreatment.trim(),
          feeTreatment: input.feeTreatment.trim(),
          approvedBy: actorUid,
          approvedAt: timestamp,
          updatedAt: timestamp,
        };
        transaction.set(approvalRef, record);
        transaction.create(eventRef, { action: "approved", actorUid, pricingDefinitionId, pricingVersionId, timestamp, record });
        return { serviceCode, status: "approved", pricingVersionId };
      });
    },
  };
}
