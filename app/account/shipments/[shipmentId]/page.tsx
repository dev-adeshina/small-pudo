"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { ArrowLeft, FileText, MapPin, Package, Truck, UserRound } from "lucide-react";

import { auth } from "@/lib/firebase";
import { signOutCustomer } from "@/lib/customer-auth";
import { WorkspaceShell } from "@/components/design-system/WorkspaceShell";
import { customerWorkspaceNavigation } from "@/components/design-system/workspace-navigation";
import { Button } from "@/components/design-system/Button";
import { FeedbackState } from "@/components/design-system/FeedbackState";
import { StatusBadge } from "@/components/design-system/StatusBadge";

type ShipmentDetail = {
  shipmentId: string; shipmentReference: string; serviceType: string; status: string;
  createdAt: string; submittedAt: string; sender: Record<string, string | null>;
  recipient: Record<string, string | null>; origin: Record<string, string>;
  destination: Record<string, string>; parcels: Array<Record<string, unknown>>;
  events: Array<{ eventId: string; eventType: string; summary: string; occurredAt: string; visibility: string[] }>;
  documents: Array<{ documentId: string; documentType: string; version: number; generatedAt: string; access: string[] }>;
  paymentStatus?: string;
  currentQuote?: { revisionId: string; revisionNumber: number; totalMinor: number; currency: string; validUntil: string; lineItems: Array<{ code: string; description: string; amountMinor: number }> } | null;
};

function pretty(value: string) { return value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()); }
function date(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not available" : new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}
function endpoint(value: Record<string, string>) {
  return value.type === "pudo"
    ? [value.locationName ?? "PUDO location", value.address, value.city, value.state].filter(Boolean).join(", ")
    : [value.addressDescription, value.city, value.state, value.country].filter(Boolean).join(", ");
}

export default function CustomerShipmentDetailPage() {
  const router = useRouter();
  const params = useParams<{ shipmentId: string }>();
  const shipmentId = params.shipmentId;
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const paymentIdempotencyKey = useRef<string | null>(null);

  const load = useCallback(async (currentUser: User) => {
    setLoading(true); setError("");
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/account/shipments/${encodeURIComponent(shipmentId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? "Unable to retrieve this shipment.");
      setShipment(data.shipment);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to retrieve this shipment.");
    } finally { setLoading(false); }
  }, [shipmentId]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      if (!currentUser) { router.replace("/account/sign-in"); return; }
      if (!currentUser.emailVerified) { void signOutCustomer().finally(() => router.replace("/account/sign-in")); return; }
      setUser(currentUser); setChecking(false); void load(currentUser);
    });
    return () => unsubscribe();
  }, [load, router]);

  async function startPayment() {
    if (!user || paymentBusy) return;
    setPaymentBusy(true); setPaymentError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/account/shipments/${encodeURIComponent(shipmentId)}/payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": paymentIdempotencyKey.current ?? (paymentIdempotencyKey.current = crypto.randomUUID()),
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success || typeof data.authorizationUrl !== "string") {
        paymentIdempotencyKey.current = null;
        throw new Error(data.error ?? "Unable to initialize payment.");
      }
      window.location.assign(data.authorizationUrl);
    } catch (cause) {
      setPaymentError(cause instanceof Error ? cause.message : "Unable to initialize payment.");
      setPaymentBusy(false);
    }
  }

  async function signOut() { await signOutCustomer(); router.replace("/account/sign-in"); }

  if (checking || !user) return <main className="vl-workspace"><div className="vl-workspace__content"><FeedbackState variant="loading" title="Checking your customer account" description="Verifying your sign-in before opening shipment tracking." /></div></main>;

  return (
    <WorkspaceShell workspaceName="VeriLyft" workspaceLabel="Customer" navigation={customerWorkspaceNavigation}
      breadcrumbs={[{ label: "Customer", href: "/account" }, { label: "Shipment history", href: "/account/shipment-history" }, { label: shipment?.shipmentReference ?? "Shipment details" }]}
      topbarContent={<div className="vl-workspace__account-actions"><span>{user.email}</span><Button variant="outline" size="sm" onClick={signOut}>Sign out</Button></div>}>
      <div className="customer-page"><div className="customer-shell shipment-shell">
        <p><Link href="/account/shipment-history" className="customer-secondary-action"><ArrowLeft size={15}/> Back to shipment history</Link></p>
        {error && <p className="customer-error" role="alert">{error}</p>}
        {loading ? <section className="customer-panel"><p>Loading shipment details...</p></section> : shipment ? <>
          <div className="shipment-heading"><span className="eyebrow">SHIPMENT TRACKING / {shipment.shipmentReference}</span><h1>{shipment.shipmentReference}</h1><p>{pretty(shipment.serviceType)} · Submitted {date(shipment.submittedAt || shipment.createdAt)}</p><StatusBadge label={shipment.status} tone={shipment.status === "Delivered" ? "success" : "neutral"}/></div>
          {shipment.currentQuote && <section className="customer-panel">
            <div className="customer-panel-heading"><div><span className="section-label">CURRENT QUOTATION · REVISION {shipment.currentQuote.revisionNumber}</span><h2>{new Intl.NumberFormat("en-NG", { style: "currency", currency: shipment.currentQuote.currency }).format(shipment.currentQuote.totalMinor / 100)}</h2></div></div>
            <p>Valid until {date(shipment.currentQuote.validUntil)}</p>
            {shipment.currentQuote.lineItems?.map((line, index) => <p key={line.code + index}>{line.description}: {new Intl.NumberFormat("en-NG", { style: "currency", currency: shipment.currentQuote!.currency }).format(line.amountMinor / 100)}</p>)}
            {shipment.status === "Awaiting Payment" && <div className="shipment-form-actions"><Button loading={paymentBusy} onClick={() => void startPayment()}>Pay now</Button></div>}
            {shipment.status === "Confirmed" && <p>Payment verified. Your shipment booking is confirmed.</p>}
            {paymentError && <p className="customer-error" role="alert">{paymentError}</p>}
          </section>}
          <section className="customer-panel"><div className="customer-panel-heading"><div><span className="section-label">01 / ROUTE</span><h2>Shipment endpoints</h2></div><MapPin size={22}/></div>
            <p><strong>Origin:</strong> {endpoint(shipment.origin)}</p><p><strong>Destination:</strong> {endpoint(shipment.destination)}</p>
          </section>
          <section className="customer-panel"><div className="customer-panel-heading"><div><span className="section-label">02 / PARTIES</span><h2>Sender and recipient</h2></div><UserRound size={22}/></div>
            <div className="customer-content-grid"><div><h3>Sender</h3><p>{shipment.sender.fullName}</p><p>{shipment.sender.phone}</p><p>{shipment.sender.email}</p></div><div><h3>Recipient</h3><p>{shipment.recipient.fullName}</p><p>{shipment.recipient.phone}</p><p>{shipment.recipient.email}</p></div></div>
          </section>
          <section className="customer-panel"><div className="customer-panel-heading"><div><span className="section-label">03 / PARCELS</span><h2>Parcel information</h2></div><Package size={22}/></div>
            {(shipment.parcels ?? []).map((parcel, index) => <article className="shipment-draft-row" key={String(parcel.parcelId ?? index)}><div><strong>{String(parcel.description ?? "Parcel")}</strong><p>Quantity: {String(parcel.quantity ?? 1)} · Declared weight: {String(parcel.declaredWeight ?? "—")} {String(parcel.weightUnit ?? "")}</p><p>Dimensions: {String((parcel.dimensions as Record<string, unknown> | undefined)?.length ?? "—")} × {String((parcel.dimensions as Record<string, unknown> | undefined)?.width ?? "—")} × {String((parcel.dimensions as Record<string, unknown> | undefined)?.height ?? "—")} {String((parcel.dimensions as Record<string, unknown> | undefined)?.unit ?? "")}</p></div></article>)}
          </section>
          <section className="customer-panel"><div className="customer-panel-heading"><div><span className="section-label">04 / TRACKING</span><h2>Shipment timeline</h2></div><Truck size={22}/></div>
            {(shipment.events ?? []).length === 0 ? <p>No tracking events have been recorded yet.</p> : <div className="shipment-draft-list">{shipment.events.map(event => <article className="shipment-draft-row" key={event.eventId}><div><span className="shipment-draft-status">{pretty(event.eventType)}</span><strong>{event.summary}</strong><small>{date(event.occurredAt)}</small></div></article>)}</div>}
          </section>
          <section className="customer-panel"><div className="customer-panel-heading"><div><span className="section-label">05 / DOCUMENTS</span><h2>Shipment documents</h2></div><FileText size={22}/></div>
            {(shipment.documents ?? []).length === 0 ? <p>Documents will appear here when they are issued for your shipment.</p> : (shipment.documents ?? []).map(document => <article className="shipment-draft-row" key={document.documentId}><div><strong>{pretty(document.documentType)}</strong><small>Version {document.version} · {date(document.generatedAt)}</small></div></article>)}
          </section>
        </> : <section className="customer-panel"><h2>Shipment not found</h2><p>This shipment is unavailable or does not belong to your customer account.</p></section>}
      </div></div>
    </WorkspaceShell>
  );
}
