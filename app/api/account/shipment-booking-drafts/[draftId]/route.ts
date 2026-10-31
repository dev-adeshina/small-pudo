import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";

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

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "Enter the shipment details before saving." },
      { status: 400 }
    );
  }

  const candidate = body as Record<string, unknown>;
  const origin =
    typeof candidate.origin === "string" ? candidate.origin.trim() : "";
  const destination =
    typeof candidate.destination === "string"
      ? candidate.destination.trim()
      : "";
  const parcelDescription =
    typeof candidate.parcelDescription === "string"
      ? candidate.parcelDescription.trim()
      : "";

  if (!origin || !destination || !parcelDescription) {
    return NextResponse.json(
      { error: "Origin, destination and parcel description are required." },
      { status: 400 }
    );
  }

  if (origin.length > 180 || destination.length > 180) {
    return NextResponse.json(
      { error: "Origin and destination must each be 180 characters or fewer." },
      { status: 400 }
    );
  }

  if (parcelDescription.length > 1000) {
    return NextResponse.json(
      { error: "Parcel description must be 1,000 characters or fewer." },
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

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "The requested shipment draft was not found." },
        { status: 404 }
      );
    }

    await draftRef.update({
      origin,
      destination,
      parcelDescription,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      draft: {
        id: draftId,
        origin,
        destination,
        parcelDescription,
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
