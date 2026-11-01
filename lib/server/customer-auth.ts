export interface VerifiedCustomer {
  uid: string;
  email_verified?: boolean;
}

export type CustomerAuthenticationResult =
  | { success: true; uid: string }
  | { success: false; status: 401 | 403; error: string };

type TokenVerifier = (token: string) => Promise<VerifiedCustomer>;

/**
 * Verify a Firebase bearer token and require a verified customer email.
 * This helper deliberately does not apply administrator revocation policy.
 */
export async function authenticateVerifiedCustomer(
  authorization: string | null,
  verifyIdToken: TokenVerifier
): Promise<CustomerAuthenticationResult> {
  if (!authorization?.startsWith("Bearer ")) {
    return {
      success: false,
      status: 401,
      error: "Authentication is required.",
    };
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return {
      success: false,
      status: 401,
      error: "Your session is invalid or expired. Please sign in again.",
    };
  }

  try {
    const decodedToken = await verifyIdToken(token);

    if (decodedToken.email_verified !== true) {
      return {
        success: false,
        status: 403,
        error: "Please verify your email address first.",
      };
    }

    return { success: true, uid: decodedToken.uid };
  } catch {
    return {
      success: false,
      status: 401,
      error: "Your session is invalid or expired. Please sign in again.",
    };
  }
}
