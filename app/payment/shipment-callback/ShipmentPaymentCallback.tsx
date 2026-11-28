"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";

type Result = { success?: boolean; error?: string; status?: string; shipmentId?: string };

function CallbackContent() {
  const search = useSearchParams();
  const reference = search.get("reference") || search.get("trxref");
  const [state, setState] = useState<"checking" | "verifying" | "success" | "failed">("checking");
  const [message, setMessage] = useState("Checking your customer session.");
  const [shipmentId, setShipmentId] = useState("");

  useEffect(() => {
    if (!reference) { setState("failed"); setMessage("No payment reference was provided."); return; }
    let cancelled = false;
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user) {
        if (!cancelled) { setState("failed"); setMessage("Sign in to your VeriLyft account to verify this shipment payment."); }
        return;
      }
      if (!user.emailVerified) {
        if (!cancelled) { setState("failed"); setMessage("Your customer account must be verified before payment can be confirmed."); }
        return;
      }
      if (cancelled) return;
      setState("verifying"); setMessage("Verifying the transaction directly with Paystack.");
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/account/payments/verify", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const data: Result = await response.json();
        if (cancelled) return;
        if (!response.ok || !data.success) throw new Error(data.error ?? "Payment could not be verified.");
        setShipmentId(data.shipmentId ?? "");
        setState("success");
        setMessage("Your payment has been verified and your shipment booking is confirmed.");
      } catch (error) {
        if (!cancelled) { setState("failed"); setMessage(error instanceof Error ? error.message : "Payment verification failed."); }
      }
    });
    return () => { cancelled = true; unsubscribe(); };
  }, [reference]);

  return <main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-12"><div className="w-full rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
    <h1 className="mb-4 text-2xl font-semibold">{state === "success" ? "Shipment booking confirmed" : state === "failed" ? "Payment not confirmed" : "Verifying shipment payment"}</h1>
    <p className="text-gray-600">{message}</p>
    {shipmentId && <p className="mt-4 text-sm">Shipment ID: <strong>{shipmentId}</strong></p>}
    {state === "verifying" && <p className="mt-4 text-sm text-gray-500">Please keep this page open while verification completes.</p>}
    {state === "success" && shipmentId && <Link className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-white" href={`/account/shipments/${encodeURIComponent(shipmentId)}`}>View shipment</Link>}
    {state === "failed" && <Link className="mt-6 inline-block rounded-lg border border-gray-300 px-5 py-3" href="/account">Return to your account</Link>}
  </div></main>;
}

export default function ShipmentPaymentCallback() {
  return <Suspense fallback={<main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-12">Loading payment status...</main>}><CallbackContent /></Suspense>;
}
