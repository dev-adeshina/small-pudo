"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CheckCircle2, ClipboardList, FileText, LogOut, MapPinned, MapPin, Route, ShieldCheck, Users } from "lucide-react";
import { auth } from "@/lib/firebase";

const workspaces = [
  { number: "01", title: "Operational cost definitions", description: "Configure activity-level operational cost evidence and manage its approval workflow.", href: "/staff/operational-cost-definitions", icon: ClipboardList, group: "Commercial" },
  { number: "02", title: "Commercial pricing definitions", description: "Configure service pricing models, versions, approvals and publication.", href: "/staff/commercial-pricing-definitions", icon: FileText, group: "Commercial" },
  { number: "03", title: "Route distance evidence", description: "Record and review supported operational route-distance measurements.", href: "/staff/commercial-route-distance", icon: Route, group: "Commercial" },
  { number: "04", title: "Quotation readiness", description: "Manage service capability, endpoint eligibility and quotation-readiness evidence.", href: "/staff/commercial-quotation-readiness", icon: ShieldCheck, group: "Commercial" },
  { number: "05", title: "PUDO locations", description: "Review and manage PUDO location candidates and their records.", href: "/staff/pudo-locations", icon: MapPin, group: "PUDO operations" },
  { number: "06", title: "Register a PUDO location", description: "Create a PUDO location candidate draft and submit it separately for verification.", href: "/staff/pudo-locations/new", icon: MapPin, group: "PUDO operations" },
  { number: "07", title: "PUDO verification queue", description: "Review inspection evidence and record location verification decisions.", href: "/staff/pudo-verifications", icon: MapPinned, group: "PUDO operations" },
  { number: "08", title: "Staff delegations", description: "Delegate only activities you are explicitly authorised to delegate.", href: "/staff/delegations", icon: Users, group: "Access" },
];

export default function StaffDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!active) return;
      if (!currentUser) { router.replace("/staff/sign-in"); return; }
      if (!currentUser.emailVerified) {
        router.replace("/admin/verify-email?email=" + encodeURIComponent(currentUser.email ?? ""));
        return;
      }
      setUser(currentUser);
      setChecking(false);
    });
    return () => { active = false; unsubscribe(); };
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    setError("");
    try {
      await signOut(auth);
      router.replace("/staff/sign-in");
    } catch {
      setError("We could not sign you out. Please try again.");
      setSigningOut(false);
    }
  }

  if (checking || !user) return <main className="customer-loading"><span>Checking your staff session...</span></main>;

  const firstName = user.displayName?.trim().split(/\s+/)[0] || user.email?.split("@")[0] || "there";
  const groups = ["Commercial", "PUDO operations", "Access"];

  return (
    <main className="customer-page">
      <header className="customer-header">
        <Link href="/" className="customer-logo" aria-label="VeriLyft home">
          <Image src="/logo.svg" alt="VeriLyft" width={150} height={40} priority style={{ width: "auto", height: "auto" }} />
        </Link>
        <div className="customer-header-right">
          <div className="customer-identity"><span className="customer-avatar"><Users size={17} /></span><span className="customer-email">{user.email}</span></div>
          <button type="button" className="customer-logout" onClick={handleSignOut} disabled={signingOut} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button>
        </div>
      </header>

      <div className="customer-shell">
        <section className="customer-welcome">
          <div>
            <span className="eyebrow">VERILYFT / STAFF WORKSPACE</span>
            <h1>Welcome back,<br /><em>{firstName}.</em></h1>
            <p>Your operational workspaces, access-controlled activities and PUDO operations in one place.</p>
          </div>
          <aside className="customer-welcome-note">
            <span className="customer-note-icon"><ShieldCheck size={23} /></span>
            <strong>Staff session verified</strong>
            <p>Workspace actions remain subject to your assigned permissions and the relevant approval controls.</p>
            <span className="customer-verified-label"><CheckCircle2 size={15} /> VERIFIED SESSION</span>
          </aside>
        </section>

        {error && <p className="customer-error" role="alert">{error}</p>}

        {groups.map((group, index) => {
          const items = workspaces.filter((item) => item.group === group);
          return (
            <section className="customer-panel" style={{ marginTop: 24 }} key={group} aria-labelledby={`staff-group-${index}`}>
              <div className="customer-panel-heading">
                <div><span className="section-label">0{index + 1} / {group.toUpperCase()}</span><h2 id={`staff-group-${index}`}>{group === "Access" ? "Delegated activities" : group === "Commercial" ? "Commercial workspaces" : "PUDO location operations"}</h2><p className="customer-panel-description">{group === "Commercial" ? "Pricing, cost evidence, route distances and quotation readiness." : group === "Access" ? "Manage only delegations allowed by your own authority." : "Location candidate records and evidence-based verification."}</p></div>
                <span className="customer-order-count">{items.length} {items.length === 1 ? "workspace" : "workspaces"}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link href={item.href} key={item.href} className="customer-stat-card group block text-left transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
                      <div className="customer-stat-top"><span>{item.number} / {item.group.toUpperCase()}</span><Icon size={20} /></div>
                      <strong className="block text-xl">{item.title}</strong>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Open workspace <ArrowUpRight size={16} /></span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
        <p className="customer-panel-description mt-6">A visible workspace link does not grant permission to perform its actions. Each operation is independently authorised by the server.</p>
      </div>
    </main>
  );
}
