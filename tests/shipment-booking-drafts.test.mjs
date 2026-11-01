import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { authenticateVerifiedCustomer } from "../lib/server/customer-auth.ts";
import { updateDraftOnlyWhileEditable } from "../lib/server/shipment-booking-drafts.ts";
import { validateShipmentBookingDraft } from "../lib/validations/shipment-booking-draft.ts";

describe("shipment booking draft authentication", () => {
  it("rejects a missing bearer token", async () => {
    const result = await authenticateVerifiedCustomer(null, async () => ({
      uid: "customer-1",
      email_verified: true,
    }));

    assert.deepEqual(result, {
      success: false,
      status: 401,
      error: "Authentication is required.",
    });
  });

  it("rejects an empty bearer token without calling Firebase", async () => {
    let called = false;
    const result = await authenticateVerifiedCustomer("Bearer   ", async () => {
      called = true;
      return { uid: "customer-1", email_verified: true };
    });

    assert.equal(result.success, false);
    assert.equal(called, false);
  });

  it("rejects an invalid or expired token", async () => {
    const result = await authenticateVerifiedCustomer("Bearer invalid", async () => {
      throw new Error("invalid token");
    });

    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.status, 401);
  });

  it("rejects a customer whose email is not verified", async () => {
    const result = await authenticateVerifiedCustomer("Bearer valid", async () => ({
      uid: "customer-1",
      email_verified: false,
    }));

    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.status, 403);
  });

  it("returns only the UID from a verified customer token", async () => {
    const result = await authenticateVerifiedCustomer("Bearer valid", async (token) => {
      assert.equal(token, "valid");
      return { uid: "customer-1", email_verified: true };
    });

    assert.deepEqual(result, { success: true, uid: "customer-1" });
  });
});

describe("shipment booking draft validation", () => {
  it("trims valid input", () => {
    assert.deepEqual(
      validateShipmentBookingDraft({
        origin: " Lagos ",
        destination: " Abuja ",
        parcelDescription: " Documents ",
      }),
      {
        success: true,
        data: {
          origin: "Lagos",
          destination: "Abuja",
          parcelDescription: "Documents",
        },
      }
    );
  });

  it("rejects missing required fields", () => {
    const result = validateShipmentBookingDraft({
      origin: "Lagos",
      destination: "Abuja",
    });

    assert.equal(result.success, false);
  });

  it("enforces the existing origin and destination length limit", () => {
    const result = validateShipmentBookingDraft({
      origin: "x".repeat(181),
      destination: "Abuja",
      parcelDescription: "Documents",
    });

    assert.equal(result.success, false);
  });

  it("enforces the existing parcel description length limit", () => {
    const result = validateShipmentBookingDraft({
      origin: "Lagos",
      destination: "Abuja",
      parcelDescription: "x".repeat(1001),
    });

    assert.equal(result.success, false);
  });
});

describe("shipment booking draft transactional update guard", () => {
  it("updates a draft only after confirming its current status", async () => {
    let updated = false;
    const result = await updateDraftOnlyWhileEditable(
      async () => ({ exists: true, data: () => ({ status: "draft" }) }),
      () => {
        updated = true;
      }
    );

    assert.equal(result, true);
    assert.equal(updated, true);
  });

  it("does not update a draft that has moved to another status", async () => {
    let updated = false;
    const result = await updateDraftOnlyWhileEditable(
      async () => ({ exists: true, data: () => ({ status: "cancelled" }) }),
      () => {
        updated = true;
      }
    );

    assert.equal(result, false);
    assert.equal(updated, false);
  });

  it("does not update a missing draft", async () => {
    let updated = false;
    const result = await updateDraftOnlyWhileEditable(
      async () => ({ exists: false, data: () => undefined }),
      () => {
        updated = true;
      }
    );

    assert.equal(result, false);
    assert.equal(updated, false);
  });
});
