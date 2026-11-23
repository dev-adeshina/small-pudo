"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Compass, MapPin, LocateFixed, ExternalLink } from "lucide-react";

type CapabilityId =
  | "walk_in_intake" | "parcel_measurement" | "custody_acceptance"
  | "payment_collection" | "parcel_handover" | "parcel_release";
type AvailabilityState =
  | "not_configured" | "temporarily_unavailable" | "open_now" | "closed_now";
type Location = {
  locationId: string;
  name: string;
  partnerBusinessName: string;
  address: string;
  operationalStatus: "active";
  geo: {
    latitude: number;
    longitude: number;
    captureMethod: "device" | "manual" | null;
    accuracyMeters: number | null;
  } | null;
  capabilities: CapabilityId[];
  availabilityState: AvailabilityState;
  availabilityConfigured: boolean;
  capacity: Array<{ capabilityId: CapabilityId; maximum: number; unit: string; basis: string }>;
  capacityConfigurationStale: boolean;
  configurationVersion: number;
};
type Position = { latitude: number; longitude: number };
const CAPABILITIES: Array<{ id: CapabilityId; label: string }> = [
  { id: "walk_in_intake", label: "Walk-in parcel intake" },
  { id: "parcel_measurement", label: "Parcel measurement" },
  { id: "custody_acceptance", label: "Physical custody acceptance" },
  { id: "payment_collection", label: "Payment collection" },
  { id: "parcel_handover", label: "Parcel handover" },
  { id: "parcel_release", label: "Parcel release / collection" },
];
const AVAILABILITY_LABEL: Record<AvailabilityState, string> = {
  not_configured: "Hours not configured",
  temporarily_unavailable: "Temporarily unavailable",
  open_now: "Open now",
  closed_now: "Closed now",
};
function distanceKm(from: Position, to: Position): number {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(to.latitude - from.latitude);
  const dLon = radians(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) *
    Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export default function PudoDirectoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [capability, setCapability] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [position, setPosition] = useState<Position | null>(null);
  const [radius, setRadius] = useState("all");
  const [locating, setLocating] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (current) => {
    setUser(current);
    if (!current) setLoading(false);
  }), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/staff/pudo-directory", {
          headers: { Authorization: `Bearer ${await user!.getIdToken()}` },
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load the operational directory.");
        if (!cancelled) setLocations(result.locations ?? []);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load the operational directory.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [user]);

  function locateMe() {
    setError("");
    if (!navigator.geolocation) {
      setError("Device location is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({ latitude: result.coords.latitude, longitude: result.coords.longitude });
        setRadius("25");
        setLocating(false);
      },
      (cause) => {
        setError(`Unable to obtain your location: ${cause.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const results = locations.flatMap((location) => {
      const matchesText = !query ||
        [location.name, location.partnerBusinessName, location.address, location.locationId]
          .some((value) => value.toLowerCase().includes(query));
      const matchesCapability = capability === "all" || location.capabilities.includes(capability as CapabilityId);
      const matchesAvailability = availability === "all" || location.availabilityState === availability;
      if (!matchesText || !matchesCapability || !matchesAvailability) return [];
      const distance = position && location.geo
        ? distanceKm(position, location.geo) : null;
      if (position && radius !== "all" && (distance === null || distance > Number(radius))) return [];
      return [{ ...location, distance }];
    });
    return results.sort((a, b) => {
      if (position) {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      }
      return a.name.localeCompare(b.name);
    });
  }, [locations, search, capability, availability, position, radius]);

  if (loading && !user) return <main className="admin-page"><p>Loading staff session…</p></main>;
  if (!user) return <main className="admin-page"><p>Please sign in through the staff workspace.</p><Link href="/staff/sign-in">Staff sign in</Link></main>;

  return (
    <main className="admin-page">
      <div className="admin-shell cost-admin-shell">
        <header className="admin-header">
          <div>
            <p className="section-label">PUDO OPERATIONS / NETWORK DISCOVERY</p>
            <h1 className="cost-page-heading">Operational PUDO directory</h1>
            <p>Find activated, verified and operationally active locations by area, approved capability and current schedule status.</p>
          </div>
          <Link className="admin-action" href="/staff/pudo-locations">PUDO registry</Link>
        </header>

        <section className="cost-panel">
          <div className="cost-panel-heading">
            <div><span className="section-label">GEOGRAPHIC DISCOVERY</span><h2><Compass size={20} /> Find operational locations</h2></div>
            <button className="cost-secondary-button" type="button" onClick={locateMe} disabled={locating}>
              <LocateFixed size={16} /> {locating ? "Locating…" : position ? "Refresh my location" : "Use my device location"}
            </button>
          </div>
          <p>Device location is requested only when you choose the button. It is used in this browser session to calculate approximate straight-line distances; it is not saved.</p>
          {position && <p role="status">Nearby search is using your device location. Distances are approximate straight-line distances, not road distances.</p>}
          <div className="cost-form-grid">
            <label className="cost-field">Search name, business or address
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Enter a location, partner or area" />
            </label>
            <label className="cost-field">Approved capability
              <select value={capability} onChange={(event) => setCapability(event.target.value)}>
                <option value="all">All capabilities</option>
                {CAPABILITIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="cost-field">Current schedule status
              <select value={availability} onChange={(event) => setAvailability(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="open_now">Open now</option>
                <option value="closed_now">Closed now</option>
                <option value="temporarily_unavailable">Temporarily unavailable</option>
                <option value="not_configured">Hours not configured</option>
              </select>
            </label>
            {position && <label className="cost-field">Search radius
              <select value={radius} onChange={(event) => setRadius(event.target.value)}>
                <option value="all">Any distance</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
                <option value="50">Within 50 km</option>
                <option value="100">Within 100 km</option>
              </select>
            </label>}
          </div>
          {position && <button type="button" className="admin-action" onClick={() => { setPosition(null); setRadius("all"); }}>Clear nearby location</button>}
        </section>

        {error && <p className="cost-feedback" role="alert">{error}</p>}
        {loading && <p>Loading operational PUDO locations…</p>}
        {!loading && !error && locations.length === 0 && (
          <section className="cost-panel">
            <h2>No operational PUDO locations</h2>
            <p>Only locations with an active activation record, Operations verification approval and at least one approved capability appear here. Candidate records are not discoverable as operational locations.</p>
          </section>
        )}
        {!loading && !error && locations.length > 0 && (
          <section className="cost-panel">
            <div className="cost-page-topline"><h2>Operational network</h2><span>{filtered.length} of {locations.length} locations</span></div>
            {filtered.length === 0 ? <p>No operational locations match the selected filters. Locations without coordinates cannot appear in a radius-limited search.</p> : (
              <div className="cost-table-wrap">
                <table className="cost-table">
                  <thead><tr><th>Location</th><th>Address</th><th>Capabilities</th><th>Current availability</th><th>Declared limits</th>{position && <th>Distance</th>}<th>Map</th></tr></thead>
                  <tbody>{filtered.map((location) => (
                    <tr key={location.locationId}>
                      <td><strong>{location.name}</strong><small>{location.partnerBusinessName || "Partner business not recorded"}</small><small>{location.locationId}</small></td>
                      <td>{location.address || "Address not recorded"}{location.geo && <small>{location.geo.latitude.toFixed(5)}, {location.geo.longitude.toFixed(5)} · {location.geo.captureMethod ?? "method not recorded"}{location.geo.accuracyMeters !== null ? ` · ±${Math.round(location.geo.accuracyMeters)} m` : ""}</small>}{!location.geo && <small>Coordinates not recorded</small>}</td>
                      <td>{location.capabilities.map((id) => CAPABILITIES.find((item) => item.id === id)?.label ?? id).join(", ")}</td>
                      <td><span className="status-badge">{AVAILABILITY_LABEL[location.availabilityState]}</span></td>
                      <td>{location.capacityConfigurationStale ? "Needs reconfirmation" : `${location.capacity.length} declared limits`}<small>Not live capacity consumption</small></td>
                      {position && <td>{location.distance === null ? "Distance unavailable" : `${location.distance.toFixed(1)} km`}</td>}
                      <td>{location.geo ? <a className="cost-primary-button" href={`https://www.google.com/maps/search/?api=1&query=${location.geo.latitude},${location.geo.longitude}`} target="_blank" rel="noreferrer"><MapPin size={14} /> Map <ExternalLink size={13} /></a> : "Unavailable"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        )}
        <section className="cost-boundary-note">
          <MapPin size={20} />
          <div><strong>Discovery is not a booking or capacity confirmation</strong><p>Availability reflects the configured local schedule at the time this directory was retrieved. Declared capacity limits are not live utilization. This directory does not establish shipment eligibility, reserve a location or confirm that a service can be booked.</p></div>
        </section>
      </div>
    </main>
  );
}
