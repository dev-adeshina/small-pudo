"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type VerificationResult = {
  success?: boolean;
  message?: string;
  orderId?: string;
  bookingId?: string;
  bookingReference?: string;
  error?: string;
};

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("reference") || searchParams.get("trxref");
  const isShipmentPayment = searchParams.get("type") === "shipment";

  const [status, setStatus] = useState<
    "verifying" | "success" | "failed"
  >("verifying");
  const [message, setMessage] = useState(
    "Please wait while we verify your payment."
  );
  const [orderId, setOrderId] = useState("");
  const [bookingReference, setBookingReference] = useState("");

  useEffect(() => {
    if (!reference) return;

    let cancelled = false;

    async function verifyPayment() {
      try {
        const response = await fetch(
          isShipmentPayment ? "/api/payments/shipment/verify" : "/api/payments/verify",
          {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reference }),
          }
        );

        const data: VerificationResult = await response
          .json()
          .catch(() => ({}));

        if (cancelled) return;

        if (!response.ok || !data.success) {
          setStatus("failed");
          setMessage(
            data.error ||
              data.message ||
              "We could not confirm your payment. Please contact support before trying to pay again."
          );
          return;
        }

        setStatus("success");
        setMessage(
          data.message || "Your payment has been confirmed."
        );

        if (data.orderId) setOrderId(data.orderId);
        if (data.bookingReference) setBookingReference(data.bookingReference);
      } catch (error) {
        if (cancelled) return;

        console.error("Payment verification failed:", error);
        setStatus("failed");
        setMessage(
          "We could not verify your payment right now. Please check your connection and contact support if the problem continues."
        );
      }
    }

    void verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [isShipmentPayment, reference]);

  const displayedStatus = reference ? status : "failed";
  const displayedMessage = reference
    ? message
    : "No payment reference was provided.";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold">
          {displayedStatus === "verifying"
            ? "Verifying your payment"
            : displayedStatus === "success"
              ? isShipmentPayment ? "Shipment payment confirmed" : "Payment confirmed"
              : "Payment not confirmed"}
        </h1>

        <p className="text-gray-600">{displayedMessage}</p>

        {orderId && (
          <p className="mt-4 break-all text-sm text-gray-600">
            Order ID: <strong>{orderId}</strong>
          </p>
        )}
        {bookingReference && (
          <p className="mt-4 break-all text-sm text-gray-600">
            Shipment booking reference: <strong>{bookingReference}</strong>
          </p>
        )}

        {displayedStatus === "verifying" && (
          <p className="mt-4 text-sm text-gray-500">
            Please do not close this page.
          </p>
        )}

        {displayedStatus !== "verifying" && (
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={isShipmentPayment ? "/account/shipment-bookings" : "/account"}
              className="rounded-lg bg-black px-5 py-3 text-white"
            >
              {isShipmentPayment ? "View shipment bookings" : "View my account"}
            </Link>

            <Link
              href="/"
              className="rounded-lg border border-gray-300 px-5 py-3"
            >
              Return home
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}