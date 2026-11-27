"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/design-system/Breadcrumbs";

export interface WorkspaceNavigationItem {
  label: string;
  href: string;
  section: string;
  icon?: LucideIcon;
}

export function WorkspaceShell({
  workspaceName,
  workspaceLabel,
  navigation,
  children,
  topbarContent,
  breadcrumbs,
}: {
  workspaceName: string;
  workspaceLabel: string;
  navigation: WorkspaceNavigationItem[];
  children: ReactNode;
  topbarContent?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}) {
  const pathname = usePathname();
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    const syncHash = () => setCurrentHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  const sections = [...new Set(navigation.map((item) => item.section))];
  const matchingNavigation = navigation.filter((item) => {
    const itemPath = item.href.split("#")[0];
    return pathname === itemPath || pathname.startsWith(itemPath + "/");
  });
  const hashMatch = currentHash
    ? matchingNavigation.find((item) => item.href.split("#")[1] === currentHash.slice(1))
    : undefined;
  const longestPathLength = Math.max(
    0,
    ...matchingNavigation.map((item) => item.href.split("#")[0].length)
  );
  const activeNavigation =
    hashMatch ??
    matchingNavigation
      .filter((item) => item.href.split("#")[0].length === longestPathLength)
      .find((item) => !item.href.includes("#")) ??
    matchingNavigation.find(
      (item) => item.href.split("#")[0].length === longestPathLength
    );

  return (
    <div className="vl-workspace">
      <aside className="vl-workspace__sidebar" aria-label={`${workspaceName} navigation`}>
        <Link href={navigation[0]?.href ?? "/"} className="vl-workspace__brand">
          <span className="vl-workspace__brand-mark" aria-hidden="true">V</span>
          <span>{workspaceName}<small>{workspaceLabel}</small></span>
        </Link>
        <nav className="vl-workspace-nav" aria-label="Workspace sections">
          {sections.map((section) => (
            <div className="vl-workspace-nav__group" key={section}>
              <span className="vl-workspace-nav__label">{section}</span>
              {navigation.filter((item) => item.section === section).map((item) => {
                const Icon = item.icon;
                const active = activeNavigation === item;
                return (
                  <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
                    {Icon && <Icon size={17} aria-hidden="true" />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <div className="vl-workspace__main">
        <header className="vl-workspace__topbar">
          <span className="vl-workspace__topbar-label">{workspaceLabel}</span>
          {topbarContent}
        </header>
        <main className="vl-workspace__content">
          {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
          {children}
        </main>
      </div>
    </div>
  );
}
