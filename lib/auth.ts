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

export async function signUpAdmin(email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Firebase automatically signs the user in after registration.
  // Send verification email before signing them out.
  await sendEmailVerification(credential.user);

  // Do not leave a newly registered, unverified admin signed in.
  await signOut(auth);

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

    const error = new Error("Email not verified");
    error.name = "EmailNotVerified";

    throw error;
  }

  return credential.user;
}


export async function signInWithGoogleAdmin() {
  const provider = new GoogleAuthProvider();

  const credential = await signInWithPopup(auth, provider);

  // Google accounts normally have verified email addresses,
  // but keep the same verification protection.
  if (!credential.user.emailVerified) {
    await signOut(auth);

    const error = new Error("Email not verified");
    error.name = "EmailNotVerified";

    throw error;
  }

  return credential.user;
}

export async function resetAdminPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function logoutAdmin() {
  return signOut(auth);
}