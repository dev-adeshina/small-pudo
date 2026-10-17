# VeriLyft Progress Tracker

**Last updated:** 17 October 2026\
**Baseline:** `pudo(5).zip` plus user-reported project history\
**Current phase:** Phase 1 --- focused audit / prepare for customer
accounts\
**Next implementation target:** Customer registration and
authentication, after checking the complete working repository and
resolving any blocking audit findings.

> Keep this file current. A new session should use this as the first
> checkpoint, but verify important details against the live repository.

## Status legend

-   `[x]` Completed in supplied source or previously reported as tested
    (evidence noted)
-   `[~]` Partially implemented / needs further work
-   `[ ]` Not implemented or not yet verified
-   `[?]` Needs inspection or a decision

## 1. Current position

The project is beyond the initial cart stage. The supplied source
includes storefront, catalogue, cart, checkout, order/payment APIs,
admin catalogue management, admin order management, initial shipping
fields, and a guest order tracking endpoint.

**Current priority is the customer side:** customer authentication,
dashboard, and customer order history. The remaining customer-facing
delivery experience and Telegram integration are intentionally later
phases.

## 2. Feature tracker

  --------------------------------------------------------------------------------------------
  Area                    Status                  Evidence / notes
  ----------------------- ----------------------- --------------------------------------------
  Homepage/storefront     \[x\]                   `app/page.tsx` present

  Product catalogue       \[x\]                   `app/products/page.tsx` present

  Category product pages  \[x\]                   `app/products/[category]/page.tsx` present

  Product detail pages    \[x\]                   `app/products/[category]/[slug]/page.tsx`
                                                  present

  Shared cart context     \[x\]                   `context/cart-context.tsx` present; browser
                                                  persistence

  Cart page               \[x\]                   `app/cart/page.tsx` present

  Checkout                \[x\]                   `app/checkout/page.tsx` present

  Server-side order       \[x\]                   `app/api/orders/route.ts`; prior successful
  creation / stock                                lifecycle testing reported
  reservation                                     

  Order cancellation      \[x\]                   `app/api/orders/[orderId]/cancel/route.ts`

  Paystack initialization \[x\]                   `app/api/payments/initialize/route.ts`

  Paystack verification   \[x\]                   `app/api/payments/verify/route.ts`

  Paystack webhook        \[x\]                   `app/api/payments/webhook/route.ts`; prior
                                                  webhook success reported

  Payment callback UI     \[\~\]                  Files present; production build not verified
                                                  from archive

  Admin authentication    \[x\]                   Admin sign-in/sign-up/verification/reset
                                                  pages and `lib/auth.ts` present

  Admin category          \[x\]                   Page and supporting components present
  management                                      

  Admin product           \[x\]                   Page and supporting components present
  management                                      

  Admin order management  \[x\]                   Page and admin APIs present; user previously
                                                  reported working

  Shipping data model     \[x\]                   `OrderShipping` in `lib/types/order.ts`

  Admin manual shipping   \[\~\]                  Present; test transitions and edge cases in
  updates                                         full repository

  Guest order tracking    \[x\]                   `app/api/orders/[orderId]/track/route.ts`
  API                                             

  Customer                \[ \]                   Not present in supplied archive
  registration/sign-in                            

  Customer dashboard      \[ \]                   Not present in supplied archive

  Customer order          \[ \]                   Not present in supplied archive
  list/history                                    

  Customer-owned order    \[\~\]                  Current order creation uses `userId: null`;
  association                                     must extend safely

  Customer order details  \[ \]                   Not present in supplied archive
  page                                            

  Secure guest-order      \[?\]                   Token exists; recovery product flow not
  recovery/claiming                               defined

  Firebase Storage image  \[x\]                   `lib/firebase/storage.ts`
  uploads                                         

  Cloudinary              \[ \]                   Optional future decision; not implemented in
                                                  archive

  Customer-facing         \[ \]                   Tracking API exists; customer UI not found
  delivery tracking UI                            

  Courier/provider API    \[ \]                   Manual shipping data only in supplied source
  integration                                     

  Telegram bot/group      \[ \]                   Not present in supplied source
  integration                                     

  Complete production     \[?\]                   Cannot verify from archive because root
  build                                           configuration files were omitted

  Firebase Security Rules \[?\]                   Full project rules were not available in the
  review                                          archive

  End-to-end regression   \[ \]                   Future milestone
  test after customer                             
  accounts                                        
  --------------------------------------------------------------------------------------------

## 3. Active phase --- Phase 1: focused audit

### Checklist

-   [ ] Inspect the complete local repository, including `package.json`,
    lockfile, `tsconfig.json`, `next.config.*`, environment variable
    *names* (never expose values), and Firebase Security Rules.
-   [ ] Run the existing project's TypeScript/build checks in its real
    environment.
-   [ ] Review payment retry, cancellation, expiry, and late webhook
    behaviour.
-   [ ] Confirm stock reservation/release behaviour for failure,
    cancellation, expiry, and duplicate events.
-   [ ] Confirm admin API authorization and customer/order data access
    boundaries.
-   [ ] Record only confirmed defects in `ISSUES.md`.
-   [ ] Avoid rewriting parts that are already working.

### Exit criteria

-   [ ] Blocking audit findings are fixed or explicitly
    accepted/deferred.
-   [ ] Current build/test state is recorded accurately.
-   [ ] Customer-auth implementation can begin without unresolved design
    assumptions.

## 4. Roadmap tracker

### Phase 1 --- Focused audit

**Status: \[\~\] Active / next action.**

### Phase 2 --- Customer authentication

**Status: \[ \] Not started.** - \[ \] Agree the minimum authentication
methods based on existing Firebase patterns. - \[ \] Implement customer
sign-up/sign-in/sign-out/account recovery. - \[ \] Keep customer auth
separate from admin authorization. - \[ \] Test protected customer
routes.

### Phase 3 --- Customer dashboard

**Status: \[ \] Not started.** - \[ \] Account overview. - \[ \] Account
navigation and responsive layout. - \[ \] Loading, empty, success, and
error states. - \[ \] Reuse current global CSS/Tailwind patterns.

### Phase 4 --- Customer order history

**Status: \[ \] Not started.** - \[ \] Associate authenticated orders
with verified Firebase UID server-side. - \[ \] Add customer-scoped
order-list retrieval. - \[ \] Add customer-scoped order-detail
retrieval. - \[ \] Ensure customers cannot access another customer's
orders. - \[ \] Decide secure guest-order recovery/claiming behaviour. -
\[ \] Keep guest checkout if still required.

### Phase 5 --- Finish account experience / image-hosting decision

**Status: \[ \] Not started.** - \[ \] Complete essential account and
order screens. - \[ \] Decide whether Cloudinary solves a concrete
requirement. - \[ \] If approved, plan migration without breaking
existing image URLs.

### Phase 6 --- End-to-end regression

**Status: \[ \] Not started.** - \[ \] Guest
browse/cart/checkout/payment path. - \[ \] Registered customer checkout
and order history. - \[ \] Payment failure/retry/cancel/late webhook
cases. - \[ \] Admin catalogue and order operations. - \[ \]
TypeScript/build checks. - \[ \] Mobile/responsive review.

### Phase 7 --- Customer-facing delivery experience

**Status: \[ \] Deferred intentionally.** - \[ \] Customer order details
display fulfilment status. - \[ \] Display courier/tracking information
when present. - \[ \] Connect to existing tracking logic without
duplicate APIs. - \[ \] Decide manual courier tracking versus provider
integration.

### Phase 8 --- Telegram integration

**Status: \[ \] Deferred intentionally.** - \[ \] Agree notification
trigger(s) and exact fields. - \[ \] Configure server-side bot token and
group/chat ID. - \[ \] Send minimum necessary order information. - \[ \]
Add retry/error logging and duplicate-notification protection. - \[ \]
Keep Telegram separate from customer-facing order management.

## 5. Session log

### 17 October 2026 --- Source audit and SDD baseline

-   Reviewed the supplied archive structure and relevant source paths.
-   Identified that admin shipping management and a guest tracking API
    already exist.
-   Identified customer registration, dashboard, customer order history,
    and customer tracking UI as absent from the supplied archive.
-   Noted that new order creation currently uses `userId: null`.
-   Confirmed Firebase Storage is present; Cloudinary is not implemented
    in the supplied source.
-   Build could not be independently verified because root project
    configuration was not included in the ZIP.
-   Next task: inspect complete working repository and perform focused
    audit, then begin customer authentication.

## 6. How to update this tracker

At the end of every meaningful session: 1. Update the current phase and
next implementation target. 2. Mark tasks complete only when code and/or
test evidence supports that status. 3. Add a dated session-log entry. 4.
Add confirmed bugs or unresolved risks to `ISSUES.md`. 5. Record
material architecture decisions in `DECISIONS.md`. 6. State which tests
were actually run and which were not.
