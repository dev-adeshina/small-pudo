import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { validateShipmentBookingDraft } from "@/lib/validations/shipment-booking-draft";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ draftId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 }
    );
  }

  let decodedToken;

  try {
    decodedToken = await adminAuth.verifyIdToken(
      authorization.slice("Bearer ".length).trim()
    );
  } catch {
    return NextResponse.json(
      { error: "Your session is invalid or expired. Please sign in again." },
      { status: 401 }
    );
  }

  if (decodedToken.email_verified !== true) {
    return NextResponse.json(
      { error: "Please verify your email address first." },
      { status: 403 }
    );
  }

  const { draftId } = await context.params;

  if (!draftId || draftId.includes("/")) {
    return NextResponse.json(
      { error: "The requested shipment draft was not found." },
      { status: 404 }
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
      .doc(decodedToken.uid)
      .collection("shipmentBookingDrafts")
      .doc(draftId);

    const snapshot = await draftRef.get();

    if (!snapshot.exists || snapshot.data()?.status !== "draft") {
      return NextResponse.json(
        { error: "The requested shipment draft was not found." },
        { status: 404 }
      );
    }

    await draftRef.update({
      origin: validated.data.origin,
      destination: validated.data.destination,
      parcelDescription: validated.data.parcelDescription,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      draft: {
        id: draftId,
        origin: validated.data.origin,
        destination: validated.data.destination,
        parcelDescription: validated.data.parcelDescription,
        status: "draft",
      },
    });
  } catch (error) {
    console.error("Failed to update shipment booking draft:", error);

    return NextResponse.json(
      { error: "Unable to update your shipment draft right now." },
      { status: 500 }
    );
  }
}
