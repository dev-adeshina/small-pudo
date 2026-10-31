"use client";

import Image from "next/image";
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
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";

import { auth } from "@/lib/firebase";
import { signOutCustomer } from "@/lib/customer-auth";

interface CustomerOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
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
      <main className="customer-loading">
        <span>Checking your account...</span>
      </main>
    );
  }

  const completedOrders = orders.filter(
    (order) => order.orderStatus.toLowerCase() === "delivered"
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

  return (
    <main className="customer-page">
      <header className="customer-header">
        <Link href="/" className="customer-logo" aria-label="VeriLyft home">
          <Image
            src="/logo.svg"
            alt="VeriLyft"
            width={150}
            height={40}
            priority
            style={{ width: "auto", height: "auto" }}
          />
        </Link>

        <div className="customer-header-right">
          <div className="customer-identity">
            <span className="customer-avatar">
              <UserRound size={17} />
            </span>

            <span className="customer-email">{user.email}</span>
          </div>

          <button
            type="button"
            className="customer-logout"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <div className="customer-shell">
        <section className="customer-welcome">
          <div>
            <span className="eyebrow">VERILYFT / MY ACCOUNT</span>

            <h1>
              Welcome back,
              <br />
              <em>{firstName}.</em>
            </h1>

            <p>
              Your orders, deliveries, and account details—all in one place.
            </p>

            <Link href="/account/shipments" className="customer-primary-action">
              <Package size={17} />
              Prepare a shipment
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <aside className="customer-welcome-note">
            <span className="customer-note-icon">
              <ShieldCheck size={23} />
            </span>
            <strong>Your account is verified</strong>
            <p>
              You are signed in with your verified email address.
            </p>
            <span className="customer-verified-label">
              <CheckCircle2 size={15} />
              VERIFIED ACCOUNT
            </span>
          </aside>
        </section>

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
                <h3>We couldn't load your orders</h3>
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
                  You haven't placed an order yet. Explore VeriLyft and find
                  something you love.
                </p>
                <Link href="/products" className="customer-secondary-action">
                  Explore products <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="customer-orders-list">
                {orders.map((order) => (
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
                  Prepare a shipment
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
    </main>
  );
}