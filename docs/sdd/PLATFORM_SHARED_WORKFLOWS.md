# VeriLyft Shared Platform Workflows

**Document status:** Draft for owner review — not approved for implementation  
**Last updated:** 29 October 2026  
**Scope:** Cross-domain business workflows and invariants for storefront fulfilment and independent parcel shipments  
**Related documents:** SPEC.md, DECISIONS.md, ISSUES.md, PLATFORM_ACTORS_AND_RESPONSIBILITIES.md, ADMIN_REQUIREMENTS.md, ADMIN_PORTAL.md  
**Related decisions:** DEC-018, DEC-019, DEC-020, DEC-021, DEC-022, DEC-023

## 1. Purpose, status, and boundaries

This document turns the accepted launch operating model into a first-pass, platform-wide workflow description. It identifies the major participants, sequence, decision gates, records that must remain distinct, exceptions, and open policy questions. It does not assert that these workflows or all related screens/services already exist in the application.

This is a design draft, not implementation authorization. It does not prescribe Firestore collections, field names, API routes, enum values, or a migration. Existing source must be inspected before any future technical proposal.

Use these evidence labels consistently:

- **Accepted constraint:** supported by an accepted decision or owner-confirmed launch requirement.
- **Proposed workflow:** a sequence offered for review; it is not an approved detailed business policy.
- **Open policy:** a value, rule, authority, or outcome that requires an owner decision.
- **Implementation evidence:** facts established from source or dated tests; record them separately in the progress/audit documents.

## 2. Cross-workflow invariants

1. **Storefront order and independent shipment are distinct business concepts.** A storefront purchase may need delivery fulfilment, while an independent shipment can be booked without a storefront purchase. Do not assume one record represents both.
2. **Booking is not physical intake.** A booking or accepted quote does not prove that a parcel has been received, measured, or placed in custody.
3. **Payment is not operational progress.** Payment status, storefront order status, shipment status, and individual transport-movement status must remain distinguishable.
4. **Quote preservation matters.** Retain the accepted quote and the inputs/rates used for it. A later rate change must not silently rewrite an earlier quote or completed payment.
5. **Server-side verification is authoritative.** A browser return/callback or client-submitted status is not proof of payment or permission.
6. **Proposal is not approval.** A route proposal does not itself authorize a route-leg assignment or dispatch.
7. **Physical events need attributable evidence.** Intake, custody handover, dispatch, delivery, and consequential exceptions should identify the responsible actor, time, target, and evidence/reason where applicable.
8. **Exceptional authorization does not falsify the underlying state.** In particular, an approved unpaid-dispatch exception does not make a payment successful.
9. **Shared pricing is a capability, not two unrelated formulas.** Storefront delivery and independent shipment booking use the same approved pricing rule set where the service inputs overlap.
10. **Do not invent an outcome for an unresolved exception.** Failed delivery, measurement discrepancies, late payment events, refunds, returns, and unresolved settlement require explicit policy.
11. **No portal is implied by a workflow.** These workflows may be supported through existing pages or staff-recorded actions. The separate Driver Portal remains deferred at launch.
12. **Least privilege and auditability apply end-to-end.** A person's customer account, booking role, or external-party status does not grant staff or Admin privileges.

## 3. Workflow A — Storefront order and delivery fulfilment

**Purpose:** Purchase a VeriLyft product and, where applicable, fulfil its delivery without conflating the purchase with the parcel movement.

### Proposed sequence

1. The customer browses the public catalogue and selects product quantities.
2. Checkout validates the submitted items and delivery details against trusted server-side product, price, and stock data.
3. The order is created using the existing order-creation design. Stock reservation/decrement and cancellation/release behaviour must follow the approved order policy.
4. If online payment is selected, the server initializes payment with the provider and later verifies the result through the authoritative verification/webhook path.
5. A confirmed payment outcome updates payment records/status according to the payment contract. Browser navigation alone cannot mark payment successful.
6. The order enters the appropriate fulfilment work queue according to the approved operational process. If delivery requires a shipment or transport movement record, its relationship to the storefront order must be explicitly defined; do not treat the order itself as proof of intake or movement.
7. Authorized Operations/Admin staff review delivery readiness, route proposal/assignment, dispatch, and delivery evidence according to the shared workflows below.
8. The customer can access order/tracking information only through the applicable authenticated ownership or guest entitlement mechanism.
9. Cancellation, payment expiry, late payment, and stock release follow explicit transition rules and are protected against duplicate processing.

### Open policy / design questions

- Which storefront order events create or associate a shipment record, and at what point?
- What are the allowed order/payment transitions for cancellation, expiry, duplicate callbacks, and a late successful payment?
- Which delivery methods require physical intake or PUDO custody records, if any?
- What customer notifications are sent at each verified event, through which channel, and with what retry/deduplication policy?
- How are guest orders recovered if the customer loses the access token? Guest-order claiming remains open under VLY-004.

### Acceptance criteria to define

- Client-supplied price, stock, payment status, and customer UID are not trusted.
- Duplicate provider events cannot double-process payment or stock.
- A storefront order is not silently reclassified as an independent shipment.
- Customer and guest tracking access follows verified entitlement.
- Each supported cancellation/late-payment scenario has one defined, testable outcome.

## 4. Workflow B — Independent shipment booking and quote

**Purpose:** Allow a person or business to arrange parcel transport independently of a storefront purchase.

### Proposed sequence

1. A registered customer signs in and begins an independent shipment booking. A public visitor must register and authenticate before booking creation; guest shipment booking is not available at launch.
2. The booking flow collects the origin, destination, service, parcel details, and other inputs required by the approved pricing policy.
3. The shared pricing capability calculates or selects the applicable quote. The quote should preserve its inputs, applied rates/rule version, currency, and validity/acceptance context once those details are defined.
4. The shipper reviews the quote and chooses an allowed payment path. Accepted launch scope includes advance online payment and payment at intake; exact method availability and rules still require definition.
5. The system records booking intent/acceptance and supplies a booking reference or receipt. The exact point at which a quote becomes an accepted booking must be specified.
6. The booking is available to the intake/Operations workflow. It remains a planned booking until physical receipt is recorded.
7. The booking party, sender, receiver/collection recipient, payer, and person physically handing over the parcel may be different people. Record the distinct relationships where they affect access, authority, liability, payment attribution, notifications, intake, or collection.
8. Booking-party status does not itself authorize physical collection, and payer status does not itself authorize full shipment-detail access. Payment confirmation/receipt information is the default payer visibility; broader access requires a separately approved entitlement.
9. Define changes by type and lifecycle stage. The booking party may initiate permitted requests, but receiver/collection changes follow the applicable verification and approval policy. Changes affecting a shipment after intake or dispatch must use the approved controlled, staff-mediated workflow; the detailed change matrix remains open.

### Open policy / design questions

- **Resolved by DEC-023:** only registered, authenticated customers may create independent shipment bookings; guest shipment booking is out of launch scope.
- **Resolved by DEC-024:** booking party, sender, receiver/collection recipient, payer, and handover person may differ; payer visibility defaults to payment confirmation/receipt only; payment does not grant full shipment-detail access; booking does not authorize collection; change permissions must be defined by change type and lifecycle stage.
- Can one customer account act as both storefront customer and shipper? The actor model permits this, but account identity and booking-record relationships must still be verified in the detailed design.
- What registration, contact, or identity verification beyond sign-in is required, and at which booking/intake/collection checkpoints? Do not assume an additional verification method before it is decided.
- Which change types can the booking party complete directly, when is sender/receiver consent required, and which changes require authorized staff? How does this vary before intake, after intake, after dispatch, or after payment?
- What sender, receiver, payer, booking-party, and handover-person information is required, and when must each identity be verified?
- How long is a quote valid, what makes a booking accepted, and when is a reference/label/receipt issued?
- Which payment methods are supported at intake and how are they verified and recorded?
- What happens when the quote is paid online but the parcel is never handed over?

### Acceptance criteria to define

- Only a registered, authenticated customer can create an independent shipment booking; unauthenticated booking-creation requests are denied server-side.
- An authenticated customer can access or amend only bookings they are authorized to access; Customer A cannot read or change Customer B's booking.
- Booking acceptance never claims physical receipt or custody.
- The quote and the applied inputs/rates can be reconstructed for later review.
- Booking-party identity and permissions are sufficient to prevent unauthorized changes; role relationships do not automatically grant full shipment visibility or collection authority.
- A payer who is not otherwise authorized receives payment confirmation/receipt information only by default; payment alone cannot retrieve private shipment details.
- Receiver/collection changes are allowed only through the approved change-type and lifecycle-stage policy, with required verification/consent and controlled handling after intake/dispatch.
- A booking can be distinguished from a storefront order and from later movement records.
- Unpaid, partially settled, cancelled, and abandoned bookings have explicitly defined outcomes.

## 5. Workflow C — Physical intake, measurement, and custody

**Purpose:** Record the actual physical handover of a parcel at a supported staffed location or other approved intake arrangement.

### Proposed sequence

1. Intake begins from an existing booking or an authorized staff-created walk-in intake. Advance booking and walk-in intake are both in the accepted launch scope.
2. Staff identify the booking/parcel and confirm the intake location is configured for the requested service. A registered collection centre must not be assumed to accept outgoing parcels unless that capability is explicitly enabled.
3. The authorized actor records actual receipt and the minimum parcel/condition/measurement information required by the approved intake policy.
4. The system associates the receipt with the correct booking/shipment and records who accepted custody, when, where, and any required evidence.
5. If actual measurements or service details affect the quote, the shared pricing rules calculate a proposed adjustment while preserving the original quote.
6. Where a discrepancy is material or affects an existing payment, the case follows the approved review/approval policy. Do not silently rewrite the quote or mark an unapproved adjustment settled.
7. Intake is either accepted, held for review, or rejected according to outcomes that the owner must define. Do not treat these as approved status values until the transition model is accepted.
8. If payment at intake is allowed, record the financial event using the approved payment method and verification process; do not infer successful payment merely because a staff member records a note.

### Open policy / design questions

- Which location types can accept outgoing parcels, collect parcels, measure parcels, hold custody, or perform handover?
- What is the required intake checklist: dimensions/weight, packaging/condition, prohibited-item checks, photos, sender identity, and acceptance acknowledgement?
- What units, tolerances, and remeasurement rules apply?
- What threshold makes a discrepancy material, and who can approve the resulting adjustment?
- Can a parcel be refused, held, corrected, or returned at intake, and what is the documented process for each?
- What evidence and retention rules apply to custody changes and disputes?

### Acceptance criteria to define

- Booking and intake are separately represented and observable.
- Intake can be linked to a booking or created through the approved walk-in path.
- Only authorized actors can record custody events for locations/services within their scope.
- Quote changes retain the original quote and a reviewable reason/approval trail.
- An intake or measurement record cannot itself be mistaken for verified payment or successful delivery.

## 6. Workflow D — Shared pricing, quote adjustment, and settlement

**Purpose:** Apply consistent pricing rules across storefront delivery and independent shipment booking, and handle later changes transparently.

### Accepted constraints

- One shared pricing service/rule set serves storefront delivery and independent shipment booking where applicable.
- Configured fixed rates and calculated rates are supported in the design.
- The accepted quote and the inputs/rates used must be preserved.
- Actual intake measurements may produce a proposed recalculation.
- Material discrepancies and payment-impacting adjustments require review under a configurable policy.
- Additional payments, credits, and refunds are separate financial operations; unresolved payment outcomes are not successful payments.

### Proposed sequence

1. Identify the service and the required pricing inputs.
2. Apply the approved active rule/rate set and produce a quote with enough context to reproduce the calculation.
3. Present the quote and capture acceptance under the booking/checkout policy.
4. Preserve the quote snapshot and the applicable rate/rule version.
5. If later facts differ (for example, intake measurement), calculate a proposed difference without overwriting the original quote.
6. Apply the approved materiality threshold and route any required review to the authorized approver.
7. Record the decision, reason, actor, and resulting charge/credit/refund operation where applicable.
8. Verify and reconcile the financial event independently of shipment/order operational state.
9. Keep the case open or in a defined exception path until the financial and operational outcomes required by policy are resolved.

### Open policy / design questions

- Exact formula, units, distance source/bands, service classes, minimums, surcharges, discounts, tax treatment, rounding, and currency rules.
- Which services use fixed versus calculated rates and how rates are versioned/effective-dated.
- Quote validity, repricing triggers, and whether/how rates can be changed after acceptance.
- Material-discrepancy thresholds, approval limits, and who can authorize adjustments.
- Which payment-at-intake methods are accepted and what evidence verifies them.
- Who can initiate/approve refunds, credits, additional charges, and write-offs; separation-of-duties requirements.
- What happens if an adjustment is rejected, the customer declines to pay, or a payment attempt remains unresolved.

### Acceptance criteria to define

- The same approved pricing rules are reused across applicable booking paths.
- Quotes can be reconstructed from their preserved inputs and rate/rule version.
- A rate update does not silently change an accepted quote.
- Every adjustment is linked to the original quote and records the review decision where required.
- Charges, credits, refunds, and payment status remain separately traceable.
- No workflow claims settlement until the relevant financial event is verified.

## 7. Workflow E — Payment events and financial reconciliation

**Purpose:** Maintain authoritative payment outcomes and a traceable financial history across storefront and shipment operations.

### Proposed sequence

1. A supported journey creates a payment intent/attempt for a known business purpose and amount.
2. For online payment, the server initializes the provider request and validates provider callbacks/webhooks using the configured security contract.
3. The server verifies the provider result, associates it with the correct order/booking/charge, and processes repeated events idempotently.
4. Payment outcomes remain distinct from order/shipment/movement statuses. A paid storefront order does not prove parcel intake; a shipment movement does not prove settlement.
5. Payment at intake, if supported for the relevant journey, is recorded through an explicitly approved method and evidence process. A staff note alone is not sufficient proof unless the approved method defines it as such.
6. Additional charges, refunds, credits, reversals, and reconciliation adjustments are distinct financial events linked to the original business transaction and reason.
7. Finance or another explicitly authorized function reviews exceptions, reconciles provider records against platform records, and records resolution.
8. Late, duplicate, failed, or contradictory events follow explicit policy and produce an auditable outcome.

### Open policy / design questions

- Which payment methods are permitted at intake and who can record/verify each?
- How are partial payments, additional charges, refunds, credits, chargebacks/reversals, and failed or late payment outcomes represented?
- What is the approved handling for a successful payment received after cancellation or stock release?
- What reconciliation frequency, source of truth, tolerance, and exception ownership are required?
- Which financial actions require a second approver or a role separate from the initiator?
- Which financial details may Admin/Operations see versus Finance/Management?

### Acceptance criteria to define

- Browser/client state cannot independently establish payment success.
- Provider event processing is authenticated, idempotent, and linked to a known transaction purpose.
- Payment, refund, credit, reversal, and reconciliation outcomes are individually traceable.
- Unpaid-dispatch exceptions never rewrite payment state.
- Every supported late/duplicate/conflicting event has a testable expected result.

## 8. Workflow F — Route proposal, assignment, handover, and movement

**Purpose:** Plan and record parcel movement through approved transport legs.

### Accepted constraints

- Routing may generate or present a proposal.
- Operations reviews proposals and approves route-leg assignments.
- A separate Driver Portal is deferred at launch; Operations initially manages assignments and records movement milestones.
- Transport providers/drivers are external or operational participants, not assumed to have direct platform access.

### Proposed sequence

1. A shipment/fulfilment unit becomes eligible for route planning under the approved operational prerequisites.
2. The system or an operator proposes a route or sequence of transport legs from the available network and service constraints.
3. Operations reviews the proposal and can approve, adjust, or reject it according to policy.
4. Each route-leg assignment records the approved provider/resource, responsible approving actor, relevant time, and any required capacity/service information.
5. Physical handover between locations/providers is recorded as a separate event with origin/destination, actor, time, and required evidence.
6. Operations records movement milestones through the launch process and handles delays, missed connections, damage, or lost-parcel exceptions using approved procedures.
7. A proposal or assignment alone is not proof that a handover or movement occurred.

### Open policy / design questions

- Which service/network constraints are required for the initial route proposal?
- What route-leg data and evidence are mandatory, and which actor can approve/modify/revoke an assignment?
- Are providers/resources selected manually, suggested by rules, or both?
- How are provider capacity, unavailability, missed handovers, damaged/lost parcels, and reassignment handled?
- Which milestones are mandatory, and what is the source of evidence when Operations enters an event on behalf of a provider/driver?
- What approval separation is required for assignment, dispatch, and exceptions?

### Acceptance criteria to define

- Proposed, approved, assigned, and physically completed work are distinguishable.
- Route-leg history preserves assignment changes and custody handovers.
- Operations can record launch-time milestones without implying a driver-facing portal.
- Only authorized actors can approve or change assignments.
- Exception handling has an owner, evidence requirements, and an explicit resolution outcome.

## 9. Workflow G — Dispatch authorization

**Purpose:** Decide whether a shipment/fulfilment unit may leave a location for a transport leg.

### Accepted constraint

Verified payment is required by default before dispatch. An exception requires explicit authorization, an approved business policy, a recorded reason, and an audit trail. An exception does not change the payment state.

### Proposed sequence

1. Confirm the unit is physically ready and the next route-leg assignment has been approved.
2. Check all applicable dispatch prerequisites, including verified payment and unresolved intake/measurement or safety holds defined by the approved policy.
3. If prerequisites are satisfied, an authorized actor records dispatch and the associated handover evidence.
4. If payment is not verified, block normal dispatch. Permit an exception only if the owner-approved policy identifies eligible cases, authorized approvers, required evidence, and limits.
5. Record the exception decision, actor, reason, time, scope, and outcome. Keep the payment state unchanged.
6. If dispatch is blocked, route the case to its defined resolution path; do not silently bypass the gate.

### Open policy / design questions

- Which roles can authorize an unpaid-dispatch exception, under what limits and circumstances?
- Is approval by a second person required, and must it be separate from the initiator?
- What additional holds must block dispatch?
- What evidence is mandatory at dispatch/handover?
- What operational and customer communication follows a blocked dispatch?

### Acceptance criteria to define

- Normal dispatch is blocked until the approved prerequisites are met.
- Exception use is narrowly authorized, justified, and audited.
- An exception never marks a payment as paid.
- Dispatch, assignment, and physical handover are distinguishable events.

## 10. Workflow H — Delivery evidence and failed-delivery resolution

**Purpose:** Record delivery outcomes and manage unsuccessful attempts without inventing return/redelivery policy.

### Proposed sequence

1. An authorized operational actor or approved evidence source records a delivery attempt/outcome against the relevant shipment/leg.
2. Successful delivery is recorded only when the required proof for that delivery type is present and validated according to policy.
3. The record identifies the outcome, time, actor/source, recipient relationship where required, and evidence reference/access constraints.
4. If delivery fails, record the reason and evidence, then route the case to the approved exception-resolution function.
5. Operations reviews proposed next steps and approves consequential actions under the policy. A failed attempt must not automatically imply return, redelivery, cancellation, or refund unless the approved rules say so.
6. The shipment's operational outcome and related financial events remain separately traceable.
7. Customer/support notifications follow the approved event/recipient/channel rules.

### Open policy / design questions

- Which proof-of-delivery methods are accepted, and which are mandatory for each service?
- What recipient identity or collection authorization checks are required?
- How are evidence privacy, retention, redaction, and dispute access handled?
- Which failed-delivery reasons and resolution options are supported at launch?
- Who approves redelivery, return-to-sender, holding, disposal, cancellation, refunds, or other consequential outcomes?
- What are the time limits, retry limits, fees, customer contact requirements, and escalation paths?
- What happens when proof is missing, disputed, or entered late?

### Acceptance criteria to define

- An attempt is not mistaken for successful delivery.
- Delivery completion requires the approved evidence for the selected delivery type.
- Failed delivery enters a defined, authorized resolution path.
- Consequential changes and evidence access are auditable.
- No return/redelivery/refund outcome is inferred before the relevant policy is approved.

## 11. Workflow I — Notifications and customer tracking

**Purpose:** Communicate verified, relevant milestones without exposing unnecessary personal or operational information.

### Proposed sequence

1. Define a notification event only after its underlying business event is verified and its recipient is authorized.
2. Select the intended recipient(s) and channel from an approved event catalogue.
3. Send only the minimum fields needed for the message, avoiding credentials, access tokens, and unnecessary personal information.
4. Track delivery attempts/failures where supported; define retry and deduplication behaviour so repeated provider events do not create repeated messages.
5. Customer tracking pages expose only the information allowed by authenticated ownership or the existing guest-access entitlement.
6. Telegram remains deferred. At launch, any planned paid-order delivery notification is gated by the authorized Admin approval of delivery assignment; this is not permission to send every paid order automatically.

### Open policy / design questions

- Which milestones trigger messages, who receives them, and which channels are used?
- Which shipment/customer details may be disclosed in email, SMS, Telegram, or tracking links?
- What retry, deduplication, retention, and failure-escalation rules apply?
- How are lost/revoked guest access tokens handled? Guest-order claiming remains unresolved.

### Acceptance criteria to define

- Notifications are triggered by verified events, not untrusted browser state.
- Recipients and message fields follow explicit privacy/access rules.
- Retries do not produce uncontrolled duplicates.
- Tracking access cannot be granted by an order ID alone.
- Telegram remains deferred unless a later scope decision explicitly changes it.

## 12. Workflow J — Audit, evidence, and controlled disclosure

**Purpose:** Make consequential operational and financial actions reviewable, and handle legal/government requests through controlled review rather than privileged requester access.

### Proposed sequence

1. Identify the action/event, responsible actor or external source, target record, timestamp, and outcome.
2. Record a reason and approval reference for exceptions, overrides, financial adjustments, custody changes, disclosure, or other actions identified as consequential by policy.
3. Store or reference evidence with appropriate access and retention controls; do not assume a log entry by itself proves the physical event occurred.
4. For a government/public-authority request, record the request context and route it to an authorized internal reviewer. The requester gains no platform access from submitting a request.
5. Record the decision, scope of disclosure, approving actor, disclosed evidence/data, time, and outcome under the approved legal-handling policy.
6. Restrict evidence access and disclosure to authorized actors; retain an auditable history of access/changes where required.

### Open policy / design questions

- Which event types must be audited and which evidence is mandatory?
- What retention/deletion, legal hold, correction, redaction, and dispute rules apply?
- Who can approve disclosure, and what second-person review is required?
- What is the minimum workflow for requests that are incomplete, rejected, urgent, or legally contested?
- What existing audit/event helper or storage facility can be reused? Inspect source before proposing a new one.

### Acceptance criteria to define

- Consequential actions are attributable and reviewable.
- Evidence access follows least privilege and defined retention rules.
- A requester does not gain privileged access from the request itself.
- Disclosure decisions record scope, authorization, and outcome.
- New audit infrastructure is not assumed until current source has been inspected.

## 13. Cross-workflow exception catalogue

The following cases require explicit outcomes in the detailed lifecycle and acceptance specifications. Listing them does not choose their business resolution.

| Exception | Required specification before implementation |
|---|---|
| Quote expires or changes before acceptance | Validity, repricing, acceptance and customer-notice rules |
| Paid online booking never reaches intake | Cancellation, refund/credit, stock or capacity release where applicable |
| Intake measurement differs from quote | Units, threshold, recalculation, approval, customer choice and settlement |
| Payment-at-intake fails or is disputed | Permitted method, evidence, retry, receipt, ownership and dispatch consequence |
| Payment succeeds after cancellation or release | Idempotent processing, reconciliation, stock/booking recovery or refund outcome |
| Duplicate/late/conflicting provider events | Authoritative state, idempotency, audit and exception owner |
| Route proposal or assignment changes | Approval rights, history, notification and handover implications |
| Provider/driver misses a handover or reports damage/loss | Evidence, custody owner, escalation, customer communication and resolution authority |
| Dispatch requested while payment is unverified | Default block and tightly defined audited exception path |
| Delivery attempt fails or proof is disputed | Accepted reasons/evidence, authorized resolution and customer contact |
| Refund, credit or additional charge is needed | Initiation/approval permissions, provider operation, verification and reconciliation |
| Notification fails or is duplicated | Retry/deduplication, observability, fallback and privacy |
| Government disclosure request | Request validation, approval, disclosure scope, evidence access and audit |

## 14. Owner decisions and dependency register

This draft deliberately does not resolve the following:

1. **Actor and staff-role boundaries:** DEC-022 accepts the minimal hybrid staff model. Workflow-specific permissions, second-person approval thresholds, PUDO/station authority, Finance boundaries, and external-party access remain open in §6 of PLATFORM_ACTORS_AND_RESPONSIBILITIES.md.
2. **Shipper eligibility and identity:** guest booking is excluded by DEC-023; DEC-024 accepts distinct booking-party/sender/receiver/payer/handover roles and payment-only payer access by default. Exact verification points, consent, change/cancellation authority by type and lifecycle stage, and business-account handling remain open.
3. **Lifecycle/state transitions:** allowed states and transitions for booking, intake, shipment, route leg, dispatch, delivery, failed delivery, cancellation, and returns.
4. **Pricing policy:** formulas, units, distance source/bands, service classes, quote validity, thresholds, approval limits, rounding, taxes, surcharges, and permitted methods.
5. **Payment and settlement:** payment-at-intake methods, late/duplicate/contradictory events, refunds/credits/additional charges, reconciliation, and separation of duties.
6. **PUDO capability model:** which locations support which services and which actors may record each physical event.
7. **Transport and proof:** provider assignment rules, movement evidence, mandatory proof of delivery, identity checks, evidence retention, and failed-delivery resolution.
8. **Dispatch exceptions:** eligible circumstances, approval authority, second-person review, required evidence, and limits.
9. **Notifications:** event catalogue, recipients, channels, minimum fields, retry/deduplication, and operational ownership.
10. **Audit and disclosure:** required event types, evidence/retention rules, legal-request approval, disclosure scope, and review controls.
11. **Technical contracts:** conceptual entity relationships, record identifiers, APIs/services, authorization enforcement, idempotency keys, integration failure/retry, and compatibility with existing Firebase data/routes. These must be reconciled with source after workflow policies are reviewed.

## 15. Review and acceptance checklist

The shared workflow specification is ready to inform implementation planning only when:

- [ ] Owner decisions affecting these flows are recorded in DECISIONS.md, or remain explicitly blocked with an owner question.
- [ ] Each launch-essential workflow has a defined trigger, actor/owner, start/end conditions, transitions, and terminal/exception outcomes.
- [ ] Order, independent booking, shipment, route leg/movement, payment, and financial events have unambiguous conceptual relationships.
- [ ] Quote creation, preservation, discrepancy review, and settlement rules are implementable without invented policy.
- [ ] Authorization and audit requirements are defined for every consequential action.
- [ ] External integration success, failure, retries, duplicate/late events, and recovery are specified.
- [ ] Each launch-essential scenario has observable acceptance criteria and a verification approach.
- [ ] Deferred scope remains explicit, including a separate Driver Portal and Telegram.
- [ ] Current source is inspected read-only before proposing schema, API, route, or service changes.
- [ ] README.md, SPEC.md, DECISIONS.md, ISSUES.md, PROGRESS.md, and SESSION_HANDOFF.md agree on the current baseline and next task.

**Next step:** review this shared workflow draft, then resolve owner decisions in dependency order. Do not begin application-code implementation until the complete platform-wide SDD has been reviewed and approved.
