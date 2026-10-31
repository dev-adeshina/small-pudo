# Review 3 Lifecycle Transition and Recovery Crosswalk

**Status:** Technical-design preparation; not an approved state machine, schema, API contract, or implementation authorization  
**Prepared:** 31 October 2026  
**Repository baseline:** PR #81 merge commit `471ebb1d16c33677e12ddcca1c6d3fdef343d239`  
**Application-source inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856`  
**Related:** `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_API_PERSISTENCE_AND_INTEGRATION_BOUNDARY_CONTRACT.md`, `PLATFORM_TECHNICAL_DESIGN_COHERENCE_AND_DEPENDENCY_MATRIX.md`, `PLATFORM_REVIEW_3_ACTION_CAPABILITY_CROSSWALK.md`, `PLATFORM_REVIEW_3_OWNER_INPUT_TRIAGE.md`, DEC-033–DEC-044, PM-01–PM-12, BP-01–BP-22.

## 1. Purpose and boundaries

This crosswalk makes lifecycle transition obligations reviewable across booking, commercial, payment, physical custody, routing, delivery, evidence, exceptions and notifications. It complements the domain lifecycle and shared-workflow documents; it does not replace them.

It deliberately describes **business facts and transition controls**, not a final status vocabulary. Terms such as confirmed, accepted, held, assigned, dispatched, handed over, arrived, delivered, collected, cancelled, failed, unknown and reconciled are explanatory labels unless an authoritative SDD decision already defines their meaning. Do not turn these labels into enum values or persisted fields by inference.

The governing distinction is:

- a command/request expresses an attempt to cause a change;
- an authorization/decision permits or rejects that attempt;
- a local business fact records what the platform can authoritatively assert;
- a physical event records what actually happened in the world;
- an external-provider outcome records what the provider confirms;
- evidence supports review of a claim but is not itself the claim;
- a projection or notification communicates a derived view and does not become the authoritative fact.

A successful UI response, API request, assignment, route plan, dispatch instruction, arrival signal, provider callback, notification delivery or audit log must not be treated as proof of a different business fact.

## 2. Transition contract required for every consequential action

Before a transition is specified for implementation, its contract must identify:

1. **Subject and granularity:** the business object and whether the fact belongs to a booking, shipment/consignment, parcel, service component, route/leg, payment, financial event, location, party relationship or evidence item.
2. **Authoritative fact owner:** the domain responsible for asserting the fact; do not let a read model, notification or adjacent domain silently own it.
3. **Initiator and actor:** the requesting principal, actual physical actor where relevant, receiving actor, recorder, provider and any delegated party must remain distinguishable.
4. **Authority:** action-level staff permission, scope, location/service/action capability, party entitlement and any required independent approval are checked separately. The requester cannot approve their own consequential action.
5. **Preconditions:** required prior facts, accepted quote, eligibility, service capability, custody, payment purpose/outcome, evidence, absence of holds and any unresolved exception.
6. **Decision and outcome:** allowed, denied, held for review, accepted with a bounded partial outcome, rejected or unknown. An unknown outcome is not a success or failure.
7. **State and non-state effects:** exactly which authoritative fact may change and which facts must remain unchanged. Side effects in another domain are not implied.
8. **Evidence:** what is required, who/what produced it, physical actor/receiver/recorder attribution, integrity/provenance, and whether the evidence is mandatory, conditional or unavailable.
9. **Concurrency and replay:** duplicate requests/events, stale versions, competing actions, out-of-order delivery and idempotency behaviour.
10. **Recovery and accountability:** the party responsible for resolving denial, hold, timeout, unknown outcome, correction, provider divergence or physical exception; required reconciliation evidence and closure decision.
11. **Customer/party communication:** who may be told what, through which approved channel, and only after the authoritative event and recipient entitlement are established.
12. **Audit and retention:** attributable decision, original fact/evidence preservation, correction lineage, reviewer access, legal hold and disclosure controls.

If any contract element is unresolved, the transition remains a design gap. Do not fill it with an assumed status, role, threshold, retry interval, proof method or API.

## 3. Cross-domain transition inventory

| Domain / transition | Preconditions and authority | Authoritative fact and boundary | Evidence / audit obligation | Denial, hold, unknown and recovery |
|---|---|---|---|---|
| Quote → accepted booking | Authenticated booking party accepts the applicable valid quote; party entitlement and quote context are checked. | Acceptance confirms the independent booking under DEC-038. It does not assert parcel intake, custody, payment, dispatch or fulfilment. | Preserve the accepted quote and acceptance attribution/context. | Invalid/expired quote or unauthorized party cannot create acceptance. Any retry must not create duplicate bookings. Cancellation/missed-handover consequences and the exact consignment obligation remain owner input (DB-01). |
| Booking → operational shipment/consignment obligation | Depends on the unresolved DB-01 owner choice and DB-02 unit/cardinality choice. | Do not assume that booking confirmation and operational shipment creation are the same fact. Preserve booking identity separately from physical parcel identity. | Record the chosen business relationship and its source decision once approved. | Until DB-01/02 are settled, do not invent automatic creation timing, one-to-one cardinality, split/merge or partial-acceptance semantics. |
| Booking/order → quote or commercial adjustment | Service eligibility, accepted commercial context, authorized decision and any required customer response. | Quote, adjustment decision and booking/order obligations remain distinct. DEC-039/040 govern boundaries; no universal formula or tolerance is implied. | Preserve original quote/declared inputs and attributable adjustment reason, decision and customer response. | Customer rejection, material change or disputed measurement follows the service-specific approved outcome; exact authority, units, thresholds and allocation remain open. |
| Payment request → provider attempt | Correct payment purpose, amount/currency context, authorized initiation and idempotency/replay protection. | A request/attempt is not a confirmed payment, settlement, refund, credit or booking fulfilment fact. | Retain local request identity and provider correlation/reference where available; protect sensitive payment data. | Definite pre-provider rejection may be handled as failure; timeout or lost response after possible submission is unknown, not failed. Reconcile before a new side effect. |
| Provider attempt → confirmed payment outcome | Verify provider evidence/signature/status through the approved integration and reconcile against the intended payment purpose and amount. | Only the payment domain asserts the authoritative payment outcome. A callback, browser redirect or notification alone is insufficient. | Preserve provider event/transaction evidence, verification result, deduplication and reconciliation history. | Duplicate, delayed, out-of-order or contradictory provider events are safely deduplicated/held and reconciled. Never blindly repeat a charge or infer success from a client redirect. |
| Payment → allocation/settlement/refund/credit/reversal | Finance authority, payment purpose, obligation linkage, approved eligibility and any independent approval. | Payment, allocation, settlement, refund, credit, reversal and reconciliation are separate financial facts. Finance retains full reconciliation responsibility; Admin operational visibility is bounded. | Preserve immutable lineage from obligation to local financial event and provider transaction; record requester, approver and executor separately. | Partial/multi-obligation allocation policy, limits, tolerances, provider capabilities and detailed reversal rules remain owner/technical inputs (DB-06/11). |
| Arrival at location → intake decision | Location independently supports the relevant service/action; staff independently holds action permission and scope; booking/party/parcel checks pass. | Arrival or a presented parcel is not accepted intake and does not transfer custody. | Record intake inspection, declared/observed facts, actor and evidence according to the service-specific approved checklist. | Refusal, mismatch, damage, unsafe/unsupported item, missing evidence or closure creates a controlled exception/hold; no custody transfer is inferred. Exact intake outcomes and proof are open. |
| Intake decision → accepted physical custody | Actual physical handover occurs and the receiving party takes possession; authorized recorder records the event. | Under DEC-044, custody changes only on actual handover plus receiving possession. Assignment, acknowledgement, scan, dispatch or arrival alone cannot transfer custody. | Capture the applicable service-specific proof and distinguish physical giver, physical receiver and platform recorder. Preserve original evidence. | If possession is disputed or evidence incomplete, retain the last confirmed custodian and open an exception; do not fabricate transfer. |
| Measurement → accepted measurement / adjustment | Applicable measurement procedure, calibrated/approved source where required, authorized staff and customer-response rule. | Declared and observed measurements, adjustment proposal, approval and customer acceptance/rejection remain distinct facts. | Preserve original declared values, observed values, method/source, actor, timestamp and decision history. | Dispute, failed measurement or missing instrument evidence triggers review; no universal unit, conversion, tolerance or materiality threshold is assumed. |
| Route proposal → approved route | Valid shipment/parcel scope, eligible locations/services, capacity and authorized proposal/approval. | A route proposal or approval is planning information; it does not change custody or prove movement. | Retain proposal/approval provenance and material route changes. | Unsupported capability, capacity conflict or scope mismatch denies/holds the plan. Multi-leg, split, shared-load and reassignment launch semantics remain DB-03 owner input. |
| Route approval → assignment | Approved route and independently authorized assignment action; relevant location/service capability remains valid. | Assignment allocates responsibility; it does not prove dispatch, handover, movement or custody transfer. | Record assigning principal, assigned party/resource, scope and decision. | Revoked authority, closure or stale route must block/reconcile assignment; reassignment preserves prior history and never rewrites a completed physical event. |
| Assignment → dispatch authorization | Preconditions, required payment/exception checks, action permission, location capability and any required independent approval. | Dispatch authorization/instruction is not physical departure or handover. | Record authorizer, approver, applicable decision/evidence and intended scope. | A denied dispatch leaves custody and payment facts unchanged. DEC-030/041 exceptions and thresholds remain governed by accepted policy and unresolved details. |
| Dispatch → physical handover / movement | Actual physical transfer or movement occurs; the responsible physical actors and locations are identified. | Dispatch status or a driver's assignment cannot assert physical transfer. Route leg, movement, handover and custody are distinct facts. | Record the actual event with giver/receiver where applicable, recorder and proof required by the service. | Missed, partial, disputed or failed handover retains last confirmed custody and enters an exception. No automatic transfer on timeout or arrival. |
| Movement → arrival | Evidence supports arrival at the relevant location/leg endpoint; location capability and next-step eligibility are checked. | Arrival is a location/movement fact, not intake, custody acceptance, delivery or collection. | Preserve source/time/location attribution and any verification limitations. | GPS, scan, manual report or provider feed is evidence with defined confidence, not automatically proof of possession. Conflicts are reconciled. |
| Delivery attempt → delivered | Correct recipient/authority, delivery eligibility, actual physical handover and recipient possession; applicable proof and approval rules. | Attempt, failed attempt, route completion and delivery are distinct. Delivered is asserted only when the approved physical completion conditions are met. | Preserve service-specific delivery proof, physical actor/receiver, recorder, timestamp and exception history. | No answer, refusal, wrong recipient, unsafe location, disputed proof or partial delivery is an exception/attempt outcome, not delivered. Proof methods and customer/liability outcomes remain open. |
| Delivered/held → collection or release | Collection authority and identity/party entitlement are verified; release conditions and holds are satisfied; actual physical handover occurs. | Collection authorization is not collection. Release/custody completion is recorded only after actual possession transfers to the authorized receiver. | Preserve identity/authority verification result, physical giver/receiver, recorder and required proof. | Disputed authority, expired delegation, legal hold or incomplete proof blocks release; last confirmed custodian remains authoritative. |
| Exception → resolution/correction | Assigned investigation authority, evidence access, action permission/scope, required independent review and any customer response. | Exception classification, investigation finding, corrective action and underlying original event remain distinct. A correction never erases the original fact. | Preserve original evidence and append attributable correction, reason, reviewer and disclosure lineage. | Support may record/verify/route/escalate within its bounded authority; it cannot grant custody, financial or dispatch authority. Unresolved liability, compensation and investigation ownership remain owner inputs. |
| Business event → notification/projection | Authoritative event is committed/verified; recipient entitlement, field-level disclosure, consent/channel and notification policy are checked. | Notification delivery/read status and projection freshness are not the business event. | Record event reference, recipient, permitted fields, channel, delivery attempt and failure without copying unnecessary sensitive data. | Delayed/duplicate/out-of-order notification is deduplicated or reconciled; failure never rolls back the business fact or creates a new one. DB-12 matrix remains to be completed. |
| Evidence → review/export/disclosure | Reviewer has separate view/export/disclosure authority, scope and legal basis; second approval where accepted policy requires it. | Evidence access is not authority to alter the underlying event. Export/disclosure is a separate action from viewing. | Log purpose, actor, approver, evidence set, recipient and disclosed fields; preserve original and redaction/correction lineage. | Unauthorized, excessive or unsupported disclosure is denied and audited. Retention durations, hold authority and detailed government-request procedure remain owner input. |

## 4. Cross-cutting invariants

The following invariants apply across all domain contracts and must be carried into later acceptance specifications:

- **No cross-domain inference:** booking does not imply intake; intake does not imply payment; payment does not imply custody; assignment does not imply dispatch; dispatch does not imply movement; arrival does not imply transfer; attempt does not imply delivery; notification does not imply business completion.
- **Custody truth:** custody changes only on actual physical handover and receiving possession. On uncertainty, retain the last confirmed custodian and open an exception.
- **Authority is conjunctive, not substitutive:** party entitlement, staff action permission, scope, location/service/action capability and required independent approval are checked as applicable. One does not imply another.
- **No self-approval:** the requester cannot approve their own consequential action.
- **Original history is immutable in meaning:** correction is attributable and additive; it does not rewrite accepted quote, payment outcome, custody, movement or evidence history.
- **Failure is non-mutation by default:** denied or invalid transitions do not partially mutate protected authoritative facts. Any explicitly allowed partial result must be separately specified.
- **Unknown is a first-class operational condition:** absence of a response is not proof of failure. Reconcile before repeating a potentially consequential external side effect.
- **Idempotency is scoped to intent:** repeated delivery of the same command/event must not duplicate the same business effect; distinct legitimate intents must not be collapsed merely because their payloads look similar.
- **Physical actor and system recorder differ:** the person who physically performs/receives an action must not be confused with the staff member or service that records it.
- **Evidence is not an event substitute:** a scan, image, signature, GPS point, webhook, log or notification must be evaluated under an approved proof policy.
- **Holds are explicit and owned:** a hold blocks only the specified actions/scope; it has an accountable reviewer, release condition and audit trail. No indefinite or silent hold semantics are assumed.
- **Projections are derived:** stale, delayed or failed projections cannot become authority for a consequential mutation; read freshness/lineage must be visible where relevant.
- **Customer communication follows fact and entitlement:** no notification may disclose fields or recipients beyond DEC-034 and the applicable party authority.

## 5. Provider-neutral unknown-outcome and recovery contract

For any external side effect (payment charge/refund, notification, upload, or a future partner/provider operation), the design must distinguish:

1. **Not submitted:** reliable evidence establishes that the side effect was not sent. A retry may be considered under the same intent and approved idempotency contract.
2. **Confirmed success:** provider evidence is verified and correlated to the intended local obligation. Record the outcome once; duplicate callbacks/replays do not repeat the business effect.
3. **Confirmed failure:** provider evidence establishes failure for the intended operation. Preserve the reason and allow only the explicitly authorized next action.
4. **Unknown outcome:** submission may have occurred but confirmation is absent, delayed, contradictory or unavailable. Do not mark success/failure and do not blindly issue a new side effect.
5. **Reconciled:** a responsible operator/system has compared local intent, provider evidence and the relevant obligation, documented the determination and closed or escalated the unknown case.

Required controls:

- Persist a local intent/correlation reference before or as part of initiating an external operation, using the existing architecture where possible; exact persistence design remains open.
- Reuse the same idempotency identity for a retry of the same intent when the provider supports it. Do not claim provider idempotency where capability is not verified.
- Prefer provider status retrieval/reconciliation over creating another charge/refund or other irreversible effect.
- Verify callback authenticity and provider transaction details; a browser redirect or client-supplied status is not authoritative.
- Deduplicate provider events and tolerate duplicate, delayed and out-of-order delivery.
- Keep provider status, local business outcome and financial reconciliation as related but distinct facts.
- Assign each unknown case to an accountable reconciliation owner; record ageing/escalation criteria only after owner-approved operational targets exist.
- Preserve raw/normalized evidence and the decision trail subject to privacy, security and retention policy.
- If the provider cannot safely identify or query an uncertain operation, keep it held for controlled investigation; do not invent automatic retry intervals or assume exactly-once delivery.
- A compensating action is a new authorized financial/business event, not deletion or rewriting of the original event.

**Provider capability verification required:** idempotency support and key scope, transaction lookup semantics, callback authenticity mechanism, event ordering/replay guarantees, refund/reversal lookup, settlement exports, retention/availability and known eventual-consistency behaviour. Verify against the selected provider's current official documentation and actual account configuration before making a provider-specific claim. This document does not certify Paystack or any future provider capability.

## 6. Recovery ownership by domain

| Domain | Primary responsibility to determine/reconcile | Must not be delegated by implication |
|---|---|---|
| Booking and party authority | Booking/Operations owner for acceptance, party proof, cancellation and booking-to-shipment relationship. | Support cannot create booking authority or infer business delegation. |
| Commercial quote and measurement | Commercial/pricing owner for quote context, measurement dispute and adjustment decision. | Operations cannot invent rates, units, tolerances or customer liability. |
| Payment and financial events | Finance owns complete reconciliation; provider integration supplies verified evidence; authorized operations may have bounded visibility. | Admin visibility does not imply refund/credit/settlement authority. |
| Intake and custody | Designated location/Operations authority investigates physical possession and records verified handover. | Assignment, route or system recorder cannot stand in for physical receiver. |
| Route and dispatch | Authorized Operations owner resolves route/capacity/dispatch exceptions under independent staff and location checks. | Dispatch authorization does not prove physical movement or custody transfer. |
| Delivery and collection | Designated delivery/collection authority verifies actual recipient possession and resolves proof/authority disputes. | A delivery attempt or recipient notification cannot close the physical event. |
| Audit/evidence/disclosure | Accountable records/evidence owner controls integrity, review, retention, holds, export and disclosure. | Admin status or evidence-view permission alone does not grant export/disclosure. |
| Provider unknown outcome | Domain owner remains accountable for the business outcome; named reconciliation operator resolves provider divergence under controlled access. | Provider callback, customer screenshot or Support note alone cannot close the unknown case. |
| Notification/projection | Owning domain asserts the event; notification/projection service reports delivery/freshness and operational failure. | Notification operator cannot alter the source business fact to make delivery succeed. |

Named roles, teams, deputies, escalation targets and service-level timings are not assigned here; they require owner accountability decisions and operating context.

## 7. DB and review-gap dependencies

This crosswalk deliberately leaves these owner-dependent items open:

- **DB-01/02:** booking-to-consignment obligation timing, booking/parcel launch cardinality, partial acceptance, split/merge and cancellation.
- **DB-03:** route-leg cardinality, sequential/shared movement, split and reassignment launch scope.
- **DB-04:** exact operational identity relationship for delivery-eligible storefront orders; preserve DEC-037 shared fulfilment.
- **DB-05/06/11:** commercial unit and adjustment allocation; payment allocation across obligations and service eligibility; financial lineage details and limits.
- **DB-07/08:** business representation/delegation evidence, scope, expiry, revocation and dispute.
- **DB-09:** launch location/partner operating models, capability change authority, closure and queued work.
- **DB-10:** mandatory event/evidence catalogue, reviewer eligibility, retention and legal-hold authority.
- **DB-12:** event/recipient/field/channel/consent/timing matrix and notification failure ownership.
- **PM/DEC:** named accountable owners, emergency authority, workflow-specific second approval, service-specific proof, investigation/liability outcomes and production recovery targets.

Technical work that can continue without owner policy approval includes mapping every existing workflow to this contract, source-verifying existing integration capabilities, designing case-level acceptance specifications, and building field entitlement/projection lineage matrices. None of those steps authorizes implementation.

## 8. Acceptance-specification obligations (not executed tests)

For each transition, later executable acceptance cases must cover the applicable subset of:

- valid, invalid, unauthorized and out-of-scope actor;
- location capability present, absent, revoked, closed or changed during work;
- required second approval present, absent, self-approved or stale;
- required evidence present, missing, duplicated, corrupted or contradictory;
- duplicate request, replay, concurrent competing command and stale client version;
- delayed, duplicate, out-of-order, forged or contradictory provider event;
- timeout before submission, after possible submission and after provider success;
- explicit hold, denial, correction, cancellation and controlled recovery;
- customer/party entitlement and field-level disclosure;
- original history preservation and audit attribution;
- projection stale/failure and notification failure without mutation of source facts;
- physical transfer with actual possession versus assignment/dispatch/arrival/attempt without possession.

Each case must state fixture, actor, scope, capability, exact command, pre-state, expected authoritative fact, prohibited side effects, evidence, recovery owner, audit result and cleanup. The existing 80 P0 scenario catalogue remains an outline until converted into case-level specifications; no test execution or pass status is claimed here.

## 9. Review 3 completion conditions

Before Review 3 can be presented, reconcile this crosswalk against every relevant workflow and lifecycle document and ensure:

- each consequential action has an authoritative fact owner and defined subject/granularity;
- every physical event distinguishes actor, receiver and recorder;
- all transition preconditions align with the action/capability crosswalk;
- no accepted DEC/BP/PM policy is reopened or contradicted;
- unresolved DB items remain explicit and are included in the consolidated owner package;
- unknown external outcomes have safe provider-neutral handling and accountable reconciliation;
- corrections, holds, audit/evidence access and disclosures preserve original history;
- API/field entitlements and projection lineage align with the same authoritative facts;
- P0 case specifications can trace to the transition and failure/recovery contract;
- all source/runtime/production claims remain within their verified evidence boundary.

## 10. Approval boundary

This is a documentation-only technical-design crosswalk. It does not establish new business policy, status enums, database schema, collection/field names, API routes/payloads, permission catalogue, provider capability, numerical service level, or implementation architecture. It does not approve Review 3, Reviews 4–5, tests, application changes, Firebase configuration/rules, provider activation or deployment.

Reviews 1–2 remain approved. Review 3 remains in preparation. The owner has stated that two of the maximum five approval exchanges have been used, with three remaining. Consolidate remaining owner choices; reserve the fifth/final exchange for the complete reconciled SDD and explicit implementation authorization.
