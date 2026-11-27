import { NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
import { commercialQuotationReadinessStore } from "@/lib/server/commercial-quotation-readiness-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token) => adminAuth.verifyIdToken(token, true)
  );
  if (!customer.success) {
    return NextResponse.json({ error: customer.error }, { status: customer.status });
  }

  const serviceCode = new URL(request.url).searchParams.get("serviceCode");
  if (!["standard", "express", "scheduled"].includes(String(serviceCode))) {
    return NextResponse.json({ error: "Choose a supported quotation service." }, { status: 400 });
  }

  try {
    const terms = await commercialQuotationReadinessStore.getApprovedCommercialTerms(
      serviceCode as "standard" | "express" | "scheduled"
    );
    if (!terms) {
      return NextResponse.json({
        success: true,
        serviceCode,
        characteristics: [],
        unavailable: true,
      });
    }

    const configuration = terms.pricingConfiguration as {
      serviceCode?: unknown;
      parcelCharacteristics?: Array<{
        key: string;
        label: string;
        required: boolean;
        options: Array<{ key: string; label: string }>;
      }>;
    };
    if (configuration.serviceCode !== serviceCode) {
      return NextResponse.json({ error: "The approved pricing configuration is inconsistent." }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      serviceCode,
      pricingVersionId: terms.pricingVersionId,
      characteristics: (configuration.parcelCharacteristics ?? []).map((category) => ({
        key: category.key,
        label: category.label,
        required: category.required,
        options: category.options.map((option) => ({
          key: option.key,
          label: option.label,
        })),
      })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load approved parcel options." }, { status: 500 });
  }
}
