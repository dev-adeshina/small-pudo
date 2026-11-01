import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { updateDraftOnlyWhileEditable } from "@/lib/server/shipment-booking-drafts";
import type { ShipmentBookingDraftInput } from "@/lib/validations/shipment-booking-draft";
import type { ShipmentBookingDraftRecord } from "@/lib/server/shipment-booking-draft-api";

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

export const shipmentBookingDraftStore = {
  verifyIdToken: (token: string) => adminAuth.verifyIdToken(token),

  async listDrafts(customerUid: string): Promise<ShipmentBookingDraftRecord[]> {
    const snapshot = await adminDb
      .collection("users")
      .doc(customerUid)
      .collection("shipmentBookingDrafts")
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get();

    return snapshot.docs.map((document) => {
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
  },

  async createDraft(
    customerUid: string,
    input: ShipmentBookingDraftInput
  ): Promise<ShipmentBookingDraftRecord> {
    const draftRef = adminDb
      .collection("users")
      .doc(customerUid)
      .collection("shipmentBookingDrafts")
      .doc();

    await draftRef.create({
      bookingPartyUid: customerUid,
      ...input,
      status: "draft",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      id: draftRef.id,
      ...input,
      status: "draft",
    };
  },

  async updateDraft(
    customerUid: string,
    draftId: string,
    input: ShipmentBookingDraftInput
  ): Promise<boolean> {
    const draftRef = adminDb
      .collection("users")
      .doc(customerUid)
      .collection("shipmentBookingDrafts")
      .doc(draftId);

    return adminDb.runTransaction(async (transaction) =>
      updateDraftOnlyWhileEditable(
        () => transaction.get(draftRef),
        () => {
          transaction.update(draftRef, {
            ...input,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      )
    );
  },
};
