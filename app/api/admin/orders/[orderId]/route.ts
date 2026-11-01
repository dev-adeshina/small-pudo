import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/server/admin-authorization";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type FulfilmentStatus = "ready_for_shipping" | "shipped" | "delivered";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const authorization = await authorizeAdminRequest(request, "You are not authorized to manage orders.");
  if (!authorization.ok) return authorization.response;

  const { orderId } = await context.params;
  if (!orderId?.trim()) {
    return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A valid request body is required." }, { status: 400 });
  }

  const payload = body as { orderStatus?: unknown; shipping?: unknown };
  const hasStatus = payload.orderStatus !== undefined;
  const hasShipping = payload.shipping !== undefined;
  if (!hasStatus && !hasShipping) {
    return NextResponse.json({ error: "Provide an order status or shipping fields to update." }, { status: 400 });
  }

  let targetStatus: FulfilmentStatus | undefined;
  if (hasStatus) {
    if (payload.orderStatus !== "ready_for_shipping" && payload.orderStatus !== "shipped" && payload.orderStatus !== "delivered") {
      return NextResponse.json({ error: "Unsupported fulfilment status." }, { status: 400 });
    }
    targetStatus = payload.orderStatus;
  }

  const updates: Record<string, unknown> = {};
  try {
    if (hasShipping) {
      if (!payload.shipping || typeof payload.shipping !== "object" || Array.isArray(payload.shipping)) {
        return NextResponse.json({ error: "Shipping details must be an object." }, { status: 400 });
      }
      const shipping = payload.shipping as Record<string, unknown>;
      const allowedFields = ["provider", "trackingNumber", "estimatedDeliveryAt", "notes"];
      const unknownFields = Object.keys(shipping).filter((key) => !allowedFields.includes(key));
      if (unknownFields.length) {
        return NextResponse.json({ error: `Unsupported shipping field: ${unknownFields[0]}.` }, { status: 400 });
      }
      const shippingUpdates: Record<string, unknown> = {};
      const provider = optionalText(shipping.provider, "provider", 120);
      const trackingNumber = optionalText(shipping.trackingNumber, "tracking_number", 160);
      const estimatedDeliveryAt = optionalDate(shipping.estimatedDeliveryAt);
      const notes = optionalText(shipping.notes, "notes", 1000);
      if (provider !== undefined) shippingUpdates.provider = provider;
      if (trackingNumber !== undefined) shippingUpdates.trackingNumber = trackingNumber;
      if (estimatedDeliveryAt !== undefined) shippingUpdates.estimatedDeliveryAt = estimatedDeliveryAt;
      if (notes !== undefined) shippingUpdates.notes = notes;
      if (Object.keys(shippingUpdates).length === 0) {
        return NextResponse.json({ error: "Provide at least one shipping field to update." }, { status: 400 });
      }
      for (const [key, value] of Object.entries(shippingUpdates)) {
        updates[`shipping.${key}`] = value;
      }
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const labels: Record<string, string> = {
      INVALID_PROVIDER: "Shipping provider must be text of 120 characters or fewer.",
      INVALID_TRACKING_NUMBER: "Tracking number must be text of 160 characters or fewer.",
      INVALID_NOTES: "Shipping notes must be text of 1000 characters or fewer.",
      INVALID_ESTIMATED_DELIVERY_AT: "Estimated delivery date must be a valid date.",
    };
    return NextResponse.json({ error: labels[code] ?? "Invalid shipping details." }, { status: 400 });
  }

  try {
    const orderRef = adminDb.collection("orders").doc(orderId);
    const result = await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(orderRef);
      if (!snapshot.exists) throw new Error("ORDER_NOT_FOUND");

      const order = snapshot.data();
      if (order?.paymentStatus !== "paid") throw new Error("ORDER_NOT_PAID");
      if (order?.orderStatus === "cancelled") throw new Error("ORDER_CANCELLED");

      if (targetStatus) {
        const allowedNext = NEXT_STATUS[String(order?.orderStatus ?? "")];
        if (allowedNext !== targetStatus) throw new Error("INVALID_STATUS_TRANSITION");
        updates.orderStatus = targetStatus;
        if (targetStatus === "shipped") updates["shipping.shippedAt"] = FieldValue.serverTimestamp();
        if (targetStatus === "delivered") updates["shipping.deliveredAt"] = FieldValue.serverTimestamp();
      }

      updates.updatedAt = FieldValue.serverTimestamp();
      transaction.update(orderRef, updates);
      return {
        orderStatus: targetStatus ?? String(order?.orderStatus ?? "pending"),
        shippingUpdated: hasShipping,
      };
    });

    return NextResponse.json({ success: true, orderId, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "ORDER_NOT_FOUND") return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (code === "ORDER_NOT_PAID") return NextResponse.json({ error: "Only paid orders can be managed through fulfilment." }, { status: 409 });
    if (code === "ORDER_CANCELLED") return NextResponse.json({ error: "Cancelled orders cannot be changed." }, { status: 409 });
    if (code === "INVALID_STATUS_TRANSITION") return NextResponse.json({ error: "This order cannot move directly to that status." }, { status: 409 });

    console.error("Unable to update order fulfilment:", error);
    return NextResponse.json({ error: "Unable to update order fulfilment." }, { status: 500 });
  }
}