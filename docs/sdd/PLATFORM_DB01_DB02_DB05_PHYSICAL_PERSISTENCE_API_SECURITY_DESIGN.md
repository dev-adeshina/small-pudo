# DB-01 / DB-02 / DB-05 — Physical Persistence, API and Security Design

**Status:** Owner-approved physical persistence/API/security contract for the bounded quote-lineage and immutable-version foundation. Approved by PR #117. This approval does not enable quote issuance, quote acceptance, booking creation, parcel intake, or any other gated capability.  
**Prepared:** 2 November 2026.  
**Approval baseline:** PR #117 merged; the user's synchronized local `main` reports `feb8019`.  
**Source inspection baseline:** The same commit, with the bounded source paths listed in Section 2 re-fetched read-only. This is not a full-repository semantic audit, runtime verification, deployed-rules review or production inspection.  
**Policy authority:** DEC-038, DEC-043, DEC-044, DEC-045, DEC-047, DEC-048, DEC-049; BP-01–BP-22; PM-01–PM-12; the lifecycle, authorization and acceptance contracts.  
**Logical contract:** `PLATFORM_DB01_DB12_TECHNICAL_CONTRACT_AND_ACCEPTANCE_SPECIFICATION.md`.  
**Execution pointer:** `PLATFORM_CONSOLIDATED_IMPLEMENTATION_BACKLOG.md`.

---

## 1. Purpose and decision boundary

This document translates the accepted logical rules for DB-01 (quote acceptance and booking confirmation), DB-02 (booking-to-parcel relationship), and DB-05 (quote lineage and immutable versions) into a minimum Firestore persistence and server-operation proposal aligned with the existing application.

It is a **technical proposal**, not a new business-policy decision. The proposed collection and field names below are candidates for owner approval. They are not already approved by DEC-049 or Review 5.

This design does not approve or enable:

- quote calculation or issuance;
- customer quote acceptance or confirmed-booking API/UI;
- parcel creation, physical intake or custody-transfer operations;
- any of the twelve DEC-047 service/endpoint combinations;
- pricing models, rates, inputs, fees, currency, arithmetic or rounding;
- quote-validity or physical-handover durations and outcomes;
- staff permission IDs, location capability configuration or staff authentication;
- physical evidence methods, retention, legal hold, correction or disclosure rules;
- routing, movement, delivery, payment or financial reconciliation;
- production deployment or launch readiness.

The immediate design scope is to settle the smallest persistence representation and its future transaction/security boundaries. The first implementation slice remains the quote-lineage and immutable-version technical foundation, after owner approval of this contract. That foundation must not expose quote issuance or acceptance while their independent prerequisites remain blocked.

## 2. Source inspection and verified repository facts

The following paths were re-fetched at `0ca77ea2cff30d38ea10e279810f4e0cae65cd90`:

- `firebase.json`, `firestore.rules`, `lib/firebase-admin.ts`;
- `lib/server/customer-auth.ts`, `lib/server/admin-authorization.ts`;
- `lib/server/shipment-booking-draft-api.ts`, `lib/server/shipment-booking-draft-store-core.ts`, `lib/server/shipment-booking-draft-store.ts`, `lib/server/shipment-booking-drafts.ts`;
- `lib/validations/shipment-booking-draft.ts`;
- `app/api/account/shipment-booking-drafts/route.ts`, `app/api/account/shipment-booking-drafts/[draftId]/route.ts`;
- `tests/shipment-booking-draft-api.test.mjs`, `tests/shipment-booking-draft-store.test.mjs`, `tests/firestore.rules.test.mjs`, and `package.json`.

### 2.1 Existing patterns worth reusing

- Firebase Admin is initialized centrally in `lib/firebase-admin.ts`; server-side Firestore and Auth access are already available.
- Draft handlers derive the customer UID from a verified bearer token rather than accepting a caller-supplied owner UID.
- Draft persistence is dependency-injected through `createShipmentBookingDraftStore`; production and Emulator tests share the same store logic.
- Draft updates use a Firestore transaction to read the current record and enforce an editable-state guard before writing.
- Server timestamps are used for persisted creation/update times.
- Node's built-in test runner is used. Firestore Admin-store tests run against the Firestore Emulator when `FIRESTORE_EMULATOR_HOST` is configured; the existing store suite otherwise skips.
- Rules tests use `@firebase/rules-unit-testing` and load the repository's actual `firestore.rules`.

### 2.2 Boundaries and gaps found

- The existing draft path is `users/{uid}/shipmentBookingDrafts/{draftId}`. It is preparation-only. Do not place confirmed bookings, quote lineages, parcels or custody records beneath that path or treat its shape/status as a template.
- `firestore.rules` denies direct client access to `orders` and shipment drafts. There are no shipment quote, booking or parcel matches today; the current ruleset has no broad client-allow rule for these paths, so unmatched paths are denied by default.
- `firebase.json` declares `firestore.rules` but does not declare an index configuration. No committed `firestore.indexes.json` was found.
- Customer authentication currently verifies the ID token and email verification, but calls `verifyIdToken(token)` without the revocation-check argument. The admin authorization helper calls `verifyIdToken(token, true)`, then checks the allowlist, admin claim and active `adminAccess/{uid}` marker.
- There is no established staff authorization/capability service in the inspected paths. An administrator claim or the generic admin authorization helper cannot stand in for a specific intake permission plus location/service/action capability.
- Firebase Admin SDK operations bypass Firestore Security Rules. Any future shipment API using Admin SDK must enforce identity, ownership, action permission, location/service/action capability, lifecycle guard and data integrity in the server operation itself.
- Storefront `orders` and Paystack paths are commerce-specific. They must not become the persistence model for independent shipment bookings, quotes or parcels.
- No quote, independent confirmed-booking, parcel, intake or custody persistence/API implementation was found in the inspected paths.

### 2.3 Evidence limitation

This was a bounded re-fetch of the relevant current source paths, not a full-repository audit. No tests, build, lint, Emulator run, deployed Firestore Rules check, production query or production-data inspection was performed for this design.

## 3. Recommended physical representation

### 3.1 Recommendation: centrally queryable root records, with quote versions nested under their lineage

Use three separate top-level record families:

| Logical record | Proposed Firestore path | Purpose |
|---|---|---|
| Quote lineage | `shipmentQuotes/{quoteId}` | One logical offer lineage, its current-version pointer, and its one-time accepted-version/booking links. |
| Immutable quote version | `shipmentQuotes/{quoteId}/versions/{versionId}` | One immutable issued offer snapshot. A revision creates a new child document; it never edits an issued version. |
| Confirmed booking | `shipmentBookings/{bookingId}` | One confirmed commercial booking created only by acceptance of the exact current valid quote version by its authorized booking party. |
| Parcel | `shipmentParcels/{parcelId}` | One physical parcel created only after authorized staff accept actual physical possession. |

These root collection names and paths are approved for the physical foundation. Their approval does not authorize implementation of the separately gated booking, parcel, intake or custody capabilities.

**Why root-level quote, booking and parcel records:** staff and operational services will need to locate records across customers. Root-level records avoid making staff operations depend on enumerating user subcollections or using a collection-group query over customer-owned paths. Customer ownership remains an explicit server-checked property of each customer-owned quote and booking. Root-level placement does not grant client access.

**Why versions are a subcollection:** versions belong to one quote lineage, can be retrieved by their known parent and ID, and remain independently immutable. Keeping them separate avoids repeatedly rewriting a growing array on the mutable quote root, reduces the chance of accidental historical edits, and avoids making a single quote document the container for all historical commercial snapshots.

### 3.2 Alternatives considered

| Alternative | Assessment |
|---|---|
| Put confirmed bookings under `users/{uid}` | Rejected as the primary operational representation. It makes cross-customer staff work depend on collection-group queries and user-path traversal. It may remain appropriate for private customer projections, but no projection is required for this minimum design. |
| Put booking and parcel records under the quote document | Rejected. Quote lineage, confirmed commercial booking and physical parcel are distinct authoritative facts with different creation times, access needs and lifecycles. |
| Store all quote versions in an array on one quote document | Rejected. It requires rewriting a mutable parent for every version, makes immutability harder to enforce and is less suitable for version history growth. |
| Reuse `users/{uid}/shipmentBookingDrafts` | Rejected. Drafts are editable preparation records, not issued offers, confirmed bookings or physical parcels. |
| Reuse storefront `orders` | Rejected. Storefront purchase, payment and stock reservation are separate from independent shipment booking and custody. |

### 3.3 Minimum relationship and field candidates

The following is the smallest proposed relationship set. Field names are design candidates; the quote snapshot's internal pricing/service fields are deliberately not specified here.

| Record | Proposed minimum data | Mutability rule |
|---|---|---|
| Quote lineage | Server-generated document ID; `bookingPartyUid`; `currentVersionId`; optional `acceptedVersionId`; optional `bookingId`; server `createdAt` / `updatedAt`. | Owner and creation identity immutable. Current-version pointer may advance only through a revision transaction before acceptance. Accepted-version and booking links are set once and never replaced. |
| Quote version | Server-generated version document ID; immutable sequence within the lineage; immutable quote snapshot payload; server issue/creation timestamp; approved validity timestamp when quote issuance is enabled. | Create-only after issue. No update or delete operation for an issued version. The exact snapshot structure and validity inputs belong to the approved pricing/quote contract, not this document. |
| Confirmed booking | Server-generated document ID; `bookingPartyUid`; `quoteId`; `acceptedQuoteVersionId`; server `acceptedAt`; `acceptedByUid`; optional `parcelId` absent until authorized intake accepts possession. | Accepted commercial terms, party and quote references immutable. The parcel link may be added once by the authorized intake transaction; it cannot be replaced or cleared by ordinary update. |
| Parcel | Server-generated document ID; `originatingBookingId`; reference to the approved initial custody fact; server creation time; operation identity needed to make an intake retry safe. | Originating booking immutable. A parcel is never created at quote issuance or booking acceptance. No second parcel, split, merge or ordinary reassignment is supported. |

**Snapshot rule:** the immutable quote-version document is the canonical accepted commercial snapshot. The booking stores the exact `quoteId` and `acceptedQuoteVersionId` pair; it does not duplicate a second independently mutable copy of the price/terms payload. The version must remain retained and reconstructable for the life of the booking and any longer approved retention period. If a later audit/retention contract requires a self-contained booking snapshot, that is a separate explicit design decision; do not duplicate data pre-emptively.

**No speculative status enum:** the relationship can be represented by the existence of the current-version pointer, accepted-version pointer, booking link and parcel link. This proposal does not introduce a booking/quote status vocabulary. Any required lifecycle status enum needs its own approved lifecycle contract and must not become a second source of truth for these relationships.

**One-to-one enforcement:** Firestore does not provide a relational unique constraint across arbitrary documents. Enforce the accepted one-to-one relationships through a single transaction that reads and updates the authoritative quote or booking parent. Do not rely on client-side checks or a query-before-write.

## 4. Transaction and replay contracts

All reads required for a Firestore transaction must occur before its writes. Transaction callbacks must be safe to retry. Generate candidate document references outside the callback, but determine the authoritative result from the records read inside the transaction.

### 4.1 Create a quote lineage and its first version

When quote issuance is eventually enabled by the approved pricing and eligibility prerequisites:

1. The server derives the booking-party UID from the verified customer identity and resolves the relevant draft/request context from server-owned data.
2. The server validates that the selected service/endpoint combination is currently eligible and available. DEC-047 requires this check to fail closed and be repeated at the consequential submission.
3. The server computes the complete quote using the approved pricing authority. No client-supplied total or charge is trusted.
4. In one transaction, create the quote-lineage document and its first immutable version, then set the lineage's current-version pointer.
5. If the transaction fails, neither the lineage nor its first version is treated as issued. If the outcome is unknown, the server must resolve the write by its stable operation identity before creating another lineage.

Quote issuance is currently blocked. This section defines the future atomic persistence boundary only; it does not approve pricing inputs, operation identity format or an issuance endpoint.

### 4.2 Revise an unaccepted quote

1. Read the quote lineage and current version.
2. Reject revision if the lineage already has an accepted version/booking link.
3. Compute and validate the new offer using the then-approved pricing and eligibility sources.
4. In one transaction, create a new immutable version and advance the lineage's current-version pointer.
5. Never update or delete the superseded version.

A concurrent revision and acceptance must serialize through the quote-lineage document. If revision commits first, acceptance of the now-superseded version fails. If acceptance commits first, revision fails because the lineage is already accepted. The old version remains reconstructable in either outcome.

### 4.3 Accept the exact quote version and confirm one booking

When all quote, pricing, eligibility and authorization prerequisites are approved:

1. Verify the customer's identity and derive the UID server-side. Confirm the UID is the booking party for this quote. Do not infer authority from sender, receiver, payer, handover person or possession of a quote reference.
2. Read the quote lineage and the exact version named by the request. Check ownership, that the requested version is the current version, that it is valid under the approved quote terms, and that all service/endpoint eligibility is still valid.
3. If the lineage is already accepted for this same version, resolve the existing booking through the stored booking link and return the original outcome only after validating that the linked booking exists and matches the lineage/version/booking party. This is the replay path.
4. If it is already accepted for another version, or the requested version is stale, superseded or expired, reject without mutation.
5. Otherwise, in the same transaction, create exactly one confirmed booking bound to the exact immutable quote version and set the quote lineage's accepted-version and booking links.
6. Do not create a parcel, payment, payment instruction, intake, custody, route or dispatch record in this transaction.

The quote lineage is the serialization point. Concurrent acceptance attempts of the same version cannot create two bookings: one transaction commits; a competing transaction retries and resolves to that committed booking. A failed/unknown client response must be recovered by reading the lineage and its booking link, not by creating another booking.

**Acceptance is still disabled.** Quote validity, service eligibility, pricing and the customer consequential-mutation token-revocation policy are not fully resolved. In particular, `authenticateVerifiedCustomer` currently verifies a token without checking revocation. The owner must explicitly decide whether quote acceptance and other consequential customer mutations require `verifyIdToken(token, true)` before this command can be enabled. Do not silently inherit the weaker draft-read policy or change the shared helper globally without reviewing its other callers.

### 4.4 Create the parcel only at accepted physical possession

This is a later, separately gated operation. It is included here only to settle the DB-02 relationship and the required transaction boundary.

1. Verify the staff identity and specific intake action permission. Independently verify that the receiving location is active and supports the exact service/action. A generic administrator claim is not sufficient.
2. Verify the confirmed booking and that it has no parcel link. Verify the actual physical receipt and all mandatory evidence under the approved intake/custody contract.
3. If staff refuse before taking possession, record only the separately approved refusal/attempt fact; create no parcel and no custody event.
4. If staff physically receive the item, including receipt retained under an authorized hold, create the parcel and its initial custody fact in one Firestore transaction, and add the one-time parcel link to the booking.
5. The transaction must serialize on the booking document. Concurrent intake attempts cannot attach two parcels to one booking. A different new intake attempt after a parcel is already linked must not be silently treated as a successful replay.
6. A retry after an unknown result must use the same operation identity and resolve to the already-created parcel/initial custody result. A new operation identity must conflict rather than create a second parcel.

**Idempotency design candidate:** persist a server-validated intake operation identity with the one-time booking-to-parcel link and the parcel/initial-custody result. The same operation identity may resolve an uncertain retry to the original result; a different operation identity cannot create a second parcel. The exact identity scope, actor binding and evidence payload must be finalized with the staff authorization and DB-10 evidence contracts. Do not accept a caller-supplied identity as proof of authority.

**Physical side-effect limitation:** Firestore cannot make the real-world handover or an external evidence upload atomic with its transaction. If possession has occurred but the persistence result is unknown or fails, preserve the real-world occurrence and route it through the approved reconciliation/investigation process. Never record a transfer that did not occur, and never infer that physical possession did not occur merely because a network request timed out. The detailed recovery authority and evidence procedure remain gated by DEC-044/DB-10.

**This operation is not ready to implement.** Staff authentication/permissions, location/service/action capabilities, proof of possession, evidence and correction/investigation authority remain unresolved. Walk-in intake is a separate path and is not designed here.

## 5. API and authorization boundaries

This section specifies server responsibilities, not route names, HTTP methods or request/response payloads. No API path is approved.

### 5.1 Customer operations

- Derive customer UID only from a verified Firebase ID token.
- Require verified customer email and exact booking-party ownership for quote access and acceptance.
- Read quote lineage and version from trusted persistence; do not accept caller-supplied owner UID, quote total, currency, fee breakdown, issue/expiry timestamps, accepted state, booking ID or parcel ID.
- Accept only an exact quote-version identifier. The server independently resolves the current version and checks validity and eligibility at mutation time.
- A payer, sender, receiver, delegate or holder of a quote reference does not inherit booking-party acceptance authority unless a separately accepted BP rule explicitly grants that operation.
- Customer reads should use server-controlled, ownership-filtered projections. Direct client Firestore access is not proposed for this first design.

### 5.2 Staff operations

- No staff intake operation is authorized by this document.
- A future intake command must authenticate the staff actor and independently check the specific action permission, staff scope and active location/service/action capability at mutation time.
- A global admin claim, email allowlist or access to the Admin Portal does not confer intake, custody, evidence or location authority.
- The current inspected source does not establish a staff authorization service suitable for this operation. Do not invent one as part of the quote foundation.

### 5.3 Admin SDK and Firestore Rules

- Keep quote, booking, parcel and custody writes server-controlled.
- The current ruleset denies unmatched paths by default. Preserve that default-deny boundary for the proposed records.
- Add explicit rules tests for direct client read/write denial on quote roots, quote versions, bookings and parcels for unauthenticated visitors, ordinary customers and administrator-claim clients.
- Admin SDK server writes bypass Rules. The server command must independently enforce the full authorization and lifecycle contract.
- Do not grant direct client read access merely because a record belongs to the customer. Any later direct-read projection requires a separate field-level disclosure and entitlement design.

### 5.4 Authentication revocation decision

The current customer helper does not check token revocation; the current administrator helper does. The design recommends a revocation check for consequential customer mutations such as exact-version quote acceptance, but this is an explicit owner decision still required before that command is enabled. Keep the shared draft authentication behaviour unchanged until its callers and desired policy are reviewed.

## 6. Queries and indexes

### 6.1 Initial query requirements

The minimum foundation needs only:

- direct quote-lineage lookup by quote ID;
- direct immutable-version lookup by quote ID and version ID;
- direct booking lookup by booking ID;
- direct parcel lookup by parcel ID;
- parent/child version retrieval within a known quote lineage;
- server-side relationship validation through the known IDs stored on the linked records.

These document lookups do not require a composite index.

### 6.2 Queries deliberately not assumed

Do not add indexes for speculative staff queues, status dashboards, location intake lists, route dispatch, service availability, parcel search, customer history sorting or reporting. Their filters, ordering, authorization and pagination are not yet approved.

If a later accepted UI/API requires customer quote or booking history, specify its exact filters, sort order and pagination first, then add the generated/verified composite index to a version-controlled `firestore.indexes.json` and declare it in `firebase.json`. The repository currently has neither a committed index file nor a Firebase index configuration. Deploy required indexes before code that depends on them.

Do not use a broad unbounded collection read as a substitute for a defined query.

## 7. Additive migration and compatibility

- This design is additive. It does not rename, move, backfill or reinterpret existing records.
- Leave `users/{uid}/shipmentBookingDrafts` unchanged and draft-only.
- Leave storefront `orders`, stock reservation/cancellation and Paystack records unchanged.
- Do not convert historical orders, drafts, tracking records or payment records into independent bookings or parcels.
- No migration or backfill is required for the initial empty shipment record families.
- Deploy rules and any approved indexes before application code that depends on them.
- Validate with synthetic Firestore Emulator fixtures only. Do not use production customer, order, payment or parcel data for these tests.

## 8. Executable acceptance and evidence plan

The following are required future tests. They are specifications, not a claim that tests have been written or run.

| ID | Fixture / action | Expected result | Readiness |
|---|---|---|---|
| PHY-QUOTE-01 | Create a lineage and its first version in one transaction; inject a failure before commit. | Both records exist together or neither exists. | Ready to implement in the technical foundation after this contract is approved; no real quote issuance. |
| PHY-QUOTE-02 | Create a later version for an unaccepted lineage. | New immutable version is created and current pointer advances; old version bytes remain unchanged. | Foundation test. |
| PHY-QUOTE-03 | Attempt to update/delete an issued version through supported repository operations. | No supported operation mutates or deletes an issued version. | Foundation test; server/Admin SDK access remains a privileged boundary. |
| PHY-QUOTE-04 | Concurrent version revisions against the same current lineage. | Transactions serialize; no duplicate sequence/current pointer ambiguity; no historical version is overwritten. | Foundation test. |
| PHY-BOOK-01 | Accept exact current valid version using synthetic approved fixtures. | One booking and exact quote/version links commit atomically; no parcel/payment/custody side effect. | Blocked until pricing, DEC-047, validity, authorization and acceptance prerequisites are approved. |
| PHY-BOOK-02 | Replay same accepted version after an unknown response. | Original booking is resolved; no second booking is created. | Blocked with booking acceptance. |
| PHY-BOOK-03 | Concurrently accept the same version; separately accept a superseded version. | At most one booking; stale/superseded version rejected without mutation. | Blocked with booking acceptance. |
| PHY-PARCEL-01 | Inspect a confirmed booking before authorized physical intake. | No parcel link or parcel record exists. | Blocked with intake implementation. |
| PHY-PARCEL-02 | Authorized physical receipt including hold; refusal before possession. | Receipt creates exactly one parcel plus initial custody fact; refusal creates neither. | Blocked by staff/location/evidence contracts. |
| PHY-PARCEL-03 | Concurrent different intake attempts for one booking. | At most one parcel; a distinct second attempt conflicts. | Blocked by staff/location/evidence contracts. |
| PHY-PARCEL-04 | Replay the same intake operation after unknown result. | Original parcel and initial custody outcome are resolved; no duplicate is created. | Blocked by staff/location/evidence contracts. |
| PHY-AUTH-01 | Unauthenticated, unverified, wrong-customer and non-booking-party requests. | Denied; no protected data leak or mutation. | Foundation can add Rules-denial tests; API tests follow each approved command. |
| PHY-AUTH-02 | Customer, administrator-claim and unauthenticated clients directly read/write each proposed collection path. | All direct client access is denied. | Ready for Rules test addition. |
| PHY-AUTH-03 | Staff without specific intake permission, or with wrong/inactive location capability. | Denied at mutation time; no parcel/custody mutation. | Blocked until staff/location authority is approved and implemented. |
| PHY-RECOVERY-01 | Firestore commit succeeds but the client/server response is lost. | Retry resolves the original operation using its stable identity; no duplicate authoritative fact. | Exercise in each future transactional slice. |

### 8.1 Test implementation approach

- Reuse the existing dependency-injected Admin Firestore store pattern for the quote foundation.
- Use Node's existing `node --test` runner and Firestore Emulator integration, with isolated synthetic IDs and deterministic cleanup.
- Extend `tests/firestore.rules.test.mjs` using `@firebase/rules-unit-testing` to assert direct access denial for each proposed path.
- Include concurrent transaction tests and before/after record assertions. A skipped Emulator suite is not evidence that the integration tests passed.
- Keep tests for blocked acceptance and intake behaviours as specifications until their prerequisite policies are approved; do not create production endpoints solely to make blocked cases pass.

## 9. Readiness and implementation sequence

| Slice | Readiness | Required action |
|---|---|---|
| Quote lineage and immutable-version persistence foundation | **Approved for the bounded foundation by PR #117.** | Implement only the repository/types/validation/transaction primitives and Emulator tests needed to create and revise synthetic lineage/version records. No customer route, UI, pricing calculation, issued quote or acceptance command. |
| Quote issuance | **Blocked.** | Requires approved pricing configuration, authoritative inputs, quote validity, DEC-047 eligibility and executable operational evidence. |
| Quote acceptance and booking creation | **Blocked.** | Requires all quote prerequisites plus explicit customer revocation policy, booking-party authorization, API contract and executable acceptance evidence. |
| Parcel/intake and initial custody | **Blocked.** | Requires staff authentication/action permissions, location/service/action capability, physical-possession proof, DB-10 evidence, correction/investigation and recovery authority. |
| Staff queues, customer history indexes, routing and reporting | **Not specified here.** | Define exact query and entitlement contracts before adding indexes or projections. |

**Approved implementation direction:** PR #117 authorizes a focused technical foundation that adds the quote-lineage/version persistence core and synthetic Emulator tests, plus direct-client Firestore Rules denial tests. It must not add public routes or expose the records to customers. The existing draft workspace, storefront and Paystack paths must remain unchanged.

## 10. Open decisions that remain explicit

1. **Resolved by PR #117:** owner approval of the root collection paths, candidate fields and immutable-version representation for the bounded persistence foundation.
2. Exact quote snapshot structure, pricing input/value provenance, service terms, validity and handover deadline representation.
3. Customer token-revocation check for consequential mutation.
4. Stable operation identity for quote creation/revision and exact booking acceptance replay.
5. Exact staff identity, action permission, location/service/action capability and scope model.
6. Initial custody event representation, physical proof, evidence source/integrity, correction, reviewer, investigation, retention and legal-hold authority.
7. Customer-facing read projection and any history-list query/index requirements.
8. All DB-03, DB-04 and DB-06–DB-12 relationships and operational contracts.
9. DEC-047 eligibility evidence for each of the twelve service/endpoint combinations.
10. DEC-036 P0/Conditional P0 and production release evidence.

A missing or stale prerequisite keeps the affected capability unavailable. No recommendation in this document should be interpreted as acceptance of a business-policy value or operational authority.

## 11. Approval record

The owner reviewed and merged PR #117 on 2 November 2026. That merge approves the physical representation and its stated boundaries for the specified technical foundation:

- root-level quote, booking and parcel records, with immutable quote versions nested under the quote lineage;
- the one-time quote-to-booking and booking-to-parcel links to be enforced through their separately gated transactions;
- the immutable quote-version document as the canonical accepted snapshot;
- server-only access, default-deny Firestore Rules and no speculative indexes;
- the narrow first implementation slice: persistence foundation and synthetic tests only, with no quote issuance, booking acceptance endpoint or parcel/intake capability.

This approval does not approve the unresolved commercial, authorization, evidence, operational or release gates listed above.
