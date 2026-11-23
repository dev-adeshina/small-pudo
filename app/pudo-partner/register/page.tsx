"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function PudoPartnerRegisterPage() {
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    let createdUser: typeof auth.currentUser = null;
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      createdUser = credential.user;
      const token = await credential.user.getIdToken();
      const result = await fetch("/api/pudo-partner/account", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessName, contactName, phone }),
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || "Unable to create partner account.");
      await sendEmailVerification(credential.user);
      setComplete(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to register.");
      if (createdUser) {
        try { await createdUser.delete(); } catch { /* retain account if cleanup is blocked */ }
      }
    } finally {
      await signOut(auth).catch(() => undefined);
      setBusy(false);
    }
  }

  return <main className="auth-page">
    <header className="auth-header"><Link href="/"><Image src="/logo.svg" alt="VeriLyft" width={150} height={40} priority /></Link><span className="auth-header-label">PUDO PARTNER PORTAL</span></header>
    <div className="auth-layout">
      <section className="auth-intro"><p className="eyebrow">VERILYFT NETWORK</p><h1>Bring your business into the PUDO network.</h1><p>Create a partner account to submit location applications and follow their review progress. Registration does not approve or activate a location.</p></section>
      <section className="auth-card">
        {complete ? <div className="reset-success-card"><h2>Verify your email</h2><p>We created your partner account and sent a verification link to <strong>{email.trim().toLowerCase()}</strong>. Verify your email before signing in and submitting applications.</p><Link className="verify-login-button" href="/pudo-partner/sign-in">Continue to partner sign in</Link></div> : <>
          <div className="auth-card-heading"><p className="section-label">PARTNER REGISTRATION</p><h2>Create partner account</h2><p>Use your business contact details.</p></div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <form className="auth-form" onSubmit={submit}>
            <label htmlFor="business">Registered business name</label><input id="business" value={businessName} onChange={e=>setBusinessName(e.target.value)} maxLength={160} required disabled={busy}/>
            <label htmlFor="contact">Primary contact name</label><input id="contact" value={contactName} onChange={e=>setContactName(e.target.value)} maxLength={120} required disabled={busy}/>
            <label htmlFor="phone">Business phone</label><input id="phone" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} maxLength={25} required disabled={busy}/>
            <label htmlFor="email">Business email</label><input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required disabled={busy}/>
            <label htmlFor="password">Password</label><input id="password" type="password" autoComplete="new-password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} required disabled={busy}/>
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Creating account…" : "Create partner account"}</button>
          </form>
          <p className="auth-footer">Already registered? <Link href="/pudo-partner/sign-in">Partner sign in</Link></p>
        </>}
      </section>
    </div>
  </main>;
}
