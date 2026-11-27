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

`assertRepositoryPorts` defines required injected ports for shipments, parcels, quote lineages, payment attempts, events, idempotency records and unique references. A transaction runner is mandatory. The port definitions intentionally contain no Firebase imports and make no assumption about the selected database SDK.

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
