/**
 * Maps explicitly declared parcel measurements into commercial pricing inputs.
 *
 * This adapter does not choose between declared and actual measurements,
 * convert units, derive measurements, or apply parcel classifications.
 */
import {
  assertCommercialPricingConfiguration,
  type CommercialPricingConfiguration,
} from "./commercial-pricing-engine-core.ts";
import {
  assertCommercialParcelInput,
  type CommercialParcelInput,
  type CommercialParcelMeasurementName,
} from "./commercial-parcel-input-core.ts";

type ParcelMeasurementSource = {
  record: "declared" | "actual";
  measurement: CommercialParcelMeasurementName;
};

function parseParcelMeasurementSource(source: string): ParcelMeasurementSource | null {
  const match = /^parcel\.(declared|actual)\.(weight|length|width|height)$/.exec(source);
  if (!match) {
    if (source.startsWith("parcel.")) {
      throw new TypeError("Unsupported parcel pricing input source: " + source);
    }
    return null;
  }
  return {
    record: match[1] as "declared" | "actual",
    measurement: match[2] as CommercialParcelMeasurementName,
  };
}

/**
 * Returns only values mapped from source paths explicitly configured on
 * numeric pricing input definitions. Missing evidence is omitted so the
 * pricing engine can reject a missing required input.
 *
 * The configured unit must exactly match the evidence unit. No conversion or
 * normalization is performed. Non-parcel inputs remain the caller's concern.
 */
export function buildCommercialParcelPricingInputValues(
  configuration: CommercialPricingConfiguration,
  parcelInput: CommercialParcelInput
): Readonly<Record<string, number>> {
  assertCommercialPricingConfiguration(configuration);
  assertCommercialParcelInput(parcelInput);

  const values: Record<string, number> = {};
  for (const definition of configuration.inputs) {
    if (definition.source === undefined) continue;
    const source = parseParcelMeasurementSource(definition.source);
    if (source === null) continue;

    const evidence = parcelInput[source.record];
    const measurement = evidence?.measurements[source.measurement];
    if (measurement === undefined) continue;

    if (measurement.unit !== definition.unit) {
      throw new TypeError(
        "Parcel measurement unit does not match pricing input unit: " + definition.key
      );
    }
    values[definition.key] = measurement.value;
  }

  return values;
}
