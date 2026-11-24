"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth } from "@/lib/firebase";

type ServiceCode = "standard" | "express" | "scheduled";
type OperationalEvidenceRow = {
  evidenceId: string;
  reference: string;
  kind: "service_coverage" | "operating_availability" | "capacity";
  serviceCode: ServiceCode;
  source: string;
  supportingReference: string;
  scope: Record<string, unknown>;
  details: Record<string, unknown>;
  recordedBy: string;
  recordedAt: string | null;
  validFrom: string | null;
  validUntil: string | null;
  reviewStatus: string;
  reviewedBy: string | null;
  reviewValidUntil: string | null;
  reviewReason: string | null;
  isCurrentApproved: boolean;
};
type RouteEvidenceQueueItem = {
  evidenceId: string;
  originOperationalPointRef: string | null;
  destinationOperationalPointRef: string | null;
  distance: { value?: number; unit?: string } | null;
  method: string | null;
  source: string | null;
  measuredOn: string | null;
  supportingReference: string | null;
  recordedBy: string | null;
  recordedAt: string | null;
  reviewStatus: string;
  decision: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  validUntil: string | null;
  reason: string | null;
};
type RouteEvidenceReviewDetails = {
  evidenceId: string;
  originOperationalPointRef: string;
  destinationOperationalPointRef: string;
  evidence: {
    distance: { value: number; unit: string };
    method: string;
    source: string;
    measuredOn?: string;
    supportingReference?: string;
    recordedAt: string;
    recordedBy: string;
  };
  review: {
    status: string;
    decision: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    validUntil: string | null;
    reason: string | null;
  } | null;
};

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
  const [routeEvidenceDetails, setRouteEvidenceDetails] = useState<RouteEvidenceReviewDetails | null>(null);
  const [routeEvidenceLoading, setRouteEvidenceLoading] = useState(false);
  const [routeEvidenceError, setRouteEvidenceError] = useState("");
  const [routeEvidenceQueue, setRouteEvidenceQueue] = useState<RouteEvidenceQueueItem[]>([]);
  const [routeEvidenceQueueLoading, setRouteEvidenceQueueLoading] = useState(false);
  const [routeEvidenceQueueError, setRouteEvidenceQueueError] = useState("");

  const [serviceCode, setServiceCode] = useState<ServiceCode | "">("");
  const [termsServiceCode, setTermsServiceCode] = useState<ServiceCode | "">("");
  const [eligibilityOriginType, setEligibilityOriginType] = useState<"address" | "pudo">("pudo");
  const [eligibilityDestinationType, setEligibilityDestinationType] = useState<"address" | "pudo">("pudo");
  const [originPudoLocationId, setOriginPudoLocationId] = useState("");
  const [destinationPudoLocationId, setDestinationPudoLocationId] = useState("");
  const [eligibilityOutcome, setEligibilityOutcome] = useState<"" | "pending_verification" | "eligible" | "conditionally_eligible" | "not_eligible" | "revoked">("");
  const [operationalEvidenceRows, setOperationalEvidenceRows] = useState<OperationalEvidenceRow[]>([]);
  const [operationalEvidencePermissions, setOperationalEvidencePermissions] = useState({ record: false, review: false, revoke: false });
  const [staffUid, setStaffUid] = useState("");
  const [operationalEvidenceLoading, setOperationalEvidenceLoading] = useState(false);
  const [evidenceSearch, setEvidenceSearch] = useState("");
  const [evidenceKindFilter, setEvidenceKindFilter] = useState<"all" | OperationalEvidenceRow["kind"]>("all");
  const [evidenceStatusFilter, setEvidenceStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "revoked">("all");
  const [evidenceKind, setEvidenceKind] = useState<OperationalEvidenceRow["kind"]>("service_coverage");
  const [evidenceServiceCode, setEvidenceServiceCode] = useState<ServiceCode>("standard");
  const [evidenceSource, setEvidenceSource] = useState("");
  const [evidenceSupportingReference, setEvidenceSupportingReference] = useState("");
  const [evidenceValidFrom, setEvidenceValidFrom] = useState("");
  const [evidenceValidUntil, setEvidenceValidUntil] = useState("");
  const [coverageScopeType, setCoverageScopeType] = useState<"area" | "route">("route");
  const [coverageAreaRef, setCoverageAreaRef] = useState("");
  const [coveragePointRefs, setCoveragePointRefs] = useState("");
  const [coverageOriginRef, setCoverageOriginRef] = useState("");
  const [coverageDestinationRef, setCoverageDestinationRef] = useState("");
  const [coverageBasis, setCoverageBasis] = useState("");
  const [evidenceLocationId, setEvidenceLocationId] = useState("");
  const [availabilityWindows, setAvailabilityWindows] = useState("");
  const [availabilityTimeZone, setAvailabilityTimeZone] = useState("Africa/Lagos");
  const [capacityBasis, setCapacityBasis] = useState("");
  const [capacityLoad, setCapacityLoad] = useState("");
  const [capacityUnit, setCapacityUnit] = useState("");
  const [selectedCoverageIds, setSelectedCoverageIds] = useState<string[]>([]);
  const [selectedAvailabilityIds, setSelectedAvailabilityIds] = useState<string[]>([]);
  const [selectedCapacityIds, setSelectedCapacityIds] = useState<string[]>([]);
  const [reviewEvidenceId, setReviewEvidenceId] = useState("");
  const [operationalReviewDecision, setOperationalReviewDecision] = useState<"" | "approve" | "reject">("");
  const [operationalReviewReason, setOperationalReviewReason] = useState("");
  const [operationalReviewValidUntil, setOperationalReviewValidUntil] = useState("");
  const [revokeEvidenceId, setRevokeEvidenceId] = useState("");
  const [operationalRevocationReason, setOperationalRevocationReason] = useState("");
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
        setStaffUid(user.uid);
        setEmail(user.email ?? "");
        const selectedRouteEvidenceId = new URLSearchParams(window.location.search).get("routeEvidenceId");
        if (selectedRouteEvidenceId) setRouteEvidenceId(selectedRouteEvidenceId);
      } catch {
        setError("Unable to verify staff access.");
      } finally {
        setChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!token || !routeEvidenceId.trim()) {
      setRouteEvidenceDetails(null);
      setRouteEvidenceError("");
      setRouteEvidenceLoading(false);
      return;
    }
    let active = true;
    setRouteEvidenceLoading(true);
    setRouteEvidenceError("");
    setRouteEvidenceDetails(null);
    void (async () => {
      try {
        const currentToken = await auth.currentUser?.getIdToken();
        if (!currentToken) throw new Error("Your staff session has expired. Sign in again.");
        const response = await fetch(
          "/api/staff/commercial-quotation-readiness/route-evidence/" + encodeURIComponent(routeEvidenceId) + "/review",
          { headers: { Authorization: "Bearer " + currentToken }, cache: "no-store" },
        );
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "Unable to load route evidence.");
        if (active) setRouteEvidenceDetails(data.evidence as RouteEvidenceReviewDetails);
      } catch (cause) {
        if (active) setRouteEvidenceError(cause instanceof Error ? cause.message : "Unable to load route evidence.");
      } finally {
        if (active) setRouteEvidenceLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token, routeEvidenceId]);

  const refreshRouteEvidenceQueue = useCallback(async () => {
    if (!token) return;
    setRouteEvidenceQueueLoading(true);
    setRouteEvidenceQueueError("");
    try {
      const currentToken = await auth.currentUser?.getIdToken();
      if (!currentToken) throw new Error("Your staff session has expired. Sign in again.");
      const response = await fetch("/api/staff/commercial-quotation-readiness/route-evidence/queue", {
        headers: { Authorization: "Bearer " + currentToken }, cache: "no-store",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Unable to load route evidence.");
      setRouteEvidenceQueue(Array.isArray(data?.result?.items) ? data.result.items as RouteEvidenceQueueItem[] : []);
    } catch (cause) {
      setRouteEvidenceQueueError(cause instanceof Error ? cause.message : "Unable to load route evidence.");
    } finally {
      setRouteEvidenceQueueLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) void refreshRouteEvidenceQueue();
  }, [refreshRouteEvidenceQueue]);

  const refreshOperationalEvidence = useCallback(async () => {
    if (!token) return;
    setOperationalEvidenceLoading(true);
    try {
      const currentToken = await auth.currentUser?.getIdToken();
      if (!currentToken) throw new Error("Your staff session has expired. Sign in again.");
      const response = await fetch("/api/staff/commercial-quotation-readiness/operational-evidence", {
        headers: { Authorization: "Bearer " + currentToken }, cache: "no-store",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Unable to load operational evidence.");
      setOperationalEvidenceRows(Array.isArray(data?.result?.items) ? data.result.items as OperationalEvidenceRow[] : []);
      setOperationalEvidencePermissions(data?.result?.permissions ?? { record: false, review: false, revoke: false });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load operational evidence.");
    } finally {
      setOperationalEvidenceLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) void refreshOperationalEvidence();
  }, [refreshOperationalEvidence]);

  async function post(path: string, body: Record<string, unknown>, successMessage: string) {
    if (!token || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const currentToken = await auth.currentUser?.getIdToken();
      if (!currentToken) throw new Error("Your staff session has expired. Sign in again.");
      const response = await fetch(path, {
        method: "POST",
        headers: { Authorization: "Bearer " + currentToken, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "The request could not be completed.");
      setNotice(successMessage);
      if (path.includes("/operational-evidence")) {
        const refreshed = await fetch("/api/staff/commercial-quotation-readiness/operational-evidence", {
          headers: { Authorization: "Bearer " + currentToken }, cache: "no-store",
        });
        const refreshedData = await refreshed.json().catch(() => null);
        if (refreshed.ok && Array.isArray(refreshedData?.result?.items)) {
          setOperationalEvidenceRows(refreshedData.result.items as OperationalEvidenceRow[]);
          setOperationalEvidencePermissions(refreshedData.result.permissions ?? { record: false, review: false, revoke: false });
        }
      }
      if (path.includes("/route-evidence/") && path.endsWith("/review")) {
        await refreshRouteEvidenceQueue();
        const refreshed = await fetch(path, {
          headers: { Authorization: "Bearer " + currentToken },
          cache: "no-store",
        });
        const refreshedData = await refreshed.json().catch(() => null);
        if (refreshed.ok && refreshedData?.evidence) {
          setRouteEvidenceDetails(refreshedData.evidence as RouteEvidenceReviewDetails);
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The request could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const visibleOperationalEvidenceRows: OperationalEvidenceRow[] = operationalEvidenceRows.filter((row) => {
    const query = evidenceSearch.trim().toLowerCase();
    const haystack = [
      row.evidenceId, row.kind, row.serviceCode, row.source, row.supportingReference,
      row.recordedBy, row.reviewedBy, JSON.stringify(row.scope), JSON.stringify(row.details),
    ].join(" ").toLowerCase();
    const status = row.reviewStatus === "approved"
      ? (row.isCurrentApproved ? "approved" : "expired")
      : row.reviewStatus;
    return (!query || haystack.includes(query)) &&
      (evidenceKindFilter === "all" || row.kind === evidenceKindFilter) &&
      (evidenceStatusFilter === "all" || status === evidenceStatusFilter ||
        (evidenceStatusFilter === "pending" && row.reviewStatus === "pending_review"));
  });

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
        <Link href="/staff/commercial-pricing-definitions" className="admin-logo">VeriLyft</Link>
        <div className="admin-header-right">
          
          
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
          <div className="cost-panel-heading"><div><span className="section-label">00 / DEC-047 OPERATIONAL EVIDENCE</span><h2>Record, review and govern service evidence</h2></div></div>
          <p className="mb-4 text-sm text-gray-600">Recorded evidence is immutable. Approval, rejection and revocation are separate attributed decisions. Only approved, current records with exact matching service and endpoint scope can be selected for positive eligibility.</p>
          {operationalEvidencePermissions.record && <form className="space-y-4 border-b pb-6" onSubmit={(event) => {
            event.preventDefault();
            const scope = evidenceKind === "service_coverage"
              ? (coverageScopeType === "route"
                ? { scopeType: "route", originOperationalPointRef: coverageOriginRef, destinationOperationalPointRef: coverageDestinationRef }
                : { scopeType: "area", areaRef: coverageAreaRef, operationalPointRefs: lines(coveragePointRefs) })
              : { locationId: evidenceLocationId };
            const details = evidenceKind === "service_coverage"
              ? { coverageBasis }
              : evidenceKind === "operating_availability"
                ? { operatingWindows: lines(availabilityWindows), timeZone: availabilityTimeZone }
                : { capacityBasis, supportedLoad: Number(capacityLoad), capacityUnit };
            void post("/api/staff/commercial-quotation-readiness/operational-evidence", {
              kind: evidenceKind, serviceCode: evidenceServiceCode, source: evidenceSource,
              supportingReference: evidenceSupportingReference, validFrom: new Date(evidenceValidFrom).toISOString(),
              validUntil: new Date(evidenceValidUntil).toISOString(), scope, details,
            }, "Operational evidence recorded and awaiting independent review.");
          }}>
            <h3 className="font-semibold">Record new evidence</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">Evidence category<select className="mt-2 w-full rounded-lg border p-3" value={evidenceKind} onChange={(event) => setEvidenceKind(event.target.value as OperationalEvidenceRow["kind"])}><option value="service_coverage">Service coverage</option><option value="operating_availability">PUDO operating availability</option><option value="capacity">PUDO capacity</option></select></label>
              <label className="block text-sm font-medium">Service<select className="mt-2 w-full rounded-lg border p-3" value={evidenceServiceCode} onChange={(event) => setEvidenceServiceCode(event.target.value as ServiceCode)}><option value="standard">Standard</option><option value="express">Express</option><option value="scheduled">Scheduled</option></select></label>
              <label className="block text-sm font-medium">Evidence source<input className="mt-2 w-full rounded-lg border p-3" value={evidenceSource} onChange={(event) => setEvidenceSource(event.target.value)} required maxLength={500} /></label>
              <label className="block text-sm font-medium">Supporting reference<input className="mt-2 w-full rounded-lg border p-3" value={evidenceSupportingReference} onChange={(event) => setEvidenceSupportingReference(event.target.value)} required maxLength={1000} /></label>
              <label className="block text-sm font-medium">Effective from<input className="mt-2 w-full rounded-lg border p-3" type="datetime-local" value={evidenceValidFrom} onChange={(event) => setEvidenceValidFrom(event.target.value)} required /></label>
              <label className="block text-sm font-medium">Evidence expires<input className="mt-2 w-full rounded-lg border p-3" type="datetime-local" value={evidenceValidUntil} onChange={(event) => setEvidenceValidUntil(event.target.value)} required /></label>
            </div>
            {evidenceKind === "service_coverage" ? <>
              <label className="block text-sm font-medium">Coverage scope<select className="mt-2 w-full rounded-lg border p-3" value={coverageScopeType} onChange={(event) => setCoverageScopeType(event.target.value as "area" | "route")}><option value="route">Directed PUDO-to-PUDO route</option><option value="area">Operational area with explicit covered points</option></select></label>
              {coverageScopeType === "route" ? <div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-medium">Origin operational point ID<input className="mt-2 w-full rounded-lg border p-3" value={coverageOriginRef} onChange={(event) => setCoverageOriginRef(event.target.value)} required /></label><label className="block text-sm font-medium">Destination operational point ID<input className="mt-2 w-full rounded-lg border p-3" value={coverageDestinationRef} onChange={(event) => setCoverageDestinationRef(event.target.value)} required /></label></div> :
                <><label className="block text-sm font-medium">Operational area reference<input className="mt-2 w-full rounded-lg border p-3" value={coverageAreaRef} onChange={(event) => setCoverageAreaRef(event.target.value)} required /></label><label className="block text-sm font-medium">Covered operational point IDs (one per line)<textarea className="mt-2 w-full rounded-lg border p-3" value={coveragePointRefs} onChange={(event) => setCoveragePointRefs(event.target.value)} required rows={3} /></label></>}
              <label className="block text-sm font-medium">Coverage basis<textarea className="mt-2 w-full rounded-lg border p-3" value={coverageBasis} onChange={(event) => setCoverageBasis(event.target.value)} required /></label>
            </> : <>
              <label className="block text-sm font-medium">PUDO location ID<input className="mt-2 w-full rounded-lg border p-3" value={evidenceLocationId} onChange={(event) => setEvidenceLocationId(event.target.value)} required /></label>
              {evidenceKind === "operating_availability" ? <>
                <label className="block text-sm font-medium">Operating windows (one explicit window per line)<textarea className="mt-2 w-full rounded-lg border p-3" value={availabilityWindows} onChange={(event) => setAvailabilityWindows(event.target.value)} required rows={3} placeholder="Monday-Friday 08:00-18:00" /></label>
                <label className="block text-sm font-medium">Time zone<input className="mt-2 w-full rounded-lg border p-3" value={availabilityTimeZone} onChange={(event) => setAvailabilityTimeZone(event.target.value)} required /></label>
              </> : <div className="grid gap-4 md:grid-cols-3"><label className="block text-sm font-medium">Capacity basis<input className="mt-2 w-full rounded-lg border p-3" value={capacityBasis} onChange={(event) => setCapacityBasis(event.target.value)} required /></label><label className="block text-sm font-medium">Supported load<input className="mt-2 w-full rounded-lg border p-3" type="number" min="0.001" step="any" value={capacityLoad} onChange={(event) => setCapacityLoad(event.target.value)} required /></label><label className="block text-sm font-medium">Capacity unit<input className="mt-2 w-full rounded-lg border p-3" value={capacityUnit} onChange={(event) => setCapacityUnit(event.target.value)} required /></label></div>}
            </>}
            <button className="cost-primary-button" disabled={busy}>{busy ? "Saving..." : "Record immutable evidence"}</button>
            <p className="text-xs text-gray-600">Requires <code>commercial_operational_evidence.record</code>. Recording does not approve evidence or make a service eligible.</p>
          </form>}
          <div className="mt-6 overflow-x-auto">
            <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Operational evidence register</h3><button type="button" className="cost-secondary-button" disabled={operationalEvidenceLoading} onClick={() => void refreshOperationalEvidence()}>{operationalEvidenceLoading ? "Refreshing..." : "Refresh register"}</button></div>
            <div className="mb-3 grid gap-3 md:grid-cols-3">
              <input className="w-full rounded-lg border p-3" value={evidenceSearch} onChange={(event) => setEvidenceSearch(event.target.value)} placeholder="Search ID, source, scope or recorder" aria-label="Search operational evidence" />
              <select className="w-full rounded-lg border p-3" value={evidenceKindFilter} onChange={(event) => setEvidenceKindFilter(event.target.value as typeof evidenceKindFilter)} aria-label="Filter evidence category"><option value="all">All categories</option><option value="service_coverage">Service coverage</option><option value="operating_availability">Operating availability</option><option value="capacity">Capacity</option></select>
              <select className="w-full rounded-lg border p-3" value={evidenceStatusFilter} onChange={(event) => setEvidenceStatusFilter(event.target.value as typeof evidenceStatusFilter)} aria-label="Filter review status"><option value="all">All review states</option><option value="pending">Pending review</option><option value="approved">Current and approved</option><option value="rejected">Rejected</option><option value="revoked">Revoked</option><option value="expired">Approved but no longer current</option></select>
            </div>
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead><tr className="border-b"><th className="p-2">ID / category</th><th className="p-2">Service / scope / details</th><th className="p-2">Recorder</th><th className="p-2">Review</th><th className="p-2">Validity</th><th className="p-2">Actions</th></tr></thead>
              <tbody>{visibleOperationalEvidenceRows.map((row) => <tr key={row.reference + ":" + row.kind} className="border-b align-top">
                <td className="p-2"><div className="font-medium">{row.evidenceId}</div><div>{row.kind.replaceAll("_", " ")}</div></td>
                <td className="p-2"><div>{row.serviceCode}</div><div>{String(row.scope.locationId ?? row.scope.areaRef ?? (String(row.scope.originOperationalPointRef ?? "") + " → " + String(row.scope.destinationOperationalPointRef ?? "")))}</div><div className="text-xs text-gray-600">{row.kind === "service_coverage" ? String(row.details.coverageBasis ?? "") : row.kind === "operating_availability" ? String(row.details.operatingWindows ?? []) : String(row.details.supportedLoad ?? "") + " " + String(row.details.capacityUnit ?? "")}</div></td>
                <td className="p-2">{row.recordedBy}<div>{row.recordedAt ?? "—"}</div></td>
                <td className="p-2">{row.reviewStatus}<div>{row.reviewedBy ?? "—"}</div></td>
                <td className="p-2">{row.validUntil ?? "—"}<div>{row.isCurrentApproved ? "Current and approved" : "Not currently selectable"}</div></td>
                <td className="p-2"><div className="flex flex-wrap gap-2">{operationalEvidencePermissions.review && staffUid !== row.recordedBy && row.reviewStatus !== "revoked" && <button type="button" className="cost-secondary-button" onClick={() => { setReviewEvidenceId(row.evidenceId); setOperationalReviewDecision(""); }}>Review</button>}{operationalEvidencePermissions.revoke && row.reviewStatus === "approved" && <button type="button" className="cost-secondary-button" onClick={() => setRevokeEvidenceId(row.evidenceId)}>Revoke</button>}</div></td>
              </tr>)}</tbody>
            </table>
            {!visibleOperationalEvidenceRows.length && !operationalEvidenceLoading && <p className="py-4 text-sm text-gray-600">No operational evidence matches the current filters.</p>}
          </div>
          <div className="mt-6 grid gap-6 border-t pt-6 md:grid-cols-2">
            {operationalEvidencePermissions.review && <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void post("/api/staff/commercial-quotation-readiness/operational-evidence/" + encodeURIComponent(reviewEvidenceId) + "/review", { decision: operationalReviewDecision, reason: operationalReviewReason, ...(operationalReviewDecision === "approve" ? { validUntil: new Date(operationalReviewValidUntil).toISOString() } : {}) }, "Operational evidence review recorded."); }}>
              <h3 className="font-semibold">Independent evidence review</h3>
              <label className="block text-sm font-medium">Evidence ID<input className="mt-2 w-full rounded-lg border p-3" value={reviewEvidenceId} onChange={(event) => setReviewEvidenceId(event.target.value)} required /></label>
              <label className="block text-sm font-medium">Decision<select className="mt-2 w-full rounded-lg border p-3" value={operationalReviewDecision} onChange={(event) => setOperationalReviewDecision(event.target.value as typeof operationalReviewDecision)} required><option value="">Select decision</option><option value="approve">Approve</option><option value="reject">Reject</option></select></label>
              {operationalReviewDecision === "approve" && <label className="block text-sm font-medium">Approval validity end<input className="mt-2 w-full rounded-lg border p-3" type="datetime-local" value={operationalReviewValidUntil} onChange={(event) => setOperationalReviewValidUntil(event.target.value)} required /></label>}
              <label className="block text-sm font-medium">Review reason<textarea className="mt-2 w-full rounded-lg border p-3" value={operationalReviewReason} onChange={(event) => setOperationalReviewReason(event.target.value)} required /></label>
              <button className="cost-primary-button" disabled={busy || !reviewEvidenceId || !operationalReviewDecision}>Record independent review</button>
              <p className="text-xs text-gray-600">Requires <code>commercial_operational_evidence.review</code>. The recorder cannot approve their own evidence.</p>
            </form>}
            {operationalEvidencePermissions.revoke && <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void post("/api/staff/commercial-quotation-readiness/operational-evidence/" + encodeURIComponent(revokeEvidenceId) + "/revoke", { reason: operationalRevocationReason }, "Operational evidence revoked. It is no longer eligible for positive DEC-047 decisions."); }}>
              <h3 className="font-semibold">Revoke approved evidence</h3>
              <label className="block text-sm font-medium">Evidence ID<input className="mt-2 w-full rounded-lg border p-3" value={revokeEvidenceId} onChange={(event) => setRevokeEvidenceId(event.target.value)} required /></label>
              <label className="block text-sm font-medium">Revocation reason<textarea className="mt-2 w-full rounded-lg border p-3" value={operationalRevocationReason} onChange={(event) => setOperationalRevocationReason(event.target.value)} required /></label>
              <button className="cost-secondary-button" disabled={busy || !revokeEvidenceId}>Revoke evidence</button>
              <p className="text-xs text-gray-600">Requires <code>commercial_operational_evidence.revoke</code>. Revocation is an append-only decision; recorded evidence is never edited or deleted.</p>
            </form>}
          </div>
        </section>

        <section className="cost-panel" id="route-evidence-review">
          <div className="cost-panel-heading flex flex-wrap items-center justify-between gap-3">
            <div><span className="section-label">ROUTE EVIDENCE / REVIEW QUEUE</span><h2>Find route measurements awaiting independent review</h2></div>
            <button type="button" className="cost-secondary-button" onClick={() => void refreshRouteEvidenceQueue()} disabled={routeEvidenceQueueLoading}>{routeEvidenceQueueLoading ? "Refreshing..." : "Refresh queue"}</button>
          </div>
          <p className="mb-4 text-sm text-gray-600">Reviewers with <code>commercial_route_distance.approve</code> can browse recorded measurements here. Selecting a row loads its immutable evidence into the review form below. Evidence is never edited or deleted.</p>
          {routeEvidenceQueueError && <div className="cost-alert mb-4">{routeEvidenceQueueError}</div>}
          {routeEvidenceQueueLoading && <p className="text-sm text-gray-600">Loading route evidence...</p>}
          {!routeEvidenceQueueLoading && routeEvidenceQueue.length === 0 && !routeEvidenceQueueError && <p className="rounded-lg border p-4 text-sm text-gray-600">No route measurements are currently recorded. A staff member with route-evidence recording permission must record the measurement before it can be reviewed.</p>}
          {routeEvidenceQueue.length > 0 && <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-3 py-3">Directed route</th><th className="px-3 py-3">Distance / method</th><th className="px-3 py-3">Source / measured</th><th className="px-3 py-3">Recorder</th><th className="px-3 py-3">Review status</th><th className="px-3 py-3">Action</th>
              </tr></thead>
              <tbody>{routeEvidenceQueue.map((item) => <tr key={item.evidenceId} className="border-t">
                <td className="px-3 py-3"><div>{item.originOperationalPointRef || "—"} → {item.destinationOperationalPointRef || "—"}</div><div className="mt-1 text-xs text-gray-500">{item.evidenceId}</div></td>
                <td className="px-3 py-3">{item.distance?.value ?? "—"} {item.distance?.unit ?? ""}<div className="text-xs text-gray-500">{item.method || "Method not supplied"}</div></td>
                <td className="px-3 py-3">{item.source || "—"}<div className="text-xs text-gray-500">{item.measuredOn || "Date not supplied"}</div></td>
                <td className="px-3 py-3">{item.recordedBy || "—"}<div className="text-xs text-gray-500">{item.recordedAt || "—"}</div></td>
                <td className="px-3 py-3"><span className="font-medium">{item.reviewStatus}</span>{item.reviewedBy && <div className="text-xs text-gray-500">by {item.reviewedBy}</div>}</td>
                <td className="px-3 py-3"><button type="button" className="cost-secondary-button" onClick={() => { setRouteEvidenceId(item.evidenceId); setRouteDecision(""); setRouteReason(""); setRouteValidUntil(""); document.getElementById("route-evidence-review-form")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Open review</button></td>
              </tr>)}</tbody>
            </table>
          </div>}
        </section>

        <section className="cost-panel" id="route-evidence-review-form">
          <div className="cost-panel-heading"><div><span className="section-label">01 / ROUTE EVIDENCE</span><h2>Review a recorded route measurement</h2></div></div>
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault();
            void post("/api/staff/commercial-quotation-readiness/route-evidence/" + encodeURIComponent(routeEvidenceId) + "/review", { decision: routeDecision, reason: routeReason, ...(routeDecision === "approve" && routeValidUntil ? { validUntil: new Date(routeValidUntil).toISOString() } : {}) }, "Route evidence review recorded.");
          }}>
            <label className="block text-sm font-medium">Route evidence ID<input className="mt-2 w-full rounded-lg border p-3" value={routeEvidenceId} onChange={(event) => setRouteEvidenceId(event.target.value)} required /></label>
            {routeEvidenceLoading && <p className="text-sm text-gray-600">Loading immutable route evidence details...</p>}
            {routeEvidenceError && <div className="cost-alert"><strong>Evidence unavailable</strong><span>{routeEvidenceError}</span></div>}
            {routeEvidenceDetails && (
              <div className="overflow-x-auto rounded-xl border">
                <div className="border-b bg-gray-50 px-4 py-3 font-semibold">Immutable measurement under review</div>
                <table className="w-full text-left text-sm">
                  <tbody>
                    <tr className="border-b"><th className="px-4 py-2">Directed route</th><td className="px-4 py-2">{routeEvidenceDetails.originOperationalPointRef} → {routeEvidenceDetails.destinationOperationalPointRef}</td></tr>
                    <tr className="border-b"><th className="px-4 py-2">Distance</th><td className="px-4 py-2">{routeEvidenceDetails.evidence.distance.value} {routeEvidenceDetails.evidence.distance.unit}</td></tr>
                    <tr className="border-b"><th className="px-4 py-2">Method / source</th><td className="px-4 py-2">{routeEvidenceDetails.evidence.method} / {routeEvidenceDetails.evidence.source}</td></tr>
                    <tr className="border-b"><th className="px-4 py-2">Measured on</th><td className="px-4 py-2">{routeEvidenceDetails.evidence.measuredOn || "Not supplied"}</td></tr>
                    <tr className="border-b"><th className="px-4 py-2">Supporting reference</th><td className="px-4 py-2 break-all">{routeEvidenceDetails.evidence.supportingReference || "Not supplied"}</td></tr>
                    <tr className="border-b"><th className="px-4 py-2">Recorded by / at</th><td className="px-4 py-2">{routeEvidenceDetails.evidence.recordedBy} / {routeEvidenceDetails.evidence.recordedAt}</td></tr>
                    <tr className="border-b"><th className="px-4 py-2">Current review</th><td className="px-4 py-2">{routeEvidenceDetails.review?.status || "not_reviewed"}</td></tr>
                    <tr><th className="px-4 py-2">Reviewer / validity</th><td className="px-4 py-2">{routeEvidenceDetails.review?.reviewedBy || "—"} / {routeEvidenceDetails.review?.validUntil || "—"}</td></tr>
                  </tbody>
                </table>
                {routeEvidenceDetails.review?.reason && <p className="border-t px-4 py-3 text-sm">Previous review reason: {routeEvidenceDetails.review.reason}</p>}
              </div>
            )}
            <label className="block text-sm font-medium">Decision<select className="mt-2 w-full rounded-lg border p-3" value={routeDecision} onChange={(event) => setRouteDecision(event.target.value as typeof routeDecision)} required><option value="">Select review decision</option><option value="approve">Approve reviewed measurement</option><option value="revoke">Revoke approval</option></select></label>
            <label className="block text-sm font-medium">Review reason<textarea className="mt-2 w-full rounded-lg border p-3" value={routeReason} onChange={(event) => setRouteReason(event.target.value)} maxLength={2000} required /></label>
            {routeDecision === "approve" && <label className="block text-sm font-medium">Evidence validity end<input className="mt-2 w-full rounded-lg border p-3" type="datetime-local" value={routeValidUntil} onChange={(event) => setRouteValidUntil(event.target.value)} required /></label>}
            <button className="cost-primary-button" disabled={busy || routeEvidenceLoading || !routeEvidenceDetails}>{busy ? "Saving..." : "Record route review"}</button>
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
            const selectedOperationalRefs = [
              ...selectedCoverageIds, ...selectedAvailabilityIds, ...selectedCapacityIds,
            ];
            void post("/api/staff/commercial-quotation-readiness/eligibility", {
              serviceCode, originType: eligibilityOriginType, destinationType: eligibilityDestinationType,
              ...(eligibilityOriginType === "pudo" ? { originPudoLocationId } : {}),
              ...(eligibilityDestinationType === "pudo" ? { destinationPudoLocationId } : {}),
              outcome: eligibilityOutcome,
              evidenceReferences: [...new Set([...lines(evidenceReferences), ...selectedOperationalRefs])],
              serviceCoverageEvidenceReferences: selectedCoverageIds,
              operatingAvailabilityEvidenceReferences: selectedAvailabilityIds,
              capacityEvidenceReferences: selectedCapacityIds,
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
            <p className="text-sm text-gray-600">Select independently approved, current source records in the scoped selectors below. Coverage comes from active directed network connections and approved route evidence; availability and capacity come from reviewed immutable PUDO operations versions. The selected Firestore source paths are added to the decision evidence automatically. The all-evidence list is retained for endpoint verification, activation, capability, route review and any conditional evidence references.</p>
            <label className="block text-sm font-medium">All decision evidence document paths (one Firestore document path per line)<textarea className="mt-2 w-full rounded-lg border p-3" value={evidenceReferences} onChange={(event) => setEvidenceReferences(event.target.value)} rows={5} placeholder={"pudoLocationVerifications/ORIGIN_ID\npudoLocationActivations/ORIGIN_ID\npudoLocationServiceCapabilities/ORIGIN_ID__SELECTED_SERVICE\npudoLocationVerifications/DESTINATION_ID\npudoLocationActivations/DESTINATION_ID\npudoLocationServiceCapabilities/DESTINATION_ID__SELECTED_SERVICE\ncommercialRouteDistanceEvidence/EVIDENCE_ID\ncommercialRouteDistanceReviews/EVIDENCE_ID"} /></label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">Approved service coverage evidence<select multiple size={5} className="mt-2 w-full rounded-lg border p-3" value={selectedCoverageIds} onChange={(event) => setSelectedCoverageIds(Array.from(event.target.selectedOptions, (option) => option.value))}>
                {operationalEvidenceRows.filter((row) => row.kind === "service_coverage" && row.serviceCode === serviceCode && row.isCurrentApproved &&
                  ((row.scope.scopeType === "route" && row.scope.originOperationalPointRef === originPudoLocationId && row.scope.destinationOperationalPointRef === destinationPudoLocationId) ||
                    (row.scope.scopeType === "area" && Array.isArray(row.scope.operationalPointRefs) && row.scope.operationalPointRefs.includes(originPudoLocationId) && row.scope.operationalPointRefs.includes(destinationPudoLocationId))))
                  .map((row) => <option key={row.reference + ":" + row.kind} value={row.reference}>{row.reference} · {String(row.scope.scopeType)} · {row.source}</option>)}
              </select></label>
              <label className="block text-sm font-medium">Approved operating availability (select evidence for both endpoints)<select multiple size={5} className="mt-2 w-full rounded-lg border p-3" value={selectedAvailabilityIds} onChange={(event) => setSelectedAvailabilityIds(Array.from(event.target.selectedOptions, (option) => option.value))}>
                {operationalEvidenceRows.filter((row) => row.kind === "operating_availability" && row.serviceCode === serviceCode && row.isCurrentApproved &&
                  [originPudoLocationId, destinationPudoLocationId].includes(String(row.scope.locationId)))
                  .map((row) => <option key={row.reference + ":" + row.kind} value={row.reference}>{row.reference} · {String(row.scope.locationId)} · {row.source}</option>)}
              </select></label>
              <label className="block text-sm font-medium">Approved capacity evidence (select evidence for both endpoints)<select multiple size={5} className="mt-2 w-full rounded-lg border p-3" value={selectedCapacityIds} onChange={(event) => setSelectedCapacityIds(Array.from(event.target.selectedOptions, (option) => option.value))}>
                {operationalEvidenceRows.filter((row) => row.kind === "capacity" && row.serviceCode === serviceCode && row.isCurrentApproved &&
                  [originPudoLocationId, destinationPudoLocationId].includes(String(row.scope.locationId)))
                  .map((row) => <option key={row.evidenceId} value={row.evidenceId}>{row.evidenceId} · {String(row.scope.locationId)} · {row.source}</option>)}
              </select></label>
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
