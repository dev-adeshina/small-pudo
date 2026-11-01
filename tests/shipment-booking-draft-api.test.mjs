import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createShipmentBookingDraftHandlers } from "../lib/server/shipment-booking-draft-api.ts";

const validDraft = {
  origin: "Lagos",
  destination: "Abuja",
  parcelDescription: "Documents",
};

function createHarness() {
  const records = new Map();
  let nextId = 1;
  const createdFor = [];

  const handlers = createShipmentBookingDraftHandlers({
    async verifyIdToken(token) {
      if (token === "customer-one-token") {
        return { uid: "customer-1", email_verified: true };
      }
      if (token === "customer-two-token") {
        return { uid: "customer-2", email_verified: true };
      }
      if (token === "unverified-token") {
        return { uid: "customer-1", email_verified: false };
      }
      throw new Error("Invalid token");
    },
    async listDrafts(customerUid) {
      return [...records.values()]
        .filter((draft) => draft.customerUid === customerUid)
        .map((draft) => ({
          id: draft.id,
          origin: draft.origin,
          destination: draft.destination,
          parcelDescription: draft.parcelDescription,
          status: "draft",
        }));
    },
    async createDraft(customerUid, input) {
      const id = `draft-${nextId++}`;
      const draft = { id, ...input, status: "draft" };
      records.set(`${customerUid}/${id}`, { customerUid, ...draft });
      createdFor.push(customerUid);
      return draft;
    },
    async updateDraft(customerUid, draftId, input) {
      const key = `${customerUid}/${draftId}`;
      const existing = records.get(key);
      if (!existing || existing.status !== "draft") return false;
      records.set(key, { ...existing, ...input });
      return true;
    },
  });

  return { handlers, records, createdFor };
}

function makeRequest(path, { token, body, method = "GET" } = {}) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}),
  });
}

describe("shipment booking draft API handlers", () => {
  it("rejects unauthenticated draft listing", async () => {
    const { handlers } = createHarness();
    const response = await handlers.GET(makeRequest("/api/account/shipment-booking-drafts"));

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: "Authentication is required.",
    });
  });

  it("rejects unverified customers before accessing drafts", async () => {
    const { handlers } = createHarness();
    const response = await handlers.GET(
      makeRequest("/api/account/shipment-booking-drafts", {
        token: "unverified-token",
      })
    );

    assert.equal(response.status, 403);
  });

  it("lists only the authenticated customer's drafts", async () => {
    const { handlers, records } = createHarness();
    records.set("customer-1/draft-a", {
      customerUid: "customer-1",
      id: "draft-a",
      ...validDraft,
      status: "draft",
    });
    records.set("customer-2/draft-b", {
      customerUid: "customer-2",
      id: "draft-b",
      ...validDraft,
      status: "draft",
    });

    const response = await handlers.GET(
      makeRequest("/api/account/shipment-booking-drafts", {
        token: "customer-one-token",
      })
    );
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.success, true);
    assert.deepEqual(data.drafts.map((draft) => draft.id), ["draft-a"]);
    assert.equal(data.drafts[0].customerUid, undefined);
  });

  it("creates a draft under the verified customer's identity", async () => {
    const { handlers, createdFor } = createHarness();
    const response = await handlers.POST(
      makeRequest("/api/account/shipment-booking-drafts", {
        method: "POST",
        token: "customer-one-token",
        body: { ...validDraft, bookingPartyUid: "customer-2" },
      })
    );
    const data = await response.json();

    assert.equal(response.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.draft.status, "draft");
    assert.deepEqual(createdFor, ["customer-1"]);
    assert.equal(data.draft.bookingPartyUid, undefined);
  });

  it("rejects invalid draft input without creating a record", async () => {
    const { handlers, createdFor } = createHarness();
    const response = await handlers.POST(
      makeRequest("/api/account/shipment-booking-drafts", {
        method: "POST",
        token: "customer-one-token",
        body: { origin: "Lagos", destination: "Abuja" },
      })
    );

    assert.equal(response.status, 400);
    assert.deepEqual(createdFor, []);
  });

  it("returns a safe validation error for malformed JSON", async () => {
    const { handlers } = createHarness();
    const response = await handlers.POST(
      makeRequest("/api/account/shipment-booking-drafts", {
        method: "POST",
        token: "customer-one-token",
        body: "{",
      })
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Invalid request body." });
  });

  it("does not allow a customer to update another customer's draft", async () => {
    const { handlers, records } = createHarness();
    records.set("customer-2/draft-b", {
      customerUid: "customer-2",
      id: "draft-b",
      ...validDraft,
      status: "draft",
    });

    const response = await handlers.PATCH(
      makeRequest("/api/account/shipment-booking-drafts/draft-b", {
        method: "PATCH",
        token: "customer-one-token",
        body: { ...validDraft, destination: "Port Harcourt" },
      }),
      "draft-b"
    );

    assert.equal(response.status, 404);
    assert.equal(records.get("customer-2/draft-b").destination, "Abuja");
  });

  it("updates a draft owned by the authenticated customer", async () => {
    const { handlers, records } = createHarness();
    records.set("customer-1/draft-a", {
      customerUid: "customer-1",
      id: "draft-a",
      ...validDraft,
      status: "draft",
    });

    const response = await handlers.PATCH(
      makeRequest("/api/account/shipment-booking-drafts/draft-a", {
        method: "PATCH",
        token: "customer-one-token",
        body: { ...validDraft, destination: "Ibadan" },
      }),
      "draft-a"
    );
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.draft.destination, "Ibadan");
    assert.equal(records.get("customer-1/draft-a").destination, "Ibadan");
  });

  it("does not update a record that is no longer a draft", async () => {
    const { handlers, records } = createHarness();
    records.set("customer-1/draft-a", {
      customerUid: "customer-1",
      id: "draft-a",
      ...validDraft,
      status: "cancelled",
    });

    const response = await handlers.PATCH(
      makeRequest("/api/account/shipment-booking-drafts/draft-a", {
        method: "PATCH",
        token: "customer-one-token",
        body: validDraft,
      }),
      "draft-a"
    );

    assert.equal(response.status, 404);
    assert.equal(records.get("customer-1/draft-a").status, "cancelled");
  });

  it("rejects malformed draft identifiers without calling storage", async () => {
    const { handlers, records } = createHarness();
    const response = await handlers.PATCH(
      makeRequest("/api/account/shipment-booking-drafts/nested/id", {
        method: "PATCH",
        token: "customer-one-token",
        body: validDraft,
      }),
      "nested/id"
    );

    assert.equal(response.status, 404);
    assert.equal(records.size, 0);
  });
});
