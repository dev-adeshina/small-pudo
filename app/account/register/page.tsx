"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { registerCustomer } from "@/lib/customer-auth";

export default function CustomerRegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {


    event.preventDefault();

    setError("");

    const normalizedName = displayName.trim();

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      setError("Your name must be between 2 and 80 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // await registerCustomer(email, password);
      await registerCustomer(
        normalizedName,
        phone.trim(),
        email,
        password
      );
      setRegistered(true);
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/email-already-in-use":
            setError(
              "An account already exists with this email address. Please sign in instead."
            );
            break;

          case "auth/invalid-email":
            setError("Please enter a valid email address.");
            break;

          case "auth/weak-password":
            setError("Please choose a stronger password.");
            break;

          case "auth/network-request-failed":
            setError(
              "Unable to connect. Please check your internet connection and try again."
            );
            break;

          default:
            setError(
              "We could not create your account. Please try again."
            );
        }
      } else {
        setError(
          "Your account could not be completed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link href="/" aria-label="VeriLyft home">
          <Image
            src="/logo.svg"
            alt="VeriLyft"
            width={150}
            height={40}
            priority
          />
        </Link>

        <span className="auth-header-label">CUSTOMER ACCOUNT</span>
      </header>

      <div className="auth-layout">
        <section className="auth-intro">
          <p className="eyebrow">VERILYFT — BEYOND BORDERS</p>

          <h1>Create your VeriLyft account.</h1>

          <p>
            Create an account to access your customer dashboard and,
            as we complete the account features, manage your orders
            in one place.
          </p>
        </section>

        <section className="auth-card">
          {registered ? (
            <div className="reset-success-card">
              <CheckCircle2
                size={42}
                className="verify-email-icon"
                aria-hidden="true"
              />

              <h2>Check your email</h2>

              <p>
                We have attempted to send a verification link to{" "}
                <strong>{email.trim().toLowerCase()}</strong>.
                Open that email and follow the link before signing in.
              </p>

              <p>
                If you cannot find the message, check your spam folder.
              </p>

              <Link
                href="/account/sign-in"
                className="verify-login-button"
              >
                Continue to sign in
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-card-heading">
                <p className="section-label">GET STARTED</p>
                <h2>Create your account</h2>
                <p>
                  Enter your details to create your customer account.
                </p>
              </div>

              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}

              <form
                className="auth-form"
                onSubmit={handleSubmit}
              >

                <label htmlFor="displayName">Full name</label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Enter your full name"
                  minLength={2}
                  maxLength={80}
                  required
                  disabled={loading}
                />

                <label htmlFor="phone">Phone number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="e.g. 08012345678"
                  maxLength={25}
                  disabled={loading}
                />
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />

                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  disabled={loading}
                />

                <label htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Enter your password again"
                  minLength={6}
                  required
                  disabled={loading}
                />

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create account"}
                  {!loading && (
                    <ArrowRight
                      size={18}
                      className="auth-submit-icon"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </form>

              <p className="auth-footer">
                Already have an account?{" "}
                <Link href="/account/sign-in">Sign in</Link>
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}