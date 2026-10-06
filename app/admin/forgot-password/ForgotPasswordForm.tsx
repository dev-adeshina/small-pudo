"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { FirebaseError } from "firebase/app";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, KeyRound } from "lucide-react";

import { resetAdminPassword } from "@/lib/auth";

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(
    searchParams.get("email") ?? ""
  );

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await resetAdminPassword(email);

      setSent(true);
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        error.code === "auth/invalid-email"
      ) {
        setError("Please enter a valid email address");
      } else if (
        error instanceof FirebaseError &&
        error.code === "auth/user-not-found"
      ) {
        setError("No admin account was found with this email");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="auth-page">
        <header className="auth-header">
          <Link href="/" aria-label="VeriLyft home">
            <Image
              src="/logo.svg"
              width={60}
              height={20}
              alt="VeriLyft"
              priority
            />
          </Link>

          <span className="auth-header-label">
            ADMIN / 2026
          </span>
        </header>

        <section className="auth-layout">
          <div className="auth-intro">
            <span className="eyebrow">
              PASSWORD RESET
            </span>

            <h1>
              Check your
              <br />
              <em>inbox.</em>
            </h1>

            <p>
              Follow the link in the email to create a
              new administrator password.
            </p>
          </div>

          <div className="auth-card reset-success-card">
            <div className="verify-email-icon">
              <KeyRound size={30} />
            </div>

            <div className="auth-card-heading">
              <span className="section-label">
                03 / RESET PASSWORD
              </span>

              <h2>Reset link sent.</h2>

              <p>
                We sent you a password change link to{" "}
                <strong>{email}</strong>.
              </p>
            </div>

            <Link
              href="/admin/sign-in"
              className="auth-submit verify-login-button"
            >
              <span>Sign In</span>

              <span className="auth-submit-icon">
                <ArrowUpRight size={20} />
              </span>
            </Link>

            <div className="auth-footer">
              <span>Remember your password?</span>

              <Link href="/admin/sign-in">
                Sign In
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link href="/" aria-label="VeriLyft home">
          <Image
            src="/logo.svg"
            width={60}
            height={20}
            alt="VeriLyft"
            priority
          />
        </Link>

        <span className="auth-header-label">
          ADMIN / 2026
        </span>
      </header>

      <section className="auth-layout">
        <div className="auth-intro">
          <span className="eyebrow">
            PASSWORD RESET
          </span>

          <h1>
            Get back
            <br />
            <em>in.</em>
          </h1>

          <p>
            Enter your administrator email and we'll send
            you a secure link to change your password.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading">
            <span className="section-label">
              03 / RESET PASSWORD
            </span>

            <h2>Forgot password?</h2>

            <p>
              Enter your admin email to receive a reset
              link.
            </p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label>
              Email address

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </label>

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Sending..."
                  : "Get Reset Link"}
              </span>

              {!loading && (
                <span className="auth-submit-icon">
                  <ArrowUpRight size={20} />
                </span>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span>Remember your password?</span>

            <Link href="/admin/sign-in">
              Sign In
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}