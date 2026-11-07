"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type StaffOption = { uid: string; email?: string };
type Options = { permissions: string[]; staff: StaffOption[] };

export default function StaffDelegationsPage() {
  const [options, setOptions] = useState<Options>({ permissions: [], staff: [] });
  const [permissionId, setPermissionId] = useState("");
  const [targetUid, setTargetUid] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [allowFurther, setAllowFurther] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const api = useCallback(async (method: string, body?: unknown) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Your staff session has ended. Sign in again.");
    const response = await fetch("/api/staff/delegations", {
      method,
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "The request could not be completed.");
    return result;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api("GET");
      setOptions({ permissions: result.permissions, staff: result.staff });
      setPermissionId((current: string) => result.permissions.includes(current) ? current : result.permissions[0] ?? "");
      setTargetUid((current: string) => result.staff.some((person: StaffOption) => person.uid === current) ? current : "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Delegation options could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.replace("/admin/sign-in");
        return;
      }
      if (active) await load();
    });
    return () => { active = false; unsubscribe(); };
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      await api("POST", {
        targetUid,
        permissionId,
        reason,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        allowFurtherDelegation: allowFurther,
      });
      setReason("");
      setExpiresAt("");
      setAllowFurther(false);
      setFeedback("Activity delegated. The grant and its authority lineage have been recorded.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The activity could not be delegated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/" className="admin-logo">VERILyFT / STAFF</Link>
        <Link href="/admin/operational-cost-definitions" className="admin-action">Staff workspace</Link>
      </header>
      <div className="admin-shell cost-admin-shell">
        <div className="cost-page-topline"><span className="section-label">STAFF / ACTIVITY DELEGATION</span></div>
        <div className="cost-page-heading">
          <div><h1>Delegate an <em>activity.</em></h1><p>Assign only an activity you have explicit authority to delegate. Your delegation cannot exceed or outlive the grant that authorises it.</p></div>
        </div>
        <div className="cost-boundary-note"><div><strong>Authority boundary</strong><p>Delegation is activity-specific, attributable and revocable. It does not grant additional activities or organisation-wide administrator access. Revoking an upstream grant makes its descendants ineffective.</p></div></div>
        {feedback && <div className="cost-feedback cost-feedback-success">{feedback}</div>}
        {error && <div className="cost-feedback cost-feedback-error">{error}</div>}
        {loading ? <div className="cost-panel">Loading your delegation authority…</div> : !options.permissions.length ? (
          <div className="cost-panel"><h2>No delegable activities assigned</h2><p className="cost-subtitle">You can delegate an activity only when an administrator has explicitly enabled delegation on that activity grant.</p></div>
        ) : !options.staff.length ? (
          <div className="cost-panel"><h2>No active staff recipients</h2><p className="cost-subtitle">There are no other active staff accounts available for delegation.</p></div>
        ) : (
          <section className="cost-panel">
            <div className="cost-panel-heading"><div><span className="section-label">01 / NEW DELEGATION</span><h2>Assign an activity to staff</h2></div></div>
            <form className="cost-form-grid" onSubmit={submit}>
              <label className="cost-field cost-field-wide">Active staff member
                <select required value={targetUid} onChange={event => setTargetUid(event.target.value)}>
                  <option value="">Select a staff member</option>
                  {options.staff.map(person => <option key={person.uid} value={person.uid}>{person.email || person.uid}</option>)}
                </select>
              </label>
              <label className="cost-field cost-field-wide">Activity you may delegate
                <select required value={permissionId} onChange={event => setPermissionId(event.target.value)}>
                  {options.permissions.map(id => <option key={id} value={id}>{id}</option>)}
                </select>
              </label>
              <label className="cost-field cost-field-wide">Reason for delegation
                <textarea required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} />
              </label>
              <label className="cost-field cost-field-wide">Expiry (optional)
                <input type="datetime-local" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} />
                <small>If your own grant expires, this delegated grant expires with it.</small>
              </label>
              <label className="cost-field cost-field-wide"><span><input type="checkbox" checked={allowFurther} onChange={event => setAllowFurther(event.target.checked)} /> Allow the recipient to delegate this same activity onward</span><small>This does not grant any additional activity. The recipient may only delegate within this grant's authority and expiry.</small></label>
              <div className="cost-form-actions cost-field-wide"><button className="cost-primary-button" disabled={busy || !targetUid || !permissionId}>Delegate activity</button></div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
