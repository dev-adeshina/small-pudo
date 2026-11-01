# Shipper Journey and Portal Experience Specification

**Status:** M1.2 product/experience definition; PR #98 merged 1 November 2026. First M1.3 dashboard slice delivered in PR #100; shipment workspace hardening is under review in PR #102. This remains a product/experience specification, not an API, schema, permission or status-enum approval.  
**Date:** 1 November 2026  
**Authority:** DEC-036–DEC-045 where applicable; BP-01–BP-22; PM-01–PM-12.  
**Execution pointer:** `PLATFORM_CONSOLIDATED_IMPLEMENTATION_BACKLOG.md`.

## 1. Outcome and scope

VeriLyft needs one coherent customer-facing shipper workspace through which an eligible registered customer, acting as booking party, can prepare and manage independent shipments using only capabilities approved, implemented and verified. The existing customer account and `/account/shipments` draft interface are the foundation, not a completed shipper portal. Storefront orders remain a separate product journey and must not be presented as independent shipments.

This document defines the customer journey, surface responsibilities, party visibility principles, action boundaries, experience states and acceptance scenarios. It does not approve new persisted fields/collections, API contracts, status enums, role assignments, delegation mechanics, service availability, rates/formulas, quote/payment contracts, custody evidence, notification rules or release readiness. Separate sender/receiver portals are not approved or assumed.

## 2. End-to-end journey and gates

| Stage | Customer outcome | Availability / gate |
|---|---|---|
| Account access | Register, sign in and use an eligible verified account. | Existing customer-auth foundation; independent booking launch is for registered, authenticated customers with verified email. |
| Prepare shipment | Enter origin, destination and parcel description; save, review and edit a draft. | Existing draft foundation; M1.1 hardening merged and verified (29/29 tests; TypeScript, lint and build passed). |
| Select eligible service | See only services eligible for the journey and supported by approved location/service capabilities. | Gated by approved service catalogue and DEC-043 capability policy. |
| Review quotation | Understand server-calculated amount, charges, inputs, currency, rule/version and validity. | Gated by approved pricing formula/inputs, units, charges, currency, rounding, rule version, quote validity and handover deadline. |
| Accept and confirm | Booking party explicitly accepts a valid quote before confirmation. | Gated by DEC-038 and quote/booking prerequisites. Draft or quote is not a booking. |
| Pay | Understand amount due and authoritative payment outcome. | Gated by DEC-041, approved methods, authority, evidence and reconciliation. Booking is not payment. |
| Follow progress | See entitled status/history based on authoritative operational facts. | Gated by lifecycle, custody, evidence and entitlement contracts. |
| Manage changes/exceptions | Perform only permitted actions; request help or dispute through approved paths. | Gated by amendment, cancellation, collection, exception and party-authority policies. |
| Notifications/support | Receive appropriate updates without unauthorized disclosure. | Gated by DEC-034 and recipient/event/field/channel/retry rules. |

The interface may explain that future stages are unavailable. It must not present a functional-looking action as operational while its backend capability remains gated.

## 3. Recommended portal surfaces

Use one shipper workspace within the existing customer account architecture. Reuse existing App Router, Firebase authentication, account components, styles and service patterns; do not create a parallel architecture.

| Surface | Responsibility | Current boundary |
|---|---|---|
| Customer dashboard (`/account`) | Entry point separating shipment drafts, confirmed independent shipments when supported, storefront orders and profile. | PR #100 adds a customer-owned latest-drafts summary with count, loading/empty/error/retry states and a link to the draft workspace. Storefront orders remain separate; this is not a shipment operations dashboard. |
| Shipment workspace (`/account/shipments`) | Draft preparation and, when supported, customer-entitled shipment listing. | Currently draft create/list/edit only; no confirmed independent-shipment listing or detail route. |
| Shipment detail (future) | Authoritative details, entitled history, available actions and exception/support information. | No route or record contract approved here. |
| Quote review (future) | Explain approved quote inputs, charges, total, currency and validity; capture explicit booking-party acceptance. | No quote until pricing gates are met. |
| Payment view (future) | Present amount due and authoritative payment/financial outcomes. | Do not infer settlement from redirects, client state or booking status. |
| Profile (`/account/profile`) | Maintain supported customer profile/contact information. | Profile does not grant authority over another party's shipment. |
| Support/dispute entry (future) | Authorized route to request assistance, dispute or review. | Do not promise unapproved outcomes or response periods. |

## 4. Party visibility and action principles

This is a product-level guide, not a technical permission matrix. Implement only through accepted BP-01–BP-22 and PM-01–PM-12.

| Party | Visibility principle | Action boundary |
|---|---|---|
| Booking party | Primary workspace for shipments they booked; see information/actions accepted for that authority. | Only permitted booking-party actions in the applicable state. |
| Sender | Sender-relevant information only where policy permits. | Being named sender does not grant booking-party authority. |
| Receiver / collection recipient | Information needed for an authorized receiving/collection role. | Collection remains subject to identity, authorization and location checks. |
| Payer | Payment-specific information and evidence appropriate to payer role. | Payment does not grant unrestricted shipment visibility or booking control. |
| Physical handover person | Distinguish the person presenting the parcel from the booking party. | Presentation does not confer booking authority or prove custody transfer. |
| Delegate / representative | Only authority actually granted and permitted by policy. | No assumed blanket or transferable authority; mechanics remain gated. |
| Support | Receive/record requests, perform permitted verification and route/escalate. | Does not silently acquire booking, operational, financial or custody authority. |
| Admin / Operations / Finance | Separate accepted responsibilities and assigned action/scope/location authority. | Admin access is not a substitute for granular permissions or separation of duties. |
| External operator / partner / driver | No direct platform login assumed at launch. | Do not create partner/driver portal or infer access from operational involvement. |

**Default:** one customer-facing shipper workspace for the authenticated booking party. Separate sender- or receiver-facing portals remain undecided and are not part of M1.2/M1.3 unless separately approved.

## 5. Customer-visible lifecycle truth

Show only authoritative facts supported by the viewer's entitlement. Preserve these distinctions:
- Draft preparation is not a confirmed booking.
- A quote is a proposal with defined validity, not a payment or booking.
- Explicit acceptance is required before booking confirmation.
- Booking confirmation is not payment settlement.
- Payment settlement is not physical parcel intake.
- Refusal before custody, physical receipt under hold and accepted intake are distinct.
- Assignment, dispatch, route movement, arrival or attempted handover does not by itself establish custody transfer.
- Custody changes only when actual physical handover occurred and the receiver took possession, with applicable evidence.
- Delivery and collection completion rely on approved authoritative evidence.
- Corrections/disputes must not erase original evidence or misrepresent last confirmed custody.

This document does not define persisted status names or approve state transitions.

## 6. Experience states

Implemented surfaces must handle relevant states truthfully: authentication check; unverified account; initial loading; empty drafts; empty confirmed shipments (distinct from no drafts or storefront orders); load failure with safe retry; validation failure; save in progress with duplicate-submit prevention; draft save/update success that never implies booking confirmation; unavailable action; pending authoritative outcome; disputed/held/restricted; and completed only on approved authoritative evidence. Do not present stale/fabricated facts as current. Retries must not duplicate consequential operations; idempotency and unknown-outcome recovery require their own approved contracts and tests.

## 7. Acceptance scenarios

These are product/test-design inputs. They do not replace A-01–A-20, ADM-R01–ADM-R54 or the 80 P0 evidence case IDs, and do not change priorities.

| ID | Scenario | Expected outcome |
|---|---|---|
| SHP-01 | Unauthenticated visitor opens protected shipper surface. | Redirect/deny; no protected data disclosed. |
| SHP-02 | Unverified customer attempts independent booking access. | Launch verification requirement enforced; no protected operation. |
| SHP-03 | Customer lists drafts. | Only authenticated customer's drafts returned. |
| SHP-04 | Customer changes an identifier to access another customer's draft. | Server-side ownership denial; no disclosure or mutation. |
| SHP-05 | Customer saves/edits then abandons a draft. | Only draft changes; no booking, quote, payment obligation, intake or custody event. |
| SHP-06 | Customer views storefront orders beside shipment workspace. | Storefront orders remain separate; not counted as independent shipments. |
| SHP-07 | Sender, receiver, payer or handover person is not booking party. | No booking-party authority inferred from relationship. |
| SHP-08 | Requested service is not eligible for journey/location/action. | Not offered as available; no quote/booking. |
| SHP-09 | Pricing or quote validity/handover prerequisites missing. | Quote and confirmation unavailable; no placeholder price/default. |
| SHP-10 | Booking party attempts confirmation without explicit acceptance of valid quote. | No booking confirmation. |
| SHP-11 | Customer returns from payment redirect before authoritative confirmation. | No payment-success claim based on redirect/client state. |
| SHP-12 | Booking confirmed while payment is pending, failed, late or under review. | Booking and payment remain distinct; show authoritative payment outcome. |
| SHP-13 | Dispatch/arrival/attempt occurs without receiver possession. | No completed custody transfer shown. |
| SHP-14 | Custody transfer occurs. | Customer event requires actual handover, receiver possession and applicable evidence. |
| SHP-15 | Receiver/collection recipient seeks collection information/action. | Only necessary approved information; identity/authorization/location checks apply. |
| SHP-16 | Payer requests full shipment access. | Payer role alone grants neither unrestricted visibility nor booking control. |
| SHP-17 | Customer requests change/cancellation/dispute outside authority or permitted state. | Deny or route through approved process; no silent mutation. |
| SHP-18 | Shipment/draft information fails to load. | Truthful error and safe retry; stale data not represented as current. |
| SHP-19 | Customer retries after unknown operation outcome. | No duplicate consequential operation once idempotency/recovery contract is implemented and tested. |
| SHP-20 | Support/staff user views or acts on shipment. | Distinct responsibility, permission, scope, location and approval rules enforced. |

## 8. M1.3 implementation boundary

M1.3 should deliver a coherent foundation, not a simulated end-to-end logistics product. Following fresh source review and a focused implementation plan, permitted direction is to improve the existing account dashboard to distinguish drafts, confirmed shipments (only when records exist), storefront orders and profile; improve the existing shipment workspace for the supported draft capability; explain unavailable stages without representing them as active; reuse existing auth and customer-owned data patterns; and add focused tests for implemented surfaces and ownership/visibility boundaries.

Do not implement without separate approval and dependencies: service catalogue, pricing engine, quote issuance/acceptance, confirmed shipment record/lifecycle, payment collection or financial-event model, intake/custody/route/dispatch/delivery/collection operations, proof-of-delivery, delegation, receiver/payer accounts, new staff permission assignments, or new schema/API/status enums merely to support a visual design.

## 9. Dependencies that remain gated

Keep explicit: approved service catalogue and location capabilities; pricing inputs/formula/units/conversions/charges/currency/rounding/rule version; quote validity and handover deadline; quote acceptance/booking confirmation contract; payment methods, provider capability, settlement evidence, partial/under/overpayment and reconciliation; shipment lifecycle and entitlement projection; intake/custody evidence, holds, handover exceptions, correction and disputes; collection identity/authorization and alternative collectors; delegation and party disclosure; amendment/cancellation eligibility and financial consequences; notification recipient/event/field/channel/retry/deduplication; support/operational resolution authority and response commitments; DEC-036 P0/Conditional P0 acceptance and release evidence. No unresolved item is silently resolved by this design.

## 10. Completion criteria and evidence boundary

M1.2 is complete as a documentation deliverable when the current foundation is accurately described; journey and gated stages are mapped; surface responsibilities reuse current architecture; party principles preserve BP-01–BP-22 and PM-01–PM-12; lifecycle facts remain distinct; experience states and acceptance scenarios are covered; M1.3 boundaries/dependencies are explicit; backlog, progress and source traceability point here; and the documentation-only PR is reviewed and merged.

**Evidence boundary:** Product/experience and test-design input only. This specification does not implement, test or verify application capabilities, approve technical contracts, or satisfy DEC-036 release requirements.


## 11. M1.3 dashboard implementation checkpoint — 1 November 2026

PR #100 implements the first bounded dashboard slice described by this specification. It is merged into `main` at `79f59726940ae5fbe56558c13976350e5f2d40f1` and changes only `app/account/page.tsx`.

The authenticated dashboard retrieves drafts through the existing customer-owned draft GET API, displays the latest three with origin, destination, parcel description and last-updated date, shows the bounded count without implying more than the API's 50-record limit, and provides loading, empty, error and retry states. Storefront orders remain separately presented. Drafts are explicitly labelled as unconfirmed; the interface does not claim booking or payment obligation.

The user reported local verification on 1 November 2026: 29/29 tests passed under the Firestore Emulator, `npx tsc --noEmit`, `npm run lint` and `npm run build` passed, and 34 static pages were generated. The test suite comprises 17 Firestore rules tests and 12 draft helper/validation/transaction-guard tests. Expected authorization-denial logs and a non-blocking Node module-type warning were observed. No HTTP route integration, browser acceptance, deployed API or production verification is claimed by these checks.

**M1.3 remains in progress.** The next activity is a read-only review of the existing shipment workspace and draft APIs against SHP-01–SHP-20 and accepted party/permission boundaries. The review should identify the smallest source-backed usability or test-coverage gap, if any, and return a proposal for approval before further application changes. No quote, booking, payment, intake, custody, route, delivery, collection, dispute or separate sender/receiver capability is authorized by this checkpoint.

## 12. M1.3 shipment workspace and draft API handler hardening — PR #102

PR #102 advances the existing draft-only workspace without changing the product boundary. The workspace now communicates the 50-record list cap, shows each draft's last-updated timestamp, provides character counts for all three bounded inputs, disables editing controls while a save is in progress, and ignores stale list responses after a newer request or unmount.

The existing GET/POST/PATCH request handling is extracted behind a dependency-injected handler factory. Next.js route adapters continue to apply verified-customer Firebase authentication and the existing draft validator. The Firestore store retains the same `users/{uid}/shipmentBookingDrafts` path, latest-50 query, existing fields and `draft` status; PATCH continues to use the existing transaction guard. Handler-level tests cover authentication, customer-scoped reads/writes, validation and non-editable/missing records using an in-memory persistence adapter.

**Verification status:** PR #102 is open and has not yet been locally verified. The handler tests are not Firebase Admin SDK emulator integration tests, deployed HTTP route tests, browser acceptance or production verification. Run the full emulator test command, TypeScript, lint and production build before merge and record actual results.

No service catalogue, pricing, quote, confirmed booking, payment, intake, custody, route, dispatch, delivery, collection, dispute, delegation, party entitlement or new schema capability is introduced. SHP-08–SHP-17 and SHP-19–SHP-20 remain gated by the dependencies in Section 9; DEC-036 release evidence and M0 residual checks remain separate.