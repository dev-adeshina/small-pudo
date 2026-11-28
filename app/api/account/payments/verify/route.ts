import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
// @ts-ignore Payment commands are runtime-neutral ESM.
import { createPaymentCommands } from "@/lib/shipment/payment-commands.mjs";
// @ts-ignore Shipment runtime selects the environment-specific database.
import { createShipmentFirestoreRuntime } from "@/lib/shipment/firestore-runtime.mjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token, checkRevoked) => adminAuth.verifyIdToken(token, checkRevoked),
  );
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "A valid payment reference is required." }, { status: 400 }); }
  const reference = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>).reference : null;
  if (typeof reference !== "string" || !reference.trim() || reference.length > 200) {
    return NextResponse.json({ error: "A valid payment reference is required." }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "Payment verification is unavailable." }, { status: 503 });

  try {
    const runtime = createShipmentFirestoreRuntime();
    const ownership = await runtime.ports.transaction.run(async (tx: any) => {
      const payment = await runtime.ports.payments.getByProviderReference(tx, reference.trim());
      if (!payment) return null;
      const shipment = await runtime.ports.shipments.getById(tx, payment.shipmentId);
      if (!shipment || shipment.customerId !== customer.uid) return null;
      return {
        paymentId: payment.paymentId,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        paymentStatus: payment.status,
        shipmentId: payment.shipmentId,
        shipmentStatus: shipment.status,
      };
    });
    if (!ownership) return NextResponse.json({ error: "Payment reference not found." }, { status: 404 });
    if (ownership.paymentStatus === "successful" && ownership.shipmentStatus === "Confirmed") {
      return NextResponse.json({
        success: true,
        shipmentId: ownership.shipmentId,
        status: "Confirmed",
        paymentStatus: "successful",
        message: "This shipment payment has already been verified.",
      });
    }

    const providerResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference.trim())}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}`, Accept: "application/json" },
      cache: "no-store",
    });
    const providerResult = await providerResponse.json().catch(() => null);
    const providerPayment = providerResult?.data;
    if (!providerResponse.ok || providerResult?.status !== true ||
        !providerPayment || providerPayment.reference !== reference.trim()) {
      return NextResponse.json({ success: false, error: "Paystack could not verify this payment reference." }, { status: 502 });
    }
    if (providerPayment.amount !== ownership.amountMinor || providerPayment.currency !== ownership.currency) {
      return NextResponse.json({ success: false, error: "The verified payment amount or currency does not match this shipment." }, { status: 409 });
    }

    if (providerPayment.status !== "success") {
      const nextStatus = providerPayment.status === "failed" ? "failed" :
        providerPayment.status === "abandoned" ? "abandoned" :
        ["ongoing", "pending"].includes(String(providerPayment.status)) ? "pending" : null;
      if (!nextStatus) {
        return NextResponse.json({ success: false, error: "Paystack has not reported a completed payment. Check again shortly." }, { status: 409 });
      }
      await runtime.ports.transaction.run(async (tx: any) => {
        const payment = await runtime.ports.payments.getByProviderReference(tx, reference.trim());
        if (!payment || payment.paymentId !== ownership.paymentId) throw new Error("PAYMENT_ATTEMPT_CHANGED");
        const shipment = await runtime.ports.shipments.getById(tx, ownership.shipmentId);
        if (!shipment || shipment.customerId !== customer.uid || shipment.paymentId !== ownership.paymentId) {
          throw new Error("PAYMENT_NO_LONGER_CURRENT");
        }
        const timestamp = new Date().toISOString();
        await runtime.ports.payments.updateAttempt(tx, ownership.paymentId, {
          status: nextStatus,
          providerStatus: String(providerPayment.status),
          ...(nextStatus === "failed" ? { failedAt: timestamp } : {}),
          ...(nextStatus === "abandoned" ? { abandonedAt: timestamp } : {}),
        });
        await runtime.ports.shipments.update(tx, ownership.shipmentId, {
          paymentStatus: nextStatus,
          updatedAt: timestamp,
        });
      });
      return NextResponse.json({
        success: false,
        paymentStatus: nextStatus,
        error: nextStatus === "pending"
          ? "Your payment is still processing. Check again shortly."
          : "Paystack did not complete this payment. You can return to the shipment and try again.",
      }, { status: 409 });
    }

    const commands = createPaymentCommands({
      ports: runtime.ports,
      idFactory: (prefix: string) => `${prefix}_${randomUUID()}`,
      paymentVerifier: async ({ providerReference }: { provider: string; providerReference: string }) => ({
        verified: providerPayment.reference === providerReference,
        provider: "paystack",
        providerReference: providerPayment.reference,
        status: providerPayment.status === "success" ? "successful" : providerPayment.status,
        amountMinor: providerPayment.amount,
        currency: providerPayment.currency,
        verifiedAt: providerPayment.paid_at,
      }),
    });
    const result = await commands.confirmVerifiedPayment({
      providerReference: reference.trim(),
      idempotencyKey: `customer_callback_${reference.trim()}`,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify this payment.";
    const code = (error as { code?: string })?.code;
    const status = code === "PAYMENT_NOT_VERIFIED" || code === "PAYMENT_AMOUNT_MISMATCH" ? 409 :
      code === "PAYMENT_ATTEMPT_NOT_FOUND" ? 404 : 502;
    if (status === 502) console.error("Shipment Paystack verification failed:", error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
