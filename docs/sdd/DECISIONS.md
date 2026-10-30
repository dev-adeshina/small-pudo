# VeriLyft Architecture and Product Decision Log

**Last updated:** 30 October 2026

This file records accepted constraints and provisional defaults so
future sessions do not invent a different architecture. Items marked
**Provisional** require confirmation if implementation depends on them.

## Accepted constraints

### DEC-001 --- Continue the existing project

-   **Decision:** Continue the existing Next.js App Router +
    TypeScript + Firebase application.
-   **Implication:** Do not restart, rewrite, or introduce a parallel
    architecture.
-   **Status:** Accepted.

### DEC-002 --- Focused changes only

-   **Decision:** Prefer the smallest targeted change that satisfies the
    task.
-   **Implication:** Avoid unrelated refactors, broad renaming, and
    redesigns.
-   **Status:** Accepted.

### DEC-003 --- Firebase is the data/auth foundation

-   **Decision:** Reuse existing Firebase Authentication, Firestore,
    Firebase client/Admin initialization, and existing data-access
    helpers.
-   **Implication:** Do not switch databases or introduce a competing
    data layer without explicit approval.
-   **Status:** Accepted.

### DEC-004 --- Cart remains browser-persisted for now

-   **Decision:** Keep the current shared cart context and localStorage
    behaviour unless a specific requirement changes it.
-   **Implication:** Do not introduce a second cart store.
-   **Status:** Accepted.

### DEC-005 --- Server is authoritative for transactional data

-   **Decision:** Server-side code validates product prices, stock,
    payment state, order ownership, and privileged operations.
-   **Implication:** Never trust browser-supplied totals, roles, payment
    confirmation, or arbitrary user IDs.
-   **Status:** Accepted.

### DEC-006 --- Preserve guest checkout

-   **Decision:** Keep guest checkout unless the owner explicitly
    decides otherwise.
-   **Implication:** Customer-account implementation must not silently
    force registration.
-   **Status:** Provisional default based on current product flow.

### DEC-007 --- Shipping model belongs with order types

-   **Decision:** Extend the existing order type in
    `lib/types/order.ts`.
-   **Implication:** Do not create a duplicate shipping domain type
    without a demonstrated need.
-   **Status:** Accepted.

### DEC-008 — Cloudinary is the selected image-hosting integration

- **Decision:** Use Cloudinary for category/product image uploads rather than relying on Firebase Storage for this project.
- **Reason:** The owner selected Cloudinary in light of Firebase free-tier/storage constraints.
- **Implication:** Reuse the current upload endpoint and existing product/category image fields. Keep Cloudinary credentials server-side; do not introduce a second image-hosting architecture or a broad data migration without need.
- **Verification status:** The source integration exists, but authorized upload success, unauthorized denial, and persisted image URL behaviour must be tested before the integration is marked verified.
- **Status:** Accepted decision; runtime verification pending.

### DEC-009 --- UI/CSS consistency

-   **Decision:** Preserve the current visual system, `app/globals.css`,
    existing Tailwind patterns, and existing components.
-   **Implication:** Inspect and reuse current styles before adding CSS;
    no broad redesign or new CSS framework.
-   **Status:** Accepted.

### DEC-010 --- Customer and admin authorization remain separate

-   **Decision:** Customer authentication does not imply admin
    permission.
-   **Implication:** Admin APIs must independently verify identity and
    admin authorization; customer APIs must enforce ownership.
-   **Status:** Accepted.

### DEC-011 --- Delivery and Telegram follow core customer features

-   **Decision:** Complete customer registration, dashboard, and order
    history before returning to customer-facing delivery and Telegram.
-   **Implication:** Preserve current admin shipping foundation, but do
    not let it displace the current customer-side priority.
-   **Status:** Accepted roadmap direction.

## Existing technical facts to preserve unless repository inspection contradicts them

-   App Router routes and route handlers live under `app/`.
-   Shared cart context is `context/cart-context.tsx`.
-   Cart type is `lib/types/cart.ts`.
-   Order type is `lib/types/order.ts`.
-   Firebase helpers are under `lib/firebase/`.
-   Firebase client and Admin setup are in `lib/firebase.ts` and
    `lib/firebase-admin.ts`.
-   Product/category validation helpers exist under `lib/validations/`.
-   Paystack endpoints are under `app/api/payments/`.
-   The current currency is NGN and the current delivery fee is zero.
-   Authenticated order creation is recorded as associating orders server-side with the verified Firebase UID while preserving guest checkout. Reinspect the current source before modifying this behaviour.
-   Shipping data currently includes provider, tracking number,
    shipped/estimated/delivered timestamps, and notes.

## Change control

If a future task appears to require breaking one of these decisions: 1.
Explain the conflict and why the existing decision is insufficient. 2.
Describe the smallest viable alternative. 3. Ask for approval when the
change affects architecture, data model, UX, payment, security, or
scope. 4. Record the agreed decision here.


## Admin Portal design decisions — 28 October 2026

These decisions are accepted at the design level only. They do not mean the corresponding functionality has been implemented or tested.

### DEC-012 — Keep the shipment business concept distinct from storefront orders

- **Decision:** Storefront purchases are orders. Independent individuals and businesses may book shipments without creating a storefront order. A storefront order may be linked to a shipment, and a shipment may have multiple transport movements.
- **Compatibility rule:** This clarifies the business concept in DEC-007; it does not by itself approve a new Firestore collection, duplicate type, migration, or route. Inspect the current order/shipping model first and propose the smallest compatible implementation before changing the schema.
- **Status:** Accepted conceptually; technical representation unresolved.

### DEC-013 — Admin dashboard structure

- **Decision:** Use a combined dashboard: concise business overview first, operational activity in the middle, and issues needing attention below.
- **Implication:** Use actual records, not hardcoded demo metrics or simulated activity. Provide date filters (today, last 7 days, this month, custom range), permission-aware global search, actionable notifications, and role-aware quick actions.
- **Status:** Accepted at design level; exact metric definitions depend on the approved data model and shipment lifecycle.

### DEC-014 — Operational financial visibility in Admin

- **Decision:** Admin may show successful/pending/failed payments, refund summaries, order/shipment revenue summaries, delivery charges, and outstanding balances where supported by reliable records.
- **Implication:** Do not label revenue as profit. Expenses, salaries/payroll, full profit-and-loss, commissions/payouts, and comprehensive reconciliation belong in the Finance Portal.
- **Status:** Accepted.

### DEC-015 — Keep operational and payment status distinct

- **Decision:** Shipment operational status and payment status are separate concepts.
- **Implication:** Successful payment does not prove physical intake, dispatch, or delivery; physical receipt does not prove payment.
- **Status:** Accepted conceptually; exact shipment states, transitions, and data representation remain unresolved.

### DEC-016 — Government requests remain basic

- **Decision:** Do not create a dedicated Government Requests page or elaborate workflow at this stage.
- **Implication:** Use existing Admin Portal records, evidence storage where necessary, and audit logs to record request basics, an authorized review/decision, relevant document references, and any disclosure.
- **Status:** Accepted; deliberately limited in scope.

### DEC-017 — Design must precede implementation

- **Decision:** Design and review Admin pages/functions one area at a time before coding.
- **Implication:** Mark page specifications as Draft, Under Review, or Approved for Implementation. Design agreement alone is not implementation evidence.
- **Status:** Accepted.


### DEC-018 — Owner-approved launch scope and lean implementation

- **Decision:** Prioritize a minimum complete operational release for the startup, not an enterprise Admin Portal.
- **Launch scope confirmed:** Independent shipment booking; advance booking and staff-created walk-in intake; lean PUDO location management distinguishing staffed stations from registered collection centres; shared hybrid delivery pricing; advance online payment and payment at intake; hybrid route proposals with Operations review; route-leg assignments managed by Operations; flexible proof of delivery; and controlled failed-delivery resolution.
- **Dispatch rule:** Verified payment is required by default. Exceptions require explicit authorization, an approved business policy, a recorded reason, and an audit trail. An exception does not change the payment state.
- **Driver portal:** Deferred. Operations staff manage assignments and shipment milestones initially. Preserve the option to add driver self-service later.
- **Startup exclusions:** Defer advanced route optimization, full fleet management, separate driver application, enterprise workflow engine, and advanced analytics unless a concrete operating need justifies them.
- **Implementation boundary:** These are design decisions only. They do not approve a schema migration or new architecture. Inspect existing code and propose the smallest compatible changes before implementation.
- **Status:** Accepted at launch-scope planning level; detailed policies and implementation verification remain open.

### DEC-019 — Shared hybrid delivery pricing and controlled measurement adjustments

- **Decision:** Use one shared pricing service/rule set for storefront delivery and independent shipment bookings. Support configured fixed rates and calculated pricing according to the service.
- **Quote preservation:** Preserve the original quote and the inputs/rates used. Later rate changes must not silently alter an existing quote or completed payment.
- **Measurement discrepancy:** Recalculate a proposed charge from actual intake measurements. Material discrepancies and adjustments affecting an existing payment require review under a configurable policy.
- **Settlement:** Additional payments, credits, and refunds remain distinct financial operations and must be verified and recorded. Unresolved payment outcomes do not qualify as successful payment.
- **Status:** Accepted at design level; formula, thresholds, permitted methods, and approval limits remain unresolved.


### DEC-020 — Reconcile project documentation before application-code changes

- **Decision:** Before beginning a new implementation slice, reconcile `PROGRESS.md`, `ISSUES.md`, and `DECISIONS.md` with the current requirements/audit documents and the latest verified repository/test evidence.
- **Implication:** The tracker must state the active task, acceptance criteria, known risks, and tests still outstanding. Do not write application code until these records are consistent enough to guide the next step.
- **Scope:** This is a workflow/continuity rule, not approval to change application architecture or implementation scope.
- **Status:** Accepted on 28 October 2026.


### DEC-021 — Complete the platform-wide SDD before application-code changes

- **Decision:** Complete and reconcile the SDD for the whole VeriLyft platform before resuming application-code changes or implementing new portal functionality.
- **Scope:** Include all in-scope customer and staff experiences, shared business workflows, domain/data relationships, API contracts, security boundaries, integrations, audit/evidence, reporting, testing, and acceptance criteria. Do not assume every functional area must be a separately deployed portal; explicitly record deferred scope, including the separate Driver Portal at launch.
- **Working method:** Read-only source inspection is allowed to document current implementation facts. The approved SDD describes intended behaviour; source inspection describes what exists; test/deployment evidence describes what has been verified. Conflicts must be recorded and resolved explicitly.
- **Implication:** Do not implement new routes, collections, fields, services, or portal pages until the relevant SDD has been reviewed and approved. Reconcile `README.md`, `SPEC.md`, `DECISIONS.md`, `ISSUES.md`, `PROGRESS.md`, and `SESSION_HANDOFF.md` before declaring the baseline ready.
- **Status:** Accepted on 29 October 2026.


### DEC-022 — Minimal hybrid staff responsibility and approval model

- **Decision date:** 29 October 2026.
- **Decision:** Adopt a minimal hybrid staff model. Admin and Operations are distinct responsibilities, but this does not automatically require separate portals or separate permission roles for every function. Routine actions may be shared where assigned permissions allow. Sensitive actions—including financial adjustments, dispatch exceptions, and restricted information disclosures—must have explicit permission and approval boundaries.
- **Security invariant:** Authentication alone does not grant staff authority. Every privileged operation must be authorized server-side; hiding UI controls is not an access-control boundary.
- **Accountability:** Privileged and consequential actions must retain appropriate evidence of the acting staff identity, target/action, outcome, and reason; record an approver when policy requires one.
- **Scope boundary:** This decision establishes the role-model direction, not a complete action-by-action permission matrix, second-person approval rule, custom-claim design, schema, route, or implementation approval. Those details must be defined in affected workflows and acceptance criteria before code changes.
- **Rationale:** Preserve a lean launch without conflating responsibilities or granting broad authority to every signed-in user.
- **Status:** Owner-approved design direction; detailed permissions and workflow-specific approval rules remain open.


### DEC-023 — Registered customers only for independent shipment booking

- **Decision date:** 29 October 2026.
- **Decision:** At launch, only registered, authenticated customers may create an independent shipment booking. Guest shipment booking is out of scope for the initial launch.
- **Authorization invariant:** The server must enforce authenticated customer identity and customer-scoped booking access. Unauthenticated users cannot create bookings or retrieve booking details, and one customer cannot access or amend another customer's booking without separately verified entitlement.
- **Scope boundary:** This decision applies only to independent shipment booking. It does not change the provisional guest-checkout rule for storefront purchases and does not resolve guest-order recovery/claiming (VLY-004).
- **Still unresolved:** Additional contact/identity verification checkpoints, minimum sender/receiver/payer details, business-account handling, quote validity, booking acceptance, and corresponding runtime acceptance tests. Amendment/cancellation authority is addressed by BP-01–BP-05 in `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`; detailed procedures and implementation remain open.
- **Rationale:** Begin launch with an accountable customer identity for independent bookings while keeping the storefront guest-purchase path separate.
- **Status:** Owner-approved eligibility rule; detailed workflow policy, source reconciliation, and implementation remain open.


### DEC-024 — Distinct shipment parties, change authority, and payer privacy

- **Decision date:** 29 October 2026.
- **Decision:** The booking party, sender, receiver/collection recipient, payer, and person physically handing over the parcel may be different people. One person may occupy multiple roles, but each relationship must be explicit wherever it affects authority, liability, access, notifications, payment attribution, intake, or collection.
- **Change authority:** BP-01–BP-05 establish pre-intake booking-party change and cancellation rights, sender/receiver requests through Support, and controlled escalation when the booking party is unavailable. After physical intake, changes are staff-mediated.
- **Collection authority:** BP-06–BP-08 establish receiver verification, booking-party/receiver nomination rules, alternative-collector verification, and a hold/review process for conflicting collection instructions. Booking and payment alone do not authorize collection.
- **Transfer and continuity:** BP-10–BP-13 establish authenticated, accepted booking-party transfers; preserve financial history and obligations; controlled withdrawal; and verified legal-representative handling for death or incapacity.
- **Delegated access and account security:** BP-14–BP-17 establish limited, explicit, expiring, revocable, non-transferable access and protective handling of suspected account compromise.
- **Privacy, disputes, and appeals:** BP-18–BP-22 establish controlled deletion/anonymisation boundaries, record disputes and amendments, configurable dispute-resolution targets, independent appeal review, and narrowly limited further review.
- **Payer privacy:** Payment alone grants the payer payment confirmation/receipt information only by default. It does not grant full shipment-detail access. Additional visibility requires a separately approved entitlement and minimum-data rule.
- **Notification boundary:** Send each party only notifications and minimum fields appropriate to their approved relationship; payer notifications do not automatically disclose full shipment details.
- **Rationale:** Support legitimate third-party booking/payment while preventing unauthorized changes, disclosure, transfer, or parcel release.
- **Still unresolved:** Identity/consent methods; detailed change-type and lifecycle gates; evidence and exception standards; financial-responsibility transfer procedure; delegated-access catalogue/duration; retention/anonymisation rules; notification fields/channels; dispute targets and reviewer/appeal procedures; and implementation/runtime acceptance tests. See `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md` (BP-01–BP-22).
- **Status:** Owner-approved detailed policy direction; operational/technical contracts, source reconciliation, and implementation remain open. No schema or application-code change is authorized by this decision.


### DEC-025 — Capability-based staff actions and lean PUDO location records

- **Decision date:** 29 October 2026.
- **Decision:** Use a minimal capability-based location model. Staff capabilities are configured per location rather than inferred from a location label or from authentication/admin status. The initial location record remains lean: name, address, active status, and configured capabilities.
- **Launch actions:** Subject to explicit assigned authorization, location staff may create staff-assisted walk-in intake records, measure and record parcel dimensions/weight, accept and record physical custody, collect and record payment with the required evidence, and release parcels to recipients whose collection authority has been verified. These actions are separate capabilities; permission for one does not automatically grant another.
- **Accountability:** Consequential intake, measurement, custody, payment, release, and capability/configuration actions must identify the responsible actor, location, and time, with applicable evidence/reason. Server-side authorization is mandatory.
- **Location boundary:** A location can perform only explicitly configured services. A registered collection centre is not automatically authorized to accept outgoing parcels or release every parcel.
- **Still unresolved:** Exact role/claim representation and assignment administration; partner system access; measurement units and discrepancy thresholds; supported payment-at-intake methods and evidence; collection verification checkpoints; second-person approvals; and detailed correction/exception workflows.
- **Rationale:** Keep launch operations practical while separating high-impact actions and avoiding an unnecessarily granular role for every task.
- **Status:** Owner-approved high-level policy; detailed workflow rules, source reconciliation, and implementation remain open.


### DEC-026 — Service-specific pricing models and quote management

- **Decision date:** 29 October 2026; refined by owner approval on 30 October 2026.
- **Pricing models:** Each service must explicitly use an approved fixed, calculated, or hybrid pricing model. Fixed pricing applies where cost is predictable within defined service conditions; calculated pricing applies where approved variables materially affect cost; hybrid pricing may combine approved fixed and variable components. Not every service must use every model.
- **Shared rule authority:** Storefront delivery and independent shipment booking use the same approved pricing rule set wherever their service inputs overlap. No service may introduce an ad hoc pricing formula outside the approved pricing catalogue/configuration.
- **Pricing inputs:** Each service explicitly declares which approved inputs apply. Permitted input categories include origin, destination, distance or an approved distance band, actual/declared parcel weight as the applicable policy permits, dimensions, volumetric weight, service class/delivery speed, configured minimum charge, and documented special-handling requirements. Not every input applies to every service. Exact formulas, input sources, units, service mapping, and any further input categories remain unresolved.
- **Quote lifecycle:** A quote may be draft, issued, accepted, rejected, expired, superseded, or cancelled. Issued means presented to the customer; acceptance must be explicit. An unaccepted expired quote requires a fresh quote before proceeding. Each service configures quote validity and communicates the expiry. The effect of expiry on a quote already accepted, and the precise booking-confirmation point, remain to be specified.
- **Quote preservation:** Preserve the inputs, itemized charges, total, currency, and applicable pricing-rule/rate version and effective context used for an issued/accepted quote. Later rate changes must not silently alter an issued or accepted historical quote or completed payment. A recalculation/revision creates a new quote while preserving prior versions.
- **Commercial and operational separation:** A quote, accepted commercial agreement, payment, and booking are distinct business events. Quote acceptance does not prove payment or physical intake.
- **Unknown charges:** Do not assume taxes, surcharges, discounts, or other fees are zero. Their applicability, calculation, display, and approval remain unresolved.
- **Adjustments:** Actual intake measurements or other permitted changes may create a proposed adjustment linked to the original quote and accepted agreement. A proposal must not overwrite the original quote or become an approved charge/settled financial event automatically. Material discrepancies and payment-impacting adjustments require review. Customer notification and explicit consent are required before collecting an additional charge.
- **Rationale:** Maintain consistent pricing across relevant booking paths while allowing service-appropriate cost models and preserving the commercial facts presented to and accepted by customers.
- **Status:** High-level owner policy accepted and refined. Formula catalogue, rates, units, input-source rules, rounding, effective dates, tax/fee treatment, accepted-quote expiry edge cases, and detailed booking transitions remain open.

### DEC-027 — Measurement standards, discrepancy review, and quote adjustments

- **Decision date:** 29 October 2026; refined by owner approval on 30 October 2026.
- **Measurement framework:** Use a shared measurement-recording framework with service-specific requirements. Each service explicitly defines the measurements it needs and the unit for each measurement. Kilograms (kg) and centimetres (cm) are examples only; no universal unit selection is approved here.
- **Declared and actual values:** Preserve customer/booking-party-declared measurements separately from actual measurements recorded at intake. Do not silently overwrite, convert, or reinterpret a recorded value. Any unit conversion must be explicit, controlled, and traceable under the later technical contract.
- **Measurement evidence:** Actual measurement records identify the responsible actor, location, timestamp, and applicable evidence/reason. Evidence requirements may vary by service and action.
- **Discrepancy policy:** Use a configurable, evidence-based policy to distinguish routine variation from material discrepancies, appropriate to the service and relevant measurement. No numeric threshold or tolerance is approved by this decision.
- **Quote and adjustment integrity:** Preserve the accepted quote and its pricing-rule/rate context. A discrepancy may create a proposed adjustment linked to the original quote and accepted agreement, identifying changed facts and reason. The proposal must not silently overwrite the quote or be treated as an approved charge or settled financial event.
- **Review authority:** Staff may record measurements and propose adjustments only within assigned permissions. Material discrepancies and adjustments affecting an existing payment require review under the configured authority policy. Exact approval limits and second-person requirements remain unresolved.
- **Customer outcomes and consent:** Notify the customer of a price-changing adjustment with its reason and revised amount. Record explicit customer acceptance before collecting an additional charge. Record outcomes such as accepted, rejected, disputed, withdrawn, pending review, or unresolved. A disputed additional charge is suspended pending review; a rejected adjustment follows the applicable service-resolution policy. Neither dispute nor rejection silently authorizes a charge.
- **Financial separation:** A proposed or accepted adjustment does not itself execute an additional payment, refund, credit, or other financial transaction. Each financial event follows its own authorization, verification, and reconciliation policy.
- **Still unresolved:** Service-specific required measurements and units; conversion rules; numeric thresholds; evidence detail; approval limits and separation of duties; service-resolution outcomes after rejection; and detailed runtime acceptance tests.
- **Rationale:** Protect quote integrity and customer trust while allowing operationally practical measurement and controlled review of material differences.
- **Status:** High-level owner policy accepted and refined. Detailed thresholds, authority matrix, technical representation, source reconciliation, and implementation remain open.

### DEC-028 — Configured payment-at-intake methods and evidence

- **Decision date:** 30 October 2026.
- **Decision:** Use location-configured payment methods with evidence-based confirmation. A location may accept only payment methods explicitly enabled for that location; supported methods are not inferred from its label or general staff access.
- **Payment evidence:** Each recorded payment must distinguish its method and preserve amount, currency, applicable transaction reference or receipt, collecting/recording staff member, location, and time. Method-specific evidence requirements must be defined before implementation.
- **Electronic payments:** Treat an electronic payment as verified only when confirmed by an authoritative provider, bank, or approved reconciliation source. A customer screenshot, verbal claim, or unsupported staff note alone is not authoritative proof of successful settlement.
- **Cash:** A cash collection requires an attributable receipt or equivalent record and must be included in reconciliation. Detailed cash-handling and reconciliation procedures remain open.
- **Separate facts:** A payment record does not by itself establish that the parcel was accepted into physical custody. Booking, payment, and custody remain distinct facts and independently evidenced events.
- **History and corrections:** Failed, reversed, refunded, disputed, or corrected payment outcomes must retain their traceable history. Do not silently overwrite or erase prior financial events.
- **Still unresolved:** Exact enabled methods/providers per location; transaction and cash limits; receipt format; cash-handling and reconciliation procedures; mandatory second-person verification/approval; method-specific evidence and exception handling; and detailed acceptance tests.
- **Dependencies:** D-01 staff authority, D-04 location capabilities and intake, D-05 quote/pricing preservation, D-06 measurement adjustments, D-08 cancellation/refund/credit/reconciliation policy, dispatch gates, and D-12 audit/evidence retention.
- **Rationale:** Allow practical location-level flexibility while ensuring that payment verification is based on reliable evidence and remains distinct from physical custody.
- **Status:** Owner-approved high-level policy; detailed procedures, source reconciliation, acceptance tests, and implementation remain open.



### DEC-029 — Cancellation, late payment, refunds, credits, and reconciliation

- **Date:** 30 October 2026.
- **Decision:** Accepted Option A — explicit financial events with controlled transitions and reconciliation.
- Cancellation of a booking/order/shipment does not itself mean a payment was refunded. Cancellation state and refund state remain distinct.
- A payment received after cancellation or expiry is recorded and reconciled against its original transaction; it does not silently reactivate the cancelled booking/order/shipment.
- A refund request and an executed refund are distinct. Refund initiation and approval must follow authorized controls and retain reason and applicable evidence; exact approval limits remain unresolved.
- Financial outcomes for quotes and adjustments remain explicit: a rejected quote creates no payment obligation from that quote; an accepted quote preserves the agreed amount; an accepted adjustment records a revised commercial agreement and any additional amount due; a disputed additional charge is held pending review; overpayments and underpayments require an authorized resolution; and failed payments remain failed attempts rather than successful settlement.
- Customer rejection of an adjustment follows the applicable service-resolution policy; it does not automatically create a refund, credit, cancellation, or additional charge. The detailed operational consequences remain to be specified.
- Customer credit is distinct from a cash refund and must remain traceable to its originating transaction. Additional payments are separate events and must not overwrite the original payment.
- Reversals and chargebacks preserve the original transaction/event history and record their own outcomes.
- Reconcile internal payment records against authoritative provider/bank records. Mismatches require investigation rather than an assumed success or silent correction.
- Consequential financial actions retain actor, timestamp, reason, transaction/reference, and applicable evidence. Duplicate or replayed provider events must not create duplicate financial effects.
- Operational order/shipment status, cancellation status, payment status, and refund status remain separate. Verified payment does not by itself authorize dispatch; the DEC-018 default dispatch gate and authorized, reasoned, auditable exception policy remain in force.
- **Still unresolved:** Refund approval limits and separation of duties; refund timelines; cancellation fees; partial-refund policy; credit expiry/use rules; late-payment disposition; reconciliation frequency and exception ownership; and detailed evidence and acceptance tests.
- **Implementation boundary:** Business policy only. No schema, endpoint, provider integration, permission implementation, or application-code change is authorized.

### DEC-030 — Narrow, controlled dispatch exceptions

- **Date:** 30 October 2026.
- **Decision:** Accepted Option A — narrow, controlled dispatch exceptions.
- Verified payment remains the default prerequisite before dispatch. Exceptions are allowed only for explicitly defined operational circumstances under an approved policy; they are not a generic convenience override or unrestricted staff discretion.
- Only staff with explicitly assigned dispatch-exception permission may approve an exception. A requester must not automatically approve their own request.
- Material exceptions require a second approver. Which circumstances are material and the exact separation-of-duties rules remain unresolved.
- An exception never changes payment status or represents an unverified payment as successful. It cannot bypass unrelated safety, custody, identity, legal, or other operational holds.
- Preserve the affected parcel/shipment, reason, requesting actor, approving actor(s), timestamp, supporting evidence, and decision/outcome.
- **Still unresolved:** Eligible circumstances; exact staff responsibility/permission assignment; which cases require two-person approval; monetary or operational limits; category-specific mandatory evidence; and whether approval may be revoked before dispatch.
- **Acceptance direction:** Deny generic or unauthorized overrides; prevent self-approval; require second approval for material exceptions once defined; preserve payment state and unrelated holds; and retain attributable evidence.
- **Implementation boundary:** Business policy only. No schema, endpoint, permission implementation, or application-code change is authorized.


### DEC-031 — Controlled, evidence-based routing and movement

- **Date:** 30 October 2026.
- **Decision:** Accepted Option A — controlled, evidence-based movement.
- Keep route proposal, route approval, route-leg assignment, dispatch, physical handover, and arrival confirmation distinct. A proposal or assignment is not proof of physical movement.
- Operations manages proposals and route-leg assignments at launch. Approval, alteration, revocation, and reassignment require explicitly assigned staff authority; changes preserve prior decisions and identify the responsible actor and reason.
- Movement milestones retain attributable context for the shipment/parcel, route leg, event type, location, physical actor where known, recording actor, timestamp, and supporting evidence appropriate to the event.
- When staff record an event on behalf of a provider/driver, distinguish the physical actor who performed or reported the event from the staff member who recorded it.
- Delays, missed handovers, missing parcels, damage, disputed custody transfers, and other movement exceptions are recorded for investigation/resolution, not silently represented as successful movement.
- Operations continues to manage launch-time assignments and milestones through the staff workflow. Driver Portal remains deferred; this decision does not grant providers/drivers direct platform access.
- **Still unresolved:** Mandatory route-planning inputs/constraints; exact approval/change/revocation/reassignment permissions; any two-person approval requirements; mandatory milestones and event-specific evidence; provider/resource and capacity rules; correction authority; delay/loss/damage/dispute resolution; and detailed acceptance tests.
- **Acceptance direction:** Proposals cannot authorize dispatch; assignments cannot prove movement; movement events must reference the correct shipment and route leg; third-party physical actors and staff recorders are distinguishable; assignment history remains traceable; and exceptions are not silently marked successful.
- **Implementation boundary:** Business policy only. No schema, endpoint, permission implementation, provider integration, or application-code change is authorized.


### DEC-032 — Evidence-based delivery with controlled outcomes

- **Date:** 30 October 2026.
- **Decision:** Accepted Option A — evidence-based delivery with controlled outcomes.
- Treat a delivery attempt, successful delivery, failed delivery, customer collection, and return as distinct outcomes. An unsuccessful attempt is not completed delivery.
- Successful delivery requires approved evidence appropriate to the service and delivery context. A staff member changing a status to delivered, without the required evidence, is insufficient proof.
- Verify that the person receiving the parcel is authorized to receive it. The sender, payer, booking customer, and receiver are not interchangeable by default; apply the separately accepted party and collection-entitlement boundaries in DEC-024.
- Keep proof methods flexible by service. Candidate evidence may include recipient confirmation, OTP, signed acknowledgement, or attributable staff evidence, but this decision does not make any one method universally mandatory.
- Record failed attempts and their reason as distinct outcomes. Reattempt, return, holding, refusal, cancellation, and any financial adjustment must follow an explicitly authorized resolution procedure; none is implied automatically by a failed attempt.
- Notify relevant parties of significant delivery outcomes using only information they are authorized to receive.
- Preserve original delivery evidence and event history when a delivery is disputed; do not silently overwrite or erase the evidence.
- **Still unresolved:** Mandatory proof methods by service; whether OTP is mandatory, optional, or service-dependent; number of attempts; authority for reattempt, return, holding, refusal, cancellation, and financial adjustments; holding duration; failure-reason catalogue; loss/damage/refusal/dispute handling; customer-contact details; and detailed acceptance tests.
- **Acceptance direction:** An attempt cannot be recorded as successful delivery without the approved evidence; an unauthorized recipient cannot be treated as entitled; failed delivery remains distinct from completed delivery; resolution actions require authority and attributable history; disputes preserve original evidence.
- **Implementation boundary:** Business policy only. No schema, endpoint, permission implementation, notification integration, or application-code change is authorized. The platform-wide SDD implementation gate remains in force.


### DEC-033 — Accountable, evidence-based recordkeeping

- **Date:** 30 October 2026.
- **Decision:** Accepted Option A — accountable, evidence-based recordkeeping.
- Maintain an explainable, attributable history of consequential actions across customer access, staff permissions/capabilities, booking, intake, measurement, custody, payment, refunds/credits/adjustments, dispatch, routing/movement, delivery/returns, overrides, and sensitive disclosures. The exact event catalogue and evidence requirements by action remain to be specified.
- Audit records should identify the responsible actor, action, affected resource, timestamp, reason where applicable, and relevant supporting evidence. Distinguish the physical actor from a staff recorder. An audit entry or status change alone does not prove a physical event occurred.
- Do not silently overwrite or erase consequential records or original evidence. Corrections must be separately attributable and traceable to the original record, preserving original values/evidence where appropriate. Any redaction must follow controlled authority and remain distinguishable from the original.
- Apply retention rules appropriate to record category, sensitivity, and legitimate purpose. Define deletion/anonymization when retention is no longer justified; do not retain personal information indefinitely without a valid purpose. Records under an applicable legal hold must not be routinely deleted. Exact periods and procedures remain unresolved.
- Restrict audit/evidence access to explicitly authorized reviewers; administrator status alone does not grant unrestricted access. Access to sensitive records and disclosure actions must themselves be attributable and auditable.
- Government-request handling remains basic and controlled, separate from privileged platform access. Record requesting authority, request and stated legal basis, scope, authorized review/approval, and what was disclosed, to whom, when, and by whom. A request does not grant unrestricted platform access.
- Preserve relevant original evidence for authorized investigation/dispute review. Evidence must be attributable to its source; additions, corrections, and redactions remain distinguishable. A log is not a substitute for proof of a physical event.
- **Still unresolved:** Retention periods by category; complete audit event/evidence catalogue; reviewer/access matrix; two-person approval cases; deletion/anonymization procedures; legal-hold activation/release authority; detailed government-request review/disclosure procedure; evidence integrity/verification requirements; and detailed acceptance tests.
- **Acceptance direction:** Consequential actions are attributable; originals remain distinguishable from corrections; audit access/disclosure are authorized and auditable; retention/deletion respects purpose and legal holds; government requests do not grant unrestricted access; and audit entries are not treated as proof of physical events.
- **Implementation boundary:** Business policy only. No schema, endpoint, audit-log implementation, retention job, permission implementation, disclosure integration, or application-code change is authorized. The platform-wide SDD implementation gate remains in force.


### DEC-034 — Controlled, event-driven customer notifications

- **Date:** 30 October 2026.
- **Decision:** Accepted Option A — controlled, event-driven notifications with role-based information access.
- Trigger notifications from meaningful, verified business events. Notification delivery is a communication side effect and must not change or independently establish order, payment, shipment, dispatch, custody, or delivery state.
- Select recipients according to their explicitly established relationship and entitlement for the event, consistent with DEC-024 and DEC-032. Booking customer, sender, receiver/collection recipient, and payer may be different people. The payer receives relevant payment confirmation/receipt, refund, and financial outcome information by default, not full shipment details merely because they paid.
- Disclose only the minimum information necessary for the recipient and purpose. Do not expose private sender, receiver, address, parcel, or shipment details without an applicable entitlement. Authenticated links may provide further detail but must not bypass access controls.
- Email is the primary customer notification channel where configured. SMS is optional and requires explicit channel/provider configuration and applicable consent/contact verification. In-platform notifications may serve authenticated customer and staff experiences. Do not assume every event uses every channel.
- Telegram remains deferred. Any future paid-order delivery notification through Telegram must not precede the authorized Admin **Assign For Delivery** approval action. That approval is a necessary gate, not proof of physical dispatch, custody transfer, or delivery. Telegram additionally requires separately approved purpose, audience, recipient/field policy, and channel configuration.
- Prevent duplicate sends for the same business event, intended recipient, and channel. Apply bounded retries for transient failures and preserve attributable attempt/outcome information. Provider acceptance is not proof of receipt or reading. Persistent failures must be visible for operational follow-up; do not assume or silently substitute a fallback channel.
- **Still unresolved:** Final event catalogue/timing; mandatory versus optional event/channel combinations; preferences, consent, and contact verification; message templates/field matrix; retry limits/intervals; deduplication key and retention semantics; persistent-failure ownership/escalation; notification retention; and detailed acceptance tests. Telegram's eventual audience and purpose remain deferred.
- **Rationale:** Communicate verified progress while protecting party privacy, preventing duplicate or misleading messages, and keeping communication independent from operational and financial truth.
- **Status:** High-level owner policy accepted. Event/channel matrix, exact content, provider verification, detailed operational controls, source reconciliation, acceptance tests, and implementation remain open. No schema or application-code change is authorized by this decision.


### DEC-035 — Secure guest-order recovery and optional account claiming

- **Decision date:** 30 October 2026.
- **Decision:** Accepted Option A — secure guest-order recovery and optional account claiming.
- Preserve storefront guest checkout. Support secure recovery when a guest customer loses the original order-access credential, and optional claiming of an eligible guest order by a signed-in customer. Recovery and claiming are separate operations.
- **Recovery:** Require proof of control of the original checkout email through a verification challenge delivered to that address before issuing a replacement order-access credential. An order reference and email address alone are not proof. Replacement credentials follow a controlled expiry/revocation policy, and prior credentials must be invalidated or rotated. Challenge format and lifetime remain unresolved.
- **Claiming:** Require authenticated account context and a separate proof-of-ownership challenge tied to the original checkout email. Server-side checks must establish order entitlement and confirm the order has not already been claimed. A matching account email, order reference, unrelated session, or payment alone is insufficient proof. Record the association as an attributable action.
- **Ownership:** An order cannot be claimed by multiple accounts or silently transferred. Exceptional transfer or support-assisted recovery requires a separately approved verification, authorization, and audit procedure; no manual override is implied.
- **Security/privacy:** Challenges are time-limited and protected against replay and abuse. Failure responses must not disclose whether an order exists. Recovery credentials must not be exposed in logs or notification content beyond the secure recovery mechanism. All authorization and association decisions are server-side. Recovery/claiming cannot alter payment, cancellation, fulfilment, shipment, or delivery state.
- **Still unresolved:** Verification-link versus one-time-code format; challenge and replacement-token lifetimes; request/rate limits and abuse controls; eligibility after fulfilment/delivery; account deletion/closure consequences; exceptional transfer/support-assisted procedure; credential storage/rotation mechanics; notification templates; retention; and detailed denial, replay, and cross-account tests.
- **Rationale:** Preserve the low-friction guest checkout path while reducing permanent loss of order access and preventing unauthorized account association.
- **Status:** High-level owner policy accepted. Technical representation, source reconciliation, detailed controls, and runtime acceptance remain open. No schema or application-code change is authorized.


### DEC-036 — Evidence-based launch priority and production readiness

- **Decision date:** 30 October 2026.
- **Decision:** Accepted Option A — evidence-based launch with a clearly bounded P0 scope.
- Establish an explicit P0/P1/deferred baseline for the initial release. P0 requirements are launch blockers and require demonstrable acceptance evidence. P1 items may follow launch only where their absence does not compromise essential launch workflows, safety, security, financial integrity, legal obligations, or approved service scope. Deferred items are excluded from the initial release and must not be represented as available.
- P0 must safely support the owner-approved lean launch scope in DEC-018 and reconciled platform requirements. Candidate P0 domains include storefront/customer accounts/guest order access; payments and financial integrity; order and shipment booking/intake; staff authorization and location capabilities; pricing/quotes and measurement adjustment controls; launch-service dispatch, routing/movement, delivery and exception evidence; DEC-034 notifications; audit/evidence; customer-data security; and production operations. This domain-level direction is not an exhaustive requirement-level classification or proof of implementation/readiness.
- Advanced route optimization, full fleet management, Driver Portal, enterprise workflow engine, and advanced analytics remain deferred under DEC-018 unless explicitly changed by the owner. Do not reclassify accepted launch requirements as P1/deferred without approval.
- A P0 item is not launch-ready merely because a page, route, component, schema, source implementation exists, or TypeScript/build checks pass. Evidence must address relevant functional end-to-end success/failure paths; security/server-side authorization/privacy; financial correctness/authoritative verification/replay/reconciliation; operational accountability/custody/movement/delivery/exception handling; and production configuration/deployment/monitoring/backup/recovery/incident response/rollback.
- Keep designed, implemented, tested, verified in a production-like environment, and owner-accepted for launch as distinct states. Evidence should be dated, attributable, reproducible where practical, and linked to the requirement/acceptance criterion. Record environment and scope; untested/unverified items remain open.
- Unverified P0 requirements, launch-affecting security/authorization defects, financial-integrity failures, missing mandatory operational controls, or unavailable critical production/recovery capabilities block release until resolved or handled through a separately approved and lawful exception. Happy-path demonstrations and passing builds do not override blockers.
- **Still unresolved:** Requirement-level P0/P1/deferred classification; exact P0 scenarios/evidence artifacts; production-like environment definition; blocker ownership/exception authority; deployment/rollback runbook; backup/restore proof; monitoring/alert thresholds; incident response ownership; and final dated release checklist/sign-off.
- **Rationale:** Launch only a clearly bounded service whose essential requirements have evidence proportionate to their risk, without confusing code presence or build success with operational readiness.
- **Status:** High-level launch-governance policy accepted. Requirement-level reconciliation, source/runtime verification, detailed evidence and ownership, and final owner sign-off remain open. No application-code change is authorized.


### DEC-037 — Logistics is the primary business; storefront is an attached service

- **Decision date:** 30 October 2026.
- **Decision:** VeriLyft is fundamentally a logistics and shipment-management platform. Independent shipment booking is the primary customer entry point for the core business. Storefront commerce is an attached, secondary service.
- **Shared fulfilment principle:** Storefront purchases and independently booked shipments remain distinct business concepts and sources. Storefront orders that require delivery fulfilment must enter the same operational fulfilment system used to manage shipment operations; they must not create a separate, competing fulfilment process.
- **Scope relationship:** This clarifies the business hierarchy and reinforces the already accepted lean launch scope in DEC-018. It does not remove, defer, or independently re-approve any DEC-018 launch capability, and it does not change the deferred items already recorded there.
- **Implication:** Product priorities, workflow design, acceptance planning, and launch-readiness assessment must treat independent shipment booking and its supporting logistics operations as the primary business workflow. Storefront ordering remains supported as an attached order source.
- **Implementation boundary:** This is a product/workflow decision only. It does not approve a new Firestore collection, field, route, service, duplicated order/shipment model, migration, or application-code change. Preserve the distinction between storefront orders, shipments, and transport movements; inspect current source before proposing technical representation.
- **Status:** Accepted by the owner; detailed workflow contracts, technical representation, implementation, and runtime verification remain open.


### DEC-038 — Independent shipment booking confirmation, information, lifecycle, and responsibility policy

- **Decision date:** 30 October 2026.
- **Parent decisions:** DEC-018, DEC-023, DEC-024, DEC-026, DEC-027, DEC-029, DEC-033, DEC-034, and DEC-037; BP-01–BP-22.
- **Owner-approved policy:** An independent shipment booking becomes commercially confirmed when the authenticated booking party explicitly accepts a valid quotation. That acceptance confirms the booking and accepted commercial terms; payment and physical intake remain separate events.
- **Booking information:** The booking process identifies the authenticated booking party, origin, destination, selected available service, parcel description, and any measurements or supporting information required by that service for eligibility or pricing. Information requirements are service-specific and limited to what is necessary. The booking party, sender, receiver/collection recipient, payer, and physical handover person may differ and must not be assumed to be the same. A registered customer may arrange a shipment on behalf of a business, subject to identifying the business and the person's relationship to it; this does not require a separate business-account system for launch.
- **Identity and verification:** Identity verification occurs at appropriate booking, amendment, intake, payment, and collection checkpoints according to the relevant risk and authority. This decision does not select a verification provider or invent additional verification steps.
- **Booking lifecycle:** A customer may prepare a booking before commitment. An issued quotation alone does not confirm a booking. Explicit acceptance of a valid quotation by the authenticated booking party confirms it. The customer receives a booking reference/confirmation. A confirmed booking may be awaiting payment where payment at intake is permitted, or may have verified advance payment. Neither confirmation nor payment proves physical receipt or custody.
- **Quote and handover validity:** An unaccepted quotation that expires requires a fresh quotation. Expiry of an already accepted quotation does not silently cancel or rewrite the confirmed booking or its accepted commercial terms. Each service must define a separate handover period/deadline, communicate it before quote acceptance, and include it in booking confirmation. A confirmed booking not handed over within its deadline may be closed as unfulfilled under the approved service policy; payment and audit history remain preserved and financial resolution is assessed separately.
- **Physical intake:** A confirmed booking remains planned until an authorized actor records actual physical receipt. Intake discrepancies, holds, refusals, measurement changes, and price adjustments follow the applicable intake and pricing policies; the accepted quote and original booking history are preserved.
- **Cancellation and changes:** Before physical intake, the authenticated booking party may request cancellation subject to BP-01–BP-03. Cancellation does not itself complete a refund. After physical intake, cancellation and amendments are controlled and staff-mediated. Sender/receiver/payer association alone does not confer direct edit or cancellation authority. Changes affecting service or price require a revised quotation and explicit acceptance.
- **Abandonment and reliability:** Abandonment before quote acceptance creates no confirmed booking. Duplicate acceptance, payment, cancellation, and other repeated events must not create duplicate bookings or financial side effects. Consequential transitions remain attributable and auditable.
- **Responsibilities:** The booking party supplies accurate information, reviews and accepts the quote/deadline, selects an allowed payment path, and arranges timely handover. Support records and verifies requests and escalates without assuming booking-party authority. Operations manages authorized intake and post-intake operational changes. Admin handles designated exceptions within assigned permissions. Staff-assisted customer booking must not impersonate the customer or accept a quote without an explicitly approved authorization process. Walk-in intake remains a distinct staff-created intake path, not a customer independent booking.
- **External actors:** Drivers, transport providers, and collection-centre operators may perform assigned physical activities but receive no direct platform login or unrestricted shipment access by implication; internal authorized staff record and verify operational events under the launch model.
- **Rationale:** Establish a clear commercial commitment while preserving separate payment, physical custody, operational fulfilment, party authority, and financial accountability.
- **Still unresolved:** Service-specific handover durations and configuration; exact quote validity and pricing formulas/inputs; minimum contact/identity evidence and verification methods; business identity/relationship representation; service eligibility and capacity rules; exact payment-at-intake methods and verification; intake hold/refusal outcomes; cancellation/expiry financial consequences; operational status vocabulary; booking-reference/receipt format; detailed actor permission matrix; and API/data/audit/test contracts.
- **Implementation boundary:** This is accepted business policy only. It does not approve collections, fields, status enums, API routes, pages, permission claims, identity providers, payment methods, database changes, or application-code changes. Reconcile the policy with the existing source before any technical proposal. The complete platform-wide SDD approval gate remains in force.
