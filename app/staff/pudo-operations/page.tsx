"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Location = {
  locationId: string;
  name: string;
  address: string;
  partnerBusinessName: string;
  operationalStatus: string;
};

export default function PudoOperationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, (current) => {
    setUser(current);
    setLoading(false);
  }), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const token = await user!.getIdToken();
        const response = await fetch("/api/staff/pudo-operations", {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load active PUDO locations.");
        if (!cancelled) setLocations(result.locations ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load active PUDO locations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading && !user) return <main className="admin-page"><p>Loading staff session…</p></main>;
  if (!user) return <main className="admin-page"><p>Please sign in through the staff workspace.</p><Link href="/staff/sign-in">Staff sign in</Link></main>;

  return (
    <main className="admin-page">
      <div className="admin-shell cost-admin-shell">
        <header className="admin-header">
          <div>
            <p className="section-label">PUDO OPERATIONS</p>
            <h1 className="cost-page-heading">Availability &amp; capacity</h1>
            <p>Manage operating schedules, temporary closures and declared activity limits for active PUDO locations.</p>
          </div>
          <Link className="admin-action" href="/staff/pudo-locations">PUDO locations</Link>
        </header>
        {error && <p className="cost-feedback" role="alert">{error}</p>}
        {loading && <p>Loading active locations…</p>}
        {!loading && !error && locations.length === 0 && (
          <section className="cost-panel">
            <h2>No operational PUDO locations</h2>
            <p>Only activated locations with active operational status are listed here. Candidate registration, inspection approval or capability configuration alone does not make a location operational.</p>
          </section>
        )}
        {!loading && locations.length > 0 && (
          <section className="cost-panel">
            <div className="cost-table-wrap">
              <table className="cost-table">
                <thead><tr><th>Location</th><th>Partner business</th><th>Address</th><th>Operational status</th><th>Actions</th></tr></thead>
                <tbody>
                  {locations.map((location) => (
                    <tr key={location.locationId}>
                      <td><strong>{location.name}</strong><small>{location.locationId}</small></td>
                      <td>{location.partnerBusinessName || "Not recorded"}</td>
                      <td>{location.address || "Not recorded"}</td>
                      <td><span className="status-badge">{location.operationalStatus}</span></td>
                      <td><Link className="cost-primary-button" href={`/staff/pudo-operations/${encodeURIComponent(location.locationId)}`}>Manage</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
