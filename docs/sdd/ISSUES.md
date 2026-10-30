# VeriLyft Issues, Risks, and Open Questions

**Last updated:** 30 October 2026  
**Repository:** `dev-adeshina/small-pudo`  
**Admin requirements baseline:** PR #2 merged into `main` on 28 October 2026 (`fbb56ce`). The consolidated P0/P1/deferred baseline still requires owner review.

This is the current issue register. Older archive-based observations have been reconciled where current implementation or later test evidence supersedes them. Source presence is not the same as runtime verification.

Status labels: `OPEN`, `INVESTIGATING`, `BLOCKED`, `DEFERRED`, `RESOLVED`.

## Open / investigating items

### VLY-004 — Guest order recovery/claiming flow undefined

- **Status:** OPEN
- **Priority:** Medium
- **Evidence:** Guest order access uses a random access token; the customer order-history feature is implemented, but a secure mechanism for claiming/recovering an existing guest order into an account remains undecided.
- **Risk:** A customer may lose access if session storage is lost or they switch devices.
- **Next action:** Decide whether claiming is required and define a proof-of-ownership flow before implementation.
- **Acceptance:** An order ID alone never grants access; the order is not associated with an account without verified entitlement.

### VLY-005 — Payment expiry, late events, and stock release need focused verification

- **Status:** INVESTIGATING
- **Priority:** High
- **Evidence:** Order creation, cancellation, Paystack verification, and webhook handling exist. Source review noted signature verification and duplicate-event protection, but the complete runtime matrix has not been independently rerun in this review.
- **Next action:** Test unpaid expiry, retry, cancellation, duplicate webhook, late successful payment after cancellation, and stock restoration.
- **Acceptance:** Repeated events cannot double-process payment or stock; every state transition has a defined outcome.

### VLY-007 — Telegram delivery integration not implemented

- **Status:** DEFERRED
- **Priority:** Medium
- **Evidence:** Telegram delivery notifications are not implemented.
- **Next action:** Define triggers, minimum necessary fields, destination access, retries, and duplicate-notification protection after core operational flows are designed.
- **Constraint:** Paid orders should initially be sent only after an administrator approves delivery assignment. Keep credentials server-side and avoid unnecessary customer data.

### VLY-009 — Security boundary verification is incomplete

- **Status:** INVESTIGATING
- **Priority:** High before production certification
- **Evidence:** Firestore rules are stored in `firestore.rules`; the tracker records two local Emulator runs with 11/11 tests passing. Those tests do not prove that all privileged APIs and the deployed environment are secure.
- **Next action:** Review all privileged API routes and Firestore rules together, verify deployed configuration, and test admin/custom-claim behaviour.
- **Acceptance:** Every privileged action is server-authorized; direct client access is appropriately restricted; no production security certification is claimed without evidence.

### VLY-010 — Admin authorization runtime regression tests outstanding

- **Status:** INVESTIGATING
- **Priority:** High
- **Evidence:** `lib/admin-auth.ts` calls `/api/admin/auth/verify` and `/api/admin/auth/claim`. The verify endpoint checks a verified email against `ADMIN_EMAILS`. The dashboard, products, categories, and orders pages call the shared client guard in current source. A previous report said a normal customer could reach `/admin` after restarting the browser; source inspection alone neither reproduces nor disproves that runtime report.
- **Latest check:** On 28 October 2026 the user reported that `npx tsc --noEmit` passed and `npm run dev` started successfully on Next.js 16.4.2. No browser authorization test has been reported yet.
- **Next action:** With a regular customer account, test direct navigation to `/admin`, `/admin/orders`, `/admin/products`, and `/admin/categories`; verify redirect and session preservation. Then test authorized-admin access and privileged API denial.
- **Acceptance:** Ordinary customers cannot access protected pages or privileged APIs; denial does not unnecessarily sign a customer out; legitimate admin email/password and Google flows remain functional.

### VLY-011 — Cloudinary authorized/unauthorized upload behaviour needs runtime verification

- **Status:** INVESTIGATING
- **Priority:** High
- **Evidence:** Cloudinary is the current selected integration. The inspected upload route has server-side checks for admin authorization, permitted folders, file size, MIME type, and file signature. A previous 401/upload failure was reported; a successful authorized upload and a denied upload have not been confirmed in the current runtime checkpoint.
- **Next action:** Test a permitted upload as an authorized admin and the same endpoint as an ordinary customer; verify the persisted URL and rejection behaviour without exposing credentials.
- **Acceptance:** Authorized valid images upload and persist; unauthorized, oversized, or invalid files are rejected; secrets remain server-side.

### VLY-012 — Admin dashboard still contains demo metrics

- **Status:** OPEN
- **Priority:** High for Admin Portal readiness
- **Evidence:** The source-level audit found hardcoded statistics, sample recent-order entries, and a literal date in `app/admin/page.tsx`.
- **Impact:** The dashboard can display figures that do not represent current Firestore/payment/order records.
- **Next action:** After security verification, define a small set of computable launch metrics and their existing data sources. Replace demo values only through a separately agreed focused implementation task.
- **Acceptance:** No fabricated metrics or activity; definitions distinguish current-state counts from date-filtered totals and do not double-count linked records.

### VLY-013 — Inactive category/product visibility requires runtime regression verification

- **Status:** INVESTIGATING
- **Priority:** Medium
- **Evidence (checked 29 October 2026):** PR #3, `fix: hide inactive categories and products from storefront`, is merged into `main` at `c56be9b121e6007e1e99c6df2d3984e709771a92`. Source inspection confirms inactive category pages return not-found, inactive products are filtered from category listings, and product details reject inactive categories. This source inspection did not run browser tests.
- **Next action:** Verify active/inactive category and product scenarios in the browser and ensure inactive products cannot be purchased through the server order-creation endpoint.
- **Acceptance:** Inactive categories and products are not publicly browsable or purchasable, while admin management remains available; runtime evidence is recorded separately from source presence.

### VLY-014 — Category product-count/slug protection mismatch

- **Status:** INVESTIGATING
- **Priority:** Medium
- **Evidence (checked 29 October 2026):** The current product type and create/update/query helpers use `categoryId`, while `getCategoryProductCount` queries `category == slug`. PR #4 proposes a compatibility fix and is open/unmerged; the prevalence of legacy records has not been checked against production data.
- **Next action:** Review PR #4 against the current schema and existing records; verify the intended behaviour before merging or changing data.
- **Acceptance:** Product counts and category slug-change protection work with the current schema and any explicitly supported legacy records; no unnecessary data migration.

### VLY-015 — Admin Portal page specifications and priority baseline remain in review

- **Status:** OPEN
- **Priority:** High before broad Admin implementation
- **Evidence:** Admin Portal design PR #1 is merged. Requirements inventory and source-level validation from PR #2 are merged into `main`; the consolidated priority baseline and detailed page specifications still need formal review. The owner-confirmed launch operating model is recorded, but the full P0/P1/deferred baseline and page-by-page specifications are not all formally approved.
- **Next action:** Reconcile SDD documents, review/approve the priority baseline, then design each missing workflow before coding it.
- **Acceptance:** Each requirement is labelled proposed/approved/implemented/tested accurately; no new collection, route, field, type, or workflow is introduced without source inspection and an explicit need.

### VLY-016 — Shipment/PUDO/pricing operational implementation is not present in the inspected Admin routes

- **Status:** OPEN
- **Priority:** High for the approved parcel-operations launch scope
- **Evidence:** The source-level audit found no dedicated Admin routes in the inspected paths for shipments, PUDO management, delivery pricing, transactions, or audit logs. Existing order shipping metadata does not by itself implement independent shipments or route-leg movements.
- **Latest source check:** The second source pass found no dedicated shipment, pricing, PUDO, route/movement, or audit service module in the active TypeScript source inventory. This is a source-surface finding only; Firestore data and the uninspected `pudo.zip` archive were not checked.
- **Policy update:** DEC-023 resolves D-02: only registered, authenticated customers may create independent shipment bookings at launch. DEC-024 resolves D-03's high-level policy: booking party, sender, receiver/collection recipient, payer, and handover person may differ; payer visibility defaults to payment confirmation/receipt only; payment does not authorize full shipment-detail access; booking does not authorize collection; change authority is defined by type and lifecycle stage. Guest shipment booking remains excluded and storefront guest checkout is unchanged.
- **Still open:** Detailed verification checkpoints, sender/receiver consent, change-type permissions, post-intake/post-dispatch controls, business-account handling, and runtime tests.
- **Next action:** Complete the remaining owner decisions and reconcile the platform-wide SDD, then design the smallest compatible data and workflow representation after SDD approval.
- **Acceptance:** Shipment, order, payment, and transport-movement identities/lifecycles remain distinct; booking creation and customer-scoped access are server-authorized; no schema changes occur before review.

### VLY-017 — Privileged-action audit trail and minimum evidence handling need review

- **Status:** OPEN
- **Priority:** High for operational/legal readiness
- **Evidence:** No dedicated audit-log route was found in the inspected `app/admin` paths. A reusable audit helper or records elsewhere have not been ruled out.
- **Latest source check:** The active TypeScript `app/api` route inventory and `lib/` module inventory do not show a dedicated general audit-log or financial-event service. The Paystack webhook uses `paymentWebhookEvents` for idempotency/outcome handling; this is not a general audit trail. The root `pudo.zip` archive has not been inspected and is not treated as active source.
- **Next action:** Confirm whether `pudo.zip` is in scope; if not, continue with the active Next.js app and define the minimum audit/evidence requirements in the SDD.
- **Acceptance:** Important privileged decisions are traceable with actor, timestamp, action, target, reason where appropriate, and outcome; do not build an elaborate audit platform before verifying existing facilities.

### VLY-018 — Guest order-tracking email inbox placement

- **Status:** INVESTIGATING
- **Priority:** Low
- **Evidence:** Guest order-tracking email via Resend and a verified sender domain were reported working, but an early test landed in junk.
- **Next action:** Monitor delivery/inbox placement and maintain correct sender/domain configuration.
- **Acceptance:** Successful sends are observable and failures are handled without leaking API credentials or guest access tokens.

## Resolved / superseded historical items

### VLY-001 — Full repository TypeScript/build status unavailable in the original archive

- **Status:** RESOLVED for the original archive limitation; ongoing build verification remains a routine release check.
- **Evidence:** The current repository has root configuration. On 28 October 2026 the user reported `npx tsc --noEmit` passed and `npm run dev` reached ready state under Next.js 16.4.2. A current production build was not run in this checkpoint.
- **Follow-up:** Rerun `npx tsc --noEmit` and `npm run build` after application-code changes.

### VLY-002 — Authenticated order/customer UID association

- **Status:** RESOLVED based on the current progress record and prior implementation/testing reports.
- **Evidence:** Authenticated order creation associates orders server-side with the verified Firebase UID while preserving guest checkout.
- **Constraint:** Reinspect current source before modifying this path; clients must never choose another user's UID.

### VLY-003 — Customer account experience

- **Status:** RESOLVED based on implemented and previously tested flows.
- **Evidence:** Customer registration, sign-in/out, recovery, dashboard, profile, and customer-scoped order history/details are recorded as implemented. Profile persistence and cross-customer order-detail denial were reported tested.
- **Constraint:** Keep customer identity separate from admin authorization.

### VLY-006 — Customer-facing order tracking

- **Status:** RESOLVED based on current progress and reported tests.
- **Evidence:** A guest order-tracking page under `app/track-order/`, token-protected tracking API, and guest tracking email are recorded as implemented. Continue regression testing.

### VLY-008 — Cloudinary hosting decision

- **Status:** RESOLVED as a product decision; integration runtime verification is tracked by VLY-011.
- **Evidence:** Cloudinary was selected because of the Firebase free-tier/storage constraints, and the current code includes the integration.
- **Decision reference:** DEC-008 in `DECISIONS.md`.

## Product decisions still open

1. **Guest-order claiming:** Decide whether an existing guest order can be securely claimed by a signed-in customer.
2. **Shipment lifecycle and transition permissions:** Define actual launch states, allowed transitions, exception handling, and minimum evidence before implementing shipment workflows.
3. **Pricing policy values:** Define formulas, distance bands, material-discrepancy thresholds, review/approval limits, and permitted settlement methods.
4. **Proof of delivery:** The business accepts flexible proof methods; define mandatory evidence by delivery type and access/retention rules.
5. **Returns:** If not supported in the initial release, document the temporary manual procedure.
6. **Staff permissions:** DEC-022 accepts the minimal hybrid staff model. The current allowlist/admin-claim design does not prove that workflow-specific permissions, sensitive-action approval boundaries, and audit evidence are implemented. Define the action matrix and verify every privileged API/rule before implementation or acceptance.
7. **Admin priority baseline:** Review the P0/P1/deferred inventory in `ADMIN_REQUIREMENTS.md`; operating-model choices are recorded as owner-confirmed, but formal baseline approval remains pending.


### D-04 policy reconciliation — DEC-025

- **Status:** High-level owner decision accepted; detailed operational controls remain open.
- **Accepted:** Per-location capabilities and lean location records. Walk-in intake creation, measurement, custody acceptance, payment recording, and parcel release are separate capabilities; actions require server-side authorization and consequential events retain actor/location/time plus applicable evidence.
- **Still open:** Staff capability assignment, collection-centre partner access, measurement/discrepancy rules, payment-at-intake methods/evidence, collection verification, and second-person approval requirements.
- **Next action:** Carry DEC-025 into the consolidated SDD and define detailed acceptance tests only after the remaining dependent decisions and source validation are complete.
- **Boundary:** Documentation-only decision; no application code, schema, route, permission implementation, or runtime behaviour was changed or tested.

### D-05 pricing policy reconciliation — DEC-026

- **Status:** High-level owner decision accepted; detailed commercial rules remain open.
- **Accepted:** Select fixed or calculated pricing by service; share the approved rule set across storefront delivery and independent shipment booking wherever inputs overlap; configure quote validity by service; preserve accepted quote inputs, itemized charges, total, currency, and applicable rate/rule version/effective context.
- **Possible calculated inputs:** Origin/destination or distance band, parcel weight, dimensions/volumetric weight, service class/delivery speed, and configured minimum charge, as applicable to the selected service.
- **Still open:** Exact formulas, units, service mapping, distance source/bands, rounding, rate effective dates, expiry/re-quote behaviour, taxes/fees/discounts, and adjustment thresholds/approval.
- **Next action:** Resolve D-06 measurement discrepancy and adjustment approval before defining detailed repricing and runtime acceptance scenarios.
- **Boundary:** Documentation-only decision; no application code, schema, route, pricing implementation, or runtime behaviour was changed or tested.

### VLY-019 — Platform-wide SDD completeness and reconciliation

- **Status:** OPEN
- **Priority:** Blocking for new application-code implementation under the current owner-approved working direction.
- **Evidence:** PR #7 (actor/responsibility), PR #8 (shared workflows), PR #9 (domain/lifecycle/API/security draft), and PR #10 (implementation source traceability) are merged. The follow-up source pass is recorded in `IMPLEMENTATION_SOURCE_TRACEABILITY.md`; it checked current TypeScript helpers, Admin pages, Firestore rules/tests, payment routes, and design decisions. The drafts and source map expose remaining owner decisions, scope questions, and runtime verification work; merging documents does not approve unresolved policy.
- **Next action:** Confirm whether the root `pudo.zip` archive is in scope for the active source review; resolve remaining owner decisions in `DECISIONS.md`; reconcile the source findings with the completeness audit and acceptance criteria. D-01's high-level staff model is accepted as DEC-022, while action-level permissions and approval rules remain design work. Application-code implementation remains blocked until the platform-wide SDD is reviewed and approved.
- **Acceptance:** Every launch-essential workflow has an agreed owner, lifecycle, permissions, data relationships, API/integration expectations, exception handling, and acceptance/test criteria; unresolved business rules are explicitly listed for owner decision; continuity docs agree on status and evidence; no application code is changed to close this issue.

### VLY-020 — Shared platform workflows require owner review

- **Status:** OPEN
- **Priority:** Blocking for detailed implementation planning
- **Evidence:** `PLATFORM_SHARED_WORKFLOWS.md` was reviewed and merged in PR #8 on 29 October 2026. It establishes a reviewed workflow-draft baseline but leaves detailed policy unresolved by design.
- **Policy update:** DEC-024 now resolves the high-level D-03 party/access direction. The shared workflow must retain the remaining detail as open policy: verification checkpoints, consent, per-change permissions and lifecycle stage, post-intake/post-dispatch handling, and notification fields.
- **Next action:** Keep the unresolved policy list in `PLATFORM_SHARED_WORKFLOWS.md` and `DECISIONS.md` current while the domain/lifecycle contract work proceeds. Do not close the issue until each launch-essential workflow has agreed owners, transitions, permissions, evidence, exception outcomes, and testable acceptance criteria—or an explicit owner decision/blocker.
- **Acceptance:** Each launch-essential workflow has an agreed owner, trigger, transitions, exception outcomes, permissions, evidence, and testable acceptance criteria—or a clearly recorded owner decision/blocker. No application code is changed to close this issue.

### VLY-021 — Conceptual domain, lifecycle, and API/security contracts require review

- **Status:** OPEN
- **Priority:** Blocking for implementation design
- **Evidence:** The domain/lifecycle/API/security draft is merged but remains a draft for owner review. `IMPLEMENTATION_SOURCE_TRACEABILITY.md` now includes a second source pass: all four inspected Admin pages call `verifyAdminAccess`; category/product helpers use client Firestore writes behind custom-claim rules; checkout uses the server order route while a legacy client-side order helper remains; the webhook event record is for deduplication rather than a general audit ledger. Independent booking/PUDO/pricing/routing/audit source surfaces and complete runtime evidence remain unresolved. No tests were executed and production configuration/data were not inspected.
- **Next action:** Confirm whether `pudo.zip` is authoritative/in-scope; then resolve the open domain, pricing, custody, routing, financial-event, and audit decisions and reconcile the full SDD acceptance matrix. Do not implement until the complete SDD is approved.
- **Acceptance:** Owner-approved conceptual relationships and transition rules exist for launch-essential flows; API/security contracts define validation, authorization, failure, idempotency, concurrency, and audit expectations; source facts and runtime evidence are documented separately; no application code is changed to close this issue.

## Source-traceability checkpoint — 29 October 2026

- PR #10 is merged. A second read-only pass expanded the source map to include category/product client helpers, all four Admin page guards, payment recovery surfaces, and the distinction between webhook deduplication and a general audit ledger.
- `pudo.zip` is present at repository root but has not been inspected; confirm whether it belongs to the active VeriLyft source scope before including it in the SDD evidence model.
- The Admin authorization issue remains a runtime verification task; current source calls `verifyAdminAccess` on all four inspected Admin pages, but no browser reproduction was performed.

- `IMPLEMENTATION_SOURCE_TRACEABILITY.md` records the current read-only source inventory and distinguishes source presence from runtime evidence.
- PR #3 is merged; its source change is present, but browser regression verification remains open under VLY-013.
- PR #4 remains open/unmerged; do not describe its proposed compatibility fix as part of `main`.
- Current baseline inspected: `c56be9b121e6007e1e99c6df2d3984e709771a92`.
- Application-code implementation remains blocked by VLY-019 until the platform-wide SDD is reconciled and approved.

## Maintenance rule

When new evidence arrives, update the relevant issue in this file and the matching row/session log in `PROGRESS.md`. Record material architecture/product decisions in `DECISIONS.md`. Do not close an issue solely because a source file exists; use actual test results where the acceptance criterion requires runtime behaviour.

### D-06 measurement discrepancy and adjustment approval — DEC-027

- **Status:** High-level owner policy accepted; detailed rules remain open.
- **Accepted:** Use configurable, service-appropriate thresholds; preserve quoted and actual intake measurements separately; retain actor/location/time and applicable evidence; link proposals to the original quote; require review for material discrepancies and adjustments affecting existing payments; keep proposed adjustments separate from approved charges and settled financial events.
- **Still open:** Numeric thresholds, units and service-specific measurement requirements, staff approval limits, second-person rules, customer notification/consent, and explicit acceptance/dispute/refusal outcomes.
- **Next action:** Resolve D-07 payment-at-intake methods and evidence, then continue the dependency-ordered owner decisions. Keep the platform-wide SDD approval gate in force; no application code changed or tested for this policy decision.


### D-08 cancellation, late payment, refunds, credits, and reconciliation — DEC-029

- **Status:** High-level owner policy accepted on 30 October 2026 (Option A: explicit financial events with controlled transitions and reconciliation).
- **Accepted:** Cancellation is not a refund; late payments after cancellation/expiry are recorded and reconciled without automatic reactivation; refund request and execution are distinct; credits, additional payments, reversals, and chargebacks remain separate traceable events; provider/bank reconciliation mismatches are investigated; consequential financial actions retain actor/time/reason/reference/evidence; duplicate/replayed provider events must not duplicate financial effects; operational, cancellation, payment, and refund states remain distinct.
- **Still open:** Refund authority/limits/timelines, cancellation fees, partial-refund policy, credit expiry/use, late-payment disposition, reconciliation frequency/ownership, exception handling, and detailed tests.
- **Next action:** Continue to D-09 dispatch exception authority. Preserve the platform-wide SDD approval gate; no application code changed or tested for this policy decision.

### D-09 dispatch exception authority — DEC-030

- **Status:** High-level owner policy accepted on 30 October 2026 (Option A: narrow, controlled dispatch exceptions).
- **Accepted:** Verified payment remains the default dispatch prerequisite; exceptions are limited to explicitly defined operational circumstances under an approved policy; only staff with explicitly assigned permission may approve; the requester must not automatically approve their own request; material exceptions require a second approver; exceptions preserve payment status and cannot bypass unrelated safety, custody, identity, legal, or other operational holds; parcel/shipment, reason, requester, approver(s), timestamp, supporting evidence, and outcome must be attributable.
- **Still open:** Eligible circumstances, exact permission assignment, materiality/second-approval rules, monetary or operational limits, category-specific evidence, pre-dispatch revocation, and detailed acceptance tests.
- **Next action:** Continue to D-10 routing, route-leg assignment, and movement evidence. Preserve the platform-wide SDD approval gate; no application code changed or tested for this policy decision.
