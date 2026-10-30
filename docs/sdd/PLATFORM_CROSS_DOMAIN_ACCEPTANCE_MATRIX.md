# VeriLyft Cross-Domain SDD Acceptance Matrix

**Document status:** Draft for owner review — not approved for implementation  
**Created:** 29 October 2026  
**Repository baseline:** `main` at `c55abbba2cfffa6b2020a71c19f1aa50c676588d`  
**Purpose:** Turn the existing platform SDD drafts into a reviewable matrix of business workflows, responsible actors, lifecycle boundaries, security requirements, failure recovery, evidence, and acceptance criteria.  
**Related documents:** `README.md`, `SPEC.md`, `DECISIONS.md`, `ISSUES.md`, `PROGRESS.md`, `SDD_COMPLETENESS_AUDIT.md`, `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md`, `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, `IMPLEMENTATION_SOURCE_TRACEABILITY.md`

## 1. Authority and use

This matrix is a **review aid**, not a new source of approved product policy. It consolidates acceptance questions already raised by the platform SDD and makes evidence needed for approval explicit. Rows marked **Proposed** must not be treated as approved requirements until the owner accepts them. An acceptance criterion can be used to guide later test design only after its associated policy and lifecycle decisions are resolved.

This document does not authorize application-code, API, schema, permission, deployment, or runtime changes. It does not prescribe Firestore collection names, fields, status enums, routes, request payloads, or a new service/portal. Reuse the current architecture and inspect current source before proposing technical changes.

### Evidence labels

- **Decision needed** — product policy, authority, or lifecycle outcome is unresolved.
- **Source mapped** — a current-source observation is recorded in `IMPLEMENTATION_SOURCE_TRACEABILITY.md`; this is not runtime proof.
- **Runtime evidence needed** — a repeatable test or deployed-system observation is required.
- **Proposed criterion** — suggested observable result for owner review, not yet an approved acceptance test.
- **Deferred** — deliberately outside the current launch scope unless the owner changes scope.

## 2. Cross-domain invariants to approve

| ID | Invariant | Current standing | Acceptance evidence to require |
|---|---|---|---|
| X-01 | Storefront orders and independent shipment bookings are distinct business concepts. A relationship may connect an order to delivery fulfilment where the approved workflow requires it. | Accepted constraint in workflow/domain drafts | Tests and records demonstrate that neither lifecycle is accidentally treated as the other. |
| X-02 | Booking, quote acceptance, payment, physical intake/custody, route assignment, movement, and delivery outcome are distinct events/states. | Accepted constraint in workflow/domain drafts | A test for each relevant transition shows that one event cannot imply an unrelated event. |
| X-03 | Server-side verification is authoritative for payment and privileged operations; browser claims and hidden UI controls are not authority. | Accepted constraint; verify every path | Negative tests reject client-forged payment success, ownership, role, amount, and privileged action claims. |
| X-04 | Accepted commercial terms must remain explainable after rates or catalogue data change. | Accepted constraint for quote preservation; detailed representation unresolved | Historical order/quote/payment values can be reconstructed without silently using current rates. |
| X-05 | A proposed route is not an approved assignment, and an assignment is not proof of physical movement. | Accepted constraint in workflow drafts | Approval and physical-event evidence are independently recorded and checked. |
| X-06 | Consequential physical events, overrides, and exceptions are attributable and time-stamped, with evidence/reason appropriate to the event. | Accepted principle; exact evidence requirements unresolved | An authorized reviewer can identify actor, target, time, outcome, reason and required supporting evidence. |
| X-07 | Customer identity, sender/receiver identity, payer, booking party, and staff role are not interchangeable. | Accepted modelling principle; specific verification rules unresolved | Access tests establish the required entitlement for each actor/relationship. |
| X-08 | Duplicate callbacks, retries, concurrent actions, and delayed external events must not silently double-apply money, stock, custody, or fulfilment transitions. | Principle accepted; per-flow recovery policy unresolved | Repeated and out-of-order event tests produce one defined, auditable result. |
| X-09 | Least privilege applies to every privileged operation, not only page navigation; DEC-022 accepts the minimal hybrid staff responsibility model. | Accepted security constraint and owner-approved model direction | Direct API requests from unauthorized identities or staff lacking the action's permission are denied even if the UI is bypassed. |
| X-10 | A workflow does not itself require a new portal, service, collection, or generalized workflow engine. | Accepted architecture constraint | The approved design explains why existing components cannot meet the requirement before proposing new architecture. |

## 3. Cross-domain acceptance matrix

The criteria below are proposed test outcomes. First resolve the listed decisions; then turn accepted criteria into concrete test cases using actual approved lifecycle names and current technical contracts.

| ID / domain | Primary actor(s) and responsibility | Lifecycle / transition boundary | Security and authorization boundary | Failure recovery and idempotency | Evidence / audit requirement | Proposed acceptance criterion | Decision / verification dependency |
|---|---|---|---|---|---|---|---|
| A-01 Public storefront and catalogue | Visitor/customer browses; authorised Admin manages catalogue | Public visibility reflects approved active/inactive rules; catalogue state is not an order snapshot | Public reads expose only intended fields; catalogue mutations require Admin authorization | Missing/unavailable product data produces a safe empty/error state, not fabricated products or prices | Record privileged catalogue changes according to approved audit policy | Inactive items are not purchasable through either UI or direct API; displayed price and stock are revalidated by the server at checkout | Source/runtime verification; confirm public visibility and catalogue acceptance cases |
| A-02 Cart and checkout | Guest or signed-in customer submits selected items and delivery details | Cart intent is not a confirmed order; order creation uses server-validated item/price/stock facts | Client totals, arbitrary user IDs, and browser roles are not trusted | Repeated submission, stock contention, and partial failure have defined outcomes; no duplicate order or stock decrement without an explicit distinct purchase | Preserve order-time item/commercial facts and transaction outcome | Tampered price/quantity/stock requests are rejected or safely normalized by approved policy; concurrent purchases cannot oversell stock | Existing route is source-mapped; confirm duplicate-submit contract and test stock contention |
| A-03 Storefront order lifecycle | Customer; authorised Admin/Operations as approved | Order state remains distinct from payment and physical fulfilment/movement | Customer can access only owned order or a valid guest entitlement; staff actions require explicit server authorization | Cancellation, expiry, late payment, and retry outcomes are explicitly defined; stock restoration is applied at most once | Record status-changing actor/event and reason where applicable | Every allowed transition has a defined actor, guard, resulting state, rejection path, and duplicate-event behaviour | Decision needed for complete transition table; runtime tests outstanding |
| A-04 Customer account and order access | Signed-in customer manages own profile and views entitled orders | Authentication does not itself claim a guest order or prove ownership of every order | Server derives identity from verified auth context and checks target-order entitlement | Lost guest token, changed device, email mismatch, revoked session, and account deletion have defined recovery/denial paths | Record security-relevant claim/recovery decisions without exposing credentials | Customer A cannot read/change Customer B's order; an order ID alone never grants access; guest-order claiming follows an explicitly approved proof flow | VLY-004 open; VLY-009/VLY-010 runtime verification |
| A-05 Independent shipment booking | Registered, authenticated customer acting as booking party; sender, receiver, payer and handover person may differ | Booking intent and accepted quote are not proof of physical parcel intake or custody; change authority depends on change type and lifecycle stage | Server authorizes creation and customer-scoped access. Booking-party status does not grant blanket change or collection authority; payment alone does not grant full shipment-detail access | Abandoned booking, quote expiry, amendment, cancellation, and retry have defined outcomes; unauthorized role-based changes/access are denied | Only registered customers can create bookings; unauthenticated creation and cross-customer access are denied; payer visibility defaults to payment confirmation/receipt only; booking does not authorize collection or falsely mark a parcel received/in transit | DEC-023 eligibility and DEC-024 party/access principles accepted; detailed verification, consent, change matrix, quote expiry, business-account handling, and runtime evidence remain unresolved |
| A-06 Shared pricing and quote acceptance | Customer/shipper; authorised pricing Admin | Price calculation, quote snapshot, accepted quote, payment, and later adjustment are distinct; fixed/calculated method is selected by service | Only authorized actors change pricing policy; clients cannot set authoritative rates or totals | Service-specific quote validity is enforced; expiry/re-quote behaviour is explicit; rate changes do not mutate accepted historical quotes | Preserve applicable inputs, itemized charges, total, currency, rate/rule version and effective context | Shared approved rules apply across storefront delivery and independent shipment booking wherever inputs overlap; equivalent inputs with the same service/rate version produce a reproducible result; accepted amount can be reconstructed after rate updates | Exact formulae, units, distance source/bands, service mapping, effective dates, rounding, taxes/fees/discounts, expiry and adjustment approval rules remain unresolved |
| A-07 Payment initialization and confirmation | Payer; payment provider; server integration | Initialization is not settlement; provider-confirmed result is separate from order/shipment progress | Provider secrets remain server-side; reference, amount, currency, purpose and entitlement are checked server-side | Duplicate callback/webhook, timeout, external success/local save failure, mismatched amount, and late success each have a defined recovery path | Keep provider reference and attributable processing outcome; do not equate webhook log with a complete ledger | Forged success cannot settle an order; repeated events do not double-process payment/stock; mismatches enter the approved review path | Source mapping exists; VLY-005 and VLY-009 runtime matrix required; payment-purpose contract needs approval |
| A-08 Refunds, adjustments and reconciliation | Authorized staff under the approved hybrid model; Finance responsibility remains distinct | Charge, refund, reversal, credit, write-off, and reconciliation are separate financial events | DEC-022 requires explicit permission/approval boundaries for sensitive financial actions; exact authority, limits, and second-person rules remain to be approved. Customers cannot request privileged state changes by supplying a status. | Duplicate refund/reversal requests and provider/local-state divergence have defined resolution and escalation | Financial event history must explain amount, currency, reason, actor, provider reference and resulting balance/status as applicable | Every supported adjustment is attributable, bounded by an approved policy, and cannot be silently represented as a generic status note | Full finance operations are outside Admin Portal launch scope; exact launch authority and approval thresholds remain open |
| A-09 Physical intake, measurement and custody | Authorized station/Operations actor; sender/hand-over party as relevant | Booking is not intake; measurement/acceptance/refusal and custody transfer are physical events | Only configured/authorized location staff can record supported actions; identity/evidence requirements depend on approved policy | Measurement discrepancy, refusal, damaged parcel, missing handover, and duplicate intake scan have defined outcomes | Capture actor, time, location, parcel target, measured facts, outcome and required evidence/reason | A booking cannot appear physically received without an authorized intake event; custody handover cannot be inferred from a route assignment | Major design gap; staffed station vs collection-centre capabilities and proof requirements unresolved |
| A-10 Location and service capability | Platform Admin configures; station/partner actors perform approved services | Location existence is distinct from service enablement and a successful parcel event | Configuration changes are privileged; partners do not inherit blanket access to all location functions | Disabled/unavailable location, incorrect capability, and reassignment have defined operational handling | Record material configuration and capability changes | A location offers only explicitly configured services; the system does not infer outgoing intake, collection, or every operation from location type alone | Location type/capability model and partner access rules require owner approval |
| A-11 Routing and route proposals | Operations prepares/reviews proposals; approved authority assigns route legs | Proposal → review/approval → assignment → movement evidence are separate boundaries | Only approved Operations/Admin roles may approve or assign; proposer/approver separation, if required, must be explicit | Rejected/stale proposals, capacity conflicts, reassignment and partial route failure have defined outcomes | Preserve proposal version, decision, approver, assigned resource/provider, time and reason | A proposal cannot dispatch a parcel; only an approved assignment can authorize the next operational step; movement requires separate event evidence | Operations responsibility is described; precise role, route model, approval thresholds and capacity rules unresolved |
| A-12 Dispatch, movement and handover | Authorized Operations/station/provider actor | Dispatch/handover/arrival events do not imply delivery completion or payment settlement | Actor may record only permitted movement/locations/legs; event target and assignment must be validated | Duplicate scan, missed event, failed handover, route deviation and provider outage have defined correction/escalation paths | Physical event records actor/time/location/target and supporting proof where required | A movement event must reference a valid parcel/assignment and cannot be accepted as proof for a different target or leg | Detailed transport event lifecycle and correction authority unresolved |
| A-13 Delivery attempt and outcome | Authorized delivery actor/Operations records outcome; receiver participates as policy requires | Attempt, failed attempt, successful delivery, collection and return are distinct outcomes | Proof-of-delivery and receiver verification follow approved evidence/privacy rules | Recipient unavailable, refusal, wrong address, damaged parcel, repeated failure, and return path have defined outcomes | Preserve attempt outcome, timestamp, actor, reason, and required proof without unnecessary personal data | Delivery is marked successful only when the approved proof requirements are satisfied; failed attempt does not silently close the shipment | Failure policy, proof requirements, reattempt limits, return/refusal handling unresolved |
| A-14 Notifications and Telegram | Server/system sends; authorised staff approve operational trigger where required | Notification is downstream of a verified business event, not a substitute for it | Secrets and destinations remain server-side; message contains only approved minimum data | Retry, duplicate delivery, unavailable provider, bad destination and opt-out have defined handling | Track attempt/outcome and correlation to triggering event without storing unnecessary message content | A retry does not create duplicate business events; launch Telegram notification follows the accepted admin-assignment gate | VLY-007 deferred; triggers, recipients, data minimisation, retries and deduplication require design |
| A-15 Admin and Operations access | Authenticated Admin/Operations staff act within approved responsibility | Authentication → authorization → action are separate checks | Every page and privileged API independently enforces server-side permission; customer identity never implies staff access | Expired/revoked token, failed claim, unauthorized direct navigation, and role/configuration change have safe denial paths | Security-sensitive actions and denials are recorded at an appropriate level without leaking secrets | Ordinary customer is denied protected pages and APIs; legitimate Admin flows still work; denial does not unnecessarily destroy the customer session | VLY-009 and VLY-010; direct-navigation and API tests still required; role granularity unresolved |
| A-16 Audit and evidence | System records; authorised reviewer investigates | Current state is distinct from history/evidence of how it was reached | Audit access is restricted; records cannot be altered by ordinary users | Failed event processing and correction must remain explainable; retention and repair policy defined | Capture actor/system, action, target, timestamp, outcome, reason, correlation/reference, and relevant evidence according to policy | A reviewer can reconstruct consequential transitions and identify missing evidence; audit record does not falsely claim an external physical event occurred | Audit scope, retention, immutable/tamper resistance and evidence policy unresolved |
| A-17 Support, exceptions and manual override | Authorized staff under the minimal hybrid model, according to the workflow-specific policy | Normal workflow and exception/override are distinguishable | DEC-022 requires explicit boundaries for sensitive actions; exact override authority, limits, reason, and any second approval must be defined per workflow | Manual correction does not falsify payment or physical facts; retry and escalation path are defined | Record original state, requested correction, actor, approver where required, reason and result | Each supported override is permission-checked server-side and leaves enough history to explain the exception | Exception catalogue, approval thresholds and workflow-specific separation of duties remain unresolved |
| A-18 Operational dashboard and reporting | Admin/Operations staff view approved metrics | Current-state counts, time-window totals, orders, shipments, movements and financial events are not interchangeable | Metrics expose only data permitted for the role | Query failure or stale data is indicated; no fabricated fallback numbers | Metric definition includes source, scope, timestamp/window and duplicate/linked-record handling | No demo values are presented as live data; every launch metric has an agreed definition and a reproducible source | VLY-012 open; define minimum launch metrics after security verification |
| A-19 Customer communications and privacy | System and authorised support actors communicate with relevant party | Communication follows an approved, attributable event and recipient relationship | Verify recipient entitlement; payer status alone grants payment confirmation/receipt information only by default; minimise exposed order/shipment and personal information | Bounce, provider failure, duplicate send and changed contact information have defined behaviour | Each party receives only approved notifications/minimum fields for their relationship; payment does not trigger full shipment-detail disclosure; retry does not alter underlying lifecycle state | DEC-024 sets the default payer privacy boundary; event/channel/recipient/field matrix, consent/retention, retry and deduplication remain unresolved |
| A-20 Production configuration and operational readiness | Owner/operator; system integrations | Development/test evidence is distinct from production verification | Production secrets, admin allowlists, webhook configuration, and provider settings are controlled and never exposed to clients | Missing/invalid configuration fails safely and is observable; rollout/rollback path is defined | Record release/configuration change evidence appropriate to operational risk | Release checklist demonstrates configured integrations, authorization, rules, webhook verification and recovery tests; no claim exceeds collected evidence | Deployment environment has not been independently inspected in this read-only pass |

## 4. Required failure/replay test families

The following are test families, not permission to execute against production. Select a safe test environment and use the approved lifecycle contract before testing.

1. **Identity and entitlement:** signed out, unverified account, ordinary customer, authorized Admin, expired token, cross-customer record access, guest-token missing/invalid, direct API request bypassing the UI.
2. **Concurrency and duplication:** repeated checkout submit, simultaneous stock reservation, duplicate payment callback/webhook, duplicate intake/movement/delivery event, repeated cancellation, repeated refund request where supported.
3. **Out-of-order events:** payment success after cancellation/expiry, delayed webhook after manual review, movement event before approved assignment, delivery event without required assignment/proof, stale route proposal approval.
4. **External dependency failure:** provider timeout, provider success followed by local persistence failure, webhook signature failure, notification outage, image-upload rejection, invalid/missing server configuration.
5. **Business exceptions:** insufficient stock, quote expiry/rate change, measurement discrepancy, intake refusal, missing parcel, failed delivery, recipient refusal, return/reversal, and manual correction.
6. **Data integrity and audit:** mismatched amount/currency/reference, wrong target ID, missing required evidence, unauthorized state change, correction of a previous event, and reconstruction of a past accepted quote/order.

For each applicable case, the approved test specification must state initial state, actor, request/event, expected result, unchanged data, resulting state, retry behaviour, audit evidence, and cleanup procedure.

## 5. Owner decisions required before this matrix can become an approved baseline

The matrix must not paper over the following unresolved areas:

1. **Actor and permission boundaries:** Admin vs Operations responsibilities, staff-role granularity, partner/station permissions, and any separation-of-duties requirements.
2. **Independent shipment booking:** DEC-023 sets registered/authenticated eligibility; DEC-024 accepts distinct booking-party/sender/receiver/payer/handover roles and payment-only payer visibility by default; DEC-025 accepts capability-based location actions and lean location records. Verification checkpoints, consent, change authority by type/stage, quote acceptance/expiry, cancellation, and shipment creation point remain open.
3. **Pricing and commercial terms:** inputs, shared rule coverage, rounding, fees/taxes, rate effective dates, quote validity, remeasurement and additional-payment/refund rules.
4. **Order/payment transitions:** expiry, cancellation, stock release, duplicate/out-of-order provider events, late payment, review states and fulfilment gates.
5. **Physical operations:** location capabilities, intake/measurement, custody evidence, route approval/assignment, dispatch, movement correction, delivery proof, failed attempts, collection and returns.
6. **Financial operations:** what is in launch scope, who owns refund/reversal/reconciliation decisions, and what audit/approval controls apply.
7. **Guest-order recovery:** whether guest-order claiming is required and the proof-of-ownership procedure (VLY-004).
8. **Notifications:** channels, event triggers, recipients, minimum data, retry/deduplication, privacy and Telegram assignment gate (VLY-007).
9. **Audit/evidence policy:** required events, retention, correction rules, reviewer access and any immutability requirements.
10. **Launch acceptance scope:** approved P0/P1/deferred requirements, dashboard metrics, runtime verification plan, and what evidence is required for production readiness.

## 6. Evidence and sign-off checklist

Do not mark this matrix approved until all applicable boxes are checked.

- [ ] Owner reviewed and accepted the cross-domain invariants in Section 2.
- [ ] Each domain row is classified as launch-required, explicitly deferred, or not applicable.
- [ ] Each **Decision needed** item has a recorded decision in `DECISIONS.md` or the relevant approved requirement.
- [ ] Actor/responsibility model and permissions agree with the approved workflow boundaries.
- [ ] Lifecycle transition tables include allowed transitions, guards, actors, rejected transitions and replay behaviour.
- [ ] API/data contracts are derived from approved behaviour and validated against existing source; no duplicate architecture is assumed.
- [ ] Each acceptance criterion has a testable setup, action, expected result and evidence source.
- [ ] Source findings are current and referenced in `IMPLEMENTATION_SOURCE_TRACEABILITY.md`.
- [ ] Runtime/deployment evidence is dated and scoped; untested behaviour is not marked verified.
- [ ] `PROGRESS.md`, `ISSUES.md`, `README.md`, and `SESSION_HANDOFF.md` point to the same current milestone.
- [ ] Owner explicitly approves the platform-wide SDD baseline before implementation resumes.

## 7. Recommended next sequence

1. Review this matrix as a draft and resolve owner decisions in Sections 5 and the relevant workflow documents.
2. Reconcile the accepted decisions across `DECISIONS.md`, `ISSUES.md`, `PROGRESS.md`, and the platform draft documents.
3. Update the source traceability baseline and identify any source questions that require a targeted read-only inspection.
4. Produce detailed lifecycle transition tables and test scenarios only for the workflows whose policy is approved.
5. Run the approved runtime/security verification plan in a safe environment and record dated evidence.
6. Obtain explicit owner approval of the reconciled platform-wide SDD.
7. Only then scope implementation PRs; keep each change focused and aligned with existing Next.js/Firebase architecture.


## D-04 reconciliation — DEC-025

The owner accepted a minimal per-location capability model. The initial location record is limited to name, address, active status, and configured capabilities. Walk-in intake creation, measurement, custody acceptance, payment collection/recording, and parcel release are distinct capabilities; each must be separately authorized. Capabilities are not inferred from location type, authenticated status, or Admin status. Consequential actions must be attributable to actor, location, and time with applicable evidence/reason.

The acceptance matrix must ultimately verify that inactive or unsupported locations cannot perform an action; one capability does not imply another; collection requires verified recipient entitlement; and partner/collection-centre permissions do not exceed configured capabilities. Exact staff assignment, partner access, measurement discrepancy rules, payment evidence, and collection verification remain unresolved. No implementation or runtime test is authorized by this policy decision.


## D-05 reconciliation — DEC-026

The owner accepted service-specific selection of fixed versus calculated pricing, service-configured quote validity, and a shared rule set across storefront delivery and independent shipment booking wherever inputs overlap. Applicable calculated-price inputs may include origin/destination or distance band, parcel weight, dimensions/volumetric weight, service class/delivery speed, and a configured minimum charge.

Acceptance evidence must eventually show that quotes are reproducible from preserved inputs and rate/rule version; a rate change cannot silently alter an accepted quote or completed payment; and service-specific expiry is enforced. Exact formulas, units, effective dates, taxes/fees/discounts, rounding, expiry/re-quote behaviour, and adjustment thresholds remain open. No application implementation or runtime test is authorized by this decision.

## D-06 reconciliation — DEC-027

Acceptance evidence must eventually demonstrate that quoted measurements and actual intake measurements are preserved separately; each measurement event is attributable to actor, location, and time with required evidence; and any proposed adjustment links to the original quote without silently mutating it. Routine variation and material discrepancy must be handled according to a configured, service-appropriate policy. Material/payment-impacting adjustments must be reviewed by authorized staff, and a proposal or dispute must not be represented as an approved/settled financial event.

Numeric thresholds, measurement units/service requirements, approval limits, second-person rules, customer consent/notification, and acceptance/dispute/refusal outcomes remain unresolved. No application implementation or runtime test is authorized by this decision.


## D-08 / DEC-029 accepted financial controls

- [ ] Verify cancellation does not automatically produce a refund and that cancellation, operational status, payment status, and refund status remain distinct.
- [ ] Verify late provider success after cancellation/expiry is recorded and reconciled without silently reactivating the cancelled record.
- [ ] Verify refund request is not represented as an executed refund; credits, additional payments, reversals, and chargebacks remain separately attributable.
- [ ] Verify duplicate/replayed provider events do not create duplicate financial effects and mismatches enter investigation/reconciliation.
- [ ] Verify consequential financial actions retain actor, timestamp, reason, reference, and applicable evidence.
- [ ] Verify dispatch still requires verified payment by default; any exception follows explicit authorization, reason, and audit requirements.

These are policy-derived acceptance directions, not evidence that current runtime behaviour has passed. Refund limits/timelines, cancellation fees, partial refunds, credit rules, late-payment disposition, reconciliation cadence, and exception ownership remain unresolved.

## D-09 / DEC-030 dispatch exception controls

- [ ] Verify dispatch remains blocked by default while required payment is unverified.
- [ ] Verify generic convenience overrides and exceptions outside explicitly approved operational circumstances are denied.
- [ ] Verify only staff with explicitly assigned dispatch-exception permission can approve; authentication or general Admin/Operations access alone is insufficient.
- [ ] Verify the requester cannot automatically approve their own exception and that material exceptions require a second approver once materiality rules are defined.
- [ ] Verify an exception does not change payment status or represent unverified payment as successful.
- [ ] Verify exceptions cannot bypass unrelated safety, custody, identity, legal, or other operational holds.
- [ ] Verify the parcel/shipment, reason, requester, approver(s), timestamp, supporting evidence, and decision/outcome remain attributable and reviewable.

These are policy-derived acceptance directions, not evidence that runtime behaviour has passed. Eligible circumstances, permission assignment, materiality/second-approval rules, monetary or operational limits, category-specific evidence, and pre-dispatch revocation remain unresolved.


## D-10 / DEC-031 routing and movement acceptance direction

- [ ] Verify a route proposal cannot itself authorize dispatch or establish a completed movement.
- [ ] Verify route approval and route-leg assignment are distinct from physical dispatch, handover, and arrival events.
- [ ] Verify only staff with explicitly assigned authority can approve, alter, revoke, or reassign route legs; prior assignments/decisions remain traceable.
- [ ] Verify movement evidence is linked to the correct shipment/parcel and route leg and records event type, location, physical actor where known, recording actor, timestamp, and applicable evidence.
- [ ] Verify staff recording a provider/driver event on their behalf are distinguishable from the physical actor.
- [ ] Verify delays, missed handovers, missing parcels, damage, and disputed custody transfers remain explicit exceptions and are not silently marked as successful movement.
- [ ] Verify launch operations do not depend on a Driver Portal or imply provider/driver direct access.

These are policy-derived acceptance directions, not evidence that runtime behaviour has passed. Route constraints, authority assignments, two-person approvals, mandatory evidence, capacity/provider rules, correction authority, and detailed exception outcomes remain unresolved.


## D-11 / DEC-032 delivery proof acceptance direction

- [ ] Distinguish delivery attempt, successful delivery, failed delivery, customer collection, and return.
- [ ] Require approved service-appropriate evidence for successful delivery; a staff status update alone is insufficient.
- [ ] Verify recipient authority under DEC-024; booking, sender, or payer status alone does not grant collection entitlement.
- [ ] Apply proof methods according to approved service policy; OTP and other examples are not universally mandatory.
- [ ] Retain failed-attempt reasons; do not treat an unsuccessful attempt as completed delivery.
- [ ] Require authority and attributable history for reattempt, return, holding, refusal, cancellation, and financial adjustments.
- [ ] Limit significant outcome notifications to information each recipient is authorized to receive.
- [ ] Preserve original delivery evidence and event history for authorized dispute review.

These are policy-derived acceptance directions, not runtime test results. Mandatory methods, OTP policy, attempt limits, resolution authority, holding duration, failure catalogue, loss/damage/refusal/dispute handling, and detailed tests remain unresolved.


## D-12 / DEC-033 audit and evidence acceptance direction

- [ ] Record consequential actions with attributable actor, action, affected resource, timestamp, applicable reason, and supporting evidence.
- [ ] Distinguish physical actor from staff recorder; do not treat an audit entry/status update alone as proof of physical custody, movement, or delivery.
- [ ] Preserve original consequential records and evidence; corrections/redactions are separately authorized, attributable, and traceable.
- [ ] Restrict audit/evidence review to explicitly authorized users; audit sensitive access and disclosure.
- [ ] Apply approved category-specific retention/deletion/anonymization rules and prevent routine deletion while an applicable legal hold is active.
- [ ] Record government-request authority, request/legal basis, scope, approval, and disclosure details; do not grant unrestricted platform access.
- [ ] Keep evidence source attribution and distinguish later additions, corrections, and redactions from originals.

These are policy-derived acceptance directions, not runtime test results. Retention periods, event/evidence catalogue, access matrix, two-person approval cases, deletion/legal-hold procedures, disclosure procedure, evidence integrity requirements, and detailed tests remain unresolved.


## D-13 / DEC-034 customer notification acceptance direction

- [ ] Trigger customer/staff notifications only from meaningful, verified business events.
- [ ] Verify notification queueing, sending, provider acceptance, delivery/read evidence, retries, and failure do not mutate or independently establish order, payment, shipment, dispatch, custody, or delivery state.
- [ ] Select recipients per event using DEC-024/DEC-032 party relationships and explicit entitlements; booking customer, sender, receiver, and payer are not interchangeable.
- [ ] Verify payer notifications default to relevant payment/receipt/refund/financial outcomes and do not disclose full shipment details merely because the payer paid.
- [ ] Minimize message fields; ensure links to further detail preserve authenticated access controls.
- [ ] Apply event-specific channel policy: email where configured, optional configured SMS subject to applicable consent/contact verification, and in-platform messages for authenticated experiences.
- [ ] Prevent duplicate sends for the same business event, recipient, and channel; apply bounded retries and retain attributable attempt/outcome information.
- [ ] Surface persistent notification failures for operational follow-up without silently substituting an unapproved channel.
- [ ] Keep Telegram deferred; verify any future paid-order Telegram notification cannot precede authorized Admin **Assign For Delivery** approval and separately approved Telegram purpose/audience/disclosure policy.

These are policy-derived acceptance directions, not runtime test results. Final event/channel matrix, timing, consent/preferences/contact verification, message templates/fields, retry limits, deduplication semantics, failure ownership, retention, and detailed tests remain unresolved.
