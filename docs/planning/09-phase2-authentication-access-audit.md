# Phase 2 Authentication and Access-Control Audit

**Date:** 27 November 2026  
**Baseline:** `staging` after PR #180  
**Implementation branch:** `feat/phase2-access-and-phase3-schema-finalization`  
**Status:** Phase 2 gaps addressed in code; local build, automated tests and live browser verification remain pending.

## 1. Scope

This audit covers the three current workspaces, their shared authentication helpers, representative account/partner APIs, the current Firestore rules boundary, and the newly added PUDO personnel roster workflow. It does not claim a line-by-line review of every Admin API or constitute a penetration test.

## 2. Identity and authority boundaries

| Actor | Authentication | Authoritative profile/access check | Permitted scope |
|---|---|---|---|
| Customer | Firebase Auth; verified email; revoked-token check on server APIs | Auth UID maps to the customer's own profile/data | Own profile, own orders and permitted shipment/quote/payment/document data |
| Admin | Firebase Auth; verified email; revoked-token check | Configured Admin email allowlist + `admin` custom claim + active `adminAccess/{uid}` record | Admin actions allowed by server-side route/permission checks |
| PUDO Partner | Firebase Auth; verified email; revoked-token check | Active `pudoPartnerAccounts/{uid}` profile and partner ownership of each location | Own PUDO location applications, location roster and station-scoped operations |
| PUDO Personnel | No Firebase Auth account in initial release | Roster entry nested beneath the partner-owned PUDO location | Identification for operational records only; no direct portal access or independent permissions |
| Recipient | Not yet implemented as a separate shipment-access workflow | Must be verified and linked to the shipment recipient before shipment data is disclosed | Recipient-safe tracking and documents only; no sender payment details or internal notes |

A shared Firebase Auth UID namespace does not merge these identities. The profile and authority checks remain role-specific.

## 3. Customer access review

Reviewed:
- `lib/customer-auth.ts`: registration initializes the profile, sends email verification and signs out the new account; customer sign-in blocks unverified email.
- `lib/server/customer-auth.ts`: requires a bearer token, checks token revocation and requires verified email.
- Customer profile and order APIs: derive the customer UID from the verified token; order access verifies stored ownership rather than trusting a client-supplied UID.
- Shipment draft, quote and active-PUDO APIs: use the verified-customer helper and derive ownership from the authenticated UID.

Changes in this branch:
- Server-side customer API token verification now checks revocation consistently.
- The shared helper requires its verifier to receive the revocation-check flag.
- Customer profile initialization remains possible during registration before email verification, but the customer cannot access the workspace until verification succeeds.

Boundary:
- A customer cannot choose their own customer ID in a request to access another customer's records.
- Customer UI navigation is not an authorization mechanism; APIs remain authoritative.
- Legacy store orders remain store orders and are not shipment records.

## 4. Admin access review

Reviewed:
- `lib/server/admin-authorization-core.ts`
- `lib/server/admin-authorization.ts`
- `tests/admin-authorization.test.mjs`
- Current `firestore.rules` server-managed Admin and operational record boundaries.

The shared Admin authorizer requires:
1. A bearer Firebase ID token.
2. Revocation-aware token verification.
3. Verified email.
4. Email present in the configured `ADMIN_EMAILS` allowlist.
5. The Firebase `admin` custom claim.
6. An active `adminAccess/{uid}` Firestore record.

Failure to configure the allowlist fails closed. Admin access is not granted merely because a person can sign in.

Existing route-level action permissions remain additional controls where required. The Admin workspace shell and navigation do not grant permissions.

## 5. PUDO partner access review

Reviewed:
- `lib/server/pudo-partner-workspace-auth.ts`
- `lib/server/pudo-partner-portal-store-core.ts`
- `app/api/pudo-partner/account/route.ts`
- `app/api/pudo-partner/applications/route.ts`
- `firestore.rules`

The partner authorizer requires:
1. A bearer Firebase ID token.
2. Revocation-aware token verification.
3. Verified email and a valid email address.
4. An active partner account.
5. Server-side partner ownership checks for each location/application.

Registration intentionally creates the partner's own profile immediately after Firebase account creation so the verification email can be sent without losing the submitted business details. This profile-creation endpoint does not grant workspace access; the partner workspace authorizer still requires a verified, non-revoked token and an active partner account.

The partner is not an Admin. Partner access does not grant commercial pricing approval, Admin operations or access to unrelated partner locations.

## 6. PUDO personnel roster — Phase 2 gap closed

Implemented in this branch:
- `pudoLocations/{locationId}/personnel/{personnelId}` roster records.
- Partner-owned list, create, update and deactivate operations.
- Required name and operational role; active/inactive state.
- Ownership and active partner checks repeated inside write transactions.
- Append-only location audit entries for registration, update and deactivation.
- Deactivation instead of destructive deletion.
- Partner dashboard Personnel navigation and management page.

Important identity rule:
- Personnel roster entries are not Firebase Auth users.
- No worker login, password, Admin claim, or independent permissions are created.
- Actions submitted through the partner portal are attributed to the authenticated PUDO partner UID. A named worker may be identified as the operational person in a later intake/assignment record.
- Shift schedules and assignment periods remain Phase 6 work; the Phase 2 roster does not attempt workforce scheduling.

## 7. Firestore rules and server-side access

The current default database rules deny direct client access to server-managed Admin, PUDO partner, PUDO location, verification, activation, capability, operations and network records. Existing product/category storefront access remains intentionally distinct; orders are server-managed.

The new shipment database does not yet have rules. Its rules must default-deny client writes to authoritative shipment, quote, payment, intake, assignment, event and approval records. Customer/recipient reads should be exposed through server-side ownership-checked APIs or carefully tested rules.

No Firestore rules were changed in this branch.

## 8. Phase 2 completion criteria

- [x] Customer registration/sign-in and verified-email gate exist.
- [x] Admin sign-in and server-side Admin authority checks exist.
- [x] PUDO partner registration/sign-in and partner ownership checks exist.
- [x] PUDO named personnel roster exists without worker login.
- [x] Customer API token verification checks revocation consistently in the reviewed account routes.
- [x] PUDO partner workspace access requires verified email.
- [x] Customer, Admin, PUDO Partner and PUDO Personnel authority are kept distinct.
- [ ] Local automated test suite and production build pass on this branch.
- [ ] User performs live browser verification of partner personnel workflow.
- [ ] Full route-by-route authorization regression remains a release-hardening activity, especially as new shipment/recipient APIs are added.

## 9. Explicitly not implemented in Phase 2

- Recipient shipment-access authentication and authorization.
- Individual PUDO worker login.
- Shift planning, attendance, worker availability or assignment scheduling.
- New shipment database rules, indexes or provisioning.
- Any migration or change to existing store/customer/order data.

These are intentionally deferred to the roadmap phases where their business workflows are implemented.
