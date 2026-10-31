# Review 3 Staff Action and Location-Capability Crosswalk

**Status:** Technical-design synthesis of accepted policy; proposed crosswalk, not an approved permission catalogue or implementation model  
**Prepared:** 31 October 2026  
**Repository baseline:** PR #81 merge commit `471ebb1d16c33677e12ddcca1c6d3fdef343d239`  
**Authority:** PM-01–PM-12, DEC-033, DEC-037–DEC-044, `PLATFORM_STAFF_PERMISSION_DECISIONS.md`, `PLATFORM_STAFF_PERMISSION_MATRIX.md`, `PLATFORM_MUTATION_AUTHORIZATION_AND_RECOVERY_MATRIX.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`

## 1. Purpose and limits

This crosswalk makes the accepted separation between **staff action permission**, **operational scope**, **location/service capability**, **lifecycle eligibility**, and **independent approval** explicit across the principal platform actions.

It does not create role bundles, permission identifiers, location capability identifiers, collections, fields, claims, endpoints, UI, numeric thresholds, or an executable authorization engine. It does not settle unresolved owner choices listed in Section 5. It is a traceability aid for completing Review 3.

## 2. Common authorization contract

For every staff-initiated mutation, the design must evaluate the following independently at the trusted server boundary:

1. **Authenticated principal:** identify the actual staff principal or trusted system/provider actor.
2. **Target and relationship:** resolve the target record and verify the actor's permitted relationship to it; identifiers are not credentials.
3. **Exact action permission:** verify explicit authority for this action. Admin or Operations responsibility labels alone do not grant it.
4. **Scope:** verify the assignment covers the relevant service, record/task, operational responsibility and location/region where applicable.
5. **Location/service/action capability:** for location-bound work, the location must be active and explicitly enabled for both the service and the requested action. A location capability does not grant staff permission, and staff permission does not enable a location.
6. **Lifecycle and holds:** validate authoritative current facts, preconditions, cancellation, dispute, payment, custody, safety and legal holds.
7. **Trusted inputs:** validate or recompute values, amount/currency, units, references, recipient entitlement and evidence server-side.
8. **Independent approval:** obtain a distinct authorized approver only where accepted policy or the relevant approved workflow requires it. The requester cannot approve their own consequential dispatch exception; other self-approval/second-approval rules must not be generalized without authority.
9. **Concurrency and replay:** protect against duplicate, stale, concurrent, delayed and out-of-order requests.
10. **Evidence and audit:** capture the reason, decision, actor, physical actor/receiver/recorder distinctions, approval and supporting evidence required by the event.
11. **Outcome and recovery:** persist and report the authoritative result; reconcile any external side effect whose outcome is unknown. A failed guard must not mutate protected business facts.

A missing/failed guard denies or holds the action; it must not be bypassed by hiding a button, relying on a portal route, or trusting a stale client permission.

## 3. Action-to-authority crosswalk

**Legend:**  
- **Staff authority** is the exact action-level permission required; names below are descriptive labels, not proposed permission IDs.  
- **Location gate** is required only for the location-bound action shown.  
- **Approval** states only accepted requirements; “open” means no default may be invented.

| Action family | Required staff authority and scope | Location/service capability gate | Independent approval / separation | Minimum authoritative evidence |
|---|---|---|---|---|
| Staff permission grant/change/suspend/revoke | Designated permission-administration authority; target staff and exact scope | Not a parcel-service capability | Whether privileged grants/revocations need second approval remains open; grantor cannot self-elevate | Granting actor, target, exact permission/scope, reason, time, outcome; recovery trail |
| Location creation/activation/capability administration | Separately assigned location-configuration authority | Configuration must define active status and independently enabled service/actions | Second approval for capability changes remains open | Location, changed capability/status, actor, reason, time, previous/new configuration |
| Pricing/rate configuration | Designated pricing/rate authority; configuration scope | Applicable service must be supported by the configured pricing rules; not a physical location permission | Whether rate changes require second approval remains open | Rule/version, effective context, actor, before/after values, reason; accepted quotes retain original terms |
| Quote issue and booking confirmation | Authorized system/service path; customer booking party must be entitled to accept the exact quote | Service must be offered for the requested booking context; physical intake capability is not required to confirm booking | No staff second approval implied by the accepted booking policy | Quote inputs/version/terms, acceptance actor/time, handover context; duplicate acceptance yields one booking outcome |
| Booking amendment/cancellation | Customer booking-party entitlement; staff-mediated exception only under separately assigned authority | Location capability does not authorize changing a customer's booking | Post-intake and exceptional cases follow unresolved approved workflow; cancellation is not refund | Requester, authority/verification, reason, prior/new commercial context, customer decision |
| Walk-in intake creation | Staff intake permission within assigned operational scope | Active location + enabled service + walk-in intake capability | No automatic authority for measurement, custody, payment collection or release | Actual presenter, parcel/shipment, location, time, intake context and required proof |
| Outgoing parcel intake / custody acceptance | Staff custody/intake authority appropriate to the distinct action | Active location + service + custody acceptance capability | Service-specific second-person cases remain open; booking/payment/status is not proof | Previous/receiving custodian, physical handover actor, recording staff, time/location, outcome and proof |
| Measurement recording | Staff measurement permission and applicable service scope | Active location + service + measurement capability | Routine measurement does not automatically require second approval | Declared and actual values separately, units, actor, location, time and evidence |
| Measurement adjustment proposal/review | Separate proposal and review authority as required by workflow | Relevant service/location measurement capability | Material/payment-impacting adjustment requires review and applicable independent approval; proposer cannot self-approve | Original/revised values and quote, reason, proposer, reviewer/approver, customer acceptance/rejection |
| Payment collection/recording at location | Staff payment-collection/recording permission; enabled method and purpose | Active location + service + payment-collection capability | Routine recording/receipt/reconciliation does not automatically require second approval; consequential financial actions follow PM-05 | Amount/currency, purpose, method, provider/receipt evidence, collecting and recording actors, location/time |
| Payment verification/reconciliation | Trusted provider/system confirms electronic payment; separately assigned staff may investigate/reconcile | No location gate unless payment is collected at a location | Manual outcome changes and consequential financial actions require the applicable financial authority/approval; staff cannot fabricate provider confirmation | Provider/reference, amount/currency, purpose, authoritative result, correlation and reconciliation record |
| Refund, credit, reversal, additional charge, financial adjustment | Explicit financial authority; Finance retains full reconciliation responsibility | Not a general location capability; payment-at-intake context may add its own gate | PM-05 second approval for consequential actions; requester/approver separation; no invented threshold | Original financial event, amount/currency, reason, requester, approver, provider/bank reference, confirmed outcome |
| Route proposal/review | Operations responsibility with explicit routing scope | No location capability implied by proposal | Proposal is not route approval, assignment, dispatch or movement | Proposal/version, route context, proposer/reviewer, time, reason and outcome |
| Route approval/assignment/reassignment | Explicit Operations authority for the relevant shipment/leg/resource scope | Relevant service/operational location constraints apply where configured; assignment is not physical transfer | Second approval only for high-impact/consequential cases as defined by approved policy; exact materiality remains open | Prior/new assignment, leg/resource, actor, reason, approver if required, history |
| Dispatch authorization | Explicit dispatch authority and shipment scope | Applicable service/location readiness and holds must be checked; dispatch is not custody transfer | Payment gate applies by default; an eligible exception requires assigned authority and requester cannot approve own dispatch exception; material exceptions require second approver | Readiness, payment/exception basis, requester, approver, reason, time and dispatch decision |
| Movement milestone / custody transfer recording | Authorized recorder within operational scope; distinguish recorder from actual physical actor and receiver | Applicable location/service capability and custody context; route assignment alone is insufficient | Actual transfer completes only on physical handover and receiving possession; disputed cases preserve last confirmed custody | Parcel/shipment/leg, prior/receiving custodian, physical actor, recorder, time/location, outcome, evidence/source |
| Delivery attempt/outcome and proof | Explicit delivery-recording authority; recipient/representative entitlement verified | Applicable service/location rules; collection/release capability is separate where used | Attempt is not successful delivery; failed/disputed resolution follows assigned authority and applicable second approval | Attempt/result, intended and actual recipient, entitlement evidence, physical actor, recorder, time/location, proof |
| Parcel collection/release | Staff release/collection permission and recipient verification authority | Active location + service + parcel release/collection capability | Disputed/exceptional collection follows approved resolution; no authority inferred from payer, sender or booking party | Parcel, recipient/representative entitlement evidence, physical/recording actors, location, time, outcome |
| Failed delivery, hold, return, missing/damaged parcel resolution | Explicit Operations exception/investigation authority for the case and action | Applicable custody/location capability; hold does not enable onward processing | Consequential operational exception follows PM-07; no universal second approval; liability/refund/compensation are separate decisions | Original attempt/custody, last confirmed custodian, reports/proof, investigator, decision authority, reason, outcome |
| Audit/evidence view | Explicit reviewer permission for evidence category/record and purpose | No physical location capability; record scope still applies | View is distinct from export and external disclosure | Reviewer, purpose, record/evidence scope, time, access outcome |
| Audit/evidence export | Separate explicit export permission and scope | No physical location capability | Export is not disclosure approval; any additional review must follow approved sensitivity policy | Exporter, purpose, evidence manifest, scope, recipient where relevant, time/outcome |
| External/government disclosure | Explicit disclosure authority; validate requester's legal basis and scope | No physical location capability | Disclosure approval distinct from requester; mandatory second reviewer by sensitivity remains open | Request, legal basis, scope, decision, approver, minimum-necessary manifest, recipient, actor/time |
| Consequential correction/redaction | Explicit correction/redaction authority and record scope | No capability can authorize rewriting physical history | Workflow-specific independent approval remains open; original is preserved | Original reference, additive correction/redaction, reason, actor, approver if required, time and evidence |
| Notification configuration/send | Assigned configuration authority; system sends only approved event | No physical location capability; source event must already be authorized | Recipient/field/channel entitlement and disclosure policy apply; Telegram gate remains unchanged | Triggering business event, recipient relationship, permitted fields/channel, attempt/provider result and configuration/approval |
| Dashboard/report access/export | Explicit reporting permission and scope; Management has no automatic operational role | No physical location capability | Sensitive drill-down/export requires separately assigned authority | Metric definition/source/window, viewer scope, export/access record |

## 4. Location capability crosswalk

DEC-043 and PM-03 establish that the location must be active and enabled for both the service and the action. The following are distinct capability concepts already named in accepted policy; this table does not define their final catalogue identifiers or technical representation.

| Capability concept | Permits only this location-side eligibility | Does not imply |
|---|---|---|
| Walk-in intake creation | Staff-assisted intake creation for an eligible service | Measurement, custody acceptance, payment collection, release |
| Outgoing parcel intake / custody acceptance | Physical acceptance of an eligible parcel/service into custody | Measurement, payment, dispatch, route assignment |
| Measurement | Recording the applicable service's required measurements | Quote/rate configuration, accepting a payment-impacting adjustment |
| Payment collection/recording | Collection or recording of an enabled method for the defined purpose | Provider settlement confirmation, reconciliation authority, refund authority |
| Parcel collection/release | Physical release/collection at an enabled location after recipient entitlement checks | Custody transfer without actual possession, delivery proof for unrelated service |
| Custody handover/transfer | Location-side eligibility to participate in an actual handover | Proof that handover happened, route dispatch, arrival, or successful delivery |

An outgoing intake capability, walk-in intake capability and custody acceptance capability must not be collapsed merely because one staff workflow may involve several of them. The exact service/location/action combinations remain an open specification item.

## 5. Cross-cutting lifecycle and exception rules

- Revoking a location capability blocks new work requiring it. It does not erase existing custody, silently reassign a parcel, or prove physical transfer.
- A temporary closure must not strand or abandon existing custody. The responsible operational owner, queued-work treatment and restoration procedure remain to be specified.
- Partner/carrier/driver physical activity and internal platform recording remain distinct. Direct partner/driver login is not in launch scope under PM-09.
- A staff member's permission change, suspension or revocation must be enforced server-side at mutation time; stale UI state does not preserve access.
- A record's prior state, accepted quote, payment outcome, custody history and evidence must not be rewritten to make a later action appear valid.
- Support may verify, acknowledge, record, route and escalate within its assigned access; it cannot grant authority or execute financial, custody or dispatch actions by implication.
- Emergency access is justified, minimum-scope, time-limited, audited, reviewed and revoked. It does not silently bypass financial, evidence or legal controls.
- Location/service capability failure blocks the action or routes it to an approved alternative; staff cannot self-enable a capability.
- External provider unknown outcomes are reconciled before repeating a side effect blindly.

## 6. Unresolved owner and technical inputs

This crosswalk intentionally does not settle:

1. Exact permission catalogue, permission-set composition, staff identity lifecycle, scopes, initial administrator appointment/recovery, and whether privileged grants/revocations require second approval.
2. Exact service/location/action capability catalogue and combinations, location ownership/operation categories, partner arrangements, capability-change authority, queued-work and temporary closure/restoration procedure.
3. Financial materiality/limits, measurement units/tolerances, route-change materiality and any other numeric thresholds.
4. Which workflow-specific corrections, disclosures, emergency grants and exceptions require an additional independent approver beyond already accepted policy.
5. Exact service-specific physical proof, offline capture, investigation authority, hold review/maximum duration and customer/liability outcomes.
6. Evidence reviewer eligibility, retention/legal holds, correction/redaction procedure and government disclosure details.
7. Technical permission representation, enforcement in existing Firebase/Auth/API boundaries, staff session revocation behaviour, and runtime acceptance evidence.

These inputs must be grouped into the consolidated owner packages described in `PLATFORM_REVIEW_3_OWNER_INPUT_TRIAGE.md`. Do not turn each row into a separate owner approval exchange.

## 7. Review 3 completion and verification requirements

Before Review 3 is presented, reconcile this crosswalk against the current actor, workflow, lifecycle, API/persistence, mutation/recovery, P0 and Admin documents. Each action must have traceability to its originating decision/requirement and a consistent denial/recovery owner.

The later implementation acceptance specification must test at least:

- one permission does not imply another;
- location capability and staff permission are each independently required;
- inactive/unsupported locations deny new work;
- scope mismatch, expired/revoked permission and stale client state deny at the server boundary;
- no self-approval of dispatch exceptions;
- other second-approval rules are enforced only where an accepted workflow requires them;
- denial/failure leaves protected business facts unchanged;
- capability revocation does not erase custody or transfer possession;
- external physical actors are distinguished from platform recorders;
- view, export and external disclosure are independently authorized;
- duplicate, concurrent, delayed, out-of-order and unknown-outcome cases preserve one authoritative result and auditable history.

These are test-design obligations, not evidence that implementation or runtime verification exists.

## 8. Approval boundary

This document is a technical-design crosswalk derived from accepted policy. It is not a new owner decision, final permission catalogue, executable authorization specification, data model or implementation authorization. Reviews 1–2 remain approved; Review 3 remains in preparation; Reviews 4–5 remain future gates. No application code, schema, API, Firebase rules/configuration, provider activation or deployment is authorized before explicit Review 5 approval.
