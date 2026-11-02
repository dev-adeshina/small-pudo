# Operational Activity Catalogue and Cost Input Definition

**Status:** Owner-review proposal; not an approved operating catalogue, cost policy, rate card, pricing model, schema or implementation authorization.  
**Prepared:** 2 November 2026  
**Applies to:** VeriLyft independent shipment operations and internal operational-cost definition foundation.  
**Authority:** DEC-018, DEC-019, DEC-022–DEC-025, DEC-038–DEC-049; PM-01–PM-12; PR #121–#122; `PLATFORM_M2_SERVICE_COST_AND_INPUT_EVIDENCE_WORKBOOK.md`; `PLATFORM_OPERATIONAL_COST_DEFINITION_APPROVAL_FOUNDATION.md`.  
**Related:** `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`, `PLATFORM_M2_PRICING_AND_QUOTATION_READINESS_SPECIFICATION.md`.

## 1. Purpose

Define a controlled way to identify operational activities and the information that may be needed to describe their costs. The catalogue is intended to guide the next internal activity-cost configuration contract while preserving the boundary between operational facts, cost evidence, customer pricing and business margin.

This document is a proposal for owner review. It does not assert that every candidate activity is currently performed, available at launch, or eligible for every service/endpoint combination. It does not approve cost amounts, units, formulas, allocation methods, staff compensation, provider terms, service eligibility or customer charges.

## 2. Authority and non-negotiable boundaries

1. Each operational activity is to have its own independently configurable unit-cost definition and declare its own applicable variables. The actual catalogue, activity identifiers, units and variable mappings still require confirmation.
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

Each entry below is a **candidate activity** or **candidate activity family**, not an assertion of an approved end-to-end workflow.

- **Known requirement:** supported by an owner-confirmed decision or recorded operating fact.
- **Candidate — validate:** plausible activity to investigate, but its execution, scope or applicability has not been established sufficiently to approve it.
- **Exception candidate:** a distinct exception or reverse-flow record is required by the recorded direction, but triggers, steps, owners and cost treatment remain open.
- **Not established:** no activity should be created merely because a generic logistics business might perform it.

An activity should be configured only when its business purpose, trigger, completion evidence, responsible function, scope and necessary inputs are validated from VeriLyft operating records or an approved operating procedure.

## 4. Candidate operational activity catalogue

| Candidate ID | Activity / family | Current evidence and boundary | Minimum facts to validate before configuration |
|---|---|---|---|
| ACT-01 | Origin PUDO presentation and receipt | **Known Standard operating fact:** customer selects the origin PUDO centre online and presents the parcel there. Sender-doorstep collection is not in the currently described Standard scope. | Whether the activity is a single operation or separate presentation, receipt and custody-acceptance steps; responsible location/staff; accepted/refused/held outcomes; actual possession evidence; applicable services. |
| ACT-02 | Parcel verification and measurement at origin PUDO | **Known Standard operating fact:** physical parcel verification occurs at the selected origin PUDO centre. Declared and actual characteristics must remain distinct. | Which characteristics are checked; who records them; source and measurement method; discrepancy workflow; whether verification and acceptance of possession are separate events. |
| ACT-03 | Origin PUDO custody acceptance | **Known custody invariant:** parcel identity/custody begins only when authorized staff actually accept physical possession. | Authorized role/location/action; evidence of physical receipt; accepted-with-hold versus refusal before possession; exact event boundary and record owner. |
| ACT-04 | Transport / movement between operational points | **Known transport arrangements:** business-owned vehicle, driver-owned vehicle and external partner. The actual legs and handover points for each service/endpoint pattern require validation. | Which movement legs exist; origin/destination; provider/asset arrangement; trip identity; measured facts available; actual pickup/drop-off and physical handover evidence. |
| ACT-05 | Destination PUDO receipt / custody acceptance | **Candidate — validate:** endpoint combinations include PUDO destinations, but all DEC-047 combinations remain unavailable pending evidence. | Whether and when a destination PUDO receives parcels; location capability; actual possession event; staff responsibility; acceptance/refusal/hold outcomes. |
| ACT-06 | Delivery to an address / recipient handover | **Candidate — validate:** address delivery is within the service/endpoint decision space, but no combination is enabled by this catalogue. | Whether delivery is an activity for the selected combination; assigned actor; authorized recipient; attempt and completion evidence; actual physical handover; failure outcomes. |
| ACT-07 | Collection / release to an authorized collector | **Known authority boundary:** booking/payment alone does not authorize collection; receiver and alternative-collector rules are defined in BP-06–BP-08. | Actual release activity, verification checkpoint, authorized collector relationship, evidence, hold/dispute outcomes and responsible location. |
| ACT-08 | Failed collection or delivery attempt | **Exception candidate:** failed attempts must be recorded with evidence and must not create false custody transitions or automatic customer charges. | What constitutes an attempt; reason/outcome taxonomy; whether physical possession changed; actor/location/time/evidence; retry or review authority; financial treatment (unapproved). |
| ACT-09 | Return-to-Sender (RTS) journey | **Exception candidate:** RTS is a separate reverse journey with its own activity/cost records; no assumed financial accountability or automatic customer charge. | Trigger/authorization; origin and return destination; each reverse movement/hand-over; custody chain; completion evidence; responsible party and financial treatment (unapproved). |
| ACT-10 | Exception review and resolution | **Candidate — validate:** discrepancies, holds, failed attempts, disputed authority and location substitution require controlled outcomes, but not one generic workflow by assumption. | Which exception types require Operations review; decision authority; evidence; customer notification/acceptance where applicable; resolution and audit record. |
| ACT-11 | Origin PUDO substitution handling | **Known Standard rule:** if the selected centre becomes unavailable before parcel presentation, substitution requires Operations authorization plus customer notification and acceptance. | Whether this is a distinct activity or a controlled change event; evidence of unavailability; authorized decision; customer response; effects on location/route/quote. |
| ACT-12 | Other support, administration, packaging, storage or handling work | **Not established as a launch activity catalogue.** Do not configure these merely because they are common in logistics operations. | First establish that the activity is performed or contractually required, its trigger/scope/owner, evidence and whether it creates an attributable cost. |

### Catalogue decisions still required

- Confirm which candidate activities are actually performed and which apply to Standard, Express and Scheduled.
- Confirm whether a candidate family needs multiple independently costed activities or should remain one activity with distinct measurable inputs.
- Identify omitted activities only from actual operating procedures, observed records or approved partner/staff agreements.
- Assign stable activity identifiers only after the activity definitions are accepted.
- Do not infer service availability from the presence of an activity definition.

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

Before treating this catalogue as approved, the owner and relevant operational/financial reviewers should confirm:

1. Which listed activities actually exist in VeriLyft's intended launch operation?
2. Which candidate activities should be split into independently costed activities, and which should remain one activity?
3. What event proves each activity started and completed?
4. Which activities change physical custody, and what evidence proves the actual possession transfer?
5. Which inputs are genuinely necessary for each activity, and what authoritative source supplies each?
6. Which staff, asset, driver and partner arrangements are actually used, and what approved records describe them?
7. Which costs are direct, shared, already included or exception-related, based on source evidence?
8. What evidence and review authority apply to failed attempts and RTS without presuming customer liability?
9. Which service and endpoint patterns use each activity, subject to DEC-047?
10. What minimum internal configuration capability is needed after the catalogue is approved?

## 12. Explicit exclusions

This proposal does not define or implement:

- activity rates, unit costs, monetary amounts or formulas;
- units, precision, conversions, dimensional divisor, weight/size bands or thresholds;
- staff wages, compensation, productivity or payroll;
- driver/partner contract terms, reimbursement or financial liability beyond the recorded arrangement boundary;
- cost allocation or margin formulas;
- customer price, quote calculation, quote issuance or acceptance;
- customer-facing or staff-facing configuration UI;
- route optimization, dispatch, collection, delivery, intake or custody execution;
- automatic charges for failed attempts, RTS or discrepancies;
- DEC-047 eligibility or service activation;
- new Firestore collections, fields, APIs, permission IDs or application code.

## 13. Recommended next step

Owner-review and correct this catalogue at the activity-definition level first. Then obtain Operations validation of the actual activities, triggers, completion evidence and input sources; obtain Finance review of cost evidence categories and duplicate/included treatment. Only after that should the team prepare the minimal technical contract for internal activity-cost configuration, aligned to the existing PR #121–#122 stores and approval workflow.

**Current conclusion:** the platform has a versioned operational cost-definition store and an approval workflow, but the actual operational activity catalogue, activity-to-input mapping and source-backed cost evidence remain to be validated.