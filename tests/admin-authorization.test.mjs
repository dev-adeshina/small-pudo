import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createAdminRequestAuthorizer } from "../lib/server/admin-authorization-core.ts";

const validToken = {
  uid: "admin-1",
  email: "ADMIN@example.com",
  email_verified: true,
  admin: true,
};

function createHarness({
  adminEmails = ["admin@example.com"],
  token = validToken,
  verifyError,
  accessSnapshot = { exists: true, data: () => ({ active: true }) },
  accessError,
} = {}) {
  const verificationCalls = [];
  const accessCalls = [];

  const authorize = createAdminRequestAuthorizer({
    adminEmails,
    adminAuth: {
      async verifyIdToken(idToken, checkRevoked) {
        verificationCalls.push({ idToken, checkRevoked });
        if (verifyError) throw verifyError;
        return token;
      },
    },
    adminDb: {
      collection(name) {
        assert.equal(name, "adminAccess");
        return {
          doc(uid) {
            accessCalls.push(uid);
            return {
              async get() {
                if (accessError) throw accessError;
                return accessSnapshot;
              },
            };
          },
        };
      },
    },
  });

  return { authorize, verificationCalls, accessCalls };
}

function request(token = "test-token") {
  return new Request("https://example.test/api/admin/orders", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

describe("Admin API authorization", () => {
  it("fails closed when the administrator allowlist is empty", async () => {
    const { authorize, verificationCalls } = createHarness({ adminEmails: [] });
    const result = await authorize(request());

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 503);
    assert.deepEqual({ error: result.error }, {
      error: "Admin access is not configured.",
    });
    assert.equal(verificationCalls.length, 0);
  });

  it("rejects requests without a bearer token", async () => {
    const { authorize, verificationCalls } = createHarness();
    const result = await authorize(request(null));

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 401);
    assert.equal(verificationCalls.length, 0);
  });

  it("verifies tokens with revocation checking enabled", async () => {
    const { authorize, verificationCalls } = createHarness();
    const result = await authorize(request("valid-token"));

    assert.equal(result.ok, true);
    assert.deepEqual(verificationCalls, [
      { idToken: "valid-token", checkRevoked: true },
    ]);
  });

  it("rejects invalid, expired, and revoked tokens", async () => {
    for (const reason of ["invalid", "expired", "revoked"]) {
      const { authorize, accessCalls } = createHarness({
        verifyError: new Error(reason),
      });
      const result = await authorize(request());

      assert.equal(result.ok, false, reason);
      if (result.ok) continue;
      assert.equal(result.status, 401, reason);
      assert.equal(accessCalls.length, 0, reason);
    }
  });

  it("rejects an unverified email", async () => {
    const { authorize, accessCalls } = createHarness({
      token: { ...validToken, email_verified: false },
    });
    const result = await authorize(request());

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 403);
    assert.equal(accessCalls.length, 0);
  });

  it("rejects an email outside the normalized allowlist", async () => {
    const { authorize, accessCalls } = createHarness({
      token: { ...validToken, email: "customer@example.com" },
    });
    const result = await authorize(request());

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 403);
    assert.equal(accessCalls.length, 0);
  });

  it("rejects a token without the administrator claim", async () => {
    const { authorize, accessCalls } = createHarness({
      token: { ...validToken, admin: false },
    });
    const result = await authorize(request());

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 403);
    assert.equal(accessCalls.length, 0);
  });

  it("rejects missing or inactive administrator access records", async () => {
    const snapshots = [
      { exists: false, data: () => undefined },
      { exists: true, data: () => ({ active: false }) },
      { exists: true, data: () => ({ active: "true" }) },
    ];

    for (const accessSnapshot of snapshots) {
      const { authorize, accessCalls } = createHarness({ accessSnapshot });
      const result = await authorize(request());

      assert.equal(result.ok, false);
      if (result.ok) continue;
      assert.equal(result.status, 403);
      assert.deepEqual(accessCalls, ["admin-1"]);
    }
  });

  it("fails closed when the administrator access lookup fails", async () => {
    const { authorize } = createHarness({
      accessError: new Error("Firestore unavailable"),
    });
    const result = await authorize(request());

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 503);
  });

  it("allows an eligible administrator with an active access record", async () => {
    const { authorize, accessCalls } = createHarness();
    const result = await authorize(request());

    assert.deepEqual(result, {
      ok: true,
      uid: "admin-1",
      email: "admin@example.com",
    });
    assert.deepEqual(accessCalls, ["admin-1"]);
  });

  it("preserves a route-specific unauthorized message", async () => {
    const { authorize } = createHarness({
      token: { ...validToken, admin: false },
    });
    const result = await authorize(request(), "This action is not permitted.");

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.deepEqual({ error: result.error }, {
      error: "This action is not permitted.",
    });
  });
});
