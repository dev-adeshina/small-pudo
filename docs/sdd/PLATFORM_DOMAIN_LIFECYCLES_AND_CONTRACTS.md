# VeriLyft Domain Relationships, Lifecycle Boundaries, and API/Security Contracts

**Document status:** Draft for owner review — not approved for implementation  
**Last updated:** 29 October 2026  
**Scope:** Conceptual domain boundaries, lifecycle transition rules, service/API contract expectations, and authorization/security invariants  
**Related documents:** SPEC.md, DECISIONS.md, ISSUES.md, PLATFORM_ACTORS_AND_RESPONSIBILITIES.md, PLATFORM_SHARED_WORKFLOWS.md, SDD_COMPLETENESS_AUDIT.md  
**Related decisions:** DEC-018, DEC-019, DEC-020, DEC-021, DEC-024, DEC-025, DEC-026, DEC-027

## 1. Purpose and guardrails

This document follows the actor/responsibility and shared-workflow drafts. It translates those concepts into a preliminary domain model and contract checklist without prescribing implementation details that depend on unresolved policy or source inspection.

It is not a Firestore schema, API specification ready for coding, migration plan, or authorization implementation. It does not define collection names, document fields, status enum values, route paths, request/response JSON, indexes, token formats, or deployment boundaries. Existing source and data must be inspected read-only before any technical proposal is approved.

Use these labels:

- **Accepted constraint:** already supported by an owner-approved decision.
- **Conceptual candidate:** a proposed domain boundary or relationship for review, not a claim about current storage.
- **Open policy:** a business rule requiring owner decision.
- **Source validation required:** inspect the current repository to see what already exists before proposing a change.
- **Implementation evidence:** source facts and dated runtime/test results, recorded separately from the intended design.

## 2. Domain modelling principles

1. Keep storefront commerce and independent shipment booking distinct while allowing a delivery/fulfilment relationship where the approved workflow requires it.
2. Keep intent, accepted commercial terms, physical custody, movement, delivery outcome, and financial settlement distinguishable.
3. Preserve immutable or versioned commercial facts needed to explain what was quoted, accepted, measured, charged, paid, refunded, or disclosed.
4. Prefer explicit relationships over overloading a single record with several unrelated lifecycles.
5. An operational status must not imply a financial status, and a financial status must not imply a physical event.
6. Record consequential changes as attributable events/history, rather than silently overwriting the only record of a prior decision.
7. Enforce permissions on the server for every privileged operation; hiding a button or checking a client-side role is not authorization.
8. Use the existing application architecture and data model wherever it can satisfy the accepted requirements. Do not create parallel collections/services merely because this document names a conceptual boundary.
9. Avoid a generalized workflow engine, enterprise RBAC framework, separate Driver Portal, or new microservice architecture unless a concrete approved need is demonstrated.
10. Do not resolve owner policy by choosing defaults in a data model or API contract.

## 3. Conceptual domain map

The following are conceptual objects/record responsibilities, not proposed Firestore collection names.

| Conceptual object | Responsibility | Must not be confused with |
|---|---|---|
| Storefront order | Customer purchase and commercial items/order obligations | Independent shipment booking; physical transport record; payment event |
| Order item | Product/quantity and accepted item-level commercial facts | Current catalogue values after the order was placed |
| Delivery fulfilment link/work item | Connects an order to delivery work where required | Proof that a parcel was physically accepted or moved |
| Independent shipment booking | Intent/agreement to arrange a shipment outside a storefront purchase | Storefront order; physical intake; route assignment |
| Quote / quote snapshot | Price offer and inputs/rates applicable at a point in time | Payment, receipt, or a mutable current price calculation |
| Shipment / consignment | Physical parcel/service obligation once the lifecycle rules define its creation point | Booking intent alone; an individual route leg |
| Intake / custody event | Physical receipt, measurement, acceptance/refusal, or custody transfer | Booking acceptance; payment success; delivery completion |
| Location | A place and its configured capabilities (staffed station versus registered collection centre) | Proof that every service is enabled at that place |
| Route proposal | Suggested sequence/path for operational consideration | Approved assignment or completed movement |
| Route leg / transport assignment | A planned/approved segment of movement with a responsible provider/resource | Physical handover or arrival evidence |
| Movement / handover event | Evidence that a physical milestone or custody transfer occurred | Route proposal/assignment; payment |
| Delivery attempt / proof | Attempt result and evidence for the delivery outcome | A mere assignment; a successful outcome without required proof |
| Payment attempt/provider transaction | Attempt to collect funds for a defined purpose | Order/shipment status; a locally submitted callback claim |
| Financial event | Charge, additional payment, refund, credit, reversal, write-off, or reconciliation adjustment | A generic payment-status field or note without defined financial meaning |
| Identity / account | Authenticated principal and relevant customer profile | Sender, receiver, payer, booking party, or staff role automatically |
| Authorization decision | Whether a principal may perform a specific action on a target and scope | Authentication alone or UI visibility |
| Audit/evidence record | Attributable record of consequential action, decision, or supporting evidence | Automatic proof that an external physical event actually happened |
| Notification attempt | Message delivery attempt triggered by an approved event | The underlying business event itself |

### 3.1 Candidate relationships

- A storefront order contains one or more order items.
- An order may have zero or more payment attempts and financial events over its lifecycle.
- An order may be associated with delivery fulfilment work; the exact creation/linkage point is an open design question.
- An independent shipment booking may have one or more quote versions or revisions, but the accepted quote must be identifiable and preserved.
- A booking may result in a shipment/consignment after the owner-approved acceptance/intake gate. The precise creation point is unresolved.
- A shipment may have multiple intake, custody, route-leg, movement, delivery-attempt, and evidence records over time.
- A route proposal may be revised before Operations approves assignments. Approved assignments and subsequent physical movement events remain separately traceable.
- A shipment or order may have multiple payment/financial events. Financial events must link to their business purpose and, where relevant, provider transaction and original event.
- A person may occupy more than one business relationship (customer, shipper, sender, payer, receiver), but each relationship must be explicit where it affects access, notification, liability, or change authority. DEC-024 requires that payer status alone grants payment confirmation/receipt information only by default, and neither booking nor payment alone authorizes physical collection or full shipment-detail access.
- A location has explicit service capabilities and authorization boundaries; location type alone must not imply an unapproved capability.
- An audit record may reference an action, decision, target, actor, reason, and evidence reference. It should not store secrets or duplicate sensitive payloads unnecessarily.

### 3.2 Relationships requiring owner decision

1. When an independent booking becomes a shipment/consignment.
2. Whether each storefront delivery creates a shipment record or uses a more limited fulfilment association.
3. Whether shipment, consignment, parcel, and booking are separate launch concepts or can use existing compatible records.
4. Whether a booking can contain multiple parcels, and whether each parcel can have a separate quote/route/delivery outcome.
5. Whether one payment can settle multiple bookings/orders, and whether partial settlement is allowed.
6. How quote versions, adjustments, refunds, credits, and provider transactions are linked.
7. How a route leg relates to a shipment containing multiple parcels.
8. Exact identity relationships/checkpoints to verify and which may be recorded as supplied information; DEC-024 has already accepted distinct party roles, payment-only payer visibility by default, and no inferred collection authority.
9. What data retention, deletion, legal hold, and evidence access rules apply.
10. Which concepts already exist in source and should be reused rather than represented by new records.

## 4. Lifecycle boundaries and transition rules

**Accepted party/access rule (DEC-024):** Booking party, sender, receiver/collection recipient, payer, and physical handover person may differ. Access, change authority, notification scope, and collection entitlement must be checked independently. Payer status alone grants payment confirmation/receipt information only by default. A booking does not authorize collection, and payment does not authorize full shipment-detail access. Exact verification checkpoints, change-type permissions, consent requirements, and post-intake/post-dispatch handling remain unresolved.

The lists below are lifecycle dimensions and transition requirements, not approved status values. Do not translate them directly into enums until owners approve the transitions and source inspection confirms compatibility.

### 4.1 Booking lifecycle

Conceptual progression:
- Booking intent is started by a registered, authenticated customer.
- Booking party, sender, receiver/collection recipient, payer, and expected handover person are recorded as distinct relationships where relevant; a person may occupy multiple roles.
- Required details and quote inputs are collected.
- A quote is produced and presented.
- The quote is accepted or booking is confirmed under the approved rule.
- The booking may be changed, cancelled, abandoned, or proceed to physical intake according to policy. Change authority is defined by change type and lifecycle stage; booking-party status does not create blanket authority.
- A payer who is not separately entitled receives payment confirmation/receipt information only by default; payment alone does not grant full shipment-detail access or collection authority.
- Intake either links to an existing booking or follows the approved staff-created walk-in path.

Required guards:
- Quote acceptance must be distinguishable from physical intake.
- Booking confirmation must not imply payment is settled unless independently verified.
- Changes to an accepted quote must preserve prior accepted commercial facts.
- Booking cancellation must not silently erase payment, custody, or audit history.

Open policy: eligibility, guest/account rules, quote validity, booking confirmation point, cancellation rights/fees, expiry, and what happens when a paid booking never reaches intake.

### 4.2 Quote and adjustment lifecycle

Conceptual progression:
- Pricing inputs are validated for the selected service.
- Fixed or calculated pricing is selected according to that service's approved rule; calculated rules use only the inputs applicable to the service (which may include origin/destination or distance band, parcel weight, dimensions/volumetric weight, service class/delivery speed, and a configured minimum charge).
- A quote is calculated from the shared approved rule set wherever storefront delivery and independent shipment booking inputs overlap.
- The quote's validity is determined by the selected service's configured policy.
- The quote and rate/rule context are preserved, including accepted inputs, itemized charges, total, currency, and applicable effective/version context.
- The customer accepts, declines, or lets the quote expire under the approved rule.
- Later measurement or service changes may create a proposed adjustment.
- Any required review/approval occurs before the adjustment becomes binding.
- A resulting charge, additional payment, credit, or refund is processed and verified separately.

Required guards:
- Current rate changes must not rewrite a previously accepted quote.
- Adjustment proposals must link to the original quote and identify changed inputs and reason.
- A proposed adjustment is not a settled financial event.
- An adjustment affecting an existing payment follows the approved review policy.

Open policy: exact formulas and service mapping, units/distance source and bands, rounding, rate effective dates, expiry and re-quote behaviour, tax/fee/discount treatment, allowed repricing events, customer consent, adjustment thresholds/approval limits, and consequences if the customer declines.

### 4.3 Payment and financial-event lifecycle

Conceptual progression:
- A payment attempt is created for a defined purpose and amount.
- The provider operation is initialized where applicable.
- A trusted server-side verification/webhook path determines the provider outcome.
- The result is associated with the correct business record and processed idempotently.
- Later charges, refunds, credits, reversals, or reconciliation adjustments are recorded as distinct events.
- Unresolved or contradictory outcomes remain exceptions until an approved resolution is recorded.

Required guards:
- Client/browser redirects cannot independently establish payment success.
- Duplicate callbacks/webhooks must not double-apply stock, settlement, or other side effects.
- Provider references and expected amount/currency/purpose must be checked before associating an outcome.
- A refund request is not a completed refund; a reversal/chargeback is not the same as a normal refund.
- Financial resolution must not silently rewrite physical shipment state.

Open policy: payment-at-intake methods/evidence, partial payments, late success after cancellation, refund/credit authority, reconciliation tolerances, and separation of duties.

### 4.4 Intake and custody lifecycle

Conceptual progression:
- An authorized intake actor identifies the booking/shipment or creates an approved walk-in intake.
- The actor confirms the location/service supports the operation.
- Physical receipt, measurements, condition checks, and required evidence are recorded.
- Custody is accepted, refused, or held for review under the approved policy.
- If relevant, a quote discrepancy is referred to the adjustment process.
- Each later custody handover is recorded as its own physical event.

Required guards:
- A booking is not evidence of receipt.
- Only an authorized actor can record an intake/custody event within permitted location/service scope.
- A staff-created record should distinguish the actor who entered it from the external person/provider reported to have performed the event where relevant.
- A custody event must not imply payment settlement or delivery completion.

Open policy: location capabilities, mandatory measurements/condition checks, units/tolerances, refusal/hold outcomes, evidence requirements, and partner access.


**Accepted location-capability policy (DEC-025):** A location's configured capabilities determine which actions are available there. Walk-in intake record creation, measurement, custody acceptance, payment collection/recording, and parcel release are distinct actions and require the corresponding authorization. The initial location record is lean (name, address, active status, configured capabilities). Authentication or Admin status alone is insufficient. Consequential events must identify actor, location, and time, with applicable evidence/reason. Exact data representation and transition rules remain subject to source inspection and later SDD approval.

### 4.5 Route proposal, assignment, and movement lifecycle

Conceptual progression:
- A shipment/fulfilment unit meets approved prerequisites for planning.
- A route proposal is created or presented.
- Operations reviews and approves, revises, or rejects the proposal.
- Approved route-leg assignments are recorded.
- Actual physical handovers and movement milestones are recorded independently.
- Changes, delays, missed handovers, damage/loss, and reassignment follow an approved exception path.

Required guards:
- Proposed route, approved assignment, dispatch, handover, and completed movement are distinguishable.
- Assignment changes preserve prior decisions and responsible actors.
- Operations-entered milestones identify the source/evidence where the operator did not personally witness the event.
- No driver-facing portal is implied by this lifecycle.

Open policy: route constraints, required milestones, assignment authority, provider/resource data, capacity checks, evidence sources, and exceptions.

### 4.6 Dispatch lifecycle

Conceptual progression:
- The shipment/fulfilment unit is confirmed physically ready.
- Required route-leg assignment and operational holds are checked.
- Payment is verified, or a narrowly defined unpaid-dispatch exception is explicitly approved.
- Dispatch and physical handover are recorded with required evidence.
- If blocked, the case follows an explicit resolution path.

Required guards:
- Verified payment is the default prerequisite.
- An exception requires the approved policy, authorized approver, recorded reason, and audit trail.
- Exception approval does not change payment state.
- Assignment alone is not dispatch or proof of handover.

Open policy: exception eligibility, authority, second-person approval, limits, required evidence, and other dispatch-blocking holds.

### 4.7 Delivery and failed-delivery lifecycle

Conceptual progression:
- An attempt is recorded against the correct shipment/leg.
- Evidence is validated against the approved proof method for the service.
- The attempt is classified as successful or unsuccessful according to approved rules.
- An unsuccessful attempt is routed to the authorized resolution process.
- Redelivery, return, hold, cancellation, refund, or another consequential outcome occurs only under an approved policy and is separately recorded.

Required guards:
- Attempted delivery is not successful delivery.
- A successful outcome requires the approved proof.
- Failed delivery must not automatically imply return, redelivery, refund, or disposal unless approved policy explicitly says so.
- Evidence access and correction/dispute actions are authorized and auditable.

Open policy: proof methods, recipient checks, retry/time limits, reasons, fees, return/redelivery authority, evidence retention, and disputed/missing proof.

### 4.8 Authorization and audit lifecycle

Conceptual progression:
- A request identifies the authenticated principal, action, target, and relevant scope.
- The server authenticates the principal and evaluates authorization against approved permissions.
- The request is validated against lifecycle preconditions and any required approval.
- The operation succeeds or returns a defined denial/conflict outcome.
- Consequential actions record actor, target, action, time, result, reason/approval reference, and evidence reference where required.

Required guards:
- Authentication does not imply authorization.
- A caller cannot grant themselves a role or scope by supplying a request field.
- Approval requirements are checked server-side and cannot be satisfied by client-only UI state.
- Audit/evidence records must not expose credentials, access tokens, or unnecessary sensitive payloads.
- Read access to sensitive records and evidence follows approved least-privilege rules.

Open policy: staff role model, approval separation, event catalogue, evidence retention, audit access, and legal-disclosure process.

## 5. Cross-lifecycle transition invariants

Before implementation, every transition must specify the initiating actor, preconditions, resulting business state, side effects, audit requirements, idempotency/retry behaviour, and failure response.

| Invariant | Required design behaviour |
|---|---|
| Booking vs intake | Confirmed booking does not assert receipt or custody. |
| Quote vs settlement | Accepted quote is commercial context; it is not proof of payment. |
| Payment vs operations | Payment events do not automatically assert intake, dispatch, movement, or delivery. |
| Proposal vs physical action | Route proposal/assignment is not evidence of dispatch or handover. |
| Attempt vs completion | Delivery attempt is not delivery completion without required proof. |
| Exception vs normal path | An exception has an explicit policy, authority, reason, audit trail, and resolution. |
| Duplicate processing | Retried requests/provider events do not duplicate non-repeatable side effects. |
| Stale client state | Server rechecks current state and preconditions at mutation time. |
| Historical commercial facts | Accepted quotes, charges, and completed financial events remain reconstructable. |
| Ownership and access | Record IDs alone do not grant access; each request checks caller entitlement. |
| Concurrent updates | Conflicting changes are detected or safely serialized; no silent lost updates for consequential operations. |
| Partial failure | External provider success plus local processing failure is recoverable and observable. |

## 6. API and service contract expectations

This section describes contract categories. It deliberately does not define concrete route names, schemas, or response payloads.

### 6.1 Contract groups to specify

| Contract group | Required responsibility | Contract details still needed |
|---|---|---|
| Catalogue/quote | Read public product/service information and calculate quotes using trusted inputs | Validation, quote context/version, expiry, serviceability, error codes |
| Storefront order | Create/read/cancel an order according to approved lifecycle | Authenticated vs guest entitlement, stock concurrency, cancellation eligibility, idempotency |
| Independent booking | Create/read/change/cancel a shipment booking under approved policy | Eligibility, identity relationships, quote acceptance, reference/receipt, lifecycle guards |
| Intake/custody | Record physical receipt, measurements, refusal/hold, and handover events | Actor/location scope, required evidence, duplicate prevention, adjustment trigger |
| Pricing adjustment | Propose/review an adjustment and preserve accepted quote | Thresholds, approval, customer decision, link to financial event |
| Payment | Initialize and verify provider operations; receive authenticated provider events | Provider signature, amount/currency/purpose/reference checks, idempotency, late/duplicate events |
| Financial operation | Record additional charge, refund, credit, reversal, or reconciliation outcome | Initiation/approval rights, provider operation, evidence, reconciliation, distinct result states |
| Routing/assignment | Create/review proposals and approve/change route-leg assignments | Operations authority, conflict handling, capacity/eligibility checks, immutable history |
| Dispatch/movement | Record authorized dispatch, handover, and movement milestones | Payment gate, exception approval, source/evidence, transition preconditions |
| Delivery | Record attempts, proof, disputes, and approved resolution | Proof method, evidence access, identity checks, failure outcomes |
| Admin/operations | Manage authorized operational records | Role/scope checks, high-impact confirmations, audit and denial behaviour |
| Customer access/tracking | Read only records the principal is entitled to access | Ownership/guest-token checks, redaction, rate limiting, revocation/recovery policy |
| Notification | Send messages from approved verified events | Recipient rules, minimal payload, retry/deduplication, secret handling |
| Audit/disclosure | Record and review consequential actions and controlled disclosures | Audit event catalogue, evidence references, retention, access, approval chain |

### 6.2 Required request validation

Every mutating contract should define, where relevant:
- authenticated principal and explicit business relationship to the target;
- schema/shape validation, size limits, allowed values, and normalization;
- trusted prices, stock, fees, payment amount/currency, and provider references;
- record ownership, location/service scope, and permission to perform the action;
- current lifecycle state and transition preconditions;
- expected version/conditional update behaviour for concurrency-sensitive operations;
- idempotency/deduplication strategy for retried client requests and provider events;
- required reason, approval, and evidence for exceptional/consequential actions;
- rejection behaviour for unsupported, stale, duplicate, conflicting, or incomplete requests.

Do not expose secrets, private credentials, raw provider signatures, privileged internal details, or another user's personal data in responses or logs.

### 6.3 Response and failure contract

For each contract, specify:
- success result and stable business reference;
- validation failure;
- unauthenticated and unauthorized outcomes;
- missing or inaccessible record behaviour that does not leak sensitive existence information;
- lifecycle conflict or stale-state outcome;
- duplicate/idempotent replay behaviour;
- external-provider failure, timeout, and unknown outcome;
- retryability and safe retry instructions;
- audit/observability correlation without exposing secrets.

Exact HTTP status codes and payload shapes must be aligned with existing Next.js route conventions after source inspection; this document does not invent them.

## 7. Security and authorization boundaries

### 7.1 Baseline controls

- Authenticate with the existing supported authentication mechanisms.
- Authorize every privileged server operation using trusted server-side identity and approved permissions.
- Do not treat a verified email, signed-in state, customer profile, record ID, client-supplied role, or hidden UI control as sufficient Admin/Operations/Finance authorization.
- Validate record ownership or explicitly granted access for customer order, booking, shipment, tracking, and evidence reads.
- Use least privilege for staff and external integrations; grant only the minimum action and data scope required.
- Verify payment-provider messages using the configured provider contract and validate expected business purpose, reference, amount, and currency.
- Protect credentials, API secrets, guest access tokens, and signing secrets; never put them in client-visible bundles, URLs, or logs.
- Rate-limit or otherwise protect sensitive public endpoints and recovery/disclosure flows where appropriate to the threat model.
- Validate upload type/size and authorization on the server; Cloudinary selection does not itself prove the upload path is correctly secured or working.
- Record consequential actions and approval decisions without storing unnecessary sensitive payloads.
- Define evidence visibility, retention, redaction, deletion/legal-hold, and access-review rules.
- Keep error messages useful but avoid leaking credentials, internal implementation details, or private record contents.
- Verify security behaviour with direct URL/API tests, not only visual navigation.

### 7.2 Authorization matrix — conceptual, subject to owner approval

| Action | Public/customer principal | Authorized Admin/Operations | Finance function | External provider/partner |
|---|---|---|---|---|
| Browse public catalogue | Public reads only | According to operational needs | No implied access | No implied access |
| Read own order/booking/tracking | Only with verified ownership/entitlement | Only within approved job scope | Only where approved financial duty requires it | No implied access |
| Create independent booking | Only if guest/account policy permits | Staff-created walk-in booking only if approved | No implied authority | No implied authority |
| Record physical intake/custody | No, unless explicit approved role/capability | Only if assigned and location/service scope permits | No implied authority | No direct platform access assumed at launch |
| Propose/approve route assignment | No | Operations authority as approved | No implied authority | No direct platform access assumed at launch |
| Authorize unpaid dispatch | No | Only designated approver(s) under approved policy | No automatic authority unless explicitly decided | No implied authority |
| Initiate/approve financial adjustment | Customer may request/accept according to policy, not self-approve internal action | Only approved scope | Only approved scope; separation of duties unresolved | Provider executes only its external transaction role |
| Mark delivery/proof | Customer may acknowledge/contest if approved | Only authorized operational actor or validated source | No implied authority | No direct platform access assumed at launch |
| Read/modify audit/evidence | Only explicitly entitled subset | Only approved job scope | Only approved finance scope | No implied access |
| Approve disclosure to authority | No | Only designated internal reviewer | No implied authority | No implied authority |

This table is not an approved role matrix. It highlights that no role's authority can be inferred solely from its label. The actor-model owner decisions and additional workflow policy decisions remain dependencies. DEC-025 resolves the high-level location-capability direction, but exact staff assignment, partner access, action-level verification, payment evidence, and approval rules remain open.

### 7.3 Security risks requiring explicit verification

- Normal customer can navigate directly to an Admin route or invoke Admin APIs without authorization.
- Authorization differs between UI guards and server-side endpoints.
- A request trusts a client-supplied UID, role, price, stock value, payment status, or target ownership.
- A guest access token is exposed, stored insecurely, not scoped, or not revocable according to policy.
- Duplicate/forged payment callbacks or retries apply side effects more than once.
- Staff or partner access crosses location, shipment, or financial scope.
- Upload endpoints accept unauthorized, oversized, or disallowed content.
- Logs or notifications leak secrets, access tokens, private tracking data, or financial details.
- Concurrent cancellation, payment verification, stock release, intake adjustment, or dispatch requests cause inconsistent results.
- Audit/evidence records can be altered or accessed by actors who should not have that capability.

These are design and verification concerns, not assertions that each vulnerability currently exists. Existing reported concerns remain tracked in the issue register until verified.

## 8. Idempotency, concurrency, and integration recovery

Before implementation, identify operations that may be retried by browsers, users, provider webhooks, schedulers, or staff. For each, specify the idempotency key or deduplication identity, scope, retention period, and expected replay response.

At minimum, evaluate:
- order creation and stock reservation;
- cancellation and stock release;
- payment initialization and provider event processing;
- additional payment/refund/credit operations;
- quote adjustment approval and settlement;
- intake/custody event recording;
- route assignment changes and handover milestones;
- dispatch and delivery outcome recording;
- notification send attempts;
- audit/disclosure decisions.

For external operations, document the distinction between failed, succeeded, and unknown/unconfirmed outcomes. If the provider succeeds but the local write fails—or vice versa—the system needs a defined reconciliation/recovery path, not an assumed rollback. Do not invent automatic compensation behaviour until business policy and technical capabilities are known.

## 9. Source-validation plan before technical design approval

Read-only source inspection should answer these questions before proposing collections, fields, routes, or services:

1. What current records/types already represent products, orders, order items, payments, shipment tracking, shipping data, user profiles, and audit events?
2. Which current route handlers and shared helpers create/update those records, and where are server-side authorization checks applied?
3. What payment-provider verification, signature validation, amount/currency checks, and idempotency protections already exist?
4. What transaction/batch patterns currently protect stock, cancellation, payment verification, and other concurrent changes?
5. How is guest order access currently represented, verified, and stored? What is the unresolved guest-order claiming requirement?
6. Which shipping status fields and tracking routes currently exist, and how do they differ from the proposed independent-shipment lifecycle?
7. Which admin auth helpers and route guards exist, and are all Admin APIs protected consistently?
8. What Cloudinary upload configuration, authorization, validation, and error handling currently exist?
9. What shared validation, logging, notification, and audit helpers can be reused?
10. What current Firestore rules and Admin SDK boundaries apply, and which operations bypass client rules by design?
11. Which tests exist for direct route access, unauthorized APIs, duplicate/late payment events, concurrency, and failure recovery?
12. What compatibility constraints arise from existing data and live users?

Record source paths and dated test evidence in the audit/issue tracker. A code path's existence is not proof that it behaves correctly. Do not modify application code as part of this source-validation step.

## 10. Acceptance criteria for this design workstream

Before implementation planning can rely on this document:

- [ ] Owner decisions affecting identities, staff roles, pricing, payment, PUDO capabilities, dispatch, delivery, finance, and disclosure are recorded or explicitly left blocked.
- [ ] Conceptual objects and relationships are reviewed, including the boundary between storefront order, independent booking, shipment, route leg, movement, payment attempt, and financial event.
- [ ] Every launch-essential lifecycle has allowed transitions, preconditions, responsible actors, exception outcomes, and audit/evidence requirements.
- [ ] Each mutating API/service contract has authorization, validation, concurrency, idempotency, failure, and observability expectations.
- [ ] A permission matrix is approved without assuming a separate portal for every function.
- [ ] Existing source is inspected read-only and current implementations are mapped to the conceptual design.
- [ ] Known security and runtime verification issues remain open until evidence supports closure.
- [ ] Launch-essential scenarios have testable acceptance criteria, including unauthorized access, duplicate/late events, partial failure, and conflicting transitions.
- [ ] No new Firestore collections/fields, route names, status enums, services, or portals are treated as settled implementation choices without review.
- [ ] The SDD continuity documents agree on baseline, current workstream, blockers, and next steps.

## 11. Dependencies and unresolved owner questions

This draft does not resolve:
1. The nine role/actor decisions in PLATFORM_ACTORS_AND_RESPONSIBILITIES.md.
2. Booking eligibility, guest booking, identity verification, and sender/receiver/payer/booking-party authority.
3. Booking-to-shipment creation/linkage and storefront order-to-delivery representation.
4. Allowed lifecycle transitions, cancellation/expiry rules, return/redelivery outcomes, and state ownership.
5. Pricing formulas, quote validity, discrepancy thresholds, adjustment approvals, and settlement methods.
6. Payment-at-intake methods, late/duplicate/contradictory events, refunds/credits, reconciliation, and separation of duties.
7. PUDO location capabilities and partner/staff permissions.
8. Route assignment authority, physical movement evidence, proof of delivery, and failed-delivery resolution.
9. Dispatch exception authority and any required second-person approval.
10. Audit event catalogue, evidence retention, legal disclosure, notification recipients/channels, and access policy.
11. Technical contract choices that depend on read-only source inspection and existing architecture.

**Next step:** review this conceptual model and contract checklist. Once accepted and owner decisions are recorded, inspect the existing source read-only and map each conceptual responsibility to the current implementation before proposing minimal compatible technical changes. Application-code implementation remains blocked until the platform-wide SDD is reviewed and approved.

## Measurement discrepancy and adjustment contract — DEC-027

Conceptual contract: retain the original quote and its accepted inputs/rate context; separately record actual intake measurements and their actor, location, time, and required evidence; and link any proposed adjustment to the original quote. The measurement record, proposal, approval decision, payment, additional charge, credit, and refund are distinct facts and must not be collapsed into one status.

Material discrepancies and adjustments affecting an existing payment must follow the configured review/authority policy. Routine-versus-material thresholds must be service-appropriate and configurable; exact units, values, approval limits, customer consent/notification rules, and refusal/dispute outcomes remain unresolved. A proposal or unresolved dispute is not authorization to mutate the accepted quote or represent a financial event as settled. No schema, API, or implementation details are approved here.
