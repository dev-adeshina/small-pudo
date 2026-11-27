import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leadingIcon,
  trailingIcon,
  disabled,
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const classes = ["vl-button", `vl-button--${variant}`, size === "md" ? "" : `vl-button--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...props} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined}>
      {loading ? <span aria-hidden="true">…</span> : leadingIcon}
      <span>{children}</span>
      {!loading && trailingIcon}
    </button>
  );
}
