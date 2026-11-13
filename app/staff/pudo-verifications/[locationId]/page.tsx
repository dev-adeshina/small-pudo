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

type VerificationData = {
  locationId: string;
  candidate: Candidate;
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

    setData(result as VerificationData);
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
          },
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to activate PUDO location.");
      }

      await loadVerification();

      setMessage("PUDO location successfully activated.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to activate PUDO location.",
      );
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
            <h2>PUDO location activation</h2>

            {candidate.lifecycle === "active" ? (
              <p>
                This PUDO location is active. Activation has already
                been completed.
              </p>
            ) : candidate.lifecycle === "submitted" ? (
              <>
                <p>
                  Verification approval has been recorded. Activation
                  is a separate authorised action and will change the
                  candidate lifecycle to active.
                </p>

                <button
                  className="cost-primary-button"
                  type="button"
                  onClick={handleActivation}
                  disabled={saving}
                >
                  {saving ? "Activating location…" : "Activate PUDO location"}
                </button>
              </>
            ) : (
              <p>
                Activation is unavailable for the current candidate
                lifecycle: {candidate.lifecycle || "Unknown"}.
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