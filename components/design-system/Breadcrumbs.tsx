import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className = "" }: { items: BreadcrumbItem[]; className?: string }) {
  if (!items.length) return null;

  return (
    <nav className={["vl-breadcrumbs", className].filter(Boolean).join(" ")} aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {index > 0 && <span aria-hidden="true">/</span>}
              {item.href && !current ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span aria-current={current ? "page" : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
