import { NextResponse } from "next/server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
import { shipmentQuoteStore } from "@/lib/server/shipment-quote-store";
import { commercialQuotationReadinessStore } from "@/lib/server/commercial-quotation-readiness-store";
import { evaluateCommercialPricing, type CommercialPricingConfiguration } from "@/lib/server/commercial-pricing-engine-core";
import { buildCommercialParcelPricingInputValues } from "@/lib/server/commercial-parcel-pricing-input-adapter-core";
import { buildCommercialRoutePricingInputValues } from "@/lib/server/commercial-route-pricing-input-adapter-core";
import type { CommercialParcelInput } from "@/lib/server/commercial-parcel-input-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function roundCommercialTotal(value: number, mode: unknown, decimalPlaces: unknown): number {
  if (!Number.isFinite(value) || value < 0) throw new TypeError("The evaluated quotation total must be a finite non-negative amount.");
  if (!["none", "half_up", "half_even", "ceil", "floor"].includes(String(mode))) throw new TypeError("The approved rounding mode is unavailable.");
  if (typeof decimalPlaces !== "number" || !Number.isSafeInteger(decimalPlaces) || decimalPlaces < 0 || decimalPlaces > 6) {
    throw new TypeError("The approved decimal precision is unavailable.");
  }
  if (mode === "none") {
    if (decimalPlaces !== 0) throw new TypeError("No-rounding terms must specify zero decimal places.");
    return value;
  }
  const factor = 10 ** decimalPlaces;
  const scaled = value * factor;
  if (!Number.isFinite(scaled)) throw new TypeError("The rounded quotation total is outside the supported numeric range.");
  let rounded: number;
  if (mode === "ceil") rounded = Math.ceil(scaled);
  else if (mode === "floor") rounded = Math.floor(scaled);
  else if (mode === "half_even") {
    const lower = Math.floor(scaled);
    const fraction = scaled - lower;
    rounded = Math.abs(fraction - 0.5) < 1e-10 ? (lower % 2 === 0 ? lower : lower + 1) : Math.round(scaled);
  } else {
    rounded = Math.floor(scaled + 0.5 + Number.EPSILON * Math.max(1, Math.abs(scaled)));
  }
  const result = rounded / factor;
  if (!Number.isFinite(result)) throw new TypeError("The rounded quotation total is invalid.");
  return result;
}

export async function GET(request: Request) {
  const customer = await authenticateVerifiedCustomer(request.headers.get("authorization"), (token) => adminAuth.verifyIdToken(token));
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });
  try {
    const quotes = await shipmentQuoteStore.listCustomerQuotes(customer.uid);
    return NextResponse.json({ success: true, quotes });
  } catch {
    return NextResponse.json({ error: "Unable to retrieve your quotations." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const customer = await authenticateVerifiedCustomer(request.headers.get("authorization"), (token) => adminAuth.verifyIdToken(token));
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "A valid quotation request is required." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "A valid quotation request is required." }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some((key) => !["draftId", "serviceCode", "quoteId", "expectedCurrentVersionId"].includes(key)) ||
    typeof input.draftId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(input.draftId) ||
    !["standard", "express", "scheduled"].includes(String(input.serviceCode)) ||
    ((input.quoteId === undefined) !== (input.expectedCurrentVersionId === undefined)) ||
    (input.quoteId !== undefined && (typeof input.quoteId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(input.quoteId))) ||
    (input.expectedCurrentVersionId !== undefined && (typeof input.expectedCurrentVersionId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(input.expectedCurrentVersionId)))) {
    return NextResponse.json({ error: "A valid shipment draft, service selection and optional current quotation version are required." }, { status: 400 });
  }

  try {
    const draftRef = adminDb.collection("users").doc(customer.uid).collection("shipmentBookingDrafts").doc(input.draftId);
    const draftSnapshot = await draftRef.get();
    if (!draftSnapshot.exists || draftSnapshot.data()?.status !== "draft") return NextResponse.json({ error: "The shipment draft was not found or is no longer editable." }, { status: 404 });
    const draft = draftSnapshot.data()!;
    if (draft.bookingPartyUid !== customer.uid) return NextResponse.json({ error: "The shipment draft is not owned by the authenticated booking party." }, { status: 404 });
    const serviceCode = input.serviceCode as "standard" | "express" | "scheduled";
    const originType = typeof draft.originPudoLocationId === "string" ? "pudo" : "address";
    const destinationType = typeof draft.destinationPudoLocationId === "string" ? "pudo" : "address";

    const eligibility = await commercialQuotationReadinessStore.evaluateEligibility({
      serviceCode, originType, destinationType,
      ...(originType === "pudo" ? { originPudoLocationId: draft.originPudoLocationId as string } : {}),
      ...(destinationType === "pudo" ? { destinationPudoLocationId: draft.destinationPudoLocationId as string } : {}),
    });
    if (!eligibility.eligible) return NextResponse.json({
      error: "This service and endpoint combination is not currently available for quotation.",
      eligibility,
    }, { status: 409 });

    const terms = await commercialQuotationReadinessStore.getApprovedCommercialTerms(serviceCode);
    if (!terms) return NextResponse.json({
      error: "This service does not yet have complete DEC-048 approved commercial terms and a current approved pricing version.",
    }, { status: 409 });

    const configuration =
      terms.pricingConfiguration as unknown as CommercialPricingConfiguration;
    if (configuration.serviceCode !== serviceCode || typeof terms.pricingVersionNumber !== "number" || !Number.isSafeInteger(terms.pricingVersionNumber)) {
      return NextResponse.json({ error: "The approved pricing configuration is inconsistent." }, { status: 409 });
    }

    const requiresRoute = configuration.inputs.some((definition) => definition.source === "route.distance");
    let routeRecord: Awaited<ReturnType<typeof commercialQuotationReadinessStore.getUsableRouteEvidence>> = null;
    if (originType === "pudo" && destinationType === "pudo") {
      routeRecord = await commercialQuotationReadinessStore.getUsableRouteEvidence(draft.originPudoLocationId as string, draft.destinationPudoLocationId as string);
      if (!routeRecord) return NextResponse.json({
        error: "A valid PUDO-to-PUDO journey requires reviewed route-distance evidence for these exact operational endpoints.",
      }, { status: 409 });
      const eligibilityEvidence = new Set(eligibility.evidenceReferences);
      if (!eligibilityEvidence.has("commercialRouteDistanceEvidence/" + routeRecord.evidenceId) ||
        !eligibilityEvidence.has("commercialRouteDistanceReviews/" + routeRecord.evidenceId)) {
        return NextResponse.json({
          error: "The DEC-047 eligibility approval must reference this exact route measurement and its independent review.",
        }, { status: 409 });
      }
    }
    if (requiresRoute && !routeRecord) return NextResponse.json({
      error: "The approved pricing configuration requires reviewed route-distance evidence for these exact operational endpoints.",
    }, { status: 409 });

    let parcelValues: Readonly<Record<string, number>> = {};
    if (draft.parcelInput) {
      const parcelInput = draft.parcelInput as CommercialParcelInput;
      if (parcelInput.actual !== undefined) throw new TypeError("Customer quotation requests cannot supply or replace actual intake measurements.");
      if (parcelInput.declared &&
        (parcelInput.declared.recordedBy !== customer.uid || parcelInput.declared.source !== "customer_declared")) {
        throw new TypeError("Declared parcel measurements must retain the authenticated customer's declared-evidence provenance.");
      }
      parcelValues = buildCommercialParcelPricingInputValues(configuration, parcelInput);
    }
    const routeValues = buildCommercialRoutePricingInputValues(configuration, routeRecord?.evidence as Parameters<typeof buildCommercialRoutePricingInputValues>[1]);
    const values = { ...parcelValues, ...routeValues };
    const evaluation = evaluateCommercialPricing({
      definitionId: terms.pricingDefinitionId as string,
      versionId: terms.pricingVersionId as string,
      versionNumber: terms.pricingVersionNumber,
      configuration,
      values,
    });
    if (evaluation.unit !== terms.currency) return NextResponse.json({
      error: "The evaluated pricing unit does not match the explicitly approved service currency.",
    }, { status: 409 });
    const roundedTotal = roundCommercialTotal(evaluation.total, terms.roundingMode, terms.decimalPlaces);

    const issuedAt = new Date();
    const validUntil = new Date(issuedAt.getTime() + Number(terms.quoteValidityMinutes) * 60_000);
    const snapshot = {
      schemaVersion: 1,
      serviceCode,
      draftId: input.draftId,
      origin: draft.origin,
      destination: draft.destination,
      originPudoLocationId: draft.originPudoLocationId ?? null,
      destinationPudoLocationId: draft.destinationPudoLocationId ?? null,
      parcelDescription: draft.parcelDescription,
      parcelInput: draft.parcelInput ?? null,
      eligibility: {
        outcome: eligibility.outcome,
        validUntil: eligibility.validUntil,
      },
      routeEvidence: routeRecord ? {
        distance: routeRecord.evidence.distance,
        method: routeRecord.evidence.method,
      } : null,
      pricing: {
        definitionId: evaluation.definitionId,
        versionId: evaluation.versionId,
        versionNumber: evaluation.versionNumber,
        components: evaluation.components,
        rawTotal: evaluation.total,
        total: roundedTotal,
        currency: terms.currency,
        rounding: { mode: terms.roundingMode, decimalPlaces: terms.decimalPlaces, stage: terms.roundingStage },
        inputValues: values,
        authority: "approved_DEC-048_terms_and_exact_pricing_version",
        approvedTerms: {
          roundingMode: terms.roundingMode,
          decimalPlaces: terms.decimalPlaces,
          roundingStage: terms.roundingStage,
          taxTreatment: terms.taxTreatment,
          surchargeTreatment: terms.surchargeTreatment,
          discountTreatment: terms.discountTreatment,
          feeTreatment: terms.feeTreatment,
        },
      },
      quoteTerms: {
        validUntil,
        quoteValidityMinutes: terms.quoteValidityMinutes,
        handoverWindowMinutes: terms.handoverWindowMinutes,
      },
      issuedFromDraftAt: issuedAt,
    };
    const internalEvidence = {
      schemaVersion: 1,
      eligibility,
      routeEvidence: routeRecord,
      pricing: {
        definitionId: evaluation.definitionId,
        versionId: evaluation.versionId,
        versionNumber: evaluation.versionNumber,
        configuration,
        inputValues: values,
        evaluation,
        approvedTerms: terms,
      },
      draft: {
        draftId: input.draftId,
        bookingPartyUid: customer.uid,
        origin: draft.origin,
        destination: draft.destination,
        originPudoLocationId: draft.originPudoLocationId ?? null,
        destinationPudoLocationId: draft.destinationPudoLocationId ?? null,
        parcelInput: draft.parcelInput ?? null,
      },
    };

    if (typeof input.quoteId === "string" && typeof input.expectedCurrentVersionId === "string") {
      const existingQuote = await shipmentQuoteStore.getCustomerQuote(customer.uid, input.quoteId);
      if (!existingQuote) return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
      if (existingQuote.currentVersionId !== input.expectedCurrentVersionId) {
        return NextResponse.json({ error: "The quotation has changed. Refresh before requesting a new version." }, { status: 409 });
      }
      const versions = Array.isArray(existingQuote.versions) ? existingQuote.versions as Array<Record<string, unknown>> : [];
      const currentVersion = versions.find((version) => version.versionId === input.expectedCurrentVersionId);
      const previousSnapshot = currentVersion?.snapshot as Record<string, unknown> | undefined;
      if (!previousSnapshot || previousSnapshot.draftId !== input.draftId || previousSnapshot.serviceCode !== serviceCode) {
        return NextResponse.json({ error: "A quotation can only be reissued for its original shipment draft and service." }, { status: 409 });
      }
      const revised = await shipmentQuoteStore.reviseIssuedQuote({
        quoteId: input.quoteId,
        expectedCurrentVersionId: input.expectedCurrentVersionId,
        snapshot,
        internalEvidence,
        validUntil,
        handoverWindowMinutes: Number(terms.handoverWindowMinutes),
        issuedBy: customer.uid,
      });
      if (revised.outcome === "already_accepted") return NextResponse.json({ error: "An accepted quotation cannot be reissued." }, { status: 409 });
      if (revised.outcome === "stale_version") return NextResponse.json({ error: "The quotation has changed. Refresh before requesting a new version.", currentVersionId: revised.currentVersionId }, { status: 409 });
      if (revised.outcome === "not_found") return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
      return NextResponse.json({ success: true, quote: { quoteId: input.quoteId, ...revised } }, { status: 201 });
    }

    const quote = await shipmentQuoteStore.issueQuote({
      bookingPartyUid: customer.uid, snapshot, internalEvidence, validUntil,
      handoverWindowMinutes: Number(terms.handoverWindowMinutes),
      issuedBy: customer.uid,
    });
    return NextResponse.json({ success: true, quote }, { status: 201 });
  } catch (error) {
    if (error instanceof TypeError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Customer quotation issuance failed:", error);
    return NextResponse.json({ error: "The quotation could not be issued because one or more authoritative inputs or approvals are unavailable." }, { status: 409 });
  }
}
