# VeriLyft Platform Owner Decision Register

**Document status:** Working register for owner decisions; recommendations are not approved policy  
**Last updated:** 30 October 2026  
**Related baseline:** PR #13 merged; `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md`  
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
- **Unresolved:** Exact contact/identity verification checkpoints, minimum sender/receiver/payer details, business-account handling, quote validity, and amendment/cancellation authority. This decision does not imply email/phone verification beyond the registration/authentication requirements explicitly defined elsewhere.
- **Boundary:** Preserve the separate provisional guest-checkout rule for storefront purchases. This decision does not change storefront checkout or decide guest-order recovery/claiming (VLY-004).
- **Dependencies:** Booking workflow, actor model, quote acceptance, cancellation, customer access, and notification requirements.
- **Acceptance direction:** Unauthenticated users cannot create or retrieve customer booking details; an authenticated customer cannot read or alter another customer's booking; booking remains distinct from physical intake and storefront orders.

### D-03 — Booking party, sender, receiver, and payer relationships

- **Status:** Owner decision accepted; recorded as DEC-024 on 29 October 2026.
- **Accepted choice:** The booking party, sender, receiver/collection recipient, payer, and physical handover person may be different parties. One person may occupy multiple roles, but each relationship must be explicit wherever it affects authority, liability, access, notification, payment attribution, intake, or collection.
- **Change authority:** Do not grant blanket edit authority merely because someone is the booking party, sender, receiver, or payer. Define authority by change type and shipment lifecycle stage. The booking party may initiate permitted requests; receiver/collection changes must follow the relevant verification and approval policy, with staff-mediated handling where the change affects an already-intaked or dispatched shipment. Detailed verification checkpoints and transition-specific permissions remain open.
- **Payer access:** Payment alone grants the payer payment confirmation/receipt information only by default, not full shipment details. Additional shipment visibility requires a separately approved entitlement and minimum-data rule; notification recipients and fields must follow the party's authorized relationship.
- **Security/privacy invariants:** Booking does not itself authorize parcel collection. Payment does not itself authorize access to private shipment details. The person handing over a parcel and the person collecting it must satisfy the approved intake/collection verification policy.
- **Dependencies:** Booking data requirements, access/privacy rules, intake handover, payment attribution, recipient changes, collection authorization, and notifications.
- **Still unresolved:** Exact identity/contact verification checkpoints; which change types the booking party may complete directly; which changes require sender/receiver consent or staff approval; and detailed collection-proof and notification rules. This decision does not authorize a schema or implementation.
- **Acceptance direction:** Tests must distinguish booking-party, sender, receiver, payer, handover-person, and collection-person entitlements; deny access based solely on a booking ID or payment; and reject changes outside the approved actor/change/stage policy.

### D-04 — Staff-created walk-in intake and location capabilities

- **Status:** Owner decision accepted; recorded as DEC-025 on 29 October 2026.
- **Accepted choice:** Use a minimal capability-based location model. Staff capabilities are configured per location rather than inferred from the location label or from a person's authentication/admin status. The initial location record is lean: name, address, active status, and configured capabilities.
- **Launch actions:** Subject to assigned authorization, location staff may create staff-assisted walk-in intake records, measure and record parcel dimensions/weight, accept and record physical custody, collect and record payment with required evidence, and release parcels to recipients whose collection authority has been verified. These are distinct actions; permission to perform one does not automatically grant the others.
- **Accountability:** Consequential intake, measurement, custody, payment, release, and capability/configuration actions must be attributable to the responsible actor, location, and time, with the applicable evidence/reason. Server-side authorization remains mandatory.
- **Boundaries:** A location can perform only explicitly configured services. A registered collection centre is not automatically authorized to accept outgoing parcels or release every parcel. This decision does not define exact staff-role/claim representation, partner system access, required measurement units/thresholds, payment methods/evidence, collection verification, or second-person approval rules.
- **Dependencies:** D-01 staff authorization, D-03 party/collection entitlement, D-05 pricing, D-06 discrepancy review, D-07 payment-at-intake evidence, D-09 dispatch exceptions, D-10 route/movement evidence, and D-12 audit/evidence retention.
- **Acceptance direction:** Reject unauthorized actions and actions at inactive/unsupported locations; keep creation, measurement, custody acceptance, payment recording, and release independently authorized; retain actor/location/time evidence; and deny collection when recipient entitlement is not established.
- **Implementation boundary:** This decision accepts business policy only. It does not authorize a schema, endpoint, permission implementation, or application-code change.

### D-05 — Shared pricing formula and quote terms

- **Status:** Owner decision accepted at the business-policy level; recorded as DEC-026 on 29 October 2026.
- **Accepted approach:** Assign fixed or calculated pricing by service according to its cost characteristics; do not force every service into a single pricing formula. Storefront delivery and independent shipment booking share the same approved pricing rule set wherever service inputs overlap.
- **Calculated-price inputs:** Use only inputs applicable to the selected service, chosen from origin/destination or a defined distance band, parcel weight, parcel dimensions or volumetric weight, service class/delivery speed, and a configured minimum charge. Exact formulae, units, distance source/bands, service mapping, and any additional inputs remain to be defined.
- **Quote validity:** Configure validity by service. Quote expiry and whether a fresh quote is required must be specified before implementation.
- **Historical quote preservation:** Preserve accepted quote inputs, itemized charges, total, currency, and applicable rate/rule version/effective context. A later rate change must not silently mutate an accepted quote or completed payment.
- **Unknown charges:** Do not assume taxes, surcharges, discounts, or other fees are zero. Their applicability, calculation, display, and approval remain unresolved until separately specified.
- **Adjustments:** Actual intake measurements or other permitted changes may produce a proposed adjustment linked to the original quote. Material discrepancies and adjustments affecting an existing payment require review under a policy still to be defined. Charges, additional payments, credits, and refunds remain separate financial events.
- **Dependencies:** D-06 measurement discrepancy/adjustment approval, D-07 payment-at-intake evidence, D-08 cancellations/refunds/reconciliation, and D-12 audit/evidence retention.
- **Acceptance direction:** Equivalent approved inputs for the same service and rate version produce a reproducible result; a rate update does not alter an accepted historical quote; service-specific expiry is enforced; and no unconfirmed fee/tax treatment is invented.
- **Implementation boundary:** Business policy only. Exact formulas, data representation, UI presentation, and application-code changes remain outside this decision and the platform-wide SDD approval gate.

### D-06 — Measurement discrepancy and adjustment approval

- **Status:** Owner decision accepted at the policy level; recorded as DEC-027 on 29 October 2026.
- **Accepted approach:** Use configurable, evidence-based thresholds appropriate to the service and relevant measurement. Distinguish routine variation from a material discrepancy; exact numeric thresholds and required units remain unresolved.
- **Measurement record:** Preserve the original quoted inputs and separately record actual intake measurements, including the responsible actor, location, time, and applicable evidence/reason. Do not silently replace the original quote.
- **Adjustment lifecycle:** A discrepancy may create a proposed adjustment linked to the original quote. A proposal is not an approved charge, settled payment, credit, or refund. Preserve the original quote and its historical rate/rule context.
- **Review and authority:** Authorized staff may record measurements and propose adjustments within their assigned permissions. Material discrepancies and adjustments affecting an existing payment require review under configured authority. Exact staff limits and second-person approval rules remain unresolved.
- **Customer and financial outcomes:** Define notification/consent requirements and explicit outcomes for acceptance, dispute, refusal, and unresolved cases before implementation. Do not silently impose a disputed adjustment or treat it as settled. Additional charges, payments, credits, and refunds remain distinct, traceable financial events.
- **Still unresolved:** Measurement units and service-specific requirements; numeric thresholds; approval limits and separation of duties; customer consent and notification rules; consequences of refusal/dispute; and detailed evidence/test criteria.
- **Dependencies:** D-05 pricing and quote preservation, D-04 intake/location capabilities, D-07 payment-at-intake evidence, D-08 financial events/reconciliation, dispatch gates, customer communications, and D-12 audit/evidence retention.
- **Acceptance direction:** Preserve quoted and actual measurements; prevent unauthorized or silent quote mutation; route material discrepancies to the required review; and ensure no proposed/disputed adjustment is treated as an approved or settled financial event.
- **Implementation boundary:** Business policy only. No schema, endpoint, permission implementation, pricing implementation, or application-code change is authorized by this decision.

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

- **Status:** Owner decision required.
- **Confirmed:** Consequential actions and controlled government-request handling require attributable review; government requests remain basic in scope.
- **Decision needed:** Which actions require audit records and supporting evidence? What are retention/deletion, legal hold, correction, redaction, reviewer access, and disclosure approval rules?
- **Recommendation:** Preserve an explainable history of consequential changes without claiming a log alone proves a physical event occurred. Keep government-request access separate from privileged platform access.
- **Dependencies:** D-01 and all financial, custody, dispatch, delivery, override, and communication workflows.
- **Record after decision:** Audit event catalogue, retention/access rules, correction procedure, disclosure authority, and evidence acceptance tests.

### D-13 — Customer notifications and Telegram boundary

- **Status:** Partly confirmed, partly owner decision required.
- **Confirmed:** Telegram is deferred; a future paid-order delivery notification must not be sent before the authorized Admin assignment-approval gate.
- **Decision needed:** Which events trigger email/SMS/Telegram, who receives each, what fields may be disclosed, how retries/deduplication work, and who owns delivery failures?
- **Recommendation:** Specify the event catalogue and privacy boundary before implementing any new channel; notification delivery must not change the underlying business state.
- **Dependencies:** D-02–D-03, D-05–D-12, customer access, and guest-order recovery.
- **Record after decision:** Channel/event/recipient matrix, minimum message fields, retry policy, deduplication key semantics, and failure handling.

### D-14 — Guest-order recovery or claiming

- **Status:** OPEN — VLY-004.
- **Decision needed:** Is guest-order claiming required at launch, deferred, or out of scope? If required, what proof establishes entitlement when the original browser session/token is unavailable?
- **Recommendation:** Do not grant access based on an order ID alone or associate a guest order with an account without verified entitlement.
- **Dependencies:** Customer account model, guest token lifecycle, support procedure, privacy, and notifications.
- **Record after decision:** Scope, proof-of-ownership flow, token recovery/rotation rules, denial outcomes, and cross-account tests.

### D-15 — Launch priority and production-readiness evidence

- **Status:** Owner review required.
- **Existing evidence:** Launch scope is recorded in DEC-018, but the consolidated P0/P1/deferred baseline and production-readiness evidence remain incomplete.
- **Decision needed:** Classify each applicable domain and acceptance criterion as launch-required/P0, important/P1, explicitly deferred, or not applicable. Define what test/runtime/configuration evidence is required before release.
- **Recommendation:** Prioritize safe end-to-end completion of the agreed lean launch scope; do not interpret a feature's presence in source or a passing type check as launch acceptance.
- **Dependencies:** All preceding decisions and the reconciled acceptance matrix.
- **Record after decision:** Approved priority table, release blockers, dated verification checklist, and explicit SDD sign-off.

## 4. How decisions become authoritative

For each D-01–D-15 item:

1. The owner selects an option, provides a different rule, or explicitly defers the decision.
2. Record the accepted outcome in `DECISIONS.md` with date, rationale, status, and affected domains.
3. Update the relevant actor/workflow/lifecycle/acceptance document and any affected entry in `ISSUES.md`.
4. Check compatibility with current source read-only; record mismatches without treating existing code as approval.
5. Define acceptance scenarios with initial state, actor, action/event, expected state/result, unchanged data, failure/replay outcome, audit evidence, and safe test environment.
6. Reconcile `README.md`, `PROGRESS.md`, and `SESSION_HANDOFF.md` before declaring the platform SDD ready.
7. Obtain explicit owner approval of the complete reconciled SDD before implementation work begins.

## 5. Current recommended next decision

Proceed to **D-08: Cancellation, late payment, refunds, credits, and reconciliation**. D-07 is now accepted as DEC-028; D-08 depends on the payment evidence and event-history rules just established. D-01 through D-05 have high-level owner decisions recorded, but action-level staff permissions, exact pricing formulas, quote expiry behaviour, measurement thresholds, financial approval limits, and runtime acceptance evidence remain open. Define when intake measurements may trigger a proposed adjustment and who must review or approve it before it affects an existing quote/payment.

**No decision in this register is approved merely by appearing here.**
