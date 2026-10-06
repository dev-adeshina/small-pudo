"use client";

import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";

import { signInWithGoogleAdmin } from "@/lib/auth";

type GoogleAuthButtonProps = {
  mode: "sign-in" | "sign-up";
};

export default function GoogleAuthButton({
  mode,
}: GoogleAuthButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleAuth() {
    setError("");
    setLoading(true);

    try {
      await signInWithGoogleAdmin();

      router.push("/admin");
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "EmailNotVerified"
      ) {
        return;
      }

      if (
        error instanceof FirebaseError &&
        error.code === "auth/popup-closed-by-user"
      ) {
        return;
      }

      if (
        error instanceof FirebaseError &&
        error.code === "auth/popup-blocked"
      ) {
        setError("Please allow popups to continue with Google");
      } else if (
        error instanceof FirebaseError &&
        error.code === "auth/account-exists-with-different-credential"
      ) {
        setError(
          "An account already exists with this email. Sign in with your email and password."
        );
      } else {
        setError("Unable to continue with Google. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="google-auth-button"
        onClick={handleGoogleAuth}
        disabled={loading}
      >
        <span className="google-auth-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.27-2.09 3.57-5.17 3.57-8.64Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.87-3c-1.07.72-2.44 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.25v3.09A12 12 0 0 0 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.25 14.28A7.2 7.2 0 0 1 4.87 12c0-.79.14-1.56.38-2.28V6.63H1.25A12 12 0 0 0 0 12c0 1.94.47 3.78 1.25 5.37l4-3.09Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.76 0 3.34.61 4.59 1.81l3.44-3.44C17.95 1.12 15.24 0 12 0A12 12 0 0 0 1.25 6.63l4 3.09C6.2 6.87 8.86 4.75 12 4.75Z"
            />
          </svg>
        </span>

        <span>
          {loading
            ? "Connecting..."
            : mode === "sign-up"
              ? "Sign up with Google"
              : "Sign in with Google"}
        </span>
      </button>

      {error && (
        <div className="google-auth-error">
          {error}
        </div>
      )}
    </>
  );
}