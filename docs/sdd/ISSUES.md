# VeriLyft Issues, Risks, and Open Questions

**Last updated:** 17 October 2026\
**Purpose:** Prevent future sessions from forgetting unresolved issues
or treating assumptions as facts.

Status labels: `OPEN`, `INVESTIGATING`, `BLOCKED`, `DEFERRED`,
`RESOLVED`.

## Open items

### VLY-001 --- Full build and TypeScript status not verified

-   **Status:** OPEN
-   **Priority:** High
-   **Evidence:** The supplied ZIP omitted `package.json`, lockfile,
    `tsconfig.json`, and `next.config.*`.
-   **Impact:** We cannot confirm the current full project compiles from
    the supplied archive.
-   **Next action:** Run the normal checks from the complete working
    repository.
-   **Acceptance:** Record actual command output and fix any
    reproducible build/type errors.

### VLY-002 --- Authenticated orders are not associated with customer UID

-   **Status:** OPEN
-   **Priority:** High
-   **Evidence:** Supplied `app/api/orders/route.ts` creates orders with
    `userId: null`.
-   **Impact:** Customer order history cannot be reliably scoped to
    registered users until this is implemented.
-   **Next action:** Add verified server-side identity handling while
    preserving guest checkout.
-   **Acceptance:** Authenticated orders contain the verified UID;
    clients cannot choose another UID; guest orders continue to work if
    guest checkout is retained.

### VLY-003 --- Customer account experience missing

-   **Status:** OPEN
-   **Priority:** High
-   **Evidence:** No customer sign-up/sign-in/dashboard/order-history
    pages found in the supplied archive.
-   **Next action:** Implement customer authentication, then dashboard
    and order history as incremental vertical slices.
-   **Acceptance:** A customer can sign in, view only their own orders,
    open order details, and sign out.

### VLY-004 --- Guest order recovery/claiming flow undefined

-   **Status:** OPEN
-   **Priority:** Medium
-   **Evidence:** Guest order access token is returned to the browser
    and stored in session storage; no complete account-based recovery
    flow was found.
-   **Risk:** Customers may lose access when session storage is lost or
    a different browser/device is used.
-   **Next action:** Decide whether guest orders can be claimed by an
    account and define a secure proof-of-ownership flow.
-   **Constraint:** An order ID alone must not grant access. Do not
    automatically associate an order with an account without verified
    entitlement.

### VLY-005 --- Payment expiry, late events, and stock release need focused verification

-   **Status:** INVESTIGATING
-   **Priority:** High
-   **Evidence:** Payment and cancellation implementations exist; this
    audit has not independently exercised all edge cases.
-   **Next action:** Inspect current logic and tests for unpaid expiry,
    retry, cancellation, duplicate webhook, late successful payment, and
    stock release.
-   **Acceptance:** State transitions are consistent and repeated events
    cannot double-process stock or payment.

### VLY-006 --- Customer-facing tracking UI missing

-   **Status:** DEFERRED
-   **Priority:** Medium
-   **Evidence:** Tracking API exists at
    `app/api/orders/[orderId]/track/route.ts`; no customer tracking page
    was found in the supplied archive.
-   **Next action:** Implement after customer dashboard/order details
    are established.
-   **Acceptance:** Authorized customers can view current fulfilment and
    shipping details; guest access remains token-protected where
    supported.

### VLY-007 --- Telegram integration not implemented

-   **Status:** DEFERRED
-   **Priority:** Medium
-   **Evidence:** No Telegram bot integration found in the supplied
    archive.
-   **Next action:** Define event triggers, fields, group access,
    retries, and duplicate protection after core customer work.
-   **Acceptance:** Relevant order events send minimal necessary
    information to the configured group without exposing secrets or
    unnecessary customer data.

### VLY-008 --- Cloudinary decision pending

-   **Status:** DEFERRED
-   **Priority:** Low
-   **Evidence:** Firebase Storage upload helper exists at
    `lib/firebase/storage.ts`; Cloudinary is not implemented.
-   **Next action:** Make a decision only if cost, image transformation,
    performance, or operational needs justify migration.
-   **Acceptance:** Explicit decision documented; if migration is
    approved, existing product/category image references remain valid or
    are migrated safely.

### VLY-009 --- Firebase Security Rules not independently reviewed

-   **Status:** OPEN
-   **Priority:** High before production certification
-   **Evidence:** Rules were not included in the supplied archive.
-   **Next action:** Inspect actual rules and confirm that privileged
    data access is server-controlled and client access is appropriately
    restricted.
-   **Acceptance:** Rules and API authorization are reviewed together;
    no claim of security certification without evidence.

## Open product decisions

1.  Will guest checkout remain supported? Current default: **yes,
    preserve it** unless the owner decides otherwise.
2.  Which customer sign-in methods are required initially? Reuse current
    Firebase patterns; confirm scope before adding methods not already
    used.
3.  Can a guest order be claimed by a registered account? Not decided;
    design a secure process before implementation.
4.  Will shipping initially remain manually managed by admin? Current
    implementation supports manual shipping fields; provider integration
    is deferred.
5.  What exact events should trigger Telegram notifications? Not
    decided; define before implementation.
6.  Is Cloudinary needed now? Current recommendation: defer until a
    concrete requirement exists.

## Resolved / recorded observations

-   Admin order-management UI and API routes are present in the supplied
    archive; the user has reported `/admin/orders` working.
-   Shipping fields and status values are present in
    `lib/types/order.ts`.
-   A guest order tracking API exists.
-   Firebase Storage is implemented; Cloudinary is not.
-   The current archive is insufficient to verify a complete production
    build.
