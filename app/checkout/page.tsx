"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
// import { createOrder } from "@/lib/firebase/orders";

export default function CheckoutPage() {
  const router = useRouter();

  const {
    items,
    isReady,
    getSubtotal,
    clearCart,
  } = useCart();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Nigeria",
    instructions: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");


  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [cancellationError, setCancellationError] = useState("");

  const subtotal = getSubtotal();
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const currency = items[0]?.currency || "NGN";

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }



  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
          },

          delivery: {
            address: form.address,
            city: form.city,
            state: form.state,
            country: form.country,
            instructions: form.instructions,
          },

          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      // const data = await response.json();

      const responseText = await response.text();

      let data: {
        success?: boolean;
        orderId?: string;
        orderAccessToken?: string;
        error?: string;
      } = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error("The orders API returned a non-JSON response:", responseText);
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error || `Order creation failed (HTTP ${response.status}). Check the server terminal for details.`
        );
      }

      // if (!data.orderId) {
      //   throw new Error("The server did not return an order ID.");
      // }

      if (!data.orderId) {
        throw new Error(
          "The server did not return an order ID."
        );
      }

      if (!data.orderAccessToken) {
        throw new Error(
          "The server did not return the order-management token."
        );
      }

      // Retain the token for this browser tab.
      sessionStorage.setItem(
        `order-access:${data.orderId}`,
        data.orderAccessToken
      );


      clearCart();
      setOrderId(data.orderId);
    } catch (error) {
      console.error(
        "Failed to create order:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create your order. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  async function handleCancelOrder() {
    if (!orderId || isCancelling || isCancelled) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setCancellationError("");
    setIsCancelling(true);

    try {
      // Retrieve the token saved when the order was created.
      const orderAccessToken = sessionStorage.getItem(
        `order-access:${orderId}`
      );

      if (!orderAccessToken) {
        throw new Error(
          "The order access token could not be found in this browser tab. Please use the tab where you placed the order."
        );
      }

      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderAccessToken,
          }),
        }
      );

      const responseText = await response.text();

      let data: {
        success?: boolean;
        message?: string;
        error?: string;
      } = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            "The server returned an invalid response while cancelling the order."
          );
        }
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to cancel the order. Please try again."
        );
      }

      setIsCancelled(true);
    } catch (error) {
      console.error("Failed to cancel order:", error);

      setCancellationError(
        error instanceof Error
          ? error.message
          : "Unable to cancel the order. Please try again."
      );
    } finally {
      setIsCancelling(false);
    }
  }

  if (!isReady) {
    return (
      <main className="cart-page">
        <div className="container">
          <p>Loading checkout...</p>
        </div>
      </main>
    );
  }


  if (orderId) {
    return (
      <main className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <span className="eyebrow">
              {isCancelled ? "Order cancelled" : "Order created"}
            </span>

            <h1>
              {isCancelled ? "Order Cancelled" : "Order Received"}
            </h1>

            <p>
              {isCancelled
                ? "Your order has been cancelled successfully. The reserved product stock has been restored."
                : "Your order has been created successfully and is currently awaiting payment."}
            </p>

            <p>
              Order ID: <strong>{orderId}</strong>
            </p>

            {cancellationError && (
              <div className="checkout-error" role="alert">
                {cancellationError}
              </div>
            )}

            <div className="checkout-actions">
              {!isCancelled && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Cancelling Order..." : "Cancel Order"}
                </button>
              )}

              <Link href="/products" className="btn btn-primary">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <span className="eyebrow">Checkout</span>

            <h1>Your cart is empty</h1>

            <p>Add some products to your cart before proceeding to checkout.</p>

            <Link href="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="container">
        <div className="page-heading">
          <span className="eyebrow">Checkout</span>

          <h1>Complete your order</h1>

          <p>
            Enter your delivery details and review your order before payment.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cart-layout">
            {/* Customer Information */}
            <section className="cart-items">
              <div className="cart-section">
                <h2>Customer Information</h2>

                <div className="checkout-form-grid">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="08012345678"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="cart-section">
                <h2>Delivery Information</h2>

                <div className="checkout-form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="address">Delivery Address</label>

                    <textarea
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Enter your full delivery address"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">City</label>

                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Ibadan"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="state">State</label>

                    <input
                      id="state"
                      name="state"
                      type="text"
                      value={form.state}
                      onChange={handleChange}
                      placeholder="Oyo State"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="country">Country</label>

                    <input
                      id="country"
                      name="country"
                      type="text"
                      value={form.country}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="instructions">
                      Delivery Instructions
                    </label>

                    <textarea
                      id="instructions"
                      name="instructions"
                      value={form.instructions}
                      onChange={handleChange}
                      placeholder="Optional delivery instructions"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="checkout-error" role="alert">
                  {error}
                </div>
              )}
            </section>

            {/* Order Summary */}
            <aside className="cart-summary">
              <h2>Order Summary</h2>

              <div className="checkout-summary-items">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="checkout-summary-item"
                  >
                    <div>
                      <strong>{item.name}</strong>

                      <span>
                        {item.quantity} ×{" "}
                        {item.price.toLocaleString()} {item.currency}
                      </span>
                    </div>

                    <strong>
                      {(item.price * item.quantity).toLocaleString()}{" "}
                      {item.currency}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="summary-row">
                <span>Subtotal</span>

                <span>
                  {subtotal.toLocaleString()} {currency}
                </span>
              </div>

              <div className="summary-row">
                <span>Delivery</span>

                <span>
                  {deliveryFee.toLocaleString()} {currency}
                </span>
              </div>

              <div className="summary-total">
                <span>Total</span>

                <strong>
                  {total.toLocaleString()} {currency}
                </strong>
              </div>

              <button
                type="submit"
                className="btn btn-primary checkout"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Order..." : "Proceed to Payment"}
              </button>

              <Link href="/cart" className="continue-shopping">
                Back to Cart
              </Link>
            </aside>
          </div>
        </form>
      </div>
    </main>
  );
}