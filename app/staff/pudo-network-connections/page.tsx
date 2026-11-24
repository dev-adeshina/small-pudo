"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, Save, Network, CheckCircle2, PauseCircle, RotateCcw, XCircle } from "lucide-react";
import { auth } from "@/lib/firebase";

type Location = { locationId: string; name: string; address: string; capabilities: string[] };
type Connection = {
  connectionId: string; originLocationId: string; originName: string;
  destinationLocationId: string; destinationName: string;
  status: "pending_review" | "active" | "rejected" | "suspended" | string;
  version: number; reason: string; proposedBy: string; proposedAt: string | null;
  reviewedBy: string | null; reviewedAt: string | null; reviewReason: string | null;
};
type OperationalConnection = {
  connectionId: string;
  originName: string;
  destinationName: string;
  routeSelectionEligible: boolean;
  exclusionReasons: string[];
  originAvailability: string;
  destinationAvailability: string;
  routeDistanceEvidence: {
    evidenceId: string;
    method: string | null;
    distance: { value: number; unit: string } | null;
    measuredOn: string | null;
    source: string | null;
  } | null;
  capacity: {
    originDeclaredLimits: { capabilityId: string; maximum: number; unit: string; basis: string }[];
    destinationDeclaredLimits: { capabilityId: string; maximum: number; unit: string; basis: string }[];
    originConfigurationStale: boolean;
    destinationConfigurationStale: boolean;
    originConfigured: boolean;
    destinationConfigured: boolean;
    assessment: "declared_limits_only";
    confirmedAvailableCapacity: false;
  };
};
function headers(token: string): HeadersInit { return { Authorization: "Bearer " + token, "Content-Type": "application/json" }; }
function date(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}
function statusLabel(status: string) { return status.replaceAll("_", " "); }

export default function PudoNetworkConnectionsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [operationalConnections, setOperationalConnections] = useState<OperationalConnection[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [reason, setReason] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (idToken: string) => {
    const response = await fetch("/api/staff/pudo-network-connections", {
      headers: headers(idToken), cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to load PUDO network connections.");
    const nextLocations = Array.isArray(data.locations) ? data.locations as Location[] : [];
    setLocations(nextLocations);
    setConnections(Array.isArray(data.connections) ? data.connections as Connection[] : []);
    setOperationalConnections(Array.isArray(data.operationalConnections)
      ? data.operationalConnections as OperationalConnection[] : []);
    const initialOrigin = origin || nextLocations.find(item => item.capabilities.includes("parcel_handover"))?.locationId || "";
    setOrigin(current => current || initialOrigin);
    setDestination(current => current || nextLocations.find(item => item.capabilities.includes("custody_acceptance") && item.locationId !== initialOrigin)?.locationId || "");
  }, []);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!active) return;
      if (!user) { router.replace("/staff/sign-in"); return; }
      if (!user.emailVerified) { router.replace("/admin/verify-email?email=" + encodeURIComponent(user.email ?? "")); return; }
      try {
        const idToken = await user.getIdToken();
        if (!active) return;
        setEmail(user.email ?? "");
        setToken(idToken);
        const activationResponse = await fetch("/api/staff/invitations/activate", {
          headers: { Authorization: "Bearer " + idToken }, cache: "no-store",
        });
        const activation = await activationResponse.json();
        if (activationResponse.ok && ["pending", "expired"].includes(activation.status)) {
          throw new Error("Complete staff activation before accessing PUDO network connections.");
        }
        await load(idToken);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load PUDO network workspace.");
      } finally {
        if (active) { setLoading(false); setChecking(false); }
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [load, router]);

  async function refresh() {
    if (!token) return;
    setLoading(true); setError(""); setNotice("");
    try { await load(token); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to refresh PUDO network connections."); }
    finally { setLoading(false); }
  }

  async function propose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/staff/pudo-network-connections", {
        method: "POST", headers: headers(token),
        body: JSON.stringify({ originLocationId: origin, destinationLocationId: destination, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to propose network connection.");
      setReason("");
      setNotice("Directed parcel-transfer connection submitted for separate review.");
      await load(token);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to propose network connection."); }
    finally { setSaving(false); }
  }

  async function decide(connection: Connection, decision: "approve" | "reject" | "suspend" | "reactivate") {
    if (!token) return;
    if (!decisionReason.trim()) { setError("Enter a reason before recording a network decision."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/staff/pudo-network-connections/" + encodeURIComponent(connection.connectionId), {
        method: "PATCH", headers: headers(token),
        body: JSON.stringify({ decision, reason: decisionReason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to record network decision.");
      setDecisionReason("");
      setNotice("Network connection " + statusLabel(data.status) + ". A new immutable version and audit event were recorded.");
      await load(token);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to record network decision."); }
    finally { setSaving(false); }
  }

  async function logout() { await signOut(auth); router.replace("/staff/sign-in"); }
  if (checking) return <main className="admin-loading"><span>Checking staff access...</span></main>;

  const origins = locations.filter(item => item.capabilities.includes("parcel_handover"));
  const destinations = locations.filter(item => item.capabilities.includes("custody_acceptance"));
  const selectedOrigin = locations.find(item => item.locationId === origin);
  const selectedDestination = locations.find(item => item.locationId === destination);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/" className="admin-logo"><Image src="/logo.svg" width={60} height={20} alt="VeriLyft" priority /></Link>
        <div className="admin-header-right"><span className="admin-email">{email}</span><button type="button" className="admin-logout" onClick={logout} aria-label="Sign out"><LogOut size={17} /></button></div>
      </header>
      <div className="admin-shell cost-admin-shell">
        <div className="cost-page-topline">
          <div><span className="section-label">PUDO NETWORK / EXECUTION 5</span><h1>Network connections</h1>
            <p>Manage directed parcel-transfer relationships between verified, active PUDO locations. A connection is not a dispatch, booking or custody event.</p>
          </div>
          <button className="cost-secondary-button" type="button" onClick={refresh} disabled={loading}><RefreshCw size={16} /> Refresh</button>
        </div>
        {error && <div className="cost-alert"><strong>Unable to continue</strong><span>{error}</span></div>}
        {notice && <div className="cost-notice">{notice}</div>}

        <section className="cost-panel">
          <div className="cost-panel-heading"><div><span className="section-label">01 / PROPOSE CONNECTION</span><h2>Connect two operational PUDOs</h2></div></div>
          <p className="mb-4 text-sm text-gray-600">The origin must have approved parcel handover capability. The destination must have approved physical custody acceptance capability. Both locations must remain activated and Operations-approved. Each direction is managed separately.</p>
          {loading ? <p>Loading eligible locations...</p> : origins.length === 0 || destinations.length === 0 ? (
            <p>No eligible origin or destination locations are currently available. A location must be activated, Operations-approved and have the corresponding approved capability.</p>
          ) : (
            <form onSubmit={propose} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium">Origin — parcel handover
                  <select className="mt-2 w-full rounded-lg border p-3" value={origin} onChange={event => setOrigin(event.target.value)} required>
                    <option value="">Select origin</option>{origins.map(item => <option key={item.locationId} value={item.locationId}>{item.name} — {item.address}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium">Destination — physical custody acceptance
                  <select className="mt-2 w-full rounded-lg border p-3" value={destination} onChange={event => setDestination(event.target.value)} required>
                    <option value="">Select destination</option>{destinations.filter(item => item.locationId !== origin).map(item => <option key={item.locationId} value={item.locationId}>{item.name} — {item.address}</option>)}
                  </select>
                </label>
              </div>
              {selectedOrigin && selectedDestination && <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">Directed relationship: <strong>{selectedOrigin.name}</strong> → <strong>{selectedDestination.name}</strong>. Reverse direction requires its own proposal and capability checks.</p>}
              <label className="block text-sm font-medium">Reason for proposing this connection
                <textarea className="mt-2 w-full rounded-lg border p-3" rows={3} maxLength={1000} required value={reason} onChange={event => setReason(event.target.value)} placeholder="Describe the operational basis for connecting these locations." />
              </label>
              <button className="cost-primary-button" type="submit" disabled={saving || !origin || !destination || origin === destination}><Save size={16} /> {saving ? "Submitting..." : "Submit connection for review"}</button>
            </form>
          )}
        </section>

        <section className="cost-panel">
          <div className="cost-panel-heading"><div><span className="section-label">02 / NETWORK REGISTER</span><h2>Directed PUDO relationships</h2></div></div>
          {loading ? <p>Loading network register...</p> : connections.length === 0 ? <p>No network connections have been proposed.</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600"><tr>
                  <th className="px-3 py-3">Origin → destination</th><th className="px-3 py-3">Relationship</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Version</th><th className="px-3 py-3">Proposed</th><th className="px-3 py-3">Reviewed</th><th className="px-3 py-3">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {connections.map(connection => <tr key={connection.connectionId}>
                    <td className="px-3 py-3"><strong>{connection.originName}</strong><span className="block text-xs text-gray-500">→ {connection.destinationName}</span><span className="block text-xs text-gray-400">{connection.originLocationId} → {connection.destinationLocationId}</span></td>
                    <td className="px-3 py-3">Parcel transfer<span className="block text-xs text-gray-500">Handover → custody acceptance</span></td>
                    <td className="px-3 py-3"><span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{statusLabel(connection.status)}</span></td>
                    <td className="px-3 py-3">v{connection.version}</td>
                    <td className="px-3 py-3">{date(connection.proposedAt)}<span className="block text-xs text-gray-500">{connection.proposedBy}</span></td>
                    <td className="px-3 py-3">{date(connection.reviewedAt)}<span className="block text-xs text-gray-500">{connection.reviewedBy ?? "Not reviewed"}</span>{connection.reviewReason && <span className="block text-xs text-gray-500">{connection.reviewReason}</span>}</td>
                    <td className="px-3 py-3"><div className="flex flex-wrap gap-2">
                      {connection.status === "pending_review" && <>
                        <button type="button" className="admin-action" disabled={saving} onClick={() => void decide(connection, "approve")}><CheckCircle2 size={14} /> Approve</button>
                        <button type="button" className="admin-action" disabled={saving} onClick={() => void decide(connection, "reject")}><XCircle size={14} /> Reject</button>
                      </>}
                      {connection.status === "active" && <button type="button" className="admin-action" disabled={saving} onClick={() => void decide(connection, "suspend")}><PauseCircle size={14} /> Suspend</button>}
                      {connection.status === "suspended" && <button type="button" className="admin-action" disabled={saving} onClick={() => void decide(connection, "reactivate")}><RotateCcw size={14} /> Reactivate</button>}
                      {["rejected","suspended"].includes(connection.status) && <span className="text-xs text-gray-500">No live transfer route</span>}
                    </div></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
          <label className="mt-5 block text-sm font-medium">Decision reason (required for approve, reject, suspend or reactivate)
            <textarea className="mt-2 w-full rounded-lg border p-3" rows={2} maxLength={1000} value={decisionReason} onChange={event => setDecisionReason(event.target.value)} placeholder="Enter the reason before choosing a decision." />
          </label>
        </section>
        <section className="cost-panel">
          <div className="cost-panel-heading"><div><span className="section-label">03 / LIVE OPERATIONAL ELIGIBILITY</span><h2>Connections available for route selection</h2></div></div>
          <p className="mb-4 text-sm text-gray-600">
            This is a live eligibility assessment, not a booking or capacity reservation. It rechecks both PUDOs,
            their required capabilities, current opening state and approved road-route distance evidence.
          </p>
          <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            Need another staff member to review a recorded route measurement? <Link className="font-semibold underline" href="/staff/commercial-quotation-readiness#route-evidence-review">Open the route-distance evidence review queue</Link>. Reviewers need the separate <code>commercial_route_distance.approve</code> permission; the recorder cannot approve their own evidence.
          </p>
          {loading ? <p>Checking current network eligibility...</p> : operationalConnections.length === 0 ? (
            <p>No approved active network connections are available for operational assessment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600"><tr>
                  <th className="px-3 py-3">Directed connection</th>
                  <th className="px-3 py-3">Current eligibility</th>
                  <th className="px-3 py-3">Availability</th>
                  <th className="px-3 py-3">Approved road distance</th>
                  <th className="px-3 py-3">Capacity evidence</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {operationalConnections.map(item => <tr key={item.connectionId}>
                    <td className="px-3 py-3"><strong>{item.originName}</strong><span className="block text-xs text-gray-500">→ {item.destinationName}</span></td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{item.routeSelectionEligible ? "Route eligible now" : "Not eligible now"}</span>
                      {item.exclusionReasons.length > 0 && <ul className="mt-2 list-disc pl-4 text-xs text-gray-600">{item.exclusionReasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}
                    </td>
                    <td className="px-3 py-3 text-xs">Origin: {statusLabel(item.originAvailability)}<span className="block">Destination: {statusLabel(item.destinationAvailability)}</span></td>
                    <td className="px-3 py-3 text-xs">
                      {item.routeDistanceEvidence
                        ? <><strong>{item.routeDistanceEvidence.distance ? item.routeDistanceEvidence.distance.value + " " + item.routeDistanceEvidence.distance.unit : "Distance recorded"}</strong><span className="block">{item.routeDistanceEvidence.method ?? "—"} · measured {item.routeDistanceEvidence.measuredOn ?? "date unavailable"}</span><span className="block text-gray-500">{item.routeDistanceEvidence.source ?? ""}</span></>
                        : "No currently valid approved road-route evidence"}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <strong>Declared limits only</strong>
                      <span className="block">Origin: {item.capacity.originConfigured ? item.capacity.originDeclaredLimits.length + " limit(s)" : "Not configured"}</span>
                      <span className="block">Destination: {item.capacity.destinationConfigured ? item.capacity.destinationDeclaredLimits.length + " limit(s)" : "Not configured"}</span>
                      {(item.capacity.originConfigurationStale || item.capacity.destinationConfigurationStale) && <span className="block text-amber-700">Configuration requires reconfirmation</span>}
                      <span className="block text-gray-500">Live available capacity is not confirmed.</span>
                    </td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <div className="cost-notice"><Network size={16} /><span>Only an approved connection is an active network relationship. It does not reserve capacity, create a shipment, prove a dispatch, or transfer custody. Physical custody remains recorded only by the appropriate operational event.</span></div>
      </div>
    </main>
  );
}
