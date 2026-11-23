"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type CapabilityId = "walk_in_intake" | "parcel_measurement" | "custody_acceptance" | "payment_collection" | "parcel_handover" | "parcel_release";
type Interval = { start: string; end: string };
type Availability = {
  timezone: string; status: "available" | "unavailable"; statusReason: string;
  weeklySchedule: Array<{ dayOfWeek: number; intervals: Interval[] }>;
  exceptions: Array<{ date: string; status: "closed" | "hours"; intervals: Interval[] }>;
};
type Capacity = { capabilityId: CapabilityId; maximum: number; unit: string; basis: "at_a_time" | "per_hour" | "per_day" };
type History = { versionId: string; version: number; reason: string; configuredBy: string; configuredAt?: { _seconds?: number } | string; availability?: Availability; capacity?: Capacity[] };
type Data = {
  location: { locationId: string; name: string; address: string; partnerBusinessName: string; operationalStatus: string };
  capabilities: CapabilityId[]; availability: Availability | null; capacity: Capacity[]; capacityConfigurationStale: boolean; version: number;
  configuredBy?: string | null; reason?: string | null; history: History[];
};
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const OPTIONS: Array<{ id: CapabilityId; label: string }> = [
  { id: "walk_in_intake", label: "Walk-in parcel intake" },
  { id: "parcel_measurement", label: "Parcel measurement" },
  { id: "custody_acceptance", label: "Physical custody acceptance" },
  { id: "payment_collection", label: "Payment collection" },
  { id: "parcel_handover", label: "Parcel handover" },
  { id: "parcel_release", label: "Parcel release / collection" },
];
const EMPTY_WEEK = DAYS.map((_, dayOfWeek) => ({ dayOfWeek, intervals: [] as Interval[] }));
function defaultAvailability(): Availability {
  return { timezone: "", status: "available", statusReason: "", weeklySchedule: EMPTY_WEEK, exceptions: [] };
}
function dateLabel(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "_seconds" in value && typeof value._seconds === "number") {
    return new Date(value._seconds * 1000).toLocaleString();
  }
  return "—";
}
function parseExceptions(value: string): Availability["exceptions"] {
  if (!value.trim()) return [];
  return value.split("\n").map((line) => {
    const [dateRaw, ruleRaw] = line.split("|").map((part) => part.trim());
    if (!dateRaw || !ruleRaw) throw new Error("Each exception must use YYYY-MM-DD | closed or YYYY-MM-DD | HH:mm-HH:mm.");
    if (ruleRaw.toLowerCase() === "closed") return { date: dateRaw, status: "closed" as const, intervals: [] };
    const intervals = ruleRaw.split(",").map((part) => {
      const match = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(part.trim());
      if (!match) throw new Error(`Invalid replacement hours for ${dateRaw}.`);
      return { start: match[1], end: match[2] };
    });
    return { date: dateRaw, status: "hours" as const, intervals };
  });
}
export default function PudoOperationsDetailPage() {
  const params = useParams<{ locationId: string }>();
  const locationId = params.locationId;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Data | null>(null);
  const [availability, setAvailability] = useState<Availability>(defaultAvailability);
  const [capacity, setCapacity] = useState<Record<string, { maximum: string; unit: string; basis: Capacity["basis"] }>>({});
  const [exceptionsText, setExceptionsText] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load(currentUser: User) {
    const token = await currentUser.getIdToken();
    const response = await fetch(`/api/staff/pudo-operations/${encodeURIComponent(locationId)}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load PUDO operations.");
    const next = result as Data;
    setData(next);
    const nextAvailability = next.availability ?? defaultAvailability();
    setAvailability(nextAvailability);
    setExceptionsText(nextAvailability.exceptions.map((item) => item.status === "closed"
      ? `${item.date} | closed`
      : `${item.date} | ${item.intervals.map((range) => `${range.start}-${range.end}`).join(", ")}`).join("\n"));
    const mapped: Record<string, { maximum: string; unit: string; basis: Capacity["basis"] }> = {};
    for (const item of next.capacity ?? []) mapped[item.capabilityId] = {
      maximum: String(item.maximum), unit: item.unit, basis: item.basis,
    };
    setCapacity(mapped);
  }

  useEffect(() => onAuthStateChanged(auth, (current) => {
    setUser(current);
    if (!current) setLoading(false);
  }), []);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true); setError("");
    load(user).catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load PUDO operations."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, locationId]);

  const enabledOptions = useMemo(() => OPTIONS.filter((item) => data?.capabilities.includes(item.id)), [data]);
  function updateDay(dayOfWeek: number, field: "start" | "end", value: string) {
    setAvailability((current) => ({
      ...current,
      weeklySchedule: current.weeklySchedule.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;
        const interval = day.intervals[0] ?? { start: "", end: "" };
        const next = { ...interval, [field]: value };
        return { ...day, intervals: next.start || next.end ? [next] : [] };
      }),
    }));
  }
  async function save() {
    if (!user) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const capacityPayload = enabledOptions.flatMap((item) => {
        const value = capacity[item.id];
        if (!value || !value.maximum.trim()) return [];
        const maximum = Number(value.maximum);
        if (!Number.isFinite(maximum) || maximum <= 0) throw new Error(`Enter a positive capacity for ${item.label}.`);
        return [{ capabilityId: item.id, maximum, unit: value.unit, basis: value.basis }];
      });
      const payload = {
        availability: { ...availability, exceptions: parseExceptions(exceptionsText) },
        capacity: capacityPayload,
        reason,
      };
      const token = await user.getIdToken();
      const response = await fetch(`/api/staff/pudo-operations/${encodeURIComponent(locationId)}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload), cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save PUDO operations.");
      await load(user);
      setReason("");
      setMessage(`Availability and capacity configuration saved as version ${result.version}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save PUDO operations.");
    } finally { setSaving(false); }
  }

  if (loading && !user) return <main className="admin-page"><p>Loading staff session…</p></main>;
  if (!user) return <main className="admin-page"><p>Please sign in through the staff workspace.</p><Link href="/staff/sign-in">Staff sign in</Link></main>;

  return (
    <main className="admin-page">
      <div className="admin-shell cost-admin-shell">
        <header className="admin-header">
          <div><p className="section-label">PUDO OPERATIONS / AVAILABILITY &amp; CAPACITY</p>
            <h1 className="cost-page-heading">{data?.location.name ?? "PUDO location"}</h1>
            <p>{data?.location.address} · {data?.location.partnerBusinessName}</p>
            <p>Operational status: <strong>{data?.location.operationalStatus}</strong> · Configuration version: {data?.version ?? 0}</p>
          </div>
          <Link className="admin-action" href="/staff/pudo-operations">Back to active locations</Link>
        </header>
        {error && <p className="cost-feedback" role="alert">{error}</p>}
        {message && <p className="cost-feedback" role="status">{message}</p>}
        {loading && <p>Loading operational configuration…</p>}
        {!loading && data && (
          <>
            <section className="cost-panel">
              <h2>Availability schedule</h2>
              <p>Set the location's local time zone, normal weekly opening hours and dated exceptions. A temporary unavailable status overrides the weekly schedule.</p>
              <div className="cost-form-grid">
                <div className="cost-field"><label htmlFor="pudo-timezone">Location time zone (IANA)</label>
                  <input id="pudo-timezone" value={availability.timezone} onChange={(e) => setAvailability((v) => ({ ...v, timezone: e.target.value }))} placeholder="e.g. Africa/Lagos" />
                </div>
                <div className="cost-field"><label htmlFor="pudo-availability-status">Availability status</label>
                  <select id="pudo-availability-status" value={availability.status} onChange={(e) => setAvailability((v) => ({ ...v, status: e.target.value as Availability["status"] }))}>
                    <option value="available">Available according to schedule</option><option value="unavailable">Temporarily unavailable</option>
                  </select>
                </div>
                {availability.status === "unavailable" && <div className="cost-field"><label htmlFor="pudo-availability-reason">Unavailability reason</label>
                  <input id="pudo-availability-reason" value={availability.statusReason} onChange={(e) => setAvailability((v) => ({ ...v, statusReason: e.target.value }))} maxLength={500} />
                </div>}
              </div>
              <h3>Weekly operating hours</h3>
              <p>Enter one daily opening interval. Leave both times blank for a closed day. Overnight intervals are not supported; split opening hours across the relevant dates.</p>
              <div className="cost-table-wrap"><table className="cost-table">
                <thead><tr><th>Day</th><th>Opens</th><th>Closes</th></tr></thead>
                <tbody>{DAYS.map((day, index) => {
                  const interval = availability.weeklySchedule.find((item) => item.dayOfWeek === index)?.intervals[0];
                  return <tr key={day}><td>{day}</td><td><input aria-label={`${day} opens`} type="time" value={interval?.start ?? ""} onChange={(e) => updateDay(index, "start", e.target.value)} /></td>
                    <td><input aria-label={`${day} closes`} type="time" value={interval?.end ?? ""} onChange={(e) => updateDay(index, "end", e.target.value)} /></td></tr>;
                })}</tbody>
              </table></div>
              <div className="cost-field"><label htmlFor="pudo-exceptions">Date exceptions (one per line)</label>
                <textarea id="pudo-exceptions" rows={4} value={exceptionsText} onChange={(e) => setExceptionsText(e.target.value)} placeholder={"2026-12-25 | closed\n2026-12-31 | 09:00-13:00"} />
                <small>Format: YYYY-MM-DD | closed, or YYYY-MM-DD | HH:mm-HH:mm. Exceptions replace the normal weekly schedule for that date.</small>
              </div>
            </section>
            <section className="cost-panel">
              <h2>Capacity limits</h2>
              <p>Declare the actual maximum the site can handle for each enabled capability. Enter the real unit and whether the limit applies concurrently, per hour or per day. Blank limits remain unconfigured.</p>
              {data.capacityConfigurationStale && <p className="cost-feedback" role="status">The approved capability configuration has changed since these capacity limits were recorded. Reconfirm the limits and save a new version before relying on them.</p>}
              <div className="cost-table-wrap"><table className="cost-table">
                <thead><tr><th>Enabled activity</th><th>Maximum</th><th>Unit</th><th>Limit basis</th></tr></thead>
                <tbody>{enabledOptions.map((item) => <tr key={item.id}>
                  <td>{item.label}</td>
                  <td><input type="number" min="0" step="any" value={capacity[item.id]?.maximum ?? ""} onChange={(e) => setCapacity((v) => ({ ...v, [item.id]: { maximum: e.target.value, unit: v[item.id]?.unit ?? "", basis: v[item.id]?.basis ?? "at_a_time" } }))} placeholder="Actual limit" /></td>
                  <td><input value={capacity[item.id]?.unit ?? ""} onChange={(e) => setCapacity((v) => ({ ...v, [item.id]: { maximum: v[item.id]?.maximum ?? "", unit: e.target.value, basis: v[item.id]?.basis ?? "at_a_time" } }))} placeholder="e.g. parcels" /></td>
                  <td><select value={capacity[item.id]?.basis ?? "at_a_time"} onChange={(e) => setCapacity((v) => ({ ...v, [item.id]: { maximum: v[item.id]?.maximum ?? "", unit: v[item.id]?.unit ?? "", basis: e.target.value as Capacity["basis"] } }))}>
                    <option value="at_a_time">At a time</option><option value="per_hour">Per hour</option><option value="per_day">Per day</option>
                  </select></td>
                </tr>)}</tbody>
              </table></div>
              <p><strong>Important:</strong> These are declared limits, not live capacity consumption. Live usage must be derived from recorded operational events and physical custody in the shipment-operations phase.</p>
            </section>
            <section className="cost-panel">
              <h2>Save operational configuration</h2>
              <div className="cost-field"><label htmlFor="pudo-operations-reason">Reason for this change</label>
                <textarea id="pudo-operations-reason" rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain the operational basis for this schedule and capacity configuration." />
              </div>
              <button className="cost-primary-button" type="button" onClick={save} disabled={saving || !reason.trim()}>{saving ? "Saving…" : "Save availability & capacity"}</button>
            </section>
            <section className="cost-panel">
              <h2>Configuration history</h2>
              {data.history.length === 0 ? <p>No configuration versions recorded yet.</p> : <div className="cost-table-wrap"><table className="cost-table">
                <thead><tr><th>Version</th><th>Availability</th><th>Capacity limits</th><th>Reason</th><th>Configured by</th><th>Configured at</th></tr></thead>
                <tbody>{data.history.map((item) => <tr key={item.versionId}><td>v{item.version}</td><td>{item.availability?.status ?? "—"}</td><td>{item.capacity?.length ?? 0} activities</td><td>{item.reason}</td><td>{item.configuredBy}</td><td>{dateLabel(item.configuredAt)}</td></tr>)}</tbody>
              </table></div>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
