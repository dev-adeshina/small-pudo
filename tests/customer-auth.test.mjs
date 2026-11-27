import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { authenticateVerifiedCustomer } from "../lib/server/customer-auth.ts";

describe("verified customer authentication", () => {
  it("requires bearer authentication and requests revoked-token checking", async () => {
    let verificationArgs;
    const result = await authenticateVerifiedCustomer(
      "Bearer customer-token",
      async (...args) => {
        verificationArgs = args;
        return { uid: "customer-1", email_verified: true };
      },
    );
    assert.deepEqual(verificationArgs, ["customer-token", true]);
    assert.deepEqual(result, { success: true, uid: "customer-1" });
  });

  it("rejects unverified email addresses", async () => {
    const result = await authenticateVerifiedCustomer(
      "Bearer customer-token",
      async () => ({ uid: "customer-1", email_verified: false }),
    );
    assert.deepEqual(result, {
      success: false,
      status: 403,
      error: "Please verify your email address first.",
    });
  });

  it("rejects invalid and revoked sessions", async () => {
    const result = await authenticateVerifiedCustomer(
      "Bearer customer-token",
      async () => { throw new Error("revoked"); },
    );
    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.status, 401);
  });
});
