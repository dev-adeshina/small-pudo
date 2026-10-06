"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import GoogleAuthButton from "@/components/admin/GoogleAuthButton";

import { signUpAdmin } from "@/lib/auth";

export default function AdminSignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {

      await signUpAdmin(email, password);
      router.push(
        `/admin/verify-email?email=${encodeURIComponent(email)}`
      );
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        error.code === "auth/email-already-in-use"
      ) {
        setError("Admin already exist. Sign In?");
      } else if (
        error instanceof FirebaseError &&
        error.code === "auth/invalid-email"
      ) {
        setError("Please enter a valid email address");
      } else if (
        error instanceof FirebaseError &&
        error.code === "auth/weak-password"
      ) {
        setError("Password is too weak");
      } else {
        setError(
          "Something went wrong. Please try again."
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
          <span className="eyebrow">ADMIN ACCESS</span>

          <h1>
            Build the
            <br />
            <em>network.</em>
          </h1>

          <p>
            Create an administrator account to access
            the VeriLyft administration workspace.
          </p>
        </div>

        <div className="auth-card">

          <div className="auth-card-heading">
            <span className="section-label">
              01 / SIGN UP
            </span>

            <h2>Create account.</h2>

            <p>
              Register your administrator credentials.
            </p>
          </div>

          {error && (
            <div className="auth-error">
              {error}

              {error === "Admin already exist. Sign In?" && (
                <Link href="/admin/sign-in">
                  Sign In <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label>
              Name

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </label>

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

            <label>
              Password

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Create a password"
                autoComplete="new-password"
                required
              />
            </label>

            <label>
              Repeat password

              <input
                type="password"
                value={repeatPassword}
                onChange={(event) =>
                  setRepeatPassword(event.target.value)
                }
                placeholder="Repeat your password"
                autoComplete="new-password"
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
                  ? "Creating account..."
                  : "Create Account"}
              </span>

              {!loading && (
                <span className="auth-submit-icon">
                  <ArrowUpRight size={20} />
                </span>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <GoogleAuthButton mode="sign-up" /> 

          <div className="auth-footer">
            <span>Already have an admin account?</span>

            <Link href="/admin/sign-in">
              Sign In <ArrowUpRight size={15} />
            </Link>
          </div>

        </div>

      </section>
    </main>
  );
}

