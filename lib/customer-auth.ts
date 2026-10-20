import {
  createUserWithEmailAndPassword,
  getIdToken,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth } from "@/lib/firebase";


/**
 * Register a customer, initialize their Firestore profile,
 * and send an email verification link.
 */
export async function registerCustomer(
  displayName: string,
  phone: string,
  email: string,
  password: string
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = displayName.trim();
  const normalizedPhone = phone.trim();

  const credential = await createUserWithEmailAndPassword(
    auth,
    normalizedEmail,
    password
  );

  let profileSaved = false;

  try {
    await updateProfile(credential.user, {
      displayName: normalizedName,
    });

    const idToken = await getIdToken(credential.user);

    const response = await fetch("/api/account/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        displayName: normalizedName,
        phone: normalizedPhone,
      }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);

      throw new Error(
        typeof result?.error === "string"
          ? result.error
          : "Unable to save your customer profile."
      );
    }

    profileSaved = true;

    await sendEmailVerification(credential.user);
  } catch (error) {
    /*
     * If the profile could not be saved, attempt to remove the
     * newly created Auth account so the customer can retry
     * registration rather than being stuck with an incomplete account.
     *
     * If email delivery fails after the profile is saved, retain
     * the account and profile.
     */
    if (!profileSaved) {
      try {
        const { deleteUser } = await import("firebase/auth");
        await deleteUser(credential.user);
      } catch (cleanupError) {
        console.error(
          "Could not clean up incomplete customer registration:",
          cleanupError
        );
      }
    }

    throw error;
  } finally {
    // Do not leave an unverified customer signed in.
    await signOut(auth);
  }
}

/**
 * Sign in an existing customer.
 *
 * Customers must verify their email address before
 * accessing their account.
 */
export async function signInCustomer(
  email: string,
  password: string
) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  if (!credential.user.emailVerified) {
    await signOut(auth);

    const error = new Error(
      "Please verify your email address before signing in."
    );

    error.name = "EmailNotVerified";

    throw error;
  }

  return credential.user;
}

/**
 * Send a customer password-reset email.
 */
export async function resetCustomerPassword(
  email: string
): Promise<void> {
  await sendPasswordResetEmail(
    auth,
    email.trim().toLowerCase()
  );
}

/**
 * Sign out the currently authenticated customer.
 */
export async function signOutCustomer(): Promise<void> {
  await signOut(auth);
}



