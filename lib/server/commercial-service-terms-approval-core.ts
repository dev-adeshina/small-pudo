import type { FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import { hasStaffActionPermissionInTransaction } from "./staff-permission-grants-core.ts";
import { assertCommercialPricingConfiguration } from "./commercial-pricing-engine-core.ts";

export type CommercialServiceCode = "standard" | "express" | "scheduled";
export type CommercialRoundingMode = "none" | "half_up" | "half_even" | "ceil" | "floor";
export type CommercialChargeTreatment = "included_in_components" | "not_applicable";

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
      roundingMode: CommercialRoundingMode;
      decimalPlaces: number;
      roundingStage: "total_only";
      taxTreatment: CommercialChargeTreatment;
      surchargeTreatment: CommercialChargeTreatment;
      discountTreatment: CommercialChargeTreatment;
      feeTreatment: CommercialChargeTreatment;
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
      if (!["none", "half_up", "half_even", "ceil", "floor"].includes(input.roundingMode)) throw new TypeError("A supported rounding mode must be explicitly approved.");
      if (!Number.isSafeInteger(input.decimalPlaces) || input.decimalPlaces < 0 || input.decimalPlaces > 6) throw new TypeError("Decimal places must be an explicitly approved integer from 0 to 6.");
      if (input.roundingStage !== "total_only") throw new TypeError("Only explicitly approved total-only rounding is supported.");
      for (const [label, treatment] of [
        ["Tax treatment", input.taxTreatment],
        ["Surcharge treatment", input.surchargeTreatment],
        ["Discount treatment", input.discountTreatment],
        ["Fee treatment", input.feeTreatment],
      ] as const) {
        if (treatment !== "included_in_components" && treatment !== "not_applicable") {
          throw new TypeError(label + " must be explicitly included in the approved pricing components or marked not applicable.");
        }
      }
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
        if (configuration.createdBy === actorUid ||
            workflowData?.proposerUid === actorUid ||
            workflowData?.approverUid === actorUid) {
          throw new Error("DEC-048 owner approval must be independent of the pricing proposer and pricing approver.");
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
          roundingMode: input.roundingMode,
          decimalPlaces: input.decimalPlaces,
          roundingStage: input.roundingStage,
          taxTreatment: input.taxTreatment,
          surchargeTreatment: input.surchargeTreatment,
          discountTreatment: input.discountTreatment,
          feeTreatment: input.feeTreatment,
          approvedBy: actorUid,
          approvedAt: timestamp,
          updatedAt: timestamp,
        };
        transaction.set(approvalRef, record);
        transaction.create(eventRef, { action: "approved", actorUid, pricingDefinitionId, pricingVersionId, timestamp, record });
        return { serviceCode, status: "approved", pricingVersionId };
      });
    },
    async revoke(input: { actorUid: string; serviceCode: CommercialServiceCode; reason: string }) {
      const { actorUid, serviceCode, reason } = input;
      assertActor(actorUid);
      if (!["standard", "express", "scheduled"].includes(serviceCode)) throw new TypeError("Unsupported service code.");
      assertText(reason, "A DEC-048 revocation reason");
      const approvalRef = approvals.doc(serviceCode);
      const eventRef = approvalRef.collection("events").doc();
      return db.runTransaction(async (transaction: Transaction) => {
        const allowed = await hasStaffActionPermissionInTransaction(
          transaction, db, actorUid, "commercial_pricing.owner_approve",
        );
        if (!allowed) throw new Error("You are not authorised to revoke DEC-048 service commercial terms.");
        const approval = await transaction.get(approvalRef);
        if (!approval.exists || approval.data()?.status !== "approved") {
          return { outcome: "not_active" as const, serviceCode };
        }
        const timestamp = serverTimestamp();
        transaction.update(approvalRef, {
          status: "revoked",
          revokedBy: actorUid,
          revokedAt: timestamp,
          revocationReason: reason.trim(),
          updatedAt: timestamp,
        });
        transaction.create(eventRef, {
          action: "revoked",
          actorUid,
          serviceCode,
          reason: reason.trim(),
          previousPricingVersionId: approval.data()?.pricingVersionId ?? null,
          timestamp,
        });
        return { outcome: "revoked" as const, serviceCode };
      });
    },
  };
}
