"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { ArrowRight } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function PudoPartnerSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      if (!credential.user.emailVerified) {
        await signOut(auth);
        throw new Error("Verify your email address before signing in to the partner portal.");
      }
      const token = await credential.user.getIdToken();
      const response = await fetch("/api/pudo-partner/account", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "This account is not registered as a PUDO partner.");
      router.replace("/pudo-partner");
    } catch (cause) {
      await signOut(auth).catch(() => undefined);
      if (cause instanceof FirebaseError && ["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"].includes(cause.code)) {
        setError("Incorrect email address or password.");
      } else if (cause instanceof FirebaseError && cause.code === "auth/too-many-requests") {
        setError("Too many unsuccessful attempts. Please wait before trying again.");
      } else {
        setError(cause instanceof Error ? cause.message : "Unable to sign in. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link href="/" aria-label="VeriLyft home">
          <Image src="/logo.svg" alt="VeriLyft" width={150} height={40} priority style={{ width: "auto", height: "auto" }} />
        </Link>
        <span className="auth-header-label">PUDO PARTNER PORTAL</span>
      </header>
      <div className="auth-layout">
        <section className="auth-intro">
          <p className="eyebrow">VERILYFT NETWORK</p>
          <h1>Your station. <em>Your workspace.</em></h1>
          <p>Sign in with your verified PUDO partner account to manage your station and follow its operational activity.</p>
        </section>
        <section className="auth-card">
          <div className="auth-card-heading">
            <p className="section-label">PUDO PARTNER SIGN-IN</p>
            <h2>Welcome back</h2>
            <p>Enter your partner account details to continue.</p>
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <form className="auth-form" onSubmit={submit}>
            <label htmlFor="partner-email">Email address</label>
            <input id="partner-email" name="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required disabled={busy} />
            <label htmlFor="partner-password">Password</label>
            <input id="partner-password" name="password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" required disabled={busy} />
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? "Signing in..." : "Partner sign in"}
              {!busy && <ArrowRight size={18} className="auth-submit-icon" aria-hidden="true" />}
            </button>
          </form>
          <p className="auth-footer">New to the network? <Link href="/pudo-partner/register">Create a partner account</Link></p>
        </section>
      </div>
    </main>
  );
}
