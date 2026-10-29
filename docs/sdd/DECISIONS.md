# VeriLyft Architecture and Product Decision Log

**Last updated:** 29 October 2026

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
