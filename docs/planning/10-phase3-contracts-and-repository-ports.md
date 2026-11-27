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
