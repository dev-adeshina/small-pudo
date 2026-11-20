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
  if (Object.keys(input).some((key) => key !== "draftId" && key !== "serviceCode") ||
      typeof input.draftId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(input.draftId) ||
      !["standard", "express", "scheduled"].includes(String(input.serviceCode))) {
    return NextResponse.json({ error: "A valid shipment draft and service selection are required." }, { status: 400 });
  }

  try {
    const draftRef = adminDb.collection("users").doc(customer.uid).collection("shipmentBookingDrafts").doc(input.draftId);
    const draftSnapshot = await draftRef.get();
    if (!draftSnapshot.exists || draftSnapshot.data()?.status !== "draft") return NextResponse.json({ error: "The shipment draft was not found or is no longer editable." }, { status: 404 });
    const draft = draftSnapshot.data()!;
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

    const configuration = terms.pricingConfiguration as CommercialPricingConfiguration;
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
    }
    if (requiresRoute && !routeRecord) return NextResponse.json({
      error: "The approved pricing configuration requires reviewed route-distance evidence for these exact operational endpoints.",
    }, { status: 409 });

    const parcelValues = draft.parcelInput
      ? buildCommercialParcelPricingInputValues(configuration, draft.parcelInput as CommercialParcelInput)
      : {};
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

    const issuedAt = new Date();
    const validUntil = new Date(issuedAt.getTime() + Number(terms.quoteValidityMinutes) * 60_000);
    const snapshot = {
      schemaVersion: 1, serviceCode, draftId: input.draftId,
      origin: draft.origin, destination: draft.destination,
      originPudoLocationId: draft.originPudoLocationId ?? null,
      destinationPudoLocationId: draft.destinationPudoLocationId ?? null,
      parcelDescription: draft.parcelDescription,
      parcelInput: draft.parcelInput ?? null,
      eligibility: { outcome: eligibility.outcome, recordId: eligibility.recordId, evidenceReferences: eligibility.evidenceReferences, conditions: eligibility.conditions },
      routeEvidence: routeRecord ? { evidenceId: routeRecord.evidenceId, evidence: routeRecord.evidence, review: routeRecord.review } : null,
      pricing: {
        definitionId: evaluation.definitionId, versionId: evaluation.versionId, versionNumber: evaluation.versionNumber,
        components: evaluation.components, total: evaluation.total, currency: terms.currency,
        inputValues: values, authority: "owner_approved_DEC-048_configuration",
        approvedTerms: {
          approvedBy: terms.approvedBy, approvedAt: terms.approvedAt,
          roundingPolicy: terms.roundingPolicy, taxTreatment: terms.taxTreatment,
          surchargeTreatment: terms.surchargeTreatment, discountTreatment: terms.discountTreatment,
          feeTreatment: terms.feeTreatment,
        },
      },
      quoteTerms: { validUntil, quoteValidityMinutes: terms.quoteValidityMinutes, handoverWindowMinutes: terms.handoverWindowMinutes },
      issuedFromDraftAt: issuedAt,
    };
    const quote = await shipmentQuoteStore.issueQuote({
      bookingPartyUid: customer.uid, snapshot, validUntil,
      handoverWindowMinutes: Number(terms.handoverWindowMinutes),
      issuedBy: "system:approved-quotation-issuance",
    });
    return NextResponse.json({ success: true, quote }, { status: 201 });
  } catch (error) {
    if (error instanceof TypeError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Customer quotation issuance failed:", error);
    return NextResponse.json({ error: "The quotation could not be issued because one or more authoritative inputs or approvals are unavailable." }, { status: 409 });
  }
}
