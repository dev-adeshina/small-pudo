# M1 — Parcel-based pricing input contract

**Scope:** M1 Execution 3, first bounded implementation slice  
**Implementation branch:** `feat/m1-parcel-based-pricing`  
**Base:** `main` after PR #154 merge, `b1c8b415614136be39a50ea2a3a5fb83b2e6cb00`  
**Authority:** Existing DEC-019, DEC-026, DEC-039, DEC-040, DEC-047, DEC-048 and DEC-050; bounded implementation authorization in the project thread.

## Purpose

Establish a reusable, server-side contract for parcel measurement evidence. The contract preserves customer-declared measurements separately from later actual measurements, records provenance for each evidence set, and allows extensible handling characteristics without assigning them commercial effects.

This is an input/evidence foundation only. It does not calculate parcel-based prices, classify parcel bands, decide service eligibility, adjust quotations, or authorize booking.

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

Handling characteristics use unique stable codes and string or boolean values. The contract does not define a closed catalogue or infer a price effect from a characteristic. Fragility, size labels, vehicle suitability and other handling classifications require separately approved definitions and service applicability before they can affect pricing.

## Validation and exclusions

The validator rejects malformed records, unknown fields, duplicate characteristic codes, invalid provenance, non-finite or non-positive measurements, and unsupported measurement names.

This slice does not establish:

- approved weight or dimension units, conversion rules or normalization;
- dimensional/volumetric weight formula, divisor or rounding;
- parcel size/weight bands or thresholds;
- fragile, durable, bulky, small/large or other classification rules;
- service-specific applicability for Standard, Express or Scheduled;
- a customer charge, rate, coefficient, surcharge, minimum or fee;
- pricing approval/publication, quotation issuance, measurement-discrepancy review or customer consent;
- service/endpoint activation under DEC-047.

The existing commercial pricing engine remains non-authoritative. This parcel contract is not yet connected to customer pricing or shipment booking. Any discrepancy between declared and actual measurements remains evidence for the separately governed DEC-040 review and consent process; this contract does not itself adjust a quote.

## Completion evidence

The contract and focused tests are the first implementation slice of Execution 3. Execution 3 remains incomplete until the parcel classification and pricing-integration requirements are separately resolved and implemented, all automated checks pass, documentation is reconciled, and the change is reviewed and explicitly approved for merge.
