# VeriLyft Issues, Risks, and Open Questions

**Last updated:** 28 October 2026  
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
- **Evidence:** `lib/admin-auth.ts` calls `/api/admin/auth/verify` and `/api/admin/auth/claim`. The verify endpoint checks a verified email against `ADMIN_EMAILS`. The dashboard, products, categories, and orders pages use the shared client guard. A previous report said a normal customer could reach `/admin` after restarting the browser; the current behaviour has not yet been reproduced or disproved in the active runtime test.
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

### VLY-013 — Inactive category/product visibility change is not yet part of main baseline

- **Status:** INVESTIGATING
- **Priority:** Medium
- **Evidence:** PR #3, `fix: hide inactive categories and products from storefront`, remains open and unmerged at the 28 October 2026 checkpoint. Do not assume its change is in local `main`.
- **Next action:** Check the PR diff and tests, then verify merge status and browser behaviour before marking the feature complete.
- **Acceptance:** Inactive categories and products are not publicly browsable or purchasable, while admin management remains available.

### VLY-014 — Category product-count/slug protection mismatch

- **Status:** INVESTIGATING
- **Priority:** Medium
- **Evidence:** The reviewed product schema associates products through `categoryId`; a category helper has been observed querying by a different `category` field/slug. PR #4 proposes a compatibility fix and remains open and unmerged at the 28 October 2026 checkpoint.
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
- **Next action:** After security verification and requirements approval, inspect existing order/types/services and design the smallest compatible data and workflow representation.
- **Acceptance:** Shipment, order, payment, and transport-movement identities/lifecycles remain distinct; no schema changes occur before review.

### VLY-017 — Privileged-action audit trail and minimum evidence handling need review

- **Status:** OPEN
- **Priority:** High for operational/legal readiness
- **Evidence:** No dedicated audit-log route was found in the inspected `app/admin` paths. A reusable audit helper or records elsewhere have not been ruled out.
- **Next action:** Search existing source for audit/event logging and identify the minimum necessary records for admin changes, payment exceptions, measurement adjustments, delivery proof, and government requests.
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
6. **Staff permissions:** Current allowlist/admin-claim design does not prove a granular staff role/permission model. Confirm whether role separation is required at launch.
7. **Admin priority baseline:** Review the P0/P1/deferred inventory in `ADMIN_REQUIREMENTS.md`; operating-model choices are recorded as owner-confirmed, but formal baseline approval remains pending.

## Maintenance rule

When new evidence arrives, update the relevant issue in this file and the matching row/session log in `PROGRESS.md`. Record material architecture/product decisions in `DECISIONS.md`. Do not close an issue solely because a source file exists; use actual test results where the acceptance criterion requires runtime behaviour.
