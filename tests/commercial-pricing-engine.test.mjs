import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertCommercialPricingConfiguration,
  evaluateCommercialPricing,
} from "../lib/server/commercial-pricing-engine-core.ts";

const validConfiguration = {
  schemaVersion: 1,
  configurationName: "Synthetic engine test configuration",
  serviceCode: "standard",
  pricingModel: "hybrid",
  inputs: [
    {
      key: "distance",
      label: "Distance",
      required: true,
      valueType: "number",
      source: "Synthetic test input",
      unit: "km",
    },
  ],
  components: [
    {
      key: "base",
      label: "Base component",
      expression: {
        kind: "constant",
        value: 10,
        unit: "test-unit",
      },
    },
    {
      key: "distance_component",
      label: "Distance component",
      expression: {
        kind: "multiply",
        factors: [
          { kind: "input", key: "distance" },
          { kind: "constant", value: 2, unit: "test-unit/km" },
        ],
        resultUnit: "test-unit",
      },
    },
  ],
};

describe("commercial pricing evaluation core", () => {
  it("validates the typed configuration contract", () => {
    assert.doesNotThrow(() =>
      assertCommercialPricingConfiguration(validConfiguration)
    );
  });

  it("evaluates configured components and returns an itemised non-authoritative result", () => {
    const result = evaluateCommercialPricing({
      definitionId: "definition-1",
      versionId: "version-3",
      versionNumber: 3,
      configuration: validConfiguration,
      values: { distance: 5 },
    });

    assert.deepEqual(result, {
      authority: "non_authoritative",
      definitionId: "definition-1",
      versionId: "version-3",
      versionNumber: 3,
      serviceCode: "standard",
      components: [
        { key: "base", label: "Base component", value: 10, unit: "test-unit" },
        {
          key: "distance_component",
          label: "Distance component",
          value: 10,
          unit: "test-unit",
        },
      ],
      total: 20,
      unit: "test-unit",
    });
  });

  it("evaluates sums only when all terms use the same unit", () => {
    const configuration = {
      ...validConfiguration,
      pricingModel: "fixed",
      components: [{
        key: "combined",
        label: "Combined",
        expression: {
          kind: "sum",
          terms: [
            { kind: "constant", value: 3, unit: "test-unit" },
            { kind: "constant", value: 4, unit: "test-unit" },
          ],
        },
      }],
    };

    const result = evaluateCommercialPricing({
      definitionId: "definition-1",
      versionId: "version-1",
      versionNumber: 1,
      configuration,
      values: { distance: 5 },
    });

    assert.equal(result.total, 7);
  });

  it("rejects a missing required input", () => {
    assert.throws(
      () => evaluateCommercialPricing({
        definitionId: "definition-1",
        versionId: "version-1",
        versionNumber: 1,
        configuration: validConfiguration,
        values: {},
      }),
      /Required pricing input is missing/
    );
  });

  it("rejects unsupported supplied inputs", () => {
    assert.throws(
      () => evaluateCommercialPricing({
        definitionId: "definition-1",
        versionId: "version-1",
        versionNumber: 1,
        configuration: validConfiguration,
        values: { distance: 5, inventedInput: 2 },
      }),
      /unsupported pricing input/
    );
  });

  it("rejects non-finite inputs and calculation results", () => {
    assert.throws(
      () => evaluateCommercialPricing({
        definitionId: "definition-1",
        versionId: "version-1",
        versionNumber: 1,
        configuration: validConfiguration,
        values: { distance: Number.POSITIVE_INFINITY },
      }),
      /finite number/
    );

    const overflowing = {
      ...validConfiguration,
      pricingModel: "fixed",
      components: [{
        key: "overflow",
        label: "Overflow",
        expression: {
          kind: "multiply",
          factors: [
            { kind: "constant", value: Number.MAX_VALUE, unit: "a" },
            { kind: "constant", value: 2, unit: "b" },
          ],
          resultUnit: "test-unit^2",
        },
      }],
    };

    assert.throws(
      () => evaluateCommercialPricing({
        definitionId: "definition-1",
        versionId: "version-1",
        versionNumber: 1,
        configuration: overflowing,
        values: { distance: 1 },
      }),
      /finite number/
    );
  });

  it("rejects incompatible units in sums and component totals", () => {
    const invalidSum = {
      ...validConfiguration,
      pricingModel: "fixed",
      components: [{
        key: "invalid_sum",
        label: "Invalid sum",
        expression: {
          kind: "sum",
          terms: [
            { kind: "constant", value: 1, unit: "km" },
            { kind: "constant", value: 2, unit: "kg" },
          ],
        },
      }],
    };

    assert.throws(
      () => evaluateCommercialPricing({
        definitionId: "definition-1",
        versionId: "version-1",
        versionNumber: 1,
        configuration: invalidSum,
        values: { distance: 1 },
      }),
      /different units/
    );

    const invalidTotal = {
      ...validConfiguration,
      components: [
        validConfiguration.components[0],
        {
          key: "other_unit",
          label: "Other unit",
          expression: {
            kind: "constant",
            value: 1,
            unit: "different-unit",
          },
        },
      ],
    };

    assert.throws(
      () => evaluateCommercialPricing({
        definitionId: "definition-1",
        versionId: "version-1",
        versionNumber: 1,
        configuration: invalidTotal,
        values: { distance: 1 },
      }),
      /different units cannot be totalled/
    );
  });

  it("does not evaluate a configuration without an explicit pricing model", () => {
    const incomplete = { ...validConfiguration };
    delete incomplete.pricingModel;

    assert.throws(
      () => evaluateCommercialPricing({
        definitionId: "definition-1",
        versionId: "version-1",
        versionNumber: 1,
        configuration: incomplete,
        values: { distance: 1 },
      }),
      /pricing model must be selected/
    );
  });

  it("rejects duplicate input keys and undefined expression references", () => {
    const duplicateInputs = {
      ...validConfiguration,
      inputs: [
        ...validConfiguration.inputs,
        { ...validConfiguration.inputs[0] },
      ],
    };

    assert.throws(
      () => assertCommercialPricingConfiguration(duplicateInputs),
      /keys must be unique/
    );

    const undefinedReference = {
      ...validConfiguration,
      pricingModel: "calculated",
      components: [{
        key: "bad_reference",
        label: "Bad reference",
        expression: { kind: "input", key: "unknown" },
      }],
    };

    assert.throws(
      () => assertCommercialPricingConfiguration(undefinedReference),
      /undefined input/
    );
  });


  it("requires the selected pricing model to match component dependencies", () => {
    const fixedWithInput = { ...validConfiguration, pricingModel: "fixed" };
    assert.throws(
      () => assertCommercialPricingConfiguration(fixedWithInput),
      /does not match the configured component structure/
    );

    const calculatedWithFixedComponent = {
      ...validConfiguration,
      pricingModel: "calculated",
    };
    assert.throws(
      () => assertCommercialPricingConfiguration(calculatedWithFixedComponent),
      /does not match the configured component structure/
    );

    const fixed = {
      ...validConfiguration,
      pricingModel: "fixed",
      components: [{
        key: "fixed_component",
        label: "Fixed component",
        expression: { kind: "constant", value: 4, unit: "test-unit" },
      }],
    };
    assert.doesNotThrow(() => assertCommercialPricingConfiguration(fixed));
  });

  it("allows omitted optional inputs only when no unconditional component depends on them", () => {
    const optionalUnused = {
      ...validConfiguration,
      inputs: [
        ...validConfiguration.inputs,
        {
          key: "optionalContext",
          label: "Optional context",
          required: false,
          valueType: "number",
          unit: "kg",
        },
      ],
    };
    assert.doesNotThrow(() =>
      evaluateCommercialPricing({
        definitionId: "definition-1",
        versionId: "version-1",
        versionNumber: 1,
        configuration: optionalUnused,
        values: { distance: 5 },
      })
    );

    const optionalReferenced = {
      ...validConfiguration,
      inputs: [{
        ...validConfiguration.inputs[0],
        required: false,
      }],
    };
    assert.throws(
      () => assertCommercialPricingConfiguration(optionalReferenced),
      /optional pricing input cannot be referenced/
    );
  });

  it("rejects multiplication when factor units do not produce the declared result unit", () => {
    const invalidProduct = {
      ...validConfiguration,
      pricingModel: "calculated",
      components: [{
        key: "invalid_product",
        label: "Invalid product",
        expression: {
          kind: "multiply",
          factors: [
            { kind: "input", key: "distance" },
            { kind: "constant", value: 2, unit: "kg" },
          ],
          resultUnit: "test-unit",
        },
      }],
    };

    assert.throws(
      () => evaluateCommercialPricing({
        definitionId: "definition-1",
        versionId: "version-1",
        versionNumber: 1,
        configuration: invalidProduct,
        values: { distance: 5 },
      }),
      /factor units do not produce/
    );
  });

  it("requires explicit units for numeric pricing inputs", () => {
    const missingUnit = {
      ...validConfiguration,
      inputs: [{
        key: "distance",
        label: "Distance",
        required: true,
        valueType: "number",
      }],
    };

    assert.throws(
      () => assertCommercialPricingConfiguration(missingUnit),
      /input unit/
    );
  });
});
