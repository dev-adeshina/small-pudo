"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

interface ShipmentDraft {
  id: string;
  origin: string;
  destination: string;
  parcelDescription: string;
  status: "draft";
  createdAt?: string | null;
  updatedAt?: string | null;
}

const emptyForm = {
  origin: "",
  destination: "",
  parcelDescription: "",
};

export default function ShipmentDraftsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [drafts, setDrafts] = useState<ShipmentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadDrafts = useCallback(async (currentUser: User) => {
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

      setDrafts(data.drafts ?? []);
    } catch (loadError) {
      setLoadError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load shipment drafts. Please try again."
      );
    } finally {
      setLoading(false);
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
    });

    return () => unsubscribe();
  }, [loadDrafts, router]);


  function startEditing(draft: ShipmentDraft) {
    setEditingId(draft.id);
    setForm({
      origin: draft.origin,
      destination: draft.destination,
      parcelDescription: draft.parcelDescription,
    });
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;

    const wasEditing = editingId !== null;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(
        wasEditing
          ? `/api/account/shipment-booking-drafts/${encodeURIComponent(editingId!)}`
          : "/api/account/shipment-booking-drafts",
        {
          method: wasEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(form),
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

      resetForm();
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

        <section className="customer-panel shipment-form-panel">
          <div className="customer-panel-heading">
            <div>
              <span className="section-label">01 / SHIPMENT DETAILS</span>
              <h2>{editingId ? "Update your draft" : "New shipment draft"}</h2>
              <p className="customer-panel-description">
                The signed-in customer is recorded as the booking party.
                Other party roles are not assumed to be the same person.
              </p>
            </div>
            <Package size={22} />
          </div>

          <form className="shipment-form" onSubmit={handleSubmit}>
            <label>
              <span>Origin</span>
              <input
                value={form.origin}
                onChange={(event) => setForm({ ...form, origin: event.target.value })}
                maxLength={180}
                required
                placeholder="Enter the shipment origin"
              />
            </label>

            <label>
              <span>Destination</span>
              <input
                value={form.destination}
                onChange={(event) => setForm({ ...form, destination: event.target.value })}
                maxLength={180}
                required
                placeholder="Enter the shipment destination"
              />
            </label>

            <label className="shipment-form-wide">
              <span>Parcel description</span>
              <textarea
                value={form.parcelDescription}
                onChange={(event) => setForm({ ...form, parcelDescription: event.target.value })}
                maxLength={1000}
                rows={4}
                required
                placeholder="Describe what you intend to send. Do not include payment details or sensitive identity documents."
              />
              <small>{form.parcelDescription.length}/1,000 characters</small>
            </label>

            <div className="shipment-form-actions shipment-form-wide">
              <button type="submit" className="customer-primary-action" disabled={saving}>
                <Save size={17} />
                {saving ? "Saving..." : editingId ? "Update draft" : "Save draft"}
                <ArrowUpRight size={16} />
              </button>
              {editingId && (
                <button type="button" className="customer-secondary-action" onClick={resetForm}>
                  Cancel editing
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="customer-panel shipment-drafts-panel">
          <div className="customer-panel-heading">
            <div>
              <span className="section-label">02 / SAVED PREPARATIONS</span>
              <h2>Your shipment drafts</h2>
              <p className="customer-panel-description">
                Only drafts belonging to your signed-in account are shown.
              </p>
            </div>
            <MapPin size={22} />
          </div>

          {loading ? (
            <div className="customer-state"><p>Loading your drafts...</p></div>
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
                  </div>
                  <button
                    type="button"
                    className="customer-secondary-action"
                    onClick={() => startEditing(draft)}
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
