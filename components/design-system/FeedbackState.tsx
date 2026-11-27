import type { ReactNode } from "react";

type FeedbackVariant = "empty" | "error" | "loading";

export function FeedbackState({
  variant,
  title,
  description,
  icon,
  action,
}: {
  variant: FeedbackVariant;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={`vl-feedback vl-feedback--${variant}`} role={variant === "error" ? "alert" : "status"}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <div className="vl-feedback__content">
        <h2 className="vl-feedback__title">{title}</h2>
        {description && <p className="vl-feedback__description">{description}</p>}
        {action && <div style={{ marginTop: 14 }}>{action}</div>}
      </div>
    </section>
  );
}
