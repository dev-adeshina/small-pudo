# VeriLyft Domain Relationships, Lifecycle Boundaries, and API/Security Contracts

**Document status:** Draft lifecycle/contract specification — accepted owner policies incorporated; detailed contracts and full SDD approval remain open  
**Last updated:** 30 October 2026  
**Scope:** Conceptual domain boundaries, lifecycle transition rules, service/API contract expectations, and authorization/security invariants  
**Related documents:** SPEC.md, DECISIONS.md, ISSUES.md, PLATFORM_ACTORS_AND_RESPONSIBILITIES.md, PLATFORM_SHARED_WORKFLOWS.md, SDD_COMPLETENESS_AUDIT.md  
**Related decisions:** DEC-018, DEC-019, DEC-020, DEC-021, DEC-022–DEC-039

## 1. Purpose and guardrails

This document follows the actor/responsibility and shared-workflow drafts. It translates those concepts into a preliminary domain model and contract checklist without prescribing implementation details that depend on unresolved policy or source inspection.

Owner-policy outcomes under DEC-022–DEC-036, PM-01–PM-12, and BP-01–BP-22 are accepted at the levels recorded in their authoritative decision documents. The lifecycle relationships, transition tables, detailed operational parameters, and API/security contracts in this document remain draft specification work. It is not a Firestore schema, API specification ready for coding, migration plan, or authorization implementation. It does not define collection names, document fields, status enum values, route paths, request/response JSON, indexes, token formats, or deployment boundaries. Existing source and data must be inspected read-only before any technical proposal is approved.

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

### 3.2 Relationships requiring further specification

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

### 4.1 Booking lifecycle — DEC-023, DEC-024, DEC-038

Accepted conceptual progression:
- A registered, authenticated customer starts an independent shipment booking; guest shipment booking is not available at launch.
- Booking party, sender, receiver/collection recipient, payer, and expected physical handover person are distinct relationships where relevant. A person may occupy multiple roles; do not infer they are the same.
- A customer may prepare booking information and receive a quotation before making a commercial commitment.
- The booking captures origin, destination, selected available service, parcel description, and only the additional measurements/supporting information required by that service for eligibility or pricing. A customer acting for a business identifies the business and their relationship; a separate business-account architecture is not assumed.
- The service-specific quotation preserves inputs, itemized charges, total, currency, pricing-rule/rate version, effective context, and its validity.
- The service's handover period/deadline is separate from quote validity, communicated before quote acceptance, and included in booking confirmation.
- Explicit acceptance of a valid quotation by the authenticated booking party confirms the independent shipment booking and accepted commercial terms. Quote issuance, rejection, or abandonment before acceptance does not confirm a booking.
- A confirmed booking may be awaiting payment where payment at intake is allowed, or may have verified advance payment. Payment is a separate financial event and is not implied by booking confirmation.
- A confirmed booking remains planned until an authorized actor records actual physical receipt. Intake/custody is separate from booking and payment.
- Before intake, permitted changes/cancellation may be initiated by the authenticated booking party under BP-01–BP-03. Price/service changes require a revised quote and explicit acceptance; other party/collection changes follow the relevant verification/consent/review policy. After intake, changes and cancellation are controlled and staff-mediated.
- A confirmed booking not handed over by its communicated service deadline may be closed as unfulfilled under the approved service policy. Booking/payment/audit history is preserved and financial resolution is separate.
- Intake either links to an existing confirmed booking or follows the approved staff-created walk-in path. Staff-assisted customer booking must not represent staff as the customer or accept a quote without an explicitly approved authorization process.

Required guards:
- Quote issuance alone never confirms a booking; valid explicit acceptance by the authenticated booking party does.
- Confirmation preserves accepted commercial terms and the communicated handover deadline.
- Expiry of an unaccepted quote requires a fresh quote. Expiry of an already accepted quote does not silently cancel or rewrite the confirmed booking or accepted terms.
- Quote acceptance/booking confirmation, payment verification, physical intake/custody, and logistics fulfilment remain independently observable facts.
- Booking confirmation or payment must not be represented as physical receipt/custody.
- Booking-party, sender, receiver, payer, and handover-person relationships do not imply unapproved access, edit, cancellation, or collection authority.
- Cancellation, missed handover, refused/held intake, refunds, credits, and other financial outcomes remain separate and preserve history.
- Duplicate/replayed acceptance, payment, cancellation, and other consequential events must not create duplicate records or financial side effects.
- Business representation, service-specific information requirements, and identity verification follow approved service and authority policy; do not invent fields, providers, or universal requirements.

Open specification: service-specific handover durations/configuration; quote validity and pricing rules; service eligibility/capacity; business identity/relationship representation; contact/identity/consent methods; payment-at-intake evidence and partial/late-payment outcomes; booking reference/receipt format; operational status vocabulary; missed-handover and refused-intake customer/financial resolution; exact lifecycle/API/data contracts; and detailed acceptance tests. BP-01–BP-22 continues to govern party authority, transfers, delegation, disputes, and exceptions.

### 4.2 Quote and adjustment lifecycle

Conceptual progression:
- Validate only the pricing inputs explicitly configured for the selected service. The trusted server, not the customer/browser, determines the authoritative final price.
- Apply that service's approved fixed, calculated, or hybrid pricing model. Calculated/hybrid components use only approved applicable inputs, potentially including origin, destination, distance/approved distance band, weight, dimensions, volumetric weight, service class/delivery speed, minimum charge, and documented special handling.
- Reuse the shared approved pricing rule set across storefront delivery and independent shipment booking wherever their inputs overlap.
- Create a quote with preserved inputs, itemized charges, total, currency, pricing-rule/rate version, effective context, and service-configured validity.
- Recognize draft, issued, accepted, rejected, expired, superseded, and cancelled quote outcomes. Issued means presented to the customer; acceptance is explicit.
- An unaccepted quote that expires requires a fresh quote before proceeding. Expiry of an already accepted quote does not silently cancel or rewrite the confirmed booking or its accepted terms. The separate service-specific handover deadline governs the period for physical handover.
- A customer acceptance of a valid issued quote by the authenticated booking party creates the accepted commercial agreement and confirms the independent shipment booking under DEC-038; it does not prove payment or physical intake.
- Recalculation or repricing creates a new quote/revision and preserves prior issued/accepted quote history.
- Later measurement or another permitted change may create a proposed adjustment linked to the original quote and accepted agreement.
- Required review and customer consent occur before a price-changing adjustment becomes binding or an additional charge is collected.
- Any resulting charge, additional payment, credit, refund, reversal, or reconciliation outcome is processed and verified as a separate financial event.

Required guards:
- A service cannot use an unapproved model, input, formula, or ad hoc charge. Customer/browser values are inputs only; trusted server-side validation and calculation apply the approved service configuration. Staff-assisted quotes use the same rule authority. Applicable charge components and total must be transparent; taxes, surcharges, discounts, and other fees must be explicitly specified rather than silently assumed zero or added.
- Current rate changes cannot rewrite a previously issued/accepted quote or completed payment.
- Quote, accepted commercial agreement, booking, payment, intake, and custody remain separate facts.
- Adjustment proposals identify changed facts and reason and link to the original quote; they do not overwrite it or constitute settlement.
- A disputed additional charge remains held pending review; a rejected adjustment follows the service-resolution policy and does not automatically imply a refund, credit, or cancellation.

Open policy: exact formulas/rates and service mapping, input sources, units and conversion rules, distance sources/bands, rounding, effective dates, tax/fee/discount treatment, minimums, service-specific input configuration, quote-validity durations, required measurements, numeric discrepancy thresholds, approval limits/separation of duties, and detailed consequences if the customer rejects an adjustment. DEC-039 resolves the pricing input, server-authority, and charge-transparency boundaries but supplies no numeric rates or formulas. DEC-038 resolves the booking-confirmation point and accepted-quote expiry policy.

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

**Accepted dispatch-exception policy (DEC-030):** Verified payment remains the default prerequisite. Only explicitly defined operational circumstances may qualify for a narrow exception under an approved policy; no generic convenience override or unrestricted staff discretion is permitted. Only staff with explicitly assigned dispatch-exception permission may approve, the requester must not automatically approve their own request, and material exceptions require a second approver. An exception never changes payment status and cannot bypass unrelated safety, custody, identity, legal, or other operational holds. Preserve the parcel/shipment, reason, requester, approver(s), timestamp, supporting evidence, and decision/outcome.

Open policy: eligible circumstances; exact staff responsibility/permission assignment; which cases are material and require second approval; monetary/operational limits; category-specific evidence; whether approval may be revoked before dispatch; and detailed denial/rejected-transition tests.

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
5. How is guest order access currently represented, verified, and stored, and what source/runtime work is required to implement accepted DEC-035 recovery and optional claiming?
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

- [x] High-level owner decisions affecting identities, staff roles, pricing, payment, PUDO capabilities, dispatch, delivery, finance, notifications, guest recovery, audit/disclosure, and launch priorities are recorded in DEC-022–DEC-036.
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
1. Exact staff permission assignments, action-level authority, partner access, and second-person approval cases under DEC-022/DEC-025.
2. Booking-to-shipment creation/linkage, parcel cardinality, business accounts, consent, and change authority under DEC-023/DEC-024.
3. Allowed lifecycle transitions, cancellation/expiry rules, return/redelivery outcomes, and state ownership.
4. Pricing formulas, units, quote expiry, discrepancy thresholds, adjustment consent/approval, and settlement methods under DEC-026/DEC-027.
5. Payment-at-intake configuration, transaction/cash limits, refund/credit execution, late-payment disposition, reconciliation, and separation of duties under DEC-028/DEC-029.
6. Location capability assignment, partner access, physical intake/custody evidence, and collection verification under DEC-025/DEC-028.
7. Route constraints, assignment authority, movement milestones/evidence, delivery proof by service, and failed-delivery resolution under DEC-030–DEC-032.
8. Notification event/channel/recipient/field matrix, preferences/consent, retries/deduplication, and failure ownership under DEC-034.
9. Guest recovery challenge/token mechanics, eligibility, support exceptions, and detailed acceptance tests under DEC-035.
10. Audit event catalogue, retention schedule, reviewer access, legal-hold/disclosure procedure, and evidence integrity under DEC-033.
11. Requirement-level P0/P1/deferred mapping, test/evidence scenarios, production environment, operational ownership, and release sign-off under DEC-036.
12. Technical contract choices that depend on read-only source inspection and existing architecture.

**Next step:** reconcile this conceptual model with accepted decisions, inspect existing source read-only, map each requirement to implementation evidence or a documented gap, and define testable acceptance scenarios. Application-code implementation remains blocked until the complete platform-wide SDD is reviewed and explicitly approved.

## Measurement discrepancy and adjustment contract — DEC-027

Conceptual contract: preserve customer/booking-party-declared measurements separately from actual intake measurements. Each service defines the measurements it requires and the unit for each; examples such as kg and cm are not universal unit decisions. Do not silently overwrite, convert, or reinterpret a recorded value. Actual measurement records identify the responsible actor, location, timestamp, and applicable evidence/reason.

Link any proposed adjustment to the original quote and accepted agreement, retaining the changed facts, reason, and review history. The measurement record, proposal, approval decision, customer acceptance/dispute/refusal, payment, additional charge, credit, and refund are distinct facts. Material discrepancies and adjustments affecting an existing payment follow the configured review/authority policy; thresholds are configurable and service-appropriate, but no numeric values are approved. Notify the customer of a price-changing adjustment and its revised amount; explicit acceptance is required before collecting an additional charge. A disputed additional charge remains held pending review. Rejection follows the applicable service-resolution policy and does not itself execute a financial transaction. Exact units, conversion rules, numeric thresholds, evidence detail, approval limits, and rejection-resolution procedures remain open. No schema, API, or implementation details are approved here.

## Payment-at-intake contract — DEC-028

Conceptual contract: a location can accept only explicitly enabled payment methods. A payment record distinguishes the method and retains amount, currency, applicable transaction reference/receipt, responsible staff actor, location, and timestamp. Electronic settlement requires authoritative provider, bank, or approved reconciliation evidence; screenshots, verbal claims, and unsupported staff notes are not proof. Cash requires an attributable receipt or equivalent record and reconciliation.

Payment recording does not prove physical custody. Booking, payment, and custody are independent facts with separate evidence. Failed, reversed, refunded, disputed, and corrected payment outcomes retain traceable history; corrections must not silently erase or overwrite prior financial events. Exact providers/methods, limits, cash procedures, second-person controls, method-specific evidence, and technical representation remain unresolved. No schema, API, or implementation details are approved here.


## Financial event and settlement boundaries — DEC-029

Financial history must distinguish the original payment, later additional payments, refund requests, executed refunds, customer credits, reversals, chargebacks, and reconciliation outcomes. Preserve the original event and append attributable subsequent outcomes rather than rewriting history. Cancellation, payment, refund, credit, and operational shipment/order lifecycles are separate conceptual responsibilities. A late payment after cancellation/expiry is reconciled to its original transaction and cannot silently reactivate the cancelled booking/order/shipment. Duplicate or replayed provider events must be idempotent with respect to financial effects. Reconciliation against authoritative provider/bank records is an investigation/control process; mismatches are not silently treated as settled.

Quote and adjustment outcomes remain distinct from financial settlement: a rejected quote creates no payment obligation from that quote; an accepted adjustment records the revised commercial agreement and any additional amount due; a disputed additional charge remains held pending review; overpayments and underpayments require an authorized, attributable resolution; and failed payments remain failed attempts rather than successful settlement. A refund request is not an executed refund, and a credit is not a cash refund. Rejection of an adjustment follows the applicable service-resolution policy and does not automatically create a refund, credit, cancellation, or charge. Detailed approval limits, timelines, credit rules, reconciliation ownership, and exception procedures remain open. These are business boundaries, not a proposed schema or ledger implementation.

## Dispatch exception control — DEC-030

The default payment gate remains in force. A narrowly defined exception does not establish payment success and does not release unrelated operational holds. The requester cannot automatically approve their own exception; material cases require a second approver. Exact eligibility, permission assignment, materiality, limits, evidence categories, and revocation remain owner-policy details. No schema, endpoint, or implementation is approved.


## Routing and movement control — DEC-031

Route proposal, approval, route-leg assignment, dispatch, physical handover, and arrival confirmation are distinct lifecycle concepts/events. Neither a proposal nor an assignment proves physical movement. Operations manages launch-time proposals and assignments; any approval, alteration, revocation, or reassignment requires explicitly assigned staff authority and preserves prior decisions, actor, and reason. Physical movement milestones must be attributable to the shipment/parcel and route leg and identify event type, location, physical actor where known, recording actor, timestamp, and applicable evidence. If staff enter an event on behalf of a provider/driver, the physical actor and recorder remain distinguishable. Delays, missed handovers, missing parcels, damage, and disputed custody transfers are explicit exceptions for investigation/resolution. Driver Portal remains deferred. Exact route constraints, permissions, two-person approval, milestone/evidence catalogue, capacity/provider rules, correction authority, and exception resolution remain unresolved. This is a business-policy boundary, not a schema or implementation approval.


## Delivery outcome and proof boundaries — DEC-032

A delivery attempt, successful delivery, failed delivery, customer collection, and return are distinct lifecycle outcomes. A failed attempt does not complete delivery. Successful delivery requires approved evidence appropriate to the service/context; a staff status change alone is not proof. The recipient must be authorized under the party and collection-entitlement rules in DEC-024; sender, payer, booking customer, and receiver are not interchangeable by default. Evidence methods may vary by service; recipient confirmation, OTP, signed acknowledgement, and attributable staff evidence are examples, not universally mandated methods. Failed attempts retain their reason and history. Reattempt, return, holding, refusal, cancellation, and financial adjustment require an explicitly authorized resolution procedure and are not automatic consequences. Significant outcome notifications must respect each party's authorized information access. Preserve original evidence and event history for disputes. Mandatory methods, OTP policy, attempt limits, authority, holding duration, failure catalogue, loss/damage/refusal/dispute handling, and detailed technical representation remain unresolved. This is a business-policy boundary, not schema or implementation approval.


## Audit and evidence lifecycle boundaries — DEC-033

Consequential actions across platform domains require attributable records identifying actor, action, affected resource, timestamp, applicable reason, and relevant evidence. Physical actor and staff recorder must remain distinguishable. An audit record or status change is not independent proof of physical custody, movement, or delivery. Preserve original consequential records/evidence; corrections and redactions are separately authorized, attributable, and traceable, not silent overwrites. Retention, deletion/anonymization, and legal holds must follow category-appropriate, purpose-based rules; exact periods and authority remain unresolved. Audit/evidence access is restricted to explicitly authorized reviewers and sensitive access/disclosure is itself auditable. Government requests require a recorded authority, request/legal basis, scope, authorized review, and disclosure record; they do not confer unrestricted platform access. Exact event catalogue, evidence requirements/integrity, access matrix, two-person approvals, retention schedule, deletion/legal-hold procedures, disclosure workflow, and technical representation remain unresolved. This is a business-policy boundary, not schema or implementation approval.


## Notification lifecycle and access boundaries — DEC-034

A notification is a derived communication about a verified business event, not an authoritative business event itself. Its queued, attempted, provider-accepted, delivered, read, retried, or failed outcome must not mutate or independently establish order, payment, shipment, dispatch, custody, or delivery state. Notification records/attempts should remain attributable and distinguish provider acceptance from confirmed recipient delivery or reading.

Recipient eligibility is evaluated for each event using the explicit party relationship and access entitlement in DEC-024 and DEC-032. Booking customer, sender, receiver/collection recipient, and payer are not interchangeable. The payer's default notification entitlement is relevant payment confirmation/receipt, refund, and financial outcome information, not full shipment details. Message content is minimized to the recipient's purpose and entitlement; links to further detail must preserve authenticated access controls.

Email is the primary customer channel where configured; SMS is optional and requires explicit configuration and applicable consent/contact verification; in-platform notifications may serve authenticated users. Channel selection is event-specific, not an assumption that every event is broadcast through every channel. Telegram remains deferred. Any future paid-order Telegram delivery notification must follow the authorized Admin **Assign For Delivery** approval action, which is a necessary gate but not proof of physical movement or delivery, and must also have a separately approved purpose, audience, and disclosure policy.

Deduplicate by the same underlying business event, intended recipient, and channel; apply bounded retries to transient failures; retain attributable attempt/outcome information; and expose persistent failures for operational follow-up. A failed notification does not reverse or block the underlying business event, and no fallback channel is silently assumed. Exact event/channel contracts, message fields, consent, retry and deduplication semantics, retention, failure ownership, and technical representation remain unresolved. This is a business-policy boundary, not schema or implementation approval.


## Guest-order recovery and optional account claiming — DEC-035

Guest storefront checkout remains supported. A guest-order recovery request is separate from account claiming: recovery restores access to an existing guest order after proof of control of the original checkout email using a challenge delivered to that address. The order reference and email address alone do not grant access. A replacement order-access credential is issued only after successful verification, under an expiry/revocation policy, and prior credentials are invalidated or rotated.

Account claiming is optional and requires a signed-in customer plus a separate ownership challenge tied to the original checkout email. The server verifies the authenticated account, target order entitlement, and unclaimed status before associating the order with that account. Email match, order reference, unrelated browser session, or payment alone is not proof. One order cannot be claimed by multiple accounts or silently transferred. Support-assisted recovery or exceptional transfer requires a separately approved process and auditable authority.

Challenges must expire, resist replay/abuse, and return failure responses that do not reveal whether an order exists. Recovery credentials must not leak through logs or ordinary notification content. Recovery and claiming cannot change payment, cancellation, fulfilment, shipment, or delivery state. Exact challenge format/lifetime, rate limits, eligibility after fulfilment/delivery, account deletion consequences, transfer/support procedure, token storage/rotation mechanics, retention, and detailed tests remain open. This accepted business policy does not authorize a schema, route, token format, provider integration, or application-code change.


## Launch readiness and evidence contract — DEC-036

The release baseline distinguishes P0 launch blockers, P1 important follow-up work, and explicitly deferred capabilities. P0 must cover the owner-approved lean launch scope in DEC-018 and all reconciled essential requirements. P1 is appropriate only when deferral does not compromise essential workflows, safety, security, financial integrity, legal obligations, or approved service scope. Advanced route optimization, full fleet management, Driver Portal, enterprise workflow engine, and advanced analytics remain deferred under DEC-018 unless the owner explicitly changes that scope.

For each P0 requirement, retain evidence appropriate to its risk: functional end-to-end success and failure paths; security, privacy, and server-side authorization; authoritative payment verification, financial replay/idempotency and reconciliation where applicable; attributable operational actions and physical custody/movement/delivery evidence where applicable; and production configuration, deployment, monitoring, backup/restore, incident response, and rollback where applicable. Distinguish designed, implemented, tested, verified in a production-like environment, and owner-accepted for launch. Record evidence date, environment, scope, and linked acceptance criterion. Source presence, page rendering, schema presence, and passing type/build checks alone do not prove readiness.

Unverified P0 requirements and material security, financial, operational-control, or critical production/recovery gaps block release absent resolution or separately approved lawful exception. Requirement-level priority mapping, evidence artifacts/scenarios, production-like environment, blocker ownership/exception authority, runbooks, backup/restore proof, monitoring thresholds, incident ownership, and final sign-off remain unresolved. This is a governance contract, not a certification of current readiness or an implementation approval.

## Booking-party authority and lifecycle contract — DEC-023 / DEC-024

The owner has accepted BP-01–BP-22 in `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`. These are policy constraints for the conceptual booking and authorization lifecycles, not a schema or API specification.

### Required conceptual guards

1. Booking changes and cancellation before physical intake may be initiated by the authenticated booking party only within the accepted BP policy; sender/receiver/payer association alone grants no direct edit/cancel authority.
2. Price/service changes require a revised quote and customer acceptance. Sender/receiver/collection changes require the appropriate verification/consent and applicable staff review.
3. Sender/receiver requests received by Support are requests, not authorized mutations. The booking party authorizes them unless a documented, approved exception applies.
4. Post-intake amendments are staff-mediated. Booking-party transfer after intake or dispatch requires designated Admin review.
5. Cancellation, transfer, withdrawal, deletion/anonymisation, and refund are distinct operations. None silently erases booking, financial, custody, or audit history.
6. Collection authorization is independently verified. A parcel is held from release while collection authority is disputed; booking-party status or payer status is not proof of collection entitlement.
7. Transfer preserves the booking's financial history and obligations. A new booking party accepts personal financial responsibility only through explicit acceptance; original liability attribution remains reconstructable.
8. Delegated access is explicit, limited, time-bounded, revocable, and non-transferable. Delegation does not confer ownership or unlisted operational actions.
9. Suspected account compromise may trigger protective restrictions, but must not unnecessarily prevent essential physical custody/safety operations.
10. Dispute, appeal, and further-review decisions preserve original records and evidence; corrections are separately attributable amendments.

### Remaining contract questions

The BP policy record leaves verification mechanisms, consent evidence, exact lifecycle gates, financial-responsibility transfer mechanics, delegated action/expiry values, retention/legal-hold interaction, notification fields, dispute severity/targets, reviewer eligibility, and appeal submission/decision procedure to detailed specification. Every mutation contract must still define actor, target, preconditions, authorization, resulting state, side effects, audit/evidence, idempotency/concurrency behaviour, and failure response. No collection, field, endpoint, token format, permission claim, or implementation is approved.


### DEC-040 — Adjustment rejection and service-resolution contract refinement

- A non-material discrepancy that does not meet the service's configured review criteria leaves accepted commercial terms unchanged. Potentially material/payment-impacting discrepancies enter the controlled review path.
- Explicit customer acceptance is required for a price-changing adjustment; silence/non-response is not acceptance. Acceptance records revised commercial terms but does not settle payment. A dispute holds the disputed additional charge pending review.
- Rejection triggers an authorized service-resolution decision. It does not automatically cancel, refund, credit, or charge. Continuing under original terms requires safe and commercially feasible fulfilment; an alternative service requires separately accepted pricing; cancellation follows its applicable policy.
- Dispatch cannot proceed under a rejected revised price and remains subject to verified payment and all other operational holds.
- Service-specific thresholds, evidence, approval authority, service-resolution eligibility, response periods, non-response handling, and technical/acceptance contracts remain open.


### DEC-041 — Payment and financial-event lifecycle refinement

The payment/financial-event lifecycle must preserve these business boundaries:

1. Quote acceptance confirms the booking under DEC-038; it does not create proof of settlement. Advance online payment and payment at intake remain distinct permitted paths, subject to service/location configuration.
2. A payment attempt is not a completed payment. Electronic settlement requires authoritative provider, bank, or approved reconciliation confirmation. Customer screenshots, verbal claims, browser redirects, and unsupported staff notes are insufficient. Cash collection requires attributable receipt/equivalent evidence and reconciliation.
3. Record the amount received and outstanding obligation distinctly. Partial payment is permitted only when the service explicitly allows it and does not, by itself, satisfy the default dispatch payment gate. Underpayments and overpayments require authorized resolution. Additional payments are separate linked events; original payment history is preserved.
4. Pending and failed attempts do not satisfy settlement. Retries, callbacks, webhooks, and reconciliation imports must be idempotent with respect to financial effects. A late success is recorded against its original transaction and reconciled; it does not silently reactivate a cancelled or expired booking/order/shipment.
5. Refund request, approval, initiation, and confirmed execution are distinguishable. Partial refund is a separately authorized outcome linked to the originating payment. Customer credit is distinct from cash refund. Reversals and chargebacks preserve the original event and record their own outcomes.
6. Reconciliation compares internal records with authoritative provider/bank records and includes location cash collections in the applicable process. A mismatch requires investigation and attributable resolution; the original event is not silently rewritten.
7. Consequential financial actions retain actor, timestamp, reason, transaction/reference, and applicable evidence. Payment, refund, cancellation, order/shipment, custody, dispatch, and delivery facts remain distinct.
8. Verified full settlement of the amount currently due is the normal dispatch prerequisite. Partial, pending, failed, or unverified payment does not satisfy it. Any DEC-030 exception is a separate authorization and does not mutate payment status or bypass unrelated holds.

The detailed service/location configuration, partial-payment eligibility, payment-method evidence, financial approval authority, refund/credit rules, late-payment disposition, reconciliation schedule/ownership/tolerances, chargeback process, idempotency/concurrency contracts, and executable acceptance tests remain open. This refinement does not approve a schema, field, endpoint, status vocabulary, permission model, provider integration, or implementation.

## 4.4A Intake and custody policy refinement — DEC-042

The following owner-approved policy refines the conceptual intake and custody lifecycle in section 4.4. It does not define executable status values or technical contracts.

1. Intake starts from an existing confirmed booking or the distinct authorized staff-created walk-in path. Staff-created walk-in intake is not staff-assisted customer booking.
2. Before each consequential physical action, verify that the location is active and explicitly supports the requested service/action, that the parcel and relevant booking/intake are identifiable, and that the handover person's relevant authority is established.
3. Apply only the relevant service-specific inspection, condition, packaging, prohibited-item, identity, measurement, acknowledgement, and evidence requirements. Preserve declared and actual measurements separately using configured service units. Avoid unnecessary photography or personal-data collection.
4. Distinguish refusal before physical custody, accepted custody, and physical receipt retained under a hold for review. If the location has possession while a matter is unresolved, record that custody and the hold; physical possession must not be left ambiguous.
5. A held parcel is not automatically eligible for onward processing or dispatch. Intake/custody does not itself prove payment, cancellation, refund, credit, dispatch, or delivery.
6. Attribute each custody event to the parcel, relevant handover person, receiving actor, location, time, outcome, and applicable evidence/reason. Where an external party performed the event, identify the reported source and do not imply the recording staff member witnessed it.
7. Each staff, location, carrier, or collection-point handover is a distinct physical event. An attempted handover is not completed transfer; preserve prior custody history.
8. An inactive location cannot accept new work. Parcels already in its custody remain accounted for until an authorized resolution or transfer is recorded.

**Location capability guard:** DEC-025 remains authoritative for the lean location record and explicitly configured capabilities. Outgoing intake, measurement, custody acceptance, payment collection/recording, parcel collection/release, and custody handover are distinct actions. Location labels, authentication, or Admin status do not imply capability or action authority. Capability changes are attributable and auditable.

**Cross-domain guards:** Measurement-based price changes follow DEC-040; payment and settlement follow DEC-041. Physical custody, accepted commercial terms, payment, dispatch, and delivery remain independently observable facts.

**Still open:** Service-specific inspection/prohibited-item checklists; measurement units/conversion; identity and acknowledgement methods; receipt format; evidence and retention; actor/partner authority and second-person approval; location capability assignment; hold ownership/review/maximum period; transfer proof/correction authority; missing/damaged parcel and failed/disputed handover resolution; liability/compensation/insurance; exact status vocabulary, technical contracts, and acceptance tests.

## 4.4B Location capability and configuration lifecycle — DEC-043

This section records owner-approved policy boundaries; it is not an executable configuration model or permission matrix.

1. A location is eligible for new operational work only while active and explicitly configured for both the relevant service and the requested action. Location type, name, authentication, or Admin status cannot substitute for explicit configuration.
2. Location capabilities are action-specific. Outgoing parcel intake, staff-created walk-in intake, measurement, custody acceptance, payment collection/recording, parcel collection/release, and custody handover remain distinct. No capability implies another.
3. The system must independently authorize the acting staff member for the specific action and scope. A location capability is not an actor permission; an actor permission does not enable an unsupported location. Both checks are required server-side.
4. Designated Admin users may administer location capabilities only within their assigned authority. Location creation/editing, activation/deactivation, capability administration, and staff permission assignment are distinct administrative responsibilities. Exact assignments and technical enforcement remain open.
5. Capability grants, changes, and revocations are consequential configuration events. Preserve the affected location, change, responsible actor, timestamp, and reason where applicable. Configuration changes must not rewrite historical custody or operational events.
6. Revoking a capability or making a location unavailable blocks new work requiring that capability. It does not erase or abandon parcels already in custody, silently reassign custody, or prove a physical transfer. Existing custody remains visible until authorized resolution or a separately recorded transfer.
7. External partner/collection-centre/carrier/driver physical activity remains distinct from internal platform recording. No direct partner or driver login is implied at launch.
8. DEC-043 does not add automated opening hours, capacity calculation, or availability scheduling to the lean location model.

**Open specification:** Service/location/action eligibility matrix; exact capability catalogue; designated Admin authority and staff permission scopes; partner operational arrangements; queued-work treatment; temporary closure and restoration procedure; configuration audit retention; technical representation, APIs, authorization contracts, failure/replay handling, and test scenarios. These must be reconciled with existing source before technical design approval.



## 4.4C Custody transfer and physical exception policy refinement — DEC-044

This section states owner-approved business invariants. It does not establish an executable state machine, status enum, data schema, API, or authorization contract.

1. **Custody is physical possession.** A recorded custodian must reflect established physical possession. Booking, route assignment, dispatch authorization/record, arrival, or an attempted handover does not independently change custody.
2. **Transfers are distinct events.** Each physical handover between staff, locations, transport providers, or collection/receiving points is separately attributable. Completion requires that the handover actually occurred and the receiving party took possession. Preserve previous custody history.
3. **Transfer context:** Record applicable parcel/shipment, source/previous custodian, intended recipient/destination, actual receiving person/actor, physical handover actor, recording staff member if different, time/location, outcome, evidence/source, and reason.
4. **Failed/disputed/incomplete transfer:** Do not mark an unsuccessful or disputed handover complete. Preserve last confirmed custody and competing reports. If physical possession changed but documentation is incomplete, investigate and record the discrepancy without inventing proof or leaving known possession unaccounted for.
5. **Corrections:** Preserve the original custody event and evidence. Record any correction separately with its actor, time, reason, and supporting basis. Administrative location reassignment is not proof of physical movement.
6. **Missing parcel:** Preserve last confirmed custody, movement/transfer history, discovery context, last confirmed physical location, and available evidence/third-party reports. Do not mark transferred, delivered, or recovered without evidence. Require an authorized reasoned resolution.
7. **Damage:** Record where/when discovered, observer/reporter, circumstances, and condition evidence; retain surrounding custody history. Distinguish observation from a third-party report. Last recorded custody alone does not establish causation or liability.
8. **Incorrect location:** Preserve the original assignment and record actual location when established. Any administrative correction and any physical transfer remain distinguishable and attributable.
9. **Hold:** Identify actual custody, hold reason, and accountable owner. A hold does not authorize normal onward processing or dispatch. No universal hold duration, review interval, or automatic escalation is defined.
10. **Resolution and financial separation:** Preserve evidence/source and investigation findings; record authorized decision, authority, reason, and any separate correction. Do not silently close an unresolved exception. Refund, credit, compensation, insurance, and liability are not automatic consequences and remain subject to their separate policies.

**Open contract questions:** Service-specific proof/verification methods; transfer confirmation/dispute/correction authority; second-person approval; investigation ownership; damage assessment; hold review/maximum duration; financial/customer entitlements; exact lifecycle vocabulary, fields, API/security contracts, evidence retention, and executable acceptance tests. Reconcile these with current source before technical approval. No implementation is authorized by DEC-044.
