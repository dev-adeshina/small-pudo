import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function toISOString(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (
    isRecord(value) &&
    typeof value.toDate === "function"
  ) {
    try {
      const date = (value.toDate as () => Date)();

      return date instanceof Date && !Number.isNaN(date.getTime())
        ? date.toISOString()
        : null;
    } catch {
      return null;
    }
  }

  return null;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 }
    );
  }

  const idToken = authorization.slice("Bearer ".length).trim();

  if (!idToken) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 }
    );
  }

  let decodedToken;

  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json(
      {
        error: "Your session is invalid or expired. Please sign in again.",
      },
      { status: 401 }
    );
  }

  if (decodedToken.email_verified !== true) {
    return NextResponse.json(
      { error: "Please verify your email address first." },
      { status: 403 }
    );
  }

  try {
    const { orderId } = await context.params;

    if (
      !orderId ||
      orderId.length > 150 ||
      orderId.includes("/")
    ) {
      return NextResponse.json(
        { error: "Invalid order ID." },
        { status: 400 }
      );
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const snapshot = await orderRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const data = snapshot.data();

    if (!data) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // Ownership must be established from the verified Firebase UID.
    // Never trust a user ID supplied by the browser.
    const userRef = adminDb.collection("users").doc(decodedToken.uid);
    const storedUserRef = data.userId;

    if (
      !storedUserRef ||
      typeof storedUserRef.path !== "string" ||
      storedUserRef.path !== userRef.path
    ) {
      // Do not disclose whether another customer's order exists.
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const items = Array.isArray(data.items)
      ? data.items
          .filter(isRecord)
          .map((item) => ({
            productId:
              typeof item.productId === "string" ? item.productId : "",
            name:
              typeof item.name === "string" ? item.name : "Product",
            slug: typeof item.slug === "string" ? item.slug : "",
            price: typeof item.price === "number" ? item.price : 0,
            quantity:
              typeof item.quantity === "number" ? item.quantity : 0,
            subtotal:
              typeof item.subtotal === "number" ? item.subtotal : 0,
          }))
      : [];

    const rawShipping = isRecord(data.shipping) ? data.shipping : {};

    return NextResponse.json({
      success: true,
      order: {
        id: snapshot.id,
        customer: isRecord(data.customer) ? data.customer : null,
        delivery: isRecord(data.delivery) ? data.delivery : null,
        items,
        subtotal: typeof data.subtotal === "number" ? data.subtotal : 0,
        deliveryFee:
          typeof data.deliveryFee === "number" ? data.deliveryFee : 0,
        total: typeof data.total === "number" ? data.total : 0,
        currency: typeof data.currency === "string" ? data.currency : "NGN",
        paymentStatus:
          typeof data.paymentStatus === "string"
            ? data.paymentStatus
            : "pending",
        paymentReference:
          typeof data.paymentReference === "string"
            ? data.paymentReference
            : null,
        orderStatus:
          typeof data.orderStatus === "string"
            ? data.orderStatus
            : "pending",
        shipping: {
          provider:
            typeof rawShipping.provider === "string"
              ? rawShipping.provider
              : null,
          trackingNumber:
            typeof rawShipping.trackingNumber === "string"
              ? rawShipping.trackingNumber
              : null,
          shippedAt: toISOString(rawShipping.shippedAt),
          estimatedDeliveryAt: toISOString(
            rawShipping.estimatedDeliveryAt
          ),
          deliveredAt: toISOString(rawShipping.deliveredAt),
        },
        createdAt: toISOString(data.createdAt),
        updatedAt: toISOString(data.updatedAt),
      },
    });
  } catch (error) {
    console.error("Failed to retrieve customer order:", error);

    return NextResponse.json(
      { error: "Unable to retrieve this order right now." },
      { status: 500 }
    );
  }
}