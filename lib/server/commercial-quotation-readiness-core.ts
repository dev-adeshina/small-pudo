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
export interface ApprovedCommercialTerms {
  serviceCode: CommercialServiceCode;
  pricingDefinitionId: string;
  pricingVersionId: string;
  pricingVersionNumber: number;
  pricingConfiguration: Record<string, unknown>;
  approvedVersion: string;
  currency: string;
  roundingMode: string;
  decimalPlaces: number;
  roundingStage: string;
  taxTreatment: string;
  surchargeTreatment: string;
  discountTreatment: string;
  feeTreatment: string;
  quoteValidityMinutes: number;
  handoverWindowMinutes: number;
  approvedBy: string;
  approvedAt: unknown;
}

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
const OPERATIONAL_EVIDENCE_RECORD_PERMISSION = "commercial_operational_evidence.record";
const OPERATIONAL_EVIDENCE_REVIEW_PERMISSION = "commercial_operational_evidence.review";
const OPERATIONAL_EVIDENCE_REVOKE_PERMISSION = "commercial_operational_evidence.revoke";
type OperationalEvidenceKind = "service_coverage" | "operating_availability" | "capacity";


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
  const operationalEvidence = db.collection("commercialOperationalEvidence");
  const operationalEvidenceReviews = db.collection("commercialOperationalEvidenceReviews");

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

  async function loadApprovedOperationalEvidence(reference: string, transaction?: Transaction) {
    const segments = reference.split("/");
    if (segments.length !== 2 || segments[0] !== "commercialOperationalEvidence" || !ID.test(segments[1])) return null;
    const evidenceRef = operationalEvidence.doc(segments[1]);
    const reviewRef = operationalEvidenceReviews.doc(segments[1]);
    const [evidenceSnapshot, reviewSnapshot] = transaction
      ? await Promise.all([transaction.get(evidenceRef), transaction.get(reviewRef)])
      : await Promise.all([evidenceRef.get(), reviewRef.get()]);
    if (!evidenceSnapshot.exists || !reviewSnapshot.exists) return null;
    const evidence = evidenceSnapshot.data()!;
    const review = reviewSnapshot.data()!;
    const evidenceStart = dateMillis(evidence.validFrom);
    const evidenceEnd = dateMillis(evidence.validUntil);
    const reviewEnd = dateMillis(review.validUntil);
    if (review.status !== "approved" || review.decision !== "approve" ||
      review.evidenceId !== segments[1] || typeof review.reviewedBy !== "string" ||
      !review.reviewedBy || review.reviewedBy === evidence.recordedBy ||
      evidenceStart === null || evidenceEnd === null || reviewEnd === null ||
      evidenceStart > now().getTime() || evidenceEnd <= now().getTime() ||
      reviewEnd <= now().getTime() || reviewEnd > evidenceEnd ||
      canonicalJson(review.evidenceSnapshot) !== canonicalJson(evidence)) return null;
    return { evidenceId: segments[1], evidence, review };
  }

  function operationalEvidenceMatches(
    item: { evidence: Record<string, unknown> },
    kind: OperationalEvidenceKind,
    serviceCode: CommercialServiceCode,
    originId: string,
    destinationId: string,
  ): boolean {
    const evidence = item.evidence;
    if (evidence.kind !== kind || evidence.serviceCode !== serviceCode) return false;
    const scope = evidence.scope as Record<string, unknown> | undefined;
    if (!scope) return false;
    if (kind === "service_coverage") {
      if (scope.scopeType === "route") {
        return scope.originOperationalPointRef === originId &&
          scope.destinationOperationalPointRef === destinationId;
      }
      const points = scope.operationalPointRefs;
      return scope.scopeType === "area" && Array.isArray(points) &&
        points.includes(originId) && points.includes(destinationId);
    }
    return scope.locationId === originId || scope.locationId === destinationId;
  }

  async function hasApprovedRouteEvidence(
    evidenceReference: string,
    reviewReference: string,
    originId: string,
    destinationId: string,
    actorUid?: string,
    transaction?: Transaction,
  ): Promise<boolean> {
    const evidenceSegments = evidenceReference.split("/");
    const reviewSegments = reviewReference.split("/");
    if (evidenceSegments.length !== 2 || reviewSegments.length !== 2 ||
      evidenceSegments[0] !== "commercialRouteDistanceEvidence" ||
      reviewSegments[0] !== "commercialRouteDistanceReviews" ||
      !ID.test(evidenceSegments[1]) || evidenceSegments[1] !== reviewSegments[1]) return false;
    const evidenceRef = routeEvidence.doc(evidenceSegments[1]);
    const reviewRef = routeReviews.doc(reviewSegments[1]);
    const [evidenceSnapshot, reviewSnapshot] = transaction
      ? await Promise.all([transaction.get(evidenceRef), transaction.get(reviewRef)])
      : await Promise.all([evidenceRef.get(), reviewRef.get()]);
    if (!evidenceSnapshot.exists || !reviewSnapshot.exists) return false;
    const row = evidenceSnapshot.data()!;
    const evidence = row.evidence as Record<string, unknown> | undefined;
    const review = reviewSnapshot.data()!;
    const reviewExpiry = dateMillis(review.validUntil);
    if (!evidence || row.originOperationalPointRef !== originId ||
      row.destinationOperationalPointRef !== destinationId ||
      evidence.originOperationalPointRef !== originId ||
      evidence.destinationOperationalPointRef !== destinationId ||
      evidence.method === "straight_line" ||
      evidence.recordedBy === review.reviewedBy ||
      (actorUid !== undefined && (evidence.recordedBy === actorUid || review.reviewedBy === actorUid)) ||
      review.status !== "approved" || review.decision !== "approve" ||
      review.evidenceId !== evidenceSegments[1] ||
      typeof review.reviewedBy !== "string" || !review.reviewedBy ||
      reviewExpiry === null || reviewExpiry <= now().getTime() ||
      typeof evidence.source !== "string" || !evidence.source.trim() ||
      typeof evidence.supportingReference !== "string" || !evidence.supportingReference.trim() ||
      typeof evidence.measuredOn !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(evidence.measuredOn) ||
      !Number.isFinite(Date.parse(evidence.measuredOn + "T00:00:00Z")) ||
      Date.parse(evidence.measuredOn + "T00:00:00Z") > now().getTime() ||
      canonicalJson(review.evidenceSnapshot) !== canonicalJson(evidence)) return false;
    try {
      assertCommercialRouteDistanceEvidence(evidence);
    } catch {
      return false;
    }
    return true;
  }

  return {
    async recordOperationalEvidence(input: {
      actorUid: string;
      kind: OperationalEvidenceKind;
      serviceCode: CommercialServiceCode;
      source: string;
      supportingReference: string;
      validFrom: Date;
      validUntil: Date;
      scope: Record<string, unknown>;
      details: Record<string, unknown>;
    }) {
      const { actorUid, kind, serviceCode, source, supportingReference, validFrom, validUntil, scope, details } = input;
      assertActor(actorUid);
      if (!["service_coverage", "operating_availability", "capacity"].includes(kind)) throw new TypeError("Unsupported operational evidence type.");
      if (!SERVICES.has(serviceCode)) throw new TypeError("Unsupported service code.");
      assertText(source, "An evidence source", 500);
      assertText(supportingReference, "A traceable supporting reference", 1000);
      if (!(validFrom instanceof Date) || !Number.isFinite(validFrom.getTime()) ||
        !(validUntil instanceof Date) || !Number.isFinite(validUntil.getTime()) ||
        validUntil <= validFrom || validUntil <= now()) {
        throw new TypeError("Operational evidence requires a valid effective period ending in the future.");
      }
      if (!scope || typeof scope !== "object" || Array.isArray(scope) ||
        !details || typeof details !== "object" || Array.isArray(details)) {
        throw new TypeError("Evidence scope and details must be structured records.");
      }
      const cleanScope = { ...scope };
      const cleanDetails = { ...details };
      if (kind === "service_coverage") {
        if (!["area", "route"].includes(String(cleanScope.scopeType))) throw new TypeError("Coverage evidence must identify an operational area or directed route.");
        if (cleanScope.scopeType === "area") {
          assertText(cleanScope.areaRef, "A covered operational area reference", 300);
          if (!Array.isArray(cleanScope.operationalPointRefs) || cleanScope.operationalPointRefs.length < 2 ||
            cleanScope.operationalPointRefs.some((item) => typeof item !== "string" || !ID.test(item))) {
            throw new TypeError("Area coverage evidence must enumerate the operational points it covers.");
          }
        }
        if (cleanScope.scopeType === "route") {
          assertId(String(cleanScope.originOperationalPointRef ?? ""), "A route origin operational point ID");
          assertId(String(cleanScope.destinationOperationalPointRef ?? ""), "A route destination operational point ID");
          if (cleanScope.originOperationalPointRef === cleanScope.destinationOperationalPointRef) throw new TypeError("A covered route must have distinct directed endpoints.");
        }
        assertText(cleanDetails.coverageBasis, "A coverage basis", 1000);
      } else if (kind === "operating_availability") {
        assertId(String(cleanScope.locationId ?? ""), "PUDO location ID");
        if (!Array.isArray(cleanDetails.operatingWindows) || cleanDetails.operatingWindows.length === 0 ||
          cleanDetails.operatingWindows.length > 50 ||
          cleanDetails.operatingWindows.some((item) => typeof item !== "string" || !item.trim() || item.length > 200)) {
          throw new TypeError("Availability evidence requires explicit operating windows.");
        }
        assertText(cleanDetails.timeZone, "The operating time zone", 100);
      } else {
        assertId(String(cleanScope.locationId ?? ""), "PUDO location ID");
        assertText(cleanDetails.capacityBasis, "A capacity basis", 500);
        assertText(cleanDetails.capacityUnit, "A capacity unit", 100);
        if (typeof cleanDetails.supportedLoad !== "number" || !Number.isFinite(cleanDetails.supportedLoad) || cleanDetails.supportedLoad <= 0) {
          throw new TypeError("Capacity evidence requires a positive, measurable supported load.");
        }
      }
      const evidenceRef = operationalEvidence.doc();
      const eventRef = evidenceRef.collection("events").doc();
      return db.runTransaction(async (transaction) => {
        await requirePermission(transaction, actorUid, OPERATIONAL_EVIDENCE_RECORD_PERMISSION, "record operational evidence");
        if (kind !== "service_coverage") {
          const [location, activation, verification] = await Promise.all([
            transaction.get(locations.doc(String(cleanScope.locationId))),
            transaction.get(activations.doc(String(cleanScope.locationId))),
            transaction.get(verifications.doc(String(cleanScope.locationId))),
          ]);
          if (!location.exists || location.data()?.lifecycle !== "active" ||
            !activation.exists || activation.data()?.status !== "active" ||
            !verification.exists || verification.data()?.status !== "approved_to_activate") {
            throw new TypeError("PUDO-specific evidence can only be recorded for an active, physically verified and activated location.");
          }
        }
        const timestamp = serverTimestamp();
        transaction.create(evidenceRef, {
          schemaVersion: 1, evidenceId: evidenceRef.id, kind, serviceCode,
          source: source.trim(), supportingReference: supportingReference.trim(),
          validFrom, validUntil, scope: cleanScope, details: cleanDetails,
          recordedBy: actorUid, recordedAt: timestamp, createdAt: timestamp,
        });
        transaction.create(eventRef, {
          action: "recorded", evidenceId: evidenceRef.id, kind, serviceCode,
          actorUid, timestamp,
        });
        return { evidenceId: evidenceRef.id, kind, serviceCode, reviewStatus: "pending_review" as const };
      });
    },

    async reviewOperationalEvidence(actorUid: string, evidenceId: string, decision: "approve" | "reject", reason: string, validUntil?: Date) {
      assertActor(actorUid);
      assertId(evidenceId, "Operational evidence ID");
      if (decision !== "approve" && decision !== "reject") throw new TypeError("A valid evidence review decision is required.");
      assertText(reason, "An evidence review reason");
      if (decision === "approve" && (!(validUntil instanceof Date) || !Number.isFinite(validUntil.getTime()) || validUntil <= now())) {
        throw new TypeError("Evidence approval requires an explicit future validity end.");
      }
      const evidenceRef = operationalEvidence.doc(evidenceId);
      const reviewRef = operationalEvidenceReviews.doc(evidenceId);
      const eventRef = reviewRef.collection("events").doc();
      return db.runTransaction(async (transaction) => {
        await requirePermission(transaction, actorUid, OPERATIONAL_EVIDENCE_REVIEW_PERMISSION, "review operational evidence");
        const [evidenceSnapshot, previousReview] = await Promise.all([
          transaction.get(evidenceRef), transaction.get(reviewRef),
        ]);
        if (!evidenceSnapshot.exists) throw new Error("Operational evidence was not found.");
        const evidence = evidenceSnapshot.data()!;
        if (evidence.recordedBy === actorUid) throw new Error("Operational evidence review must be independent of its recorder.");
        if (previousReview.data()?.status === "revoked") throw new Error("Revoked operational evidence cannot be re-approved; record a new evidence item.");
        if (decision === "approve" && validUntil! > (dateMillis(evidence.validUntil) === null ? new Date(0) : new Date(dateMillis(evidence.validUntil)!))) {
          throw new TypeError("Review validity cannot extend beyond the recorded evidence validity.");
        }
        const timestamp = serverTimestamp();
        transaction.set(reviewRef, {
          evidenceId, decision, status: decision === "approve" ? "approved" : "rejected",
          evidenceSnapshot: evidence, validUntil: decision === "approve" ? validUntil : null,
          reason: reason.trim(), reviewedBy: actorUid, reviewedAt: timestamp, updatedAt: timestamp,
        });
        transaction.create(eventRef, { action: decision, evidenceId, actorUid, reason: reason.trim(), timestamp });
        return { evidenceId, status: decision === "approve" ? "approved" : "rejected" };
      });
    },

    async revokeOperationalEvidence(actorUid: string, evidenceId: string, reason: string) {
      assertActor(actorUid);
      assertId(evidenceId, "Operational evidence ID");
      assertText(reason, "An evidence revocation reason");
      const evidenceRef = operationalEvidence.doc(evidenceId);
      const reviewRef = operationalEvidenceReviews.doc(evidenceId);
      const eventRef = reviewRef.collection("events").doc();
      return db.runTransaction(async (transaction) => {
        await requirePermission(transaction, actorUid, OPERATIONAL_EVIDENCE_REVOKE_PERMISSION, "revoke operational evidence");
        const [evidenceSnapshot, reviewSnapshot] = await Promise.all([
          transaction.get(evidenceRef), transaction.get(reviewRef),
        ]);
        if (!evidenceSnapshot.exists) throw new Error("Operational evidence was not found.");
        if (!reviewSnapshot.exists || reviewSnapshot.data()?.status !== "approved") throw new TypeError("Only currently approved operational evidence can be revoked.");
        const timestamp = serverTimestamp();
        transaction.set(reviewRef, {
          evidenceId, decision: "revoke", status: "revoked",
          evidenceSnapshot: evidenceSnapshot.data(), validUntil: null,
          reason: reason.trim(), reviewedBy: reviewSnapshot.data()?.reviewedBy ?? null,
          revokedBy: actorUid, revokedAt: timestamp, updatedAt: timestamp,
        });
        transaction.create(eventRef, { action: "revoked", evidenceId, actorUid, reason: reason.trim(), timestamp });
        return { evidenceId, status: "revoked" as const };
      });
    },

    async listOperationalEvidence(actorUid: string, filters?: { kind?: OperationalEvidenceKind; serviceCode?: CommercialServiceCode; locationId?: string }) {
      assertActor(actorUid);
      const permissions = await db.runTransaction(async (transaction) => {
        const [record, review, revoke, eligibilityApproval] = await Promise.all([
          hasStaffActionPermissionInTransaction(transaction, db, actorUid, OPERATIONAL_EVIDENCE_RECORD_PERMISSION),
          hasStaffActionPermissionInTransaction(transaction, db, actorUid, OPERATIONAL_EVIDENCE_REVIEW_PERMISSION),
          hasStaffActionPermissionInTransaction(transaction, db, actorUid, OPERATIONAL_EVIDENCE_REVOKE_PERMISSION),
          hasStaffActionPermissionInTransaction(transaction, db, actorUid, ELIGIBILITY_PERMISSION),
        ]);
        return { record, review, revoke, eligibilityApproval };
      });
      assertPermission(permissions.record || permissions.review || permissions.revoke || permissions.eligibilityApproval, "view operational evidence");
      const snapshot = await operationalEvidence.orderBy("recordedAt", "desc").limit(200).get();
      const rows = await Promise.all(snapshot.docs.map(async (document) => {
        const evidence = document.data();
        const reviewSnapshot = await operationalEvidenceReviews.doc(document.id).get();
        const review = reviewSnapshot.data();
        if (filters?.kind && evidence.kind !== filters.kind) return null;
        if (filters?.serviceCode && evidence.serviceCode !== filters.serviceCode) return null;
        if (filters?.locationId && evidence.scope?.locationId !== filters.locationId) return null;
        const evidenceExpiry = dateMillis(evidence.validUntil);
        const reviewExpiry = dateMillis(review?.validUntil);
        const evidenceStart = dateMillis(evidence.validFrom);
        const current = review?.status === "approved" && review?.decision === "approve" &&
          review?.evidenceId === document.id && review?.reviewedBy !== evidence.recordedBy &&
          canonicalJson(review?.evidenceSnapshot) === canonicalJson(evidence) &&
          reviewExpiry !== null && reviewExpiry > now().getTime() &&
          evidenceStart !== null && evidenceStart <= now().getTime() &&
          evidenceExpiry !== null && evidenceExpiry > now().getTime() && reviewExpiry <= evidenceExpiry;
        return {
          evidenceId: document.id, kind: evidence.kind, serviceCode: evidence.serviceCode,
          source: evidence.source, supportingReference: evidence.supportingReference,
          scope: evidence.scope, details: evidence.details,
          recordedBy: evidence.recordedBy,
          recordedAt: dateMillis(evidence.recordedAt) === null ? null : new Date(dateMillis(evidence.recordedAt)!).toISOString(),
          validFrom: dateMillis(evidence.validFrom) === null ? null : new Date(dateMillis(evidence.validFrom)!).toISOString(),
          validUntil: dateMillis(evidence.validUntil) === null ? null : new Date(dateMillis(evidence.validUntil)!).toISOString(),
          reviewStatus: review?.status ?? "pending_review",
          reviewedBy: review?.reviewedBy ?? null,
          reviewedAt: dateMillis(review?.reviewedAt) === null ? null : new Date(dateMillis(review?.reviewedAt)!).toISOString(),
          reviewValidUntil: dateMillis(review?.validUntil) === null ? null : new Date(dateMillis(review?.validUntil)!).toISOString(),
          reviewReason: review?.reason ?? null,
          revokedBy: review?.revokedBy ?? null,
          isCurrentApproved: current,
        };
      }));
      return {
        items: rows.filter((row): row is NonNullable<typeof row> => row !== null),
        permissions,
      };
    },

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
          if (row.originOperationalPointRef !== evidence.originOperationalPointRef ||
            row.destinationOperationalPointRef !== evidence.destinationOperationalPointRef ||
            typeof evidence.source !== "string" || !evidence.source.trim() ||
            typeof evidence.measuredOn !== "string" ||
            typeof evidence.supportingReference !== "string" || !evidence.supportingReference.trim()) {
            throw new Error("Route evidence is missing consistent endpoint, source, measurement-date or supporting-reference provenance.");
          }
          const measuredOn = Date.parse(evidence.measuredOn + "T00:00:00Z");
          if (!Number.isFinite(measuredOn) || measuredOn > now().getTime()) {
            throw new Error("Route evidence must have a valid measurement date that is not in the future.");
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

    async listRouteEvidenceForReview(actorUid: string) {
      assertActor(actorUid);
      await db.runTransaction(async (transaction) => {
        await requirePermission(transaction, actorUid, ROUTE_REVIEW_PERMISSION, "view the route-distance evidence review queue");
      });
      const snapshot = await routeEvidence.limit(100).get();
      const items = await Promise.all(snapshot.docs.map(async (doc) => {
        const row = doc.data();
        const evidence = row.evidence as Record<string, unknown> | undefined;
        if (!evidence || typeof evidence !== "object") return null;
        const reviewSnapshot = await routeReviews.doc(doc.id).get();
        const review = reviewSnapshot.exists ? reviewSnapshot.data()! : null;
        const iso = (value: unknown) => {
          const millis = dateMillis(value);
          if (millis !== null) return new Date(millis).toISOString();
          if (typeof value === "string" && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
          return null;
        };
        return {
          evidenceId: doc.id,
          originOperationalPointRef: row.originOperationalPointRef ?? evidence.originOperationalPointRef ?? null,
          destinationOperationalPointRef: row.destinationOperationalPointRef ?? evidence.destinationOperationalPointRef ?? null,
          distance: evidence.distance ?? null,
          method: evidence.method ?? null,
          source: evidence.source ?? null,
          measuredOn: evidence.measuredOn ?? null,
          supportingReference: evidence.supportingReference ?? null,
          recordedBy: evidence.recordedBy ?? null,
          recordedAt: iso(evidence.recordedAt ?? row.recordedAt),
          reviewStatus: review?.status ?? "pending_review",
          decision: review?.decision ?? null,
          reviewedBy: review?.reviewedBy ?? null,
          reviewedAt: iso(review?.reviewedAt),
          validUntil: iso(review?.validUntil),
          reason: review?.reason ?? null,
        };
      }));
      return { items: items.filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => (b.recordedAt ? Date.parse(b.recordedAt) : 0) - (a.recordedAt ? Date.parse(a.recordedAt) : 0)) };
    },

    async getRouteEvidenceForReview(actorUid: string, evidenceId: string) {
      assertActor(actorUid);
      assertId(evidenceId, "Route evidence ID");
      return db.runTransaction(async (transaction) => {
        await requirePermission(transaction, actorUid, ROUTE_REVIEW_PERMISSION, "view route-distance evidence for review");
        const evidenceRef = routeEvidence.doc(evidenceId);
        const reviewRef = routeReviews.doc(evidenceId);
        const [evidenceSnapshot, reviewSnapshot] = await Promise.all([
          transaction.get(evidenceRef),
          transaction.get(reviewRef),
        ]);
        if (!evidenceSnapshot.exists) throw new Error("Route-distance evidence was not found.");
        const row = evidenceSnapshot.data()!;
        const evidence = row.evidence as Record<string, unknown> | undefined;
        if (!evidence || typeof evidence !== "object") throw new Error("Route-distance evidence is malformed.");
        assertCommercialRouteDistanceEvidence(evidence);
        const review = reviewSnapshot.exists ? reviewSnapshot.data()! : null;
        return {
          evidenceId,
          originOperationalPointRef: row.originOperationalPointRef,
          destinationOperationalPointRef: row.destinationOperationalPointRef,
          evidence,
          review: review ? {
            status: review.status ?? "not_reviewed",
            decision: review.decision ?? null,
            reviewedBy: review.reviewedBy ?? null,
            reviewedAt: dateMillis(review.reviewedAt) === null ? null : new Date(dateMillis(review.reviewedAt)!).toISOString(),
            validUntil: dateMillis(review.validUntil) === null ? null : new Date(dateMillis(review.validUntil)!).toISOString(),
            reason: review.reason ?? null,
          } : null,
        };
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
        if (!review.exists || reviewData?.status !== "approved" ||
          reviewData?.decision !== "approve" || reviewData?.evidenceId !== doc.id ||
          typeof reviewData?.reviewedBy !== "string" || !reviewData.reviewedBy ||
          !evidence || data.originOperationalPointRef !== originId ||
          data.destinationOperationalPointRef !== destinationId) return null;
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
          evidence.recordedBy === reviewData.reviewedBy ||
          typeof evidence.source !== "string" || !evidence.source.trim() ||
          typeof evidence.supportingReference !== "string" || !evidence.supportingReference.trim() ||
          typeof evidence.measuredOn !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(evidence.measuredOn) ||
          !Number.isFinite(Date.parse(evidence.measuredOn + "T00:00:00Z")) ||
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
          const endpoints = [originPudoLocationId!, destinationPudoLocationId!];
          const categoryDefinitions: Array<{ refs: string[]; kind: OperationalEvidenceKind }> = [
            { refs: serviceCoverageEvidenceReferences, kind: "service_coverage" },
            { refs: operatingAvailabilityEvidenceReferences, kind: "operating_availability" },
            { refs: capacityEvidenceReferences, kind: "capacity" },
          ];
          for (const category of categoryDefinitions) {
            const loaded = await Promise.all(category.refs.map((reference) => loadApprovedOperationalEvidence(reference, transaction)));
            if (loaded.some((item) => !item)) {
              throw new TypeError("Positive DEC-047 eligibility requires independently approved, current typed operational evidence for every evidence category.");
            }
            const typed = loaded as Array<NonNullable<typeof loaded[number]>>;
            if (typed.some((item) => !operationalEvidenceMatches(item, category.kind, serviceCode, endpoints[0], endpoints[1]))) {
              throw new TypeError("Operational evidence type, service or exact endpoint scope does not match this DEC-047 decision.");
            }
            if (typed.some((item) => item.evidence.recordedBy === actorUid || item.review.reviewedBy === actorUid)) {
              throw new TypeError("DEC-047 approval must be independent of operational evidence recording and review.");
            }
            if (category.kind !== "service_coverage" &&
              endpoints.some((endpointId) => !typed.some((item) => item.evidence.scope.locationId === endpointId))) {
              throw new TypeError("Availability and capacity evidence must independently cover both exact PUDO endpoints.");
            }
          }
          const routeEvidenceReferences = evidenceReferences.filter((reference) => reference.startsWith("commercialRouteDistanceEvidence/"));
          const routeReviewReferences = evidenceReferences.filter((reference) => reference.startsWith("commercialRouteDistanceReviews/"));
          if (routeEvidenceReferences.length !== 1 || routeReviewReferences.length !== 1 ||
            !(await hasApprovedRouteEvidence(
              routeEvidenceReferences[0], routeReviewReferences[0],
              originPudoLocationId!, destinationPudoLocationId!, actorUid, transaction,
            ))) {
            throw new TypeError("Positive PUDO-to-PUDO eligibility requires exactly one current, independently reviewed road-route measurement for the exact directed endpoints.");
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
      const endpoints = [originPudoLocationId!, destinationPudoLocationId!];
      const categoryDefinitions: Array<{ refs: string[]; kind: OperationalEvidenceKind }> = [
        { refs: serviceCoverageRefs, kind: "service_coverage" },
        { refs: availabilityRefs, kind: "operating_availability" },
        { refs: capacityRefs, kind: "capacity" },
      ];
      const typedOperationalEvidence: Array<Record<string, unknown>> = [];
      for (const category of categoryDefinitions) {
        const loaded = await Promise.all(category.refs.map((reference) => loadApprovedOperationalEvidence(reference)));
        if (loaded.some((item) => !item)) {
          return { eligible: false as const, outcome: "pending_verification" as const, reason: "A required typed operational evidence record is missing, unapproved, expired, revoked or changed since review." };
        }
        const typed = loaded as Array<NonNullable<typeof loaded[number]>>;
        if (typed.some((item) => !operationalEvidenceMatches(item, category.kind, serviceCode, endpoints[0], endpoints[1]))) {
          return { eligible: false as const, outcome: "pending_verification" as const, reason: "A typed operational evidence record does not match the exact service and PUDO endpoint scope." };
        }
        if (category.kind !== "service_coverage" &&
          endpoints.some((endpointId) => !typed.some((item) => item.evidence.scope.locationId === endpointId))) {
          return { eligible: false as const, outcome: "pending_verification" as const, reason: "Current availability and capacity evidence is required for both exact PUDO endpoints." };
        }
        typedOperationalEvidence.push(...typed.map((item) => ({
          evidenceId: item.evidenceId, kind: item.evidence.kind, serviceCode: item.evidence.serviceCode,
          scope: item.evidence.scope, details: item.evidence.details,
          recordedBy: item.evidence.recordedBy, reviewedBy: item.review.reviewedBy,
          validUntil: item.evidence.validUntil,
        })));
      }
      const routeEvidenceReferences = evidenceReferences.filter((reference) => reference.startsWith("commercialRouteDistanceEvidence/"));
      const routeReviewReferences = evidenceReferences.filter((reference) => reference.startsWith("commercialRouteDistanceReviews/"));
      if (routeEvidenceReferences.length !== 1 || routeReviewReferences.length !== 1 ||
        !(await hasApprovedRouteEvidence(routeEvidenceReferences[0], routeReviewReferences[0], endpoints[0], endpoints[1]))) {
        return { eligible: false as const, outcome: "pending_verification" as const, reason: "The exact directed road-route evidence is missing, expired, revoked, changed since review or no longer independently approved." };
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
        const [capability, activation, verification] = await Promise.all([
          capabilities.doc(capabilityId).get(),
          activations.doc(endpoint.locationId!).get(),
          verifications.doc(endpoint.locationId!).get(),
        ]);
        const capabilityData = capability.data();
        const capabilityExpiry = dateMillis(capabilityData?.validUntil);
        if (!evidenceReferences.includes("pudoLocationActivations/" + endpoint.locationId) ||
          !evidenceReferences.includes("pudoLocationVerifications/" + endpoint.locationId) ||
          !activation.exists || activation.data()?.status !== "active" ||
          !verification.exists || verification.data()?.status !== "approved_to_activate" ||
          !capability.exists || !capabilityData || capabilityData.status !== "active" ||
          capabilityData.locationId !== endpoint.locationId ||
          capabilityData.serviceCode !== serviceCode ||
          capabilityExpiry === null || capabilityExpiry <= now().getTime() ||
          !Array.isArray(capabilityData.supportedActions) ||
          endpoint.actions.some((action) => !capabilityData.supportedActions.includes(action))) {
          return { eligible: false as const, outcome: "pending_verification" as const, reason: "A required PUDO activation, physical verification or service capability is missing, expired or does not support the required endpoint actions." };
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
        operationalEvidence: typedOperationalEvidence,
        decidedBy: data.decidedBy,
        decidedAt: data.decidedAt,
        validUntil: data.validUntil,
        conditions: requiredConditions,
      };
    },

    async getApprovedCommercialTerms(
      serviceCode: CommercialServiceCode,
    ): Promise<ApprovedCommercialTerms | null> {
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
        pricingVersionNumber: version.data()?.versionNumber as number,
        pricingConfiguration: Object.fromEntries(
          Object.entries(version.data()!).filter(
            ([key]) => !["versionNumber", "createdAt", "createdBy"].includes(key),
          ),
        ),
        approvedVersion: data.pricingVersionId,
      } as ApprovedCommercialTerms;
    },
  };
}
