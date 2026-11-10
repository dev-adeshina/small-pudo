export type CommercialPricingServiceCode =
  | "standard"
  | "express"
  | "scheduled";

export type CommercialPricingModel =
  | "fixed"
  | "calculated"
  | "hybrid";

export interface CommercialPricingInputDefinition {
  key: string;
  label: string;
  required: boolean;
  valueType: "number";
  source?: string;
  unit?: string;
}

export type CommercialPricingExpression =
  | { kind: "input"; key: string }
  | { kind: "constant"; value: number; unit: string }
  | { kind: "sum"; terms: CommercialPricingExpression[] }
  | {
      kind: "multiply";
      factors: CommercialPricingExpression[];
      resultUnit: string;
    };

export interface CommercialPricingComponent {
  key: string;
  label: string;
  description?: string;
  expression: CommercialPricingExpression;
}

export interface CommercialPricingConfiguration {
  schemaVersion: 1;
  configurationName: string;
  serviceCode: CommercialPricingServiceCode;
  pricingModel?: CommercialPricingModel;
  inputs: CommercialPricingInputDefinition[];
  components: CommercialPricingComponent[];
}

export interface CommercialPricingEvaluationInput {
  definitionId: string;
  versionId: string;
  versionNumber: number;
  configuration: CommercialPricingConfiguration;
  values: Readonly<Record<string, unknown>>;
}

export interface CommercialPricingEvaluationComponent {
  key: string;
  label: string;
  value: number;
  unit: string;
}

export interface CommercialPricingEvaluationResult {
  authority: "non_authoritative";
  definitionId: string;
  versionId: string;
  versionNumber: number;
  serviceCode: CommercialPricingServiceCode;
  components: CommercialPricingEvaluationComponent[];
  total: number;
  unit: string;
}

const SERVICE_CODES = new Set<CommercialPricingServiceCode>([
  "standard",
  "express",
  "scheduled",
]);
const PRICING_MODELS = new Set<CommercialPricingModel>([
  "fixed",
  "calculated",
  "hybrid",
]);
const KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const MAX_COMPONENTS = 100;
const MAX_INPUTS = 100;
const MAX_EXPRESSION_DEPTH = 20;
const MAX_EXPRESSION_TERMS = 50;

function assertPlainMap(
  value: unknown,
  label: string
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(label + " must be a plain map");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(label + " must be a plain map");
  }
}

function assertNonEmptyString(
  value: unknown,
  label: string,
  maximumLength = 200
): asserts value is string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > maximumLength
  ) {
    throw new TypeError(label + " must be a non-empty string");
  }
}

function assertKey(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !KEY_PATTERN.test(value)) {
    throw new TypeError(label + " must be a stable identifier");
  }
}

function assertFiniteNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(label + " must be a finite number");
  }
}

function assertExpression(
  value: unknown,
  inputKeys: ReadonlySet<string>,
  depth = 0
): asserts value is CommercialPricingExpression {
  if (depth > MAX_EXPRESSION_DEPTH) {
    throw new TypeError("Pricing expression exceeds the maximum depth");
  }
  assertPlainMap(value, "A pricing expression");

  if (value.kind === "input") {
    if (Object.keys(value).some((key) => key !== "kind" && key !== "key")) {
      throw new TypeError("An input expression contains an unsupported field");
    }
    assertKey(value.key, "Pricing expression input key");
    if (!inputKeys.has(value.key)) {
      throw new TypeError("Pricing expression references an undefined input");
    }
    return;
  }

  if (value.kind === "constant") {
    if (Object.keys(value).some((key) =>
      key !== "kind" && key !== "value" && key !== "unit"
    )) {
      throw new TypeError("A constant expression contains an unsupported field");
    }
    assertFiniteNumber(value.value, "Pricing constant");
    assertNonEmptyString(value.unit, "Pricing constant unit", 80);
    return;
  }

  if (value.kind === "sum") {
    if (Object.keys(value).some((key) => key !== "kind" && key !== "terms")) {
      throw new TypeError("A sum expression contains an unsupported field");
    }
    if (
      !Array.isArray(value.terms) ||
      value.terms.length < 2 ||
      value.terms.length > MAX_EXPRESSION_TERMS
    ) {
      throw new TypeError("A sum expression requires 2 to 50 terms");
    }
    for (const term of value.terms) {
      assertExpression(term, inputKeys, depth + 1);
    }
    return;
  }

  if (value.kind === "multiply") {
    if (Object.keys(value).some((key) =>
      key !== "kind" && key !== "factors" && key !== "resultUnit"
    )) {
      throw new TypeError("A multiply expression contains an unsupported field");
    }
    if (
      !Array.isArray(value.factors) ||
      value.factors.length < 2 ||
      value.factors.length > MAX_EXPRESSION_TERMS
    ) {
      throw new TypeError("A multiply expression requires 2 to 50 factors");
    }
    assertNonEmptyString(value.resultUnit, "Pricing multiplication result unit", 80);
    for (const factor of value.factors) {
      assertExpression(factor, inputKeys, depth + 1);
    }
    return;
  }

  throw new TypeError("Pricing expression kind is unsupported");
}

export function assertCommercialPricingConfiguration(
  value: unknown
): asserts value is CommercialPricingConfiguration {
  assertPlainMap(value, "A commercial pricing configuration");
  const allowedKeys = new Set([
    "schemaVersion",
    "configurationName",
    "serviceCode",
    "pricingModel",
    "inputs",
    "components",
  ]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw new TypeError("Commercial pricing configuration contains an unsupported field");
  }

  if (value.schemaVersion !== 1) {
    throw new TypeError("Commercial pricing schema version is unsupported");
  }
  assertNonEmptyString(value.configurationName, "Configuration name", 120);
  if (!SERVICE_CODES.has(value.serviceCode as CommercialPricingServiceCode)) {
    throw new TypeError("Commercial pricing service code is unsupported");
  }
  if (
    value.pricingModel !== undefined &&
    !PRICING_MODELS.has(value.pricingModel as CommercialPricingModel)
  ) {
    throw new TypeError("Commercial pricing model is unsupported");
  }

  if (!Array.isArray(value.inputs) || value.inputs.length > MAX_INPUTS) {
    throw new TypeError("Commercial pricing inputs must be an array of at most 100");
  }
  const inputKeys = new Set<string>();
  for (const input of value.inputs) {
    assertPlainMap(input, "A commercial pricing input");
    const fields = new Set([
      "key", "label", "required", "valueType", "source", "unit",
    ]);
    if (Object.keys(input).some((key) => !fields.has(key))) {
      throw new TypeError("Commercial pricing input contains an unsupported field");
    }
    assertKey(input.key, "Commercial pricing input key");
    if (inputKeys.has(input.key)) {
      throw new TypeError("Commercial pricing input keys must be unique");
    }
    inputKeys.add(input.key);
    assertNonEmptyString(input.label, "Commercial pricing input label", 120);
    if (input.required !== true && input.required !== false) {
      throw new TypeError("Commercial pricing input required must be a boolean");
    }
    if (input.valueType !== "number") {
      throw new TypeError("Only numeric inputs can be evaluated by this engine");
    }
    if (input.source !== undefined) {
      assertNonEmptyString(input.source, "Commercial pricing input source", 200);
    }
    if (input.unit !== undefined) {
      assertNonEmptyString(input.unit, "Commercial pricing input unit", 80);
    }
  }

  if (
    !Array.isArray(value.components) ||
    value.components.length < 1 ||
    value.components.length > MAX_COMPONENTS
  ) {
    throw new TypeError("A pricing configuration requires 1 to 100 components");
  }
  const componentKeys = new Set<string>();
  for (const component of value.components) {
    assertPlainMap(component, "A commercial pricing component");
    const fields = new Set(["key", "label", "description", "expression"]);
    if (Object.keys(component).some((key) => !fields.has(key))) {
      throw new TypeError("Commercial pricing component contains an unsupported field");
    }
    assertKey(component.key, "Commercial pricing component key");
    if (componentKeys.has(component.key)) {
      throw new TypeError("Commercial pricing component keys must be unique");
    }
    componentKeys.add(component.key);
    assertNonEmptyString(component.label, "Commercial pricing component label", 120);
    if (component.description !== undefined) {
      assertNonEmptyString(component.description, "Commercial pricing component description", 500);
    }
    assertExpression(component.expression, inputKeys);
  }
}

interface EvaluatedValue {
  value: number;
  unit: string;
}

function evaluateExpression(
  expression: CommercialPricingExpression,
  inputDefinitions: ReadonlyMap<string, CommercialPricingInputDefinition>,
  suppliedValues: Readonly<Record<string, unknown>>
): EvaluatedValue {
  if (expression.kind === "input") {
    const definition = inputDefinitions.get(expression.key);
    if (!definition) {
      throw new TypeError("Pricing expression references an undefined input");
    }
    const supplied = suppliedValues[expression.key];
    assertFiniteNumber(supplied, "Pricing input " + expression.key);
    return { value: supplied, unit: definition.unit ?? "" };
  }

  if (expression.kind === "constant") {
    return { value: expression.value, unit: expression.unit };
  }

  if (expression.kind === "sum") {
    const evaluated = expression.terms.map((term) =>
      evaluateExpression(term, inputDefinitions, suppliedValues)
    );
    const unit = evaluated[0].unit;
    if (evaluated.some((item) => item.unit !== unit)) {
      throw new TypeError("A sum expression cannot combine different units");
    }
    const value = evaluated.reduce((total, item) => total + item.value, 0);
    assertFiniteNumber(value, "Pricing sum result");
    return { value, unit };
  }

  const evaluated = expression.factors.map((factor) =>
    evaluateExpression(factor, inputDefinitions, suppliedValues)
  );
  const value = evaluated.reduce((total, item) => total * item.value, 1);
  assertFiniteNumber(value, "Pricing multiplication result");
  return { value, unit: expression.resultUnit };
}

/**
 * Evaluates an explicitly configured expression tree.
 *
 * This is a non-authoritative calculation primitive. It does not establish
 * approval, publication, currency, rounding, taxes, customer-price validity,
 * quotation issuance, service eligibility or booking authority.
 */
export function evaluateCommercialPricing(
  input: CommercialPricingEvaluationInput
): CommercialPricingEvaluationResult {
  assertPlainMap(input, "A commercial pricing evaluation request");
  assertNonEmptyString(input.definitionId, "Pricing definition ID", 128);
  assertNonEmptyString(input.versionId, "Pricing version ID", 128);
  if (!Number.isSafeInteger(input.versionNumber) || input.versionNumber < 1) {
    throw new TypeError("Pricing version number must be a positive safe integer");
  }
  assertCommercialPricingConfiguration(input.configuration);
  assertPlainMap(input.values, "Pricing input values");

  const definitions = new Map(
    input.configuration.inputs.map((definition) => [definition.key, definition])
  );
  for (const definition of input.configuration.inputs) {
    const supplied = Object.prototype.hasOwnProperty.call(input.values, definition.key);
    if (!supplied && definition.required) {
      throw new TypeError("Required pricing input is missing: " + definition.key);
    }
    if (supplied) {
      assertFiniteNumber(input.values[definition.key], "Pricing input " + definition.key);
    }
  }
  for (const key of Object.keys(input.values)) {
    if (!definitions.has(key)) {
      throw new TypeError("An unsupported pricing input was supplied: " + key);
    }
  }

  const components = input.configuration.components.map((component) => {
    const evaluated = evaluateExpression(
      component.expression,
      definitions,
      input.values
    );
    return {
      key: component.key,
      label: component.label,
      value: evaluated.value,
      unit: evaluated.unit,
    };
  });

  const unit = components[0].unit;
  if (components.some((component) => component.unit !== unit)) {
    throw new TypeError("Pricing components with different units cannot be totalled");
  }
  const total = components.reduce((sum, component) => sum + component.value, 0);
  assertFiniteNumber(total, "Pricing total");

  return {
    authority: "non_authoritative",
    definitionId: input.definitionId,
    versionId: input.versionId,
    versionNumber: input.versionNumber,
    serviceCode: input.configuration.serviceCode,
    components,
    total,
    unit,
  };
}
