import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { adminAuth } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
// @ts-expect-error -- Payment commands are runtime-neutral ESM.
import { createPaymentCommands } from "@/lib/shipment/payment-commands.mjs";
// @ts-expect-error -- Shipment runtime selects the environment-specific database.
import { createShipmentFirestoreRuntime } from "@/lib/shipment/firestore-runtime.mjs";

export const runtime = "nodejs";
type Context = { params: Promise<{ shipmentId: string }> };

export async function POST(request: Request, context: Context) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token, checkRevoked) => adminAuth.verifyIdToken(token, checkRevoked),
  );
  if (!customer.success) return NextResponse.json({ error: customer.error }, { status: customer.status });

  const { shipmentId } = await context.params;
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(shipmentId)) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!secretKey || !appUrl) return NextResponse.json({ error: "Payment service is not configured." }, { status: 503 });

  let runtime: ReturnType<typeof createShipmentFirestoreRuntime> | null = null;
  let attempt: { paymentId: string; providerReference: string; amountMinor: number; currency: string } | null = null;
  try {
    const shipmentRuntime = createShipmentFirestoreRuntime();
    runtime = shipmentRuntime;
    const existing = await shipmentRuntime.ports.transaction.run(async (tx: any) => {
      const shipment = await shipmentRuntime.ports.shipments.getById(tx, shipmentId);
      if (!shipment || shipment.customerId !== customer.uid) return null;
      const payment = shipment.paymentId ? await shipmentRuntime.ports.payments.getById(tx, shipment.paymentId) : null;
      return { shipment, payment };
    });
    if (!existing) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
    if (existing.shipment.status !== "Awaiting Payment") {
      return NextResponse.json({ error: "This shipment is not currently awaiting payment." }, { status: 409 });
    }
    if (existing.payment?.status === "successful") {
      return NextResponse.json({ error: "This shipment payment has already been confirmed." }, { status: 409 });
    }
    if (["initialised", "pending"].includes(String(existing.payment?.status))) {
      if (typeof existing.payment?.authorizationUrl === "string") {
        return NextResponse.json({
          success: true,
          paymentId: existing.payment.paymentId,
          reference: existing.payment.providerReference,
          authorizationUrl: existing.payment.authorizationUrl,
          amountMinor: existing.payment.amountMinor,
          currency: existing.payment.currency,
        });
      }
      return NextResponse.json({ error: "A payment attempt is already being initialized. Refresh the shipment status before trying again." }, { status: 409 });
    }

    const authUser = await adminAuth.getUser(customer.uid);
    if (!authUser.email) return NextResponse.json({ error: "Your customer account needs an email address before payment can be initialized." }, { status: 400 });

    const commands = createPaymentCommands({
      ports: shipmentRuntime.ports,
      idFactory: (prefix: string) => `${prefix}_${randomUUID()}`,
      paymentVerifier: async () => ({ verified: false }),
    });
    const createdAttempt = await commands.createPaymentAttempt({
      actor: { type: "customer", id: customer.uid },
      idempotencyKey: request.headers.get("idempotency-key")?.trim() || randomUUID(),
      shipmentId,
    });
    attempt = createdAttempt;
    const existingPayment = await shipmentRuntime.ports.transaction.run((tx: any) =>
      shipmentRuntime.ports.payments.getById(tx, createdAttempt.paymentId)
    );
    if (typeof existingPayment?.authorizationUrl === "string") {
      return NextResponse.json({
        success: true,
        paymentId: createdAttempt.paymentId,
        reference: createdAttempt.providerReference,
        authorizationUrl: existingPayment.authorizationUrl,
        amountMinor: createdAttempt.amountMinor,
        currency: createdAttempt.currency,
      }, { status: 200 });
    }

    const baseUrl = new URL(appUrl);
    if (!["http:", "https:"].includes(baseUrl.protocol)) throw new Error("The configured application URL is invalid.");
    const providerResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: authUser.email,
        amount: String(createdAttempt.amountMinor),
        currency: createdAttempt.currency,
        reference: createdAttempt.providerReference,
        callback_url: new URL("/payment/shipment-callback", baseUrl).toString(),
        metadata: { shipmentId, paymentId: createdAttempt.paymentId, purpose: "verilyft_shipment" },
      }),
      cache: "no-store",
    });
    const provider = await providerResponse.json().catch(() => null);
    const authorizationUrl = provider?.data?.authorization_url;
    if (!providerResponse.ok || provider?.status !== true ||
        provider?.data?.reference !== createdAttempt.providerReference ||
        typeof authorizationUrl !== "string") {
      throw new Error("Paystack could not initialize this payment.");
    }
    const checkout = new URL(authorizationUrl);
    if (checkout.protocol !== "https:" || checkout.hostname !== "checkout.paystack.com") {
      throw new Error("Paystack returned an invalid checkout destination.");
    }
    await shipmentRuntime.ports.transaction.run((tx: any) =>
      shipmentRuntime.ports.payments.updateAttempt(tx, createdAttempt.paymentId, {
        authorizationUrl: checkout.toString(),
        providerStatus: "initialized",
      })
    );
    return NextResponse.json({
      success: true,
      paymentId: createdAttempt.paymentId,
      reference: createdAttempt.providerReference,
      authorizationUrl: checkout.toString(),
      amountMinor: createdAttempt.amountMinor,
      currency: createdAttempt.currency,
    }, { status: 201 });
  } catch (error) {
    const failedRuntime = runtime;
    const failedAttempt = attempt;
    if (failedRuntime && failedAttempt) {
      try {
        await failedRuntime.ports.transaction.run(async (tx: any) => {
          await failedRuntime.ports.payments.updateAttempt(tx, failedAttempt.paymentId, {
            status: "failed",
            failedAt: new Date().toISOString(),
            providerStatus: "initialization_failed",
          });
        });
      } catch (recordError) {
        console.error("Failed to record shipment payment initialization failure:", recordError);
      }
    }
    const message = error instanceof Error ? error.message : "Unable to initialize shipment payment.";
    const code = (error as { code?: string })?.code;
    const status = code === "FORBIDDEN_OWNER" || code === "SHIPMENT_NOT_FOUND" ? 404 :
      code === "PAYMENT_ATTEMPT_ACTIVE" || code === "PAYMENT_NOT_ALLOWED" ? 409 :
      error instanceof TypeError ? 400 : 502;
    if (status >= 500) console.error("Shipment payment initialization failed:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
