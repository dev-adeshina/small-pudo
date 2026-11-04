"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

function AcceptStaffInvitationContent() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"register" | "sign-in">("register");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The request could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function continueToStaffWorkspace() {
    const user = auth.currentUser;
    if (!user) throw new Error("Sign in with the invited account first.");
    await reload(user);
    if (!user.emailVerified) {
      setMessage("Your email is not verified yet. Open the verification email, then return here and sign in again.");
      return;
    }
    router.replace("/admin/operational-cost-definitions");
  }

  async function authenticate() {
    if (!token) throw new Error("This invitation link is missing its token.");
    if (mode === "register") {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await sendEmailVerification(credential.user);
      await signOut(auth);
      setMessage("Your account has been created. Verify your email, then return to this invitation page and sign in. You will complete staff activation inside the staff workspace.");
      return;
    }
    await signInWithEmailAndPassword(auth, email.trim(), password);
    await continueToStaffWorkspace();
  }

  async function googleSignIn() {
    if (!token) throw new Error("This invitation link is missing its token.");
    await signInWithPopup(auth, new GoogleAuthProvider());
    await continueToStaffWorkspace();
  }

  return (
    <main className="admin-page">
      <div className="admin-shell cost-admin-shell">
        <div className="cost-page-topline">
          <Link href="/" className="cost-secondary-button">VeriLyft home</Link>
          <span className="section-label">STAFF INVITATION</span>
        </div>
        <div className="cost-page-heading">
          <div>
            <h1>Join the <em>team.</em></h1>
            <p>Use the email address that received this invitation. A verified matching email is required. You will activate your staff account after signing in to the staff workspace. Operational permissions are assigned separately.</p>
          </div>
        </div>
        {!token && <div className="cost-feedback cost-feedback-error">Invitation token is missing. Open the complete link from your invitation email.</div>}
        {message && <div className="cost-feedback cost-feedback-success">{message}</div>}
        {error && <div className="cost-feedback cost-feedback-error">{error}</div>}
        <section className="cost-panel">
          <div className="cost-panel-heading">
            <h2>{mode === "register" ? "Create your staff account" : "Sign in to continue"}</h2>
          </div>
          <form className="cost-form-grid" onSubmit={(event) => { event.preventDefault(); void run(authenticate); }}>
            <label className="cost-field cost-field-wide">
              Invited email address
              <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="cost-field cost-field-wide">
              Password
              <input type="password" required minLength={6} autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <div className="cost-form-actions cost-field-wide">
              <button className="cost-primary-button" type="submit" disabled={busy || !token}>
                {mode === "register" ? "Create account and verify email" : "Sign in"}
              </button>
              <button className="cost-secondary-button" type="button" disabled={busy} onClick={() => setMode(mode === "register" ? "sign-in" : "register")}>
                {mode === "register" ? "I already have an account" : "Create a new account"}
              </button>
            </div>
          </form>
          <div className="cost-form-actions">
            <button className="cost-secondary-button" type="button" disabled={busy || !token} onClick={() => void run(googleSignIn)}>
              Continue with Google
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AcceptStaffInvitationPage() {
  return (
    <Suspense fallback={<main className="admin-page"><div className="admin-shell cost-admin-shell">Loading invitation…</div></main>}>
      <AcceptStaffInvitationContent />
    </Suspense>
  );
}
