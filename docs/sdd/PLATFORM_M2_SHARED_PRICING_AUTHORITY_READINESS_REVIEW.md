# VeriLyft M2 — Shared Pricing Authority Readiness Review

**Status:** Consolidated readiness assessment; implementation of customer pricing and quotation remains blocked pending business evidence, approvals and technical gates.  
**Prepared:** 6 November 2026  
**Repository baseline:** `main` at PR #143 merge `1f731f14f98212f186b0855addd26f1c98f01c08`  
**Application-source baseline:** PR #143 merge `1f731f14f98212f186b0855addd26f1c98f01c08`  
**Authority:** DEC-019, DEC-026–DEC-029, DEC-036, DEC-038–DEC-050; PM-01–PM-12; BP-01–BP-22; approved M2 pricing, cost-evidence and operational-activity documents.  
**Purpose:** Establish one source-aligned, implementation-readiness decision after PR #143. This document supersedes earlier M2 Stage 0/Stage 1 status wording where it conflicts with the merged PR #143 outcome. It does not reopen accepted business decisions.

---

**Subsequent owner decision:** The owner confirmed on 6 November 2026 that VeriLyft has not started operating and no actual operating-cost records exist. The separate `PLATFORM_M2_CONFIGURABLE_ACTIVITY_COST_FOUNDATION_DECISION.md` supersedes this review's actual-evidence-first execution sequence and its blanket prohibition on internal cost-configuration code, solely for the bounded configurable activity-cost foundation. All customer-pricing, quote, DEC-047, booking/payment/physical-operation and DEC-036 gates remain unchanged.

## 1. Executive decision

**Decision: proceed with evidence collection and validation; do not begin shared customer-pricing calculation, service pricing configuration, quote issuance or quote acceptance code yet.**

PR #143 completes the bounded internal structured cost-evidence enhancement. The existing operational-cost definition workflow can now capture structured evidence items and a controlled treatment classification inside the existing immutable cost-component/version snapshot. This is an evidence-capture foundation, not a pricing engine.

The repository contains an owner-reviewed operational activity catalogue and an evidence workbook template. The workbook explicitly records that no actual monetary cost evidence or approved cost-allocation method has been supplied. Standard, Express and Scheduled each still lack an approved pricing model, complete service-specific input mapping, approved rates/formulae, monetary treatment and service-specific quote/handover terms.

The next execution work is therefore an Operations/Finance evidence exercise using the existing staff workflow and workbook—not another cost-definition feature, not placeholder data entry and not customer pricing code.

### Readiness outcome

| Workstream | Current outcome | Next action |
|---|---|---|
| Internal structured cost-evidence capture | Implemented in PR #143 | Use the existing workflow with attributable real evidence |
| Actual operating-cost evidence | Not supplied / not validated | Operations and Finance collect, validate and review evidence |
| Standard pricing configuration | Not ready | Decide only after Standard evidence and operational feasibility review |
| Express pricing configuration | Not ready | Establish incremental Express cost/capacity evidence independently |
| Scheduled pricing configuration | Not ready | Establish scheduling, capacity and service-cost evidence independently |
| Shared pricing authority | Policy accepted; implementation design gated | Define the bounded technical contract after required commercial inputs and DB contracts are reconciled |
| Quote issuance / acceptance | Not ready; remain unavailable | Require complete pricing, terms, eligibility and technical acceptance gates |
| Booking, payment, intake and custody | Separate capabilities and gates | Do not fold into pricing work |

No customer-facing quote may be calculated or issued for a service without its own complete approved configuration and DEC-047 eligibility outcome.

---

## 2. Accepted decisions to preserve — do not reopen

1. **One shared pricing-rule authority (DEC-019 / DEC-048).** Storefront delivery and independent shipment pricing consume the same approved pricing authority wherever their inputs overlap. No parallel independent-shipment pricing engine or ad hoc storefront delivery formula is authorized.
2. **Product price is not delivery price.** Storefront catalogue product prices remain separate from delivery/shipment charges.
3. **Service-specific pricing models (DEC-026 / DEC-048).** Standard, Express and Scheduled each independently use an explicitly approved fixed, calculated or hybrid model. No model is selected by this review and no service inherits another service's model by analogy.
4. **Minimum necessary inputs.** Each service uses only inputs demonstrably required to price and fulfil it. Each used input needs an authoritative source, source/actor classification, unit, precision, explicit permitted conversion, validation, purpose and missing/unavailable behaviour.
5. **Minimum commercial unit (DEC-048 / DEC-049).** One independent booking has one parcel and one itemized quote at minimum launch. Multi-parcel and cross-obligation allocation remain deferred.
6. **Trusted calculation and transparent itemization (DEC-039).** The trusted server validates approved inputs and calculates the authoritative price. Browser values/totals are not authoritative. Staff-assisted pricing must use the same approved rule authority.
7. **Immutable quote history.** Preserve quote inputs, itemized charges, total, currency, pricing-rule/rate version and effective context. Later configuration changes do not silently rewrite issued or accepted quotes.
8. **Exact-version acceptance (DEC-038 / DEC-049).** Explicit acceptance by the authenticated booking party of the exact current, valid quote version confirms the commercial booking. Quote issuance or viewing does not.
9. **Separate commercial and operational facts.** Quote acceptance does not establish payment, parcel identity, physical intake, custody, route assignment or dispatch. Parcel identity is created only when authorized staff accept actual physical possession.
10. **Separate deadlines.** Quote validity and the physical-handover deadline are different service-specific commitments and must both be communicated before acceptance.
11. **Adjustments remain separate.** Declared inputs, actual intake measurements, proposed adjustments, review, customer consent and financial settlement remain distinct. No automatic price increase or silent overwrite is allowed.
12. **Eligibility fails closed (DEC-047).** All twelve service/endpoint combinations remain pending verification and unavailable by default until their evidence and Operations approval gates are satisfied.
13. **Pricing governance remains separated.** Proposal, Operations validation, Finance review and independent approval are distinct. PR #143 does not grant any new permission or assign named approvers.

---

## 3. What PR #143 makes possible—and what it does not

PR #143 adds structured evidence to the existing cost-component/version model:

- evidence items are persisted within the existing immutable version snapshot;
- source reference, source owner/type, represented scope, observation date/period, coverage, collection method and limitations are captured;
- optional original value, unit, currency and precision can be recorded without silently converting source values;
- a controlled treatment classification distinguishes `direct`, `shared`, `included` and `exception_related`;
- the existing server-side boundary validates evidence shape and requires structured evidence plus treatment classification for new workflow submission;
- the existing versioning, expected-version concurrency, APIs, permissions, reviewer separation, workflow events and Firestore client-denial rules are reused.

**No parallel evidence registry or new collection is required.** The existing operational-cost definitions and workflow are the system of record for this bounded evidence capture.

PR #143 does not:
- calculate, aggregate or allocate costs;
- decide whether a cost is chargeable to a customer;
- select a service pricing model;
- approve a rate, formula, currency, fee, tax, rounding or duration;
- create a shared pricing authority or connect it to storefront delivery;
- issue or accept a customer quote;
- activate a service or DEC-047 endpoint combination;
- create a booking, payment, parcel, intake, custody or route event.

### Verification boundary

PR #143's pull-request description explicitly stated that it did not claim local automated verification. The owner subsequently reported targeted browser testing of the operational-cost editor/detail flow. Operations submission and Finance validation were not yet tested in the reported scenario. Do not convert that targeted browser result into a claim that the complete approval workflow or production readiness has been verified.

---

## 4. Operating-cost evidence: required collection approach

### 4.1 Evidence standard

Each evidence item must be attributable and independently reviewable. Preserve the source value and original unit. Record conversions separately and only after the conversion method and authority are approved.

Required evidence fields:

| Field | Required content |
|---|---|
| Evidence reference | Stable identifier for source record, report, agreement, dataset or measurement |
| Source owner | Person/function accountable for the source |
| Source type | Observed operating record, measured cost, approved supplier/partner input, approved policy or explicitly described other source |
| Scope represented | Activity, service/journey, endpoint pattern, geography, location, operating conditions |
| Observation period | Exact date or start/end dates |
| Sample / method | Population/sample size where relevant, collection and calculation method |
| Original value and unit | Preserve source value, currency/unit and precision where available |
| Coverage | What is included and excluded; represented volume or period |
| Limitations | Missing data, assumptions, uncertainty, bias, exclusions and data-quality concerns |
| Treatment | Direct, shared, included or exception-related, with rationale |
| Review outcome | Operations validation, Finance review, decision actor, date, outcome and reason |

An absent value is unknown—not zero. A blank evidence field is a blocker for the affected decision, not permission to infer a default.

### 4.2 Activity catalogue to use

Reuse the existing ACT-01–ACT-11 activity families. Do not create duplicate identifiers or silently merge distinct physical events.

| Activity | Evidence collection focus |
|---|---|
| ACT-01 Origin PUDO presentation and receipt | Staff effort and resources for presentation/receipt; distinguish presentation from physical custody acceptance |
| ACT-02 Parcel verification and measurement | Actual verification/measurement effort, equipment or other evidenced cost; preserve declared versus measured values |
| ACT-03 Origin PUDO custody acceptance | Cost of the distinct authorized custody-acceptance activity |
| ACT-04 Transport / movement between operational points | Actual transport arrangement, route/leg, asset/provider, trip or parcel basis where evidenced |
| ACT-05 Destination PUDO receipt / custody acceptance | Destination receipt/verification and actual custody-acceptance costs |
| ACT-06 Delivery to an address / recipient handover | Address delivery effort and evidenced delivery arrangement |
| ACT-07 Collection / release to an authorized collector | Collection/release effort and evidence; do not conflate with destination receipt |
| ACT-08 Failed collection or delivery attempt | Exception activity evidence; does not automatically create a customer surcharge |
| ACT-09 Return-to-Sender journey | Reverse-journey evidence and responsibility; no automatic customer charge |
| ACT-10 Exception review and resolution | Evidence-backed review/resolution effort; define scope and avoid duplicate charging |
| ACT-11 Origin PUDO substitution handling | Request/review/decision activity evidence and actual applicability |
| ACT-12 Conditional / inactive | Do not configure as an active cost activity until Operations confirms the activity is actually provided or contractually required |

### 4.3 Owner-confirmed operating-model dimensions requiring evidence

The cost evidence should be capable of describing the actual arrangement, not force every activity into one universal unit-cost basis:

- activity-specific unit costs, independently configurable;
- physical service path, including door pickup versus PUDO presentation where applicable;
- parcel verification and measurement;
- collection-centre/PUDO handling;
- sorting or consolidation only where an actual activity is confirmed;
- dispatch and movement between operational points;
- actual driver/partner/vehicle arrangement and the evidenced compensation basis;
- route/geography, including local city/state journeys and inter-city/federal movement where applicable;
- parcel characteristics such as weight, dimensions, size/fragility or handling class only where an approved operational process captures and uses them;
- vehicle/transport mode such as bike, car or truck only where it reflects the actual arrangement and evidence.

These are evidence dimensions, not a mandatory input list, price formula or permission to collect unnecessary customer data.

### 4.4 Transport and duplicate-cost safeguards

- The owner-described arrangement does not add separate fuel/vehicle operating-expense reimbursement on top of driver-owned-vehicle driver charges or external-partner charges. Do not count those expenses twice unless an actual agreement/source establishes that they are separately payable.
- Business-owned vehicle cost treatment remains unresolved and must be supported by real records and Finance review.
- A per-trip, per-parcel, distance-based, time-based, fixed, hybrid or negotiated basis is a possible way to represent an evidenced arrangement—not a default selected by this review.
- Do not allocate shared costs by parcel count, distance, shipment value or another convenient proxy until Finance approves a defensible allocation basis.
- Mark included costs to prevent duplicate counting.
- Failed attempts, RTS and exception costs must not automatically become customer charges or assumed customer liabilities.

### 4.5 Journey-specific evidence

Do not assume every parcel incurs every hub, city corridor or inter-city activity. A local journey must not inherit a distant corridor cost without evidence. Destination PUDO receipt, address delivery, recipient collection, failed attempt and RTS are distinct events. Only include activities actually incurred or contractually applicable to the represented service/journey.

---

## 5. Service-by-service commercial readiness

| Requirement | Standard | Express | Scheduled |
|---|---|---|---|
| Customer-facing meaning | Regular delivery; journey-specific estimate | Priority handling; shorter estimate than Standard for a comparable eligible journey | Delivery on an available selected date/time window |
| Pricing model | Not selected | Not selected | Not selected |
| Minimum required input set | Not approved | Not approved | Not approved |
| Cost basis | Evidence required | Evidence required, including incremental priority/capacity basis where applicable | Evidence required, including scheduling/capacity basis where applicable |
| Rate/formula | Not approved | Not approved | Not approved |
| Currency / precision / rounding | Not approved | Not approved | Not approved |
| Tax / surcharge / discount / fee treatment | Not approved | Not approved | Not approved |
| Quote validity | Duration/trigger/outcome pending | Duration/trigger/outcome pending | Duration/trigger/outcome pending |
| Physical handover deadline | Separate duration/trigger/outcome pending | Separate duration/trigger/outcome pending | Separate duration/trigger/outcome pending |
| Quote readiness | Blocked | Blocked | Blocked |

### Model-selection tests

- **Fixed:** use only if the evidenced operating scope has sufficiently predictable cost and included scope/exclusions are explicit.
- **Calculated:** use only if the cost drivers are measurable, authoritative, available before acceptance and supported by an approved deterministic formula.
- **Hybrid:** use only if both the base component and variable components are evidenced, justified and approved.

Do not presume Express carries a premium or Scheduled carries a scheduling fee. Their service meanings do not, by themselves, authorize price multipliers or surcharges. Each service's model must be selected independently from its evidence.

### Minimum input specification

For each proposed service input, record:
1. input name and purpose (eligibility, estimate, pricing or a defined combination);
2. required / optional / conditional / unused status for that service;
3. authoritative source and responsible actor;
4. declared versus verified/actual provenance;
5. unit, precision and permitted conversion;
6. validation and range/format rules, if approved;
7. missing, conflicting, stale or unavailable source behaviour;
8. whether it is available at quote time or only at physical intake.

Candidate inputs such as origin, destination, system-determined route, distance/band, weight, dimensions, volumetric weight, service class, schedule window and special handling are not a universal mandatory list. A variable cannot be used in a quote merely because it can be collected later at intake.

---

## 6. Financial and commercial decisions still requiring explicit approval

No value may be inferred from the storefront order path, Paystack configuration, market practice, competitor prices or illustrative test records.

The accountable business owners must resolve:

- approved rate or formula for every chargeable component and service;
- the evidence-backed basis for each value and its included scope/exclusions;
- any distance source, route treatment, distance-band boundaries and unknown-distance behaviour;
- any weight/dimension/volumetric treatment, including units, divisor, comparison and rounding stages;
- currency for independent shipment quotes and whether cross-currency journeys are supported;
- monetary precision and rounding method;
- tax applicability and authoritative tax source;
- surcharge, discount, minimum, special-handling and other fee applicability, calculation, presentation and approval;
- shared-cost allocation method and prevention of double counting;
- rate version, effective-from/effective-until context, publication and withdrawal authority;
- quote-validity trigger/duration and the consequence of unaccepted expiry;
- separate physical-handover deadline trigger/duration and missed-deadline outcomes;
- service-specific adjustment thresholds/outcomes, customer notice and consent requirements.

Unknown tax/fee treatment must not be silently represented as zero.

---

## 7. Ownership and approval sequence

Use the existing governance and staff permission model. This review does not assign named people, grant permissions or change approval thresholds.

| Step | Accountable function | Required output |
|---|---|---|
| 1. Evidence preparation | Activity/source owner with the appropriate cost proposer | Attributable evidence attached to the relevant activity cost component/version |
| 2. Operations validation | Authorized Operations reviewer | Confirms activity exists, actual scope, actor, location, service applicability, capacity, input capture feasibility and evidence coverage |
| 3. Finance review | Authorized Finance reviewer | Confirms cost basis, source quality, currency/unit interpretation, duplicate/included treatment and any proposed allocation |
| 4. Independent approval | Separately authorized approver | Explicit approval/rejection, rationale, effective context and audit record |
| 5. Service configuration decision | Accountable commercial owner with Operations and Finance evidence | Independently selects model, inputs, charge treatment and terms for Standard, Express and Scheduled |
| 6. Technical readiness | Product/engineering with the responsible security/operations owners | Source-aligned contract, acceptance fixtures and bounded implementation scope |

Operations validation and Finance review are not interchangeable. Approval of an internal cost definition does not approve a customer price or activate a service.

**Named accountability gap:** the accountable Operations position and authoritative PUDO inventory source remain unresolved in the project baseline. Those ownership/inventory gaps must be assigned/resolved through the proper owner decision; this document does not invent an owner.

---

## 8. Current technical source boundary and reuse

The current source findings establish the following:

| Existing capability | Reuse / limitation |
|---|---|
| Operational-cost definition store, immutable versions, components/inputs, evidence items and treatment class | Reuse as internal evidence and cost-definition foundation. It is not a customer-price store or calculator. |
| Existing Operations / Finance / independent approval workflow and staff permissions | Reuse. No new permission, state or approval shortcut is approved. |
| Shipment draft preparation | Draft-only. It does not calculate or issue a quote or confirm a booking. |
| Internal quote-lineage / immutable-version persistence foundation | Reuse only after the quote contract is ready. It is not a quote calculator, issuer or customer acceptance workflow. |
| Storefront order API | Recalculates product prices server-side, but the inspected delivery fee is hard-coded to zero and the order currency is NGN. This is not the shared shipment pricing authority. |
| Storefront Paystack initialization/verification | Order-scoped payment integration; not a general independent-shipment quote/payment contract. |
| Existing ACT-01–ACT-11 catalogue | Reuse; do not create duplicate activity families. ACT-12 remains conditional/inactive. |

### Design principles that can be specified now

Without inventing schema or commercial values, a later shared-authority contract can require:

- one authoritative server-side rule evaluation boundary for overlapping storefront and independent-shipment inputs;
- service-specific rule selection and explicit input declarations;
- immutable, versioned approved configuration and effective context;
- reproducible calculation from validated inputs and the exact configuration version;
- itemized charge components and a total in an explicitly approved currency;
- fail-closed behaviour for missing, stale, conflicting or unapproved configuration/input;
- quote snapshots that preserve inputs, itemization, total, currency, rule/rate version and effective context;
- exact-version acceptance and concurrency/replay safety consistent with DEC-049;
- no side effects that conflate quote, booking, payment, parcel, intake, custody or dispatch.

These are contract requirements only. They do not approve collection names, fields, indexes, APIs, status enums, permissions, providers or Firestore migrations.

### Technical gates before implementation

- Reconcile the affected DB-01–DB-12 ownership/cardinality/API/security contracts. DB-01/DB-02/DB-05 have an approved bounded logical/physical foundation, but DB-03, DB-04 and DB-06–DB-12 remain open for their affected capabilities.
- Confirm how cost-definition versions are referenced by future approved pricing configurations without mutating historical snapshots.
- Define the shared pricing authority boundary and storefront integration path without reusing the storefront's hard-coded zero delivery fee or assuming NGN for independent shipment quotes.
- Define server-side input provenance, authorization, validation and failure behaviour.
- Produce executable acceptance fixtures for valid, invalid, missing, stale, conflicting and superseded configurations and quote versions.
- Keep DEC-047 eligibility and DEC-036 production/release evidence as independent gates.

---

## 9. Explicit implementation boundary

### Ready now

1. Use the PR #143 structured evidence fields in the existing internal cost-definition workflow.
2. Collect real evidence for existing ACT-01–ACT-11 activities where the activity is actually performed or contractually required.
3. Obtain Operations validation and Finance review using the existing separated workflow.
4. Complete service-specific evidence packs and input feasibility matrices.
5. Reconcile the technical contracts and prepare the shared pricing authority contract once the business inputs are sufficiently evidenced.

### Not ready / not authorized by this review

- customer price/rate configuration or publication;
- cost aggregation or shared-cost allocation;
- any pricing formula, distance band, volumetric divisor, currency, rounding, tax, fee or surcharge assumption;
- shared pricing calculator implementation;
- storefront delivery-fee activation or modification;
- independent-shipment quote calculation, issuance, revision or acceptance;
- booking confirmation, payment, parcel creation, intake, custody, route or dispatch implementation;
- DEC-047 service/endpoint activation;
- any production migration or permission change.

**No application code is authorized by this review.** A later, separate owner-approved technical contract and bounded implementation PR are required.

---

## 10. Execution sequence and exit gates

| Stage | Work | Exit condition |
|---|---|---|
| 2A — Evidence collection | Operations/source owners collect actual records for applicable activities and service scopes | Each submitted item has attributable source, owner, scope, period, method, unit/precision and limitations |
| 2B — Operations validation | Validate activity reality, workflow, role, location, coverage, capacity and input feasibility | Operations records a decision and rationale for each relevant evidence/activity/service scope |
| 2C — Finance review | Review cost basis, treatment, duplicates, included costs, units/currency and allocation proposals | Finance records review outcome; no unsupported conversion or allocation remains |
| 2D — Independent approval | Complete separated approval for cost definitions and evidence | Approved internal cost-definition versions exist with complete audit trail |
| 3 — Service commercial configuration | Independently decide Standard, Express and Scheduled models, inputs, rates/formulae, charge treatment and terms | Owner-approved complete service matrix; no unresolved value used by a quote |
| 4 — Shared pricing technical contract | Reconcile DB contracts, authority boundary, API/security, snapshots, versioning and acceptance fixtures | Explicit owner approval of implementation-ready contract and tests |
| 5 — Shared pricing authority implementation | Implement only the approved bounded rule-authority slice | Tests prove trusted deterministic evaluation, version preservation and fail-closed behaviour |
| 6+ — Service configuration and quote lifecycle | Configure approved services; separately gate quote issue/accept, booking, payment and fulfilment | Each capability independently meets its business, technical, eligibility and release gates |

### Evidence-based stop conditions

Stop the affected service decision if:
- source ownership or scope cannot be established;
- evidence is synthetic, illustrative, untraceable or not representative;
- units, periods or coverage are incompatible and no approved conversion exists;
- direct/shared/included/exception treatment is unresolved;
- duplicate cost or unapproved allocation may exist;
- required input is unavailable at the time it is needed;
- Operations cannot validate the activity or service feasibility;
- Finance review or independent approval is missing.

Do not block an unrelated activity/service evidence pack merely because another activity is not applicable. Record “not applicable” with evidence/rationale rather than inserting zero.

---

## 11. Required owner-facing outputs

The evidence and approval work should produce these concrete artefacts:

1. **Activity evidence register:** real evidence attached to the relevant existing ACT cost definitions and immutable versions.
2. **Operations validation record:** activity scope, actor, location, operating conditions, evidence coverage and input feasibility.
3. **Finance review record:** cost basis, treatment classification, duplicate/included analysis, unit/currency interpretation and allocation decision where applicable.
4. **Service-specific cost packs:** separate Standard, Express and Scheduled evidence; no copying across services without explicit justification.
5. **Service pricing decision matrix:** model, inputs, source, unit, conversion, rates/formulae, charges, currency, precision, rounding, effective dates, quote validity and handover terms—each approved or explicitly marked unresolved.
6. **Shared pricing authority technical contract:** only after the commercial matrix and affected technical contracts are sufficiently resolved.

The existing `PLATFORM_M2_SERVICE_COST_AND_INPUT_EVIDENCE_WORKBOOK.md` remains the collection template. The existing `PLATFORM_OPERATIONAL_ACTIVITY_CATALOGUE_AND_COST_INPUT_DEFINITION.md` remains the activity catalogue. This review governs their use and does not create a competing workbook or catalogue.

---

## 12. Final milestone decision

**M2 shared-pricing readiness review: completed as a documentation/readiness assessment.**

**Next active work:** Stage 2A–2D, real operational-cost evidence collection, Operations validation, Finance review and independent approval using the existing PR #143 workflow.

**Implementation decision:** no-go for customer pricing or quotation code until the service-specific commercial evidence and approvals, affected technical contracts and executable acceptance criteria are complete.

**Preserve these distinctions:** internal cost evidence is not a customer price; approved cost is not an approved rate; a shared pricing authority is not a quote; quote lineage is not quote issuance; quote acceptance is not payment or physical custody; route/dispatch is not completed handover.

---

## Source documents reviewed

- `DECISIONS.md` — accepted commercial and operational decisions, especially DEC-019, DEC-026, DEC-038–DEC-050.
- `CURRENT_IMPLEMENTATION_STATUS.md` — implementation/source boundary and release gaps.
- `PLATFORM_M2_COMMERCIAL_PRICING_OWNER_DECISIONS.md` — DEC-048 owner decisions and deferred commercial choices.
- `PLATFORM_M2_PRICING_AND_QUOTATION_READINESS_SPECIFICATION.md` — service-specific quote prerequisites and DEC-047 gates.
- `PLATFORM_M2_SERVICE_COST_AND_INPUT_EVIDENCE_WORKBOOK.md` — evidence requirements and absence of actual approved cost evidence.
- `PLATFORM_OPERATIONAL_ACTIVITY_CATALOGUE_AND_COST_INPUT_DEFINITION.md` — ACT-01–ACT-12 catalogue and operating workflow requirements.
- `PLATFORM_M2_COST_EVIDENCE_STAGE0_TECHNICAL_CONTRACT.md` — bounded structured evidence contract implemented by PR #143.
- `PLATFORM_DB01_DB12_TECHNICAL_CONTRACT_AND_ACCEPTANCE_SPECIFICATION.md` — remaining technical ownership/cardinality/security contracts.
- PR #143 — `feat: add structured evidence to operational cost definitions`, merge `1f731f14f98212f186b0855addd26f1c98f01c08`.
