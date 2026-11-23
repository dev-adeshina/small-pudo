"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";

type VerificationStatus =
  | "pending_inspection"
  | "inspection_recorded"
  | "clarification_required"
  | "approved_to_activate"
  | "not_approved";

type EvidenceAssessment =
  | "sufficient"
  | "insufficient"
  | "conflicting";

type Candidate = {
  name?: string;
  partnerBusinessName?: string;
  address?: string;
  registrationNote?: string;
  lifecycle?: string;
  geo?: {
    latitude?: number;
    longitude?: number;
    captureMethod?: string;
    accuracyMeters?: number;
  } | null;
};

type EvidenceReference = {
  label: string;
  reference: string;
  notes?: string;
};

type Inspection = {
  inspectionId: string;
  inspectedSite?: string;
  inspectedAt?: string;
  findings?: string;
  discrepancies?: string[];
  unresolvedDiscrepancies?: string[];
  limitations?: string;
  evidenceReferences?: EvidenceReference[];
  evidenceAssessment?: EvidenceAssessment;
  assessmentNotes?: string;
  inspectorUid?: string;
};

type AuditEvent = {
  eventId: string;
  action?: string;
  actorUid?: string;
  decision?: string;
  outcome?: string;
  reason?: string;
  timestamp?: unknown;
};

type PartnerResponse = { responseId: string; message?: string; createdAt?: unknown };

type PartnerApplication = {
  contactName?: string;
  email?: string;
  phone?: string;
  businessName?: string;
};

type CapabilityId =
  | "walk_in_intake"
  | "parcel_measurement"
  | "custody_acceptance"
  | "payment_collection"
  | "parcel_handover"
  | "parcel_release";

type CapabilityConfiguration = {
  locationId: string;
  lifecycle: string | null;
  operationalStatus: "not_activated" | "active" | "suspended" | "deactivated";
  capabilities: CapabilityId[];
  version: number;
  configuredBy?: string | null;
  configuredAt?: unknown;
  reason?: string | null;
  canConfigure: boolean;
  canManageActivation: boolean;
  history: Array<{
    versionId: string;
    version: number;
    capabilities: CapabilityId[];
    previousCapabilities?: CapabilityId[];
    reason?: string;
    configuredBy?: string;
    configuredAt?: unknown;
  }>;
};

const CAPABILITY_OPTIONS: Array<{ id: CapabilityId; label: string; description: string }> = [
  { id: "walk_in_intake", label: "Walk-in parcel intake", description: "Create staff-assisted intake records for parcels physically presented at this location." },
  { id: "parcel_measurement", label: "Parcel measurement", description: "Record actual parcel weight and dimensions." },
  { id: "custody_acceptance", label: "Physical custody acceptance", description: "Accept and record physical receipt of parcels." },
  { id: "payment_collection", label: "Payment collection", description: "Collect and record payment using separately approved methods and evidence." },
  { id: "parcel_handover", label: "Parcel handover", description: "Record physical handover to an authorized network actor or location." },
  { id: "parcel_release", label: "Parcel release / collection", description: "Release parcels only to recipients whose collection authority is verified." },
];

type VerificationData = {
  locationId: string;
  candidate: Candidate;
  partnerApplication?: PartnerApplication | null;
  partnerResponses?: PartnerResponse[];
  verification: {
    status?: VerificationStatus;
    decision?: string;
    decisionReason?: string;
    decisionMakerUid?: string;
    latestInspectionId?: string;
  };
  inspections: Inspection[];
  events: AuditEvent[];
};

const STATUS_LABELS: Record<VerificationStatus, string> = {
  pending_inspection: "Pending inspection",
  inspection_recorded: "Inspection recorded — decision required",
  clarification_required: "Clarification required",
  approved_to_activate: "Approved to activate",
  not_approved: "Not approved",
};

function displayDate(value: unknown): string {
  if (!value) return "Not recorded";

  let date: Date;

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof value.seconds === "number"
  ) {
    date = new Date(value.seconds * 1000);
  } else if (
    typeof value === "object" &&
    value !== null &&
    "_seconds" in value &&
    typeof value._seconds === "number"
  ) {
    date = new Date(value._seconds * 1000);
  } else {
    date = new Date(String(value));
  }

  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleString();
}

function linesToList(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function PudoVerificationDetailPage() {
  const params = useParams<{ locationId: string }>();
  const locationId = params.locationId;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [data, setData] = useState<VerificationData | null>(null);
  const [capabilityConfiguration, setCapabilityConfiguration] = useState<CapabilityConfiguration | null>(null);
  const [selectedCapabilities, setSelectedCapabilities] = useState<CapabilityId[]>([]);
  const [capabilityReason, setCapabilityReason] = useState("");
  const [activationReason, setActivationReason] = useState("");
  const [operationalStatusReason, setOperationalStatusReason] = useState("");

  const [inspectedSite, setInspectedSite] = useState("");
  const [inspectedAt, setInspectedAt] = useState(
    () => new Date().toISOString().slice(0, 16),
  );
  const [findings, setFindings] = useState("");
  const [discrepancies, setDiscrepancies] = useState("");
  const [unresolvedDiscrepancies, setUnresolvedDiscrepancies] =
    useState("");
  const [limitations, setLimitations] = useState("");
  const [evidenceReferences, setEvidenceReferences] = useState("");
  const [evidenceAssessment, setEvidenceAssessment] =
    useState<EvidenceAssessment>("insufficient");
  const [assessmentNotes, setAssessmentNotes] = useState("");

  const [decision, setDecision] = useState<
    "approve_to_activate" | "return_for_clarification" | "not_approved"
  >("return_for_clarification");

  const [decisionReason, setDecisionReason] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
      }
    });
  }, []);

  const loadVerification = useCallback(async () => {
    if (!user) return;

    const token = await user.getIdToken();

    const response = await fetch(
      `/api/staff/pudo-verifications/${encodeURIComponent(locationId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || "Unable to retrieve verification record.",
      );
    }

    const verificationData = result as VerificationData;
    setData(verificationData);

    if (verificationData.verification.status === "approved_to_activate") {
      const capabilityResponse = await fetch(
        `/api/staff/pudo-locations/${encodeURIComponent(locationId)}/capabilities`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      );
      const capabilityResult = await capabilityResponse.json();
      if (!capabilityResponse.ok) {
        throw new Error(capabilityResult.error || "Unable to retrieve PUDO capabilities.");
      }
      const configuration = capabilityResult.configuration as CapabilityConfiguration;
      setCapabilityConfiguration(configuration);
      setSelectedCapabilities(configuration.capabilities ?? []);
    } else {
      setCapabilityConfiguration(null);
      setSelectedCapabilities([]);
    }
  }, [user, locationId]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        await loadVerification();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to retrieve verification record.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [user, loadVerification]);

  async function getToken() {
    if (!user) {
      throw new Error("Please sign in again.");
    }

    return user.getIdToken();
  }

  function parseEvidenceReferences(): EvidenceReference[] {
    return evidenceReferences
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, reference, ...notes] = line.split("|");

        if (!label?.trim() || !reference?.trim()) {
          throw new Error(
            "Each evidence reference must contain a label and reference separated by |.",
          );
        }

        return {
          label: label.trim(),
          reference: reference.trim(),
          ...(notes.length > 0
            ? { notes: notes.join("|").trim() }
            : {}),
        };
      });
  }

  async function handleInspection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        inspectedSite,
        inspectedAt: new Date(inspectedAt).toISOString(),
        findings,
        discrepancies: linesToList(discrepancies),
        unresolvedDiscrepancies: linesToList(unresolvedDiscrepancies),
        limitations,
        evidenceReferences: parseEvidenceReferences(),
        evidenceAssessment,
        assessmentNotes,
      };

      const token = await getToken();

      const response = await fetch(
        `/api/staff/pudo-verifications/${encodeURIComponent(locationId)}/inspections`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to record inspection.");
      }

      await loadVerification();

      setMessage("Inspection recorded successfully. A verification decision is now required.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to record inspection.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDecision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const token = await getToken();

      const response = await fetch(
        `/api/staff/pudo-verifications/${encodeURIComponent(locationId)}/decision`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision,
            reason: decisionReason,
          }),
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to record decision.");
      }

      await loadVerification();

      setMessage("Verification decision recorded successfully.");
      setDecisionReason("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to record decision.",
      );
    } finally {
      setSaving(false);
    }
  }


  async function handleActivation() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const token = await getToken();
      const response = await fetch(
        `/api/staff/pudo-locations/${encodeURIComponent(locationId)}/activation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: activationReason }),
          cache: "no-store",
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to activate PUDO location.");
      }

      await loadVerification();
      setActivationReason("");
      setMessage("PUDO location successfully activated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to activate PUDO location.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCapabilities() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const token = await getToken();
      const response = await fetch(
        `/api/staff/pudo-locations/${encodeURIComponent(locationId)}/capabilities`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            capabilities: selectedCapabilities,
            reason: capabilityReason,
          }),
          cache: "no-store",
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save capabilities.");
      await loadVerification();
      setCapabilityReason("");
      setMessage(result.configuration.unchanged
        ? "No capability changes were needed."
        : "PUDO capabilities updated and recorded in the configuration history.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save PUDO capabilities.");
    } finally {
      setSaving(false);
    }
  }

  async function handleOperationalStatus(status: "active" | "suspended" | "deactivated") {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const token = await getToken();
      const response = await fetch(
        `/api/staff/pudo-locations/${encodeURIComponent(locationId)}/activation`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, reason: operationalStatusReason }),
          cache: "no-store",
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to change PUDO operational status.");
      await loadVerification();
      setOperationalStatusReason("");
      setMessage(result.unchanged
        ? "The PUDO location already has that operational status."
        : `PUDO operational status changed to ${status}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change PUDO operational status.");
    } finally {
      setSaving(false);
    }
  }


  if (!user && loading) {
    return (
      <main className="admin-page">
        <p>Loading staff session…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="admin-page">
        <p>Please sign in through the staff workspace to continue.</p>
        <Link href="/staff/sign-in">Staff sign in</Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="admin-page">
        <p>Loading verification record…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="admin-page">
        <p className="cost-feedback" role="alert">
          {error || "Verification record could not be loaded."}
        </p>
        <Link href="/staff/pudo-verifications">
          Back to verification queue
        </Link>
      </main>
    );
  }

  const status =
    data.verification.status ?? "pending_inspection";

  const canInspect =
    status === "pending_inspection" ||
    status === "clarification_required";

  const canDecide = status === "inspection_recorded";

  const isFinal =
    status === "approved_to_activate" ||
    status === "not_approved";

  const candidate = data.candidate;

  return (
    <main className="admin-page">
      <div className="admin-shell cost-admin-shell">
        <header className="admin-header">
          <div>
            <p className="section-label">
              OPERATIONS / LOCATION VERIFICATION
            </p>

            <h1 className="cost-page-heading">
              {candidate.name || "PUDO candidate verification"}
            </h1>

            <p>
              Review the submitted location, record physical inspection
              findings and make a verification decision.
            </p>
          </div>

          <Link
            className="admin-action"
            href="/staff/pudo-verifications"
          >
            Back to verification queue
          </Link>
        </header>

        {error && (
          <p className="cost-feedback" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="cost-feedback" role="status">
            {message}
          </p>
        )}

        <section className="cost-panel">
          <h2>Candidate details</h2>

          <div className="cost-form-grid">
            <div className="cost-field">
              <strong>Location name</strong>
              <p>{candidate.name || "Not provided"}</p>
            </div>

            <div className="cost-field">
              <strong>Originating partner business</strong>
              <p>{candidate.partnerBusinessName || "Not recorded"}</p>
            </div>

            <div className="cost-field">
              <strong>Physical address</strong>
              <p>{candidate.address || "Not provided"}</p>
            </div>

            <div className="cost-field">
              <strong>Registration note</strong>
              <p>{candidate.registrationNote || "None"}</p>
            </div>

            <div className="cost-field">
              <strong>Candidate lifecycle</strong>
              <p>{candidate.lifecycle || "Unknown"}</p>
            </div>

            <div className="cost-field">
              <strong>Coordinates</strong>
              <p>
                {candidate.geo?.latitude ?? "Not provided"},{" "}
                {candidate.geo?.longitude ?? "Not provided"}
              </p>
            </div>

            <div className="cost-field">
              <strong>Coordinate capture method</strong>
              <p>{candidate.geo?.captureMethod || "Not recorded"}</p>
            </div>

            <div className="cost-field">
              <strong>Device accuracy</strong>
              <p>
                {candidate.geo?.accuracyMeters != null
                  ? `${candidate.geo.accuracyMeters} metres`
                  : "Not recorded"}
              </p>
            </div>
          </div>
        </section>

        {data.partnerApplication && (
          <section className="cost-panel">
            <h2>Partner application contact</h2>
            <div className="cost-form-grid">
              <div className="cost-field"><strong>Business</strong><p>{data.partnerApplication.businessName || candidate.partnerBusinessName || "Not recorded"}</p></div>
              <div className="cost-field"><strong>Primary contact</strong><p>{data.partnerApplication.contactName || "Not recorded"}</p></div>
              <div className="cost-field"><strong>Email</strong><p>{data.partnerApplication.email || "Not recorded"}</p></div>
              <div className="cost-field"><strong>Phone</strong><p>{data.partnerApplication.phone || "Not recorded"}</p></div>
            </div>
          </section>
        )}

        {(data.partnerResponses?.length ?? 0) > 0 && (
          <section className="cost-panel">
            <h2>Partner clarification responses</h2>
            <ol>
              {data.partnerResponses!.map((response) => (
                <li key={response.responseId}><p>{response.message}</p></li>
              ))}
            </ol>
          </section>
        )}

        <section className="cost-panel">
          <div className="cost-page-topline">
            <h2>Verification status</h2>
            <strong>
              {STATUS_LABELS[status] ?? status}
            </strong>
          </div>

          {status === "approved_to_activate" && (
            <p>
              This candidate has passed verification and is approved
              for a separate activation process. It has not been
              automatically activated.
            </p>
          )}

          {status === "not_approved" && (
            <p>
              This candidate was not approved. The verification
              outcome is final.
            </p>
          )}

          {data.verification.decisionReason && (
            <p>
              <strong>Decision reason:</strong>{" "}
              {data.verification.decisionReason}
            </p>
          )}
        </section>



        {status === "approved_to_activate" && (
          <section className="cost-panel">
            <div className="cost-panel-heading">
              <div><span className="section-label">PUDO CONFIGURATION</span><h2>Operational capabilities</h2></div>
            </div>
            <p>
              Configure each activity independently. Approval does not grant capabilities,
              and enabling one activity does not enable another. Changes require the
              separate PUDO capability-approval permission.
            </p>
            {capabilityConfiguration ? (
              <>
                <div className="cost-form-grid">
                  <div className="cost-field"><strong>Configuration version</strong><p>{capabilityConfiguration.version || "Not configured"}</p></div>
                  <div className="cost-field"><strong>Operational status</strong><p>{capabilityConfiguration.operationalStatus.replaceAll("_", " ")}</p></div>
                  <div className="cost-field"><strong>Last configured</strong><p>{displayDate(capabilityConfiguration.configuredAt)}</p></div>
                  <div className="cost-field"><strong>Configured by</strong><p>{capabilityConfiguration.configuredBy || "Not recorded"}</p></div>
                </div>
                {capabilityConfiguration.canConfigure ? (
                  <form onSubmit={(event) => { event.preventDefault(); void handleSaveCapabilities(); }}>
                    <div className="cost-form-grid">
                      {CAPABILITY_OPTIONS.map((option) => (
                        <label className="cost-field" key={option.id}>
                          <span>
                            <input
                              type="checkbox"
                              checked={selectedCapabilities.includes(option.id)}
                              disabled={saving}
                              onChange={(event) => setSelectedCapabilities((current) =>
                                event.target.checked
                                  ? [...current, option.id]
                                  : current.filter((item) => item !== option.id)
                              )}
                            />{" "}
                            <strong>{option.label}</strong>
                          </span>
                          <small>{option.description}</small>
                        </label>
                      ))}
                      <label className="cost-field cost-field-wide">
                        Reason for capability configuration
                        <textarea required maxLength={1000} value={capabilityReason}
                          onChange={(event) => setCapabilityReason(event.target.value)} disabled={saving} />
                      </label>
                    </div>
                    <div className="cost-form-actions">
                      <button className="cost-primary-button" type="submit" disabled={saving || !capabilityReason.trim()}>
                        {saving ? "Saving…" : "Save capabilities"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="cost-field">
                    <strong>Configured capabilities</strong>
                    <ul>{capabilityConfiguration.capabilities.map((item) => (
                      <li key={item}>{CAPABILITY_OPTIONS.find((option) => option.id === item)?.label ?? item}</li>
                    ))}</ul>
                    {!capabilityConfiguration.capabilities.length && <p>No capabilities configured.</p>}
                    <p>You can view this configuration, but do not hold the permission required to change it.</p>
                  </div>
                )}
                {capabilityConfiguration.history.length > 0 && (
                  <div className="cost-field">
                    <h3>Capability configuration history</h3>
                    <div className="cost-table-wrap">
                      <table className="cost-table">
                        <thead><tr><th>Version</th><th>Capabilities</th><th>Reason</th><th>Configured by</th><th>Date</th></tr></thead>
                        <tbody>{capabilityConfiguration.history.map((item) => (
                          <tr key={item.versionId}>
                            <td>{item.version}</td>
                            <td>{item.capabilities.map((id) => CAPABILITY_OPTIONS.find((option) => option.id === id)?.label ?? id).join(", ") || "None"}</td>
                            <td>{item.reason || "—"}</td>
                            <td>{item.configuredBy || "—"}</td>
                            <td>{displayDate(item.configuredAt)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : <p>Loading capability configuration…</p>}
          </section>
        )}

        {candidate.lifecycle === "active" && capabilityConfiguration && (
          <section className="cost-panel">
            <h2>PUDO operational status</h2>
            <p><strong>Current status:</strong> {capabilityConfiguration.operationalStatus.replaceAll("_", " ")}</p>
            {capabilityConfiguration.canManageActivation ? (
              <>
                <label className="cost-field">
                  Reason for status change
                  <textarea value={operationalStatusReason} maxLength={1000}
                    onChange={(event) => setOperationalStatusReason(event.target.value)} disabled={saving} />
                </label>
                <div className="cost-form-actions">
                  {capabilityConfiguration.operationalStatus === "active" && (
                    <button className="admin-action" type="button" disabled={saving || !operationalStatusReason.trim()}
                      onClick={() => void handleOperationalStatus("suspended")}>Suspend location</button>
                  )}
                  {capabilityConfiguration.operationalStatus === "suspended" && (
                    <button className="cost-primary-button" type="button" disabled={saving || !operationalStatusReason.trim()}
                      onClick={() => void handleOperationalStatus("active")}>Reactivate location</button>
                  )}
                  {capabilityConfiguration.operationalStatus !== "deactivated" && (
                    <button className="cost-danger-button" type="button" disabled={saving || !operationalStatusReason.trim()}
                      onClick={() => {
                        if (window.confirm("Deactivate this PUDO location permanently? This cannot be reversed.")) {
                          void handleOperationalStatus("deactivated");
                        }
                      }}>Deactivate permanently</button>
                  )}
                </div>
              </>
            ) : <p>You can view operational status, but do not hold the permission required to change it.</p>}
          </section>
        )}

        {status === "approved_to_activate" && (
          <section className="cost-panel">
            <h2>PUDO location activation</h2>

            {candidate.lifecycle === "active" ? (
              <p>This PUDO location is active. Activation has already been completed.</p>
            ) : candidate.lifecycle === "submitted" ? (
              <>
                <p>
                  Verification approval has been recorded. Configure at least one
                  operational capability first. Activation is a separate authorised
                  action and does not itself grant any additional capabilities.
                </p>
                <label className="cost-field">
                  Reason for activation
                  <textarea required maxLength={1000} value={activationReason}
                    onChange={(event) => setActivationReason(event.target.value)} disabled={saving} />
                </label>
                <button
                  className="cost-primary-button"
                  type="button"
                  onClick={handleActivation}
                  disabled={saving || !capabilityConfiguration?.capabilities.length || !activationReason.trim()}
                >
                  {saving ? "Activating location…" : "Activate PUDO location"}
                </button>
              </>
            ) : (
              <p>
                Activation is unavailable for the current candidate lifecycle: {candidate.lifecycle || "Unknown"}.
              </p>
            )}
          </section>
        )}


        {canInspect && (
          <form className="cost-panel" onSubmit={handleInspection}>
            <h2>Physical inspection</h2>

            <p>
              Record what was physically inspected. Do not treat
              submitted coordinates, photographs or documents as
              proof of physical possession or site suitability without
              an appropriate assessment.
            </p>

            <div className="cost-form-grid">
              <div className="cost-field">
                <label htmlFor="inspection-site">
                  Inspected site
                </label>
                <input
                  id="inspection-site"
                  value={inspectedSite}
                  onChange={(event) =>
                    setInspectedSite(event.target.value)
                  }
                  required
                  maxLength={1000}
                  disabled={saving}
                />
              </div>

              <div className="cost-field">
                <label htmlFor="inspection-date">
                  Inspection date and time
                </label>
                <input
                  id="inspection-date"
                  type="datetime-local"
                  value={inspectedAt}
                  onChange={(event) =>
                    setInspectedAt(event.target.value)
                  }
                  required
                  disabled={saving}
                />
              </div>

              <div className="cost-field">
                <label htmlFor="inspection-findings">
                  Inspection findings
                </label>
                <textarea
                  id="inspection-findings"
                  value={findings}
                  onChange={(event) =>
                    setFindings(event.target.value)
                  }
                  rows={5}
                  required
                  maxLength={5000}
                  disabled={saving}
                />
              </div>

              <div className="cost-field">
                <label htmlFor="inspection-discrepancies">
                  Discrepancies
                </label>
                <textarea
                  id="inspection-discrepancies"
                  value={discrepancies}
                  onChange={(event) =>
                    setDiscrepancies(event.target.value)
                  }
                  rows={4}
                  disabled={saving}
                  placeholder="One discrepancy per line"
                />
              </div>

              <div className="cost-field">
                <label htmlFor="inspection-unresolved">
                  Unresolved discrepancies
                </label>
                <textarea
                  id="inspection-unresolved"
                  value={unresolvedDiscrepancies}
                  onChange={(event) =>
                    setUnresolvedDiscrepancies(event.target.value)
                  }
                  rows={4}
                  disabled={saving}
                  placeholder="One unresolved discrepancy per line"
                />
              </div>

              <div className="cost-field">
                <label htmlFor="inspection-limitations">
                  Inspection limitations
                </label>
                <textarea
                  id="inspection-limitations"
                  value={limitations}
                  onChange={(event) =>
                    setLimitations(event.target.value)
                  }
                  rows={3}
                  maxLength={3000}
                  disabled={saving}
                />
              </div>

              <div className="cost-field">
                <label htmlFor="inspection-evidence">
                  Evidence references
                </label>
                <textarea
                  id="inspection-evidence"
                  value={evidenceReferences}
                  onChange={(event) =>
                    setEvidenceReferences(event.target.value)
                  }
                  rows={5}
                  disabled={saving}
                  placeholder={
                    "One reference per line:\n" +
                    "Site photograph | https://example.com/reference | Front entrance"
                  }
                />
                <small>
                  Format: label | reference | optional notes.
                  References are recorded, not independently validated
                  or uploaded by this form.
                </small>
              </div>

              <div className="cost-field">
                <label htmlFor="inspection-assessment">
                  Evidence assessment
                </label>
                <select
                  id="inspection-assessment"
                  value={evidenceAssessment}
                  onChange={(event) =>
                    setEvidenceAssessment(
                      event.target.value as EvidenceAssessment,
                    )
                  }
                  disabled={saving}
                >
                  <option value="sufficient">Sufficient</option>
                  <option value="insufficient">Insufficient</option>
                  <option value="conflicting">Conflicting</option>
                </select>
              </div>

              <div className="cost-field">
                <label htmlFor="inspection-assessment-notes">
                  Evidence assessment notes
                </label>
                <textarea
                  id="inspection-assessment-notes"
                  value={assessmentNotes}
                  onChange={(event) =>
                    setAssessmentNotes(event.target.value)
                  }
                  rows={3}
                  maxLength={3000}
                  disabled={saving}
                />
              </div>
            </div>

            <button
              className="cost-primary-button"
              type="submit"
              disabled={saving}
            >
              {saving ? "Recording inspection…" : "Record inspection"}
            </button>
          </form>
        )}

        {canDecide && (
          <form className="cost-panel" onSubmit={handleDecision}>
            <h2>Verification decision</h2>

            <p>
              The latest inspection has been recorded. Select an
              outcome and provide the reason for the decision.
            </p>

            <div className="cost-form-grid">
              <div className="cost-field">
                <label htmlFor="verification-decision">
                  Decision
                </label>
                <select
                  id="verification-decision"
                  value={decision}
                  onChange={(event) =>
                    setDecision(
                      event.target.value as
                      | "approve_to_activate"
                      | "return_for_clarification"
                      | "not_approved",
                    )
                  }
                  disabled={saving}
                >
                  <option value="approve_to_activate">
                    Approve to activate
                  </option>
                  <option value="return_for_clarification">
                    Return for clarification
                  </option>
                  <option value="not_approved">
                    Not approved
                  </option>
                </select>
              </div>

              <div className="cost-field">
                <label htmlFor="verification-reason">
                  Decision reason
                </label>
                <textarea
                  id="verification-reason"
                  value={decisionReason}
                  onChange={(event) =>
                    setDecisionReason(event.target.value)
                  }
                  rows={4}
                  maxLength={3000}
                  required
                  disabled={saving}
                />
              </div>
            </div>

            {decision === "approve_to_activate" && (
              <p>
                Approval is only possible when the latest inspection
                has sufficient evidence and no unresolved
                discrepancies. Approval does not activate the location.
              </p>
            )}

            <button
              className="cost-primary-button"
              type="submit"
              disabled={saving}
            >
              {saving ? "Recording decision…" : "Record decision"}
            </button>
          </form>
        )}

        {isFinal && (
          <section className="cost-panel">
            <h2>Final verification outcome</h2>
            <p>
              No further inspections or decisions can be recorded
              through this workflow.
            </p>
          </section>
        )}

        <section className="cost-panel">
          <div className="cost-page-topline">
            <h2>Inspection history</h2>
            <span>{data.inspections.length} records</span>
          </div>

          {data.inspections.length === 0 && (
            <p>No inspections have been recorded.</p>
          )}

          {data.inspections.map((inspection) => (
            <article
              className="cost-panel"
              key={inspection.inspectionId}
            >
              <h3>Inspection {inspection.inspectionId}</h3>

              <p>
                <strong>Site:</strong>{" "}
                {inspection.inspectedSite || "Not recorded"}
              </p>

              <p>
                <strong>Inspection date:</strong>{" "}
                {displayDate(inspection.inspectedAt)}
              </p>

              <p>
                <strong>Inspector:</strong>{" "}
                {inspection.inspectorUid || "Not recorded"}
              </p>

              <p>
                <strong>Findings:</strong>{" "}
                {inspection.findings || "None"}
              </p>

              <p>
                <strong>Evidence assessment:</strong>{" "}
                {inspection.evidenceAssessment || "Not recorded"}
              </p>

              <p>
                <strong>Assessment notes:</strong>{" "}
                {inspection.assessmentNotes || "None"}
              </p>

              <p>
                <strong>Discrepancies:</strong>
              </p>

              {inspection.discrepancies?.length ? (
                <ul>
                  {inspection.discrepancies.map((item, index) => (
                    <li key={`${index}-${item}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>None recorded.</p>
              )}

              <p>
                <strong>Unresolved discrepancies:</strong>
              </p>

              {inspection.unresolvedDiscrepancies?.length ? (
                <ul>
                  {inspection.unresolvedDiscrepancies.map((item, index) => (
                    <li key={`${index}-${item}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>None recorded.</p>
              )}

              <p>
                <strong>Limitations:</strong>{" "}
                {inspection.limitations || "None recorded"}
              </p>

              <h4>Evidence references</h4>

              {inspection.evidenceReferences?.length ? (
                <ul>
                  {inspection.evidenceReferences.map((item, index) => (
                    <li key={`${index}-${item.reference}`}>
                      <strong>{item.label}</strong>: {item.reference}
                      {item.notes ? ` — ${item.notes}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No evidence references recorded.</p>
              )}
            </article>
          ))}
        </section>

        <section className="cost-panel">
          <div className="cost-page-topline">
            <h2>Verification audit history</h2>
            <span>{data.events.length} events</span>
          </div>

          {data.events.length === 0 && (
            <p>No verification audit events have been recorded.</p>
          )}

          {data.events.map((event) => (
            <article
              className="cost-panel"
              key={event.eventId}
            >
              <p>
                <strong>Action:</strong>{" "}
                {event.action || "Unknown"}
              </p>

              <p>
                <strong>Actor:</strong>{" "}
                {event.actorUid || "Not recorded"}
              </p>

              {event.decision && (
                <p>
                  <strong>Decision:</strong> {event.decision}
                </p>
              )}

              {event.outcome && (
                <p>
                  <strong>Outcome:</strong> {event.outcome}
                </p>
              )}

              {event.reason && (
                <p>
                  <strong>Reason:</strong> {event.reason}
                </p>
              )}

              <p>
                <strong>Recorded:</strong>{" "}
                {displayDate(event.timestamp)}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}