"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth } from "@/lib/firebase";

type ServiceCode = "standard" | "express" | "scheduled";

function lines(value: string): string[] {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

export default function CommercialQuotationReadinessPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [routeEvidenceId, setRouteEvidenceId] = useState("");
  const [routeDecision, setRouteDecision] = useState<"" | "approve" | "revoke">("");
  const [routeReason, setRouteReason] = useState("");
  const [routeValidUntil, setRouteValidUntil] = useState("");

  const [serviceCode, setServiceCode] = useState<ServiceCode | "">("");
  const [termsServiceCode, setTermsServiceCode] = useState<ServiceCode | "">("");
  const [eligibilityOriginType, setEligibilityOriginType] = useState<"address" | "pudo">("pudo");
  const [eligibilityDestinationType, setEligibilityDestinationType] = useState<"address" | "pudo">("pudo");
  const [originPudoLocationId, setOriginPudoLocationId] = useState("");
  const [destinationPudoLocationId, setDestinationPudoLocationId] = useState("");
  const [eligibilityOutcome, setEligibilityOutcome] = useState<"" | "pending_verification" | "eligible" | "conditionally_eligible" | "not_eligible" | "revoked">("");
  const [serviceCoverageReferences, setServiceCoverageReferences] = useState("");
  const [availabilityReferences, setAvailabilityReferences] = useState("");
  const [capacityReferences, setCapacityReferences] = useState("");
  const [originRequiredActions, setOriginRequiredActions] = useState("");
  const [destinationRequiredActions, setDestinationRequiredActions] = useState("");
  const [capabilityLocationId, setCapabilityLocationId] = useState("");
  const [capabilityServiceCode, setCapabilityServiceCode] = useState<ServiceCode | "">("");
  const [capabilityActions, setCapabilityActions] = useState("");
  const [capabilityEvidenceReferences, setCapabilityEvidenceReferences] = useState("");
  const [capabilityValidUntil, setCapabilityValidUntil] = useState("");
  const [capabilityReason, setCapabilityReason] = useState("");
  const [evidenceReferences, setEvidenceReferences] = useState("");
  const [conditions, setConditions] = useState("");
  const [eligibilityReason, setEligibilityReason] = useState("");
  const [eligibilityValidUntil, setEligibilityValidUntil] = useState("");

  const [pricingDefinitionId, setPricingDefinitionId] = useState("");
  const [pricingVersionId, setPricingVersionId] = useState("");
  const [currency, setCurrency] = useState("");
  const [quoteValidityMinutes, setQuoteValidityMinutes] = useState("");
  const [handoverWindowMinutes, setHandoverWindowMinutes] = useState("");
  const [roundingMode, setRoundingMode] = useState<"" | "none" | "half_up" | "half_even" | "ceil" | "floor">("");
  const [decimalPlaces, setDecimalPlaces] = useState("");
  const [taxTreatment, setTaxTreatment] = useState<"" | "included_in_components" | "not_applicable">("");
  const [surchargeTreatment, setSurchargeTreatment] = useState<"" | "included_in_components" | "not_applicable">("");
  const [discountTreatment, setDiscountTreatment] = useState<"" | "included_in_components" | "not_applicable">("");
  const [feeTreatment, setFeeTreatment] = useState<"" | "included_in_components" | "not_applicable">("");
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  const [termsRevocationReason, setTermsRevocationReason] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/staff/sign-in"); return; }
      if (!user.emailVerified) { router.replace("/admin/verify-email?email=" + encodeURIComponent(user.email ?? "")); return; }
      try {
        const idToken = await user.getIdToken();
        const activationResponse = await fetch("/api/staff/invitations/activate", {
          headers: { Authorization: "Bearer " + idToken }, cache: "no-store",
        });
        const activation = await activationResponse.json().catch(() => null);
        if (activationResponse.ok && ["pending", "expired"].includes(activation?.status)) {
          setError("Complete staff activation before using commercial quotation readiness.");
          return;
        }
        setToken(idToken);
        setEmail(user.email ?? "");
      } catch {
        setError("Unable to verify staff access.");
      } finally {
        setChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  async function post(path: string, body: Record<string, unknown>, successMessage: string) {
    if (!token || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "The request could not be completed.");
      setNotice(successMessage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The request could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const chargeTreatmentFields: Array<{
    label: string;
    value: "" | "included_in_components" | "not_applicable";
    setValue: (value: "" | "included_in_components" | "not_applicable") => void;
  }> = [
    { label: "Tax treatment", value: taxTreatment, setValue: setTaxTreatment },
    { label: "Surcharge treatment", value: surchargeTreatment, setValue: setSurchargeTreatment },
    { label: "Discount treatment", value: discountTreatment, setValue: setDiscountTreatment },
    { label: "Fee treatment", value: feeTreatment, setValue: setFeeTreatment },
  ];

  if (checking) return <main className="admin-loading"><span>Checking staff access...</span></main>;

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/admin/commercial-pricing-definitions" className="admin-logo">VeriLyft</Link>
        <div className="admin-header-right">
          <Link href="/admin/commercial-pricing-definitions" className="admin-action">Pricing definitions</Link>
          <Link href="/admin/commercial-route-distance" className="admin-action">Route evidence</Link>
          <span className="admin-email">{email}</span>
        </div>
      </header>
      <div className="admin-shell cost-admin-shell">
        <div className="cost-page-topline">
          <div>
            <span className="section-label">M1 / COMMERCIAL QUOTATION READINESS</span>
            <h1>Evidence and approval controls</h1>
            <p>Record attributable decisions. These controls do not create operational evidence, grant staff permissions, or make an unsupported service available.</p>
          </div>
        </div>
        {error && <div className="cost-alert"><strong>Unable to continue</strong><span>{error}</span></div>}
        {notice && <div className="cost-notice">{notice}</div>}

        <section className="cost-panel">
          <div className="cost-panel-heading"><div><span className="section-label">01 / ROUTE EVIDENCE</span><h2>Review a recorded route measurement</h2></div></div>
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault();
            void post("/api/staff/commercial-quotation-readiness/route-evidence/" + encodeURIComponent(routeEvidenceId) + "/review", { decision: routeDecision, reason: routeReason, ...(routeDecision === "approve" && routeValidUntil ? { validUntil: new Date(routeValidUntil).toISOString() } : {}) }, "Route evidence review recorded.");
          }}>
            <label className="block text-sm font-medium">Route evidence ID<input className="mt-2 w-full rounded-lg border p-3" value={routeEvidenceId} onChange={(event) => setRouteEvidenceId(event.target.value)} required /></label>
            <label className="block text-sm font-medium">Decision<select className="mt-2 w-full rounded-lg border p-3" value={routeDecision} onChange={(event) => setRouteDecision(event.target.value as typeof routeDecision)} required><option value="">Select review decision</option><option value="approve">Approve reviewed measurement</option><option value="revoke">Revoke approval</option></select></label>
            <label className="block text-sm font-medium">Review reason<textarea className="mt-2 w-full rounded-lg border p-3" value={routeReason} onChange={(event) => setRouteReason(event.target.value)} maxLength={2000} required /></label>
            {routeDecision === "approve" && <label className="block text-sm font-medium">Evidence validity end<input className="mt-2 w-full rounded-lg border p-3" type="datetime-local" value={routeValidUntil} onChange={(event) => setRouteValidUntil(event.target.value)} required /></label>}
            <button className="cost-primary-button" disabled={busy}>{busy ? "Saving..." : "Record route review"}</button>
            <p className="text-sm text-gray-600">Straight-line evidence cannot be approved as operational road-route evidence. Approval requires a reviewer-specified validity end and the separate <code>commercial_route_distance.approve</code> permission.</p>
          </form>
        </section>

        <section className="cost-panel">
          <div className="cost-panel-heading"><div><span className="section-label">02 / PUDO SERVICE CAPABILITY</span><h2>Approve endpoint actions for a service</h2></div></div>
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault();
            void post("/api/staff/commercial-quotation-readiness/pudo-capabilities", {
              locationId: capabilityLocationId,
              serviceCode: capabilityServiceCode,
              supportedActions: lines(capabilityActions),
              evidenceReferences: lines(capabilityEvidenceReferences),
              validUntil: capabilityValidUntil ? new Date(capabilityValidUntil).toISOString() : "",
              reason: capabilityReason,
            }, "PUDO service endpoint capability approved.");
          }}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">PUDO location ID<input className="mt-2 w-full rounded-lg border p-3" value={capabilityLocationId} onChange={(event) => setCapabilityLocationId(event.target.value)} required /></label>
              <label className="block text-sm font-medium">Service<select className="mt-2 w-full rounded-lg border p-3" value={capabilityServiceCode} onChange={(event) => setCapabilityServiceCode(event.target.value as ServiceCode | "")} required><option value="">Select service</option><option value="standard">Standard</option><option value="express">Express</option><option value="scheduled">Scheduled</option></select></label>
            </div>
            <label className="block text-sm font-medium">Supported endpoint actions (one explicit action per line)<textarea className="mt-2 w-full rounded-lg border p-3" value={capabilityActions} onChange={(event) => setCapabilityActions(event.target.value)} required rows={3} /></label>
            <label className="block text-sm font-medium">Capability evidence document paths<textarea className="mt-2 w-full rounded-lg border p-3" value={capabilityEvidenceReferences} onChange={(event) => setCapabilityEvidenceReferences(event.target.value)} required rows={4} placeholder={"pudoLocationVerifications/LOCATION_ID\npudoLocationActivations/LOCATION_ID"} /></label>
            <label className="block text-sm font-medium">Capability validity end<input className="mt-2 w-full rounded-lg border p-3" type="datetime-local" value={capabilityValidUntil} onChange={(event) => setCapabilityValidUntil(event.target.value)} required /></label>
            <label className="block text-sm font-medium">Approval reason<textarea className="mt-2 w-full rounded-lg border p-3" value={capabilityReason} onChange={(event) => setCapabilityReason(event.target.value)} required maxLength={2000} /></label>
            <button className="cost-primary-button" disabled={busy}>{busy ? "Saving..." : "Approve PUDO service capability"}</button>
            <p className="text-sm text-gray-600">This records service-specific actions for one active PUDO location. It requires <code>pudo_location.capability_approve</code> and does not itself activate the location or make a service/endpoint combination eligible.</p>
          </form>
        </section>

        <section className="cost-panel">
          <div className="cost-panel-heading"><div><span className="section-label">03 / DEC-047</span><h2>Record service and endpoint eligibility</h2></div></div>
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault();
            void post("/api/staff/commercial-quotation-readiness/eligibility", {
              serviceCode, originType: eligibilityOriginType, destinationType: eligibilityDestinationType,
              ...(eligibilityOriginType === "pudo" ? { originPudoLocationId } : {}),
              ...(eligibilityDestinationType === "pudo" ? { destinationPudoLocationId } : {}),
              outcome: eligibilityOutcome, evidenceReferences: lines(evidenceReferences),
              serviceCoverageEvidenceReferences: lines(serviceCoverageReferences),
              operatingAvailabilityEvidenceReferences: lines(availabilityReferences),
              capacityEvidenceReferences: lines(capacityReferences),
              originRequiredActions: lines(originRequiredActions),
              destinationRequiredActions: lines(destinationRequiredActions),
              conditions: lines(conditions), reason: eligibilityReason,
              ...(eligibilityValidUntil ? { validUntil: new Date(eligibilityValidUntil).toISOString() } : {}),
            }, "DEC-047 eligibility decision recorded.");
          }}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">Service<select className="mt-2 w-full rounded-lg border p-3" value={serviceCode} onChange={(event) => setServiceCode(event.target.value as ServiceCode | "")} required><option value="">Select service</option><option value="standard">Standard</option><option value="express">Express</option><option value="scheduled">Scheduled</option></select></label>
              <label className="block text-sm font-medium">Outcome<select className="mt-2 w-full rounded-lg border p-3" value={eligibilityOutcome} onChange={(event) => setEligibilityOutcome(event.target.value as typeof eligibilityOutcome)} required><option value="">Select eligibility outcome</option><option value="pending_verification">Pending verification</option><option value="eligible">Eligible</option><option value="conditionally_eligible">Conditionally eligible</option><option value="not_eligible">Not eligible</option><option value="revoked">Revoke</option></select></label>
              <label className="block text-sm font-medium">Origin endpoint<select className="mt-2 w-full rounded-lg border p-3" value={eligibilityOriginType} onChange={(event) => setEligibilityOriginType(event.target.value as "address" | "pudo")}><option value="address">Address</option><option value="pudo">PUDO</option></select></label>
              <label className="block text-sm font-medium">Destination endpoint<select className="mt-2 w-full rounded-lg border p-3" value={eligibilityDestinationType} onChange={(event) => setEligibilityDestinationType(event.target.value as "address" | "pudo")}><option value="address">Address</option><option value="pudo">PUDO</option></select></label>
              {eligibilityOriginType === "pudo" && <label className="block text-sm font-medium">Origin PUDO ID<input className="mt-2 w-full rounded-lg border p-3" value={originPudoLocationId} onChange={(event) => setOriginPudoLocationId(event.target.value)} required /></label>}
              {eligibilityDestinationType === "pudo" && <label className="block text-sm font-medium">Destination PUDO ID<input className="mt-2 w-full rounded-lg border p-3" value={destinationPudoLocationId} onChange={(event) => setDestinationPudoLocationId(event.target.value)} required /></label>}
            </div>
            <label className="block text-sm font-medium">All decision evidence document paths (one Firestore document path per line)<textarea className="mt-2 w-full rounded-lg border p-3" value={evidenceReferences} onChange={(event) => setEvidenceReferences(event.target.value)} rows={5} placeholder={"pudoLocationVerifications/ORIGIN_ID\npudoLocationActivations/ORIGIN_ID\npudoLocationServiceCapabilities/ORIGIN_ID__standard\npudoLocationVerifications/DESTINATION_ID\npudoLocationActivations/DESTINATION_ID\npudoLocationServiceCapabilities/DESTINATION_ID__standard\ncommercialRouteDistanceEvidence/EVIDENCE_ID\ncommercialRouteDistanceReviews/EVIDENCE_ID"} /></label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">Service coverage evidence paths<textarea className="mt-2 w-full rounded-lg border p-3" value={serviceCoverageReferences} onChange={(event) => setServiceCoverageReferences(event.target.value)} rows={3} /></label>
              <label className="block text-sm font-medium">Operating availability evidence paths<textarea className="mt-2 w-full rounded-lg border p-3" value={availabilityReferences} onChange={(event) => setAvailabilityReferences(event.target.value)} rows={3} /></label>
              <label className="block text-sm font-medium">Capacity evidence paths<textarea className="mt-2 w-full rounded-lg border p-3" value={capacityReferences} onChange={(event) => setCapacityReferences(event.target.value)} rows={3} /></label>
              <label className="block text-sm font-medium">Origin required actions<textarea className="mt-2 w-full rounded-lg border p-3" value={originRequiredActions} onChange={(event) => setOriginRequiredActions(event.target.value)} rows={3} /></label>
              <label className="block text-sm font-medium">Destination required actions<textarea className="mt-2 w-full rounded-lg border p-3" value={destinationRequiredActions} onChange={(event) => setDestinationRequiredActions(event.target.value)} rows={3} /></label>
              <label className="block text-sm font-medium">Conditional evidence paths (one per line)<textarea className="mt-2 w-full rounded-lg border p-3" value={conditions} onChange={(event) => setConditions(event.target.value)} rows={3} /></label>
            </div>
            <label className="block text-sm font-medium">Decision reason<textarea className="mt-2 w-full rounded-lg border p-3" value={eligibilityReason} onChange={(event) => setEligibilityReason(event.target.value)} required maxLength={2000} /></label>
            <label className="block text-sm font-medium">Eligibility validity end{(eligibilityOutcome === "eligible" || eligibilityOutcome === "conditionally_eligible") ? " (required)" : " (optional)"}<input className="mt-2 w-full rounded-lg border p-3" type="datetime-local" value={eligibilityValidUntil} onChange={(event) => setEligibilityValidUntil(event.target.value)} required={eligibilityOutcome === "eligible" || eligibilityOutcome === "conditionally_eligible"} /></label>
            <button className="cost-primary-button" disabled={busy}>{busy ? "Saving..." : "Record DEC-047 decision"}</button>
            <p className="text-sm text-gray-600">Positive eligibility requires exact active PUDO-to-PUDO endpoints, approved service actions at both locations, service coverage, operating availability, capacity, and the exact reviewed route measurement. All referenced evidence must remain current. Address endpoint combinations may be explicitly marked not eligible or revoked, but remain unavailable until authoritative address-to-operational-point mapping exists. Requires <code>commercial_service_eligibility.approve</code>.</p>
          </form>
        </section>

        <section className="cost-panel">
          <div className="cost-panel-heading"><div><span className="section-label">04 / DEC-048</span><h2>Approve service commercial terms</h2></div></div>
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault();
            void post("/api/staff/commercial-quotation-readiness/commercial-terms", {
              serviceCode: termsServiceCode, pricingDefinitionId, pricingVersionId, currency,
              quoteValidityMinutes: Number(quoteValidityMinutes),
              handoverWindowMinutes: Number(handoverWindowMinutes),
              roundingMode, decimalPlaces: Number(decimalPlaces), roundingStage: "total_only",
              taxTreatment, surchargeTreatment, discountTreatment, feeTreatment,
              confirmation: termsConfirmed ? "DEC-048_TERMS_REVIEWED" : "",
            }, "DEC-048 commercial terms approval recorded.");
          }}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">Service<select className="mt-2 w-full rounded-lg border p-3" value={termsServiceCode} onChange={(event) => setTermsServiceCode(event.target.value as ServiceCode | "")} required><option value="">Select service</option><option value="standard">Standard</option><option value="express">Express</option><option value="scheduled">Scheduled</option></select></label>
              <label className="block text-sm font-medium">Currency<input className="mt-2 w-full rounded-lg border p-3" value={currency} onChange={(event) => setCurrency(event.target.value)} required maxLength={12} /></label>
              <label className="block text-sm font-medium">Pricing definition ID<input className="mt-2 w-full rounded-lg border p-3" value={pricingDefinitionId} onChange={(event) => setPricingDefinitionId(event.target.value)} required /></label>
              <label className="block text-sm font-medium">Approved pricing version ID<input className="mt-2 w-full rounded-lg border p-3" value={pricingVersionId} onChange={(event) => setPricingVersionId(event.target.value)} required /></label>
              <label className="block text-sm font-medium">Quote validity (minutes)<input className="mt-2 w-full rounded-lg border p-3" type="number" min="1" max="525600" value={quoteValidityMinutes} onChange={(event) => setQuoteValidityMinutes(event.target.value)} required /></label>
              <label className="block text-sm font-medium">Physical handover window (minutes)<input className="mt-2 w-full rounded-lg border p-3" type="number" min="1" max="525600" value={handoverWindowMinutes} onChange={(event) => setHandoverWindowMinutes(event.target.value)} required /></label>
              <label className="block text-sm font-medium">Rounding mode<select className="mt-2 w-full rounded-lg border p-3" value={roundingMode} onChange={(event) => setRoundingMode(event.target.value as typeof roundingMode)} required><option value="">Select approved rounding mode</option><option value="none">No rounding</option><option value="half_up">Half up</option><option value="half_even">Half even</option><option value="ceil">Round up</option><option value="floor">Round down</option></select></label>
              <label className="block text-sm font-medium">Decimal places<input className="mt-2 w-full rounded-lg border p-3" type="number" min="0" max="6" step="1" value={decimalPlaces} onChange={(event) => setDecimalPlaces(event.target.value)} required /></label>
            </div>
            <p className="text-sm text-gray-600">The current implementation applies rounding to the quotation total only. This stage must be acceptable as part of the approved commercial terms.</p>
            {chargeTreatmentFields.map(({ label, value, setValue }) => (
              <label key={label} className="block text-sm font-medium">{label}
                <select className="mt-2 w-full rounded-lg border p-3" value={value} onChange={(event) => setValue(event.target.value as typeof value)} required>
                  <option value="">Select explicit treatment</option>
                  <option value="included_in_components">Included in approved pricing components</option>
                  <option value="not_applicable">Not applicable</option>
                </select>
              </label>
            ))}
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={termsConfirmed} onChange={(event) => setTermsConfirmed(event.target.checked)} required /><span>I confirm these service-specific commercial terms have been reviewed and approved under DEC-048, including the exact published pricing version, currency, deadlines and treatment of all listed charge categories.</span></label>
            <button className="cost-primary-button" disabled={busy || !termsConfirmed}>{busy ? "Saving..." : "Approve DEC-048 commercial terms"}</button>
            <p className="text-sm text-gray-600">This requires the separately assigned <code>commercial_pricing.owner_approve</code> permission. It does not create missing prices or pricing expressions; it approves only the selected existing version and the explicit terms entered here.</p>
          </form>
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold">Revoke an existing DEC-048 approval</h3>
            <form className="mt-4 space-y-4" onSubmit={(event) => {
              event.preventDefault();
              void post("/api/staff/commercial-quotation-readiness/commercial-terms/revoke", {
                serviceCode: termsServiceCode,
                reason: termsRevocationReason,
              }, "DEC-048 commercial terms approval revoked. New quotation issuance for this service is now unavailable.");
            }}>
              <label className="block text-sm font-medium">Reason for revocation<textarea className="mt-2 w-full rounded-lg border p-3" value={termsRevocationReason} onChange={(event) => setTermsRevocationReason(event.target.value)} required maxLength={2000} /></label>
              <button className="cost-secondary-button" disabled={busy || !termsServiceCode}>Revoke selected service approval</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
