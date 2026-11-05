# VeriLyft M2 Commercial Pricing and Quotation — Pre-Implementation Review Package

**Status:** Consolidated owner-review package — documentation only; not an implementation authorization  
**Prepared:** 5 November 2026  
**Repository:** `dev-adeshina/small-pudo`  
**Documentation baseline:** PR #138 merge `f1d4f29ed0645145a277af5558b8fbcd8f537b4c`  
**Application-source baseline:** PR #137 merge `55dff8c2a4f4cf6f0e983676e692f0f126f7ec27`; PR #138 is the subsequent SDD reconciliation  
**Owner direction:** Goal 2 pre-implementation approach approved; this package is submitted for one consolidated review  
**Authority:** DEC-019, DEC-026–DEC-029, DEC-036, DEC-038–DEC-049, PM-01–PM-12, BP-01–BP-22, and the existing approved lifecycle, authorization, evidence and technical contracts  
**Related:** `PLATFORM_M2_PRICING_AND_QUOTATION_READINESS_SPECIFICATION.md`; `PLATFORM_M2_COMMERCIAL_PRICING_OWNER_DECISIONS.md`; `PLATFORM_M2_SERVICE_COST_AND_INPUT_EVIDENCE_WORKBOOK.md`; `PLATFORM_OPERATIONAL_ACTIVITY_CATALOGUE_AND_COST_INPUT_DEFINITION.md`; `PLATFORM_OPERATIONAL_ACTIVITY_COST_CONFIGURATION_TECHNICAL_CONTRACT.md`; `PLATFORM_DB01_DB12_TECHNICAL_CONTRACT_AND_ACCEPTANCE_SPECIFICATION.md`; `IMPLEMENTATION_SOURCE_TRACEABILITY.md`; `CURRENT_IMPLEMENTATION_STATUS.md`; `PROGRESS.md`; `ISSUES.md`

---

## 1. Purpose and decision boundary

This package consolidates the pre-implementation work for VeriLyft's commercial pricing and quotation capability into one owner-review checkpoint.

It brings together:

1. Current implementation and source-evidence baseline.
2. Operating-model reconciliation.
3. Flexible activity-based cost register requirements.
4. Cost arrangements, evidence, classification and allocation boundaries.
5. Standard, Express and Scheduled service requirements.
6. Pricing and quotation policy.
7. Governance, authorization and audit requirements.
8. Database, API, persistence, security and integration dependencies.
9. Risks, exception handling, recovery and acceptance requirements.
10. Documentation reconciliation and the proposed implementation sequence.

**This is not a rate card, pricing model, formula, physical schema, API specification, permission change, service activation or code authorization.** It does not approve amounts, rates, units, conversions, currency, rounding, taxes, surcharges, discounts, shared-cost allocation, quote durations, handover deadlines, provider terms or service eligibility.

The objective is to decide whether the requirements and boundaries are sufficiently complete to authorize a later, separately scoped implementation phase. Unknown facts remain explicitly unknown; they must not be filled with placeholders or assumptions.

### 1.1 Review outcome requested

The owner is asked to review this package as a whole and confirm:

- The business and operational scope is correctly represented.
- The flexible activity-cost register is an appropriate requirements baseline.
- The commercial and quotation boundaries preserve accepted decisions.
- The technical direction reuses the existing application rather than creating parallel architecture.
- Outstanding owner, Operations, Finance and technical decisions are accurately recorded.
- The proposed implementation sequence is acceptable as a planning direction.

Approval of this package would approve the requirements baseline and permit preparation of a separately bounded implementation plan. It would **not** automatically approve every unresolved commercial value or make a service quote-ready.

---

## 2. Baseline and evidence quality

### 2.1 Repository baseline

- PR #138 merged the SDD reconciliation on 5 November 2026.
- The application-source baseline remains PR #137 because PR #138 was documentation-only.
- PR #136 and PR #137 provide staff invitation, directory, permission-management and staff-workspace activation foundations.
- PR #138's documentation is the latest merged SDD baseline used for this package.

### 2.2 Verification evidence

The repository's PR #138-era status records owner-reported local test and build results from the preceding application work. The user subsequently reported successful live browser testing. This package treats that browser testing as owner-reported evidence and does not claim to have independently reproduced it.

The precise browser scenario inventory must be retained from the user's test record where available. Do not infer that every invitation, permission lifecycle, approval-separation, operational-cost, provisioning or production scenario was covered merely from the general statement that browser testing succeeded. Only a specifically uncovered scenario should remain an open verification item.

Staff Permission Administrator technical provisioning remains a separate administrative matter. The policy appointment and technical provisioning are distinct. This is not a dependency that should block the M2 commercial requirements review.

### 2.3 Evidence labels

Use these distinctions throughout:

- **Implemented in source:** a code or configuration path is present at the stated source baseline.
- **Owner-reported verification:** a result reported by the owner; not independently reproduced in this review.
- **Documented/accepted policy:** an approved decision or requirement, not proof of runtime implementation.
- **Operational evidence required:** a real operating record, agreement, measurement or accountable Operations validation is still needed.
- **Proposed design:** a candidate for review, not an approved schema, endpoint, permission or workflow.
- **Deferred/unavailable:** intentionally not selected or not enabled.

A passing build, source presence, test outline or documentation merge does not independently prove production or operational readiness.

---

## 3. Existing implementation baseline

### 3.1 Existing foundations to reuse

The current implementation-status and source-traceability documents identify these relevant foundations:

| Capability | Current position | Boundary |
|---|---|---|
| Customer storefront and order/payment flow | Implemented in the existing application | Storefront order is not an independent shipment booking |
| Customer shipment drafts | Implemented | Draft preparation only; not a quote or confirmed booking |
| Internal quote-lineage/version persistence | Implemented as a foundation | Does not issue customer quotes or accept them |
| Internal operational activity-cost definitions | Implemented | Internal configuration; not customer pricing |
| Cost components and applicable inputs | Present in the current implementation-status baseline | Exact field-level capability must be reconciled against current source before implementation |
| Version history and separated review workflow | Implemented | Approval does not publish customer pricing or activate operations |
| Staff-facing operational-cost interface | Implemented | Uses existing APIs, persistence and permissions |
| Shared customer pricing calculation | Not established as implemented | Required for overlapping storefront delivery and independent shipment inputs |
| Shipment cost consumption/calculation | Not established as implemented | Approved definitions are not automatically applied to a shipment |
| Customer-facing quote calculation and issuance | Not implemented | Must remain unavailable until all gates pass |
| Exact-version customer quote acceptance | Not implemented | Must remain unavailable until all gates pass |
| Confirmed independent booking and physical shipment lifecycle | Incomplete | Booking, payment, intake, custody and movement are separate |

### 3.2 Source-document reconciliation issue

The operational-cost technical contract contains a bounded source review from an earlier implementation checkpoint and describes gaps in cost-component persistence and applicability. The later current implementation-status document describes cost components/inputs and the staff interface as implemented.

The later status document and current source must take precedence over older checkpoint wording. Before any code change, refresh the traceability against the current source and record exactly which structured cost fields, component rules, evidence fields and applicability constraints exist. Do not assume that every proposed register attribute is already persisted, and do not create duplicate structures merely because an older contract describes an earlier gap.

### 3.3 Existing workflow and permissions

The existing internal cost-definition governance separates:

1. Proposal.
2. Operations validation.
3. Finance review.
4. Independent approval.

Existing action permissions include:

- `operational_cost_definition.view`
- `operational_cost_definition.propose`
- `operational_cost_definition.validate`
- `operational_cost_definition.finance_review`
- `operational_cost_definition.approve`

Reuse this workflow and the current server-side authorization/audit architecture where responsibilities match. Do not create a parallel cost-definition workflow.

Approval of an internal cost definition is not approval to publish a customer-facing pricing rule, issue a quote, activate a service or authorize a physical operation.

---

## 4. Operating-model reconciliation

### 4.1 Operating promise

The owner-provided October 2026 working model describes a logistics operation in which each parcel must have:

- A unique shipment identity and status history.
- A clear destination and route/receiving point.
- A named accountable owner at each handover.
- A next action/deadline and supporting evidence.
- A single operational source of truth.

No parcel should move on memory, verbal assurance or an unverified chat. Every handover must reconcile the physical parcel with its digital record.

The model is an internal working direction, not proof that every proposed route, partner, dispatch window or location is operationally approved.

### 4.2 Two-HQ arrangement

The working model describes:

- Lagos Control HQ for network coordination, access/database oversight, customer care and dispute escalation, partnerships, finance and payment reconciliation.
- Mokola Backup HQ for Ibadan sorting/local dispatch, corridor handoffs, regional support, daily parcel reconciliation and continuity backup.

The design should support accountable functions and resilient operations without hard-coding the two-HQ arrangement into a customer price formula or assuming every shipment incurs both HQs' costs.

### 4.3 Proposed corridor and schedule

Vehicle A and Vehicle B corridor loops, the Idumota-to-Berger consolidation target, Ibadan dispatch waves and the evening InPUDO sweep are planning proposals.

Before they can support public commitments or commercial calculations, Operations must validate:

- Stop sequence and route feasibility.
- Actual journey times and variability.
- Road, safety and vehicle constraints.
- Capacity and partner readiness.
- Cutoffs, operating hours and handover responsibilities.
- Which service and journey types use each route.

Do not turn proposed routes or time windows into guaranteed ETAs, approved distance bands, default pricing inputs or universal cost allocations.

### 4.4 Parcel flow and physical truth

The working model describes booking, collection where applicable, consolidation, manifest preparation, transport, destination receipt, release and closure.

The digital lifecycle must preserve the distinction between:

- Booking and payment.
- Collection/receipt and physical possession.
- Sorting and manifest assignment.
- Dispatch, journey and arrival.
- Actual custody transfer.
- Recipient collection or delivery.
- Proof and reconciliation.

A route assignment, departure, arrival, attempted handover or status update does not prove a completed custody transfer. Custody changes only when physical possession actually changes and the required evidence is recorded, consistent with DEC-044 and the existing activity catalogue.

### 4.5 Service-scope boundary

The existing Standard evidence workbook describes Standard origin intake at the selected PUDO centre and excludes Standard sender-doorstep collection from the currently described scope.

The newer working model also mentions Lite Errands, seller collection, hub consolidation and other collection/support arrangements. These must not silently be merged into Standard. Operations must identify whether each is:

- Part of a defined launch service;
- A separately selectable service or option;
- An internal activity supporting another service; or
- A proposed activity not yet performed.

Only confirmed activities should be configured. ACT-12 remains conditional and inactive until Operations confirms that the relevant work is actually performed or contractually required.

---

## 5. Activity-based cost register requirements

### 5.1 Reuse the accepted activity catalogue

Reuse the owner-reviewed ACT-01–ACT-11 activity families. Do not rename or repurpose the activity identifiers without an explicit catalogue reconciliation.

| Activity | Owner-confirmed activity family | Cost-evidence examples to investigate |
|---|---|---|
| ACT-01 | Origin PUDO presentation and receipt | Verified partner/staff receipt handling arrangement |
| ACT-02 | Parcel verification and measurement at origin PUDO | Staff effort, measurement equipment and maintenance |
| ACT-03 | Origin PUDO custody acceptance | Authorized staff/partner handling arrangement |
| ACT-04 | Transport/movement between operational points | Driver/provider arrangements, trip records, vehicle operating evidence |
| ACT-05 | Destination PUDO receipt/custody acceptance | Verified destination partner/staff handling arrangement |
| ACT-06 | Delivery to an address/recipient handover | Rider/driver/provider arrangement and delivery operating evidence |
| ACT-07 | Collection/release to an authorized collector | Verified PUDO/staff release handling arrangement |
| ACT-08 | Failed collection or delivery attempt | Evidenced additional operational effort and communication costs, if any |
| ACT-09 | Return-to-Sender journey | Reverse transport and handling evidence |
| ACT-10 | Exception review and resolution | Investigation, communication and resolution effort |
| ACT-11 | Origin PUDO substitution handling | Administrative and operational handling evidence |
| ACT-12 | Other support, administration, packaging, storage or handling work | Conditional/inactive until Operations confirms existence, scope and trigger |

These are candidate evidence categories, not approved charge components. A cost definition may contain no monetary component, one component or multiple components depending on evidence.

### 5.2 Minimum descriptive register information

For each activity/cost component, the requirements should capture or reference:

| Information | Requirement |
|---|---|
| Activity identity | Stable catalogue reference and human-readable name |
| Business purpose | Why the activity exists |
| Scope and exclusions | Work included and excluded |
| Trigger and completion | What starts and completes the activity |
| Responsible function/actor | Who performs or owns it |
| Component identity | What specific cost is being described |
| Description | What the component covers |
| Arrangement | Staff, business-owned asset, driver-owned asset, partner, supplier or other evidenced arrangement |
| Amount and currency | Explicit when a monetary value is supplied; never assume a default |
| Basis | Flexible description of how the cost is incurred |
| Applicable inputs | Only inputs necessary for that activity |
| Evidence reference/source | Agreement, invoice, receipt, measured record, staff record or other attributable source |
| Source owner | Accountable person/function |
| Evidence period | Date/period to which the source applies |
| Operating scope | Service, journey, area, route or arrangement represented, only where supported |
| Cost treatment | Direct, shared, included or exception-related, subject to Finance review |
| Review state | Draft, Operations validation, Finance review, independent approval, rejection or other existing controlled state |
| Version/effective context | Preserve immutable history and the version used by a later authorized process |

This is a requirements-level register, not a proposed Firestore document shape. First map these concepts to existing fields and versioned records. Only genuinely missing requirements should be considered for a minimal technical extension.

### 5.3 Flexible cost arrangements

The framework must accommodate changing operating arrangements without selecting a permanent wage or supplier model.

Examples include:

- VeriLyft-employed personnel.
- Registered and authorized InPUDO personnel.
- Business-owned vehicles.
- Driver-owned vehicles.
- External transport providers.
- Contracted rider or last-mile providers.
- Shared premises, hub resources and technology services.

Possible contractual bases such as fixed, per-trip, per-parcel, distance-based, time-based, hybrid or negotiated may be represented where supported by actual agreements. These are configuration possibilities, not selected defaults or approved formulas.

The same activity may have different evidence-backed cost definitions for different arrangements. Do not add new personnel categories, location identifiers or payment models without validating the existing domain contracts.

### 5.4 Cost treatment and double-count prevention

The register should distinguish:

- **Direct:** attributable to a specific activity or service event.
- **Shared:** supports more than one activity/service and requires a separately approved allocation method before it can contribute to a calculated shipment cost.
- **Included:** already covered by another agreement or component; retain evidence to prevent duplicate inclusion.
- **Exception-related:** arises from a validated exception or reverse activity; responsibility and recoverability are separate decisions.

These labels do not themselves approve accounting recognition, a customer charge or liability.

Shared costs may include premises, utilities, general operations staffing, shared vehicle ownership/maintenance, technology, customer support and network coordination. Do not divide them automatically by parcel count, distance, shipment value or any other convenient proxy. Finance must approve an evidence-backed allocation basis before such costs enter a shipment calculation.

A driver/provider payment must not be double-counted with fuel, vehicle or reimbursement components already included in the recorded arrangement.

### 5.5 Cost evidence pack

For every evidence item, capture:

- Stable evidence reference.
- Source owner and source type.
- Service, activity and journey scope represented.
- Observation period.
- Original amount/value and original unit/precision where applicable.
- Currency where monetary.
- Sample size/population and measurement method where relevant.
- Limitations, exclusions and uncertainty.
- Operations reviewer and validation outcome.
- Finance reviewer and approval outcome.
- Decision date and reason.

Preserve the original source value and unit. Record a proposed conversion separately with rationale, method, precision and approving authority. Never silently convert units or invent missing values.

### 5.6 Evidence required before populating monetary values

The current operating model provides activity and responsibility direction, not actual monetary cost evidence. The following remain evidence-required:

- Staff compensation and work-allocation arrangements.
- InPUDO partner agreements and verified service-event charges.
- Transport-provider/driver agreements and trip evidence.
- Business-owned vehicle fuel, maintenance and operating records.
- Hub premises, utilities and staffing costs.
- Rider/last-mile agreements and delivery-event records.
- Customer support/communications expenses.
- Technology hosting/software/communications bills.
- Actual service volumes and activity occurrence records.

A blank field is an explicit evidence gap, not a zero-cost assumption.

---

## 6. Service and journey mapping

### 6.1 Services remain distinct

Standard, Express and Scheduled are the approved customer-facing launch service names. Each requires its own operational and commercial evidence.

| Service | Accepted customer-facing meaning | Current pricing status |
|---|---|---|
| Standard | Regular delivery within the normal service timeframe; journey-specific estimate | Model and actual configuration unapproved |
| Express | Priority handling; shorter estimate than Standard for the same comparable eligible journey | Model, incremental costs and capacity evidence unapproved |
| Scheduled | Delivery on a selected available date/time window | Model, capacity, reservation and operating rules unapproved |

No model may be copied from one service to another by analogy.

### 6.2 Activity applicability follows the actual journey

The activity-cost mapping must be conditional on the actual approved journey. It must not attach every activity to every shipment.

Examples:

- A local shipment must not automatically inherit an inter-city corridor transport cost.
- An origin PUDO presentation differs from seller collection.
- A destination PUDO receipt differs from doorstep delivery.
- Recipient collection does not automatically incur address-delivery cost.
- A failed attempt or RTS journey is not an automatic surcharge.
- An activity-cost definition does not prove that a selected PUDO location can perform the activity.

### 6.3 Service/endpoint eligibility remains an independent hard gate

DEC-047's twelve service/endpoint combinations remain pending verification and unavailable by default:

| Service | Address → Address | Address → PUDO | PUDO → Address | PUDO → PUDO |
|---|---|---|---|---|
| Standard | Pending — unavailable | Pending — unavailable | Pending — unavailable | Pending — unavailable |
| Express | Pending — unavailable | Pending — unavailable | Pending — unavailable | Pending — unavailable |
| Scheduled | Pending — unavailable | Pending — unavailable | Pending — unavailable | Pending — unavailable |

Each combination requires current evidence for service/action eligibility, origin/destination coverage, active PUDO capabilities, valid system-determined route, operating availability/capacity and Operations approval. Missing, stale, revoked, conflicting or insufficient evidence fails closed.

The absence of verified PUDO inventory and accountable Operations ownership is a separate capability gate. Do not create an invented PUDO registry or assume the two-HQ model supplies an authoritative location inventory.

---

## 7. Commercial pricing requirements

### 7.1 Accepted policy to preserve

- DEC-019 requires one shared pricing-rule authority for storefront delivery and independent shipment pricing wherever their inputs overlap.
- Each service uses an explicitly approved service-specific fixed, calculated or hybrid model. No model has been selected for Standard, Express or Scheduled.
- Only minimum necessary inputs are used for each service.
- Each input requires an approved authoritative source, source/actor classification, unit, precision, explicit permitted conversion, validation and missing/unavailable behaviour.
- The trusted server validates inputs and calculates the authoritative amount. Browser-submitted totals are not authoritative.
- Staff-assisted pricing uses the same approved rule authority.
- Applicable charge components and totals are disclosed.
- Taxes, surcharges, discounts and other fees must have explicit treatment; none is silently presumed zero or silently added.
- Issued and accepted quote context is historically reconstructable. Later pricing changes do not rewrite historical quotes or completed payments.
- Product catalogue price remains distinct from logistics/shipment price.

### 7.2 Unresolved commercial decisions

| Decision | Status |
|---|---|
| Standard pricing model | Not selected |
| Express pricing model | Not selected |
| Scheduled pricing model | Not selected |
| Actual rates and formulas | Evidence and approval required |
| Required/optional/conditional input mapping | Service-specific approval required |
| Trusted source for each input | Approval required |
| Units, precision and permitted conversions | Not approved |
| Currency | Not approved for independent shipment quotes |
| Monetary precision and rounding | Not approved |
| Tax treatment | Not approved |
| Surcharges, discounts and other fees | Not approved |
| Minimum charges and special handling | Not approved |
| Shared-cost allocation | Not approved |
| Margin/business return | Requires explicit business decision |
| Effective dates, publication and rollback authority | Requires governance specification |

Do not infer NGN from the existing storefront payment implementation. Do not copy competitor rates, assume industry-standard formulas, use guessed values or insert zero placeholders.

### 7.3 Input classification

For each service, a separate matrix must identify each candidate input as required, optional, conditional or unused, and specify:

- Source and accountable source owner.
- Whether customer-declared, system-derived, staff-recorded or physically measured.
- Accepted unit and precision.
- Explicit conversion, if permitted.
- Validation and out-of-range behaviour.
- Missing/unavailable behaviour.
- Whether it supports eligibility, estimation, pricing or more than one.
- How declared values remain distinct from later actual measurements.

Weight, dimensions, volumetric weight, distance, route, service class, minimum charges, special handling and Scheduled date/time are candidates only. No universal input set is assumed.

---

## 8. Quotation and booking boundaries

### 8.1 Lifecycle separation

Preserve the sequence and distinct facts:

**Draft preparation → Quote issuance → Exact-version acceptance → Confirmed booking → Payment → Physical intake → Custody → Movement/fulfilment.**

The following are not interchangeable:

- A shipment draft is not a quote.
- A quote is not a confirmed booking.
- Quote acceptance is not payment.
- Payment is not physical intake.
- Booking confirmation does not create physical custody.
- Dispatch or arrival does not establish a completed custody transfer.

### 8.2 Accepted minimum-launch commercial unit

DEC-048/DEC-049 establish:

- One parcel per independent booking for minimum launch.
- One itemized quote and one quote lineage per independent booking.
- Immutable issued quote versions.
- One current offer version.
- Exact-version acceptance by the authenticated booking party.
- Acceptance binds the exact accepted commercial snapshot to one confirmed booking.
- Multi-parcel bookings, parcel splitting/merging and cross-obligation allocation remain deferred.

The physical parcel is created only when authorized intake accepts actual possession. Quote acceptance alone creates no parcel, payment, intake, custody, route or dispatch side effect.

### 8.3 Quote content and preservation

Conceptually preserve:

- Selected service and eligibility decision context.
- Origin/destination and system-determined journey context.
- Inputs and their source/unit context.
- Pricing model and rule/rate version.
- Itemized charge components and calculation context.
- Total and currency.
- Precision/rounding result.
- Tax, surcharge, discount and fee treatment.
- Issue time and validity end.
- Separate physical-handover deadline.
- Authenticated booking-party acceptance/rejection and exact version acted upon.

This is a preservation requirement, not an approved field list or physical schema.

### 8.4 Quote validity and handover deadline

Quote validity and physical-handover deadline are distinct service-specific terms, both communicated before acceptance.

Still unresolved for each service:

- Validity duration and trigger.
- Handover deadline duration and trigger.
- Expiry communication and enforcement.
- Extension authority.
- Missed-handover and refused-intake outcomes.
- Revised-quote conditions.
- Customer-facing terms.

Do not use delivery estimates or Scheduled delivery windows as quote validity or handover deadlines. No numerical duration is approved.

### 8.5 Measurement discrepancy and adjustments

Preserve declared quote-time values and later actual intake measurements separately. A discrepancy does not silently overwrite the original input or automatically increase price.

A proposed adjustment must preserve the original quote/agreement, changed facts, reason and revised amount. Any required review and explicit customer consent precede a binding price change. Acceptance of an adjustment is not proof of additional payment or settlement.

---

## 9. Governance, authority and audit

### 9.1 Internal activity-cost governance

Retain the existing separated workflow:

**Proposal → Operations validation → Finance review → Independent approval.**

The proposer must not validate or approve their own proposal where the existing policy prohibits it. The workflow must preserve immutable decision history, version lineage, actor identity, permission checks and rejection/revision outcomes.

### 9.2 Customer pricing-rule governance

Approval of an internal activity-cost definition does not publish a customer pricing rule. The commercial pricing authority requires explicit governance covering:

- Accountable pricing-rule owner.
- Proposal, Operations validation, Finance review and independent approval.
- Service and journey scope.
- Inputs, sources and charge components.
- Effective-from/effective-until context.
- Version and activation/publication authority.
- Urgent correction, withdrawal and rollback.
- Future quote recalculation rules.
- Preservation of issued and accepted quotes.
- Audit history for proposal, review, approval, publication and supersession.

Named authorities, thresholds, assignment mechanics and publication details remain open where not already established by approved policy.

### 9.3 Staff and location authorization

Staff action permission and location/service/action capability are separate checks. A staff member's permission does not make a location eligible. A location's capability does not grant an individual staff member authority.

Use existing Firebase Auth, Firebase Admin, server-side authorization, audit and default-deny patterns. Do not introduce new permission identifiers or location capabilities without an approved technical contract.

---

## 10. Technical design and dependencies

### 10.1 Architecture direction

Reuse the existing:

- Next.js App Router and TypeScript structure.
- Firebase Authentication and Firebase Admin authorization.
- Firestore persistence and transaction patterns.
- Versioned operational-cost definition and review workflow.
- Shipment draft workspace.
- Quote-lineage and immutable-version persistence foundation.
- Existing staff UI, services, types, validation and testing conventions.

Do not create a second cost-definition system, parallel pricing authority, duplicate quote store, invented location registry, generalized payment ledger or unrelated workflow engine.

### 10.2 Capabilities requiring design/implementation

| Capability | Required work |
|---|---|
| Cost-definition reconciliation | Confirm current structured component/input/evidence capabilities and map the register to existing records |
| Shared pricing authority | Define one approved authority for overlapping storefront delivery and independent shipment pricing |
| Cost consumption | Define how approved activity definitions are referenced by a later authorized costing/pricing process |
| Service configuration | Define independent Standard/Express/Scheduled configurations only after evidence and approval |
| Trusted input validation | Define authoritative source, units, precision, conversions and failure behaviour |
| Server-side calculation | Define authoritative arithmetic only after model/rates/arithmetic approval |
| Quote issuance | Define customer-visible itemized offer and immutable snapshot |
| Quote acceptance | Define exact-version, authenticated booking-party acceptance and idempotent booking confirmation |
| Eligibility | Integrate only with an approved PUDO capability/eligibility authority |
| Payment | Keep shipment payment design distinct from storefront order payment; resolve DB-06/DB-11 first |
| Intake/custody | Preserve physical possession and evidence requirements |
| Storefront integration | Share pricing authority only where inputs overlap; do not turn every storefront order into a shipment |

### 10.3 Database and technical contract dependencies

- **DB-01/DB-02/DB-05:** DEC-048/049 establish logical minimum-launch booking, parcel and quote boundaries. PR #117 approved a bounded physical design and PR #118 implemented internal quote-lineage/version persistence. Customer issuance/acceptance remains gated.
- **DB-03:** route-leg and movement relationships remain open.
- **DB-04:** storefront order-to-logistics fulfilment relationship remains open.
- **DB-06:** payment purpose/allocation and partial/failure/refund cases require Finance rules.
- **DB-07/DB-08:** identity, party relationship, business authority and delegation evidence remain required.
- **DB-09:** location, service, action, capacity and accountable operator capability remain unresolved.
- **DB-10:** evidence, correction, review, retention and disclosure contracts remain required.
- **DB-11:** financial-event linkage and reconciliation remain open.
- **DB-12:** notification, consent, delivery and failure-handling contracts remain required.

No physical schema, field, collection, index, endpoint, payload, status enum or permission should be invented in this review package. A source-aligned physical/API/security design review must precede implementation of any still-open contract.

---

## 11. Risk, exception and recovery controls

| Risk | Required behaviour |
|---|---|
| Missing/stale/revoked cost definition | Reject or block use; never silently substitute |
| Pricing-rule change after quote | Preserve immutable issued/accepted context |
| Unknown or unavailable required input | Fail safely; do not guess |
| Unit or precision mismatch | Reject or require an explicitly approved conversion |
| Declared/actual measurement discrepancy | Preserve both values; hold/review/consent as required |
| Duplicate/included cost component | Prevent double counting with evidence |
| Shared-cost allocation unsupported | Keep out of calculated shipment cost |
| Unauthorized actor or booking party | Deny server-side |
| Ineligible service/endpoint | Fail closed |
| Stale/superseded quote acceptance | Reject |
| Concurrent/replayed acceptance | Idempotent outcome; no duplicate booking |
| Payment success/local update failure | Reconciliation and recovery; no false settlement state |
| Failed physical handover | Preserve last confirmed custody |
| Missing/damaged/misrouted parcel | Evidence-preserving incident and accountable owner |
| Failed delivery/RTS | Separate exception/reverse journey; no automatic fee or liability |
| Notification failure | Preserve business-event truth independently of message delivery |

Original facts must not be silently overwritten or deleted. Corrections must be attributable and preserve history. Financial responsibility, compensation, refund and customer-charge decisions must follow separate approved authority and evidence.

---

## 12. Acceptance and verification plan

The implementation plan must convert these requirements into executable cases before code begins.

### 12.1 Cost configuration and governance

- Authorized proposal, validation, Finance review and independent approval.
- Proposer self-review/self-approval rejection.
- Permission expiry, revocation and unauthorized-action denial.
- Required evidence, amount, currency and basis validation.
- Immutable versions and expected-version conflict protection.
- Rejection, revision and approval history.
- No publication or customer-price activation from internal cost approval alone.

### 12.2 Cost and pricing

- Only approved activity definitions and service inputs are used.
- Service-specific configurations remain isolated.
- Unknown required inputs fail safely.
- Trusted server-side values are used.
- Explicit unit/precision/conversion rules are enforced.
- Approved monetary arithmetic and rounding are exact.
- Direct/shared/included/exception treatment is respected.
- Shared costs are excluded until approved allocation exists.
- Duplicate/included components are not counted twice.
- Historical quotes are not rewritten by later cost/rate revisions.

### 12.3 Quote and booking

- Only eligible service/endpoint combinations can proceed.
- Quote itemization and total match approved configuration.
- Exact issued version is preserved and accepted.
- Expired, superseded and stale quotes cannot be accepted.
- Only the authenticated booking party can accept.
- Concurrent and replayed acceptance cannot create duplicate bookings.
- Quote acceptance confirms the commercial booking only.
- No parcel or custody is created before authorized physical intake.

### 12.4 Security, integration and recovery

- Unauthorized server/API requests are rejected.
- Firestore direct-client access remains consistent with the approved server boundary.
- Storefront delivery and independent shipment pricing use the shared authority where inputs overlap.
- Product prices remain distinct from logistics charges.
- Existing customer authentication, orders, payments and staff workflows remain regression-safe.
- Recovery covers interrupted transactions, duplicate events and provider/local-state disagreement.

### 12.5 Verification layers

The eventual implementation plan must include relevant unit tests, Firestore Emulator tests, API integration tests, authorization tests, concurrency/replay tests, recovery tests, TypeScript, lint, production build, diff checks and controlled browser scenarios.

A passing build or test suite does not by itself establish operational readiness, service eligibility or production launch approval. DEC-036 P0/Conditional P0 release evidence remains an independent release gate.

---

## 13. Outstanding decisions and evidence register

The following items are not silently resolved by this package.

| ID | Outstanding item | Accountable source/decision | Blocks |
|---|---|---|---|
| O-01 | Validate ACT-01–ACT-11 execution, scope, triggers, completion evidence and responsible roles | Operations | Final activity-to-cost mapping |
| O-02 | Confirm ACT-12 existence/scope or keep inactive | Operations | Any ACT-12 definition |
| O-03 | Resolve Standard scope boundary for seller collection, Lite Errands, consolidation and other support arrangements | Owner + Operations | Service/activity mapping |
| O-04 | Supply attributable staff, partner, vehicle, hub, rider, support and technology cost evidence | Operations + Finance | Monetary cost register |
| O-05 | Validate cost-component basis, evidence source, period and applicability | Operations + Finance | Cost-definition approval |
| O-06 | Approve direct/shared/included/exception treatment and any shared allocation method | Finance | Cost consumption |
| O-07 | Select a pricing model independently for Standard, Express and Scheduled | Owner, informed by Operations/Finance evidence | Service pricing configuration |
| O-08 | Approve minimum necessary inputs and authoritative source/unit/precision/conversion/failure rules per service | Owner + Operations + Finance | Trusted pricing calculation |
| O-09 | Approve rates, formulas, currency, monetary precision, rounding, tax, surcharge, discount, minimum and fee treatment | Owner + Finance | Customer pricing |
| O-10 | Approve pricing-rule ownership, thresholds, effective dates, publication, correction and rollback authority | Owner + Operations + Finance | Pricing-rule activation |
| O-11 | Approve quote-validity and separate handover-deadline durations, triggers and missed-deadline outcomes per service | Owner + Operations | Quote issuance |
| O-12 | Resolve actual PUDO inventory, capability, accountable Operations ownership and twelve DEC-047 outcomes | Operations | Quote eligibility |
| O-13 | Complete remaining DB-03, DB-04, DB-06–DB-12 technical/business contracts | Relevant domain owners + Finance + Operations | Later fulfilment/payment/notification capabilities |
| O-14 | Reconcile current operational-cost source fields and traceability against the post-PR #137 application source | Engineering | Safe physical implementation design |
| O-15 | Complete executable acceptance cases and DEC-036 release evidence | Engineering + accountable reviewers | Implementation/release gates |

### 13.1 Explicitly deferred or unavailable

- Multi-parcel independent bookings and cross-parcel/cross-obligation allocation.
- Any unapproved Standard/Express/Scheduled pricing model or rate.
- All twelve DEC-047 service/endpoint combinations until independently evidenced and approved.
- Customer-facing quote issuance and acceptance until all commercial, eligibility, authorization, technical and test prerequisites are satisfied.
- Physical intake, custody, dispatch and delivery capabilities until their separate contracts and operational evidence are approved.
- ACT-12 until Operations confirms it is performed or contractually required.
- Any guessed location-specific cost scope, route, price, currency, unit, formula, conversion or duration.

---

## 14. Proposed implementation sequence after review approval

This sequence is a planning proposal only. It does not authorize a combined implementation or waive per-stage readiness.

| Stage | Focus | Exit condition |
|---|---|---|
| 0 | Source and SDD reconciliation | Current source, existing cost fields, workflow, quote persistence and traceability are aligned |
| 1 | Minimal activity-cost register/configuration refinement, only if needed | Existing model is reused; required evidence and scope are represented without duplicate architecture |
| 2 | Shared pricing-rule authority design/implementation | One authoritative source for overlapping storefront and shipment pricing inputs |
| 3 | Service-specific pricing configuration | A service has approved scope, model, inputs, rates and governance |
| 4 | Trusted server-side calculation | Arithmetic, input validation and failure behaviour are approved and tested |
| 5 | Quote issuance and immutable snapshot | Quote terms, validity, handover deadline, eligibility and itemization are approved |
| 6 | Exact-version acceptance and booking confirmation | Party authority, idempotency, concurrency, DB contracts and no-custody side effects are verified |
| 7 | Separate payment/intake/fulfilment slices | Their own Finance, Operations, custody, route and release gates are satisfied |

Each stage requires its own bounded scope, source review, tests, PR and owner review. Do not implement a downstream capability merely because an earlier stage is complete.

---

## 15. Documentation reconciliation plan

This package is the single review entry point. Existing specialist documents remain the detailed authority for their respective contracts until the owner approves reconciliation changes.

After this review, reconcile only the relevant existing documents:

1. `PLATFORM_M2_PRICING_AND_QUOTATION_READINESS_SPECIFICATION.md` — align service and quote readiness status with the accepted review.
2. `PLATFORM_M2_COMMERCIAL_PRICING_OWNER_DECISIONS.md` and decision register — preserve DEC-048 and record only genuinely new owner decisions.
3. `PLATFORM_M2_SERVICE_COST_AND_INPUT_EVIDENCE_WORKBOOK.md` — add the flexible activity register and evidence fields without filling unknown amounts.
4. `PLATFORM_OPERATIONAL_ACTIVITY_CATALOGUE_AND_COST_INPUT_DEFINITION.md` — preserve ACT-01–ACT-12 scope and Operations validation boundary.
5. `PLATFORM_OPERATIONAL_ACTIVITY_COST_CONFIGURATION_TECHNICAL_CONTRACT.md` — reconcile against the current implementation and this requirements package; remove stale source-baseline descriptions only with source evidence.
6. `PLATFORM_DB01_DB12_TECHNICAL_CONTRACT_AND_ACCEPTANCE_SPECIFICATION.md` — preserve accepted DEC-049 logical rules and mark unresolved physical/relationship contracts accurately.
7. `IMPLEMENTATION_SOURCE_TRACEABILITY.md` — refresh the relevant source paths against the current application baseline.
8. `CURRENT_IMPLEMENTATION_STATUS.md`, `PROGRESS.md` and `ISSUES.md` — align next steps, verification evidence, capability gates and outstanding decisions.
9. Add a handoff note only if needed for continuity; do not create duplicate status authorities.

Documentation changes must not rewrite historical decision records or misrepresent owner-reported tests as independently reproduced evidence.

---

## 16. Final review checklist

The consolidated review is complete only when the owner can answer the following:

- [ ] Operating-model boundaries and service scope are accurately represented.
- [ ] ACT-01–ACT-11 reuse and ACT-12 conditional status are preserved.
- [ ] Flexible cost arrangements and evidence requirements are sufficient.
- [ ] Direct/shared/included/exception classifications and double-count controls are clear.
- [ ] Standard, Express and Scheduled remain distinct.
- [ ] DEC-048/DEC-049 and all other accepted decisions are preserved.
- [ ] No pricing model, amount, formula, currency, unit, conversion, fee or duration has been invented.
- [ ] Quote, booking, payment, parcel, intake and custody boundaries are correct.
- [ ] DEC-047 and the independent PUDO capability gate remain intact.
- [ ] Governance, authorization and audit boundaries are sufficient.
- [ ] Technical design reuses the existing application and avoids duplicate architecture.
- [ ] DB-01–DB-12 dependencies and unresolved items are visible.
- [ ] Risks, exception handling, concurrency and recovery requirements are testable.
- [ ] The proposed implementation sequence is acceptable.
- [ ] Documentation reconciliation and traceability work are understood.

### Review decision

**Owner decision:** Pending review of this consolidated package.

**If approved:** the requirements baseline may be reconciled into the specialist SDD documents and a separately bounded implementation plan may be prepared. Each implementation slice remains subject to its own readiness and approval.

**If changes are requested:** record them against the relevant section and update this package before declaring Goal 2 complete.

**No application-code changes, database migrations, APIs, permissions, pricing activation or customer quote issuance are authorized by this document.**
