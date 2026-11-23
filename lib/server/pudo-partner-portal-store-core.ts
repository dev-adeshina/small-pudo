import type { FieldValue, Firestore } from "firebase-admin/firestore";

export interface PudoPartnerProfileInput {
  businessName: string;
  contactName: string;
  phone: string;
}

export interface PudoPartnerApplicationInput {
  locationName: string;
  address: string;
  registrationNote?: string;
  latitude: number;
  longitude: number;
  captureMethod: "device" | "manual";
  accuracyMeters?: number;
}

function assertUid(uid: string) {
  if (typeof uid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
    throw new TypeError("A valid partner identity is required.");
  }
}

function assertText(value: unknown, label: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new TypeError(`${label} is required and must be at most ${max} characters.`);
  }
}

function validateProfile(input: PudoPartnerProfileInput) {
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).some((key) => !["businessName", "contactName", "phone"].includes(key))) {
    throw new TypeError("A valid partner business profile is required.");
  }
  assertText(input.businessName, "Business name", 160);
  assertText(input.contactName, "Contact name", 120);
  assertText(input.phone, "Phone number", 25);
  if (!/^[+\d\s().-]+$/.test(input.phone.trim()) ||
      input.phone.replace(/\D/g, "").length < 7) {
    throw new TypeError("Please enter a valid phone number.");
  }
}

function validateApplication(input: PudoPartnerApplicationInput) {
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).some((key) => ![
        "locationName", "address", "registrationNote", "latitude",
        "longitude", "captureMethod", "accuracyMeters",
      ].includes(key))) {
    throw new TypeError("A valid PUDO location application is required.");
  }
  assertText(input.locationName, "Location name", 160);
  assertText(input.address, "Physical address", 1000);
  if (input.registrationNote !== undefined &&
      (typeof input.registrationNote !== "string" || input.registrationNote.length > 1000)) {
    throw new TypeError("Application notes must be at most 1000 characters.");
  }
  if (typeof input.latitude !== "number" || !Number.isFinite(input.latitude) ||
      input.latitude < -90 || input.latitude > 90 ||
      typeof input.longitude !== "number" || !Number.isFinite(input.longitude) ||
      input.longitude < -180 || input.longitude > 180) {
    throw new TypeError("Valid latitude and longitude are required.");
  }
  if (input.captureMethod !== "device" && input.captureMethod !== "manual") {
    throw new TypeError("Coordinate capture method must be device or manual.");
  }
  if (input.accuracyMeters !== undefined &&
      (input.captureMethod !== "device" || typeof input.accuracyMeters !== "number" ||
       !Number.isFinite(input.accuracyMeters) || input.accuracyMeters < 0)) {
    throw new TypeError("Device accuracy must be a non-negative number.");
  }
}

export function createPudoPartnerPortalStore({
  db,
  serverTimestamp,
}: {
  db: Firestore;
  serverTimestamp: () => FieldValue;
}) {
  const partners = db.collection("pudoPartnerAccounts");
  const applications = db.collection("pudoPartnerApplications");
  const locations = db.collection("pudoLocations");
  const verifications = db.collection("pudoLocationVerifications");

  async function requirePartner(uid: string) {
    assertUid(uid);
    const snapshot = await partners.doc(uid).get();
    if (!snapshot.exists || snapshot.data()?.accountStatus !== "active") {
      throw new Error("A registered PUDO partner account is required.");
    }
    return snapshot.data()!;
  }

  return {
    async registerPartner(uid: string, email: string, input: PudoPartnerProfileInput) {
      assertUid(uid);
      validateProfile(input);
      assertText(email, "Email address", 254);
      const ref = partners.doc(uid);
      const now = serverTimestamp();
      await db.runTransaction(async (tx) => {
        const existing = await tx.get(ref);
        if (existing.exists) {
          throw new Error("A PUDO partner account already exists for this sign-in.");
        }
        tx.create(ref, {
          uid,
          email: email.trim().toLowerCase(),
          businessName: input.businessName.trim(),
          contactName: input.contactName.trim(),
          phone: input.phone.trim(),
          accountStatus: "active",
          createdAt: now,
          updatedAt: now,
        });
      });
      return { uid, businessName: input.businessName.trim(), accountStatus: "active" as const };
    },

    async getPartner(uid: string) {
      const profile = await requirePartner(uid);
      return {
        uid,
        email: profile.email,
        businessName: profile.businessName,
        contactName: profile.contactName,
        phone: profile.phone,
        accountStatus: profile.accountStatus,
      };
    },

    async createApplication(uid: string, input: PudoPartnerApplicationInput) {
      validateApplication(input);
      const profile = await requirePartner(uid);
      const locationRef = locations.doc();
      const applicationRef = applications.doc(locationRef.id);
      const auditRef = locationRef.collection("auditEvents").doc();
      const now = serverTimestamp();

      await db.runTransaction(async (tx) => {
        const account = await tx.get(partners.doc(uid));
        if (!account.exists || account.data()?.accountStatus !== "active") {
          throw new Error("Your PUDO partner account is not active.");
        }
        tx.create(locationRef, {
          name: input.locationName.trim(),
          partnerBusinessName: profile.businessName,
          address: input.address.trim(),
          registrationNote: input.registrationNote?.trim() ?? "",
          geo: {
            latitude: input.latitude,
            longitude: input.longitude,
            captureMethod: input.captureMethod,
            capturedAt: now,
            capturedBy: uid,
            ...(input.accuracyMeters !== undefined ? { accuracyMeters: input.accuracyMeters } : {}),
          },
          lifecycle: "submitted",
          partnerUid: uid,
          submittedBy: uid,
          submittedAt: now,
          createdBy: uid,
          createdAt: now,
          updatedBy: uid,
          updatedAt: now,
        });
        tx.create(applicationRef, {
          locationId: locationRef.id,
          partnerUid: uid,
          businessName: profile.businessName,
          contactName: profile.contactName,
          email: profile.email,
          phone: profile.phone,
          status: "submitted",
          createdAt: now,
          updatedAt: now,
        });
        tx.create(auditRef, {
          action: "partner_application_submitted",
          actorUid: uid,
          locationId: locationRef.id,
          timestamp: now,
        });
      });
      return { locationId: locationRef.id, status: "submitted" as const };
    },

    async listApplications(uid: string) {
      await requirePartner(uid);
      // Keep this on the partner ownership filter only; sort the bounded
      // result set in memory so the portal does not depend on a new index.
      const snapshot = await applications.where("partnerUid", "==", uid).limit(100).get();
      const rows = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const verification = await verifications.doc(doc.id).get();
        const verificationData = verification.exists ? verification.data()! : null;
        return {
          locationId: doc.id,
          locationName: (await locations.doc(doc.id).get()).data()?.name ?? "",
          businessName: data.businessName,
          status: verificationData?.status ?? data.status ?? "submitted",
          decisionReason: verificationData?.status === "clarification_required"
            ? verificationData.decisionReason ?? ""
            : "",
          createdAt: data.createdAt,
          updatedAt: verificationData?.updatedAt ?? data.updatedAt,
        };
      }));
      const timestamp = (value: unknown): number => {
        if (value && typeof value === "object" && "toMillis" in value &&
            typeof value.toMillis === "function") return value.toMillis();
        if (value instanceof Date) return value.getTime();
        const parsed = Date.parse(String(value ?? ""));
        return Number.isFinite(parsed) ? parsed : 0;
      };
      return rows.sort((left, right) => timestamp(right.createdAt) - timestamp(left.createdAt));
    },

    async getApplication(uid: string, locationId: string) {
      await requirePartner(uid);
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(locationId)) throw new TypeError("A valid application ID is required.");
      const [application, location, verification] = await Promise.all([
        applications.doc(locationId).get(),
        locations.doc(locationId).get(),
        verifications.doc(locationId).get(),
      ]);
      if (!application.exists || application.data()?.partnerUid !== uid || !location.exists ||
          location.data()?.partnerUid !== uid) {
        return null;
      }
      const verificationData = verification.exists ? verification.data()! : null;
      const responses = await applications.doc(locationId).collection("partnerResponses")
        .orderBy("createdAt", "asc").get();
      return {
        locationId,
        application: application.data(),
        location: {
          name: location.data()?.name ?? "",
          address: location.data()?.address ?? "",
          registrationNote: location.data()?.registrationNote ?? "",
          geo: location.data()?.geo ?? null,
        },
        status: verificationData?.status ?? application.data()?.status ?? "submitted",
        decisionReason: verificationData?.status === "clarification_required"
          ? verificationData.decisionReason ?? ""
          : "",
        responses: responses.docs.map((doc) => ({ responseId: doc.id, ...doc.data() })),
      };
    },

    async submitClarificationResponse(uid: string, locationId: string, message: string) {
      await requirePartner(uid);
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(locationId)) throw new TypeError("A valid application ID is required.");
      assertText(message, "Response", 3000);
      const applicationRef = applications.doc(locationId);
      const verificationRef = verifications.doc(locationId);
      const responseRef = applicationRef.collection("partnerResponses").doc();
      const eventRef = locations.doc(locationId).collection("auditEvents").doc();
      const now = serverTimestamp();
      await db.runTransaction(async (tx) => {
        const [application, verification, location] = await Promise.all([
          tx.get(applicationRef), tx.get(verificationRef), tx.get(locations.doc(locationId)),
        ]);
        if (!application.exists || application.data()?.partnerUid !== uid ||
            !location.exists || location.data()?.partnerUid !== uid) {
          throw new Error("PUDO application not found.");
        }
        if (!verification.exists || verification.data()?.status !== "clarification_required") {
          throw new Error("A partner response is only available when clarification has been requested.");
        }
        tx.create(responseRef, {
          partnerUid: uid,
          message: message.trim(),
          createdAt: now,
        });
        tx.update(applicationRef, { lastPartnerResponseAt: now, updatedAt: now });
        tx.create(eventRef, {
          action: "partner_clarification_response_submitted",
          actorUid: uid,
          locationId,
          responseId: responseRef.id,
          timestamp: now,
        });
      });
      return { responseId: responseRef.id, submitted: true as const };
    },
  };
}
