"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard, ClipboardList, FileText, Route, ShieldCheck,
  MapPin, MapPinned, Users, UserRoundCheck, CalendarClock, Compass, Network,
} from "lucide-react";
import { StaffActivationProvider, useStaffActivation } from "@/components/staff/StaffActivationProvider";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/design-system/Breadcrumbs";

const navigation = [
  { label: "Overview", href: "/staff", icon: LayoutDashboard, section: "WORKSPACE" },
  { label: "Account activation", href: "/staff#staff-account-activation", icon: UserRoundCheck, section: "WORKSPACE", activation: true },
  { label: "Operational costs", href: "/staff/operational-cost-definitions", icon: ClipboardList, section: "COMMERCIAL" },
  { label: "Commercial pricing", href: "/staff/commercial-pricing-definitions", icon: FileText, section: "COMMERCIAL" },
  { label: "Route distance", href: "/staff/commercial-route-distance", icon: Route, section: "COMMERCIAL" },
  { label: "Quotation readiness", href: "/staff/commercial-quotation-readiness", icon: ShieldCheck, section: "COMMERCIAL" },
  { label: "PUDO locations", href: "/staff/pudo-locations", icon: MapPin, section: "PUDO OPERATIONS" },
  { label: "Verification queue", href: "/staff/pudo-verifications", icon: MapPinned, section: "PUDO OPERATIONS" },
  { label: "Availability & capacity", href: "/staff/pudo-operations", icon: CalendarClock, section: "PUDO OPERATIONS" },
  { label: "Operational directory", href: "/staff/pudo-directory", icon: Compass, section: "PUDO OPERATIONS" },
  { label: "Network connections", href: "/staff/pudo-network-connections", icon: Network, section: "PUDO OPERATIONS" },
  { label: "Delegations", href: "/staff/delegations", icon: Users, section: "ACCESS" },
];

function activationLabel(status: string) {
  if (status === "pending") return "Pending";
  if (status === "active") return "Activated";
  if (status === "expired") return "Expired";
  if (status === "none") return "No invite";
  return "Checking";
}

function StaffWorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status } = useStaffActivation();
  const sections = [...new Set(navigation.map((item) => item.section))];
  const breadcrumbItems: BreadcrumbItem[] = [{ label: "Dashboard", href: "/staff" }];
  let breadcrumbPath = "/staff";
  for (const segment of pathname.split("/").filter(Boolean).slice(1)) {
    breadcrumbPath += `/${segment}`;
    const match = navigation.find((item) => item.href === breadcrumbPath);
    const label = match?.label ?? segment.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    breadcrumbItems.push({ label, href: match ? breadcrumbPath : undefined });
  }

  return (
    <div className="staff-workspace-layout">
      <aside className="staff-workspace-sidebar" aria-label="Staff workspace navigation">
        <Link href="/staff" className="staff-sidebar-brand">
          <span className="staff-sidebar-mark">V</span>
          <span><strong>VeriLyft</strong><small>STAFF WORKSPACE</small></span>
        </Link>
        <nav className="staff-sidebar-nav">
          {sections.map((section) => (
            <div className="staff-sidebar-group" key={section}>
              <span className="staff-sidebar-section">{section}</span>
              {navigation.filter((item) => item.section === section).map((item) => {
                const Icon = item.icon;
                const isActivation = "activation" in item && item.activation === true;
                const active = isActivation
                  ? pathname === "/staff" && (status === "pending" || status === "expired")
                  : item.href === "/staff"
                    ? pathname === "/staff" && status !== "pending" && status !== "expired"
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href}
                    className={"staff-sidebar-link" + (active ? " is-active" : "")}
                    aria-current={active ? "page" : undefined}>
                    <Icon size={17} strokeWidth={1.8} />
                    <span>{item.label}</span>
                    {isActivation && <small className={"staff-sidebar-status is-" + status}>{activationLabel(status)}</small>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <p className="staff-sidebar-note">Account activation confirms staff onboarding only. Operational permissions are assigned separately by an authorised administrator. Workspace visibility does not grant action permissions.</p>
      </aside>
      <div className="staff-workspace-content">
        <div className="staff-workspace-breadcrumbs"><Breadcrumbs items={breadcrumbItems} /></div>
        {children}
      </div>
    </div>
  );
}

export default function StaffLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/staff/sign-in" || pathname === "/staff/accept-invitation") return children;

  return (
    <StaffActivationProvider>
      <StaffWorkspaceShell>{children}</StaffWorkspaceShell>
    </StaffActivationProvider>
  );
}
