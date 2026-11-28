"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { MapPin, Pencil, Plus, Trash2, UserRound } from "lucide-react";

import { auth } from "@/lib/firebase";
import { signOutCustomer } from "@/lib/customer-auth";
import { WorkspaceShell } from "@/components/design-system/WorkspaceShell";
import { customerWorkspaceNavigation } from "@/components/design-system/workspace-navigation";
import { Button } from "@/components/design-system/Button";
import { FeedbackState } from "@/components/design-system/FeedbackState";
import NigerianLocationField from "@/components/nigerian-location-field";

type Address = {
  addressId: string;
  label: string;
  fullName: string;
  phone: string;
  email?: string;
  country: string;
  state: string;
  city: string;
  addressDescription: string;
};

const EMPTY: Omit<Address, "addressId"> = {
  label: "", fullName: "", phone: "", email: "", country: "Nigeria",
  state: "", city: "", addressDescription: "",
};

export default function CustomerAddressBookPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [locationFieldVersion, setLocationFieldVersion] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadAddresses = useCallback(async (currentUser: User) => {
    setLoading(true);
    setError("");
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/account/addresses", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? "Unable to load saved addresses.");
      setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load saved addresses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) { router.replace("/account/sign-in"); return; }
      if (!currentUser.emailVerified) {
        try { await signOutCustomer(); } finally { router.replace("/account/sign-in"); }
        return;
      }
      setUser(currentUser);
      setChecking(false);
      void loadAddresses(currentUser);
    });
    return () => unsubscribe();
  }, [loadAddresses, router]);

  function edit(address: Address) {
    setEditingId(address.addressId);
    setForm({
      label: address.label, fullName: address.fullName, phone: address.phone,
      email: address.email ?? "", country: address.country, state: address.state,
      city: address.city, addressDescription: address.addressDescription,
    });
    setError("");
    setNotice("");
  }

  function reset() {
    setEditingId("");
    setForm(EMPTY);
    setLocationFieldVersion(version => version + 1);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(editingId ? `/api/account/addresses/${encodeURIComponent(editingId)}` : "/api/account/addresses", {
        method: editingId ? "PATCH" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? "Unable to save this address.");
      reset();
      setNotice(editingId ? "Your saved address has been updated." : "Address saved to your address book.");
      await loadAddresses(user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this address.");
    } finally { setSaving(false); }
  }

  async function remove(addressId: string) {
    if (!user || deletingId) return;
    if (!window.confirm("Remove this address from your address book?")) return;
    setDeletingId(addressId); setError(""); setNotice("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/account/addresses/${encodeURIComponent(addressId)}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? "Unable to remove this address.");
      if (editingId === addressId) reset();
      setNotice("Saved address removed.");
      await loadAddresses(user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove this address.");
    } finally { setDeletingId(""); }
  }

  async function signOut() {
    await signOutCustomer();
    router.replace("/account/sign-in");
  }

  if (checking || !user) return <main className="vl-workspace"><div className="vl-workspace__content"><FeedbackState variant="loading" title="Checking your customer account" description="Verifying your sign-in before opening your address book." /></div></main>;

  return (
    <WorkspaceShell
      workspaceName="VeriLyft"
      workspaceLabel="Customer"
      navigation={customerWorkspaceNavigation}
      breadcrumbs={[{ label: "Customer", href: "/account" }, { label: "Address book" }]}
      topbarContent={<div className="vl-workspace__account-actions"><span>{user.email}</span><Button variant="outline" size="sm" onClick={signOut}>Sign out</Button></div>}
    >
      <div className="customer-page">
        <div className="customer-shell shipment-shell">
          <div className="shipment-heading">
            <span className="eyebrow">VERILYFT / CUSTOMER DETAILS</span>
            <h1>Your address <em>book.</em></h1>
            <p>Save sender and recipient details so you can use them again when preparing shipments.</p>
          </div>
          {error && <p className="customer-error" role="alert">{error}</p>}
          {notice && <p className="shipment-success" role="status">{notice}</p>}
          <section className="customer-panel shipment-form-panel">
            <div className="customer-panel-heading">
              <div><span className="section-label">01 / SAVED CONTACTS</span><h2>{editingId ? "Edit saved address" : "Add an address"}</h2></div>
              <MapPin size={22} />
            </div>
            <form className="shipment-form" onSubmit={save} aria-busy={saving}>
              <label><span>Address label</span><input required maxLength={80} value={form.label} onChange={e => setForm({...form,label:e.target.value})} placeholder="Home, Office, Recipient..." /></label>
              <label><span>Contact name</span><input required maxLength={160} value={form.fullName} onChange={e => setForm({...form,fullName:e.target.value})} /></label>
              <label><span>Phone number</span><input required maxLength={40} value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} /></label>
              <label><span>Email (optional)</span><input type="email" maxLength={254} value={form.email} onChange={e => setForm({...form,email:e.target.value})} /></label>
              <div className="shipment-form-wide">
                <NigerianLocationField
                  key={`${editingId || "new-address"}-${locationFieldVersion}`}
                  label="Address location"
                  placeholder="Start typing a Nigerian city..."
                  initialValue={form.city && form.state ? { city: form.city, state: form.state, country: "Nigeria" } : null}
                  onChange={location => setForm(current => ({ ...current, city: location.city, state: location.state, country: location.country }))}
                />
              </div>
              <label className="shipment-form-wide"><span>Street address and directions</span><textarea required maxLength={500} rows={3} value={form.addressDescription} onChange={e => setForm({...form,addressDescription:e.target.value})} /></label>
              <div className="shipment-form-actions shipment-form-wide">
                <Button type="submit" loading={saving} leadingIcon={<Plus size={16} />}>{editingId ? "Save changes" : "Save address"}</Button>
                {editingId && <Button type="button" variant="outline" onClick={reset} disabled={saving}>Cancel</Button>}
              </div>
            </form>
          </section>
          <section className="customer-panel">
            <div className="customer-panel-heading"><div><span className="section-label">02 / YOUR ADDRESS BOOK</span><h2>Saved addresses</h2></div><span className="customer-order-count">{addresses.length} saved</span></div>
            {loading ? <p>Loading saved addresses...</p> : addresses.length === 0 ? <div className="customer-state"><UserRound size={25}/><h3>No saved addresses yet</h3><p>Add a sender or recipient address above. You can reuse it when creating a shipment.</p></div> :
              <div className="shipment-draft-list">
                {addresses.map(address => <article className="shipment-draft-row" key={address.addressId}>
                  <div><span className="shipment-draft-status">{address.label}</span><strong>{address.fullName}</strong><p>{address.phone}{address.email ? ` · ${address.email}` : ""}</p><p>{address.addressDescription}, {address.city}, {address.state}, {address.country}</p></div>
                  <div className="shipment-form-actions"><Button type="button" variant="outline" size="sm" leadingIcon={<Pencil size={15}/>} onClick={() => edit(address)}>Edit</Button><Button type="button" variant="ghost" size="sm" leadingIcon={<Trash2 size={15}/>} loading={deletingId===address.addressId} onClick={() => void remove(address.addressId)}>Remove</Button></div>
                </article>)}
              </div>
            }
          </section>
          <p><Link href="/account/shipments" className="customer-secondary-action">Continue to shipment preparation →</Link></p>
        </div>
      </div>
    </WorkspaceShell>
  );
}
