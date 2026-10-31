"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { resetCustomerPassword } from "@/lib/customer-auth";

export default function CustomerForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await resetCustomerPassword(email);

      // Use the same success message regardless of whether
      // an account exists, avoiding unnecessary account disclosure.
      setSubmitted(true);
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-email":
            setError("Please enter a valid email address.");
            break;

          case "auth/too-many-requests":
            setError(
              "Too many attempts. Please wait before trying again."
            );
            break;

          case "auth/network-request-failed":
            setError(
              "Unable to connect. Check your internet connection and try again."
            );
            break;

          default:
            setError(
              "We could not process your request. Please try again later."
            );
        }
      } else {
        setError(
          "We could not process your request. Please try again later."
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
            style={{ width: "auto", height: "auto" }}
          />
        </Link>

        <span className="auth-header-label">CUSTOMER ACCOUNT</span>
      </header>

      <div className="auth-layout">
        <section className="auth-intro">
          <p className="eyebrow">ACCOUNT RECOVERY</p>

          <h1>Let&apos;s get you back in.</h1>

          <p>
            Forgot your password? Request a secure reset link using
            the email address associated with your VeriLyft account.
          </p>
        </section>

        <section className="auth-card">
          {submitted ? (
            <div className="reset-success-card">
              <CheckCircle2
                size={42}
                className="verify-email-icon"
                aria-hidden="true"
              />

              <h2>Check your email</h2>

              <p>
                If an account exists for{" "}
                <strong>{email.trim().toLowerCase()}</strong>, you
                should receive instructions to reset your password.
              </p>

              <p>
                Check your inbox and spam folder. You can return here
                to try again if needed.
              </p>

              <Link
                href="/account/sign-in"
                className="verify-login-button"
              >
                Return to sign in
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-card-heading">
                <p className="section-label">PASSWORD RESET</p>

                <h2>Forgot your password?</h2>

                <p>
                  Enter your email address and we&apos;ll send reset
                  instructions if an account matches it.
                </p>
              </div>

              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}

              <form className="auth-form" onSubmit={handleSubmit}>
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

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >
                  {loading ? "Sending instructions..." : "Send reset link"}

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
                <Link href="/account/sign-in">
                  <ArrowLeft
                    size={16}
                    style={{
                      display: "inline",
                      verticalAlign: "middle",
                      marginRight: "4px",
                    }}
                    aria-hidden="true"
                  />
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}