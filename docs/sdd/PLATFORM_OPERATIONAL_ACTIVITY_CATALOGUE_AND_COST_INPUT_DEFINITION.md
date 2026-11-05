# Operational Activity Catalogue and Cost Input Definition

**Status:** Owner-reviewed activity catalogue and owner-confirmed workflow requirements; pending independent Operations validation, Finance review and evidence collection. This is not a cost policy, rate card, pricing model, schema or service-activation authorization.  
**Prepared:** 2 November 2026  
**Applies to:** VeriLyft independent shipment operations and internal operational-cost definition foundation.  
**Authority:** DEC-018, DEC-019, DEC-022–DEC-025, DEC-038–DEC-049; PM-01–PM-12; PR #121–#122; `PLATFORM_M2_SERVICE_COST_AND_INPUT_EVIDENCE_WORKBOOK.md`; `PLATFORM_OPERATIONAL_COST_DEFINITION_APPROVAL_FOUNDATION.md`.  
**Related:** `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`, `PLATFORM_M2_PRICING_AND_QUOTATION_READINESS_SPECIFICATION.md`.

## 1. Purpose

Define a controlled way to identify operational activities and the information that may be needed to describe their costs. The catalogue is intended to guide the next internal activity-cost configuration contract while preserving the boundary between operational facts, cost evidence, customer pricing and business margin.

The owner has reviewed and accepted the twelve activity families as the working VeriLyft operational catalogue and confirmed the workflow requirements recorded in Section 4A. These are owner-confirmed product/operating requirements from the 2 November 2026 discussion; they are not represented as independently verified Operations procedures, observed operating records or Finance-approved cost evidence. The catalogue does not approve cost amounts, units, formulas, allocation methods, staff compensation, provider terms, service eligibility or customer charges. ACT-12 remains conditional and inactive until Operations confirms that the relevant service is actually provided.

## 2. Authority and non-negotiable boundaries

1. Each accepted operational activity is to have its own independently configurable unit-cost definition and declare its own applicable variables. The twelve working activity families are owner-confirmed; stable implementation identifiers, activity-to-input mappings, units and source definitions still require validation.
2. Staff compensation remains flexible and undecided. No wage model, productivity target, time standard, per-task payment, allocation formula or payroll execution is approved.
3. The recorded transport arrangements are business-owned vehicles, driver-owned vehicles and external partners. The agreement/payment method may be configurable (including per-trip, distance, per-parcel, fixed, time-based, hybrid or negotiated arrangements), but no arrangement is selected as the default and no provider agreement or rate is approved.
4. Under the described arrangement, no separate fuel/vehicle operating-expense reimbursement is added to driver-owned-vehicle driver charges or external-partner charges. Business-owned vehicle treatment remains open. This statement must not be generalized beyond the recorded arrangement.
5. Parcel characteristics must be extensible. Weight and dimensions are candidate characteristics; no mandatory set, unit, precision, threshold, dimensional divisor, conversion or band is approved.
6. Customer-declared parcel information and staff-verified/physically measured information must remain distinct. A later actual measurement must not silently overwrite the declaration or the values used in an earlier quote.
7. A material discrepancy must follow an approved outcome such as customer acceptance, rejection or Operations review. No automatic price increase or silent re-quotation is authorized.
8. Failed collection/delivery attempts and Return-to-Sender (RTS) are separately recorded operational exceptions/journeys. No automatic customer charge or assumed financial liability is approved.
9. A custody transfer is complete only when physical possession actually changes and the required evidence is recorded. Assignment, dispatch, route progress, an attempted handover or a status update alone is not completed custody transfer.
10. Operational cost, customer price and business margin are distinct concepts. A cost definition approval does not activate customer pricing.
11. Cost-definition versions and the version used by any future quote must remain traceable. A later cost change must not silently rewrite an issued or accepted quote.
12. All twelve DEC-047 service/endpoint combinations remain pending verification and unavailable by default. This catalogue does not activate any combination.

## 3. Catalogue interpretation

The twelve activity families below are accepted by the owner as the working catalogue. Section 4A records the workflow requirements confirmed for each family. This owner confirmation establishes the intended product/operating direction; it does not substitute for Operations validation against actual procedures and records, Finance review, or evidence that a service/endpoint combination is eligible.

- **Owner-confirmed requirement:** explicitly accepted by the owner during the 2 November 2026 review.
- **Operations validation pending:** actual execution, role ownership, capacity, procedure and source evidence still require validation by Operations.
- **Finance review pending:** cost basis, evidence, duplicate/included treatment and financial interpretation remain unapproved.
- **Conditional / inactive:** an activity family must not be configured or offered until its existence and scope are confirmed.

No activity definition, by itself, activates a service, location, endpoint, customer price or operational capability.

## 4. Candidate operational activity catalogue

| Candidate ID | Activity / family | Owner-confirmed workflow direction | Operations / Finance validation still required |
|---|---|---|---|
| ACT-01 | Origin PUDO presentation and receipt | Sender presents the parcel at the selected origin PUDO. Generate a parcel acceptance receipt and email it to the sender only after physical custody acceptance has been recorded. The receipt is proof of parcel acceptance, not an invoice or payment receipt. | Validate staff/location roles, refusal/hold outcomes, evidence standard, email delivery handling and service applicability. |
| ACT-02 | Parcel verification and measurement at origin PUDO | Staff verify parcel weight and dimensions (length, width and height). Keep customer-declared values distinct from staff-verified actual values. A discrepancy places acceptance on hold, is recorded and communicated to the customer, and requires the applicable customer decision or Operations review before acceptance proceeds. No silent overwrite or automatic price increase. | Validate measurement equipment/procedure, source/precision/units, discrepancy thresholds and decision authority. No units, thresholds, conversions, divisor or price rule is approved here. |
| ACT-03 | Origin PUDO custody acceptance | Authorised staff explicitly confirm actual physical acceptance. Record staff, location, date/time and supporting evidence; update custody state and reflect it in the customer app. | Validate authorized roles/actions, evidence requirements, and refusal versus possession-retained-on-hold outcomes. |
| ACT-04 | Transport / movement between operational points | Record transport assignment, departure, journey events and arrival separately, including responsible driver/partner and relevant evidence. Record physical custody transfer separately and only when possession actually changes. Reflect operational events in the app without falsely implying transfer. | Validate actual legs, provider/asset arrangements, responsible roles, event evidence and service/endpoint applicability. |
| ACT-05 | Destination PUDO receipt / custody acceptance | Receiving staff physically verify the parcel and explicitly accept custody. Only after acceptance should the customer be notified that it is ready for collection; reflect custody and readiness in the app. | Validate destination location capability, staff authority, verification/evidence and applicable DEC-047 combinations. |
| ACT-06 | Delivery to an address / recipient handover | Verify recipient identity or authorised collection status, capture proof of actual physical handover, and only then mark delivered and update the app. An attempt or arrival without handover is not delivery. | Validate identity/authorization method, acceptable proof, delivery actor and service/endpoint applicability. |
| ACT-07 | Collection / release to an authorized collector | Verify the customer or alternative collector's authority, capture proof of release and record actual physical handover before marking collected; reflect completion in the app. | Validate the operational verification procedure and evidence against BP-06–BP-08. |
| ACT-08 | Failed collection or delivery attempt | If the recipient cannot be reached at the physical address, the agent may attempt contact by phone, email or SMS to make the destination reachable. If contact fails or the destination remains unreachable, record a failed-attempt exception with reason, actor, date/time, location, contact methods/outcomes and evidence. Do not mark delivered/collected or create an automatic charge. | Validate reasonable contact/retry procedure, attempt taxonomy, exception ownership and custody handling. Contact-channel delivery/response evidence remains to be specified. |
| ACT-09 | Return-to-Sender (RTS) journey | After failed-delivery recovery and Operations decision, notify the sender before the return journey begins. Record the separate reverse journey, movements and every actual custody transfer; make return progress visible to the sender. No automatic RTS charge or assumed liability. | Validate RTS trigger/authority, sender-notification content and delivery evidence, return destination, custody chain and financial responsibility policy. |
| ACT-10 | Exception review and resolution | Create formal incident records for damaged/missing parcels, unexplained delays, custody discrepancies, disputed handovers and other incidents. Capture description, time/location, reporter/responsible party, evidence, current custody and Operations review/resolution. | Validate exception taxonomy, severity, review authority, escalation, customer communication and resolution evidence. |
| ACT-11 | Origin PUDO substitution handling | A substitution request must first appear in the sender's dashboard with original/requested locations, request status and timestamp. Operations authorises or rejects it; decision is reflected in the dashboard and customer is notified. Customer acceptance is recorded where required before the alternative PUDO is used. Preserve history. | Validate grounds/evidence for substitution, decision roles, when customer acceptance is required, and route/quote consequences. No substitution is effective merely because it was requested. |
| ACT-12 | Other support, administration, packaging, storage or handling work | Candidate families may be listed for discovery, but remain inactive and unconfigured until Operations confirms that VeriLyft actually performs or contractually requires them. | Confirm existence, scope, trigger, owner, evidence and attributable cost before any definition or offering. |

### 4A. Owner-confirmed workflow decisions — 2 November 2026

The owner reviewed the twelve activity families and accepted the working catalogue. The following workflow requirements were also confirmed:

1. **ACT-01 — acceptance receipt:** an acceptance receipt is proof of physical parcel acceptance, separate from an invoice/payment receipt. Email the receipt to the sender only after actual custody acceptance is recorded.
2. **ACT-02 — verification and discrepancy hold:** verify weight and length/width/height at the origin PUDO. Preserve declared and actual values separately. Place acceptance on hold for a discrepancy, notify the customer and resolve through customer decision or Operations review; no silent overwrite or automatic price increase.
3. **ACT-03 — origin custody:** authorised staff explicitly record physical custody acceptance with staff/location/time/evidence; the custody update must appear in the customer app.
4. **ACT-04 — transport events:** record assignment, departure, journey and arrival separately from physical custody transfer. The app must not imply a completed transfer from assignment, dispatch, departure or arrival alone.
5. **ACT-05 — destination PUDO:** receiving staff verify the parcel and explicitly accept physical custody before the customer is notified that it is ready for collection.
6. **ACT-06 — address delivery:** verify recipient identity or collection authority and capture proof of actual handover before marking delivered.
7. **ACT-07 — PUDO collection:** verify the collector's authority, capture proof of release and record actual physical handover before marking collected.
8. **ACT-08 — unreachable recipient:** attempt phone, email or SMS contact to help make the destination reachable. If contact fails or the destination remains unreachable, record a failed-attempt exception with evidence; do not mark delivered/collected.
9. **ACT-09 — RTS:** notify the sender before the return journey begins. Record RTS as a separate reverse journey and preserve actual custody transfers.
10. **ACT-10 — incidents:** damaged/missing parcels, unexplained delays, custody discrepancies, disputed handovers and other incidents require formal records, evidence and Operations review.
11. **ACT-11 — substitution:** show the request in the sender's dashboard first, including original/requested locations and status. Record Operations' decision, reflect it in the dashboard, notify the customer and obtain customer acceptance where required before using the alternative PUDO.
12. **ACT-12 — additional activities:** packaging, storage, repackaging, special handling, support and other candidates remain inactive until Operations confirms they are actually performed or contractually required.

These are owner-confirmed workflow requirements from this discussion. They do not claim independent Operations validation, observed production evidence, Finance approval or authorization to implement the workflows. The specific notification channels above are requirements to support; delivery-provider selection, retry policy, templates and technical implementation remain open.

### Decisions and validation still required

- Operations must validate actual procedures, role ownership, location capability, event triggers/completion, evidence, exceptions, service applicability and the feasibility of the owner-confirmed workflows.
- Finance must review source-backed cost evidence, cost basis, direct/shared/included/exception treatment and duplicate-cost prevention.
- Confirm whether any activity family needs to be split into multiple independently costed activities.
- Identify omitted activities only from actual operating procedures, observed records or approved partner/staff agreements.
- Do not infer service availability from the presence of an activity definition. All DEC-047 combinations remain unavailable pending their independent evidence and approval.

## 5. Activity definition record — proposed minimum information

For each accepted activity, propose recording the following descriptive information. These are definition attributes, not a proposed Firestore schema.

| Attribute | Purpose | Approval status |
|---|---|---|
| Activity identity and name | Stable reference and human-readable description | Required concept; exact identifiers/names pending |
| Business purpose | Why the activity exists | Required concept; activity-specific text pending |
| Scope and exclusions | What work is and is not included | Required; must be validated |
| Trigger / start condition | What causes the activity to begin | Required; must be validated |
| Completion condition | What demonstrates the activity is complete | Required; physical custody evidence must follow the custody invariant |
| Responsible function / actor | Who performs or owns the activity | Required concept; role/action mapping pending |
| Applicable service and journey context | Where the activity is relevant | Required; service-specific applicability pending |
| Location / endpoint context | Where it occurs, if relevant | Conditional; no location capability implied |
| Required operational evidence | Records needed to substantiate occurrence and outcome | Required; evidence standards pending |
| Exception outcomes | Refusal, hold, failed attempt, discrepancy, cancellation or other validated outcomes | Conditional; only applicable outcomes should be configured |
| Cost definition reference/version | Link to independently governed cost definition | Existing platform foundation supports versioned definitions; activity catalogue mapping pending |
| Lifecycle status and effective scope | Prevent accidental use of unapproved definitions | Proposed control; exact lifecycle semantics pending |

An activity definition must not imply that the activity has been approved for customer pricing, that a location can perform it, or that a staff member is authorized to perform it.

## 6. Candidate cost-input taxonomy

The following are candidate input families to assess per activity. **No activity is required to use every input.** Each input must be included only where evidence shows it is necessary to describe that activity's cost.

| Input family | Candidate information | Source classes to distinguish | Important boundary |
|---|---|---|---|
| Activity occurrence | Activity reference, outcome, applicable scope | System-recorded, staff-recorded, source document | Occurrence evidence is not itself a monetary cost. |
| Work quantity | Count or quantity of work actually performed | System-recorded, staff-recorded, measured | Do not choose a unit or aggregation rule without evidence. |
| Staff effort | People involved, work performed, elapsed/active effort where measured | Staff-recorded, approved staff record, measured | No wage, productivity or compensation method is approved. |
| Transport resource | Business-owned vehicle, driver-owned vehicle or external partner | Asset/driver/partner record, approved agreement | Record the actual arrangement; do not assume a payment method. |
| Transport execution | Trip, movement leg, origin/destination, distance or elapsed time where available | System-derived, measured, staff-recorded, provider record | No distance/time unit, route source, allocation or charge basis approved. |
| Parcel characteristics | Weight, dimensions, size/handling attributes, contents/quantity where relevant | Customer-declared, staff-verified, physically measured | Preserve declared and actual values independently; no thresholds, conversion or divisor approved. |
| Packaging / materials | Materials consumed, if an activity demonstrably uses them | Stock/issue record, staff-recorded, supplier evidence | Packaging as a cost input is not established for every service or activity. |
| External service input | Partner service, agreed scope, contractual basis | Approved partner agreement, invoice or partner record | No partner terms, rate or liability is approved by this catalogue. |
| Exception facts | Failed attempt, refusal, hold, reattempt, damage/discrepancy or RTS facts where applicable | Staff-recorded, measured, evidence record | Exception occurrence does not automatically authorize a charge. |
| Shared-resource evidence | Resource used by more than one activity, if observed | Operational records, asset records, approved policy | Allocation method and allocation authority remain unapproved. |
| Time / operating context | Date, time, operating window or duration if it changes actual resource use | System timestamp, measured, approved operating record | Do not infer a time-based rate, premium or schedule fee. |

### Input metadata required before an input can be configured

For each input proposed for an activity, document:

1. Stable key and plain-language definition.
2. Why it is necessary for that specific activity's cost definition.
3. Whether it is required, optional or conditional, and the evidence for that classification.
4. Source classification: customer-declared, system-derived, staff-recorded, physically measured, or externally supplied/contractual.
5. Authoritative source and accountable source owner.
6. Original unit and precision as supplied by the authoritative source, if applicable.
7. Whether conversion is allowed; if so, the explicit conversion, source, precision and approving authority. Otherwise state that no conversion is permitted.
8. Validation and consistency checks.
9. Missing, unavailable, disputed or stale-value behaviour.
10. Whether the input describes activity occurrence, operational quantity, resource use, cost evidence or a later actual measurement.
11. How the original value and subsequent corrections/measurements are preserved.

A source label, unit or precision must not be filled with illustrative values. If the source has not been identified, the input remains unapproved.

## 7. Cost record and cost treatment distinctions

Keep these concepts separate:

- **Activity record:** evidence that a defined piece of operational work occurred and what its outcome was.
- **Cost evidence:** a source-backed fact that may establish a cost incurred, committed or agreed.
- **Activity unit-cost definition:** the independently versioned definition of how cost evidence is described for one activity. It may declare applicable inputs; it does not, by itself, establish approved rates or arithmetic.
- **Operational cost record:** a record of cost attributable to an activity, once an approved evidence and accounting basis exists.
- **Customer price:** the separately governed amount offered to a customer under an approved service pricing rule.
- **Business margin:** the distinct relationship between customer revenue and business costs under an approved financial model.

### Candidate cost treatment labels for evidence classification

The following labels are proposed for investigation and do not approve an allocation policy:

| Label | Intended distinction | Still requires decision |
|---|---|---|
| Direct | Evidence can be attributed to one activity | Attribution evidence and recognition basis |
| Shared | A resource or cost supports multiple activities | Allocation method, driver, period and approving authority |
| Included | Cost is already included in another agreed cost/contract scope | Inclusion evidence and double-count prevention |
| Exception-related | Cost evidence arises from a validated exception or reverse activity | Responsibility, recoverability and customer-charge policy |

Do not double-count an amount already included in a driver/partner agreement. Under the recorded arrangement, do not separately add fuel/vehicle operating expenses to driver-owned-vehicle driver charges or external-partner charges. Business-owned vehicle treatment remains unresolved. Do not decide whether an exception cost is borne by VeriLyft, a partner, a customer or another party without an approved policy and evidence.

## 8. Service applicability and evidence matrix

Complete this matrix independently for Standard, Express and Scheduled. The current evidence is insufficient to mark the candidate activities as universally required.

| Activity family | Standard | Express | Scheduled | Evidence needed |
|---|---|---|---|---|
| Origin PUDO presentation / receipt | Known for described Standard scope | Pending | Pending | Service-specific operating procedure and location capability |
| Origin physical verification / measurement | Known for described Standard scope | Pending | Pending | Verification procedure and source/measurement evidence |
| Origin custody acceptance | Required when physical possession is actually accepted | Pending service applicability | Pending service applicability | Custody acceptance contract and authorized action/location |
| Transport movement legs | Validate exact legs | Pending | Pending | Route/journey evidence and provider/asset arrangements |
| Destination PUDO receipt | Pending by endpoint | Pending by endpoint | Pending by endpoint | DEC-047 and location capability evidence |
| Address delivery / recipient handover | Pending by endpoint | Pending by endpoint | Pending by endpoint | DEC-047, delivery procedure and handover evidence |
| Authorized collection / release | Validate applicable endpoints | Pending | Pending | BP-06–BP-08 and location-specific release procedure |
| Failed attempt | Exception handling required where an attempt occurs | Same principle; applicability pending | Same principle; applicability pending | Attempt definition, evidence and resolution policy |
| RTS reverse journey | Separate journey when triggered | Same principle; applicability pending | Same principle; applicability pending | RTS trigger, route, custody and responsibility evidence |
| Exception review | Validate per exception type | Pending | Pending | Operations procedure and authority matrix |
| Origin PUDO substitution | Known Standard rule | Pending | Pending | Service-specific location substitution policy |

All DEC-047 combinations remain unavailable until their separate coverage, location capability, route, date/time capacity and Operations approval evidence is complete.

## 9. Evidence collection pack for each activity

No activity should progress to a configured definition until its evidence pack contains:

| Evidence field | Required content |
|---|---|
| Activity reference and scope | Exact activity being evidenced; service and journey context |
| Operating procedure / event definition | Approved procedure or observed description of trigger, steps and completion |
| Source record | Stable reference to operational event, measurement, invoice, agreement or other source |
| Source owner | Person/function accountable for source accuracy |
| Source type | Observed operational record, measured resource use, approved staff record, approved supplier/partner input, approved policy or other described source |
| Observation period | Date/range and conditions represented |
| Quantity and original unit | As supplied by the source; no silent conversion |
| Cost basis | Actual incurred, committed, agreed, shared or included, if established by evidence |
| Scope and exclusions | What the evidence covers and does not cover |
| Limitations | Missing data, uncertainty, assumptions, sample/method and known quality concerns |
| Operations validation | Scope, occurrence, execution and resource-use validation |
| Finance review | Cost basis, duplicate/included treatment and financial interpretation |
| Decision status | Submitted, needs clarification, validated, rejected or approved, with reason/date |

A blank evidence field is a gap, not permission to infer a value.

## 10. Governance and lifecycle

The PR #122 approval workflow is the existing governance foundation:

1. Proposer submits a version.
2. Operations validates operational scope and evidence.
3. Finance reviews cost evidence and financial treatment.
4. An independent approver approves or rejects.

The four actors must be distinct for the same version, and each action requires its corresponding active action permission. Permission assignments remain provisioned through the trusted process; this catalogue does not add staff UI or permission-grant functionality.

Approval of an activity-cost definition does not:
- activate a service or DEC-047 endpoint combination;
- publish a customer price;
- approve a pricing formula, fee, tax, margin or currency;
- authorize staff compensation or partner payment execution;
- authorize route, dispatch, intake or custody actions;
- change an issued or accepted quote.

Any later technical contract must retain immutable versions and the approved version reference. A future quote must identify the exact approved cost/pricing configuration version used, without allowing subsequent edits to rewrite the quote.

## 11. Proposed validation and acceptance questions

The owner-level catalogue review is complete. Before activity definitions or cost inputs are configured, Operations and Finance must confirm:

1. Validate actual execution, scope, responsible roles, trigger and completion evidence for each owner-confirmed activity.
2. Confirm which activity families are performed, conditional or out of scope, including ACT-12 inactive candidates.
3. Validate the physical-possession and handover evidence for every custody-changing event.
4. Validate parcel measurement sources, original units/precision, discrepancy handling and hold/release authority.
5. Validate notification and contact-channel procedures, evidence, delivery outcomes and retry behaviour.
6. Confirm service/endpoint applicability independently; DEC-047 remains a separate fail-closed gate.
7. Identify authoritative sources and owners for each activity-specific cost input.
8. Finance to validate cost evidence, recognition basis, direct/shared/included/exception classification and duplicate-cost prevention.
9. Confirm actual staff, asset, driver and partner arrangements from approved records.
10. Define the minimum internal configuration capability only after the above validation and review are complete.

## 12. Explicit exclusions

This proposal does not define or implement:

- activity rates, unit costs, monetary amounts or formulas;
- units, precision, conversions, dimensional divisor, weight/size bands or thresholds;
- staff wages, compensation, productivity or payroll;
- driver/partner contract terms, reimbursement or financial liability beyond the recorded arrangement boundary;
- cost allocation or margin formulas;
- customer price, quote calculation, quote issuance or acceptance;
- customer-facing cost configuration;
- route optimization, dispatch, collection, delivery, intake or custody execution;
- automatic charges for failed attempts, RTS or discrepancies;
- DEC-047 eligibility or service activation;
- permission-grant UI/API, new Firestore collections, fields, APIs or permission IDs beyond the separately approved PR #121–#125 foundation.

## 13. Recommended next step

The owner-level review of the twelve activity families and the workflow requirements in Section 4A is complete. Next, obtain Operations validation of actual procedures, roles, triggers, completion evidence, notification/contact handling and service applicability; then obtain Finance review of source-backed cost evidence and duplicate/included treatment. Only after those reviews should the team prepare the minimal technical contract for internal activity-cost configuration, aligned to the existing PR #121–#122 stores and approval workflow.

**Current conclusion:** the working activity catalogue and owner-confirmed workflow direction are established. A staff-facing interface may manage draft definitions and the existing review workflow over the PR #125 APIs; it does not validate activity procedures or cost evidence. Independent Operations validation, Finance review, activity-to-input source mapping and attributable cost evidence remain outstanding. No customer pricing or operational capability is activated.

## 14. M2 operating-model reconciliation — preserve catalogue identity and physical truth — 5 November 2026

The owner-approved M2 package confirms reuse of ACT-01–ACT-11 as the existing activity families. Do not create duplicate IDs or silently rename/repurpose an activity to absorb seller collection, Lite Errands, hub consolidation, customer support or another proposed operating arrangement. Map each confirmed activity to the existing catalogue using its actual trigger, completion, responsible actor and evidence. ACT-12 remains conditional/inactive until Operations confirms that the work is actually performed or contractually required.

The operating-model route loops, hub cutoffs, dispatch waves and proposed service windows are planning proposals, not approved route algorithms, distance bands, guaranteed ETAs or pricing inputs. Local Ibadan activity must not inherit Lagos corridor costs without evidence. Destination PUDO receipt, address delivery, recipient collection/release, failed attempt and RTS remain distinct operational events.

**Physical custody invariant:** a booking, route assignment, manifest, dispatch instruction, vehicle departure, arrival or attempted handover does not prove a custody transfer. Record a custody change only when physical possession actually changes, with the applicable actor, location, time, outcome and evidence under the approved custody contract. Preserve the last confirmed custody through failed/disputed handovers; do not fabricate completion or silently close exceptions.

The M2 activity/cost evidence requirements are detailed in PLATFORM_M2_SERVICE_COST_AND_INPUT_EVIDENCE_WORKBOOK.md Section 13 and PLATFORM_M2_PRE_IMPLEMENTATION_REVIEW_PACKAGE.md Section 5. This catalogue remains the activity identity authority; the workbook is the evidence-collection aid. No ACT-12 activation, customer price or service capability is approved here.
