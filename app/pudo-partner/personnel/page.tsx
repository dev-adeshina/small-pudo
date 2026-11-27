"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Activity, LayoutDashboard, LogOut, MapPin, Pencil, Plus, UserRound, UserX } from "lucide-react";
import { auth } from "@/lib/firebase";
import { WorkspaceShell, type WorkspaceNavigationItem } from "@/components/design-system/WorkspaceShell";
import { PageHeader } from "@/components/design-system/PageHeader";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Button } from "@/components/design-system/Button";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { FeedbackState } from "@/components/design-system/FeedbackState";

type Application = { locationId: string; locationName: string; status: string };
type Personnel = { personnelId: string; name: string; role: string; status: "active" | "inactive" };

const navigation: WorkspaceNavigationItem[] = [
  { label: "Overview", href: "/pudo-partner", section: "WORKSPACE", icon: LayoutDashboard },
  { label: "Personnel", href: "/pudo-partner/personnel", section: "STATION", icon: Activity },
];

export default function PudoPersonnelPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [locationId, setLocationId] = useState("");
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => onAuthStateChanged(auth, current => {
    setUser(current);
    if (!current) { setLoading(false); router.replace("/pudo-partner/sign-in"); }
  }), [router]);

  const requestHeaders = useCallback(async () => {
    if (!user) throw new Error("Please sign in again.");
    return { Authorization: `Bearer ${await user.getIdToken()}` };
  }, [user]);

  const loadPersonnel = useCallback(async (selectedLocationId: string) => {
    if (!user || !selectedLocationId) { setPersonnel([]); return; }
    const response = await fetch(`/api/pudo-partner/personnel?locationId=${encodeURIComponent(selectedLocationId)}`, {
      headers: await requestHeaders(), cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load personnel.");
    setPersonnel(data.personnel ?? []);
  }, [requestHeaders, user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError("");
      try {
        const response = await fetch("/api/pudo-partner/applications", {
          headers: await requestHeaders(), cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load your PUDO locations.");
        const rows: Application[] = data.applications ?? [];
        if (cancelled) return;
        setApplications(rows);
        const first = rows[0]?.locationId ?? "";
        setLocationId(first);
        if (first) await loadPersonnel(first);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load personnel.");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user, requestHeaders, loadPersonnel]);

  const activeCount = useMemo(() => personnel.filter(item => item.status === "active").length, [personnel]);

  async function changeLocation(nextId: string) {
    setLocationId(nextId); setError(""); setNotice("");
    try { await loadPersonnel(nextId); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load personnel."); }
  }

  function beginEdit(item: Personnel) {
    setEditingId(item.personnelId); setName(item.name); setRole(item.role); setNotice(""); setError("");
  }

  function resetForm() { setEditingId(""); setName(""); setRole(""); }

  async function savePersonnel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const headers = { ...(await requestHeaders()), "Content-Type": "application/json" };
      const response = await fetch("/api/pudo-partner/personnel", {
        method: editingId ? "PATCH" : "POST",
        headers,
        body: JSON.stringify({ locationId, ...(editingId ? { personnelId: editingId } : {}), name, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save personnel.");
      resetForm();
      await loadPersonnel(locationId);
      setNotice(editingId ? "Personnel record updated." : "Personnel member registered.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save personnel.");
    } finally { setBusy(false); }
  }

  async function deactivate(item: Personnel) {
    if (!window.confirm(`Deactivate ${item.name}? The record will remain in the station history.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/pudo-partner/personnel", {
        method: "PATCH",
        headers: { ...(await requestHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate", locationId, personnelId: item.personnelId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to deactivate personnel.");
      if (editingId === item.personnelId) resetForm();
      await loadPersonnel(locationId);
      setNotice("Personnel member deactivated. The audit record has been retained.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to deactivate personnel.");
    } finally { setBusy(false); }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try { await signOut(auth); router.replace("/pudo-partner/sign-in"); }
    catch { setError("We could not sign you out. Please try again."); setSigningOut(false); }
  }

  if (loading) return <main className="vl-workspace"><div className="vl-workspace__content"><FeedbackState variant="loading" title="Loading station personnel" description="Checking your partner access and registered locations." /></div></main>;

  return (
    <WorkspaceShell
      workspaceName="VeriLyft"
      workspaceLabel="PUDO PARTNER"
      navigation={navigation}
      topbarContent={<Button variant="outline" size="sm" leadingIcon={<LogOut size={15} />} onClick={handleSignOut} loading={signingOut}>Sign out</Button>}
      breadcrumbs={[{ label: "PUDO workspace", href: "/pudo-partner" }, { label: "Personnel" }]}
    >
      <div className="vl-pudo-dashboard">
        <PageHeader
          eyebrow="Station management"
          title="Personnel"
          description="Register the people who work at your PUDO location and maintain their operational roles."
        />
        {error && <div className="vl-pudo-alert"><FeedbackState variant="error" title="Something needs attention" description={error} /></div>}
        {notice && <p className="vl-pudo-footnote" role="status">{notice}</p>}
        {applications.length === 0 ? (
          <SurfaceCard><FeedbackState variant="empty" title="No PUDO location registered" description="Register a station before adding its personnel." action={<Link className="vl-button vl-button--primary" href="/pudo-partner#locations">Register a location</Link>} /></SurfaceCard>
        ) : (
          <>
            <SurfaceCard>
              <div className="vl-pudo-form">
                <label className="vl-field">
                  <span className="vl-field__label">PUDO location</span>
                  <select className="vl-field__input" value={locationId} onChange={event => void changeLocation(event.target.value)}>
                    {applications.map(item => <option key={item.locationId} value={item.locationId}>{item.locationName || "PUDO location"} — {item.status.replaceAll("_", " ")}</option>)}
                  </select>
                </label>
                <div className="vl-pudo-metric"><span className="vl-pudo-metric__label">Active personnel</span><strong>{activeCount}</strong><span className="vl-pudo-metric__hint">Roster entries for this location</span></div>
              </div>
            </SurfaceCard>

            <div className="vl-pudo-section-heading"><div><span className="vl-page-header__eyebrow">PERSONNEL REGISTER</span><h2>{editingId ? "Update personnel" : "Register personnel"}</h2><p>Use the person's name and the role they perform at this station, such as Station staff or Bike man.</p></div></div>
            <SurfaceCard>
              <form className="vl-pudo-form" onSubmit={savePersonnel}>
                <label className="vl-field"><span className="vl-field__label">Full name</span><input className="vl-field__input" value={name} onChange={event => setName(event.target.value)} required maxLength={120} disabled={busy} /></label>
                <label className="vl-field"><span className="vl-field__label">Operational role</span><input className="vl-field__input" value={role} onChange={event => setRole(event.target.value)} required maxLength={80} placeholder="e.g. Station staff, Bike man" disabled={busy} /></label>
                <div className="vl-pudo-form-actions">
                  <Button type="submit" loading={busy} leadingIcon={editingId ? <Pencil size={16} /> : <Plus size={16} />}>{editingId ? "Save changes" : "Register person"}</Button>
                  {editingId && <Button type="button" variant="secondary" onClick={resetForm} disabled={busy}>Cancel edit</Button>}
                </div>
              </form>
            </SurfaceCard>

            <div className="vl-pudo-section-heading"><div><span className="vl-page-header__eyebrow">CURRENT ROSTER</span><h2>Registered people</h2></div></div>
            <SurfaceCard>
              {personnel.length === 0 ? (
                <FeedbackState variant="empty" title="No personnel registered" description="Add the first person who works at this location." />
              ) : (
                <div className="vl-pudo-location-list">
                  {personnel.map(item => (
                    <article className="vl-pudo-location-row" key={item.personnelId}>
                      <span className="vl-pudo-location-icon"><UserRound size={19} /></span>
                      <div className="vl-pudo-location-copy"><strong>{item.name}</strong><small>{item.role}</small></div>
                      <StatusBadge label={item.status === "active" ? "Active" : "Inactive"} tone={item.status === "active" ? "success" : "neutral"} />
                      {item.status === "active" && <Button size="sm" variant="secondary" leadingIcon={<Pencil size={14} />} onClick={() => beginEdit(item)} disabled={busy}>Edit</Button>}
                      {item.status === "active" && <Button size="sm" variant="outline" leadingIcon={<UserX size={14} />} onClick={() => void deactivate(item)} disabled={busy}>Deactivate</Button>}
                    </article>
                  ))}
                </div>
              )}
            </SurfaceCard>
          </>
        )}
        <p className="vl-pudo-footnote">Personnel records are roster entries only. They do not create login accounts or Admin permissions. The PUDO partner account remains the authenticated actor for actions performed through this portal.</p>
      </div>
    </WorkspaceShell>
  );
}
