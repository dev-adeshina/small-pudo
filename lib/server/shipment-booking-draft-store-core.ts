import type { FieldValue, Firestore } from "firebase-admin/firestore";

import type { ShipmentBookingDraftRecord } from "./shipment-booking-draft-api";
import type { ShipmentBookingDraftInput } from "../validations/shipment-booking-draft";

interface DraftSnapshot {
  exists: boolean;
  data(): { status?: unknown } | undefined;
}

type UpdateDraftGuard = (
  readDraft: () => Promise<DraftSnapshot>,
  updateDraft: () => void
) => Promise<boolean>;

interface ShipmentBookingDraftStoreDependencies {
  db: Firestore;
  serverTimestamp: () => FieldValue;
  updateDraftOnlyWhileEditable: UpdateDraftGuard;
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
 * Creates the existing shipment-draft Firestore store against an injected
 * Admin Firestore instance. Production and Emulator tests share this logic.
 */
export function createShipmentBookingDraftStore({
  db,
  serverTimestamp,
  updateDraftOnlyWhileEditable,
}: ShipmentBookingDraftStoreDependencies) {
  return {
    async listDrafts(customerUid: string): Promise<ShipmentBookingDraftRecord[]> {
      const snapshot = await db
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
      const draftRef = db
        .collection("users")
        .doc(customerUid)
        .collection("shipmentBookingDrafts")
        .doc();

      await draftRef.create({
        bookingPartyUid: customerUid,
        ...input,
        status: "draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
      const draftRef = db
        .collection("users")
        .doc(customerUid)
        .collection("shipmentBookingDrafts")
        .doc(draftId);

      return db.runTransaction(async (transaction) =>
        updateDraftOnlyWhileEditable(
          () => transaction.get(draftRef),
          () => {
            transaction.update(draftRef, {
              ...input,
              updatedAt: serverTimestamp(),
            });
          }
        )
      );
    },
  };
}
