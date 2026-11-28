"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type User } from "firebase/auth";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";

import { auth } from "@/lib/firebase";
import { signOutCustomer } from "@/lib/customer-auth";
import { WorkspaceShell } from "@/components/design-system/WorkspaceShell";
import { customerWorkspaceNavigation } from "@/components/design-system/workspace-navigation";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Button } from "@/components/design-system/Button";
import { FeedbackState } from "@/components/design-system/FeedbackState";
import { Pagination } from "@/components/design-system/Pagination";

interface CustomerOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface CustomerQuote {
  quoteId: string;
  status: string;
}

interface CustomerShipment {
  shipmentId: string;
  shipmentReference: string;
  serviceType: string;
  status: string;
  createdAt: string;
}

interface CustomerOrder {
  id: string;
  items: CustomerOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string | null;
  shipping?: {
    provider: string | null;
    trackingNumber: string | null;
    shippedAt: string | null;
    estimatedDeliveryAt: string | null;
    deliveredAt: string | null;
    notes: string | null;
  };
}

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
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStatus(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(value: string) {
  const status = value.toLowerCase().replace(/[_\s-]+/g, "");

  if (["delivered", "successful", "paid"].includes(status)) {
    return "customer-status-success";
  }

  if (["shipped", "intransit", "readyforshipping"].includes(status)) {
    return "customer-status-shipping";
  }

  if (["cancelled", "failed", "refunded"].includes(status)) {
    return "customer-status-cancelled";
  }

  return "customer-status-pending";
}

export default function CustomerAccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");


  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);


  const [quotes, setQuotes] = useState<CustomerQuote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [quotesError, setQuotesError] = useState("");
  const [quoteReloadKey, setQuoteReloadKey] = useState(0);
  const [shipments, setShipments] = useState<CustomerShipment[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);
  const [shipmentsError, setShipmentsError] = useState("");
  const [shipmentReloadKey, setShipmentReloadKey] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.replace("/account/sign-in");
        return;
      }

      if (!currentUser.emailVerified) {
        try {
          await signOutCustomer();
        } finally {
          router.replace("/account/sign-in");
        }

        return;
      }

      setUser(currentUser);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);



  useEffect(() => {
    if (!user) return;

    let active = true;

    async function fetchOrders() {
      setOrdersLoading(true);
      setOrdersError("");

      try {
        const idToken = await user!.getIdToken();

        const response = await fetch("/api/account/orders", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          cache: "no-store",
        });

        const data: {
          success?: boolean;
          orders?: CustomerOrder[];
          error?: string;
        } = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to load your orders.");
        }

        if (active) {
          setOrders(data.orders ?? []);
        }
      } catch (loadError) {
        if (active) {
          setOrdersError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load your orders. Please try again."
          );
        }
      } finally {
        if (active) {
          setOrdersLoading(false);
        }
      }
    }

    void fetchOrders();

    return () => {
      active = false;
    };
  }, [user, reloadKey]);



  useEffect(() => {
    if (!user) return;

    let active = true;

    async function fetchQuotes() {
      setQuotesLoading(true);
      setQuotesError("");

      try {
        const idToken = await user!.getIdToken();
        const response = await fetch("/api/account/quotes", {
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(
            typeof data?.error === "string"
              ? data.error
              : "Unable to load your quotations."
          );
        }

        if (active) {
          setQuotes(Array.isArray(data.quotes) ? data.quotes.map((quote: { quoteId: string; accepted?: boolean; shipmentStatus?: string }) => ({
            quoteId: quote.quoteId,
            status: quote.accepted ? "accepted" : quote.shipmentStatus === "Quoted" ? "issued" : quote.shipmentStatus ?? "unknown",
          })) : []);
        }
      } catch (loadError) {
        if (active) {
          setQuotesError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load your quotations. Please try again."
          );
        }
      } finally {
        if (active) setQuotesLoading(false);
      }
    }

    void fetchQuotes();

    return () => {
      active = false;
    };
  }, [user, quoteReloadKey]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function fetchCanonicalShipments() {
      setShipmentsLoading(true);
      setShipmentsError("");
      try {
        const token = await user!.getIdToken();
        const response = await fetch("/api/account/shipments", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error ?? "Unable to load shipment activity.");
        if (active) setShipments(Array.isArray(data.shipments) ? data.shipments : []);
      } catch (cause) {
        if (active) setShipmentsError(cause instanceof Error ? cause.message : "Unable to load shipment activity.");
      } finally {
        if (active) setShipmentsLoading(false);
      }
    }
    void fetchCanonicalShipments();
    return () => { active = false; };
  }, [user, shipmentReloadKey]);

  async function handleSignOut() {
    setError("");
    setSigningOut(true);

    try {
      await signOutCustomer();
      router.replace("/account/sign-in");
    } catch {
      setError("We could not sign you out. Please try again.");
      setSigningOut(false);
    }
  }



  if (checkingAuth || !user) {
    return (
      <main className="vl-workspace">
        <div className="vl-workspace__content">
          <FeedbackState
            variant="loading"
            title="Checking your customer account"
            description="Verifying your sign-in before opening your workspace."
          />
        </div>
      </main>
    );
  }

  const completedOrders = orders.filter(
    (order) => order.orderStatus.toLowerCase() === "delivered"
  ).length;
  const quotationsAwaitingDecision = quotes.filter(
    (quote) => quote.status === "issued"
  ).length;

  const pendingOrders = orders.filter((order) =>
    ["pending", "processing", "confirmed", "ready_for_shipping", "shipped"].includes(
      order.orderStatus.toLowerCase()
    )
  ).length;

  const firstName =
    user.displayName?.trim().split(/\s+/)[0] ||
    user.email?.split("@")[0] ||
    "there";
  const pageSize = 5;
  const currentOrdersPage = Math.min(ordersPage, Math.max(1, Math.ceil(orders.length / pageSize)));
  const visibleOrders = orders.slice((currentOrdersPage - 1) * pageSize, currentOrdersPage * pageSize);

  return (
    <WorkspaceShell
      workspaceName="VeriLyft"
      workspaceLabel="Customer workspace"
      navigation={customerWorkspaceNavigation}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Customer account", href: "/account" },
        { label: "Overview" },
      ]}
      topbarContent={
        <div className="vl-customer-topbar">
          <span className="vl-customer-identity">
            <span className="customer-avatar"><UserRound size={16} /></span>
            <span className="customer-email">{user.email}</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<LogOut size={16} />}
            onClick={handleSignOut}
            loading={signingOut}
            aria-label="Sign out"
          >
            Sign out
          </Button>
        </div>
      }
    >
      <div className="customer-page vl-customer-dashboard">
        <div className="customer-shell">
          <PageHeader
            eyebrow="CUSTOMER ACCOUNT"
            title={`Welcome back, ${firstName}.`}
            description="Your shipments, saved addresses, quotations, orders and account details—all in one place."
            actions={
              <>
                <Link href="/account/shipments/new" className="vl-button vl-button--primary">
                  <Package size={16} /> Send an item
                </Link>
                <Link href="/account/quotes" className="vl-button vl-button--secondary">
                  <FileText size={16} /> View quotations
                </Link>
                <Link href="/account/shipment-history" className="vl-button vl-button--secondary">
                  <Truck size={16} /> Track shipments
                </Link>
              </>
            }
          />
          <div className="vl-customer-account-state">
            <ShieldCheck size={17} />
            <span>Your account is verified</span>
            <StatusBadge label="Verified" tone="success" />
          </div>

        {error && (
          <p className="customer-error" role="alert">
            {error}
          </p>
        )}

        <section className="customer-stats" aria-label="Order summary">
          <article className="customer-stat-card">
            <div className="customer-stat-top">
              <span>TOTAL ORDERS</span>
              <Package size={19} />
            </div>

            <strong>{ordersLoading ? "—" : orders.length}</strong>

            <small>Orders on your account</small>
          </article>

          <article className="customer-stat-card">
            <div className="customer-stat-top">
              <span>IN PROGRESS</span>
              <Clock3 size={19} />
            </div>

            <strong>{ordersLoading ? "—" : pendingOrders}</strong>

            <small>Orders being processed or delivered</small>
          </article>

          <article className="customer-stat-card">
            <div className="customer-stat-top">
              <span>COMPLETED</span>
              <CheckCircle2 size={19} />
            </div>

            <strong>{ordersLoading ? "—" : completedOrders}</strong>

            <small>Successfully delivered orders</small>
          </article>
          <article className="customer-stat-card">
            <div className="customer-stat-top">
              <span>SHIPMENTS</span>
              <Truck size={19} />
            </div>
            <strong>{shipmentsLoading ? "—" : shipments.length}</strong>
            <small>{shipmentsError ? "Shipment summary unavailable" : "Submitted shipment records"}</small>
            {shipmentsError ? <button type="button" className="vl-customer-inline-retry" onClick={() => setShipmentReloadKey(key => key + 1)}>Retry</button> : null}
          </article>
          <article className="customer-stat-card">
            <div className="customer-stat-top">
              <span>QUOTATIONS AWAITING ACTION</span>
              <FileText size={19} />
            </div>
            <strong>{quotesLoading ? "—" : quotesError ? "—" : quotationsAwaitingDecision}</strong>
            <small>
              {quotesError ? "Quotation summary unavailable" : "Issued quotations to review"}
            </small>
            {quotesError ? (
              <button
                type="button"
                className="vl-customer-inline-retry"
                onClick={() => setQuoteReloadKey((key) => key + 1)}
              >
                Retry
              </button>
            ) : null}
          </article>
        </section>




        <section className="customer-panel" aria-labelledby="customer-shipments-heading">
          <div className="customer-panel-heading">
            <div><span className="section-label">01 / SHIPMENT ACTIVITY</span><h2 id="customer-shipments-heading">My shipments</h2><p className="customer-panel-description">Follow the shipments submitted through your customer account.</p></div>
            <span className="customer-order-count">{shipmentsLoading ? "Loading" : `${shipments.length} shipments`}</span>
          </div>
          {shipmentsLoading ? <div className="customer-state"><Package size={24}/><p>Loading your shipment activity...</p></div>
            : shipmentsError ? <div className="customer-state" role="alert"><p>{shipmentsError}</p><button type="button" className="customer-secondary-action" onClick={() => setShipmentReloadKey(key => key + 1)}>Retry</button></div>
            : shipments.length === 0 ? <div className="customer-state"><Package size={24}/><h3>No submitted shipments yet</h3><p>Create a shipment to start following its progress.</p><Link href="/account/shipments/new" className="customer-secondary-action">Create a shipment <ArrowRight size={16}/></Link></div>
            : <div className="shipment-draft-list">{shipments.slice(0, 5).map(shipment => <article className="shipment-draft-row" key={shipment.shipmentId}><div><span className="shipment-draft-status">{shipment.shipmentReference}</span><strong>{formatStatus(shipment.serviceType)} · {shipment.status}</strong><small>Submitted {formatDate(shipment.createdAt)}</small></div><Link href={`/account/shipments/${encodeURIComponent(shipment.shipmentId)}`} className="customer-secondary-action">Track <ArrowRight size={15}/></Link></article>)}</div>}
          <div className="shipment-form-actions"><Link href="/account/shipment-history" className="customer-secondary-action">View all shipment history <ArrowRight size={16}/></Link></div>
        </section>

        <section className="customer-content-grid">


          <div className="customer-panel customer-orders" id="orders">
            <div className="customer-panel-heading">
              <div>
                <span className="section-label">01 / YOUR ACTIVITY</span>
                <h2>My orders</h2>
                <p className="customer-panel-description">
                  Keep track of your purchases and delivery progress.
                </p>
              </div>

              <span className="customer-order-count">
                {ordersLoading ? "Loading" : `${orders.length} orders`}
              </span>
            </div>



            {ordersLoading ? (
              <div className="customer-state">
                <Package size={25} />
                <p>Loading your orders...</p>
              </div>
            ) : ordersError ? (
              <div className="customer-state">
                <Package size={27} />
                <h3>We couldn&apos;t load your orders</h3>
                <p>{ordersError}</p>

                <button
                  type="button"
                  className="customer-secondary-action"
                  onClick={() => setReloadKey((key) => key + 1)}
                >
                  Try again <ArrowRight size={16} />
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="customer-state">
                <span className="customer-empty-icon">
                  <ShoppingBag size={27} />
                </span>
                <h3>Your story starts here.</h3>
                <p>
                  You haven&apos;t placed an order yet. Explore VeriLyft and find
                  something you love.
                </p>
                <Link href="/products" className="customer-secondary-action">
                  Explore products <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="customer-orders-list">
                {visibleOrders.map((order) => (
                  <article className="customer-order-row" key={order.id}>
                    <div className="customer-order-main">
                      <span className="customer-order-icon">
                        <Package size={20} />
                      </span>

                      <div className="customer-order-details">
                        <strong>
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </strong>
                        <span>{formatDate(order.createdAt)}</span>
                        <span>
                          {order.items.reduce(
                            (count, item) => count + item.quantity,
                            0
                          )}{" "}
                          {order.items.reduce(
                            (count, item) => count + item.quantity,
                            0
                          ) === 1
                            ? "item"
                            : "items"}
                        </span>
                      </div>
                    </div>

                    <div className="customer-order-financials">
                      <strong>
                        {formatMoney(order.total, order.currency)}
                      </strong>
                      <span
                        className={`customer-status ${getStatusClass(
                          order.paymentStatus
                        )}`}
                      >
                        Payment: {formatStatus(order.paymentStatus)}
                      </span>
                    </div>

                    <div className="customer-order-progress">
                      <span className="customer-order-progress-label">
                        ORDER STATUS
                      </span>
                      <span
                        className={`customer-status ${getStatusClass(
                          order.orderStatus
                        )}`}
                      >
                        {formatStatus(order.orderStatus)}
                      </span>

                      {order.shipping?.trackingNumber && (
                        <span className="customer-tracking">
                          <Truck size={14} />
                          Tracking: {order.shipping.trackingNumber}
                        </span>
                      )}

                      {order.shipping?.estimatedDeliveryAt && (
                        <span className="customer-delivery-date">
                          Estimated delivery:{" "}
                          {formatDate(order.shipping.estimatedDeliveryAt)}
                        </span>
                      )}

                      {order.shipping?.deliveredAt && (
                        <span className="customer-delivery-date">
                          Delivered: {formatDate(order.shipping.deliveredAt)}
                        </span>
                      )}

                      {order.shipping?.provider && (
                        <span className="customer-shipping-provider">
                          Via {order.shipping.provider}
                        </span>
                      )}

                      {order.shipping?.notes && (
                        <p className="customer-shipping-notes">
                          {order.shipping.notes}
                        </p>

                      )}

                      <div className="customer-order-actions">
                        <Link
                          href={`/account/orders/${encodeURIComponent(order.id)}`}
                          className="customer-order-view-link"
                        >
                          View order details <ArrowRight size={15} />
                        </Link>

                        <Link
                          href={`/track-order?orderId=${encodeURIComponent(order.id)}`}
                          className="customer-order-view-link"
                        >
                          <Truck size={15} />
                          Track order
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
                <Pagination page={currentOrdersPage} totalItems={orders.length} pageSize={pageSize} onPageChange={setOrdersPage} />
              </div>
            )}
          </div>

          <aside className="customer-side">
            <div className="customer-panel customer-quick-actions">
              <div className="customer-panel-heading">
                <div>
                  <span className="section-label">02 / SHORTCUTS</span>
                  <h2>Quick actions</h2>
                </div>
              </div>

              <Link href="/account/profile" className="customer-action">
                <span>
                  <UserRound size={18} />
                  My profile
                </span>
                <ArrowUpRight size={17} />
              </Link>
              <Link href="/account/shipments" className="customer-action">
                <span>
                  <Package size={18} />
                  Send an item
                </span>
                <ArrowUpRight size={17} />
              </Link>
              <Link href="/products" className="customer-action">
                <span>
                  <ShoppingBag size={18} />
                  Browse products
                </span>
                <ArrowUpRight size={17} />
              </Link>



              <a href="#orders" className="customer-action">
                <span>
                  <Package size={18} />
                  View my orders
                </span>
                <ArrowUpRight size={17} />
              </a>



              <Link href="/" className="customer-action">
                <span>
                  <ArrowDownRight size={18} />
                  Back to home
                </span>
                <ArrowUpRight size={17} />
              </Link>
            </div>

            <div className="customer-panel customer-account-panel">
              <span className="section-label">03 / ACCOUNT</span>

              <span className="customer-account-icon">
                <ShieldCheck size={22} />
              </span>

              <h3>Your account, protected.</h3>

              <p>
                Your order history is linked to your verified account, so you
                can return here to check your purchases.
              </p>

              <div className="customer-account-email">
                <span>Email address</span>
                <strong>{user.email}</strong>
                <span className="customer-verified-label">
                  <CheckCircle2 size={14} />
                  Email verified
                </span>
              </div>
            </div>
          </aside>
        </section>

        <footer className="customer-footer">
          <span>VERILyFT — BEYOND BORDERS</span>
          <Link href="/">Return to store <ArrowRight size={14} /></Link>
        </footer>
        </div>
      </div>
    </WorkspaceShell>
  );
}