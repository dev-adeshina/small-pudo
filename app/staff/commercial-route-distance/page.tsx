"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, Save } from "lucide-react";
import { auth } from "@/lib/firebase";

type Location = {
  locationId: string;
  name: string;
  address: string;
  geo: { latitude: number; longitude: number } | null;
};

type Method = "straight_line" | "manual" | "road_network";

type Evidence = {
  evidenceId: string;
  originOperationalPointRef: string;
  destinationOperationalPointRef: string;
  distance: { value: number; unit: string };
  method: Method;
  recordedAt: string;
  recordedBy: string;
  source: string;
  measuredOn?: string;
  supportingReference?: string;
  coordinatesUsed?: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    coordinateReferenceSystem: "WGS84";
    calculation: "Haversine";
  };
};

function headers(token: string): HeadersInit {
  return { Authorization: "Bearer " + token, "Content-Type": "application/json" };
}

function methodLabel(method: Method): string {
  if (method === "straight_line") return "Straight-line (Haversine)";
  if (method === "road_network") return "Road-network measurement";
  return "Manual measurement";
}

function formatDistance(value: number, unit: string): string {
  return new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 }).format(value) + " " + unit;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function CommercialRouteDistancePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [method, setMethod] = useState<Method>("straight_line");
  const [distanceValue, setDistanceValue] = useState("");
  const [distanceUnit, setDistanceUnit] = useState("km");
  const [source, setSource] = useState("");
  const [measuredOn, setMeasuredOn] = useState(new Date().toISOString().slice(0, 10));
  const [supportingReference, setSupportingReference] = useState("");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadLocations = useCallback(async (idToken: string) => {
    const response = await fetch("/api/admin/commercial-route-distance/locations", {
      headers: headers(idToken), cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to load active PUDO locations.");
    const next = Array.isArray(data.locations) ? data.locations as Location[] : [];
    setLocations(next);
    setOrigin((current) => current || next[0]?.locationId || "");
    setDestination((current) => current || next.find((item) => item.locationId !== (next[0]?.locationId ?? ""))?.locationId || "");
  }, []);

  const loadEvidence = useCallback(async (idToken: string, from: string, to: string) => {
    if (!from || !to || from === to) {
      setEvidence([]);
      return;
    }
    const query = new URLSearchParams({ origin: from, destination: to });
    const response = await fetch("/api/admin/commercial-route-distance/evidence?" + query.toString(), {
      headers: headers(idToken), cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to load route-distance history.");
    setEvidence(Array.isArray(data.evidence) ? data.evidence as Evidence[] : []);
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
          setError("Complete staff activation before accessing commercial route-distance evidence.");
          setLoading(false);
          setChecking(false);
          return;
        }
        await loadLocations(idToken);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load route-distance workspace.");
      } finally {
        if (active) { setLoading(false); setChecking(false); }
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [loadLocations, router]);

  useEffect(() => {
    if (!token || !origin || !destination || origin === destination) return;
    let active = true;
    const query = new URLSearchParams({ origin, destination });
    void (async () => {
      try {
        const response = await fetch("/api/admin/commercial-route-distance/evidence?" + query.toString(), {
          headers: headers(token),
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load route-distance history.");
        if (active) setEvidence(Array.isArray(data.evidence) ? data.evidence as Evidence[] : []);
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Unable to load route-distance history.");
        }
      }
    })();
    return () => { active = false; };
  }, [token, origin, destination]);

  async function refresh() {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      await loadLocations(token);
      if (origin && destination && origin !== destination) {
        await loadEvidence(token, origin, destination);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to refresh route-distance data.");
    } finally { setLoading(false); }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !origin || !destination) return;
    if (origin === destination) {
      setError("Choose two different PUDO locations.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const body = method === "straight_line"
        ? { originOperationalPointRef: origin, destinationOperationalPointRef: destination, method }
        : {
            originOperationalPointRef: origin,
            destinationOperationalPointRef: destination,
            method,
            distance: { value: Number(distanceValue), unit: distanceUnit },
            source: source.trim(),
            measuredOn,
            ...(supportingReference.trim() ? { supportingReference: supportingReference.trim() } : {}),
          };
      const response = await fetch("/api/admin/commercial-route-distance/evidence", {
        method: "POST", headers: headers(token), body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to record route distance.");
      setNotice("New route-distance evidence recorded. Previous measurements remain in the history.");
      setDistanceValue("");
      setSource("");
      setSupportingReference("");
      setMeasuredOn(new Date().toISOString().slice(0, 10));
      await loadEvidence(token, origin, destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to record route distance.");
    } finally { setSaving(false); }
  }

  async function logout() {
    await signOut(auth);
    router.replace("/staff/sign-in");
  }

  if (checking) return <main className="admin-loading"><span>Checking staff access...</span></main>;

  const selectedOrigin = locations.find((item) => item.locationId === origin);
  const selectedDestination = locations.find((item) => item.locationId === destination);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/" className="admin-logo"><Image src="/logo.svg" width={60} height={20} alt="VeriLyft" priority /></Link>
        <div className="admin-header-right">
          
          <span className="admin-email">{email}</span>
          <button type="button" className="admin-logout" onClick={logout} aria-label="Sign out"><LogOut size={17} /></button>
        </div>
      </header>

      <div className="admin-shell cost-admin-shell">
        <div className="cost-page-topline">
          <div>
            <span className="section-label">M1.5 / DISTANCE AND ROUTE-BASE PRICING</span>
            <h1>Route-distance evidence</h1>
            <p>Record directed distance measurements between active PUDO locations. Evidence is retained as an immutable history and is not an operational dispatch record or a price.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            
            
            
            <button className="cost-secondary-button" type="button" onClick={refresh} disabled={loading}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {error && <div className="cost-alert"><strong>Unable to continue</strong><span>{error}</span></div>}
        {notice && <div className="cost-notice">{notice}</div>}

        <section className="cost-panel">
          <div className="cost-panel-heading">
            <div><span className="section-label">01 / ROUTE SELECTION</span><h2>Choose operational points</h2></div>
          </div>
          {loading ? <p>Loading active PUDO locations...</p> : locations.length < 2 ? (
            <div className="space-y-3">
              <p>
                {locations.length === 0
                  ? "No PUDO locations are currently active. Register a candidate, submit it for physical verification, and complete the separately authorised activation process before recording route distances."
                  : "Only one PUDO location is active. A route requires two different active locations. Register and complete verification and activation for another location before recording route distances."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link className="admin-action" href="/staff/pudo-locations">Open PUDO location registry</Link>
                <Link className="admin-action" href="/staff/pudo-locations/new">Register a PUDO candidate</Link>
                <Link className="admin-action" href="/staff/pudo-verifications">Open verification queue</Link>
              </div>
              <p className="text-sm text-gray-600">
                Registration and submission do not activate a PUDO. Only locations with an approved verification and a completed activation record appear in this route selector.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">Origin PUDO
                <select className="mt-2 w-full rounded-lg border p-3" value={origin} onChange={(event) => { setEvidence([]); setOrigin(event.target.value); }}>
                  {locations.map((location) => <option key={location.locationId} value={location.locationId}>{location.name} — {location.address}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">Destination PUDO
                <select className="mt-2 w-full rounded-lg border p-3" value={destination} onChange={(event) => { setEvidence([]); setDestination(event.target.value); }}>
                  {locations.map((location) => <option key={location.locationId} value={location.locationId} disabled={location.locationId === origin}>{location.name} — {location.address}</option>)}
                </select>
              </label>
            </div>
          )}
          {selectedOrigin && selectedDestination && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <p>Directed route: <strong>{selectedOrigin.name}</strong> → <strong>{selectedDestination.name}</strong>. The reverse direction has its own evidence history.</p>
              <p className="mt-2">{selectedOrigin.address}</p>
              <p>Coordinates: {selectedOrigin.geo ? `${selectedOrigin.geo.latitude}, ${selectedOrigin.geo.longitude} (WGS84)` : "Not registered"}</p>
              <p className="mt-2">{selectedDestination.address}</p>
              <p>Coordinates: {selectedDestination.geo ? `${selectedDestination.geo.latitude}, ${selectedDestination.geo.longitude} (WGS84)` : "Not registered"}</p>
            </div>
          )}
        </section>

        <section className="cost-panel">
          <div className="cost-panel-heading">
            <div><span className="section-label">02 / MEASUREMENT</span><h2>Record a distance measurement</h2></div>
          </div>
          <form onSubmit={save} className="space-y-4">
            <label className="block text-sm font-medium">Measurement method
              <select className="mt-2 w-full rounded-lg border p-3" value={method} onChange={(event) => setMethod(event.target.value as Method)}>
                <option value="straight_line">Straight-line — calculate from registered coordinates</option>
                <option value="manual">Manual — enter a supplied distance</option>
                <option value="road_network">Road network — enter an externally measured distance</option>
              </select>
            </label>
            {method === "straight_line" ? (
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                {selectedOrigin?.geo && selectedDestination?.geo
                  ? "The system calculates Haversine distance in metres from the displayed WGS84 coordinates and preserves those exact coordinates in the evidence record. No road route is inferred."
                  : "Straight-line measurement is unavailable because both selected PUDOs must have valid registered WGS84 coordinates. Choose manual or road-network evidence instead, or correct the location coordinates."}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-sm font-medium">Distance
                  <input className="mt-2 w-full rounded-lg border p-3" type="number" min="0.000001" step="any" required value={distanceValue} onChange={(event) => setDistanceValue(event.target.value)} />
                </label>
                <label className="block text-sm font-medium">Unit
                  <select className="mt-2 w-full rounded-lg border p-3" value={distanceUnit} onChange={(event) => setDistanceUnit(event.target.value)}>
                    <option value="km">Kilometres (km)</option>
                    <option value="m">Metres (m)</option>
                    <option value="mi">Miles (mi)</option>
                  </select>
                </label>
                <label className="block text-sm font-medium">Measurement source
                  <input className="mt-2 w-full rounded-lg border p-3" type="text" maxLength={80} required placeholder={method === "road_network" ? "e.g. named mapping provider / source" : "e.g. supplied measurement"} value={source} onChange={(event) => setSource(event.target.value)} />
                </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium">Measurement date
                    <input className="mt-2 w-full rounded-lg border p-3" type="date" required value={measuredOn} onChange={(event) => setMeasuredOn(event.target.value)} />
                  </label>
                  <label className="block text-sm font-medium">Supporting reference (optional)
                    <input className="mt-2 w-full rounded-lg border p-3" type="text" maxLength={200} placeholder="Document, route ID or measurement reference" value={supportingReference} onChange={(event) => setSupportingReference(event.target.value)} />
                  </label>
                </div>
              </div>
            )}
            <button className="cost-primary-button" type="submit" disabled={saving || !origin || !destination || origin === destination || locations.length < 2 || (method === "straight_line" && (!selectedOrigin?.geo || !selectedDestination?.geo))}>
              <Save size={16} /> {saving ? "Recording..." : "Record immutable evidence"}
            </button>
          </form>
        </section>

        <section className="cost-panel">
          <div className="cost-panel-heading">
            <div><span className="section-label">03 / EVIDENCE HISTORY</span><h2>Measurements for this directed route</h2></div>
          </div>
          {!origin || !destination || origin === destination ? <p>Select two different locations to view evidence.</p> :
            evidence.length === 0 ? <p>No distance evidence has been recorded for this directed route.</p> : (
              <div className="space-y-3">
                {evidence.map((item) => (
                  <article key={item.evidenceId} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <strong>{formatDistance(item.distance.value, item.distance.unit)}</strong>
                        <p className="mt-1 text-sm text-gray-600">{methodLabel(item.method)}</p>
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(item.recordedAt)}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Evidence ID: {item.evidenceId}</p>
                    <p className="mt-2 text-sm">Source: {item.source}</p>
                    {item.measuredOn && <p className="mt-1 text-sm">Measurement date: {formatDate(item.measuredOn + "T00:00:00")}</p>}
                    {item.supportingReference && <p className="mt-1 break-all text-sm">Supporting reference: {item.supportingReference}</p>}
                    {item.coordinatesUsed && <p className="mt-1 text-xs text-gray-500">WGS84 coordinates used: {item.coordinatesUsed.origin.latitude}, {item.coordinatesUsed.origin.longitude} → {item.coordinatesUsed.destination.latitude}, {item.coordinatesUsed.destination.longitude}</p>}
                    <p className="mt-1 text-xs text-gray-500">Recorded by staff identity {item.recordedBy}</p>
                  </article>
                ))}
              </div>
            )}
        </section>

        <p className="pb-8 text-xs text-gray-500">Route-distance evidence supplies a measurement input only. It does not activate a service, define a rate, approve a commercial price, prove a dispatch, or establish parcel custody.</p>
      </div>
    </main>
  );
}
