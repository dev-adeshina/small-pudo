# VeriLyft Platform Owner Decision Register

**Document status:** D-01–D-15 high-level outcomes, DEC-037–DEC-044 detailed policy refinements, PM-01–PM-12 staff permission policies, and BP-01–BP-22 booking-party authority policies are accepted at their recorded levels. Detailed operational and technical contracts remain open where identified.  
**Last updated:** 31 October 2026  
**Current main baseline:** PR #83 merged at `986f4ad79232ce1700f4edaa972a17522ed319c8`. The current unmerged preparation branch contains a proposed owner decision package; no recommendation in that package is accepted by this register.
**Related documents:** `DECISIONS.md`, `PLATFORM_STAFF_PERMISSION_DECISIONS.md`, `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`, and `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md`, and `PLATFORM_CONSOLIDATED_OWNER_DECISION_PACKAGE.md`  
**Implementation gate:** No application-code changes until the platform-wide SDD is reconciled and explicitly approved.

## 1. Purpose and rules

This register turns the open questions already recorded in `DECISIONS.md`, `ISSUES.md`, `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md`, `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, and `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md` into a dependency-ordered review queue.

It does not replace those domain documents and does not decide policy on the owner's behalf.

- **Confirmed** means already supported by an accepted decision or owner-confirmed launch scope.
- **Recommendation** is a suggested starting point for the owner's consideration, not an accepted rule.
- **Owner decision required** means the SDD must preserve the uncertainty until the owner chooses or explicitly defers the issue.
- **Source verification required** means read-only inspection or runtime evidence is needed; owner preference alone cannot establish what the current application does.
- Record accepted choices in `DECISIONS.md`, then reconcile the affected workflow, lifecycle, acceptance, issue, progress, and handoff documents.
- Do not design concrete collections, fields, endpoints, or new services until the relevant business rule is accepted and reconciled with the existing source.

## 2. Confirmed constraints that must not be reopened implicitly

| Reference | Confirmed constraint | Boundary |
|---|---|---|
| DEC-001–005 | Keep the existing Next.js App Router, TypeScript, Firebase architecture; make focused changes; server remains authoritative for transactional data. | Does not approve any new schema or implementation. |
| DEC-006 | Preserve guest checkout as the current provisional default. | This is not a decision that independent shipment booking must permit guests. |
| DEC-010, DEC-022 | Customer authentication does not grant Admin/staff authorization; the minimal hybrid staff model is accepted. | The action-by-action permission/approval matrix and workflow-specific rules remain open. |
| DEC-012 | Storefront orders and independent shipments are distinct business concepts; shipments can involve multiple transport movements. | Technical representation remains unresolved. |
| DEC-037 | Logistics and independent shipment booking are the primary business; storefront commerce is an attached service. Storefront orders requiring delivery enter the same operational fulfilment system as independently booked shipments. | Reinforces DEC-018's accepted lean launch scope; detailed workflows and technical representation remain open. |
| DEC-014–016 | Admin financial visibility is operational, not full Finance; operational and payment status are distinct; government requests remain basic. | Detailed permissions and evidence rules remain open. |
| DEC-018 | Lean launch scope includes independent shipment booking, advance and staff-created walk-in intake, lean PUDO location management, shared hybrid pricing, advance payment and payment at intake, Operations-reviewed route proposals/assignments, flexible proof of delivery, and controlled failed-delivery resolution. | Scope-level acceptance does not settle the detailed rules below. |
| DEC-018 | Verified payment is the default dispatch prerequisite; exceptions require explicit authorization, approved policy, reason, and audit trail. | Exception eligibility, authority, limits, and evidence remain unresolved. |
| DEC-018 | Driver Portal, advanced route optimization, full fleet management, enterprise workflow engine, and advanced analytics are deferred unless a concrete need justifies them. | Do not expand launch scope without an explicit decision. |
| DEC-019 | Reuse shared hybrid pricing principles, preserve accepted quotes and rate inputs, review material measurement discrepancies, and keep financial adjustments distinct and verified. | Formula, thresholds, methods, and approval limits remain open. |
| DEC-024 | Booking party, sender, receiver/collection recipient, payer, and handover person may differ; payer access defaults to payment confirmation/receipt only; booking/payment alone do not grant collection authority/full shipment-detail access. | Exact verification checkpoints, change-type/lifecycle permissions, consent, collection proof, and notification fields remain open. |
| DEC-021 | Complete and reconcile the platform-wide SDD before application-code changes. | This is a hard working constraint. |
| VLY-007 | Telegram remains deferred; a future paid-order delivery notification must respect the administrator's delivery-assignment approval gate. | Triggers, recipients, fields, retries, and deduplication remain open. |

## 3. Decision order

The order below follows dependencies: authority and booking semantics first; commercial and payment rules next; physical operations and evidence after that; communications and launch acceptance last. The ordering is a planning recommendation, not a priority approval.

### D-01 — Staff responsibility and approval boundaries

- **Status:** Owner decision accepted; recorded as DEC-022 on 29 October 2026.
- **Accepted choice:** Option C — minimal hybrid staff model. Admin and Operations remain distinct responsibilities without automatically requiring separate portals or a separate permission role for every function. Routine actions may be shared when assigned permissions allow. Sensitive actions (including financial adjustments, dispatch exceptions, and restricted disclosures) require explicit permission and approval boundaries; privileged operations must be authorized server-side and consequential actions must be auditable.
- **Still unresolved:** The action-by-action permission matrix, exact second-person approval requirements, role/claim representation, and workflow-specific denial/evidence tests. This decision does not authorize implementation.
- **Dependencies:** D-01 establishes the model for the authorization matrix, staff-facing workflows, and privileged-action acceptance tests.

### D-02 — Independent shipment booking eligibility and account requirements

- **Status:** Owner decision accepted; recorded as DEC-023 on 29 October 2026.
- **Accepted choice:** Option B — registered customers only. A customer must have a registered account and be authenticated before creating an independent shipment booking. Guest shipment booking is outside the initial launch scope.
- **Security invariant:** Booking creation and access must be authorized server-side against the authenticated customer identity. A public page or hidden UI control is not an authorization boundary; a customer may access only bookings for which they have verified entitlement.
- **Refined by DEC-038:** Explicit acceptance of a valid quote by the authenticated booking party confirms the booking; required information is service-specific; business-arranged bookings are permitted when the business and booking party's relationship are identified; and a separate service-specific handover deadline is communicated before acceptance.
- **Still unresolved:** Exact contact/identity verification checkpoints and methods, business identity/relationship representation and multiple-user authority, exact service-specific information fields, quote-validity durations, handover durations, and runtime tests. This decision does not imply email/phone verification beyond requirements explicitly defined elsewhere.
- **Boundary:** Preserve the separate provisional guest-checkout rule for storefront purchases. This decision does not change storefront checkout or decide guest-order recovery/claiming (VLY-004).
- **Dependencies:** Booking workflow, actor model, quote acceptance, cancellation, customer access, and notification requirements.
- **Acceptance direction:** Unauthenticated users cannot create or retrieve customer booking details; an authenticated customer cannot read or alter another customer's booking; booking remains distinct from physical intake and storefront orders.

### D-03 — Booking party, sender, receiver, and payer relationships

- **Status:** Owner decision accepted; recorded as DEC-024 on 29 October 2026.
- **Accepted choice:** The booking party, sender, receiver/collection recipient, payer, and physical handover person may be different parties. One person may occupy multiple roles, but each relationship must be explicit wherever it affects authority, liability, access, notification, payment attribution, intake, or collection.
- **Change authority:** BP-01–BP-05 establish permitted pre-intake booking-party changes/cancellation, sender/receiver requests through Support, and controlled escalation where the booking party is unavailable. Changes after intake are staff-mediated.
- **Payer access:** Payment alone grants the payer payment confirmation/receipt information only by default, not full shipment details. Additional shipment visibility requires a separately approved entitlement and minimum-data rule. Notification recipients and fields follow the party's authorized relationship.
- **Collection authority:** BP-06–BP-08 define receiver verification, booking-party and receiver alternative-collector requests, notification/review requirements, and a hold where collection authority is disputed. Booking or payment alone does not authorize collection.
- **Transfer/delegation/security:** BP-10–BP-17 define accepted transfer, financial-responsibility, withdrawal, legal-representative, delegated-access, and compromised-account policies.
- **Privacy/disputes:** BP-18–BP-22 define deletion/retention boundaries, record disputes, resolution targets, appeals, and restricted further review.
- **Dependencies:** Booking data requirements, identity/consent methods, change-type/lifecycle gates, intake handover, payment attribution, collection evidence, notification fields, dispute procedures, retention, and source/runtime verification.
- **Still unresolved:** Exact verification/consent methods; business identity/relationship representation and multiple-user authority; detailed operational steps and evidence standards; delegated-access catalogue/duration; financial responsibility transfer mechanics; retention/anonymisation rules; dispute severity/targets and reviewer eligibility. Accepted amendment/cancellation and collection-authority policy is recorded in BP-01–BP-22. See `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`. This decision does not authorize a schema or implementation.
- **Acceptance direction:** Tests must distinguish booking-party, sender, receiver, payer, handover-person, collection-person, legal representative, and delegate entitlements; deny access based solely on a booking ID or payment; reject changes outside the approved actor/change/stage policy; and preserve history and financial responsibility.

### D-04 — Staff-created walk-in intake and location capabilities

- **Status:** Owner decision accepted; recorded as DEC-025 on 29 October 2026.
- **Accepted choice:** Use a minimal capability-based location model. Staff capabilities are configured per location rather than inferred from the location label or from a person's authentication/admin status. The initial location record is lean: name, address, active status, and configured capabilities.
- **Launch actions:** Subject to assigned authorization, location staff may create staff-assisted walk-in intake records, measure and record parcel dimensions/weight, accept and record physical custody, collect and record payment with required evidence, and release parcels to recipients whose collection authority has been verified. These are distinct actions; permission to perform one does not automatically grant the others.
- **Accountability:** Consequential intake, measurement, custody, payment, release, and capability/configuration actions must be attributable to the responsible actor, location, and time, with the applicable evidence/reason. Server-side authorization remains mandatory.
- **Boundaries:** A location can perform only explicitly configured services. A registered collection centre is not automatically authorized to accept outgoing parcels or release every parcel. This decision does not define exact staff-role/claim representation, partner system access, required measurement units/thresholds, payment methods/evidence, collection verification, or second-person approval rules.
- **Dependencies:** D-01 staff authorization, D-03 party/collection entitlement, D-05 pricing, D-06 discrepancy review, D-07 payment-at-intake evidence, D-09 dispatch exceptions, D-10 route/movement evidence, and D-12 audit/evidence retention.
- **Acceptance direction:** Reject unauthorized actions and actions at inactive/unsupported locations; keep creation, measurement, custody acceptance, payment recording, and release independently authorized; retain actor/location/time evidence; and deny collection when recipient entitlement is not established.
- **Implementation boundary:** This decision accepts business policy only. It does not authorize a schema, endpoint, permission implementation, or application-code change.

### D-05 — Shared pricing models, inputs, and quote terms

- **Status:** Owner decision accepted at the business-policy level; recorded in DEC-026 and refined on 30 October 2026.
- **Accepted pricing models:** Each service explicitly uses fixed, calculated, or hybrid pricing according to its cost characteristics. A service may combine approved fixed and variable components; not every service needs all three models.
- **Shared rule authority:** Storefront delivery and independent shipment booking share the same approved pricing rule set wherever inputs overlap. No service may invent an ad hoc formula outside the approved catalogue/configuration.
- **Accepted input categories:** Service-applicable inputs may include origin, destination, distance/approved distance band, weight, dimensions, volumetric weight, service class/delivery speed, configured minimum charge, and documented special-handling requirements. Each service declares which inputs apply; exact formulas, sources, units, and any additional categories remain open.
- **Quote lifecycle:** Draft, issued, accepted, rejected, expired, superseded, and cancelled are recognized quote lifecycle outcomes. Customer acceptance is explicit. An unaccepted expired quote requires a fresh quote before proceeding. Quote validity is configured by service and expiry is communicated. DEC-038 resolves that valid quote acceptance by the authenticated booking party confirms the independent booking and that accepted-quote expiry does not silently cancel or rewrite it. A separate service-specific handover deadline is communicated before acceptance and included in booking confirmation.
- **Historical quote preservation:** Preserve accepted inputs, itemized charges, total, currency, and applicable rate/rule version/effective context. Recalculation creates a new quote/revision; later rate changes must not silently mutate prior issued/accepted quotes or completed payments.
- **Commercial separation:** Quote issuance, accepted commercial terms/booking confirmation, payment, and physical intake are distinct facts. Valid quote acceptance by the authenticated booking party is the booking-confirmation event under DEC-038; it is not proof of payment or physical intake.
- **Unknown charges:** Do not assume taxes, surcharges, discounts, or other fees are zero; applicability and treatment remain unresolved.
- **Dependencies:** D-06 measurement/adjustment policy, D-07 payment-at-intake evidence, D-08 financial events/reconciliation, and D-12 audit/evidence retention.
- **Acceptance direction:** Equivalent approved inputs under the same service and rule version produce a reproducible result; a rate update cannot silently change a historical quote; unaccepted expiry requires a fresh quote; and no unapproved fee/tax treatment is invented.
- **Implementation boundary:** Business policy only. Formulae, rates, unit selections, source rules, data representation, UI presentation, and application-code changes remain outside this decision and the platform-wide SDD approval gate.

### D-06 — Measurement standards, discrepancy review, and adjustment approval

- **Status:** Owner decision accepted at the policy level; recorded in DEC-027 and refined on 30 October 2026.
- **Accepted measurement framework:** Use a shared recording framework with service-specific required measurements and explicitly configured units. kg and cm are examples, not universal approved units. Do not silently overwrite, convert, or reinterpret recorded values.
- **Measurement record:** Preserve customer/booking-party-declared measurements separately from actual intake measurements. Actual records identify the responsible actor, location, time, and applicable evidence/reason.
- **Discrepancy policy:** Use configurable, evidence-based, service-appropriate thresholds to distinguish routine variation from material discrepancy. No numeric threshold is approved.
- **Adjustment lifecycle:** A discrepancy may create a proposed adjustment linked to the original quote and accepted agreement. Preserve the original quote and its historical rate/rule context. A proposal is not an approved charge, settled payment, credit, or refund.
- **Review and authority:** Authorized staff may record measurements and propose adjustments within their assigned permissions. Material discrepancies and adjustments affecting an existing payment require review under configured authority. Exact staff limits and second-person approval rules remain unresolved.
- **Customer and financial outcomes:** Notify customers of price-changing adjustments and record the reason/revised amount. Explicit customer acceptance is required before collecting an additional charge. Record accepted, rejected, disputed, withdrawn, pending-review, or unresolved outcomes. A disputed additional charge is held pending review; rejection follows the applicable service-resolution policy and does not itself execute a financial transaction.
- **Still unresolved:** Service-specific measurement requirements/units and conversion rules; numeric thresholds; approval limits and separation of duties; evidence detail; and the operational consequences of adjustment rejection.
- **Dependencies:** D-05 pricing and quote preservation, D-04 intake/location capabilities, D-07 payment-at-intake evidence, D-08 financial events/reconciliation, dispatch gates, customer communications, and D-12 audit/evidence retention.
- **Acceptance direction:** Preserve declared and actual measurements; prevent unauthorized or silent quote mutation; route material discrepancies to required review; require explicit consent before additional collection; and ensure proposed/disputed adjustments are not treated as approved or settled financial events.
- **Implementation boundary:** Business policy only. No schema, endpoint, permission implementation, pricing implementation, or application-code change is authorized.

### D-07 — Supported payment-at-intake methods and evidence

- **Status:** Owner decision accepted; recorded as DEC-028 on 30 October 2026.
- **Accepted choice:** Option A — configured payment methods with evidence-based confirmation. Each location may accept only explicitly enabled methods. Payment records distinguish method and preserve amount, currency, applicable transaction reference/receipt, collecting staff member, location, and time.
- **Verification:** Electronic payments require confirmation from an authoritative provider, bank, or approved reconciliation source; screenshots, verbal claims, and unsupported staff notes are insufficient. Cash requires an attributable receipt or equivalent record and reconciliation.
- **Separation of facts:** Recording payment does not establish physical custody. Booking, payment, and custody remain distinct facts.
- **History:** Failed, reversed, refunded, disputed, and corrected outcomes retain traceable history; no silent overwrite or erasure.
- **Still unresolved:** Exact location-enabled methods/providers, limits, receipt format, cash-handling/reconciliation procedures, second-person controls, method-specific evidence, exception handling, and detailed acceptance tests.
- **Dependencies:** D-01, D-04–D-06, D-08, D-09, D-12, dispatch gates, financial visibility, and reconciliation.
- **Acceptance direction:** Reject methods not enabled for the location; do not mark electronic payments verified without authoritative evidence; retain attributable cash evidence; and never infer custody from payment.
- **Implementation boundary:** Business policy only. No schema, endpoint, provider integration, permission implementation, or application-code change is authorized.


### DEC-029 — Cancellation, late payment, refunds, credits, and reconciliation

- **Date:** 30 October 2026.
- **Decision:** Accepted Option A — explicit financial events with controlled transitions and reconciliation.
- Cancellation of a booking/order/shipment does not itself mean a payment was refunded. Cancellation state and refund state remain distinct.
- A payment received after cancellation or expiry is recorded and reconciled against its original transaction; it does not silently reactivate the cancelled booking/order/shipment.
- A refund request and an executed refund are distinct. Refund initiation and approval must follow authorized controls and retain reason and applicable evidence; exact approval limits remain unresolved.
- Quote/adjustment outcomes remain distinct from financial settlement: rejected quotes create no payment obligation from that quote; accepted adjustments record the revised commercial agreement and any additional amount due; disputed additional charges remain held pending review; overpayments and underpayments require authorized resolution; and failed attempts are not successful settlement. Adjustment rejection does not automatically create a refund, credit, cancellation, or charge.
- Customer credit is distinct from a cash refund and must remain traceable to its originating transaction. Additional payments are separate events and must not overwrite the original payment.
- Reversals and chargebacks preserve the original transaction/event history and record their own outcomes.
- Reconcile internal payment records against authoritative provider/bank records. Mismatches require investigation rather than an assumed success or silent correction.
- Consequential financial actions retain actor, timestamp, reason, transaction/reference, and applicable evidence. Duplicate or replayed provider events must not create duplicate financial effects.
- Operational order/shipment status, cancellation status, payment status, and refund status remain separate. Verified payment does not by itself authorize dispatch; the DEC-018 default dispatch gate and authorized, reasoned, auditable exception policy remain in force.
- **Still unresolved:** Refund approval limits and separation of duties; refund timelines; cancellation fees; partial-refund policy; credit expiry/use rules; late-payment disposition; reconciliation frequency and exception ownership; and detailed evidence and acceptance tests.
- **Implementation boundary:** Business policy only. No schema, endpoint, provider integration, permission implementation, or application-code change is authorized.

### D-09 — Dispatch exception authority

- **Status:** Owner decision accepted at the high-level policy level; recorded as DEC-030 on 30 October 2026.
- **Accepted choice:** Option A — narrow, controlled dispatch exceptions. Verified payment remains the default dispatch prerequisite. Exceptions are permitted only for explicitly defined operational circumstances under an approved policy; they are not a generic convenience override or unrestricted staff discretion.
- **Authorization boundary:** Only staff with explicitly assigned dispatch-exception permission may approve an exception. The requester must not automatically approve their own request. Material exceptions require a second approver; which circumstances are material and the exact separation-of-duties rules remain unresolved.
- **State and hold integrity:** An exception never changes payment status or represents an unverified payment as successful. It cannot bypass unrelated safety, custody, identity, legal, or other operational holds.
- **Evidence:** Preserve the affected parcel/shipment, reason, requesting actor, approving actor(s), timestamp, supporting evidence, and decision/outcome.
- **Still unresolved:** Eligible circumstances; exact staff responsibility/permission assignment; which cases require two-person approval; monetary or operational limits; category-specific mandatory evidence; and whether an approval may be revoked before dispatch.
- **Dependencies:** D-01, D-07–D-08, route assignment, handover evidence, and audit.
- **Acceptance direction:** Keep normal dispatch blocked when payment is unverified; deny generic or unauthorized overrides; prevent self-approval; require second approval for material exceptions once defined; preserve payment state and unrelated holds; and retain attributable evidence.
- **Implementation boundary:** Business policy only. No schema, endpoint, permission implementation, or application-code change is authorized.

### D-10 — Routing, route-leg assignment, and movement evidence

- **Status:** Owner decision accepted at the high-level policy level; recorded as DEC-031 on 30 October 2026.
- **Accepted choice:** Option A — controlled, evidence-based movement. Keep route proposal, route approval, route-leg assignment, dispatch, physical handover, and arrival confirmation as distinct concepts and events. A proposal or assignment is not proof that physical movement occurred.
- **Authority and change history:** Operations manages route proposals and route-leg assignments at launch. Approval, alteration, revocation, and reassignment must be performed by staff with explicitly assigned authority under the staff permission model. Assignment changes must preserve prior decisions and identify the responsible actor and reason. Exact permission assignments and any two-person approval requirements remain unresolved.
- **Movement evidence:** Record movement milestones with enough attributable context to identify the shipment/parcel, relevant route leg, event type, location, responsible physical actor where known, recording actor, timestamp, and supporting evidence appropriate to the event. Where staff record an event on behalf of a provider/driver, distinguish the person who performed or reported the physical action from the staff member who entered the record.
- **Physical truth and exceptions:** Do not infer dispatch, handover, or arrival from a proposal or assignment. Delays, missed handovers, missing parcels, damage, disputed custody transfers, and other movement exceptions must be recorded as exceptions for investigation/resolution, not silently represented as successful movement.
- **Launch boundary:** Operations continues to manage assignments and record milestones through the staff workflow; Driver Portal remains deferred. This decision does not grant providers/drivers direct platform access.
- **Still unresolved:** Mandatory route-planning inputs and constraints; exact approval/alteration/revocation/reassignment permissions; whether any actions require two-person approval; mandatory milestones and event-specific evidence; provider/resource and capacity rules; correction authority; and detailed delay/loss/damage/dispute resolution and acceptance tests.
- **Dependencies:** D-01 staff authority, D-04 location capabilities, D-09 dispatch exceptions, shipment eligibility, custody, delivery, and D-12 audit/evidence retention.
- **Acceptance direction:** A proposed route cannot authorize dispatch; assignment cannot prove physical movement; movement events must be attributable to the correct shipment and leg; staff-entered third-party events distinguish physical actor from recorder; assignment history remains traceable; and exceptions cannot be silently closed as successful movement.
- **Implementation boundary:** Business policy only. No schema, endpoint, permission implementation, provider integration, or application-code change is authorized.

### D-11 — Delivery proof and failed-delivery resolution

- **Status:** Owner decision accepted at the high-level policy level; recorded as DEC-032 on 30 October 2026.
- **Accepted choice:** Option A — evidence-based delivery with controlled outcomes. Distinguish delivery attempt, successful delivery, failed delivery, customer collection, and return. Successful delivery requires approved evidence appropriate to the service; a staff status update alone is insufficient.
- **Recipient authority:** Verify that the receiving person is authorized. Sender, payer, booking customer, and receiver are not interchangeable by default; preserve DEC-024's party/access boundaries.
- **Flexible evidence:** Proof methods may vary by service. Recipient confirmation, OTP, signed acknowledgement, and attributable staff evidence are examples, not universally mandated methods.
- **Failed delivery and resolution:** Record failed attempts and reasons distinctly. Reattempt, return, holding, refusal, cancellation, and financial adjustment require an explicitly authorized resolution procedure; no outcome follows automatically from a failed attempt.
- **Communication and disputes:** Notify relevant parties of significant outcomes using only information they are authorized to receive. Preserve original evidence and event history when a delivery is disputed.
- **Still unresolved:** Mandatory proof methods by service; OTP requirement; attempt limits; authority for reattempt, return, holding, refusal, cancellation, and financial adjustments; holding duration; failure-reason catalogue; loss/damage/refusal/dispute handling; customer-contact details; and detailed acceptance tests.
- **Dependencies:** D-01, D-03, D-04, D-08, D-10, D-12, privacy/retention rules, and customer notifications.
- **Implementation boundary:** Business policy only. No schema, endpoint, permission implementation, notification integration, or application-code change is authorized.

### D-12 — Audit, evidence retention, correction, and disclosure

- **Status:** High-level owner policy accepted on 30 October 2026 as DEC-033 (Option A: accountable, evidence-based recordkeeping).
- **Accepted policy:** Maintain an explainable, attributable history of consequential actions across customer access, staff permissions/capabilities, booking, intake, measurement, custody, payment, refunds/credits/adjustments, dispatch, routing/movement, delivery/returns, overrides, and sensitive disclosures. The exact event catalogue and evidence requirements by action remain to be specified.
- **Attribution:** Audit records should identify the responsible actor, action, affected resource, timestamp, reason where applicable, and relevant supporting evidence. Distinguish the actor performing a physical action from a staff member recording it on their behalf. An audit entry or status change alone does not prove that a physical event occurred.
- **History and correction:** Do not silently overwrite or erase consequential records or original evidence. Corrections should be separately attributable and traceable to the original record, preserving the original value/evidence where appropriate. Define controlled redaction where necessary; a correction must not disguise the original event.
- **Retention and deletion:** Apply retention rules appropriate to record category, sensitivity, and legitimate operational/legal purpose. Define deletion or anonymization when retention is no longer justified. Do not retain personal information indefinitely without a valid purpose. Records subject to an applicable legal hold must not be routinely deleted. Exact periods, triggers, and procedures remain unresolved.
- **Access and review:** Restrict audit records and supporting evidence to explicitly authorized reviewers; administrator status alone does not imply unrestricted access. Under PM-08, viewing, exporting and approving external disclosure are separate permissions. Access to sensitive records/evidence, exports and disclosures must themselves be attributable and auditable. Specific reviewer-to-permission assignments and second-person approval requirements remain unresolved.
- **Government requests:** Keep government-request handling limited and controlled, separate from privileged platform access. Record the requesting authority, request and stated legal basis, requested scope, authorized review/approval, and what information was disclosed, to whom, when, and by whom. A request does not grant unrestricted platform or administrative access.
- **Evidence integrity:** Preserve relevant original evidence and its history for authorized investigation and dispute review. Evidence should be attributable to its source; later additions, corrections, or redactions must remain distinguishable. A log is not a substitute for evidence that a physical event occurred.
- **Still unresolved:** Exact retention periods by category; full audit event catalogue and evidence requirements; reviewer/access responsibility matrix; two-person approval cases; deletion/anonymization procedures; legal-hold activation/release authority; detailed government-request review and disclosure procedure; evidence integrity/verification requirements; and detailed acceptance tests.
- **Dependencies:** D-01 staff authority and all financial, customer-access, booking, intake, custody, dispatch, routing, delivery, override, notification, and disclosure workflows.
- **Acceptance direction:** Consequential actions are attributable; original records/evidence remain distinguishable from corrections; audit viewing, exporting and external disclosure are separately authorized and auditable under PM-08; retention/deletion respects defined purpose and legal holds; government requests do not confer unrestricted platform access; and audit entries are not treated as independent proof of physical events.
- **Implementation boundary:** Business policy only. No schema, endpoint, audit-log implementation, retention job, permission implementation, disclosure integration, or application-code change is authorized. The platform-wide SDD approval gate remains in force.

### D-13 — Customer notifications and Telegram boundary

- **Status:** Owner decision accepted on 30 October 2026 as DEC-034 (Option A: controlled, event-driven notifications with role-based information access).
- **Accepted policy:** Notifications are triggered by meaningful, verified business events. Notification delivery is a communication side effect only; queued, sent, accepted, delivered, read, retried, or failed notification states must not change or independently establish order, payment, shipment, dispatch, custody, or delivery state.
- **Recipient eligibility:** Determine recipients from the person's explicitly established relationship and entitlement for the event, consistent with DEC-024 and DEC-032. Booking customer, sender, receiver/collection recipient, and payer may be different people. A payer receives relevant payment confirmation/receipt, refund, and financial outcome information by default, not full shipment details merely because they paid. Other parties receive only updates relevant to their authorized relationship.
- **Minimum disclosure:** Each message contains only the minimum information necessary for its recipient and purpose. Do not expose private sender, receiver, address, parcel, or shipment details to a party without an applicable entitlement. Where further detail is needed, direct the recipient to an appropriately authenticated platform experience; the link itself must not bypass access controls.
- **Channel boundary:** Use email as the primary customer notification channel where configured. SMS is optional and requires explicit channel/provider configuration and applicable consent/contact verification. In-platform notifications may serve authenticated customer and staff experiences. Do not assume every event is sent through every channel. Telegram remains deferred; no Telegram notification is authorized merely by payment success or by this decision.
- **Telegram assignment gate:** Any future paid-order delivery notification through Telegram must remain behind the authorized Admin approval action **Assign For Delivery**. That approval is a necessary gate, not proof of physical dispatch, custody transfer, or delivery. Telegram use also requires a separately approved purpose, audience, recipient/field policy, and channel configuration before implementation.
- **Deduplication and recovery:** Prevent duplicate sends for the same business event, intended recipient, and channel. Use bounded retries for transient failures and preserve attributable attempt/outcome information. A provider accepting a message is not proof that the intended person received or read it. Persistent failures must be visible for operational follow-up; fallback channels must not be assumed or silently substituted.
- **Still unresolved:** Final event catalogue and timing; mandatory versus optional event/channel combinations; customer preferences, consent, and contact verification; exact message templates and field matrix; retry limits/intervals; deduplication key and retention semantics; ownership/escalation for persistent failures; notification record retention; and detailed acceptance tests. Telegram's eventual audience and purpose remain deferred.
- **Dependencies:** DEC-024 party/access boundaries; D-02–D-03 booking and customer access; D-05–D-12 pricing, financial, operational, delivery, and audit policies; guest-order recovery; and channel/provider source verification.
- **Acceptance direction:** Only verified business events trigger notifications; recipients and fields follow role-based entitlements; payer notices do not disclose full shipment details by default; duplicate/replayed events do not produce uncontrolled duplicate notifications; delivery failures do not mutate business state; and Telegram paid-order notifications cannot precede authorized Admin assignment approval.
- **Implementation boundary:** Business policy only. No schema, endpoint, notification provider, channel integration, message template, permission implementation, deployed configuration, or application-code change is authorized. The platform-wide SDD approval gate remains in force.

### D-14 — Guest-order recovery and claiming

- **Status:** Owner decision accepted on 30 October 2026 as DEC-035 (Option A — secure guest-order recovery and optional account claiming).
- **Accepted scope:** Preserve storefront guest checkout. Support a secure recovery path for a guest customer who loses the original order-access credential, and allow optional claiming of an eligible guest order by a signed-in customer. Recovery and account claiming are distinct operations and must not be conflated.
- **Guest-order recovery:** A customer must prove control of the original checkout email address through a verification challenge delivered to that address before receiving a replacement order-access credential. The order reference and email address alone are not proof. Successful recovery issues a replacement credential under a controlled expiry/revocation policy; prior credentials must be invalidated or rotated so they cannot continue to authorize access. The exact challenge form and credential lifetime remain unresolved.
- **Optional account claiming:** A signed-in customer may request to associate an eligible guest order with their account only after completing a separate proof-of-ownership challenge tied to the original checkout email. The server verifies the authenticated account and order entitlement, checks that the order has not already been claimed, and records the association as an attributable action. A matching account email, order reference, possession of an unrelated session, or payment alone does not independently prove entitlement.
- **Ownership and transfer:** An order must not be claimed by multiple accounts or silently transferred after claiming. Any exceptional transfer or support-assisted recovery requires a separately approved verification, authorization, and audit procedure; no manual override is implied by this decision.
- **Security and privacy:** Recovery/claim challenges must be time-limited, protected against replay and abuse, and designed so failure responses do not disclose whether an order exists. Recovery credentials must not be exposed in logs or notification content beyond the secure recovery mechanism. All authorization and association decisions are server-side. Claiming/recovery must not alter payment, cancellation, fulfilment, shipment, or delivery state.
- **Still unresolved:** Verification-link versus one-time-code format; challenge and replacement-token lifetimes; request/rate limits and abuse controls; eligibility after fulfilment/delivery; account deletion/closure consequences; exceptional transfer/support-assisted procedure; credential storage/rotation mechanics; notification templates; retention; and detailed denial, replay, and cross-account acceptance tests.
- **Dependencies:** DEC-023 guest-checkout boundary; DEC-024 party/access entitlements; DEC-033 audit/evidence controls; DEC-034 notification policy; customer authentication/account model; existing guest access-token lifecycle; and VLY-004 source/runtime verification.
- **Acceptance direction:** Order ID or email match alone never grants access; lost-token recovery requires proof of control of the original checkout email; claiming requires authenticated account context plus a separate ownership challenge; an order is associated with at most one account unless an explicitly approved transfer policy later says otherwise; challenges expire and resist replay/abuse; failures do not disclose order existence; and recovery/claiming never mutates commercial or fulfilment state.
- **Implementation boundary:** Business policy only. No schema, endpoint, token format, email template, provider integration, permission implementation, support override, or application-code change is authorized. The platform-wide SDD approval gate remains in force.

### D-15 — Launch priority and production-readiness evidence

- **Status:** Owner decision accepted on 30 October 2026 as DEC-036 (Option A — evidence-based launch with a clearly bounded P0 scope).
- **Accepted approach:** Establish an explicit P0/P1/deferred baseline for the initial release. P0 requirements are launch blockers and require demonstrable acceptance evidence. P1 items are important but may follow launch only where their absence does not compromise an essential launch workflow, safety, security, financial integrity, legal obligations, or the approved service scope. Deferred items are excluded from the initial release and must not be represented as available.
- **P0 decision rule:** The initial release must safely support the owner-approved lean launch scope in DEC-018 and the reconciled platform requirements. Candidate P0 domains include customer storefront and account access; guest checkout/order access plus DEC-035 recovery/claiming policy; payment verification and financial event integrity; order and shipment booking/intake; staff authorization; location capabilities; pricing/quotes and measurement adjustment controls; dispatch, routing/movement, delivery and exception evidence required by the launch services; customer notifications under DEC-034; audit/evidence controls; customer-data security; and production operations. This is a domain-level launch baseline, not proof that every detailed requirement is specified, implemented, or verified. Each requirement must be traced to an explicit acceptance criterion and evidence item before final sign-off.
- **P1/deferred boundary:** Advanced route optimization, full fleet management, Driver Portal, enterprise workflow engine, and advanced analytics remain deferred under DEC-018 unless the owner explicitly changes scope. Other capabilities may be P1 only after confirming their absence does not undermine P0 safety, security, financial integrity, legal obligations, or essential workflows. Do not silently reclassify an existing accepted launch requirement as P1/deferred.
- **Readiness evidence:** A P0 item is not launch-ready merely because a page, route, component, schema, or source implementation exists, or because TypeScript/build checks pass. Evidence must be appropriate to the requirement and cover: (1) functional end-to-end behaviour and success/failure paths; (2) security and server-side authorization/privacy; (3) financial correctness and authoritative verification/replay/reconciliation where applicable; (4) operational accountability, custody/movement/delivery evidence and exception handling where applicable; and (5) production configuration, deployment, monitoring, backup/recovery, incident response, and rollback readiness where applicable.
- **Readiness states:** Keep designed, implemented, tested, verified in a production-like environment, and owner-accepted for launch as distinct states. Evidence must be dated, attributable, reproducible where practical, and linked to the relevant requirement/acceptance criterion. A test result must state its environment and scope; untested or unverified items remain open.
- **Release blockers:** Any unverified P0 requirement, unresolved security/authorization defect affecting launch, financial-integrity failure, missing mandatory operational control, or unavailable critical production/recovery capability blocks release until resolved or explicitly handled through a separately approved and lawful exception. A passing build or successful happy-path demonstration does not override a blocker.
- **Still unresolved:** The complete requirement-level P0/P1/deferred classification; exact acceptance scenarios and evidence artifacts for every P0 item; production-like environment definition; release-blocker ownership and exception authority; deployment/rollback runbook; backup/restore proof; monitoring/alert thresholds; incident response ownership; and final dated release checklist/sign-off.
- **Dependencies:** DEC-018 launch scope; DEC-021 platform-wide SDD approval gate; DEC-022–DEC-035 accepted owner policies; all domain requirements, cross-domain acceptance criteria, source traceability, runtime evidence, and operational ownership.
- **Acceptance direction:** No P0 requirement is launch-ready without demonstrable evidence appropriate to its risk; source presence/build success alone is insufficient; P1/deferred items are explicitly listed; launch blockers are visible and owned; and the owner explicitly accepts the reconciled release baseline before launch.
- **Implementation boundary:** This decision accepts launch-governance policy and a domain-level priority direction only. It does not certify the current application as production-ready, mark individual requirements complete, approve an exhaustive P0 matrix, or authorize application-code changes. The complete platform-wide SDD must still be reconciled and explicitly approved.

## 4. How decisions become authoritative

For each D-01–D-15 item:

1. The owner selects an option, provides a different rule, or explicitly defers the decision.
2. Record the accepted outcome in `DECISIONS.md` with date, rationale, status, and affected domains.
3. Update the relevant actor/workflow/lifecycle/acceptance document and any affected entry in `ISSUES.md`.
4. Check compatibility with current source read-only; record mismatches without treating existing code as approval.
5. Define acceptance scenarios with initial state, actor, action/event, expected state/result, unchanged data, failure/replay outcome, audit evidence, and safe test environment.
6. Reconcile `README.md`, `PROGRESS.md`, and `SESSION_HANDOFF.md` before declaring the platform SDD ready.
7. Obtain explicit owner approval of the complete reconciled SDD before implementation work begins.

## 5. Current status after D-15 acceptance

All 15 owner-decision slots (D-01–D-15) now have high-level owner outcomes recorded. This closes the current owner-decision queue only; it does not mean the platform-wide SDD is complete, every requirement is specified, the application is implemented, or launch readiness has been demonstrated. Continue with full-document reconciliation, read-only source traceability, requirement-level priority classification, acceptance-scenario definition, and evidence planning. Obtain explicit owner approval of the complete reconciled SDD before any application-code changes.

**No decision in this register is approved merely by appearing here.**


## 6. Additional owner-accepted detailed policy — DEC-038

DEC-038 records the owner's approval of the independent shipment booking confirmation, information, lifecycle, and responsibility policy. It refines DEC-018, DEC-023, DEC-024, DEC-026, DEC-027, DEC-029, DEC-033, DEC-034, DEC-037, and BP-01–BP-22; it does not create or reopen a D-01–D-15 decision slot.

Accepted:
- Explicit acceptance of a valid quotation by the authenticated booking party confirms the independent shipment booking and accepted commercial terms.
- Booking information is service-specific and proportionate: origin, destination, selected service, parcel description, and only necessary eligibility/pricing inputs.
- Booking party, sender, receiver/collection recipient, payer, and physical handover person may differ.
- A registered customer may arrange a business shipment, identifying the business and their relationship, without assuming a separate business-account system at launch.
- Payment, physical intake/custody, and logistics fulfilment remain distinct from booking confirmation.
- Unaccepted quote expiry requires a fresh quote; accepted quote expiry does not silently cancel or rewrite the confirmed booking.
- Each service has a separately configured handover period/deadline, communicated before acceptance and included in booking confirmation. Missing the deadline may result in an unfulfilled outcome while preserving booking/payment/audit history; financial resolution is separate.
- Pre-intake booking-party changes/cancellation and post-intake staff-mediated handling follow BP-01–BP-05 and the relevant authority policies.
- Support, Operations, Admin, staff-assisted booking, walk-in intake, and external actors retain the responsibility boundaries recorded in DEC-038.

Still unresolved:
- Service-specific handover durations/configuration; service eligibility/capacity; quote validity and pricing detail; business identity/relationship representation; identity/contact/consent verification; payment-at-intake and late-payment rules; booking reference and status vocabulary; missed-handover/refused-intake financial and service outcomes; complete permissions, data/API contracts, evidence, and acceptance tests.

DEC-038 is business policy only. It does not approve implementation, schemas, fields, APIs, routes, status enums, identity providers, permission claims, or code changes. The complete platform-wide SDD must still be reconciled and explicitly approved before application-code work.

## 7. Additional owner-accepted detailed policy — DEC-039

DEC-039 records the owner's approval of the pricing input and calculation boundaries. It refines DEC-019 and DEC-026 without reopening D-05 or approving actual rates/formulas.

Accepted:
- Each service uses only its explicitly approved fixed, calculated, or hybrid pricing model and configured inputs; there is no universal formula or mandatory universal input set.
- Potential inputs are service-configured and may include origin/destination, distance or approved distance band, weight, dimensions/volumetric weight, service class/delivery speed, configured minimum charge, and documented special handling.
- The customer/browser may supply declared inputs but cannot determine or authoritatively submit the final price. Trusted server-side validation/calculation applies approved service configuration. Staff-assisted pricing uses the same rule authority and cannot invent ad hoc formulas or charges.
- Quotes transparently present applicable charge components and total. Taxes, surcharges, discounts, and other fees are not silently presumed zero or silently added; service-specific treatment must be specified.
- Issued/accepted quote inputs, itemized charges, total, currency, pricing-rule/rate version, and effective context remain historically preserved. Later rate changes do not silently alter an existing quote, accepted agreement, or completed payment.

Still unresolved: exact rates/formulas; units/conversions; distance source/bands; rounding; effective dates; service-to-input mapping; tax/fee/discount applicability and calculation; minimums; special-handling rates; quote validity; and associated executable acceptance tests.

DEC-039 is business policy only. It does not approve pricing tables, configuration formats, fields, collections, routes, APIs, permissions, provider choices, or application-code changes. The complete platform-wide SDD approval gate remains in force.


### D-06 refinement — DEC-040 (30 October 2026)

The owner approved the following additional policy boundaries:

- If actual measurements do not meet the service's configured materiality/review criteria, retain the accepted commercial terms. Potentially material/payment-impacting discrepancies enter controlled review.
- A proposed adjustment preserves and links to the original quote/agreement; the proposal records changed facts, reason, and revised amount. Required review precedes approval; proposer authority does not automatically confer approval authority.
- Customer acceptance must be explicit; silence is not acceptance. Acceptance records revised commercial terms, not settlement. A dispute holds the disputed additional charge pending review.
- Rejection triggers an authorized service-resolution decision, not automatic cancellation, refund, credit, or charge. Possible controlled outcomes include safe/commercially feasible continuation under original terms, a separately accepted eligible alternative service, or cancellation under the applicable policy.
- Dispatch cannot proceed under a rejected revised price.
- **Still open:** Exact thresholds, units/conversion, evidence, approval limits/separation of duties, service-resolution authority and eligibility, customer response periods/non-response handling, and detailed acceptance tests. No technical implementation is authorized.


### D-07 / D-08 refinement — DEC-041 (30 October 2026)

The owner approved the following payment and financial-resolution boundaries, refining but not replacing DEC-018, DEC-028, DEC-029, and DEC-030:

- Both advance online payment and payment at intake remain in launch scope, subject to service/location configuration. Quote acceptance confirms booking, not payment. Electronic settlement requires authoritative confirmation; payment at intake uses only location-enabled methods and DEC-028 evidence requirements.
- Screenshots, verbal claims, browser redirects, and unsupported staff notes are not proof of electronic settlement. Cash requires attributable receipt/equivalent evidence and reconciliation.
- Partial payment is allowed only where a service explicitly permits it. Record amount received and amount outstanding distinctly; partial payment does not satisfy the normal dispatch gate by itself. Underpayment/overpayment require authorized resolution; additional payments remain separate linked events.
- Pending and failed attempts are not settlement. Retries and replayed events must not duplicate financial effects. Late success is recorded against its original transaction and does not reactivate a cancelled/expired booking automatically.
- Refund request, approval, initiation, and confirmed execution are distinct. Partial refunds are authorized, traceable outcomes. Customer credit is distinct from cash refund. Reversals and chargebacks preserve original transaction history.
- Reconciliation covers authoritative provider/bank records and applicable location cash collections. Mismatches require investigation and attributable resolution; no silent correction.
- Verified full settlement of the amount currently due remains the normal dispatch prerequisite. Partial, pending, failed, or unverified payment does not satisfy it. DEC-030 exceptions do not change payment status or bypass unrelated holds.

**Still open:** Service eligibility and conditions for partial payment; enabled methods/providers and transaction/cash limits; evidence/receipt details; refund approval limits, separation of duties, timelines and partial-refund eligibility; cancellation fees; credit expiry/use/transfer; late-payment disposition; reconciliation frequency, ownership, tolerances, escalation and cash handling; chargeback procedure; DEC-030 eligible circumstances/limits/evidence; and detailed acceptance tests.

DEC-041 is high-level business policy only. No technical representation, schema, fields, collections, endpoints, permission implementation, provider choice, or application-code change is approved.

## Additional owner-accepted detailed policy — DEC-042

### Physical intake, custody, and location accountability

The owner approved DEC-042 on 30 October 2026.

- Advance-booked intake and staff-created walk-in intake remain distinct; staff must not impersonate a customer or accept a quotation without approved authority.
- Consequential physical actions require an active location with the explicitly configured capability and an actor with assigned authorization. Location labels, login, and Admin status do not imply capability.
- Distinguish refusal before custody, accepted custody, and physical receipt retained under a hold. If a parcel is physically possessed during review, custody and the hold must be recorded; a hold does not authorize onward processing or dispatch.
- Keep physical custody separate from booking, accepted commercial terms, payment, dispatch, and delivery. DEC-040 governs measurement adjustments; DEC-041 governs payment/settlement.
- Apply service-specific inspection and evidence requirements; preserve declared/actual measurements separately. Avoid unnecessary photography and personal-data collection.
- Attribute custody events and transfers to parcel, relevant handover/receiving actors, location, time, outcome, and applicable evidence/reason. Identify external event sources when staff record events they did not personally witness.
- Preserve DEC-025's lean location model and distinct action capabilities. Deactivation prevents new work but must not make parcels already in custody unaccounted for.
- Each physical handover is a distinct event; attempted transfer is not completed transfer. Preserve previous custody history.
- Missing/damaged parcels, disputed/failed handovers, incorrect assignments, and prolonged holds require controlled exception handling.

**Still unresolved:** Service-specific checklists, prohibited-item rules, measurement units/conversions, identity/acknowledgement/receipt methods, evidence retention, staff/partner authority and second-person approval, capability assignment, hold ownership/review periods, transfer proof/correction authority, exception resolution, liability/compensation/insurance, technical contracts, and executable acceptance tests.

DEC-042 records business policy only; it does not approve a schema, fields, collections, endpoints, status vocabulary, permission implementation, or application-code change.

## Additional owner-accepted detailed policy — DEC-043

### PUDO location capabilities and operational authority

The owner approved DEC-043 on 30 October 2026.

- Locations must be explicitly configured for the relevant service and requested operational action. Capabilities are independent; outgoing intake, walk-in intake creation, measurement, custody acceptance, payment collection/recording, parcel collection/release, and custody handover do not imply one another.
- Location capability and staff authorization are separate checks. The location must support the action, and the actor must independently have assigned authority for that action and scope.
- Designated Admin users configure capabilities only within assigned authority. Location editing, activation/deactivation, capability administration, and staff permission assignment are distinct responsibilities; Admin status alone is not unrestricted authority.
- Capability changes are attributable and auditable. Revocation/unavailability blocks new work but does not erase or abandon parcels already in custody or silently transfer responsibility.
- Preserve the no-direct-login launch boundary for external collection-centre operators, carriers, and drivers; distinguish physical actors from internal staff recording events.
- Keep the lean DEC-025 location model. Automated hours, capacity calculations, and availability scheduling are not introduced by this decision.

**Still unresolved:** Service/location/action matrix, exact capability catalogue, designated Admin assignment granularity, staff permission scopes, partner arrangements, queued-work treatment, temporary closure procedure, audit retention, technical contracts, and executable acceptance tests.

DEC-043 is high-level business policy only; it does not approve schema, fields, collections, endpoints, status values, permission implementation, or application-code changes.



## Additional owner-accepted detailed policy — DEC-044

### Custody transfers, physical exceptions, and resolution accountability

The owner approved DEC-044 on 30 October 2026.

- A physical handover is a distinct event. Proposed transfers, route assignments, dispatch authorizations/records, arrivals, and attempted handovers do not establish completed physical transfer or automatically change the recorded custodian.
- Completion requires actual physical handover and receipt of possession by the receiving party. Capture the applicable source/previous custodian, intended destination/recipient, actual receiver, physical handover actor, recording staff member when different, time/location, outcome, evidence/source, and reason. Preserve prior custody history.
- Failed, disputed, and incompletely documented handovers remain distinct from completed transfers. Preserve last confirmed custody and competing evidence. If physical possession changed despite incomplete records, investigate rather than invent confirmation.
- Missing parcels require a controlled investigation preserving last confirmed custody/location, movement history, discovery context, and available evidence/third-party reports. Do not claim transfer, delivery, or recovery without supporting evidence; require authorized reasoned resolution.
- Damage is a distinct exception with discovery time/place, observer/reporter, circumstances, and condition evidence. Preserve surrounding custody history. Last recorded custody alone does not establish fault or causation.
- Incorrect location assignments preserve the original assignment and separately record established actual location. Administrative correction is not physical transfer.
- Prolonged holds retain identifiable actual custody, reason, and accountable owner; holds do not imply normal onward-processing or dispatch permission.
- Exception investigation and closure require attributable ownership and an authorized reasoned resolution. Preserve original evidence and records; corrections are separately traceable; unresolved exceptions are not silently closed.
- Physical exceptions do not automatically determine liability, refund, credit, compensation, insurance, or customer entitlement. Those remain separate policy decisions.

**Still unresolved:** Service-specific proof methods; who may confirm/dispute/correct transfers; second-approver requirements; missing-parcel investigation ownership; damage assessment/liability procedures; hold ownership/review/maximum periods; compensation/insurance/refund/credit/customer entitlements; detailed lifecycle and technical contracts; evidence retention; and executable acceptance tests.

DEC-044 is high-level business policy only. It does not approve a schema, field, collection, endpoint, status enum, proof technology, permission implementation, automatic escalation, financial outcome, or application-code change.



## Owner-approved SDD closure direction — Reviews 1 and 2 — 31 October 2026

The owner approved the five-review closure process and the consolidated policy direction for completing the SDD. This approval is not a new DEC decision family and does not amend the accepted decision records. Preserve accepted decisions; reconcile their operational and technical implications across the SDD; use service-specific configurable commercial and operational rules; keep Support and staff authority bounded; require evidence for physical and consequential actions; and make production release evidence-gated.

Exact rates/formulas, units and thresholds, quote/handover durations, payment/refund/credit tolerances, service-specific proof methods, approval thresholds, retention periods, and operational/recovery targets remain deliberately deferred until their governing context is established. These should remain visible as open specifications with accountable owners, configuration boundaries, dependencies, and acceptance evidence. Do not invent values or technical representation to force closure.

The next consolidated owner checkpoint is Review 3 — technical design and architecture. Reviews 4 and 5 remain reserved for complete SDD/acceptance specification review and final consistency/implementation-gate approval.


## 10. Consolidated owner decision proposals — pending, not accepted

The document `PLATFORM_CONSOLIDATED_OWNER_DECISION_PACKAGE.md` groups the remaining owner-dependent choices into five review packages and proposes a conservative minimum-launch baseline for DB-01–DB-12, staff/operational authority, evidence/disclosure and production accountability.

**Status: Prepared for consolidated owner review; no proposal has been accepted by this register.** The owner's instruction to prepare the package is not approval of its contents. Preserve the accepted decisions above. Do not treat proposed booking/parcel/route-leg cardinality, quote/payment allocation, business representation, location operating scope, evidence rules, notification matrix or accountability recommendations as approved policy or an approved data model.

At the consolidated owner review, each proposal must be explicitly accepted, rejected in favour of an alternative, or deferred with the affected launch capability excluded or blocked. Once confirmed, record the accepted choice in the relevant DEC/decision record and reconcile the affected workflow, lifecycle, domain-boundary, API/persistence, acceptance, issue, progress and handoff documents. Until then, technical design must retain the uncertainty and no application-code/schema/API/Firebase/provider/deployment work is authorized.
