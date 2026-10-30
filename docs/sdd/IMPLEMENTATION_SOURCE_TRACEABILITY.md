# VeriLyft Implementation-to-SDD Source Traceability

**Document status:** Read-only source inventory — owner review required  
**Inspection date:** 29 October 2026  
**Repository baseline inspected:** `main` at `c56be9b121e6007e1e99c6df2d3984e709771a92`  
**Scope:** Current repository source compared with the platform actor, shared-workflow, and domain/lifecycle drafts  
**Authority:** Source facts only. This document does not approve product policy, prove runtime behaviour, or authorize implementation.

## 1. Inspection method and evidence limits

The inspection used the repository's current `main` tree and read the API route inventory, shared auth helper, client-side category/product/order helpers, Firestore rules, relevant admin pages, order types, and the Firestore rules test file. A second read-only pass checked the shared-workflow/domain drafts and decision register against the source inventory. It did not modify or execute application code, inspect production Firestore records, inspect deployed configuration, test provider credentials, or reproduce browser/runtime behaviour. The root `pudo.zip` archive was not treated as active Next.js application source and was not unpacked or audited in this pass.

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
