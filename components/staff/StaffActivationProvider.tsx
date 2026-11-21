"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export type StaffActivationStatus = "pending" | "active" | "none" | "expired" | "unknown";

type StaffActivationContextValue = {
  status: StaffActivationStatus;
  activating: boolean;
  activationMessage: string;
  activateAccount: () => Promise<void>;
};

const StaffActivationContext = createContext<StaffActivationContextValue | null>(null);

export function StaffActivationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StaffActivationStatus>("unknown");
  const [activating, setActivating] = useState(false);
  const [activationMessage, setActivationMessage] = useState("");

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      setStatus("unknown");
      setActivationMessage("");
      if (!user || !user.emailVerified) {
        setStatus("none");
        return;
      }
      try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/staff/invitations/activate", {
          headers: { Authorization: "Bearer " + idToken },
          cache: "no-store",
        });
        const result = await response.json();
        if (!active) return;
        if (response.ok && ["pending", "active", "expired", "none"].includes(result.status)) {
          setStatus(result.status as StaffActivationStatus);
        } else {
          setStatus("unknown");
        }
      } catch {
        if (active) setStatus("unknown");
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const activateAccount = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !user.emailVerified) {
      throw new Error("Sign in with the invited account and verify its email before activating staff access.");
    }
    setActivating(true);
    setActivationMessage("");
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/staff/invitations/activate", {
        method: "POST",
        headers: { Authorization: "Bearer " + idToken },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Staff activation could not be completed.");
      setStatus("active");
      setActivationMessage(result.message ?? "Your staff account is active. No operational permissions have been assigned.");
    } finally {
      setActivating(false);
    }
  }, []);

  const value = useMemo(() => ({ status, activating, activationMessage, activateAccount }), [status, activating, activationMessage, activateAccount]);
  return <StaffActivationContext.Provider value={value}>{children}</StaffActivationContext.Provider>;
}

export function useStaffActivation() {
  const value = useContext(StaffActivationContext);
  if (!value) throw new Error("useStaffActivation must be used inside StaffActivationProvider.");
  return value;
}
