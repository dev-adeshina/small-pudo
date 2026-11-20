import type { FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import { hasStaffActionPermissionInTransaction } from "./staff-permission-grants-core.ts";
import { assertCommercialRouteDistanceEvidence } from "./commercial-route-distance-input-core.ts";

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
const CAPABILITY_PERMISSION = "pudo_location.capability_approve";

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
function keyFor(
  service: CommercialServiceCode,
  origin: CommercialEndpointType,
  destination: CommercialEndpointType,
  originPudoLocationId?: string,
  destinationPudoLocationId?: string,
): string {
  return [service, origin, destination, originPudoLocationId ?? "address", destinationPudoLocationId ?? "address"].join("__");
}
function dateMillis(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date ? date.getTime() : null;
  }
  return null;
}
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return "{" + entries.map(([key, item]) => JSON.stringify(key) + ":" + canonicalJson(item)).join(",") + "}";
  }
  return JSON.stringify(value) ?? "null";
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
  const verifications = db.collection("pudoLocationVerifications");
  const capabilities = db.collection("pudoLocationServiceCapabilities");
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
    async reviewRouteEvidence(actorUid: string, evidenceId: string, decision: RouteEvidenceDecision, reason: string, validUntil?: Date) {
      assertActor(actorUid);
      assertId(evidenceId, "Route evidence ID");
      if (decision !== "approve" && decision !== "revoke") throw new TypeError("A valid route evidence decision is required.");
      assertText(reason, "A route evidence review reason");
      if (decision === "approve" && (!(validUntil instanceof Date) || !Number.isFinite(validUntil.getTime()) || validUntil <= now())) {
        throw new TypeError("Route evidence approval requires an explicit future validity end.");
      }
      if (validUntil && (!(validUntil instanceof Date) || !Number.isFinite(validUntil.getTime()) || validUntil <= now())) {
        throw new TypeError("Route evidence validity must be a future date.");
      }
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
        assertCommercialRouteDistanceEvidence(evidence);
        if (decision === "approve") {
          if (evidence.recordedBy === actorUid) {
            throw new Error("Route evidence approval must be performed by someone other than the evidence recorder.");
          }
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
          evidenceSnapshot: evidence,
          status: decision === "approve" ? "approved" : "revoked",
          validUntil: decision === "approve" ? validUntil : null,
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
        if (!review.exists || reviewData?.status !== "approved" || !evidence) return null;
        const reviewExpiry = dateMillis(reviewData.validUntil);
        if (reviewExpiry === null || reviewExpiry <= now().getTime()) return null;
        try {
          assertCommercialRouteDistanceEvidence(evidence);
        } catch {
          return null;
        }
        if (evidence.originOperationalPointRef !== originId ||
            evidence.destinationOperationalPointRef !== destinationId ||
            evidence.method === "straight_line" ||
            typeof evidence.measuredOn !== "string" ||
            !Number.isFinite(Date.parse(evidence.measuredOn)) ||
            canonicalJson(reviewData.evidenceSnapshot) !== canonicalJson(evidence)) return null;
        const measured = Date.parse(evidence.measuredOn + "T00:00:00Z");
        if (measured > now().getTime()) return null;
        return { evidenceId: doc.id, evidence, review: reviewData };
      }));
      return reviewed.filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => Date.parse(String(b.evidence.measuredOn)) - Date.parse(String(a.evidence.measuredOn)))[0] ?? null;
    },

    async recordPudoServiceCapability(input: {
      actorUid: string;
      locationId: string;
      serviceCode: CommercialServiceCode;
      supportedActions: string[];
      evidenceReferences: string[];
      validUntil: Date;
      reason: string;
    }) {
      const { actorUid, locationId, serviceCode, supportedActions, evidenceReferences, validUntil, reason } = input;
      assertActor(actorUid);
      assertId(locationId, "PUDO location ID");
      if (!SERVICES.has(serviceCode)) throw new TypeError("Unsupported service code.");
      if (!Array.isArray(supportedActions) || supportedActions.length === 0 || supportedActions.length > 30 ||
          supportedActions.some((action) => typeof action !== "string" || !action.trim() || action.length > 120) ||
          new Set(supportedActions.map((action) => action.trim())).size !== supportedActions.length) {
        throw new TypeError("At least one unique, explicit supported endpoint action is required.");
      }
      if (!Array.isArray(evidenceReferences) || evidenceReferences.length > 50 ||
          evidenceReferences.some((reference) => typeof reference !== "string" || !reference.trim() || reference.length > 300)) {
        throw new TypeError("Capability evidence references must be a list of valid Firestore document paths.");
      }
      if (!(validUntil instanceof Date) || !Number.isFinite(validUntil.getTime()) || validUntil <= now()) {
        throw new TypeError("PUDO service capability approval requires an explicit future validity end.");
      }
      assertText(reason, "A PUDO service capability approval reason");
      const capabilityId = locationId + "__" + serviceCode;
      const capabilityRef = capabilities.doc(capabilityId);
      const eventRef = capabilityRef.collection("events").doc();

      return db.runTransaction(async (transaction) => {
        await requirePermission(transaction, actorUid, CAPABILITY_PERMISSION, "approve PUDO service endpoint capabilities");
        const [candidate, activation, verification] = await Promise.all([
          transaction.get(locations.doc(locationId)),
          transaction.get(activations.doc(locationId)),
          transaction.get(verifications.doc(locationId)),
        ]);
        if (!candidate.exists || candidate.data()?.lifecycle !== "active" ||
            !activation.exists || activation.data()?.status !== "active" ||
            !verification.exists || verification.data()?.status !== "approved_to_activate") {
          throw new TypeError("PUDO service capabilities require an actively activated and physically verified location.");
        }
        const requiredLocationRefs = [
          "pudoLocationVerifications/" + locationId,
          "pudoLocationActivations/" + locationId,
        ];
        if (requiredLocationRefs.some((reference) => !evidenceReferences.includes(reference))) {
          throw new TypeError("PUDO service capability evidence must include the location's physical verification and activation records.");
        }
        for (const reference of evidenceReferences) {
          const segments = reference.split("/");
          if (segments.length < 2 || segments.length % 2 !== 0 || !segments.every((segment) => ID.test(segment))) {
            throw new TypeError("Each capability evidence reference must be a Firestore document path.");
          }
          const evidenceDocument = await transaction.get(db.doc(reference));
          if (!evidenceDocument.exists) throw new TypeError("A capability evidence reference does not exist: " + reference);
          const evidenceData = evidenceDocument.data()!;
          if ([evidenceData.createdBy, evidenceData.recordedBy, evidenceData.inspectorUid, evidenceData.decisionMakerUid, evidenceData.activatedBy, evidenceData.reviewedBy, evidenceData.approvedBy].some((evidenceActor) => evidenceActor === actorUid)) {
            throw new TypeError("Capability approval must be independent of the referenced evidence creators and operational actors.");
          }
          if (["revoked", "inactive", "expired", "not_approved"].includes(String(evidenceData.status ?? ""))) {
            throw new TypeError("A capability evidence reference is not in an active state: " + reference);
          }
          const expiry = dateMillis(evidenceData.validUntil ?? evidenceData.expiresAt);
          if (expiry !== null && expiry <= now().getTime()) throw new TypeError("A capability evidence reference has expired: " + reference);
        }
        const timestamp = serverTimestamp();
        transaction.set(capabilityRef, {
          schemaVersion: 1,
          locationId,
          serviceCode,
          status: "active",
          supportedActions: [...supportedActions].map((action) => action.trim()),
          evidenceReferences: [...evidenceReferences],
          validUntil,
          reason: reason.trim(),
          approvedBy: actorUid,
          approvedAt: timestamp,
          updatedAt: timestamp,
        });
        transaction.create(eventRef, {
          action: "approved",
          actorUid,
          locationId,
          serviceCode,
          supportedActions: [...supportedActions],
          evidenceReferences: [...evidenceReferences],
          validUntil,
          reason: reason.trim(),
          timestamp,
        });
        return { capabilityId, locationId, serviceCode, status: "active" };
      });
    },

    async recordEligibilityDecision(input: {
      actorUid: string;
      serviceCode: CommercialServiceCode;
      originType: CommercialEndpointType;
      destinationType: CommercialEndpointType;
      originPudoLocationId?: string;
      destinationPudoLocationId?: string;
      outcome: CommercialEligibilityOutcome;
      evidenceReferences: string[];
      serviceCoverageEvidenceReferences: string[];
      operatingAvailabilityEvidenceReferences: string[];
      capacityEvidenceReferences: string[];
      originRequiredActions: string[];
      destinationRequiredActions: string[];
      conditions?: string[];
      reason: string;
      validUntil?: Date;
    }) {
      const { actorUid, serviceCode, originType, destinationType, originPudoLocationId, destinationPudoLocationId, outcome, evidenceReferences, serviceCoverageEvidenceReferences, operatingAvailabilityEvidenceReferences, capacityEvidenceReferences, originRequiredActions, destinationRequiredActions, conditions = [], reason, validUntil } = input;
      assertActor(actorUid);
      if (!SERVICES.has(serviceCode) || !ENDPOINTS.has(originType) || !ENDPOINTS.has(destinationType)) throw new TypeError("Unsupported service or endpoint type.");
      if (!["pending_verification", "eligible", "conditionally_eligible", "not_eligible", "revoked"].includes(outcome)) throw new TypeError("Unsupported eligibility outcome.");
      const hasAddressEndpoint = originType === "address" || destinationType === "address";
      if (hasAddressEndpoint && outcome !== "not_eligible" && outcome !== "revoked" && outcome !== "pending_verification") {
        throw new TypeError("Address endpoint eligibility cannot be approved until authoritative address-to-operational-point mapping exists.");
      }
      if (originType === "pudo") assertId(originPudoLocationId ?? "", "Origin PUDO location ID");
      else if (originPudoLocationId !== undefined) throw new TypeError("An address origin cannot include a PUDO location ID.");
      if (destinationType === "pudo") assertId(destinationPudoLocationId ?? "", "Destination PUDO location ID");
      else if (destinationPudoLocationId !== undefined) throw new TypeError("An address destination cannot include a PUDO location ID.");
      if (originPudoLocationId && originPudoLocationId === destinationPudoLocationId) throw new TypeError("Origin and destination PUDO locations must be different.");
      if (!Array.isArray(evidenceReferences) || evidenceReferences.length > 50 ||
          evidenceReferences.some((item) => typeof item !== "string" || !item.trim() || item.length > 300)) {
        throw new TypeError("Eligibility evidence references must be a list of at most 50 valid references.");
      }
      if (!Array.isArray(conditions) || conditions.length > 30 ||
          conditions.some((item) => typeof item !== "string" || !item.trim() || item.length > 500)) {
        throw new TypeError("Eligibility conditions must be a list of at most 30 valid conditions.");
      }
      const referenceGroups = [serviceCoverageEvidenceReferences, operatingAvailabilityEvidenceReferences, capacityEvidenceReferences];
      if (referenceGroups.some((group) => !Array.isArray(group) || group.length > 30 ||
          group.some((reference) => typeof reference !== "string" || !reference.trim() || reference.length > 300))) {
        throw new TypeError("Coverage, availability and capacity evidence must be explicit lists of valid document paths.");
      }
      for (const actionList of [originRequiredActions, destinationRequiredActions]) {
        if (!Array.isArray(actionList) || actionList.length > 30 ||
            actionList.some((action) => typeof action !== "string" || !action.trim() || action.length > 120) ||
            new Set(actionList).size !== actionList.length) {
          throw new TypeError("Required endpoint actions must be explicit unique action names.");
        }
      }
      assertText(reason, "An eligibility decision reason");
      if (outcome === "eligible" && evidenceReferences.length === 0) throw new TypeError("An eligible outcome requires attributable evidence references.");
      if (outcome === "conditionally_eligible" && (evidenceReferences.length === 0 || conditions.length === 0)) {
        throw new TypeError("Conditional eligibility requires evidence references and explicit conditions.");
      }
      if (outcome === "eligible" || outcome === "conditionally_eligible") {
        if (serviceCoverageEvidenceReferences.length === 0 ||
            operatingAvailabilityEvidenceReferences.length === 0 ||
            capacityEvidenceReferences.length === 0 ||
            originRequiredActions.length === 0 ||
            destinationRequiredActions.length === 0) {
          throw new TypeError("Positive eligibility requires service coverage, operating availability, capacity evidence and explicit actions for both PUDO endpoints.");
        }
        const requiredEvidence = [
          ...serviceCoverageEvidenceReferences,
          ...operatingAvailabilityEvidenceReferences,
          ...capacityEvidenceReferences,
        ];
        if (requiredEvidence.some((reference) => !evidenceReferences.includes(reference))) {
          throw new TypeError("Every coverage, availability and capacity evidence reference must be included in the decision evidence.");
        }
      }
      if ((outcome === "eligible" || outcome === "conditionally_eligible") &&
          (!(validUntil instanceof Date) || !Number.isFinite(validUntil.getTime()) || validUntil <= now())) {
        throw new TypeError("Positive eligibility requires an explicit future validity end.");
      }
      if (validUntil && (!(validUntil instanceof Date) || !Number.isFinite(validUntil.getTime()) || validUntil <= now())) {
        throw new TypeError("Eligibility validity must be a future date.");
      }

      const recordId = keyFor(serviceCode, originType, destinationType, originPudoLocationId, destinationPudoLocationId);
      const recordRef = eligibility.doc(recordId);
      const eventRef = recordRef.collection("events").doc();
      return db.runTransaction(async (transaction) => {
        await requirePermission(transaction, actorUid, ELIGIBILITY_PERMISSION, "approve service and endpoint eligibility");
        if (outcome === "conditionally_eligible") {
          for (const conditionReference of conditions) {
            const segments = conditionReference.split("/");
            if (segments.length < 2 || segments.length % 2 !== 0 ||
                !segments.every((segment) => ID.test(segment)) ||
                !evidenceReferences.includes(conditionReference)) {
              throw new TypeError("Each conditional eligibility requirement must be a current Firestore evidence document path included in the decision evidence.");
            }
          }
        }
        if (outcome === "eligible" || outcome === "conditionally_eligible") {
          const routeEvidenceReferences = evidenceReferences.filter((reference) => reference.startsWith("commercialRouteDistanceEvidence/"));
          const routeReviewReferences = evidenceReferences.filter((reference) => reference.startsWith("commercialRouteDistanceReviews/"));
          if (routeEvidenceReferences.length !== 1 || routeReviewReferences.length !== 1 ||
              routeEvidenceReferences[0].split("/")[1] !== routeReviewReferences[0].split("/")[1]) {
            throw new TypeError("Positive PUDO-to-PUDO eligibility requires exactly one matching route measurement and independent route review reference.");
          }
          const endpointRequirements = [
            { locationId: originPudoLocationId, actions: originRequiredActions },
            { locationId: destinationPudoLocationId, actions: destinationRequiredActions },
          ];
          for (const endpoint of endpointRequirements) {
            const locationId = endpoint.locationId!;
            const capabilityId = locationId + "__" + serviceCode;
            const capabilityPath = "pudoLocationServiceCapabilities/" + capabilityId;
            const [candidate, activation, verification, capability] = await Promise.all([
              transaction.get(locations.doc(locationId)),
              transaction.get(activations.doc(locationId)),
              transaction.get(verifications.doc(locationId)),
              transaction.get(capabilities.doc(capabilityId)),
            ]);
            if (!candidate.exists || candidate.data()?.lifecycle !== "active" ||
                !activation.exists || activation.data()?.status !== "active" ||
                !verification.exists || verification.data()?.status !== "approved_to_activate") {
              throw new TypeError("Every exact PUDO endpoint must be active and physically verified before eligibility can be approved.");
            }
            const capabilityData = capability.data();
            if (!capability.exists || !capabilityData || capabilityData.status !== "active" ||
                capabilityData.locationId !== locationId ||
                capabilityData.serviceCode !== serviceCode ||
                !Array.isArray(capabilityData.supportedActions) ||
                endpoint.actions.length === 0 ||
                endpoint.actions.some((action) => !capabilityData.supportedActions.includes(action))) {
              throw new TypeError("The PUDO endpoint does not have current approved capability for every required service action.");
            }
            const capabilityExpiry = dateMillis(capabilityData.validUntil);
            if (capabilityExpiry === null || capabilityExpiry <= now().getTime()) {
              throw new TypeError("PUDO endpoint service capability approval is missing or expired.");
            }
            const requiredLocationEvidence = [
              "pudoLocationVerifications/" + locationId,
              "pudoLocationActivations/" + locationId,
              capabilityPath,
            ];
            if (requiredLocationEvidence.some((reference) => !evidenceReferences.includes(reference))) {
              throw new TypeError("Eligibility must reference the physical verification, activation and service capability records for every exact PUDO endpoint.");
            }
          }
        }
        for (const reference of evidenceReferences) {
          if (!(reference.split("/").length >= 2 && reference.split("/").length % 2 === 0 && reference.split("/").every((segment) => ID.test(segment)))) {
            throw new TypeError("Each eligibility evidence reference must be a Firestore document path.");
          }
          const evidenceDocument = await transaction.get(db.doc(reference));
          if (!evidenceDocument.exists) throw new TypeError("An eligibility evidence reference does not exist: " + reference);
          const evidenceData = evidenceDocument.data()!;
          if ((outcome === "eligible" || outcome === "conditionally_eligible") &&
              [evidenceData.createdBy, evidenceData.recordedBy, evidenceData.inspectorUid, evidenceData.decisionMakerUid, evidenceData.activatedBy, evidenceData.reviewedBy, evidenceData.approvedBy]
                .some((evidenceActor) => evidenceActor === actorUid)) {
            throw new TypeError("Service eligibility approval must be independent of the referenced evidence creators and operational actors.");
          }
          if (outcome === "eligible" || outcome === "conditionally_eligible") {
            if (["revoked", "inactive", "expired", "not_approved"].includes(String(evidenceData.status ?? ""))) {
              throw new TypeError("An eligibility evidence reference is not in an active state: " + reference);
            }
            const evidenceExpiry = dateMillis(evidenceData.validUntil ?? evidenceData.expiresAt);
            if (evidenceExpiry !== null && evidenceExpiry <= now().getTime()) {
              throw new TypeError("An eligibility evidence reference has expired: " + reference);
            }
          }
        }
        const timestamp = serverTimestamp();
        transaction.set(recordRef, {
          schemaVersion: 1, serviceCode, originType, destinationType, originPudoLocationId, destinationPudoLocationId, outcome,
          evidenceReferences: [...evidenceReferences],
          serviceCoverageEvidenceReferences: [...serviceCoverageEvidenceReferences],
          operatingAvailabilityEvidenceReferences: [...operatingAvailabilityEvidenceReferences],
          capacityEvidenceReferences: [...capacityEvidenceReferences],
          originRequiredActions: [...originRequiredActions],
          destinationRequiredActions: [...destinationRequiredActions],
          conditions: [...conditions],
          reason: reason.trim(), decidedBy: actorUid, decidedAt: timestamp,
          validUntil: validUntil ?? null, updatedAt: timestamp,
        });
        transaction.create(eventRef, {
          action: outcome, actorUid, evidenceReferences: [...evidenceReferences],
          serviceCoverageEvidenceReferences: [...serviceCoverageEvidenceReferences],
          operatingAvailabilityEvidenceReferences: [...operatingAvailabilityEvidenceReferences],
          capacityEvidenceReferences: [...capacityEvidenceReferences],
          originRequiredActions: [...originRequiredActions],
          destinationRequiredActions: [...destinationRequiredActions],
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
    }) {
      const { serviceCode, originType, destinationType, originPudoLocationId, destinationPudoLocationId } = input;
      if (!SERVICES.has(serviceCode) || !ENDPOINTS.has(originType) || !ENDPOINTS.has(destinationType)) {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "The requested service or endpoint combination is unsupported." };
      }
      if (originType === "address" || destinationType === "address") {
        const addressRecord = await eligibility.doc(keyFor(serviceCode, originType, destinationType, originPudoLocationId, destinationPudoLocationId)).get();
        const addressData = addressRecord.data();
        if (addressRecord.exists && (
          addressData?.serviceCode !== serviceCode ||
          addressData?.originType !== originType ||
          addressData?.destinationType !== destinationType ||
          addressData?.originPudoLocationId !== originPudoLocationId ||
          addressData?.destinationPudoLocationId !== destinationPudoLocationId
        )) {
          return { eligible: false as const, outcome: "pending_verification" as const, reason: "The stored address eligibility decision does not match the requested endpoints." };
        }
        if (addressRecord.exists && (addressData?.outcome === "not_eligible" || addressData?.outcome === "revoked")) {
          return { eligible: false as const, outcome: addressData.outcome as CommercialEligibilityOutcome, reason: String(addressData.reason ?? "The service and endpoint combination is unavailable.") };
        }
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "Address endpoint eligibility requires an authoritative address-to-operational-point mapping." };
      }
      if (originType === "pudo" && (!originPudoLocationId || !(await isActivePudo(originPudoLocationId)))) {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "The origin PUDO is not active." };
      }
      if (destinationType === "pudo" && (!destinationPudoLocationId || !(await isActivePudo(destinationPudoLocationId)))) {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "The destination PUDO is not active." };
      }
      const record = await eligibility.doc(keyFor(serviceCode, originType, destinationType, originPudoLocationId, destinationPudoLocationId)).get();
      if (!record.exists) return { eligible: false as const, outcome: "pending_verification" as const, reason: "No DEC-047 eligibility decision has been recorded." };
      const data = record.data()!;
      if (data.serviceCode !== serviceCode ||
          data.originType !== originType ||
          data.destinationType !== destinationType ||
          data.originPudoLocationId !== originPudoLocationId ||
          data.destinationPudoLocationId !== destinationPudoLocationId) {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "The stored eligibility decision does not match the requested service and exact endpoints." };
      }
      if (data.outcome === "pending_verification") {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: String(data.reason ?? "The service and endpoint combination remains pending verification.") };
      }
      if (data.outcome === "revoked" || data.outcome === "not_eligible") {
        return { eligible: false as const, outcome: data.outcome as CommercialEligibilityOutcome, reason: String(data.reason ?? "The service and endpoint combination is unavailable.") };
      }
      if (!Array.isArray(data.evidenceReferences) || data.evidenceReferences.length === 0) {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "The eligibility decision has no attributable evidence references." };
      }
      const evidenceReferences = data.evidenceReferences as string[];
      for (const reference of evidenceReferences) {
        if (typeof reference !== "string" || !(reference.split("/").length >= 2 && reference.split("/").length % 2 === 0 && reference.split("/").every((segment) => ID.test(segment)))) {
          return { eligible: false as const, outcome: "pending_verification" as const, reason: "An eligibility evidence reference is malformed." };
        }
        const evidenceDocument = await db.doc(reference).get();
        if (!evidenceDocument.exists) return { eligible: false as const, outcome: "pending_verification" as const, reason: "An eligibility evidence record is no longer available." };
        const evidenceData = evidenceDocument.data()!;
        if (["revoked", "inactive", "expired", "not_approved"].includes(String(evidenceData.status ?? ""))) {
          return { eligible: false as const, outcome: "pending_verification" as const, reason: "An eligibility evidence record is no longer current." };
        }
        const evidenceExpiry = dateMillis(evidenceData.validUntil ?? evidenceData.expiresAt);
        if (evidenceExpiry !== null && evidenceExpiry <= now().getTime()) {
          return { eligible: false as const, outcome: "pending_verification" as const, reason: "An eligibility evidence record has expired." };
        }
      }
      const serviceCoverageRefs = Array.isArray(data.serviceCoverageEvidenceReferences) ? data.serviceCoverageEvidenceReferences as string[] : [];
      const availabilityRefs = Array.isArray(data.operatingAvailabilityEvidenceReferences) ? data.operatingAvailabilityEvidenceReferences as string[] : [];
      const capacityRefs = Array.isArray(data.capacityEvidenceReferences) ? data.capacityEvidenceReferences as string[] : [];
      const originActions = Array.isArray(data.originRequiredActions) ? data.originRequiredActions as string[] : [];
      const destinationActions = Array.isArray(data.destinationRequiredActions) ? data.destinationRequiredActions as string[] : [];
      const categorizedRefs = [...serviceCoverageRefs, ...availabilityRefs, ...capacityRefs];
      if (serviceCoverageRefs.length === 0 || availabilityRefs.length === 0 || capacityRefs.length === 0 ||
          categorizedRefs.some((reference) => !evidenceReferences.includes(reference)) ||
          originActions.length === 0 || destinationActions.length === 0) {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "The eligibility decision is missing current coverage, availability, capacity or endpoint-action evidence." };
      }
      const capabilityEvidence: Array<Record<string, unknown>> = [];
      for (const endpoint of [
        { locationId: originPudoLocationId, actions: originActions },
        { locationId: destinationPudoLocationId, actions: destinationActions },
      ]) {
        const capabilityId = endpoint.locationId + "__" + serviceCode;
        const capabilityPath = "pudoLocationServiceCapabilities/" + capabilityId;
        if (!evidenceReferences.includes(capabilityPath)) {
          return { eligible: false as const, outcome: "pending_verification" as const, reason: "The eligibility decision does not reference the exact PUDO service capability record." };
        }
        const capability = await capabilities.doc(capabilityId).get();
        const capabilityData = capability.data();
        const capabilityExpiry = dateMillis(capabilityData?.validUntil);
        if (!capability.exists || !capabilityData || capabilityData.status !== "active" ||
            capabilityData.locationId !== endpoint.locationId ||
            capabilityData.serviceCode !== serviceCode ||
            capabilityExpiry === null || capabilityExpiry <= now().getTime() ||
            !Array.isArray(capabilityData.supportedActions) ||
            endpoint.actions.some((action) => !capabilityData.supportedActions.includes(action))) {
          return { eligible: false as const, outcome: "pending_verification" as const, reason: "A required PUDO service capability is missing, expired or does not support the required endpoint actions." };
        }
        capabilityEvidence.push({ capabilityId, ...capabilityData });
      }
      const expiry = dateMillis(data.validUntil);
      if (expiry === null || expiry <= now().getTime()) {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "The eligibility decision is missing a current validity end or has expired." };
      }
      if (data.outcome !== "eligible" && data.outcome !== "conditionally_eligible") {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "The eligibility decision is not usable." };
      }
      const requiredConditions = Array.isArray(data.conditions) ? data.conditions as string[] : [];
      if (data.outcome === "conditionally_eligible" &&
          (requiredConditions.length === 0 ||
           requiredConditions.some((condition) =>
             typeof condition !== "string" ||
             !evidenceReferences.includes(condition) ||
             condition.split("/").length < 2 ||
             condition.split("/").length % 2 !== 0 ||
             !condition.split("/").every((segment) => ID.test(segment))
           ))) {
        return { eligible: false as const, outcome: "conditionally_eligible" as const, reason: "The conditional eligibility record has no valid current evidence references.", conditions: requiredConditions };
      }
      return {
        eligible: true as const,
        outcome: data.outcome as "eligible" | "conditionally_eligible",
        recordId: record.id,
        evidenceReferences,
        serviceCoverageEvidenceReferences: serviceCoverageRefs,
        operatingAvailabilityEvidenceReferences: availabilityRefs,
        capacityEvidenceReferences: capacityRefs,
        originRequiredActions: originActions,
        destinationRequiredActions: destinationActions,
        capabilityEvidence,
        decidedBy: data.decidedBy,
        decidedAt: data.decidedAt,
        validUntil: data.validUntil,
        conditions: requiredConditions,
      };
    },

    async getApprovedCommercialTerms(serviceCode: CommercialServiceCode) {
      if (!SERVICES.has(serviceCode)) return null;
      const approval = await commercialTerms.doc(serviceCode).get();
      if (!approval.exists) return null;
      const data = approval.data()!;
      if (data.status !== "approved" || data.serviceCode !== serviceCode ||
          typeof data.pricingDefinitionId !== "string" || !ID.test(data.pricingDefinitionId) ||
          typeof data.pricingVersionId !== "string" || !ID.test(data.pricingVersionId) ||
          typeof data.currency !== "string" || !/^[A-Z]{3}$/.test(data.currency) ||
          !Number.isSafeInteger(data.quoteValidityMinutes) || data.quoteValidityMinutes < 1 ||
          !Number.isSafeInteger(data.handoverWindowMinutes) || data.handoverWindowMinutes < 1 ||
          typeof data.approvedBy !== "string" || !data.approvedBy ||
          !data.approvedAt ||
          !["none", "half_up", "half_even", "ceil", "floor"].includes(String(data.roundingMode)) ||
          !Number.isSafeInteger(data.decimalPlaces) || data.decimalPlaces < 0 || data.decimalPlaces > 6 ||
          (data.roundingMode === "none" && data.decimalPlaces !== 0) ||
          data.roundingStage !== "total_only" ||
          !["included_in_components", "not_applicable"].includes(String(data.taxTreatment)) ||
          !["included_in_components", "not_applicable"].includes(String(data.surchargeTreatment)) ||
          !["included_in_components", "not_applicable"].includes(String(data.discountTreatment)) ||
          !["included_in_components", "not_applicable"].includes(String(data.feeTreatment))) return null;
      const definition = await pricingDefinitions.doc(data.pricingDefinitionId).get();
      if (!definition.exists) return null;
      const lineage = definition.data()!;
      if (lineage.currentVersionId !== data.pricingVersionId ||
          lineage.publishedVersionId !== data.pricingVersionId ||
          lineage.approvedVersionId !== data.pricingVersionId ||
          lineage.currentVersionNumber !== lineage.publishedVersionNumber ||
          lineage.currentVersionNumber !== lineage.approvedVersionNumber) return null;
      const workflow = await definition.ref.collection("versions").doc(data.pricingVersionId).collection("approval").doc("workflow").get();
      if (!workflow.exists || workflow.data()?.state !== "approved") return null;
      const version = await definition.ref.collection("versions").doc(data.pricingVersionId).get();
      if (!version.exists || version.data()?.serviceCode !== serviceCode ||
          version.data()?.versionNumber !== lineage.currentVersionNumber ||
          !version.data()?.pricingModel ||
          !Array.isArray(version.data()?.components) ||
          version.data()!.components.length === 0) return null;
      return {
        ...data,
        pricingVersionNumber: version.data()?.versionNumber,
        pricingConfiguration: Object.fromEntries(Object.entries(version.data()!).filter(([key]) => !["versionNumber", "createdAt", "createdBy"].includes(key))),
        approvedVersion: data.pricingVersionId,
      };
    },
  };
}
