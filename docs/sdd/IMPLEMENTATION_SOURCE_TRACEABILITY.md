# VeriLyft Implementation-to-SDD Source Traceability

**Document status:** Read-only source inventory — owner review required  
**Inspection date:** 29 October 2026  
**Repository baseline inspected:** `main` at `c56be9b121e6007e1e99c6df2d3984e709771a92`  
**Scope:** Current repository source compared with the platform actor, shared-workflow, and domain/lifecycle drafts  
**Authority:** Source facts only. This document does not approve product policy, prove runtime behaviour, or authorize implementation.

## 1. Inspection method and evidence limits

The inspection used the repository's current `main` tree and read existing routes, shared auth helper, Firestore rules, order types, and the Firestore rules test file. It did not modify or execute application code, inspect production Firestore records, test provider credentials, or reproduce browser/runtime behaviour.

Use this document to separate:
- **Observed in source:** code/configuration exists at the cited path.
- **Reported evidence:** test or runtime result reported in project continuity docs; not independently reproduced here.
- **Not found in inspected surface:** no matching route/type/rule was present in the inspected repository path inventory; this is not a claim that no helper or record exists anywhere unless the search scope is stated.
- **Design gap / owner decision:** requires approved policy and/or further inspection before implementation.

## 2. Current source map

| Domain / capability | Current source evidence | Source-level observation | SDD consequence |
|---|---|---|---|
| Storefront order creation | `app/api/orders/route.ts` | Allows guest checkout; optionally verifies a Firebase ID token and requires verified email for account checkout. Validates customer/delivery/item input, merges duplicate product IDs, reads current product data, calculates prices server-side, checks active state/stock, and atomically decrements stock and creates an order. | A concrete storefront-order path exists. It is not an independent shipment-booking workflow. |
| Order record / item snapshot | `app/api/orders/route.ts`, `lib/types/order.ts` | The order stores customer and delivery details, item snapshots, subtotal/delivery fee/total/currency, payment and order status, optional user reference, guest-token hash, timestamps, and optional shipping metadata. | Preserve order-time item facts; do not mistake the existing order's shipping object for a complete shipment/consignment or route-leg model. |
| Guest order access | `app/api/orders/route.ts`, `app/api/orders/[orderId]/track/route.ts`, `app/api/orders/[orderId]/cancel/route.ts` | A random access token is generated for an order; only its SHA-256 hash is stored. Tracking/cancellation compare a supplied token-derived hash using constant-time comparison. Cancellation only permits pending/unpaid orders and restores stock in a Firestore transaction. | The guest capability token is an access credential, not a customer account or general authorization role. Recovery/claiming remains unresolved. |
| Customer order access | `app/api/account/orders/route.ts`, `app/api/account/orders/[orderId]/route.ts`, `app/api/orders/[orderId]/track/route.ts` | Customer endpoints verify Firebase ID tokens, require verified email, and derive order ownership from the token UID and stored `users/{uid}` document reference. Tracking distinguishes account ownership from guest-token access. | Customer authentication and record entitlement are separate checks. Guest order claiming remains an explicit open policy. |
| Payment initialization | `app/api/payments/initialize/route.ts` | Requires the order access token, checks pending order/payment state, reuses an already stored checkout URL when present, sends provider requests server-side, checks the returned reference and checkout host, and rechecks state transactionally before saving the reference/URL. | Provider initialization is not payment settlement. Concurrent initializations and external-success/local-save failure need focused recovery testing and a defined idempotency contract. |
| Payment verification | `app/api/payments/verify/route.ts` | Looks up an order by saved payment reference and verifies directly with Paystack. Checks reference, success state, amount, NGN currency, and transaction ID. Uses a transaction to update current order state, avoids normal fulfilment for cancelled orders, flags review-required mismatches/late payment, and treats already-paid verification as a replay. | Provider verification is authoritative evidence for the payment result; order/fulfilment status remains distinct. The endpoint's requester entitlement and response exposure should be reviewed against the approved API contract. |
| Payment webhook | `app/api/payments/webhook/route.ts` | Verifies the HMAC-SHA512 signature against the raw body; handles `charge.success`; validates core event fields; matches a stored reference; creates a deterministic event key in `paymentWebhookEvents`; processes event and order in a transaction; checks amount/currency; flags late payment or status conflicts. | Some webhook replay protection exists in source. Runtime duplicate/concurrency/late-event scenarios remain unverified; a webhook-event record is not a general ledger or full financial-event model. |
| Admin authorization | `lib/admin-auth.ts`, `app/api/admin/auth/verify/route.ts`, `app/api/admin/auth/claim/route.ts` | Shared client helper asks the server to verify a verified email against `ADMIN_EMAILS`, then requests the `admin: true` custom claim and refreshes the ID token. | Client navigation guard and server-side privileged authorization are separate layers. Browser regressions still require runtime tests. |
| Admin server APIs | `app/api/admin/orders/route.ts`, `app/api/admin/orders/[orderId]/route.ts`, `app/api/admin/uploads/images/route.ts` | These routes independently verify a bearer Firebase ID token, verified email, and membership in `ADMIN_EMAILS`; they fail closed if the allowlist is empty. | Current source uses an email allowlist, not a granular staff role/scope model. Do not infer Operations/Finance/Management roles from admin access. |
| Admin catalogue writes | `firestore.rules`, `app/api/admin/auth/claim/route.ts`, admin category/product pages | Firestore rules permit public catalogue reads, require verified email plus `admin == true` claim for category/product writes, and deny direct client reads/writes to orders. The client helper obtains the custom claim after server allowlist verification. | Rules and Admin SDK routes must be reviewed together. The rules tests cover catalogue read/write gates and order direct-client denial, not all API routes or deployed configuration. |
| Image upload | `app/api/admin/uploads/images/route.ts` | Requires server-side admin authorization, Cloudinary configuration, folder allowlist (`categories`, `products`), maximum 5 MiB, allowed JPG/PNG/WebP MIME type, and signature-byte detection before upload. | Validation controls are present in source. Successful authorized upload, unauthorized denial, persistence, and deployed secret/configuration remain runtime verification items. |
| Admin order fulfilment | `app/api/admin/orders/[orderId]/route.ts`, `app/api/admin/orders/route.ts`, `lib/types/order.ts` | Admin can progress paid, non-cancelled orders through `processing → ready_for_shipping → shipped → delivered`; shipping metadata includes provider, tracking number, estimated delivery, notes, and timestamps. A transaction checks the current state before applying the transition. | This is a storefront-order fulfilment lifecycle. It does not establish independent booking, intake/custody, route proposals/legs, dispatch handover evidence, failed-delivery resolution, or proof-of-delivery policy. |
| Catalogue visibility | `app/products/[category]/page.tsx`, `app/products/[category]/[slug]/page.tsx`, `lib/firebase/products.ts` | At this baseline, PR #3 is merged: inactive category pages return not-found, inactive products are filtered from category listings, and product details reject inactive categories. | This source fact supersedes older issue text saying PR #3 is unmerged; browser regression evidence is still separate. |
| Independent shipment / PUDO / pricing / routing | Repository route inventory under `app/api/`; SDD workflow/domain drafts | The current API route inventory includes account, admin auth/orders/uploads, storefront orders/cancel/track, and payment initialize/verify/webhook. No dedicated shipment-booking, intake/custody, PUDO location management, pricing, route proposal/leg, movement/handover, or audit-log API route was found in that inventory. | The approved launch scope described in the workflow draft is not represented by a complete inspected API surface. Existing source must be searched further for reusable helpers/data before any implementation proposal. |
| Audit / financial records | `app/api/payments/webhook/route.ts`, repository route inventory | A `paymentWebhookEvents` collection is used for webhook deduplication/outcome records. No dedicated audit-log or general financial-event API route appears in the current route inventory. | Do not treat webhook deduplication records or payment status fields as a full audit trail, ledger, refund, credit, reconciliation, or approval workflow. Search for existing reusable event/audit helpers before proposing additions. |
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
The inspected source inventory does not show an implemented end-to-end independent booking lifecycle. The domain draft still needs owner decisions for the booking-to-shipment gate, parcel cardinality, quote versions/adjustments, route-leg relationships, custody evidence, and financial settlement relationships. Do not fill those gaps by treating an order as a shipment or inventing statuses.

## 4. Key mismatches and follow-up work

| ID | Finding | Type | Next action (no implementation yet) |
|---|---|---|---|
| TRACE-01 | Progress/handoff text still points to PR #8 or PR #9 as the current draft/review checkpoint even though PR #9 is merged. | Documentation drift | Reconcile current baseline pointers and mark source mapping as the active task. |
| TRACE-02 | Issue VLY-013 says PR #3 is open/unmerged, but PR #3 is merged at current main. | Documentation drift | Update issue status/evidence; do not claim browser regression tests ran. |
| TRACE-03 | Current Admin UI guard uses `verifyAdminAccess`; server Admin APIs independently use `ADMIN_EMAILS`. Prior report of customer access remains unverified in browser. | Verification gap | Keep VLY-010 investigating; test direct protected-page navigation and API denial with customer and admin accounts. |
| TRACE-04 | Payment verification and webhook contain transaction/replay guards, but complete runtime matrix is not evidenced in this inspection. | Verification gap | Keep VLY-005 open; test duplicate, concurrent, late-success-after-cancellation, mismatched amount/currency, and stock consistency. |
| TRACE-05 | Cloudinary route contains source validation and authorization, but successful and denied uploads remain unverified. | Verification gap | Keep VLY-011 investigating; test authorized valid image and unauthorized/invalid/oversized requests. |
| TRACE-06 | Order fulfilment fields/statuses do not represent the full parcel operations workflows in the domain draft. | Domain coverage gap | Continue platform SDD and owner decisions before proposing compatible data/contracts. |
| TRACE-07 | Firestore rules tests are limited to catalogue and order direct-client access. | Test coverage gap | Define platform-wide authorization matrix and tests after role/scope policy is approved. |
| TRACE-08 | No dedicated audit or general financial-event API route appears in the route inventory; reusable helpers/records elsewhere have not been ruled out. | Source investigation gap | Search remaining source for audit/event logging, refunds, credits, reconciliation, and financial records. |
| TRACE-09 | Payment initialization calls the provider before the final transactional save. Concurrent requests or a provider-success/local-save failure may require reconciliation. | Recovery/idempotency question | Inspect remaining provider integration and define a testable recovery contract before implementation. |

## 5. Still unresolved — do not infer

- Final staff roles, scope boundaries, and approval authority.
- Whether guest orders can be claimed/recovered into customer accounts.
- Booking confirmation and booking-to-shipment/consignment creation gate.
- Parcel/booking cardinality and relationships to quotes, route legs, movements, and deliveries.
- Pricing formula, material-discrepancy thresholds, approval limits, and additional-payment/refund/credit procedures.
- Required proof of delivery, failed-delivery outcomes, evidence access/retention, and legal holds.
- Payment retry/expiry policy, provider-success/local-failure reconciliation, and settlement relationships.
- Audit event catalogue and retention.
- Current deployed configuration and runtime/browser evidence.

## 6. Recommended next steps

1. Reconcile stale progress, issue, audit, and handoff pointers with the current merged baseline.
2. Continue read-only inspection of all remaining relevant source for audit/event helpers, direct Firestore writes, payment/recovery flows, and any existing PUDO/pricing/route data.
3. Review the source mapping against the domain/workflow drafts and resolve owner decisions needed for launch.
4. Complete the platform-wide SDD approval and acceptance criteria before application-code changes.
5. Only after approval, propose the smallest compatible implementation plan and separate runtime verification plan.

**No application code or runtime behaviour was changed during this inspection.**
