import type { InputHTMLAttributes } from "react";

export function TextField({
  id,
  label,
  hint,
  error,
  className = "",
  ...inputProps
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId, inputProps["aria-describedby"]].filter(Boolean).join(" ") || undefined;

  return (
    <div className={["vl-field", className].filter(Boolean).join(" ")}>
      <label className="vl-field__label" htmlFor={id}>
        {label}{inputProps.required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        {...inputProps}
        id={id}
        aria-invalid={error ? true : inputProps["aria-invalid"]}
        aria-describedby={describedBy}
        className={["vl-field__input", error ? "is-invalid" : ""].filter(Boolean).join(" ")}
      />
      {hint && <small className="vl-field__hint" id={hintId}>{hint}</small>}
      {error && <small className="vl-field__error" id={errorId}>{error}</small>}
    </div>
  );
}
