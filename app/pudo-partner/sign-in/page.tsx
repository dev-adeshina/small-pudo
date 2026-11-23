"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function PudoPartnerSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      if (!credential.user.emailVerified) {
        await signOut(auth);
        throw new Error("Verify your email address before signing in to the partner portal.");
      }
      const token = await credential.user.getIdToken();
      const response = await fetch("/api/pudo-partner/account", {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "This account is not registered as a PUDO partner.");
      router.replace("/pudo-partner");
    } catch (cause) {
      await signOut(auth).catch(() => undefined);
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally { setBusy(false); }
  }

  return <main className="admin-page"><div className="admin-shell cost-admin-shell">
    <div className="cost-page-topline"><Link href="/" className="cost-secondary-button">VeriLyft home</Link><span className="section-label">PUDO PARTNER PORTAL</span></div>
    <header className="admin-header"><div><p className="section-label">PARTNER SIGN IN</p><h1 className="cost-page-heading">Welcome to your partner workspace.</h1><p>Use your verified partner account. Staff accounts and staff permissions are managed separately.</p></div></header>
    {error && <p className="cost-feedback cost-feedback-error" role="alert">{error}</p>}
    <section className="cost-panel"><form className="cost-form-grid" onSubmit={submit}>
      <label className="cost-field cost-field-wide">Email address<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label>
      <label className="cost-field cost-field-wide">Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label>
      <div className="cost-form-actions cost-field-wide"><button className="cost-primary-button" type="submit" disabled={busy}>{busy ? "Signing in…" : "Partner sign in"}</button><Link className="cost-secondary-button" href="/pudo-partner/register">Create partner account</Link></div>
    </form></section>
  </div></main>;
}
