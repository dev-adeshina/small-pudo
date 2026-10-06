import { Suspense } from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-page">
          <header className="auth-header">
            <span className="auth-header-label">
              ADMIN / 2026
            </span>
          </header>
        </main>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}