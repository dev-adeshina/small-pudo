# VeriLyft --- Beyond Borders

## Product and technical specification (SDD)

-   **Document type:** Product + technical specification for spec-driven
    development
-   **Baseline date:** 17 October 2026
-   **Status:** Working specification; verify against the complete local
    repository before implementation
-   **Primary objective:** Continue the existing application without
    unnecessary redesign or duplicate architecture.

------------------------------------------------------------------------

## 1. Product overview

VeriLyft is an e-commerce application built with Next.js, TypeScript,
Firebase/Firestore, Firebase Authentication, and Paystack. It supports
product discovery, cart management, checkout, order creation, payment
handling, admin catalogue management, and an initial admin
shipping/fulfilment workflow.

The near-term goal is to complete the customer-facing account experience
and connect customers to their own order history. The remaining customer
delivery experience and Telegram fulfilment integration are
intentionally later phases.

### Product principles

1.  Build on the existing codebase; do not restart or replace working
    systems.
2.  Make the smallest focused change that satisfies the agreed
    requirement.
3.  Reuse existing App Router conventions, Firebase services, shared
    types, validation patterns, components, and CSS conventions.
4.  Do not introduce a second implementation of an existing concern
    (cart, orders, Firebase clients, auth, uploads, or API access).
5.  Do not invent product requirements, fields, routes, dependencies, or
    design patterns without explaining the need and obtaining agreement
    where material.
6.  Keep the server authoritative for prices, stock, payment state,
    order ownership, and authorization.
7.  Preserve guest checkout unless an explicit product decision changes
    it.
8.  Prefer incremental delivery with a clear acceptance test over broad
    refactors.
9.  Treat reported test results as user-reported until reproduced;
    distinguish code presence from runtime verification.
10. Update the progress and issue trackers at the end of each meaningful
    task.

------------------------------------------------------------------------

## 2. Current product flow

### Existing shopping and payment flow

``` text
Homepage
  → Browse categories/products
  → Product details
  → Add to cart
  → Cart
  → Checkout
  → Create order / reserve stock
  → Paystack payment
  → Verify payment / process webhook
  → Order state updated
```

### Target customer-account flow

``` text
Customer visits VeriLyft
  → Register or sign in (guest checkout remains an option)
  → Browse products / maintain cart
  → Checkout
  → Order is associated with authenticated customer when signed in
  → Payment
  → Customer dashboard
  → My orders
  → Order details
  → Later: customer delivery tracking
```

### Target fulfilment flow (later phase)

``` text
Paid order
  → Admin processes order
  → Ready for shipping
  → Admin records courier/provider and tracking information
  → Shipped
  → Delivered
  → Customer can see progress in VeriLyft
  → Later: Telegram notifications / coordination
```

Telegram is a planned operational integration, not the primary customer
interface. It must not be treated as a substitute for customer order
history or tracking.

------------------------------------------------------------------------

## 3. Stack and existing conventions

### Stack evidenced by project context/source

-   Next.js App Router
-   React and TypeScript
-   Firebase Authentication
-   Cloud Firestore
-   Firebase Admin SDK for privileged server-side operations
-   Paystack for payment
-   Tailwind CSS is used in existing pages/components
-   `lucide-react` is used for icons
-   Existing global stylesheet: `app/globals.css`
-   Existing shared cart context: `context/cart-context.tsx`
-   Existing shared domain types and Firebase data-access helpers under
    `lib/`

**Do not infer exact package versions from this archive.** Root
dependency/configuration files were not included in the supplied ZIP.
Confirm versions from the complete repository before using
version-specific APIs.

### Existing structure (representative, not exhaustive)

``` text
app/
  page.tsx
  layout.tsx
  globals.css
  about/page.tsx
  contact/page.tsx
  products/page.tsx
  products/[category]/page.tsx
  products/[category]/[slug]/page.tsx
  cart/page.tsx
  checkout/page.tsx
  payment/callback/
  admin/
    page.tsx
    sign-in/
    sign-up/
    verify-email/
    forgot-password/
    categories/
    products/
    orders/
  api/
    orders/
    orders/[orderId]/cancel/
    orders/[orderId]/track/
    payments/initialize/
    payments/verify/
    payments/webhook/
    admin/orders/
components/
  admin/
  admin/categories/
  admin/products/
context/
  cart-context.tsx
lib/
  auth.ts
  firebase.ts
  firebase-admin.ts
  firebase/
    categories.ts
    products.ts
    orders.ts
    storage.ts
  types/
    cart.ts
    category.ts
    order.ts
    product.ts
  validations/
    category.ts
    product.ts
```

This is a representative map from the supplied archive and context.
Always inspect the live repository before creating or moving files. In
particular, the project has previously clarified that the cart type is
`lib/types/cart.ts`, not `.tsx`.

------------------------------------------------------------------------

## 4. Architecture and coding patterns

### App Router

-   Use the existing Next.js App Router layout and route conventions.
-   Keep route handlers in the existing `app/api/.../route.ts` locations
    unless a concrete requirement justifies a change.
-   Use server components by default where appropriate; add client
    components only for browser interactivity, state, or browser-only
    APIs.
-   If a page uses `useSearchParams()` or another hook that requires a
    Suspense boundary for static rendering, follow the existing
    callback-page fix/pattern and validate with the actual production
    build.

### Firebase

-   Reuse `lib/firebase.ts` for the client SDK and
    `lib/firebase-admin.ts` for privileged server-side access.
-   Reuse existing data-access modules under `lib/firebase/`.
-   Do not expose service-account secrets or privileged credentials to
    client code.
-   Keep authorization and sensitive data validation on the server.
-   Use Firestore transactions where concurrent changes could otherwise
    produce inconsistent stock/order state.
-   Avoid duplicating Firebase initialization or adding a second
    data-access architecture.

### Types and validation

-   Extend existing types under `lib/types/` where the domain already
    belongs.
-   The order/shipping model belongs in the existing order type file
    (`lib/types/order.ts` in the supplied archive). Do not create a
    competing shipping type without a demonstrated need.
-   Reuse and extend established validation patterns under
    `lib/validations/`.
-   Keep API input types, Firestore data, and client display models
    consistent; account for Firestore `Timestamp` values explicitly.

### API and error handling

-   Validate incoming request data on the server.
-   Return clear, consistent HTTP status codes and safe error messages.
-   Never trust client-submitted price, payment status, admin role, or
    order ownership.
-   Do not expose stack traces, secrets, token hashes, or unnecessary
    personal data to clients.
-   Ensure state-changing endpoints enforce authorization independently;
    hiding UI controls is not authorization.
-   Consider retries and duplicate requests for payment/webhook/order
    actions. Keep operations idempotent where required.

### Cart and checkout

-   The existing cart context uses browser storage (`localStorage`) for
    guest cart persistence.
-   Keep the current cart API and item shape unless a requirement
    demands a change.
-   The server must recalculate prices and totals from current product
    data.
-   Do not treat a browser cart or browser-provided subtotal as
    authoritative.
-   Preserve guest checkout unless explicitly changed.

------------------------------------------------------------------------

## 5. Data and order lifecycle

### Current order-related behaviour evidenced by source/context

-   Order creation endpoint: `app/api/orders/route.ts`.
-   Cancellation endpoint: `app/api/orders/[orderId]/cancel/route.ts`.
-   Tracking endpoint: `app/api/orders/[orderId]/track/route.ts`.
-   Admin order endpoints: `app/api/admin/orders/route.ts` and
    `app/api/admin/orders/[orderId]/route.ts`.
-   Payment endpoints: `app/api/payments/initialize/route.ts`,
    `verify/route.ts`, and `webhook/route.ts`.
-   Order creation validates products, prices and stock, reserves stock
    in a Firestore transaction, and creates an order.
-   Guest order access uses a random token returned to the client; the
    stored representation is hashed. Checkout stores the token in
    `sessionStorage`.
-   Existing order creation sets `userId` to `null`, so authenticated
    order ownership must be implemented deliberately.
-   The current default delivery fee is zero and currency is NGN. Do not
    change these business rules without an explicit decision.

### Payment/order state invariants

-   Payment status and fulfilment status are separate concepts; do not
    collapse them into one field.
-   Only verified payment evidence should cause an order to be treated
    as paid.
-   A client-side callback alone must not be considered authoritative
    proof of payment.
-   Repeated webhook events or retries must not corrupt order state or
    decrement stock multiple times.
-   Cancellation, expiry, stock release, and late successful payment
    require deliberate state-transition rules.
-   Before implementing an order-state change, inspect the current
    transitions and test coverage.

### Shipping type

The supplied order type includes an `OrderShipping` structure with: -
`provider` - `trackingNumber` - `shippedAt` - `estimatedDeliveryAt` -
`deliveredAt` - `notes`

The existing order status type includes: `pending`, `confirmed`,
`processing`, `ready_for_shipping`, `shipped`, `delivered`, `cancelled`.

Do not assume that this list is final or that every transition is fully
tested. Validate transition rules before extending them.

------------------------------------------------------------------------

## 6. Customer accounts and ownership requirements

This is the next major product capability to implement.

### Functional requirements

1.  Customers can register and sign in using the agreed Firebase
    Authentication methods.
2.  Customers can sign out and recover account access.
3.  Protected customer pages require a valid authenticated identity.
4.  A signed-in customer can retrieve only orders associated with their
    verified Firebase UID.
5.  New orders created by an authenticated customer should record that
    verified UID on the server.
6.  The server must not trust a `userId` supplied by the browser.
7.  Guest checkout remains available unless explicitly changed.
8.  Guest-order recovery/claiming must be designed securely; knowing an
    arbitrary order ID alone must not grant access.
9.  Customer order details must not expose another customer's personal,
    payment, or delivery information.
10. Admin authorization must remain separate from customer
    authentication.

### Initial dashboard scope

-   Account overview
-   My orders list
-   Individual order details
-   Personal information (minimum viable scope)
-   Sign out

Do not add wishlists, saved payment methods, reviews, loyalty points, or
other optional account features unless they are separately approved.

### Suggested route names (proposals, not existing code)

Use existing naming conventions after checking the repository. Potential
routes include: - `/account/sign-up` - `/account/sign-in` - `/account` -
`/account/orders` - `/account/orders/[orderId]`

Do not create all routes blindly; implement the smallest vertical slice
that can be tested end-to-end.

------------------------------------------------------------------------

## 7. UI, layout, styling, and accessibility principles

### Preserve the existing visual system

-   `app/globals.css` is large and already contains established styles.
    Inspect and reuse its existing classes, tokens, variables, and
    responsive patterns before introducing new ones.
-   Tailwind is used in existing pages. Follow the style approach of the
    closest existing page/component; do not introduce another CSS
    framework.
-   Do not globally restyle the site or replace the visual design during
    feature work.
-   Reuse existing admin forms, tables, dialogs, toggles, buttons,
    spacing, typography, and icon patterns where appropriate.
-   Avoid introducing a new component library unless there is a
    specific, agreed requirement.
-   Keep the public storefront and admin interface visually consistent
    with their existing designs while allowing their different purposes.
-   Use `lucide-react` where it matches existing icon usage.
-   Make layouts responsive and usable on mobile and desktop.
-   Provide loading, empty, success, validation-error, and server-error
    states for meaningful data-driven screens.
-   Ensure forms have labels, buttons have clear names, focus is
    visible, and status is not communicated only through colour.
-   Avoid unnecessary animation or decorative redesign.

### CSS change discipline

1.  Search for existing styles/classes first.
2.  Reuse existing tokens and utilities.
3.  Add the narrowest component/page-level styling that solves the
    requirement.
4.  Avoid broad edits to `app/globals.css` unless genuinely necessary.
5.  Check responsive behaviour and unintended side effects.

------------------------------------------------------------------------

## 8. Security, privacy, and operational requirements

-   Firebase Admin credentials and Paystack secret keys must remain
    server-side.
-   Admin API routes must independently verify Firebase identity and
    admin authorization.
-   Customer APIs must verify the authenticated UID and enforce
    per-order ownership.
-   Guest-order APIs must validate the access token using the
    established secure approach.
-   Do not return token hashes or secret values.
-   Minimize personal information sent to logs or Telegram.
-   Telegram bot tokens must be server-side environment variables, never
    bundled into the client.
-   Use server-side price and stock checks.
-   Handle payment webhooks as untrusted HTTP requests until their
    signatures are verified.
-   Prevent duplicate payment processing and duplicate Telegram
    notifications where applicable.
-   Review Firebase Security Rules in the full project; the supplied
    archive alone is insufficient to certify them.
-   Do not claim production readiness without testing configuration,
    authorization, failure states, and deployment settings.

------------------------------------------------------------------------

## 9. Feature roadmap and scope boundaries

### Phase 1 --- Focused audit

Review payment/order edge cases, authorization, validation, error
handling, and build status. Fix only confirmed issues.

### Phase 2 --- Customer authentication

Implement customer registration, sign-in, sign-out, and account recovery
using the existing Firebase setup.

### Phase 3 --- Customer dashboard

Create the minimum viable account overview and navigation.

### Phase 4 --- Customer order history

Associate authenticated orders with verified UIDs, provide a
customer-scoped order list and detail endpoint/page, and decide secure
guest-order recovery.

### Phase 5 --- Account experience and image-hosting decision

Finish essential account states and decide whether there is a concrete
reason to migrate from Firebase Storage to Cloudinary.

### Phase 6 --- Regression testing

Retest storefront, cart, checkout, payment, cancellation, order history,
and admin operations.

### Phase 7 --- Customer-facing delivery

Connect the existing tracking endpoint and shipping model to the
customer dashboard. Decide whether delivery remains manually managed or
uses a provider integration.

### Phase 8 --- Telegram integration

Send carefully scoped order/fulfilment notifications to a configured
group and define retries, duplicate prevention, access control, and
operational handling.

### Out of scope until separately approved

-   Rebuilding the app or changing its framework
-   Replacing Firebase or Paystack
-   A broad UI redesign
-   Migrating to Cloudinary solely for novelty
-   New payment methods
-   Loyalty/rewards/reviews/wishlists
-   Automated courier integration before the delivery requirements are
    agreed
-   Making Telegram the customer's main order interface

------------------------------------------------------------------------

## 10. Definition of done

A feature is not complete merely because a page or endpoint exists.

For each feature: 1. Requirements and affected existing files are
identified. 2. The implementation follows this specification and
existing code patterns. 3. Types and server-side validation are correct.
4. Authorization is enforced at the API/data boundary. 5. Loading,
empty, success, and error states are handled where relevant. 6. The
happy path and meaningful failure paths are tested. 7. Existing related
flows are regression-tested. 8. TypeScript/build checks are run where
the complete project environment permits. 9. Any unverified item is
explicitly recorded rather than marked complete. 10. `PROGRESS.md` and
`ISSUES.md` are updated.

------------------------------------------------------------------------

## 11. Required working protocol for future sessions

Before editing: 1. Read `README.md`, `PROGRESS.md`, `ISSUES.md`, and
`DECISIONS.md`. 2. Inspect the actual repository and the relevant
current files. 3. Confirm the active task and acceptance criteria. 4.
Identify the smallest set of files likely to change. 5. State
assumptions if a requirement is ambiguous; ask only essential questions.
6. Do not fabricate unseen files, package versions, test results, or
environment values.

During implementation: 1. Make focused changes. 2. Preserve existing
conventions and successful functionality. 3. Avoid unrelated refactors.
4. Explain any necessary deviation from the specification.

After implementation: 1. Summarize changed files and behaviour. 2.
Report commands/tests actually run and their real results. 3. List
outstanding risks or unverified behaviours. 4. Update the progress and
issue trackers. 5. State the single recommended next task.

------------------------------------------------------------------------

## 12. Archive baseline and evidence quality

The baseline source reviewed was `pudo(5).zip`, dated around 17 October
2026. The supplied archive included application source, components,
Firebase helpers, types, validation files, and `app/globals.css`, but
omitted root package/build configuration.

Therefore: - Source presence can be reported from inspection. - Prior
successful tests are attributed to the user's reports. - A successful
current production build is **not verified by this archive**. - Live
Firebase, Paystack, deployed environment, and security-rule behaviour
are **not independently verified here**. - If the complete working
repository differs, reconcile it before implementation.
