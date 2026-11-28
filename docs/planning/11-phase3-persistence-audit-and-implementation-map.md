# Phase 3 — Persistence Audit and Implementation Map

**Status:** Phase 3 implementation and staging integration in progress; staging read-only connectivity verified  
**Branch:** `feat/phase3-shipment-data-foundation`  
**Audited baseline:** `562f4c8f0eae103b13f51b4050f45c147f5cb99a`  
**Date:** 27 November 2026

## 1. Purpose and guardrails

This document reconciles the Phase 3 domain/repository implementation with the approved minimal VeriLyft data model and the Firestore-backed structures already present in the application. It is an implementation map, not permission to provision a database, deploy rules/indexes, change Storage, migrate records, or write production data.

Preserve the existing store and operational records. Do not copy legacy shipment drafts or quotes wholesale into the new authoritative shipment model. Staging and production use separate Firebase projects (approved 27 November 2026); the target project, Firestore database ID, location and runtime selection must be explicit before any adapter can connect to Firestore. A Git branch is not a database environment.

## 2. Existing implementation audit

### 2.1 Phase 3 domain layer

The current Phase 3 branch contains:

- Canonical shipment, parcel, quote revision, payment attempt, shipment event and intake-measurement-observation contracts.
- Submission, quotation, payment-confirmation, cancellation, rejection and declared-measurement review commands.
- Repository ports for customers, shipments, parcels, quotes, payments, events, idempotency and unique shipment references.
- A mandatory transaction runner and actor/command-scoped idempotency helper.

The ports are deliberately database-independent. They do not yet implement Firestore persistence.

### 2.2 Important repository-port gaps

The approved 12-record model is not yet fully represented by repository ports or domain contracts.

Missing explicit ports/contracts include:

- Full parcel-intake record and intake evidence lifecycle (the current contract covers a measurement observation, not the complete intake record).
- Shipment assignments.
- Shipment documents and protected Cloudinary asset metadata references.
- Notifications and delivery attempts.
- Explicit customer/Admin/PUDO identity-reference resolution at the persistence boundary.

These are real Phase 3 completion gaps; they should be added without expanding into full user interfaces, Paystack provider integration, email delivery infrastructure or workforce scheduling.

### 2.3 Existing Firestore-backed structures found in the repository

| Existing structure | Current role | Phase 3 treatment |
|---|---|---|
| `users/{uid}` | Existing customer profile used by customer account APIs | Preserve as the existing customer identity/profile source unless the approved database boundary requires a minimal shipment-side projection. Do not copy all user data. |
| `adminAccess/{uid}` | Active Admin access check used by server authorization | Preserve as the current Admin authorization source. Do not create a competing Admin authority or treat staff records as Admin profiles. |
| `pudoPartnerAccounts/{uid}` | Authenticated PUDO partner profile/account | Reuse as the partner identity source through an explicit adapter/reference. Do not create a second partner login/profile authority. |
| `pudoLocations/{locationId}` | Existing PUDO location identity and current location record | Reuse location IDs and approved location state through a read boundary. |
| `pudoLocationVerifications`, `pudoLocationActivations`, `pudoLocationCapabilities` | Verification, activation and capability evidence/state | Preserve their existing authority and approval workflow. Shipment records reference the location; they do not duplicate or override approval evidence. |
| PUDO operations/network evidence collections | Availability, capacity, network and operational evidence | Read through the existing approved services where needed. Do not flatten evidence into shipment records or treat it as shipment authority. |
| `users/{uid}/shipmentBookingDrafts` | Legacy/M4 customer preparation drafts | Keep separate from the authoritative Phase 3 shipment. A saved draft is not a submitted shipment. |
| `shipmentQuotes` and its `versions` / `events` subcollections | Existing quote-store implementation | This is a collection-name collision with the proposed Phase 3 `shipmentQuotes` lineage. It must not be silently reused or overwritten. Resolve through the selected database boundary or an approved non-colliding namespace. |
| Existing storefront collections (products, categories, orders and related payment records) | Storefront/order system | Leave untouched. Store orders are not shipment bookings. |

The current `lib/firebase-admin.ts` exports the default Admin Firestore instance via `getFirestore(adminApp)`. Existing shipment draft and quote stores import that default instance. A new shipment adapter must not inherit this connection implicitly: database selection must be explicit and centrally configured, with a fail-closed check for the approved database ID.

The code review is a repository-level cross-check, not a live Firestore inventory. It does not assert that every collection currently exists or report live document counts.

## 3. Recommended logical persistence map

Use the following as the working target mapping, subject to the database-boundary decision and final review. A logical record does not require a separate top-level collection.

| Approved data structure | Recommended logical path | Ownership and persistence notes |
|---|---|---|
| Customers | Existing `users/{uid}`; namespaced `walkInCustomers/{customerId}` for PUDO walk-ins | Registered customer identity remains in `users`; only minimal pending-registration walk-in profiles are stored in the shipment namespace. |
| Admins | `admins/{adminId}` logical reference only if needed | `adminAccess/{uid}` remains the existing authority source. Do not create parallel permissions. A profile projection is optional and must not grant authority. |
| PUDO partners | Existing `pudoPartnerAccounts/{uid}` or a stable reference | Do not create a second partner account collection. Preserve separation from Admins and roster personnel. |
| PUDO locations | Existing `pudoLocations/{locationId}` plus approved evidence references | Keep verification, activation, capabilities, availability and capacity under their existing workflows/records. |
| Shipments | `shipments/{shipmentId}` | Sole authoritative shipment aggregate; one origin, one destination, sender/recipient snapshots, channel/actor attribution and current lifecycle summary. |
| Shipment quotes | Namespaced `quoteLineages/{quoteId}/revisions/{revisionId}` | One immutable quote lineage per shipment. Do not reuse or reinterpret the legacy `shipmentQuotes` collection. |
| Payments | `payments/{paymentId}` | One immutable attempt identity per provider attempt; retries create new documents. Do not overwrite failed attempts. |
| Shipment events | `shipments/{shipmentId}/events/{eventId}` | Append-only timeline; corrections are new compensating events. Use collection-group queries only where global monitoring requires them. |
| Parcel intakes | `parcelIntakes/{intakeId}` | Separate physical intake record linked to shipment, parcel(s), PUDO, receiving actor/person and immutable photo/measurement evidence. |
| Shipment assignments | `shipments/{shipmentId}/assignments/{assignmentId}` | Responsibility/time window only; never proof of custody. |
| Shipment documents | `shipments/{shipmentId}/documents/{documentId}` | Firestore metadata and protected Storage object path/version/access class; binary remains in Storage. |
| Notifications | `notifications/{notificationId}` | Recipient-specific notification intent and minimum delivery/retry state. Do not build a messaging platform in this phase. |

Parcels are stored in a namespaced root `parcels/{parcelId}` collection with a required `shipmentId` field. This preserves the current repository-port contract, which reads and updates parcels by globally unique parcel ID without requiring the parent shipment ID. Shipment-scoped listing queries filter by `shipmentId`. Intake evidence remains an independently attributable physical event.

### 3.1 Why this layout

- The shipment is the parent authority; parcels, timeline, assignments and documents are naturally shipment-owned.
- Quotes and payment attempts need their own stable identities and lifecycle records.
- Physical intake is independently auditable and can exist more than once for transfers or repeated physical receipt.
- Notifications are recipient-specific delivery records and should not be embedded in the shipment aggregate.
- Customer, Admin, partner and PUDO location identities should be referenced from their existing authoritative identity/workflow systems rather than recreated.

This is a recommended logical path layout, not a claim that these collections/subcollections already exist.

## 4. Transaction boundaries required by the current commands

The Firestore adapter must keep all reads and writes for each command inside one Firestore transaction and pass the same transaction handle to every repository operation.

| Command | Atomic writes/reads required |
|---|---|
| Submit shipment | Read/validate actor-owned customer or partner/location; reserve unique shipment reference; create walk-in customer when applicable; create shipment; create all parcels; append initial event; create idempotency result. |
| Issue quote | Read shipment/current quote lineage; create or update lineage current pointer; append immutable revision; update shipment status/reference; append event; record idempotency result. |
| Accept quote | Read customer ownership, shipment and current revision; verify not expired/stale; record accepted immutable revision; update shipment; append event; record idempotency result. |
| Create payment attempt | Read shipment, accepted quote and prior active attempts; enforce one active attempt; create new payment attempt; update shipment payment summary; append event; record idempotency result. |
| Confirm verified payment | Read payment by provider reference and shipment; require trusted verified result and matching amount/currency; transition only an active attempt; update shipment confirmation; append event; deduplicate provider event/reference. |
| Cancel/reject shipment | Read shipment, quote and payment state; validate actor and permitted transition; withdraw quote/abandon eligible active attempt as specified; update shipment; append reasoned event; record idempotency result. |
| Close measurement review | Read shipment and all affected parcels; validate Admin authority and open review; lock declared measurements and record reviewer/time atomically. |
| Complete parcel intake | Validate shipment/service/location/capability and receiving actor; verify required photo objects are uploaded and referenced; create immutable intake and measurement observations; append custody/lifecycle event only for actual physical receipt; update shipment status only where the service-specific evidence gate is satisfied. |
| Create/change assignment | Validate shipment and assignee scope; create assignment history and update current-assignment summary atomically. Assignment must not create custody. |
| Create document metadata | Verify shipment ownership/authority and Storage object metadata; create versioned shipment document record. Storage upload itself is not a Firestore transaction and needs a staged/finalized workflow. |
| Create notification | Create recipient-specific notification intent with a stable deduplication key. Delivery occurs outside the Firestore transaction; record attempt/result separately and idempotently. |

Firestore transactions require all reads before writes. Adapter methods must be designed around that constraint, enforce transaction-scoped uniqueness through deterministic reservation documents, and avoid external network calls inside retryable transaction callbacks.

## 5. Uniqueness, idempotency and immutability

### Uniqueness
- Shipment reference: deterministic reservation document keyed by a normalised reference; reservation and shipment creation occur in the same transaction.
- Payment provider reference: unique reservation keyed by provider plus reference; duplicate provider references cannot bind to another shipment.
- One quote lineage per shipment: deterministic shipment-to-quote mapping or a unique lineage key.
- Idempotency: deterministic key derived from actor type, actor ID, command and client idempotency key; create in the same transaction as the command result.
- Notification deduplication: stable key for recipient + shipment + notification type + milestone/version.
- Assignment/intake/document IDs: generated server-side; no client-selected authoritative IDs.

### Immutable records
- Shipment events: create-only. Corrections are new events referencing the corrected event.
- Quote revisions: create-only; current pointer on the lineage may advance.
- Payment attempts and provider verification evidence: preserve attempt identity and append/retain verification outcomes; do not replace failed attempts.
- Parcel intake and photo evidence: immutable after completion; corrections are addenda linked to the original.
- Assignment history: close/expire an assignment and create a replacement; retain prior attribution.
- Shipment document versions: create new versions rather than replacing the referenced binary/metadata in place.
- Notifications: preserve delivery attempts and outcomes; do not erase failures.

### Concurrency
- Use transaction reads of aggregate/version fields and compare expected version/current pointers before writes.
- Do not implement a read-then-write uniqueness check outside a transaction.
- Never call Paystack, email providers or Storage APIs from a Firestore transaction callback.

## 6. Data and access boundaries

- Customer ownership comes from verified Auth UID and the authoritative customer profile mapping, never a client-supplied customer ID.
- Admin authority remains server-verified through the existing Admin authorization path and active access record; no client-controlled role field.
- PUDO partner identity is the authenticated partner account. Each location operation must revalidate partner ownership.
- Named PUDO personnel remain roster records, not Auth users. Record the authenticated partner as system actor and the named person as the physical/operational person where relevant.
- Recipient access must be independently verified against the shipment recipient snapshot before revealing shipment information.
- All authoritative shipment writes are server-side. Direct client writes to shipments, quotes, payments, events, intakes, assignments, documents and notification state are not allowed.
- Existing PUDO verification/activation/capability/availability/capacity evidence remains authoritative in its current records. Shipment references are not approvals.

## 7. Known inconsistencies and decisions to resolve

1. **Database boundary — resolved:** The 27 November 2026 decision selects separate Firebase projects for staging and production. Staging has a dedicated project; production remains `verilyft-4e691`. Exact staging project ID, project ownership/billing, database ID/location and runtime credentials remain infrastructure prerequisites for live connection.
2. **Existing quote collection collision:** The current default database code already persists legacy quote lineages in `shipmentQuotes`. Reusing that collection for the new quote contract would mix two different shipment authorities. A separate database or an approved namespace is required; never dual-write or silently repurpose the legacy collection.
3. **Record nesting:** Document 02 shows events, assignments and documents as shipment subcollections; document 08 lists their logical collection names at the top level. This map recommends shipment subcollections for these shipment-owned records, with collection-group queries only for demonstrated cross-shipment needs.
4. **Identity naming:** The logical schema says `pudoPartners`, but the current partner identity collection is `pudoPartnerAccounts`. Keep the existing account as the identity authority unless a reviewed database boundary requires a reference/projection. Likewise, existing customer and Admin authority records are `users` and `adminAccess`, not the logical names in the schema table.
5. **Stale open-decision list:** Schema document 08 still labels walk-in provisioning, pre-confirmation cancellation, post-quote rejection, measurement-review closure and service-specific handover semantics as unresolved. The current Phase 3 commands implement decisions for these areas. Step 2 must update the decision record to reflect the implemented contract and retain only decisions that are genuinely unresolved; do not reopen approved behaviour by accident.
6. **Storage and intake completion:** The domain currently validates photo evidence references on an intake measurement observation, but does not yet define the complete persisted intake/document Storage workflow. This is a missing foundational contract, not permission to deploy Storage changes.

## 8. Phase 3 persistence completion checklist

- [ ] Explicit database ID/location/runtime configuration approved.
- [ ] Collision-safe collection namespace and legacy read-through boundaries confirmed.
- [ ] Repository ports expanded for intake, assignment, document metadata and notification records.
- [ ] Firestore adapter implements every required port and a transaction runner.
- [ ] Shipment/reference/quote/payment uniqueness and idempotency enforced transactionally.
- [ ] Shipment submission, quote, payment-confirmation and lifecycle command transaction tests added.
- [ ] Immutable event, quote revision, intake, assignment and document version semantics enforced.
- [ ] Customer, Admin, PUDO partner, personnel and recipient references verified against existing authorities.
- [ ] All 12 approved logical data structures mapped and exercised.
- [ ] Existing storefront and legacy shipment data remain untouched.
- [ ] Build and regression tests pass; live database changes remain separately approved.

## 9. Explicit non-goals for this step

This audit does not implement a Firestore adapter, API routes, Paystack calls/webhooks, email delivery, tracking UI, document PDF generation, Storage rules, Firestore rules/indexes, database provisioning, migration, backfill or live data writes. Those must not be smuggled into the persistence audit.


## 10. Approved environment boundary — 27 November 2026

**Decision: Option A approved — separate Firebase projects for staging and main/production.** This section supersedes the unresolved database-boundary alternatives in sections 1, 7.1 and 8.

| Environment | Firebase project | Firestore target |
|---|---|---|
| Staging | A dedicated staging Firebase project to be provisioned/configured separately | Its own Firestore database (normally the project's `(default)` database unless a later reviewed requirement says otherwise) |
| Main/production | Existing `verilyft-4e691` project | Preserve and use its existing Firestore database |

The same shipment domain, contracts, repository ports and adapter design must be usable in both environments. Firebase project selection, credentials and runtime configuration must be environment-specific and explicit; no shipment adapter may silently inherit the default Admin SDK instance or fall back to another project/database.

### Environment isolation requirements

- Staging and production have separate Firebase project IDs, service credentials, Authentication users/providers, Firestore data, Storage buckets and project-scoped services/configuration.
- Staging test data is not copied into production by default. Any later migration or promotion of data requires a separately reviewed and explicitly approved procedure.
- Existing production records in `verilyft-4e691` remain untouched by staging implementation and testing.
- Production application work will be completed independently after the staging system is completed; code changes are not automatically a production deployment.
- Keep secrets out of source control. Runtime configuration must validate the expected Firebase project ID and database ID and fail closed on mismatch.
- Do not create or modify Firebase projects, databases, Authentication settings, Storage, Firestore rules/indexes, credentials or production data as part of this architecture decision alone.

### Remaining infrastructure details

The architecture decision is settled, but resource-specific configuration is not yet provisioned or approved: staging Firebase project ID, project ownership/billing, Firestore location/database ID, Authentication providers, Storage requirements, service-account/runtime credentials and deployment bindings must be reviewed before resource creation or connection. The existing production project/database ID and location should be inspected from authoritative project configuration rather than guessed.

The legacy `shipmentQuotes` collision is isolated by the separate Firebase project boundary between staging and production. Within each environment, the new shipment quote model must still have a clearly owned collection/path and must not overwrite or reinterpret any legacy quote records that exist in that environment. Prefer a collision-safe shipment namespace where needed until the legacy store's status is confirmed.

### Updated Step 1 exit criteria

- [x] Environment boundary selected: separate Firebase projects for staging and production.
- [x] Existing `verilyft-4e691` reserved for main/production.
- [x] Staging must use a dedicated Firebase project; no separate staging database inside the production project is planned.
- [ ] Staging project ID, ownership/billing and resource configuration reviewed before provisioning.
- [ ] Exact Firestore database ID/location and runtime binding confirmed for each environment before adapter connection.
- [ ] Collection/path ownership checked against legacy records within the staging project before writes.


## 11. Step 2 implementation baseline — Firestore adapter (code only)

The Firestore persistence implementation is on the Phase 3 feature branch. The explicit staging runtime has been initialized and a read-only Firestore connection to `verilyft-minimal` `(default)` has been verified. No shipment records have been written during that connection check.

### Explicit namespace

The adapter uses the versioned namespace `verilyftShipmentData/v1` to isolate the new authoritative shipment model from legacy records. The namespace is shared by the same application architecture in each Firebase project; the project itself provides the environment boundary.

- Shipments: `verilyftShipmentData/v1/shipments/{shipmentId}`
- Parcels: `verilyftShipmentData/v1/parcels/{parcelId}`, with `shipmentId` for shipment-scoped queries. This root parcel collection preserves the current repository-port signature, which updates a parcel by globally unique parcel ID without requiring the parent shipment ID.
- Shipment events: `verilyftShipmentData/v1/shipments/{shipmentId}/events/{eventId}`
- Quote lineages/revisions: `verilyftShipmentData/v1/quoteLineages/{quoteId}/revisions/{revisionId}`
- Payments: `verilyftShipmentData/v1/payments/{paymentId}`
- Walk-in customer profiles: `verilyftShipmentData/v1/walkInCustomers/{customerId}`
- Idempotency records: `verilyftShipmentData/v1/idempotency/{sha256Key}`
- Shipment reference reservations: `verilyftShipmentData/v1/shipmentReferenceReservations/{sha256Reference}`
- Payment provider-reference index: `verilyftShipmentData/v1/paymentProviderReferences/{sha256ProviderReference}`

Registered customer profiles continue to be read from the environment-local `users/{uid}` authority. The adapter does not create a second registered-customer identity system. Admin access, PUDO partner accounts and PUDO locations are environment-local authorities exposed through read-only lookups. For the new shipment operating model, city serviceability is derived from having at least one registered PUDO in that city; each registered PUDO receives default operational capabilities automatically. Individual location operating availability and capacity are separate operational facts. The shipment quotation model must not require legacy capability approvals or individual route-evidence approvals. Existing production workflows and records are not migrated or modified by this Phase 3 work.

### Implemented repository adapters

- Transaction runner using the explicitly injected Firestore instance.
- Customer lookup against existing registered profiles and namespaced PUDO walk-in profiles; create-only walk-in profile writes.
- Shipment create/read/reference lookup/update.
- Parcel create/list/read/update.
- Quote lineage creation, immutable revision append, current revision lookup and lineage withdrawal.
- Payment attempt creation, provider-reference uniqueness index, lookup and restricted mutable status/verification fields.
- Append-only shipment event create/list.
- Actor-scoped idempotency storage using deterministic SHA-256 document IDs.
- Unique shipment-reference reservation using transaction reads and create-only reservation documents.

### Transaction ordering

Firestore requires transaction reads to occur before writes. Shipment submission was adjusted so registered-customer lookup and unique-reference reservation happen before the first write. Subsequent aggregate writes and the idempotency result use the same transaction. Other current commands were reviewed for read-before-write ordering; adapter-level transaction tests guard this contract.

### Environment runtime guard

`lib/shipment/firestore-runtime.mjs` is separate from the application's existing `lib/firebase-admin.ts`. It requires:

- `SHIPMENT_ENVIRONMENT` (`staging` or `production`)
- `STAGING_FIREBASE_PROJECT_ID`
- `PRODUCTION_FIREBASE_PROJECT_ID` (must remain `verilyft-4e691`)
- `SHIPMENT_FIREBASE_PROJECT_ID` (must match the selected environment)
- `SHIPMENT_FIRESTORE_DATABASE_ID` (explicit, including when using `(default)`)
- `SHIPMENT_FIREBASE_CLIENT_EMAIL`
- `SHIPMENT_FIREBASE_PRIVATE_KEY`

It uses a separately named Firebase Admin app per environment and refuses a project mismatch. The runtime has been invoked successfully for staging read-only connectivity. Credentials remain in local/deployment environment configuration and are not committed to source control.

### Current limitations

- Full intake, assignment, shipment-document and notification contracts, repositories and transaction-scoped commands are implemented. Quote revisions also preserve the distance in kilometres and configurable pricing inputs used for each immutable quote.
- Adapter and command coverage uses a fake Firestore transaction harness. It is not evidence of live Firestore transaction isolation or concurrency under contention.
- The staging Firebase project `verilyft-minimal` is provisioned and its `(default)` Firestore database is reachable through the explicit shipment runtime. The initial connection check found no top-level collections and performed no writes.
- Staging Firestore rules were deployed to `verilyft-minimal` only after explicit approval; production rules were not changed.
- No shipment persistence commands have yet been exercised against live staging Firestore. The adapter is not yet wired into customer, Admin or PUDO application routes; that workflow integration belongs to Phases 4–6. A disposable staging persistence verification script is included for Phase 3.
- Cloudinary is the binary asset provider. Firestore stores protected Cloudinary asset metadata/references only; Firebase Storage is not part of the shipment asset architecture.


## 12. Completion implementation update — 27 November 2026

The initial persistence gap list has now been addressed at the code-contract/repository layer:

| Foundational area | Implementation |
|---|---|
| Existing customer/Admin/PUDO partner/PUDO location authorities | Read-only `authorities` repository; preserves the existing `users`, `adminAccess`, `pudoPartnerAccounts` and `pudoLocations` authorities |
| Parcel intake | Canonical completed intake contract; mandatory photo references; immutable root intake records; corrections append a linked new record |
| Shipment assignment | Canonical responsibility-period contract; shipment subcollection; retained history; status-only updates |
| Shipment documents | Canonical versioned metadata; immutable shipment subcollection records; Cloudinary asset identifier and integrity metadata; binary data excluded |
| Notifications | Recipient-specific intent; deterministic deduplication index; bounded status updates; append-only delivery attempts |
| Command orchestration | Transaction-scoped commands for intake, assignment, document metadata, notification intent and delivery attempts |
| Verification | Complete repository-port assertion and fake-Firestore tests for relationships, immutable records, deduplication and command orchestration |

PUDO partner location authorisation and Cloudinary asset verification are injected and evaluated before entering retryable Firestore transaction callbacks; no external resolver/network work is run from inside a transaction callback. Intake photos and document assets must be verified by a trusted Cloudinary adapter; absent those verifiers, commands fail closed. Physical intake timestamps and generated record IDs are server-derived. PUDO-origin station drop-off updates the shipment to `Received at PUDO` only after a completed photo-evidenced intake and matching origin PUDO. Assignment remains separate from custody.

## 13. Data model relationship and authority checks

The canonical shipment remains the aggregate root. Parcels, quotes, payments and events retain explicit shipment links; intakes link a shipment and one or more of its parcel IDs; assignments and documents are nested under their shipment; notifications link both shipment and a recipient identity. Notification attempts are nested under their notification. Existing identity and PUDO location records remain external authorities referenced by IDs, not copied into shipment records.

The Firestore adapter uses the `verilyftShipmentData/v1` namespace. The identity authority collections must exist in the same environment-specific Firestore database as the shipment namespace because Firestore transactions cannot span database instances. The adapter rejects a separately injected identity database to prevent false assumptions about cross-database atomicity.

## 14. Remaining verification and deployment boundary

Code-level implementation does not complete live staging verification. The fake Firestore harness cannot prove actual Firestore transaction contention, retries, create preconditions, composite-index behavior, Storage object existence, Storage access controls or production security rules. Remaining verification requires exercising the adapter against staging Firestore using disposable staging-only test records, including create preconditions, transaction retries, idempotency and relationship integrity. Cloudinary object verification must be supplied before intake-photo/document commands can complete. No production data, rules, indexes, resources, migrations or backfills have been changed. The PR remains draft until lint, tests, build and staging persistence verification are complete.
