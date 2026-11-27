"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Activity, ClipboardList, Package, Camera, Bike, CalendarClock, MapPin, Plus, LogOut, LayoutDashboard } from "lucide-react";
import { auth } from "@/lib/firebase";
import { WorkspaceShell, type WorkspaceNavigationItem } from "@/components/design-system/WorkspaceShell";
import { PageHeader } from "@/components/design-system/PageHeader";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Button } from "@/components/design-system/Button";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { FeedbackState } from "@/components/design-system/FeedbackState";

type PartnerProfile = { businessName: string; contactName: string; email: string };
type Application = { locationId: string; locationName: string; status: string; createdAt?: unknown };

const navigation: WorkspaceNavigationItem[] = [
  { label: "Overview", href: "/pudo-partner#overview", section: "WORKSPACE", icon: LayoutDashboard },
  { label: "Shipments", href: "/pudo-partner#shipments", section: "OPERATIONS", icon: Package },
  { label: "Parcel intake", href: "/pudo-partner#intake", section: "OPERATIONS", icon: Camera },
  { label: "Door pickup", href: "/pudo-partner#door-pickup", section: "OPERATIONS", icon: Bike },
  { label: "Personnel", href: "/pudo-partner#personnel", section: "STATION", icon: Activity },
  { label: "Assignments", href: "/pudo-partner#assignments", section: "STATION", icon: CalendarClock },
  { label: "Station profile", href: "/pudo-partner#locations", section: "STATION", icon: MapPin },
];

const statusLabel = (status: string) => ({
  submitted: "Submitted — awaiting review",
  pending_inspection: "Awaiting physical inspection",
  inspection_recorded: "Inspection recorded",
  clarification_required: "Clarification requested",
  approved_to_activate: "Approved to proceed to activation",
  not_approved: "Not approved",
}[status] ?? status.replaceAll("_", " "));

function statusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  if (status === "approved_to_activate") return "success";
  if (status === "not_approved") return "danger";
  if (status === "clarification_required") return "warning";
  if (status === "submitted" || status === "pending_inspection") return "info";
  return "neutral";
}

export default function PudoPartnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => onAuthStateChanged(auth, current => {
    setUser(current);
    if (!current) { setLoading(false); router.replace("/pudo-partner/sign-in"); }
  }), [router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [accountResponse, applicationsResponse] = await Promise.all([
          fetch("/api/pudo-partner/account", { headers, cache: "no-store" }),
          fetch("/api/pudo-partner/applications", { headers, cache: "no-store" }),
        ]);
        const accountData = await accountResponse.json();
        const applicationsData = await applicationsResponse.json();
        if (!accountResponse.ok) throw new Error(accountData.error || "Unable to load partner account.");
        if (!applicationsResponse.ok) throw new Error(applicationsData.error || "Unable to load applications.");
        if (!cancelled) { setProfile(accountData.profile); setApplications(applicationsData.applications ?? []); }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load partner workspace.");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user, reloadKey]);

  const awaitingReview = useMemo(() => applications.filter(item =>
    ["submitted", "pending_inspection", "inspection_recorded", "clarification_required"].includes(item.status)
  ).length, [applications]);
  const approved = useMemo(() => applications.filter(item => item.status === "approved_to_activate").length, [applications]);

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (!user) throw new Error("Please sign in again.");
      const token = await user.getIdToken();
      const result = await fetch("/api/pudo-partner/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          locationName, address, registrationNote: note,
          latitude: Number(latitude), longitude: Number(longitude), captureMethod: "manual",
        }),
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || "Unable to submit application.");
      router.push(`/pudo-partner/applications/${data.application.locationId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit application.");
    } finally { setBusy(false); }
  }

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/pudo-partner/sign-in");
  }

  if (loading) return <main className="vl-workspace"><div className="vl-workspace__content"><FeedbackState variant="loading" title="Loading your PUDO workspace" description="Checking your partner account and location applications." /></div></main>;
  if (!user || !profile) return (
    <main className="vl-workspace">
      <div className="vl-workspace__content">
        <FeedbackState
          variant="error"
          title="Partner workspace unavailable"
          description={error || "Sign in with your verified PUDO partner account to continue."}
          action={
            <div className="vl-pudo-feedback-actions">
              {user && (
                <Button variant="secondary" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
                  Try again
                </Button>
              )}
              <Link href="/pudo-partner/sign-in" className="vl-button vl-button--primary vl-button--sm">
                Partner sign in
              </Link>
            </div>
          }
        />
      </div>
    </main>
  );

  return (
    <WorkspaceShell
      workspaceName="VeriLyft"
      workspaceLabel="PUDO PARTNER"
      navigation={navigation}
      topbarContent={<Button variant="outline" size="sm" leadingIcon={<LogOut size={15} />} onClick={handleSignOut}>Sign out</Button>}
      breadcrumbs={[{ label: "PUDO workspace" }, { label: "Overview" }]}
    >
      <div className="vl-pudo-dashboard" id="overview">
        <PageHeader
          eyebrow="PUDO station workspace"
          title={profile.businessName}
          description={`Welcome, ${profile.contactName}. Manage your station, shipment handling and operational activity from one place.`}
          actions={<a className="vl-button vl-button--primary" href="#locations"><Plus size={16} /> Add location</a>}
        />

        {error && <div className="vl-pudo-alert"><FeedbackState variant="error" title="Something needs attention" description={error} /></div>}

        <section className="vl-pudo-metrics" aria-label="Partner account summary">
          <article className="vl-pudo-metric"><span className="vl-pudo-metric__label">Registered locations</span><strong>{applications.length}</strong><span className="vl-pudo-metric__hint">Location applications on this account</span></article>
          <article className="vl-pudo-metric"><span className="vl-pudo-metric__label">In review</span><strong>{awaitingReview}</strong><span className="vl-pudo-metric__hint">Awaiting Operations review or follow-up</span></article>
          <article className="vl-pudo-metric"><span className="vl-pudo-metric__label">Approved to activate</span><strong>{approved}</strong><span className="vl-pudo-metric__hint">Ready for the activation process</span></article>
          <article className="vl-pudo-metric vl-pudo-metric--quiet"><span className="vl-pudo-metric__label">Operational activity</span><strong>—</strong><span className="vl-pudo-metric__hint">Available when station operations are enabled</span></article>
        </section>

        <div className="vl-pudo-section-heading"><div><span className="vl-page-header__eyebrow">YOUR STATION</span><h2>Location overview</h2></div><a href="#locations" className="vl-pudo-text-link">Manage locations</a></div>
        <SurfaceCard className="vl-pudo-locations" >
          {applications.length === 0 ? (
            <FeedbackState variant="empty" title="No location added yet" description="Register the physical location you want to operate as a VeriLyft PUDO station." action={<a className="vl-button vl-button--primary" href="#locations">Register a location</a>} />
          ) : (
            <div className="vl-pudo-location-list">
              {applications.map(item => (
                <article className="vl-pudo-location-row" key={item.locationId}>
                  <span className="vl-pudo-location-icon"><MapPin size={19} /></span>
                  <div className="vl-pudo-location-copy"><strong>{item.locationName || "PUDO location"}</strong><small>Location reference: {item.locationId}</small></div>
                  <StatusBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />
                  <Link className="vl-button vl-button--secondary vl-button--sm" href={`/pudo-partner/applications/${item.locationId}`}>View details</Link>
                </article>
              ))}
            </div>
          )}
        </SurfaceCard>

        <div className="vl-pudo-section-heading" id="shipments"><div><span className="vl-page-header__eyebrow">DAILY OPERATIONS</span><h2>Station activity</h2><p>These operational views will populate from the station's shipment and assignment records.</p></div></div>
        <section className="vl-pudo-operations-grid">
          <article className="vl-pudo-operation-card"><span className="vl-pudo-operation-icon"><Package size={19} /></span><div><h3>Shipments</h3><p>View only shipments assigned to your authorised station.</p><span className="vl-pudo-coming">Operational module upcoming</span></div></article>
          <article className="vl-pudo-operation-card" id="intake"><span className="vl-pudo-operation-icon"><Camera size={19} /></span><div><h3>Parcel intake</h3><p>Receive and record parcels with mandatory photo evidence, condition and measurements.</p><span className="vl-pudo-coming">Operational module upcoming</span></div></article>
          <article className="vl-pudo-operation-card" id="door-pickup"><span className="vl-pudo-operation-icon"><Bike size={19} /></span><div><h3>Door pickup</h3><p>See pickup requests, customer addresses, schedules and responsible personnel.</p><span className="vl-pudo-coming">Operational module upcoming</span></div></article>
          <article className="vl-pudo-operation-card" id="personnel"><span className="vl-pudo-operation-icon"><Activity size={19} /></span><div><h3>Personnel</h3><p>Maintain the people registered to work for this PUDO location and their operational roles.</p><span className="vl-pudo-coming">Operational module upcoming</span></div></article>
          <article className="vl-pudo-operation-card" id="assignments"><span className="vl-pudo-operation-icon"><CalendarClock size={19} /></span><div><h3>Assignments</h3><p>See who is assigned, the activity and the scheduled start and end times.</p><span className="vl-pudo-coming">Operational module upcoming</span></div></article>
          <article className="vl-pudo-operation-card"><span className="vl-pudo-operation-icon"><ClipboardList size={19} /></span><div><h3>Recent activity</h3><p>Review station events and operational updates in chronological order.</p><span className="vl-pudo-coming">Operational module upcoming</span></div></article>
        </section>

        <section id="locations" className="vl-pudo-register">
          <div className="vl-pudo-section-heading"><div><span className="vl-page-header__eyebrow">LOCATION MANAGEMENT</span><h2>Register a PUDO location</h2><p>Submit a physical station for VeriLyft Operations review. Submission alone does not verify, approve or activate it.</p></div></div>
          <SurfaceCard>
            <form className="vl-pudo-form" onSubmit={submitApplication}>
              <label className="vl-field"><span className="vl-field__label">Location name</span><input className="vl-field__input" required maxLength={160} value={locationName} onChange={e=>setLocationName(e.target.value)} disabled={busy}/></label>
              <label className="vl-field vl-pudo-form-wide"><span className="vl-field__label">Physical address</span><textarea className="vl-field__input" required maxLength={1000} rows={3} value={address} onChange={e=>setAddress(e.target.value)} disabled={busy}/></label>
              <label className="vl-field vl-pudo-form-wide"><span className="vl-field__label">Additional information (optional)</span><textarea className="vl-field__input" maxLength={1000} rows={2} value={note} onChange={e=>setNote(e.target.value)} disabled={busy}/></label>
              <label className="vl-field"><span className="vl-field__label">Latitude</span><input className="vl-field__input" type="number" step="any" required value={latitude} onChange={e=>setLatitude(e.target.value)} disabled={busy}/></label>
              <label className="vl-field"><span className="vl-field__label">Longitude</span><input className="vl-field__input" type="number" step="any" required value={longitude} onChange={e=>setLongitude(e.target.value)} disabled={busy}/></label>
              <div className="vl-pudo-form-actions"><Button type="submit" loading={busy} leadingIcon={<Plus size={16} />}>Submit location application</Button></div>
            </form>
          </SurfaceCard>
        </section>
        <p className="vl-pudo-footnote">Your partner account is separate from VeriLyft Admin. Approval, activation, default capabilities and commercial decisions remain under VeriLyft Admin authority.</p>
      </div>
    </WorkspaceShell>
  );
}
