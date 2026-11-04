"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, ClipboardList, FilePlus2, Loader2, LogOut, Plus, RefreshCw, Save, Send, ShieldCheck, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { logoutAdmin } from "@/lib/auth";

type InputType = "string" | "number" | "boolean" | "date";
type InputDefinition = { key: string; label: string; description?: string; valueType: InputType; required: boolean; source?: string; unit?: string; precision?: number; conversion?: string };
type CostComponent = { key: string; label: string; description?: string; amount?: string; currencyCode?: string; basis?: string; treatment?: string; evidenceDescription?: string };
type DefinitionPayload = { activityCode: string; activityName: string; activityDescription: string; applicability: "general"; inputs: InputDefinition[]; costComponents: CostComponent[] };
type WorkflowState = "draft" | "pending_operations_validation" | "pending_finance_review" | "pending_independent_approval" | "changes_requested" | "approved" | "rejected";
type Workflow = { state: WorkflowState };
type DefinitionVersion = DefinitionPayload & { versionId: string; versionNumber: number; createdAt?: unknown; createdBy?: string; workflow?: Workflow; events?: Array<{ eventId: string; action: string; actorUid: string; timestamp?: unknown; reason?: string | null }> };
type DefinitionSummary = { definitionId: string; currentVersionId: string; currentVersionNumber: number; approvedVersionNumber?: number; currentVersion: DefinitionVersion; workflow: Workflow };
type DefinitionDetail = Omit<DefinitionSummary, "currentVersion" | "workflow"> & { versions: DefinitionVersion[] };

const ACTIVITIES = [
  ["ACT-01", "Origin PUDO presentation and receipt"],
  ["ACT-02", "Parcel verification and measurement at origin PUDO"],
  ["ACT-03", "Origin PUDO custody acceptance"],
  ["ACT-04", "Transport / movement between operational points"],
  ["ACT-05", "Destination PUDO receipt / custody acceptance"],
  ["ACT-06", "Delivery to an address / recipient handover"],
  ["ACT-07", "Collection / release to an authorized collector"],
  ["ACT-08", "Failed collection or delivery attempt"],
  ["ACT-09", "Return-to-Sender (RTS) journey"],
  ["ACT-10", "Exception review and resolution"],
  ["ACT-11", "Origin PUDO substitution handling"],
] as const;

const STATE_LABELS: Record<WorkflowState, string> = {
  draft: "Draft",
  pending_operations_validation: "Awaiting Operations",
  pending_finance_review: "Awaiting Finance",
  pending_independent_approval: "Awaiting independent approval",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
};

const emptyForm = (): DefinitionPayload => ({
  activityCode: "ACT-01",
  activityName: ACTIVITIES[0][1],
  activityDescription: "",
  applicability: "general",
  inputs: [],
  costComponents: [],
});

function formatDate(value: unknown): string {
  if (!value) return "—";
  let date: Date | null = null;
  if (typeof value === "string" || typeof value === "number") date = new Date(value);
  else if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const seconds = typeof record.seconds === "number" ? record.seconds : typeof record._seconds === "number" ? record._seconds : null;
    if (seconds !== null) date = new Date(seconds * 1000);
  }
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(date)
    : "—";
}

function stateOf(version?: DefinitionVersion | null): WorkflowState {
  return version?.workflow?.state ?? "draft";
}

function headers(token: string): HeadersInit {
  return { Authorization: "Bearer " + token, "Content-Type": "application/json" };
}

export default function OperationalCostDefinitionsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [token, setToken] = useState("");
  const [definitions, setDefinitions] = useState<DefinitionSummary[]>([]);
  const [selected, setSelected] = useState<DefinitionDetail | null>(null);
  const [form, setForm] = useState<DefinitionPayload>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [notice, setNotice] = useState("");
  const [reason, setReason] = useState("");

  const loadDefinitions = useCallback(async (idToken: string) => {
    setLoading(true);
    setListError("");
    try {
      const response = await fetch("/api/admin/operational-cost-definitions?limit=100", { headers: headers(idToken), cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load definitions.");
      setDefinitions(Array.isArray(data.definitions) ? data.definitions : []);
    } catch (cause) {
      setListError(cause instanceof Error ? cause.message : "Unable to load definitions.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string, idToken: string) => {
    setError("");
    try {
      const response = await fetch("/api/admin/operational-cost-definitions/" + encodeURIComponent(id), { headers: headers(idToken), cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load definition history.");
      setSelected(data.definition as DefinitionDetail);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load definition history.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        router.replace("/staff/sign-in");
        return;
      }
      if (!user.emailVerified) {
        router.replace("/admin/verify-email?email=" + encodeURIComponent(user.email ?? ""));
        return;
      }
      const idToken = await user.getIdToken();
      if (!active) return;
      setAdminEmail(user.email ?? "");
      setToken(idToken);
      setCheckingAuth(false);
      // The page accepts a verified Firebase identity; each data/action request
      // is independently authorized by its server-side action permission.
      void loadDefinitions(idToken);
    });
    return () => { active = false; unsubscribe(); };
  }, [loadDefinitions, router]);

  const selectedVersion = useMemo(() => {
    if (!selected) return null;
    return selected.versions.find((version) => version.versionId === selected.currentVersionId)
      ?? selected.versions[selected.versions.length - 1]
      ?? null;
  }, [selected]);
  const state = stateOf(selectedVersion);
  const canRevise = state === "draft" || state === "changes_requested" || state === "approved";

  function startCreate() {
    setSelected(null);
    setForm(emptyForm());
    setEditing(true);
    setCreating(true);
    setError("");
    setNotice("");
  }

  function startRevision() {
    if (!selectedVersion) return;
    setForm({
      activityCode: selectedVersion.activityCode,
      activityName: selectedVersion.activityName,
      activityDescription: selectedVersion.activityDescription ?? "",
      applicability: "general",
      inputs: (selectedVersion.inputs ?? []).map((item) => ({ ...item })),
      costComponents: (selectedVersion.costComponents ?? []).map((item) => ({ ...item })),
    });
    setEditing(true);
    setCreating(false);
    setError("");
    setNotice("");
  }

  function updateInput(index: number, field: keyof InputDefinition, value: string | boolean | number | undefined) {
    setForm((current) => ({
      ...current,
      inputs: current.inputs.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (value === undefined) {
          const next = { ...item };
          if (field === "precision") delete next.precision;
          return next;
        }
        return { ...item, [field]: value };
      }),
    }));
  }

  function updateComponent(index: number, field: keyof CostComponent, value: string) {
    setForm((current) => ({
      ...current,
      costComponents: current.costComponents.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const next = { ...item };

        if ((field === "amount" || field === "currencyCode") && value.trim() === "") {
          delete next[field];
          return next;
        }

        return { ...next, [field]: value };
      }),
    }));
  }

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const endpoint = creating ? "/api/admin/operational-cost-definitions" : "/api/admin/operational-cost-definitions/" + encodeURIComponent(selected!.definitionId);
      const body = creating ? form : { expectedCurrentVersionNumber: selected!.currentVersionNumber, definition: form };
      const response = await fetch(endpoint, { method: creating ? "POST" : "PATCH", headers: headers(token), body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save the definition.");
      const id = creating ? data.definitionId : selected!.definitionId;
      setEditing(false);
      setCreating(false);
      setNotice(creating ? "Draft definition created." : "A new immutable draft version was created.");
      await loadDefinitions(token);
      if (id) await loadDetail(id, token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save the definition.");
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action: string) {
    if (!selected || !selectedVersion || !token) return;
    const actionReason = reason.trim();
    if ((action === "request_changes" || action === "reject") && !actionReason) {
      setError("A reason is required for this decision.");
      return;
    }
    setActing(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/operational-cost-definitions/" + encodeURIComponent(selected.definitionId) + "/workflow", {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({ versionId: selectedVersion.versionId, action, ...(actionReason ? { reason: actionReason } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The workflow action could not be completed.");
      setReason("");
      setNotice("Workflow updated: " + (STATE_LABELS[data.state as WorkflowState] ?? data.state) + ".");
      await loadDefinitions(token);
      await loadDetail(selected.definitionId, token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The workflow action could not be completed.");
    } finally {
      setActing(false);
    }
  }

  async function handleLogout() {
    await logoutAdmin();
    router.replace("/staff/sign-in");
  }

  if (checkingAuth) return <main className="admin-loading"><span>Checking staff access...</span></main>;

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/" className="admin-logo"><Image src="/logo.svg" width={60} height={20} alt="VeriLyft" priority /></Link>
        <div className="admin-header-right">
          <span className="admin-email">{adminEmail}</span>
          <button type="button" className="admin-logout" onClick={handleLogout} aria-label="Sign out"><LogOut size={17} /></button>
        </div>
      </header>

      <div className="admin-shell cost-admin-shell">
        <div className="cost-page-topline">
          <Link href="/" className="category-back-link"><ArrowLeft size={15} /> Home</Link>
          <span className="section-label">OPERATIONS / COST CONFIGURATION</span>
        </div>
        <section className="cost-page-heading">
          <div>
            <span className="eyebrow">INTERNAL CONTROL / VERSIONED DEFINITIONS</span>
            <h1>Operational cost <em>definitions.</em></h1>
            <p>Maintain activity cost definitions through the existing Operations, Finance and independent approval workflow.</p>
          </div>
          <button type="button" className="cost-primary-button" onClick={startCreate} disabled={loading || Boolean(listError)}><Plus size={17} /> New draft</button>
        </section>

        <div className="cost-boundary-note">
          <ShieldCheck size={19} />
          <div><strong>Internal configuration only</strong><p>Saving or approving a definition does not calculate customer prices, issue quotations, activate services or authorize parcel operations. Use source-backed amounts, explicit currencies and bases only. Do not enter assumed defaults.</p></div>
        </div>
        {notice && <div className="cost-feedback cost-feedback-success"><CheckCircle2 size={17} />{notice}</div>}
        {error && <div className="cost-feedback cost-feedback-error"><AlertCircle size={17} />{error}</div>}

        <div className="cost-workspace">
          <section className="cost-panel cost-list-panel">
            <div className="cost-panel-heading">
              <div><span className="section-label">01 / REGISTER</span><h2>Activity definitions</h2></div>
              <button type="button" className="cost-icon-button" onClick={() => void loadDefinitions(token)} aria-label="Refresh definitions" disabled={loading}>{loading ? <Loader2 size={17} className="cost-spin" /> : <RefreshCw size={17} />}</button>
            </div>
            {loading ? <div className="cost-empty"><Loader2 size={22} className="cost-spin" /><span>Loading definitions...</span></div> :
              listError ? <div className="cost-empty"><AlertCircle size={25} /><strong>Unable to load definitions</strong><p>{listError}</p></div> :
              definitions.length === 0 ? <div className="cost-empty"><ClipboardList size={28} /><strong>No definitions yet</strong><p>Start with an evidence-backed draft. No activities or costs are preconfigured.</p></div> :
              <div className="cost-definition-list">
                {definitions.map((item) => {
                  const itemState = item.workflow?.state ?? "draft";
                  return <button type="button" key={item.definitionId} className={"cost-definition-item" + (selected?.definitionId === item.definitionId ? " is-selected" : "")}
                    onClick={() => { setEditing(false); setCreating(false); void loadDetail(item.definitionId, token); }}>
                    <span className="cost-definition-code">{item.currentVersion?.activityCode ?? "ACT"}</span>
                    <span className="cost-definition-main"><strong>{item.currentVersion?.activityName ?? "Untitled activity"}</strong><small>Version {item.currentVersionNumber} · {STATE_LABELS[itemState]}</small></span>
                    <span className={"cost-state-dot cost-state-" + itemState} />
                  </button>;
                })}
              </div>}
          </section>

          <section className="cost-panel cost-detail-panel">
            {editing ? (
              <form onSubmit={saveDraft}>
                <div className="cost-panel-heading">
                  <div><span className="section-label">02 / {creating ? "NEW DEFINITION" : "NEW VERSION"}</span><h2>{creating ? "Create a draft" : "Revise current version"}</h2></div>
                  <button type="button" className="cost-icon-button" onClick={() => { setEditing(false); setCreating(false); }} aria-label="Close editor"><X size={18} /></button>
                </div>
                <div className="cost-form-grid">
                  <label className="cost-field cost-field-wide"><span>Activity catalogue</span>
                    <select value={form.activityCode} disabled={!creating} onChange={(event) => {
                      const activity = ACTIVITIES.find((item) => item[0] === event.target.value);
                      setForm((current) => ({ ...current, activityCode: event.target.value, activityName: activity?.[1] ?? current.activityName }));
                    }}>{ACTIVITIES.map((item) => <option key={item[0]} value={item[0]}>{item[0]} — {item[1]}</option>)}</select>
                    <small>ACT-01 to ACT-11 only. ACT-12 remains inactive.</small>
                  </label>
                  <label className="cost-field cost-field-wide"><span>Activity description</span><textarea rows={3} value={form.activityDescription} maxLength={500} onChange={(event) => setForm((current) => ({ ...current, activityDescription: event.target.value }))} placeholder="Describe the validated scope of this activity." /></label>
                </div>

                <div className="cost-section-heading"><div><h3>Operational inputs</h3><p>Only add inputs supported by validated activity evidence.</p></div><button type="button" className="cost-secondary-button" onClick={() => setForm((current) => ({ ...current, inputs: [...current.inputs, { key: "", label: "", valueType: "string", required: false }] }))}><Plus size={15} /> Add input</button></div>
                {form.inputs.length === 0 && <p className="cost-inline-empty">No inputs configured for this version.</p>}
                {form.inputs.map((input, index) => <div className="cost-editor-card" key={"input-" + index}>
                  <div className="cost-editor-card-heading"><strong>Input {index + 1}</strong><button type="button" onClick={() => setForm((current) => ({ ...current, inputs: current.inputs.filter((_, i) => i !== index) }))}>Remove</button></div>
                  <div className="cost-form-grid">
                    <label className="cost-field"><span>Stable key</span><input value={input.key} maxLength={64} onChange={(event) => updateInput(index, "key", event.target.value)} placeholder="e.g. workQuantity" /></label>
                    <label className="cost-field"><span>Label</span><input value={input.label} maxLength={120} onChange={(event) => updateInput(index, "label", event.target.value)} placeholder="Input name" /></label>
                    <label className="cost-field"><span>Value type</span><select value={input.valueType} onChange={(event) => updateInput(index, "valueType", event.target.value as InputType)}><option value="string">Text</option><option value="number">Number</option><option value="boolean">Yes / No</option><option value="date">Date</option></select></label>
                    <label className="cost-field"><span>Source</span><input value={input.source ?? ""} maxLength={200} onChange={(event) => updateInput(index, "source", event.target.value)} placeholder="Authoritative source" /></label>
                    <label className="cost-field"><span>Unit</span><input value={input.unit ?? ""} maxLength={80} onChange={(event) => updateInput(index, "unit", event.target.value)} placeholder="Only if established" /></label>
                    <label className="cost-field"><span>Precision</span><input type="number" min="0" step="1" value={input.precision ?? ""} disabled={input.valueType !== "number"} onChange={(event) => updateInput(index, "precision", event.target.value === "" ? undefined : Number(event.target.value))} /></label>
                    <label className="cost-field"><span>Description</span><input value={input.description ?? ""} maxLength={500} onChange={(event) => updateInput(index, "description", event.target.value)} placeholder="Explain the input." /></label>
                    <label className="cost-field"><span>Approved conversion</span><input value={input.conversion ?? ""} maxLength={200} onChange={(event) => updateInput(index, "conversion", event.target.value)} placeholder="Leave blank if none." /></label>
                    <label className="cost-checkbox"><input type="checkbox" checked={input.required} onChange={(event) => updateInput(index, "required", event.target.checked)} /> Required input</label>
                  </div>
                </div>)}

                <div className="cost-section-heading"><div><h3>Cost components</h3><p>Do not enter amounts, currencies or bases without source evidence.</p></div><button type="button" className="cost-secondary-button" onClick={() => setForm((current) => ({ ...current, costComponents: [...current.costComponents, { key: "", label: "" }] }))}><Plus size={15} /> Add component</button></div>
                {form.costComponents.length === 0 && <p className="cost-inline-empty">No cost components yet. An incomplete draft can be saved but cannot be submitted.</p>}
                {form.costComponents.map((component, index) => <div className="cost-editor-card" key={"component-" + index}>
                  <div className="cost-editor-card-heading"><strong>Cost component {index + 1}</strong><button type="button" onClick={() => setForm((current) => ({ ...current, costComponents: current.costComponents.filter((_, i) => i !== index) }))}>Remove</button></div>
                  <div className="cost-form-grid">
                    <label className="cost-field"><span>Stable key</span><input value={component.key} maxLength={64} onChange={(event) => updateComponent(index, "key", event.target.value)} placeholder="e.g. partnerService" /></label>
                    <label className="cost-field"><span>Component label</span><input value={component.label} maxLength={120} onChange={(event) => updateComponent(index, "label", event.target.value)} placeholder="Cost description" /></label>
                    <label className="cost-field"><span>Amount (decimal)</span><input inputMode="decimal" value={component.amount ?? ""} maxLength={40} onChange={(event) => updateComponent(index, "amount", event.target.value)} placeholder="No default amount" /></label>
                    <label className="cost-field"><span>Currency code</span><input value={component.currencyCode ?? ""} maxLength={3} onChange={(event) => updateComponent(index, "currencyCode", event.target.value.toUpperCase())} placeholder="Explicit ISO code" /></label>
                    <label className="cost-field"><span>Basis / unit</span><input value={component.basis ?? ""} maxLength={120} onChange={(event) => updateComponent(index, "basis", event.target.value)} placeholder="Evidence-backed basis" /></label>
                    <label className="cost-field"><span>Treatment</span><input value={component.treatment ?? ""} maxLength={80} onChange={(event) => updateComponent(index, "treatment", event.target.value)} placeholder="If Finance classified" /></label>
                    <label className="cost-field cost-field-wide"><span>Evidence description</span><textarea rows={3} value={component.evidenceDescription ?? ""} maxLength={1000} onChange={(event) => updateComponent(index, "evidenceDescription", event.target.value)} placeholder="Source record, source owner, observation period and limitations." /></label>
                    <label className="cost-field cost-field-wide"><span>Component description</span><input value={component.description ?? ""} maxLength={500} onChange={(event) => updateComponent(index, "description", event.target.value)} placeholder="Optional scope or exclusions." /></label>
                  </div>
                </div>)}
                <div className="cost-form-actions">
                  <button type="button" className="cost-secondary-button" onClick={() => { setEditing(false); setCreating(false); }}>Cancel</button>
                  <button type="submit" className="cost-primary-button" disabled={saving}>{saving ? <Loader2 size={16} className="cost-spin" /> : <Save size={16} />} Save draft version</button>
                </div>
              </form>
            ) : selected && selectedVersion ? (
              <div>
                <div className="cost-panel-heading">
                  <div><span className="section-label">02 / DEFINITION DETAIL</span><h2>{selectedVersion.activityName}</h2><p className="cost-subtitle">{selectedVersion.activityCode} · Version {selectedVersion.versionNumber} · General applicability</p></div>
                  <span className={"cost-state-badge cost-state-" + state}>{STATE_LABELS[state]}</span>
                </div>
                <p className="cost-description">{selectedVersion.activityDescription || "No activity description recorded."}</p>
                <div className="cost-detail-meta">
                  <div><span>Created by</span><strong>{selectedVersion.createdBy ?? "—"}</strong></div>
                  <div><span>Created</span><strong>{formatDate(selectedVersion.createdAt)}</strong></div>
                  <div><span>Current version</span><strong>{selected.currentVersionNumber}</strong></div>
                  <div><span>Approved version</span><strong>{selected.approvedVersionNumber ?? "None"}</strong></div>
                </div>
                <div className="cost-detail-section"><h3>Operational inputs</h3>
                  {selectedVersion.inputs?.length ? selectedVersion.inputs.map((input) => <div className="cost-readonly-row" key={input.key}><strong>{input.label}</strong><span>{input.key} · {input.valueType} · {input.required ? "Required" : "Optional"}</span><small>{[input.source, input.unit, input.description, input.conversion].filter(Boolean).join(" · ") || "No source details recorded."}</small></div>) : <p className="cost-inline-empty">No operational inputs configured.</p>}
                </div>
                <div className="cost-detail-section"><h3>Cost components</h3>
                  {selectedVersion.costComponents?.length ? selectedVersion.costComponents.map((component) => <div className="cost-readonly-row" key={component.key}><strong>{component.label}</strong><span>{component.amount ? component.amount + " " + (component.currencyCode ?? "") : "Amount not recorded"} · {component.basis ?? "Basis not recorded"}</span><small>{component.evidenceDescription || "No evidence description recorded."}</small></div>) : <p className="cost-inline-empty">No cost components configured.</p>}
                </div>
                <div className="cost-workflow-actions">
                  {canRevise && <button type="button" className="cost-secondary-button" onClick={startRevision}><FilePlus2 size={15} /> Create new version</button>}
                  {state === "draft" && <button type="button" className="cost-primary-button" onClick={() => void runAction("submit")} disabled={acting}><Send size={15} /> Submit for Operations validation</button>}
                  {state === "pending_operations_validation" && <button type="button" className="cost-primary-button" onClick={() => void runAction("validate")} disabled={acting}>Validate for Finance</button>}
                  {state === "pending_finance_review" && <button type="button" className="cost-primary-button" onClick={() => void runAction("finance_review")} disabled={acting}>Complete Finance review</button>}
                  {state === "pending_independent_approval" && <button type="button" className="cost-primary-button" onClick={() => void runAction("approve")} disabled={acting}><CheckCircle2 size={15} /> Approve version</button>}
                </div>
                {(state === "pending_operations_validation" || state === "pending_finance_review" || state === "pending_independent_approval") && <div className="cost-decision-box">
                  <label className="cost-field"><span>Reason (required for changes requested or rejection)</span><textarea rows={2} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} placeholder="Record the decision reason." /></label>
                  <div className="cost-decision-actions">
                    {(state === "pending_operations_validation" || state === "pending_finance_review") && <button type="button" className="cost-secondary-button" onClick={() => void runAction("request_changes")} disabled={acting}>Request changes</button>}
                    {state === "pending_independent_approval" && <button type="button" className="cost-danger-button" onClick={() => void runAction("reject")} disabled={acting}>Reject version</button>}
                  </div>
                </div>}
                <div className="cost-detail-section"><h3>Approval history</h3>
                  {selectedVersion.events?.length ? <div className="cost-event-list">{selectedVersion.events.map((event) => <div className="cost-event" key={event.eventId}><span className="cost-event-marker" /><div><strong>{event.action.replace(/_/g, " ")}</strong><small>{event.actorUid} · {formatDate(event.timestamp)}</small>{event.reason && <p>{event.reason}</p>}</div></div>)}</div> : <p className="cost-inline-empty">No workflow decisions recorded for this version.</p>}
                </div>
                <div className="cost-detail-section"><h3>Version history</h3><div className="cost-version-list">{selected.versions.map((version) => <div className="cost-version-row" key={version.versionId}><span>Version {version.versionNumber}</span><strong>{STATE_LABELS[stateOf(version)]}</strong><small>{formatDate(version.createdAt)}</small></div>)}</div></div>
              </div>
            ) : <div className="cost-empty cost-detail-empty"><ClipboardList size={34} /><strong>Select an activity definition</strong><p>Review immutable versions and workflow decisions, or create a new internal draft.</p></div>}
          </section>
        </div>
        <p className="cost-footer-note">Access is enforced by existing staff action permissions. Admin access alone does not grant view, proposal, validation, Finance or approval authority. Permission assignments remain outside this interface.</p>
      </div>
    </main>
  );
}
