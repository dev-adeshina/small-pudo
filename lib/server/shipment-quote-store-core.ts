import type { FieldValue, Firestore } from "firebase-admin/firestore";

export type ShipmentQuoteSnapshot = Readonly<Record<string, unknown>>;

interface QuoteStoreDependencies {
  db: Firestore;
  serverTimestamp: () => FieldValue;
}

interface QuoteLineageData {
  bookingPartyUid?: unknown;
  currentVersionId?: unknown;
  acceptedVersionId?: unknown;
  bookingId?: unknown;
}

interface QuoteVersionData {
  sequence?: unknown;
}

export type ReviseShipmentQuoteResult =
  | {
      outcome: "updated";
      versionId: string;
      sequence: number;
    }
  | {
      outcome: "not_found";
    }
  | {
      outcome: "already_accepted";
    }
  | {
      outcome: "stale_version";
      currentVersionId: string;
    };

function assertBookingPartyUid(value: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError("A booking-party UID is required");
  }
}

function assertSnapshot(value: ShipmentQuoteSnapshot): void {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError("A quote snapshot must be a map");
  }
}

/**
 * Internal Firestore persistence primitives only.
 *
 * This store does not calculate or issue customer quotes, confirm bookings,
 * expose an API, or authorize customer access. Its snapshot is an opaque map
 * until the pricing and quote contract defines the commercial payload.
 */
export function createShipmentQuoteStore({
  db,
  serverTimestamp,
}: QuoteStoreDependencies) {
  return {
    async createLineage(
      bookingPartyUid: string,
      snapshot: ShipmentQuoteSnapshot
    ): Promise<{ quoteId: string; versionId: string; sequence: 1 }> {
      assertBookingPartyUid(bookingPartyUid);
      assertSnapshot(snapshot);

      const quoteRef = db.collection("shipmentQuotes").doc();
      const versionRef = quoteRef.collection("versions").doc();
      const versionSnapshot = { ...snapshot };

      await db.runTransaction(async (transaction) => {
        transaction.create(quoteRef, {
          bookingPartyUid,
          currentVersionId: versionRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        transaction.create(versionRef, {
          sequence: 1,
          snapshot: versionSnapshot,
          createdAt: serverTimestamp(),
        });
      });

      return {
        quoteId: quoteRef.id,
        versionId: versionRef.id,
        sequence: 1,
      };
    },

    async reviseLineage(input: {
      quoteId: string;
      expectedCurrentVersionId: string;
      snapshot: ShipmentQuoteSnapshot;
    }): Promise<ReviseShipmentQuoteResult> {
      const { quoteId, expectedCurrentVersionId, snapshot } = input;

      if (!quoteId.trim() || !expectedCurrentVersionId.trim()) {
        throw new TypeError("Quote and expected version IDs are required");
      }
      assertSnapshot(snapshot);

      const quoteRef = db.collection("shipmentQuotes").doc(quoteId);
      const currentVersionRef = quoteRef
        .collection("versions")
        .doc(expectedCurrentVersionId);
      const nextVersionRef = quoteRef.collection("versions").doc();
      const versionSnapshot = { ...snapshot };

      return db.runTransaction(async (transaction) => {
        const quoteDocument = await transaction.get(quoteRef);

        if (!quoteDocument.exists) {
          return { outcome: "not_found" } as const;
        }

        const quote = quoteDocument.data() as QuoteLineageData;

        if (quote.acceptedVersionId || quote.bookingId) {
          return { outcome: "already_accepted" } as const;
        }

        if (
          typeof quote.currentVersionId !== "string" ||
          quote.currentVersionId !== expectedCurrentVersionId
        ) {
          return {
            outcome: "stale_version",
            currentVersionId:
              typeof quote.currentVersionId === "string"
                ? quote.currentVersionId
                : "",
          } as const;
        }

        const currentVersionDocument =
          await transaction.get(currentVersionRef);

        if (!currentVersionDocument.exists) {
          throw new Error(
            "Quote lineage points to a missing current version"
          );
        }

        const currentVersion =
          currentVersionDocument.data() as QuoteVersionData;
        const currentSequence = currentVersion.sequence;

        if (
          typeof currentSequence !== "number" ||
          !Number.isSafeInteger(currentSequence) ||
          currentSequence < 1
        ) {
          throw new Error("Quote version sequence is invalid");
        }

        const nextSequence = currentSequence + 1;

        transaction.create(nextVersionRef, {
          sequence: nextSequence,
          snapshot: versionSnapshot,
          createdAt: serverTimestamp(),
        });
        transaction.update(quoteRef, {
          currentVersionId: nextVersionRef.id,
          updatedAt: serverTimestamp(),
        });

        return {
          outcome: "updated",
          versionId: nextVersionRef.id,
          sequence: nextSequence,
        } as const;
      });
    },
  };
}
