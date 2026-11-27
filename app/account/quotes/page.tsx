"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type User } from "firebase/auth";
import { ArrowLeft, CheckCircle2, Clock3, FileText, UserRound } from "lucide-react";

import { auth } from "@/lib/firebase";
import { signOutCustomer } from "@/lib/customer-auth";
import { WorkspaceShell } from "@/components/design-system/WorkspaceShell";
import { customerWorkspaceNavigation } from "@/components/design-system/workspace-navigation";
import { Button } from "@/components/design-system/Button";
import { FeedbackState } from "@/components/design-system/FeedbackState";

type QuoteVersion = {
  versionId: string;
  sequence?: number;
  snapshot?: Record<string, unknown>;
  validUntil?: unknown;
};

type QuoteEvent = {
  eventId: string;
  action?: string;
  versionId?: string;
  bookingId?: string;
  reason?: string;
  timestamp?: unknown;
  handoverDeadlineAt?: unknown;
};

type ShipmentQuote = {
  quoteId: string;
  status: string;
  currentVersionId?: string;
  acceptedVersionId?: string;
  bookingId?: string;
  validUntil?: unknown;
  handoverDeadlineAt?: unknown;
  versions?: QuoteVersion[];
  events?: QuoteEvent[];
  currentVersion?: QuoteVersion;
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

function displayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "—";
}

export default function CustomerQuotesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [quotes, setQuotes] = useState<ShipmentQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadQuotes = useCallback(async (currentUser: User) => {
    setLoading(true);
    setError("");
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/account/shipment-quotes", {
        headers: { Authorization: "Bearer " + token },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? "Unable to load quotations.");
      setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load quotations.");
    } finally {
      setLoading(false);
    }
  }, []);

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
      void loadQuotes(currentUser);
    });
    return () => unsubscribe();
  }, [loadQuotes, router]);

  async function requestNewVersion(quote: ShipmentQuote, draftId: string, serviceCode: "standard" | "express" | "scheduled") {
    if (!user || !quote.currentVersionId || busyId) return;
    setBusyId(quote.quoteId);
    setError("");
    setNotice("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/account/shipment-quotes", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId, serviceCode, quoteId: quote.quoteId,
          expectedCurrentVersionId: quote.currentVersionId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to issue an updated quotation.");
      setNotice("A new immutable quotation version has been issued.");
      await loadQuotes(user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to issue an updated quotation.");
    } finally {
      setBusyId("");
    }
  }

  async function confirmBooking(quote: ShipmentQuote) {
    if (!user || !quote.acceptedVersionId || busyId || quote.bookingId) return;
    setBusyId(quote.quoteId);
    setError("");
    setNotice("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        "/api/account/shipment-quotes/" + encodeURIComponent(quote.quoteId) + "/booking",
        {
          method: "POST",
          headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({ acceptedVersionId: quote.acceptedVersionId }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? "Unable to confirm the shipment booking.");
      setNotice("Your booking has been confirmed. Physical parcel handover is a separate operational step.");
      await loadQuotes(user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to confirm the shipment booking.");
    } finally {
      setBusyId("");
    }
  }

  async function decide(quote: ShipmentQuote, decision: "accept" | "reject") {
    if (!user || !quote.currentVersionId || busyId) return;
    let reason: string | undefined;
    if (decision === "reject") {
      reason = window.prompt("Please provide a reason for rejecting this quotation.") ?? undefined;
      if (!reason?.trim()) return;
    }
    setBusyId(quote.quoteId);
    setError("");
    setNotice("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/account/shipment-quotes/" + encodeURIComponent(quote.quoteId), {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedCurrentVersionId: quote.currentVersionId,
          decision,
          ...(reason ? { reason } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to record your decision.");
      setNotice(decision === "accept"
        ? "Quotation accepted. Your accepted terms are preserved; shipment booking handoff is a separate step."
        : "Quotation rejected. The quotation and its history remain available.");
      await loadQuotes(user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to record your decision.");
    } finally {
      setBusyId("");
    }
  }

  async function handleWorkspaceSignOut() {
    await signOutCustomer();
    router.replace("/account/sign-in");
  }

  if (checking || !user) {
    return (
      <main className="vl-workspace">
        <div className="vl-workspace__content">
          <FeedbackState variant="loading" title="Checking your customer account" description="Verifying your sign-in before opening your workspace." />
        </div>
      </main>
    );
  }

  return (
    <WorkspaceShell
      workspaceName="VeriLyft"
      workspaceLabel="Customer"
      navigation={customerWorkspaceNavigation}
      breadcrumbs={[{ label: "Customer", href: "/account" }, { label: "Quotations" }]}
      topbarContent={
        <div className="vl-workspace__account-actions">
          <span>{user.email}</span>
          <Button variant="outline" size="sm" onClick={handleWorkspaceSignOut}>Sign out</Button>
        </div>
      }
    >
      <div className="customer-page">
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
          <span className="eyebrow">VERILYFT / COMMERCIAL QUOTATIONS</span>
          <h1>Your shipment <em>quotations.</em></h1>
          <p>Review the exact quotation version issued to you. Acceptance or rejection is recorded against that version.</p>
        </div>

        {error && <p className="customer-error" role="alert">{error}</p>}
        {notice && <p className="shipment-success" role="status">{notice}</p>}

        {loading ? <section className="customer-panel"><p>Loading your quotations...</p></section>
          : quotes.length === 0 ? <section className="customer-panel">
            <div className="customer-panel-heading"><div><span className="section-label">01 / QUOTATION HISTORY</span><h2>No quotations issued</h2></div><FileText size={22} /></div>
            <p>No customer quotations are currently available on this account. A saved shipment draft is not a quotation.</p>
            <Link href="/account/shipments" className="customer-primary-action">View shipment drafts</Link>
          </section>
          : <div className="cost-version-list">
            {quotes.map((quote) => {
              const version = quote.currentVersion ?? quote.versions?.find((item) => item.versionId === quote.currentVersionId);
              const snapshot = version?.snapshot ?? {};
              const pricing = (snapshot.pricing ?? snapshot.evaluation ?? {}) as Record<string, unknown>;
              const quoteTerms = (snapshot.quoteTerms ?? {}) as Record<string, unknown>;
              const rounding = (pricing.rounding ?? {}) as Record<string, unknown>;
              const components = Array.isArray(pricing.components) ? pricing.components as Array<Record<string, unknown>> : [];
              const status = quote.status ?? "unknown";
              const canDecide = status === "issued" && quote.currentVersionId;
              const draftId = typeof snapshot.draftId === "string" ? snapshot.draftId : null;
              const serviceCode = ["standard", "express", "scheduled"].includes(String(snapshot.serviceCode))
                ? snapshot.serviceCode as "standard" | "express" | "scheduled" : null;
              const canReissue = Boolean(draftId && serviceCode && status !== "accepted" && quote.currentVersionId);
              return (
                <section className="customer-panel" key={quote.quoteId} style={{ marginBottom: 18 }}>
                  <div className="customer-panel-heading">
                    <div><span className="section-label">QUOTATION / {quote.quoteId}</span><h2>{displayValue(snapshot.serviceName ?? snapshot.serviceCode ?? "Shipment quotation")}</h2></div>
                    <span className={"customer-status " + (status === "accepted" || status === "booked" ? "customer-status-success" : status === "rejected" || status === "expired" ? "customer-status-cancelled" : "customer-status-pending")}>{status.replaceAll("_", " ")}</span>
                  </div>
                  <p>Version {version?.sequence ?? "—"} · Valid until {formatDate(quote.validUntil ?? version?.validUntil)}</p>
                  {quoteTerms.handoverWindowMinutes !== undefined && <p>Physical handover window after acceptance: {displayValue(quoteTerms.handoverWindowMinutes)} minutes.</p>}
                  <div className="cost-version-list">
                    {snapshot.origin !== undefined && <div className="cost-version-row"><strong>Origin</strong><span>{displayValue(snapshot.origin)}</span></div>}
                    {snapshot.destination !== undefined && <div className="cost-version-row"><strong>Destination</strong><span>{displayValue(snapshot.destination)}</span></div>}
                    {components.map((component, index) => <div className="cost-version-row" key={String(component.key ?? index)}><strong>{displayValue(component.label ?? component.key)}</strong><span>{displayValue(component.value)} {displayValue(component.unit)}</span></div>)}
                  </div>
                  {pricing.total !== undefined && <p><strong>Total: {displayValue(pricing.total)} {displayValue(pricing.unit ?? pricing.currency)}</strong></p>}
                  {rounding.mode !== undefined && <p className="text-sm text-gray-600">Total rounding: {displayValue(rounding.mode)} · {displayValue(rounding.decimalPlaces)} decimal places.</p>}
                  {status === "accepted" && <p><CheckCircle2 size={16} /> Accepted version: {quote.acceptedVersionId ?? "—"} · Handover deadline: {formatDate(quote.handoverDeadlineAt)}</p>}
                  {quote.bookingId && <p><CheckCircle2 size={16} /> Booking confirmed · Booking reference: {quote.bookingId}</p>}
                  {(quote.versions?.length ?? 0) > 1 && <div className="cost-field cost-field-wide">
                    <strong>Quotation version history</strong>
                    <div className="cost-version-list">
                      {quote.versions?.map((item) => <div className="cost-version-row" key={item.versionId}>
                        <strong>Version {item.sequence ?? "—"}</strong>
                        <span>{formatDate(item.validUntil)}</span>
                        <small>{item.versionId === quote.currentVersionId ? "Current version" : item.versionId === quote.acceptedVersionId ? "Accepted version" : "Previous version"}</small>
                      </div>)}
                    </div>
                  </div>}
                  {(quote.events?.length ?? 0) > 0 && <div className="cost-field cost-field-wide">
                    <strong>Quotation activity history</strong>
                    <div className="cost-version-list">
                      {quote.events?.map((event) => (
                        <div className="cost-version-row" key={event.eventId}>
                          <strong>{String(event.action ?? "updated").replaceAll("_", " ")}</strong>
                          <span>{formatDate(event.timestamp)}</span>
                          <small>
                            {event.versionId ? `Version reference: ${event.versionId}` : ""}
                            {event.bookingId ? ` · Booking reference: ${event.bookingId}` : ""}
                            {event.reason ? ` · Reason: ${event.reason}` : ""}
                            {event.handoverDeadlineAt ? ` · Handover deadline: ${formatDate(event.handoverDeadlineAt)}` : ""}
                          </small>
                        </div>
                      ))}
                    </div>
                  </div>}
                  {(canDecide || canReissue) && <div className="cost-form-actions" style={{ flexWrap: "wrap" }}>
                    {canDecide && <>
                      <button className="cost-primary-button" type="button" disabled={busyId === quote.quoteId} onClick={() => void decide(quote, "accept")}>{busyId === quote.quoteId ? "Saving..." : "Accept quotation"}</button>
                      <button className="cost-secondary-button" type="button" disabled={busyId === quote.quoteId} onClick={() => void decide(quote, "reject")}>Reject quotation</button>
                    </>}
                    {canReissue && <button className="cost-secondary-button" type="button" disabled={busyId === quote.quoteId} onClick={() => void requestNewVersion(quote, draftId!, serviceCode!)}>{busyId === quote.quoteId ? "Issuing..." : "Request updated quotation"}</button>}
                    {status === "accepted" && !quote.bookingId && <button className="cost-primary-button" type="button" disabled={busyId === quote.quoteId || !quote.acceptedVersionId} onClick={() => void confirmBooking(quote)}>{busyId === quote.quoteId ? "Confirming..." : "Confirm shipment booking"}</button>}
                  </div>}
                  <p className="cost-footer-note">Quotation acceptance does not record payment or physical parcel handover. Booking confirmation is handled by the separate booking handoff.</p>
                </section>
              );
            })}
          </div>}
        <section className="customer-panel" style={{ marginTop: 20 }}>
          <div className="customer-panel-heading"><div><span className="section-label">02 / TERMS & HISTORY</span><h2>Version and validity safeguards</h2></div><Clock3 size={22} /></div>
          <p>Each decision is bound to the current immutable quotation version. Expired quotations cannot be accepted; a new version is required. Earlier versions remain in the quotation record.</p>
        </section>
      </div>
    </div>
    </WorkspaceShell>
  );
}
