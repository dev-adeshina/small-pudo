import type { ReactNode } from "react";

export function SurfaceCard({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={["vl-card", className].filter(Boolean).join(" ")}>
      {(title || description || actions) && (
        <header className="vl-card__header">
          <div>
            {title && <h2 className="vl-card__title">{title}</h2>}
            {description && <p className="vl-card__description">{description}</p>}
          </div>
          {actions && <div className="vl-card__actions">{actions}</div>}
        </header>
      )}
      <div className="vl-card__body">{children}</div>
    </section>
  );
}
