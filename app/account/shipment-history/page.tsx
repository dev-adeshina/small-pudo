"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { ArrowRight, Package, Truck, UserRound } from "lucide-react";

import { auth } from "@/lib/firebase";
import { signOutCustomer } from "@/lib/customer-auth";
import { WorkspaceShell } from "@/components/design-system/WorkspaceShell";
import { customerWorkspaceNavigation } from "@/components/design-system/workspace-navigation";
import { Button } from "@/components/design-system/Button";
import { FeedbackState } from "@/components/design-system/FeedbackState";
import { StatusBadge } from "@/components/design-system/StatusBadge";

type Shipment = {
  shipmentId: string;
  shipmentReference: string;
  serviceType: string;
  status: string;
  createdAt: string;
  origin: { type: string; pudoLocationId?: string; city?: string };
  destination: { type: string; pudoLocationId?: string; city?: string };
  parcels: Array<{ description: string; quantity: number }>;
  events: Array<{ eventId: string; eventType: string; summary: string; occurredAt: string }>;
};

function pretty(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function date(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

export default function CustomerShipmentHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (currentUser: User) => {
    setLoading(true); setError("");
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/account/shipments", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? "Unable to load shipment history.");
      setShipments(Array.isArray(data.shipments) ? data.shipments : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load shipment history.");
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

  async function signOut() { await signOutCustomer(); router.replace("/account/sign-in"); }

  if (checking || !user) return <main className="vl-workspace"><div className="vl-workspace__content"><FeedbackState variant="loading" title="Checking your customer account" description="Verifying your sign-in before opening shipment history." /></div></main>;

  return (
    <WorkspaceShell workspaceName="VeriLyft" workspaceLabel="Customer" navigation={customerWorkspaceNavigation}
      breadcrumbs={[{ label: "Customer", href: "/account" }, { label: "Shipment history" }]}
      topbarContent={<div className="vl-workspace__account-actions"><span>{user.email}</span><Button variant="outline" size="sm" onClick={signOut}>Sign out</Button></div>}>
      <div className="customer-page"><div className="customer-shell shipment-shell">
        <div className="shipment-heading"><span className="eyebrow">VERILYFT / CUSTOMER SHIPMENTS</span><h1>Shipment <em>history.</em></h1><p>Review submitted shipments, current status and the latest recorded progress.</p></div>
        {error && <p className="customer-error" role="alert">{error}</p>}
        <section className="customer-panel">
          <div className="customer-panel-heading"><div><span className="section-label">YOUR SHIPMENTS</span><h2>Shipment records</h2></div><span className="customer-order-count">{shipments.length} shipments</span></div>
          {loading ? <p>Loading your shipments...</p> : shipments.length === 0 ? <div className="customer-state"><Package size={26}/><h3>No shipments submitted yet</h3><p>Your submitted shipments and tracking updates will appear here.</p><Link href="/account/shipments/new" className="customer-secondary-action">Create a shipment <ArrowRight size={16}/></Link></div> :
            <div className="shipment-draft-list">{shipments.map(shipment => {
              const latest = shipment.events?.[shipment.events.length - 1];
              return <article className="shipment-draft-row" key={shipment.shipmentId}>
                <div><span className="shipment-draft-status">{shipment.shipmentReference}</span><strong>{pretty(shipment.serviceType)} <StatusBadge label={shipment.status} tone={shipment.status === "Delivered" ? "success" : "neutral"}/></strong>
                  <p>{shipment.parcels?.map(parcel => parcel.description).join(", ") || "Parcel details unavailable"}</p>
                  <small>Submitted {date(shipment.createdAt)}</small>
                  {latest && <p><Truck size={14}/> Latest update: {latest.summary} · {date(latest.occurredAt)}</p>}
                </div>
                <Link href={`/account/shipments/${encodeURIComponent(shipment.shipmentId)}`} className="customer-secondary-action">Track shipment <ArrowRight size={16}/></Link>
              </article>;
            })}</div>}
        </section>
        <p><Link href="/account" className="customer-secondary-action"><UserRound size={15}/> Back to dashboard</Link></p>
      </div></div>
    </WorkspaceShell>
  );
}
