import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { validateShipmentBookingDraft } from "@/lib/validations/shipment-booking-draft";

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
    const decodedToken = await adminAuth.verifyIdToken(
      authorization.slice("Bearer ".length).trim()
    );

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

function toISOString(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = value.toDate();
    return date instanceof Date ? date.toISOString() : null;
  }

  return null;
}

/**
 * GET /api/account/shipment-booking-drafts
 *
 * List drafts belonging only to the verified customer in the ID token.
 */
export async function GET(request: NextRequest) {
  const customer = await authenticateCustomer(request);

  if ("error" in customer) {
    return customer.error;
  }

  try {
    const snapshot = await adminDb
      .collection("users")
      .doc(customer.uid)
      .collection("shipmentBookingDrafts")
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get();

    const drafts = snapshot.docs.map((document) => {
      const data = document.data();

      return {
        id: document.id,
        origin: data.origin,
        destination: data.destination,
        parcelDescription: data.parcelDescription,
        status: "draft" as const,
        createdAt: toISOString(data.createdAt),
        updatedAt: toISOString(data.updatedAt),
      };
    });

    return NextResponse.json({ success: true, drafts });
  } catch (error) {
    console.error("Failed to retrieve shipment booking drafts:", error);

    return NextResponse.json(
      { error: "Unable to retrieve your shipment drafts right now." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/account/shipment-booking-drafts
 *
 * Create a preparation draft. This does not issue a quote, confirm a booking,
 * create a payment obligation, or record physical intake/custody.
 */
export async function POST(request: NextRequest) {
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

  const validated = validateShipmentBookingDraft(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error },
      { status: 400 }
    );
  }

  try {
    const draftRef = adminDb
      .collection("users")
      .doc(customer.uid)
      .collection("shipmentBookingDrafts")
      .doc();

    await draftRef.create({
      bookingPartyUid: customer.uid,
      origin: validated.data.origin,
      destination: validated.data.destination,
      parcelDescription: validated.data.parcelDescription,
      status: "draft",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        draft: {
          id: draftRef.id,
          origin: validated.data.origin,
          destination: validated.data.destination,
          parcelDescription: validated.data.parcelDescription,
          status: "draft",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save shipment booking draft:", error);

    return NextResponse.json(
      { error: "Unable to save your shipment draft right now." },
      { status: 500 }
    );
  }
}
