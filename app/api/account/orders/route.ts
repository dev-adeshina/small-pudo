import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

function toISOString(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = value.toDate();

    return date instanceof Date ? date.toISOString() : null;
  }

  return null;
}

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const idToken = authorization.slice("Bearer ".length).trim();

  if (!idToken) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  let decodedToken;

  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json(
      { error: "Your session is invalid or expired. Please sign in again." },
      { status: 401 }
    );
  }

  if (decodedToken.email_verified !== true) {
    return NextResponse.json(
      { error: "Please verify your email address." },
      { status: 403 }
    );
  }

  try {
    // Derive ownership from the verified token, never from request input.
    const userRef = adminDb
      .collection("users")
      .doc(decodedToken.uid);

    const snapshot = await adminDb
      .collection("orders")
      .where("userId", "==", userRef)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const orders = snapshot.docs.map((document) => {
      const data = document.data();

      const shipping = data.shipping
        ? {
            provider: data.shipping.provider ?? null,
            trackingNumber: data.shipping.trackingNumber ?? null,
            shippedAt: toISOString(data.shipping.shippedAt),
            estimatedDeliveryAt: toISOString(
              data.shipping.estimatedDeliveryAt
            ),
            deliveredAt: toISOString(data.shipping.deliveredAt),
            notes: data.shipping.notes ?? null,
          }
        : undefined;

      return {
        id: document.id,
        customer: data.customer ?? null,
        delivery: data.delivery ?? null,
        items: Array.isArray(data.items) ? data.items : [],
        subtotal: data.subtotal,
        deliveryFee: data.deliveryFee,
        total: data.total,
        currency: data.currency,
        paymentStatus: data.paymentStatus,
        orderStatus: data.orderStatus,
        ...(shipping ? { shipping } : {}),
        createdAt: toISOString(data.createdAt),
        updatedAt: toISOString(data.updatedAt),
      };
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Failed to retrieve customer orders:", error);

    return NextResponse.json(
      { error: "Unable to retrieve your orders." },
      { status: 500 }
    );
  }
}