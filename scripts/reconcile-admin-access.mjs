import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY."
  );
}

if (process.env.ADMIN_EMAILS === undefined) {
  throw new Error("ADMIN_EMAILS must be explicitly set before reconciliation.");
}

const allowedEmails = new Set(
  process.env.ADMIN_EMAILS.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

if (
  allowedEmails.size === 0 &&
  !process.argv.includes("--confirm-empty-admin-list")
) {
  throw new Error(
    "ADMIN_EMAILS is empty. Pass --confirm-empty-admin-list only when intentionally revoking all administrator access."
  );
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

const auth = getAuth(app);
const db = getFirestore(app);
const accessCollection = db.collection("adminAccess");
const existingAccess = await accessCollection.get();
const existingAccessByUid = new Map(
  existingAccess.docs.map((document) => [document.id, document.data()])
);

const eligibleUids = new Set();
const processedUids = new Set();
const counts = {
  activated: 0,
  deactivated: 0,
  claimsAdded: 0,
  claimsRemoved: 0,
  refreshTokensRevoked: 0,
};

let pageToken;

do {
  const page = await auth.listUsers(1000, pageToken);

  for (const user of page.users) {
    processedUids.add(user.uid);

    const email = user.email?.trim().toLowerCase();
    const eligible =
      user.emailVerified === true &&
      Boolean(email) &&
      allowedEmails.has(email);
    const currentClaims = user.customClaims ?? {};
    const hasAdminClaim = currentClaims.admin === true;
    const accessWasActive =
      existingAccessByUid.get(user.uid)?.active === true;

    if (eligible) {
      eligibleUids.add(user.uid);

      if (!hasAdminClaim) {
        await auth.setCustomUserClaims(user.uid, {
          ...currentClaims,
          admin: true,
        });
        counts.claimsAdded += 1;
      }

      if (!accessWasActive) {
        await accessCollection.doc(user.uid).set(
          {
            active: true,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: "admin-access-reconciliation",
          },
          { merge: true }
        );
        counts.activated += 1;
      }

      continue;
    }

    if (accessWasActive) {
      await accessCollection.doc(user.uid).set(
        {
          active: false,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: "admin-access-reconciliation",
        },
        { merge: true }
      );
      counts.deactivated += 1;
    }

    if (hasAdminClaim) {
      const remainingClaims = { ...currentClaims };
      delete remainingClaims.admin;
      await auth.setCustomUserClaims(user.uid, remainingClaims);
      counts.claimsRemoved += 1;
    }

    if (hasAdminClaim || accessWasActive) {
      await auth.revokeRefreshTokens(user.uid);
      counts.refreshTokensRevoked += 1;
    }
  }

  pageToken = page.pageToken;
} while (pageToken);

for (const document of existingAccess.docs) {
  if (processedUids.has(document.id) || eligibleUids.has(document.id)) {
    continue;
  }

  if (document.data().active === true) {
    await document.ref.set(
      {
        active: false,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: "admin-access-reconciliation",
      },
      { merge: true }
    );
    counts.deactivated += 1;
  }
}

console.log(
  JSON.stringify(
    {
      projectId,
      allowlistedEmails: allowedEmails.size,
      ...counts,
    },
    null,
    2
  )
);
