


import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function verifyToken(
  suppliedToken: string,
  storedHash: unknown
): boolean {
  if (
    typeof storedHash !== "string" ||
    !/^[a-f0-9]{64}$/i.test(storedHash) ||
    !/^[a-f0-9]{64}$/i.test(suppliedToken)
  ) {
    return false;
  }

  const suppliedHash = createHash("sha256")
    .update(suppliedToken)
    .digest("hex");

  const suppliedBuffer = Buffer.from(suppliedHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  return timingSafeEqual(suppliedBuffer, storedBuffer);
}

function toIsoString(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value.toISOString();
  }

  if (isRecord(value) && typeof value.toDate === "function") {
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

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
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

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const authorization = request.headers.get("authorization");
    const isAuthenticatedRequest = authorization !== null;

    let authenticatedUid: string | null = null;

    // Registered customer access: verify Firebase identity and email.
    if (isAuthenticatedRequest) {
      if (!authorization.startsWith("Bearer ")) {
        return NextResponse.json(
          { error: "Authentication is invalid." },
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
          { error: "Your session is invalid or expired. Please sign in again." },
          { status: 401 }
        );
      }

      if (decodedToken.email_verified !== true) {
        return NextResponse.json(
          { error: "Please verify your email address first." },
          { status: 403 }
        );
      }

      authenticatedUid = decodedToken.uid;
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnapshot = await orderRef.get();

    if (!orderSnapshot.exists) {
      return NextResponse.json(
        { error: "Order not found or access denied." },
        { status: 404 }
      );
    }

    const order = orderSnapshot.data();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or access denied." },
        { status: 404 }
      );
    }

    if (authenticatedUid !== null) {
      // Authenticated customers may access only their own orders.
      const userRef = adminDb
        .collection("users")
        .doc(authenticatedUid);

      const storedUserRef = order.userId;

      if (
        !storedUserRef ||
        typeof storedUserRef.path !== "string" ||
        storedUserRef.path !== userRef.path
      ) {
        return NextResponse.json(
          { error: "Order not found or access denied." },
          { status: 404 }
        );
      }
    } else {
      // Guest access: require the existing order access token.
      const orderAccessToken = body.orderAccessToken;

      if (
        typeof orderAccessToken !== "string" ||
        !/^[a-f0-9]{64}$/i.test(orderAccessToken)
      ) {
        return NextResponse.json(
          { error: "A valid order access token is required." },
          { status: 400 }
        );
      }

      if (
        !verifyToken(
          orderAccessToken,
          order.orderAccessTokenHash
        )
      ) {
        return NextResponse.json(
          { error: "Order not found or access denied." },
          { status: 404 }
        );
      }
    }

    const shipping = isRecord(order.shipping)
      ? order.shipping
      : {};

    const items = Array.isArray(order.items)
      ? order.items
          .map((item: unknown) => {
            if (!isRecord(item)) {
              return null;
            }

            return {
              name:
                typeof item.name === "string"
                  ? item.name
                  : "Product",
              quantity:
                typeof item.quantity === "number"
                  ? item.quantity
                  : 0,
            };
          })
          .filter(
            (
              item
            ): item is {
              name: string;
              quantity: number;
            } => item !== null
          )
      : [];

    return NextResponse.json({
      success: true,
      order: {
        id: orderSnapshot.id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        items,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        currency: order.currency,
        shipping: {
          provider:
            typeof shipping.provider === "string"
              ? shipping.provider
              : null,
          trackingNumber:
            typeof shipping.trackingNumber === "string"
              ? shipping.trackingNumber
              : null,
          shippedAt: toIsoString(shipping.shippedAt),
          estimatedDeliveryAt: toIsoString(
            shipping.estimatedDeliveryAt
          ),
          deliveredAt: toIsoString(shipping.deliveredAt),
        },
        createdAt: toIsoString(order.createdAt),
        updatedAt: toIsoString(order.updatedAt),
      },
    });
  } catch (error) {
    console.error("Failed to retrieve order tracking:", error);

    return NextResponse.json(
      { error: "Unable to retrieve order tracking." },
      { status: 500 }
    );
  }
}