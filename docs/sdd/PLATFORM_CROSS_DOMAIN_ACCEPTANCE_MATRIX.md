# VeriLyft Cross-Domain SDD Acceptance Matrix

**Document status:** Draft for owner review — not approved for implementation  
**Created:** 29 October 2026  
**Repository baseline:** PR #67 merge commit `04c093927c8d47f9e1fe8351c9f8ecb48920b753`  
**Purpose:** Turn the existing platform SDD drafts into a reviewable matrix of business workflows, responsible actors, lifecycle boundaries, security requirements, failure recovery, evidence, and acceptance criteria.  
**Related documents:** `README.md`, `SPEC.md`, `DECISIONS.md`, `ISSUES.md`, `PROGRESS.md`, `SDD_COMPLETENESS_AUDIT.md`, `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md`, `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, `IMPLEMENTATION_SOURCE_TRACEABILITY.md`

## 1. Authority and use

This matrix is a **review aid**, not a new source of approved product policy. It consolidates acceptance questions already raised by the platform SDD and makes evidence needed for approval explicit. Rows marked **Proposed** must not be treated as approved requirements until the owner accepts them. An acceptance criterion can be used to guide later test design only after its associated policy and lifecycle decisions are resolved.

**Owner-policy status clarification (31 October 2026):** DEC-022–DEC-044, PM-01–PM-12, and BP-01–BP-22 have accepted owner-policy outcomes at the levels recorded in their authoritative decision documents. The owner also approved the A-01–A-20 scenario-design refinements consolidated in PR #39. These approvals do **not** approve every proposed criterion in this matrix, complete the actor/lifecycle/API contracts, convert the matrix into executable test specifications, or authorize implementation. Keep unresolved details and row-level evidence labels explicit.

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

The criteria below are proposed test outcomes. The high-level D-01–D-15 owner decisions are accepted; turn policy into concrete test cases using accepted decisions while retaining unresolved detailed rules and current technical contracts as explicit dependencies.

| ID / domain | Primary actor(s) and responsibility | Lifecycle / transition boundary | Security and authorization boundary | Failure recovery and idempotency | Evidence / audit requirement | Proposed acceptance criterion | Decision / verification dependency |
|---|---|---|---|---|---|---|---|
| A-01 Public storefront and catalogue | Visitor/customer browses; authorised Admin manages catalogue | Public visibility reflects approved active/inactive rules; catalogue state is not an order snapshot | Public reads expose only intended fields; catalogue mutations require Admin authorization | Missing/unavailable product data produces a safe empty/error state, not fabricated products or prices | Record privileged catalogue changes according to approved audit policy | Inactive items are not purchasable through either UI or direct API; displayed price and stock are revalidated by the server at checkout | Source/runtime verification; confirm public visibility and catalogue acceptance cases |
| A-02 Cart and checkout | Guest or signed-in customer submits selected items and delivery details | Cart intent is not a confirmed order; order creation uses server-validated item/price/stock facts | Client totals, arbitrary user IDs, and browser roles are not trusted | Repeated submission, stock contention, and partial failure have defined outcomes; no duplicate order or stock decrement without an explicit distinct purchase | Preserve order-time item/commercial facts and transaction outcome | Tampered price/quantity/stock requests are rejected or safely normalized by approved policy; concurrent purchases cannot oversell stock | Existing route is source-mapped; confirm duplicate-submit contract and test stock contention |
| A-03 Storefront order lifecycle | Customer; authorised Admin/Operations as approved | Order state remains distinct from payment and physical fulfilment/movement | Customer can access only owned order or a valid guest entitlement; staff actions require explicit server authorization | Cancellation, expiry, late payment, and retry outcomes are explicitly defined; stock restoration is applied at most once | Record status-changing actor/event and reason where applicable | Every allowed transition has a defined actor, guard, resulting state, rejection path, and duplicate-event behaviour | Decision needed for complete transition table; runtime tests outstanding |
| A-04 Customer account and order access | Signed-in customer manages own profile and views entitled orders | Authentication does not itself claim a guest order; recovery and claiming are separate under DEC-035 | Server checks verified auth and order entitlement; recovery requires proof of original checkout email; claiming additionally requires authenticated account plus a separate ownership challenge | Lost token, replayed/expired challenge, account closure, and unauthorized transfer require defined outcomes | Record recovery/claim decisions without exposing credentials | Order ID/email match alone never grants access; no multiple claims or silent transfer; recovery/claiming does not mutate commercial or fulfilment state | DEC-035 accepted; challenge/token details and VLY-009/VLY-010 runtime verification remain open |
| A-05 Independent shipment booking | Registered, authenticated booking party; sender, receiver, payer and handover person may differ; business-arranged booking identifies the business and booking party's relationship | Valid quote acceptance by the authenticated booking party confirms the booking and accepted terms; booking/payment do not prove physical intake or custody; a separate service-specific handover deadline applies | Server authorizes creation and customer-scoped access. Booking-party status does not grant blanket change or collection authority; payment alone does not grant full shipment-detail access | Abandonment before acceptance, unaccepted quote expiry, missed handover deadline, amendment, cancellation, and retry have defined outcomes; unauthorized role-based changes/access are denied | Only registered customers can create bookings; valid explicit quote acceptance confirms the booking; handover deadline is communicated before acceptance and in confirmation; payer visibility defaults to payment confirmation/receipt only; booking/payment do not authorize collection or falsely mark a parcel received/in transit | DEC-023, DEC-024, and DEC-038 accepted; exact verification methods, business identity/relationship representation, service-specific deadline values, detailed change matrix, and runtime evidence remain unresolved |
| A-06 Shared pricing and quote acceptance | Authenticated booking party/customer; authorized pricing Admin | Service-specific fixed, calculated, or hybrid model; explicit quote acceptance confirms the independent booking; payment and physical intake remain separate | Only authorized actors change pricing policy; clients cannot set authoritative rates, inputs, or totals | Service-configured quote validity; an unaccepted expired quote requires a fresh quote; accepted quote expiry does not silently cancel/rewrite the confirmed booking; separate handover deadline applies; revisions preserve history | Preserve service-applicable inputs, itemized charges, total, currency, rule/rate version, effective context, expiry, explicit acceptance, and communicated handover deadline | Shared approved rules apply across storefront delivery and independent shipment booking wherever inputs overlap; only configured inputs/models apply; equivalent inputs/rule version reproduce the result; rate changes do not mutate historical quotes; valid quote acceptance by authenticated booking party confirms booking | Exact formulas/rates, sources, service mapping, unit selections/conversion, rounding, taxes/fees/discounts, quote-validity durations, and handover-deadline values remain unresolved; DEC-038 resolves booking confirmation and accepted-quote expiry policy |
| A-07 Payment initialization and confirmation | Payer; payment provider; server integration | Initialization is not settlement; provider-confirmed result is separate from order/shipment progress | Provider secrets remain server-side; reference, amount, currency, purpose and entitlement are checked server-side | Duplicate callback/webhook, timeout, external success/local save failure, mismatched amount, and late success each have a defined recovery path | Keep provider reference and attributable processing outcome; do not equate webhook log with a complete ledger | Forged success cannot settle an order; repeated events do not double-process payment/stock; mismatches enter the approved review path | Source mapping exists; VLY-005 and VLY-009 runtime matrix required; payment-purpose contract needs approval |
| A-08 Refunds, adjustments and reconciliation | Authorized staff under the approved hybrid model; Finance responsibility remains distinct; customer accepts/disputes commercial adjustments | Charge, additional payment, refund request, executed refund, reversal, credit, write-off, and reconciliation are separate financial events; adjustment acceptance is not settlement | DEC-022 requires explicit permission/approval boundaries for sensitive financial actions; exact authority, limits, and second-person rules remain open. Customers cannot self-approve privileged state changes | Disputed additional charges remain held pending review; over/underpayments, late payments, failed attempts, duplicate/replayed events, and provider/local-state divergence have explicit review/reconciliation paths | Financial event history explains amount, currency, reason, actor, provider reference, source quote/agreement, and resulting balance/status as applicable | Rejected quotes create no payment obligation; accepted adjustments preserve revised agreement and amount due; DEC-040 rejection invokes an authorized service-resolution decision, not an automatic cancellation/refund/credit/charge; proposed/disputed adjustments are not settled events; refund request is not execution; credit is not cash refund; late payment does not reactivate cancellation | DEC-041 high-level payment and financial-settlement boundaries are accepted; detailed approval limits, refund timelines, cancellation fees, partial-refund rules, credit expiry/use, late-payment disposition, reconciliation frequency/ownership, payment-method/service/location configuration, and DEC-040 decision authority/eligibility and customer response handling remain open |
| A-09 Physical intake, measurement and custody | Authorized station/Operations actor; sender/hand-over party as relevant | Booking is not intake; declared and actual measurements are distinct; measurement, acceptance/refusal, and custody transfer are physical events; each later custody transfer requires actual handover and receipt | Only configured/authorized location staff can record supported actions; measurement and custody capabilities remain separate; physical actor, receiving actor, and recorder are distinguishable | Material discrepancy, remeasurement, refusal, damaged parcel, missing handover, disputed/failed transfer, and duplicate intake/transfer event follow explicit review/correction paths | Capture declared and actual values with explicit unit; physical custody/transfer evidence identifies applicable parcel, source/previous custodian, intended destination, actual receiver, physical actor, recorder if different, time/location, outcome, evidence/source and reason; preserve prior history | Booking/payment/dispatch/arrival/attempt does not establish physical receipt or transfer; preserve last confirmed custody through failed/disputed handover; no silent overwrite; administrative location correction is not physical movement; DEC-040 controls material/payment-impacting adjustments and customer rejection outcomes; physical exceptions do not imply liability or financial outcome | Required measurements/units, conversion rules, thresholds, service-specific handover proof, confirmation/dispute/correction authority, investigation ownership, hold controls, evidence retention, and runtime proof remain unresolved; high-level policy accepted in DEC-027, DEC-040, and DEC-042–044 |
| A-10 Location and service capability | Designated Admin users configure capabilities only within assigned authority; station/partner actors perform only explicitly enabled services/actions | Location existence, active status, service enablement, action capability, and a completed physical event are distinct | The location must independently support the service/action, and the acting staff member must independently hold assigned authority; partner access is not inferred | Inactive/unsupported locations or missing action capability block new work; capability revocation does not erase or transfer existing custody | Record capability grants/changes/revocations with affected location, actor, time, and applicable reason; preserve historical operational records | A location offers only explicitly configured services and actions; no capability inheritance or inference from location type, Admin status, or another enabled action | DEC-043 is accepted policy; exact service/location/action matrix, capability catalogue, Admin assignment granularity, staff scopes, partner arrangements, queued-work treatment, and temporary closure remain open |
| A-11 Routing and route proposals | Operations prepares/reviews proposals; approved authority assigns route legs | Proposal → review/approval → assignment → movement evidence are separate boundaries | Only approved Operations/Admin roles may approve or assign; proposer/approver separation, if required, must be explicit | Rejected/stale proposals, capacity conflicts, reassignment and partial route failure have defined outcomes | Preserve proposal version, decision, approver, assigned resource/provider, time and reason | A proposal cannot dispatch a parcel; only an approved assignment can authorize the next operational step; movement requires separate event evidence | Operations responsibility is described; precise role, route model, approval thresholds and capacity rules unresolved |
| A-12 Dispatch, movement and handover | Authorized Operations/station/provider actor | Dispatch, route-leg movement, physical handover, arrival, and delivery are distinct events; none alone proves another event or payment settlement | Actor may record only permitted movement/locations/legs; event target and assignment must be validated; physical actor, actual receiver, and recorder are distinguishable | Duplicate, wrong-target/leg, missed, failed, disputed, or incompletely evidenced handover; route deviation; missing/damaged parcel; and prolonged hold require controlled review | Physical event records parcel/leg, source and destination, physical actor, actual receiver, recorder if different, time/location, outcome, evidence/source and reason as applicable; prior confirmed custody remains traceable | Assignment/dispatch/arrival/attempt is not proof of possession change; completed transfer requires actual handover and receiving-party possession; failed/disputed handover preserves last confirmed custody; corrections preserve original evidence; no unsupported delivery/recovery or automatic liability/financial outcome | Service-specific transfer proof, confirmation/dispute/correction authority, investigation ownership, hold controls, evidence retention, lifecycle and correction authority remain unresolved under DEC-044 |
| A-13 Delivery attempt and outcome | Authorized delivery actor/Operations records outcome; receiver participates as policy requires | Attempt, failed attempt, successful delivery, collection and return are distinct outcomes | Proof-of-delivery and receiver verification follow approved evidence/privacy rules | Recipient unavailable, refusal, wrong address, damaged parcel, repeated failure, and return path have defined outcomes | Preserve attempt outcome, timestamp, actor, reason, and required proof without unnecessary personal data | Delivery is marked successful only when the approved proof requirements are satisfied; failed attempt does not silently close the shipment | Failure policy, proof requirements, reattempt limits, return/refusal handling unresolved |
| A-14 Notifications and Telegram | Server/system sends; authorized staff approve operational trigger where required | Notification is a downstream side effect of a verified business event and never changes business state | Recipient/fields follow DEC-024/DEC-032 entitlements; minimize content and preserve authenticated access controls | Prevent duplicate sends per event/recipient/channel; bounded retries; surface persistent failures without unapproved fallback | Track attempt/outcome and correlation to triggering event | Email primary where configured; SMS optional subject to configuration/consent; Telegram deferred and requires Admin Assign For Delivery plus separate purpose/audience/disclosure approval | DEC-034 accepted; event/channel/recipient/field matrix, consent, retries, deduplication, and failure ownership remain open |
| A-15 Admin and Operations access | Authenticated Admin/Operations staff act within the accepted minimal hybrid responsibility model and explicitly assigned action permissions | Authentication → authorization → action are separate checks; staff permission assignment/revocation and location capability are distinct controls | Every page and privileged API independently enforces server-side action permission; location-dependent actions require both assigned staff permission and active location capability; customer identity never implies staff access | Expired/revoked token, failed claim, removed permission/capability, unauthorized direct navigation, and role/configuration change have safe denial paths | Permission grants/revocations, sensitive approvals, emergency access, audit/evidence access and denials are attributable without leaking secrets | Ordinary customer is denied protected pages/APIs; each staff action requires its explicit permission and any applicable location capability/second approval; designated permission administrators alone may grant/revoke; legitimate Admin flows remain available | VLY-009 and VLY-010; direct-navigation/API/runtime tests remain required. PM-01–PM-12 policy is accepted; exact permission catalogue, technical enforcement, materiality thresholds and emergency-access parameters remain open; do not describe the accepted action-level model as unresolved role granularity |
| A-16 Audit and evidence | System records consequential events; explicitly authorized reviewers investigate; designated staff review disclosures and holds within assigned authority | Current state remains distinct from the attributable event history and source evidence that explain how it was reached; physical actor, receiver, recorder and external source remain distinguishable | Audit viewing, exporting and external-disclosure approval are separate permissions under PM-08; Admin status alone grants no blanket access; ordinary users and staff without the relevant permission cannot read, export, alter or delete protected evidence | Failed/incomplete event processing, denied access, correction, redaction, retention expiry and legal hold remain explainable; original evidence is preserved and changes are separately attributable | Record actor/system or source, action, affected resource, timestamp, outcome, reason where applicable, correlation/reference, evidence source and relevant approval; audit access, export, correction, hold and disclosure actions are themselves attributable | Reviewer can reconstruct consequential transitions, identify missing or conflicting evidence, distinguish originals from additions/corrections/redactions, and see that a log alone does not prove a physical event; government request does not itself authorize access or disclosure | DEC-033 and PM-08 accepted at policy level; event/evidence catalogue, reviewer/permission mapping, integrity controls, retention schedule, legal-hold authority, correction/redaction procedure, two-person disclosure cases and executable tests remain open |
| A-17 Support, exceptions and manual override | Authorized staff act under the minimal hybrid model and the applicable workflow; Support records/verifies requests and escalates, while designated Finance/Operations/Admin/reviewers decide only within assigned authority | Normal processing, request intake, review/approval, exception resolution, correction and appeal remain distinct; a request or support note does not itself authorize a change | Support responsibility alone grants no booking-party authority, financial, custody, dispatch or unrestricted audit access. Every consequential action requires its own server-side action permission and applicable location capability; approval separation applies only to the policy-defined consequential cases, not universally | Preserve unresolved holds and last confirmed physical/financial facts; retries/replays do not duplicate effects; escalate unresolved or disputed cases to the assigned decision-maker without silently closing or bypassing them | Preserve requester identity/relationship and request, original state/evidence, actor/recorder, reason, scope, reviewer/approver where required, decision/outcome, correction link and audit/access history | Support can assist, verify, acknowledge, route and escalate without impersonating the booking party or independently approving refunds, changing payment/custody facts, releasing parcels or authorizing dispatch; authorized reviewers resolve exceptions with attributable evidence and preserved originals | Accepted constraints: DEC-022, DEC-029–DEC-035, DEC-040–DEC-044; PM-05–PM-08 and PM-11–PM-12; BP-04–BP-05, BP-08, BP-12–BP-13, BP-17, BP-19–BP-22. Exact permission catalogue, service-specific exception eligibility, thresholds, reviewer assignments, evidence catalogue and technical enforcement remain open |
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

## 5. Outstanding specification work under accepted owner decisions

The high-level owner decision queue (D-01–D-15) is complete. The following work remains before this matrix can become an approved, testable baseline; these are detailed specification, traceability, or evidence tasks rather than pending high-level owner decisions.

1. **Actor/permission detail (DEC-022, DEC-025):** action-level Admin/Operations permissions, staff assignment, partner/station access, sensitive-action limits, and second-person approval cases.
2. **Booking/party detail (DEC-023, DEC-024):** verification checkpoints, business-account handling, sender/receiver consent, change authority by type/stage, booking-to-shipment creation point, and parcel cardinality.
3. **Pricing/settlement (DEC-026–DEC-029):** formulas/rates, input sources, service mappings, unit selections/conversion, rounding, taxes/fees/discounts, accepted-quote expiry edge cases, numeric discrepancy thresholds, approval limits, service-resolution after adjustment rejection, refund/credit limits, late-payment disposition, and reconciliation ownership.
4. **Physical operations (DEC-025, DEC-028, DEC-030–DEC-032):** capability assignment, measurement requirements, custody evidence, collection verification, route constraints/capacity, mandatory movement/delivery evidence, failed-delivery and return authority.
5. **Guest-order recovery (DEC-035):** challenge form/lifetime, rate limits, credential rotation/revocation, eligibility, support exception procedure, and cross-account/replay tests.
6. **Notifications (DEC-034):** event/timing/channel/recipient/field matrix, consent/preferences, contact verification, retry limits, deduplication semantics, retention, and persistent-failure ownership.
7. **Audit/evidence (DEC-033):** event catalogue, retention, reviewer matrix, correction/redaction, deletion/anonymization, legal-hold authority, evidence integrity, and disclosure workflow.
8. **Launch/readiness (DEC-036):** requirement-level P0/P1/deferred classification, detailed acceptance scenarios/evidence, production-like environment, blocker ownership, backup/restore, monitoring, incident response, rollback, and sign-off.
9. **Technical contracts:** conceptual relationships, existing source reuse, request/response contracts, authorization enforcement, idempotency, compatibility, and migration questions must be reconciled with inspected application source before implementation.

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

1. Reconcile this matrix with accepted DEC-022–DEC-044 policies and the rest of the SDD.
2. Complete requirement-level P0/P1/deferred mapping against DEC-018 and DEC-036.
3. Refresh source traceability through read-only inspection; identify source facts, gaps, and unverified claims.
4. Define lifecycle transition tables and concrete success/failure/security/replay/concurrency/recovery scenarios.
5. Map each P0 acceptance criterion to dated, scoped evidence requirements.
6. Assess production readiness and identify release blockers/owners.
7. Obtain explicit owner approval of the complete reconciled platform-wide SDD before implementation planning.


## D-04 reconciliation — DEC-025

The owner accepted a minimal per-location capability model. The initial location record is limited to name, address, active status, and configured capabilities. Walk-in intake creation, measurement, custody acceptance, payment collection/recording, and parcel release are distinct capabilities; each must be separately authorized. Capabilities are not inferred from location type, authenticated status, or Admin status. Consequential actions must be attributable to actor, location, and time with applicable evidence/reason.

The acceptance matrix must ultimately verify that inactive or unsupported locations cannot perform an action; one capability does not imply another; collection requires verified recipient entitlement; and partner/collection-centre permissions do not exceed configured capabilities. Exact staff assignment, partner access, measurement discrepancy rules, payment evidence, and collection verification remain unresolved. No implementation or runtime test is authorized by this policy decision.


## D-05 reconciliation — DEC-026

The owner accepted service-specific fixed, calculated, or hybrid pricing; service-configured quote validity and inputs; and a shared rule set across storefront delivery and independent shipment booking wherever inputs overlap. Under DEC-039, there is no universal formula or input set: each service uses only its explicitly approved model and configured inputs. Potential inputs include origin/destination, distance or an approved distance band, weight, dimensions/volumetric weight, service class/delivery speed, configured minimum charge, and documented special handling. The trusted server validates inputs and calculates the authoritative price; the browser cannot set the final payable amount. Quotes transparently disclose applicable charge components and total; fees/taxes/discounts are not silently assumed zero or added.

Acceptance evidence must eventually show that quotes are reproducible from preserved inputs and rate/rule version; a rate change cannot silently alter an accepted quote or completed payment; unaccepted quote expiry requires a fresh quote; accepted quote expiry does not silently cancel/rewrite the confirmed booking; and the separately configured service handover deadline is communicated and enforced. Exact formulas/rates, service-to-input mapping, input sources, units/conversions, distance source/bands, effective dates, tax/fee/discount treatment, rounding, minimums, quote-validity durations, handover durations, and adjustment thresholds remain open. No application implementation or runtime test is authorized by this decision.

DEC-039 additionally requires client-submitted values to remain inputs only, server-authoritative pricing, transparent charge components, and historical quote preservation. This is a policy boundary, not proof of source implementation or runtime verification.

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

These are policy-derived acceptance directions, not runtime test results. DEC-033 and PM-08 establish the accountable-recordkeeping and separate audit-view/export/disclosure permission policy; the checklist remains an acceptance direction, not proof of implementation. Retention periods, event/evidence catalogue, reviewer-to-permission mapping, two-person approval cases, deletion/legal-hold procedures, disclosure procedure, evidence integrity requirements, and detailed tests remain unresolved.


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


## D-14 / DEC-035 guest-order recovery and claiming acceptance direction

- [ ] Preserve storefront guest checkout; do not confuse guest shipment-booking eligibility with storefront guest orders.
- [ ] Deny access based on an order reference alone or an email-address match alone.
- [ ] Require proof of control of the original checkout email through a challenge delivered to that address before guest-order recovery issues a replacement access credential.
- [ ] Require authenticated account context plus a separate ownership challenge before optional guest-order claiming.
- [ ] Verify server-side that the order is eligible and not already claimed; prevent association with multiple accounts and prohibit silent transfer.
- [ ] Ensure recovery credentials/challenges expire, resist replay and abuse, and prior access credentials are invalidated or rotated after successful recovery.
- [ ] Ensure failure responses do not disclose whether an order exists and credentials do not leak through logs or ordinary notification content.
- [ ] Keep recovery and claiming separate from payment, cancellation, fulfilment, shipment, and delivery state transitions.
- [ ] Require separately approved verification, authorization, and audit procedures for any future support-assisted recovery or exceptional transfer.

These are policy-derived acceptance directions, not runtime test results. Challenge format/lifetime, rate limits, post-fulfilment eligibility, account deletion consequences, exceptional transfer/support procedure, token mechanics, retention, and detailed denial/replay/cross-account tests remain unresolved.


## D-15 / DEC-036 launch-priority and readiness acceptance direction

- [ ] Trace every approved launch requirement to an explicit P0, P1, deferred, or not-applicable classification; do not silently downgrade DEC-018 launch scope.
- [ ] Confirm P0 covers the owner-approved lean launch scope and essential safety, security, financial, operational, legal, and customer-access requirements.
- [ ] For every P0 requirement, define a concrete acceptance scenario and required evidence for relevant success, failure, authorization, replay/concurrency, and recovery paths.
- [ ] Record evidence date, environment, scope, result, and the requirement/criterion it supports.
- [ ] Distinguish designed, implemented, tested, production-like verified, and owner-accepted-for-launch states.
- [ ] Do not accept source presence, page rendering, schema presence, passing type checks, or a successful happy path as sufficient launch evidence.
- [ ] Confirm applicable security/privacy/server-side authorization, authoritative payment/financial integrity, attributable operational/physical-event evidence, and production configuration/deployment/monitoring/backup/recovery/incident/rollback evidence.
- [ ] Identify each P0 release blocker, accountable owner, resolution evidence, and any separately approved lawful exception.
- [ ] Explicitly list P1 and deferred scope; retain DEC-018 deferrals unless the owner approves a change.
- [ ] Complete a dated release checklist and obtain explicit owner sign-off after the full platform-wide SDD and evidence baseline are reconciled.

These are governance-derived acceptance directions, not evidence that the current application has passed them. Requirement-level priorities, detailed scenarios, evidence artifacts, production-like environment, operational ownership, runbooks, and final sign-off remain open.

## Booking-party authority acceptance direction — DEC-023 / DEC-024

Owner policy BP-01–BP-22 is recorded in `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`. The following acceptance families must be incorporated into executable scenarios during later test design; they are not evidence of implemented or tested behaviour.

| Acceptance family | Required observable outcome |
|---|---|
| Booking-party changes | Authenticated booking party can initiate only permitted pre-intake changes; price/service changes require revised quote acceptance; sender/receiver/collection changes enforce applicable verification and review. |
| Party request boundaries | Sender/receiver requests through Support do not mutate a booking without booking-party authorization or a documented approved exception. Payer association alone grants no edit/cancel authority. |
| Post-intake control | Post-intake changes are staff-mediated; post-intake/dispatch booking transfers require designated Admin review. |
| Cancellation and transfer | Cancellation is distinct from refund. Transfer requires a new authenticated party's explicit acceptance and preserves original financial/payment/audit history and liability attribution. |
| Collection authorization | Receiver and nominated alternative collectors are verified before release. Conflicting collection instructions place release on hold until an authorized decision. Booking or payment alone cannot release a parcel. |
| Delegated access | Access is limited to explicitly authorized data/actions, expires, can be revoked, cannot be sub-delegated, and cannot expose unrelated customer records. |
| Security and exceptional authority | Compromise, death/incapacity, and booking-party unavailability trigger verification/review; no automatic transfer, cancellation, refund, or release occurs solely on an unverified report. |
| Privacy and disputes | Deletion requests respect physical lifecycle, financial reconciliation, retention/legal hold, and audit obligations. Disputed values preserve originals; appeals and further review follow BP-19–BP-22. |
| Notifications | Booking party, sender, receiver, payer, and alternative collector receive only role-appropriate minimum information, subject to consent/preferences. |

Before these scenarios can be marked executable, define verification and consent evidence, exact change/lifecycle matrix, exception authority, transfer-liability acceptance, delegated-access actions/duration, retention rules, notification fields, dispute severity/targets, reviewer eligibility, appeal procedure, and test environment.


### D-06 acceptance refinement — DEC-040

Acceptance evidence must eventually demonstrate that: a non-material discrepancy leaves accepted terms unchanged; potentially material/payment-impacting discrepancies enter required review; adjustment proposals preserve and reference the original quote/agreement; customer acceptance is explicit and silence is not acceptance; acceptance does not itself settle payment; disputes hold the disputed additional charge; rejection invokes an authorized service-resolution decision without automatically cancelling/refunding/crediting/charging; continuation under original terms is allowed only where safe and commercially feasible; alternative service requires separately accepted pricing; cancellation follows its own policy; and dispatch is blocked under a rejected revised price. Exact thresholds, evidence, authority/eligibility, response periods, technical contracts, and runtime evidence remain open. No implementation is authorized.


### DEC-041 payment and financial-settlement acceptance direction

The following outcomes must be represented in later executable acceptance scenarios. These are policy-derived requirements, not evidence of implemented or tested behaviour.

| Acceptance family | Required observable outcome |
|---|---|
| Booking versus payment | Quote acceptance confirms booking but does not establish payment; booking, payment, intake/custody, cancellation, and dispatch remain distinct. |
| Advance payment | A browser redirect or customer claim cannot establish success; settlement requires authoritative provider/bank/approved-source confirmation. |
| Payment at intake | Only methods enabled for the location may be used; cash has attributable receipt/equivalent evidence and is included in reconciliation; payment collection does not itself prove custody acceptance. |
| Partial payment | Partial payment is accepted only for a service that explicitly permits it; received and outstanding amounts remain distinguishable; partial settlement alone does not pass the normal dispatch gate. |
| Underpayment/overpayment | Both require authorized resolution; neither is silently discarded, overwritten, or automatically converted into refund/credit. |
| Pending/failed/retry | Pending and failed attempts do not count as settlement; retry and replay cannot duplicate financial effects. |
| Late success | A late successful payment is linked to its original transaction, reconciled, and does not automatically reactivate an expired/cancelled booking/order/shipment. |
| Refund/credit/reversal/chargeback | Request, approval, initiation and confirmed refund execution are distinguishable; partial refund is authorized and linked to its origin; credit is distinct from cash refund; reversal/chargeback preserve original history. |
| Reconciliation | Provider/bank records and applicable location cash collections are reconciled; mismatches are investigated with attributable outcomes, not silently corrected. |
| Dispatch gate | Verified full settlement of the amount currently due is required by default; partial, pending, failed, or unverified payment does not satisfy the gate. A DEC-030 exception is separately authorized and does not mutate payment status or bypass unrelated holds. |
| Financial accountability | Consequential financial actions preserve actor, timestamp, reason, transaction/reference and applicable evidence; duplicate/replayed provider events do not duplicate financial effects. |

Before these scenarios can be marked executable, specify service/location payment configuration, partial-payment eligibility, method-specific evidence, cash/transaction limits, refund/credit authority and timelines, late-payment disposition, reconciliation cadence/ownership/tolerances, chargeback handling, DEC-030 exception eligibility/limits/evidence, technical idempotency/recovery contracts, and safe test fixtures. No implementation or runtime evidence is implied.

## A-09/A-10 — DEC-042 physical intake, custody, and location acceptance refinement

The following acceptance direction supplements A-09 (physical intake, measurement and custody) and A-10 (location and service capability). These are scenario requirements, not evidence of implementation.

- **Separate intake paths:** An existing confirmed booking and staff-created walk-in intake are distinguishable; walk-in intake is not misrepresented as staff-assisted customer booking.
- **Location and actor guard:** Reject consequential actions at inactive or unsupported locations and reject actors without the specific assigned authority, even if authenticated or Admin.
- **Distinct physical outcomes:** Refusal before custody, accepted custody, and physical receipt retained under a hold are distinguishable. If a parcel is physically held during review, its custody is recorded and the hold prevents normal onward processing/dispatch.
- **Commercial/financial separation:** Booking, accepted terms, custody, payment, dispatch, and delivery remain separate. A custody event cannot imply settlement, cancellation, refund, credit, or delivery.
- **Measurement/condition integrity:** Declared and actual measurements remain separate and use applicable service units. Inspection/evidence requirements are service-specific; no unnecessary personal data or photography is collected.
- **Custody attribution:** Each physical event identifies the parcel, relevant handover/receiving actors, location, time, outcome, and applicable evidence/reason. Externally performed events identify their reported source and do not falsely imply staff observation.
- **Inactive location continuity:** Deactivation prevents new work but does not remove visibility/accountability for parcels already held there.
- **Transfer integrity:** Attempted and completed transfers are distinguishable; each completed handover preserves source, recipient/location, actor, time, outcome, and applicable evidence/reason without overwriting prior custody history.
- **Exception handling:** Missing/damaged parcels, disputed/failed handovers, incorrect location assignments, and prolonged holds enter controlled resolution; no automatic liability or financial outcome is inferred.

**Still required before executable tests:** Service-specific checklist and prohibited-item rules; identity/acknowledgement/receipt methods; evidence/retention; actor/partner authority and second-person controls; hold ownership and time limits; transfer correction authority; exception outcomes; and technical/source/runtime evidence. DEC-042 is policy direction only.

## A-10 refinement — DEC-043 location capability and authority scenarios

The following acceptance direction supplements the revised A-10 base row and DEC-025/DEC-042. DEC-043 is accepted owner policy; this refinement specifies policy-derived acceptance scenarios without implying implementation or closing the detailed service/location/action, capability-catalogue, assignment, partner, or technical dependencies.

- **Service/action eligibility:** Reject new work where the location is inactive, the relevant service is not enabled, or the specific action capability is absent. A location label/type must not satisfy these checks.
- **Independent actor authorization:** Reject an actor lacking the assigned permission for the requested action/scope even when the location supports it. Reject work at an unsupported location even when the actor has broad staff/Admin access.
- **No capability inheritance:** Enabling measurement must not silently enable custody acceptance, payment collection, release, outgoing intake, or handover. Verify each action independently.
- **Configuration authority:** Only designated Admin users with the relevant assigned authority may grant, change, or revoke capabilities. Editing a location, activating it, assigning staff permissions, and configuring capabilities must not be treated as interchangeable authority.
- **Configuration accountability:** Capability changes preserve actor, affected location, changed capability/configuration, time, and applicable reason; historical operational records remain unchanged.
- **Revocation continuity:** Revoking a capability or making a location unavailable prevents new work requiring it, while parcels already held remain visible and accounted for. No silent custody reassignment or implied physical transfer is accepted.
- **External physical actors:** Partner/collection-centre/carrier/driver actions remain distinguishable from internal staff recording events; no direct partner/driver login is assumed at launch.
- **Lean launch scope:** No automated hours, capacity, or availability scheduling is assumed.

**Still required before executable tests:** Approved service/location/action matrix; exact capability catalogue; Admin authority and staff permission scopes; partner arrangements; queued-work and temporary closure procedures; audit retention; technical/source/runtime evidence. DEC-043 is policy direction only.



## Cross-domain acceptance refinement — DEC-044 custody transfers and physical exceptions (A-09, A-12, A-13, A-16, A-17)

The following outcomes must be covered by later executable acceptance scenarios. These are policy-derived requirements, not evidence of implementation or test execution.

| Acceptance family | Required observable outcome |
|---|---|
| Assignment versus custody | Route assignment, dispatch authorization/record, or arrival alone does not change recorded custody. |
| Completed handover | A transfer is complete only after actual physical handover and receiving-party possession are established with applicable evidence. |
| Transfer attribution/history | Each handover is distinct and attributable to source/previous custodian, intended destination, actual receiver, physical actor, recording staff member when different, time/location, outcome, and applicable evidence/reason; prior history remains available. |
| Failed handover | Refusal, failed attempt, or non-receipt is not recorded as completed transfer; last confirmed custody remains preserved. |
| Disputed handover | Conflicting claims enter controlled investigation; route/dispatch records alone do not prove receipt; competing accounts and evidence sources remain preserved. |
| Incomplete documentation | Known physical possession change is investigated without fabricating proof; actual possession is not left ambiguous. |
| Correction | Erroneous custody/location records are corrected through a separately attributable, reasoned record; original event/evidence remains preserved. |
| Missing parcel | Discovery context, last confirmed custody/location, movement history, and available third-party evidence are preserved; no unsupported transfer/delivery/recovery is asserted; resolution is authorized and reasoned. |
| Damaged parcel | Discovery time/place, observer/reporter, circumstances, condition evidence, and surrounding custody history are preserved; last custodian is not automatically assigned fault. |
| Incorrect location | Original assignment remains historically visible; actual location is recorded when established; administrative correction is not mistaken for physical movement. |
| Prolonged hold | Actual custody, hold reason, and accountable owner remain identifiable; unresolved hold does not imply normal processing/dispatch permission. |
| Exception closure | Unresolved exceptions cannot be silently closed; authorized resolution, actor/authority, reason, and supporting evidence are traceable. |
| Financial/legal outcome | Missing/damage/transfer exception alone does not trigger refund, credit, compensation, insurance, liability, or customer-entitlement outcome. |

**Still required before executable tests:** Service-specific proof/verification methods; who may confirm, dispute, and correct transfers; second-approver rules; investigation ownership; damage assessment; hold review/maximum periods; financial/customer entitlement policies; exact statuses and technical contracts; evidence retention; source reconciliation; and safe test fixtures. DEC-044 is policy direction only; no implementation or runtime evidence is implied.


## A-15 reconciliation — accepted staff permission policy (PM-01–PM-12)

The A-15 access boundary must reflect the accepted policy outcomes in `PLATFORM_STAFF_PERMISSION_DECISIONS.md`:

- **Permission administration (PM-01):** only designated Admin users may grant, change, or revoke staff permissions; Admin status alone is insufficient. Changes record the administrator, target, permission/scope, time, reason, and outcome.
- **Assignment model (PM-02):** permissions are assigned at the individual-action level; permission sets may be convenience groupings. Relevant location and operational scope applies. One permission does not imply another.
- **Location guard (PM-03):** a location's active capability and the staff member's assigned permission are cumulative, independent requirements for a location-dependent action.
- **Sensitive approvals (PM-05–PM-07):** second approval is accepted for the specified consequential financial actions, material measurement adjustments, and consequential operational exceptions. The requester cannot approve their own action. Thresholds/materiality and eligibility remain open.
- **Audit and disclosure (PM-08):** viewing, exporting, and approving external disclosure are separate permissions; Admin status is not blanket audit access.
- **External actors and other responsibilities (PM-09–PM-11):** partners/drivers have no direct platform login at launch; Management receives explicitly assigned oversight/reporting access, not automatic operational authority; Support has limited customer/order access and escalates sensitive actions.
- **Emergency access (PM-12):** break-glass access is justified, minimum-scope, time-limited, audited, reviewed, and revoked; it does not bypass financial, evidence, or legal controls.

**Remaining specification:** the exact action/permission catalogue, permission-set contents, staff identity lifecycle, designated-admin recovery, location/staff scope representation, server-side enforcement across pages/APIs/jobs/data access, approver eligibility, materiality thresholds, emergency duration/renewal, audit retention and executable denial/approval tests. These are technical and operational specification gaps, not unresolved owner policy on whether permissions are action-level.

No new roles, claims, routes, collections, fields, or implementation decisions are introduced. The existing architecture must be inspected and reused after the complete SDD is approved.



**Repository baseline refresh — 31 October 2026:** PR #67 is merged at `04c093927c8d47f9e1fe8351c9f8ecb48920b753`. The owner has approved Reviews 1 and 2 of the five-review SDD closure process, including the policy direction to preserve accepted decisions, define service-specific configurable rules, defer unsupported numerical values until context is established, and require evidence-backed operations and production release. This refresh does not approve every proposed criterion, convert the matrix into executable test specifications, or authorize implementation. The application-source inspection baseline remains `e0f69055d33dd9399c23e1d793f359468229c856`; the repository comparison through PR #67 lists SDD documentation paths only and is not runtime or production verification.


## Lifecycle event/state contract cross-reference

When converting the cross-domain acceptance rows into executable cases, apply `PLATFORM_LIFECYCLE_EVENT_AND_STATE_CONTRACT_MATRIX.md` to distinguish commands, decisions, provider/physical observations, authoritative facts, state projections, evidence and corrections. Include applicable late/out-of-order, disputed-event, projection-recovery and correction cases. This does not change current P0 status or approve a new event architecture.


## M2 service catalogue and journey availability acceptance refinement — DEC-046 — 2 November 2026

These policy-derived outcomes must be translated into executable cases only after the service/location/action, pricing, scheduling and technical contracts are resolved. This table is not evidence of implementation or test execution.

| Acceptance family | Required observable outcome |
|---|---|
| Catalogue scope | The customer-facing launch catalogue contains Standard, Express and Scheduled; operational In-PUDO/Out-PUDO/Trans-PUDO classifications are not presented as Shipper service or route choices. |
| Endpoint independence | From and To independently accept a physical address or an eligible registered PUDO centre. Address-to-address, address-to-PUDO, PUDO-to-address and PUDO-to-PUDO are all representable. |
| Service-specific journey eligibility | Each service is offered for a journey only when that service's approved endpoint/location/action eligibility is satisfied; the catalogue does not imply universal availability. |
| Active PUDO capability | Inactive or insufficiently configured PUDO centres are not offered for the requested service/action; a label/category alone does not establish eligibility. |
| Server authority | A service hidden or unavailable in the browser cannot be submitted as a valid quote/booking; the server independently evaluates and revalidates eligibility/availability. |
| No available service | When no service is bookable for the selected journey/date, the Shipper receives a truthful unavailable explanation and no booking/quote is created. No service, endpoint or route is silently substituted. |
| Actual route | The route is determined from endpoints, selected eligible service, location capabilities and approved routing rules. Direct In-PUDO-to-In-PUDO is not given an invented Out-PUDO leg. |
| Standard estimate | A journey-specific estimated delivery timeframe is shown before quote acceptance; it is not presented as a guarantee. |
| Express estimate | A journey-specific estimated delivery timeframe is shown before quote acceptance and is shorter than Standard for the same comparable eligible journey; it is not presented as a guarantee. |
| Scheduled availability | Only dates/time windows determined to be available for the selected journey are offered; the selected option is revalidated before booking confirmation. |
| Commitment preservation | The Standard/Express estimate or confirmed Scheduled date/time shown to and accepted by the Shipper is preserved with the resulting quote/booking history. |
| Event separation | Service selection, quote validity, accepted booking, payment, handover deadline, physical intake, custody and movement remain distinct facts. |

**Still required before executable tests:** Per-service journey/location/action matrix; operational coverage/capacity source and method; estimate calculation and numerical durations; guarantee policy; scheduled windows, cutoffs, reservation/expiry and change rules; pricing configuration and quote/handover terms; unavailable-route alternatives; technical/source/security contracts; and approved test data. DEC-046 does not approve numeric service levels, algorithms, schema, APIs, statuses or application implementation.


## A-05 / A-10 refinement — DEC-047 service eligibility and operational verification — 2 November 2026

These are policy-derived acceptance requirements for later executable test design. They do not claim implementation or test execution.

| Acceptance family | Required observable outcome |
|---|---|
| Matrix completeness | Standard, Express and Scheduled are each evaluated independently across address-to-address, address-to-PUDO, PUDO-to-address and PUDO-to-PUDO. No service inherits another service's eligibility. |
| Conservative default | All twelve combinations remain unavailable while verification is pending. Pending is distinct from a final not-eligible decision. |
| Explicit eligibility outcome | A combination can be activated only after it has an explicit eligible or conditional outcome, with every condition stated; not-eligible combinations remain unavailable. |
| Coverage verification | Origin and destination must fall within the approved coverage for the selected service and journey. |
| PUDO action verification | Every required PUDO centre is active and explicitly configured for the specific action required at that endpoint. Multiple capabilities are allowed; a label/category alone is insufficient. |
| Route verification | An operationally valid route exists under approved routing rules; customer endpoint selection does not select operational route types or prove a physical movement. |
| Capacity and time availability | Current operating availability and capacity support the requested date/time; Scheduled options are validated for the selected journey and revalidated before confirmation. |
| Operations approval and evidence | The applicable operating scope has approval from the responsible Operations authority, with attributable evidence identifying the service, journey pattern, locations/actions, coverage/capacity basis and constraints. |
| Server enforcement and fail-closed behaviour | Browser presentation is not authoritative. The server re-evaluates and revalidates; missing, stale, revoked or insufficient verification blocks submission and creates no quote/booking. |
| Change/revocation | Changes to coverage, centre status/capabilities, route rules, availability or capacity trigger reassessment of affected combinations; unrelated combinations are not silently changed. |
| No substitution | If no approved and currently available service exists, explain that the journey cannot be booked; do not silently substitute a service, endpoint or route. |

**Still required before executable tests:** Actual eligible/conditional/not-eligible outcomes and conditions for all twelve combinations; operational coverage/capacity sources and evidence procedures; proximity discovery/privacy; estimate methodology and numerical durations; guarantee policy; Scheduled windows/cutoffs/reservation/expiry/change rules; pricing and quote/handover terms; technical/source/security contracts; and approved test data. DEC-047 does not approve schemas, APIs, status values, providers, algorithms or application implementation.
