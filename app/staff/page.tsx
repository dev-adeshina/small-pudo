"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ClipboardList, FileText, LogOut, MapPinned, MapPin, Route, ShieldCheck, Users } from "lucide-react";
import { auth } from "@/lib/firebase";

const workspaces = [
  { title: "Operational cost definitions", description: "Configure activity-level cost evidence and manage the approval workflow.", href: "/staff/operational-cost-definitions", icon: ClipboardList, group: "Commercial" },
  { title: "Commercial pricing definitions", description: "Configure service pricing models, versions, approvals and publication.", href: "/staff/commercial-pricing-definitions", icon: FileText, group: "Commercial" },
  { title: "Route distance evidence", description: "Record and review supported operational route-distance measurements.", href: "/staff/commercial-route-distance", icon: Route, group: "Commercial" },
  { title: "Quotation readiness", description: "Manage service capability, endpoint eligibility and quotation-readiness evidence.", href: "/staff/commercial-quotation-readiness", icon: ShieldCheck, group: "Commercial" },
  { title: "PUDO locations", description: "Register and maintain proposed PUDO location candidates.", href: "/staff/pudo-locations", icon: MapPin, group: "PUDO operations" },
  { title: "PUDO verification queue", description: "Review inspection evidence and record location verification decisions.", href: "/staff/pudo-verifications", icon: MapPinned, group: "PUDO operations" },
  { title: "Staff delegations", description: "Delegate only activities you are explicitly authorised to delegate.", href: "/staff/delegations", icon: Users, group: "Access" },
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

  if (checking || !user) return <main className="admin-loading"><span>Checking your staff session...</span></main>;

  const firstName = user.displayName?.trim().split(/\s+/)[0] || user.email?.split("@")[0] || "there";
  const groups = ["Commercial", "PUDO operations", "Access"];

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/" className="admin-logo" aria-label="VeriLyft home">
          <Image src="/logo.svg" alt="VeriLyft" width={90} height={30} priority />
        </Link>
        <div className="admin-header-right">
          <span className="admin-email">{user.email}</span>
          <button type="button" className="admin-logout" onClick={handleSignOut} disabled={signingOut} aria-label="Sign out" title="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <div className="admin-shell cost-admin-shell">
        <section className="admin-welcome">
          <div>
            <span className="eyebrow">VERILYFT / STAFF DASHBOARD</span>
            <h1>Good to see you.<br /><em>{firstName}.</em></h1>
            <p>Your operational workspaces, commercial evidence and PUDO activities in one place.</p>
          </div>
          <div className="admin-date">
            <span>STAFF WORKSPACE</span>
            <strong>VERILYFT OPERATIONS</strong>
          </div>
        </section>

        {error && <p className="cost-feedback cost-feedback-error" role="alert">{error}</p>}

        {groups.map((group, index) => {
          const items = workspaces.filter((item) => item.group === group);
          return (
            <section className="staff-dashboard-section" key={group}>
              <div className="admin-panel-heading">
                <div>
                  <span className="section-label">0{index + 1} / {group.toUpperCase()}</span>
                  <h2>{group === "Access" ? "Delegated activities" : group === "Commercial" ? "Commercial workspaces" : "PUDO operations"}</h2>
                </div>
                <span className="admin-email">{items.length} workspaces</span>
              </div>
              <div className="staff-dashboard-grid">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link href={item.href} key={item.href} className="staff-dashboard-card">
                      <span className="staff-dashboard-card-icon"><Icon size={20} /></span>
                      <span className="staff-dashboard-card-copy">
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </span>
                      <ArrowUpRight size={18} className="staff-dashboard-arrow" />
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
        <p className="cost-footer-note">A visible workspace link does not grant permission to perform its actions. Each operation is independently authorised by the server. Staff permission assignment remains an administrator-only function.</p>
      </div>
    </main>
  );
}
