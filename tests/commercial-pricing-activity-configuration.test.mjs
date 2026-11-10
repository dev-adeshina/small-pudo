import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertCommercialPricingConfiguration,
  COMMERCIAL_PRICING_ACTIVITY_CATALOGUE,
} from "../lib/server/commercial-pricing-engine-core.ts";

function configuration(overrides = {}) {
  return {
    schemaVersion: 1,
    configurationName: "Activity configuration test fixture",
    serviceCode: "standard",
    inputs: [],
    components: [],
    activityPricing: {
      schemaVersion: 1,
      activities: COMMERCIAL_PRICING_ACTIVITY_CATALOGUE.map(({ activityCode }) => ({
        activityCode,
        applicability: "undetermined",
        treatment: "undetermined",
      })),
    },
    ...overrides,
  };
}

describe("commercial pricing activity configuration", () => {
  it("accepts a complete activity-only draft without selecting a pricing model or inventing a price", () => {
    assert.doesNotThrow(() => assertCommercialPricingConfiguration(configuration()));
  });

  it("requires all eleven catalogue activities to be represented", () => {
    const incomplete = configuration();
    incomplete.activityPricing.activities.pop();
    assert.throws(
      () => assertCommercialPricingConfiguration(incomplete),
      /all 11 catalogue activities/
    );
  });

  it("rejects duplicate activity assignments", () => {
    const duplicate = configuration();
    duplicate.activityPricing.activities[1] = {
      ...duplicate.activityPricing.activities[0],
    };
    assert.throws(
      () => assertCommercialPricingConfiguration(duplicate),
      /must be unique/
    );
  });

  it("rejects unsupported activity codes", () => {
    const unsupported = configuration();
    unsupported.activityPricing.activities[0].activityCode = "ACT-12";
    assert.throws(
      () => assertCommercialPricingConfiguration(unsupported),
      /unknown activity/
    );
  });

  it("requires not-applicable activities to use the not-applicable treatment", () => {
    const inconsistent = configuration();
    inconsistent.activityPricing.activities[0] = {
      activityCode: "ACT-01",
      applicability: "not_applicable",
      treatment: "included_in_service_charge",
    };
    assert.throws(
      () => assertCommercialPricingConfiguration(inconsistent),
      /inconsistent/
    );
  });

  it("allows applicable activities to be included, itemized, or have no separate customer charge", () => {
    const configured = configuration();
    configured.activityPricing.activities[0] = {
      activityCode: "ACT-01",
      applicability: "applicable",
      treatment: "included_in_service_charge",
    };
    configured.activityPricing.activities[1] = {
      activityCode: "ACT-02",
      applicability: "applicable",
      treatment: "separately_itemized",
    };
    configured.activityPricing.activities[2] = {
      activityCode: "ACT-03",
      applicability: "applicable",
      treatment: "no_separate_customer_charge",
    };
    assert.doesNotThrow(() => assertCommercialPricingConfiguration(configured));
  });

  it("does not allow an activity-only configuration to select a pricing model without pricing components", () => {
    const incomplete = configuration({ pricingModel: "fixed" });
    assert.throws(
      () => assertCommercialPricingConfiguration(incomplete),
      /requires 1 to 100 components/
    );
  });

  it("preserves compatibility for configurations without activity pricing", () => {
    const legacy = {
      schemaVersion: 1,
      configurationName: "Legacy typed configuration",
      serviceCode: "standard",
      inputs: [],
      components: [{
        key: "base",
        label: "Base",
        expression: { kind: "constant", value: 1, unit: "test-unit" },
      }],
    };
    assert.doesNotThrow(() => assertCommercialPricingConfiguration(legacy));
  });
});
