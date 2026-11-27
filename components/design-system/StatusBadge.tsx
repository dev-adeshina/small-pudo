type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  return <span className={`vl-status vl-status--${tone}`}>{label}</span>;
}
