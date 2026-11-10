import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COMMERCIAL_PARCEL_CLASSIFICATION_CATALOGUE,
  assertCommercialParcelClassification,
} from "../lib/server/commercial-parcel-classification-core.ts";

const evidence = {
  recordedAt: "2026-11-10T12:00:00.000Z",
  recordedBy: "staff:uid-2",
  source: "staff_assessment",
};

describe("commercial parcel classification contract", () => {
  it("exposes the agreed initial handling and size catalogue", () => {
    assert.deepEqual(
      COMMERCIAL_PARCEL_CLASSIFICATION_CATALOGUE,
      [
        { code: "fragile", group: "handling" },
        { code: "durable", group: "handling" },
        { code: "bulky", group: "handling" },
        { code: "small", group: "size" },
        { code: "large", group: "size" },
      ]
    );
  });

  it("accepts multiple independently assessed characteristics", () => {
    assert.doesNotThrow(() => assertCommercialParcelClassification({
      schemaVersion: 1,
      classifications: [
        { code: "fragile", group: "handling", status: "present", evidence },
        { code: "bulky", group: "handling", status: "present", evidence },
        { code: "durable", group: "handling", status: "absent", evidence },
      ],
    }));
  });

  it("preserves unknown and not-yet-assessed states without treating them as absent", () => {
    assert.doesNotThrow(() => assertCommercialParcelClassification({
      schemaVersion: 1,
      classifications: [
        { code: "small", group: "size", status: "not_assessed" },
      ],
    }));
    assert.doesNotThrow(() => assertCommercialParcelClassification({
      schemaVersion: 1,
      classifications: [],
    }));
  });

  it("requires provenance for present and absent assessments", () => {
    for (const status of ["present", "absent"]) {
      assert.throws(() => assertCommercialParcelClassification({
        schemaVersion: 1,
        classifications: [{ code: "fragile", group: "handling", status }],
      }), /requires provenance evidence/);
    }
  });

  it("rejects evidence attached to a not-assessed classification", () => {
    assert.throws(() => assertCommercialParcelClassification({
      schemaVersion: 1,
      classifications: [{
        code: "large", group: "size", status: "not_assessed", evidence,
      }],
    }), /cannot contain assessment evidence/);
  });

  it("rejects duplicate, malformed and unsupported classifications", () => {
    const duplicate = {
      schemaVersion: 1,
      classifications: [
        { code: "fragile", group: "handling", status: "not_assessed" },
        { code: "fragile", group: "handling", status: "not_assessed" },
      ],
    };
    assert.throws(() => assertCommercialParcelClassification(duplicate), /must be unique/);
    assert.throws(() => assertCommercialParcelClassification({
      schemaVersion: 1,
      classifications: [{ code: "Fragile", group: "handling", status: "not_assessed" }],
    }), /stable lowercase identifier/);
    assert.throws(() => assertCommercialParcelClassification({
      schemaVersion: 1,
      classifications: [{ code: "fragile", group: "size", status: "not_assessed" }],
    }), /does not match its catalogue/);
  });

  it("supports future extension codes without changing the initial catalogue", () => {
    assert.doesNotThrow(() => assertCommercialParcelClassification({
      schemaVersion: 1,
      classifications: [{
        code: "temperature_sensitive",
        group: "other",
        status: "present",
        evidence: { ...evidence, source: "verified_intake" },
      }],
    }));
  });

  it("requires timezone-qualified timestamps and valid actor/source provenance", () => {
    const invalidEvidence = [
      { ...evidence, recordedAt: "2026-11-10 12:00:00" },
      { ...evidence, recordedBy: "" },
      { ...evidence, source: " " },
    ];
    for (const invalid of invalidEvidence) {
      assert.throws(() => assertCommercialParcelClassification({
        schemaVersion: 1,
        classifications: [{
          code: "fragile", group: "handling", status: "present", evidence: invalid,
        }],
      }));
    }
  });

  it("rejects unknown fields and unsupported status values", () => {
    assert.throws(() => assertCommercialParcelClassification({
      schemaVersion: 1, classifications: [], pricingMultiplier: 2,
    }), /unsupported field/);
    assert.throws(() => assertCommercialParcelClassification({
      schemaVersion: 1,
      classifications: [{ code: "fragile", group: "handling", status: "chargeable" }],
    }), /status is unsupported/);
  });
});
