# VeriLyft Progress Tracker

**Last updated:** 23 October 2026
**Repository:** `dev-adeshina/small-pudo`
**Branch:** `main`
**Last committed baseline:** `bccda2f` — `feat: complete customer profile and authentication`
**Current phase:** Customer order history completed; storefront refinement and authentication/image-upload verification remain

> This tracker records the current working state, including uncommitted changes.
> Verify the live repository and test results before treating any item as complete.

## Status legend

- [x] Implemented and supported by reported or recorded evidence.
- [~] Partially implemented, under review, or requiring additional verification.
- [ ] Not implemented or not yet verified.
- [?] Requires inspection or a decision.

## 1. Current position

VeriLyft is an existing Next.js App Router ecommerce application using
TypeScript, Firebase Authentication, Firestore, Paystack, and a shared
cart context. The current work extends the existing application; it is
not a rebuild.

The customer authentication, profile, and order-history chapter has
been implemented. The customer dashboard lists the authenticated
customer's orders, and a dedicated order-details page retrieves an order
through a customer-scoped API. Browser tests confirmed that an order
belonging to another customer is rejected with a 404 response.

The working tree also contains changes related to Cloudinary image
uploads, admin authentication, admin catalogue/order screens, and the
storefront.

The next account-related decisions and delivery enhancements remain
separate from this completed order-history milestone. Continue reviewing
the landing page, category pages, and product presentation using actual
Firestore data, while preserving the existing application architecture.

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
| Admin authentication | [~] | `lib/auth.ts`, `lib/admin-auth.ts`, and admin API routes have changed. Verify that ordinary customer accounts cannot access admin functionality and that session persistence behaves correctly. |
| Admin category management | [~] | `app/admin/categories/page.tsx`; Cloudinary image upload integration and category code have changed. |
| Admin product management | [~] | `app/admin/products/page.tsx`; image upload integration and product UI have changed. |
| Admin order management | [~] | `app/admin/orders/page.tsx` has changed; rerun regression checks before declaring the current version verified. |
| Admin image-upload API | [~] | `app/api/admin/uploads/images/route.ts`; server-side authorization and Cloudinary upload behaviour require verification. |
| Cloudinary image hosting | [~] | `lib/cloudinary.ts`; Firebase Storage helper was removed. Verify upload, validation, authorization, and persisted image URLs. |
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
| Guest order tracking API | [x] | `app/api/orders/[orderId]/track/route.ts` exists. |
| Customer-facing delivery tracking UI | [ ] | Deferred until the account and storefront work is ready. |
| Courier/provider integration | [ ] | Deferred. |
| Telegram delivery notifications | [ ] | Deferred. Paid orders should initially be dispatched only after an administrator approves delivery assignment. |
| TypeScript check | [x] | `npx tsc --noEmit` passed after the recent Next.js upgrade, according to the session record. Rerun after subsequent edits. |
| Production build | [x] | `npm run build` passed after the recent Next.js upgrade, according to the session record. Rerun after subsequent edits. |
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

## 6. Tracker maintenance rules

At the end of each meaningful session:

1. Update the current phase and next implementation target.
2. Mark tasks complete only when supported by code or test evidence.
3. Record the date and outcome in the session log.
4. Record confirmed defects and unresolved risks in `ISSUES.md`.
5. Record material architecture decisions in `DECISIONS.md`.
6. State which tests were actually run and which remain outstanding.
7. Inspect the Git diff before committing and never include secrets or local environment files.
