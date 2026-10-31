# VeriLyft Implementation-to-SDD Source Traceability

**Document status:** Read-only source inventory — refreshed active-source pass; policy reconciliation remains separate  
**Inspection date:** 30 October 2026 (source inspection; repository-history comparison refreshed 31 October 2026)  
**Repository baseline inspected:** `main` at `e0f69055d33dd9399c23e1d793f359468229c856` (PR #31 merge; refreshed in PR #32)  
**Scope:** Active application source mapped to A-01–A-20 and ADM-R01–ADM-R54; the root `pudo.zip` archive and production environment remain uninspected  
**Authority:** Source facts only. This document does not approve product policy, prove runtime behaviour, or authorize implementation.

## 1. Inspection method and evidence limits

The initial inspection narrative in Sections 1–5 is retained as historical context. The refreshed source pass in Section 6 is authoritative where the earlier narrative differs. The refreshed pass inspected the recursive repository tree and selected current source files at the stated baseline; it did not modify or execute application code, inspect production Firestore records, inspect deployed configuration, test provider credentials, or reproduce browser/runtime behaviour. The root `pudo.zip` archive was not unpacked or audited.

Use this document to separate:
- **Observed in source:** code/configuration exists at the cited path.
- **Reported evidence:** test or runtime result reported in project continuity docs; not independently reproduced here.
- **Not found in inspected surface:** no matching route/type/rule was present in the inspected repository path inventory; this is not a claim that no helper or record exists anywhere unless the search scope is stated.
- **Design gap / owner decision:** requires approved policy and/or further inspection before implementation.

## 2. Current source map

| Domain / capability | Current source evidence | Source-level observation | SDD consequence |
|---|---|---|---|
| Storefront order creation | `app/api/orders/route.ts` | Allows guest checkout; optionally verifies a Firebase ID token and requires verified email for account checkout. Validates customer/delivery/item input, merges duplicate product IDs, reads current product data, calculates prices server-side, checks active state/stock, and atomically decrements stock and creates an order. | A concrete storefront-order path exists. It is not an independent shipment-booking workflow. |
| Order record / item snapshot | `app/api/orders/route.ts`, `lib/types/order.ts`, `lib/firebase/orders.ts`, `app/checkout/page.tsx` | The active checkout posts to `/api/orders`, where the server validates product/stock and creates the order transactionally. `lib/firebase/orders.ts` still exports a legacy client-side `createOrder` helper, but checkout's import of it is commented out. The helper attempts direct client writes to `orders`, which the current Firestore rules deny. | Treat the server route as the inspected checkout path; do not reactivate the legacy helper without an explicit design decision and rules/security review. Preserve order-time item facts; do not mistake the existing order's shipping object for a complete shipment/consignment or route-leg model. |
| Guest order access | `app/api/orders/route.ts`, `app/api/orders/[orderId]/track/route.ts`, `app/api/orders/[orderId]/cancel/route.ts` | A random access token is generated for an order; only its SHA-256 hash is stored. Tracking/cancellation compare a supplied token-derived hash using constant-time comparison. Cancellation only permits pending/unpaid orders and restores stock in a Firestore transaction. | The guest capability token is an access credential, not a customer account or general authorization role. DEC-035 accepts separate secure recovery and optional claiming; this source snapshot does not show that policy implemented. |
| Customer order access | `app/api/account/orders/route.ts`, `app/api/account/orders/[orderId]/route.ts`, `app/api/orders/[orderId]/track/route.ts` | Customer endpoints verify Firebase ID tokens, require verified email, and derive order ownership from the token UID and stored `users/{uid}` document reference. Tracking distinguishes account ownership from guest-token access. | Customer authentication and record entitlement are separate checks. DEC-035 accepts optional claiming only after authenticated account context plus a separate ownership challenge; implementation and runtime evidence remain to be established. |
| Payment initialization | `app/api/payments/initialize/route.ts` | Requires the order access token, checks pending order/payment state, reuses an already stored checkout URL when present, sends provider requests server-side, checks the returned reference and checkout host, and rechecks state transactionally before saving the reference/URL. | Provider initialization is not payment settlement. Concurrent initializations and external-success/local-save failure need focused recovery testing and a defined idempotency contract. |
| Payment verification | `app/api/payments/verify/route.ts` | Looks up an order by saved payment reference and verifies directly with Paystack. Checks reference, success state, amount, NGN currency, and transaction ID. Uses a transaction to update current order state, avoids normal fulfilment for cancelled orders, flags review-required mismatches/late payment, and treats already-paid verification as a replay. | Provider verification is authoritative evidence for the payment result; order/fulfilment status remains distinct. The endpoint's requester entitlement and response exposure should be reviewed against the approved API contract. |
| Payment webhook | `app/api/payments/webhook/route.ts` | Verifies the HMAC-SHA512 signature against the raw body; handles `charge.success`; validates core event fields; matches a stored reference; creates a deterministic event key in `paymentWebhookEvents`; processes event and order in a transaction; checks amount/currency; flags late payment or status conflicts. | Some webhook replay protection exists in source. Runtime duplicate/concurrency/late-event scenarios remain unverified; a webhook-event record is not a general ledger or full financial-event model. |
| Admin authorization | `lib/admin-auth.ts`, `app/api/admin/auth/verify/route.ts`, `app/api/admin/auth/claim/route.ts`, `app/admin/page.tsx`, `app/admin/categories/page.tsx`, `app/admin/products/page.tsx`, `app/admin/orders/page.tsx` | All four inspected Admin pages call `verifyAdminAccess(user)` after the client auth-state and verified-email checks. The helper calls the server verification endpoint against `ADMIN_EMAILS`, requests the `admin: true` custom claim, and refreshes the ID token. The relevant Admin APIs also check the bearer token/email allowlist server-side. | Current source contains a client-side allowlist guard and independent server-side checks. The previously reported customer-access issue is not established by this source read; reproduce direct navigation/browser restart and verify API denial before deciding whether a defect remains. Granular staff roles are not represented by this allowlist. |
| Admin server APIs | `app/api/admin/orders/route.ts`, `app/api/admin/orders/[orderId]/route.ts`, `app/api/admin/uploads/images/route.ts` | These routes independently verify a bearer Firebase ID token, verified email, and membership in `ADMIN_EMAILS`; they fail closed if the allowlist is empty. | Current source uses an email allowlist, not a granular staff role/scope model. Do not infer Operations/Finance/Management roles from admin access. |
| Admin catalogue writes | `firestore.rules`, `app/api/admin/auth/claim/route.ts`, `lib/firebase/categories.ts`, `lib/firebase/products.ts`, admin category/product forms | Category and product CRUD helpers use direct Firebase client SDK writes. Firestore rules permit public catalogue reads and require verified email plus `admin == true` claim for catalogue writes; direct client reads/writes to orders are denied. The category-count helper queries products by `category == slug`, while the current product type and create/update helpers use `categoryId`; open PR #4 proposes current-field plus legacy-field counting and remains unmerged. | Rules and Admin SDK routes must be reviewed together. The rules tests cover catalogue read/write gates and order direct-client denial, not all API routes or deployed configuration. The field mismatch is source-confirmed, but the prevalence of legacy/current records has not been checked against production data. |
| Image upload | `app/api/admin/uploads/images/route.ts` | Requires server-side admin authorization, Cloudinary configuration, folder allowlist (`categories`, `products`), maximum 5 MiB, allowed JPG/PNG/WebP MIME type, and signature-byte detection before upload. | Validation controls are present in source. Successful authorized upload, unauthorized denial, persistence, and deployed secret/configuration remain runtime verification items. |
| Admin order fulfilment | `app/api/admin/orders/[orderId]/route.ts`, `app/api/admin/orders/route.ts`, `lib/types/order.ts` | Admin can progress paid, non-cancelled orders through `processing → ready_for_shipping → shipped → delivered`; shipping metadata includes provider, tracking number, estimated delivery, notes, and timestamps. A transaction checks the current state before applying the transition. | This is a storefront-order fulfilment lifecycle. It does not establish independent booking, intake/custody, route proposals/legs, dispatch handover evidence, failed-delivery resolution, or proof-of-delivery policy. |
| Catalogue visibility | `app/products/[category]/page.tsx`, `app/products/[category]/[slug]/page.tsx`, `lib/firebase/products.ts` | At this baseline, PR #3 is merged: inactive category pages return not-found, inactive products are filtered from category listings, and product details reject inactive categories. | This source fact supersedes older issue text saying PR #3 is unmerged; browser regression evidence is still separate. |
| Independent shipment / PUDO / pricing / routing | Repository route inventory under `app/api/`; SDD workflow/domain drafts | The current API route inventory includes account, admin auth/orders/uploads, storefront orders/cancel/track, and payment initialize/verify/webhook. No dedicated shipment-booking, intake/custody, PUDO location management, pricing, route proposal/leg, movement/handover, or audit-log API route was found in that inventory. | The approved launch scope described in the workflow draft is not represented by a complete inspected API surface. Existing source must be searched further for reusable helpers/data before any implementation proposal. |
| Audit / financial records | `app/api/payments/webhook/route.ts`, repository route inventory, `lib/` source inventory | A `paymentWebhookEvents` collection is used for webhook deduplication/outcome records. The inspected `lib/` inventory contains no obvious dedicated audit/event, refund, reconciliation, shipment, pricing, route, or PUDO service module, and the API route inventory contains no dedicated route for those capabilities. | This establishes a gap in the inspected active TypeScript source surface, not proof that no data exists in Firestore or an uninspected archive. Do not treat webhook records or order payment fields as a full audit trail, ledger, refund, credit, reconciliation, or approval workflow. |
| Firestore rules tests | `tests/firestore.rules.test.mjs` | The test file defines 11 rules tests: public category/product reads; denial of unauthenticated/customer/unverified-admin catalogue writes; acceptance of verified admin-claim catalogue writes; and denial of direct client order reads/writes. | This test file is narrower than end-to-end authorization coverage. The progress tracker reports local Emulator runs, but this source inspection did not execute them. |

## 3. Source-level lifecycle snapshot

### Storefront order
1. Request is validated; authenticated customer identity is derived from a verified Firebase token when supplied, otherwise guest checkout is allowed.
2. Current Firestore product records determine active state, price, and stock.
3. A transaction decrements stock and creates a pending order with a pending payment state and guest-token hash.
4. Payment initialization is a separate provider operation.
5. Payment verification/webhook may move a pending order to paid/processing, or mark it for review on mismatches, late payment, or a status conflict.
6. Admin fulfilment transitions a paid order through ready-for-shipping, shipped, and delivered.
7. Guest cancellation is limited to pending/unpaid orders and atomically restores stock.

This snapshot is derived from source. It is not a complete approved product lifecycle and does not prove the paths have passed current runtime tests.

### Independent shipment booking and parcel operations
The inspected source inventory does not show an implemented end-to-end independent booking lifecycle. Accepted owner decisions now establish high-level policy for booking eligibility, party access, pricing/quote preservation, intake/custody capabilities, payment-at-intake, adjustments, dispatch, routing, delivery, audit, notifications, guest recovery, and launch evidence. Detailed lifecycle relationships, parcel cardinality, quote/route relationships, custody evidence, settlement contracts, and exact permissions remain specification work. Do not fill those gaps by treating an order as a shipment or inventing statuses.

## 4. Key mismatches and follow-up work

| ID | Finding | Type | Next action (no implementation yet) |
|---|---|---|---|
| TRACE-01 | Progress/handoff text still points to PR #8 or PR #9 as the current draft/review checkpoint even though PR #9 is merged. | Documentation drift | Reconcile current baseline pointers and mark source mapping as the active task. |
| TRACE-02 | Issue VLY-013 says PR #3 is open/unmerged, but PR #3 is merged at current main. | Documentation drift | Update issue status/evidence; do not claim browser regression tests ran. |
| TRACE-03 | All four inspected Admin pages call `verifyAdminAccess`; Admin APIs independently use `ADMIN_EMAILS`. The prior report of customer access is not confirmed by this source inspection. | Verification gap | Keep VLY-010 open until direct navigation/browser restart and customer-vs-admin API denial are tested in the actual runtime. Do not claim the defect is fixed or reproduced based on source alone. |
| TRACE-04 | Payment verification and webhook contain transaction/replay guards, but complete runtime matrix is not evidenced in this inspection. | Verification gap | Keep VLY-005 open; test duplicate, concurrent, late-success-after-cancellation, mismatched amount/currency, and stock consistency. |
| TRACE-05 | Cloudinary route contains source validation and authorization, but successful and denied uploads remain unverified. | Verification gap | Keep VLY-011 investigating; test authorized valid image and unauthorized/invalid/oversized requests. |
| TRACE-06 | Order fulfilment fields/statuses do not represent the full parcel operations workflows in the domain draft. | Domain coverage gap | Continue platform SDD and owner decisions before proposing compatible data/contracts. |
| TRACE-07 | Firestore rules tests are limited to catalogue and order direct-client access. | Test coverage gap | Define platform-wide authorization matrix and tests after role/scope policy is approved. |
| TRACE-08 | No dedicated audit or general financial-event API route appears in the route inventory; reusable helpers/records elsewhere have not been ruled out. | Source investigation gap | Search remaining source for audit/event logging, refunds, credits, reconciliation, and financial records. |
| TRACE-09 | Payment initialization calls the provider before the final transactional save. Concurrent requests or a provider-success/local-save failure may require reconciliation. | Recovery/idempotency question | Inspect remaining provider integration and define a testable recovery contract before implementation. |

## 5. Second-pass source findings

- The current `DECISIONS.md` records conceptual acceptance of a distinct independent-shipment domain and a launch scope that includes booking, walk-in/advance intake, PUDO locations, shared pricing, route proposals/legs, proof of delivery, and failed-delivery resolution. Those accepted business-scope statements do not establish that the source implementation exists, and the exact lifecycle/data/API details remain open.
- All four inspected Admin pages call `verifyAdminAccess`. The prior report that a normal customer can access `/admin` after browser restart is therefore a runtime report to reproduce, not a defect confirmed by the inspected source.
- Category/product CRUD helpers use direct Firebase client SDK operations protected by custom-claim Firestore rules. This is a distinct pattern from the Admin APIs that use Firebase Admin SDK and server-side allowlist checks.
- `lib/firebase/orders.ts` retains a legacy client-side order-creation helper. The inspected checkout path posts to `/api/orders`, while Firestore rules deny direct client order writes. The legacy helper should not be reactivated without an approved design and security review.
- `paymentWebhookEvents` is a deterministic webhook deduplication/outcome record. The inspected source does not show a general audit log or general financial-event ledger. No dedicated payment-recovery/expiry worker or route was found in the current route inventory; recovery and expiry policies remain unresolved.
- `pudo.zip` exists at repository root but was not unpacked or audited; its contents are not treated as current deployed VeriLyft behaviour.

## 6. Still unresolved — do not infer

The following are detailed design, source-verification, or evidence questions—not undecided high-level D-01–D-15 owner choices:

- Exact staff action/permission matrix, staff assignment, second-person approval thresholds, and partner access.
- Booking-to-shipment/consignment creation gate, parcel cardinality, order/shipment relationships, and change authority by type/lifecycle stage.
- Pricing formulas/units/rate configuration, discrepancy thresholds, adjustment consent/outcomes, and settlement mechanics.
- Mandatory proof methods by service, failed-delivery resolution authority, attempt limits, returns/holding/refusal/dispute handling.
- Payment expiry/recovery worker behaviour, provider-success/local-failure reconciliation, refund/credit execution and operational ownership.
- Notification event/recipient/channel/field matrix, consent/preferences, retry/deduplication semantics, and failure ownership.
- Guest recovery challenge format/lifetime, rate limits, token rotation/revocation mechanics, eligibility, and support exception procedure.
- Audit event/evidence catalogue, retention periods, reviewer matrix, legal-hold procedure, evidence integrity, and disclosure workflow.
- Requirement-level P0/P1/deferred mapping, detailed P0 acceptance evidence, and current deployed configuration/runtime verification.

DEC-022–DEC-036 record accepted high-level owner policies. Do not relabel these details as pending owner decisions unless a genuinely new owner choice is required.

## 7. Recommended next steps

1. Confirm whether the root `pudo.zip` archive is in scope; it was not unpacked or audited in the source pass recorded here.
2. Refresh the read-only source inventory against accepted DEC-022–DEC-036 policies, searching for reusable helpers/data before declaring a capability absent.
3. Map each requirement to source evidence, a gap, or an explicit not-inspected/not-verified state.
4. Define requirement-level P0/P1/deferred classification and detailed acceptance/evidence scenarios.
5. Obtain explicit approval of the complete platform-wide SDD before any application-code changes.
6. Only after approval, propose a minimal compatible implementation plan and a separate safe-environment runtime verification plan.

**No application code or runtime behaviour was changed during this inspection.**


---

## 6. Refreshed source-traceability pass — 30 October 2026

**Current repository baseline:** `main` at `e0f69055d33dd9399c23e1d793f359468229c856` (PR #31 merge commit).  
**Active-source inspection:** read-only inspection of the recursive repository tree and selected current source files at this exact commit.  
**Purpose:** supersede the historical baseline and status claims in §§1–5 where they conflict with this refreshed pass. Historical observations remain useful context but are not current evidence unless rechecked below.

### 6.1 Inspection scope and limits

Inspected the current recursive tree and relevant source for:
- all active `app/api/` route paths;
- storefront order creation, cancellation and tracking;
- customer order/profile endpoints;
- Admin order and image-upload endpoints;
- payment initialization, verification and webhook handling;
- Admin page authorization guards;
- Firebase Admin/client helpers, order types, Firestore rules and Firestore rules tests;
- category/product data helpers and relevant storefront/Admin pages.

The active API route inventory at this baseline contains account profile/orders, Admin auth/orders/uploads, storefront orders/cancel/track, and Paystack initialize/verify/webhook routes. The active `lib/` tree contains Firebase/auth/order/product/category, Cloudinary, validation and type helpers. **No dedicated active route or service module was found** for independent shipment booking, PUDO location/capability management, shared shipment pricing/quotes, intake/custody, route proposals/legs, transport movement/handover, delivery proof, general audit events, refunds/credits, or reconciliation.

**Not inspected:** the root `pudo.zip` archive; deployed environment variables/secrets; production Firestore records; provider dashboards/settlements; deployed rules version; live browser/API behaviour. The archive is not treated as active application source unless the owner confirms it is in scope. This pass did not execute tests or modify application code.

Evidence labels used below:
- **Source present:** relevant active source exists; does not establish completeness or runtime success.
- **Partial:** only part of the requirement is represented in active source.
- **No active source found:** no relevant route/service/data contract was found in the inspected active source tree; this is not a claim about the uninspected archive or production data.
- **Runtime unverified:** source inspection did not reproduce the required behaviour.
- **Not applicable to launch:** priority matrix explicitly places the capability in P1/deferred scope.

### 6.2 Cross-domain acceptance mapping (A-01–A-20)

| ID | Priority | Current source evidence / observation | Source assessment | Runtime / evidence state |
|---|---|---|---|---|
| A-01 Storefront/catalogue | P0 | `app/products/**`, `lib/firebase/products.ts`, `lib/firebase/categories.ts`, Admin catalogue pages/forms, `firestore.rules` | Partial-to-present: public catalogue and Admin CRUD paths exist; active/inactive filtering is represented. Category product-count helper has a `category == slug` versus current `categoryId` field mismatch. | Browser visibility, direct API purchase denial for inactive products, CRUD and count/slug-protection tests remain required. |
| A-02 Cart/checkout | P0 | `context/cart-context.tsx`, `app/cart/page.tsx`, `app/checkout/page.tsx`, `app/api/orders/route.ts` | Present for storefront checkout: server validates current products/prices/stock, normalizes duplicate product lines, reserves stock and creates an order transactionally. | Duplicate-submit, contention/oversell, malformed payload and failure/retry scenarios require current evidence. |
| A-03 Storefront order lifecycle | P0 | `app/api/orders/**`, `app/api/payments/**`, `app/api/admin/orders/**`, `lib/types/order.ts` | Partial: pending/cancelled/processing/ready-for-shipping/shipped/delivered and payment states exist. This is not the full parcel/shipment lifecycle. | Cancellation, late payment, duplicate/concurrent callbacks, status conflicts and stock restoration need a dated runtime matrix. |
| A-04 Customer account/order access | P0 | `app/account/**`, `app/api/account/**`, `app/api/orders/[orderId]/track/route.ts`, `lib/customer-auth.ts` | Partial-to-present: authenticated customer profile/order access and guest-token tracking exist. No separate guest-order recovery/claim challenge flow was found. | Ownership, verified-email, cross-account denial, token expiry/replay and DEC-035 recovery/claim tests remain open. |
| A-05 Independent shipment booking | P0 | No matching active route/service in `app/api/` or `lib/` inventory. | No active source found. Storefront orders are not independent shipment bookings. | Not implemented/verified in inspected source. |
| A-06 Shared pricing/quote acceptance | P0 | Existing storefront product price validation in `app/api/orders/route.ts`; no shared shipment pricing/quote service found. | Partial only for catalogue item pricing; DEC-026 quote/rate snapshots and independent shipment pricing not represented. | Pricing formula, quote snapshot/reproducibility, expiry and adjustment evidence absent. |
| A-07 Payment initialization/confirmation | P0 | `app/api/payments/initialize/route.ts`, `verify/route.ts`, `webhook/route.ts` | Partial-to-present for Paystack storefront orders: server-side initialization, provider verification, signature validation, transaction updates and webhook event deduplication exist. | VLY-005 scenarios, provider/local divergence, concurrency, replay and late payment remain runtime-unverified. |
| A-08 Refunds/adjustments/reconciliation | P0 | Order payment fields and `paymentWebhookEvents`; no dedicated refund, credit, reversal or reconciliation route/service found. | No complete financial-event workflow found. Webhook deduplication records are not a ledger or reconciliation system. | Refund execution, credit, reversal, chargeback and provider/bank reconciliation evidence absent. |
| A-09 Physical intake/measurement/custody | P0 | No matching active route/service/data contract found. | No active source found. | No intake, measurement, custody or handover evidence to verify. |
| A-10 Location/service capability | P0 | No active location-management route/service found. | No active source found. | Per-location capabilities and partner/station access not represented in inspected source. |
| A-11 Routing/route proposals | P0 | No active route proposal/approval/leg service found. | No active source found. | Proposal, approval, assignment and route-change evidence absent. |
| A-12 Dispatch/movement/handover | P0 | Storefront fulfilment status update in Admin order API only. | Partial only for basic paid storefront-order fulfilment; no independent route-leg dispatch, physical handover or movement event model found. | Physical actor, recorder, location, leg and handover proof not represented/verified. |
| A-13 Delivery attempt/outcome | P0 | Admin order status can be set through shipped/delivered; shipping metadata includes provider/tracking/estimated delivery/notes. | Partial: a delivered status exists, but no failed-attempt, collection, return or approved proof-of-delivery workflow found. | Delivery evidence and failure-resolution scenarios absent. |
| A-14 Notifications/Telegram | P0 / Conditional P0 | Guest tracking email is sent from order creation; no general event/recipient/channel notification service found. | Partial for a narrow guest tracking email only. Telegram is not established as implemented; DEC-034 gate remains policy. | Event catalogue, recipient entitlement, consent, deduplication, retry and failure visibility unverified/absent. |
| A-15 Admin/Operations access | P0 | `lib/admin-auth.ts`, `app/api/admin/auth/**`, four Admin pages, Admin APIs, `firestore.rules` | Partial: email allowlist/custom-claim Admin gate and independent API checks exist. No granular Admin/Operations/Finance action permission matrix is represented. | Direct navigation, customer-vs-admin API denial, token revocation and workflow-specific permission tests required. |
| A-16 Audit/evidence | P0 | No general audit/event service or audit API route found; webhook event records are payment-integration records. | No general cross-domain audit/evidence implementation found in inspected active source. | Actor/reason/evidence history, restricted review, correction and retention tests absent. |
| A-17 Support/exceptions/manual override | P0 | Some payment mismatch/late-payment review fields and order cancellation/fulfilment guards exist. | Partial and narrow; no general controlled exception, approval or support-resolution workflow found. | DEC-022/029/030 exception authority, separation-of-duties and evidence scenarios remain unverified. |
| A-18 Operational dashboard/reporting | P0 minimum operational view; advanced reporting P1 | `app/admin/page.tsx` contains hardcoded/demo statistics, sample recent orders and a literal date. | Gap for reliable operational visibility: current dashboard values are not backed by live operational records. | Metric definitions, data accuracy, no-fabrication and date-window tests absent. |
| A-19 Customer communications/privacy | P0 | Customer account/order APIs and guest tracking email exist. | Partial: access checks exist in inspected endpoints; no complete role-aware event/recipient/message-field policy implementation found. | Disclosure minimization, payer/sender/receiver entitlements, consent and notification tests remain open. |
| A-20 Production configuration/operational readiness | P0 | `firebase.json`, `firestore.rules`, `next.config.ts`, `package.json`, server integration source. | Not established by repository source inspection. Source configuration does not prove deployed configuration, secret availability, monitoring, backup, restore or incident readiness. | Production-like evidence, deployed rules/config, backup-restore, monitoring, incident response and rollback proof not inspected. |

### 6.3 Admin requirement mapping (ADM-R01–ADM-R54)

The table records source presence only. A row marked partial/present is **not** thereby implemented, tested, or launch-ready.

| Requirement | Priority | Current source mapping | Assessment |
|---|---|---|---|
| ADM-R01 Admin authentication | P0 | `lib/auth.ts`, `app/admin/sign-in/**`, sign-up/verify/forgot-password pages | Source present; sign-in/session/revocation runtime evidence required. |
| ADM-R02 Server-side Admin authorization | P0 | `lib/admin-auth.ts`, `app/api/admin/auth/verify/route.ts`, Admin API bearer-token/email checks | Partial: allowlist/custom claim exists; test all protected routes and direct navigation. |
| ADM-R03 Minimum role boundaries | P0 | No granular role/action permission model found; `ADMIN_EMAILS` is a broad allowlist. | Gap against DEC-022. |
| ADM-R04 Protected data/actions | P0 | `firestore.rules`, Admin API checks, customer API token/ownership checks | Partial; only inspected paths are evidenced; full route/rules matrix absent. |
| ADM-R05 Safe user feedback | P0 | Existing pages/components contain loading, validation, success/error states. | Partial; systematic accessibility and runtime failure-state evidence absent. |
| ADM-R06 Preserve architecture/UI | P0 | Existing App Router/components/services/styles remain in use. | Architectural constraint; not a functional feature proven by a route. |
| ADM-R07 Audit important privileged actions | P0 | No general audit service/route found. | Gap. |
| ADM-R08 Data integrity | P0 | `app/api/orders/route.ts`, payment routes, Admin order transaction; Firestore rules. | Partial: server-authoritative order/payment guards exist; no equivalent shipment/financial-event integrity layer found. |
| ADM-R09 Product administration | P0 | `app/admin/products/page.tsx`, product forms/helpers. | Source present; CRUD/security/runtime verification required. |
| ADM-R10 Category administration | P0 | `app/admin/categories/page.tsx`, category forms/helpers. | Source present; CRUD/security/runtime verification required. |
| ADM-R11 Availability and stock | P0 | Product helpers, storefront filtering, `app/api/orders/route.ts`, cancellation route. | Partial-to-present for storefront; inactive purchase denial and concurrency tests required. |
| ADM-R12 Product shipping measurements | Conditional P0 | Product type/helpers/forms contain no verified shipping weight/dimension workflow in inspected source. | Gap for any service whose approved pricing requires measurements. |
| ADM-R13 Image upload reliability | P0 | `app/api/admin/uploads/images/route.ts`, `lib/cloudinary.ts`, category/product upload components. | Source controls present; successful/denied upload and deployed Cloudinary config unverified (VLY-011). |
| ADM-R14 Order review/management | P0 | Admin orders page and `app/api/admin/orders/**`. | Source present for storefront orders; runtime and action authorization evidence required. |
| ADM-R15 Payment status visibility | P0 | Admin orders API/page and `lib/types/order.ts`. | Source present for current order payment states; financial-event completeness absent. |
| ADM-R16 Payment investigation | P0 | Payment reference/transaction fields and Paystack verify route. | Partial; investigation/reconciliation tooling and role restrictions not established. |
| ADM-R17 Payment/order status separation | P0 | Separate `paymentStatus` and `orderStatus` fields; provider verification/webhook guards. | Source present for storefront order model; scenario tests required. |
| ADM-R18 Refund accountability | P0 | No refund execution/approval route or service found. | Gap. |
| ADM-R19 Linked record consistency | P0 | Order item snapshots and order/payment references exist. | Partial for storefront order/payment; shipment/movement relationships absent. |
| ADM-R20 Payment/stock regression safety | P0 | Transactional order creation/cancellation and payment verification/webhook source; 11 Firestore rules tests only. | Partial; no current test run or full payment/stock regression evidence in this pass. |
| ADM-R21 Shipment record/details | P0 | No independent shipment record/service found. | Gap. |
| ADM-R22 Unified operational shipment view | P0 | Admin orders page is storefront-order based. | Gap for unified order/shipment operations. |
| ADM-R23 Minimum shipment lifecycle | P0 | Order lifecycle only in `lib/types/order.ts` and Admin order API. | Gap for independent shipment lifecycle. |
| ADM-R24 Shipment event/history | P0 | No general shipment event/history service found. | Gap. |
| ADM-R25 Intake and measurements | P0 | No active intake/custody source found. | Gap. |
| ADM-R26 Dispatch/transport handover | P0 | Basic storefront shipping metadata/status only. | Gap for route-leg and physical handover evidence. |
| ADM-R27 Delivery/collection completion | P0 | Storefront `delivered` order status only. | Partial; no approved proof or collection flow. |
| ADM-R28 Basic exceptions | P0 | Narrow payment review fields/status guards. | Partial; operational parcel exceptions absent. |
| ADM-R29 Returns | Conditional P0 | No return workflow found. | Gap if returns are enabled at launch; otherwise approved manual fallback must be documented. |
| ADM-R30 Shared pricing rules | P0 | No shared shipment-pricing service found. | Gap. |
| ADM-R31 Route-leg pricing | P0 | No route-leg or shipment-pricing source found. | Gap. |
| ADM-R32 Quote snapshot | P0 | Storefront order item/price snapshots exist; no shipment quote/rate version snapshot found. | Partial only for product-order facts. |
| ADM-R33 Measurement discrepancy | P0 | No intake measurement or discrepancy source found. | Gap. |
| ADM-R34 Price adjustment settlement | P0 | No proposed/approved adjustment or settlement event workflow found. | Gap. |
| ADM-R35 Dispatch gate | P0 | Admin order transition requires paid payment state; no shipment adjustment/exception gate found. | Partial only for storefront paid-order fulfilment. |
| ADM-R36 PUDO location records | P0 | No active location-management source found. | Gap. |
| ADM-R37 Location type distinction | P0 | No PUDO/station/collection-centre model found. | Gap. |
| ADM-R38 Transport connections | P0 | No route connection model found. | Gap. |
| ADM-R39 Assignment/dispatch accountability | P0 | No transport assignment/handover source found. | Gap. |
| ADM-R40 Network overview | P1 | No network overview source found. | P1; not a launch blocker under the current priority matrix. |
| ADM-R41 Real-data dashboard | P0 | `app/admin/page.tsx` uses hardcoded/demo metrics and sample orders. | Gap; VLY-012. |
| ADM-R42 Actionable operational overview | P0 | Dashboard sample cards/actions; no live operational queues found. | Gap/partial navigation only. |
| ADM-R43 Financial terminology | P0 | Dashboard demo financial/statistical content; no authoritative reporting model found. | Gap pending metric definitions and source-backed totals. |
| ADM-R44 Date range for time metrics | P1 | No verified date-range metric implementation found. | P1; not a launch blocker under current matrix. |
| ADM-R45 Essential alerts | P0 | No general operational alert service/queue found. | Gap. |
| ADM-R46 Government-request record | Conditional P0 | No dedicated record/workflow found; basic controlled process could be manual if documented. | No source found; trigger-based legal/manual process needs specification. |
| ADM-R47 Government-request authorization | Conditional P0 | Admin email allowlist only; no disclosure-specific approval/action record found. | Gap against DEC-033 if request occurs. |
| ADM-R48 Evidence preservation | P0 | No general evidence repository/hold workflow found. | Gap. |
| ADM-R49 Retention-hold release | Conditional P0 | No hold/release workflow found. | Gap if a hold exists; retention/legal policy still required. |
| ADM-R50 Appeal evidence | Conditional P0 | No appeal evidence association/review workflow found. | Gap if appeal process is triggered. |
| ADM-R51 Audit access protection | P0 | Firestore rules deny direct client order reads/writes; no audit/evidence store found. | Partial security foundation; no audit/evidence access model to verify. |
| ADM-R52 Essential configuration | P0 | No general operational settings/capability configuration page/service found. | Gap for approved launch configuration. |
| ADM-R53 Basic operational reporting | P1 | No reliable reporting service found; current dashboard includes demo metrics. | P1; advanced/basic reporting boundary follows priority matrix. |
| ADM-R54 Essential notifications | P0 / Conditional P0 | Guest tracking email in order creation; no general event-driven notification service found. | Partial only for guest tracking; DEC-034 matrix and runtime evidence open. |

### 6.4 Security and test-source findings

- `firestore.rules` permits public reads of categories/products, restricts catalogue writes to verified users with `admin == true`, and denies direct client reads/writes to orders.
- `tests/firestore.rules.test.mjs` defines 11 rules tests covering public catalogue reads, denied unauthenticated/customer/unverified-admin catalogue writes, allowed verified-admin catalogue writes, and denied direct client order access. This is not API authorization, shipment permission, financial approval, audit, or end-to-end coverage.
- All four inspected Admin pages (`app/admin/page.tsx`, categories, products and orders) call `verifyAdminAccess(user)`. Admin order/upload APIs independently verify bearer token, verified email and `ADMIN_EMAILS`. This does not implement DEC-022 granular action permissions.
- Admin dashboard source contains hardcoded demonstration metrics/sample recent orders and a literal date; this conflicts with ADM-R41's real-data requirement.
- Storefront order creation/cancellation use Firestore transactions for stock/order consistency. Payment verify/webhook include replay/status guards; source inspection does not prove concurrency or provider/local failure recovery.
- The legacy client-side `lib/firebase/orders.ts` helper still exists; the inspected checkout path uses the server order API. Firestore rules deny direct client order writes. Do not infer the legacy helper is an active supported checkout path.

### 6.5 Updated source-level gaps and evidence actions

| ID | Current finding | Required follow-up |
|---|---|---|
| SRC-01 | The active source-inspection commit remains `e0f69055d33dd9399c23e1d793f359468229c856`; repository-history comparison is refreshed through PR #64. | Keep source findings tied to the inspected commit; perform a new source inspection only after a later source-changing commit or an explicitly approved deeper review. |
| SRC-02 | Customer/Admin authorization source exists but has not been reproduced end-to-end. | Test ordinary customer direct navigation, protected API calls, valid Admin sign-in, expired/revoked token, and denial without breaking customer session. |
| SRC-03 | Paystack order paths have transaction/replay controls but no current runtime matrix. | Test duplicate/concurrent initialization, duplicate webhook, late success after cancellation, amount/currency/reference mismatch, provider success/local save failure, and stock consistency. |
| SRC-04 | Cloudinary validation/auth source exists; previous 401 and successful upload remain unresolved. | Test authorized valid upload, unauthorized upload, wrong folder, spoofed MIME/signature, oversized file, persistence and deployed configuration. |
| SRC-05 | Category count helper uses a field inconsistent with current `categoryId` product writes. | Inspect current/legacy production data and intended compatibility before any change; no migration assumption. |
| SRC-06 | Admin dashboard contains demo metrics/sample orders. | Define P0 metrics and their source-of-truth queries before implementation; remove fabricated values only in a separately approved task. |
| SRC-07 | Independent shipment, intake/custody, PUDO, pricing, route/movement, delivery-proof and general audit surfaces were not found in active source. | Continue SDD contracts and acceptance design; do not implement by treating storefront orders as shipments. |
| SRC-08 | Refund, credit, reversal and reconciliation workflow was not found. | Specify supported financial events, authority, provider contract, ledger/reconciliation evidence and tests. |
| SRC-09 | Notification source is limited to guest tracking email. | Specify DEC-034 event/recipient/channel/field/retry/deduplication policy before broadening. |
| SRC-10 | Root `pudo.zip` is uninspected. | Owner to confirm whether archive is authoritative and within the active VeriLyft scope before any source claims include it. |
| SRC-11 | Production configuration and operational readiness are not evidenced by repository source. | Obtain environment/deployment, rules, secret, monitoring, backup/restore, incident and rollback evidence in the production-readiness stage. |

**Stage 3 status:** Current active-source tree and selected source paths have been inspected and mapped to A-01–A-20 and ADM-R01–ADM-R54. This is a source-level baseline only. No tests were executed; no deployed configuration or production data were inspected; no application code was changed. P0 gaps remain and block any launch-readiness claim.


## 7. Repository-history comparison refresh — 31 October 2026

- **Current repository baseline:** PR #63 merged into `main` at `9c764e9f0c3a43ee7cae92f607480e1fc386c704`.
- **Active application-source inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856` (the source tree previously inspected and mapped in this document).
- **Comparison result:** Comparing the inspected source baseline with current `main` at PR #63 merge commit `9c764e9f0c3a43ee7cae92f607480e1fc386c704` returned SDD documentation files only; no application-source path was changed after the inspected baseline. A recursive current-tree inventory also found no dedicated shipment, parcel, custody, handover, route, or location API/library path; the active paths remain storefront order/payment/Admin surfaces. This is a path inventory, not a full semantic code search.
- **Interpretation:** The source findings in Sections 1–6 remain tied to the stated inspected source commit. The repository baseline has advanced through documentation-only PR #63, but this does not mean the application source was re-inspected at PR #63. The current tree-path inventory corroborates the absence of dedicated logistics API/library paths without upgrading any source finding to runtime verification.
- **Evidence limits:** No runtime/browser/API test, deployed configuration review, production data inspection, provider-dashboard check, or production-readiness verification was performed by this documentation update. The root `pudo.zip` archive remains uninspected and outside source claims until its authority/scope is established.

This refresh updates repository-history metadata only. It does not change any A-area or ADM-R source status, close source gaps, approve implementation, or authorize test execution.


## 8. Repository-history comparison refresh — PR #64 — 31 October 2026

- **Current repository baseline:** PR #64 merged into `main` at `d02b2d69156aea45c07b5e2db5511b2486e50471`.
- **Active application-source inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856`.
- **Comparison result:** Comparing the inspected source baseline with PR #64's merge commit reports 320 commits ahead and returns SDD documentation paths only. No application-source path appears in the comparison's changed-file set. PR #64 itself changes nine SDD documentation files only.
- **Interpretation:** Sections 1–6 remain observations about source inspected at `e0f69055d33dd9399c23e1d793f359468229c856`. The intervening history has not changed the inspected application-source paths according to the repository comparison; this does not mean the application was freshly re-inspected at PR #64.
- **Limits:** No semantic source review, test execution, runtime/browser/API verification, deployed configuration review, production data inspection, or production-readiness verification was performed by this refresh. The path-level inventory recorded in the PR #64 review is not a substitute for semantic or runtime evidence.

The active source-inspection baseline remains unchanged. Do not upgrade any source finding to implemented, tested, or production-ready on the basis of this history comparison.


## 9. Repository-history comparison refresh — PR #71 — 31 October 2026

- **Current documentation baseline:** PR #71 merged into `main` at `37a6ca57f1619d124ebb9718aa6067ed8d40f978`.
- **Active application-source inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856`.
- **Evidence boundary:** PR #71 was documentation-only. Repository-history continuity and the earlier comparison from the source snapshot do not constitute fresh semantic source inspection, runtime/API/browser testing, production data inspection, deployed Firebase rules/configuration verification, provider-dashboard review or production readiness.
- **New design crosswalk:** `PLATFORM_DOMAIN_BOUNDARY_AND_IDENTITY_DECISION_MATRIX.md` defines conceptual record responsibilities, party entitlement separation, unresolved cardinality questions DB-01–DB-12, consistency boundaries and existing source reuse constraints. These are technical design inputs, not approved persistence objects or implementation evidence.
- **Interpretation:** Source observations in Sections 1–6 remain tied to the stated source-inspection baseline. Do not upgrade any source status based on documentation-only commits.
