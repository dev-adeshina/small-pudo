"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { logoutAdmin } from "@/lib/auth";

type ServiceCode = "standard" | "express" | "scheduled";
type Applicability = "applicable" | "not_applicable" | "undetermined";
type Treatment =
  | "included_in_service_charge"
  | "separately_itemized"
  | "no_separate_customer_charge"
  | "not_applicable"
  | "undetermined";
type Activity = {
  activityCode: string;
  activityName: string;
  applicability: Applicability;
  treatment: Treatment;
};
type Configuration = {
  schemaVersion: 1;
  configurationName: string;
  serviceCode: ServiceCode;
  pricingModel?: "fixed" | "calculated" | "hybrid";
  inputs: Array<Record<string, unknown>>;
  components: Array<Record<string, unknown>>;
  activityPricing?: { schemaVersion: 1; activities: Activity[] };
};
type Version = Configuration & { versionId: string; versionNumber: number; createdAt?: unknown };
type Summary = {
  definitionId: string;
  currentVersionId: string;
  currentVersionNumber: number;
  currentVersion: Version;
};
type Detail = { definitionId: string; currentVersionId: string; currentVersionNumber: number; versions: Version[] };

const CATALOGUE = [
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

const APPLICABILITY_LABELS: Record<Applicability, string> = {
  applicable: "Applicable",
  not_applicable: "Not applicable",
  undetermined: "Undetermined",
};
const TREATMENT_LABELS: Record<Treatment, string> = {
  included_in_service_charge: "Included in service charge",
  separately_itemized: "Separately itemized",
  no_separate_customer_charge: "No separate customer charge",
  not_applicable: "Not applicable",
  undetermined: "Undetermined",
};

function emptyConfiguration(serviceCode: ServiceCode = "standard"): Configuration {
  return {
    schemaVersion: 1,
    configurationName: serviceCode[0].toUpperCase() + serviceCode.slice(1) + " activity configuration",
    serviceCode,
    inputs: [],
    components: [],
    activityPricing: {
      schemaVersion: 1,
      activities: CATALOGUE.map(([activityCode, activityName]) => ({
        activityCode,
        activityName,
        applicability: "undetermined",
        treatment: "undetermined",
      })),
    },
  };
}

function configurationFromVersion(version: Version): Configuration {
  const known = new Map((version.activityPricing?.activities ?? []).map((item) => [item.activityCode, item]));
  return {
    schemaVersion: 1,
    configurationName: version.configurationName,
    serviceCode: version.serviceCode,
    ...(version.pricingModel ? { pricingModel: version.pricingModel } : {}),
    inputs: version.inputs ?? [],
    components: version.components ?? [],
    activityPricing: {
      schemaVersion: 1,
      activities: CATALOGUE.map(([activityCode, activityName]) => {
        const current = known.get(activityCode);
        return current ? { ...current, activityName } : {
          activityCode, activityName, applicability: "undetermined", treatment: "undetermined",
        };
      }),
    },
  };
}

function requestHeaders(token: string): HeadersInit {
  return { Authorization: "Bearer " + token, "Content-Type": "application/json" };
}

export default function CommercialPricingDefinitionsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [definitions, setDefinitions] = useState<Summary[]>([]);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [form, setForm] = useState<Configuration>(emptyConfiguration());
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selectedVersion = selected?.versions.find((version) => version.versionId === selected.currentVersionId)
    ?? selected?.versions[selected.versions.length - 1]
    ?? null;

  const loadDefinitions = useCallback(async (idToken: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/commercial-pricing-definitions?limit=100", {
        headers: requestHeaders(idToken), cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load activity configurations.");
      setDefinitions(Array.isArray(data.definitions) ? data.definitions : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load activity configurations.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string, idToken: string) => {
    const response = await fetch("/api/admin/commercial-pricing-definitions/" + encodeURIComponent(id), {
      headers: requestHeaders(idToken), cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to load configuration history.");
    setSelected(data.definition as Detail);
    setForm(configurationFromVersion(data.definition.versions.find(
      (version: Version) => version.versionId === data.definition.currentVersionId
    ) ?? data.definition.versions[data.definition.versions.length - 1]));
    setEditing(false);
    setCreating(false);
  }, []);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) { router.replace("/staff/sign-in"); return; }
      if (!user.emailVerified) {
        router.replace("/admin/verify-email?email=" + encodeURIComponent(user.email ?? ""));
        return;
      }
      const idToken = await user.getIdToken();
      if (!active) return;
      setEmail(user.email ?? "");
      setToken(idToken);
      let activation = "unknown";
      try {
        const response = await fetch("/api/staff/invitations/activate", {
          headers: { Authorization: "Bearer " + idToken }, cache: "no-store",
        });
        const data = await response.json();
        if (response.ok) activation = data.status;
      } catch { /* The pricing API still enforces staff permissions. */ }
      if (!active) return;
      setChecking(false);
      if (activation === "pending" || activation === "expired") {
        setError("Complete staff activation before accessing commercial pricing configuration.");
        setLoading(false);
      } else {
        void loadDefinitions(idToken);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [loadDefinitions, router]);

  function startCreate() {
    setSelected(null);
    setForm(emptyConfiguration());
    setEditing(true);
    setCreating(true);
    setError("");
    setNotice("");
  }

  async function selectDefinition(summary: Summary) {
    setError("");
    setNotice("");
    try { await loadDetail(summary.definitionId, token); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load configuration."); }
  }

  function updateActivity(index: number, field: "applicability" | "treatment", value: Applicability | Treatment) {
    setForm((current) => ({
      ...current,
      activityPricing: {
        ...current.activityPricing,
        activities: current.activityPricing.activities.map((activity, itemIndex) => {
          if (itemIndex !== index) return activity;
          if (field === "applicability") {
            const applicability = value as Applicability;
            const treatment: Treatment = applicability === "not_applicable"
              ? "not_applicable" : applicability === "undetermined" ? "undetermined"
              : activity.treatment === "not_applicable" || activity.treatment === "undetermined"
                ? "undetermined" : activity.treatment;
            return { ...activity, applicability, treatment };
          }
          return { ...activity, treatment: value as Treatment };
        }),
      },
    }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const endpoint = creating
        ? "/api/admin/commercial-pricing-definitions"
        : "/api/admin/commercial-pricing-definitions/" + encodeURIComponent(selected!.definitionId);
      const body = creating ? form : {
        expectedCurrentVersionNumber: selected!.currentVersionNumber,
        configuration: form,
      };
      const response = await fetch(endpoint, {
        method: creating ? "POST" : "PATCH",
        headers: requestHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save the activity configuration.");
      const id = creating ? data.definitionId : selected!.definitionId;
      setNotice(creating ? "Activity configuration draft created." : "A new immutable activity configuration version was created.");
      await loadDefinitions(token);
      if (id) await loadDetail(id, token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save the activity configuration.");
    } finally { setSaving(false); }
  }

  async function logout() {
    await logoutAdmin();
    router.replace("/staff/sign-in");
  }

  if (checking) return <main className="admin-loading"><span>Checking staff access...</span></main>;

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/" className="admin-logo"><Image src="/logo.svg" width={60} height={20} alt="VeriLyft" priority /></Link>
        <div className="admin-header-right">
          <Link href="/admin/operational-cost-definitions" className="admin-action">Operational costs</Link>
          <span className="admin-email">{email}</span>
          <button type="button" className="admin-logout" onClick={logout}>Sign out</button>
        </div>
      </header>
      <div className="admin-shell cost-admin-shell">
        <div className="cost-page-topline">
          <div><span className="section-label">M1 / EXECUTION 2</span><h1>Activity-based pricing configuration</h1>
            <p>Configure how each operational activity relates to a service. This is a draft configuration foundation, not an approved price.</p></div>
          <button className="cost-primary-button" type="button" onClick={startCreate}>New service configuration</button>
        </div>
        {error && <div className="cost-alert"><strong>Unable to continue</strong><span>{error}</span></div>}
        {notice && <div className="cost-notice">{notice}</div>}
        <section className="cost-panel">
          <div className="cost-panel-heading"><div><span className="section-label">01 / SERVICE CONFIGURATIONS</span><h2>Existing configurations</h2></div></div>
          {loading ? <p>Loading configurations...</p> : definitions.length === 0
            ? <div className="cost-empty"><strong>No commercial pricing configurations</strong><p>Create a service activity configuration to begin.</p></div>
            : definitions.map((item) => <button className="cost-version-row" type="button" key={item.definitionId} onClick={() => void selectDefinition(item)}>
              <strong>{item.currentVersion.configurationName}</strong><span>{item.currentVersion.serviceCode} · version {item.currentVersionNumber}</span>
              <small>{item.currentVersion.activityPricing ? "Activity mapping configured" : "No activity mapping"}</small>
            </button>)}
        </section>
        {editing && <section className="cost-panel" style={{ marginTop: 22 }}>
          <div className="cost-panel-heading"><div><span className="section-label">02 / ACTIVITY MAPPING</span><h2>{creating ? "Create service configuration" : "Revise service configuration"}</h2></div></div>
          <form className="cost-form-grid" onSubmit={save}>
            <label className="cost-field cost-field-wide">Configuration name
              <input required maxLength={120} value={form.configurationName} onChange={(event) => setForm((current) => ({ ...current, configurationName: event.target.value }))} />
            </label>
            <label className="cost-field">Service
              <select value={form.serviceCode} disabled={!creating} onChange={(event) => setForm(emptyConfiguration(event.target.value as ServiceCode))}>
                <option value="standard">Standard</option><option value="express">Express</option><option value="scheduled">Scheduled</option>
              </select>
            </label>
            <div className="cost-field cost-field-wide"><strong>Operational activity applicability and commercial treatment</strong>
              <p>Use Undetermined where evidence is insufficient. Applicability does not activate a service or approve a customer charge.</p>
            </div>
            {form.activityPricing.activities.map((activity, index) => <div className="cost-field cost-field-wide" key={activity.activityCode}>
              <strong>{activity.activityCode} — {activity.activityName}</strong>
              <div className="cost-form-grid">
                <label className="cost-field">Applicability
                  <select value={activity.applicability} onChange={(event) => updateActivity(index, "applicability", event.target.value as Applicability)}>
                    {Object.entries(APPLICABILITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="cost-field">Commercial treatment
                  <select value={activity.treatment} disabled={activity.applicability !== "applicable"} onChange={(event) => updateActivity(index, "treatment", event.target.value as Treatment)}>
                    {(["undetermined", "included_in_service_charge", "separately_itemized", "no_separate_customer_charge"] as Treatment[]).map((value) => <option key={value} value={value}>{TREATMENT_LABELS[value]}</option>)}
                  </select>
                </label>
              </div>
            </div>)}
            <div className="cost-form-actions cost-field-wide">
              <button className="cost-primary-button" type="submit" disabled={saving}>{saving ? "Saving..." : "Save draft version"}</button>
              <button className="cost-secondary-button" type="button" onClick={() => { setEditing(false); setCreating(false); }}>Cancel</button>
            </div>
          </form>
          <p className="cost-footer-note">Saving creates an immutable draft version only. It does not select a pricing model, add rates or formulas, approve or publish a price, activate a service, or permit quotation issuance.</p>
        </section>}
        {selected && !editing && <section className="cost-panel" style={{ marginTop: 22 }}>
          <div className="cost-panel-heading"><div><span className="section-label">03 / VERSION DETAIL</span><h2>{selectedVersion?.configurationName}</h2></div>
            <button className="cost-primary-button" type="button" onClick={() => { if (selectedVersion) setForm(configurationFromVersion(selectedVersion)); setEditing(true); setCreating(false); }}>Revise draft</button>
          </div>
          <p>Service: {selectedVersion?.serviceCode} · Version {selected.currentVersionNumber}</p>
          <p>Activity assignments: {(selectedVersion?.activityPricing?.activities ?? []).filter((item) => item.applicability !== "undetermined").length} of 11 decided.</p>
          <div className="cost-version-list">{(selectedVersion?.activityPricing?.activities ?? CATALOGUE.map(([activityCode, activityName]) => ({ activityCode, activityName, applicability: "undetermined" as const, treatment: "undetermined" as const }))).map((item) => <div className="cost-version-row" key={item.activityCode}>
            <strong>{item.activityCode} — {item.activityName}</strong><span>{APPLICABILITY_LABELS[item.applicability]}</span><small>{TREATMENT_LABELS[item.treatment]}</small>
          </div>)}</div>
          <p className="cost-footer-note">No commercial approval or publication state is represented here. All service eligibility and quote-readiness gates remain separate.</p>
        </section>}
      </div>
    </main>
  );
}
