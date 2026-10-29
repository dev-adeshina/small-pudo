# VeriLyft Progress Tracker

**Last updated:** 29 October 2026
**Repository:** `dev-adeshina/small-pudo`
**Project baseline branch:** `main`
**Current live main head verified:** `3fd1c1ae13e2016b75ca263f6d4971d7125624ef` — PR #13 cross-domain acceptance matrix is merged. The source baseline inspected for the traceability inventory remains `c56be9b121e6007e1e99c6df2d3984e709771a92`; comparison to current `main` shows the 16 intervening commits changed SDD documentation only, not application source.
**Historical audit comparison baseline:** `cccad3c4eebe398c8369d5ce90ea05ee551589cf`.
**Audit comparison baseline:** `cccad3c4eebe398c8369d5ce90ea05ee551589cf` — the historical `main` baseline reviewed by `SDD_COMPLETENESS_AUDIT.md` before PR #5.
**Admin Portal requirements/audit:** PR #2 is merged to `main`. PR #3 is merged into the inspected baseline; PR #4 remains open/unmerged.
**Current phase:** Complete and reconcile the platform-wide SDD before application-code changes. PR #5 established the first-pass audit and PR #6 merged the continuity-document reconciliation. PR #7 merged the actor/responsibility model and PR #8 merged the shared-workflow draft into the documentation baseline. PR #9 merged the domain/lifecycle/API/security draft. PR #13 (cross-domain acceptance matrix) is merged. The current workstream is dependency-ordered owner-decision review and platform-wide SDD reconciliation; no application-code changes are authorized.

> This tracker records the current working state, including uncommitted changes.
> Verify the live repository and test results before treating any item as complete.

## Status legend

- [x] Implemented and supported by reported or recorded evidence.
- [~] Partially implemented, under review, or requiring additional verification.
- [ ] Not implemented or not yet verified.
- [?] Requires inspection or a decision.

## 1. Current position
## Active SDD milestone — owner decision register

- PR #13, `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md`, is merged to `main`.
- PR #14 candidate branch: `docs/sdd/owner-decision-register`; documentation-only.
- New register: `PLATFORM_OWNER_DECISION_REGISTER.md`. It orders unresolved decisions by dependency, preserves confirmed constraints, and labels recommendations as non-binding.
- First decision to resolve: D-01, staff responsibility and approval boundaries. This affects authorization and approval contracts across the platform.
- No business decision is made by the register itself. Accepted outcomes must be recorded in `DECISIONS.md` and reconciled into affected workflow, lifecycle, acceptance, issue, progress, and handoff documents.
- Application-code work remains blocked until the platform-wide SDD is reconciled and explicitly approved.


VeriLyft remains the existing Next.js App Router ecommerce and delivery application using TypeScript, Firebase Authentication, Firestore/Firebase Admin, Paystack, Cloudinary, and the shared cart context. Continue the current architecture; do not rebuild it or introduce a parallel data/auth layer.

The live `main` head verified for the current documentation task is `3fd1c1ae13e2016b75ca263f6d4971d7125624ef` (PR #13 merge). The source traceability inventory was inspected at `c56be9b121e6007e1e99c6df2d3984e709771a92`; a commit comparison confirms that the 16 commits since that source baseline changed SDD documentation only, not application source. The historical audit comparison baseline `cccad3c4eebe398c8369d5ce90ea05ee551589cf` remains historical, not current. The historical audit comparison baseline `cccad3c4eebe398c8369d5ce90ea05ee551589cf` remains historical, not current. Admin Portal design PR #1 and requirements/audit PR #2 are merged. PR #4 (category product-count compatibility) remains open/unmerged.

Customer authentication, profile, customer-scoped order history/details, guest tracking, and guest tracking email have implementation evidence recorded below. Guest-order claiming remains undecided. The admin dashboard, catalogue, orders, and Cloudinary upload foundations exist, but current authorization behaviour, authorized/denied image uploads, and payment/stock edge cases still need runtime verification.

**Latest runtime checkpoint (28 October 2026, user-reported):** `npx tsc --noEmit` exited successfully. `npm run dev` started Next.js 16.4.2 and reported `Ready in 936ms`. This confirms the type check and development-server startup only; it does not establish browser authorization, API security, upload success, or production-build status for the current checkout.

**Working rule:** complete and reconcile the platform-wide SDD before application-code work. Read-only source inspection is allowed to establish current implementation facts. Keep approved intended behaviour, source-level implementation facts, and dated test/deployment evidence distinct. PR #6 and PR #7 are merged. The actor/responsibility, shared-workflow, and domain/lifecycle documents are in the documentation baseline, with owner decisions still open. The cross-domain acceptance matrix was merged in PR #13. The current workstream is the owner decision register and reconciliation—not application-code changes.

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
| Secure guest-order recovery/claiming | [?] | Decide whether and how guest orders can be claimed by an authenticated customer. |
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

## 3. Current work — preserve and verify

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

## 4. Roadmap

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
