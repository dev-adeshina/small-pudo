import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assertCommercialParcelInput } from "../lib/server/commercial-parcel-input-core.ts";

const declared = {
  measurements: {
    weight: { value: 2.4, unit: "kg" },
    length: { value: 30, unit: "cm" },
  },
  recordedAt: "2026-11-10T12:00:00.000Z",
  recordedBy: "customer:uid-1",
  source: "customer_declaration",
};

const actual = {
  measurements: {
    weight: { value: 2.6, unit: "kg" },
    length: { value: 31, unit: "cm" },
    width: { value: 20, unit: "cm" },
    height: { value: 12, unit: "cm" },
  },
  recordedAt: "2026-11-10T12:10:00.000Z",
  recordedBy: "staff:uid-2",
  source: "staff_measurement",
};

describe("commercial parcel input evidence contract", () => {
  it("accepts declared and actual evidence while preserving their differences", () => {
    const input = {
      schemaVersion: 1,
      declared,
      actual,
      handlingCharacteristics: [{ code: "fragile", value: true }],
    };
    assert.doesNotThrow(() => assertCommercialParcelInput(input));
    assert.notDeepEqual(input.declared.measurements, input.actual.measurements);
    assert.equal(input.declared.measurements.weight.value, 2.4);
    assert.equal(input.actual.measurements.weight.value, 2.6);
  });

  it("accepts a partial measurement record without inventing missing values", () => {
    const input = {
      schemaVersion: 1,
      declared: { ...declared, measurements: { weight: declared.measurements.weight } },
      handlingCharacteristics: [],
    };
    assert.doesNotThrow(() => assertCommercialParcelInput(input));
    assert.equal("length" in input.declared.measurements, false);
  });

  it("requires at least one declared or actual evidence record", () => {
    assert.throws(
      () => assertCommercialParcelInput({ schemaVersion: 1, handlingCharacteristics: [] }),
      /requires declared or actual/
    );
  });

  it("rejects zero, negative, non-finite and non-numeric measurements", () => {
    for (const value of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, "2"]) {
      const input = {
        schemaVersion: 1,
        declared: {
          ...declared,
          measurements: { weight: { value, unit: "kg" } },
        },
        handlingCharacteristics: [],
      };
      assert.throws(() => assertCommercialParcelInput(input), /finite positive number/);
    }
  });

  it("requires explicit non-empty units and measurement provenance", () => {
    const noUnit = structuredClone(declared);
    noUnit.measurements.weight.unit = " ";
    assert.throws(
      () => assertCommercialParcelInput({
        schemaVersion: 1, declared: noUnit, handlingCharacteristics: [],
      }),
      /unit must be a non-empty string/
    );

    const noActor = { ...declared, recordedBy: "" };
    assert.throws(
      () => assertCommercialParcelInput({
        schemaVersion: 1, declared: noActor, handlingCharacteristics: [],
      }),
      /recordedBy/
    );
  });

  it("requires timezone-qualified ISO timestamps", () => {
    const invalid = { ...declared, recordedAt: "2026-11-10 12:00:00" };
    assert.throws(
      () => assertCommercialParcelInput({
        schemaVersion: 1, declared: invalid, handlingCharacteristics: [],
      }),
      /ISO 8601 timestamp/
    );
  });

  it("rejects duplicate or malformed handling characteristics", () => {
    assert.throws(
      () => assertCommercialParcelInput({
        schemaVersion: 1,
        declared,
        handlingCharacteristics: [
          { code: "fragile", value: true },
          { code: "fragile", value: false },
        ],
      }),
      /must be unique/
    );
    assert.throws(
      () => assertCommercialParcelInput({
        schemaVersion: 1,
        declared,
        handlingCharacteristics: [{ code: "oversize", value: { yes: true } }],
      }),
      /string or boolean/
    );
  });

  it("rejects unsupported fields rather than silently discarding evidence", () => {
    assert.throws(
      () => assertCommercialParcelInput({
        schemaVersion: 1,
        declared,
        handlingCharacteristics: [],
        volumetricWeight: 99,
      }),
      /unsupported field/
    );
  });
});
