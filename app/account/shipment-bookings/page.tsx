"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type User } from "firebase/auth";
import { ArrowLeft, ArrowRight, Package, UserRound } from "lucide-react";

import { auth } from "@/lib/firebase";
import { signOutCustomer } from "@/lib/customer-auth";

type ShipmentBooking = {
  bookingId: string;
  bookingReference?: string;
  status?: string;
  paymentStatus?: string;
  paymentReviewRequired?: boolean;
  createdAt?: unknown;
  shipmentSnapshot?: Record<string, unknown>;
};

function dateValue(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (value && typeof value === "object") {
    const item = value as { seconds?: number; _seconds?: number };
    const seconds = item.seconds ?? item._seconds;
    if (typeof seconds === "number") return new Date(seconds * 1000);
  }
  return null;
}

function formatDate(value: unknown) {
  const date = dateValue(value);
  return date ? new Intl.DateTimeFormat("en-NG", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  }).format(date) : "Not available";
}

function statusClass(value: string) {
  return ["paid", "confirmed", "completed"].includes(value)
    ? "customer-status-success"
    : ["failed", "cancelled", "rejected"].includes(value)
      ? "customer-status-cancelled"
      : "customer-status-pending";
}

export default function CustomerShipmentBookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [bookings, setBookings] = useState<ShipmentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingBookingId, setPayingBookingId] = useState("");

  const loadBookings = useCallback(async (currentUser: User) => {
    setLoading(true);
    setError("");
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/account/shipment-bookings", {
        headers: { Authorization: "Bearer " + token },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? "Unable to load shipment bookings.");
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load shipment bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function initializePayment(booking: ShipmentBooking) {
    if (!user || payingBookingId || booking.paymentStatus === "paid" || booking.paymentReviewRequired) return;
    setPayingBookingId(booking.bookingId);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `/api/account/shipment-bookings/${encodeURIComponent(booking.bookingId)}/payment/initialize`,
        {
          method: "POST",
          headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success || typeof data.authorizationUrl !== "string") {
        throw new Error(data.error ?? "Unable to initialize shipment payment.");
      }
      window.location.assign(data.authorizationUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to initialize shipment payment.");
      setPayingBookingId("");
    }
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.replace("/account/sign-in");
        return;
      }
      if (!currentUser.emailVerified) {
        try { await signOutCustomer(); }
        finally { router.replace("/account/sign-in"); }
        return;
      }
      setUser(currentUser);
      setChecking(false);
      void loadBookings(currentUser);
    });
    return () => unsubscribe();
  }, [loadBookings, router]);

  if (checking || !user) {
    return <main className="customer-loading"><span>Checking your account...</span></main>;
  }

  return (
    <main className="customer-page">
      <header className="customer-header">
        <Link href="/" className="customer-logo" aria-label="VeriLyft home">
          <Image src="/logo.svg" alt="VeriLyft" width={150} height={40} priority style={{ width: "auto", height: "auto" }} />
        </Link>
        <div className="customer-header-right">
          <div className="customer-identity">
            <span className="customer-avatar"><UserRound size={17} /></span>
            <span className="customer-email">{user.email}</span>
          </div>
          <Link href="/account" className="customer-logout" aria-label="My account"><ArrowLeft size={17} /></Link>
        </div>
      </header>

      <div className="customer-shell shipment-shell">
        <div className="shipment-heading">
          <span className="eyebrow">VERILYFT / SHIPMENT BOOKINGS</span>
          <h1>Your shipment <em>bookings.</em></h1>
          <p>Confirmed shipment reservations and their payment status. A booking is not proof that a parcel has been physically received.</p>
        </div>

        {error && <p className="customer-error" role="alert">{error}</p>}

        {loading ? <section className="customer-panel"><p>Loading your shipment bookings...</p></section>
          : bookings.length === 0 ? <section className="customer-panel">
            <div className="customer-panel-heading"><div><span className="section-label">01 / BOOKING HISTORY</span><h2>No confirmed shipments</h2></div><Package size={22} /></div>
            <p>When you confirm an accepted quotation, the shipment booking will appear here. Saved drafts and quotations are listed separately.</p>
            <Link href="/account/shipments" className="customer-primary-action">Prepare a shipment</Link>
          </section>
          : <section className="customer-panel">
            <div className="customer-panel-heading">
              <div><span className="section-label">01 / BOOKING HISTORY</span><h2>{bookings.length} latest shipment bookings</h2></div>
              <Package size={22} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead><tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-3 pr-4">Booking reference</th>
                  <th className="py-3 pr-4">Journey</th>
                  <th className="py-3 pr-4">Booking</th>
                  <th className="py-3 pr-4">Payment</th>
                  <th className="py-3">Created</th>
                </tr></thead>
                <tbody>
                  {bookings.map((booking) => {
                    const snapshot = booking.shipmentSnapshot ?? {};
                    const paymentStatus = booking.paymentStatus ?? "pending";
                    return <tr className="border-b border-gray-100 align-top" key={booking.bookingId}>
                      <td className="py-4 pr-4">
                        <strong>{booking.bookingReference ?? booking.bookingId}</strong>
                        <div className="mt-1 text-xs text-gray-500">ID: {booking.bookingId}</div>
                      </td>
                      <td className="py-4 pr-4">
                        <strong>{String(snapshot.origin ?? "Origin unavailable")}</strong>
                        <div className="my-1 text-gray-400">to</div>
                        <strong>{String(snapshot.destination ?? "Destination unavailable")}</strong>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={"customer-status " + statusClass(booking.status ?? "unknown")}>{(booking.status ?? "unknown").replaceAll("_", " ")}</span>
                        <div className="mt-2 text-xs text-gray-500">Awaiting physical intake</div>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={"customer-status " + statusClass(booking.paymentReviewRequired ? "review_required" : paymentStatus)}>
                          {booking.paymentReviewRequired ? "review required" : paymentStatus.replaceAll("_", " ")}
                        </span>
                        {paymentStatus !== "paid" && !booking.paymentReviewRequired && (
                          <div className="mt-2">
                            <button
                              type="button"
                              className="customer-secondary-action"
                              disabled={payingBookingId !== "" || booking.status !== "confirmed"}
                              onClick={() => void initializePayment(booking)}
                            >
                              {payingBookingId === booking.bookingId ? "Connecting..." : "Pay now"}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-4">{formatDate(booking.createdAt)}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-gray-500">Booking confirmation and payment do not create a parcel identity or record physical custody. Those occur only when an authorized operator physically accepts the parcel.</p>
          </section>}

        <div className="flex flex-wrap gap-3">
          <Link href="/account/quotes" className="customer-secondary-action">View quotations <ArrowRight size={15} /></Link>
          <Link href="/account/shipments" className="customer-secondary-action">Prepare another shipment <ArrowRight size={15} /></Link>
          <Link href="/account" className="shipment-back-link"><ArrowLeft size={16} /> Back to my account</Link>
        </div>
      </div>
    </main>
  );
}
