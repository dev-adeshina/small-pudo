"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { type User } from "firebase/auth";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Package,
  Save,
  UserRound,
} from "lucide-react";

import { auth } from "@/lib/firebase";
import { signOutCustomer } from "@/lib/customer-auth";

interface PudoLocationOption {
  locationId: string;
  name: string;
  address: string;
}

interface ShipmentDraft {
  id: string;
  origin: string;
  destination: string;
  originPudoLocationId?: string;
  destinationPudoLocationId?: string;
  parcelDescription: string;
  declaredMeasurements?: Partial<Record<"weight" | "length" | "width" | "height", { value: number; unit: string }>>;
  status: "draft";
  createdAt?: string | null;
  updatedAt?: string | null;
}

const MAX_DRAFTS = 50;

const emptyForm = {
  origin: "",
  destination: "",
  originPudoLocationId: "",
  destinationPudoLocationId: "",
  parcelDescription: "",
  weight: "",
  weightUnit: "",
  length: "",
  lengthUnit: "",
  width: "",
  widthUnit: "",
  height: "",
  heightUnit: "",
};

function formatDraftDate(value: string | null | undefined) {
  if (!value) return "Updated date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Updated date unavailable";

  return `Updated ${new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)}`;
}

export default function ShipmentDraftsPage() {
  const router = useRouter();
  const requestId = useRef(0);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [drafts, setDrafts] = useState<ShipmentDraft[]>([]);
  const [pudoLocations, setPudoLocations] = useState<PudoLocationOption[]>([]);
  const [pudoLocationsError, setPudoLocationsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadDrafts = useCallback(async (currentUser: User) => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setLoadError("");

    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/account/shipment-booking-drafts", {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Unable to load shipment drafts. Please try again."
        );
      }

      if (currentRequestId === requestId.current) {
        setDrafts(Array.isArray(data.drafts) ? data.drafts : []);
      }
    } catch (loadError) {
      if (currentRequestId === requestId.current) {
        setLoadError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load shipment drafts. Please try again."
        );
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.replace("/account/sign-in");
        return;
      }

      if (!currentUser.emailVerified) {
        try {
          await signOutCustomer();
        } finally {
          router.replace("/account/sign-in");
        }
        return;
      }

      setUser(currentUser);
      setCheckingAuth(false);
      void loadDrafts(currentUser);
      void (async () => {
        try {
          const idToken = await currentUser.getIdToken();
          const response = await fetch("/api/account/available-pudo-locations", {
            headers: { Authorization: `Bearer ${idToken}` },
            cache: "no-store",
          });
          const data = await response.json().catch(() => null);
          if (!response.ok || !data?.success) {
            throw new Error(data?.error || "Unable to load active PUDO locations.");
          }
          setPudoLocations(Array.isArray(data.locations) ? data.locations : []);
          setPudoLocationsError("");
        } catch (loadError) {
          setPudoLocationsError(loadError instanceof Error ? loadError.message : "Unable to load active PUDO locations.");
        }
      })();
    });

    return () => unsubscribe();
  }, [loadDrafts, router]);

  useEffect(() => {
    return () => {
      requestId.current += 1;
    };
  }, []);

  function startEditing(draft: ShipmentDraft) {
    if (saving) return;

    setEditingId(draft.id);
    setForm({
      origin: draft.origin,
      destination: draft.destination,
      originPudoLocationId: draft.originPudoLocationId ?? "",
      destinationPudoLocationId: draft.destinationPudoLocationId ?? "",
      parcelDescription: draft.parcelDescription,
      weight: draft.declaredMeasurements?.weight ? String(draft.declaredMeasurements.weight.value) : "",
      weightUnit: draft.declaredMeasurements?.weight?.unit ?? "",
      length: draft.declaredMeasurements?.length ? String(draft.declaredMeasurements.length.value) : "",
      lengthUnit: draft.declaredMeasurements?.length?.unit ?? "",
      width: draft.declaredMeasurements?.width ? String(draft.declaredMeasurements.width.value) : "",
      widthUnit: draft.declaredMeasurements?.width?.unit ?? "",
      height: draft.declaredMeasurements?.height ? String(draft.declaredMeasurements.height.value) : "",
      heightUnit: draft.declaredMeasurements?.height?.unit ?? "",
    });
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    if (saving) return;

    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;

    const currentEditingId = editingId;
    const wasEditing = currentEditingId !== null;
    const submittedForm = {
      origin: form.origin,
      destination: form.destination,
      ...(form.originPudoLocationId ? { originPudoLocationId: form.originPudoLocationId } : {}),
      ...(form.destinationPudoLocationId ? { destinationPudoLocationId: form.destinationPudoLocationId } : {}),
      parcelDescription: form.parcelDescription,
      declaredMeasurements: Object.fromEntries(
        (["weight", "length", "width", "height"] as const)
          .filter((name) => form[name] !== "" || form[`${name}Unit`] !== "")
          .map((name) => [name, { value: Number(form[name]), unit: form[`${name}Unit`] }])
      ),
    };

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(
        wasEditing
          ? `/api/account/shipment-booking-drafts/${encodeURIComponent(currentEditingId)}`
          : "/api/account/shipment-booking-drafts",
        {
          method: wasEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(submittedForm),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Unable to save your shipment draft. Please try again."
        );
      }

      setEditingId(null);
      setForm(emptyForm);
      setNotice(
        wasEditing
          ? "Your shipment draft has been updated."
          : "Your shipment draft has been saved."
      );
      await loadDrafts(user);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your shipment draft. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (checkingAuth || !user) {
    return (
      <main className="customer-loading">
        <span>Checking your account...</span>
      </main>
    );
  }

  return (
    <main className="customer-page">
      <header className="customer-header">
        <Link href="/" className="customer-logo" aria-label="VeriLyft home">
          <Image
            src="/logo.svg"
            alt="VeriLyft"
            width={150}
            height={40}
            priority
            style={{ width: "auto", height: "auto" }}
          />
        </Link>
        <div className="customer-header-right">
          <div className="customer-identity">
            <span className="customer-avatar">
              <UserRound size={17} />
            </span>
            <span className="customer-email">{user.email}</span>
          </div>
          <Link href="/account" className="customer-logout" aria-label="My account" title="My account">
            <ArrowLeft size={17} />
          </Link>
        </div>
      </header>

      <div className="customer-shell shipment-shell">
        <div className="shipment-heading">
          <span className="eyebrow">VERILYFT / SHIPMENT BOOKING</span>
          <h1>Prepare a <em>shipment.</em></h1>
          <p>
            Save your shipment details first. A saved draft is not a confirmed
            booking, a quotation, a payment request, or proof that a parcel has
            been handed over.
          </p>
        </div>

        <div className="shipment-policy-note" role="note">
          <strong>Booking preparation only</strong>
          <p>
            Service selection and quotations are not available here until
            eligible services and their approved pricing and handover rules
            are configured. Your draft will not create a payment obligation
            or a custody record.
          </p>
        </div>

        {error && <p className="customer-error" role="alert">{error}</p>}
        {notice && <p className="shipment-success" role="status">{notice}</p>}

        <section className="customer-panel shipment-form-panel" aria-labelledby="shipment-form-heading">
          <div className="customer-panel-heading">
            <div>
              <span className="section-label">01 / SHIPMENT DETAILS</span>
              <h2 id="shipment-form-heading">{editingId ? "Update your draft" : "New shipment draft"}</h2>
              <p className="customer-panel-description">
                The signed-in customer is recorded as the booking party.
                Other party roles are not assumed to be the same person.
              </p>
            </div>
            <Package size={22} />
          </div>

          <form className="shipment-form" onSubmit={handleSubmit} aria-busy={saving}>
            <label>
              <span>Origin</span>
              <input
                value={form.origin}
                onChange={(event) => setForm({ ...form, origin: event.target.value })}
                maxLength={180}
                required
                disabled={saving}
                placeholder="Enter the shipment origin"
              />
              <small>{form.origin.length}/180 characters</small>
            </label>

            <label>
              <span>Destination</span>
              <input
                value={form.destination}
                onChange={(event) => setForm({ ...form, destination: event.target.value })}
                maxLength={180}
                required
                disabled={saving}
                placeholder="Enter the shipment destination"
              />
              <small>{form.destination.length}/180 characters</small>
            </label>

            <label>
              <span>Origin PUDO (optional)</span>
              <select
                value={form.originPudoLocationId}
                onChange={(event) => setForm({ ...form, originPudoLocationId: event.target.value })}
                disabled={saving}
              >
                <option value="">Address / other endpoint</option>
                {pudoLocations.map((location) => (
                  <option key={location.locationId} value={location.locationId}>
                    {location.name} — {location.address}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Destination PUDO (optional)</span>
              <select
                value={form.destinationPudoLocationId}
                onChange={(event) => setForm({ ...form, destinationPudoLocationId: event.target.value })}
                disabled={saving}
              >
                <option value="">Address / other endpoint</option>
                {pudoLocations.map((location) => (
                  <option key={location.locationId} value={location.locationId}>
                    {location.name} — {location.address}
                  </option>
                ))}
              </select>
            </label>
            {pudoLocationsError && (
              <p className="customer-panel-description shipment-form-wide" role="status">
                Active PUDO choices could not be loaded. You can still save address-based draft endpoints.
              </p>
            )}

            <label className="shipment-form-wide">
              <span>Parcel description</span>
              <textarea
                value={form.parcelDescription}
                onChange={(event) => setForm({ ...form, parcelDescription: event.target.value })}
                maxLength={1000}
                rows={4}
                required
                disabled={saving}
                placeholder="Describe what you intend to send. Do not include payment details or sensitive identity documents."
              />
              <small>{form.parcelDescription.length}/1,000 characters</small>
            </label>

            <fieldset className="shipment-form-wide" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend>Declared parcel measurements (optional)</legend>
              <p className="customer-panel-description">Enter only measurements you know. Each value must include its unit; actual intake measurements remain separate.</p>
              <div className="shipment-measurement-grid">
                {(["weight", "length", "width", "height"] as const).map((name) => (
                  <label key={name}>
                    <span>{name[0].toUpperCase() + name.slice(1)}</span>
                    <input
                      type="number"
                      min="0.001"
                      step="any"
                      value={form[name]}
                      onChange={(event) => setForm({ ...form, [name]: event.target.value })}
                      disabled={saving}
                      placeholder="Value"
                    />
                    <input
                      value={form[`${name}Unit`]}
                      onChange={(event) => setForm({ ...form, [`${name}Unit`]: event.target.value })}
                      maxLength={40}
                      disabled={saving}
                      placeholder="Unit (e.g. kg, cm)"
                      aria-label={`${name} unit`}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="shipment-form-actions shipment-form-wide">
              <button type="submit" className="customer-primary-action" disabled={saving}>
                <Save size={17} />
                {saving ? "Saving..." : editingId ? "Update draft" : "Save draft"}
                <ArrowUpRight size={16} />
              </button>
              {editingId && (
                <button
                  type="button"
                  className="customer-secondary-action"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel editing
                </button>
              )}
            </div>
          </form>
        </section>

        <section
          className="customer-panel shipment-drafts-panel"
          aria-labelledby="shipment-drafts-heading"
          aria-busy={loading}
        >
          <div className="customer-panel-heading">
            <div>
              <span className="section-label">02 / SAVED PREPARATIONS</span>
              <h2 id="shipment-drafts-heading">Your shipment drafts</h2>
              <p className="customer-panel-description">
                Only drafts belonging to your signed-in account are shown.
              </p>
              {drafts.length === MAX_DRAFTS && !loading && !loadError && (
                <p className="customer-panel-description">
                  Showing the 50 most recently updated drafts.
                </p>
              )}
            </div>
            <MapPin size={22} />
          </div>

          {loading ? (
            <div className="customer-state" aria-live="polite">
              <p>Loading your drafts...</p>
            </div>
          ) : loadError ? (
            <div className="customer-state" role="alert">
              <p>{loadError}</p>
              <button
                type="button"
                className="customer-secondary-action"
                onClick={() => void loadDrafts(user)}
              >
                Retry loading drafts
              </button>
            </div>
          ) : drafts.length === 0 ? (
            <div className="customer-state">
              <Package size={26} />
              <h3>No shipment drafts yet.</h3>
              <p>Enter your shipment details above and save them to continue later.</p>
            </div>
          ) : (
            <div className="shipment-draft-list">
              {drafts.map((draft) => (
                <article className="shipment-draft-row" key={draft.id}>
                  <div>
                    <span className="shipment-draft-status">DRAFT · NOT CONFIRMED</span>
                    <strong>{draft.origin} <ArrowRight size={14} /> {draft.destination}</strong>
                    <p>{draft.parcelDescription}</p>
                    <small>{formatDraftDate(draft.updatedAt ?? draft.createdAt)}</small>
                  </div>
                  <button
                    type="button"
                    className="customer-secondary-action"
                    onClick={() => startEditing(draft)}
                    disabled={saving}
                  >
                    Edit draft <ArrowUpRight size={15} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <Link href="/account" className="shipment-back-link">
          <ArrowLeft size={16} /> Back to my account
        </Link>
      </div>
    </main>
  );
}
