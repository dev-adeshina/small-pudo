# VeriLyft Progress Tracker

**Last updated:** 30 October 2026
**Repository:** `dev-adeshina/small-pudo`
**Project baseline branch:** `main`
**Latest verified main head:** `beb2d03e88df7894a8805af79a9d68fd74cc143f` — PR #35 merged. Current documentation proposal branch: `docs/stage-5-2-booking-party-authority`. The source baseline inspected for the traceability inventory remains `c56be9b121e6007e1e99c6df2d3984e709771a92`; comparison through the current head shows intervening commits changed SDD documentation only, not application source.
**Historical audit comparison baseline:** `cccad3c4eebe398c8369d5ce90ea05ee551589cf`.
**Audit comparison baseline:** `cccad3c4eebe398c8369d5ce90ea05ee551589cf` — the historical `main` baseline reviewed by `SDD_COMPLETENESS_AUDIT.md` before PR #5.
**Admin Portal requirements/audit:** PR #2 is merged to `main`. PR #3 is merged into the inspected baseline; PR #4 remains open/unmerged.
**Current phase:** Stage 5.2 booking-party and change-authority owner policies BP-01–BP-22 accepted; documentation consolidation is in progress on `docs/stage-5-2-booking-party-authority`. Latest verified `main` includes PR #35 at `beb2d03e88df7894a8805af79a9d68fd74cc143f`. The accepted outcomes are recorded in `PLATFORM_STAFF_PERMISSION_DECISIONS.md`; detailed technical permission design and full SDD approval remain open. No application-code changes are authorized until the complete platform-wide SDD is reconciled and explicitly approved.

> This tracker records the current working state, including uncommitted changes.
> Verify the live repository and test results before treating any item as complete.

## Status legend

- [x] Implemented and supported by reported or recorded evidence.
- [~] Partially implemented, under review, or requiring additional verification.
- [ ] Not implemented or not yet verified.
- [?] Requires inspection or a decision.

## 1. Current position

### Current milestone — booking-party authority policies accepted; SDD reconciliation underway

- **Owner decision register:** 15 of 15 tracked decisions (D-01–D-15) have accepted high-level outcomes, recorded as DEC-022–DEC-036. Detailed policy values, permissions, transitions, and evidence requirements remain open where identified in the decision records.
- **Latest verified main head:** `beb2d03e88df7894a8805af79a9d68fd74cc143f` (PR #35).
- **Source inspection baseline:** `c56be9b121e6007e1e99c6df2d3984e709771a92`. Comparison through latest main shows intervening commits changed SDD documentation only; source traceability remains a read-only snapshot and must be reconciled with accepted policy.
- **Completed stages:** Requirement-level priority baseline (PR #31), refreshed source traceability (PR #32), and P0 acceptance-scenario/evidence catalogue draft (PR #33) are merged.
- **Current proposal:** PR #36, `docs: consolidate booking-party authority decisions`, is open for owner review. `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md` records BP-01–BP-22 accepted under DEC-023/DEC-024. PM-01–PM-12 remain accepted in `PLATFORM_STAFF_PERMISSION_DECISIONS.md`.
- **Next stages:** Proceed to Stage 5.3 — pricing, measurements, and quote adjustments (DEC-026/DEC-027); resolve remaining policy/technical dependencies in DEC-022–DEC-036; reconcile lifecycle/API/data/security contracts against source; assess production readiness; obtain explicit approval of the complete SDD.
- **Implementation gate:** No application-code changes until the complete platform-wide SDD has been reconciled and explicitly approved.

VeriLyft remains the existing Next.js App Router, TypeScript, Firebase Authentication/Firestore/Firebase Admin, Paystack, and Cloudinary application. Preserve its architecture and existing patterns; do not invent parallel services, collections, fields, routes, or permission models.

### Evidence discipline

- Accepted policy comes from `DECISIONS.md`.
- Implementation facts come from inspected source at a stated commit.
- Verified behaviour requires dated test/runtime/deployment evidence with environment and scope.
- Launch readiness requires DEC-036 evidence; source presence or a passing build alone is insufficient.
- Historical roadmap/checkpoint sections below are retained as history, not the current task pointer.

## 2. Feature tracker

| Area | Status | Evidence / notes |
|---|---|---|
| Homepage/storefront | [~] | `app/page.tsx`; landing-page navigation and category dropdown have been updated. Further storefront review is in progress. |
| Product catalogue | [~] | `app/products/page.tsx`; verify real product data, active-product visibility, image handling, and links. |
| Category product pages | [~] | `app/products/[category]/page.tsx`; connected to Firestore. Active-category/product filtering and missing-image handling need review. |
| Product detail pages | [~] | `app/products/[category]/[slug]/page.tsx`; product gallery has been modified and needs regression verification. |
| Shared cart context | [x] | `context/cart-context.tsx`; local browser persistence is intentional for now. |
| Cart page | [x] | `app/cart/page.tsx` exists; previous checkout flow testing reported. |
| Checkout | [x] | `app/checkout/page.tsx`; previous order lifecycle tests reported. |
| Server-side order creation / stock reservation | [x] | `app/api/orders/route.ts`; prior successful lifecycle testing reported. |
| Order cancellation | [x] | `app/api/orders/[orderId]/cancel/route.ts`; prior tests reported. |
| Paystack initialization | [x] | `app/api/payments/initialize/route.ts`. |
| Paystack verification | [x] | `app/api/payments/verify/route.ts`. |
| Paystack webhook | [x] | `app/api/payments/webhook/route.ts`; previous webhook success reported. |
| Payment callback UI | [~] | Implemented; include in regression testing. |
| Admin authentication and authorization | [~] | Four main admin pages call `verifyAdminAccess(user)`; verification checks a verified email against `ADMIN_EMAILS` and claim setup exists. User-reported direct-navigation issue is still a runtime regression risk; browser/API checks are pending. |
| Admin category management | [~] | `app/admin/categories/page.tsx`; Cloudinary image upload integration and category code have changed. |
| Admin product management | [~] | `app/admin/products/page.tsx`; image upload integration and product UI have changed. |
| Admin order management | [~] | `app/admin/orders/page.tsx` has changed; rerun regression checks before declaring the current version verified. |
| Admin image-upload API | [~] | `app/api/admin/uploads/images/route.ts`; server-side authorization and Cloudinary upload behaviour require verification. |
| Firestore security rules | [x] | `firestore.rules`; local Emulator tests passed twice (11/11 each run). Public catalogue reads, administrator claim checks, and denied direct client order access were tested. Local rules were compared with the published Console rules on 25 October 2026. |
| Cloudinary image hosting | [~] | Cloudinary is the selected/current integration and the upload route contains server-side validation. Successful authorized upload, denied upload, and persisted image URL checks remain pending. |
| Customer registration | [x] | Customer registration flow implemented; user previously reported successful account testing. |
| Customer sign-in / sign-out | [x] | Implemented and previously tested. Keep customer authentication separate from admin authorization. |
| Customer account recovery | [x] | Recovery flow implemented; retain in regression tests. |
| Customer dashboard | [x] | Account dashboard and Quick actions implemented. |
| Customer profile | [x] | `app/account/profile/page.tsx`; user reported persistence after refresh and re-login, and signed-out access checks passing. |
| Customer order history | [x] | `app/api/account/orders/route.ts`; customer-scoped order retrieval and dashboard display tested. |
| Customer-owned order association | [x] | Authenticated orders are associated server-side with the verified Firebase UID; existing guest checkout is preserved. |
| Customer order-detail page | [x] | `app/account/orders/[orderId]/page.tsx` and `app/api/account/orders/[orderId]/route.ts`; build and browser tests passed, including cross-customer access rejection. |
| Secure guest-order recovery/claiming | [~] | DEC-035 accepts secure recovery through proof of control of the original checkout email and optional account claiming through a separate ownership challenge. Technical design, source reconciliation, and runtime evidence remain open. |
| Admin manual shipping updates | [~] | Shipping fields and admin order operations exist; regression-test current transitions. |
| Guest order tracking API | [x] | `app/api/orders/[orderId]/track/route.ts`; guest access uses the order access token. |
| Customer-facing delivery tracking UI | [~] | `app/track-order/`; guest tracking page and email link have been tested. Continue regression testing. |
| Courier/provider integration | [ ] | Deferred. |
| Guest order-tracking email | [x] | Resend integration in `app/api/orders/route.ts`; verified sender domain and successful guest email test reported. Inbox placement needs monitoring. |
| Telegram delivery notifications | [ ] | Deferred. Paid orders should initially be dispatched only after an administrator approves delivery assignment. |
| TypeScript check | [x] | User ran `npx tsc --noEmit` on 28 October 2026; it exited successfully. Rerun after any application-code change. |
| Production build | [~] | A prior build passed according to the session record, but `npm run build` was not run in the 28 October 2026 checkpoint. Rerun after application-code changes and before release. |
| Production dependency audit | [x] | `npm audit --omit=dev` reported zero vulnerabilities. |
| Development dependency audit | [~] | A `braces` advisory remains in the development tooling dependency tree. Do not force a breaking downgrade; reassess when a compatible upstream fix is available. |
| Full end-to-end regression | [ ] | Run after the current authentication, image-upload, and storefront changes are verified. |

## 3. Historical implementation checkpoint — 28 October 2026

### A. Working-tree checkpoint

- [~] Review all existing modified and untracked files before committing.
- [x] Update the tracker for the customer order-history milestone; inspect the final diff before committing.
- [ ] Review the staged diff and exclude secrets, local environment files, and unrelated files.
- [x] Run TypeScript and production build checks after implementing the customer order-details feature.
- [ ] Commit the intended, verified work.

### B. Admin authentication and Cloudinary

- [~] Cloudinary integration has replaced the previous Firebase Storage helper.
- [~] Verify that upload requests obtain and send a valid Firebase ID token.
- [~] Verify server-side admin authorization, including verified email and the configured admin allowlist.
- [ ] Confirm an ordinary customer cannot enter admin functionality by navigating directly to an admin URL or reusing a browser session.
- [ ] Confirm a legitimate administrator can sign in, refresh, navigate, and upload images successfully.
- [ ] Confirm an unauthorized request is rejected without exposing credentials or allowing an upload.
- [ ] Verify image type, file-size validation, and stored Cloudinary URLs.

### C. Storefront refinement

- [x] Add customer account navigation to the landing page: Create Account is the prominent action and Sign In is secondary when signed out; My Account appears for a signed-in customer.
- [x] Connect the landing-page category dropdown to Firestore categories.
- [~] Verify that inactive categories are not publicly browsable.
- [~] Verify that inactive products are not shown in public category listings.
- [~] Handle products with no image without passing an undefined value to Next.js Image.
- [~] Use the product's stored currency when displaying its price.
- [~] Avoid displaying an empty features section.
- [~] Verify product links, actual category names, prices, and responsive layout.
- [ ] Test category/product pages against real Firestore records after the changes.
- [ ] Run TypeScript and production build checks after the storefront work.

### D. Known category-data issue to investigate

`lib/firebase/categories.ts` currently contains a product-count helper that
queries products using `where("category", "==", slug)`. The product schema
used by `lib/firebase/products.ts` instead associates products through
`categoryId`, and category documents have IDs such as `cat_food`.

This mismatch may cause category product counts and the category-slug
change check to return incorrect results. Inspect the full helper and its
call sites before correcting it. Preserve existing Firestore records and
avoid changing category IDs or product data unnecessarily.

## 4. Historical roadmap — retain for context, not current work order

### Phase 1 — Core ecommerce and audit

**Status: [~] Existing functionality is implemented; regression checks remain.**

- [x] Storefront, catalogue, cart, and checkout foundations.
- [x] Order creation and stock reservation.
- [x] Paystack initialization, verification, and webhook routes.
- [~] Recheck payment failure, retry, cancellation, expiry, and duplicate webhook handling.
- [~] Recheck stock restoration and duplicate-event behaviour.
- [~] Recheck authorization boundaries and production configuration.

### Phase 2 — Customer authentication and profile

**Status: [x] Implemented; user-reported tests passed.**

- [x] Customer registration and sign-in.
- [x] Customer sign-out and account recovery.
- [x] Customer dashboard.
- [x] Separate customer profile page.
- [x] Profile changes persist after refresh and re-login.
- [x] Signed-out profile access checks reported passing.

### Phase 3 — Customer order history

**Status: [x] Implemented and browser-tested; guest-order claiming remains undecided.**

- [x] Associate authenticated orders with the verified Firebase UID on the server.
- [x] Implement customer-scoped order-list retrieval.
- [x] Implement customer-scoped order-detail retrieval.
- [x] Ensure one customer cannot access another customer's orders; cross-customer access returned 404 in browser testing.
- [ ] Decide secure guest-order recovery/claiming behaviour.
- [x] Preserve guest checkout; the user reports that guest checkout, cancellation, and tracking regression tests passed.
- [x] Send guest order-tracking emails through Resend; successful delivery to the test inbox was reported.
- [~] Monitor email inbox placement; the first test message landed in junk.

### Phase 4 — Admin authentication and image hosting

**Status: [~] Implemented but requires current regression verification.**

- [~] Maintain the existing admin authentication architecture.
- [~] Verify role/allowlist enforcement on admin pages and APIs.
- [~] Complete Cloudinary integration and remove obsolete Firebase Storage usage.
- [ ] Confirm authorized and unauthorized upload behaviour.
- [ ] Verify image URLs in category, product, and storefront views.

### Phase 5 — Storefront refinement

**Status: [~] Active.**

- [x] Add customer account actions to the landing-page header.
- [x] Populate category navigation from Firestore.
- [~] Refine category and product listing behaviour using actual records.
- [~] Handle inactive records and missing product images.
- [~] Verify product prices, currency, features, and category associations.
- [ ] Complete responsive and visual regression checks.

### Phase 6 — End-to-end regression

**Status: [ ] Pending completion of the active work.**

- [ ] Guest browse/cart/checkout/payment flow.
- [ ] Registered customer sign-in and checkout.
- [ ] Customer order ownership and order-history checks.
- [ ] Payment failure/retry/cancel/late webhook cases.
- [ ] Admin authentication, catalogue operations, and order operations.
- [ ] Cloudinary authorized/unauthorized upload tests.
- [ ] TypeScript and production build.
- [ ] Desktop and mobile responsive review.

### Phase 7 — Customer-facing delivery

**Status: [ ] Deferred intentionally.**

- [ ] Display fulfilment status on customer order details.
- [ ] Display tracking information when available.
- [ ] Reuse existing tracking logic where appropriate.
- [ ] Evaluate manual tracking versus a courier/provider integration.

### Phase 8 — Telegram delivery integration

**Status: [ ] Deferred intentionally.**

- [ ] Define notification triggers and minimum necessary order fields.
- [ ] Configure bot credentials and destination server-side.
- [ ] Begin with administrator-approved delivery assignment.
- [ ] Add retry/error logging and duplicate-notification protection.
- [ ] Keep Telegram separate from customer-facing order management.

## 5. Session log

### 22 October 2026 — Storefront, admin authentication, and image hosting checkpoint

- Reviewed the working-tree status and change summary before further storefront work.
- Confirmed that the working tree contains changes to admin authentication, admin catalogue/order screens, Cloudinary uploads, Firebase category helpers, product presentation, and the landing page.
- Confirmed the landing-page account navigation design: Create Account is primary, Sign In is secondary, and signed-in customers see My Account.
- Confirmed that the storefront category dropdown is connected to Firestore categories.
- Identified a possible mismatch between the category product-count query (`category`) and the product schema (`categoryId`).
- Identified the need to verify inactive category/product visibility and missing product-image handling.
- Recorded the latest reported TypeScript/build success and production dependency audit result. These checks must be rerun after further code changes.
- Next: inspect and commit the intended verified changes, then continue with category/product storefront refinement.

### 20 October 2026 — Customer profile completion

- Added the separate customer profile page at `/account/profile`.
- Added the `My profile` link to the customer dashboard's Quick actions.
- Preserved the existing profile API, validation, authentication, and save functionality.
- User confirmed profile changes persist after refreshing and after signing out and back in.
- User confirmed signed-out visitors cannot access the profile page directly.
- User reported that TypeScript checks and relevant functional tests passed.
- Customer profile work was completed; customer order history and ownership-safe order retrieval remain outstanding.

### 17 October 2026 — Source audit and SDD baseline

- Reviewed the supplied archive structure and relevant source paths.
- Identified existing admin shipping management and a guest tracking API.
- Identified customer registration, dashboard, and customer order history as unfinished in the supplied archive.
- Noted that order creation used `userId: null`.
- The supplied archive did not include enough root configuration to independently verify a production build.
- Established the initial focused-audit and customer-account roadmap.

### 25 October 2026 — Guest order-tracking email integration

- Integrated Resend into guest order creation to send an order-tracking email.
- Verified that the `verilyft.com` sending domain is verified in Resend.
- Configured `EMAIL_FROM` for the VeriLyft sender address.
- Successful guest order, payment, and tracking-email tests were reported.
- The test email initially arrived in the junk folder; inbox placement remains under observation.
- Keep the Resend API key and other credentials server-side; do not add `.env.local` to Git.
- Guest tracking relies on the order access token. Preserve the existing token validation.
- Next: continue admin authentication, Cloudinary, and storefront verification. Delivery assignment and Telegram notifications remain deferred.

## 6. Tracker maintenance rules

At the end of each meaningful session:

1. Update the current phase and next implementation target.
2. Mark tasks complete only when supported by code or test evidence.
3. Record the date and outcome in the session log.
4. Record confirmed defects and unresolved risks in `ISSUES.md`.
5. Record material architecture decisions in `DECISIONS.md`.
6. State which tests were actually run and which remain outstanding.
7. Inspect the Git diff before committing and never include secrets or local environment files.

### 25 October 2026 — Firestore security rules

- Saved the existing Firestore rules to `firestore.rules` without changing
  their policy.
- Added `firebase.json` to point the Firestore Emulator at the local rules.
- Added `@firebase/rules-unit-testing` and
  `tests/firestore.rules.test.mjs`.
- Installed OpenJDK 21 because the Firestore Emulator requires Java.
- Ran the local rules test suite twice; both runs passed all 11 tests.
- Verified public category/product reads, denied unauthenticated and
  ordinary-customer catalogue writes, verified-email and admin-claim
  requirements, and denied direct client access to orders.
- Compared the local rules with the published Firebase Console rules;
  the user confirmed their contents match.
- These tests validate Firestore rules in the emulator. They do not replace
  verification of the live admin authentication flow or API route security.
- Added the emulator's generated `firestore-debug.log` to `.gitignore`.
- The Firebase configuration, rules, tests, and tracker changes remain
  uncommitted and should be reviewed before staging.

## 7. Admin Portal design — 28 October 2026

- [x] Reviewed the current SDD files and added `docs/sdd/ADMIN_PORTAL.md` as the page-by-page Admin Portal design document.
- [x] Added the Admin Portal document to the SDD README index.
- [x] Recorded agreed Admin Portal decisions in `DECISIONS.md`.
- [x] Documented the agreed combined dashboard: business overview, operational activity, and issues needing attention.
- [x] Documented operational financial visibility versus the separate Finance Portal.
- [x] Documented permission-aware search, notifications, quick actions, date filters, and preservation of the existing UI.
- [x] Recorded the conceptual separation between orders, shipments, payments, and transport movements.
- [x] Kept Government Requests basic: no dedicated page or elaborate workflow; use existing records and audit logs.
- [~] Admin Portal page-by-page design is still in progress. Dashboard design is under review; Orders, Shipments, Transactions, Products, Categories, Delivery Pricing, PUDO Network, Transport Management, Users & Access, Finance Overview, Notifications, Reports, Settings, and Audit Logs need their detailed page design before implementation.
- [ ] No application code was changed as part of this design-document update.
- [ ] No TypeScript, build, browser, or runtime tests were run for this documentation-only update.
- [ ] Do not mark any Admin Portal feature implemented merely because its design is documented.

### Current next step

First reconcile this tracker, `ISSUES.md`, `DECISIONS.md`, `ADMIN_REQUIREMENTS.md`, `ADMIN_REQUIREMENTS_AUDIT.md`, and `SESSION_HANDOFF.md` on the existing documentation review branch. No application code changes until this documentation checkpoint is reviewed. Then complete browser tests for customer denial, customer session preservation, authorized-admin access, protected pages, privileged APIs, and image uploads. Do not start the Shipments implementation merely because its design is next in the page sequence.


## 8. Admin Portal requirements prioritization — 28 October 2026

- [x] Added `docs/sdd/ADMIN_REQUIREMENTS.md` with stable requirement IDs, P0/P1/deferred priorities, startup exclusions, cross-cutting acceptance requirements, and Stage 1 completion tracking.
- [x] Indexed the requirements document in `docs/sdd/README.md`.
- [x] Explicitly distinguished requirements inventory from page design, implementation status, and test evidence.
- [~] Stage 1 inventory/prioritization is drafted; the owner-confirmed operating model is recorded, while formal approval of the consolidated P0/P1/deferred priority baseline remains pending.
- [~] First-pass source validation is drafted in `ADMIN_REQUIREMENTS_AUDIT.md`; remaining privileged routes and runtime/deployment behaviour still need verification.
- [x] Recorded owner-confirmed launch choices: independent parcel booking; advance booking and staff-created walk-in intake; lean PUDO location management; shared hybrid pricing; advance online payment and payment at intake; hybrid routing; Operations-managed route-leg assignments; no driver portal at launch; flexible proof of delivery; controlled failed-delivery handling.
- [x] Removed uncertainty about whether the launch operating model includes parcel/PUDO/transport operations; exact policy values, technical representation, and priority-baseline approval remain open.
- [ ] This was a documentation-only change. No application code or tests were changed/run for this task.

### Current next step

Review and approve the consolidated P0/P1/deferred baseline in `ADMIN_REQUIREMENTS.md`. Stage 2 has a first-pass source audit; runtime security, upload, payment/stock, and full route coverage remain incomplete. Keep application-code changes paused until the documentation checkpoint is reviewed and the current security tests are completed.


## 9. Admin Portal requirements validation — 28 October 2026

- [x] Inspected the current `main` branch Admin route inventory and selected supporting source files through GitHub.
- [x] Added `docs/sdd/ADMIN_REQUIREMENTS_AUDIT.md` with a first-pass matrix covering ADM-R01–ADM-R54 and ADM-P01–ADM-P15.
- [x] Recorded source-backed findings and distinguished them from runtime/deployment verification.
- [x] Confirmed a source-level gap: `app/admin/page.tsx` uses hardcoded dashboard statistics, recent-order examples, and a literal date.
- [x] Confirmed the existing auth-verification foundation and the presence of order, product, category, payment, and Cloudinary upload code paths.
- [~] Initial matrix is not a complete security or runtime audit; remaining privileged APIs, rules, call sites, and tests still require inspection.
- [~] The route inventory shows no dedicated Admin pages for shipments, transactions, pricing, PUDO, transport, staff/users, finance overview, notifications, reports, settings, or audit logs in the inspected `app/admin` directory. Related logic elsewhere has not been ruled out.
- [ ] Verify admin/customer direct-navigation and API access in a browser/runtime.
- [ ] Test a successful authorized Cloudinary upload and a denied upload against the configured environment.
- [ ] Re-run relevant order/payment/stock regression tests; no tests were run in this documentation-only review.
- [x] Reconciled DEC-008: Cloudinary is the selected image-hosting integration; runtime upload verification remains outstanding.
- [x] Recorded owner-confirmed launch operating-model choices; the related requirements are no longer conditional solely because the launch model was unknown. Detailed policies and priority approval remain open.

**Stage 2 status:** Initial source-level validation drafted; not a full audit, no application code changed, and no tests run.


### 28 October 2026 — Owner-approved Admin Portal launch scope and audit supplement

- Confirmed the launch-scope choices with the owner: independent parcel booking, advance booking plus staff-created walk-in intake, lean PUDO location management, shared hybrid pricing, advance online payment plus payment at intake, hybrid route proposals, Operations-managed route-leg assignments, no driver portal at launch, flexible proof of delivery, and controlled failed-delivery handling.
- Classified advanced route optimisation, full fleet management, a separate driver portal, enterprise workflow tooling, and advanced analytics as deferred until a concrete business need exists.
- Rechecked selected source files on the current `main` branch through GitHub. The dashboard's demo statistics, sample recent orders, and literal date remain a confirmed gap.
- Confirmed the current dashboard source calls `verifyAdminAccess(user)`; the prior customer-to-admin access report remains a regression test requirement, not a confirmed current-source omission.
- Historical note (28 October checkpoint): source and DEC-008 wording appeared inconsistent at that time. This was reconciled in the 29 October documentation review; Cloudinary runtime verification remains outstanding.
- Confirmed that selected dedicated Admin routes for shipments, PUDO, delivery pricing, transactions, and audit logs are absent on `main`. Related implementation elsewhere was not ruled out.
- Historical note: PR #3 (inactive category/product visibility) and PR #4 (category product counts) were separate proposals at that checkpoint. PR #3 later merged; PR #4 remains open.
- Updated the Admin requirements/audit documents on the existing `docs/admin-requirements-prioritization` review branch. No application code was changed.
- No local build, TypeScript, browser, API runtime, or live Firestore tests were run. The audit remains source-level only.
- Next: reconcile the accepted requirements with existing code, verify critical security/payment/image-upload paths at runtime, and prepare a minimal implementation sequence without adding a new architecture.


## 10. Documentation reconciliation and runtime checkpoint — 28 October 2026

- [x] Confirmed Admin Portal design PR #1 is merged to `main` as `a3e1e8a`.
- [x] Confirmed Admin Portal requirements/audit PR #2 merged to `main` on 28 October 2026 as merge commit `fbb56ce522fe713524d04f9a23c7ab7c43da8f95`.
- [x] Rechecked PR #3 (`fix/public-category-visibility`) and PR #4 (`fix/category-product-counts`): PR #3 is merged; PR #4 remains open/unmerged.
- [x] Recorded the user-reported current check: `npx tsc --noEmit` passed.
- [x] Recorded the user-reported dev-server result: Next.js 16.4.2 started at `http://localhost:3000` and reported ready.
- [ ] Complete browser test: a signed-in ordinary customer navigates directly to `/admin`, `/admin/orders`, `/admin/products`, and `/admin/categories`; each must deny access and preserve the customer session.
- [ ] Confirm an authorized administrator can access the portal after sign-in, refresh, and navigation.
- [ ] Test privileged admin APIs as an ordinary customer and confirm denial.
- [ ] Test authorized and unauthorized Cloudinary uploads.
- [ ] Review remaining privileged API routes, custom-claim revocation implications, and Firestore rules together.
- [ ] After security checks, decide whether a focused code change is required. Do not assume the observed direct-navigation problem persists in current source until the browser test reproduces it.
- [ ] Re-run the relevant tests and update this tracker/issue log with actual results before implementing or marking security work complete.

**No application code was changed in this documentation checkpoint.** TypeScript and dev-server startup were checked by the user; browser/API/upload tests remain unrun.


## 11. Documentation merge confirmation — 28 October 2026

- [x] PR #2, `docs: define startup Admin Portal requirements and priorities`, is closed and merged into `main`.
- [x] Merge commit: `fbb56ce522fe713524d04f9a23c7ab7c43da8f95` (`fbb56ce`).
- [x] Confirmed `main` points to that merge commit at the time of verification.
- [x] Updated this tracker’s baseline metadata so it no longer describes PR #2 as open.
- [ ] Continue with the planned browser/API authorization tests; no application-code changes until test results show a specific fix is required.


## 12. Platform-wide SDD completion — 29 October 2026

- [x] Reviewed the nine current documents listed in `docs/sdd/README.md` on `main`.
- [x] Created the first-pass platform-wide matrix and reconciliation findings in `SDD_COMPLETENESS_AUDIT.md` on documentation review branch `docs/sdd-platform-completeness-audit`.
- [x] Updated the SDD index with the new audit and documented the SDD-first working protocol in `README.md`.
- [x] Verified PR #3 is merged and its changes are present in `main`; PR #4 remains open/unmerged and must not be treated as part of `main`.
- [x] Reconcile stale current-baseline and active-task statements across the continuity documents; retain `cccad3c4...` only as the audit’s historical comparison baseline.
- [x] Mark the customer-first implementation roadmap in `SPEC.md` as historical without removing its requirements or implementation history.
- [x] Align Cloudinary wording: DEC-008 selects Cloudinary; the Admin requirements audit and this audit distinguish that decision from pending runtime verification.
- [x] Draft `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md` to map actor classes, functional responsibilities, and portal/module boundaries without authorizing implementation.
- [x] Merge PR #7, `docs: draft platform actor responsibility model`, on 29 October 2026 (merge `5c4ecba`); its nine owner decisions remain unresolved unless separately recorded.
- [x] Create `PLATFORM_SHARED_WORKFLOWS.md` as the next documentation-only draft, covering storefront fulfilment, independent booking, intake/custody, pricing, payments/reconciliation, routing, dispatch, delivery, notifications, and audit/disclosure.
- [x] Review and merge PR #8, `docs: draft shared platform workflows`, on 29 October 2026 (merge `aac7c68`); detailed policy questions remain open.
- [x] Create `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md` as the next documentation-only draft for conceptual relationships, lifecycle boundaries, API/service contracts, security, and source validation.
- [ ] Review and approve the domain/lifecycle/contract draft; resolve or explicitly retain its owner decisions.
- [ ] Perform read-only source inspection and map existing records, routes, authorization, payment verification, idempotency, concurrency, uploads, and test evidence to the accepted conceptual design.
- [ ] Complete the Shipper, Operations, PUDO, Finance, Management, and Customer functional specifications; record the separate Driver Portal as deferred unless scope changes.
- [ ] Obtain owner decisions on unresolved business policies and formal launch priorities.
- [x] PR #6, `docs: reconcile platform SDD continuity baseline`, reviewed and merged on 29 October 2026 (merge `a88a0d6`).
- [x] Review checkpoint completed by owner merge of PR #7; detailed actor/role decisions remain open.
- [ ] Approve the complete platform SDD baseline before resuming application-code changes.

**Scope note:** This phase permits read-only source inspection to establish implementation facts. It does not authorize application-code changes, new routes, schema changes, or new portal implementations.


## Current source-traceability checkpoint — 29 October 2026

- [x] PR #9 merged: domain/lifecycle/API/security draft is now in `main`; its unresolved policy decisions remain open.
- [x] Read-only source inventory completed against `main` at `c56be9b121e6007e1e99c6df2d3984e709771a92`; findings are documented in `IMPLEMENTATION_SOURCE_TRACEABILITY.md`.
- [x] Confirmed PR #3 is merged into the inspected baseline; inactive category/product source filtering is present. Browser regression testing was not performed by this source inspection.
- [ ] Continue read-only inspection for existing audit/event helpers, payment recovery, direct Firestore access, and any existing PUDO/pricing/route data.
- [ ] Reconcile source findings with `ISSUES.md`, `SDD_COMPLETENESS_AUDIT.md`, and `SESSION_HANDOFF.md`; keep source facts distinct from reported tests.
- [ ] Resolve owner decisions and approve the complete platform-wide SDD before application-code changes.

**Inspection boundary:** This checkpoint used GitHub source reads only. It did not run tests, inspect production Firestore data/configuration, reproduce browser behaviour, or change application code.


### Second read-only source pass — 29 October 2026

- [x] Rechecked the active TypeScript source inventory, all 15 API route handlers, Firebase category/product/order helpers, all four Admin page guards, Firestore rules/tests, payment routes, and relevant SDD decisions.
- [x] Confirmed all four inspected Admin pages call `verifyAdminAccess`; the prior customer-access report remains a runtime test requirement, not a source-confirmed defect.
- [x] Confirmed category/product CRUD uses client Firestore helpers protected by custom-claim rules, while storefront checkout uses `/api/orders`; a legacy client-side order-creation helper remains but direct client order writes are denied by the rules.
- [x] Confirmed `paymentWebhookEvents` is used for webhook deduplication/outcome processing, not a general audit ledger. No dedicated audit/financial-event, shipment/PUDO, pricing, or routing/movement service module was found in the inspected active TypeScript source surface.
- [ ] Owner to confirm whether repository-root `pudo.zip` is in scope for the active VeriLyft SDD/source-of-truth review. It has not been unpacked or audited and is not treated as deployed behaviour.
- [ ] Resolve remaining owner decisions for booking identity/acceptance, quote validity and adjustments, custody/intake, route legs, proof of delivery, settlement/refunds, audit/evidence retention, and staff role boundaries.
- [ ] Complete the platform-wide SDD acceptance matrix and obtain explicit approval before any application-code changes.

**Evidence boundary:** Source reads only; no application code or data changed, no tests run, no production Firestore data/configuration inspected, and no browser/runtime behaviour reproduced.


## 13. Cross-domain acceptance matrix — 29 October 2026

- [x] Independently verified live `main` at `c55abbba2cfffa6b2020a71c19f1aa50c676588d` through the GitHub repository connector.
- [x] Compared the prior source-inspection baseline `c56be9b121e6007e1e99c6df2d3984e709771a92` with live `main`; the 16 intervening commits are SDD documentation changes only, so the previously inspected application-source baseline remains applicable for this checkpoint.
- [x] Added `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md` as a draft review aid covering storefront, customer access, independent shipment booking, shared pricing, payments, financial events, intake/custody, locations, routing, movement, delivery, notifications, authorization, audit/evidence, exceptions, reporting, and production readiness.
- [x] Included cross-domain invariants, proposed acceptance criteria, failure/replay test families, unresolved owner decisions, and explicit SDD approval gates.
- [x] Added the matrix to the SDD README index.
- [ ] Review the matrix and decide the open business policies listed in its Section 5; do not treat proposed criteria as approved requirements.
- [ ] Reconcile accepted decisions with `DECISIONS.md`, `ISSUES.md`, `PLATFORM_SHARED_WORKFLOWS.md`, and `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`.
- [ ] Only after policy approval, derive detailed transition tables and test cases from existing architecture/source; obtain explicit approval of the reconciled platform-wide SDD before application-code changes.

**Evidence boundary:** Documentation-only changes. No application code, schema, API, permission, production data, or runtime configuration was changed. No tests or production runtime checks were run.


## 14. Owner decision D-01 — 29 October 2026

- [x] Owner selected Option C: minimal hybrid staff responsibility and approval model.
- [x] Added DEC-022 to record the decision and its boundary: distinct responsibilities do not automatically require separate portals or a role for every function; routine actions may be shared where permitted; sensitive actions require explicit permission/approval boundaries; privileged operations require server-side authorization and consequential actions require audit evidence.
- [x] Reconciled the actor/responsibility model, shared workflows, cross-domain acceptance matrix, issue tracker, progress tracker, and session handoff in the documentation proposal.
- [ ] Review and merge the focused documentation PR; then update the live-main SHA from the merged result.
- [ ] Proceed to D-02: independent shipment booking eligibility and account requirements.
- [ ] Keep the platform-wide SDD implementation gate in force; no application-code changes or tests are authorized by this decision.

**Evidence boundary:** Documentation-only proposal based on the owner's explicit choice. No application source, schema, access rules, deployed configuration, or runtime behavior changed or was tested.


## 15. Owner decision D-03 — 29 October 2026

- [x] Owner accepted the recommended party/access direction: booking party, sender, receiver/collection recipient, payer, and physical handover person may differ, with relationships explicit where they affect access, authority, liability, payment attribution, notification, intake, or collection.
- [x] Recorded DEC-024: payer visibility defaults to payment confirmation/receipt only; payment does not grant full shipment-detail access; booking does not authorize collection; change authority is defined by change type and lifecycle stage.
- [x] Reconciled the owner decision register, decisions log, actor model, shared workflows, domain/lifecycle contracts, cross-domain acceptance matrix, issues tracker, progress tracker, and session handoff.
- [ ] Review and merge the focused documentation-only PR.
- [ ] Continue with D-04: staff-created walk-in intake and location capabilities.
- [ ] Keep detailed verification checkpoints, consent rules, per-change permissions, post-intake/post-dispatch handling, and runtime acceptance tests open until separately defined.

**Evidence boundary:** Documentation-only proposal based on the owner's acceptance of the recommended policy. No application source, schema, access rules, deployed configuration, or runtime behavior changed or was tested. The platform-wide SDD implementation gate remains in force.


## 16. Owner decision D-04 — 29 October 2026

- [x] Owner accepted the recommended capability-based location policy, recorded as DEC-025.
- [x] Confirmed the lean initial location record: name, address, active status, and configured capabilities.
- [x] Separated walk-in intake creation, parcel measurement, custody acceptance, payment collection/recording, and release to a verified authorized recipient into distinct capabilities.
- [x] Reconciled the owner decision register, decisions log, actor model, shared workflows, domain/lifecycle contracts, cross-domain acceptance matrix, issue tracker, progress tracker, and session handoff in this documentation proposal.
- [ ] Review and merge the focused documentation-only PR.
- [ ] Continue with D-05: shared pricing formula and quote terms.
- [ ] Keep exact staff assignment, partner access, measurement/discrepancy thresholds, payment-at-intake evidence, collection verification, second-person approvals, and runtime acceptance tests open.
- [ ] Preserve the platform-wide SDD approval gate; no application-code changes are authorized.

**Evidence boundary:** Documentation-only proposal based on the owner's acceptance of the recommended policy. No application source, schema, access rules, deployed configuration, or runtime behaviour changed or was tested.


## 17. Owner decision D-05 — 29 October 2026

- [x] Owner accepted service-specific selection of fixed versus calculated pricing, recorded as DEC-026.
- [x] Confirmed a shared pricing rule set for storefront delivery and independent shipment booking wherever service inputs overlap.
- [x] Confirmed calculated pricing should use service-applicable inputs from origin/destination or distance band, parcel weight, dimensions/volumetric weight, service class/delivery speed, and configured minimum charge.
- [x] Confirmed quote validity should be configured by service.
- [x] Reaffirmed preservation of accepted quote inputs, itemized charges, total, currency, and rate/rule version/effective context; later rate changes must not silently alter accepted quotes or completed payments.
- [x] Reconciled the owner decision register, decisions log, shared workflows, lifecycle contracts, cross-domain acceptance matrix, issues, progress, and handoff in this documentation proposal.
- [ ] Review and merge the focused documentation-only PR.
- [ ] Continue with D-06: measurement discrepancy and adjustment approval.
- [ ] Keep exact formulas, units, service mapping, distance source/bands, rounding, effective dates, quote expiry/re-quote behaviour, taxes/fees/discounts, and adjustment thresholds unresolved.
- [ ] Preserve the platform-wide SDD approval gate; no application-code changes are authorized.

**Evidence boundary:** Documentation-only proposal based on the owner's acceptance of the recommended policy. No application source, schema, pricing implementation, deployed configuration, or runtime behaviour changed or was tested.

## 18. Owner decision D-06 — 29 October 2026

- [x] Owner accepted the recommended configurable, evidence-based measurement discrepancy and adjustment policy, recorded as DEC-027.
- [x] Confirmed that original quoted inputs and actual intake measurements must be preserved separately, with actor/location/time and applicable evidence.
- [x] Confirmed that proposed adjustments must link to the original quote and must not silently overwrite accepted terms or be treated as approved/settled financial events.
- [x] Confirmed that material discrepancies and adjustments affecting existing payments require review under configured authority.
- [x] Reconciled the owner decision register, decisions log, shared workflows, domain/lifecycle contracts, cross-domain acceptance matrix, issues, progress, and handoff in this documentation proposal.
- [ ] Review and merge the focused documentation-only PR.
- [ ] Continue with D-07: payment-at-intake methods and evidence.
- [ ] Keep numeric thresholds, units/service requirements, approval limits, second-person rules, customer notification/consent, and acceptance/dispute/refusal outcomes unresolved.
- [ ] Preserve the platform-wide SDD approval gate; no application-code changes are authorized.

**Evidence boundary:** Documentation-only proposal based on the owner's acceptance of the recommended policy. No application source, schema, pricing implementation, deployed configuration, or runtime behaviour changed or was tested.


## Owner decision D-08 — 30 October 2026 (DEC-029)

- [x] Owner accepted Option A: explicit financial events with controlled transitions and reconciliation.
- [x] Reconciled cancellation versus refund, late payment after cancellation/expiry, refund request versus execution, customer credits, additional payments, reversals/chargebacks, provider/bank reconciliation, attributable evidence, and duplicate-event protection across the SDD.
- [x] Preserved the distinction between operational order/shipment status, cancellation status, payment status, and refund status; verified payment remains the default dispatch prerequisite under DEC-018.
- [ ] Review and merge the focused documentation-only PR.
- [ ] Continue to D-09: dispatch exception authority.
- [ ] Keep approval limits, refund timelines, fees, partial refunds, credit expiry/use, late-payment disposition, reconciliation cadence/ownership, and detailed tests unresolved.

**Evidence boundary:** Documentation-only proposal based on the owner's explicit acceptance. No application source, schema, provider integration, deployed configuration, or runtime behaviour changed or was tested. The platform-wide SDD implementation gate remains in force.

## Owner decision D-09 — 30 October 2026 (DEC-030)

- [x] Owner accepted Option A: narrow, controlled dispatch exceptions.
- [x] Confirmed verified payment remains the default dispatch prerequisite; exceptions are limited to explicitly defined operational circumstances under an approved policy, not generic convenience or unrestricted staff discretion.
- [x] Confirmed only explicitly authorized staff may approve; requesters must not automatically approve their own requests; material exceptions require a second approver.
- [x] Confirmed exceptions do not change payment status or bypass unrelated safety, custody, identity, legal, or other operational holds.
- [x] Confirmed attributable evidence must preserve the parcel/shipment, reason, requester, approver(s), timestamp, supporting evidence, and outcome.
- [x] Reconciled the owner decision register, decisions log, shared workflows, lifecycle contracts, cross-domain acceptance matrix, issues, progress, and handoff in this documentation proposal.
- [x] Review and merge the focused documentation-only PR #23; D-09 / DEC-030 is merged.
- [x] Proceed to D-10: routing, route-leg assignment, and movement evidence.
- [x] Keep eligible circumstances, permission assignment, materiality/second-approval rules, monetary or operational limits, category-specific evidence, and pre-dispatch revocation unresolved.
- [ ] Preserve the platform-wide SDD approval gate; no application-code changes are authorized.

**Evidence boundary:** Documentation-only proposal based on the owner's explicit acceptance. No application source, schema, permissions, deployed configuration, or runtime behaviour changed or was tested.


## 19. Owner decision D-10 — 30 October 2026 (DEC-031)

- [x] Owner accepted Option A: controlled, evidence-based movement.
- [x] Confirmed route proposal, approval, route-leg assignment, dispatch, physical handover, and arrival confirmation are distinct; proposal/assignment is not proof of physical movement.
- [x] Confirmed Operations manages launch-time proposals and assignments; assignment changes require explicitly assigned authority and preserve prior decisions, actor, and reason.
- [x] Confirmed movement evidence distinguishes the physical actor from the staff recorder when staff record provider/driver events on their behalf.
- [x] Confirmed delays, missed handovers, missing parcels, damage, and disputed custody transfers remain explicit exceptions, not silently successful movement.
- [x] Confirmed Driver Portal remains deferred; no provider/driver direct access is implied.
- [x] Reconciled the owner decision register, decisions log, shared workflows, lifecycle contracts, cross-domain acceptance matrix, issues, progress, and handoff in this documentation proposal.
- [ ] Review and merge the focused documentation-only PR.
- [ ] Continue to D-11: delivery proof and failed-delivery resolution.
- [ ] Keep route constraints, exact permission assignments, two-person approvals, mandatory milestones/evidence, provider/resource/capacity rules, correction authority, detailed exception outcomes, and acceptance tests unresolved.
- [ ] Preserve the platform-wide SDD approval gate; no application-code changes are authorized.

**Evidence boundary:** Documentation-only proposal based on the owner's explicit acceptance. No application source, schema, permissions, provider integration, deployed configuration, runtime behaviour, or tests were changed/run.


## 20. Owner decision D-11 — 30 October 2026 (DEC-032)

- [x] Owner accepted Option A: evidence-based delivery with controlled outcomes.
- [x] Confirmed delivery attempt, successful delivery, failed delivery, customer collection, and return are distinct outcomes; unsuccessful attempt is not completed delivery.
- [x] Confirmed successful delivery requires approved evidence appropriate to service/context; a staff status update alone is insufficient proof.
- [x] Confirmed recipient authorization must be verified under DEC-024; sender, payer, booking customer, and receiver are not interchangeable by default.
- [x] Confirmed proof methods remain flexible by service; recipient confirmation, OTP, signed acknowledgement, and attributable staff evidence are examples, not universal requirements.
- [x] Confirmed failed attempts retain reasons; reattempt, return, holding, refusal, cancellation, and financial adjustment require explicit authority and are not automatic outcomes.
- [x] Confirmed significant notifications respect party entitlements and original evidence/history is preserved for disputes.
- [x] Reconciled the owner decision register, decisions log, shared workflows, lifecycle contracts, cross-domain acceptance matrix, issues, progress, and handoff in this documentation proposal.
- [ ] Review and merge the focused documentation-only PR.
- [ ] Continue to D-12: audit, evidence retention, correction, and disclosure.
- [ ] Keep mandatory proof methods, OTP policy, attempt limits, resolution authority, holding duration, failure catalogue, loss/damage/refusal/dispute handling, customer-contact details, and acceptance tests unresolved.
- [ ] Preserve the platform-wide SDD approval gate; no application-code changes are authorized.

**Evidence boundary:** Documentation-only proposal based on the owner's explicit acceptance. No application source, schema, permissions, notifications, deployed configuration, runtime behaviour, or tests were changed/run.


## 21. Owner decision D-12 — 30 October 2026 (DEC-033)

- [x] Owner accepted Option A: accountable, evidence-based recordkeeping.
- [x] Confirmed consequential actions require attributable records identifying actor, action, affected resource, timestamp, applicable reason, and supporting evidence.
- [x] Confirmed physical actor and staff recorder must remain distinguishable; audit entries/status updates alone do not prove physical events.
- [x] Confirmed original consequential records/evidence are preserved and corrections/redactions remain separately authorized, attributable, and traceable.
- [x] Confirmed retention/deletion must be category- and purpose-appropriate, with applicable legal holds respected; exact periods remain unresolved.
- [x] Confirmed audit/evidence access is restricted to explicitly authorized reviewers and sensitive access/disclosure is auditable.
- [x] Confirmed government requests remain basic and controlled, require recorded authority/basis/scope/review/disclosure, and do not grant unrestricted platform access.
- [x] Reconciled the owner decision register, decisions log, shared workflows, lifecycle contracts, cross-domain acceptance matrix, issues, progress, and handoff in this documentation proposal.
- [ ] Review and merge the focused documentation-only PR.
- [x] Continue to D-13: customer notifications and Telegram boundary.
- [ ] Keep retention periods, full event/evidence catalogue, reviewer matrix, two-person approval cases, deletion/anonymization, legal-hold authority, disclosure workflow, evidence integrity requirements, and acceptance tests unresolved.
- [ ] Preserve the platform-wide SDD approval gate; no application-code changes are authorized.

**Evidence boundary:** Documentation-only proposal based on the owner's explicit acceptance. No application source, schema, permissions, audit implementation, retention jobs, disclosure integration, deployed configuration, runtime behaviour, or tests were changed/run.


## 22. Owner decision D-13 — 30 October 2026 (DEC-034)

- [x] Owner accepted Option A: controlled, event-driven notifications with role-based information access.
- [x] Confirmed notifications derive from meaningful, verified business events and cannot change or independently establish underlying order, payment, shipment, dispatch, custody, or delivery state.
- [x] Confirmed recipient eligibility follows DEC-024/DEC-032 party relationships and entitlements; payer notifications default to relevant financial information, not full shipment details.
- [x] Confirmed minimum-necessary message disclosure and authenticated access controls for links to further details.
- [x] Confirmed email as primary where configured, optional explicitly configured SMS subject to applicable consent/contact verification, and in-platform notifications for authenticated experiences.
- [x] Confirmed Telegram remains deferred; any future paid-order Telegram notification must follow authorized Admin **Assign For Delivery** approval and a separately approved Telegram purpose/audience/disclosure policy.
- [x] Confirmed duplicate prevention per event/recipient/channel, bounded retries, attributable attempt/outcome history, and operational visibility of persistent failures without silent fallback.
- [x] Reconciled the owner decision register, decisions log, shared workflows, lifecycle contracts, cross-domain acceptance matrix, issues, progress, and handoff in this documentation proposal.
- [ ] Review and merge the focused documentation-only PR.
- [x] Continue to D-14: guest-order recovery and claiming.
- [ ] Keep event/timing/channel matrix, consent/preferences/contact verification, templates/fields, retry limits, deduplication semantics, failure ownership, retention, Telegram audience/purpose, and acceptance tests unresolved.
- [ ] Preserve the platform-wide SDD approval gate; no application-code changes are authorized.

**Evidence boundary:** Documentation-only proposal based on the owner's explicit acceptance. No application source, schema, permissions, notification provider/integration, deployed configuration, runtime behaviour, or tests were changed/run.


## 23. Owner decision D-14 — 30 October 2026 (DEC-035)

- [x] Owner accepted Option A: secure guest-order recovery and optional account claiming.
- [x] Preserved storefront guest checkout and distinguished guest-order recovery from account claiming.
- [x] Confirmed recovery requires proof of control of the original checkout email through a verification challenge before issuing a replacement access credential; order reference/email alone is insufficient.
- [x] Confirmed optional claiming requires authenticated account context plus a separate ownership challenge; server-side entitlement and unclaimed status checks are required.
- [x] Confirmed an order cannot be claimed by multiple accounts or silently transferred; support-assisted recovery/exceptional transfer requires a separately approved process.
- [x] Confirmed challenge expiry, replay/abuse protection, non-disclosing failure responses, credential confidentiality, and separation from commercial/fulfilment state.
- [x] Reconciled the owner decision register, decisions log, shared workflows, lifecycle contracts, cross-domain acceptance matrix, issue tracker, progress, and handoff in this documentation proposal.
- [ ] Review and merge the focused documentation-only PR.
- [x] Continue to D-15: launch priority and production-readiness evidence.
- [ ] Keep challenge format/lifetime, rate limits, post-fulfilment eligibility, account deletion consequences, exceptional transfer/support procedure, token storage/rotation mechanics, retention, and detailed denial/replay/cross-account tests unresolved.
- [ ] Preserve the platform-wide SDD approval gate; no application-code changes are authorized.

**Evidence boundary:** Documentation-only proposal based on the owner's explicit acceptance. No application source, schema, endpoints, token format, notification provider, permissions, deployed configuration, runtime behaviour, or tests were changed/run.


## 24. Owner decision D-15 — 30 October 2026 (DEC-036)

- [x] Owner accepted Option A: evidence-based launch with a clearly bounded P0 scope.
- [x] Confirmed explicit P0/P1/deferred classification; P0 requirements are launch blockers and require demonstrable acceptance evidence.
- [x] Confirmed P1 deferral is allowed only when it does not compromise essential workflows, safety, security, financial integrity, legal obligations, or approved service scope; deferred features are not represented as available.
- [x] Confirmed P0 must support DEC-018 and reconciled essential requirements; the current domain-level candidate list is not an exhaustive requirement-level classification.
- [x] Confirmed source presence, rendered pages, schema presence, and passing type/build checks alone do not establish launch readiness.
- [x] Confirmed readiness evidence must cover applicable functional, security/authorization, financial, operational/physical-event, and production/recovery dimensions, with designed/implemented/tested/production-like-verified/owner-accepted states distinguished.
- [x] Confirmed unverified P0 requirements and material launch-critical gaps block release absent resolution or separately approved lawful exception.
- [x] Reconciled the owner decision register, decisions log, shared workflows, lifecycle contracts, cross-domain acceptance matrix, issues, progress, and handoff in this documentation proposal.
- [ ] Review and merge the focused documentation-only PR.
- [ ] Reconcile requirement-level P0/P1/deferred classification, detailed acceptance scenarios/evidence, production-like environment, blocker ownership, runbooks, backup/restore, monitoring, incident response, and dated sign-off.
- [ ] Obtain explicit owner approval of the complete platform-wide SDD before any application-code changes.

**Evidence boundary:** Documentation-only proposal based on the owner's explicit acceptance. No application source, schema, deployment configuration, runtime behaviour, production environment, or tests were changed/run. This decision does not certify current launch readiness.


## 25. Owner decision register completed — 30 October 2026

- [x] D-13 / DEC-034 merged in PR #27 (merge commit `024b38bf3aa22dd078a2ad4e9668c6a524a4a809`).
- [x] D-14 / DEC-035 merged in PR #28 (merge commit `0ea8ce9374a1a8f1bdcb599426a08114c76fbc5b`).
- [x] D-15 / DEC-036 merged in PR #29 (merge commit `3b940a5b0e41691da6de74a4333ab1f6443ab67a`).
- [x] All 15 tracked owner-decision slots have accepted high-level outcomes. This is not a measure of total SDD completion, implementation completion, or production readiness.
- [ ] Reconcile every SDD document against DEC-022–DEC-036 and remove stale decision-state statements.
- [ ] Complete requirement-level P0/P1/deferred classification against DEC-018 and accepted domain policies.
- [ ] Refresh source-to-requirement traceability without changing application code.
- [ ] Define detailed acceptance scenarios and evidence sources for every P0 requirement.
- [ ] Assess production configuration, deployment, monitoring, backup/restore, incident response, and rollback evidence.
- [ ] Obtain explicit owner approval of the complete reconciled platform-wide SDD before application-code changes.

**Current active task:** Stage 1 SDD consistency reconciliation. No application code changed or tests run in this documentation task.


## 26. Requirement-level launch priority baseline — 30 October 2026

- [x] Verified PR #30 merged to `main` at `c9d9342cfc9dcef2c7d5704074d83927c5f5099c`.
- [x] Read DEC-018 and DEC-036, the Admin requirements inventory, the 20-row cross-domain acceptance matrix, issue register, source traceability, and continuity documents.
- [x] Added `PLATFORM_REQUIREMENT_PRIORITY_MATRIX.md` on branch `docs/requirement-level-priority-baseline`.
- [x] Mapped all 20 cross-domain areas A-01–A-20 and all 54 Admin requirements ADM-R01–ADM-R54; retained ADM-P01–ADM-P15 as P1 and recorded explicit deferred scope.
- [x] Distinguished P0, Conditional P0, P1, and Deferred; priority is separate from design, source, verification, and release status.
- [x] Kept unresolved detailed policies and evidence requirements open; no claim of implementation or launch readiness.
- [ ] Owner review/approval and merge of the documentation-only proposal.
- [ ] Refresh source traceability against the current source head and map each P0/Conditional P0 requirement to source/gap/evidence.
- [ ] Define detailed acceptance scenarios and evidence artifacts for all P0/Conditional P0 requirements.
- [ ] Assess production-like configuration, monitoring, backup/restore, incident response, rollback and release sign-off.

**Evidence boundary:** Documentation-only work. No application source, schema, permissions, provider configuration, deployment, runtime behaviour, or tests changed/run. The matrix is proposed, not approved for implementation or release.


## 27. Requirement-level priority accepted and source traceability refreshed — 30 October 2026

- [x] Verified PR #31 reviewed and merged to `main` at `e0f69055d33dd9399c23e1d793f359468229c856`.
- [x] Confirmed current `main` head is the PR #31 merge commit; this is the source-inspection baseline for this stage.
- [x] Updated the priority matrix to record the owner-reviewed and merged P0/Conditional P0/P1/Deferred baseline. This does not approve the complete SDD or authorize implementation/release.
- [x] Refreshed the read-only recursive source-tree inventory and inspected current storefront order, customer account, Admin authorization/order/upload, Paystack, Firebase rules/helpers/types, and test sources.
- [x] Mapped all A-01–A-20 and ADM-R01–ADM-R54 to source presence, partial coverage, or no active source found in the inspected tree.
- [x] Recorded that the active source contains no dedicated independent-shipment, PUDO/location capability, intake/custody, shared shipment-pricing/quote, routing/route-leg, physical movement/handover, proof-of-delivery, general audit, refund/credit, or reconciliation implementation.
- [x] Recorded current Admin dashboard demo-data finding and the narrow scope of Firestore rules tests.
- [ ] Owner to confirm whether root `pudo.zip` is authoritative and within the active VeriLyft source scope.
- [ ] Define detailed observable acceptance scenarios and evidence artifacts for every P0/Conditional P0 requirement.
- [ ] Obtain current runtime evidence for Admin authorization, checkout/stock/payment, Cloudinary uploads, catalogue visibility, and other source-present P0 paths.
- [ ] Assess deployed configuration, production-like operations, monitoring, backup/restore, incident response, rollback and release sign-off.
- [ ] Reconcile all remaining SDD documents and obtain explicit approval of the complete platform-wide SDD before application-code changes.

**Evidence boundary:** Source mapping is read-only and pinned to `e0f69055d33dd9399c23e1d793f359468229c856`. No application code was changed. No tests were executed. No deployed configuration, provider dashboard, production Firestore data, or root archive was inspected. Source presence is not runtime verification or launch readiness.

**Current active task:** Stage 3 — requirement-to-source traceability and P0 evidence mapping. Application-code changes remain blocked by the complete SDD approval gate.


## 28. P0 acceptance scenarios and evidence catalogue drafted — 30 October 2026

- [x] Verified PR #32 merged to `main` at `c6dd28cd5450b598b19a19afa12a7331440320f0`.
- [x] Re-read the current cross-domain acceptance matrix, lifecycle/contracts, shared workflows, owner decisions, priority matrix, source traceability and Admin requirements at the PR #32 baseline.
- [x] Added `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md` with scenario outlines for all A-01–A-20 and links to ADM-R01–ADM-R54.
- [x] Defined a common case-record format, evidence classes (source, automated test, runtime, provider, operations, production), universal pass rules, and safe test-environment boundary.
- [x] Added conditional-P0 trigger gates for independent shipment/parcel operations, measurement-dependent pricing, returns, Telegram, government requests, retention-hold release and appeal evidence.
- [x] Kept unresolved DEC-022–DEC-036 policy parameters explicit; no numeric thresholds, formulas, proof methods, retention periods, retries or permission boundaries were invented.
- [ ] Owner review and approval of the catalogue's scenario scope and wording.
- [ ] Resolve detailed policy dependencies in authoritative workflow/lifecycle/permission documents.
- [ ] Confirm whether root `pudo.zip` is authoritative and within active VeriLyft source scope.
- [ ] Convert approved scenario outlines into executable test specifications and collect safe non-production runtime evidence.
- [ ] Assess production configuration, monitoring, backup/restore, incident response, rollback and release sign-off.
- [ ] Reconcile all remaining SDD documents and obtain explicit approval of the complete platform-wide SDD before application-code changes.

**Evidence boundary:** Documentation-only. The catalogue is test design, not test execution. No application code was changed and no tests were run. No production data, deployed secrets/configuration, provider dashboards, physical parcel operations or root archive were inspected. Source baseline remains `c6dd28cd5450b598b19a19afa12a7331440320f0`.

**Current active task:** Stage 4 — owner review and refinement of P0/Conditional P0 acceptance scenarios and evidence requirements. Application-code changes remain blocked by the complete SDD approval gate.


## 29. Staff permission owner decisions accepted — 30 October 2026

- [x] Verified PR #34 reviewed and merged to `main` at `06fc1485019073f573047783c7773546a23e789b`.
- [x] Discussed PM-01–PM-12 with the owner and received explicit agreement to each recommendation.
- [x] Recorded the accepted policy outcomes in `PLATFORM_STAFF_PERMISSION_DECISIONS.md`.
- [x] Reconciled `PLATFORM_STAFF_PERMISSION_MATRIX.md` so PM-01–PM-12 are no longer shown as unanswered owner decisions.
- [x] Accepted permission administration by designated Admin users only; action-level permission grants; independently configured location capabilities; designated Admin pricing authority; second-approval boundaries for consequential financial, measurement, and operational exceptions; separate audit view/export/disclosure permissions; no direct partner/driver login at launch; Management reporting permissions rather than a separate operational role; limited Support responsibility; and controlled emergency access.
- [ ] Review and merge the documentation-only decision/reconciliation PR.
- [ ] Reconcile actor/responsibility, workflow, lifecycle, authorization, acceptance, traceability, and continuity documents with the accepted PM outcomes.
- [ ] Specify remaining technical details without inventing thresholds, claims, schemas, or implementation.
- [ ] Obtain explicit owner approval of the complete platform-wide SDD before application-code changes.

**Evidence boundary:** Documentation-only policy capture based on the owner's explicit decisions. No application source, Firebase configuration/rules, data schema, APIs, permissions, deployment, runtime behaviour, or tests were changed/run. Acceptance of PM-01–PM-12 does not constitute complete SDD approval, implementation authorization, or production readiness.

## 30 October 2026 — Stage 5.2 booking-party authority policies accepted

- [x] Verified PR #35 merged to `main` at `beb2d03e88df7894a8805af79a9d68fd74cc143f`.
- [x] Discussed and received explicit owner agreement on BP-01–BP-22 under DEC-023/DEC-024.
- [x] Consolidated the accepted booking-party, sender/receiver, Support/Admin escalation, cancellation, collection, notification, transfer, financial responsibility, withdrawal, legal-representative, delegated-access, account-compromise, deletion/retention, dispute, and appeal policies in `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`.
- [x] Reconciled the decision log, owner decision register, shared workflows, lifecycle/security contracts, cross-domain acceptance matrix, actor model, and issue tracker to distinguish accepted policy from unresolved operational/technical detail.
- [x] Corrected stale PR #34 baseline references in this progress tracker.
- [ ] Review and merge PR #36, the Stage 5.2 documentation-only consolidation.
- [ ] Define remaining verification/consent methods, lifecycle/change matrix, evidence and exception authority, transfer-liability procedure, delegated-access parameters, retention/notification rules, and dispute/appeal operating details.
- [ ] Continue with Stage 5.3 — pricing, measurements, and quote adjustments after the Stage 5.2 PR is reviewed and merged.
- [ ] Reconcile all remaining SDD dependencies and obtain explicit owner approval of the complete platform-wide SDD before application-code changes.

**Evidence boundary:** Documentation-only policy capture and reconciliation. No application source, Firebase configuration/rules, schemas, APIs, permissions, deployment, runtime behaviour, or tests were changed/run. BP-01–BP-22 acceptance does not constitute complete SDD approval, implementation authorization, or production readiness.
