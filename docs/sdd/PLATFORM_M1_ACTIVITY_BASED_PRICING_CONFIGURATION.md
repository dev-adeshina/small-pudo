# M1 — Activity-based pricing configuration foundation

**Scope:** M1 Execution 2, bounded configuration foundation  
**Implementation branch:** `feat/m1-activity-based-pricing-foundation`  
**Base:** `main` at `78ef794b7395e8e115b5df80d6b1881d663c2a79`  
**Authority:** Existing DEC-019, DEC-026, DEC-039, DEC-047, DEC-048, DEC-049 and DEC-050; owner authorization in this implementation thread.

## Purpose

Represent the relationship between the existing operational activity catalogue (ACT-01–ACT-11) and each commercial service configuration (Standard, Express and Scheduled). This is a configuration foundation only. It does not establish service eligibility, select a pricing model, calculate or approve a customer price, publish a price, issue a quotation or confirm a booking.

## Configuration contract

Each service configuration may contain an `activityPricing` object:

- `schemaVersion: 1`
- `activities`: exactly one assignment for each active catalogue activity ACT-01–ACT-11.
- Each assignment records `activityCode`, `applicability` and `treatment`.
- The activity label is checked against the existing catalogue when supplied.

Applicability values:

- `applicable`
- `not_applicable`
- `undetermined`

Commercial treatment values:

- `included_in_service_charge`
- `separately_itemized`
- `no_separate_customer_charge`
- `not_applicable`
- `undetermined`

A `not_applicable` activity must use `not_applicable` treatment. An `undetermined` activity must use `undetermined` treatment. An applicable activity may be included in a service charge, separately itemized, have no separate customer charge, or remain commercially undetermined.

The treatment is descriptive configuration, not a price. In particular, `no_separate_customer_charge` does not mean the service is free, that an amount is zero, or that an internal cost is zero.

## Incomplete draft support

An activity-only draft may contain the complete activity mapping with empty `inputs` and `components`, and no selected pricing model. This permits activity applicability to be configured without fabricating a rate, formula, monetary component or pricing model.

Such a draft is not evaluable by the pricing engine because no pricing model has been selected. Existing typed configurations without `activityPricing` remain valid for backward compatibility.

## Persistence and authorization

The existing commercial pricing definitions API, Firestore store and immutable version history are reused. Writes continue to require `commercial_pricing.propose`; reads continue to require `commercial_pricing.view`. Configuration validation runs at the API boundary before create or revision persistence.

The staff workspace is available at `/admin/commercial-pricing-definitions` and is linked from the operational-cost workspace. The server remains authoritative for permission checks.

## Explicit exclusions

This foundation does not:

- transfer operational cost amounts or cost-component classifications into customer pricing;
- allocate shared or included operational costs;
- introduce rates, formulas, coefficients, distance bands, minimums or surcharges;
- select Standard, Express or Scheduled pricing models;
- approve currency, precision, rounding, taxes, fees, discounts or monetary treatment;
- approve pricing or publish a customer-usable price;
- activate any of the twelve DEC-047 service/endpoint combinations;
- issue, accept, reject or expire quotations;
- create bookings or alter custody/fulfilment workflows.

The existing commercial evidence, service-specific approval and DEC-047 gates remain in force. A configuration saved here is an immutable draft version only.

## Service mapping evidence

No service-to-activity applicability is presumed by this implementation. New service configurations begin with all eleven activities marked `undetermined`. The service owner/Operations evidence must determine each activity's applicability and treatment independently for Standard, Express and Scheduled. An unknown must remain explicitly undetermined rather than being converted to not applicable or zero.

## Completion evidence

This document describes the intended bounded implementation. Execution 2 is not complete until code review, automated verification, required browser verification, documentation reconciliation and explicit merge approval are complete.
