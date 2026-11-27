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

- Firebase project: `verilyft-4e691`.
- Existing default Firestore database: remains the current legacy/store data boundary and must not be modified by the new shipment implementation.
- New shipment data: intended for a separately named Firestore database within the existing Firebase project. Its database ID, location and runtime configuration remain pending explicit approval.
- Do not create a separate Stage Firestore database. A Git branch named `staging` does not imply a separate database.
- Do not write new shipment data into the existing default database as a temporary workaround.
- Do not create the new database, deploy rules/indexes, change Storage configuration or write production data without explicit approval.
- Firebase Authentication may continue to use the existing project-level UID namespace. A shared UID does not imply shared permissions: Customer, Admin and PUDO Partner profiles and authorization are separate.
- Existing store records remain authoritative in the existing database. The new shipment application may access selected store information only through an approved server-side read boundary. No copying or dual-writing is implied.

## 3. Minimal logical model

The following are logical records for the new shipment database. Nested records are used where they have one clear owner.

| Record | Location | Purpose |
|---|---|---|
| Customer | `customers/{customerId}` | Customer profile linked to Firebase Auth UID. |
| Admin | `admins/{adminId}` | Admin identity/access profile; privileged permissions are enforced server-side. |
| PUDO Partner | `pudoPartners/{partnerId}` | Partner account/profile, separate from Admin. |
| PUDO Location | `pudoLocations/{locationId}` | Current station identity, address, lifecycle, shared default capabilities and operational summary. |
| PUDO Personnel | `pudoLocations/{locationId}/personnel/{personnelId}` | Roster-only named worker record with role and active/inactive state. No individual login in the initial release. |
| Shipment | `shipments/{shipmentId}` | Single authoritative shipment across Customer, Admin-assisted and PUDO walk-in channels. |
| Shipment Parcels | `shipments/{shipmentId}/parcels/{parcelId}` | Repeating parcel records belonging to one shipment. |
| Shipment Events | `shipments/{shipmentId}/events/{eventId}` | One append-only chronological shipment timeline, including material operational/custody events. |
| Shipment Quote | `shipmentQuotes/{quoteId}` | One quote lineage per shipment, with revisions nested beneath it. |
| Payment | `payments/{paymentId}` | One provider transaction/attempt, linked to its shipment and quote snapshot. |
| Parcel Intake | `parcelIntakes/{intakeId}` | One record per actual physical intake, linked to shipment, parcel and PUDO. Photo metadata may be nested beneath it. |
| Shipment Assignment | `shipments/{shipmentId}/assignments/{assignmentId}` | Repeating assignment responsibility records; not proof of physical custody. |
| Shipment Document | `shipments/{shipmentId}/documents/{documentId}` | Generated document metadata and protected Storage reference. |
| Notification | `notifications/{notificationId}` | Minimum recipient-specific delivery state and retry evidence. |

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
- Existing PUDO network verification/activation/capability and commercial evidence workflows remain governed by their existing decisions until a separate migration/replacement is approved.
- No migration, dual write or backfill is part of Phase 3 foundation work.

## 9. Storage, indexes and deployment

- Parcel/intake images and generated PDFs live in Firebase Storage; Firestore stores protected metadata and object paths.
- Never use public object URLs for sensitive parcel or customer documents.
- Add composite indexes only for validated query patterns.
- New database rules must default-deny direct client writes to authoritative shipment, quote, payment, intake, assignment, event and approval records.
- Test Customer, Admin, PUDO Partner, Recipient and unauthorised access boundaries before enabling live workflows.
- Database creation, rules/index deployment and Storage configuration remain explicit approval gates.

## 10. Implementation order

1. Complete Phase 2 access gaps and audit.
2. Confirm the remaining business decisions in document 08.
3. Implement the shipment data contracts, validation and pure business transition logic without binding to a production database.
4. Obtain explicit approval for database ID/location and infrastructure setup.
5. Wire the approved database adapter and server-side transactions.
6. Build customer, Admin and PUDO workflows in their roadmap phases.

The [Final Minimal Firestore Schema](./08-final-minimal-firestore-schema.md) is the field-level baseline. If a feature cannot be traced to an approved workflow, do not add it to the initial schema.
