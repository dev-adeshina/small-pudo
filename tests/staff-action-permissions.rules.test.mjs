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

  it("denies client access to staff identities, invitations, designation and audit records", async () => {
    const contexts = [
      environment.unauthenticatedContext().firestore(),
      environment.authenticatedContext("customer-user").firestore(),
      environment.authenticatedContext("admin-user", { email_verified: true, admin: true }).firestore(),
    ];
    for (const db of contexts) {
      for (const path of [
        "staffPermissionAdministrators/admin-user",
        "staffDirectory/staff-user",
        "staffInvitations/invitation-one",
        "staffManagementAudit/event-one",
        "staffActionPermissions/staff-user/permissions/operational_cost_definition.view",
        "staffActionPermissionGrants/grant-one",
        "pudoLocationVerifications/candidate-one",
        "pudoLocationVerifications/candidate-one/inspectionRecords/inspection-one",
        "pudoLocationVerifications/candidate-one/auditEvents/event-one",
      ]) {
        await assertFails(getDoc(doc(db, path)));
        await assertFails(setDoc(doc(db, path), { active: true, status: "active" }));
      }
    }
  });

  it("keeps operational cost definitions and their versions server-only for every client", async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "operationalCostDefinitions/definition-one"), {
        currentVersionId: "version-one",
        currentVersionNumber: 1,
      });
      await setDoc(doc(db, "operationalCostDefinitions/definition-one/versions/version-one"), {
        versionNumber: 1,
        activityName: "Synthetic activity",
      });

      await setDoc(
        doc(db, "pudoLocationVerifications/candidate-one"),
        {
          status: "inspection_recorded",
        },
      );

      await setDoc(
        doc(
          db,
          "pudoLocationVerifications/candidate-one/inspectionRecords/inspection-one",
        ),
        {
          findings: "Synthetic inspection",
        },
      );

      await setDoc(
        doc(
          db,
          "pudoLocationVerifications/candidate-one/auditEvents/event-one",
        ),
        {
          action: "inspection_recorded",
          actorUid: "staff-user",
        },
      );
    });

    const clientContexts = [
      environment.unauthenticatedContext().firestore(),
      environment.authenticatedContext("customer-user").firestore(),
      environment.authenticatedContext("admin-user", {
        email_verified: true,
        admin: true,
      }).firestore(),
    ];

    for (const db of clientContexts) {
      await assertFails(getDoc(doc(db, "operationalCostDefinitions/definition-one")));
      await assertFails(getDoc(doc(db, "operationalCostDefinitions/definition-one/versions/version-one")));
      await assertFails(setDoc(doc(db, "operationalCostDefinitions/client-write"), {
        currentVersionId: "fake",
        currentVersionNumber: 1,
      }));
    }
  });
});


it("keeps PUDO candidates and their audit events server-only", async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, "pudoLocations/candidate-one"), {
      name: "Synthetic candidate",
      lifecycle: "draft",
    });

    await setDoc(
      doc(db, "pudoLocations/candidate-one/auditEvents/event-one"),
      {
        action: "created",
        actorUid: "staff-user",
      },
    );

    await setDoc(
      doc(db, "pudoLocationVerifications/candidate-one"),
      {
        status: "inspection_recorded",
      },
    );

    await setDoc(
      doc(
        db,
        "pudoLocationVerifications/candidate-one/inspectionRecords/inspection-one",
      ),
      {
        findings: "Synthetic inspection",
      },
    );

    await setDoc(
      doc(
        db,
        "pudoLocationVerifications/candidate-one/auditEvents/event-one",
      ),
      {
        action: "inspection_recorded",
        actorUid: "staff-user",
      },
    );
  });

  const clientContexts = [
    environment.unauthenticatedContext().firestore(),
    environment.authenticatedContext("customer-user").firestore(),
    environment.authenticatedContext("admin-user", {
      email_verified: true,
      admin: true,
    }).firestore(),
  ];

  for (const db of clientContexts) {
    for (const path of [
      "pudoLocations/candidate-one",
      "pudoLocations/candidate-one/auditEvents/event-one",
      "pudoLocationVerifications/candidate-one",
      "pudoLocationVerifications/candidate-one/inspectionRecords/inspection-one",
      "pudoLocationVerifications/candidate-one/auditEvents/event-one",
    ]) {
      await assertFails(getDoc(doc(db, path)));
      await assertFails(setDoc(doc(db, path), {
        name: "Client-side modification",
      }));
    }
  }
});