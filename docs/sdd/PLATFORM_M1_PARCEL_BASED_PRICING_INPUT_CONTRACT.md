# M1 — Parcel-based pricing input contract

**Scope:** M1 Execution 3, parcel input and classification evidence slices  
**Implementation branch:** `feat/m1-parcel-based-pricing`  
**Base:** `main` after PR #154 merge, `b1c8b415614136be39a50ea2a3a5fb83b2e6cb00`  
**Authority:** Existing DEC-019, DEC-026, DEC-039, DEC-040, DEC-047, DEC-048 and DEC-050; bounded implementation authorization in the project thread.

## Purpose

Establish reusable, server-side contracts for parcel measurement and classification evidence. Measurement records preserve customer declarations separately from later actual measurements. Classification records preserve explicit present, absent or not-assessed outcomes with provenance for assessed outcomes. Neither contract assigns commercial effects.

These are input/evidence foundations only. They do not calculate parcel-based prices, infer classifications from measurements, decide service eligibility, adjust quotations, or authorize booking.

## Measurement contract

The version 1 parcel input contains:

- Optional `declared` measurement evidence.
- Optional `actual` measurement evidence.
- A handling-characteristics list.

At least one of declared or actual evidence is required. Each evidence record contains one or more of weight, length, width or height, and its own provenance:

- `recordedAt`: timezone-qualified ISO 8601 timestamp.
- `recordedBy`: non-empty actor reference.
- `source`: non-empty source description.
- `operationalPointRef`: optional reference when an authoritative operational-point identity is available.

Each supplied measurement is a finite positive numeric value with an explicit non-empty unit string. Partial measurements are permitted. Missing dimensions remain absent; they are not defaulted to zero. Declared and actual evidence are separate immutable-in-intent records and may differ.

The contract deliberately does not prescribe a unit catalogue or perform unit conversion. The unit string is preserved as supplied and is not evidence that two values are comparable.

## Handling characteristics

The separate classification contract defines these initial codes:\n\n| Code | Group | Meaning at this stage |\n|---|---|---|\n| `fragile` | handling | Fragility characteristic |\n| `durable` | handling | Durability characteristic; not the automatic inverse of fragile |\n| `bulky` | handling | Bulky handling characteristic |\n| `small` | size | Reserved size classification; no threshold is defined |\n| `large` | size | Reserved size classification; no threshold is defined |\n\nA parcel may have multiple independent classifications. Each classification has `present`, `absent` or `not_assessed` status. An omitted classification is also unknown, never absent. `present` and `absent` require timestamp, actor and source provenance; `not_assessed` carries no assessment evidence. The catalogue is extensible through additional stable codes in the `other` group. The generic handling-characteristics field remains compatible and is not silently rewritten into the separate classification contract.


## Bounded pricing-input integration

The parcel-to-pricing adapter maps only measurement fields explicitly named by a numeric pricing input definition's `source`:

| Source | Evidence selected |
|---|---|
| `parcel.declared.weight` | Declared weight |
| `parcel.declared.length` | Declared length |
| `parcel.declared.width` | Declared width |
| `parcel.declared.height` | Declared height |
| `parcel.actual.weight` | Actual weight |
| `parcel.actual.length` | Actual length |
| `parcel.actual.width` | Actual width |
| `parcel.actual.height` | Actual height |

The adapter validates both contracts before mapping. It does not select declared or actual evidence on behalf of a service; the configuration must name the exact source. A configured source whose evidence is absent produces no value. The existing evaluator then rejects the request if that input is required. Optional missing inputs remain omitted.

The measurement unit must exactly match the input definition's unit string. A mismatch is rejected; no conversion, normalization or rounding is performed. Sources outside the parcel namespace remain available to other input providers. Unknown sources inside the `parcel.` namespace are rejected rather than silently ignored.

Classification evidence and generic handling characteristics are not mapped to numeric pricing inputs. No classification-to-charge mapping, size inference, price formula, threshold, coefficient or service-specific rule is introduced. Callers combine adapter-produced values with independently supplied non-parcel values before invoking the existing evaluator. The evaluator's `non_authoritative` result status is unchanged.

## Validation and exclusions

The validator rejects malformed records, unknown fields, duplicate characteristic codes, invalid provenance, non-finite or non-positive measurements, and unsupported measurement names.

This slice does not establish:

- approved weight or dimension units, conversion rules or normalization;
- dimensional/volumetric weight formula, divisor or rounding;
- parcel size/weight bands or thresholds;
- automatic classification from weight or dimensions;\n- approved weight or dimension bands, thresholds or measurement-based small/large/bulky rules;\n- service-specific classification applicability for Standard, Express or Scheduled;
- service-specific applicability for Standard, Express or Scheduled;
- a customer charge, rate, coefficient, surcharge, minimum or fee;
- pricing approval/publication, quotation issuance, measurement-discrepancy review or customer consent;
- service/endpoint activation under DEC-047.

The existing commercial pricing engine remains non-authoritative. These parcel contracts are not yet connected to customer pricing or shipment booking. Classification labels do not create surcharges, alter service eligibility, or prescribe handling instructions. Any discrepancy between declared and actual measurements remains evidence for the separately governed DEC-040 review and consent process; this contract does not itself adjust a quote.

## Completion evidence

The measurement evidence contract and classification evidence contract are implemented as separate bounded slices of Execution 3. The remaining parcel-pricing integration is still incomplete. All automated checks, documentation reconciliation, review and explicit merge approval remain required before this branch is considered complete.
