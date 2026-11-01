import { readFile } from "node:fs/promises";
import {
  after,
  before,
  describe,
  it,
} from "node:test";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

let testEnv;

before(async () => {
  const rules = await readFile("firestore.rules", "utf8");

  testEnv = await initializeTestEnvironment({
    projectId: "demo-verilyft-rules",
    firestore: {
      rules,
    },
  });
});

after(async () => {
  await testEnv?.cleanup();
});

async function seedAdminAccess(uid, active = true) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), `adminAccess/${uid}`), {
      active,
    });
  });
}

describe("Firestore security rules", () => {
  it("allows public reads of categories", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(
      getDoc(doc(db, "categories/test-category")),
    );
  });

  it("allows public reads of products", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(
      getDoc(doc(db, "products/test-product")),
    );
  });

  it("denies category writes from unauthenticated visitors", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(
      setDoc(doc(db, "categories/unauthorized-category"), {
        name: "Unauthorized category",
      }),
    );
  });

  it("denies product writes from unauthenticated visitors", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(
      setDoc(doc(db, "products/unauthorized-product"), {
        name: "Unauthorized product",
      }),
    );
  });

  it("denies category writes from ordinary customers", async () => {
    const db = testEnv
      .authenticatedContext("customer-1", {
        email_verified: true,
      })
      .firestore();

    await assertFails(
      setDoc(doc(db, "categories/customer-category"), {
        name: "Customer category",
      }),
    );
  });

  it("denies product writes from ordinary customers", async () => {
    const db = testEnv
      .authenticatedContext("customer-1", {
        email_verified: true,
      })
      .firestore();

    await assertFails(
      setDoc(doc(db, "products/customer-product"), {
        name: "Customer product",
      }),
    );
  });

  it("denies catalog writes when the administrator email is unverified", async () => {
    const db = testEnv
      .authenticatedContext("admin-unverified", {
        email_verified: false,
        admin: true,
      })
      .firestore();

    await assertFails(
      setDoc(doc(db, "categories/unverified-admin-category"), {
        name: "Unverified admin category",
      }),
    );
  });

  it("allows category writes with an administrator claim and active access record", async () => {
    await seedAdminAccess("admin-1");
    const db = testEnv
      .authenticatedContext("admin-1", {
        email_verified: true,
        admin: true,
      })
      .firestore();

    await assertSucceeds(
      setDoc(doc(db, "categories/authorized-category"), {
        name: "Authorized category",
      }),
    );
  });

  it("allows product writes with an administrator claim and active access record", async () => {
    await seedAdminAccess("admin-1");
    const db = testEnv
      .authenticatedContext("admin-1", {
        email_verified: true,
        admin: true,
      })
      .firestore();

    await assertSucceeds(
      setDoc(doc(db, "products/authorized-product"), {
        name: "Authorized product",
      }),
    );
  });

  it("denies catalogue writes when an old administrator token has an inactive access record", async () => {
    await seedAdminAccess("admin-revoked", false);
    const db = testEnv
      .authenticatedContext("admin-revoked", {
        email_verified: true,
        admin: true,
      })
      .firestore();

    await assertFails(
      setDoc(doc(db, "categories/revoked-admin-category"), {
        name: "Revoked administrator category",
      }),
    );
  });

  it("denies clients direct access to administrator access records", async () => {
    const db = testEnv
      .authenticatedContext("admin-1", {
        email_verified: true,
        admin: true,
      })
      .firestore();

    await assertFails(getDoc(doc(db, "adminAccess/admin-1")));
    await assertFails(
      setDoc(doc(db, "adminAccess/admin-1"), { active: true }),
    );
  });

  it("denies direct client reads of orders", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(
      getDoc(doc(db, "orders/test-order")),
    );
  });

  it("denies direct client writes to orders, even for administrators", async () => {
    const db = testEnv
      .authenticatedContext("admin-1", {
        email_verified: true,
        admin: true,
      })
      .firestore();

    await assertFails(
      setDoc(doc(db, "orders/client-created-order"), {
        total: 1000,
      }),
    );
  });

  it("denies direct customer reads of shipment booking drafts", async () => {
    const db = testEnv
      .authenticatedContext("customer-1", {
        email_verified: true,
      })
      .firestore();

    await assertFails(
      getDoc(doc(db, "users/customer-1/shipmentBookingDrafts/draft-1")),
    );
  });

  it("denies direct customer writes to shipment booking drafts", async () => {
    const db = testEnv
      .authenticatedContext("customer-1", {
        email_verified: true,
      })
      .firestore();

    await assertFails(
      setDoc(doc(db, "users/customer-1/shipmentBookingDrafts/draft-1"), {
        origin: "Lagos",
        destination: "Abuja",
        parcelDescription: "Sample parcel",
      }),
    );
  });

  it("denies one customer direct access to another customer's shipment drafts", async () => {
    const db = testEnv
      .authenticatedContext("customer-1", {
        email_verified: true,
      })
      .firestore();

    await assertFails(
      getDoc(doc(db, "users/customer-2/shipmentBookingDrafts/draft-2")),
    );
  });
});
