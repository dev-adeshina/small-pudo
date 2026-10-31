# VeriLyft P0 Acceptance Scenarios and Evidence Catalogue

**Status:** Owner-reviewed scenario refinements — test-design baseline only; not approved executable test specifications, implementation or release approval  
**Created:** 30 October 2026  
**Documentation baseline:** PR #83 merge commit `986f4ad79232ce1700f4edaa972a17522ed319c8` (PRs #67–#83 continued documentation-only reconciliation)
**Active-source inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856` (PR #31 merge; refreshed in PR #32)  
**Authority:** DEC-018, DEC-022–DEC-044, accepted PM-01–PM-12 and BP-01–BP-22 policy records, and the owner-reviewed `PLATFORM_REQUIREMENT_PRIORITY_MATRIX.md`  
**Related:** `PLATFORM_MUTATION_AUTHORIZATION_AND_RECOVERY_MATRIX.md`, `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_REVIEW_3_ACTION_CAPABILITY_CROSSWALK.md`, `PLATFORM_REVIEW_3_LIFECYCLE_TRANSITION_AND_RECOVERY_CROSSWALK.md`, `PLATFORM_REVIEW_3_RESOURCE_ENTITLEMENT_AND_PROJECTION_LINEAGE_CROSSWALK.md`, `PLATFORM_CONSOLIDATED_OWNER_DECISION_PACKAGE.md`, `IMPLEMENTATION_SOURCE_TRACEABILITY.md`, `ADMIN_REQUIREMENTS.md`, `DECISIONS.md`, `ISSUES.md`

## 1. Purpose and boundaries

This catalogue converts the P0 and Conditional P0 requirements in A-01–A-20 and ADM-R01–ADM-R54 into observable acceptance-scenario outlines and evidence requirements. It is intended to make later test design, execution, review and release sign-off auditable.

It does **not**:
- approve the complete platform SDD or authorize implementation;
- define Firestore collections, fields, routes, payloads, enums, token formats, indexes, roles or permission claims;
- invent numeric limits, pricing formulas, quote periods, retention periods, proof methods, approval thresholds, retry counts or operational timeouts where the accepted decisions leave them open;
- treat existing source code, a successful build, or a test report without reproducible artifacts as proof of acceptance;
- authorize tests against production data, live payment methods, real customer communications or physical parcels.

Where a policy parameter is unresolved, the scenario is marked **BLOCKED — policy input required**. It cannot be marked passed until the owner-approved value or rule is recorded in the relevant SDD contract. Conditional P0 scenarios must be completed before their trigger is enabled.

## 2. Test and evidence conventions

### 2.1 Required case record

Every executed case must retain, at minimum:

1. **Case identity:** case ID, requirement IDs, scenario version, execution date/time and environment.
2. **Build/configuration:** application commit, rules/configuration version, relevant feature flags and provider sandbox/configuration identifiers. Never include secrets.
3. **Preconditions:** fixture identifiers, starting lifecycle/payment/stock states, configured location/service capabilities and required policy version.
4. **Actor:** actor class and authorized responsibility; use synthetic identities and redact personal data.
5. **Action:** exact UI action, API request or simulated provider/physical event, with sensitive values redacted.
6. **Expected result:** response/result, permitted state transition, explicit denial or review outcome.
7. **Integrity assertions:** records that must change and records that must remain unchanged; include counts/balances/stock where relevant.
8. **Audit/evidence:** event/audit references, actor, time, reason, evidence reference and correlation/reference identifiers required by policy.
9. **Retry/replay:** duplicate, concurrent, delayed or failed-attempt outcome where applicable.
10. **Result:** pass/fail/blocked/not-run, tester/reviewer, defect link and cleanup confirmation.

A screenshot alone is insufficient for transactional, authorization, payment, stock, audit or custody acceptance. Retain machine-readable responses/log extracts or controlled database/provider evidence as appropriate, with secrets and unnecessary personal data removed.

### 2.2 Evidence classes

- **SRC — Source evidence:** exact commit and source paths showing the relevant guard or behavior. Supports design review only; never substitutes for runtime acceptance.
- **TEST — Automated evidence:** repeatable test name, test code/commit, command, environment, full result and relevant assertion output.
- **RUN — Runtime evidence:** dated end-to-end or API test record, request/response, actor, environment and correlated resulting records.
- **PROVIDER — External-system evidence:** sandbox/provider event or transaction reference and corresponding platform record; redact credentials and payment data.
- **OPS — Operational evidence:** controlled procedure, location capability/configuration, staff training/assignment, reconciliation or physical handover record.
- **PROD — Production-readiness evidence:** deployment/configuration verification, monitoring, backup/restore, incident/rollback and release sign-off. This class is not established by source inspection.

### 2.3 Universal pass rules

- A denial must leave protected business records and balances unchanged, except for the explicitly approved security/audit event.
- A successful action must be attributable to the correct actor and target, and must preserve required history.
- Duplicate/replayed requests must not create duplicate business or financial effects.
- A failure must not silently advance a lifecycle or fabricate a successful external/physical event.
- Payment, order, shipment, custody, movement, delivery and notification states remain distinct.
- Every test must use the approved policy version and a safe non-production environment unless a separately approved production exercise exists.

## 3. Cross-domain scenario catalogue

### A-01 — Public storefront and catalogue (P0)
**Requirement links:** ADM-R04–R13  
**Source baseline:** Catalogue pages/helpers and Firestore rules exist; runtime behavior and the noted category-count mismatch remain unverified.

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A01-01 | Active and inactive products/categories; public visitor | Browse catalogue and open product details | Only intended public fields are exposed; inactive/unavailable items are not presented as purchasable | RUN response/UI capture; fixture records; public-read rules test |
| A01-02 | Inactive product with known ID; guest and signed-in customer | Attempt checkout through normal UI and direct order API | Server rejects the inactive item; no order is created and no stock is decremented | RUN request/response; before/after stock and order query |
| A01-03 | Admin, ordinary customer, unverified user and signed-out visitor | Attempt category/product create, edit, activate/deactivate and delete operations | Only authorized Admin action succeeds; denied attempts do not mutate catalogue | TEST + RUN; auth identity/claims (redacted); before/after records |
| A01-04 | Product belongs to a category using current categoryId data | View category counts and product listing | Count and listing use the same approved relationship; no silent empty or inflated count | RUN query/result and fixture relationship |

### A-02 — Cart and checkout (P0)
**Requirement links:** ADM-R08, R11, R17, R19, R20  
**Source baseline:** Cart and server order creation exist; transactional stock reservation is source-mapped.

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A02-01 | Client cart contains altered price, currency, stock, quantity or user ID | Submit checkout request with tampered values | Server uses authoritative catalogue facts or rejects according to approved validation policy; client cannot set authoritative total/ownership | TEST + RUN request/response; order snapshot |
| A02-02 | Two customers attempt to buy the final unit concurrently | Submit both order requests concurrently | At most one valid reservation/order succeeds; stock never becomes negative; failed attempt leaves no partial order | Concurrency test output; transaction records; before/after stock |
| A02-03 | Same checkout submission is repeated due to double click/retry | Repeat identical submission | Outcome follows approved idempotency contract; no unintended duplicate order or stock decrement | RUN correlation IDs; order count; stock delta |
| A02-04 | Failure occurs during order creation/payment initialization boundary | Inject safe test failure at each documented boundary | No orphaned/ambiguous order or reservation; recovery/cancellation behavior follows approved contract | Fault-injection log; order/payment/stock snapshots |

### A-03 — Storefront order lifecycle (P0)
**Requirement links:** ADM-R14–R20, R35  
**Source baseline:** Storefront order and payment states exist; complete transition table and runtime matrix remain open.

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A03-01 | Order in each approved lifecycle/payment combination | Attempt every permitted and forbidden transition as customer, Admin and unauthorized actor | Each transition has an explicit actor/guard/result; invalid transitions are denied without partial mutation | Transition table; automated matrix; resulting order snapshots |
| A03-02 | Customer cancels eligible pending order; repeat cancellation | Cancel once, then replay | Stock restoration occurs at most once; cancellation does not assert that payment was refunded | Before/after stock; order history; duplicate replay result |
| A03-03 | Payment succeeds after order cancellation/expiry | Deliver delayed provider success in sandbox | Payment is recorded/reconciled against original transaction; order is not silently reactivated; disposition follows approved late-payment policy | PROVIDER event; payment/order state snapshots; review record |
| A03-04 | Admin attempts dispatch/fulfilment while payment is not verified | Request normal dispatch transition | Dispatch is blocked unless a specifically approved DEC-030 exception applies; payment state remains unchanged | RUN denial; audit/exception record if applicable |

### A-04 — Customer account and order access (P0)
**Requirement links:** ADM-R01–R04, R14, R19; DEC-035  
**Source baseline:** Account/order endpoints and guest tracking token source exist; recovery/claim challenge flow not found.

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A04-01 | Customer A and Customer B each own orders | A requests B's order through UI and direct API | Cross-customer access is denied; no protected order data is disclosed | TEST + RUN response; access log |
| A04-02 | Guest order with valid, invalid, missing and expired access credentials | Request tracking/recovery | Only valid entitled access reveals approved fields; order ID/email alone never grants access | RUN results; token/challenge metadata without secret values |
| A04-03 | Guest requests recovery using original checkout email | Complete the owner-approved proof-of-control challenge | Recovery grants only the defined entitlement; expired/replayed challenges fail safely | Challenge lifecycle evidence; email delivery sandbox; audit record |
| A04-04 | Authenticated customer attempts to claim an eligible guest order | Complete separate ownership challenge; replay or attempt second claim | Only one authorized claim succeeds; no silent transfer or multiple claims; commercial/fulfilment state unchanged | Account/order relationship snapshots; challenge and audit records |

### A-05 — Independent shipment booking (P0)
**Requirement links:** ADM-R21–R24, R28, R30–R32, R36–R39  
**Source baseline:** No dedicated active shipment booking route/service found in inspected source.

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A05-01 | Registered, authenticated booking party; separate booking party, sender, receiver, payer and handover person; service-specific booking information and handover deadline | Accept a valid quote to confirm the booking with permitted distinct parties | Valid quote acceptance by the authenticated booking party confirms the booking and accepted terms; required information is service-specific; the handover deadline is communicated before acceptance and included in confirmation; party relationships and authority remain explicit; confirmation does not prove payment or intake | Approved booking contract; RUN record and party links |
| A05-02 | Guest or unauthenticated visitor attempts independent booking | Submit booking request | Request is denied; no booking, quote acceptance or shipment record is created | RUN denial; before/after record query |
| A05-03 | Payer is not booking party; payer attempts to view shipment details | Authenticate as payer and request shipment | Default access is limited to payment confirmation/receipt; payment does not grant full shipment details | Authorization matrix; RUN responses; access evidence |
| A05-04 | Booking party requests a change after intake or dispatch | Attempt changes of different approved types/stages | Each change follows DEC-024 change-authority matrix; restricted changes require staff-mediated control; no physical facts are silently overwritten | Change matrix; before/after history; denial/approval evidence |

### A-06 — Shared pricing and quote acceptance (P0)
**Requirement links:** ADM-R30–R34; DEC-026–027  
**Source baseline:** No shared shipment pricing/quote service found.

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A06-01 | Approved service, origin/destination and chargeable inputs; fixed and calculated service examples | Calculate quotes through each supported journey | Shared rules produce reproducible itemized totals for equivalent inputs and same rate version | Approved formula/version; input/output vectors; deterministic test |
| A06-02 | Authenticated booking party accepts a valid quote, then administrator publishes a new rate | Re-read accepted quote/order | Acceptance confirms the independent booking; historical accepted amount and applicable rate context remain reconstructable and unchanged; booking confirmation does not imply payment or physical intake | Quote snapshot; rate-version history; comparison output |
| A06-03 | Unaccepted quote passes its configured validity boundary; separately, a confirmed booking approaches or passes its service-specific handover deadline | Attempt acceptance of the expired unaccepted quote; separately allow or miss the confirmed booking's handover deadline | Expired unaccepted quote cannot be accepted and requires a fresh quote; expiry of an accepted quote does not silently cancel or rewrite the confirmed booking; missed handover follows the communicated service deadline and unfulfilled/financial-resolution policy | Policy validity setting; timestamped RUN; quote states |
| A06-04 | Quote contains tax, fee, surcharge, discount or minimum charge | Calculate and reconstruct total | Each configured component is explicit and reproducible; no unapproved zero/default assumption | Approved pricing schedule; calculation trace |

**DEC-038 policy refinement for A-05/A-06:** The authenticated booking party's explicit acceptance of a valid quote confirms the independent booking and accepted terms. Payment and physical intake remain separate. Quote expiry before acceptance requires a fresh quote; expiry after acceptance does not silently cancel or rewrite the booking. Each service has a separate handover deadline communicated before acceptance and in booking confirmation. A missed deadline may result in an unfulfilled outcome while preserving booking, payment, and audit history. Exact service durations and technical status/transition representation remain open.

### A-07 — Payment initialization and confirmation (P0)
**Requirement links:** ADM-R15–R17, R20; DEC-028–029  
**Source baseline:** Paystack initialize/verify/webhook source exists; runtime regression evidence remains outstanding.

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A07-01 | Valid sandbox payment for a known order/purpose | Initialize and complete provider payment | Server verifies reference, purpose, amount and currency against authoritative transaction; only verified result updates payment outcome | PROVIDER transaction; API response; correlated order/payment record |
| A07-02 | Forged callback, invalid signature or mismatched amount/currency/reference | Submit invalid provider event | Event cannot settle transaction; discrepancy enters approved review path; no stock/dispatch side effect | Signature test; provider payload; unchanged state |
| A07-03 | Duplicate and concurrent webhook delivery | Replay same provider event and deliver concurrently | One financial effect only; duplicate is acknowledged/handled idempotently | Event IDs; webhook logs; transaction count and payment state |
| A07-04 | Provider reports success but local persistence fails or times out | Inject controlled failure then retry/reconcile | Outcome remains recoverable and does not create duplicate charge/order effects | PROVIDER record; failure log; recovery/reconciliation record |

### A-08 — Refunds, adjustments and reconciliation (P0)
**Requirement links:** ADM-R16–R20, R34; DEC-022, DEC-029  
**Source baseline:** No complete refund/credit/reversal/reconciliation service found.

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A08-01 | Paid transaction; authorized staff requests refund | Request, approve and execute refund through approved roles | Request, approval and provider execution are distinct; amount/currency/reason/reference/actor/outcome retained | Permission matrix; PROVIDER refund; financial event history |
| A08-02 | Same refund request is replayed or executed concurrently | Submit duplicate request/event | No duplicate refund effect; repeated provider event is idempotent and traceable | Provider transaction list; event IDs; ledger snapshot |
| A08-03 | Cancellation occurs after payment | Cancel order/booking and inspect payment outcome | Cancellation does not imply refund; refund or credit is a separate authorized event | Order/payment/refund records; customer receipt evidence |
| A08-04 | Internal record differs from provider/bank record; late payment after cancellation | Run reconciliation case and record resolution | Mismatch is surfaced and assigned; no silent correction/reactivation; original and correcting events remain visible | Reconciliation source statement; exception record; audit history |

### A-09 — Physical intake, measurement and custody (P0)
**Requirement links:** ADM-R21, R23–R28, R33, R36–R37; DEC-025, DEC-027–028, DEC-037, DEC-039–040, DEC-042–044  
**Source baseline:** No active intake/custody service found.

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A09-01 | Valid booking; location has intake capability; assigned staff has intake permission | Record physical arrival/intake | Booking alone does not mark received; successful intake records parcel, location, physical actor, recorder, time and required evidence | Location capability config; RUN event; custody history |
| A09-02 | Location lacks intake capability or staff lacks permission | Attempt intake directly through API/UI | Action is denied; no custody state changes | Authorization test; unchanged parcel/custody record |
| A09-03 | Measure parcel and compare with accepted quote inputs | Record actual measurements within and outside approved threshold | Original quote inputs remain; actual measurements and discrepancy are separately recorded; adjustment proposal is not an approved charge | Measurement units/policy; evidence; quote and adjustment history |
| A09-04 | Parcel is refused, damaged, reported missing, or duplicate intake is submitted | Record the supported exception/replay and inspect custody history | No false received/accepted custody state; duplicate does not create duplicate intake; preserve last confirmed custody and discovery context; do not infer fault, recovery, liability or financial outcome | Exception reason/source/evidence; last confirmed custody/location; movement history; replay result |

### A-10 — Location and service capability (P0)
**Requirement links:** ADM-R36–R38, R52; DEC-025, DEC-042–043

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A10-01 | Active/inactive locations with explicitly configured capabilities | View available services and attempt unsupported service | Only configured capabilities are offered; inactive location or unsupported operation is blocked | Configuration snapshot; UI/API output |
| A10-02 | Admin changes a location capability; ordinary staff/partner attempts same | Perform authorized and unauthorized changes | Only authorized configuration change succeeds; actor/time/reason history retained | Permission test; before/after config; audit event |
| A10-03 | Collection centre has receive/collection capability but no outgoing capability | Attempt outgoing intake/release/dispatch | No capability is inferred from location label; only explicitly enabled operations work | Capability matrix; direct API denial evidence |

### A-11 — Routing and route proposals (P0)
**Requirement links:** ADM-R38–R40; DEC-031, DEC-037, DEC-043

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A11-01 | Eligible shipment and available network/service inputs | Generate or prepare route proposal | Proposal is distinguishable from approval, assignment and physical movement; input/version is retained | Route proposal; source input/version; status history |
| A11-02 | Authorized Operations reviews; unauthorized staff/customer attempts approval | Approve, adjust or reject proposal | Only authorized responsibility may decide; decision, actor, time, reason and version are preserved | Permission test; decision history |
| A11-03 | Stale proposal or capacity/resource conflict | Attempt approval/assignment | Conflict is surfaced; stale proposal cannot silently overwrite newer decision; no dispatch occurs | Conflict fixture; API result; route history |
| A11-04 | Proposer attempts self-approval where separation is required by approved policy | Attempt approval | Approved separation-of-duties rule is enforced; unresolved rule blocks final test approval | Owner-approved approval matrix; denial evidence |

### A-12 — Dispatch, movement and handover (P0)
**Requirement links:** ADM-R23–R28, R35, R38–R39; DEC-030–031, DEC-037, DEC-041–044

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A12-01 | Shipment has approved assignment, verified payment and no blocking holds | Record dispatch and physical handover | Dispatch and handover are distinct, attributable events tied to the correct parcel/leg/location; transfer is complete only when actual handover and receiving-party possession are established | Assignment; payment verification; source/receiver attribution; applicable handover evidence |
| A12-02 | Payment unverified or unrelated safety/custody/legal hold exists | Attempt dispatch | Normal dispatch is blocked; DEC-030 exception cannot bypass unrelated holds or change payment status | RUN denial; hold record; unchanged payment |
| A12-03 | Eligible payment exception requested | Request and approve under approved exception categories | Explicit permission; requester does not self-approve; material case has second approver; evidence/reason/outcome retained | Approved exception policy; approval audit; state snapshots |
| A12-04 | Failed, disputed, incomplete, duplicate, wrong-leg, wrong-parcel, delayed or missed handover | Submit event/replay or investigate conflicting receipt claims | Wrong target/leg denied; duplicate has no duplicate movement effect; failed/disputed transfer preserves last confirmed custody; incomplete evidence is investigated without fabricated confirmation; missing/damaged parcel is not assigned unsupported transfer, fault or financial outcome | Event/source records; competing accounts where applicable; last confirmed custody; condition evidence; investigation and correction history |

### A-13 — Delivery attempt and outcome (P0)
**Requirement links:** ADM-R23–R29; DEC-032, DEC-037, DEC-044

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A13-01 | Shipment reaches delivery stage; approved proof method for service is configured | Record successful delivery with valid proof | Delivery completes only with required proof and receiver-authority checks; attempt and completion remain distinct | Service proof policy; proof reference; recipient relationship; audit |
| A13-02 | Attempt fails due to approved failure reason | Record failed attempt | Failure does not mark delivered or automatically trigger return, refund or redelivery; case enters defined resolution queue | Attempt record; reason/evidence; unchanged completion state |
| A13-03 | Wrong/unauthorized recipient or missing/invalid proof | Attempt completion | Completion denied; no delivered state; evidence remains available for authorized review | RUN denial; proof validation result; state snapshot |
| A13-04 | Customer collection or return is selected | Complete only through approved authorized flow | Collection authority is checked; return is a distinct outcome; no automatic financial consequence | Collection/return policy; identity/authority evidence; lifecycle history |

### A-14 — Notifications and Telegram (P0 / Conditional P0)
**Requirement links:** ADM-R54; DEC-024, DEC-032, DEC-034  
**Trigger:** Event-driven customer communications are enabled; Telegram is separately conditional and remains deferred until its gate/policy is approved.

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A14-01 | Verified business event and approved recipient/channel mapping | Trigger notification | Only entitled recipient receives approved minimum fields; notification does not change business state | Event/recipient/field matrix; provider sandbox delivery; message snapshot |
| A14-02 | Duplicate event, provider timeout or persistent delivery failure | Replay and simulate failure | Deduplication and bounded retry apply; persistent failure is visible and owned; underlying order/shipment state unchanged | Correlation/event IDs; retry log; failure queue |
| A14-03 | Payer is not booking party; inspect message content | Trigger payment/operational notifications | Payer receives only default payment confirmation/receipt unless separately entitled; no shipment detail leakage | Party-entitlement matrix; redacted message content |
| A14-04 | Telegram notification proposed for paid order | Attempt send before and after Admin “Assign For Delivery” | No Telegram send before required Admin gate; even after gate, send only if separate purpose/audience/disclosure policy is approved | Feature/config gate; Admin action audit; Telegram sandbox record or denial |

### A-15 — Admin and Operations access (P0)
**Requirement links:** ADM-R01–R04, R07, R51; DEC-022, DEC-025, DEC-030–033, DEC-037–038, DEC-042–044; PM-01–PM-12

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A15-01 | Signed-out visitor, ordinary customer, unverified user, authorized Admin | Navigate directly to protected pages and call protected APIs | Each page and API independently enforces server-side authorization; UI hiding is not the control | Automated auth matrix; direct request/response; logs |
| A15-02 | Staff authenticated but lacks action-specific permission | Call sensitive action API directly | Denied even when page is bypassed; protected record unchanged | Permission matrix; API denial; unchanged data |
| A15-03 | Token expired/revoked or role/capability removed | Repeat protected action | Access denied safely; customer session is not unnecessarily destroyed; no partial action | Token/claim fixture; response; session state |
| A15-04 | Admin/Operations performs permitted and prohibited actions; permission grant/revocation, location-dependent work, sensitive approval, audit access and emergency access are represented in the approved policy fixtures | Exercise permitted and denied actions across staff identities, action permissions, location capabilities, requester/approver pairs and emergency-access lifecycle | Each action requires its explicit assigned permission; location-dependent work additionally requires the active location capability; only designated Admin users grant/revoke permissions; applicable second approvals cannot be self-approved; audit viewing/export/disclosure permissions remain separate; emergency access is minimum-scope, time-limited, reviewed and revoked; all consequential decisions remain attributable | PM-01–PM-12 policy matrix; automated action/permission matrix; location-capability fixtures; requester/approver evidence; emergency-access audit; unchanged protected records on denial |

### A-16 — Audit and evidence (P0)
**Requirement links:** ADM-R07, R24, R48–R51; DEC-022, DEC-033, DEC-042, DEC-044

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A16-01 | Consequential action or event occurs across customer access, staff permissions, booking, intake, measurement, custody, payment/adjustment, dispatch, movement, delivery/return, override or sensitive disclosure | Perform or receive the event, then reconstruct its history | Reviewer can identify actor/system or external source, affected resource, timestamp, outcome, applicable reason, correlation, supporting evidence and relevant approval; physical actor, actual receiver and staff recorder remain distinct; prior custody history is reconstructable; audit entry alone is not treated as proof of a physical event | Attributable event/history record; source/evidence references; custody chain where relevant; approval/reason; correlation; reviewer reconstruction |
| A16-02 | Ordinary user or staff member without the applicable PM-08 permission attempts to view, export, alter or delete protected audit/evidence; privileged reviewer access is also exercised | Attempt each protected action through its applicable access path | Unauthorized read/export/mutation is denied; Admin status alone does not grant access; authorized viewing and exporting are separately permission-checked and attributable; original evidence/history remains intact | Permission/authorization evidence; denied and allowed action records; before/after original evidence record or integrity comparison; access/export attribution |
| A16-03 | Authorized correction, addition, redaction or administrative location correction is required after an original event/evidence record exists | Apply the separately authorized correction/redaction and inspect the history | Original event/source/evidence remains distinguishable and preserved as required; correction/addition/redaction identifies its actor, time, reason, affected original and applicable approval; administrative location correction is not represented as physical transfer | Original/correction chain; preserved source/evidence; authority and approval; redaction record; before/after reconstruction |
| A16-04 | A valid retention/legal hold applies, a hold-release request is made, or a retention period reaches its approved end | Attempt routine deletion, anonymization or hold release | Applicable hold prevents routine deletion; release is attributable and authorized under the still-to-be-defined authority; deletion/anonymization follows the approved category-specific retention rule and does not silently erase required legal-hold evidence | Approved retention schedule; hold and release records; authorization; deletion/anonymization evidence; legal-hold preservation check |

### A-17 — Support, exceptions and manual override (P0)
**Requirement links:** ADM-R07, R18, R28–R35, R46–R50; DEC-022, DEC-029–033, DEC-037, DEC-040–044

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A17-01 | Normal workflow is blocked by an exception category covered by an approved workflow policy | Request resolution or an explicitly permitted exception | Only the relevant documented path is available; a generic override is denied; actor, reason, scope, evidence, decision and outcome are retained | Exception catalogue; workflow policy; permission matrix; audit |
| A17-02 | A requester attempts to approve their own consequential exception, or an action requiring a second approver is submitted without one | Submit the approval/action through the UI and direct API | Self-approval is denied where separation applies; a second approver is required only for the policy-defined consequential financial, material measurement and consequential operational cases; routine actions are not blocked by an invented universal second-approval rule | PM-05–PM-07 policy; applicable threshold/rule; requester/approver identities; API denial or approval result; unchanged state on denial |
| A17-03 | Staff attempts to correct payment, custody, transfer, location, or delivery fact through a generic status edit | Submit the generic edit, then exercise any separately authorized correction path | Generic falsification is denied; an authorized correction is a separate attributable, reasoned event linked to the original; original event/evidence remains distinguishable; administrative location reassignment is not represented as physical transfer | Audit chain; original and correction records; source evidence; authority/reason; approval where required |
| A17-04 | Authorized staff investigate failed/disputed handover, missing/damaged parcel, or other disputed physical evidence | Open case, preserve evidence and record resolution | Access is limited to assigned authority; physical actors, receivers, reporters and sources remain distinguishable; last confirmed custody is preserved until actual possession is established; resolution is authorized, reasoned and not silently closed; no automatic fault/liability/financial outcome | Reviewer permission; discovery context; custody/movement history; condition/third-party evidence; investigation and resolution history; access log |
| A17-05 | Support receives an enquiry, change request, complaint, recovery request or dispute from a customer or interested party | Verify identity/relationship under the relevant policy, record the request, acknowledge and route/escalate it | Support can assist and escalate but cannot assume booking-party authority, impersonate the customer, independently mutate a booking, approve a refund, alter payment/custody evidence, authorize dispatch, release a parcel or access/export unrestricted audit evidence merely by virtue of Support responsibility; DEC-035 recovery/claim proof cannot be bypassed | Support permission/visibility matrix; requester and relationship evidence; request/case record; route/escalation; denied action tests; A04-03/A04-04 and A19-04 cross-reference; access audit |
| A17-06 | Booking party is unavailable, reported deceased/incapacitated, or suspected of account compromise; alternatively, collection authority is disputed | Request a sensitive change or parcel release and route the matter for review | No automatic authority transfer, cancellation, payment change or release; unresolved authority leaves the existing booking unchanged or parcel release on hold; protective restrictions and essential custody/safety operations follow the applicable policy; designated reviewer decision and evidence are retained | BP-05, BP-08, BP-12–BP-13, BP-17; identity/relationship and documentary evidence; hold/restriction; reviewer authority; decision and audit history |
| A17-07 | A party disputes booking information or appeals a prior decision | Submit dispute, evidence, appeal or request for further review | Original information/evidence and prior decision remain preserved; dispute is assigned to an authorized reviewer; appeal is independently reviewed where reasonably possible; further review is permitted only for significant new evidence, procedural failure or material error and requires the designated uninvolved Admin authorization | BP-19–BP-22; dispute/appeal record; reviewer identity/independence; preserved original; evidence and decision history; notifications |


### A-18 — Operational dashboard and reporting (P0 minimum; advanced reports P1)
**Requirement links:** ADM-R41–R43, R45; ADM-R40/R44/R53 are P1 under the priority matrix where applicable.

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A18-01 | Known synthetic orders, shipments, payments and movement records with controlled timestamps | Load minimum operational dashboard | Every P0 metric has approved definition, source, scope and time window; displayed values reproduce from source records | Metric dictionary; fixture set; query/result export |
| A18-02 | Query fails or data is stale/unavailable | Simulate service/query failure | Dashboard indicates unavailable/stale state; no demo or fabricated fallback values are presented as live | Fault-injection output; UI capture; logs |
| A18-03 | Role with restricted data access opens dashboard | Load metrics | Only role-entitled aggregate/detail data is exposed; no unauthorized personal/financial details | Role matrix; API response; UI capture |
| A18-04 | Financial totals and operational counts include linked/duplicate records | Recalculate metrics | Orders, shipments, payment events, refunds and movements are not conflated or double-counted | Metric formula; fixture ledger; reproducible calculation |

### A-19 — Customer communications and privacy (P0)
**Requirement links:** ADM-R04, R14–R19, R54; DEC-024, DEC-032–034, DEC-038, DEC-040, DEC-044

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A19-01 | Booking party, sender, receiver, payer and handover person are distinct | Each party requests page/API/message information | Each sees only the approved information for their relationship; payer default remains receipt/confirmation only | Approved entitlement matrix; role-based RUN output |
| A19-02 | Contact detail changes, recipient mismatch or notification bounce | Trigger event/notification | Contact verification and consent policy is enforced; failures do not disclose to unverified replacement address | Contact change history; provider response; failure record |
| A19-03 | Guest tracking credential is absent, invalid, expired or revoked | Request order/shipment details | No access from order ID alone; only allowed fields are exposed to valid entitlement | Access tests; redacted response; token lifecycle evidence |
| A19-04 | Support or government disclosure request is submitted | Review and respond under DEC-033 | Request itself grants no access; legal basis, scope, reviewer, approval, recipient and disclosed records are recorded | Request record; approval; disclosure manifest/audit |

### A-20 — Production configuration and operational readiness (P0)
**Requirement links:** ADM-R01–R04, R13, R20, R45, R48–R52, R54; DEC-036

| Case | Scenario and setup | Action | Required observable result | Evidence |
|---|---|---|---|---|
| A20-01 | Production-like environment with required secrets/configuration absent or invalid | Start service or invoke dependent integration | Fails safely and observably; no secret exposed to client/log; no false success | Config validation test; redacted logs; deployment check |
| A20-02 | Release candidate with configured auth, Firestore rules, payment webhook and image provider | Execute release smoke/security suite | Deployed config matches approved baseline; auth/rules/webhook/provider checks pass | Deployment manifest; rules version; provider sandbox/smoke reports |
| A20-03 | Backup exists; isolated restore target prepared | Restore backup and validate critical records/relationships | Restore procedure meets owner-approved recovery objectives; record counts/integrity checked; no production overwrite | Backup job; restore log; reconciliation report |
| A20-04 | Simulated incident or failed release | Exercise incident escalation and rollback | Owner/operator can detect, communicate, contain and rollback using documented steps; data integrity preserved | Incident timeline; alert evidence; rollback result |
| A20-05 | Final release candidate | Review sign-off pack | Every P0 has approved design, passing evidence and accountable owner; Conditional P0 triggers are either tested before enablement or explicitly disabled; unresolved blockers prevent release approval | Signed requirement/evidence matrix; release decision; blocker register |

## 3.1 Owner-reviewed refinements — 30 October 2026

The owner has reviewed and explicitly approved the policy-level approach for every scenario group A-01–A-20. The refinements below record that approval without converting this catalogue into executable test scripts or closing unresolved policy dependencies.

- **A-01 — Public storefront and catalogue:** Retain the four cases. Catalogue administration must enforce action-specific permission and scope; successful privileged changes must be auditable; product measurement requirements and image-upload reliability/security remain explicit acceptance concerns.
- **A-02 — Cart and checkout:** Retain the four cases. Cover tampered client values, concurrent final-unit reservations, duplicate submissions and failures on both sides of the order/stock-commit and payment-initialization boundary. Guest and authenticated checkout remain distinct; idempotency and recovery rules remain dependencies.
- **A-03 — Storefront order lifecycle:** Retain the four cases. Keep order, payment and shipment/dispatch states distinct; test permitted and forbidden transitions, one-time stock restoration, late payment after cancellation/expiry, and dispatch restrictions including only approved DEC-030 exceptions.
- **A-04 — Customer account and order access:** Retain the four cases. Test cross-customer denial, guest credential validity/replay/expiry, guest recovery and guest-order claims as separate authority paths. Order ID or email alone never grants access; challenge and claim rules remain dependencies.
- **A-05 — Independent shipment booking:** Retain the four cases. Authenticated booking creation must preserve distinct booking-party, sender, receiver, payer and handover-person relationships. Guest booking remains denied; payer access defaults to payment confirmation/receipt; post-intake/dispatch changes follow DEC-024.
- **A-06 — Shared pricing and quote acceptance:** Retain the four cases. Equivalent approved inputs under the same rate version must produce reproducible itemized results; accepted historical quotes remain reconstructable; expiry and configured charge components follow approved policy. No formula, rate, unit or rounding rule is invented here.
- **A-07 — Payment initialization and confirmation:** Retain the four cases. Server-side verification of reference, purpose, amount and currency is authoritative; forged/mismatched events cannot settle; duplicate webhooks have one financial effect; provider success with local persistence failure remains recoverable.
- **A-08 — Refunds, adjustments and reconciliation:** Retain the four cases. Refund request, approval and provider execution remain separate; consequential financial actions require the approved authority and second-person approval; cancellation is not refund; mismatches and late payments remain visible and traceable.
- **A-09 — Physical intake, measurement and custody:** Retain the four cases. Booking is not physical receipt; intake requires both staff permission and location capability; declared/quoted inputs remain distinct from actual measurements; discrepancies are not approved charges; custody exceptions and duplicate intake remain controlled.
- **A-10 — Location and service capability:** Retain the three cases. Services and operational actions must be supported by explicitly configured location capabilities; staff permission and location capability are independent requirements; a location label does not imply an unconfigured capability.
- **A-11 — Routing and route proposals:** Retain the four cases. Proposal, review/approval, assignment, dispatch and physical movement remain distinct; route inputs/version and decisions are preserved; stale proposals and resource conflicts cannot silently overwrite newer decisions; self-approval is controlled where policy requires.
- **A-12 — Dispatch, movement and handover:** Retain the four cases. Normal dispatch requires approved assignment, verified payment and no blocking hold; DEC-030 exceptions cannot bypass unrelated holds; consequential exceptions follow approval separation; wrong, duplicate, delayed or missed handovers do not fabricate movement.
- **A-13 — Delivery attempt and outcome:** Retain the four cases. Attempt and confirmed delivery remain distinct; successful delivery requires the approved proof and receiver-authority checks; failed attempts do not automatically trigger delivery, return, refund or redelivery; collection and return remain separate outcomes.
- **A-14 — Notifications and Telegram:** Retain the four cases. Notifications require a verified business event and approved recipient/channel/field mapping; delivery is not proof of business state; retries and persistent failures remain controlled; Telegram cannot send before the Admin “Assign For Delivery” gate and still requires separate purpose/audience/disclosure approval.
- **A-15 — Admin and Operations access:** Retain the four cases. Authentication establishes identity, not operational authority. Pages and APIs independently enforce server-side authentication and action-specific permission, scope and location capability; revoked/expired authorization denies subsequent actions; sensitive approvals and audit attribution follow DEC-022.
- **A-16 — Audit and evidence:** Retain the four cases. Audit history must support reconstruction; audit viewing, export, disclosure and mutation are restricted; corrections/redactions preserve distinguishable originals and approvals; retention and legal holds prevent unauthorized deletion or release.
- **A-17 — Support, exceptions and manual override:** Retain A17-01–A17-04 and add A17-05–A17-07 to make the already accepted Support, booking-authority, hold, dispute and appeal boundaries observable. Exceptions remain controlled alternatives, not bypasses; second approval applies only to policy-defined consequential cases; financial and physical facts cannot be falsified through generic status edits; Support access remains limited to explicitly assigned scope and Support cannot assume customer or operational authority.
- **A-18 — Operational dashboard and reporting:** Retain the four cases. The P0 dashboard must provide accurate, reproducible, permission-aware metrics and clearly identify stale/unavailable data. Orders, shipments, payments, refunds and movements must not be conflated or double-counted. Advanced reporting remains P1.
- **A-19 — Customer communications and privacy:** Retain the four cases. A party's relationship to a transaction does not automatically grant all transaction information; contact verification and recipient entitlement govern disclosure; guest credentials protect tracking access; Support/government requests require approved authority, scope and audit.
- **A-20 — Production configuration and operational readiness:** Retain the five cases. Secure configuration, deployment verification, backup/restore, incident response/rollback and final release sign-off are separate evidence obligations. A successful build or deployment is not production-readiness proof.

These are owner-approved scenario-design refinements only. They do not resolve the policy dependencies listed in Section 6, authorize test execution, establish passing evidence, approve implementation, or constitute complete SDD or release approval.


## 3.2 Accepted logistics-policy crosswalk — DEC-037–DEC-044

The following crosswalk makes the accepted logistics-first and fulfilment decisions visible in the existing 80-case catalogue. It links policy to existing scenarios; it does not create new cases, alter priority, or approve executable specifications. A policy reference is not evidence that its operational or technical contract is complete.

| Accepted decision | Existing case coverage | Requirement dependency | Acceptance emphasis retained |
|---|---|---|---|
| DEC-037 — Logistics-first hierarchy and shared fulfilment boundary | A03-01; A05-01–A05-04; A09-01–A09-04; A10-01–A10-03; A11-01–A11-04; A12-01–A12-04; A13-01–A13-04 | A-03, A-05, A-06, A-09–A-12; ADM-R14–R28, R30–R39 | Independent shipment booking is primary; storefront delivery enters shared fulfilment without conflating orders, shipments or transport movements. |
| DEC-038 — Booking confirmation and responsibility boundaries | A05-01–A05-04; A06-02–A06-03; A19-01, A19-03 | A-05, A-06, A-19; ADM-R01–R04, R21–R24, R28, R30–R32, R54 | Authenticated booking-party acceptance confirms the booking; payer, sender, receiver and handover-person entitlements remain distinct; payment and intake remain separate. |
| DEC-039 — Service-specific pricing boundaries | A06-01–A06-04; A09-03; A08-01, A08-03 | A-06, A-08, A-09; ADM-R30–R34 | Service inputs, formulas, units, rate versions, itemization and reproducibility must be specified; no pricing value is inferred here. |
| DEC-040 — Measurement adjustment and customer resolution | A06-03–A06-04; A08-01, A08-03–A08-04; A09-03; A17-03; A19-01 | A-06, A-08, A-09, A-17; ADM-R07, R25, R28, R30–R34 | Original quote inputs, actual measurements, proposed adjustments, customer decision and financial outcome remain distinct and traceable. |
| DEC-041 — Payment, settlement, refund, reconciliation and dispatch | A03-02–A03-04; A07-01–A07-04; A08-01–A08-04; A12-01–A12-03; A17-01–A17-03 | A-03, A-07, A-08, A-12, A-17; ADM-R15–R20, R28–R29, R34–R35 | Payment verification, settlement, refund/credit, reconciliation and dispatch authorization are separate events; duplicate and late events remain recoverable and auditable. |
| DEC-042 — Physical intake, custody, measurement and location operation | A09-01–A09-04; A10-01–A10-03; A12-01, A12-04; A16-01, A16-03–A16-04; A17-03–A17-04 | A-09, A-10, A-12, A-16, A-17; ADM-R03–R04, R07, R21–R28, R35–R37, R39, R51–R52 | Booking is not intake; physical actor and recorder are distinct; custody, measurement, location operation and exceptions require attributable evidence. |
| DEC-043 — Location capability and actor authority | A09-01–A09-02; A10-01–A10-03; A11-02; A12-01–A12-03; A15-01–A15-04; A17-01–A17-02, A17-04 | A-09–A-12, A-15, A-17; ADM-R03–R04, R07, R25–R28, R36–R39, R51–R52 | A consequential action requires both enabled location capability and authorized actor permission; labels or authentication alone grant no authority. |
| DEC-044 — Custody transfer integrity and physical exceptions | A09-04; A12-04; A13-01–A13-03; A16-01, A16-03; A17-03–A17-04 | A-09, A-12, A-13, A-16, A-17; ADM-R07, R23–R28, R39, R48–R51 | Attempted handover is not completed transfer; preserve last confirmed custody, evidence and correction history; missing/damaged/disputed cases require controlled investigation and resolution. |

**Unresolved-contract boundary:** The crosswalk does not settle service-specific procedures, pricing inputs/formulas, measurement thresholds, proof methods, exact status vocabulary, permission implementation, location capability catalogue, investigation ownership, retention, financial entitlements, or technical data/API contracts. Keep the corresponding scenarios blocked until their owning SDD contracts are approved.

## 4. Conditional P0 trigger register

| Requirement group | Trigger that makes it mandatory | Minimum evidence before enabling |
|---|---|---|
| A-05 independent shipment booking and related A-06/A-09–A-13 operations | Independent shipment booking or corresponding parcel network capability is enabled | Registered-customer eligibility, party/access matrix, quote/booking, intake/custody, dispatch, movement and delivery scenarios pass for enabled service/location |
| ADM-R12 product shipping measurements | A supported service's approved price/eligibility rule depends on product parcel measurements | Defined units, measurement source, required fields, validation and pricing test vectors |
| ADM-R29 returns | Return-to-sender/return service is offered or operationally accepted | Return eligibility, authority, custody, customer communication and financial consequences approved and tested |
| A-14 Telegram | Telegram channel is enabled | Admin “Assign For Delivery” gate plus separate approved purpose, audience, disclosure fields, consent and failure policy; pre-gate denial test |
| ADM-R46–R47 government-request handling | A government/public-authority request is received | Controlled intake/review/authority/legal-basis/scope/approval/disclosure/audit procedure and access tests |
| ADM-R49 retention-hold release | A legal/investigation retention hold is placed | Hold, authorized release, audit and deletion-blocking scenarios |
| ADM-R50 appeal evidence | An appeal process or appeal evidence handling is activated | Appeal evidence scope, reviewer authorization, correction/disclosure and retention scenarios |

A conditional requirement cannot be called passed solely because its trigger is currently disabled. The release record must identify the trigger, prove it is disabled, assign an owner, and define the evidence gate that must pass before activation.

## 5. Admin requirement traceability index

This index links the existing ADM requirement IDs to the scenario groups. The authoritative requirement wording and priority remain in `ADMIN_REQUIREMENTS.md` and `PLATFORM_REQUIREMENT_PRIORITY_MATRIX.md`.

| Admin requirement | Scenario groups |
|---|---|
| ADM-R01–R04 | A-01, A-04, A-15, A-20 |
| ADM-R05–R08 | A-01, A-03, A-15–A-17 |
| ADM-R09–R13 | A-01, A-02, A-20 |
| ADM-R14–R20 | A-02–A-04, A-07–A-08, A-15, A-19 |
| ADM-R21–R29 | A-05, A-09, A-11–A-13, A-17 |
| ADM-R30–R35 | A-06–A-08, A-12, A-17 |
| ADM-R36–R40 | A-05, A-10–A-12 |
| ADM-R41–R45 | A-18, A-20 |
| ADM-R46–R50 | A-16–A-17, A-19–A-20 |
| ADM-R51–R54 | A-14–A-16, A-19–A-20 |

P1 requirements ADM-R40 (network overview), ADM-R44 (date-range controls) and ADM-R53 (basic operational reporting, as classified in the priority matrix) must not be silently promoted into launch blockers by this catalogue. The minimum P0 operational dashboard must still meet ADM-R41/R42 and the owner-approved A-18 scope. Confirm any apparent priority/requirement wording conflicts before final approval.

## 6. Policy dependencies that block final test approval

The following values/rules must be resolved in the owning SDD sections before the corresponding case can be marked fully executable:

1. **DEC-022 / A-15–A-17:** action-level Admin/Operations permission matrix; partner/station access; sensitive action limits; second-person approval categories; requester/approver separation.
2. **DEC-023–024 / A-04–A-05 / A-19:** customer verification checkpoints; party relationship and consent model; per-change authority by lifecycle stage; business-account handling; payer disclosure fields; collection authority.
3. **DEC-026–027 / A-06 / A-09:** formulas, units, distance source/bands, service mapping, minimum charge, taxes/fees/surcharges/discounts, rounding, rate effective dates, quote validity, discrepancy thresholds and adjustment outcomes.
4. **DEC-028–029 / A-07–A-08:** payment-at-intake methods and evidence; cash/electronic confirmation; partial/additional payment; late-payment disposition; refund/credit/reversal authority, limits and provider reconciliation ownership/tolerance.
5. **DEC-030 / A-03 / A-12:** eligible dispatch exception categories, explicit permission, materiality definition, second approver, evidence and limits; unrelated holds.
6. **DEC-031 / A-11–A-12:** route proposal inputs, assignment authority, capacity model, mandatory milestones, physical actor vs recorder evidence, correction and reassignment rules.
7. **DEC-032 / A-13:** approved proof methods by service, recipient identity/authority, failure reason catalogue, attempt limits, holding/return/refusal/dispute outcomes.
8. **DEC-033 / A-16–A-17 / A-19:** event catalogue, evidence sensitivity/access, retention periods, legal hold/release, correction/redaction, government disclosure review and integrity controls.
9. **DEC-034 / A-14 / A-19:** event/recipient/channel/field matrix, contact verification, consent, retry/deduplication, failure ownership and Telegram gate policy.
10. **DEC-035 / A-04 / A-19:** challenge format/lifetime, rate limits, revocation, eligible order conditions, account-claim transfer rules and support exception.
11. **DEC-036 / A-18 / A-20:** P0 metric definitions; production environment; monitoring/alert ownership; recovery objectives; backup/restore cadence; incident response; rollback and release sign-off authority.

## 7. Execution plan and acceptance governance

1. Owner reviews this catalogue and resolves any scenario wording that changes the accepted business policy.
2. Each policy dependency is completed in its authoritative lifecycle/workflow/decision document; this catalogue references rather than duplicates policy values.
3. Each scenario is converted into automated tests, controlled API/browser tests, provider-sandbox tests or operational exercises appropriate to its risk.
4. Tests execute in isolated development/staging/sandbox environments using synthetic data and controlled fixtures.
5. Failures are recorded as issues linked to requirement IDs and exact evidence; fixes require their own approved implementation workflow after the complete SDD gate.
6. Re-run impacted scenarios and relevant regression families after any change; retain prior result history.
7. Requirement owners review evidence and sign off individually; unresolved P0s block launch. Conditional P0s block activation of their trigger.
8. Production readiness is a separate evidence gate. Passing functional tests alone does not establish operational readiness.

## 8. Current evidence position and explicit non-claims

At the baseline above, the source-traceability pass identifies source foundations for storefront catalogue/checkout, customer access, Admin allowlist guards, Paystack payment integration and basic storefront fulfilment. It identifies material gaps for independent shipment, PUDO, intake/custody, shared shipment pricing/quotes, route/movement, delivery proof, general audit, refunds/credits and reconciliation. The Admin dashboard contains demo values rather than verified live operational metrics.

This catalogue is **test design**, not test execution. No scenarios in this document are claimed passed. No tests were run to create this document. No production data, deployed secrets/configuration, provider dashboards, physical parcel operations or root `pudo.zip` archive were inspected. The active-source inspection baseline remains `e0f69055d33dd9399c23e1d793f359468229c856` (PR #31 merge), as refreshed in PR #32. Repository comparison through PR #63 shows documentation-only changes after that source baseline; a current tree-path inventory found no dedicated shipment/custody/route/location API/library path. This remains source/path evidence only, not runtime verification.

**Catalogue reconciliation status:** DEC-037–DEC-044 are cross-referenced to the existing case rows in Section 3.2 (PR #58 merged at `d67a8bcd33713b0bcc64b6841237a7e9b0ee78b7`). The 80-case catalogue remains test design only. Complete SDD approval, individual executable test-specification approval, test execution and application-code changes remain separately gated.


**A-15 policy alignment note (PM-01–PM-12):** The owner has accepted the minimal hybrid staff responsibility model and action-level permission assignment. This case is a test-design outline only. The permission catalogue, technical enforcement surfaces, exact scope representation, approver eligibility/materiality thresholds, emergency-access parameters, and retention remain blocked specification inputs. Do not interpret those open details as a reversal or absence of the accepted PM policy. Existing case IDs are retained; no new case row is added.


**Repository-history note (PR #70):** Current `main` is identical to PR #70 merge commit `ad6189a598d3fcbb79c90679a7dac33914ea0474`. The source inspection snapshot remains `e0f69055d33dd9399c23e1d793f359468229c856`; comparison to current `main` lists only SDD documentation paths after that snapshot. This does not establish fresh runtime or production evidence and does not change any case's execution status.


## 9. Mutation and recovery contract cross-reference

Use `PLATFORM_MUTATION_AUTHORIZATION_AND_RECOVERY_MATRIX.md` when converting scenario rows into executable test specifications. It defines the cross-cutting guards and failure/recovery variants to apply where relevant. It does not add execution evidence, approve unresolved thresholds or service-specific proof methods, or change any P0/Conditional P0 status.


## 10. Production-readiness contract cross-reference

Use `PLATFORM_PRODUCTION_READINESS_AND_OPERATIONAL_EVIDENCE_CONTRACT.md` when converting A20-01–A20-05 into executable test specifications and release evidence. It expands the control/evidence expectations for environment separation, configuration and secrets, deployed authorization/rules, provider readiness, deployment/rollback, observability/alerting, backup/restore, incident response, operational continuity and release sign-off. It also maps relevant operational evidence to A-07/A-08, A-14, A-16 and A-18. No case IDs or priorities change. This cross-reference does not approve test execution, establish passing results, resolve numeric operational targets, or claim production readiness.


## 11. Post-PR #83 SDD reconciliation boundary

- The documentation baseline is PR #83. PRs #80–#83 add an owner-input classification and conceptual action/capability, lifecycle/recovery, and resource-entitlement/projection-lineage crosswalks. These additions refine test-design dependencies; they do not establish that any missing application capability has been implemented or tested.
- The consolidated owner decision package groups proposed DB-01–DB-12 and related operating-policy recommendations. Those recommendations remain pending owner confirmation and must not be treated as approved expected results in executable test specifications.
- The existing 80 rows remain scenario outlines. They are not approved execution packages and do not imply 80 tests have been implemented, run or passed. The readiness assessment continues to report 0/51 P0/Conditional P0 Admin requirements approved for acceptance-test execution.
- For each case, unresolved policy, absent capability, missing fixture/actor/permission, incomplete expected state/non-state effects, missing failure/replay behavior, or missing evidence/reviewer must remain an explicit blocker. Do not invent values or convert a blocked outline into an executable test merely to increase completion counts.
