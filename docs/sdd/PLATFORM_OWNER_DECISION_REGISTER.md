# VeriLyft Platform Owner Decision Register

**Document status:** Working register for owner decisions; recommendations are not approved policy  
**Last updated:** 29 October 2026  
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

- **Status:** Owner decision required.
- **Confirmed:** Staff-created walk-in intake and lean PUDO location management are in launch scope.
- **Decision needed:** Which capabilities can a staffed station perform versus a registered collection centre? Which staff may create a walk-in record, measure a parcel, accept custody, collect payment, or release a parcel?
- **Recommendation:** Define capabilities per location and action rather than inferring all capabilities from a location label.
- **Dependencies:** Intake/custody lifecycle, location permissions, payment-at-intake, routing eligibility, and audit evidence.
- **Record after decision:** Capability matrix, responsible actor for each physical event, and minimum receipt/custody evidence.

### D-05 — Shared pricing formula and quote terms

- **Status:** Owner decision required.
- **Confirmed:** Shared hybrid pricing applies to storefront delivery and independent shipment booking; preserve the quote inputs/rate version used.
- **Decision needed:** Which service uses fixed versus calculated rates? Define units, distance source/bands, service classes, minimums, surcharges/discounts, taxes if applicable, currency, rounding, rate effective dates, and quote validity.
- **Recommendation:** Specify each formula and its inputs in business terms before choosing a technical representation. Keep any unknown tax or fee treatment explicitly unresolved rather than assuming zero.
- **Dependencies:** Quote acceptance, checkout/booking totals, payment amounts, measurement adjustments, refunds/credits, and financial reporting.
- **Record after decision:** Formula catalogue, examples, rounding rules, quote validity, rate versioning, and acceptance tests.

### D-06 — Measurement discrepancy and adjustment approval

- **Status:** Owner decision required.
- **Confirmed:** Intake measurement may lead to a proposed recalculated charge; material discrepancies require review under policy.
- **Decision needed:** Define measurement units and required dimensions/weight; materiality thresholds; who reviews discrepancies; and what happens when a customer accepts, disputes, or declines an adjustment.
- **Recommendation:** Preserve the original quote and record the measured inputs and proposed adjustment separately. Do not silently overwrite an accepted quote or treat an unresolved adjustment as settled.
- **Dependencies:** D-05, intake evidence, additional payment/credit/refund workflow, dispatch gates, and customer communications.
- **Record after decision:** Thresholds, review authority, customer choice, allowed outcomes, and evidence required.

### D-07 — Supported payment-at-intake methods and evidence

- **Status:** Owner decision required.
- **Confirmed:** Payment at intake is in launch scope; verified payment is the default dispatch prerequisite.
- **Decision needed:** Which methods are accepted at intake (for example, provider-confirmed digital payment, bank transfer, or cash if the business supports it)? What evidence proves each method, and who can record and verify it?
- **Recommendation:** Define each method and its verification source explicitly. A staff note alone should not count as verified settlement unless an accepted policy defines the control and evidence.
- **Dependencies:** Intake workflow, receipts, payment state, dispatch authorization, financial visibility, and reconciliation.
- **Record after decision:** Method list, verification rules, receipt/evidence requirements, and role permissions.

### D-08 — Cancellation, late payment, refunds, credits, and reconciliation

- **Status:** Owner decision required; related runtime verification is separately tracked under VLY-005.
- **Decision needed:** Define outcomes for payment success after cancellation/expiry or stock/capacity release; duplicate or contradictory provider events; partial payment; refund/credit/additional charge; chargeback/reversal; and reconciliation mismatch. Identify initiation, approval, and exception owners.
- **Recommendation:** Keep provider payment outcomes, operational order/shipment status, and later financial adjustments distinct. Specify safe outcomes for each case before implementing changes.
- **Dependencies:** D-05–D-07, dispatch rules, financial reporting, audit, and test scenarios.
- **Record after decision:** Transition table, financial-event catalogue, authority/approval matrix, reconciliation ownership, and replay/late-event tests.
- **Separate verification:** Passing source review or a written rule does not prove webhook, stock, or provider behaviour; VLY-005 runtime tests remain required.

### D-09 — Dispatch exception authority

- **Status:** Owner decision required.
- **Confirmed:** Verified payment is required by default; exceptions must be authorized, justified, and audited without changing payment state.
- **Decision needed:** Which circumstances qualify, which role may approve, whether a second approver is required, what limits apply, and what evidence is mandatory?
- **Recommendation:** Keep the default block. Do not introduce a generic override that bypasses payment or other operational holds.
- **Dependencies:** D-01, D-07–D-08, route assignment, handover evidence, and audit.
- **Record after decision:** Eligibility, approvers, limits, mandatory reason/evidence, and rejected-transition tests.

### D-10 — Routing, route-leg assignment, and movement evidence

- **Status:** Owner decision required.
- **Confirmed:** Operations reviews route proposals and manages route-leg assignments at launch; Driver Portal is deferred.
- **Decision needed:** Which constraints are mandatory for initial proposals? Who may approve, alter, revoke, or reassign a leg? Which milestones and handover evidence must be recorded, including when staff enter events on behalf of a provider/driver?
- **Recommendation:** Keep proposal, approval, assignment, dispatch, handover, and arrival as distinct concepts. Do not treat a proposed route or assignment as proof of physical movement.
- **Dependencies:** D-01, D-04, D-09, shipment eligibility, location capabilities, and custody/audit requirements.
- **Record after decision:** Transition table, mandatory fields/evidence in business terms, correction authority, and delay/loss/damage exceptions.

### D-11 — Delivery proof and failed-delivery resolution

- **Status:** Owner decision required.
- **Confirmed:** Flexible proof of delivery and controlled failed-delivery resolution are in launch scope.
- **Decision needed:** Which proof methods are accepted or mandatory by service? What recipient/collection identity checks apply? Which failure reasons and resolution options are allowed, and who authorizes reattempt, return, holding, refusal, cancellation, or refund?
- **Recommendation:** Treat attempt, successful delivery, failed delivery, collection, and return as distinct outcomes. Require the approved evidence before recording successful delivery.
- **Dependencies:** D-01, D-04, D-10, privacy/retention rules, and financial adjustments.
- **Record after decision:** Outcome catalogue, evidence requirements, authority, time/retry limits, customer-contact rules, and dispute scenarios.

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

Proceed to **D-02: Independent shipment booking eligibility and account requirements**. D-01's high-level hybrid responsibility model is accepted, but exact permissions and approval requirements must be resolved within each affected workflow. Decide guest versus signed-in booking independently from the storefront guest-checkout rule.

**No decision in this register is approved merely by appearing here.**
