"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type ApplicationView = {
  locationId: string;
  status: string;
  decisionReason: string;
  location: { name: string; address: string; registrationNote: string };
  responses: { responseId: string; message: string; createdAt?: unknown }[];
};

export default function PudoPartnerApplicationPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [application, setApplication] = useState<ApplicationView | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/pudo-partner/applications/${encodeURIComponent(locationId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load application.");
        if (!cancelled) setApplication(data.application);
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load application."); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user, locationId]);

  async function respond(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (!user) throw new Error("Please sign in again.");
      const token = await user.getIdToken();
      const response = await fetch(`/api/pudo-partner/applications/${encodeURIComponent(locationId)}`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit response.");
      setMessage("");
      const refreshed = await fetch(`/api/pudo-partner/applications/${encodeURIComponent(locationId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const refreshedData = await refreshed.json();
      if (refreshed.ok) setApplication(refreshedData.application);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to submit response."); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="admin-page"><p>Loading application…</p></main>;
  if (!application) return <main className="admin-page"><p className="cost-feedback" role="alert">{error || "Application not found."}</p><Link href="/pudo-partner">Back to partner workspace</Link></main>;

  return <main className="admin-page"><div className="admin-shell cost-admin-shell">
    <header className="admin-header"><div><p className="section-label">PUDO PARTNER / APPLICATION</p><h1 className="cost-page-heading">{application.location.name}</h1><p>{application.location.address}</p></div><Link className="cost-secondary-button" href="/pudo-partner">Back to applications</Link></header>
    <section className="cost-panel"><div className="cost-page-topline"><h2>Application status</h2><span className="status-badge">{application.status.replaceAll("_", " ")}</span></div>
      <p>{application.status === "approved_to_activate" ? "Operations has approved this candidate to proceed to the separate activation process. It is not yet an operational PUDO location." : application.status === "not_approved" ? "Operations has recorded that this application is not approved." : application.status === "clarification_required" ? "Operations requires additional information. Submit your response below; the original inspection and decision history remain unchanged." : "Your application has been submitted to the VeriLyft Operations verification queue."}</p>
      {application.status === "clarification_required" && <><h3>Clarification requested</h3><p>{application.decisionReason}</p><form className="cost-form-grid" onSubmit={respond}><label className="cost-field cost-field-wide">Your response<textarea required maxLength={3000} rows={4} value={message} onChange={e=>setMessage(e.target.value)} disabled={busy}/></label><button className="cost-primary-button" type="submit" disabled={busy || !message.trim()}>{busy ? "Submitting…" : "Submit clarification response"}</button></form></>}
    </section>
    <section className="cost-panel"><h2>Previous responses</h2>{application.responses.length === 0 ? <p>No clarification responses have been submitted.</p> : <ol>{application.responses.map(item=><li key={item.responseId}><p>{item.message}</p></li>)}</ol>}</section>
    {error && <p className="cost-feedback cost-feedback-error" role="alert">{error}</p>}
    <p className="cost-footer-note">You can view only applications belonging to this partner account. Verification, approval, activation and operational capabilities remain under separate VeriLyft Operations control.</p>
  </div></main>;
}
