# Existing Data Adaptation and Replacement Matrix

**VeriLyft Minimal | Planning decision | 27 November 2026**

## 1. Governing principle

> **Build the simplest data structure that fully supports the approved VeriLyft workflows. Do not carry forward complexity simply because it already exists.**

The existing Firestore inventory is a description of the legacy database, not a target schema and not a requirement to reuse its collections. The PRD, approved business workflows and finalised Data Architecture govern the new implementation.

Preserving historical information and reusing its current schema are separate decisions. Historical records may remain safely in the source database while the new application uses a smaller, clearer model.

## 2. Scope and safety boundary

- This matrix is a design and assessment decision only. It does not authorise data deletion, rewriting, migration, copying, database creation, rules deployment or index deployment.
- The inventory supplied for this assessment describes the existing `verilyft-4e691/(default)` database. It is a point-in-time structural inventory, not a complete proof of current application use.
- The planning baseline specifies a separate Firestore database for the new implementation. Its ID, location, rules and environment strategy remain subject to approval.
- Existing store data must be preserved. The new application must not silently take ownership of, rewrite or dual-write legacy store records.
- A collection marked **replace** means replace its role in the new application with the approved minimal model. It does not mean delete the legacy collection.
- A collection marked **leave untouched** remains in the source database and is not made a dependency of the new workflows unless a later explicit integration decision requires it.

## 3. Classification vocabulary

| Decision | Meaning for VeriLyft Minimal |
| --- | --- |
| **Keep** | The existing concept and a simple form of its structure fit the target architecture. Reuse only after ownership and access are confirmed. |
| **Adapt** | Keep the useful business concept, but redesign its fields and lifecycle to fit the approved model. |
| **Consolidate** | Merge overlapping legacy concepts into one simpler target record or event stream. |
| **Replace** | Do not carry the legacy structure into the new application; use the target model instead. Legacy records remain preserved in the source. |
| **Leave untouched** | Preserve in the source system and exclude from the new application's operational data model for now. |

## 4. Target model direction

The new implementation should centre on a small number of authoritative business records:

1. **Customer and access profiles** — customer, staff and PUDO identities remain logically distinct; authentication identity is not duplicated across business records.
2. **PUDO locations** — one location record holds its current registration, approval/activation state, standard capability set and current operating state. Approval and operational changes retain attributable event/evidence history.
3. **Shipments** — one authoritative shipment record for customer requests, PUDO walk-ins and door-pickup requests. Draft, submitted, quoted, accepted, booked and operational states are lifecycle states, not separate shipment copies.
4. **Shipment events** — one append-only timeline for material shipment events, with actor, time, event type and evidence references.
5. **Quotes** — a quote and its revisions retain the amount, inputs, applicable pricing version, validity and acceptance decision. Do not create a separate business object for every intermediate calculation unless a workflow requires it.
6. **Payments** — one payment record per provider transaction/business payment, linked to its shipment booking or store-order subject. Provider callbacks/webhook evidence must be idempotently associated with that payment.
7. **Parcel intake and photo evidence** — one intake record per physical intake; photos are stored in Firebase Storage and represented by protected metadata/storage references. Intake cannot be completed without required photo evidence.
8. **Assignments and transfers** — keep only the operational assignment/transfer records needed for pickup, station handling and delivery. An assignment is not proof of custody or completion.
9. **Communication and documents** — retain the minimum shipment-linked chat, notification, document and delivery records required by the PRD. Avoid duplicating the same shipment or recipient facts in separate portal-specific records.
10. **Store boundary** — existing store products, categories, customers, orders and payment history remain a separate business domain. Store orders are not shipment bookings.

The target model is intentionally expressed as business records, not a mandate to create every named collection as a top-level collection. Subcollections or embedded current-state fields may be used where they simplify ownership and queries without weakening evidence, access control or auditability.

## 5. Existing collection adaptation matrix

The classifications below are the proposed treatment for the new application. They are not instructions to mutate the source database.

| Existing collection | Inventory | Decision | Target treatment / rationale |
| --- | ---: | --- | --- |
| `users` | 6 | **Adapt** | Map authenticated customer identity to the minimal customer profile. Do not make the legacy user document the shipment aggregate. Keep staff and PUDO identity separate. |
| `users/*/shipmentBookingDrafts` | 9 nested | **Replace** | Drafts become the draft state of the authoritative `shipments` record. Avoid a second shipment lifecycle hidden under each user. Preserve old drafts in the source. |
| `shipmentQuotes` | Not observed in inventory; present in application code | **Adapt** | Keep one quote lineage with the current quote state and only the necessary revision history. Preserve quote snapshot, pricing inputs/version, validity, issuer and customer decision. Avoid the legacy nested evidence/event complexity where a compact quote event history is sufficient. |
| `shipmentBookings` | Not observed in inventory; referenced by quote application code | **Replace** | Booking confirmation becomes the booking state/reference on the authoritative `shipments` record. Do not create a second top-level shipment/booking record for the same consignment unless a later confirmed workflow demonstrates a distinct aggregate is necessary. |
| `pudoLocations` | 7 | **Adapt** | Keep as the location concept, but simplify the target location document around identity, address/coordinates and current lifecycle/operating summary. |
| `pudoPartnerAccounts` | 3 | **Adapt** | Represent partner identity/profile separately from the station record. Avoid duplicate business/contact fields across account and location unless a distinct ownership relationship requires them. |
| `pudoPartnerApplications` | 3 | **Consolidate** | Fold application/registration state into the PUDO location onboarding lifecycle where possible; retain partner identity separately. Do not keep parallel application and location state machines without a clear need. |
| `pudoLocationVerifications` | 5 | **Consolidate** | Current verification decision belongs in the PUDO location state; attributable inspections/reviews become PUDO evidence events/records. Preserve reviewer independence and validity requirements. |
| `pudoLocationActivations` | 4 | **Consolidate** | Activation becomes part of the PUDO location lifecycle/current state, with the actor, time and reason retained in its event history. |
| `pudoLocationCapabilities` | 2 | **Consolidate** | Use the common default capability set for all locations in the initial release. Do not maintain per-location capability versioning unless an approved later requirement needs it. |
| `pudoLocationServiceCapabilities` | 4 | **Consolidate** | Remove the parallel service-capability layer from the minimal initial model unless a specific approved workflow requires a distinct service-level decision. |
| `pudoLocationOperations` | 2 | **Adapt** | Keep only current availability/schedule and capacity information needed to determine operational fit. Avoid a complex version tree for routine updates; retain material approval/change evidence. |
| `pudoNetworkConnections` | 1 | **Adapt** | Keep the PUDO-to-PUDO relationship concept needed for network routing, but simplify to one connection record with status and required operational references. |
| `commercialPricingDefinitions` | 3 | **Adapt** | Use the minimal approved rate/pricing configuration and retain the applicable pricing version on each quote. Avoid carrying forward unnecessary nested publication/version/approval machinery. |
| `commercialRouteDistanceEvidence` | 2 | **Adapt** | Retain road-route evidence as a required pricing input where applicable. Store source, distance, measurement time and validity/reference in a simple evidence record. Straight-line distance must not become operational road-route evidence. |
| `commercialRouteDistanceReviews` | 2 | **Consolidate** | Keep reviewer, decision, time and reason with the route evidence or its review event. Preserve independent review; avoid a separate parallel review aggregate if it adds no required workflow. |
| `commercialServiceCommercialApprovals` | 1 | **Consolidate** | Fold the current approved commercial terms into the minimal pricing/service configuration with attributable approval metadata. |
| `commercialServiceEndpointEligibility` | 1 | **Replace** | Derive endpoint eligibility from the minimum required location, service, availability, capacity and route facts. Do not preserve a large independently maintained eligibility document if it duplicates those facts. |
| `operationalCostDefinitions` | 6 | **Leave untouched** | Keep legacy operational-cost records in the source. Advanced cost governance is not required to create the initial customer shipment/quote/booking workflow; revisit only if an approved MVP workflow depends on it. |
| `staffDirectory` | 3 | **Adapt** | Keep one minimal staff profile per internal staff identity, with active status and necessary display/contact details. |
| `adminAccess` | 2 | **Keep / simplify** | Preserve the restricted administrator access boundary. Do not turn this into a second general staff directory or broad role system. |
| `staffActionPermissionGrants` | 58 | **Adapt** | Replace the legacy delegation/grant complexity with the smallest approved permission assignment model. Retain only permissions required by the initial staff workflows and server-side enforcement. |
| `staffActionPermissions` | 0 | **Leave untouched** | Empty in the inventory. Do not build the new permission model around an empty legacy registry without code/business justification. |
| `staffInvitations` | 3 | **Adapt** | Keep a simple invitation and activation flow for staff onboarding; omit unnecessary legacy metadata and delegation behaviour. |
| `staffPermissionAdministrators` | 2 | **Adapt** | Retain only the minimum authority needed to administer staff access. Avoid a separate elaborate administrator hierarchy unless explicitly required. |
| `staffManagementAudit` | 70 | **Consolidate** | Use a single minimal staff/security audit event stream for material permission and administration actions. Do not duplicate the same action in several audit collections. |
| `orders` | 57 | **Leave untouched** | Existing store orders remain store transactions, not shipments. Preserve all historical records and fields in the source store. |
| `products` | 2 | **Leave untouched** | Preserve the existing storefront product catalogue and its current ownership. |
| `categories` | 4 | **Leave untouched** | Preserve the existing storefront categories and relationships. |
| `paymentWebhookEvents` | 24 | **Leave untouched / reference if needed** | Preserve historical webhook evidence. New payment processing should use the minimal payment record and idempotent provider-event handling; do not copy all legacy webhook records by default. |

## 6. Nested structures to simplify

The following legacy nested structures should not automatically be reproduced in the new database:

- Pricing definition publication/version/approval trees.
- Operational cost definition version/approval/event trees.
- PUDO capability version trees.
- PUDO location verification audit and inspection subcollections.
- PUDO network connection version/event trees.
- Quote-like or booking draft subcollections nested under user identity.

Use a single relevant event/evidence history where the business requires traceability. Keep immutable or independently reviewed evidence where required by the business rules; simplification must not remove who recorded, who reviewed, when a decision was made, its reason or its validity.

## 7. Application-code cross-check

The first code cross-check confirms that the current application has direct dependencies on legacy structures, including:

- Storefront product and order access through `products` and `orders`.
- Shipment drafts stored under `users/{uid}/shipmentBookingDrafts`, with active PUDO checks against `pudoLocations` and `pudoLocationActivations`.
- Quote lineage in `shipmentQuotes` with nested versions, events and internal evidence.
- PUDO location, verification, activation, capability, operations, partner and network stores.
- Staff directory, invitation, permission grant and staff audit records.

The code-only references to `shipmentQuotes` and `shipmentBookings` were not present as collections in the point-in-time inventory; they are therefore treated as application dependencies, not as verified populated legacy collections. This confirms why schema inventory alone cannot determine migration or replacement. The new implementation must be decoupled from these legacy stores deliberately. The code cross-check is a first-pass review of the current repository, not a claim that every read/write path, scheduled process, Storage object or security rule has been exhaustively traced.

## 8. Non-negotiable simplification safeguards

Simplification must not weaken these approved rules:

- One authoritative shipment record across customer, PUDO and Admin channels.
- Customer ownership remains distinct from the actor entering a walk-in request.
- Booking, assignment, dispatch, attempted collection and physical custody remain distinct.
- Every physical parcel intake requires a photograph; photos live in Firebase Storage with protected Firestore metadata/references.
- Quote acceptance, payment confirmation and booking confirmation remain distinct facts.
- Payment success is server-verified and provider events are idempotent.
- Road-route evidence is not replaced by straight-line distance.
- PUDO verification/approval decisions retain attributable independent review where required.
- Customer, staff and PUDO access remain logically distinct and enforced server-side.
- Store orders remain separate from independent shipment bookings.
- Sender and recipient receive only their authorised shipment information and documents.

## 9. Decisions still required before implementation

1. Confirm the new Firestore database ID, location, environment configuration and deployment boundary.
2. Confirm the exact minimal target fields for customer, staff, PUDO location, shipment, quote, payment, intake, assignment and event records.
3. Confirm which legacy store data the new application may read and through what trusted boundary. No default assumption of copying or dual-writing.
4. Confirm whether historical customer accounts are mapped by shared Firebase Auth UID, a controlled profile reference, or another approved method.
5. Confirm the minimum staff permission list and which actions require elevated approval.
6. Confirm the final PUDO approval checklist, default capabilities and operational availability/capacity fields.
7. Confirm payment provider/event retention and how historical store payment evidence is accessed.
8. Confirm retention and access rules for parcel photos, PDFs and other sensitive evidence.

## 10. Implementation rule

Do not start by extending the legacy collections listed above. First implement the approved minimal target model in the approved new database, then add only the specific read-through/reference adapter needed for existing store functionality. Any required historical data copy or migration must have a separately reviewed mapping, verification and rollback plan and explicit approval.
