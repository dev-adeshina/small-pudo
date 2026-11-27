import type { WorkspaceNavigationItem } from "@/components/design-system/WorkspaceShell";

export const customerWorkspaceNavigation: WorkspaceNavigationItem[] = [
  { label: "Overview", href: "/account", section: "ACCOUNT" },
  { label: "Shipments", href: "/account/shipments", section: "ACCOUNT" },
  { label: "Quotations", href: "/account/quotes", section: "ACCOUNT" },
  { label: "My orders", href: "/account#orders", section: "ACCOUNT" },
  { label: "My profile", href: "/account/profile", section: "ACCOUNT" },
  { label: "Browse store", href: "/products", section: "STORE" },
];

export const adminWorkspaceNavigation: WorkspaceNavigationItem[] = [
  { label: "Dashboard", href: "/admin", section: "OVERVIEW" },
  { label: "Store orders", href: "/admin/orders", section: "STORE" },
  { label: "Products", href: "/admin/products", section: "STORE" },
  { label: "Categories", href: "/admin/categories", section: "STORE" },
  { label: "Pricing definitions", href: "/admin/commercial-pricing-definitions", section: "COMMERCIAL" },
  { label: "Operational costs", href: "/admin/operational-cost-definitions", section: "COMMERCIAL" },
  { label: "Route distance evidence", href: "/admin/commercial-route-distance", section: "COMMERCIAL" },
];
