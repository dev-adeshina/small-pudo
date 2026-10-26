"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Truck,
} from "lucide-react";
import { type User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { signOutCustomer } from "@/lib/customer-auth";

interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface CustomerOrder {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  } | null;
  delivery: {
    address: string;
    city: string;
    state: string;
    country: string;
    instructions: string;
  } | null;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  paymentStatus: string;
  paymentReference: string | null;
  orderStatus: string;
  shipping: {
    provider: string | null;
    trackingNumber: string | null;
    shippedAt: string | null;
    estimatedDeliveryAt: string | null;
    deliveredAt: string | null;
  };
  createdAt: string | null;
  updatedAt: string | null;
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
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatStatus(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(value: string) {
  const status = value.toLowerCase().replace(/[_\s-]+/g, "");

  if (
    ["delivered", "successful", "paid", "confirmed"].includes(status)
  ) {
    return "customer-status-success";
  }

  if (
    ["shipped", "intransit", "readyforshipping"].includes(status)
  ) {
    return "customer-status-shipping";
  }

  if (["cancelled", "failed", "refunded"].includes(status)) {
    return "customer-status-cancelled";
  }

  return "customer-status-pending";
}

export default function CustomerOrderDetailsPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const orderId = params.orderId;

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!active) return;

      if (!currentUser) {
        router.replace("/account/sign-in");
        setCheckingAuth(false);
        return;
      }

      if (!currentUser.emailVerified) {
        try {
          await signOutCustomer();
        } finally {
          if (active) {
            router.replace("/account/sign-in");
            setCheckingAuth(false);
          }
        }
        return;
      }

      setUser(currentUser);
      setCheckingAuth(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!user || !orderId) return;

    let active = true;

    async function loadOrder() {
      setLoading(true);
      setError("");

      try {
        const idToken = await user!.getIdToken();

        const response = await fetch(
          `/api/account/orders/${encodeURIComponent(orderId)}`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
            cache: "no-store",
          }
        );

        const data: {
          success?: boolean;
          order?: CustomerOrder;
          error?: string;
        } = await response.json().catch(() => ({}));

        if (!response.ok || !data.success || !data.order) {
          throw new Error(
            response.status === 404
              ? "We couldn't find that order in your account."
              : data.error || "Unable to load this order."
          );
        }

        if (active) setOrder(data.order);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load this order."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadOrder();

    return () => {
      active = false;
    };
  }, [user, orderId]);

  if (checkingAuth || loading) {
    return (
      <main className="customer-page">
        <div className="container">
          <div className="customer-order-detail-state">
            <Package size={28} />
            <p>
              {checkingAuth
                ? "Checking your account..."
                : "Loading your order..."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="customer-page">
        <div className="container">
          <div className="customer-order-detail-state">
            <Package size={30} />
            <h1>Order unavailable</h1>
            <p>{error || "This order could not be found."}</p>
            <Link href="/account" className="customer-secondary-action">
              <ArrowLeft size={16} />
              Back to my account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="customer-page">
      <div className="container">
        <div className="customer-order-detail-back">
          <Link href="/account" className="customer-secondary-action">
            <ArrowLeft size={16} />
            Back to my account
          </Link>
        </div>

        {/* <header className="customer-order-detail-header">
          <div>
            <span className="section-label">YOUR ACCOUNT / ORDER DETAILS</span>
            <h1>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p>Placed on {formatDate(order.createdAt)}</p>
          </div>

          <span
            className={`customer-status ${getStatusClass(order.orderStatus)}`}
          >
            {formatStatus(order.orderStatus)}
          </span>
        </header> */}

        <header className="customer-order-detail-header">
          <div>
            <span className="section-label">YOUR ACCOUNT / ORDER DETAILS</span>
            <h1>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p>Placed on {formatDate(order.createdAt)}</p>

            <Link
              href={`/track-order?orderId=${encodeURIComponent(order.id)}`}
              className="customer-secondary-action"
            >
              <Truck size={16} />
              Track this order
            </Link>
          </div>

          <span
            className={`customer-status ${getStatusClass(order.orderStatus)}`}
          >
            {formatStatus(order.orderStatus)}
          </span>
        </header>

        <div className="customer-order-detail-grid">
          <div className="customer-order-detail-main">
            <section className="customer-panel">
              <div className="customer-panel-heading">
                <div>
                  <span className="section-label">01 / ITEMS</span>
                  <h2>Items in this order</h2>
                </div>
                <Package size={22} />
              </div>

              <div className="customer-order-detail-items">
                {order.items.map((item, index) => (
                  <article
                    className="customer-order-detail-item"
                    key={`${item.productId}-${index}`}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <span>Quantity: {item.quantity}</span>
                      <span>{formatMoney(item.price, order.currency)} each</span>
                    </div>

                    <strong>
                      {formatMoney(item.subtotal, order.currency)}
                    </strong>
                  </article>
                ))}
              </div>

              <div className="customer-order-detail-totals">
                <div>
                  <span>Subtotal</span>
                  <span>{formatMoney(order.subtotal, order.currency)}</span>
                </div>
                <div>
                  <span>Delivery fee</span>
                  <span>{formatMoney(order.deliveryFee, order.currency)}</span>
                </div>
                <div className="customer-order-detail-total">
                  <strong>Total</strong>
                  <strong>{formatMoney(order.total, order.currency)}</strong>
                </div>
              </div>
            </section>

            <section className="customer-panel customer-order-detail-section">
              <div className="customer-panel-heading">
                <div>
                  <span className="section-label">02 / FULFILMENT</span>
                  <h2>Delivery progress</h2>
                </div>
                <Truck size={22} />
              </div>

              <div className="customer-order-detail-information">
                <div>
                  <span>Order status</span>
                  <span
                    className={`customer-status ${getStatusClass(order.orderStatus)}`}
                  >
                    {formatStatus(order.orderStatus)}
                  </span>
                </div>

                <div>
                  <span>Delivery provider</span>
                  <strong>{order.shipping.provider || "Not assigned yet"}</strong>
                </div>

                <div>
                  <span>Tracking number</span>
                  <strong>
                    {order.shipping.trackingNumber || "Not available yet"}
                  </strong>
                </div>

                <div>
                  <span>Estimated delivery</span>
                  <strong>
                    {formatDate(order.shipping.estimatedDeliveryAt)}
                  </strong>
                </div>

                {order.shipping.shippedAt && (
                  <div>
                    <span>Shipped on</span>
                    <strong>{formatDate(order.shipping.shippedAt)}</strong>
                  </div>
                )}

                {order.shipping.deliveredAt && (
                  <div>
                    <span>Delivered on</span>
                    <strong>{formatDate(order.shipping.deliveredAt)}</strong>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="customer-order-detail-sidebar">
            <section className="customer-panel">
              <div className="customer-panel-heading">
                <div>
                  <span className="section-label">03 / PAYMENT</span>
                  <h2>Payment details</h2>
                </div>
                {order.paymentStatus === "successful" ||
                  order.paymentStatus === "paid" ? (
                  <CheckCircle2 size={22} />
                ) : (
                  <Clock3 size={22} />
                )}
              </div>

              <div className="customer-order-detail-information">
                <div>
                  <span>Payment status</span>
                  <span
                    className={`customer-status ${getStatusClass(order.paymentStatus)}`}
                  >
                    {formatStatus(order.paymentStatus)}
                  </span>
                </div>

                <div>
                  <span>Payment reference</span>
                  <strong className="customer-order-reference">
                    {order.paymentReference || "Not available"}
                  </strong>
                </div>
              </div>
            </section>

            <section className="customer-panel customer-order-detail-section">
              <div className="customer-panel-heading">
                <div>
                  <span className="section-label">04 / DESTINATION</span>
                  <h2>Delivery address</h2>
                </div>
                <MapPin size={22} />
              </div>

              <div className="customer-order-detail-information">
                {order.customer && (
                  <>
                    <strong>{order.customer.name}</strong>
                    <span>{order.customer.email}</span>
                    <span>{order.customer.phone}</span>
                  </>
                )}

                {order.delivery && (
                  <>
                    <p>
                      {order.delivery.address}
                      <br />
                      {order.delivery.city}, {order.delivery.state}
                      <br />
                      {order.delivery.country}
                    </p>

                    {order.delivery.instructions && (
                      <div>
                        <span>Delivery instructions</span>
                        <strong>{order.delivery.instructions}</strong>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}