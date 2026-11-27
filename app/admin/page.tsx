"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  CalendarCheck,
  FileStack,
  Headset,
  Receipt,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  Home,
  LogOut,
  MapPinned,
  Package,
  Route,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Tags,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import { auth } from "@/lib/firebase";
import { logoutAdmin } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/admin-auth";
import { WorkspaceShell } from "@/components/design-system/WorkspaceShell";
import { PageHeader } from "@/components/design-system/PageHeader";
import { Button } from "@/components/design-system/Button";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { FeedbackState } from "@/components/design-system/FeedbackState";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";

type StoreOrder = {
  id: string;
  customer: { name?: string; email?: string; phone?: string } | null;
  items: Array<{ name?: string; quantity?: number }>;
  total: number;
  currency: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string | null;
};

const storeNavigation = [
  { label: "Store orders", href: "/admin/orders", section: "STORE", icon: ShoppingBag },
  { label: "Products", href: "/admin/products", section: "STORE", icon: Package },
  { label: "Categories", href: "/admin/categories", section: "STORE", icon: Tags },
];

const commercialNavigation = [
  { label: "Pricing definitions", href: "/admin/commercial-pricing-definitions", section: "COMMERCIAL", icon: Wallet },
  { label: "Operational costs", href: "/admin/operational-cost-definitions", section: "COMMERCIAL", icon: Settings2 },
  { label: "Route distance evidence", href: "/admin/commercial-route-distance", section: "COMMERCIAL", icon: Route },
];

const plannedAreas = [
  { title: "Customers", description: "Customer profiles, shipment history and authorised account details.", icon: Users },
  { title: "Shipments", description: "Review and manage shipment requests across all approved channels.", icon: Package },
  { title: "Bookings", description: "Confirmed shipment bookings and their payment and fulfilment state.", icon: CalendarCheck },
  { title: "Transactions", description: "Store and shipment payment records, provider references and outcomes.", icon: Receipt },
  { title: "PUDO network", description: "Partner locations, verification, station personnel and operational readiness.", icon: MapPinned },
  { title: "Routing & delivery", description: "Collection, delivery and transfer assignments with operational progress.", icon: Truck },
  { title: "Messages & support", description: "Shipment conversations and basic customer enquiry or complaint cases.", icon: Headset },
  { title: "Documents", description: "Quotations, receipts, waybills, intake receipts and delivery confirmations.", icon: FileStack },
  { title: "Notifications", description: "Payment and delivery notifications, delivery state and failures.", icon: Bell },
];

function formatMoney(amount: number, currency = "NGN") {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-NG")}`;
  }
}

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function orderTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  const value = status.toLowerCase();
  if (["delivered", "paid"].includes(value)) return "success";
  if (["pending", "processing", "confirmed"].includes(value)) return "warning";
  if (["cancelled", "failed", "refunded"].includes(value)) return "danger";
  if (["shipped", "ready_for_shipping"].includes(value)) return "info";
  return "neutral";
}

function readableStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<User | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const loadOrders = useCallback(async (currentUser: User, quiet = false) => {
    if (quiet) setRefreshing(true);
    else setOrdersLoading(true);
    setOrdersError("");

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Unable to load recent store orders.");
      }
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (cause) {
      setOrdersError(cause instanceof Error ? cause.message : "Unable to load recent store orders.");
    } finally {
      setOrdersLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        router.replace("/admin/sign-in");
        return;
      }
      if (!user.emailVerified) {
        router.replace(`/admin/verify-email?email=${encodeURIComponent(user.email ?? "")}`);
        return;
      }

      try {
        const email = await verifyAdminAccess(user);
        if (!active) return;
        setAdmin(user);
        setAdminEmail(email);
        setCheckingAuth(false);
        void loadOrders(user);
      } catch (error) {
        if (!active) return;
        if (error instanceof Error && error.name === "NotAdmin") {
          router.replace("/account");
          return;
        }
        router.replace("/admin/sign-in");
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadOrders, router]);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logoutAdmin();
      router.replace("/admin/sign-in");
    } finally {
      setSigningOut(false);
    }
  }

  const summary = useMemo(() => {
    const awaitingPayment = orders.filter((order) => order.paymentStatus.toLowerCase() === "pending").length;
    const paid = orders.filter((order) => order.paymentStatus.toLowerCase() === "paid").length;
    const inProgress = orders.filter((order) => ["confirmed", "processing", "ready_for_shipping", "shipped"].includes(order.orderStatus.toLowerCase())).length;
    const customers = new Set(
      orders.map((order) => order.customer?.email || order.customer?.phone || order.customer?.name).filter(Boolean)
    ).size;
    return { awaitingPayment, paid, inProgress, customers };
  }, [orders]);

  const firstName = admin?.displayName?.trim().split(/\s+/)[0] || adminEmail.split("@")[0] || "Administrator";
  const today = new Intl.DateTimeFormat("en-NG", { dateStyle: "full" }).format(new Date());

  if (checkingAuth) {
    return <main className="admin-loading"><span>Verifying administrator access...</span></main>;
  }

  return (
    <WorkspaceShell
      workspaceName="VeriLyft"
      workspaceLabel="Admin workspace"
      navigation={[
        { label: "Dashboard", href: "/admin", section: "OVERVIEW", icon: Home },
        ...storeNavigation,
        ...commercialNavigation,
      ]}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Admin", href: "/admin" },
        { label: "Dashboard" },
      ]}
      topbarContent={
        <div className="vl-admin-topbar">
          <span className="vl-admin-identity" title={adminEmail}>{adminEmail}</span>
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<LogOut size={16} />}
            onClick={handleLogout}
            loading={signingOut}
            aria-label="Sign out"
          >
            Sign out
          </Button>
        </div>
      }
    >
      <div className="vl-admin-dashboard">
        <PageHeader
          eyebrow="ADMINISTRATION"
          title={`Good to see you, ${firstName}.`}
          description="A clear view of the store operations already available and the operational workspaces being brought online."
          actions={
            <Button
              variant="secondary"
              leadingIcon={<Activity size={16} />}
              onClick={() => admin && void loadOrders(admin, true)}
              loading={refreshing}
            >
              Refresh overview
            </Button>
          }
        />

        <div className="vl-admin-date-line">
          <span><ShieldCheck size={15} /> Verified administrator session</span>
          <time>{today}</time>
        </div>

        <section className="vl-admin-metrics" aria-label="Recent store order summary">
          <article className="vl-admin-metric">
            <span>STORE ORDERS LOADED</span>
            <strong>{ordersLoading ? "—" : ordersError ? "—" : orders.length}</strong>
            <small>Latest records returned (up to 100)</small>
            <ShoppingBag size={19} />
          </article>
          <article className="vl-admin-metric">
            <span>AWAITING PAYMENT</span>
            <strong>{ordersLoading || ordersError ? "—" : summary.awaitingPayment}</strong>
            <small>Within the loaded store orders</small>
            <Clock3 size={19} />
          </article>
          <article className="vl-admin-metric">
            <span>PAID STORE ORDERS</span>
            <strong>{ordersLoading || ordersError ? "—" : summary.paid}</strong>
            <small>Within the loaded store orders</small>
            <CheckCircle2 size={19} />
          </article>
          <article className="vl-admin-metric">
            <span>CUSTOMERS IN RECENT ORDERS</span>
            <strong>{ordersLoading || ordersError ? "—" : summary.customers}</strong>
            <small>Distinct contacts in loaded records</small>
            <Users size={19} />
          </article>
        </section>

        <section className="vl-admin-main-grid">
          <SurfaceCard className="vl-admin-recent-orders">
            <div className="vl-admin-section-heading">
              <div>
                <span className="vl-admin-section-label">STORE OPERATIONS</span>
                <h2>Recent store orders</h2>
                <p>Store orders remain separate from shipment bookings.</p>
              </div>
              <Link href="/admin/orders" className="vl-admin-text-link">View all <ArrowUpRight size={15} /></Link>
            </div>

            {ordersError ? (
              <FeedbackState
                variant="error"
                title="Recent orders could not be loaded"
                description={ordersError}
                action={
                  <Button size="sm" variant="secondary" onClick={() => admin && void loadOrders(admin)}>
                    Try again
                  </Button>
                }
              />
            ) : ordersLoading ? (
              <FeedbackState variant="loading" title="Loading recent store orders..." />
            ) : orders.length === 0 ? (
              <FeedbackState
                variant="empty"
                title="No store orders to display"
                description="New store orders will appear here when they are recorded."
              />
            ) : (
              <div className="vl-admin-order-list">
                {orders.slice(0, 6).map((order) => (
                  <Link href="/admin/orders" className="vl-admin-order-row" key={order.id}>
                    <span className="vl-admin-order-icon"><Package size={17} /></span>
                    <span className="vl-admin-order-main">
                      <strong>{order.id}</strong>
                      <small>{order.customer?.name || order.customer?.email || "Customer details unavailable"} · {formatDate(order.createdAt)}</small>
                    </span>
                    <span className="vl-admin-order-state">
                      <StatusBadge label={readableStatus(order.orderStatus)} tone={orderTone(order.orderStatus)} />
                      <small>{readableStatus(order.paymentStatus)}</small>
                    </span>
                    <strong className="vl-admin-order-total">{formatMoney(order.total, order.currency)}</strong>
                  </Link>
                ))}
              </div>
            )}
            <div className="vl-admin-list-footnote">Summary is based on the latest 100 store orders returned by the existing Admin orders service.</div>
          </SurfaceCard>

          <aside className="vl-admin-side-column">
            <SurfaceCard>
              <div className="vl-admin-section-heading">
                <div>
                  <span className="vl-admin-section-label">QUICK ACCESS</span>
                  <h2>Store management</h2>
                </div>
              </div>
              <div className="vl-admin-quick-links">
                <Link href="/admin/orders"><ShoppingBag size={17} /><span>Manage store orders</span><ArrowUpRight size={15} /></Link>
                <Link href="/admin/products"><Package size={17} /><span>Manage products</span><ArrowUpRight size={15} /></Link>
                <Link href="/admin/categories"><Tags size={17} /><span>Manage categories</span><ArrowUpRight size={15} /></Link>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <div className="vl-admin-section-heading">
                <div>
                  <span className="vl-admin-section-label">COMMERCIAL CONTROLS</span>
                  <h2>Pricing & evidence</h2>
                </div>
              </div>
              <div className="vl-admin-quick-links">
                <Link href="/admin/commercial-pricing-definitions"><Wallet size={17} /><span>Pricing definitions</span><ArrowUpRight size={15} /></Link>
                <Link href="/admin/operational-cost-definitions"><Settings2 size={17} /><span>Operational costs</span><ArrowUpRight size={15} /></Link>
                <Link href="/admin/commercial-route-distance"><Route size={17} /><span>Route distance evidence</span><ArrowUpRight size={15} /></Link>
              </div>
            </SurfaceCard>
          </aside>
        </section>

        <section className="vl-admin-planned-section">
          <div className="vl-admin-section-heading">
            <div>
              <span className="vl-admin-section-label">VERILYFT OPERATIONS</span>
              <h2>Operational workspaces</h2>
              <p>These areas are part of the approved Admin experience and will be connected as their workflows are implemented.</p>
            </div>
            <StatusBadge label="Implementation in progress" tone="info" />
          </div>
          <div className="vl-admin-planned-grid">
            {plannedAreas.map((area) => {
              const Icon = area.icon;
              return (
                <article className="vl-admin-planned-card" key={area.title}>
                  <span className="vl-admin-planned-icon"><Icon size={19} /></span>
                  <div><h3>{area.title}</h3><p>{area.description}</p></div>
                  <StatusBadge label="Planned" tone="neutral" />
                </article>
              );
            })}
          </div>
        </section>

        <p className="vl-admin-boundary-note">
          Store management shown here continues to use the existing store data. Shipment bookings, PUDO operations and store orders are separate workflows and will not be combined into one record type.
        </p>
      </div>
    </WorkspaceShell>
  );
}
