import type { FieldValue, Firestore } from "firebase-admin/firestore";

export type ShipmentQuoteSnapshot = Readonly<Record<string, unknown>>;

interface QuoteStoreDependencies {
  db: Firestore;
  serverTimestamp: () => FieldValue;
  now?: () => Date;
}

interface QuoteLineageData {
  bookingPartyUid?: unknown;
  currentVersionId?: unknown;
  acceptedVersionId?: unknown;
  bookingId?: unknown;
  status?: unknown;
  validUntil?: unknown;
  handoverWindowMinutes?: unknown;
}

interface QuoteVersionData {
  sequence?: unknown;
  snapshot?: unknown;
  createdAt?: unknown;
  validUntil?: unknown;
  handoverWindowMinutes?: unknown;
}

export type ReviseShipmentQuoteResult =
  | { outcome: "updated"; versionId: string; sequence: number }
  | { outcome: "not_found" }
  | { outcome: "already_accepted" }
  | { outcome: "stale_version"; currentVersionId: string };

export type ShipmentQuoteDecisionResult =
  | { outcome: "accepted"; acceptedVersionId: string; handoverDeadlineAt: Date }
  | { outcome: "rejected"; rejectedVersionId: string }
  | { outcome: "expired" }
  | { outcome: "not_found" }
  | { outcome: "not_authorized" }
  | { outcome: "already_decided" }
  | { outcome: "stale_version"; currentVersionId: string };

function assertBookingPartyUid(value: string): void {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 128) {
    throw new TypeError("A booking-party UID is required");
  }
}

function assertIdentifier(value: string, label: string): void {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
    throw new TypeError(label + " is invalid");
  }
}

function assertSnapshot(value: ShipmentQuoteSnapshot): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("A quote snapshot must be a map");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("A quote snapshot must be a plain map");
  }
}

function assertQuoteTerms(validUntil: Date, handoverWindowMinutes: number, now: Date): void {
  if (!(validUntil instanceof Date) || !Number.isFinite(validUntil.getTime()) || validUntil <= now) {
    throw new TypeError("A future quote-valid-until date is required");
  }
  if (!Number.isSafeInteger(handoverWindowMinutes) || handoverWindowMinutes < 1) {
    throw new TypeError("An explicitly configured positive handover window in minutes is required");
  }
}

function dateValue(value: unknown): Date | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && Number.isFinite(date.getTime()) ? date : null;
  }
  return null;
}

/**
 * Server-only customer quotation lineage and response persistence.
 * A decision records customer acceptance/rejection of the exact current
 * version. It deliberately does not create a booking, payment, parcel or
 * custody record; those belong to the later booking handoff/operations flows.
 */
export function createShipmentQuoteStore({ db, serverTimestamp, now = () => new Date() }: QuoteStoreDependencies) {
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
      return { quoteId: quoteRef.id, versionId: versionRef.id, sequence: 1 };
    },

    async issueQuote(input: {
      bookingPartyUid: string;
      snapshot: ShipmentQuoteSnapshot;
      validUntil: Date;
      handoverWindowMinutes: number;
      issuedBy: string;
    }): Promise<{ quoteId: string; versionId: string; sequence: 1 }> {
      const { bookingPartyUid, snapshot, validUntil, handoverWindowMinutes, issuedBy } = input;
      assertBookingPartyUid(bookingPartyUid);
      assertSnapshot(snapshot);
      assertBookingPartyUid(issuedBy);
      assertQuoteTerms(validUntil, handoverWindowMinutes, now());

      const quoteRef = db.collection("shipmentQuotes").doc();
      const versionRef = quoteRef.collection("versions").doc();
      const timestamp = serverTimestamp();
      await db.runTransaction(async (transaction) => {
        transaction.create(quoteRef, {
          bookingPartyUid,
          currentVersionId: versionRef.id,
          status: "issued",
          validUntil,
          handoverWindowMinutes,
          issuedAt: timestamp,
          issuedBy,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        transaction.create(versionRef, {
          sequence: 1,
          snapshot: { ...snapshot },
          validUntil,
          handoverWindowMinutes,
          createdAt: timestamp,
          createdBy: issuedBy,
        });
        transaction.create(quoteRef.collection("events").doc(), {
          action: "issued",
          versionId: versionRef.id,
          actorUid: issuedBy,
          timestamp,
        });
      });
      return { quoteId: quoteRef.id, versionId: versionRef.id, sequence: 1 };
    },

    async listCustomerQuotes(bookingPartyUid: string): Promise<Array<Record<string, unknown>>> {
      assertBookingPartyUid(bookingPartyUid);
      const snapshot = await db.collection("shipmentQuotes")
        .where("bookingPartyUid", "==", bookingPartyUid)
        .limit(100)
        .get();
      const rows = await Promise.all(snapshot.docs.map(async (document) => {
        const lineage = document.data();
        const versionId = lineage.currentVersionId;
        if (typeof versionId !== "string") throw new Error("Quote lineage has an invalid current version reference");
        const version = await document.ref.collection("versions").doc(versionId).get();
        if (!version.exists) throw new Error("Quote lineage points to a missing current version");
        const expiresAt = dateValue(lineage.validUntil);
        const status = lineage.status === "issued" && expiresAt && expiresAt <= now()
          ? "expired" : lineage.status ?? "legacy";
        return { quoteId: document.id, ...lineage, status, currentVersion: { versionId, ...version.data() } };
      }));
      return rows.sort((a, b) => {
        const left = dateValue(a.issuedAt ?? a.createdAt)?.getTime() ?? 0;
        const right = dateValue(b.issuedAt ?? b.createdAt)?.getTime() ?? 0;
        return right - left;
      });
    },

    async getCustomerQuote(bookingPartyUid: string, quoteId: string): Promise<Record<string, unknown> | null> {
      assertBookingPartyUid(bookingPartyUid);
      assertIdentifier(quoteId, "Quote ID");
      const quoteRef = db.collection("shipmentQuotes").doc(quoteId);
      const quoteDocument = await quoteRef.get();
      if (!quoteDocument.exists || quoteDocument.data()?.bookingPartyUid !== bookingPartyUid) return null;
      const lineage = quoteDocument.data() as QuoteLineageData;
      const versionsSnapshot = await quoteRef.collection("versions").orderBy("sequence", "asc").get();
      const versions = versionsSnapshot.docs.map((version) => ({ versionId: version.id, ...version.data() }));
      const expiresAt = dateValue(lineage.validUntil);
      const status = lineage.status === "issued" && expiresAt && expiresAt <= now()
        ? "expired" : lineage.status ?? "legacy";
      return { quoteId, ...lineage, status, versions };
    },

    async respondToQuote(input: {
      quoteId: string;
      expectedCurrentVersionId: string;
      bookingPartyUid: string;
      decision: "accept" | "reject";
      reason?: string;
    }): Promise<ShipmentQuoteDecisionResult> {
      const { quoteId, expectedCurrentVersionId, bookingPartyUid, decision, reason } = input;
      assertIdentifier(quoteId, "Quote ID");
      assertIdentifier(expectedCurrentVersionId, "Expected quote version ID");
      assertBookingPartyUid(bookingPartyUid);
      if (decision !== "accept" && decision !== "reject") throw new TypeError("Unsupported quotation decision");
      if (decision === "reject" && (typeof reason !== "string" || !reason.trim() || reason.length > 1000)) {
        throw new TypeError("A reason of at most 1000 characters is required when rejecting a quotation");
      }

      const quoteRef = db.collection("shipmentQuotes").doc(quoteId);
      const versionRef = quoteRef.collection("versions").doc(expectedCurrentVersionId);
      const eventRef = quoteRef.collection("events").doc();

      return db.runTransaction(async (transaction) => {
        const [quoteDocument, versionDocument] = await Promise.all([
          transaction.get(quoteRef),
          transaction.get(versionRef),
        ]);
        if (!quoteDocument.exists || !versionDocument.exists) return { outcome: "not_found" } as const;
        const lineage = quoteDocument.data() as QuoteLineageData;
        if (lineage.bookingPartyUid !== bookingPartyUid) return { outcome: "not_authorized" } as const;
        if (lineage.currentVersionId !== expectedCurrentVersionId) {
          return { outcome: "stale_version", currentVersionId: typeof lineage.currentVersionId === "string" ? lineage.currentVersionId : "" } as const;
        }
        if (lineage.status !== "issued") return { outcome: "already_decided" } as const;

        const validUntil = dateValue(lineage.validUntil);
        const currentTime = now();
        if (!validUntil || validUntil <= currentTime) {
          transaction.update(quoteRef, { status: "expired", expiredAt: serverTimestamp(), updatedAt: serverTimestamp() });
          transaction.create(eventRef, { action: "expired", versionId: expectedCurrentVersionId, actorUid: bookingPartyUid, timestamp: serverTimestamp() });
          return { outcome: "expired" } as const;
        }

        const version = versionDocument.data() as QuoteVersionData;
        const handoverWindowMinutes = lineage.handoverWindowMinutes ?? version.handoverWindowMinutes;
        if (decision === "accept" && (!Number.isSafeInteger(handoverWindowMinutes) || typeof handoverWindowMinutes !== "number" || handoverWindowMinutes < 1)) {
          throw new Error("The quotation has no approved handover deadline policy and cannot be accepted");
        }

        const timestamp = serverTimestamp();
        if (decision === "accept") {
          const handoverDeadlineAt = new Date(currentTime.getTime() + (handoverWindowMinutes as number) * 60_000);
          transaction.update(quoteRef, {
            status: "accepted",
            acceptedVersionId: expectedCurrentVersionId,
            acceptedAt: timestamp,
            acceptedBy: bookingPartyUid,
            handoverDeadlineAt,
            updatedAt: timestamp,
          });
          transaction.create(eventRef, { action: "accepted", versionId: expectedCurrentVersionId, actorUid: bookingPartyUid, timestamp, handoverDeadlineAt });
          return { outcome: "accepted", acceptedVersionId: expectedCurrentVersionId, handoverDeadlineAt } as const;
        }

        transaction.update(quoteRef, {
          status: "rejected",
          rejectedVersionId: expectedCurrentVersionId,
          rejectedAt: timestamp,
          rejectedBy: bookingPartyUid,
          rejectionReason: reason!.trim(),
          updatedAt: timestamp,
        });
        transaction.create(eventRef, { action: "rejected", versionId: expectedCurrentVersionId, actorUid: bookingPartyUid, reason: reason!.trim(), timestamp });
        return { outcome: "rejected", rejectedVersionId: expectedCurrentVersionId } as const;
      });
    },

    async reviseLineage(input: {
      quoteId: string;
      expectedCurrentVersionId: string;
      snapshot: ShipmentQuoteSnapshot;
    }): Promise<ReviseShipmentQuoteResult> {
      const { quoteId, expectedCurrentVersionId, snapshot } = input;
      assertIdentifier(quoteId, "Quote ID");
      assertIdentifier(expectedCurrentVersionId, "Expected quote version ID");
      assertSnapshot(snapshot);
      const quoteRef = db.collection("shipmentQuotes").doc(quoteId);
      const currentVersionRef = quoteRef.collection("versions").doc(expectedCurrentVersionId);
      const nextVersionRef = quoteRef.collection("versions").doc();
      const versionSnapshot = { ...snapshot };

      return db.runTransaction(async (transaction) => {
        const quoteDocument = await transaction.get(quoteRef);
        if (!quoteDocument.exists) return { outcome: "not_found" } as const;
        const quote = quoteDocument.data() as QuoteLineageData;
        if (quote.acceptedVersionId || quote.bookingId || quote.status === "accepted") return { outcome: "already_accepted" } as const;
        if (typeof quote.currentVersionId !== "string" || quote.currentVersionId !== expectedCurrentVersionId) {
          return { outcome: "stale_version", currentVersionId: typeof quote.currentVersionId === "string" ? quote.currentVersionId : "" } as const;
        }
        const currentVersionDocument = await transaction.get(currentVersionRef);
        if (!currentVersionDocument.exists) throw new Error("Quote lineage points to a missing current version");
        const currentVersion = currentVersionDocument.data() as QuoteVersionData;
        const currentSequence = currentVersion.sequence;
        if (typeof currentSequence !== "number" || !Number.isSafeInteger(currentSequence) || currentSequence < 1) {
          throw new Error("Quote version sequence is invalid");
        }
        const nextSequence = currentSequence + 1;
        if (!Number.isSafeInteger(nextSequence)) throw new Error("Next quote version sequence is out of range");
        transaction.create(nextVersionRef, { sequence: nextSequence, snapshot: versionSnapshot, createdAt: serverTimestamp() });
        transaction.update(quoteRef, { currentVersionId: nextVersionRef.id, status: "draft", updatedAt: serverTimestamp() });
        return { outcome: "updated", versionId: nextVersionRef.id, sequence: nextSequence } as const;
      });
    },
  };
}
