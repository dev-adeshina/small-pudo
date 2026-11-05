# VeriLyft M2 Commercial Pricing — Consolidated Owner Decision Package

**Status:** Owner response accepted and recorded as DEC-048; see Section 13 for the authoritative accepted/deferred outcomes  
**Prepared:** 2 November 2026  
**Baseline:** PR #110 merge commit `6bced955b967d34e674f9807f71d8092bb63bd48`  
**Authority preserved:** DEC-019, DEC-026, DEC-038–DEC-041, DEC-045–DEC-048; PM-01–PM-12; BP-01–BP-22  
**Readiness reference:** `PLATFORM_M2_PRICING_AND_QUOTATION_READINESS_SPECIFICATION.md`  
**Related owner package:** `PLATFORM_CONSOLIDATED_OWNER_DECISION_PACKAGE.md`

## 1. Purpose and approval boundary

This package turns the M2 readiness specification into a single owner-facing set of commercial choices for the independent shipment services Standard, Express and Scheduled.

It is deliberately not a rate card or pricing implementation. It distinguishes:

- policy already approved and therefore not reopened;
- recommendations that can be accepted, rejected or deferred as a group;
- commercial facts that must be supplied by an accountable business/operational source before a service can be enabled;
- technical relationship decisions that must be settled before data/API design.

**No rate, formula, service model, unit, conversion, currency, fee, tax treatment, numerical duration, approval threshold, provider or data structure is approved by preparing this package.** A merge of this documentation package will not constitute acceptance of its proposals.

The owner may accept the recommended baseline as a package, identify exceptions, or defer any item. Deferred items remain explicit launch blockers for the affected capability.

## 2. Already-approved policy — preserve without reopening

1. Standard, Express and Scheduled are the launch customer-facing service names and meanings (DEC-046).
2. Each service independently uses an explicitly approved fixed, calculated or hybrid pricing model and only its configured inputs (DEC-026 / DEC-039). No universal model or formula is implied.
3. Storefront delivery and independent shipment booking use one shared pricing-rule authority wherever their pricing inputs overlap (DEC-019).
4. The trusted server validates configured inputs and calculates the authoritative price. Browser totals are not authoritative. Staff-assisted pricing uses the same rule authority (DEC-039).
5. Applicable charge components and total are disclosed. Taxes, surcharges, discounts and other fees are neither silently presumed zero nor silently added (DEC-039).
6. Historical quote inputs, itemized charges, total, currency, rule/rate version and effective context are preserved. Later changes do not silently rewrite issued/accepted quotes or completed payments (DEC-039).
7. Explicit acceptance of the exact valid quote by the authenticated booking party confirms the booking (DEC-038). Quote, booking, payment, physical intake and custody remain distinct.
8. Quote validity and the service-specific physical handover deadline are separate and communicated before acceptance (DEC-038).
9. Declared measurements, actual intake measurements, proposed adjustments, review, customer consent and settlement remain separate (DEC-040).
10. Standard/Express estimates are not guarantees. Express is shorter than Standard for the same comparable eligible journey. Scheduled availability is revalidated before confirmation and its commitment preserved (DEC-046).
11. All twelve service/endpoint combinations remain pending verification and unavailable by default until the DEC-047 evidence and Operations approval gate is satisfied.
12. No route type is selected by the Shipper. Pricing follows the system-determined actual journey; direct In-PUDO-to-In-PUDO remains valid.

## 3. Decision A — Commercial unit: booking, parcel and quote (DB-01, DB-02, DB-05)

### Existing constraints

- Booking acceptance is not physical receipt or custody.
- Booking and physical parcel are distinct concepts; no universal one-to-one relationship has been approved.
- DB-05 currently leaves quote scope open: booking, parcel, service component or composite.
- DEC-038 makes acceptance of a valid quote by the authenticated booking party the booking-confirmation event.
- A quote must preserve the exact commercial context accepted.

### Recommendation for minimum launch

1. Limit an independent shipment booking to **one parcel** at launch.
2. Issue **one commercial quote for that booking obligation**.
3. Itemize all applicable approved service/charge components within that quote rather than issuing separately accepted component quotes.
4. Bind acceptance to the exact valid quote version. Acceptance confirms the booking obligation; it does not imply that a parcel has been physically handed over or accepted into custody.
5. Keep any later actual parcel measurement and proposed price adjustment linked to, but separate from, the accepted quote.
6. Defer multi-parcel bookings, partial parcel acceptance, parcel splitting/merging, cross-booking quote aggregation and cross-obligation allocation until their commercial and operational rules are approved.

### Alternative

Permit multiple parcels per booking and quote at booking or parcel/component level. This requires approved parcel-level pricing allocation, partial acceptance, measurement aggregation, intake/refusal, cancellation, custody and adjustment rules before launch.

### Owner choice requested

Accept the one-parcel-per-booking and one-quote-per-booking minimum-launch recommendation, or select the multi-parcel alternative and fund the additional rules/specification.

**Important limit:** This recommendation does not settle DB-01's exact shipment/consignment record-creation point, DB-03 route-leg cardinality, DB-06 payment allocation or DB-11 financial-event linkage. Those remain separate decisions. No Firestore cardinality or record schema follows automatically from accepting this commercial unit.

## 4. Decision B — Pricing model for each service

DEC-039 permits each service to use fixed, calculated or hybrid pricing. The choice must reflect its actual cost drivers and available trusted inputs. Current SDD/source evidence does not contain an approved cost study or rate card that justifies selecting a model for any of the three services.

| Service | Fixed option | Calculated option | Hybrid option | Recommendation now |
|---|---|---|---|---|
| Standard | Predetermined charge for a clearly bounded service/journey scope | Price derived from approved journey/parcel inputs | Base charge plus approved variable components | Do not select yet; require Standard cost and operating evidence |
| Express | Predetermined priority-service charge for a bounded scope | Price derived from approved journey/parcel inputs and priority cost basis | Base charge plus explicitly approved priority/variable components | Do not presume a premium; require Express incremental-cost evidence |
| Scheduled | Predetermined charge for a defined scheduled-service scope | Price derived from approved journey/parcel inputs and approved schedule-related cost drivers | Base charge plus approved variable components | Do not presume a scheduling fee; require cost and capacity evidence |

### Model-selection criteria

- **Fixed** is suitable only where the approved operating scope has sufficiently predictable cost and the rate's included scope/exclusions are explicit.
- **Calculated** is suitable only where the cost drivers are measurable, authoritative, available before quote acceptance and supported by a deterministic approved formula.
- **Hybrid** is suitable only where an approved base component and separately justified variable components are both defined.
- A service must not be forced into calculated pricing merely because distance/weight data can be collected. Nor should fixed pricing hide materially variable cost.
- A model cannot rely on an input that is unavailable, unverifiable or operationally unmeasurable at the point the quote is produced.

### Recommendation

Do not select Standard, Express or Scheduled model mappings without a service-specific cost/operations worksheet. Have the accountable pricing owner provide the cost basis and Operations validate that the required inputs can actually be captured and fulfilled. Then approve each model independently in a single service configuration matrix.

**Owner choice requested:** Approve this evidence-first selection rule and defer the three model selections until the evidence exists, or provide a documented model choice and supporting cost basis for each service now.

## 5. Decision C — Service-specific pricing inputs and measurement basis

The existing approved candidate input categories are origin, destination, distance/approved distance band, weight, dimensions, volumetric weight, service class/delivery speed, configured minimum charge and documented special handling. They are not a mandatory universal list.

### Recommendation

For each service, approve an input matrix that classifies every candidate as required, optional, conditional or unused. Start with the smallest input set that is demonstrably needed to price and fulfil that service. Do not collect or price from an input solely because it is technically convenient.

Each used input must identify:

- authoritative source and accountable source owner;
- whether it is Shipper-declared, system-derived, staff-recorded or physically measured;
- unit, precision and permitted explicit conversion;
- validation and missing/unavailable/out-of-range behaviour;
- whether it affects eligibility, estimate, price or more than one;
- how the original declared value and later actual measurement remain separately attributable.

Specific boundaries:

- Origin/destination are customer endpoint choices, not a customer-selected route. The system determines the route.
- Distance or distance band is used only if an approved authoritative source, measurement basis, band boundaries and unavailable-source behaviour are specified.
- Weight/dimensions require approved units, capture process and declared-versus-actual handling.
- Volumetric weight requires an approved formula/divisor, unit compatibility, rounding stage and comparison rule; it must not be inferred from generic industry practice.
- Express priority and Scheduled date/window are not automatic surcharges or price multipliers. Their pricing relevance must be explicitly approved.
- Special handling is chargeable only when a supported category, eligibility, evidence, approval and rate are explicitly configured.

**Owner choice requested:** Approve the minimum-necessary-input rule and the service-by-service input matrix as the required configuration artefact. Exact input mapping, sources, units and formulas remain pending evidence and separate approval.

## 6. Decision D — Rates, formulas, charge components and financial arithmetic

### Recommendation

No launch rate or formula should be entered until the accountable owner has approved a traceable service cost/rate basis. The approved pricing configuration for each service must document:

1. cost basis and operating scope;
2. model and formula, or fixed rate and included scope;
3. each component's applicability and calculation order;
4. distance source/bands, minimums, weight/dimension/volumetric treatment and special handling, only where used;
5. all exclusions and unavailable-input behaviour;
6. sample worked calculations and boundary cases;
7. version, effective-from/effective-until context and approval evidence.

A rate card should not be assembled by copying competitors' public prices, using illustrative examples, or reverse-engineering the current storefront delivery fee of zero. Product catalogue price is not delivery price.

### Charge presentation

Show the applicable components and the total. The service specification must explicitly determine applicability and calculation/presentation for:

- base/service charge;
- distance, weight, dimensions or other calculated components;
- minimum charge;
- priority or scheduled-service component, if any;
- special handling;
- tax;
- surcharge;
- discount;
- any other fee.

No component is mandatory merely because it appears in this list. No charge is added or treated as zero without explicit approval.

### Currency and arithmetic

The current storefront payment source uses NGN for storefront orders. That fact does **not** establish the currency for independent shipment quotes or future multi-currency journeys.

For each service, approve:
- quote currency and whether cross-currency journeys are supported;
- monetary precision and representable unit;
- rounding mode and exact stage of rounding;
- intermediate precision;
- tax treatment and authoritative tax basis/rate source;
- surcharge/discount eligibility, stacking and approval;
- display of inclusive/exclusive amounts and total.

### Owner choice requested

Approve the requirement for a documented cost/rate card and explicit arithmetic/charge policy before activation. Supply or commission the actual service cost basis, rate values, formulae and tax/fee advice through the accountable business sources. These actual values are not safely inferable by the assistant or from current code.

## 7. Decision E — Quote validity and physical handover deadline

### Recommendation

Set two separate, service-specific values:

- **Quote validity:** how long an unaccepted issued quote remains available for acceptance, measured from an explicitly defined trigger.
- **Handover deadline:** the period within which the Shipper must physically present the parcel after booking confirmation.

For each service, the Operations owner should propose values based on rate stability, customer journey, operating hours, coverage, capacity, staffing and location availability. The commercial owner should approve the customer-facing terms and consequences.

Also specify:
- whether quote extension is possible and who can authorize it;
- whether a revised quote is required after expiry;
- how a confirmed booking is handled if handover is missed;
- what happens on refused/held intake or location closure;
- customer notice, cancellation and any financial consequence;
- how Scheduled delivery date/window, quote validity and handover deadline interact without being conflated.

### Owner choice requested

Approve the separate service-specific policy and require evidence-backed durations from Operations before service activation. Do not insert a generic 24-hour, 48-hour, 7-day or other assumed period.

## 8. Decision F — Pricing-rule ownership and change governance

### Recommendation

Before any service is enabled, name:
- an accountable owner for pricing configuration and cost/rate proposals;
- an independent approver for activation and material changes, consistent with PM-01–PM-12 separation-of-duties rules;
- an Operations reviewer for service scope, capacity and input feasibility;
- a Finance reviewer for monetary arithmetic, charge transparency and reconciliation implications;
- an implementation/configuration custodian who can publish only an approved version.

These are accountability functions, not new role names, permission IDs or claims. The actual people/roles and authority must be mapped to the existing PM-01–PM-12 permission/approval framework. A requester must not approve their own consequential change where separation is required.

Each change must have a proposal, rationale, affected services/journeys, cost evidence, review/approval, effective date, version, activation/withdrawal decision and audit evidence. A correction or rollback must not rewrite previously issued/accepted quotes.

**Owner choice requested:** Approve the separation of pricing proposal, Operations validation, Finance review and independent activation approval as the governance baseline, with exact accountable people and permission scopes assigned through the existing authority matrix.

## 9. Decision G — Shared pricing authority and storefront integration

### Recommendation

Keep one shared approved pricing-rule authority for storefront delivery and independent shipment booking wherever inputs overlap, as DEC-019 already requires.

Preserve the distinction between:
- product catalogue price (goods);
- delivery/shipment charge (logistics service);
- quote/accepted commercial obligation;
- payment and financial settlement.

The current storefront order route performs trusted product price/stock validation, but delivery fee is currently zero and currency NGN. Existing Paystack initialization/verification is storefront-order scoped. Neither is an approved shipment rate, shared pricing engine or general quote-payment contract.

Do not modify storefront checkout to consume placeholder delivery rates. First approve the shared rule ownership, service mappings, migration/compatibility behaviour and acceptance cases; then design the smallest reuse of existing source patterns.

**Owner choice requested:** Reaffirm DEC-019 as the mandatory shared pricing authority and prohibit separate ad hoc storefront and shipment formulas.

## 10. Separate gates — not resolved by this pricing package

These remain independent and must not be treated as approved by accepting the commercial recommendations:

- DEC-047 actual eligible/conditional/not-eligible outcomes and supporting evidence for all twelve service/endpoint combinations;
- coverage, PUDO endpoint actions, valid system-determined routes, operating availability/capacity and Operations approval;
- Standard/Express estimate methodology, numerical delivery timeframes and guarantee policy;
- Scheduled availability windows, cutoffs, reservation/expiry and change/cancellation rules;
- DB-01 shipment/consignment creation point; DB-03 parcel/route-leg relationship; DB-04 storefront fulfilment relationship;
- DB-06 payment allocation and DB-11 financial-event linkage;
- exact measurement discrepancy thresholds and adjustment authority under DEC-040;
- payment methods, settlement and refund/credit rules under DEC-041;
- technical ownership/cardinality, API/security/transaction/recovery contracts and executable acceptance tests;
- M0 residual evidence and DEC-036 P0/Conditional P0 release requirements.

No quote can be issued for a service/endpoint combination that remains pending or unavailable under DEC-047, regardless of whether a price can be calculated.

## 11. Consolidated owner response requested

The recommended minimum-launch baseline is:

| Decision | Recommended response |
|---|---|
| A — Commercial unit | Accept one parcel per independent booking and one itemized commercial quote per booking; defer multi-parcel and cross-obligation allocation |
| B — Service pricing models | Accept evidence-first selection; defer model mapping for all three services until service-specific cost evidence is supplied |
| C — Pricing inputs | Accept minimum-necessary, service-specific input matrix with authoritative sources and explicit units/conversions |
| D — Rates and arithmetic | Require approved cost/rate basis and explicit currency/rounding/tax/fee policy; defer all actual values until supplied and approved |
| E — Quote and handover terms | Accept separate service-specific quote validity and handover deadlines; defer numerical durations to Operations evidence and owner approval |
| F — Governance | Accept separated proposal, Operations validation, Finance review and independent approval; assign actual authority through existing PM matrix |
| G — Shared authority | Reaffirm one shared pricing-rule authority under DEC-019; no parallel formulas or placeholder storefront delivery charges |

The owner may accept all recommendations, accept with named exceptions, reject any item in favour of the stated alternatives, or defer an item. Deferred items remain blockers and the affected service/capability stays unavailable.

## 12. What acceptance does and does not authorize

Acceptance of this package would settle the stated business direction only. It would not by itself authorize:

- actual rate values, formula coefficients, distance bands, units, conversions, currency or numerical durations that have not been supplied and approved;
- a specific service-to-model mapping without its cost basis;
- Firestore collections, fields, indexes, identifiers, cardinalities, status enums or API routes;
- a new pricing service or parallel architecture;
- payment-provider changes, tax/legal interpretations or provider activation;
- a change to Firebase rules, permissions, production configuration or deployed behaviour;
- quote or booking code implementation before the technical relationship, API/security and acceptance contracts are reconciled.

The owner response is now recorded as DEC-048 in Section 13 and reconciled into the authoritative DEC/owner register and affected SDD contracts. Complete technical source reconciliation and executable acceptance specifications before implementation of the blocked quote/pricing capabilities.


## 13. Owner response recorded — DEC-048 — 2 November 2026

The owner accepted groups A, C, E, F and G, and deferred groups B and D. This section is authoritative where it differs from the earlier recommendations in Sections 3–10; those sections preserve the options and rationale presented for review.

- **A — Accepted commercial unit:** one parcel and one itemized quote per independent booking for minimum launch. Multi-parcel bookings and cross-parcel/multi-obligation allocation are deferred. This does not decide DB-01 shipment-record creation timing or the technical persistence/cardinality design for DB-02/DB-05; DB-03, DB-06 and DB-11 remain open.
- **B — Deferred:** no Standard, Express or Scheduled fixed/calculated/hybrid model is selected. Each model decision awaits service-specific cost and operating evidence.
- **C — Accepted input principle:** use only the minimum necessary inputs for each service, each with approved source, source classification, unit, precision, explicit conversion, validation and missing-value behaviour. Actual mappings and values remain pending evidence and approval.
- **D — Deferred:** no rates, formulas, coefficients, distance bands, minimums, currency, precision, rounding, tax, surcharge, discount or other fee treatment is approved.
- **E — Accepted:** quote validity and physical-handover deadline are separate service-specific requirements, both communicated before acceptance. Numerical durations, triggers and missed-deadline outcomes remain unresolved.
- **F — Accepted:** separate pricing proposal, Operations validation, Finance review and independent approval, aligned with PM-01–PM-12. Named authority and implementation mechanics remain open.
- **G — Accepted:** retain one shared pricing-rule authority for storefront delivery and independent shipment pricing wherever inputs overlap, consistent with DEC-019.

DEC-047's twelve service/endpoint combinations remain pending verification and unavailable by default. This owner response approves no pricing model, rate, formula, currency, unit, conversion, numerical duration, schema, collection, field, cardinality implementation, API, permission, provider or application-code change. Continue with technical relationship/source/API/security contracts and executable acceptance specifications; keep quote issuance unavailable until all commercial and operational prerequisites are approved.

## 14. Reconciliation after owner approval of the M2 pre-implementation package — 5 November 2026

PR #139 merged the consolidated requirements/review package at 364909e15dcdb719ac64ff96b10592f8b4e183f5. The owner's approval of that package confirms the requirements baseline and permits the specialist SDD reconciliation and preparation of a separately bounded implementation plan. It does not reopen DEC-048, select a service pricing model, approve a rate/formula/currency/fee/duration, or create a new commercial decision.

**DEC-048 remains unchanged and authoritative.** Groups A, C, E, F and G remain accepted; B and D remain deferred. No additional owner decision is inferred from the operating-model narrative. The workbook must capture evidence and unknowns without populating invented amounts or units. Technical and operational gates remain separate from commercial approval, including DEC-047's twelve unavailable service/endpoint combinations and the DB-01–DB-12 capability contracts.

**Next decision checkpoint:** after source-aligned SDD reconciliation, present one consolidated implementation-readiness plan. Any new commercial choice must be separately stated, evidenced where necessary, assigned a decision owner and recorded through the existing decision register before it is implemented.
