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
  unit: string;
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


export type CommercialPricingActivityCode =
  | "ACT-01" | "ACT-02" | "ACT-03" | "ACT-04" | "ACT-05" | "ACT-06"
  | "ACT-07" | "ACT-08" | "ACT-09" | "ACT-10" | "ACT-11";

export type CommercialPricingActivityApplicability =
  | "applicable" | "not_applicable" | "undetermined";

export type CommercialPricingActivityTreatment =
  | "included_in_service_charge"
  | "separately_itemized"
  | "no_separate_customer_charge"
  | "not_applicable"
  | "undetermined";

export interface CommercialPricingActivityAssignment {
  activityCode: CommercialPricingActivityCode;
  applicability: CommercialPricingActivityApplicability;
  treatment: CommercialPricingActivityTreatment;
  activityName?: string;
}

export interface CommercialPricingActivityConfiguration {
  schemaVersion: 1;
  activities: CommercialPricingActivityAssignment[];
}

export const COMMERCIAL_PRICING_ACTIVITY_CATALOGUE: ReadonlyArray<{
  activityCode: CommercialPricingActivityCode;
  activityName: string;
}> = [
  { activityCode: "ACT-01", activityName: "Origin PUDO presentation and receipt" },
  { activityCode: "ACT-02", activityName: "Parcel verification and measurement at origin PUDO" },
  { activityCode: "ACT-03", activityName: "Origin PUDO custody acceptance" },
  { activityCode: "ACT-04", activityName: "Transport / movement between operational points" },
  { activityCode: "ACT-05", activityName: "Destination PUDO receipt / custody acceptance" },
  { activityCode: "ACT-06", activityName: "Delivery to an address / recipient handover" },
  { activityCode: "ACT-07", activityName: "Collection / release to an authorized collector" },
  { activityCode: "ACT-08", activityName: "Failed collection or delivery attempt" },
  { activityCode: "ACT-09", activityName: "Return-to-Sender (RTS) journey" },
  { activityCode: "ACT-10", activityName: "Exception review and resolution" },
  { activityCode: "ACT-11", activityName: "Origin PUDO substitution handling" },
];

export interface CommercialPricingConfiguration {
  schemaVersion: 1;
  configurationName: string;
  serviceCode: CommercialPricingServiceCode;
  pricingModel?: CommercialPricingModel;
  activityPricing?: CommercialPricingActivityConfiguration;
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

function collectExpressionInputKeys(
  expression: CommercialPricingExpression,
  keys: Set<string>
): void {
  if (expression.kind === "input") {
    keys.add(expression.key);
  } else if (expression.kind === "sum") {
    for (const term of expression.terms) collectExpressionInputKeys(term, keys);
  } else if (expression.kind === "multiply") {
    for (const factor of expression.factors) collectExpressionInputKeys(factor, keys);
  }
}

function unitSignature(unit: string): string {
  const tokens = unit.match(/[*/]|[A-Za-z][A-Za-z0-9_-]*(?:\^-?[0-9]+)?/g);
  if (!tokens || tokens.join("") !== unit) {
    throw new TypeError("Pricing unit must use the supported unit-expression syntax");
  }
  const dimensions = new Map<string, number>();
  let operator: "*" | "/" = "*";
  let expectUnit = true;
  for (const token of tokens) {
    if (token === "*" || token === "/") {
      if (expectUnit) throw new TypeError("Pricing unit expression is malformed");
      operator = token;
      expectUnit = true;
      continue;
    }
    if (!expectUnit) throw new TypeError("Pricing unit expression is malformed");
    const match = /^([A-Za-z][A-Za-z0-9_-]*)(?:\^(-?[0-9]+))?$/.exec(token);
    if (!match) throw new TypeError("Pricing unit expression is malformed");
    const exponent = Number(match[2] ?? 1) * (operator === "/" ? -1 : 1);
    const next = (dimensions.get(match[1]) ?? 0) + exponent;
    if (next === 0) dimensions.delete(match[1]);
    else dimensions.set(match[1], next);
    expectUnit = false;
  }
  if (expectUnit) throw new TypeError("Pricing unit expression is malformed");
  return [...dimensions.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([name, exponent]) => name + "^" + exponent).join("*");
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
    unitSignature(value.resultUnit);
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
    "activityPricing",
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


  if (value.activityPricing !== undefined) {
    assertPlainMap(value.activityPricing, "Commercial activity pricing configuration");
    if (Object.keys(value.activityPricing).some((key) =>
      key !== "schemaVersion" && key !== "activities"
    )) {
      throw new TypeError("Commercial activity pricing configuration contains an unsupported field");
    }
    if (value.activityPricing.schemaVersion !== 1 ||
        !Array.isArray(value.activityPricing.activities) ||
        value.activityPricing.activities.length !== COMMERCIAL_PRICING_ACTIVITY_CATALOGUE.length) {
      throw new TypeError("Activity pricing must explicitly classify all 11 catalogue activities");
    }
    const seenActivities = new Set<string>();
    for (const assignment of value.activityPricing.activities) {
      assertPlainMap(assignment, "A commercial activity assignment");
      if (Object.keys(assignment).some((key) =>
        key !== "activityCode" && key !== "activityName" && key !== "applicability" && key !== "treatment"
      )) {
        throw new TypeError("Commercial activity assignment contains an unsupported field");
      }
      const catalogueActivity = COMMERCIAL_PRICING_ACTIVITY_CATALOGUE.find((item) =>
        item.activityCode === assignment.activityCode
      );
      if (!catalogueActivity) {
        throw new TypeError("Commercial activity assignment references an unknown activity");
      }
      if (assignment.activityName !== undefined &&
          assignment.activityName !== catalogueActivity.activityName) {
        throw new TypeError("Commercial activity assignment name does not match the activity catalogue");
      }
      if (seenActivities.has(assignment.activityCode as string)) {
        throw new TypeError("Commercial activity assignments must be unique");
      }
      seenActivities.add(assignment.activityCode as string);
      const applicability = assignment.applicability;
      const treatment = assignment.treatment;
      if (!["applicable", "not_applicable", "undetermined"].includes(String(applicability))) {
        throw new TypeError("Commercial activity applicability is unsupported");
      }
      if (![
        "included_in_service_charge",
        "separately_itemized",
        "no_separate_customer_charge",
        "not_applicable",
        "undetermined",
      ].includes(String(treatment))) {
        throw new TypeError("Commercial activity treatment is unsupported");
      }
      if (
        applicability === "not_applicable" && treatment !== "not_applicable" ||
        applicability === "undetermined" && treatment !== "undetermined" ||
        applicability === "applicable" && treatment === "not_applicable"
      ) {
        throw new TypeError("Commercial activity applicability and treatment are inconsistent");
      }
    }
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
    assertNonEmptyString(input.unit, "Commercial pricing input unit", 80);
  }

  if (
    !Array.isArray(value.components) ||
    value.components.length > MAX_COMPONENTS ||
    (value.components.length < 1 && (value.activityPricing === undefined || value.pricingModel !== undefined))
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

  const inputDefinitions = new Map<string, CommercialPricingInputDefinition>(
    value.inputs.map((input) => [input.key as string, input as unknown as CommercialPricingInputDefinition])
  );
  const componentInputDependencies = value.components.map((component) => {
    const dependencies = new Set<string>();
    collectExpressionInputKeys(component.expression as CommercialPricingExpression, dependencies);
    for (const key of dependencies) {
      if (!inputDefinitions.get(key)?.required) {
        throw new TypeError(
          "An optional pricing input cannot be referenced by an unconditional component: " + key
        );
      }
    }
    return dependencies.size > 0;
  });

  const hasInputDependentComponent = componentInputDependencies.some(Boolean);
  const hasFixedComponent = componentInputDependencies.some((dependent) => !dependent);
  const model = value.pricingModel as CommercialPricingModel | undefined;
  if (
    model === "fixed" && hasInputDependentComponent ||
    model === "calculated" && hasFixedComponent ||
    model === "hybrid" && (!hasInputDependentComponent || !hasFixedComponent)
  ) {
    throw new TypeError("Pricing model does not match the configured component structure");
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
    return { value: supplied, unit: definition.unit };
  }

  if (expression.kind === "constant") {
    return { value: expression.value, unit: expression.unit };
  }

  if (expression.kind === "sum") {
    const evaluated = expression.terms.map((term) =>
      evaluateExpression(term, inputDefinitions, suppliedValues)
    );
    const unit = evaluated[0].unit;
    const signature = unitSignature(unit);
    if (evaluated.some((item) => unitSignature(item.unit) !== signature)) {
      throw new TypeError("A sum expression cannot combine dimensionally different units");
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
  const resultSignature = unitSignature(expression.resultUnit);
  const factorDimensions = new Map<string, number>();
  for (const item of evaluated) {
    const signature = unitSignature(item.unit);
    if (signature) {
      for (const dimension of signature.split("*")) {
        const [name, exponentText] = dimension.split("^");
        factorDimensions.set(name, (factorDimensions.get(name) ?? 0) + Number(exponentText));
      }
    }
  }
  const factorSignature = [...factorDimensions.entries()]
    .filter(([, exponent]) => exponent !== 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, exponent]) => name + "^" + exponent).join("*");
  if (factorSignature !== resultSignature) {
    throw new TypeError("Multiplication factor units do not produce the declared result unit");
  }
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
  if (input.configuration.pricingModel === undefined) {
    throw new TypeError("A pricing model must be selected before evaluating this configuration");
  }
  assertPlainMap(input.values, "Pricing input values");

  const definitions = new Map<string, CommercialPricingInputDefinition>(
    input.configuration.inputs.map((definition) => [definition.key, definition] as const)
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
  const totalUnitSignature = unitSignature(unit);
  if (components.some((component) => unitSignature(component.unit) !== totalUnitSignature)) {
    throw new TypeError("Pricing components with dimensionally different units cannot be totalled");
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
