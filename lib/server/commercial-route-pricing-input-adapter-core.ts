/**
 * Maps explicitly configured route-distance evidence into commercial
 * pricing inputs.
 *
 * This adapter does not calculate routes, convert units, verify distance
 * evidence, or calculate prices.
 *
 * Missing route evidence is never defaulted to zero.
 */

import {
  assertCommercialPricingConfiguration,
  type CommercialPricingConfiguration,
} from "./commercial-pricing-engine-core.ts";

import {
  assertCommercialRouteDistanceEvidence,
  type CommercialRouteDistanceEvidence,
} from "./commercial-route-distance-input-core.ts";

/**
 * Identifies a supported route pricing input source.
 */
type RouteDistanceSource = {
  measurement: "distance";
};

function parseRouteDistanceSource(
  source: string
): RouteDistanceSource | null {
  if (source === "route.distance") {
    return {
      measurement: "distance",
    };
  }

  if (source.startsWith("route.")) {
    throw new TypeError(
      "Unsupported route pricing input source: " + source
    );
  }

  return null;
}

/**
 * Returns only values mapped from explicitly configured route-distance
 * evidence.
 *
 * The configured pricing input unit must exactly match the evidence unit.
 * No conversion or normalization is performed.
 *
 * Non-route inputs remain the responsibility of their respective adapters.
 *
 * Missing evidence is omitted so the commercial pricing engine can reject
 * a missing required input.
 */

export function buildCommercialRoutePricingInputValues(
  configuration: CommercialPricingConfiguration,
  routeEvidence: CommercialRouteDistanceEvidence | undefined
): Readonly<Record<string, number>> {
  assertCommercialPricingConfiguration(configuration);

  if (routeEvidence !== undefined) {
    assertCommercialRouteDistanceEvidence(routeEvidence);
  }

  const values: Record<string, number> = {};

  if (routeEvidence === undefined) {
    return values;
  }

  for (const definition of configuration.inputs) {
    if (definition.source === undefined) {
      continue;
    }

    const source = parseRouteDistanceSource(definition.source);

    if (source === null) {
      continue;
    }

    const distance = routeEvidence.distance;

    if (distance.unit !== definition.unit) {
      throw new TypeError(
        "Route distance unit does not match pricing input unit: " +
          definition.key
      );
    }

    values[definition.key] = distance.value;
  }

  return values;
}
