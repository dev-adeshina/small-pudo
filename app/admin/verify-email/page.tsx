import { Suspense } from "react";
import VerifyEmailContent from "./VerifyEmailContent";

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}