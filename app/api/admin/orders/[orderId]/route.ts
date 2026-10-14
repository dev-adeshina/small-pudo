import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type FulfilmentStatus = "ready_for_shipping" | "shipped" | "delivered";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

async function authorizeAdmin(request: Request) {
  if (ADMIN_EMAILS.length === 0) {
    return { ok: false as const, response: NextResponse.json({ error: "Admin access is not configured. Set ADMIN_EMAILS on the server." }, { status: 503 }) };
  }

  const match = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false as const, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  try {
    const decoded = await getAuth().verifyIdToken(match[1]);
    const email = decoded.email?.toLowerCase();
    if (!decoded.email_verified || !email || !ADMIN_EMAILS.includes(email)) {
      return { ok: false as const, response: NextResponse.json({ error: "You are not authorized to manage orders." }, { status: 403 }) };
    }
    return { ok: true as const };
  } catch {
    return { ok: false as const, response: NextResponse.json({ error: "Your session is invalid or expired. Sign in again." }, { status: 401 }) };
  }
}

const NEXT_STATUS: Record<string, FulfilmentStatus | undefined> = {
  processing: "ready_for_shipping",
  ready_for_shipping: "shipped",
  shipped: "delivered",
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const authorization = await authorizeAdmin(request);
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

  if (!body || typeof body !== "object" || !("orderStatus" in body)) {
    return NextResponse.json({ error: "A target order status is required." }, { status: 400 });
  }

  const targetStatus = (body as { orderStatus?: unknown }).orderStatus;
  if (targetStatus !== "ready_for_shipping" && targetStatus !== "shipped" && targetStatus !== "delivered") {
    return NextResponse.json({ error: "Unsupported fulfilment status." }, { status: 400 });
  }

  try {
    const orderRef = adminDb.collection("orders").doc(orderId);
    const updatedStatus = await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(orderRef);
      if (!snapshot.exists) throw new Error("ORDER_NOT_FOUND");

      const order = snapshot.data();
      if (order?.paymentStatus !== "paid") throw new Error("ORDER_NOT_PAID");
      if (order?.orderStatus === "cancelled") throw new Error("ORDER_CANCELLED");

      const allowedNext = NEXT_STATUS[String(order?.orderStatus ?? "")];
      if (allowedNext !== targetStatus) throw new Error("INVALID_STATUS_TRANSITION");

      transaction.update(orderRef, {
        orderStatus: targetStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return targetStatus;
    });

    return NextResponse.json({ success: true, orderId, orderStatus: updatedStatus });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "ORDER_NOT_FOUND") return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (code === "ORDER_NOT_PAID") return NextResponse.json({ error: "Only paid orders can move through fulfilment." }, { status: 409 });
    if (code === "ORDER_CANCELLED") return NextResponse.json({ error: "Cancelled orders cannot be advanced." }, { status: 409 });
    if (code === "INVALID_STATUS_TRANSITION") return NextResponse.json({ error: "This order cannot move directly to that status." }, { status: 409 });

    console.error("Unable to update order status:", error);
    return NextResponse.json({ error: "Unable to update order status." }, { status: 500 });
  }
}