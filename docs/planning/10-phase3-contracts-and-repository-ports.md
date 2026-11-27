# Phase 3 — Canonical Shipment Contracts and Repository Ports

**Status:** Database-independent implementation baseline  
**Scope:** Phase 3B only. This document does not approve database provisioning, connection, deployment or production writes.

## 1. Canonical record contracts

The domain modules in `lib/shipment/` define normalised contracts for:
- **Shipment:** one authoritative record, one sender/recipient snapshot, one origin and destination, channel/actor attribution, and initial status `Submitted`.
- **Parcel:** declared weight, dimensions, quantity, declared value and a review lock. Physical intake measurements are separate observations and never overwrite declared values.
- **Quote revision:** immutable revision identity, pricing version, integer minor-unit line items/total, issuer and validity window. The total must reconcile to the line items.
- **Payment attempt:** one Paystack transaction reference per attempt, linked to a shipment and exact quote revision. Retries create new attempts; successful state must come from verified provider evidence in a later application service.
- **Shipment event:** actor, timestamp, audience visibility, evidence references and idempotency key. Events are append-only; corrections require a compensating event.
- **Intake measurement observation:** independently attributed physical measurements with photo evidence references.

Money is stored as integer minor units (for NGN, kobo). Display formatting belongs to presentation code. Timestamps are normalised to ISO strings.

## 2. Reference generation

`generateShipmentReference` creates a human-readable candidate in the form `VLY-YYYYMMDD-XXXXXX`. It is not a uniqueness guarantee. The persistence adapter must reserve the candidate under an atomic unique constraint; `reserveUniqueShipmentReference` retries collisions and fails closed after a bounded number of attempts. Clients must not choose authoritative references.

## 3. Repository ports

`assertRepositoryPorts` defines required injected ports for customers, shipments, parcels, quote lineages, payment attempts, events, idempotency records and unique references. A transaction runner is mandatory. The port definitions intentionally contain no Firebase imports and make no assumption about the selected database SDK.

## 4. Transaction and idempotency boundaries

A shipment submission command must atomically:
1. reserve the unique shipment reference;
2. create the shipment at `Submitted`;
3. create all parcel records;
4. append the initial shipment event;
5. persist the actor-scoped idempotency result.

Quote issuance/withdrawal, quote acceptance, payment-attempt creation and verified-payment confirmation each require their own transaction boundary. Payment webhook processing must deduplicate by provider event/reference and must not treat a browser redirect as payment proof. A retry after a failed payment creates a new payment attempt.

`runIdempotentCommand` scopes keys by actor type, actor ID and command. Its transaction adapter must provide atomic read-before-create semantics, and the handler must write the aggregate changes and idempotency result inside the same transaction. Adapters must enforce optimistic concurrency or serialisable transaction semantics and unique constraints; this helper is not a substitute for those guarantees.

## 5. Append-only evidence and access boundaries

- Shipment events and physical intake observations are immutable records. A correction is a new attributable event/observation, not an update.
- Declared parcel measurements may be edited only during the Admin review window; closing review locks them.
- Customer, Admin and PUDO partner attribution is explicit. A PUDO walk-in profile remains pending registration and has no Auth UID until the customer completes normal registration and identity verification.
- All authoritative writes are server-side. Client input is untrusted and must be revalidated at the application boundary.

## 6. Explicitly deferred

No Firestore SDK, Admin SDK, repository adapter, Firebase configuration, database ID/location, rules, indexes, Storage configuration, migration, backfill, or live shipment write is introduced by these contracts. Infrastructure requires separate explicit approval.

## 7. Submission command orchestration

`lib/shipment/commands.mjs` provides a database-independent `createShipmentCommands({ ports, idFactory, clock })` factory and a `submitShipment` command.

- The server must authenticate the request and construct the actor context from verified credentials. Client-supplied actor/channel values are not authoritative; the command derives the channel from the verified actor type.
- Customer submissions are bound to the authenticated customer's own ID, ignoring any client-supplied customer ID.
- Admin-assisted submissions require an existing customer profile.
- PUDO walk-in submissions require a verified partner-location context and must originate at that partner's own PUDO location using a PUDO-origin service. They create a minimal pending-registration customer profile in the same transaction, with `authUid: null`; sender name, phone and email are taken from that profile so the shipment identity is consistent.
- The command reserves a unique shipment reference, creates the shipment in `Submitted`, creates all parcel records, appends the initial event and records the actor-scoped idempotency result in one transaction.
- Every repository operation receives the same transaction handle. The reference repository must reserve candidates atomically in that transaction. The transaction adapter and idempotency repository must enforce atomic read-before-create and unique-key behavior.
- The customer repository port exposes `create(tx, customerId, profile)` and `getById(tx, customerId)`. The shipment port exposes `create(tx, shipmentId, shipment)`; parcels expose `createMany(tx, shipmentId, parcelRecords)`; events expose `append(tx, event)`. The reference port exposes `reserveUnique(tx, candidate)` and must enforce uniqueness inside the transaction. Other required method names are listed in `SHIPMENT_REPOSITORY_PORTS`.
- The command does not create Auth users, issue quotes, initialise payments, select a Firestore database, or write to any live database. It is not yet wired to HTTP routes or a persistence adapter.

The command tests use in-memory injected ports to verify channel derivation, ownership binding, walk-in profile behavior, transaction-handle propagation and idempotent replay. These are unit tests, not evidence of database transaction isolation; the eventual adapter must separately prove those guarantees.

## 8. Quote lifecycle command orchestration

`lib/shipment/quote-commands.mjs` adds database-independent Admin quote issuance and customer quote acceptance.

- Only a verified Admin actor may issue a quote. The command loads the shipment, validates its lifecycle state, creates a quote lineage when needed, appends an immutable revision, updates the shipment to `Quoted`, and appends an attributable event in one transaction.
- Revisions increase from the current revision number and retain the pricing version, integer minor-unit line items, reconciled total and validity window through the canonical quote contract.
- Only the owning customer may accept the current, unexpired revision. Acceptance records the exact revision and actor/time on the shipment, moves it to `Awaiting Payment`, and appends an event in one transaction.
- Both commands use actor/command-scoped idempotency. The repository adapter must implement `quotes.getCurrent(tx, quoteId)` as the current immutable revision and enforce transaction/concurrency guarantees.
- Acceptance does not initialise payment or confirm a booking. Payment initiation and verified provider confirmation remain separate commands.
- Focused unit tests cover issuance, role/ownership boundaries, stale revisions, expiry and lifecycle transitions. These tests use injected in-memory ports and do not prove database isolation.

## 9. Payment attempt and verified confirmation commands

`lib/shipment/payment-commands.mjs` adds database-independent payment attempt creation and verified-payment confirmation.

- Only the owning customer may create an attempt, and only after accepting the current quote while the shipment is in `Awaiting Payment`.
- Each attempt is tied to the exact accepted quote revision and copies its integer minor-unit amount and currency. A Paystack reference is generated server-side; retries are new attempts and are permitted only after the previous attempt is failed or abandoned.
- An active attempt blocks another attempt. The shipment points to the currently active attempt, and the payment attempt plus shipment update and event are written in one transaction.
- The command creates the payment attempt and returns the provider reference and amount for a later server-side Paystack initialization adapter. It does not call Paystack or create a checkout session.
- Booking confirmation requires an injected trusted server-side verifier to confirm the provider reference, successful status, amount and currency. A browser redirect or client-supplied success flag is not accepted as proof.
- After verification, only an `initialised` or `pending` attempt may be confirmed. The command transactionally marks the attempt successful, marks the shipment payment successful, moves the shipment to `Confirmed`, records the confirmation time and appends an event. Failed, abandoned, refunded or otherwise non-active attempts cannot confirm the shipment.
- The payment repository exposes `getById`, `getByProviderReference`, `createAttempt` and `updateAttempt`. Its adapter and the transaction runner must enforce atomicity and concurrency guarantees.
- Focused tests cover owner and lifecycle boundaries, retry behavior, amount/currency reconciliation, provider verification and confirmation. These in-memory tests do not prove Paystack integration or database isolation.

Paystack initialization, webhook signature verification, provider API credentials, HTTP routes and persistence adapters remain separate integration work. No live provider request or database write is performed by these commands.

## 10. Shipment lifecycle and measurement-review commands

`lib/shipment/lifecycle-commands.mjs` adds transaction-scoped commands for pre-confirmation cancellation, Admin rejection and declared-measurement review.

- Cancellation is limited by the domain rules to the owning customer or Admin and the approved pre-confirmation statuses. A mandatory reason is recorded, an existing quote is withdrawn, shipment status and attribution are updated, and an append-only event is added in the same transaction.
- If a linked payment attempt is still initialised or pending, cancellation marks that attempt abandoned locally. This prevents that attempt from confirming the cancelled shipment. A late provider success must be handled by a future payment-reconciliation/refund workflow; this command does not claim to cancel a transaction at Paystack.
- Rejection is Admin-only, requires a reason and an existing quote, withdraws the quote and records the rejection. An active payment attempt blocks rejection.
- New shipments explicitly start with an open declared-measurement review, set by the server rather than accepted from client input. Declared measurement amendments are Admin-only and allowed only while the parcel review is explicitly open; missing review state fails closed. Values are revalidated through the canonical parcel contract; physical intake observations remain separate and are not modified.
- Closing measurement review locks every parcel's declared measurements and records the reviewer/time on the shipment and an immutable event. Inconsistent or already-closed parcel reviews fail closed.
- The parcel repository port now includes `update(tx, parcelId, patch)`. Its adapter must preserve immutable intake observations and enforce transaction semantics.
- Focused tests cover ownership, roles, quote withdrawal, active-payment restrictions, measurement edits and review locking. They use in-memory ports and do not prove persistence isolation.

The complete command layer still requires a final cross-command review and adapter-level concurrency tests before it can be connected to a database.


## 11. Remaining foundational records — completed code baseline

`lib/shipment/records.mjs` defines the remaining canonical records:

- **Parcel intake:** shipment and parcel links, intake type, receiving location, authenticated actor, optional named PUDO roster person, physical condition, separate measured observations, discrepancies, timestamps and mandatory photo evidence references. Only a completed intake record is persisted; a correction is a new record linked to the original.
- **Shipment assignment:** shipment link, activity, assignee type/ID, assigning actor, bounded responsibility period and lifecycle status. Assignment status cannot represent custody.
- **Shipment document:** immutable metadata, document type/version, protected Storage path, content type, byte size, checksum, generator and explicit access classification. Firestore does not store binary contents or public download URLs.
- **Notification intent:** shipment and recipient-specific target, channel, template, deduplication key, payload and minimal delivery state.
- **Notification attempt:** immutable attempt identity/time, delivered/failed result and provider/error metadata.

The adapter exposes `intakes`, `assignments`, `documents` and `notifications` repositories. Intake/document records and notification attempts are create-only. Assignment updates are limited to status. Notification intent is protected by a deterministic deduplication index; only delivery-state fields can be updated. The record commands require injected trusted Storage verifiers to confirm intake photos and generated document objects before entering retryable Firestore transactions; absent a verifier, they fail closed.

## 12. Existing identity and operational authorities

The adapter exposes read-only `authorities` lookups for the existing `users`, `adminAccess`, `pudoPartnerAccounts` and `pudoLocations` collections. These records are not copied into duplicate shipment-owned identity authorities. The existing PUDO verification, activation, capability and operations evidence remain separate authoritative workflows and are referenced by location ID/evidence references where required.

All authority reads and shipment writes participating in one Firestore transaction must use the same Firestore database instance. Firestore transactions cannot span database instances. Each environment therefore needs its own project-local identity authorities and shipment namespace in the same selected database. The adapter rejects a separately injected identity database rather than implying cross-database atomicity.

## 13. Complete repository-port verification

`assertCompleteShipmentRepositoryPorts` extends the existing command-port check with the complete Phase 3 repository surface: existing identity authorities, intakes, assignments, documents and notifications. The original narrower `assertRepositoryPorts` remains available to domain command factories that only need their aggregate dependencies; complete persistence verification must use the complete assertion.

## 14. Remaining infrastructure and live-verification gate

The complete adapter remains dependency-injected and is not invoked by application routes. Unit tests use a fake Firestore implementation. They verify path boundaries, create-only evidence records, deduplication, protected field updates, read-before-write ordering and repository relationships, but do not prove production Firestore isolation or contention behavior. Live verification requires the separately provisioned staging Firebase project and its project-local identity records, approved database ID/location and credentials. No Storage bucket configuration, Firestore rules/index deployment, migration, production data change or PR merge is included.
