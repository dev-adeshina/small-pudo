# VeriLyft M2 — Service Cost and Pricing Evidence Workbook

**Status:** Evidence-collection template only; no commercial values or service model approved  
**Prepared:** 2 November 2026  
**Applies to:** Standard, Express and Scheduled independent shipment services  
**Authority:** DEC-019, DEC-026–DEC-029, DEC-038–DEC-041, DEC-045–DEC-048; PM-01–PM-12; DEC-047  
**Related:** `PLATFORM_M2_PRICING_AND_QUOTATION_READINESS_SPECIFICATION.md`; `PLATFORM_M2_COMMERCIAL_PRICING_OWNER_DECISIONS.md`; `PLATFORM_SHARED_WORKFLOWS.md`; `PLATFORM_OWNER_DECISION_REGISTER.md`

## 1. Purpose and boundary

Use this workbook to collect attributable commercial and operational evidence needed to decide whether each launch service should use fixed, calculated or hybrid pricing, and to define the minimum inputs that service actually needs.

This is not a rate card, pricing formula, service approval, quote configuration, API contract or implementation authorization. Blank values are intentionally blank. Do not populate them with illustrative, competitor, generic-industry, storefront-product or guessed values.

DEC-048 is authoritative:
- One parcel and one itemized quote per independent booking at minimum launch; multi-parcel and cross-obligation allocation are deferred.
- Each service uses only its minimum necessary inputs, with approved source, source classification, unit, precision, explicit conversion, validation and missing-value behaviour.
- Quote validity and physical-handover deadline are separate service-specific terms.
- Pricing proposal, Operations validation, Finance review and independent approval remain separate.
- One shared pricing-rule authority applies wherever storefront delivery and independent shipment inputs overlap.
- No service model, actual rate, formula, currency, rounding, tax, fee or numerical duration has been approved.

All twelve DEC-047 service/endpoint combinations remain pending verification and unavailable by default. Evidence collection does not itself activate a combination.

## 2. Evidence quality requirements

Every submitted fact must be traceable. For each evidence item record:

| Field | Required content |
|---|---|
| Evidence reference | Stable reference to the source document, report, operational record or approved dataset |
| Source owner | Accountable person/function responsible for the source |
| Source type | Observed operational record, measured cost, approved supplier/partner input, approved policy, or other explicitly described source |
| Scope | Service, journey/endpoint pattern, geography, location, operating period and conditions represented |
| Observation period | Start/end dates or exact observation date |
| Sample / method | Population, sample size where relevant, measurement or calculation method |
| Unit and precision | Original unit and precision as supplied by the source |
| Limitations | Missing data, exclusions, assumptions, uncertainty, bias or known data-quality concerns |
| Reviewer | Operations or Finance reviewer, as applicable |
| Decision status | Submitted, needs clarification, validated, rejected, or approved; include decision date and reason |

Do not convert a source value silently. Preserve the original value and unit; record any proposed conversion separately with its rationale, method, precision and approving authority.

## 3. Service-by-service evidence pack

Complete a separate pack for each service. Do not copy a model or input mapping from another service without independent evidence.

### 3.1 Standard

| Evidence question | Evidence / source reference | Owner | Status / unresolved issue |
|---|---|---|---|
| What precise operating scope does Standard cover? | | | |
| Which observed cost drivers vary within that scope? | | | |
| Which costs are sufficiently predictable for a fixed scope, if any? | | | |
| Which cost drivers are measurable and authoritative before quote acceptance, if any? | | | |
| Which candidate inputs are necessary to determine eligibility, estimate, price or more than one? | | | |
| What operating constraints affect fulfilment and journey-specific estimates? | | | |
| What evidence supports a fixed, calculated or hybrid model recommendation? | | | |
| What scope/exclusions and failure behaviour would the recommendation require? | | | |

### 3.2 Express

| Evidence question | Evidence / source reference | Owner | Status / unresolved issue |
|---|---|---|---|
| What precise priority-handling scope distinguishes Express? | | | |
| What incremental operating resources/costs are actually observed relative to a comparable Standard journey? | | | |
| Which priority-related inputs are measurable and available before quote acceptance? | | | |
| What capacity constraints affect Express availability? | | | |
| What evidence supports a fixed, calculated or hybrid model recommendation? | | | |
| What scope/exclusions and failure behaviour would the recommendation require? | | | |
| What evidence supports an estimate shorter than Standard for the same comparable eligible journey? | | | |

Do not presume an Express premium, multiplier or surcharge. Any such charge requires explicit cost evidence and approval.

### 3.3 Scheduled

| Evidence question | Evidence / source reference | Owner | Status / unresolved issue |
|---|---|---|---|
| What precise scheduled-service commitment is operationally supported? | | | |
| What capacity, reservation and operating constraints apply to offered windows? | | | |
| Does the selected date/window materially change cost, eligibility or availability? Provide evidence. | | | |
| Which schedule facts are required for pricing, and which are only availability/commitment facts? | | | |
| What evidence supports a fixed, calculated or hybrid model recommendation? | | | |
| What scope/exclusions and failure behaviour would the recommendation require? | | | |
| What are the supported cutoffs, reservation expiry and change/cancellation rules? | | | |

Do not presume a scheduling fee, premium or date-based multiplier. Scheduled availability and commitment must not be conflated with quote validity or handover deadline.

## 4. Candidate input classification

The following are candidate categories already identified in the M2 specification. For each service, classify every candidate as **required**, **optional**, **conditional** or **unused**. Add a new input only when evidence shows it is necessary.

| Candidate input | Standard classification and evidence | Express classification and evidence | Scheduled classification and evidence |
|---|---|---|---|
| Origin and destination | | | |
| System-determined route / journey facts | | | |
| Distance or approved distance band | | | |
| Weight | | | |
| Dimensions | | | |
| Volumetric weight | | | |
| Service class / delivery speed | | | |
| Configured minimum charge | | | |
| Documented special handling | | | |
| Scheduled date/time window | N/A unless justified | N/A unless justified | |

For every input classified required, optional or conditional, complete:

| Attribute | Approved definition |
|---|---|
| Business purpose | Why this input is necessary |
| Source owner | Who is accountable for the authoritative source |
| Source classification | Shipper-declared, system-derived, staff-recorded or physically measured |
| Authoritative source | Exact system, record, measurement process or approved source |
| Unit / precision | Original accepted unit and precision |
| Conversion | Explicit conversion, or state that none is permitted |
| Validation | Range, format, consistency and source-freshness checks |
| Missing / unavailable behaviour | Reject, request correction, manual review or other approved outcome |
| Use | Eligibility, estimate, price, or multiple purposes |
| Declared/actual distinction | How later actual intake measurements remain separate from the quote input |

A browser-supplied value is not authoritative merely because it appears in the customer journey. The server must validate against the approved source and service configuration.

## 5. Model recommendation record

Complete independently for each service only after Sections 2–4 have evidence.

| Criterion | Fixed | Calculated | Hybrid |
|---|---|---|---|
| Operating scope is bounded and predictable | Evidence / gap | N/A | Evidence / gap |
| Cost drivers are measurable and attributable | Evidence / gap | Evidence / gap | Evidence / gap |
| Inputs are available and verifiable before quote acceptance | Evidence / gap | Evidence / gap | Evidence / gap |
| Deterministic calculation or fixed included scope can be specified | Evidence / gap | Evidence / gap | Evidence / gap |
| Missing/unavailable input behaviour is supportable | Evidence / gap | Evidence / gap | Evidence / gap |
| Operational fulfilment can support the offered service | Evidence / gap | Evidence / gap | Evidence / gap |
| Material risks / exclusions | | | |

**Service recommendation:**  
**Evidence references:**  
**Pricing proposal owner:**  
**Operations validation and date:**  
**Finance review and date:**  
**Independent approval and date:**  
**Decision:** Pending / approved / rejected / return for evidence  
**Reason and conditions:**

A recommendation is not an approved model until the required governance approvals are recorded. No requester may self-approve a consequential change where PM-01–PM-12 require separation.

## 6. Rate, arithmetic and charge configuration evidence

Do not enter actual configuration values until the model and cost basis are approved.

| Required decision | Evidence / proposed value | Source owner | Operations validation | Finance review | Independent approval |
|---|---|---|---|---|---|
| Fixed rate and included scope, or approved formula | | | | | |
| Applicable charge components and order | | | | | |
| Minimum charge and application order, if any | | | | | |
| Currency | | | | | |
| Monetary precision / representable unit | | | | | |
| Rounding mode and exact rounding stage | | | | | |
| Intermediate calculation precision | | | | | |
| Tax treatment and authoritative basis/source | | | | | |
| Surcharge treatment | | | | | |
| Discount eligibility, authority and stacking | | | | | |
| Special-handling eligibility and charge, if any | | | | | |
| Other fees and display treatment | | | | | |
| Missing / unavailable input outcome | | | | | |
| Effective-from / effective-until context | | | | | |
| Version, publication, withdrawal and rollback authority | | | | | |

For each approved configuration, attach worked calculations covering representative, boundary, missing-input and invalid-input cases. Show source inputs, units, each calculation step, rounding point, itemized output and total. The worked cases must be derived from approved values, not created to justify a desired price.

## 7. Quote validity and physical handover terms

Complete separately for each service. These are distinct from Standard/Express delivery estimates and Scheduled delivery commitments.

| Term | Proposed operational rule and evidence | Operations owner | Commercial approval |
|---|---|---|---|
| Quote-validity duration | | | |
| Trigger from which validity runs | | | |
| Expiry communication and enforcement | | | |
| Extension availability and authority | | | |
| Physical-handover deadline duration | | | |
| Handover deadline trigger | | | |
| Missed-handover outcome | | | |
| Refused intake / location closure outcome | | | |
| Customer notice and cancellation outcome | | | |
| Any financial consequence and authority | | | |

No generic 24-hour, 48-hour, 7-day or other assumed duration may be inserted.

## 8. DEC-047 operational eligibility — separate gate

This workbook does not classify any combination. Maintain a separate evidence/approval record for each of the twelve combinations:

| Service | Address → Address | Address → PUDO | PUDO → Address | PUDO → PUDO |
|---|---|---|---|---|
| Standard | Pending — unavailable | Pending — unavailable | Pending — unavailable | Pending — unavailable |
| Express | Pending — unavailable | Pending — unavailable | Pending — unavailable | Pending — unavailable |
| Scheduled | Pending — unavailable | Pending — unavailable | Pending — unavailable | Pending — unavailable |

Each eligible or conditional outcome requires current attributable evidence for coverage, required PUDO endpoint actions, an operationally valid system-determined route, requested date/time availability and capacity, and responsible Operations approval. Missing, stale, revoked, conflicting or insufficient evidence fails closed. Pending is not a final not-eligible decision, but it is not permission to quote.

## 9. Shared pricing authority and storefront reconciliation

DEC-019 remains mandatory wherever storefront delivery and independent shipment inputs overlap. Keep product catalogue price (goods) distinct from delivery/shipment charge (logistics service), quote/accepted obligation and payment/settlement.

The current inspected storefront order route validates product prices server-side but sets delivery fee to zero and currency to NGN. That is not a shipment rate or an approved delivery pricing model. Do not change checkout or add placeholder delivery charges as part of this evidence exercise.

The technical design must identify how one approved pricing-rule authority will serve both contexts without making product price and delivery price the same concept, and how existing orders/payments remain historically correct.

## 10. Approval and readiness outcome

For each service, record one outcome:

- **Not assessed:** required evidence has not been submitted.
- **Evidence incomplete:** submitted evidence is insufficient or conflicting.
- **Model proposed:** cost/operating evidence supports a recommendation, but approvals are incomplete.
- **Commercially configured:** model, inputs, rates/arithmetic, governance and quote/handover terms have been approved.
- **Not viable / deferred:** accountable owners have documented why the service is not being activated or is deferred.

These are worksheet outcomes, not application status enums.

A service is not quote-ready solely because it is commercially configured. It must also satisfy its DEC-047 eligibility/operational evidence, approved technical contracts, authorization, quote acceptance and executable acceptance-test requirements. Quote issuance remains unavailable until every independent gate is satisfied.

## 11. Owner review record

| Service | Evidence pack complete | Model approved | Input matrix approved | Rates/arithmetic approved | Quote/handover terms approved | DEC-047 evidence approved | Technical/test gates ready |
|---|---|---|---|---|---|---|---|
| Standard | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| Express | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| Scheduled | Pending | Pending | Pending | Pending | Pending | Pending | Pending |

**No pricing or operating values are approved by this template.**


## 12. Owner-confirmed Standard operating scope and cost-configuration evidence — 2 November 2026

This section records operating facts and configurable-cost requirements supplied or accepted by the owner during the Standard evidence discussion. It is not measured cost evidence, a final activity catalogue, a pricing model, a rate card, a formula, or approval to enable customer quotation.

### 12.1 Standard origin and fulfilment path

- The shipper must select an eligible origin PUDO centre on the website during booking. The selected centre is the centre where the parcel must be presented; a customer cannot independently substitute another centre at intake.
- The selected centre should be close/convenient to the shipper, but the exact proximity ranking and eligibility algorithm remain unspecified.
- If the selected centre becomes unavailable before presentation, Operations may authorise a change to another eligible nearby centre, with customer notification and acceptance. The exact staff authority and technical workflow remain to be specified.
- The shipper physically presents the parcel at the selected centre. All physical verification occurs there. Standard sender-doorstep collection is not part of the currently described operating scope.
- Booking, centre selection, parcel presentation, verification/acceptance and actual physical custody are separate events. Centre selection or booking alone is not receipt.
- Intake verifies the parcel against the online booking, including sender/booking authority, actual weight and dimensions, size/handling classification, permitted contents, packaging/label and destination, and physical condition. Customer-declared and staff-verified values must remain distinguishable; discrepancies are recorded.
- After successful acceptance, staff register and identify the parcel for tracking and place it in the holding/sorting process. Custody is recorded only on actual physical handover and acceptance.

### 12.2 Standard journey scope gathered

The described normal journey includes customer booking and declaration; selected-centre intake and verification; holding and sorting; dispatch preparation; OutPUDO inter-centre transportation; destination OutPUDO intake; either direct recipient collection there or onward transfer to InPUDO; InPUDO intake; and recipient collection or optional InPUDO doorstep delivery.

The owner confirmed destination InPUDO intake checks for count, tracking scan, manifest reconciliation, physical condition/anomaly inspection, discrepancy recording and custody acceptance. Recipient collection at InPUDO includes identity, collection-code/tracking and authority checks, parcel retrieval/inspection, recipient confirmation and actual handover. Doorstep delivery handover is recorded at the recipient's front door with verification; the verification method is not fixed.

OutPUDO direct recipient-collection steps have not yet been fully specified. The OutPUDO/InPUDO network distinction is a working operating model: OutPUDO represents inter-centre federal-road-network movement; InPUDO represents local/urban/state/local/neighbourhood movement. Road class and network type are distinct. Exact route, distance source, units/conversion and routing rules remain unapproved.

### 12.3 Owner-confirmed configurable operational-cost direction

- Each operational activity is to have an independently configurable unit-cost definition.
- Each activity independently declares which variables apply to its cost. A variable used by one activity is not automatically applied to another.
- This is an operational activity-cost model, not a decision that every activity is a separate customer charge. Direct costs, shared/allocated costs, included costs and exception costs must remain distinguishable to avoid double-counting.
- Staff compensation must remain flexible and dynamic. No wage arrangement, compensation method, productivity target, allocation formula or staff authority model has been selected.
- Transportation must accommodate business-owned vehicles, driver-owned vehicles and external transport partners. Driver/partner agreements may support per-trip, distance-based, per-parcel, fixed, time-based, hybrid or negotiated arrangements. These are supported configuration possibilities, not a statement that every method is currently used.
- The owner stated that fuel and vehicle operating expenses are not separately provided to drivers or external transport partners. Whether such costs are embedded in an agreed provider rate, and the treatment of business-owned vehicle costs, require evidence; do not add separate reimbursements by assumption.
- Parcel characteristics must be extensible and include, where operationally necessary, actual weight, dimensions, size, fragility/handling, contents, packaging, quantity and other verified characteristics. No thresholds, bands, volumetric divisor or unit conversion has been approved.
- Customer declarations and actual staff measurements remain separate. If a discrepancy affects eligibility or price, the system must support recalculation with customer acceptance, rejection, or authorised Operations review. No silent overwrite or unaccepted price increase.
- Failed collection/delivery attempts must be recorded as exceptions with evidence and custody truth. Reschedule, retry, hold, return or escalation are configurable possible outcomes; additional customer charges are not automatic.
- Return-to-Sender is a distinct reverse operational journey with its own activity/cost records. Do not assume its cost equals the outbound journey or assign financial responsibility without approved policy.

### 12.4 Candidate activity groups — not a frozen 74-row catalogue

For the initial Standard evidence register, group activities under: booking/declaration; selected-centre intake and verification; physical custody acceptance; holding/storage; sorting; dispatch preparation and handover; OutPUDO movement; destination OutPUDO intake/direct collection/transfer; InPUDO movement and intake; recipient collection; optional doorstep delivery; discrepancy/failed-attempt handling; and Return-to-Sender.

The activity IDs, final activity boundaries, responsible roles, measurement units, cost drivers and whether a cost is direct, shared, included or exceptional must be validated against actual operating records before configuration. A scan, assignment or route event alone is not proof of physical custody transfer.

### 12.5 Evidence still required

The discussion establishes operating scope and desired configurability, not actual costs. Still required: activity-level observation and measurement records; actual staff compensation arrangements and attributable productivity evidence; driver/partner agreements and rate evidence; business-owned vehicle cost treatment; approved measurement units and conversions; activity-specific cost-variable mappings; shared-cost allocation and double-counting controls; exception/return cost accountability; source owners and Operations/Finance validation.

Do not infer numerical rates, currencies, formulas, staff payment methods, provider contract terms, activity thresholds, distance units, volumetric divisors or customer charges from this section.

## 13. Consolidated activity-cost register and evidence requirements — 5 November 2026

This section translates the accepted M2 review package into evidence-collection requirements. It does not approve monetary values, units, formulas, service pricing models or a Firestore schema.

### 13.1 Activity and component register

Reuse ACT-01–ACT-11 from the existing catalogue; do not create a parallel activity taxonomy. ACT-12 remains conditional/inactive until Operations confirms actual or contractually required work. Each activity may have zero, one or multiple cost components depending on evidence. A component is an internal cost description, not automatically a customer charge.

For each activity/component, record or reference:
- stable activity and component identities;
- business purpose, scope, exclusions, trigger and completion;
- responsible function/actor and actual operating arrangement;
- component description and the basis on which the cost is incurred;
- amount and explicit currency only when supplied by attributable evidence;
- applicable activity-specific inputs, with source, source classification, original unit, precision, explicit conversion and missing-value behaviour;
- evidence reference, source owner/type, scope represented and observation period;
- original value/unit/precision, sample/population and measurement method where relevant;
- limitations, exclusions, uncertainty and validation status;
- Operations validation, Finance review, decision actor, date, outcome and reason;
- approved version/effective context where a later authorized process consumes the definition.

A blank or unknown field is an evidence gap, not zero and not permission to infer a default.

### 13.2 Flexible operating arrangements

The register must accommodate evidenced arrangements involving VeriLyft staff, authorized InPUDO personnel, business-owned vehicles, driver-owned vehicles, external transport providers, riders, PUDO partners, shared premises and technology services. Fixed, per-trip, per-parcel, distance-based, time-based, hybrid or negotiated bases are configuration possibilities only; they are not selected defaults. Capture the actual agreement/source before representing a basis as applicable.

### 13.3 Cost treatment and allocation

Distinguish direct, shared, included and exception-related costs. Finance must approve any shared-cost allocation basis before it contributes to a shipment calculation. Do not allocate automatically by parcel count, distance, shipment value or another convenient proxy. Record included costs to prevent duplicate counting, and do not count driver/provider compensation again as separate fuel, vehicle or reimbursement cost unless the agreement/evidence establishes that it is separate.

### 13.4 Journey-specific evidence

Do not assume every parcel incurs both Lagos and Mokola hub costs or a Lagos corridor cost. A local Ibadan journey must not inherit a Lagos corridor cost. PUDO presentation, seller collection, destination PUDO receipt, address delivery, recipient release, failed attempt and RTS are distinct activities/journeys. Failed-attempt or RTS cost does not automatically become a customer surcharge or liability.

**Evidence status:** no actual monetary cost evidence or approved cost-allocation method is supplied by the owner working model. Operations and Finance must populate and validate the evidence register from real records before a service pricing model or rate is selected.
