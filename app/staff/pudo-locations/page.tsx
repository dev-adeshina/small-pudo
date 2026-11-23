"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { StaffActionDialog } from "@/components/staff/StaffActionDialog";

type Candidate = {
  locationId: string;
  name?: string;
  partnerBusinessName?: string;
  address?: string;
  lifecycle?: "draft" | "submitted" | "active";
  updatedAt?: unknown;
};

function displayDate(value: unknown): string {
  if (!value) return "—";
  if (typeof value === "object" && value !== null && "seconds" in value &&
      typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toLocaleString();
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

const lifecycleLabel = (value: Candidate["lifecycle"]) => ({
  draft: "Draft",
  submitted: "Submitted",
  active: "Active",
}[value ?? "draft"]);

export default function PudoLocationsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<Candidate | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    if (!currentUser) setLoading(false);
  }), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadCandidates() {
      setLoading(true);
      setError("");
      try {
        const token = await user!.getIdToken();
        const result = await fetch("/api/staff/pudo-locations", {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
        });
        const data = await result.json();
        if (!result.ok) throw new Error(data.error || "Unable to load candidates.");
        if (!cancelled) setCandidates(data.candidates ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load candidates.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadCandidates();
    return () => { cancelled = true; };
  }, [user]);

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return candidates.filter((candidate) => {
      const matchesSearch = !query ||
        [candidate.name, candidate.partnerBusinessName, candidate.address, candidate.locationId]
          .some((value) => value?.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || (candidate.lifecycle ?? "draft") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [candidates, search, statusFilter]);

  async function handleWithdraw(candidate: Candidate) {
    if (!user) return;
    setWithdrawingId(candidate.locationId);
    setError("");
    try {
      const token = await user.getIdToken();
      const result = await fetch(
        `/api/staff/pudo-locations/${encodeURIComponent(candidate.locationId)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      );
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || "Unable to withdraw candidate.");
      setCandidates((current) => current.filter((item) => item.locationId !== candidate.locationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to withdraw candidate.");
    } finally {
      setWithdrawingId(null);
    }
  }

  if (!user && loading) return <main className="admin-page"><p>Loading staff session…</p></main>;
  if (!user) return <main className="admin-page"><p>Please sign in through the staff workspace to continue.</p><Link href="/staff/sign-in">Staff sign in</Link></main>;

  return (
    <main className="admin-page">
      <div className="admin-shell cost-admin-shell">
        <header className="admin-header">
          <div>
            <p className="section-label">OPERATIONS / LOCATION REGISTRY</p>
            <h1 className="cost-page-heading">PUDO location candidates</h1>
            <p>Register and maintain proposed PUDO locations. Submission does not make a location operational.</p>
          </div>
          <Link className="btn btn-primary" href="/staff/pudo-locations/new">Register a location</Link>
        </header>

        <section className="cost-panel">
          <div className="cost-page-topline">
            <h2>Registered candidates</h2>
            <span>{filteredCandidates.length} of {candidates.length} records</span>
          </div>
          <div className="cost-form-grid">
            <div className="cost-field">
              <label htmlFor="pudo-candidate-search">Search candidates</label>
              <input id="pudo-candidate-search" type="search" value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, address or candidate ID" />
            </div>
            <div className="cost-field">
              <label htmlFor="pudo-candidate-status">Lifecycle</label>
              <select id="pudo-candidate-status" value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>
          {loading && <p>Loading candidates…</p>}
          {error && <p className="cost-feedback" role="alert">{error}</p>}
          {!loading && !error && filteredCandidates.length === 0 && (
            <p>{candidates.length === 0 ? "No PUDO candidates have been registered yet." : "No candidates match these filters."}</p>
          )}
          {!loading && filteredCandidates.length > 0 && (
            <div className="cost-table-wrap">
              <table className="cost-table">
                <thead><tr><th>Location</th><th>Partner business</th><th>Physical address</th><th>Lifecycle</th><th>Last updated</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredCandidates.map((candidate) => (
                    <tr key={candidate.locationId}>
                      <td><strong>{candidate.name || "Untitled location"}</strong><small>{candidate.locationId}</small></td>
                      <td>{candidate.partnerBusinessName || "Not recorded"}</td>
                      <td>{candidate.address || "Address not provided"}</td>
                      <td><span className="status-badge">{lifecycleLabel(candidate.lifecycle)}</span></td>
                      <td>{displayDate(candidate.updatedAt)}</td>
                      <td>
                        <div className="cost-form-grid">
                          {candidate.lifecycle === "submitted" && <Link className="cost-primary-button" href={`/staff/pudo-verifications/${encodeURIComponent(candidate.locationId)}`}>Inspect</Link>}
                          <Link className="admin-action" href={`/staff/pudo-locations/${encodeURIComponent(candidate.locationId)}`}>View</Link>
                          {candidate.lifecycle !== "active" && <button className="cost-danger-button" type="button"
                            onClick={() => setWithdrawTarget(candidate)} disabled={withdrawingId !== null}>
                            {withdrawingId === candidate.locationId ? "Withdrawing…" : "Withdraw"}
                          </button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      <StaffActionDialog
        open={Boolean(withdrawTarget)}
        title="Withdraw PUDO candidate?"
        description="The candidate will leave the active candidate registry. Its registration, verification and audit history will be retained. Active locations cannot be withdrawn."
        confirmLabel="Withdraw candidate"
        danger
        busy={withdrawingId !== null}
        onCancel={() => setWithdrawTarget(null)}
        onConfirm={async () => {
          if (!withdrawTarget) return;
          await handleWithdraw(withdrawTarget);
          setWithdrawTarget(null);
        }}
      />
    </main>
  );
}
