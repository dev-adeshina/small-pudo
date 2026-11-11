import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCommercialParcelPricingInputValues,
} from "../lib/server/commercial-parcel-pricing-input-adapter-core.ts";
import {
  evaluateCommercialPricing,
} from "../lib/server/commercial-pricing-engine-core.ts";

const parcel = {
  schemaVersion: 1,
  declared: {
    measurements: {
      weight: { value: 2.4, unit: "kg" },
      length: { value: 30, unit: "cm" },
    },
    recordedAt: "2026-11-10T12:00:00.000Z",
    recordedBy: "customer:uid-1",
    source: "customer_declaration",
  },
  actual: {
    measurements: {
      weight: { value: 2.6, unit: "kg" },
      length: { value: 31, unit: "cm" },
    },
    recordedAt: "2026-11-10T12:10:00.000Z",
    recordedBy: "staff:uid-2",
    source: "staff_measurement",
  },
  handlingCharacteristics: [],
};

const configuration = {
  schemaVersion: 1,
  configurationName: "Parcel input adapter test",
  serviceCode: "standard",
  pricingModel: "calculated",
  inputs: [
    {
      key: "declaredWeight",
      label: "Declared weight",
      required: true,
      valueType: "number",
      source: "parcel.declared.weight",
      unit: "kg",
    },
    {
      key: "actualLength",
      label: "Actual length",
      required: true,
      valueType: "number",
      source: "parcel.actual.length",
      unit: "cm",
    },
  ],
  components: [
    {
      key: "weight_component",
      label: "Weight component",
      expression: { kind: "input", key: "declaredWeight" },
    },
  ],
};

describe("commercial parcel pricing input adapter", () => {
  it("maps only the explicitly selected declared or actual measurements", () => {
    assert.deepEqual(
      buildCommercialParcelPricingInputValues(configuration, parcel),
      { declaredWeight: 2.4, actualLength: 31 }
    );
  });

  it("keeps declared and actual measurements distinct", () => {
    const declaredOnly = {
      ...configuration,
      inputs: [configuration.inputs[0]],
    };
    const actualOnly = {
      ...configuration,
      inputs: [{
        ...configuration.inputs[0],
        key: "actualWeight",
        source: "parcel.actual.weight",
      }],
    };

    assert.deepEqual(
      buildCommercialParcelPricingInputValues(declaredOnly, parcel),
      { declaredWeight: 2.4 }
    );
    assert.deepEqual(
      buildCommercialParcelPricingInputValues(actualOnly, parcel),
      { actualWeight: 2.6 }
    );
  });

  it("omits missing parcel evidence so the evaluator fails closed for required inputs", () => {
    const partialParcel = {
      schemaVersion: 1,
      declared: parcel.declared,
      handlingCharacteristics: [],
    };
    const actualOnly = {
      ...configuration,
      inputs: [{
        ...configuration.inputs[0],
        key: "actualWeight",
        source: "parcel.actual.weight",
      }],
      components: [{
        key: "actual_weight",
        label: "Actual weight",
        expression: { kind: "input", key: "actualWeight" },
      }],
    };
    const values = buildCommercialParcelPricingInputValues(actualOnly, partialParcel);
    assert.deepEqual(values, {});
    assert.throws(() => evaluateCommercialPricing({
      definitionId: "definition-1",
      versionId: "version-1",
      versionNumber: 1,
      configuration: actualOnly,
      values,
    }), /Required pricing input is missing: actualWeight/);
  });

  it("rejects unit mismatches rather than converting measurements", () => {
    const wrongUnit = {
      ...configuration,
      inputs: [{
        ...configuration.inputs[0],
        unit: "g",
      }],
    };
    assert.throws(
      () => buildCommercialParcelPricingInputValues(wrongUnit, parcel),
      /unit does not match/
    );
  });

  it("rejects unknown parcel source paths", () => {
    const unsupported = {
      ...configuration,
      inputs: [{
        ...configuration.inputs[0],
        source: "parcel.volumetricWeight",
      }],
    };
    assert.throws(
      () => buildCommercialParcelPricingInputValues(unsupported, parcel),
      /Unsupported parcel pricing input source/
    );
  });

  it("does not map non-parcel inputs or classification evidence", () => {
    const mixed = {
      ...configuration,
      inputs: [
        ...configuration.inputs,
        {
          key: "routeDistance",
          label: "Route distance",
          required: false,
          valueType: "number",
          source: "route.distance",
          unit: "km",
        },
      ],
    };
    assert.deepEqual(
      buildCommercialParcelPricingInputValues(mixed, parcel),
      { declaredWeight: 2.4, actualLength: 31 }
    );
  });

  it("keeps evaluation explicitly non-authoritative after parcel mapping", () => {
    const values = buildCommercialParcelPricingInputValues(configuration, parcel);
    const result = evaluateCommercialPricing({
      definitionId: "definition-1",
      versionId: "version-1",
      versionNumber: 1,
      configuration,
      values,
    });
    assert.equal(result.authority, "non_authoritative");
    assert.equal(result.components[0].value, 2.4);
  });
});
