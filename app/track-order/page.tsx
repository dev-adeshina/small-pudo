"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";


type TrackedOrder = {
    id: string;
    orderStatus: string;
    paymentStatus: string;
    items: {
        name: string;
        quantity: number;
    }[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    currency: string;
    shipping: {
        provider: string | null;
        trackingNumber: string | null;
        shippedAt: string | null;
        estimatedDeliveryAt: string | null;
        deliveredAt: string | null;
    };
    createdAt: string | null;
    updatedAt: string | null;
};

const ORDER_STEPS = [
    {
        status: "processing",
        label: "Processing",
        description: "Your order is being prepared.",
    },
    {
        status: "ready_for_shipping",
        label: "Ready for shipping",
        description: "Your order is ready for dispatch.",
    },
    {
        status: "shipped",
        label: "Shipped",
        description: "Your order has been dispatched.",
    },
    {
        status: "delivered",
        label: "Delivered",
        description: "Your order has been delivered.",
    },
];

function formatStatus(status: string | undefined) {
    if (!status) return "Unknown";

    return status
        .split("_")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
}

function formatDate(value: string | null) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatMoney(
    amount: number,
    currency: string
) {
    if (!Number.isFinite(amount)) {
        return "Not available";
    }

    try {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency,
        }).format(amount);
    } catch {
        return `${currency} ${amount.toLocaleString("en-NG")}`;
    }
}

function getCurrentStep(orderStatus: string) {
    return ORDER_STEPS.findIndex(
        (step) => step.status === orderStatus
    );
}

export default function TrackOrderPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [orderId, setOrderId] = useState("");
    const [orderAccessToken, setOrderAccessToken] = useState("");


    const [order, setOrder] = useState<TrackedOrder | null>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(Boolean(user));
        });

        return unsubscribe;
    }, []);

    // useEffect(() => {
    //     const params = new URLSearchParams(window.location.search);
    //     const requestedOrderId = params.get("orderId");

    //     if (!requestedOrderId) return;

    //     setOrderId(requestedOrderId);

    //     // The order ID may be in the URL, but the access token must not be.
    //     // Recover the token from the browser session when available.
    //     try {
    //         const savedToken = sessionStorage.getItem(
    //             `order-access:${requestedOrderId}`
    //         );

    //         if (savedToken) {
    //             setOrderAccessToken(savedToken);
    //         }
    //     } catch {
    //         // The customer can enter the token manually if storage is unavailable.
    //     }
    // }, []);


    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            const params = new URLSearchParams(window.location.search);
        const requestedOrderId = params.get("orderId");

        if (!requestedOrderId) return;

        setOrderId(requestedOrderId);

        // Recover the token saved during checkout, when available.
        try {
            const savedToken = sessionStorage.getItem(
                `order-access:${requestedOrderId}`
            );

            if (savedToken && /^[a-f0-9]{64}$/i.test(savedToken)) {
                setOrderAccessToken(savedToken);
            }
        } catch {
            // Manual token entry remains available if session storage fails.
        }

        // Email links carry the token in the URL fragment, not the query string.
        const fragmentParams = new URLSearchParams(
            window.location.hash.slice(1)
        );

        const emailedToken = fragmentParams.get("token");

        if (emailedToken && /^[a-f0-9]{64}$/i.test(emailedToken)) {
            setOrderAccessToken(emailedToken);

            try {
                sessionStorage.setItem(
                    `order-access:${requestedOrderId}`,
                    emailedToken
                );
            } catch {
                // The token remains in component state for this page session.
            }
        }

        // Remove the fragment so the token no longer appears in the address bar.
        if (window.location.hash) {
            window.history.replaceState(
                window.history.state,
                "",
                `${window.location.pathname}${window.location.search}`
            );
        }
            });

        return () => window.cancelAnimationFrame(frame);
    }, []);



    async function handleTrackOrder(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setOrder(null);

        const trimmedOrderId = orderId.trim();
        const trimmedToken = orderAccessToken.trim();

        if (!trimmedOrderId) {
            setError("Please enter your order ID.");
            return;
        }

        setIsLoading(true);

        try {
            const user = auth.currentUser;

            // Registered customers authenticate through Firebase.
            // Guest customers continue using their order access token.
            let headers: Record<string, string> = {
                "Content-Type": "application/json",
            };

            let body: { orderAccessToken?: string } = {};

            if (user) {
                if (!user.emailVerified) {
                    throw new Error(
                        "Please verify your email address before tracking your order."
                    );
                }

                const idToken = await user.getIdToken();

                headers = {
                    ...headers,
                    Authorization: `Bearer ${idToken}`,
                };
            } else {
                if (!/^[a-f0-9]{64}$/i.test(trimmedToken)) {
                    throw new Error(
                        "Please sign in to your customer account or enter a valid order access token."
                    );
                }

                body = {
                    orderAccessToken: trimmedToken,
                };
            }

            const response = await fetch(
                `/api/orders/${encodeURIComponent(trimmedOrderId)}/track`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify(body),
                }
            );

            const data: {
                success?: boolean;
                order?: TrackedOrder;
                error?: string;
            } = await response.json().catch(() => ({}));

            if (!response.ok || !data.success || !data.order) {
                throw new Error(
                    response.status === 404
                        ? "We couldn't find an order matching those details, or you    don't have permission to access it."
                        : data.error ||
                        "Unable to retrieve your order. Please try again."
                );
            }

            setOrder(data.order);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to retrieve your order. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    }

    const currentStep = order
        ? getCurrentStep(order.orderStatus)
        : -1;

    const isCancelled = order?.orderStatus === "cancelled";

    const isPendingPayment =
        order?.paymentStatus === "pending";

    const isPaid =
        order?.paymentStatus === "paid" ||
        order?.paymentStatus === "success";

    const isFailedPayment =
        order?.paymentStatus === "failed";

    return (
        <main className="cart-page">
            <div className="container">
                <div className="page-heading">
                    <span className="eyebrow">Order tracking</span>

                    <h1>Track your order</h1>

                    <p>
                        Check your order status and delivery progress using your customer
                        account or your guest order access token.
                    </p>
                </div>

                <section className="cart-items">
                    <div className="cart-section">
                        <h2>Find your order</h2>

                        <form onSubmit={handleTrackOrder}>
                            <div className="checkout-form-grid">
                                <div className="form-group">
                                    <label htmlFor="tracking-order-id">
                                        Order ID
                                    </label>

                                    <input
                                        id="tracking-order-id"
                                        name="orderId"
                                        type="text"
                                        value={orderId}
                                        onChange={(event) =>
                                            setOrderId(event.target.value)
                                        }
                                        maxLength={150}
                                        autoComplete="off"
                                        required
                                    />
                                </div>
                                {!isAuthenticated && (
                                    <div className="form-group">
                                        <label htmlFor="tracking-access-token">
                                            Order access token
                                        </label>

                                        <input
                                            id="tracking-access-token"
                                            name="orderAccessToken"
                                            type="password"
                                            value={orderAccessToken}
                                            onChange={(event) =>
                                                setOrderAccessToken(event.target.value)
                                            }
                                            autoComplete="off"
                                            spellCheck={false}
                                            required={!isAuthenticated}
                                        />

                                        <small>
                                            This token is provided when you place a guest order.
                                        </small>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="checkout-error" role="alert">
                                    {error}
                                </div>
                            )}

                            <div className="checkout-actions">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Checking order..." : "Track order"}
                                </button>

                                <Link
                                    href="/products"
                                    className="btn btn-secondary"
                                >
                                    Continue shopping
                                </Link>
                            </div>
                        </form>
                    </div>
                </section>

                {order && (
                    <section
                        className="cart-items"
                        aria-live="polite"
                        style={{ marginTop: "2rem" }}
                    >
                        <div className="cart-section">
                            <span className="eyebrow">Order details</span>

                            <h2>Order {order.id}</h2>

                            <p>
                                Placed: {formatDate(order.createdAt)}
                            </p>

                            <div className="checkout-form-grid">
                                <div>
                                    <strong>Order status</strong>
                                    <p>{formatStatus(order.orderStatus)}</p>
                                </div>

                                <div>
                                    <strong>Payment status</strong>
                                    <p>{formatStatus(order.paymentStatus)}</p>
                                </div>
                            </div>

                            {isCancelled && (
                                <div className="checkout-error" role="status">
                                    This order has been cancelled.
                                </div>
                            )}

                            {isPendingPayment && !isCancelled && (
                                <p role="status">
                                    Payment is still pending. Delivery progress will
                                    follow once the order has been paid and processed.
                                </p>
                            )}

                            {isFailedPayment && !isCancelled && (
                                <p role="status">
                                    The payment status is failed. Please check your
                                    payment confirmation or contact support if you
                                    believe this is incorrect.
                                </p>
                            )}

                            {!isCancelled && (
                                <>
                                    <h3 style={{ marginTop: "1.5rem" }}>
                                        Delivery progress
                                    </h3>

                                    {isPaid ? (
                                        <ol
                                            style={{
                                                listStyle: "none",
                                                padding: 0,
                                                margin: "1rem 0",
                                            }}
                                        >
                                            {ORDER_STEPS.map((step, index) => {
                                                const completed =
                                                    currentStep >= 0 &&
                                                    index <= currentStep;

                                                const active = index === currentStep;

                                                return (
                                                    <li
                                                        key={step.status}
                                                        style={{
                                                            padding: "0.75rem 1rem",
                                                            marginBottom: "0.75rem",
                                                            border: "1px solid var(--border-color, #ddd)",
                                                            borderRadius: "8px",
                                                            opacity:
                                                                completed || active ? 1 : 0.65,
                                                        }}
                                                    >
                                                        <strong>
                                                            {completed ? "✓ " : ""}
                                                            {step.label}
                                                            {active ? " — Current status" : ""}
                                                        </strong>

                                                        <p style={{ marginBottom: 0 }}>
                                                            {step.description}
                                                        </p>
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    ) : (
                                        <p>
                                            Delivery progress will become available after
                                            payment is confirmed.
                                        </p>
                                    )}
                                </>
                            )}

                            <h3 style={{ marginTop: "1.5rem" }}>
                                Shipping information
                            </h3>

                            <div className="checkout-form-grid">
                                <div>
                                    <strong>Delivery provider</strong>
                                    <p>
                                        {order.shipping.provider || "Not assigned yet"}
                                    </p>
                                </div>

                                <div>
                                    <strong>Tracking number</strong>
                                    <p>
                                        {order.shipping.trackingNumber || "Not available yet"}
                                    </p>
                                </div>

                                <div>
                                    <strong>Estimated delivery</strong>
                                    <p>
                                        {formatDate(order.shipping.estimatedDeliveryAt)}
                                    </p>
                                </div>

                                <div>
                                    <strong>Shipped on</strong>
                                    <p>{formatDate(order.shipping.shippedAt)}</p>
                                </div>

                                <div>
                                    <strong>Delivered on</strong>
                                    <p>{formatDate(order.shipping.deliveredAt)}</p>
                                </div>
                            </div>

                            <h3 style={{ marginTop: "1.5rem" }}>
                                Items ordered
                            </h3>

                            {order.items.length > 0 ? (
                                <ul>
                                    {order.items.map((item, index) => (
                                        <li key={`${item.name}-${index}`}>
                                            {item.name} × {item.quantity}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No item details are available.</p>
                            )}

                            <div style={{ marginTop: "1.5rem" }}>
                                <p>
                                    Subtotal:{" "}
                                    <strong>
                                        {formatMoney(order.subtotal, order.currency)}
                                    </strong>
                                </p>

                                <p>
                                    Delivery fee:{" "}
                                    <strong>
                                        {formatMoney(order.deliveryFee, order.currency)}
                                    </strong>
                                </p>

                                <p>
                                    Total:{" "}
                                    <strong>
                                        {formatMoney(order.total, order.currency)}
                                    </strong>
                                </p>
                            </div>

                            <p>
                                Last updated: {formatDate(order.updatedAt)}
                            </p>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}