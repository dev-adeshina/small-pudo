"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import { verifyAdminAccess } from "@/lib/admin-auth";

import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  LogOut,
  Package,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";

import { auth } from "@/lib/firebase";
import { logoutAdmin } from "@/lib/auth";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready_for_shipping"
  | "shipped"
  | "delivered"
  | "cancelled";

type OrderRecord = {
  id: string;
  customer: { name?: string; email?: string; phone?: string } | null;
  delivery: { address?: string; city?: string; state?: string; country?: string; instructions?: string } | null;
  items: Array<{ productId?: string; name?: string; quantity?: number; price?: number; subtotal?: number }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  paymentStatus: string;
  paymentReference: string | null;
  orderStatus: OrderStatus;
  createdAt: string | null;
  updatedAt: string | null;
  shipping?: {
    provider: string | null;
    trackingNumber: string | null;
    shippedAt: string | null;
    estimatedDeliveryAt: string | null;
    deliveredAt: string | null;
    notes: string | null;
  };
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting payment",
  confirmed: "Confirmed",
  processing: "Processing",
  ready_for_shipping: "Ready for shipping",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_LABELS: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "NGN"} ${amount.toLocaleString()}`;
  }
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function nextStatus(status: OrderStatus): OrderStatus | null {
  if (status === "processing") return "ready_for_shipping";
  if (status === "ready_for_shipping") return "shipped";
  if (status === "shipped") return "delivered";
  return null;
}

function statusClass(status: string) {
  if (status === "delivered" || status === "paid") return "order-status order-status-success";
  if (status === "cancelled" || status === "failed" || status === "refunded") return "order-status order-status-danger";
  if (status === "shipped" || status === "ready_for_shipping") return "order-status order-status-info";
  return "order-status order-status-pending";
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [savingShipping, setSavingShipping] = useState<string | null>(null);

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     if (!user) {
  //       router.replace("/admin/sign-in");
  //       return;
  //     }
  //     if (!user.emailVerified) {
  //       router.replace(`/admin/verify-email?email=${encodeURIComponent(user.email ?? "")}`);
  //       return;
  //     }
  //     setAdminEmail(user.email ?? "");
  //     setCheckingAuth(false);
  //   });
  //   return () => unsubscribe();
  // }, [router]);


  const loadOrders = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    setNotice("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Your session has expired. Please sign in again.");
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load orders.");
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
    } finally {
      setLoading(false);
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
        router.replace(
          `/admin/verify-email?email=${encodeURIComponent(
            user.email ?? ""
          )}`
        );
        return;
      }

      try {
        const email = await verifyAdminAccess(user);

        if (!active) return;

        setAdminEmail(email);
        setCheckingAuth(false);
        void loadOrders();
      } catch (error) {
        if (!active) return;

        if (error instanceof Error && error.name === "NotAdmin") {
          // Do not sign the customer out of Firebase.
          router.replace("/account");
          return;
        }

        if (
          error instanceof Error &&
          error.name === "AdminAuthUnavailable"
        ) {
          // Avoid displaying the admin workspace when its authorization
          // configuration cannot be verified.
          router.replace("/admin/sign-in");
          return;
        }

        router.replace("/admin/sign-in");
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);





  async function handleLogout() {
    await logoutAdmin();
    router.replace("/admin/sign-in");
  }

  async function advanceOrder(order: OrderRecord) {
    const target = nextStatus(order.orderStatus);
    if (!target) return;
    const confirmed = window.confirm(`Move order ${order.id} to “${STATUS_LABELS[target]}”?`);
    if (!confirmed) return;

    setUpdatingOrder(order.id);
    setError("");
    setNotice("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Your session has expired. Please sign in again.");
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderStatus: target }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to update this order.");
      setOrders((current) => current.map((entry) => entry.id === order.id ? { ...entry, orderStatus: target } : entry));
      setNotice(`Order ${order.id} updated to ${STATUS_LABELS[target]}.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update this order.");
    } finally {
      setUpdatingOrder(null);
    }
  }

  function updateShippingDraft(orderId: string, field: "provider" | "trackingNumber" | "estimatedDeliveryAt" | "notes", value: string) {
    setOrders((current) => current.map((order) => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        shipping: {
          provider: order.shipping?.provider ?? null,
          trackingNumber: order.shipping?.trackingNumber ?? null,
          shippedAt: order.shipping?.shippedAt ?? null,
          estimatedDeliveryAt: order.shipping?.estimatedDeliveryAt ?? null,
          deliveredAt: order.shipping?.deliveredAt ?? null,
          notes: order.shipping?.notes ?? null,
          [field]: value || null,
        },
      };
    }));
  }

  function toDateTimeLocal(value: string | null | undefined) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }

  async function saveShipping(order: OrderRecord) {
    if (order.paymentStatus !== "paid" || order.orderStatus === "cancelled") {
      setError("Shipping details can only be changed for paid, non-cancelled orders.");
      return;
    }

    setSavingShipping(order.id);
    setError("");
    setNotice("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Your session has expired. Please sign in again.");
      const token = await user.getIdToken();
      const shipping = order.shipping ?? {
        provider: null,
        trackingNumber: null,
        shippedAt: null,
        estimatedDeliveryAt: null,
        deliveredAt: null,
        notes: null,
      };
      const estimated = shipping.estimatedDeliveryAt;
      const estimatedDeliveryAt = estimated
        ? (Number.isNaN(new Date(estimated).getTime()) ? null : new Date(estimated).toISOString())
        : null;
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipping: {
            provider: shipping.provider ?? "",
            trackingNumber: shipping.trackingNumber ?? "",
            estimatedDeliveryAt,
            notes: shipping.notes ?? "",
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save shipping details.");
      setNotice(`Shipping details saved for order ${order.id}.`);
      await loadOrders(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save shipping details.");
    } finally {
      setSavingShipping(null);
    }
  }

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "paid" ? order.paymentStatus === "paid" : order.orderStatus === statusFilter);
      const searchable = [
        order.id,
        order.customer?.name,
        order.customer?.email,
        order.customer?.phone,
        order.paymentReference,
        order.delivery?.city,
        order.delivery?.state,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!term || searchable.includes(term));
    });
  }, [orders, search, statusFilter]);

  const paidCount = orders.filter((order) => order.paymentStatus === "paid").length;
  const fulfilmentCount = orders.filter((order) => ["processing", "ready_for_shipping", "shipped"].includes(order.orderStatus)).length;

  if (checkingAuth) {
    return <main className="admin-loading"><span>Loading workspace...</span></main>;
  }

  return (
    <main className="admin-page admin-orders-page">
      <header className="admin-header">
        <Link href="/" className="admin-logo">
          <Image src="/logo.svg" width={60} height={20} alt="VeriLyft" priority />
        </Link>
        <div className="admin-header-right">
          <span className="admin-email">{adminEmail}</span>
          <button type="button" className="admin-logout" onClick={handleLogout} aria-label="Sign out"><LogOut size={17} /></button>
        </div>
      </header>

      <div className="admin-shell">
        <div className="orders-page-topline">
          <Link href="/admin" className="orders-back-link"><ArrowLeft size={16} /> Dashboard</Link>
          <button type="button" className="orders-refresh-button" onClick={() => void loadOrders(true)} disabled={refreshing || loading}>
            {refreshing ? <Loader2 size={16} className="orders-spin" /> : <RefreshCw size={16} />}
            Refresh
          </button>
        </div>

        <section className="admin-welcome orders-welcome">
          <div>
            <span className="eyebrow">ADMIN / OPERATIONS</span>
            <h1>Orders &amp;<br /><em>fulfilment.</em></h1>
            <p>Review customer orders and move paid orders through the delivery process.</p>
          </div>
          <div className="admin-date"><span>VERILYFT</span><strong>ORDER MANAGEMENT</strong></div>
        </section>

        <section className="admin-stats orders-summary-stats">
          <article className="admin-stat-card"><div className="admin-stat-top"><span>ORDERS LOADED</span><Package size={19} /></div><strong>{orders.length}</strong><small>Latest 100 orders</small></article>
          <article className="admin-stat-card"><div className="admin-stat-top"><span>PAID ORDERS</span><CheckCircle2 size={19} /></div><strong>{paidCount}</strong><small>Payment confirmed</small></article>
          <article className="admin-stat-card"><div className="admin-stat-top"><span>IN FULFILMENT</span><Truck size={19} /></div><strong>{fulfilmentCount}</strong><small>Processing to shipped</small></article>
        </section>

        {error && <div className="orders-alert orders-alert-error" role="alert">{error}</div>}
        {notice && <div className="orders-alert orders-alert-success" role="status">{notice}</div>}

        <section className="admin-panel orders-management-panel">
          <div className="admin-panel-heading orders-management-heading">
            <div><span className="section-label">01 / ORDER REGISTER</span><h2>Customer orders</h2></div>
            <span className="orders-result-count">{filteredOrders.length} result{filteredOrders.length === 1 ? "" : "s"}</span>
          </div>

          <div className="orders-toolbar">
            <label className="orders-search"><Search size={17} /><span className="sr-only">Search orders</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, email or reference" /></label>
            <label className="orders-filter"><span className="sr-only">Filter orders</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="paid">Paid orders</option><option value="pending">Awaiting payment</option><option value="processing">Processing</option><option value="ready_for_shipping">Ready for shipping</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select><ChevronDown size={15} /></label>
          </div>

          {loading ? (
            <div className="orders-empty-state"><Loader2 size={24} className="orders-spin" /><p>Loading orders from Firestore...</p></div>
          ) : filteredOrders.length === 0 ? (
            <div className="orders-empty-state"><Package size={28} /><h3>No orders found</h3><p>{orders.length === 0 ? "Orders will appear here when customers place them." : "Try changing your search or status filter."}</p></div>
          ) : (
            <div className="orders-table-wrap">
              <table className="orders-table">
                <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Fulfilment</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const next = nextStatus(order.orderStatus);
                    const isExpanded = expandedOrder === order.id;
                    return (
                      <Fragment key={order.id}>
                        <tr key={order.id} className={isExpanded ? "orders-row-expanded" : ""}>
                          <td data-label="Order"><button type="button" className="orders-id-button" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>{order.id.slice(0, 10)}<ArrowUpRight size={13} /></button><span className="orders-mobile-date">{formatDate(order.createdAt)}</span></td>
                          <td data-label="Customer"><div className="orders-customer-cell"><strong>{order.customer?.name || "Customer"}</strong><span>{order.customer?.email || "No email"}</span></div></td>
                          <td data-label="Date">{formatDate(order.createdAt)}</td>
                          <td data-label="Total"><strong>{formatMoney(order.total, order.currency)}</strong><span className="orders-item-count">{order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} item(s)</span></td>
                          <td data-label="Payment"><span className={statusClass(order.paymentStatus)}>{PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}</span></td>
                          <td data-label="Fulfilment"><span className={statusClass(order.orderStatus)}>{STATUS_LABELS[order.orderStatus] ?? order.orderStatus}</span></td>
                          <td data-label="Actions"><div className="orders-row-actions"><button type="button" className="orders-details-button" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>{isExpanded ? "Close" : "Details"}</button>{next && order.paymentStatus === "paid" && <button type="button" className="orders-advance-button" onClick={() => void advanceOrder(order)} disabled={updatingOrder === order.id}>{updatingOrder === order.id ? <Loader2 size={14} className="orders-spin" /> : null}{STATUS_LABELS[next]}</button>}</div></td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${order.id}-details`}>
                            <td className="orders-expanded-cell" colSpan={7}>
                              <div className="orders-detail-grid">
                                <section><h3>Customer</h3><p>{order.customer?.name || "—"}</p><p>{order.customer?.email || "—"}</p><p>{order.customer?.phone || "—"}</p></section>
                                <section><h3>Delivery address</h3><p>{order.delivery?.address || "—"}</p><p>{[order.delivery?.city, order.delivery?.state, order.delivery?.country].filter(Boolean).join(", ") || "—"}</p>{order.delivery?.instructions && <p>Instructions: {order.delivery.instructions}</p>}</section>
                                <section><h3>Payment &amp; totals</h3><p>Reference: {order.paymentReference || "Not recorded"}</p><p>Subtotal: {formatMoney(order.subtotal, order.currency)}</p><p>Delivery: {formatMoney(order.deliveryFee, order.currency)}</p><p><strong>Total: {formatMoney(order.total, order.currency)}</strong></p></section>
                                <section className="orders-detail-items"><h3>Items</h3>{order.items.map((item, index) => <p key={`${item.productId ?? item.name ?? "item"}-${index}`}>{item.name || "Product"} × {Number(item.quantity) || 0} — {formatMoney(Number(item.subtotal ?? (Number(item.price) || 0) * (Number(item.quantity) || 0)), order.currency)}</p>)}</section>
                                <section className="orders-shipping-editor" style={{ gridColumn: "1 / -1" }}>
                                  <h3>Shipping &amp; delivery</h3>
                                  <div className="orders-shipping-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginTop: "12px" }}>
                                    <label className="orders-shipping-field">Courier / provider
                                      <input style={{ display: "block", width: "100%", marginTop: "6px", padding: "10px 12px", border: "1px solid #d8d8d8", borderRadius: "8px", background: "white", color: "#171717" }} value={order.shipping?.provider ?? ""} onChange={(event) => updateShippingDraft(order.id, "provider", event.target.value)} maxLength={120} placeholder="e.g. GIG Logistics" disabled={order.paymentStatus !== "paid" || order.orderStatus === "cancelled"} />
                                    </label>
                                    <label className="orders-shipping-field">Tracking number
                                      <input style={{ display: "block", width: "100%", marginTop: "6px", padding: "10px 12px", border: "1px solid #d8d8d8", borderRadius: "8px", background: "white", color: "#171717" }} value={order.shipping?.trackingNumber ?? ""} onChange={(event) => updateShippingDraft(order.id, "trackingNumber", event.target.value)} maxLength={160} placeholder="Enter tracking reference" disabled={order.paymentStatus !== "paid" || order.orderStatus === "cancelled"} />
                                    </label>
                                    <label className="orders-shipping-field">Estimated delivery
                                      <input style={{ display: "block", width: "100%", marginTop: "6px", padding: "10px 12px", border: "1px solid #d8d8d8", borderRadius: "8px", background: "white", color: "#171717" }} type="datetime-local" value={toDateTimeLocal(order.shipping?.estimatedDeliveryAt)} onChange={(event) => updateShippingDraft(order.id, "estimatedDeliveryAt", event.target.value ? new Date(event.target.value).toISOString() : "")} disabled={order.paymentStatus !== "paid" || order.orderStatus === "cancelled"} />
                                    </label>
                                    <label className="orders-shipping-field" style={{ gridColumn: "1 / -1" }}>Shipping notes
                                      <textarea style={{ display: "block", width: "100%", marginTop: "6px", padding: "10px 12px", border: "1px solid #d8d8d8", borderRadius: "8px", background: "white", color: "#171717", resize: "vertical" }} value={order.shipping?.notes ?? ""} onChange={(event) => updateShippingDraft(order.id, "notes", event.target.value)} maxLength={1000} rows={3} placeholder="Add delivery instructions or internal fulfilment notes" disabled={order.paymentStatus !== "paid" || order.orderStatus === "cancelled"} />
                                    </label>
                                  </div>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginTop: "14px" }}>
                                    <button type="button" className="orders-advance-button" onClick={() => void saveShipping(order)} disabled={savingShipping === order.id || order.paymentStatus !== "paid" || order.orderStatus === "cancelled"}>
                                      {savingShipping === order.id ? <Loader2 size={14} className="orders-spin" /> : null}Save shipping details
                                    </button>
                                    <span className="orders-created-meta">Shipped: {formatDate(order.shipping?.shippedAt ?? null)} · Delivered: {formatDate(order.shipping?.deliveredAt ?? null)}</span>
                                  </div>
                                  {(order.paymentStatus !== "paid" || order.orderStatus === "cancelled") && <p className="orders-created-meta">Shipping edits are available for paid, non-cancelled orders only.</p>}
                                </section>
                              </div>
                              <p className="orders-created-meta"><Clock3 size={14} /> Created {formatDate(order.createdAt)} · Last updated {formatDate(order.updatedAt)}</p>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="orders-page-footnote">Status updates are restricted to paid orders and must follow the fulfilment sequence. Payment status is managed by the payment verification and webhook flow.</p>
      </div>
    </main>
  );
}