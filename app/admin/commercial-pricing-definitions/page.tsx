"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { verifyAdminAccess } from "@/lib/admin-auth";
import { logoutAdmin } from "@/lib/auth";
import { WorkspaceShell } from "@/components/design-system/WorkspaceShell";
import { adminWorkspaceNavigation } from "@/components/design-system/workspace-navigation";
import { Button } from "@/components/design-system/Button";
import { FeedbackState } from "@/components/design-system/FeedbackState";
import { LogOut } from "lucide-react";
import { StaffActionDialog } from "@/components/staff/StaffActionDialog";

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

type PricingInput = {
  key: string;
  label: string;
  required: boolean;
  valueType: "number";
  source?: string;
  unit: string;
};

type PricingOperand =
  | { kind: "input"; key: string }
  | { kind: "constant"; value: number; unit: string };

type PricingExpression =
  | PricingOperand
  | { kind: "sum"; terms: PricingOperand[] }
  | {
    kind: "multiply";
    factors: PricingOperand[];
    resultUnit: string;
  };

type PricingComponent = {
  key: string;
  label: string;
  description?: string;
  expression: PricingExpression;
};

type ParcelCharacteristicOption = { key: string; label: string; value: number };
type ParcelCharacteristic = {
  key: string;
  label: string;
  required: boolean;
  treatment: "fixed_amount" | "multiplier";
  inputKey: string;
  options: ParcelCharacteristicOption[];
};

type Configuration = {
  schemaVersion: 1;
  configurationName: string;
  serviceCode: ServiceCode;
  pricingModel?: "fixed" | "calculated" | "hybrid";
  inputs: PricingInput[];
  components: PricingComponent[];
  parcelCharacteristics?: ParcelCharacteristic[];
  activityPricing: { schemaVersion: 1; activities: Activity[] };
};
type Version = Omit<Configuration, "activityPricing"> & { activityPricing?: { schemaVersion: 1; activities: Activity[] }; versionId: string; versionNumber: number; createdAt?: unknown; approvalWorkflow?: { state: "draft" | "pending_approval" | "changes_requested" | "approved" | "rejected"; proposerUid?: string; approverUid?: string; reason?: string | null } };
type Summary = {
  definitionId: string;
  currentVersionId: string;
  currentVersionNumber: number;
  currentVersion: Version;
};
type Detail = { definitionId: string; currentVersionId: string; currentVersionNumber: number; publishedVersionId?: string | null; publishedVersionNumber?: number | null; versions: Version[] };

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

const INPUT_SOURCES = [
  ["", "Manual / supplied separately"],
  ["parcel.declared.weight", "Declared parcel weight"],
  ["parcel.actual.weight", "Measured parcel weight"],
  ["parcel.actual.length", "Measured parcel length"],
  ["parcel.actual.width", "Measured parcel width"],
  ["parcel.actual.height", "Measured parcel height"],
  ["route.distance", "Recorded route distance"],
] as const;

function newInput(index: number): PricingInput {
  return {
    key: `input_${index + 1}`,
    label: `Input ${index + 1}`,
    required: true,
    valueType: "number",
    unit: "",
  };
}

function newComponent(index: number): PricingComponent {
  return {
    key: `component_${index + 1}`,
    label: `Component ${index + 1}`,
    expression: { kind: "input", key: "" },
  };
}

function newOperand(): PricingOperand {
  return { kind: "input", key: "" };
}

function newExpression(kind: "input" | "constant" | "sum" | "multiply"): PricingExpression {
  if (kind === "constant") {
    return { kind: "constant", value: 0, unit: "" };
  }

  if (kind === "sum") {
    return { kind: "sum", terms: [newOperand(), newOperand()] };
  }

  if (kind === "multiply") {
    return {
      kind: "multiply",
      factors: [newOperand(), newOperand()],
      resultUnit: "",
    };
  }

  return { kind: "input", key: "" };
}

function emptyConfiguration(serviceCode: ServiceCode = "standard"): Configuration {
  return {
    schemaVersion: 1,
    configurationName: serviceCode[0].toUpperCase() + serviceCode.slice(1) + " activity configuration",
    serviceCode,
    inputs: [],
    components: [],
    parcelCharacteristics: [],
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
    parcelCharacteristics: version.parcelCharacteristics ?? [],
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
  const [pendingDialogAction, setPendingDialogAction] = useState<"request_changes" | "reject" | "publish" | null>(null);
  const selectedVersion = selected
    ? selected.versions.find((version) => version.versionId === selected.currentVersionId)
    ?? selected.versions[selected.versions.length - 1]
    ?? null
    : null;

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
      if (!user) { router.replace("/admin/sign-in"); return; }
      if (!user.emailVerified) {
        router.replace("/admin/verify-email?email=" + encodeURIComponent(user.email ?? ""));
        return;
      }
      try {
        const email = await verifyAdminAccess(user);
        if (!active) return;
        const idToken = await user.getIdToken();
        setEmail(email);
        setToken(idToken);
        setChecking(false);
        void loadDefinitions(idToken);
      } catch (error) {
        if (!active) return;
        if (error instanceof Error && error.name === "NotAdmin") {
          router.replace("/account");
          return;
        }
        router.replace("/admin/sign-in");
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

  async function runApprovalAction(action: "submit" | "approve" | "request_changes" | "reject", reason?: string) {
    if (!selected || !selectedVersion || saving) return;
    if ((action === "request_changes" || action === "reject") && !reason?.trim()) {
      setPendingDialogAction(action);
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        "/api/admin/commercial-pricing-definitions/" + encodeURIComponent(selected.definitionId) + "/workflow",
        { method: "POST", headers: requestHeaders(token), body: JSON.stringify({ versionId: selectedVersion.versionId, action, ...(reason ? { reason } : {}) }) }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to update approval workflow.");
      setNotice("Pricing version status: " + data.state.replaceAll("_", " ") + ".");
      await loadDefinitions(token);
      await loadDetail(selected.definitionId, token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update approval workflow.");
    } finally { setSaving(false); setPendingDialogAction(null); }
  }

  async function publishSelectedVersion() {
    if (!selected || !selectedVersion || saving) return;
    setPendingDialogAction("publish");
  }

  async function confirmPublish() {
    if (!selected || !selectedVersion || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        "/api/admin/commercial-pricing-definitions/" + encodeURIComponent(selected.definitionId) + "/publish",
        { method: "POST", headers: requestHeaders(token), body: JSON.stringify({ versionId: selectedVersion.versionId }) }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to publish pricing version.");
      setNotice("Pricing version " + data.versionNumber + " published.");
      await loadDefinitions(token);
      await loadDetail(selected.definitionId, token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to publish pricing version.");
    } finally { setSaving(false); setPendingDialogAction(null); }
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

  function updateInput(index: number, changes: Partial<PricingInput>) {
    setForm((current) => {
      const previousKey = current.inputs[index]?.key;
      const nextInputs = current.inputs.map((input, itemIndex) =>
        itemIndex === index ? { ...input, ...changes } : input
      );

      const nextKey = nextInputs[index]?.key;

      if (!previousKey || !nextKey || previousKey === nextKey) {
        return { ...current, inputs: nextInputs };
      }

      const updateOperandReference = (
        operand: PricingOperand
      ): PricingOperand => {
        if (operand.kind === "input" && operand.key === previousKey) {
          return { ...operand, key: nextKey };
        }

        return operand;
      };

      const nextComponents = current.components.map((component) => {
        const expression = component.expression;

        if (expression.kind === "input") {
          return {
            ...component,
            expression: expression.key === previousKey
              ? { ...expression, key: nextKey }
              : expression,
          };
        }

        if (expression.kind === "sum") {
          return {
            ...component,
            expression: {
              ...expression,
              terms: expression.terms.map(updateOperandReference),
            },
          };
        }

        if (expression.kind === "multiply") {
          return {
            ...component,
            expression: {
              ...expression,
              factors: expression.factors.map(updateOperandReference),
            },
          };
        }

        return component;
      });

      return {
        ...current,
        inputs: nextInputs,
        components: nextComponents,
        parcelCharacteristics: (current.parcelCharacteristics ?? []).map((category) =>
          category.inputKey === previousKey ? { ...category, inputKey: nextKey } : category
        ),
      };
    });
  }

  function addParcelCharacteristic() {
    setForm((current) => {
      const index = (current.parcelCharacteristics ?? []).length + 1;
      const key = "characteristic_" + index;
      const inputKey = "characteristic_value_" + index;
      const input: PricingInput = {
        key: inputKey, label: "Characteristic " + index, required: false,
        valueType: "number", unit: "", 
      };
      const category: ParcelCharacteristic = {
        key, label: "Characteristic " + index, required: false,
        treatment: "fixed_amount", inputKey,
        options: [{ key: "option_1", label: "Option 1", value: 0 }],
      };
      return {
        ...current,
        inputs: [...current.inputs, input],
        parcelCharacteristics: [...(current.parcelCharacteristics ?? []), category],
      };
    });
  }

  function updateParcelCharacteristic(index: number, changes: Partial<ParcelCharacteristic>) {
    setForm((current) => {
      const categories = [...(current.parcelCharacteristics ?? [])];
      const existing = categories[index];
      if (!existing) return current;
      categories[index] = { ...existing, ...changes };
      const inputs = current.inputs.map((input) => input.key === existing.inputKey
        ? {
            ...input,
            label: categories[index].label,
            required: categories[index].required,
            unit: categories[index].treatment === "multiplier" ? "1" : existing.treatment === "multiplier" ? "" : input.unit,
          }
        : input);
      return { ...current, inputs, parcelCharacteristics: categories };
    });
  }

  function updateCharacteristicOption(categoryIndex: number, optionIndex: number, changes: Partial<ParcelCharacteristicOption>) {
    setForm((current) => ({
      ...current,
      parcelCharacteristics: (current.parcelCharacteristics ?? []).map((category, index) =>
        index !== categoryIndex ? category : {
          ...category,
          options: category.options.map((option, itemIndex) =>
            itemIndex === optionIndex ? { ...option, ...changes } : option
          ),
        }
      ),
    }));
  }

  function updateComponent(index: number, changes: Partial<PricingComponent>) {
    setForm((current) => ({
      ...current,
      components: current.components.map((component, itemIndex) =>
        itemIndex === index ? { ...component, ...changes } : component
      ),
    }));
  }

  function updateOperand(
    componentIndex: number,
    operandIndex: number,
    field: "key" | "value" | "unit",
    value: string
  ) {
    setForm((current) => ({
      ...current,
      components: current.components.map((component, index) => {
        if (index !== componentIndex) return component;

        const expression = component.expression;

        if (expression.kind === "sum") {
          return {
            ...component,
            expression: {
              ...expression,
              terms: expression.terms.map((operand, itemIndex) => {
                if (itemIndex !== operandIndex) return operand;

                if (field === "key" && operand.kind === "input") {
                  return { ...operand, key: value };
                }

                if (field === "value" && operand.kind === "constant") {
                  return { ...operand, value: value === "" ? 0 : Number(value) };
                }

                if (field === "unit" && operand.kind === "constant") {
                  return { ...operand, unit: value };
                }

                return operand;
              }),
            },
          };
        }

        if (expression.kind === "multiply") {
          return {
            ...component,
            expression: {
              ...expression,
              factors: expression.factors.map((operand, itemIndex) => {
                if (itemIndex !== operandIndex) return operand;

                if (field === "key" && operand.kind === "input") {
                  return { ...operand, key: value };
                }

                if (field === "value" && operand.kind === "constant") {
                  return { ...operand, value: value === "" ? 0 : Number(value) };
                }

                if (field === "unit" && operand.kind === "constant") {
                  return { ...operand, unit: value };
                }

                return operand;
              }),
            },
          };
        }

        return component;
      }),
    }));
  }

  async function logout() {
    await logoutAdmin();
    router.replace("/admin/sign-in");
  }

  if (checking) {
    return (
      <main className="vl-workspace">
        <div className="vl-workspace__content">
          <FeedbackState variant="loading" title="Verifying administrator access" description="Confirming your Admin session and commercial permissions." />
        </div>
      </main>
    );
  }

  return (
    <WorkspaceShell
      workspaceName="VeriLyft"
      workspaceLabel="Admin"
      navigation={adminWorkspaceNavigation}
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Commercial pricing" }]}
      topbarContent={
        <div className="vl-workspace__account-actions">
          <span>{email}</span>
          <Button variant="outline" size="sm" onClick={logout}>Sign out</Button>
        </div>
      }
    >
      <div className="admin-page">
      <header className="admin-header">
        <Link href="/" className="admin-logo"><Image src="/logo.svg" width={60} height={20} alt="VeriLyft" priority /></Link>
        <div className="admin-header-right">
          
          
          
          <span className="admin-email">{email}</span>
          <button type="button" className="admin-logout" onClick={logout} aria-label="Sign out"><LogOut size={17} /></button>
        </div>
      </header>
      <div className="admin-shell cost-admin-shell">
        <div className="cost-page-topline">
          <div><span className="section-label">M1 / EXECUTION 6</span><h1>Commercial pricing approval & publication</h1>
            <p>Configure service pricing, submit versions for independent approval, and publish approved versions for controlled quotation use.</p></div>
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
              <input required maxLength={120} value={form.configurationName}
                onChange={(event) => {
                  const serviceCode = event.target.value as ServiceCode;

                  setForm((current) => ({
                    ...current,
                    serviceCode,
                    configurationName:
                      serviceCode[0].toUpperCase() +
                      serviceCode.slice(1) +
                      " activity configuration",
                  }));
                }}
              />
            </label>
            <label className="cost-field">Service
              <select value={form.serviceCode} disabled={!creating} onChange={(event) => setForm(emptyConfiguration(event.target.value as ServiceCode))}>
                <option value="standard">Standard</option><option value="express">Express</option><option value="scheduled">Scheduled</option>
              </select>
            </label>
            <div className="cost-field cost-field-wide">
              <strong>Pricing model</strong>
              <p>
                Select a model only when the component structure supports it.
                The server validates the model against the configured expressions.
              </p>
              <select
                value={form.pricingModel ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pricingModel: event.target.value
                      ? event.target.value as "fixed" | "calculated" | "hybrid"
                      : undefined,
                  }))
                }
              >
                <option value="">Not selected</option>
                <option value="fixed">Fixed</option>
                <option value="calculated">Calculated</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div className="cost-field cost-field-wide">
              <strong>Pricing inputs</strong>
              <p>
                Define numeric inputs used by pricing components. Sources map to
                explicitly recorded parcel or route evidence. Leave the source empty
                when the value is supplied separately.
              </p>
              <button
                type="button"
                className="cost-secondary-button"
                disabled={form.inputs.length >= 100}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    inputs: [...current.inputs, newInput(current.inputs.length)],
                  }))
                }
              >
                Add pricing input
              </button>
            </div>

            {form.inputs.map((input, index) => (
              <div className="cost-field cost-field-wide" key={`${index}-${input.key}`}>
                <strong>Input {index + 1}</strong>
                <div className="cost-form-grid">
                  <label className="cost-field">
                    Stable key
                    <input
                      required
                      value={input.key}
                      onChange={(event) => updateInput(index, { key: event.target.value })}
                    />
                  </label>

                  <label className="cost-field">
                    Label
                    <input
                      required
                      maxLength={120}
                      value={input.label}
                      onChange={(event) => updateInput(index, { label: event.target.value })}
                    />
                  </label>

                  <label className="cost-field">
                    Unit
                    <input
                      required
                      maxLength={80}
                      placeholder="Enter the evidence unit"
                      value={input.unit}
                      onChange={(event) => updateInput(index, { unit: event.target.value })}
                    />
                  </label>

                  <label className="cost-field">
                    Evidence source
                    <select
                      value={input.source ?? ""}
                      onChange={(event) =>
                        updateInput(index, {
                          source: event.target.value || undefined,
                        })
                      }
                    >
                      {INPUT_SOURCES.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="cost-field">
                    <span>
                      <input
                        type="checkbox"
                        checked={input.required}
                        onChange={(event) =>
                          updateInput(index, { required: event.target.checked })
                        }
                      />{" "}
                      Required input
                    </span>
                  </label>

                  <button
                    type="button"
                    className="cost-secondary-button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        inputs: current.inputs.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                  >
                    Remove input
                  </button>
                </div>
              </div>
            ))}

            <div className="cost-field cost-field-wide">
              <strong>Configurable parcel characteristics</strong>
              <p>
                Define customer-selectable handling, size, transport or other parcel classes.
                Each option supplies a configured numeric amount or multiplier to the pricing
                expression through its linked input. No rates are pre-filled by the system.
                Multiplier inputs use unit 1; fixed amounts use the same unit as the component
                they contribute to.
              </p>
              <button type="button" className="cost-secondary-button"
                disabled={(form.parcelCharacteristics ?? []).length >= 30}
                onClick={addParcelCharacteristic}>Add characteristic category</button>
            </div>

            {(form.parcelCharacteristics ?? []).map((category, categoryIndex) => (
              <div className="cost-field cost-field-wide" key={category.key + "-" + categoryIndex}>
                <strong>Characteristic {categoryIndex + 1}</strong>
                <div className="cost-form-grid">
                  <label className="cost-field">Stable key
                    <input required value={category.key}
                      onChange={(event) => updateParcelCharacteristic(categoryIndex, { key: event.target.value })} />
                  </label>
                  <label className="cost-field">Customer-facing label
                    <input required maxLength={120} value={category.label}
                      onChange={(event) => updateParcelCharacteristic(categoryIndex, { label: event.target.value })} />
                  </label>
                  <label className="cost-field">Pricing treatment
                    <select value={category.treatment}
                      onChange={(event) => updateParcelCharacteristic(categoryIndex, {
                        treatment: event.target.value as "fixed_amount" | "multiplier",
                      })}>
                      <option value="fixed_amount">Fixed amount</option>
                      <option value="multiplier">Multiplier</option>
                    </select>
                  </label>
                  <label className="cost-field">
                    <span><input type="checkbox" checked={category.required}
                      onChange={(event) => updateParcelCharacteristic(categoryIndex, { required: event.target.checked })} /> Required customer selection</span>
                  </label>
                  <div className="cost-field cost-field-wide">
                    <strong>Options and configured values</strong>
                    <p>{category.treatment === "multiplier"
                      ? "Enter a dimensionless multiplier (for example, 1.15)."
                      : "Enter a fixed amount in the linked pricing input unit."}</p>
                    {category.options.map((option, optionIndex) => (
                      <div className="cost-form-grid" key={option.key + "-" + optionIndex}>
                        <label className="cost-field">Option key
                          <input required value={option.key}
                            onChange={(event) => updateCharacteristicOption(categoryIndex, optionIndex, { key: event.target.value })} />
                        </label>
                        <label className="cost-field">Option label
                          <input required maxLength={120} value={option.label}
                            onChange={(event) => updateCharacteristicOption(categoryIndex, optionIndex, { label: event.target.value })} />
                        </label>
                        <label className="cost-field">Numeric value
                          <input required type="number" step="any" value={option.value}
                            onChange={(event) => updateCharacteristicOption(categoryIndex, optionIndex, { value: event.target.value === "" ? 0 : Number(event.target.value) })} />
                        </label>
                        <button type="button" className="cost-secondary-button"
                          disabled={category.options.length <= 1}
                          onClick={() => updateParcelCharacteristic(categoryIndex, {
                            options: category.options.filter((_, itemIndex) => itemIndex !== optionIndex),
                          })}>Remove option</button>
                      </div>
                    ))}
                    <button type="button" className="cost-secondary-button"
                      disabled={category.options.length >= 100}
                      onClick={() => updateParcelCharacteristic(categoryIndex, {
                        options: [...category.options, {
                          key: "option_" + (category.options.length + 1),
                          label: "Option " + (category.options.length + 1), value: 0,
                        }],
                      })}>Add option</button>
                  </div>
                  <p className="cost-footer-note">Linked pricing input: {category.inputKey}. Configure its unit in Pricing inputs. Include this input in the relevant component expression for the selection to affect the evaluated amount.</p>
                  <button type="button" className="cost-secondary-button"
                    onClick={() => setForm((current) => ({
                      ...current,
                      parcelCharacteristics: (current.parcelCharacteristics ?? []).filter((_, itemIndex) => itemIndex !== categoryIndex),
                    }))}>Remove characteristic category</button>
                </div>
              </div>
            ))}

            <div className="cost-field cost-field-wide">
              <strong>Pricing components</strong>
              <p>
                Components define the expressions that produce individual pricing
                amounts. Components must produce compatible units before they can
                be totalled by the pricing engine.
              </p>
              <button
                type="button"
                className="cost-secondary-button"
                disabled={form.components.length >= 100}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    components: [
                      ...current.components,
                      newComponent(current.components.length),
                    ],
                  }))
                }
              >
                Add pricing component
              </button>
            </div>

            {form.components.map((component, index) => {
              const expression = component.expression;
              const operands =
                expression.kind === "sum" ? expression.terms :
                  expression.kind === "multiply" ? expression.factors : [];

              return (
                <div className="cost-field cost-field-wide" key={`${index}-${component.key}`}>
                  <strong>Component {index + 1}</strong>

                  <div className="cost-form-grid">
                    <label className="cost-field">
                      Stable key
                      <input
                        required
                        value={component.key}
                        onChange={(event) =>
                          updateComponent(index, { key: event.target.value })
                        }
                      />
                    </label>

                    <label className="cost-field">
                      Label
                      <input
                        required
                        maxLength={120}
                        value={component.label}
                        onChange={(event) =>
                          updateComponent(index, { label: event.target.value })
                        }
                      />
                    </label>

                    <label className="cost-field cost-field-wide">
                      Description
                      <input
                        maxLength={500}
                        value={component.description ?? ""}
                        onChange={(event) =>
                          updateComponent(index, {
                            description: event.target.value || undefined,
                          })
                        }
                      />
                    </label>

                    <label className="cost-field">
                      Expression type
                      <select
                        value={expression.kind}
                        onChange={(event) =>
                          updateComponent(index, {
                            expression: newExpression(
                              event.target.value as "input" | "constant" | "sum" | "multiply"
                            ),
                          })
                        }
                      >
                        <option value="input">Input reference</option>
                        <option value="constant">Constant</option>
                        <option value="sum">Sum</option>
                        <option value="multiply">Multiply</option>
                      </select>
                    </label>

                    {expression.kind === "input" && (
                      <label className="cost-field">
                        Referenced input
                        <select
                          value={expression.key}
                          onChange={(event) =>
                            updateComponent(index, {
                              expression: { kind: "input", key: event.target.value },
                            })
                          }
                        >
                          <option value="">Select input</option>
                          {form.inputs.map((input) => (
                            <option key={input.key} value={input.key}>
                              {input.label} ({input.key})
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {expression.kind === "constant" && (
                      <>
                        <label className="cost-field">
                          Constant value
                          <input
                            type="number"
                            step="any"
                            value={expression.value}
                            onChange={(event) =>
                              updateComponent(index, {
                                expression: {
                                  ...expression,
                                  value: event.target.value === "" ? 0 : Number(event.target.value),
                                },
                              })
                            }
                          />
                        </label>
                        <label className="cost-field">
                          Unit
                          <input
                            required
                            value={expression.unit}
                            onChange={(event) =>
                              updateComponent(index, {
                                expression: { ...expression, unit: event.target.value },
                              })
                            }
                          />
                        </label>
                      </>
                    )}

                    {(expression.kind === "sum" || expression.kind === "multiply") && (
                      <div className="cost-field cost-field-wide">
                        <strong>{expression.kind === "sum" ? "Terms" : "Factors"}</strong>

                        {operands.map((operand, operandIndex) => (
                          <div className="cost-form-grid" key={operandIndex}>
                            <label className="cost-field">
                              Operand type
                              <select
                                value={operand.kind}
                                onChange={(event) => {
                                  const next = operands.map((item, itemIndex) =>
                                    itemIndex !== operandIndex
                                      ? item
                                      : event.target.value === "constant"
                                        ? { kind: "constant" as const, value: 0, unit: "" }
                                        : { kind: "input" as const, key: "" }
                                  );

                                  updateComponent(index, {
                                    expression: expression.kind === "sum"
                                      ? { ...expression, terms: next }
                                      : { ...expression, factors: next },
                                  });
                                }}
                              >
                                <option value="input">Input</option>
                                <option value="constant">Constant</option>
                              </select>
                            </label>

                            {operand.kind === "input" ? (
                              <label className="cost-field">
                                Input
                                <select
                                  value={operand.key}
                                  onChange={(event) =>
                                    updateOperand(index, operandIndex, "key", event.target.value)
                                  }
                                >
                                  <option value="">Select input</option>
                                  {form.inputs.map((input) => (
                                    <option key={input.key} value={input.key}>
                                      {input.label} ({input.key})
                                    </option>
                                  ))}
                                </select>
                              </label>
                            ) : (
                              <>
                                <label className="cost-field">
                                  Value
                                  <input
                                    type="number"
                                    step="any"
                                    value={operand.value}
                                    onChange={(event) =>
                                      updateOperand(index, operandIndex, "value", event.target.value)
                                    }
                                  />
                                </label>
                                <label className="cost-field">
                                  Unit
                                  <input
                                    value={operand.unit}
                                    onChange={(event) =>
                                      updateOperand(index, operandIndex, "unit", event.target.value)
                                    }
                                  />
                                </label>
                              </>
                            )}

                            <button
                              type="button"
                              className="cost-secondary-button"
                              disabled={operands.length <= 2}
                              onClick={() => {
                                const next = operands.filter((_, itemIndex) =>
                                  itemIndex !== operandIndex
                                );

                                updateComponent(index, {
                                  expression: expression.kind === "sum"
                                    ? { ...expression, terms: next }
                                    : { ...expression, factors: next },
                                });
                              }}
                            >
                              Remove operand
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          className="cost-secondary-button"
                          disabled={operands.length >= 50}
                          onClick={() => {
                            const next = [...operands, newOperand()];

                            updateComponent(index, {
                              expression: expression.kind === "sum"
                                ? { ...expression, terms: next }
                                : { ...expression, factors: next },
                            });
                          }}
                        >
                          Add operand
                        </button>

                        {expression.kind === "multiply" && (
                          <label className="cost-field">
                            Result unit
                            <input
                              required
                              value={expression.resultUnit}
                              onChange={(event) =>
                                updateComponent(index, {
                                  expression: {
                                    ...expression,
                                    resultUnit: event.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      className="cost-secondary-button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          components: current.components.filter((_, itemIndex) =>
                            itemIndex !== index
                          ),
                        }))
                      }
                    >
                      Remove component
                    </button>
                  </div>
                </div>
              );
            })}
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
          <p className="cost-footer-note">Saving creates an immutable draft version. It does not approve or publish pricing, establish service eligibility, or permit quotation issuance until all required commercial and operational gates are satisfied.</p>
        </section>}
        {selected && !editing && <section className="cost-panel" style={{ marginTop: 22 }}>
          <div className="cost-panel-heading"><div><span className="section-label">03 / VERSION DETAIL</span><h2>{selectedVersion?.configurationName}</h2></div>
            <button className="cost-primary-button" type="button" disabled={saving || selectedVersion?.approvalWorkflow?.state === "pending_approval"} onClick={() => { if (selectedVersion) setForm(configurationFromVersion(selectedVersion)); setEditing(true); setCreating(false); }}>Revise version</button>
          </div>
          <p>Service: {selectedVersion?.serviceCode} · Version {selected.currentVersionNumber}</p>
          <p className="text-xs text-gray-500">Pricing definition ID: {selected.definitionId}</p>
          <p className="text-xs text-gray-500">Current version ID: {selected.currentVersionId}</p>
          <p>Approval status: <strong>{(selectedVersion?.approvalWorkflow?.state ?? "draft").replaceAll("_", " ")}</strong>
            {selected.publishedVersionId === selectedVersion?.versionId ? " · Published" : ""}</p>
          {selectedVersion?.approvalWorkflow?.reason && <p>Decision reason: {selectedVersion.approvalWorkflow.reason}</p>}
          <div className="cost-form-actions" style={{ flexWrap: "wrap", marginBottom: 18 }}>
            {selectedVersion?.approvalWorkflow?.state === "draft" &&
              <button className="cost-primary-button" type="button" disabled={saving} onClick={() => void runApprovalAction("submit")}>Submit for approval</button>}
            {selectedVersion?.approvalWorkflow?.state === "pending_approval" && <>
              <button className="cost-primary-button" type="button" disabled={saving} onClick={() => void runApprovalAction("approve")}>Approve</button>
              <button className="cost-secondary-button" type="button" disabled={saving} onClick={() => void runApprovalAction("request_changes")}>Request changes</button>
              <button className="cost-secondary-button" type="button" disabled={saving} onClick={() => void runApprovalAction("reject")}>Reject</button>
            </>}
            {selectedVersion?.approvalWorkflow?.state === "approved" && selected.publishedVersionId !== selectedVersion.versionId &&
              <button className="cost-primary-button" type="button" disabled={saving} onClick={() => void publishSelectedVersion()}>Publish approved version</button>}
          </div>
          <p className="cost-footer-note">Approval and publication are separately permission-controlled. The proposer cannot approve their own version. Publication does not override service eligibility or missing commercial terms.</p>
          <div className="cost-field cost-field-wide">
            <strong>Immutable version history</strong>
            <div className="cost-version-list">
              {selected.versions.map((version) => <div className="cost-version-row" key={version.versionId}>
                <strong>Version {version.versionNumber}</strong>
                <span>{(version.approvalWorkflow?.state ?? "draft").replaceAll("_", " ")}</span>
                <small>{selected.publishedVersionId === version.versionId ? "Published version" : version.versionId === selected.currentVersionId ? "Current version" : "Superseded version"} · ID: {version.versionId}</small>
              </div>)}
            </div>
          </div>
          <p>Activity assignments: {(selectedVersion?.activityPricing?.activities ?? []).filter((item) => item.applicability !== "undetermined").length} of 11 decided.</p>
          <div className="cost-version-list">{(selectedVersion?.activityPricing?.activities ?? CATALOGUE.map(([activityCode, activityName]) => ({ activityCode, activityName, applicability: "undetermined" as const, treatment: "undetermined" as const }))).map((item) => <div className="cost-version-row" key={item.activityCode}>
            <strong>{item.activityCode} — {item.activityName}</strong><span>{APPLICABILITY_LABELS[item.applicability]}</span><small>{TREATMENT_LABELS[item.treatment]}</small>
          </div>)}</div>
          <p className="cost-footer-note">Approval and publication are recorded above. Service eligibility and quotation readiness remain separate gates.</p>
        </section>}
      </div>
          <StaffActionDialog
        open={pendingDialogAction !== null}
        title={pendingDialogAction === "publish" ? "Publish approved pricing version?" : pendingDialogAction === "reject" ? "Reject pricing version?" : "Request changes to pricing version?"}
        description={pendingDialogAction === "publish" ? "Only this approved version will become selectable by the quotation service. Publication does not itself issue customer quotations." : pendingDialogAction === "reject" ? "This decision will be recorded against the version and attributed to your account." : "Explain the changes required so the proposer can revise the version."}
        confirmLabel={pendingDialogAction === "publish" ? "Publish version" : pendingDialogAction === "reject" ? "Reject version" : "Request changes"}
        reasonLabel={pendingDialogAction === "reject" ? "Reason for rejection" : pendingDialogAction === "request_changes" ? "Changes required" : undefined}
        reasonRequired={pendingDialogAction !== "publish"}
        danger={pendingDialogAction === "reject"}
        busy={saving}
        onCancel={() => setPendingDialogAction(null)}
        onConfirm={async (reason) => {
          if (pendingDialogAction === "publish") await confirmPublish();
          else if (pendingDialogAction) await runApprovalAction(pendingDialogAction, reason);
        }}
      />
</div>
    </WorkspaceShell>
  );
}
