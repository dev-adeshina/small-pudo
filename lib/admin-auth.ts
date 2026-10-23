import type { User } from "firebase/auth";

type AdminVerificationResponse = {
  authorized?: boolean;
  email?: string;
  error?: string;
};

export async function verifyAdminAccess(user: User): Promise<string> {
  const token = await user.getIdToken();

  const response = await fetch("/api/admin/auth/verify", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as
    | AdminVerificationResponse
    | null;

  if (response.status === 403) {
    const error = new Error(
      data?.error ?? "You are not authorized to access the admin workspace."
    );
    error.name = "NotAdmin";
    throw error;
  }

  if (response.status === 503) {
    const error = new Error(
      data?.error ?? "Admin access is not configured."
    );
    error.name = "AdminAuthUnavailable";
    throw error;
  }

  if (!response.ok || !data?.authorized || !data.email) {
    const error = new Error(
      data?.error ?? "Unable to verify administrator access."
    );
    error.name = "AdminAuthFailed";
    throw error;
  }

  const claimResponse = await fetch("/api/admin/auth/claim", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const claimData = (await claimResponse.json().catch(() => null)) as
    | { error?: string }
    | null;

  if (!claimResponse.ok) {
    const error = new Error(
      claimData?.error ?? "Unable to establish administrator permissions."
    );

    error.name =
      claimResponse.status === 403
        ? "NotAdmin"
        : "AdminAuthFailed";

    throw error;
  }

  await user.getIdToken(true);
  return data.email;
}
