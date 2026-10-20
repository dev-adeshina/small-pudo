import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

async function authenticateCustomer(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 }
      ),
    };
  }

  try {
    const idToken = authorization.slice("Bearer ".length);
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (decodedToken.email_verified !== true) {
      return {
        error: NextResponse.json(
          { error: "Please verify your email address first." },
          { status: 403 }
        ),
      };
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email ?? "",
      displayName: decodedToken.name ?? "",
    };
  } catch {
    return {
      error: NextResponse.json(
        { error: "Your session is invalid or expired. Please sign in again." },
        { status: 401 }
      ),
    };
  }
}

/**
 * GET /api/account/profile
 *
 * Retrieve the authenticated customer's profile.
 */
export async function GET(request: NextRequest) {
  const customer = await authenticateCustomer(request);

  if ("error" in customer) {
    return customer.error;
  }

  try {
    const userRef = adminDb.collection("users").doc(customer.uid);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      // Create a basic profile for an existing customer whose profile
      // document has not yet been created.
      await userRef.set({
        displayName: customer.displayName,
        email: customer.email,
        phone: "",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        profile: {
          displayName: customer.displayName,
          email: customer.email,
          phone: "",
        },
      });
    }

    const data = snapshot.data()!;

    return NextResponse.json({
      profile: {
        displayName:
          typeof data.displayName === "string" ? data.displayName : "",
        email: customer.email,
        phone: typeof data.phone === "string" ? data.phone : "",
      },
    });
  } catch (error) {
    console.error("Failed to retrieve customer profile:", error);

    return NextResponse.json(
      { error: "Unable to retrieve your profile right now." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/account/profile
 *
 * Update the authenticated customer's name and phone number.
 */
export async function PATCH(request: NextRequest) {
  const customer = await authenticateCustomer(request);

  if ("error" in customer) {
    return customer.error;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("displayName" in body) ||
    !("phone" in body) ||
    typeof body.displayName !== "string" ||
    typeof body.phone !== "string"
  ) {
    return NextResponse.json(
      { error: "A name and phone number are required." },
      { status: 400 }
    );
  }

  const displayName = body.displayName.trim();
  const phone = body.phone.trim();

  if (displayName.length < 2 || displayName.length > 80) {
    return NextResponse.json(
      { error: "Your name must be between 2 and 80 characters." },
      { status: 400 }
    );
  }

  if (
    phone.length > 25 ||
    (phone.length > 0 && !/^[+\d\s().-]+$/.test(phone)) ||
    (phone.length > 0 && phone.replace(/\D/g, "").length < 7)
  ) {
    return NextResponse.json(
      { error: "Please enter a valid phone number." },
      { status: 400 }
    );
  }

  try {
    const userRef = adminDb.collection("users").doc(customer.uid);
    const snapshot = await userRef.get();

    const profileData = {
      displayName,
      email: customer.email,
      phone,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await userRef.set(
      snapshot.exists
        ? profileData
        : {
            ...profileData,
            createdAt: FieldValue.serverTimestamp(),
          },
      { merge: true }
    );

    return NextResponse.json({
      message: "Your profile has been updated successfully.",
      profile: {
        displayName,
        email: customer.email,
        phone,
      },
    });
  } catch (error) {
    console.error("Failed to update customer profile:", error);

    return NextResponse.json(
      { error: "Unable to update your profile right now." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/account/profile
 *
 * Initialize a newly registered customer's profile.
 * A valid Firebase ID token is required, but email verification
 * is not required until the customer accesses their account.
 */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 }
    );
  }

  let decodedToken;

  try {
    const idToken = authorization.slice("Bearer ".length);
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json(
      { error: "Your registration session is invalid or expired." },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("displayName" in body) ||
    !("phone" in body) ||
    typeof body.displayName !== "string" ||
    typeof body.phone !== "string"
  ) {
    return NextResponse.json(
      { error: "A name and phone number are required." },
      { status: 400 }
    );
  }

  const displayName = body.displayName.trim();
  const phone = body.phone.trim();

  if (displayName.length < 2 || displayName.length > 80) {
    return NextResponse.json(
      { error: "Your name must be between 2 and 80 characters." },
      { status: 400 }
    );
  }

  if (
    phone.length > 25 ||
    (phone.length > 0 && !/^[+\d\s().-]+$/.test(phone)) ||
    (phone.length > 0 && phone.replace(/\D/g, "").length < 7)
  ) {
    return NextResponse.json(
      { error: "Please enter a valid phone number." },
      { status: 400 }
    );
  }

  if (!decodedToken.email) {
    return NextResponse.json(
      { error: "Your account must have an email address." },
      { status: 400 }
    );
  }

  try {
    const userRef = adminDb.collection("users").doc(decodedToken.uid);
    const snapshot = await userRef.get();

    await userRef.set(
      {
        displayName,
        email: decodedToken.email,
        phone,
        ...(snapshot.exists
          ? {}
          : { createdAt: FieldValue.serverTimestamp() }),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json(
      {
        message: "Customer profile created successfully.",
        profile: {
          displayName,
          email: decodedToken.email,
          phone,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to initialize customer profile:", error);

    return NextResponse.json(
      { error: "Unable to initialize your profile right now." },
      { status: 500 }
    );
  }
}