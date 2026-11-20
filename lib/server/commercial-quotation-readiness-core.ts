import type { FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import { hasStaffActionPermissionInTransaction } from "./staff-permission-grants-core.ts";

export type CommercialServiceCode = "standard" | "express" | "scheduled";
export type CommercialEndpointType = "address" | "pudo";
export type CommercialEligibilityOutcome =
  | "pending_verification"
  | "eligible"
  | "conditionally_eligible"
  | "not_eligible"
  | "revoked";
export type RouteEvidenceDecision = "approve" | "revoke";

interface Dependencies {
  db: Firestore;
  serverTimestamp: () => FieldValue;
  now?: () => Date;
}

const SERVICES = new Set<CommercialServiceCode>(["standard", "express", "scheduled"]);
const ENDPOINTS = new Set<CommercialEndpointType>(["address", "pudo"]);
const ID = /^[A-Za-z0-9_-]{1,128}$/;
const ROUTE_REVIEW_PERMISSION = "commercial_route_distance.approve";
const ELIGIBILITY_PERMISSION = "commercial_service_eligibility.approve";

function assertActor(value: string): void {
  if (typeof value !== "string" || !ID.test(value)) throw new TypeError("A valid authenticated staff identity is required.");
}
function assertId(value: string, label: string): void {
  if (typeof value !== "string" || !ID.test(value)) throw new TypeError(label + " is invalid.");
}
function assertText(value: unknown, label: string, max = 2000): asserts value is string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new TypeError(label + " is required.");
}
function assertPermission(allowed: boolean, label: string): void {
  if (!allowed) throw new Error("You are not authorised to " + label + ".");
}
function keyFor(service: CommercialServiceCode, origin: CommercialEndpointType, destination: CommercialEndpointType): string {
  return [service, origin, destination].join("__");
}
function dateMillis(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date ? date.getTime() : null;
  }
  return null;
}

/**
 * Operational/commercial evidence gates shared by route review, DEC-047
 * eligibility and customer quotation issuance. An approval is an attributable
 * decision, not a claim that missing evidence exists.
 */
export function createCommercialQuotationReadinessStore({
  db,
  serverTimestamp,
  now = () => new Date(),
}: Dependencies) {
  const routeEvidence = db.collection("commercialRouteDistanceEvidence");
  const routeReviews = db.collection("commercialRouteDistanceReviews");
  const eligibility = db.collection("commercialServiceEndpointEligibility");
  const activations = db.collection("pudoLocationActivations");
  const locations = db.collection("pudoLocations");
  const pricingDefinitions = db.collection("commercialPricingDefinitions");
  const commercialTerms = db.collection("commercialServiceCommercialApprovals");

  async function requirePermission(
    transaction: Transaction,
    actorUid: string,
    permission: string,
    label: string,
  ) {
    assertPermission(
      await hasStaffActionPermissionInTransaction(transaction, db, actorUid, permission),
      label,
    );
  }

  async function isActivePudo(locationId: string): Promise<boolean> {
    if (!ID.test(locationId)) return false;
    const [candidate, activation] = await Promise.all([
      locations.doc(locationId).get(),
      activations.doc(locationId).get(),
    ]);
    return candidate.exists && candidate.data()?.lifecycle === "active" &&
      activation.exists && activation.data()?.status === "active";
  }

  return {
    async reviewRouteEvidence(actorUid: string, evidenceId: string, decision: RouteEvidenceDecision, reason: string) {
      assertActor(actorUid);
      assertId(evidenceId, "Route evidence ID");
      if (decision !== "approve" && decision !== "revoke") throw new TypeError("A valid route evidence decision is required.");
      assertText(reason, "A route evidence review reason");
      const evidenceRef = routeEvidence.doc(evidenceId);
      const reviewRef = routeReviews.doc(evidenceId);
      const eventRef = reviewRef.collection("events").doc();

      return db.runTransaction(async (transaction) => {
        await requirePermission(transaction, actorUid, ROUTE_REVIEW_PERMISSION, "review route-distance evidence");
        const evidenceSnapshot = await transaction.get(evidenceRef);
        if (!evidenceSnapshot.exists) throw new Error("Route-distance evidence was not found.");
        const row = evidenceSnapshot.data()!;
        const evidence = row.evidence as Record<string, unknown> | undefined;
        if (!evidence || typeof evidence !== "object") throw new Error("Route-distance evidence is malformed.");
        if (decision === "approve") {
          if (evidence.method === "straight_line") {
            throw new Error("Straight-line measurements cannot be approved as operational road-route evidence.");
          }
          if (typeof evidence.originOperationalPointRef !== "string" ||
              typeof evidence.destinationOperationalPointRef !== "string" ||
              typeof evidence.source !== "string" || !evidence.source.trim() ||
              typeof evidence.measuredOn !== "string") {
            throw new Error("Route evidence is missing its endpoint, source or measurement-date provenance.");
          }
        }
        const timestamp = serverTimestamp();
        transaction.set(reviewRef, {
          evidenceId,
          decision,
          status: decision === "approve" ? "approved" : "revoked",
          reason: reason.trim(),
          reviewedBy: actorUid,
          reviewedAt: timestamp,
          updatedAt: timestamp,
        });
        transaction.create(eventRef, { action: decision, evidenceId, reason: reason.trim(), actorUid, timestamp });
        return { evidenceId, status: decision === "approve" ? "approved" : "revoked" };
      });
    },

    async getUsableRouteEvidence(originId: string, destinationId: string) {
      assertId(originId, "Origin operational point ID");
      assertId(destinationId, "Destination operational point ID");
      if (originId === destinationId) return null;
      const [originActive, destinationActive] = await Promise.all([isActivePudo(originId), isActivePudo(destinationId)]);
      if (!originActive || !destinationActive) return null;
      const snapshot = await routeEvidence
        .where("originOperationalPointRef", "==", originId)
        .where("destinationOperationalPointRef", "==", destinationId)
        .limit(100).get();
      const reviewed = await Promise.all(snapshot.docs.map(async (doc) => {
        const [review, data] = await Promise.all([routeReviews.doc(doc.id).get(), Promise.resolve(doc.data())]);
        const evidence = data.evidence as Record<string, unknown> | undefined;
        const reviewData = review.data();
        if (!review.exists || reviewData?.status !== "approved" || !evidence ||
            evidence.method === "straight_line" ||
            typeof evidence.measuredOn !== "string" ||
            !Number.isFinite(Date.parse(evidence.measuredOn))) return null;
        const measured = Date.parse(evidence.measuredOn + "T00:00:00Z");
        if (measured > now().getTime()) return null;
        return { evidenceId: doc.id, evidence, review: reviewData };
      }));
      return reviewed.filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => Date.parse(String(b.evidence.measuredOn)) - Date.parse(String(a.evidence.measuredOn)))[0] ?? null;
    },

    async recordEligibilityDecision(input: {
      actorUid: string;
      serviceCode: CommercialServiceCode;
      originType: CommercialEndpointType;
      destinationType: CommercialEndpointType;
      outcome: Exclude<CommercialEligibilityOutcome, "pending_verification">;
      evidenceReferences: string[];
      conditions?: string[];
      reason: string;
      validUntil?: Date;
    }) {
      const { actorUid, serviceCode, originType, destinationType, outcome, evidenceReferences, conditions = [], reason, validUntil } = input;
      assertActor(actorUid);
      if (!SERVICES.has(serviceCode) || !ENDPOINTS.has(originType) || !ENDPOINTS.has(destinationType)) throw new TypeError("Unsupported service or endpoint type.");
      if (!["eligible", "conditionally_eligible", "not_eligible", "revoked"].includes(outcome)) throw new TypeError("Unsupported eligibility outcome.");
      if (!Array.isArray(evidenceReferences) || evidenceReferences.length > 50 ||
          evidenceReferences.some((item) => typeof item !== "string" || !item.trim() || item.length > 300)) {
        throw new TypeError("Eligibility evidence references must be a list of at most 50 valid references.");
      }
      if (!Array.isArray(conditions) || conditions.length > 30 ||
          conditions.some((item) => typeof item !== "string" || !item.trim() || item.length > 500)) {
        throw new TypeError("Eligibility conditions must be a list of at most 30 valid conditions.");
      }
      assertText(reason, "An eligibility decision reason");
      if (outcome === "eligible" && evidenceReferences.length === 0) throw new TypeError("An eligible outcome requires attributable evidence references.");
      if (outcome === "conditionally_eligible" && (evidenceReferences.length === 0 || conditions.length === 0)) {
        throw new TypeError("Conditional eligibility requires evidence references and explicit conditions.");
      }
      if (validUntil && (!(validUntil instanceof Date) || !Number.isFinite(validUntil.getTime()) || validUntil <= now())) {
        throw new TypeError("Eligibility validity must be a future date.");
      }

      const recordId = keyFor(serviceCode, originType, destinationType);
      const recordRef = eligibility.doc(recordId);
      const eventRef = recordRef.collection("events").doc();
      return db.runTransaction(async (transaction) => {
        await requirePermission(transaction, actorUid, ELIGIBILITY_PERMISSION, "approve service and endpoint eligibility");
        const timestamp = serverTimestamp();
        transaction.set(recordRef, {
          schemaVersion: 1, serviceCode, originType, destinationType, outcome,
          evidenceReferences: [...evidenceReferences], conditions: [...conditions],
          reason: reason.trim(), decidedBy: actorUid, decidedAt: timestamp,
          validUntil: validUntil ?? null, updatedAt: timestamp,
        });
        transaction.create(eventRef, {
          action: outcome, actorUid, evidenceReferences: [...evidenceReferences],
          conditions: [...conditions], reason: reason.trim(), timestamp,
        });
        return { recordId, outcome };
      });
    },

    async evaluateEligibility(input: {
      serviceCode: CommercialServiceCode;
      originType: CommercialEndpointType;
      destinationType: CommercialEndpointType;
      originPudoLocationId?: string;
      destinationPudoLocationId?: string;
      satisfiedConditions?: string[];
    }) {
      const { serviceCode, originType, destinationType, originPudoLocationId, destinationPudoLocationId, satisfiedConditions = [] } = input;
      if (!SERVICES.has(serviceCode) || !ENDPOINTS.has(originType) || !ENDPOINTS.has(destinationType)) {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "The requested service or endpoint combination is unsupported." };
      }
      if (originType === "pudo" && (!originPudoLocationId || !(await isActivePudo(originPudoLocationId)))) {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "The origin PUDO is not active." };
      }
      if (destinationType === "pudo" && (!destinationPudoLocationId || !(await isActivePudo(destinationPudoLocationId)))) {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "The destination PUDO is not active." };
      }
      const record = await eligibility.doc(keyFor(serviceCode, originType, destinationType)).get();
      if (!record.exists) return { eligible: false as const, outcome: "pending_verification" as const, reason: "No DEC-047 eligibility decision has been recorded." };
      const data = record.data()!;
      if (data.outcome === "revoked" || data.outcome === "not_eligible") {
        return { eligible: false as const, outcome: data.outcome as CommercialEligibilityOutcome, reason: String(data.reason ?? "The service and endpoint combination is unavailable.") };
      }
      const expiry = dateMillis(data.validUntil);
      if (expiry !== null && expiry <= now().getTime()) {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "The eligibility decision has expired." };
      }
      if (data.outcome !== "eligible" && data.outcome !== "conditionally_eligible") {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "The eligibility decision is not usable." };
      }
      const requiredConditions = Array.isArray(data.conditions) ? data.conditions as string[] : [];
      if (data.outcome === "conditionally_eligible" && requiredConditions.some((condition) => !satisfiedConditions.includes(condition))) {
        return { eligible: false as const, outcome: "conditionally_eligible" as const, reason: "One or more eligibility conditions are not satisfied.", conditions: requiredConditions };
      }
      return { eligible: true as const, outcome: data.outcome as CommercialEligibilityOutcome, recordId: record.id, evidenceReferences: data.evidenceReferences ?? [], conditions: requiredConditions };
    },

    async getApprovedCommercialTerms(serviceCode: CommercialServiceCode) {
      if (!SERVICES.has(serviceCode)) return null;
      const approval = await commercialTerms.doc(serviceCode).get();
      if (!approval.exists) return null;
      const data = approval.data()!;
      if (data.status !== "approved" || data.serviceCode !== serviceCode ||
          typeof data.pricingDefinitionId !== "string" || !ID.test(data.pricingDefinitionId) ||
          typeof data.pricingVersionId !== "string" || !ID.test(data.pricingVersionId) ||
          typeof data.currency !== "string" || !data.currency.trim() ||
          !Number.isSafeInteger(data.quoteValidityMinutes) || data.quoteValidityMinutes < 1 ||
          !Number.isSafeInteger(data.handoverWindowMinutes) || data.handoverWindowMinutes < 1 ||
          typeof data.approvedBy !== "string" || !data.approvedBy ||
          !data.approvedAt ||
          typeof data.roundingPolicy !== "string" || !data.roundingPolicy.trim() ||
          typeof data.taxTreatment !== "string" || !data.taxTreatment.trim() ||
          typeof data.surchargeTreatment !== "string" || !data.surchargeTreatment.trim() ||
          typeof data.discountTreatment !== "string" || !data.discountTreatment.trim() ||
          typeof data.feeTreatment !== "string" || !data.feeTreatment.trim()) return null;
      const definition = await pricingDefinitions.doc(data.pricingDefinitionId).get();
      if (!definition.exists) return null;
      const lineage = definition.data()!;
      if (lineage.publishedVersionId !== data.pricingVersionId || lineage.approvedVersionId !== data.pricingVersionId) return null;
      const workflow = await definition.ref.collection("versions").doc(data.pricingVersionId).collection("approval").doc("workflow").get();
      if (!workflow.exists || workflow.data()?.state !== "approved") return null;
      const version = await definition.ref.collection("versions").doc(data.pricingVersionId).get();
      if (!version.exists || version.data()?.serviceCode !== serviceCode) return null;
      return {
        ...data,
        pricingVersionNumber: version.data()?.versionNumber,
        pricingConfiguration: Object.fromEntries(Object.entries(version.data()!).filter(([key]) => !["versionNumber", "createdAt", "createdBy"].includes(key))),
        approvedVersion: data.pricingVersionId,
      };
    },
  };
}
