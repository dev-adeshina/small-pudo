# VeriLyft Mutation, Authorization, and Recovery Contract Matrix

**Status:** Technical contract specification support; not an approved API, schema, permission catalogue, or implementation plan  
**Prepared:** 31 October 2026  
**Documentation baseline:** PR #72 merge commit `d17828292f2a0e0424de9461affe4aebc2c94e0b`  
**Application-source inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856`  
**Related:** `PLATFORM_TECHNICAL_CONTRACT_RECONCILIATION.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, `PLATFORM_DOMAIN_BOUNDARY_AND_IDENTITY_DECISION_MATRIX.md`, `PLATFORM_STAFF_PERMISSION_MATRIX.md`, `PLATFORM_STAFF_PERMISSION_DECISIONS.md`, `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md`

## 1. Purpose and limits

The platform has accepted business boundaries for booking, quote, payment, physical intake, custody, route planning, assignment, dispatch, movement, delivery, financial resolution, Support, and audit/evidence. This matrix turns those boundaries into a consistent mutation and recovery contract so that a future API/data design does not authorize an action merely because a user can see a button or a record is in a convenient status.

This document does **not** approve:
- Firestore collections/documents/fields, identifiers, status enums, API routes, claims, services, queues, event buses, or a new architecture;
- a universal idempotency key, retry count, timeout, retention period, transaction pattern, or provider compensation mechanism;
- unresolved service rates, units, quote/handover periods, financial thresholds, physical proof methods, staff approval thresholds, or response-time targets;
- any application-code, Firebase-rule, configuration, deployment, or production change.

Use the existing Next.js App Router, Firebase Auth/Firestore/Admin, Paystack and Cloudinary boundaries where suitable. Do not stretch an existing storefront order, payment callback, Admin allowlist, fulfilment status, or upload endpoint into a separate platform responsibility without an approved contract.

## 2. Universal mutation decision sequence

Every consequential state-changing request must satisfy the following checks against authoritative current data at mutation time. A UI check or previously loaded permission snapshot is not sufficient.

| Order | Guard | Question | If unmet |
|---:|---|---|---|
| 1 | Principal authentication | Is the actor an authenticated customer, staff member, or verified trusted provider/system? | Deny or use the approved authentication/recovery process |
| 2 | Target resolution | Is the target resolved without treating its identifier as a credential? | Deny safely; do not disclose protected record existence |
| 3 | Relationship/entitlement | Why may this principal access this particular record or perform this customer action? | Deny; preserve state |
| 4 | Action permission | Is this exact staff action explicitly assigned to the actor? | Deny; do not infer from Admin/Operations/Finance/Support title |
| 5 | Scope | Does the assignment cover this service, record, task, region, and/or location? | Deny or route to an authorized reassignment process |
| 6 | Location capability | For a location-bound action, is the location active and configured for that service/action now? | Block or use an approved alternative |
| 7 | Lifecycle and hold | Is the transition valid from authoritative current state, with no cancellation, dispute, safety, payment, custody, or legal hold conflict? | Reject as conflict or preserve in controlled review |
| 8 | Trusted input | Are values, relationships, prices, amounts, units, stock, provider references, and evidence validated/recomputed server-side? | Reject before side effects |
| 9 | Independent approval | Does accepted policy require a separate approver for this action/exception, and is the approver distinct from requester? | Keep pending; do not execute |
| 10 | Concurrency/replay | Can simultaneous, stale, duplicate, delayed, or replayed requests create conflicting or duplicate effects? | Serialize, deduplicate, or reject safely |
| 11 | Evidence/audit | Is the required reason, event proof, actor/recorder distinction, approval and correlation context available? | Do not claim completion; preserve last confirmed fact |
| 12 | Commit/response | Can the business result be persisted and reported without leaking secrets or another party's data? | Return a recoverable outcome; reconcile any external side effect |

Authentication, entitlement, action permission, scope, location capability, lifecycle validity, approval, and evidence are separate checks. None substitutes for another. A record ID, email match, payer/sender/receiver label, Admin label, hidden UI control, or client-supplied role is not sufficient authorization.

## 3. Action-to-contract matrix

| Business action | Minimum preconditions and authority | Required independent facts/evidence | Replay/concurrency and failure contract | Policy dependencies still open |
|---|---|---|---|---|
| Issue quote | Valid service and supported inputs; trusted server pricing configuration; authorized issuance path | Inputs, applicable rate/config version, itemized charges, total, currency, validity context | A retry must not silently replace an issued/accepted quote; preserve revisions | Rates, formulas, input sources, units, rounding, validity |
| Accept quote / confirm booking | Authenticated booking party; exact valid quote; allowed service; explicit acceptance | Accepted quote version and terms, acceptance actor/time, communicated handover deadline | Stale/superseded/expired unaccepted quote rejected; duplicate acceptance returns same business outcome without duplicate booking | Handover period, exact acceptance evidence, party/representation verification |
| Amend/cancel booking | Booking-party entitlement; permitted change window; lifecycle and hold check; post-intake staff-mediated process | Requested change, actor, reason, consent/verification, before/after commercial context | Concurrent amendment/cancellation must not overwrite newer state; cancellation does not itself refund | Change-type authority, post-intake exception, missed handover resolution |
| Initialize payment | Defined booking/order/payment purpose; trusted amount/currency; current payable state | Payment intent/reference, purpose, amount/currency, provider response | Unknown provider outcome must be reconciled before another intent; no duplicate active intent without defined policy | Partial/split payment eligibility, provider idempotency and timeout behaviour |
| Verify payment / process webhook | Trusted provider identity/signature; matching reference, purpose, amount and currency; valid current financial state | Provider event/transaction, verification result, local correlation and outcome | Duplicate/concurrent/out-of-order callbacks produce one financial effect; late payment after cancellation is reviewed, not silently reactivated | Late/mismatch handling, reconciliation ownership, tolerance thresholds |
| Record payment at intake | Location payment capability and staff action permission; approved method and evidence; defined purpose | Actual receipt/approved payment evidence, actor, location, amount/currency, receipt reference | Duplicate recording must not double-settle; uncertain cash/terminal evidence goes to review | Supported methods, evidence, reconciliation, payment-at-intake limits |
| Record physical intake | Actual physical receipt; authorized intake actor; location/service capability; booking or approved walk-in path | Physical presenter distinct from booking party where relevant; actual receipt time/location, condition/measurement and required proof | Duplicate scan does not create a second receipt; delayed/offline capture distinguishes event time and record time | Intake checklist, proof, offline policy, refusal/hold outcomes |
| Record measurement / propose adjustment | Authorized measurement at capable location; service-specific measurement inputs and units | Declared and actual values retained separately; unit, actor, location, time, reason/evidence | Replayed measurement must not overwrite prior measurement; conflicting readings enter review | Units, conversions, tolerances, materiality and approval thresholds |
| Approve/accept adjustment | Correct authority; required independent approver; customer notified; explicit customer acceptance before additional collection | Original quote, revised quote, reason, approval and customer decision | Repeated approval/acceptance cannot create repeated charges; rejection triggers authorized service resolution, not automatic refund/cancel | Approval matrix, response periods, customer remedies |
| Transfer custody | Actual receiving party takes possession; authorized actors; location/service scope; required proof | Prior custodian, receiving custodian, physical actor, recorder, time/location and evidence | Duplicate event deduplicated; disputed/ambiguous transfer preserves last confirmed custodian and both accounts | Service-specific proof, offline capture, investigation and hold authority |
| Propose route | Supported service, destination, operational constraints and authorized routing scope | Proposal inputs, proposer, time, route/leg rationale | Repeated proposal may be superseded but does not imply assignment/movement | Capacity and routing constraints, route model |
| Assign/reassign route/resource | Authorized Operations action, capability/scope, valid proposal/resource; required second approval when policy says | Assignment decision, resource/leg, approver, reason, prior assignment history | Conditional/versioned update prevents conflicting assignment; reassignment does not assert physical movement | Resource model, capacity reservation, assignment scope and approval thresholds |
| Authorize dispatch | Required permission, scope, readiness, payment/exception policy, custody and holds checked; independent approval where required | Dispatch decision, actor, approver, reason and readiness evidence | Duplicate command does not create multiple dispatch events; command remains distinct from physical departure | Exact dispatch prerequisites and exception authority |
| Record movement / handover | Actual observed milestone; authorized actor/provider; valid leg and current custody context | Physical actor, recorder, event/record time, location and event-specific proof | Out-of-order or duplicate scan reconciled without rewriting history; conflicting event reviewed | Event taxonomy, partner/provider evidence, offline and correction rules |
| Record delivery attempt/outcome | Authorized delivery actor and scope; intended recipient entitlement/verification; applicable hold checks | Attempt outcome, physical actor, recipient/representative evidence, time/location and service-specific proof | Duplicate delivery callback/scan does not duplicate completion; ambiguous outcome remains unconfirmed | Delivery proof, failed-attempt reasons, alternate collection, redelivery/return |
| Request/approve/execute refund, credit or reversal | Finance or explicitly authorized financial action; original event and reason; independent approval where required | Separate request, approval, provider execution and confirmation; amount/currency/reference | Provider unknown outcome reconciled before retry; no duplicate financial effect; cancellation alone is not refund | Refund/credit eligibility, thresholds, approval and provider capabilities |
| Handle Support request/dispute | Support verifies requester's relationship and scope; records/acknowledges/routes/escalates | Verification method/result, request, communications, escalation and case linkage | Duplicate request safely linked; Support cannot resolve by changing booking authority, payment, custody or dispatch | Response targets, appeal reviewer, verification standards |
| Correct audit/evidence record | Specific correction/redaction authority; preserve original; independent approval if required | Original reference, correction reason, actor, approver, before/after manifest and time | Correction is additive/attributable; repeated correction is linked, not destructive overwrite | Retention/legal hold, correction catalogue and approval rules |
| View/export/disclose evidence | Separate purpose-specific permission for view, export and external disclosure; recipient/purpose verified | Access decision, evidence manifest, purpose, recipient, approver and disclosure record | Export retries must not widen scope or produce uncontrolled duplicate disclosures | Retention, legal request process, disclosure thresholds and reviewer roles |
| Send notification | Approved business event; recipient entitlement, contact verification, consent and permitted field set | Event reference, recipient, channel, template/version and attempt result | Provider timeout may mean sent; unknown outcome reconciled; retries deduplicated | Recipient matrix, contact rules, channels, retry and response targets |

This matrix intentionally does not assign every row to a job title. The accepted PM-01–PM-12 and action-level permission model require a future action catalogue and assignment scope. It also does not impose universal second approval: require it only where accepted policy or an owner-approved service rule says so.

## 4. External side effects and unknown outcomes

A Firestore transaction cannot make a Paystack, messaging, Cloudinary, bank, partner, or physical-world action atomic. For each external side effect, the future design must specify:

1. the authoritative source of outcome;
2. the local business record and correlation reference;
3. the deduplication/replay identity and its scope;
4. how success, failure, and unknown/unconfirmed outcomes are distinguished;
5. who owns reconciliation and what evidence resolves uncertainty;
6. the safe next action for each possible result;
7. customer/staff communication that does not overstate completion;
8. how the event is audited and later corrected.

**Unknown-outcome rule:** a timeout or missing response is not proof that the provider did nothing. Do not blindly repeat a charge, refund, message, assignment command, or physical instruction. Reconcile first against authoritative evidence. Until resolved, retain an unknown/unconfirmed outcome rather than asserting success or failure.

## 5. Concurrency, ordering, and idempotency test obligations

The final contract and test specification must cover the applicable cases below. These are obligations, not a prescribed key format or implementation mechanism.

| Test dimension | Minimum scenario | Required invariant |
|---|---|---|
| Duplicate | Same browser/staff command submitted twice | One intended business effect |
| Concurrent | Two actors mutate same target simultaneously | No lost consequential update or conflicting authority |
| Stale | Client submits an older version after a newer decision | Reject or safely reconcile; never last-write-wins overwrite |
| Out-of-order | Provider events or physical scans arrive in a different order | Preserve event history and resolve against authoritative chronology/state |
| Provider success/local failure | Provider succeeds while local persistence fails/times out | Reconciliation finds one external effect and safely repairs local state |
| Local pending/provider unknown | Local request exists but provider outcome is ambiguous | No duplicate side effect until authoritative lookup/reconciliation |
| Late event | Payment/callback arrives after cancellation, expiry, dispute or hold | Preserve event; route to approved review; do not silently reactivate |
| Partial failure | A multi-step workflow stops between stages | Expose completed, pending, failed and unknown stages distinctly; provide an owned recovery path |
| Unauthorized replay | Previously valid actor retries after permission/scope revocation | Re-evaluate authorization at mutation time |
| Correction | A previously recorded physical/financial/audit fact is challenged | Preserve original and append attributable correction/review outcome |

For each operation, the final design must select a provider-appropriate mechanism for concurrency, deduplication, retry, timeout, retention and reconciliation. No universal values are approved here.

## 6. Recovery ownership and separation of duties

| Exception class | Initial handling | Decision/execution boundary | Required record/evidence |
|---|---|---|---|
| Authentication/entitlement/permission denial | Deny and preserve state | Security/admin owner investigates access; Support may route but not grant authority | Permitted security event and correlation |
| Location/service capability unavailable | Block action or route to approved alternative | Authorized location/service owner changes capability; staff cannot self-grant it | Capability state/version and action denial |
| Booking/quote conflict | Preserve accepted commercial facts and reject stale mutation | Booking authority/service owner resolves under BP and quote policy | Original/revised quote, actor, reason, customer decision |
| Measurement/physical discrepancy | Preserve declared and actual facts; hold affected decision where required | Designated operational reviewer and independent approver where policy requires | Readings, units, proof, review and outcome |
| Custody/delivery dispute | Preserve last confirmed custodian and disputed accounts/evidence | Assigned independent investigator/authorized operations decision-maker; no inferred release | Original physical events, receiving party evidence, hold and findings |
| Payment/provider unknown | Do not repeat external side effect blindly | Finance/provider integration owner reconciles authoritative provider evidence | Provider event, request correlation, local state and reconciliation result |
| Refund/credit/reconciliation mismatch | Preserve original financial event and discrepancy | Finance controls decision and execution; requester cannot self-approve where separation applies | Request, approval, provider/bank confirmation and ledger reconciliation |
| Route/dispatch exception | Keep proposal, assignment, authorization and movement distinct | Authorized Operations approver; requester cannot approve own dispatch exception under DEC-030 | Proposal, assignment, exception reason, approval and actual movement proof |
| Support complaint/appeal | Verify relationship, acknowledge, record and route | Relevant booking/Finance/Operations authority decides; independent appeal review as required | Request, verification, communication, escalation and decision |
| Evidence correction/disclosure | Preserve original and restrict access | Separate view/export/disclosure authority; independent review where policy requires | Original, amendment, manifest, purpose, recipient and approvals |
| Notification failure | Keep business event committed; record delivery attempt/unknown result | Notification owner applies approved retry/channel policy | Event, recipient entitlement, attempt and delivery-provider outcome |

Support remains limited to intake, verification, acknowledgement, routing, escalation and permitted status communication. It does not gain booking-party authority, financial execution, custody/dispatch, or unrestricted audit access. Finance owns financial reconciliation and explicitly assigned financial actions. Location capability and staff permission remain independent.

## 7. Acceptance evidence requirements

For each P0/Conditional P0 mutation case, the test specification must capture, where applicable:

- policy/decision reference and exact version;
- actor identity, relationship, action permission, scope and location capability;
- authoritative initial state, relevant holds, configuration and independent approval;
- request, response, correlation reference and provider/physical evidence source;
- expected business fact and all protected state that must remain unchanged on denial/failure;
- duplicate, concurrent, stale, replayed, delayed and out-of-order variants;
- provider-success/local-failure and provider-unknown recovery where an external system is involved;
- audit/evidence links, physical actor/receiver/recorder distinction and correction path;
- independent reviewer, reproducible non-production environment, fixture cleanup and retained evidence.

A screenshot alone is insufficient for authorization, financial, stock, custody, delivery, audit or provider acceptance. Use controlled record snapshots, request/response traces, provider sandbox evidence and attributable operational evidence as appropriate. Do not use live customer data or real payments/physical operations as test fixtures.

## 8. Existing source reuse and verification boundary

| Inspected source boundary | Contract reuse | Verification still required |
|---|---|---|
| Storefront order creation and cancellation APIs | Existing server-side validation, Firestore transaction, stock reservation/release and access-token patterns | Duplicate/concurrent order and cancellation/payment races; late payment and stock restoration |
| Paystack initialize, verify and webhook APIs | Provider signature/reference/amount/currency verification and existing event deduplication approach | Concurrent/replayed/out-of-order callbacks, provider-success/local-failure, unknown outcome and reconciliation |
| Customer order/profile APIs | Existing authenticated ownership checks and narrow customer access | Direct API/token tests, guest token secrecy and no inference from sender/receiver/payer |
| Admin auth and order APIs | Existing coarse Admin verification and server-side checks | VLY-009/VLY-010; customer-to-Admin denial, direct API checks, action-level permission gaps |
| Firestore rules and rules tests | Existing client-write denial/catalogue boundaries | Deployed rules version and server API authorization; rules are not a substitute for endpoint guards |
| Cloudinary upload API | Existing constrained image upload path | Admin authorization and secret handling; do not reuse as a general evidence store without separate design |
| Existing fulfilment status fields | Storefront order fulfilment only | Must not be treated as shipment custody, route movement or proof of delivery |

Source findings remain tied to the recorded source-inspection baseline. No new source review, runtime test, deployed configuration inspection or production verification is claimed by this document.

## 9. Unresolved inputs that block final contract approval

The following remain owner/operational inputs, not values to infer in implementation:

- exact service rate/formula/input/unit/conversion/rounding and effective-date rules;
- quote validity and handover durations;
- payment-at-intake methods, partial/split eligibility, refund/credit/late-payment thresholds and reconciliation tolerances;
- service-specific intake, custody, movement and delivery proof standards;
- measurement discrepancy/materiality and staff approval thresholds;
- action-level permission catalogue, staff scopes, emergency access duration and independent reviewer assignment;
- booking/parcel/route/payment/evidence cardinalities DB-01–DB-12;
- retention/legal-hold periods, correction/redaction rules and external disclosure controls;
- Support/dispute response targets and appeal ownership;
- provider-specific idempotency, reconciliation and recovery mechanisms;
- monitoring, backup/restore, incident response, rollback and recovery objectives.

The owner decision register must resolve business policy; technical design must then select a compatible source-aligned contract. Neither document may silently choose a default.

## 10. Review 3 readiness checklist

Review 3 must not be presented as complete until the SDD can show:

- [ ] each P0 business action has one authoritative fact owner and a lifecycle precondition;
- [ ] each customer/staff/provider action has explicit authentication, entitlement, action permission, scope and location checks where applicable;
- [ ] every second-approval requirement maps to accepted policy and preserves requester/approver separation;
- [ ] duplicate, concurrent, stale, replayed, delayed and out-of-order behaviour is specified for consequential actions;
- [ ] every external side effect has an unknown-outcome and reconciliation owner;
- [ ] custody, delivery and financial facts have evidence requirements that cannot be satisfied by status assignment alone;
- [ ] Support, Finance, Operations, Management, Admin and partner boundaries remain consistent across actor, permission, workflow and acceptance documents;
- [ ] source reuse and gaps are traceable to the recorded source baseline;
- [ ] owner-dependent inputs and blocked decisions are explicit, with no invented values;
- [ ] each contract has corresponding acceptance scenarios and evidence artifacts;
- [ ] production-readiness and security verification dependencies are explicit.

**Current gate:** Reviews 1 and 2 of 5 are approved. This matrix advances Review 3 preparation but is not a completed Review 3 package and does not authorize implementation. Reviews 3–5 remain future gates. Application-code, schema, API, Firebase-rule, configuration and deployment changes remain frozen until explicit Review 5 approval of the complete reconciled SDD.
