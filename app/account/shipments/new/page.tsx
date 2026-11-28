"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import type { User } from "firebase/auth";
import { ArrowLeft, CheckCircle2, Package, UserRound } from "lucide-react";

import { auth } from "@/lib/firebase";
import { signOutCustomer } from "@/lib/customer-auth";
import { WorkspaceShell } from "@/components/design-system/WorkspaceShell";
import { customerWorkspaceNavigation } from "@/components/design-system/workspace-navigation";
import { Button } from "@/components/design-system/Button";
import { FeedbackState } from "@/components/design-system/FeedbackState";

type ServiceType = "pudo_to_pudo" | "door_to_pudo" | "pudo_to_door" | "door_to_door";
type Address = {
  addressId: string; label: string; fullName: string; phone: string; email?: string;
  country: string; state: string; city: string; addressDescription: string;
};
type Pudo = { locationId: string; name: string; address: string; city?: string; state?: string };

const SERVICES: Array<{ value: ServiceType; label: string; description: string }> = [
  { value: "pudo_to_pudo", label: "PUDO to PUDO", description: "Drop off at an origin PUDO and collect from a destination PUDO." },
  { value: "door_to_pudo", label: "Door to PUDO", description: "Collection from the sender's address and delivery to a destination PUDO." },
  { value: "pudo_to_door", label: "PUDO to Door", description: "Drop off at an origin PUDO and delivery to the recipient's address." },
  { value: "door_to_door", label: "Door to Door", description: "Collection from the sender's address and delivery to the recipient's address." },
];

function endpointKinds(service: ServiceType) {
  return {
    origin: service === "pudo_to_pudo" || service === "pudo_to_door" ? "pudo" : "address",
    destination: service === "pudo_to_pudo" || service === "door_to_pudo" ? "pudo" : "address",
  } as const;
}

export default function NewShipmentPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [pudos, setPudos] = useState<Pudo[]>([]);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [serviceType, setServiceType] = useState<ServiceType>("pudo_to_pudo");
  const [senderAddressId, setSenderAddressId] = useState("");
  const [recipientAddressId, setRecipientAddressId] = useState("");
  const [originPudoId, setOriginPudoId] = useState("");
  const [destinationPudoId, setDestinationPudoId] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [dimensionUnit, setDimensionUnit] = useState("cm");
  const [declaredValue, setDeclaredValue] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<{ shipmentId: string; shipmentReference: string; status: string } | null>(null);
  const submissionKey = useRef<string | null>(null);

  const kinds = useMemo(() => endpointKinds(serviceType), [serviceType]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async currentUser => {
      if (!currentUser) { router.replace("/account/sign-in"); return; }
      if (!currentUser.emailVerified) {
        try { await signOutCustomer(); } finally { router.replace("/account/sign-in"); }
        return;
      }
      setUser(currentUser);
      setChecking(false);
      setLoadingReferences(true);
      try {
        const token = await currentUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [addressResult, pudoResult] = await Promise.allSettled([
          fetch("/api/account/addresses", { headers, cache: "no-store" }),
          fetch("/api/account/available-pudo-locations", { headers, cache: "no-store" }),
        ]);
        const referenceErrors: string[] = [];
        if (addressResult.status === "fulfilled") {
          const addressResponse = addressResult.value;
          const addressData = await addressResponse.json().catch(() => null);
          if (addressResponse.ok && addressData?.success) {
            setAddresses(Array.isArray(addressData.addresses) ? addressData.addresses : []);
          } else {
            referenceErrors.push(addressData?.error ?? "Saved addresses could not be loaded.");
          }
        } else {
          referenceErrors.push("Saved addresses could not be loaded.");
        }
        if (pudoResult.status === "fulfilled") {
          const pudoResponse = pudoResult.value;
          const pudoData = await pudoResponse.json().catch(() => null);
          if (pudoResponse.ok && pudoData?.success) {
            setPudos(Array.isArray(pudoData.locations) ? pudoData.locations : []);
          } else {
            referenceErrors.push(pudoData?.error ?? "Active PUDO locations could not be loaded.");
          }
        } else {
          referenceErrors.push("Active PUDO locations could not be loaded.");
        }
        if (referenceErrors.length) setError(referenceErrors.join(" "));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load shipment locations.");
      } finally { setLoadingReferences(false); }
    });
    return () => unsubscribe();
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || submitting) return;
    setSubmitting(true); setError("");
    try {
      const senderAddress = addresses.find(item => item.addressId === senderAddressId);
      const recipientAddress = addresses.find(item => item.addressId === recipientAddressId);
      const origin = kinds.origin === "pudo"
        ? { type: "pudo", pudoLocationId: originPudoId }
        : senderAddress ? { type: "address", country: senderAddress.country, state: senderAddress.state, city: senderAddress.city, addressDescription: senderAddress.addressDescription } : null;
      const destination = kinds.destination === "pudo"
        ? { type: "pudo", pudoLocationId: destinationPudoId }
        : recipientAddress ? { type: "address", country: recipientAddress.country, state: recipientAddress.state, city: recipientAddress.city, addressDescription: recipientAddress.addressDescription } : null;
      if (!origin || !destination) throw new Error("Choose a saved address or PUDO location for both shipment endpoints.");
      const token = await user.getIdToken();
      const response = await fetch("/api/account/shipments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Idempotency-Key": submissionKey.current ?? (submissionKey.current = crypto.randomUUID()),
        },
        body: JSON.stringify({
          serviceType: serviceType,
          sender: { fullName: senderName, phone: senderPhone, email: senderEmail || null },
          recipient: { fullName: recipientName, phone: recipientPhone, email: recipientEmail || null },
          origin,
          destination,
          parcels: [{
            description, quantity: Number(quantity), declaredWeight: Number(weight), weightUnit,
            measurements: { length: Number(length), width: Number(width), height: Number(height) },
            measurementUnit: dimensionUnit,
            declaredValueMinor: Math.round(Number(declaredValue) * 100),
          }],
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? "Unable to submit your shipment.");
      setSubmitted(data.shipment);
      submissionKey.current = null;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit your shipment.");
    } finally { setSubmitting(false); }
  }

  async function signOut() { await signOutCustomer(); router.replace("/account/sign-in"); }

  if (checking || !user) return <main className="vl-workspace"><div className="vl-workspace__content"><FeedbackState variant="loading" title="Checking your customer account" description="Verifying your sign-in before opening shipment booking." /></div></main>;

  return (
    <WorkspaceShell workspaceName="VeriLyft" workspaceLabel="Customer" navigation={customerWorkspaceNavigation}
      breadcrumbs={[{ label: "Customer", href: "/account" }, { label: "Shipments", href: "/account/shipments" }, { label: "New shipment" }]}
      topbarContent={<div className="vl-workspace__account-actions"><span>{user.email}</span><Button variant="outline" size="sm" onClick={signOut}>Sign out</Button></div>}>
      <div className="customer-page"><div className="customer-shell shipment-shell">
        <div className="shipment-heading"><span className="eyebrow">VERILYFT / SHIPMENT BOOKING</span><h1>Send an <em>item.</em></h1><p>Choose a service, provide the sender and recipient details, and describe the parcel. Submitting creates a shipment record, not a confirmed paid booking.</p></div>
        {error && <p className="customer-error" role="alert">{error}</p>}
        {submitted ? <section className="customer-panel">
          <div className="customer-panel-heading"><div><span className="section-label">SHIPMENT SUBMITTED</span><h2>Your shipment has been registered.</h2></div><CheckCircle2 size={24}/></div>
          <p><strong>Shipment reference: {submitted.shipmentReference}</strong></p><p>Status: {submitted.status}</p>
          <p>Your shipment is now available for Admin review and quotation. Payment is not yet due.</p>
          <div className="shipment-form-actions"><Link href="/account" className="customer-secondary-action">Return to dashboard</Link><Link href="/account/shipments" className="customer-secondary-action">Shipment workspace</Link></div>
        </section> : <form className="customer-panel shipment-form-panel shipment-form" onSubmit={submit} aria-busy={submitting}>
          <div className="customer-panel-heading shipment-form-wide"><div><span className="section-label">01 / SERVICE</span><h2>Choose your shipment service</h2></div><Package size={22}/></div>
          <label className="shipment-form-wide"><span>Shipment service</span><select value={serviceType} onChange={e => setServiceType(e.target.value as ServiceType)}>
            {SERVICES.map(service => <option value={service.value} key={service.value}>{service.label}</option>)}
          </select><small>{SERVICES.find(item => item.value === serviceType)?.description}</small></label>
          <div className="customer-panel-heading shipment-form-wide"><div><span className="section-label">02 / PEOPLE</span><h2>Sender and recipient</h2></div><UserRound size={22}/></div>
          <label><span>Sender contact name</span><input required maxLength={160} value={senderName} onChange={e => setSenderName(e.target.value)}/></label>
          <label><span>Sender phone</span><input required maxLength={40} value={senderPhone} onChange={e => setSenderPhone(e.target.value)}/></label>
          <label><span>Sender email (optional)</span><input type="email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)}/></label>
          <label><span>Prefill sender from address book</span><select value={senderAddressId} onChange={e => { const id = e.target.value; setSenderAddressId(id); const address = addresses.find(item => item.addressId === id); if (address) { setSenderName(address.fullName); setSenderPhone(address.phone); setSenderEmail(address.email ?? ""); } }}><option value="">Choose saved contact</option>{addresses.map(a => <option key={a.addressId} value={a.addressId}>{a.label} — {a.fullName}</option>)}</select></label>
          <label><span>Recipient contact name</span><input required maxLength={160} value={recipientName} onChange={e => setRecipientName(e.target.value)}/></label>
          <label><span>Recipient phone</span><input required maxLength={40} value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)}/></label>
          <label><span>Recipient email (optional)</span><input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)}/></label>
          <label><span>Prefill recipient from address book</span><select value={recipientAddressId} onChange={e => { const id = e.target.value; setRecipientAddressId(id); const address = addresses.find(item => item.addressId === id); if (address) { setRecipientName(address.fullName); setRecipientPhone(address.phone); setRecipientEmail(address.email ?? ""); } }}><option value="">Choose saved contact</option>{addresses.map(a => <option key={a.addressId} value={a.addressId}>{a.label} — {a.fullName}</option>)}</select></label>
          <div className="customer-panel-heading shipment-form-wide"><div><span className="section-label">03 / COLLECTION AND DESTINATION</span><h2>Shipment endpoints</h2></div></div>
          {kinds.origin === "pudo" ? <label><span>Origin PUDO</span><select required value={originPudoId} onChange={e => setOriginPudoId(e.target.value)}><option value="">Select origin PUDO</option>{pudos.map(p => <option key={p.locationId} value={p.locationId}>{p.name} — {p.address}{p.city ? `, ${p.city}` : ""}{p.state ? `, ${p.state}` : ""}</option>)}</select></label> :
            <label><span>Sender collection address</span><select required value={senderAddressId} onChange={e => setSenderAddressId(e.target.value)}><option value="">Select sender address</option>{addresses.map(a => <option key={a.addressId} value={a.addressId}>{a.label} — {a.city}, {a.state}</option>)}</select></label>}
          {kinds.destination === "pudo" ? <label><span>Destination PUDO</span><select required value={destinationPudoId} onChange={e => setDestinationPudoId(e.target.value)}><option value="">Select destination PUDO</option>{pudos.map(p => <option key={p.locationId} value={p.locationId}>{p.name} — {p.address}{p.city ? `, ${p.city}` : ""}{p.state ? `, ${p.state}` : ""}</option>)}</select></label> :
            <label><span>Recipient delivery address</span><select required value={recipientAddressId} onChange={e => setRecipientAddressId(e.target.value)}><option value="">Select recipient address</option>{addresses.map(a => <option key={a.addressId} value={a.addressId}>{a.label} — {a.city}, {a.state}</option>)}</select></label>}
          {loadingReferences && <p className="shipment-form-wide">Loading saved addresses and active PUDO locations...</p>}
          {!loadingReferences && addresses.length === 0 && (kinds.origin === "address" || kinds.destination === "address") && <p className="shipment-form-wide">You need a saved address for an address-based endpoint. <Link href="/account/addresses">Add an address</Link>.</p>}
          {!loadingReferences && pudos.length === 0 && (kinds.origin === "pudo" || kinds.destination === "pudo") && <p className="shipment-form-wide">No active PUDO locations are currently available. Choose a door-based service or check back later.</p>}
          <div className="customer-panel-heading shipment-form-wide"><div><span className="section-label">04 / PARCEL</span><h2>Parcel information and measurements</h2></div></div>
          <label className="shipment-form-wide"><span>Parcel description</span><textarea required maxLength={500} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the item being shipped."/></label>
          <label><span>Quantity</span><input required type="number" min="1" max="1000" step="1" value={quantity} onChange={e => setQuantity(e.target.value)}/></label>
          <label><span>Declared weight</span><input required type="number" min="0.01" step="0.01" value={weight} onChange={e => setWeight(e.target.value)}/></label>
          <label><span>Weight unit</span><select value={weightUnit} onChange={e => setWeightUnit(e.target.value)}><option value="kg">Kilograms</option><option value="g">Grams</option></select></label>
          <label><span>Length</span><input required type="number" min="0.01" step="0.01" value={length} onChange={e => setLength(e.target.value)}/></label>
          <label><span>Width</span><input required type="number" min="0.01" step="0.01" value={width} onChange={e => setWidth(e.target.value)}/></label>
          <label><span>Height</span><input required type="number" min="0.01" step="0.01" value={height} onChange={e => setHeight(e.target.value)}/></label>
          <label><span>Dimension unit</span><select value={dimensionUnit} onChange={e => setDimensionUnit(e.target.value)}><option value="cm">Centimetres</option><option value="in">Inches</option></select></label>
          <label><span>Declared value (NGN)</span><input required type="number" min="0" step="0.01" value={declaredValue} onChange={e => setDeclaredValue(e.target.value)}/></label>
          <div className="shipment-form-actions shipment-form-wide"><Button type="submit" loading={submitting}>Submit shipment</Button><Link href="/account/addresses" className="customer-secondary-action">Manage address book</Link></div>
        </form>}
        <p><Link href="/account" className="customer-secondary-action"><ArrowLeft size={15}/> Back to customer dashboard</Link></p>
      </div></div>
    </WorkspaceShell>
  );
}
