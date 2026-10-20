"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { signInCustomer } from "@/lib/customer-auth";

export default function CustomerSignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await signInCustomer(email, password);

      router.replace("/account");
    } catch (err) {
      if (err instanceof Error && err.name === "EmailNotVerified") {
        setError(
          "Please verify your email address before signing in. Check your inbox for the verification link."
        );
      } else if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-credential":
          case "auth/user-not-found":
          case "auth/wrong-password":
            setError("Incorrect email address or password.");
            break;

          case "auth/invalid-email":
            setError("Please enter a valid email address.");
            break;

          case "auth/too-many-requests":
            setError(
              "Too many unsuccessful attempts. Please wait before trying again."
            );
            break;

          case "auth/network-request-failed":
            setError(
              "Unable to connect. Check your internet connection and try again."
            );
            break;

          default:
            setError("We could not sign you in. Please try again.");
        }
      } else {
        setError("We could not sign you in. Please try again.");
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
          <p className="eyebrow">WELCOME BACK</p>

          <h1>Your VeriLyft journey continues.</h1>

          <p>
            Sign in to access your customer account. Your account
            dashboard and order management features are being built
            as part of the VeriLyft customer experience.
          </p>
        </section>

        <section className="auth-card">
          <div className="auth-card-heading">
            <p className="section-label">CUSTOMER SIGN-IN</p>
            <h2>Welcome back</h2>
            <p>Enter your account details to continue.</p>
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

            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />

            <div>
              <Link href="/account/forgot-password">
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}

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
            Don't have an account?{" "}
            <Link href="/account/register">Create an account</Link>
          </p>
        </section>
      </div>
    </main>
  );
}