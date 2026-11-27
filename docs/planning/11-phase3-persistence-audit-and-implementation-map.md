# Phase 3 — Persistence Audit and Implementation Map

**Status:** Step 1 audit deliverable; no database connection or writes authorised  
**Branch:** `feat/phase3-shipment-data-foundation`  
**Audited baseline:** `562f4c8f0eae103b13f51b4050f45c147f5cb99a`  
**Date:** 27 November 2026

## 1. Purpose and guardrails

This document reconciles the Phase 3 domain/repository implementation with the approved minimal VeriLyft data model and the Firestore-backed structures already present in the application. It is an implementation map, not permission to provision a database, deploy rules/indexes, change Storage, migrate records, or write production data.

Preserve the existing store and operational records. Do not copy legacy shipment drafts or quotes wholesale into the new authoritative shipment model. Do not create a separate *staging* Firestore database. The target database ID, location and runtime selection must be explicit before any adapter can connect to Firestore; a Git branch is not a database environment.

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
- Shipment documents and protected Storage metadata references.
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
| Customers | `customers/{customerId}` | Minimal shipment customer profile/reference. Link to Auth UID when registered. PUDO walk-in profile remains pending registration with no Auth UID. Reconcile with existing `users/{uid}`; do not duplicate full account data. |
| Admins | `admins/{adminId}` logical reference only if needed | `adminAccess/{uid}` remains the existing authority source. Do not create parallel permissions. A profile projection is optional and must not grant authority. |
| PUDO partners | Existing `pudoPartnerAccounts/{uid}` or a stable reference | Do not create a second partner account collection. Preserve separation from Admins and roster personnel. |
| PUDO locations | Existing `pudoLocations/{locationId}` plus approved evidence references | Keep verification, activation, capabilities, availability and capacity under their existing workflows/records. |
| Shipments | `shipments/{shipmentId}` | Sole authoritative shipment aggregate; one origin, one destination, sender/recipient snapshots, channel/actor attribution and current lifecycle summary. |
| Shipment quotes | `shipmentQuotes/{quoteId}` with `revisions/{revisionId}` | One immutable quote lineage per shipment. Because the legacy collection already exists in the current default database, use only after resolving database selection or an explicit namespace. |
| Payments | `payments/{paymentId}` | One immutable attempt identity per provider attempt; retries create new documents. Do not overwrite failed attempts. |
| Shipment events | `shipments/{shipmentId}/events/{eventId}` | Append-only timeline; corrections are new compensating events. Use collection-group queries only where global monitoring requires them. |
| Parcel intakes | `parcelIntakes/{intakeId}` | Separate physical intake record linked to shipment, parcel(s), PUDO, receiving actor/person and immutable photo/measurement evidence. |
| Shipment assignments | `shipments/{shipmentId}/assignments/{assignmentId}` | Responsibility/time window only; never proof of custody. |
| Shipment documents | `shipments/{shipmentId}/documents/{documentId}` | Firestore metadata and protected Storage object path/version/access class; binary remains in Storage. |
| Notifications | `notifications/{notificationId}` | Recipient-specific notification intent and minimum delivery/retry state. Do not build a messaging platform in this phase. |

Parcels remain under `shipments/{shipmentId}/parcels/{parcelId}`. This keeps shipment-owned repeating records together while allowing intake evidence to remain an independently attributable physical event.

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

1. **Database boundary:** Documents 02, 06 and 08 currently say the shipment model targets a separately named Firestore database, while the project operating instruction says no separate Stage database and dev/testing use the existing Firestore database. These statements do not yet identify the actual target database ID/location/runtime. Do not infer the answer. Before Step 2, explicitly settle whether the approved shipment target is the existing `(default)` database with a collision-safe namespace or a separately named non-staging database in the same Firebase project. No database has been created or changed by this audit.
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
