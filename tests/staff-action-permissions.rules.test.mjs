import { readFile } from "node:fs/promises";
import { after, before, describe, it } from "node:test";
import { assertFails, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

let environment;
before(async () => {
  const rules = await readFile("firestore.rules", "utf8");
  environment = await initializeTestEnvironment({
    projectId: "demo-verilyft-staff-action-permissions",
    firestore: { rules },
  });
});
after(async () => environment?.cleanup());

describe("staff action permission Firestore access", () => {
  it("denies client reads and writes, including to an administrator", async () => {
    const db = environment.authenticatedContext("admin-user", {
      email_verified: true,
      admin: true,
    }).firestore();
    const permission = doc(db, "staffActionPermissions/admin-user/permissions/operational_cost_definition.approve");
    await assertFails(getDoc(permission));
    await assertFails(setDoc(permission, {
      active: true,
      assignedBy: "admin-user",
      reason: "Client-side self-assignment must fail",
    }));
  });
});
