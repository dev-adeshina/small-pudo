# VeriLyft Shared Platform Workflows

**Document status:** Draft workflow specification — accepted owner policies incorporated; detailed workflows and implementation contracts remain open  
**Last updated:** 31 October 2026  
**Scope:** Primary independent-shipment logistics workflows and attached storefront-order fulfilment, including their shared operational fulfilment boundary  
**Related documents:** SPEC.md, DECISIONS.md, ISSUES.md, PLATFORM_ACTORS_AND_RESPONSIBILITIES.md, ADMIN_REQUIREMENTS.md, ADMIN_PORTAL.md  
**Related decisions:** DEC-018, DEC-019, DEC-020, DEC-021, DEC-022–DEC-044

## 1. Purpose, status, and boundaries

This document turns the accepted launch operating model into a first-pass, platform-wide workflow description. It identifies the major participants, sequence, decision gates, records that must remain distinct, exceptions, and open policy questions. It does not assert that these workflows or all related screens/services already exist in the application.

Owner-policy outcomes under DEC-022–DEC-044, PM-01–PM-12, and BP-01–BP-22 are accepted at the levels recorded in their authoritative decision documents. The workflow sequences, detailed operational parameters, technical contracts, and evidence plans in this document remain draft work and are not implementation authorization. This document does not prescribe Firestore collections, field names, API routes, enum values, or a migration. Existing source must be inspected before any future technical proposal.

Use these evidence labels consistently:

- **Accepted constraint:** supported by an accepted decision or owner-confirmed launch requirement.
- **Proposed workflow:** a sequence offered for review; it is not an approved detailed business policy.
- **Open specification:** a value, rule, authority, or outcome not yet sufficiently detailed to implement; it may remain open under an accepted high-level owner decision.
- **Implementation evidence:** facts established from source or dated tests; record them separately in the progress/audit documents.

## 2. Cross-workflow invariants

1. **Logistics is the primary business workflow; storefront commerce is attached.** Independent shipment booking is the primary customer entry point. Storefront purchases are a secondary order source and, when delivery is required, enter the same operational fulfilment system. Storefront orders and independent shipments remain distinct business concepts; do not assume one record represents both.
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
- How will DEC-035 be implemented: challenge format/lifetime, request limits, token rotation/revocation, post-fulfilment eligibility, account closure, and support exception procedure? The high-level recovery/claiming policy is accepted; technical details remain open.

### Acceptance criteria to define

- Client-supplied price, stock, payment status, and customer UID are not trusted.
- Duplicate provider events cannot double-process payment or stock.
- A storefront order is not silently reclassified as an independent shipment.
- Customer and guest tracking access follows verified entitlement.
- Each supported cancellation/late-payment scenario has one defined, testable outcome.

## 4. Workflow B — Independent shipment booking and quote

**Purpose:** Allow a registered customer to arrange parcel transport independently of a storefront purchase, either for themselves or on behalf of a business.

### Accepted policy constraints (DEC-023, DEC-024, DEC-038, BP-01–BP-22)

- Only a registered, authenticated customer may create an independent shipment booking at launch. Guest shipment booking is excluded; storefront guest checkout is unchanged.
- An independent shipment booking becomes commercially confirmed when the authenticated booking party explicitly accepts a valid quotation. Quote issuance alone is not confirmation.
- Acceptance confirms the booking and accepted commercial terms. Payment, physical intake/custody, and later logistics fulfilment remain separate events.
- The booking party, sender, receiver/collection recipient, payer, and physical handover person may be different. A person may occupy multiple roles, but the system must not assume that they are the same.
- A registered customer may arrange a shipment on behalf of a business, subject to identifying the business and the person's relationship to it. This does not assume a separate business-account system at launch.
- Information collection is service-specific and proportionate: origin, destination, selected available service, parcel description, and any measurements or supporting information required for that service's eligibility or pricing. Do not collect unnecessary information or assume every service requires identical details.
- Identity verification occurs at appropriate checkpoints under the applicable authority, security, intake, payment, and collection policy. No provider or unapproved verification method is selected here.
- Each service must define a handover period/deadline separately from quote validity. The deadline is communicated before acceptance and included in booking confirmation.
- An unaccepted expired quote requires a fresh quote. Expiry of an already accepted quote does not silently cancel or rewrite the confirmed booking or its accepted terms.
- A confirmed booking may await payment where payment at intake is permitted, or may have verified advance payment. Payment is authoritative only after the approved verification process.
- A confirmed booking remains planned until an authorized actor records actual physical receipt. Booking confirmation or payment never proves intake or custody.
- Before intake, the authenticated booking party may request permitted changes/cancellation under BP policy. Post-intake changes and cancellation are controlled and staff-mediated. Cancellation triggers financial assessment but does not itself complete a refund.
- A booking that is not handed over by its communicated deadline may be closed as unfulfilled under the service policy. Preserve booking, payment, and audit history; financial resolution is separate.
- Abandonment before quote acceptance creates no confirmed booking. Duplicate/replayed acceptance, payment, or cancellation events must not create duplicate records or financial side effects.
- Staff-assisted customer booking must not impersonate the customer or accept a quote on their behalf without an explicitly approved authorization process. Staff-created walk-in intake remains a distinct path.

### Proposed sequence

1. A registered customer signs in and begins an independent shipment booking.
2. The customer identifies the origin, destination, requested service, parcel description, and service-specific eligibility/pricing information. Party relationships are captured distinctly where relevant.
3. The shared pricing capability applies the selected service's approved fixed, calculated, or hybrid model. Preserve quote inputs, itemized charges, total, currency, pricing-rule/rate version, effective context, and quote validity.
4. The service's handover deadline is determined under its approved configuration and shown with the quotation before acceptance.
5. The authenticated booking party explicitly accepts or rejects the valid quotation. Acceptance confirms the booking and accepted commercial terms; rejection or abandonment does not create a confirmed booking.
6. A booking reference and confirmation are provided. The confirmation communicates the applicable handover deadline and payment path.
7. Payment proceeds separately through an allowed path: advance online payment or payment at intake where enabled. Server/provider verification, not browser navigation or an unverified note, establishes payment outcome.
8. The confirmed booking is available to authorized intake/Operations workflows but remains planned until physical receipt is recorded.
9. An authorized intake actor records actual receipt, measurement/condition evidence, and custody under the separate intake workflow. Discrepancies follow the accepted adjustment/review policy.
10. Permitted pre-intake amendments/cancellation follow BP authority. Post-intake changes are controlled and staff-mediated. A missed handover deadline may result in an unfulfilled outcome, with financial assessment handled separately.

### Open policy / design questions

- Exact contact and identity-verification methods/checkpoints, consent evidence, and collection verification remain open.
- The detailed business identity/relationship representation remains open; no separate business-account system is assumed.
- Service catalogue, route eligibility, capacity/availability rules, quote validity periods, pricing formulas/inputs, and handover-deadline durations/configuration remain open.
- Exact payment-at-intake methods, evidence, partial-payment handling, late-payment outcomes, and reconciliation remain open.
- The booking-reference/receipt format, operational status vocabulary, intake hold/refusal outcomes, and post-deadline customer resolution remain open.
- The full change-type/lifecycle/permission matrix, notification details, retention, evidence standards, and API/data contracts remain open.
- The effect of cancellation, missed handover, or refused intake on fees/refunds/credits must follow the separately approved financial policy; no automatic refund is implied.

### Acceptance criteria to define

- Only a registered, authenticated customer can create and access an independent booking within server-enforced entitlement.
- An issued quote alone does not confirm a booking; explicit acceptance of a valid quote by the authenticated booking party does.
- Booking confirmation preserves the accepted quote, its inputs/rates, commercial terms, and communicated handover deadline.
- Quote expiry before acceptance requires a fresh quote; accepted quote expiry does not silently cancel or rewrite a confirmed booking.
- Payment status is independently verified and never inferred from booking confirmation.
- Booking confirmation and payment never imply physical receipt or custody.
- An authorized intake event is required to record physical receipt; booking and intake remain distinguishable.
- The booking party, sender, receiver, payer, and handover person can differ without inferred permissions.
- Business bookings can identify the business and booking party's relationship without assuming a separate business-account architecture.
- Customer A cannot read or change Customer B's booking; payer, sender, receiver, and booking-party associations do not grant unapproved access or authority.
- Pre-intake cancellation/change requests follow BP policy; post-intake changes are staff-mediated; cancellation does not itself complete a refund.
- A missed handover deadline can be resolved as unfulfilled without deleting booking/payment/audit history.
- Abandonment before quote acceptance creates no confirmed booking; duplicate/replayed events do not duplicate bookings or financial side effects.
- Walk-in intake and staff-assisted booking are not misrepresented as the same customer booking path.

## 5. Workflow C — Physical intake, measurement, and custody

**Purpose:** Record the actual physical handover of a parcel at a supported staffed location or other approved intake arrangement.

### Accepted constraints (DEC-025)

- Location capabilities are configured per location; capabilities must not be inferred from a location label, staff login, or Admin status.
- The launch capability set includes walk-in intake record creation, parcel measurement, custody acceptance, payment collection/recording with required evidence, and parcel release to a verified authorized recipient. Each action is separately authorized.
- The initial location record is intentionally lean: name, address, active status, and configured capabilities. More elaborate hours/contact/capacity management is not implied.
- Consequential physical and payment actions record the responsible actor, location, and time, plus applicable evidence/reason. Server-side authorization is mandatory.
- A registered collection centre may perform only explicitly configured services; outgoing intake and parcel release are not automatically enabled.

### Proposed sequence

1. Intake begins from an existing booking or an authorized staff-created walk-in intake. Advance booking and walk-in intake are both in the accepted launch scope.
2. Staff identify the booking/parcel and confirm the intake location is configured for the requested service. A registered collection centre must not be assumed to accept outgoing parcels unless that capability is explicitly enabled.
3. The authorized actor records actual receipt and the minimum parcel/condition/measurement information required by the approved service-specific intake policy. Preserve customer/booking-party-declared measurements separately from actual intake measurements; record the unit, actor, location, timestamp, and applicable evidence/reason.
4. The system associates the receipt with the correct booking/shipment and records who accepted custody, when, where, and any required evidence.
5. If actual measurements or service details affect the quote, the shared pricing rules calculate a proposed adjustment while preserving the original quote.
6. Where a discrepancy is material or affects an existing payment, the case follows the approved review/approval policy. Do not silently rewrite the quote or mark an unapproved adjustment settled.
7. Intake is either accepted, held for review, or rejected according to outcomes that the owner must define. Do not treat these as approved status values until the transition model is accepted.
8. If payment at intake is allowed, record the financial event using the approved payment method and verification process; do not infer successful payment merely because a staff member records a note.

### Open policy / design questions

- Which location types can accept outgoing parcels, collect parcels, measure parcels, hold custody, or perform handover?
- What is the required intake checklist: dimensions/weight, packaging/condition, prohibited-item checks, photos, sender identity, and acceptance acknowledgement?
- Which service-specific measurements and units are required, and what explicit conversion rules apply?
- What numeric tolerance distinguishes routine variation from a material discrepancy, and who can approve the resulting adjustment?
- Can a parcel be refused, held, corrected, or returned at intake, and what is the documented process for each?
- What evidence and retention rules apply to custody changes and disputes?

### Acceptance criteria to define

- Booking and intake are separately represented and observable.
- Intake can be linked to a booking or created through the approved walk-in path.
- Only authorized actors can record custody events for locations/services within their scope.
- Quote changes retain the original quote and a reviewable reason/approval trail.
- An intake or measurement record cannot itself be mistaken for verified payment or successful delivery.

## 6. Workflow D — Shared pricing, quote adjustment, and settlement

**Purpose:** Apply consistent, service-appropriate pricing across storefront delivery and independent shipment booking, preserve commercial agreements, and handle later changes transparently.

### Accepted constraints (DEC-026/DEC-027)

- Each service explicitly uses an approved fixed, calculated, or hybrid pricing model. A service may combine approved fixed and variable components; not every service uses every model. Under DEC-039, each service uses only its configured approved inputs; no universal formula or input set is assumed.
- Storefront delivery and independent shipment booking share the same approved pricing rule set wherever their inputs overlap. A service may not invent an ad hoc formula outside the approved pricing catalogue/configuration.
- Each service declares which approved inputs apply. Categories may include origin, destination, distance/approved distance band, weight, dimensions, volumetric weight, service class/delivery speed, minimum charge, and documented special-handling requirements.
- Only applicable, approved inputs are used. The customer/browser may provide declared inputs but cannot determine the authoritative final price; trusted server-side validation/calculation applies the approved service configuration. Staff-assisted pricing uses the same rule authority and cannot introduce ad hoc formulas or charges. Quotes disclose applicable charge components and total; taxes, surcharges, discounts, and other fees are never silently presumed zero or silently added. Exact formulas, rates, input sources, service mappings, units, rounding, and effective-date rules remain open.
- Quote validity is configured by service and communicated to the customer. An unaccepted expired quote requires a fresh quote before proceeding. Under DEC-038, expiry of an already accepted quote does not silently cancel or rewrite the confirmed booking or accepted terms.
- Recognized quote outcomes are draft, issued, accepted, rejected, expired, superseded, and cancelled. Acceptance is explicit.
- Preserve quote inputs, itemized charges, total, currency, and pricing-rule/rate version/effective context. Recalculation creates a new quote/revision; prior issued/accepted quotes are not silently overwritten.
- A quote, accepted commercial agreement, payment, and booking are distinct events.
- Preserve customer-declared and actual measurements separately. Actual measurement records identify unit, actor, location, timestamp, and applicable evidence/reason. Units and measurement requirements are service-specific; no universal units or numeric tolerances are approved.
- Material discrepancies and adjustments affecting an existing payment require review under configured authority. A proposed adjustment is not an approved charge or settled financial event.
- Notify the customer of a price-changing adjustment, including its reason and revised amount. Explicit customer acceptance is required before collecting an additional charge. A disputed additional charge is held pending review; under DEC-040, rejection triggers an authorized service-resolution decision and never automatically cancels, refunds, credits, or charges.
- Additional payments, credits, refunds, reversals, and reconciliation outcomes remain distinct financial events.

### Proposed sequence

1. Identify the service and validate only the pricing inputs configured for that service.
2. Apply the service's approved fixed, calculated, or hybrid model and active rule/rate context.
3. Produce and issue a quote that preserves its input snapshot, itemized charges, total, currency, rule/rate version, effective context, and configured expiry.
4. Record explicit customer acceptance or rejection. If an unaccepted quote expires, require a fresh quote before proceeding. Preserve prior quote versions when superseded or recalculated.
5. Treat the accepted commercial agreement, booking, and any payment as separate events with explicit relationships.
6. At intake, preserve declared values and separately record actual measurements using the service's configured units and evidence requirements.
7. If actual measurements or another permitted fact changes the price, create a proposed adjustment linked to the original quote and accepted agreement; do not overwrite the original.
8. Apply the configured materiality/review authority. Notify the customer of the reason and revised amount; obtain explicit acceptance before collecting an additional charge. Hold disputed additional charges pending review.
9. Record the adjustment outcome and reason. A rejection follows the service-resolution policy; do not infer a refund, credit, cancellation, or other outcome automatically.
10. Process any resulting charge, additional payment, credit, refund, reversal, or reconciliation outcome as a separate authorized and verified financial event.

### Open policy / design questions

- Exact formula catalogue, rates, service mapping, input sources, units/conversions, distance sources/bands, rounding, currency handling, minimums, tax/fee/discount applicability, and effective-date rules.
- Whether taxes, surcharges, discounts, or other fees apply and how they are calculated, displayed, and approved; unknown treatment must not be assumed to be zero.
- Exact quote-validity durations, handover-deadline configuration, and booking-reference/receipt format. DEC-038 resolves that valid quote acceptance by the authenticated booking party confirms the booking and accepted-quote expiry does not silently cancel or rewrite it; only the service-specific duration/configuration remains open.
- Service-specific required measurements, units, explicit conversion rules, numeric discrepancy thresholds, and evidence requirements.
- Approval limits, separation of duties, second-person review cases, who is authorized to choose among the DEC-040 service-resolution outcomes, service-specific safety/commercial feasibility criteria, alternative-service eligibility, customer response periods, and non-response handling.
- Payment-at-intake methods/evidence; authority for additional charges, refunds, credits, and write-offs; reconciliation frequency and exception ownership.

### Acceptance criteria to define

- Each service uses only its explicitly configured fixed, calculated, or hybrid pricing model and approved inputs; the trusted server is authoritative for validation and final calculation, and the quote transparently presents applicable charge components and total.
- Storefront delivery and independent shipment booking reuse the shared approved rule set wherever inputs overlap.
- Equivalent approved inputs under the same service/rule version produce a reproducible result.
- Issued and accepted quotes can be reconstructed from preserved inputs, itemized charges, total, currency, and pricing-rule/rate version/effective context.
- Unaccepted quote expiry requires a fresh quote; an already accepted quote is not silently changed by expiry or rate updates.
- Quote, accepted agreement, booking, payment, and physical intake remain distinguishable.
- Declared and actual measurements remain separately attributable, with explicit units and applicable evidence.
- Every adjustment links to its original quote, preserves the original agreement, and follows required review and customer-consent controls.
- A proposed or disputed adjustment is never treated as an approved charge or settled financial event.
- Charges, additional payments, credits, refunds, reversals, and reconciliation outcomes remain separately traceable.
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
7. A rejected quote creates no payment obligation from that quote. An accepted adjustment records the revised commercial agreement and any additional amount due. A disputed additional charge remains held pending review.
8. Overpayments and underpayments require an authorized, traceable resolution; a failed payment remains a failed attempt. A payment received after cancellation is recorded and reconciled without reactivating the cancelled booking.
9. A refund request is not an executed refund, and a customer credit is not a cash refund. Provider/bank reconciliation and duplicate-event protections remain mandatory.
10. Finance or another explicitly authorized function reviews exceptions, reconciles provider records against platform records, and records resolution.
11. Late, duplicate, failed, or contradictory events follow explicit policy and produce an auditable outcome.

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

### Accepted constraints — DEC-018 and DEC-030

Verified payment is required by default before dispatch. DEC-030 accepts only narrow, controlled exceptions for explicitly defined operational circumstances under an approved policy; it rejects a generic convenience override or unrestricted staff discretion. Only staff with explicitly assigned dispatch-exception permission may approve. The requester must not automatically approve their own request, and material exceptions require a second approver. An exception never changes payment status and cannot bypass unrelated safety, custody, identity, legal, or other operational holds. Record the affected parcel/shipment, reason, requesting actor, approving actor(s), timestamp, supporting evidence, and decision/outcome.

### Proposed sequence

1. Confirm the unit is physically ready and the next route-leg assignment has been approved.
2. Check all applicable dispatch prerequisites, including verified payment and unresolved intake/measurement or safety holds defined by the approved policy.
3. If prerequisites are satisfied, an authorized actor records dispatch and the associated handover evidence.
4. If payment is not verified, block normal dispatch. Permit an exception only if the owner-approved policy identifies eligible cases, authorized approvers, required evidence, and limits.
5. Record the exception decision, actor, reason, time, scope, and outcome. Keep the payment state unchanged.
6. If dispatch is blocked, route the case to its defined resolution path; do not silently bypass the gate.

### Open policy / design questions

- Which operational circumstances qualify for an exception?
- Which staff responsibility receives the explicit dispatch-exception permission, and what exact separation-of-duties rules apply?
- Which cases are material and therefore require a second approver?
- What monetary or operational limits apply, and can an approval be revoked before dispatch?
- What supporting evidence is mandatory for each eligible exception category?
- What additional holds must block dispatch, and what evidence is mandatory at dispatch/handover?
- What operational and customer communication follows a blocked dispatch?

### Acceptance criteria to define

- Normal dispatch is blocked until the approved prerequisites are met.
- Only explicitly authorized staff may approve a defined exception; the requester cannot automatically approve their own request.
- Material exceptions require a second approver under the policy to be defined.
- Exception use is justified and audited, and cannot bypass unrelated operational holds.
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
- What exact event/recipient/channel/field matrix, contact verification, consent/preferences, retry limits, deduplication keys, retention, and persistent-failure ownership implement DEC-034?
- What retry, deduplication, retention, and failure-escalation rules apply?
- How will lost/revoked guest access credentials be recovered under DEC-035, and which events trigger customer notification under DEC-034?

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

## 14. Accepted owner decisions and remaining workflow specification

All 15 high-level owner decisions are accepted and recorded in DEC-022–DEC-036. This section tracks detail needed to turn accepted policies into complete workflows; it is not a list of pending owner decisions.

1. **Staff/actor authorization (DEC-022, DEC-025):** action-level permission matrix, staff assignment/revocation, partner access, and second-person approval thresholds.
2. **Booking and party authority (DEC-023, DEC-024):** identity/verification checkpoints, business-account handling, sender/receiver consent, change permissions by type and lifecycle stage, and booking-to-shipment creation/linkage.
3. **Lifecycle transitions:** allowed states, transition guards, actor/authority, rejection paths, expiry, cancellation, returns, and out-of-order event handling across orders, bookings, shipments, route legs, movements, payments, and delivery.
4. **Pricing and adjustment (DEC-026, DEC-027):** formulas, units, distance/rate sources, effective dates, rounding, fees/taxes/discounts, quote expiry/re-quote, discrepancy thresholds, customer consent, and approval/refusal/dispute outcomes.
5. **Payment and settlement (DEC-028, DEC-029):** configured methods/providers, transaction/cash limits, receipt/evidence format, refund/credit limits, late-payment disposition, reconciliation cadence/ownership, and separation of duties.
6. **Physical operations (DEC-025, DEC-028, DEC-030–DEC-032):** location capability assignment, measurement requirements, collection verification, route constraints/capacity, movement milestone/evidence catalogue, delivery proof by service, and failed-delivery resolution authority.
7. **Notifications (DEC-034):** event/timing/channel/recipient/field matrix, preferences/consent, contact verification, retry limits, deduplication semantics, retention, and persistent-failure ownership. Telegram remains deferred and gated as accepted.
8. **Audit/evidence/disclosure (DEC-033):** event catalogue, retention periods, reviewer matrix, correction/redaction authority, deletion/anonymization, legal-hold procedure, evidence integrity, and government-request disclosure steps.
9. **Guest-order recovery/claiming (DEC-035):** challenge form/lifetime, rate limits, credential rotation/revocation, eligibility, account closure, support exceptions, and acceptance tests.
10. **Launch baseline (DEC-036):** requirement-level P0/P1/deferred mapping, detailed acceptance evidence, production-like environment, blocker ownership, and release sign-off.

## 15. Review and acceptance checklist

The shared workflow specification is ready to inform implementation planning only when:

- [x] All 15 high-level owner decisions affecting these flows are recorded in DEC-022–DEC-036.
- [ ] Each launch-essential workflow has a defined trigger, actor/owner, start/end conditions, transitions, and terminal/exception outcomes.
- [ ] Order, independent booking, shipment, route leg/movement, payment, and financial events have unambiguous conceptual relationships.
- [ ] Quote creation, preservation, discrepancy review, and settlement rules are implementable without invented policy.
- [ ] Authorization and audit requirements are defined for every consequential action.
- [ ] External integration success, failure, retries, duplicate/late events, and recovery are specified.
- [ ] Each launch-essential scenario has observable acceptance criteria and a verification approach.
- [x] Deferred scope remains explicit, including a separate Driver Portal; Telegram remains deferred under DEC-034.
- [ ] Current source is inspected read-only before proposing schema, API, route, or service changes.
- [ ] README.md, SPEC.md, DECISIONS.md, ISSUES.md, PROGRESS.md, and SESSION_HANDOFF.md agree on the current baseline and next task.

**Next step:** complete requirement-level priority mapping, source traceability, detailed acceptance scenarios, and evidence planning. Do not begin application-code implementation until the complete platform-wide SDD has been reviewed and explicitly approved.

## D-06 reconciliation — DEC-027: measurement discrepancy and adjustment approval

The owner accepted a configurable, evidence-based policy distinguishing routine measurement variation from material discrepancies. Preserve original quoted inputs and separately record actual intake measurements with actor, location, time, and applicable evidence/reason. A discrepancy may create a proposed adjustment linked to the original quote, but the proposal must not silently overwrite accepted commercial terms or be treated as an approved charge or settled financial event.

Material discrepancies and adjustments affecting an existing payment require review under configured authority. Exact numeric thresholds, units and service-specific measurement requirements, approval limits, second-person rules, customer notification/consent, and outcomes for acceptance/dispute/refusal remain open. No application implementation or runtime test is authorized by this decision.


## D-07 reconciliation — DEC-028: configured payment-at-intake methods and evidence

At intake, a location may accept only payment methods explicitly enabled for that location. The payment record must distinguish the method and preserve amount, currency, applicable transaction reference or receipt, responsible collecting/recording staff member, location, and time. Method-specific evidence requirements must be defined before implementation.

Electronic payment is verified only through an authoritative provider, bank, or approved reconciliation source. A customer screenshot, verbal claim, or unsupported staff note is not sufficient proof of settlement. Cash collection requires an attributable receipt or equivalent record and reconciliation. Cash-handling procedures, limits, receipt format, and mandatory second-person controls remain open.

Payment, booking, and physical custody are separate facts: a payment record alone does not establish parcel custody. Failed, reversed, refunded, disputed, and corrected payment outcomes must retain traceable history rather than silently overwriting prior events. No application implementation or runtime test is authorized by this decision.


## Financial event and reconciliation policy — DEC-029

The shared booking, storefront, intake, and fulfilment workflows must preserve cancellation, payment, refund, credit, and operational lifecycle as separate facts. Cancellation is not a refund. Late payment after cancellation/expiry is recorded and reconciled against the original transaction without reactivating the cancelled record. Refund request and execution are distinct; credits, additional payments, reversals, and chargebacks remain separately traceable events. Reconciliation compares internal records with authoritative provider/bank evidence; mismatches are investigated. Duplicate/replayed provider events must not create duplicate financial effects. Consequential financial actions retain actor, time, reason, reference, and applicable evidence. Verified payment remains the default dispatch prerequisite under DEC-018; payment alone does not authorize dispatch. Exact approval limits, timelines, fees, partial-refund/credit rules, late-payment disposition, reconciliation cadence, and exception ownership remain unresolved.

## Dispatch exception policy — DEC-030

Dispatch remains blocked by default while required payment is unverified. Only explicitly defined operational circumstances may qualify for a narrow exception under an approved policy. Explicitly assigned dispatch-exception permission is required; the requester must not automatically approve their own request, and material exceptions require a second approver. Exceptions preserve payment state and cannot bypass unrelated safety, custody, identity, legal, or other operational holds. Record the parcel/shipment, reason, requester, approver(s), timestamp, supporting evidence, and outcome. Eligible circumstances, permission assignment, materiality, limits, category-specific evidence, and pre-dispatch revocation remain unresolved.


## Routing and movement policy — DEC-031

Operations manages route proposals and route-leg assignments at launch. Route proposal, approval, assignment, dispatch, physical handover, and arrival confirmation are separate concepts/events: neither a proposal nor an assignment proves physical movement. Approval and assignment changes (including alteration, revocation, and reassignment) require explicitly assigned staff authority and preserve prior decisions, responsible actor, and reason. Record movement milestones with the shipment/parcel, route leg, event type, location, physical actor where known, recording actor, timestamp, and event-appropriate supporting evidence. When staff record a provider/driver event, distinguish the physical actor from the staff recorder. Delays, missed handovers, missing parcels, damage, and disputed custody transfers remain explicit exceptions for investigation/resolution, not successful movement. Operations retains the launch workflow; Driver Portal remains deferred and no provider/driver direct access is implied. Exact route constraints, permission assignments, two-person approvals, mandatory milestones/evidence, provider/resource/capacity rules, correction authority, and exception-resolution details remain open. No schema, endpoint, or implementation is approved.


## Delivery proof and failed-delivery policy — DEC-032

A delivery attempt, successful delivery, failed delivery, customer collection, and return are distinct outcomes. An unsuccessful attempt is not completed delivery. Successful delivery requires approved evidence appropriate to the service and context; a staff status update alone is insufficient proof. Verify that the receiving person is authorized, preserving DEC-024's distinction between booking party, sender, receiver/collection recipient, payer, and handover person. Proof methods may vary by service: recipient confirmation, OTP, signed acknowledgement, or attributable staff evidence are examples, not universal requirements. Record failed attempts and reasons distinctly. Reattempt, return, holding, refusal, cancellation, and financial adjustment require an explicitly authorized resolution procedure and do not follow automatically from a failed attempt. Notify relevant parties of significant outcomes using only information they are authorized to receive. Preserve original evidence and event history when delivery is disputed. Mandatory methods, OTP policy, attempt limits, resolution authority, holding duration, failure catalogue, loss/damage/refusal/dispute handling, contact details, and detailed acceptance tests remain open. No schema, endpoint, or implementation is approved.


## Audit, evidence, correction, retention, and disclosure — DEC-033

Consequential actions across customer access, staff permissions, booking, intake, measurement, custody, financial events, dispatch, routing/movement, delivery/returns, overrides, and sensitive disclosures require an explainable, attributable history. Records identify actor, action, affected resource, timestamp, reason where applicable, and relevant evidence. Distinguish a physical actor from a staff recorder; an audit entry or status change alone does not prove a physical event occurred. Preserve consequential originals and supporting evidence; corrections/redactions must be separately authorized, attributable, and traceable without silently replacing the original. Apply category- and purpose-appropriate retention, deletion/anonymization, and legal holds; exact periods and procedures remain open. Restrict audit/evidence access to explicitly authorized reviewers and audit sensitive access/disclosure. Government requests remain basic and controlled: record authority, request/legal basis, scope, approval, and disclosure recipient, time, actor, and contents; a request does not grant unrestricted platform access. Evidence must be attributable to source and additions/corrections/redactions distinguishable. Exact event/evidence catalogue, retention schedule, reviewer matrix, two-person approvals, deletion and legal-hold procedures, disclosure procedure, evidence integrity requirements, and acceptance tests remain unresolved. No schema or implementation is approved.


## Customer notification policy — DEC-034

Notifications are triggered by meaningful, verified business events and remain communication side effects only. Queued, attempted, provider-accepted, delivered, read, retried, or failed notification outcomes do not change or independently establish order, payment, shipment, dispatch, custody, or delivery state.

Recipient selection follows the explicit party relationship and entitlement for the event under DEC-024 and DEC-032. Booking customer, sender, receiver/collection recipient, and payer may be different people. A payer receives relevant payment confirmation/receipt, refund, and financial outcome information by default, not full shipment details merely because they paid. Each message discloses only the minimum information needed for its purpose; private party, address, parcel, or shipment details require an applicable entitlement. An authenticated platform link may provide further detail but must not bypass access controls.

Email is the primary customer channel where configured. SMS is optional and requires explicit configuration and applicable consent/contact verification. In-platform notifications may serve authenticated customer and staff experiences. Do not assume every event uses every channel. Telegram remains deferred. Any future paid-order Telegram notification must follow the authorized Admin **Assign For Delivery** approval action; that approval is a gate only and does not prove physical dispatch, custody transfer, or delivery. Telegram also requires a separately approved purpose, audience, recipient/field policy, and channel configuration.

Prevent duplicate sends for the same business event, recipient, and channel. Use bounded retries for transient failures, preserve attributable attempts/outcomes, and surface persistent failures for operational follow-up. Provider acceptance is not proof of receipt or reading. Do not silently substitute a fallback channel. Final event/timing and channel matrix, consent/preferences/contact verification, templates/fields, retry limits, deduplication semantics, failure ownership, retention, and acceptance tests remain open. No schema, endpoint, provider integration, or application implementation is approved.


## Guest-order recovery and optional claiming — DEC-035

Storefront guest checkout remains supported. Guest-order recovery and optional account claiming are distinct operations. A guest who loses the original order-access credential must prove control of the original checkout email through a verification challenge delivered to that address before receiving a replacement credential; the order reference and email address alone are insufficient. Replacement credentials must follow controlled expiry/revocation and prior credentials must be invalidated or rotated.

A signed-in customer may optionally claim an eligible guest order only after a separate proof-of-ownership challenge tied to the original checkout email. The server verifies authenticated account context, order entitlement, and that the order has not already been claimed. A matching account email, order reference, unrelated session, or payment alone does not establish entitlement. An order cannot be claimed by multiple accounts or silently transferred. Exceptional transfer or support-assisted recovery requires a separately approved verification, authorization, and audit procedure.

Challenges must be time-limited and protected against replay and abuse. Failure responses must not disclose whether an order exists. Recovery credentials must not be exposed in logs or notification content beyond the secure recovery mechanism. Recovery/claiming cannot alter payment, cancellation, fulfilment, shipment, or delivery state. Challenge format/lifetime, rate limits, post-fulfilment eligibility, account deletion consequences, exceptional transfer/support procedures, credential mechanics, retention, and detailed tests remain unresolved. No schema, endpoint, token format, email template, provider integration, or application implementation is approved by this policy.


## Launch priority and production-readiness policy — DEC-036

The initial release uses an explicit P0/P1/deferred baseline. P0 requirements are release blockers until supported by demonstrable acceptance evidence. P1 items may follow launch only when their absence does not compromise essential launch workflows, safety, security, financial integrity, legal obligations, or the approved service scope. Deferred items are outside the initial release and must not be represented as available. The P0 baseline must safely support DEC-018's owner-approved lean launch scope and all reconciled requirements; a domain-level candidate list is not an exhaustive requirement-level priority classification.

A requirement's presence in source, a rendered page, a route, a schema, or a passing type/build check is not proof of launch readiness. Readiness evidence must be appropriate to risk and address functional end-to-end success/failure paths, server-side authorization and privacy, financial correctness and authoritative verification/reconciliation where applicable, operational accountability and physical-event evidence where applicable, and production configuration/deployment/monitoring/backup/recovery/incident/rollback readiness where applicable. Designed, implemented, tested, verified in a production-like environment, and owner-accepted for launch are separate states. Evidence must identify date, environment, scope, and relevant acceptance criterion.

Unverified P0 requirements, launch-affecting security or authorization defects, financial-integrity failures, missing mandatory operational controls, and unavailable critical production/recovery capabilities block release until resolved or covered by a separately approved lawful exception. Exact requirement-level priorities, scenarios/evidence, environment, blocker ownership, exception authority, runbooks, backup/restore proof, monitoring thresholds, incident ownership, and dated sign-off remain open. This policy does not certify current production readiness or authorize implementation.

## Booking-party authority policy reconciliation — DEC-023 / DEC-024

The owner has accepted BP-01–BP-22 in `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`. That record supersedes earlier open-policy wording in Workflow B to the extent it now resolves who may initiate changes/cancellation, how sender/receiver requests are handled, collection authority, transfers, delegated access, privacy, disputes, and appeals.

Workflow B must now carry these accepted rules:
- The authenticated booking party may initiate permitted changes and cancellation before physical intake; price/service changes require an updated quote and customer acceptance.
- Sender/receiver changes require appropriate verification/consent and staff review where identity, collection authority, security, or liability may be affected.
- Sender/receiver requests go through Support; the booking party authorizes the change unless an approved exception is established.
- After physical intake, changes are staff-mediated. Transfers after intake or dispatch require designated Admin review.
- Collection authority is verified independently from booking and payment. Disputed collection instructions place parcel release on hold until authority is established.
- Party notifications, delegated access, deletion, disputes, and appeals follow the BP policy record.

The following remain open specification rather than unanswered owner-policy choices: verification/consent methods; complete change-type and lifecycle matrix; evidence and exception standards; exact transfer/withdrawal financial procedure; delegated-access action catalogue and duration; notification event/field/channel matrix; retention/anonymisation/legal-hold rules; dispute severity/targets, reviewer eligibility, and appeal procedure details. No technical representation or implementation is approved by this reconciliation.


### DEC-040 policy refinement — measurement adjustment and rejection resolution

For Workflow C and Workflow D, apply the following owner-approved refinement:

- At authorized intake, preserve declared and actual measurements separately and use the service's configured measurements/units. A discrepancy below the service's materiality/review criteria leaves accepted commercial terms unchanged; a potentially material or payment-impacting discrepancy enters the adjustment/review path. No universal threshold is approved.
- A proposal links to the original quote/agreement and records changed facts, reason, and revised amount. Required review precedes approval. Proposer authority does not automatically confer approval authority.
- Customer acceptance must be explicit; silence is not acceptance. Acceptance records revised commercial terms, not settlement. A dispute holds the disputed additional charge pending review.
- Rejection triggers an authorized service-resolution decision; it does not automatically cancel, refund, credit, or charge. Possible controlled outcomes are continuation under original terms where safe and commercially feasible, an eligible alternative service with separately accepted pricing, or cancellation under the applicable policy. None is automatic.
- Do not dispatch under a rejected revised price. Dispatch remains subject to accepted commercial terms, verified payment, and all other operational holds.
- Exact service thresholds, authority/eligibility criteria, customer response periods, non-response handling, and runtime acceptance tests remain open. DEC-040 does not approve schema, routes, fields, statuses, permissions, or implementation.


### DEC-041 policy refinement — payment completion and financial resolution

Apply these boundaries to Workflow D (pricing, quote adjustment, and settlement) and Workflow E (payment events and financial reconciliation):

- Preserve both advance online payment and payment at intake, subject to approved service and location configuration. Quote acceptance confirms the booking, not settlement. Advance payment requires authoritative provider/bank/approved-source confirmation; payment at intake uses only a method enabled for the location and follows DEC-028 evidence requirements.
- Electronic payment screenshots, verbal claims, browser redirects, and unsupported staff notes do not establish settlement. Cash collection requires an attributable receipt or equivalent record and must be reconciled. Record payment method, amount, currency, applicable reference/receipt, collecting/recording staff member, location, and time.
- Accept partial payment only where the service explicitly permits it. Record received amount and outstanding amount distinctly. Partial payment does not satisfy the normal dispatch gate by itself. Underpayment and overpayment require authorized resolution; neither is silently discarded, overwritten, or automatically turned into refund/credit. Later payments remain separate linked financial events.
- Pending is not successful; failed attempts remain failed. Retries, duplicate callbacks, and replayed provider events must not duplicate financial effects. A late successful payment is reconciled against its original transaction and does not silently reactivate an expired or cancelled booking/order/shipment.
- Distinguish refund request, approval, initiation, and confirmed execution. Partial refunds require authorization and remain linked to the originating payment. Customer credit is distinct from cash refund and traceable to its origin. Reversals and chargebacks are separate events that preserve the original transaction.
- Reconcile internal records against authoritative provider/bank records and include cash collections in the applicable location reconciliation. Investigate mismatches; never assume success or silently rewrite the original event. Preserve actor, time, reason, reference, and applicable evidence for consequential financial actions.
- Verified full settlement of the amount currently due remains the normal dispatch prerequisite. Partial, pending, failed, or unverified payment does not satisfy it. A DEC-030 exception may operate only under its separately approved eligibility, authority, limit, and evidence policy; it never changes payment status or bypasses unrelated holds.
- No exact service eligibility for partial payments, method/provider catalogue, cash/transaction limits, refund authority/timelines, cancellation fees, credit expiry/use, late-payment disposition, reconciliation cadence/ownership/tolerances, chargeback procedure, or exception categories are established by this refinement. Those remain open for separate specification and approval.
- DEC-041 is business policy only. It does not approve technical data representation, collections, fields, routes, APIs, permissions, payment providers, or implementation.

## Workflow C addendum — DEC-042 physical intake and custody policy

The following owner-approved boundaries refine the proposed sequence and open questions in Workflow C. They do not approve technical states, fields, or contracts.

- Keep intake against an existing confirmed booking distinct from the authorized staff-created walk-in path. Walk-in intake is not staff-assisted customer booking.
- Before each consequential operation, verify active location, explicit service/action capability, parcel and booking/intake identity, and relevant handover authority. A location label, staff login, or Admin status is not a substitute for configured capability and assigned authorization.
- Apply the relevant service-specific inspection and measurement checklist. Preserve declared and actual measurements separately under DEC-027/DEC-040. Capture condition observations and supporting evidence where required by service or dispute; avoid unnecessary photography or personal-data collection.
- Distinguish refusal before custody, accepted custody, and physical receipt retained under a hold. If the location physically possesses a parcel while review is pending, record custody and the hold; the parcel is not thereby eligible for onward processing or dispatch.
- Record physical custody independently from booking confirmation, accepted commercial terms, payment settlement, dispatch, and delivery. Intake/custody does not automatically create cancellation, refund, credit, or payment success.
- Attribute custody to the parcel, relevant handover person, receiving actor, location, time, outcome, and applicable evidence/reason. For an externally performed event, identify the reported source and do not imply personal observation by recording staff.
- Keep DEC-025's lean location record and capability-based approach. Capability changes are attributable/auditable. An inactive location cannot accept new work, but existing parcels in its custody remain accounted for until authorized resolution or transfer.
- Treat each staff, location, carrier, or collection-point handover as a distinct physical event. An attempted handover is not completed custody transfer; preserve previous custody history.
- Missing/damaged parcels, disputed/failed handovers, incorrect location assignment, and prolonged holds require controlled exception handling. No liability, compensation, insurance, or automatic financial outcome is implied.

**Remaining open:** Service-specific inspection/prohibited-item checklist; measurement and conversion detail; identity/acknowledgement/receipt method; evidence and retention; actor/partner authority and second-person approval; capability configuration procedure; hold ownership/review/maximum duration; transfer proof/correction authority; exception resolution; and detailed acceptance tests.

DEC-042 is high-level business policy only. It does not approve technical data representation, status values, fields, collections, endpoints, permissions, or application-code changes.

### Workflow C addendum — location capability and operational authority (DEC-043)

- Before accepting new work, establish that the location is active, explicitly supports the relevant service, and has the distinct capability for the requested action. A location label/type or previously supported service is not sufficient evidence.
- Check the acting staff member's assigned authority independently from the location's configured capability. Both checks are required for each consequential action; one does not imply the other.
- Treat outgoing intake, staff-created walk-in intake, measurement, custody acceptance, payment collection/recording, parcel collection/release, and custody handover as distinct capability boundaries. No action capability automatically grants another.
- Only designated Admin users with the relevant assigned authority may change location capabilities. Location editing, activation/deactivation, capability administration, and staff permission assignment are distinct responsibilities; do not infer unrestricted authority from the Admin label.
- Record capability grants, changes, and revocations as attributable, auditable configuration events. Preserve prior configuration and operational history.
- A capability revocation or location unavailability blocks new work requiring that capability. Parcels already physically held remain accounted for; their custody is not erased or transferred by configuration change. Resolve them through authorized handling or a separately recorded physical transfer.
- External collection-centre, carrier, and driver actors remain distinct from internal staff who record events. No direct partner/driver login is introduced at launch.
- Do not add automated hours, capacity, or availability scheduling to the lean launch location model under this decision.

**Still open:** Approved service/location/action matrix; exact capability catalogue; designated Admin assignment granularity; staff permission scopes; partner arrangements; handling of queued but not yet received work; temporary closure procedures; audit retention; technical contracts and acceptance tests. DEC-043 is policy direction only and does not approve implementation details.



### Workflow C addendum — custody transfers, physical exceptions, and resolution accountability (DEC-044)

This addendum refines physical intake/custody and location operations under DEC-042/DEC-043. It records policy direction only; it does not define executable statuses or technical contracts.

- **Establishing a transfer:** Treat every physical handover between staff, locations, carriers/transport providers, and collection/receiving points as a distinct event. A proposed transfer, route assignment, dispatch authorization, dispatch record, arrival, or attempted handover does not establish that custody changed. The receiving party must actually take possession before the transfer is treated as completed.
- **Transfer attribution:** Capture, as applicable, parcel/shipment, previous custodian/source, intended recipient/destination, actual receiving person/actor, physical handover actor, recording staff member if different, time/location, outcome, evidence/source, and reason. Preserve the complete prior custody history.
- **Incomplete evidence:** If possession physically changed but documentation is incomplete, preserve the known facts and investigate the discrepancy. Do not fabricate a completed-transfer confirmation. If the handover failed or is disputed, retain the last confirmed custody while investigating actual possession.
- **Disputes and corrections:** Preserve each party's account and the original evidence/source. Correct an erroneous record only through a separately attributable and reasoned correction; never silently overwrite the original event. A route or dispatch record cannot resolve a physical-receipt dispute by itself.
- **Missing parcels:** Preserve last confirmed custody, movement and handover history; record discovery time/person/context; establish last confirmed physical location; and preserve available evidence and third-party reports. Do not claim transfer, delivery, or recovery without supporting evidence. Require an authorized, reasoned resolution; do not infer fault or a financial outcome.
- **Damage:** Record discovery time/place, observer/reporter, circumstances, and condition evidence as a distinct exception. Preserve surrounding custody/movement history and distinguish direct observation from third-party reports. The last recorded custodian is not, by itself, proof of causation or liability.
- **Incorrect assignment:** Preserve the original location assignment and record the actual location when established. An administrative correction is not a physical transfer; record any required transfer separately with its own authority and evidence.
- **Prolonged holds:** Keep actual custody, hold reason, and accountable owner identifiable. A hold blocks assumptions of normal onward processing/dispatch. Review intervals, maximum periods, and automatic escalation are not set here.
- **Resolution:** Assign an authorized investigator/decision-maker as required by the applicable policy; preserve evidence and source; record the resolution, authority, reason, and corrections; and do not silently close an unresolved exception. Refunds, credits, compensation, insurance, and liability remain separate decisions under their own policies.

**Still open:** Service-specific proof methods; who may confirm/dispute/correct transfers; second-approver rules; investigation ownership; damage/liability assessment; hold review and maximum periods; customer/financial outcomes; exact statuses, technical contracts, and executable tests. DEC-044 does not authorize implementation.
