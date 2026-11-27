import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className = "",
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={["vl-page-header", className].filter(Boolean).join(" ")}>
      <div className="vl-page-header__copy">
        {eyebrow && <span className="vl-page-header__eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="vl-page-header__actions">{actions}</div>}
    </header>
  );
}
