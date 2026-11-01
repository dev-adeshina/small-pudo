import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/server/admin-authorization";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeAdminRequest(request, "You are not authorized to manage orders.");
  if (!authorization.ok) return authorization.response;

  try {
    const snapshot = await adminDb
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const orders = snapshot.docs.map((document) => {
      const data = document.data();
      const createdAt = data.createdAt?.toDate?.();
      const updatedAt = data.updatedAt?.toDate?.();
      const shipping = data.shipping && typeof data.shipping === "object" ? data.shipping : {};
      const shippingDateToIso = (value: unknown) => {
        const date = (value as { toDate?: () => Date } | null)?.toDate?.();
        return date instanceof Date ? date.toISOString() : null;
      };

      return {
        id: document.id,
        customer: data.customer ?? null,
        delivery: data.delivery ?? null,
        items: Array.isArray(data.items) ? data.items : [],
        subtotal: typeof data.subtotal === "number" ? data.subtotal : 0,
        deliveryFee: typeof data.deliveryFee === "number" ? data.deliveryFee : 0,
        total: typeof data.total === "number" ? data.total : 0,
        currency: typeof data.currency === "string" ? data.currency : "NGN",
        paymentStatus: typeof data.paymentStatus === "string" ? data.paymentStatus : "unknown",
        paymentReference: typeof data.paymentReference === "string" ? data.paymentReference : null,
        orderStatus: typeof data.orderStatus === "string" ? data.orderStatus : "pending",
        shipping: {
          provider: typeof shipping.provider === "string" ? shipping.provider : null,
          trackingNumber: typeof shipping.trackingNumber === "string" ? shipping.trackingNumber : null,
          shippedAt: shippingDateToIso(shipping.shippedAt),
          estimatedDeliveryAt: shippingDateToIso(shipping.estimatedDeliveryAt),
          deliveredAt: shippingDateToIso(shipping.deliveredAt),
          notes: typeof shipping.notes === "string" ? shipping.notes : null,
        },
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : null,
        updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : null,
      };
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Unable to load admin orders:", error);
    return NextResponse.json({ error: "Unable to load orders." }, { status: 500 });
  }
}