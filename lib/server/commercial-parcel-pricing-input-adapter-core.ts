/**
 * Maps explicitly declared parcel measurements into commercial pricing inputs.
 *
 * This adapter does not choose between declared and actual measurements,
 * convert units, or derive measurements. Customer-selected characteristics
 * are resolved only against the exact supplied pricing configuration.
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
  parcelInput: CommercialParcelInput,
  selectedCharacteristics: Readonly<Record<string, string>> = {}
): Readonly<Record<string, number>> {
  assertCommercialPricingConfiguration(configuration);
  assertCommercialParcelInput(parcelInput);

  if (selectedCharacteristics === null || typeof selectedCharacteristics !== "object" ||
      Array.isArray(selectedCharacteristics)) {
    throw new TypeError("Selected parcel characteristics must be a category-to-option map");
  }

  const characteristicCategories = configuration.parcelCharacteristics ?? [];
  const categoryDefinitions = new Map(characteristicCategories.map((category) => [category.key, category]));
  for (const categoryKey of Object.keys(selectedCharacteristics)) {
    if (!categoryDefinitions.has(categoryKey)) {
      throw new TypeError("An unsupported parcel characteristic category was selected: " + categoryKey);
    }
    if (typeof selectedCharacteristics[categoryKey] !== "string" ||
        !selectedCharacteristics[categoryKey].trim()) {
      throw new TypeError("A selected parcel characteristic option is invalid: " + categoryKey);
    }
  }

  const values: Record<string, number> = {};
  for (const category of characteristicCategories) {
    const selectedOptionKey = selectedCharacteristics[category.key];
    if (selectedOptionKey === undefined) {
      if (category.required) {
        throw new TypeError("A required parcel characteristic is missing: " + category.label);
      }
      // Neutral mathematical values preserve the configured expression when an
      // optional characteristic is not selected; they are not customer rates.
      values[category.inputKey] = category.treatment === "multiplier" ? 1 : 0;
      continue;
    }
    const option = category.options.find((candidate) => candidate.key === selectedOptionKey);
    if (!option) {
      throw new TypeError("The selected option is not configured for parcel characteristic: " + category.label);
    }
    values[category.inputKey] = option.value;
  }

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
