"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";

type VerificationStatus =
  | "pending_inspection"
  | "inspection_recorded"
  | "clarification_required"
  | "approved_to_activate"
  | "not_approved";

type QueueItem = {
  locationId: string;
  candidate?: {
    name?: string;
    address?: string;
    registrationNote?: string;
  };
  verification?: {
    status?: VerificationStatus;
  };
};

const STATUS_LABELS: Record<VerificationStatus, string> = {
  pending_inspection: "Pending inspection",
  inspection_recorded: "Inspection recorded — decision required",
  clarification_required: "Clarification required",
  approved_to_activate: "Approved to activate",
  not_approved: "Not approved",
};

export default function PudoVerificationQueuePage() {
  const [user, setUser] = useState<User | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadQueue() {
      setLoading(true);
      setError("");

      try {
        const token = await user!.getIdToken();

        const response = await fetch("/api/staff/pudo-verifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load verification queue.");
        }

        if (!cancelled) {
          setQueue(data.queue ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load verification queue.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadQueue();

    return () => {
      cancelled = true;
    };
  }, [user]);

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

  return (
    <main className="admin-page">
      <div className="admin-shell cost-admin-shell">
        <header className="admin-header">
          <div>
            <p className="section-label">OPERATIONS / LOCATION VERIFICATION</p>
            <h1 className="cost-page-heading">PUDO verification queue</h1>
            <p>
              Inspect submitted PUDO candidates and record evidence-based
              verification decisions.
            </p>
          </div>

          <Link className="admin-action" href="/staff/pudo-locations">
            Location registry
          </Link>
        </header>

        <section className="cost-panel">
          <div className="cost-page-topline">
            <h2>Awaiting verification</h2>
            <span>{queue.length} candidates</span>
          </div>

          {loading && <p>Loading verification queue…</p>}

          {error && (
            <p className="cost-feedback" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && queue.length === 0 && (
            <p>No submitted candidates are currently awaiting verification.</p>
          )}

          {!loading && queue.length > 0 && (
            <div className="cost-form-grid">
              {queue.map((item) => {
                const status =
                  item.verification?.status ?? "pending_inspection";

                return (
                  <article className="cost-panel" key={item.locationId}>
                    <div>
                      <h3>{item.candidate?.name || "Untitled location"}</h3>

                      <p>
                        {item.candidate?.address ||
                          "Address not provided"}
                      </p>

                      <p>
                        Verification status:{" "}
                        <strong>
                          {STATUS_LABELS[status] ?? status}
                        </strong>
                      </p>
                    </div>

                    <Link
                      className="admin-action"
                      href={`/staff/pudo-verifications/${encodeURIComponent(item.locationId)}`}
                    >
                      Open verification
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}