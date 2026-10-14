import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

async function authorizeAdmin(request: Request) {
  if (ADMIN_EMAILS.length === 0) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Admin access is not configured. Set ADMIN_EMAILS on the server." },
        { status: 503 }
      ),
    };
  }

  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    };
  }

  try {
    const decoded = await getAuth().verifyIdToken(match[1]);
    const email = decoded.email?.toLowerCase();

    if (!decoded.email_verified || !email || !ADMIN_EMAILS.includes(email)) {
      return {
        ok: false as const,
        response: NextResponse.json({ error: "You are not authorized to manage orders." }, { status: 403 }),
      };
    }

    return { ok: true as const, email };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Your session is invalid or expired. Sign in again." }, { status: 401 }),
    };
  }
}

export async function GET(request: Request) {
  const authorization = await authorizeAdmin(request);
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