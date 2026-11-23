"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  candidate?: { name?: string; partnerBusinessName?: string; address?: string; registrationNote?: string; submittedAt?: unknown };
  verification?: { status?: VerificationStatus };
};

const STATUS_LABELS: Record<VerificationStatus, string> = {
  pending_inspection: "Pending inspection",
  inspection_recorded: "Decision required",
  clarification_required: "Clarification required",
  approved_to_activate: "Approved to activate",
  not_approved: "Not approved",
};

function displayDate(value: unknown): string {
  if (!value) return "—";
  if (typeof value === "object" && value !== null && "seconds" in value &&
      typeof value.seconds === "number") return new Date(value.seconds * 1000).toLocaleString();
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function PudoVerificationQueuePage() {
  const [user, setUser] = useState<User | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    if (!currentUser) setLoading(false);
  }), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadQueue() {
      setLoading(true);
      setError("");
      try {
        const token = await user!.getIdToken();
        const response = await fetch("/api/staff/pudo-verifications", {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load verification queue.");
        if (!cancelled) setQueue(data.queue ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load verification queue.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadQueue();
    return () => { cancelled = true; };
  }, [user]);

  const filteredQueue = useMemo(() => {
    const query = search.trim().toLowerCase();
    return queue.filter((item) => {
      const status = item.verification?.status ?? "pending_inspection";
      const matchesSearch = !query ||
        [item.candidate?.name, item.candidate?.partnerBusinessName, item.candidate?.address, item.locationId]
          .some((value) => value?.toLowerCase().includes(query));
      return matchesSearch && (statusFilter === "all" || status === statusFilter);
    });
  }, [queue, search, statusFilter]);

  if (!user && loading) return <main className="admin-page"><p>Loading staff session…</p></main>;
  if (!user) return <main className="admin-page"><p>Please sign in through the staff workspace to continue.</p><Link href="/staff/sign-in">Staff sign in</Link></main>;

  return (
    <main className="admin-page">
      <div className="admin-shell cost-admin-shell">
        <header className="admin-header">
          <div>
            <p className="section-label">OPERATIONS / LOCATION VERIFICATION</p>
            <h1 className="cost-page-heading">PUDO verification queue</h1>
            <p>Inspect submitted PUDO candidates and record evidence-based verification decisions.</p>
          </div>
        </header>
        <section className="cost-panel">
          <div className="cost-page-topline">
            <h2>Awaiting verification</h2>
            <span>{filteredQueue.length} of {queue.length} candidates</span>
          </div>
          <div className="cost-form-grid">
            <div className="cost-field">
              <label htmlFor="pudo-verification-search">Search candidates</label>
              <input id="pudo-verification-search" type="search" value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, address or candidate ID" />
            </div>
            <div className="cost-field">
              <label htmlFor="pudo-verification-status">Verification status</label>
              <select id="pudo-verification-status" value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All pending statuses</option>
                <option value="pending_inspection">Pending inspection</option>
                <option value="inspection_recorded">Decision required</option>
                <option value="clarification_required">Clarification required</option>
              </select>
            </div>
          </div>
          {loading && <p>Loading verification queue…</p>}
          {error && <p className="cost-feedback" role="alert">{error}</p>}
          {!loading && !error && filteredQueue.length === 0 && (
            <p>{queue.length === 0 ? "No submitted candidates are currently awaiting verification." : "No candidates match these filters."}</p>
          )}
          {!loading && filteredQueue.length > 0 && (
            <div className="cost-table-wrap">
              <table className="cost-table">
                <thead><tr><th>Location</th><th>Partner business</th><th>Physical address</th><th>Verification status</th><th>Submitted</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredQueue.map((item) => {
                    const status = item.verification?.status ?? "pending_inspection";
                    return (
                      <tr key={item.locationId}>
                        <td><strong>{item.candidate?.name || "Untitled location"}</strong><small>{item.locationId}</small></td>
                        <td>{item.candidate?.partnerBusinessName || "Not recorded"}</td>
                        <td>{item.candidate?.address || "Address not provided"}</td>
                        <td><span className="status-badge">{STATUS_LABELS[status] ?? status}</span></td>
                        <td>{displayDate(item.candidate?.submittedAt)}</td>
                        <td><Link className="admin-action" href={`/staff/pudo-verifications/${encodeURIComponent(item.locationId)}`}>Open verification</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
