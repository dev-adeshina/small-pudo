"use client";

import { Suspense } from "react";

import PaymentCallbackContent from "./PaymentCallbackContent";

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p>Verifying your payment...</p>
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}