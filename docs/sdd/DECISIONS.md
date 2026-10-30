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
- **Still unresolved:** Additional contact/identity verification checkpoints, minimum sender/receiver/payer details, business-account handling, quote validity, booking acceptance, amendment/cancellation authority, and corresponding runtime acceptance tests.
- **Rationale:** Begin launch with an accountable customer identity for independent bookings while keeping the storefront guest-purchase path separate.
- **Status:** Owner-approved eligibility rule; detailed workflow policy, source reconciliation, and implementation remain open.


### DEC-024 — Distinct shipment parties, change authority, and payer privacy

- **Decision date:** 29 October 2026.
- **Decision:** The booking party, sender, receiver/collection recipient, payer, and person physically handing over the parcel may be different people. One person may occupy multiple roles, but each relationship must be explicit wherever it affects authority, liability, access, notifications, payment attribution, intake, or collection.
- **Change authority:** Do not infer blanket edit authority from any one relationship. Permissions must be defined by change type and shipment lifecycle stage. The booking party may initiate permitted requests. Receiver/collection changes must follow the applicable verification and approval policy; changes affecting a shipment after intake or dispatch require the approved staff-mediated/controlled workflow. The exact change matrix, consent requirements, verification checkpoints, and permissions remain open.
- **Payer privacy:** Payment alone grants the payer payment confirmation/receipt information only by default. It does not grant full shipment-detail access. Additional visibility requires a separately approved entitlement and minimum-data rule.
- **Physical authority:** Booking does not itself authorize parcel collection. Payment does not itself authorize access to private shipment details. Handover and collection identities/evidence must satisfy the approved intake/collection policy.
- **Notification boundary:** Send each party only notifications and minimum fields appropriate to their approved relationship; payer notifications do not automatically disclose full shipment details.
- **Rationale:** Support legitimate third-party booking/payment while avoiding accidental disclosure or unauthorized shipment changes and collection.
- **Still unresolved:** Exact verification checkpoints; detailed permissions for each change type and lifecycle stage; sender/receiver consent rules; collection-proof requirements; notification event/recipient/field matrix; and implementation/runtime acceptance tests.
- **Status:** Owner-approved policy direction; detailed workflow contracts and implementation remain open. No schema or application-code change is authorized by this decision.


### DEC-025 — Capability-based staff actions and lean PUDO location records

- **Decision date:** 29 October 2026.
- **Decision:** Use a minimal capability-based location model. Staff capabilities are configured per location rather than inferred from a location label or from authentication/admin status. The initial location record remains lean: name, address, active status, and configured capabilities.
- **Launch actions:** Subject to explicit assigned authorization, location staff may create staff-assisted walk-in intake records, measure and record parcel dimensions/weight, accept and record physical custody, collect and record payment with the required evidence, and release parcels to recipients whose collection authority has been verified. These actions are separate capabilities; permission for one does not automatically grant another.
- **Accountability:** Consequential intake, measurement, custody, payment, release, and capability/configuration actions must identify the responsible actor, location, and time, with applicable evidence/reason. Server-side authorization is mandatory.
- **Location boundary:** A location can perform only explicitly configured services. A registered collection centre is not automatically authorized to accept outgoing parcels or release every parcel.
- **Still unresolved:** Exact role/claim representation and assignment administration; partner system access; measurement units and discrepancy thresholds; supported payment-at-intake methods and evidence; collection verification checkpoints; second-person approvals; and detailed correction/exception workflows.
- **Rationale:** Keep launch operations practical while separating high-impact actions and avoiding an unnecessarily granular role for every task.
- **Status:** Owner-approved high-level policy; detailed workflow rules, source reconciliation, and implementation remain open.


### DEC-026 — Service-specific hybrid pricing and quote validity

- **Decision date:** 29 October 2026.
- **Decision:** Assign fixed or calculated pricing by service according to cost characteristics. Storefront delivery and independent shipment booking use one shared approved pricing rule set wherever service inputs overlap.
- **Calculated-price inputs:** A service may use applicable inputs from origin/destination or a defined distance band, parcel weight, parcel dimensions or volumetric weight, service class/delivery speed, and a configured minimum charge. The exact formula, units, distance source/bands, service-to-formula mapping, and any additional inputs remain unresolved.
- **Quote validity:** Configure quote validity by service. Quote expiry and whether a fresh quote is required after expiry must be explicitly defined before implementation.
- **Quote preservation:** Preserve accepted inputs, itemized charges, total, currency, and applicable rate/rule version/effective context. Later rate changes must not silently alter accepted quotes or completed payments.
- **Unknown charges:** Do not assume taxes, surcharges, discounts, or other fees are zero. Their applicability, calculation, display, and approval remain unresolved.
- **Adjustments:** Actual intake measurements or other permitted changes may generate a proposed adjustment linked to the original quote. Material discrepancies and adjustments affecting existing payments require review under a policy still to be defined. Charges, additional payments, credits, and refunds remain distinct financial events.
- **Rationale:** Maintain consistent pricing across relevant booking paths while allowing service-appropriate cost models and preserving commercial facts customers accepted.
- **Status:** High-level owner policy accepted. Formula catalogue, examples, units, rounding, effective dates, expiry behaviour, tax/fee treatment, adjustment thresholds, and implementation remain open.

### DEC-027 — Configurable measurement discrepancy and adjustment review

- **Decision date:** 29 October 2026.
- **Decision:** Adopt a configurable, evidence-based policy that distinguishes routine measurement variation from material discrepancies. Thresholds must be appropriate to the service and relevant measurement; no numeric threshold is approved by this decision.
- **Measurement evidence:** Preserve the original quoted inputs and separately record actual intake measurements with responsible actor, location, time, and applicable evidence/reason.
- **Quote and adjustment integrity:** Preserve the accepted quote and its rate/rule context. A discrepancy may create a proposed adjustment linked to the original quote, but the proposal must not silently overwrite the quote or be treated as an approved charge or settled financial event.
- **Review authority:** Staff may record measurements and propose adjustments only within assigned permissions. Material discrepancies and adjustments affecting an existing payment require review under a configured authority policy. Exact approval limits and second-person requirements remain unresolved.
- **Customer outcomes:** Notification/consent requirements and explicit outcomes for acceptance, dispute, refusal, and unresolved cases must be defined before implementation. A disputed or refused adjustment must not silently become an approved charge.
- **Still unresolved:** Units and required measurements by service; numeric thresholds; authority limits and separation of duties; customer consent/notification rules; refusal/dispute outcomes; evidence details and runtime acceptance tests.
- **Rationale:** Protect quote integrity and customer trust while allowing operationally practical handling of routine variation and controlled review of material differences.
- **Status:** High-level owner policy accepted. Detailed thresholds, authority matrix, customer/financial outcomes, source reconciliation, and implementation remain open.


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
