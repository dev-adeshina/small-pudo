"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { CheckCircle2, FileText, UserRound } from "lucide-react";

import { auth } from "@/lib/firebase";
import { signOutCustomer } from "@/lib/customer-auth";
import { WorkspaceShell } from "@/components/design-system/WorkspaceShell";
import { customerWorkspaceNavigation } from "@/components/design-system/workspace-navigation";
import { Button } from "@/components/design-system/Button";
import { FeedbackState } from "@/components/design-system/FeedbackState";
import { StatusBadge } from "@/components/design-system/StatusBadge";

type Quote = {
  quoteId: string; shipmentId: string; shipmentReference: string;
  shipmentStatus: string; accepted: boolean;
  revision: {
    revisionId: string; revisionNumber: number; currency: string;
    totalMinor: number; validUntil: string; issuedAt: string;
    distanceKm: number; lineItems: Array<{ code: string; description: string; amountMinor: number }>;
  };
};

function money(amountMinor: number, currency: string) {
  try { return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(amountMinor / 100); }
  catch { return `${currency} ${(amountMinor / 100).toFixed(2)}`; }
}
function date(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not available" : new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

export default function CustomerQuotesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setNow(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const load = useCallback(async (currentUser: User) => {
    setLoading(true); setError("");
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/account/quotes", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? "Unable to load your quotations.");
      setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load your quotations.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      if (!currentUser) { router.replace("/account/sign-in"); return; }
      if (!currentUser.emailVerified) { void signOutCustomer().finally(() => router.replace("/account/sign-in")); return; }
      setUser(currentUser); setChecking(false); void load(currentUser);
    });
    return () => unsubscribe();
  }, [load, router]);

  async function accept(quote: Quote) {
    if (!user || busyId || quote.accepted) return;
    setBusyId(quote.quoteId); setError(""); setNotice("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/account/quotes/${encodeURIComponent(quote.quoteId)}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Idempotency-Key": `quote_accept_${quote.revision.revisionId}` },
        body: JSON.stringify({ shipmentId: quote.shipmentId, revisionId: quote.revision.revisionId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? "Unable to accept this quotation.");
      setNotice("Quotation accepted. Your shipment is now awaiting payment.");
      await load(user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to accept this quotation.");
    } finally { setBusyId(""); }
  }

  async function signOut() { await signOutCustomer(); router.replace("/account/sign-in"); }

  if (checking || !user) return <main className="vl-workspace"><div className="vl-workspace__content"><FeedbackState variant="loading" title="Checking your customer account" description="Verifying your sign-in before opening quotations." /></div></main>;

  return (
    <WorkspaceShell workspaceName="VeriLyft" workspaceLabel="Customer" navigation={customerWorkspaceNavigation}
      breadcrumbs={[{ label: "Customer", href: "/account" }, { label: "Quotations" }]}
      topbarContent={<div className="vl-workspace__account-actions"><span>{user.email}</span><Button variant="outline" size="sm" onClick={signOut}>Sign out</Button></div>}>
      <div className="customer-page"><div className="customer-shell shipment-shell">
        <div className="shipment-heading"><span className="eyebrow">VERILYFT / COMMERCIAL QUOTATIONS</span><h1>Your shipment <em>quotations.</em></h1><p>Review the latest quotation issued for each submitted shipment. Acceptance is recorded against the exact current revision.</p></div>
        {error && <p className="customer-error" role="alert">{error}</p>}
        {notice && <p className="shipment-success" role="status">{notice}</p>}
        <section className="customer-panel">
          <div className="customer-panel-heading"><div><span className="section-label">QUOTE HISTORY</span><h2>Available quotations</h2></div><span className="customer-order-count">{quotes.length} quotations</span></div>
          {loading ? <p>Loading quotations...</p> : quotes.length === 0 ? <div className="customer-state"><FileText size={26}/><h3>No quotations yet</h3><p>When Admin reviews a submitted shipment and issues a quotation, it will appear here.</p><Link href="/account/shipment-history" className="customer-secondary-action">View shipment history</Link></div> :
            <div className="shipment-draft-list">{quotes.map(quote => {
              const expired = now !== null && Date.parse(quote.revision.validUntil) <= now;
              const accepted = quote.accepted || quote.shipmentStatus === "Awaiting Payment" || quote.shipmentStatus === "Confirmed";
              return <article className="shipment-draft-row" key={quote.quoteId}>
                <div><span className="shipment-draft-status">{quote.shipmentReference} · Revision {quote.revision.revisionNumber}</span>
                  <strong>{money(quote.revision.totalMinor, quote.revision.currency)} <StatusBadge label={accepted ? "Accepted" : expired ? "Expired" : "Awaiting decision"} tone={accepted ? "success" : expired ? "warning" : "neutral"}/></strong>
                  <p>Issued {date(quote.revision.issuedAt)} · Valid until {date(quote.revision.validUntil)}</p>
                  <p>Distance used for pricing: {quote.revision.distanceKm} km</p>
                  <div>{quote.revision.lineItems?.map((line,index) => <p key={line.code + index}>{line.description}: {money(line.amountMinor, quote.revision.currency)}</p>)}</div>
                  <small>Shipment status: {quote.shipmentStatus}</small>
                  {accepted && <p><CheckCircle2 size={15}/> Accepted quotation. Payment is the next step.</p>}
                  {!accepted && !expired && quote.shipmentStatus === "Quoted" && <Button size="sm" loading={busyId === quote.quoteId} onClick={() => void accept(quote)}>Accept quotation</Button>}
                </div>
                <Link href={`/account/shipments/${encodeURIComponent(quote.shipmentId)}`} className="customer-secondary-action">View shipment</Link>
              </article>;
            })}</div>}
        </section>
        <p><Link href="/account" className="customer-secondary-action"><UserRound size={15}/> Back to customer dashboard</Link></p>
      </div></div>
    </WorkspaceShell>
  );
}
