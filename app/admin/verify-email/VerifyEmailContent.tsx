"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, MailCheck } from "lucide-react";

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

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

      <section className="auth-layout verify-email-layout">
        <div className="auth-intro">
          <span className="eyebrow">
            EMAIL VERIFICATION
          </span>

          <h1>
            Check your
            <br />
            <em>inbox.</em>
          </h1>

          <p>
            One more step before you can access the
            VeriLyft administration workspace.
          </p>
        </div>

        <div className="auth-card verify-email-card">
          <div className="verify-email-icon">
            <MailCheck size={30} />
          </div>

          <div className="auth-card-heading">
            <span className="section-label">
              02 / VERIFY EMAIL
            </span>

            <h2>You're almost in.</h2>

            <p>
              We have sent you a verification email to{" "}
              <strong>{email}</strong>. Verify it and login.
            </p>
          </div>

          <Link
            href="/admin/sign-in"
            className="auth-submit verify-login-button"
          >
            <span>Login</span>

            <span className="auth-submit-icon">
              <ArrowUpRight size={20} />
            </span>
          </Link>

          <div className="auth-footer">
            <span>Already verified your email?</span>

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