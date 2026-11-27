# VeriLyft Data Architecture

**Version:** 1.2  
**Date:** 27 November 2026  
**Status:** Aligned to the Phase 3 minimal schema baseline in [document 08](./08-final-minimal-firestore-schema.md).

## 1. Architecture principles

- One VeriLyft application with three role-aware experiences: Customer, Admin and PUDO Partner.
- One authoritative shipment record across all creation channels.
- Customer ownership, request creator, assigned operator and physical custodian are distinct facts.
- Use the smallest set of authoritative records that supports the approved workflows.
- Keep the existing storefront and its records independent from shipment booking.
- All privileged data changes are performed through authenticated server-side APIs.
- Preserve attributable review, approval, payment and custody evidence even when the logical model is simplified.

## 2. Firebase and database boundary

- Staging and production use separate Firebase projects. Existing `verilyft-4e691` remains the production project; staging must use a dedicated project.
- Do not create a separate staging Firestore database inside the production Firebase project. A Git branch does not select a Firebase project.
- The new shipment model uses the versioned `verilyftShipmentData/v1` namespace inside the explicitly selected Firestore database in each environment. The database ID (including an explicit `(default)` choice), location and runtime credentials must be confirmed for each project before live connection.
- Existing store collections and existing customer, Admin, PUDO partner, PUDO location and operational evidence authorities are not overwritten, copied or dual-written by the shipment model.
- The shipment adapter receives an explicitly selected Firestore instance and refuses implicit fallback to the application's default Firebase Admin connection.
- Existing identity authorities are read-only references in the same environment-specific database transaction boundary. Firestore transactions cannot span database instances.
- Firebase Authentication may continue to use each environment's project-local UID namespace. A shared UID does not imply shared permissions: Customer, Admin and PUDO Partner profiles and authorisation remain separate.
- No database provisioning, rules/index deployment, Storage configuration, migration, backfill or production data change is authorised by this architecture document.

## 3. Minimal logical model

The following table maps the 12 approved logical structures to their actual authorities and the versioned shipment namespace. Parcels are separately modelled as required by the shipment relationship.

| Logical record | Authoritative source/path | Phase 3 treatment |
|---|---|---|
| Customer | Existing `users/{uid}`; walk-in profiles at `verilyftShipmentData/v1/walkInCustomers/{customerId}` | Preserve registered customer authority; walk-ins remain pending and do not create Auth users. |
| Admin | Existing `adminAccess/{uid}` | Read-only authority reference; no duplicate Admin profile or permissions collection. |
| PUDO Partner | Existing `pudoPartnerAccounts/{uid}` | Read-only partner identity; remains distinct from Admin and PUDO personnel. |
| PUDO Location | Existing `pudoLocations/{locationId}` and existing evidence collections | Preserve current location, verification, activation, capability and operational authorities. |
| PUDO Personnel | Existing `pudoLocations/{locationId}/personnel/{personnelId}` | Roster-only named worker; no individual Auth login. |
| Shipment | `verilyftShipmentData/v1/shipments/{shipmentId}` | Single authoritative shipment across all creation channels. |
| Shipment Parcels | `verilyftShipmentData/v1/parcels/{parcelId}` | Separately modelled parcel records with a required shipmentId relationship. |
| Shipment Events | `verilyftShipmentData/v1/shipments/{shipmentId}/events/{eventId}` | Append-only shipment timeline, including physical custody evidence events. |
| Shipment Quote | `verilyftShipmentData/v1/quoteLineages/{quoteId}/revisions/{revisionId}` | One quote lineage per shipment; immutable revision documents. Legacy `shipmentQuotes` remains separate. |
| Payment | `verilyftShipmentData/v1/payments/{paymentId}` | One immutable provider attempt identity linked to shipment and accepted quote revision. |
| Parcel Intake | `verilyftShipmentData/v1/parcelIntakes/{intakeId}` | Completed physical intake record, linked to shipment and parcel IDs, with mandatory photo evidence references. |
| Shipment Assignment | `verilyftShipmentData/v1/shipments/{shipmentId}/assignments/{assignmentId}` | Retained responsibility history; not proof of physical custody. |
| Shipment Document | `verilyftShipmentData/v1/shipments/{shipmentId}/documents/{documentId}` | Immutable versioned metadata and protected Storage reference; binary remains in Storage. |
| Notification | `verilyftShipmentData/v1/notifications/{notificationId}` | Recipient-specific deduplicated intent; delivery attempts are append-only subrecords. |

Do not introduce standalone collections for quote calculations, booking copies, custody ledgers, photo registries, assignment calendars, worker accounts or delivery personnel unless a demonstrated query/security requirement justifies them. The collection list is a minimum logical model, not an instruction to create every collection at once.

## 4. Authoritative shipment and relationships

- `shipments/{shipmentId}` is the only authoritative shipment record.
- The shipment contains customer ownership, creator attribution, channel, unique shipment reference, sender/recipient snapshots, service type, origin/destination snapshots, current status, and references/summaries for quote, payment and current assignment.
- A shipment has one origin and one destination. Multiple parcel records share those endpoints; a multi-stop route requires separate shipments.
- Customer draft data is a client-side preparation state, not a persisted customer-facing shipment Draft status. Final submission creates the authoritative shipment at `Submitted`.
- Booking confirmation is a state/time/reference on the shipment after the approved quote and verified payment conditions. Do not create a second `shipmentBookings` authority.
- Quote revisions remain in one quote lineage for the shipment. An accepted revision is immutable.
- Each Paystack transaction attempt has its own payment record. A retry after a failed attempt creates a new attempt; it does not overwrite the failed attempt. Provider webhooks are verification evidence, not duplicate payments.
- Parcel intake records describe actual physical receipt. Intake requires confirmed photo evidence before completion.
- Assignments describe responsibility for an activity and time period. They do not prove collection, dispatch or custody.
- Actual physical custody/handover is recorded as a specific event in the shipment's single timeline, with the actor, location, time and evidence. Do not infer custody from assignment or shipment status.
- Shipment events are the single chronological source for customer tracking and Admin monitoring. Visibility is classified for Customer, Recipient, PUDO and Admin.
- Documents are stored in Firebase Storage; Firestore stores metadata, version and protected object reference. Sender and recipient delivery attempts are recorded separately where needed.

## 5. Shipment lifecycle

The customer-facing lifecycle begins at `Submitted`, never at Draft:

1. Submitted
2. Under Review
3. Quoted
4. Awaiting Payment
5. Confirmed
6. Awaiting Collection
7. Collected
8. Received at PUDO
9. In Transit
10. Out for Delivery
11. Delivered

Exceptions: Rejected, Cancelled, Payment Failed, Collection Failed, Delivery Failed and Returned.

The lifecycle is a set of permitted transitions, not a requirement that every shipment passes through every state. The following service-specific handover rules are approved: `Awaiting Collection` means waiting for physical handover from the sender. For PUDO-origin services (`pudo_to_pudo`, `pudo_to_door`), sender drop-off and completion of photo-evidenced origin intake move the shipment to `Received at PUDO`; `Collected` is not used for a PUDO drop-off. For door-origin services (`door_to_pudo`, `door_to_door`), `Collected` is recorded only after actual physical pickup by the assigned operator. Domain transitions must enforce the relevant evidence gates.

## 6. PUDO identity and access

- A PUDO Partner account authenticates through Firebase Authentication and is linked to the partner profile.
- The partner may access only locations whose partner relationship matches the authenticated UID.
- The partner manages named roster entries under its own location. A roster entry has name, operational role and status only. It is not an Auth user and does not grant access.
- Actions made through the PUDO portal are attributed to the authenticated partner UID. When a named worker physically receives or handles a parcel, the worker may be selected as the operational person in the intake/assignment record, while the authenticated partner remains the system actor.
- Admin identities and commercial/operational authorities are not inherited by a PUDO Partner or roster entry.
- PUDO partners cannot approve commercial pricing, alter shipment payment state, or access unrelated shipments or private Customer–Admin pricing conversations.

## 7. Authorization model

**Customer**
- Authenticated, verified and non-revoked customer may access their own profile, shipments, quote decisions, payment summaries and permitted documents.
- Ownership is derived from the verified Firebase UID, never a client-supplied customer ID.
- Customer cannot set authoritative prices, payment success, custody, assignment completion or delivery completion.

**Admin**
- Admin access requires a verified, non-revoked token, configured allowlisted email, Admin custom claim, active Admin access record and server-side authorization.
- Admin-only actions include shipment review, authoritative quotation, pricing decisions, payment exception handling, PUDO approval/management, intake review, assignment, delivery confirmation and permitted cancellation.
- Role/permission checks must be enforced by server APIs, not merely hidden navigation.

**PUDO Partner**
- Partner access requires a verified, non-revoked token and active partner account.
- Each location operation revalidates partner ownership server-side.
- Partner access is restricted to its own locations, roster and station-relevant operations.

**Recipient**
- Recipient access is limited to the recipient's own shipment and permitted tracking/documents. Registration may occur after shipment submission; account access must be verified before revealing shipment data.
- Recipient does not receive sender payment details, private Admin notes or unrelated personal data.

## 8. Existing application and migration boundary

- Existing store collections (including categories, products, orders and historical payment/webhook evidence) remain untouched.
- Legacy shipment drafts and quote stores are not the new authoritative shipment schema. Reuse business logic selectively through reviewed adapters; do not copy legacy collections wholesale.
- The prior `shipmentBookings` implementation is not a second source of truth. Booking becomes a shipment lifecycle fact.
- Existing PUDO network verification/activation/capability and commercial evidence workflows remain authoritative and are referenced; shipment records do not duplicate or override them.
- No migration, dual write or backfill is part of Phase 3 foundation work.

## 9. Storage, indexes and deployment

- Parcel/intake images and generated PDFs live in Firebase Storage; Firestore stores protected metadata and object paths.
- Never use public object URLs for sensitive parcel or customer documents.
- Add composite indexes only for validated query patterns.
- New database rules must default-deny direct client writes to authoritative shipment, quote, payment, intake, assignment, event and approval records.
- Test Customer, Admin, PUDO Partner, Recipient and unauthorised access boundaries before enabling live workflows.
- Database creation, rules/index deployment and Storage configuration remain explicit approval gates.

## 10. Implementation order

1. Complete Phase 2 access gaps and audit — completed in the staging baseline.
2. Resolve the shipment workflow decisions — recorded as approved in document 08.
3. Implement the canonical shipment contracts, validation, business commands and repository ports — Phase 3 code foundation.
4. Implement the injected Firestore adapter and environment guards without connecting to production — Phase 3 code foundation.
5. Provision/confirm the separate staging Firebase project and its explicit database/runtime configuration before live staging integration.
6. Build customer, Admin and PUDO workflows in their roadmap phases; these are not part of the Phase 3 data foundation.

The [Final Minimal Firestore Schema](./08-final-minimal-firestore-schema.md) is the field-level baseline. If a feature cannot be traced to an approved workflow, do not add it to the initial schema.
