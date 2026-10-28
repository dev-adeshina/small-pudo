# VeriLyft Admin Portal — Repository Validation (Stage 2)

**Last updated:** 28 October 2026  
**Status:** Initial source review — not a runtime or deployment verification  
**Requirements baseline:** `ADMIN_REQUIREMENTS.md` (draft; owner approval pending)  
**Reviewed branch:** `main` for application source; requirements document from the Stage 1 draft branch

## 1. Purpose and limits

This document reconciles the drafted Admin Portal requirements with the repository's current source paths before detailed page design or implementation. It records what is visible in code, not what may be configured in the deployed environment.

- **Implemented (source evidence):** the source contains a recognizable implementation of the minimum capability. This does not automatically mean it is fully tested.
- **Partially implemented:** a related foundation exists, but the requirement is not fully met.
- **Missing in reviewed source:** no corresponding Admin Portal route or implementation was found in the inspected repository paths.
- **Unverified:** code or configuration needs runtime, deployment, broader call-site, or test verification before a reliable conclusion.
- **Conditional:** depends on the operating model selected for launch.

This is an initial source-level review. It does **not** replace the required browser/API tests, production configuration checks, or a full route-by-route audit. No application code was changed and no tests were run as part of this review.

## 2. Repository facts established

### Existing Admin routes and related server endpoints

The inspected `app/admin` directory currently contains:
- `app/admin/page.tsx` — dashboard
- `app/admin/orders/page.tsx` — order list and shipping-detail controls
- `app/admin/products/page.tsx` — product administration
- `app/admin/categories/page.tsx` — category administration
- `app/admin/sign-in/`, `sign-up/`, `forgot-password/`, and `verify-email/` — admin account flows

The inspected `app/api/admin` routes include:
- `app/api/admin/auth/verify/route.ts`
- `app/api/admin/auth/claim/route.ts`
- `app/api/admin/auth/registration-check/route.ts`
- `app/api/admin/orders/route.ts`
- `app/api/admin/orders/[orderId]/route.ts`
- `app/api/admin/uploads/images/route.ts`

The inspected payments routes include initialization, verification, and webhook handlers. Order creation and cancellation/tracking routes also exist. No Admin routes for dedicated shipments, transactions, delivery pricing, PUDO network, transport management, staff/user administration, finance overview, notifications, reports, settings, or audit logs appeared in the inspected `app/admin` directory. This is a route inventory, not proof that no related logic exists anywhere else.

### Source-backed findings

1. **Dashboard sample data is a confirmed gap.** `app/admin/page.tsx` defines hardcoded statistics (for example, total orders 248 and revenue ₦4.82M) and hardcoded recent-order examples. The displayed date is also a literal string. This does not meet ADM-R41's real-data requirement.
2. **Admin identity verification has a reusable foundation.** `lib/admin-auth.ts` calls `/api/admin/auth/verify` and then `/api/admin/auth/claim`; the verify endpoint checks a verified email against the server-side `ADMIN_EMAILS` allowlist. The dashboard, products, categories, and orders pages import/use the client helper. This is positive source evidence, but direct-page behaviour, all privileged API routes, claims and configuration still require security testing.
3. **Authorization is repeated in some APIs.** The reviewed orders endpoints and image-upload endpoint independently validate the bearer Firebase ID token, verified email, and `ADMIN_EMAILS`. Verify every remaining privileged endpoint before calling ADM-R02/ADM-R04 complete.
4. **Current admin order handling is order-centric.** `app/admin/orders/page.tsx` and the corresponding API support listing orders, status filters/search, and shipping metadata such as provider, tracking number, estimated delivery, and notes. That is a useful existing foundation, but it is not a standalone shipment/movement model and does not establish a full parcel lifecycle.
5. **Products and categories already have CRUD helpers.** `lib/firebase/products.ts` maps existing product fields such as `categoryId`, `price`, `currency`, `images`, `stock`, `isActive`, and `featured`. The inspected mapper does not expose product weight/dimensions, so ADM-R12 is not evidenced by this path. `lib/firebase/categories.ts` provides category CRUD and a category-product count helper; its query and all call sites need separate validation before changing it.
6. **Image uploads have server-side controls.** `app/api/admin/uploads/images/route.ts` checks the admin allowlist, configured Cloudinary credentials, permitted folders, file size (5 MiB), MIME type, and file signatures. The previously reported upload 401/Cloudinary failure remains unverified at runtime; do not mark the integration complete until a real authorized upload and a denied request are tested.
7. **Payment foundation exists, but no dedicated transaction UI was found.** Paystack initialization, verification, and webhook routes exist. The webhook verifies the signature before processing successful charge events. This alone does not provide transaction search, refunds, reconciliation, or complete duplicate/late-event regression evidence.
8. **No shipment/PUDO/transport/pricing Admin route was found in the inspected Admin route directory.** Those requirements must remain design-stage/conditional until the launch operating model and the minimum data representation are approved. Do not create collections or fields before inspecting the full order model and agreeing the smallest compatible design.
9. **No audit-log, notification-centre, reports, settings, or staff-management page was found in the inspected Admin route directory.** Some minimum obligations may be satisfied by existing records or configuration, but that needs explicit evidence and must not be assumed.
10. **The default-branch docs contain historical decisions that need reconciliation.** In particular, `DECISIONS.md` DEC-008 says Firebase Storage is the current approach and Cloudinary migration is deferred, while the current source includes Cloudinary integration and the current progress tracker describes that integration as active. Resolve this documentation conflict without reverting working code or silently changing the architecture.

## 3. P0 requirement validation matrix

The status below is provisional and based on the paths listed. Where evidence is incomplete, the requirement remains partial or unverified rather than being promoted to complete.

| Requirement ID | Initial status | Source evidence / reason |
|---|---|---|
| ADM-R01 Admin authentication | Partially implemented; test pending | Existing admin email/password, Google, verification, and recovery pages/helpers; current sign-in/session behaviour needs regression tests. |
| ADM-R02 Server-side admin authorization | Partially implemented; security tests pending | Allowlist verification and server-side checks exist in auth, order, and upload endpoints; audit all privileged routes and direct navigation. |
| ADM-R03 Minimum role boundaries | Missing / unresolved | Current reviewed pattern is a global email allowlist and `admin` claim; no staff-role/permission model or access matrix evidenced. |
| ADM-R04 Protected data and actions | Partially implemented | API checks and Firestore rules tests are recorded in PROGRESS; verify all APIs, client writes, and actual deployed rules. |
| ADM-R05 Safe user feedback | Partially implemented | Several pages have loading/error/message state; needs page-by-page UX and failure-path verification. |
| ADM-R06 Preserve existing UI and architecture | Established constraint | Existing App Router, Firebase helpers, components, and global styles are present; enforce this during design/implementation. |
| ADM-R07 Audit important privileged actions | Missing in inspected Admin routes | No audit-log implementation/page found in inspected Admin route directory; verify whether a reusable audit helper exists elsewhere. |
| ADM-R08 Data integrity | Partially implemented | Server order creation/payment handlers and Firestore rules exist; broader regression and all privileged operations remain unverified. |
| ADM-R09 Product administration | Partially implemented | `app/admin/products/page.tsx` and `lib/firebase/products.ts` exist; validate full CRUD, access, and failure cases. |
| ADM-R10 Category administration | Partially implemented | `app/admin/categories/page.tsx` and `lib/firebase/categories.ts` exist; validate CRUD, product association, and slug-change behaviour. |
| ADM-R11 Product availability and stock | Partially implemented | Product schema contains `isActive` and `stock`; public listing filters and stock consistency need separate verification. |
| ADM-R12 Product shipping measurements | Missing in inspected product mapper | Reviewed `Product` mapper exposes no weight/dimension fields; confirm current type/schema and launch pricing need before design. |
| ADM-R13 Image upload reliability | Partially implemented; runtime unverified | Upload route validates admin, folder, size, MIME and signatures; successful Cloudinary upload and previous 401 remain to be tested. |
| ADM-R14 Order review and management | Partially implemented | Admin order page/API support listing and some status/shipping updates; confirm permitted transitions and error paths. |
| ADM-R15 Payment status visibility | Partially implemented | Order UI has payment status labels including paid/pending/failed/refunded; confirm actual statuses and handling of provider outcomes. |
| ADM-R16 Payment investigation | Partially implemented | Order search includes order ID, customer contact, payment reference, and delivery location; no dedicated transaction lookup UI found. |
| ADM-R17 Payment/order status separation | Partially implemented | Order status and payment status are separate fields; verify all transitions and UI wording. |
| ADM-R18 Refund accountability | Missing / unverified | No refund administration workflow was found in inspected Admin routes; payment-provider capabilities and current data model need review. |
| ADM-R19 Linked record consistency | Partially implemented | Orders/payment references exist; distinct shipment and movement links are not evidenced in reviewed routes. |
| ADM-R20 Payment/stock regression safety | Unverified | Existing endpoints and prior reported tests are not a substitute for current regression runs after the latest changes. |
| ADM-R21 Shipment record/details | Missing in inspected Admin routes; conditional | No dedicated shipment route or shipment-specific API found in inspected paths. |
| ADM-R22 Unified operational shipment view | Missing / technical model unresolved; conditional | Existing order shipping metadata is not proof of a unified independent-shipment model. |
| ADM-R23 Minimum shipment lifecycle | Missing / unresolved; conditional | Existing order fulfilment states do not define the approved parcel lifecycle. |
| ADM-R24 Shipment event/history | Missing / unverified; conditional | No shipment event timeline or movement history found in inspected Admin routes. |
| ADM-R25 Intake and measurements | Missing / conditional | No digital staffed-intake workflow found; required only if staffed intake launches in-app. |
| ADM-R26 Dispatch and transport handover | Missing / conditional | Existing order shipping metadata is not a dispatch/movement handover workflow. |
| ADM-R27 Delivery/collection completion | Partially implemented for storefront orders only | Existing order statuses include shipped/delivered; proof of delivery and collection-centre completion are not evidenced. |
| ADM-R28 Basic exceptions | Missing / conditional | No exception queue/workflow found in inspected Admin routes. |
| ADM-R29 Returns | Missing / policy unresolved | No returns workflow found; launch return policy or documented manual process must be decided. |
| ADM-R30 Shared pricing rules | Missing / conditional | No Admin pricing route/service found in inspected paths; current checkout delivery fee has historically been zero. |
| ADM-R31 Route-leg pricing | Missing / conditional | No route-leg pricing implementation evidenced in inspected paths. |
| ADM-R32 Quote snapshot | Missing / conditional | No saved delivery quote/rate snapshot evidenced in reviewed order schema/routes. |
| ADM-R33 Measurement discrepancy | Missing / conditional | No intake-measurement adjustment path found. |
| ADM-R34 Price adjustment settlement | Missing / conditional | No adjustment/dispute/top-up/refund settlement workflow found. |
| ADM-R35 Dispatch settlement gate | Missing / conditional | No linked dispatch/payment-adjustment gate found. |
| ADM-R36 PUDO location records | Missing in inspected Admin routes; conditional | No PUDO management page/API found in inspected paths. |
| ADM-R37 Location type distinction | Missing / conditional | No staffed-station vs registered-collection-centre admin workflow found. |
| ADM-R38 Transport connections | Missing / conditional | No route/connection management path found in inspected Admin routes. |
| ADM-R39 Assignment/dispatch accountability | Missing / conditional | No transport assignment/handover workflow found in inspected Admin routes. |
| ADM-R40 Network overview | Missing / conditional | No real network records/overview found in inspected Admin routes. |
| ADM-R41 Real-data dashboard | Missing — confirmed source gap | `app/admin/page.tsx` uses hardcoded demo statistics, sample recent orders, and a literal date. |
| ADM-R42 Actionable operational overview | Partially implemented | Dashboard currently shows sample cards/recent orders; actual issue queues are not evidenced. |
| ADM-R43 Financial terminology | Partially implemented / dashboard fails requirement | Existing dashboard labels a hardcoded figure as revenue; real data and definitions are absent. |
| ADM-R44 Date range for time-based metrics | Missing in inspected dashboard | No working date-range controls evidenced in `app/admin/page.tsx`. |
| ADM-R45 Essential alerts | Missing / unverified | No alert or notification system found in inspected Admin routes. |
| ADM-R46 Government-request record | Missing in inspected Admin routes | No basic request record or linked workflow found; no separate page is required. |
| ADM-R47 Government-request authorization | Missing / unresolved | No recorded disclosure-approval path found. |
| ADM-R48 Evidence preservation | Unverified | No hold/preservation workflow found in inspected Admin routes; define the minimum policy and verify existing storage capability. |
| ADM-R49 Retention-hold release | Missing / unresolved | No recorded hold/release control found. |
| ADM-R50 Appeal evidence | Missing / unverified | No appeal/dispute evidence association workflow found. |
| ADM-R51 Audit access protection | Unverified | Firestore rules and server authorization exist in parts of the app; no audit/evidence store has been identified for this requirement. |
| ADM-R52 Essential configuration | Missing in inspected Admin routes | No Admin settings page found; distinguish environment/deployment configuration from operator-editable settings. |
| ADM-R53 Basic operational reporting | Partially implemented | Order listing exists; no reports page or reporting endpoint found in inspected Admin routes. |
| ADM-R54 Essential notifications | Missing / unverified | No notification implementation found in inspected Admin routes. |

## 4. P1 validation summary

| Requirement ID | Initial status | Notes |
|---|---|---|
| ADM-P01 Broad global search | Partially implemented | Search exists within orders; cross-record permission-aware search is not evidenced. |
| ADM-P02 Notification centre | Missing | No notification-centre route found. |
| ADM-P03 Saved dashboard/date preferences | Missing | No preferences or custom dashboard configuration found. |
| ADM-P04 Detailed reconciliation | Missing / unverified | Payment endpoints exist, but reconciliation UI/workflow is not evidenced. |
| ADM-P05 Commission/payout oversight | Missing; separate Finance Portal scope | No Admin implementation found; keep out of launch unless a real operational need promotes it. |
| ADM-P06 Expense/route-cost reporting | Missing; Finance Portal scope | No expense or route-cost capture found. |
| ADM-P07 Advanced/scheduled reports | Missing | No reports page found. |
| ADM-P08 Rich audit filtering/export | Missing | No audit-log route found. |
| ADM-P09 Granular staff permissions UI | Missing / unresolved | No staff-access administration UI found. |
| ADM-P10 Formal appeal workflow | Missing | No case workflow found. |
| ADM-P11 Advanced returns workflow | Missing | No returns workflow found. |
| ADM-P12 Retention/archive tooling | Missing / unresolved | No archive or retention-management UI found. |
| ADM-P13 Collection-centre performance/capacity | Missing; conditional | No network records/analytics found. |
| ADM-P14 Fleet administration | Missing; conditional | No fleet-management route found. |
| ADM-P15 Network bottleneck/capacity analysis | Missing; conditional | No network operational dataset/analysis found. |

## 5. Recommended order of work after source validation

Keep the startup scope lean. Do not start implementing all missing requirements at once.

1. **Close security verification first:** test ordinary customer vs authorized admin for direct dashboard navigation, product/category access, order APIs, upload API, expired sessions, and production configuration. Reuse existing auth helpers and endpoints; avoid a new auth architecture.
2. **Replace the dashboard demo content:** first define the small set of real, computable launch metrics and their data sources. Reuse existing order/payment data; do not add a new collection solely to support cards.
3. **Verify the existing order/product/category paths:** test their current CRUD and status transitions; record specific defects before changing them.
4. **Confirm the operating-model gate:** decide which parcel/PUDO/driver workflows are actually in-app at launch. Only then promote corresponding conditional P0 items.
5. **Design the minimum missing routes/workflows** only after those decisions and the underlying schema are inspected. Keep full finance operations in the separate Finance Portal and defer enterprise features.

## 6. Required verification still outstanding

- [ ] Inspect all remaining privileged API routes and Firestore rules against ADM-R02/ADM-R04.
- [ ] Test customer and admin direct-navigation/session scenarios in a browser.
- [ ] Test an authorized Cloudinary upload and a denied upload against the actual configured environment.
- [ ] Fix and regression-test inactive category/product filtering on the category route.
- [ ] Confirm product/category public visibility, stock, image handling, and category-count behaviour; inspect existing data before correcting the category-count query.
- [ ] Verify whether the dashboard's \`/admin/customers\` and \`/admin/services\` links have real routes.
- [ ] Run the relevant payment/order/stock regression suite.
- [ ] Verify deployed environment variables and current Firebase custom claims without exposing credentials.
- [ ] Reconcile the Cloudinary/Firebase Storage conflict in `DECISIONS.md`.
- [ ] Update each status with evidence as the remaining paths are inspected and tests are run.

**Stage 2 status:** Initial source inventory and first-pass validation matrix drafted. This is not a full audit, no tests were run, and no requirement is declared fully verified based on this document alone.
