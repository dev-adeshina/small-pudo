# VeriLyft M2 Pricing and Quotation Readiness Specification

**Status:** Consolidated readiness specification incorporating owner-approved commercial direction DEC-048; actual service pricing configurations remain unapproved  
**Prepared:** 2 November 2026  
**Baseline:** PR #108 merge, 047a234cc641493d8a44a88e41ab722e6818ab5c  
**Authority:** DEC-019, DEC-026–DEC-029, DEC-038–DEC-041, DEC-045–DEC-048; BP-01–BP-22; PM-01–PM-12  
**Related:** PLATFORM_CONSOLIDATED_IMPLEMENTATION_BACKLOG.md; PLATFORM_OWNER_DECISION_REGISTER.md; PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md; PLATFORM_SHARED_WORKFLOWS.md; PLATFORM_DOMAIN_BOUNDARY_AND_IDENTITY_DECISION_MATRIX.md; PLATFORM_API_PERSISTENCE_AND_INTEGRATION_BOUNDARY_CONTRACT.md; PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md; PLATFORM_SHIPPER_JOURNEY_AND_PORTAL_EXPERIENCE.md; IMPLEMENTATION_SOURCE_TRACEABILITY.md

## 1. Purpose and decision boundary

This document consolidates the service-specific commercial configuration and quotation prerequisites for the approved launch services: Standard, Express and Scheduled. It separates:

- policy already accepted by the owner;
- service-specific commercial values and operational inputs that still require approval;
- technical relationship and source-reconciliation work;
- conditions that keep quotation and booking unavailable.

This is a readiness specification. It does not approve actual service pricing models, rates, formulas, units, conversions, fee treatment, currency, rounding, quote durations, handover deadlines, provider choices, data structures, APIs, permissions or application-code changes.

No value may be inserted as a placeholder merely to make the quote journey appear complete. A service remains unavailable for quotation until its pricing configuration and DEC-047 eligibility/operational prerequisites are approved and verified.

## 2. Accepted policy that this specification preserves

1. **One shared pricing authority — DEC-019.** Storefront delivery pricing and independent shipment pricing must use one shared approved pricing-rule authority wherever their inputs overlap. They must not become unrelated formulas.
2. **Service-specific model — DEC-026 / DEC-039.** Each service uses its own explicitly approved fixed, calculated or hybrid model and only its configured inputs. There is no universal formula or mandatory universal input set.
3. **Trusted calculation.** Customer/browser values are declared inputs only. The trusted server validates inputs and calculates the authoritative amount. Staff-assisted pricing uses the same rule authority and cannot invent a price, formula or charge.
4. **Transparent charges.** The quote shows applicable charge components and the total. Taxes, surcharges, discounts and other fees must have explicit service-specific treatment; none is silently assumed to be zero or silently added.
5. **Historical preservation.** Issued and accepted quote inputs, itemized charges, total, currency, pricing-rule/rate version and effective context remain reconstructable. Later rate changes do not rewrite existing quotes, accepted agreements or completed payments.
6. **Exact acceptance.** Under DEC-038, the authenticated booking party's explicit acceptance of a valid issued quote confirms the independent booking and accepted commercial terms. Issuance, viewing, rejection or abandonment does not.
7. **Separate deadlines.** Quote validity and the service-specific physical handover deadline are separate. Both are communicated before acceptance. Expiry of an unaccepted quote requires a fresh quote; expiry does not silently cancel or rewrite an already accepted booking.
8. **Adjustments are separate.** Declared inputs, actual intake measurements, proposed adjustments, review, customer consent and financial settlement remain distinct under DEC-040. An accepted adjustment is not itself proof of additional payment.
9. **Payment is separate.** Quote acceptance/booking confirmation, payment attempt, verified settlement, intake and custody are distinct under DEC-041.
10. **Actual journey drives pricing.** The system determines the route from the selected service, origin/destination and approved operational rules. Shippers do not select In-PUDO, Out-PUDO or Trans-PUDO legs. Direct In-PUDO-to-In-PUDO remains valid; no Out-PUDO leg is presumed.
11. **Eligibility is a hard gate — DEC-047.** A quote cannot make a pending or unavailable service/endpoint combination bookable. The server must revalidate eligibility and operational evidence at consequential submission.
12. **Service commitments — DEC-046.** Standard and Express show journey-specific estimates, with Express shorter than Standard for the same comparable eligible journey; these are estimates, not guarantees. Scheduled presents available dates/time windows, revalidates the selected option before confirmation and preserves the confirmed commitment.

## 3. Launch service pricing readiness matrix

The model and configuration for each service must be approved independently. DEC-039 permits fixed, calculated or hybrid per service; it does not select which model applies to Standard, Express or Scheduled.

| Service | Accepted customer-facing meaning | Pricing model | Service-specific inputs | Pricing configuration status |
|---|---|---|---|---|
| Standard | Regular delivery within the normal service timeframe; show a journey-specific estimate | Pending owner approval: fixed / calculated / hybrid | Pending service specification; use only approved inputs | Not ready for quote |
| Express | Priority handling; shorter estimate than Standard for the same comparable eligible journey | Pending owner approval: fixed / calculated / hybrid | Pending service specification; any priority-related charge must be explicit and approved, not presumed | Not ready for quote |
| Scheduled | Delivery on a date or within an available time window selected by the Shipper | Pending owner approval: fixed / calculated / hybrid | Pending service specification; selected date/window is an input only if explicitly approved for pricing | Not ready for quote |

No service receives a default model by analogy with another service. The same service may use different configured inputs only where the approved service configuration explicitly permits the variation. Any service without a complete approved configuration remains unavailable for quote issuance.

## 4. DEC-047 eligibility and quote-issuance gate

The three services are evaluated independently across the four endpoint patterns. All twelve combinations remain pending verification and unavailable by default.

| Service | Address → Address | Address → PUDO | PUDO → Address | PUDO → PUDO |
|---|---|---|---|---|
| Standard | Pending verification — unavailable | Pending verification — unavailable | Pending verification — unavailable | Pending verification — unavailable |
| Express | Pending verification — unavailable | Pending verification — unavailable | Pending verification — unavailable | Pending verification — unavailable |
| Scheduled | Pending verification — unavailable | Pending verification — unavailable | Pending verification — unavailable | Pending verification — unavailable |

A quote may be prepared only after the applicable combination has an explicit eligible outcome, or a conditional outcome whose conditions are satisfied, supported by current attributable evidence for:

- service-specific journey and endpoint-action eligibility;
- origin and destination coverage;
- active PUDO centres and the specific required actions at each selected endpoint;
- an operationally valid system-determined route;
- operating availability and capacity for the requested date/time;
- the required Operations approval.

Missing, stale, revoked, conflicting or insufficient evidence fails closed. Revalidation is required before quote issuance and again at consequential booking confirmation. A pending verification result is not a final not-eligible decision, but it is not permission to quote.

For Scheduled, the selected available date/time option must also be revalidated before confirmation. For Standard and Express, estimates must use approved journey and operating-availability/capacity inputs. Numerical estimate methodology and durations remain unresolved.

## 5. Pricing input catalogue and authority

The following are candidate input categories already contemplated by DEC-026/039. They are not a universal required list. Each service specification must explicitly mark each input as required, optional, not used, or conditional, and identify its trusted source.

| Candidate input | Possible purpose | Required approval / source detail |
|---|---|---|
| Origin and destination | Define the requested journey | Endpoint representation, validation and coverage source; physical address or eligible registered PUDO centre |
| System-determined route | Determine the actual operational journey used by pricing where relevant | Approved routing authority and route facts; Shipper-selected route legs are not accepted |
| Distance or approved distance band | Calculated/hybrid price component where explicitly used | Authoritative distance source, measurement basis, band boundaries, route treatment and fallback/unknown handling |
| Weight | Service-specific price or eligibility input | Unit, accepted source, declared-versus-actual handling, precision and conversion rule |
| Dimensions | Service-specific price or eligibility input | Dimension unit, capture source, required axes/format, precision and conversion rule |
| Volumetric weight | Only where explicitly used by the service | Formula, dimensional divisor, unit compatibility, rounding stage and comparison rule against actual weight |
| Service class / delivery speed | Differentiate approved service configurations | Approved mapping to Standard, Express or Scheduled; do not infer a premium or surcharge |
| Minimum charge | Enforce an approved minimum where configured | Service-specific amount, currency, application order and effective version |
| Special handling | Price a documented, eligible handling requirement | Supported handling categories, eligibility, evidence, approval, charge treatment and effective rate |
| Scheduled date/time window | Service availability and commitment; pricing input only if explicitly configured | Approved pricing relevance, availability source, cutoffs, reservation and change/cancellation rules |

For every input, the service specification must identify:

- whether it is required, optional, conditional or unused;
- who or what supplies it and which source is authoritative;
- whether it is customer-declared, system-derived, staff-recorded or physically measured;
- accepted unit and precision;
- explicit permitted conversion, if any;
- validation, missing-value and out-of-range behaviour;
- whether the value is used for eligibility, estimation, pricing, or more than one of these;
- how later actual measurements are kept separate from the original declared quote input.

No silent unit conversion is permitted. A value supplied by the browser is never authoritative merely because the UI displayed it. The server must validate the value against the approved source and service configuration.

## 6. Declared measurements, actual measurements and adjustments

- A quote records the declared measurement inputs used at quote time, with their source and unit context.
- Physical intake may later establish actual measurements through an approved measurement process. Actual values must not overwrite the declared values or retroactively rewrite the issued/accepted quote.
- Any difference is assessed under the service's approved discrepancy criteria. Thresholds, evidence, units, review authority and measurement procedures remain unresolved.
- Where a price change is proposed, preserve the original quote/agreement and create a linked proposed adjustment with the changed facts, reason and revised amount.
- Required review and explicit customer consent precede a binding price-changing adjustment. Silence is not consent.
- Customer acceptance of an adjustment records revised commercial terms; it does not prove additional payment or settlement.
- Rejection, dispute, safe continuation, alternative service, cancellation, refund or credit outcomes follow DEC-040 and the applicable approved service-resolution policy. No automatic charge, refund or cancellation is inferred.

## 7. Charge components, currency and arithmetic

Each service must explicitly configure the charge components that apply. Candidate components may include a base charge, distance component, weight/dimension component, service-class component, minimum charge and documented special handling, but none is mandatory without approval.

For each component, specify its applicability conditions, calculation basis, source values, amount, currency, order of calculation, display label and whether it is included in or added to the total.

The following are all unresolved per service and must be explicitly approved:

- currency and whether any multi-currency journey is supported;
- precision and representable monetary unit;
- rounding mode and the stage at which rounding occurs;
- whether intermediate calculations retain additional precision;
- tax applicability, calculation basis, rate source, effective dates and display;
- surcharge applicability, calculation basis and approval;
- discount eligibility, authority, stacking and presentation;
- other fee applicability and presentation;
- minimum charge amount and application order;
- special-handling rate and approval;
- treatment of a missing, unknown or unavailable input.

Do not assume NGN for shipment quotes solely because the current storefront payment route supports NGN. Do not assume tax, fees, discounts or surcharges are zero. Do not use a browser total as the amount to be accepted or paid.

## 8. Rate governance, versioning and effective context

Before a service can issue a quote, its pricing configuration must have a documented governance path covering:

1. accountable pricing-rule owner;
2. who may propose a new rate or formula;
3. who independently reviews and approves it;
4. separation of proposal and approval where required by PM-01–PM-12;
5. the service, journey scope, input set and charge components covered;
6. effective-from and, where applicable, effective-until context;
7. version identification and activation/publication authority;
8. how an urgent correction, withdrawal or rollback is authorized;
9. how affected future quotes are recalculated and how issued/accepted quotes are preserved;
10. evidence and audit history for proposal, approval, activation and supersession.

The concrete rate table/configuration format, identifiers, fields, storage location and technical publication mechanism are not approved by this document. A rate change applies according to its approved effective context; it never silently mutates a historical quote or accepted booking.

## 9. Quote issuance, preservation, revision and acceptance

A quote must be reconstructable from the approved commercial context that produced it. Conceptually, preserve:

- selected service and applicable eligibility/operational decision context;
- origin and destination facts and the actual system-determined route context used;
- every declared/system-derived/approved measurement input used in the calculation, with source and unit;
- pricing model and rule/rate version;
- each applicable charge component and its calculation context;
- total and currency;
- precision/rounding outcome;
- applicable tax, surcharge, discount and fee treatment;
- quote issue time, validity end and relevant effective context;
- the separate service-specific physical handover deadline;
- the authenticated booking party's exact acceptance or rejection and the quote version acted upon.

This is a conceptual preservation requirement, not an approved list of persisted fields or a schema.

Lifecycle boundaries:

- Draft quote preparation is not an issued quote.
- Issued means presented to the Shipper with its validity and handover deadline.
- Acceptance or rejection is explicit and attributable to the authenticated booking party.
- Acceptance must bind to the exact valid quote version shown; stale, expired or superseded versions cannot be accepted.
- An unaccepted expired quote requires a fresh quote.
- Recalculation/repricing creates a new quote or revision and preserves prior history.
- Expiry or later rate changes do not silently rewrite an accepted quote or cancel its confirmed booking.
- Quote rejection or abandonment creates no payment obligation from that quote.
- Quote acceptance confirms the booking under DEC-038; it does not establish payment, physical handover, intake or custody.

The exact quote-to-booking and quote-to-parcel scope remains blocked by DB-01, DB-02 and DB-05. No persistence cardinality is selected here.

## 10. Quote validity, handover deadline and service commitments

For each service, separately approve:

- quote-validity duration and the point from which it runs;
- how expiry is communicated and enforced;
- whether any extension is possible and who may authorize it;
- service-specific handover period/deadline, its trigger and how it is communicated;
- the outcome when an accepted booking is not handed over within the period;
- the outcome when intake is refused or the Shipper misses the deadline;
- customer notice, cancellation and any financial consequence, where approved.

Do not use the Standard/Express estimated delivery timeframe or a Scheduled delivery window as the quote-validity duration or handover deadline. The three concepts are distinct.

Standard/Express estimate methodology and numerical timeframes, guarantee policy, Scheduled availability windows, cutoffs, reservation/expiry and amendment/cancellation rules remain separate operational inputs. No numerical duration is approved here.

## 11. Shared pricing authority and storefront boundary

DEC-019 requires one shared pricing-rule authority for storefront delivery pricing and independent shipment pricing wherever the applicable inputs overlap.

The current source does not yet demonstrate that capability:

- The inspected storefront order route validates current product records and calculates product line-item subtotals server-side inside the Firestore order/stock transaction.
- That route currently sets deliveryFee to zero and currency to NGN.
- The checkout page also previews delivery fee as zero; its browser subtotal/total is display-only.
- Product catalogue price is the price of the goods. It is not the delivery pricing rule and must not be confused with the shared delivery/shipment pricing authority.
- The current Paystack initialization and verification paths are tied to existing storefront orders, order access tokens and NGN. They are not a general shipment quote or multi-purpose payment contract.
- The shipment-booking-draft workspace stores preparation drafts only. It does not issue quotes or confirm bookings.

The future shared authority must be designed so both storefront delivery and independent shipment booking consume the same approved rule source when their pricing inputs overlap. This does not require product prices and delivery prices to become the same commercial concept, and it does not authorize changing the existing storefront checkout before the shared rule and migration behaviour are specified.

## 12. Technical relationship and source dependencies

The following domain relationships remain unresolved and block final persistence/API design:

| Decision | Pricing/quotation consequence | Current safe boundary |
|---|---|---|
| DB-01 Booking → shipment creation | Determines when a confirmed booking becomes linked to an operational shipment obligation | Booking acceptance is not physical receipt; do not invent the record-creation gate |
| DB-02 Booking → parcel cardinality | Determines whether a quote covers one or multiple parcels and how measurements/adjustments aggregate | No one-to-one or one-to-many assumption |
| DB-03 Parcel → route-leg cardinality | Affects route context, parcel grouping, re-routing and possible pricing allocation | Route proposal/assignment/movement remain distinct; no parcel-to-leg cardinality assumption |
| DB-04 Storefront order → shipment | Affects how storefront delivery pricing enters shared logistics fulfilment | Preserve commerce and logistics facts separately |
| DB-05 Quote scope | Determines whether a quote is per booking, parcel, service component or composite | Explicit owner choice remains pending |
| DB-06 Payment allocation | Determines whether a later payment can cover one or multiple commercial obligations | Payment purpose and allocation must be explicit; no cross-obligation allocation assumption |
| DB-11 Financial-event linkage | Determines lineage from quote/obligation to payment, charge, refund, credit and reconciliation | Finance-owned financial history remains distinct and reconstructable |

The technical contract must also reconcile authoritative ownership, entitlement, evidence linkage, query/projection lineage, transaction boundaries, concurrency, replay, unknown outcomes and recovery. No Firestore collection, field, index, API route, payload, status enum or new service is approved by this document.

### DB-05 owner recommendation — pending, not accepted

The existing consolidated owner-decision package recommends one commercial quote for the independent booking obligation, with applicable service components itemized inside that quote, while deferring cross-parcel and multi-obligation allocation.

That remains a proposal, not accepted policy. It must be considered together with DB-01 and DB-02. Do not implement this recommendation or infer a quote-to-parcel relationship until the owner confirms the commercial unit and technical reconciliation demonstrates the resulting relationships.

## 13. Per-service readiness checklist

A service is quote-ready only when every applicable item below is approved, attributable and testable.

| Readiness area | Standard | Express | Scheduled |
|---|---|---|---|
| Fixed/calculated/hybrid model selected | Pending | Pending | Pending |
| Required/optional/conditional inputs and authoritative sources | Pending | Pending | Pending |
| Units, precision and explicit conversions | Pending | Pending | Pending |
| Rates/formulas/distance source or bands/minimums | Pending | Pending | Pending |
| Volumetric-weight treatment, if applicable | Pending | Pending | Pending |
| Special-handling rules and charges, if applicable | Pending | Pending | Pending |
| Currency, arithmetic precision and rounding | Pending | Pending | Pending |
| Tax/surcharge/discount/other-fee treatment | Pending | Pending | Pending |
| Rate owner, approval, version and effective-date process | Pending | Pending | Pending |
| Quote itemization and immutable commercial snapshot | Policy accepted; technical contract pending | Policy accepted; technical contract pending | Policy accepted; technical contract pending |
| Quote validity duration | Pending | Pending | Pending |
| Separate handover deadline and missed-handover outcome | Pending | Pending | Pending |
| DEC-047 service/endpoint eligibility and operating evidence | Pending; unavailable | Pending; unavailable | Pending; unavailable |
| Estimate methodology and numerical timeframe | Pending | Pending | Scheduled availability/commitment rules pending |
| Guarantee policy | Pending | Pending | Pending |
| Executable acceptance and failure/replay tests | Pending | Pending | Pending |

## 14. Consolidated owner inputs still required

These are grouped inputs, not twelve separate approval prompts.

### A. Service configuration

For each of Standard, Express and Scheduled, approve the pricing model, input mapping, trusted source, units/conversions, rates/formula, minimum and special-handling treatment. No service model mapping is currently selected.

### B. Commercial arithmetic

Approve currency, precision, rounding, tax/surcharge/discount/fee treatment and effective-date/version rules. No NGN-only shipment quote assumption is made.

### C. Quote and handover terms

Approve quote-validity duration, separate handover deadline, extension authority, missed-handover/refused-intake outcomes and the customer-facing terms. Keep delivery estimates and Scheduled commitments separate.

### D. Quote commercial unit

Resolve DB-05 together with DB-01/DB-02. The current owner-decision package's one-quote-per-booking recommendation is available for consideration but remains unaccepted.

### E. Operational evidence dependencies

Resolve the actual DEC-047 service/endpoint outcomes and provide coverage, PUDO action, route, date/time availability/capacity and Operations approval evidence. Resolve estimate methodology, numerical timeframes, guarantee policy and Scheduled operating windows/cutoffs/reservation/change rules.

### F. Technical contract and acceptance

After the commercial unit and required business rules are settled, reconcile DB-01–DB-12 and the API/persistence boundary contract. Then specify exact authoritative ownership, record relationships, access, snapshots, transaction/replay/recovery behaviour and executable tests. Do not design collections, fields or APIs ahead of those decisions.

## 15. Implementation entry criteria

No quote-engine or service-pricing code should begin until:

1. the service-specific pricing configuration is approved for the target service;
2. the relevant DEC-047 service/endpoint combination is eligible or conditionally eligible with all conditions satisfied and current Operations evidence;
3. trusted input sources, units and explicit conversions are approved;
4. formulas, rates, charge components, currency, precision and rounding are approved;
5. rate ownership, approval, versioning and effective-date behaviour are defined;
6. quote validity and separate handover terms are approved;
7. quote scope/cardinality and authoritative ownership are reconciled with DB-01–DB-12;
8. exact quote acceptance, historical preservation and repricing behaviour are specified;
9. storefront delivery integration with the shared pricing authority is designed without conflating product price and delivery price;
10. executable acceptance, security, concurrency, stale-quote, expiry, revision, failure and replay scenarios are ready.

Until then, the existing draft workspace remains draft-only; no quote or confirmed booking is created. M0 residual evidence and DEC-036 P0/Conditional P0 release requirements remain independent gates.


## 16. Consolidated commercial owner decisions — 2 November 2026

The owner-facing recommendations and grouped choices are maintained in `PLATFORM_M2_COMMERCIAL_PRICING_OWNER_DECISIONS.md`. The owner response is now recorded as DEC-048 in Section 17 below. DEC-048 accepts the minimum-launch commercial unit, minimum-necessary service-specific inputs, separate quote/handover deadlines, separated pricing governance and the shared pricing authority; it defers model selection and actual rates/arithmetic/charge treatment. Section 17 is authoritative for the current accepted/deferred status. All twelve DEC-047 service/endpoint combinations remain pending verification and unavailable.


## 17. Owner-approved commercial direction — DEC-048 — 2 November 2026

The owner accepted the minimum-launch commercial unit, minimum-necessary service-specific input principle, separate quote/handover deadline requirement, pricing-governance separation and shared pricing authority. The owner deferred service model selection and all actual rate/arithmetic decisions.

| Area | Current approved direction | Still required before quote readiness |
|---|---|---|
| Independent booking commercial unit | One parcel and one itemized quote per independent booking for minimum launch; multi-parcel and cross-obligation allocation deferred | Technical reconciliation of DB-01/02/05; do not infer Firestore cardinality or record-creation timing from the commercial decision |
| Service pricing model | No model selected for Standard, Express or Scheduled | Service-specific cost and operating evidence, then explicit model approval for each service |
| Pricing inputs | Minimum necessary inputs per service; each used input has an approved source, source classification, unit, precision, explicit conversion and validation behaviour | Actual per-service input/source/unit/conversion matrix and missing-source handling |
| Rates and arithmetic | No actual rates or arithmetic values approved | Cost/rate basis, formula or fixed scope, components, currency, precision, rounding and explicit tax/fee treatment |
| Quote and handover | Separate service-specific quote validity and physical-handover deadline, both communicated before acceptance | Numerical durations, triggers, expiry/missed-handover consequences and owner-approved customer terms |
| Governance | Proposal, Operations validation, Finance review and independent approval | Named accountable people, assigned authority, approval controls and effective-date/publication mechanics |
| Shared authority | One shared pricing-rule authority wherever storefront delivery and independent shipment inputs overlap | Technical integration design that preserves product-price/delivery-price distinction |

**Important technical distinction:** Acceptance of one parcel and one quote per booking settles the minimum-launch commercial scope. It does not settle DB-01's shipment-record creation point or the concrete technical relationship/cardinality, schema and API representation for DB-02/DB-05. DB-03, DB-06 and DB-11 remain unresolved. No database schema or application implementation is approved by DEC-048.

All twelve DEC-047 service/endpoint combinations remain pending verification and unavailable by default. No service is quote-ready until its model, inputs, rates/arithmetic, deadlines, eligibility evidence, technical contracts and executable acceptance criteria are approved and verified. Payment, intake, custody, dispatch, M0 and DEC-036 release gates remain independent.
