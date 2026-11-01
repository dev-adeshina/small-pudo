import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { authenticateVerifiedCustomer } from "@/lib/server/customer-auth";
import { updateDraftOnlyWhileEditable } from "@/lib/server/shipment-booking-drafts";
import { validateShipmentBookingDraft } from "@/lib/validations/shipment-booking-draft";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ draftId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const customer = await authenticateVerifiedCustomer(
    request.headers.get("authorization"),
    (token) => adminAuth.verifyIdToken(token)
  );

  if (!customer.success) {
    return NextResponse.json(
      { error: customer.error },
      { status: customer.status }
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
      .doc(customer.uid)
      .collection("shipmentBookingDrafts")
      .doc(draftId);

    const updated = await adminDb.runTransaction(async (transaction) =>
      updateDraftOnlyWhileEditable(
        () => transaction.get(draftRef),
        () => {
          transaction.update(draftRef, {
            origin: validated.data.origin,
            destination: validated.data.destination,
            parcelDescription: validated.data.parcelDescription,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      )
    );

    if (!updated) {
      return NextResponse.json(
        { error: "The requested shipment draft was not found." },
        { status: 404 }
      );
    }

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
