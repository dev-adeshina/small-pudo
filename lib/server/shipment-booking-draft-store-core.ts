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

function declaredMeasurementsFromParcelInput(value: unknown): ShipmentBookingDraftInput["declaredMeasurements"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const declared = (value as Record<string, unknown>).declared;
  if (!declared || typeof declared !== "object" || Array.isArray(declared)) return undefined;
  const measurements = (declared as Record<string, unknown>).measurements;
  if (!measurements || typeof measurements !== "object" || Array.isArray(measurements)) return undefined;
  return measurements as ShipmentBookingDraftInput["declaredMeasurements"];
}

function parcelInputForDraft(customerUid: string, input: ShipmentBookingDraftInput) {
  const measurements = input.declaredMeasurements;
  if (!measurements || Object.keys(measurements).length === 0) return null;
  return {
    schemaVersion: 1,
    declared: {
      measurements,
      recordedAt: new Date().toISOString(),
      recordedBy: customerUid,
      source: "customer_declared",
    },
    handlingCharacteristics: [],
  };
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
          declaredMeasurements: declaredMeasurementsFromParcelInput(data.parcelInput),
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

      const draftFields = {
        origin: input.origin,
        destination: input.destination,
        parcelDescription: input.parcelDescription,
      };
      await draftRef.create({
        bookingPartyUid: customerUid,
        ...draftFields,
        parcelInput: parcelInputForDraft(customerUid, input),
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
            const draftFields = {
              origin: input.origin,
              destination: input.destination,
              parcelDescription: input.parcelDescription,
            };
            transaction.update(draftRef, {
              ...draftFields,
              parcelInput: parcelInputForDraft(customerUid, input),
              updatedAt: serverTimestamp(),
            });
          }
        )
      );
    },
  };
}
