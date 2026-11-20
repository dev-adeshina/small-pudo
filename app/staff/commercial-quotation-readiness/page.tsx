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
  const [routeDecision, setRouteDecision] = useState<"approve" | "revoke">("approve");
  const [routeReason, setRouteReason] = useState("");

  const [serviceCode, setServiceCode] = useState<ServiceCode>("standard");
  const [originPudoLocationId, setOriginPudoLocationId] = useState("");
  const [destinationPudoLocationId, setDestinationPudoLocationId] = useState("");
  const [eligibilityOutcome, setEligibilityOutcome] = useState<"eligible" | "conditionally_eligible" | "not_eligible" | "revoked">("eligible");
  const [evidenceReferences, setEvidenceReferences] = useState("");
  const [conditions, setConditions] = useState("");
  const [eligibilityReason, setEligibilityReason] = useState("");
  const [eligibilityValidUntil, setEligibilityValidUntil] = useState("");

  const [pricingDefinitionId, setPricingDefinitionId] = useState("");
  const [pricingVersionId, setPricingVersionId] = useState("");
  const [currency, setCurrency] = useState("");
  const [quoteValidityMinutes, setQuoteValidityMinutes] = useState("");
  const [handoverWindowMinutes, setHandoverWindowMinutes] = useState("");
  const [roundingPolicy, setRoundingPolicy] = useState("");
  const [taxTreatment, setTaxTreatment] = useState("");
  const [surchargeTreatment, setSurchargeTreatment] = useState("");
  const [discountTreatment, setDiscountTreatment] = useState("");
  const [feeTreatment, setFeeTreatment] = useState("");
  const [termsConfirmed, setTermsConfirmed] = useState(false);

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
            void post("/api/staff/commercial-quotation-readiness/route-evidence/" + encodeURIComponent(routeEvidenceId) + "/review", { decision: routeDecision, reason: routeReason }, "Route evidence review recorded.");
          }}>
            <label className="block text-sm font-medium">Route evidence ID<input className="mt-2 w-full rounded-lg border p-3" value={routeEvidenceId} onChange={(event) => setRouteEvidenceId(event.target.value)} required /></label>
            <label className="block text-sm font-medium">Decision<select className="mt-2 w-full rounded-lg border p-3" value={routeDecision} onChange={(event) => setRouteDecision(event.target.value as "approve" | "revoke")}><option value="approve">Approve reviewed measurement</option><option value="revoke">Revoke approval</option></select></label>
            <label className="block text-sm font-medium">Review reason<textarea className="mt-2 w-full rounded-lg border p-3" value={routeReason} onChange={(event) => setRouteReason(event.target.value)} maxLength={2000} required /></label>
            <button className="cost-primary-button" disabled={busy}>{busy ? "Saving..." : "Record route review"}</button>
            <p className="text-sm text-gray-600">Straight-line evidence cannot be approved as operational road-route evidence. Approval requires the separate <code>commercial_route_distance.approve</code> permission.</p>
          </form>
        </section>

        <section className="cost-panel">
          <div className="cost-panel-heading"><div><span className="section-label">02 / DEC-047</span><h2>Record service and endpoint eligibility</h2></div></div>
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault();
            void post("/api/staff/commercial-quotation-readiness/eligibility", {
              serviceCode, originType: "pudo", destinationType: "pudo",
              originPudoLocationId, destinationPudoLocationId,
              outcome: eligibilityOutcome, evidenceReferences: lines(evidenceReferences),
              conditions: lines(conditions), reason: eligibilityReason,
              ...(eligibilityValidUntil ? { validUntil: new Date(eligibilityValidUntil).toISOString() } : {}),
            }, "DEC-047 eligibility decision recorded.");
          }}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">Service<select className="mt-2 w-full rounded-lg border p-3" value={serviceCode} onChange={(event) => setServiceCode(event.target.value as ServiceCode)}><option value="standard">Standard</option><option value="express">Express</option><option value="scheduled">Scheduled</option></select></label>
              <label className="block text-sm font-medium">Outcome<select className="mt-2 w-full rounded-lg border p-3" value={eligibilityOutcome} onChange={(event) => setEligibilityOutcome(event.target.value as typeof eligibilityOutcome)}><option value="eligible">Eligible</option><option value="conditionally_eligible">Conditionally eligible</option><option value="not_eligible">Not eligible</option><option value="revoked">Revoke</option></select></label>
              <label className="block text-sm font-medium">Origin PUDO ID<input className="mt-2 w-full rounded-lg border p-3" value={originPudoLocationId} onChange={(event) => setOriginPudoLocationId(event.target.value)} required /></label>
              <label className="block text-sm font-medium">Destination PUDO ID<input className="mt-2 w-full rounded-lg border p-3" value={destinationPudoLocationId} onChange={(event) => setDestinationPudoLocationId(event.target.value)} required /></label>
            </div>
            <label className="block text-sm font-medium">Evidence document paths (one Firestore document path per line)<textarea className="mt-2 w-full rounded-lg border p-3" value={evidenceReferences} onChange={(event) => setEvidenceReferences(event.target.value)} required rows={4} placeholder={"pudoLocationVerifications/LOCATION_ID\npudoLocationActivations/LOCATION_ID"} /></label>
            <label className="block text-sm font-medium">Conditions (one per line; required for conditional eligibility)<textarea className="mt-2 w-full rounded-lg border p-3" value={conditions} onChange={(event) => setConditions(event.target.value)} rows={3} /></label>
            <label className="block text-sm font-medium">Decision reason<textarea className="mt-2 w-full rounded-lg border p-3" value={eligibilityReason} onChange={(event) => setEligibilityReason(event.target.value)} required maxLength={2000} /></label>
            <label className="block text-sm font-medium">Validity end (optional)<input className="mt-2 w-full rounded-lg border p-3" type="datetime-local" value={eligibilityValidUntil} onChange={(event) => setEligibilityValidUntil(event.target.value)} /></label>
            <button className="cost-primary-button" disabled={busy}>{busy ? "Saving..." : "Record DEC-047 decision"}</button>
            <p className="text-sm text-gray-600">This implementation records eligibility for the exact PUDO pair. Address endpoint combinations remain unavailable until authoritative address-to-operational-point mapping exists. Requires <code>commercial_service_eligibility.approve</code>.</p>
          </form>
        </section>

        <section className="cost-panel">
          <div className="cost-panel-heading"><div><span className="section-label">03 / DEC-048</span><h2>Approve service commercial terms</h2></div></div>
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault();
            void post("/api/staff/commercial-quotation-readiness/commercial-terms", {
              serviceCode, pricingDefinitionId, pricingVersionId, currency,
              quoteValidityMinutes: Number(quoteValidityMinutes),
              handoverWindowMinutes: Number(handoverWindowMinutes),
              roundingPolicy, taxTreatment, surchargeTreatment, discountTreatment, feeTreatment,
              confirmation: termsConfirmed ? "DEC-048_TERMS_REVIEWED" : "",
            }, "DEC-048 commercial terms approval recorded.");
          }}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">Service<select className="mt-2 w-full rounded-lg border p-3" value={serviceCode} onChange={(event) => setServiceCode(event.target.value as ServiceCode)}><option value="standard">Standard</option><option value="express">Express</option><option value="scheduled">Scheduled</option></select></label>
              <label className="block text-sm font-medium">Currency<input className="mt-2 w-full rounded-lg border p-3" value={currency} onChange={(event) => setCurrency(event.target.value)} required maxLength={12} /></label>
              <label className="block text-sm font-medium">Pricing definition ID<input className="mt-2 w-full rounded-lg border p-3" value={pricingDefinitionId} onChange={(event) => setPricingDefinitionId(event.target.value)} required /></label>
              <label className="block text-sm font-medium">Approved pricing version ID<input className="mt-2 w-full rounded-lg border p-3" value={pricingVersionId} onChange={(event) => setPricingVersionId(event.target.value)} required /></label>
              <label className="block text-sm font-medium">Quote validity (minutes)<input className="mt-2 w-full rounded-lg border p-3" type="number" min="1" max="525600" value={quoteValidityMinutes} onChange={(event) => setQuoteValidityMinutes(event.target.value)} required /></label>
              <label className="block text-sm font-medium">Physical handover window (minutes)<input className="mt-2 w-full rounded-lg border p-3" type="number" min="1" max="525600" value={handoverWindowMinutes} onChange={(event) => setHandoverWindowMinutes(event.target.value)} required /></label>
            </div>
            {[
              ["roundingPolicy", "Rounding policy", roundingPolicy, setRoundingPolicy],
              ["taxTreatment", "Tax treatment", taxTreatment, setTaxTreatment],
              ["surchargeTreatment", "Surcharge treatment", surchargeTreatment, setSurchargeTreatment],
              ["discountTreatment", "Discount treatment", discountTreatment, setDiscountTreatment],
              ["feeTreatment", "Fee treatment", feeTreatment, setFeeTreatment],
            ].map(([name, label, value, setter]) => (
              <label key={String(name)} className="block text-sm font-medium">{String(label)}
                <textarea className="mt-2 w-full rounded-lg border p-3" value={String(value)} onChange={(event) => (setter as (value: string) => void)(event.target.value)} required maxLength={500} />
              </label>
            ))}
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={termsConfirmed} onChange={(event) => setTermsConfirmed(event.target.checked)} required /><span>I confirm these service-specific commercial terms have been reviewed and approved under DEC-048, including the exact published pricing version, currency, deadlines and treatment of all listed charge categories.</span></label>
            <button className="cost-primary-button" disabled={busy || !termsConfirmed}>{busy ? "Saving..." : "Approve DEC-048 commercial terms"}</button>
            <p className="text-sm text-gray-600">This requires the separately assigned <code>commercial_pricing.owner_approve</code> permission. It does not create missing prices or pricing expressions; it approves only the selected existing version and the explicit terms entered here.</p>
          </form>
        </section>
      </div>
    </main>
  );
}
