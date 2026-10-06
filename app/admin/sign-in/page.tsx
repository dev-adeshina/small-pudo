"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import GoogleAuthButton from "@/components/admin/GoogleAuthButton";

import { signInAdmin } from "@/lib/auth";

export default function AdminSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await signInAdmin(email, password);

      router.push("/admin");
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "EmailNotVerified"
      ) {
        router.push(
          `/admin/verify-email?email=${encodeURIComponent(email)}`
        );
        return;
      }
      if (
        error instanceof FirebaseError &&
        (
          error.code === "auth/invalid-credential" ||
          error.code === "auth/invalid-email" ||
          error.code === "auth/wrong-password" ||
          error.code === "auth/user-not-found"
        )
      ) {
        setError("Invalid email or password");
      } else {
        setError("Something went wrong. Please try again.");
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

          <h1> Move things <br /> <em>forward.</em> </h1> <p> Sign in to access the VeriLyft administration workspace. </p>
        </div>

        <div className="auth-card">

          <div className="auth-card-heading">
            <span className="section-label"> 01 / SIGN IN </span> <h2>Welcome back.</h2> <p> Enter your admin credentials to continue. </p>
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
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </label>

            <div className="forgot-password">
              <Link
                href={`/admin/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""
                  }`}
              >
                Forgot password?
              </Link>
            </div>

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Signing in..."
                  : "Sign In"}
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

          <GoogleAuthButton mode="sign-in" />

          <div className="auth-footer">
            <span>Don't have an admin account?</span>

            <Link href="/admin/sign-up">
              Sign Up <ArrowUpRight size={15} />
            </Link>
          </div>

        </div>

      </section>
    </main>
  );
}