import test from "node:test";
import assert from "node:assert/strict";
import {
  ShipmentDomainError,
  createWalkInCustomerProfile,
  assertCanCancelShipment,
  assertCanRejectShipment,
  assertCanEditDeclaredMeasurements,
  closeMeasurementReview,
  deriveHandoverStatus,
} from "../lib/shipment/domain.mjs";

const partner = { type: "pudo_partner", id: "partner-1" };
const admin = { type: "admin", id: "admin-1" };

function rejectsCode(fn, code) {
  assert.throws(fn, (error) => error instanceof ShipmentDomainError && error.code === code);
}

test("walk-in customer profile is created without an Auth account", () => {
  const profile = createWalkInCustomerProfile(
    { fullName: "Ada Example", phone: "+2348000000000", email: "ADA@example.com" },
    partner
  );
  assert.equal(profile.authUid, null);
  assert.equal(profile.accountStatus, "pending_registration");
  assert.equal(profile.createdVia, "pudo_walk_in");
  assert.equal(profile.email, "ada@example.com");
});

test("walk-in profile cannot be created by a non-PUDO actor", () => {
  rejectsCode(
    () => createWalkInCustomerProfile({ fullName: "Ada", phone: "0800" }, admin),
    "FORBIDDEN_ACTOR"
  );
});

test("customer may cancel own unpaid shipment before confirmation and withdraw quote", () => {
  const result = assertCanCancelShipment(
    { status: "Awaiting Payment", customerId: "customer-1", quoteId: "quote-1", paymentStatus: "pending" },
    { type: "customer", id: "customer-1" },
    "Changed my mind"
  );
  assert.equal(result.status, "Cancelled");
  assert.equal(result.quoteAction, "withdraw");
});

test("customer cannot cancel another customer's shipment", () => {
  rejectsCode(
    () => assertCanCancelShipment(
      { status: "Quoted", customerId: "customer-1" },
      { type: "customer", id: "customer-2" },
      "Reason"
    ),
    "FORBIDDEN_OWNER"
  );
});

test("paid or confirmed shipment cannot be cancelled", () => {
  rejectsCode(
    () => assertCanCancelShipment(
      { status: "Awaiting Payment", paymentStatus: "successful" },
      admin,
      "Reason"
    ),
    "PAYMENT_OR_CONFIRMATION_EXISTS"
  );
});

test("Admin may reject only a quoted, unaccepted, unpaid shipment and withdraw quote", () => {
  const result = assertCanRejectShipment(
    { status: "Quoted", quoteId: "quote-1", paymentStatus: "unpaid" },
    admin,
    "Outside service coverage"
  );
  assert.equal(result.status, "Rejected");
  assert.equal(result.quoteAction, "withdraw");
});

test("shipment cannot be rejected before quotation or by a partner", () => {
  rejectsCode(
    () => assertCanRejectShipment({ status: "Under Review" }, admin, "Reason"),
    "REJECTION_NOT_ALLOWED"
  );
  rejectsCode(
    () => assertCanRejectShipment({ status: "Quoted", quoteId: "q1" }, partner, "Reason"),
    "FORBIDDEN_ACTOR"
  );
});

test("only Admin may edit declared measurements while review is open", () => {
  assert.equal(assertCanEditDeclaredMeasurements({ reviewStatus: "open", actor: admin }), true);
  rejectsCode(
    () => assertCanEditDeclaredMeasurements({ reviewStatus: "closed", actor: admin }),
    "MEASUREMENT_REVIEW_LOCKED"
  );
  rejectsCode(
    () => assertCanEditDeclaredMeasurements({ reviewStatus: "open", actor: partner }),
    "FORBIDDEN_ACTOR"
  );
});

test("only Admin may close an open measurement review and lock declared values", () => {
  const result = closeMeasurementReview({ reviewStatus: "open", actor: admin });
  assert.equal(result.reviewStatus, "closed");
  assert.equal(result.locked, true);
  assert.equal(result.closedBy.id, "admin-1");
});

test("PUDO-origin service moves to Received at PUDO only with completed photo intake", () => {
  assert.equal(
    deriveHandoverStatus({
      serviceType: "pudo_to_door",
      evidence: { kind: "pudo_intake", completed: true, photoEvidenceRefs: ["storage/intake.jpg"], pudoLocationId: "pudo-1" },
    }),
    "Received at PUDO"
  );
  rejectsCode(
    () => deriveHandoverStatus({
      serviceType: "pudo_to_pudo",
      evidence: { kind: "pudo_intake", completed: true, photoEvidenceRefs: [], pudoLocationId: "pudo-1" },
    }),
    "PUDO_INTAKE_EVIDENCE_REQUIRED"
  );
});

test("door-origin service moves to Collected only after assigned operator physically collects", () => {
  assert.equal(
    deriveHandoverStatus({
      serviceType: "door_to_pudo",
      evidence: { kind: "door_pickup", physicallyCollected: true, assignmentId: "assignment-1", operatorId: "operator-1" },
    }),
    "Collected"
  );
  rejectsCode(
    () => deriveHandoverStatus({
      serviceType: "door_to_door",
      evidence: { kind: "door_pickup", physicallyCollected: false, assignmentId: "assignment-1", operatorId: "operator-1" },
    }),
    "PHYSICAL_COLLECTION_EVIDENCE_REQUIRED"
  );
});
