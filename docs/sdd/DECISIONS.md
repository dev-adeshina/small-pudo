# VeriLyft Architecture and Product Decision Log

**Last updated:** 17 October 2026

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

### DEC-008 --- Firebase Storage remains current image hosting

-   **Decision:** Continue using existing Firebase Storage
    implementation until a concrete need justifies migration.
-   **Implication:** Cloudinary is a later decision, not an assumed
    dependency.
-   **Status:** Accepted as current approach; migration deferred.

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
-   Order creation currently assigns `userId: null`; customer
    association is a planned change.
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
