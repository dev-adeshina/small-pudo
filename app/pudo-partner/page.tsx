"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

type PartnerProfile = { businessName: string; contactName: string; email: string };
type Application = { locationId: string; locationName: string; status: string; createdAt?: unknown };

const statusLabel = (status: string) => ({
  submitted: "Submitted — awaiting review",
  pending_inspection: "Awaiting physical inspection",
  inspection_recorded: "Inspection recorded",
  clarification_required: "Clarification requested",
  approved_to_activate: "Approved to proceed to activation",
  not_approved: "Not approved",
}[status] ?? status.replaceAll("_", " "));

export default function PudoPartnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
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
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load partner workspace."); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user]);

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
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to submit application."); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="admin-page"><p>Loading partner workspace…</p></main>;
  if (!user || !profile) return <main className="admin-page"><p className="cost-feedback" role="alert">{error || "Partner account unavailable."}</p><Link href="/pudo-partner/sign-in">Partner sign in</Link></main>;

  return <main className="admin-page"><div className="admin-shell cost-admin-shell">
    <header className="admin-header"><div><p className="section-label">VERILYFT / PUDO PARTNER PORTAL</p><h1 className="cost-page-heading">{profile.businessName}</h1><p>Welcome, {profile.contactName}. Manage your business's PUDO location applications.</p></div><button className="cost-secondary-button" type="button" onClick={async()=>{await signOut(auth);router.replace("/pudo-partner/sign-in");}}>Sign out</button></header>
    {error && <p className="cost-feedback cost-feedback-error" role="alert">{error}</p>}
    <section className="cost-panel"><div className="cost-page-topline"><h2>Your location applications</h2><span>{applications.length} applications</span></div>
      {applications.length === 0 ? <p>You have not submitted a PUDO location application yet.</p> : <div className="cost-table-wrap"><table className="cost-table"><thead><tr><th>Location</th><th>Application status</th><th>Action</th></tr></thead><tbody>{applications.map(item=><tr key={item.locationId}><td><strong>{item.locationName || "PUDO location"}</strong><small>{item.locationId}</small></td><td><span className="status-badge">{statusLabel(item.status)}</span></td><td><Link className="admin-action" href={`/pudo-partner/applications/${item.locationId}`}>View application</Link></td></tr>)}</tbody></table></div>}
    </section>
    <section className="cost-panel"><div className="cost-page-topline"><h2>Submit a location application</h2><span>Partner application</span></div><p>Submit the physical business location for Operations review. Submission does not verify, approve, activate or enable the location.</p>
      <form className="cost-form-grid" onSubmit={submitApplication}>
        <label className="cost-field">Location name<input required maxLength={160} value={locationName} onChange={e=>setLocationName(e.target.value)} disabled={busy}/></label>
        <label className="cost-field cost-field-wide">Physical address<textarea required maxLength={1000} rows={3} value={address} onChange={e=>setAddress(e.target.value)} disabled={busy}/></label>
        <label className="cost-field cost-field-wide">Additional information (optional)<textarea maxLength={1000} rows={2} value={note} onChange={e=>setNote(e.target.value)} disabled={busy}/></label>
        <label className="cost-field">Latitude<input type="number" step="any" required value={latitude} onChange={e=>setLatitude(e.target.value)} disabled={busy}/></label>
        <label className="cost-field">Longitude<input type="number" step="any" required value={longitude} onChange={e=>setLongitude(e.target.value)} disabled={busy}/></label>
        <div className="cost-form-actions cost-field-wide"><button className="cost-primary-button" type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit location application"}</button></div>
      </form>
    </section>
    <p className="cost-footer-note">Partner access is separate from the staff workspace. Only VeriLyft Operations can inspect, decide, activate or assign operational capabilities to a PUDO location.</p>
  </div></main>;
}
