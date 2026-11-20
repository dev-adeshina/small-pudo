"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

type StaffActionDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  reasonLabel?: string;
  reasonRequired?: boolean;
  busy?: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
};

export function StaffActionDialog({
  open, title, description, confirmLabel, reasonLabel, reasonRequired = false,
  busy = false, danger = false, onCancel, onConfirm,
}: StaffActionDialogProps) {
  const [reason, setReason] = useState("");
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) { setReason(""); return; }
    confirmRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-action-dialog-title"
        aria-describedby="staff-action-dialog-description"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className={`mt-1 rounded-full p-2 ${danger ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
            <AlertTriangle size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="staff-action-dialog-title" className="text-lg font-semibold text-slate-900">{title}</h2>
            <p id="staff-action-dialog-description" className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <button type="button" onClick={onCancel} disabled={busy} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"><X size={18} /></button>
        </div>
        {reasonLabel && (
          <label className="mt-5 block text-sm font-medium text-slate-800">
            {reasonLabel}{reasonRequired ? " *" : " (optional)"}
            <textarea
              autoFocus
              required={reasonRequired}
              maxLength={2000}
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-base outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Enter a clear reason..."
            />
          </label>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className="cost-secondary-button" onClick={onCancel} disabled={busy}>Cancel</button>
          <button
            ref={confirmRef}
            type="button"
            className={danger ? "cost-danger-button" : "cost-primary-button"}
            disabled={busy || (reasonRequired && !reason.trim())}
            onClick={() => void onConfirm(reason.trim())}
          >
            {busy ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
