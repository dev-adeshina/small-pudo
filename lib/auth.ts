import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import { auth } from "./firebase";
import { verifyAdminAccess } from "./admin-auth";

function createAuthError(name: string, message: string) {
  const error = new Error(message);
  error.name = name;
  return error;
}

// export async function signUpAdmin(email: string, password: string) {
//   const credential = await createUserWithEmailAndPassword(
//     auth,
//     email,
//     password
//   );

//   try {
//     await sendEmailVerification(credential.user);
//   } finally {
//     // Do not leave a newly registered account signed in.
//     await signOut(auth);
//   }

//   return credential.user;
// }


export async function signUpAdmin(email: string, password: string) {
  const response = await fetch("/api/admin/auth/registration-check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
    cache: "no-store",
  });

  const result = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      result?.error ?? "Administrator registration is unavailable."
    );
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  try {
    await sendEmailVerification(credential.user);
  } finally {
    await signOut(auth);
  }

  return credential.user;
}

export async function signInAdmin(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  if (!credential.user.emailVerified) {
    await signOut(auth);
    throw createAuthError("EmailNotVerified", "Email not verified");
  }


  try {
    await verifyAdminAccess(credential.user);
    await credential.user.getIdToken(true);
    return credential.user;
  } catch (error) {
    await signOut(auth);
    throw error;
  }
  // try {
  //   await verifyAdminAccess(credential.user);
  //   return credential.user;
  // } catch (error) {
  //   await signOut(auth);
  //   throw error;
  // }
}

export async function signInWithGoogleAdmin() {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);

  if (!credential.user.emailVerified) {
    await signOut(auth);
    throw createAuthError("EmailNotVerified", "Email not verified");
  }

  try {
    await verifyAdminAccess(credential.user);
    return credential.user;
  } catch (error) {
    await signOut(auth);
    throw error;
  }
}

export async function resetAdminPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function logoutAdmin() {
  return signOut(auth);
}
