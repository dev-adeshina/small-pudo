# VeriLyft Final Minimal Firestore Schema

**Version:** 1.0  
**Date:** 27 November 2026  
**Status:** Final logical architecture baseline for Phase 3 planning. Database provisioning and deployment remain separately approval-gated.

> Governing rule: Build the simplest data structure that fully supports the approved VeriLyft workflows. Do not carry forward complexity simply because it already exists.

This document consolidates confirmed product decisions, the current repository audit and the remaining business decisions that materially affect implementation. Collection names are logical targets, not evidence that collections exist. This document finalises the logical model; it does not create a database or authorise data, rules, index or Storage changes.

## 1. Confirmed product decisions

- A shipment is created through exactly three channels: registered customer, Admin on behalf of a customer, or PUDO partner on behalf of a walk-in customer.
- All channels create the same authoritative shipment record.
- Each shipment records its customer/sender, creator/actor and creation channel separately.
- A shipment cannot be submitted without a customer identity. Customer-facing submission requires sign-up/sign-in before final submission. PUDO walk-in representation creates a minimal pending-registration customer profile; it does not create a Firebase Auth account. The customer gains account access only after normal registration and identity verification.
- Every submitted shipment receives a unique shipment reference.
- Sender and recipient information is stored side by side as shipment snapshots. A signed-in customer may select saved contacts/addresses or enter new ones.
- Address structure: country, state, city, street/address description, coordinates when available, and PUDO/operational-location reference where applicable.
- Initial services: PUDO-to-PUDO, door-to-PUDO, PUDO-to-door and door-to-door.
- One shipment may contain multiple parcels, but all parcels in that shipment share one origin and one destination. Different destinations require separate shipments/intakes.
- Parcel data includes description, quantity, actual weight, dimensions, volumetric weight, declared value, special handling, and item images. VeriLyft does not accept goods prohibited by applicable law; the initial release needs a clear customer declaration/confirmation and an Admin/PUDO escalation path, not a complex prohibited-goods catalogue.
- Submitted parcel measurements may be amended only by Admin while the server-opened review is open; Admin closes the review and locks declared values. Physical intake measurements remain separate immutable observations.
- The shipment lifecycle begins at **Submitted**. There is no customer-facing Draft shipment status.
- Main shipment status includes the agreed statuses and exception states in section 5. Quotation and payment are reflected in the shipment's overall status.
- Status/event history records previous and new state, actor, timestamp and reason. Some internal events/status details are Admin-only.
- Shipment status and physical custody are separate facts.
- Each shipment has one quote lineage with revisions. Automated system and authorised Admin can generate quotes; Admin approves/overrides them. Accepted quote is an immutable snapshot.
- Payment is through Paystack and must be verified server-side before shipment confirmation. Retry is allowed only after a failed payment attempt. Refund requests use an authorised manual process initially.
- Every registered PUDO location receives the standard default operational capabilities automatically; a separate capability approval is not a prerequisite for ordinary parcel handling or quotation readiness. A city is serviceable when VeriLyft has at least one registered PUDO in that city. Do not create a separate city-activation approval workflow. Customers may choose the PUDO most convenient to them, including the nearest suitable location. A location's temporary operating availability and capacity are separate from city-level serviceability.
- PUDO partner identity is separate from Admin identity. A partner account manages its location roster. Named personnel records contain a person's name and operational role; they are roster-only records with no individual Firebase login or Admin permissions.
- Physical intake is a separate shipment-linked record. It requires a photograph, time, PUDO, receiving person, condition, measured weight/dimensions and discrepancy notes. Intake evidence is immutable; corrections append to the original record.
- Assignments and custody are distinct. Assignments identify who is responsible for an activity and when; custody events prove physical possession/handover.
- PUDO transfers are supported. Failed collection, failed delivery and returns have event records and reasons.
- Delivery confirmation captures recipient name/phone, photo, signature or confirmation, GPS and timestamp.
- One chronological shipment event history powers tracking and Admin monitoring. Sender/recipient visibility is restricted by role and privacy.
- Recipient must have an account to access tracking and delivery information, but need not already be registered when the sender submits the shipment. The recipient may register later; access is granted only after the authenticated account is verified against the recipient identity on the shipment.
- Required shipment documents: quotation, payment receipt, shipment confirmation, waybill, PUDO intake receipt and delivery confirmation. Documents are shipment-linked and versioned; relevant documents are emailed to sender and recipient.
- Shared authentication infrastructure is retained, with separate role-aware workspaces and access boundaries. Current internal operating model is Admin responsibility; do not assume a general staff management system is required.
- Explicit Admin authority is required for reviewing shipments, issuing quotations, approving pricing, confirming payments, managing PUDO locations, recording intake, assigning shipments, confirming delivery and cancellation. Staff management is out of initial scope.
- Existing store collections remain independent and untouched. Store orders are not shipment bookings.
- Staging and production use separate Firebase projects; `verilyft-4e691` remains production. Shipment records use the versioned `verilyftShipmentData/v1` namespace in the explicitly selected database in each project. Existing legacy collections remain untouched. Staging project/database provisioning and deployment require separate approval.
- Avoid unnecessary collections, deep subcollections, duplicated records and excessive version histories.

## 2. Minimal logical collection model

The following is the proposed starting point. Use subcollections only where records genuinely repeat or must be append-only.

| Logical structure | Authoritative source/path | Responsibility |
|---|---|---|
| Customers | Existing `users/{uid}`; walk-ins at `verilyftShipmentData/v1/walkInCustomers/{customerId}` | Existing registered profile authority; minimal pending walk-in profile only. |
| Admins | Existing `adminAccess/{uid}` | Existing active Admin access authority; no duplicate Admin collection. |
| PUDO partners | Existing `pudoPartnerAccounts/{uid}` | Existing partner identity; distinct from Admin and roster personnel. |
| PUDO locations | Existing `pudoLocations/{locationId}` and PUDO evidence collections | Existing location and verification/activation/capability/operations authorities. |
| Shipments | `verilyftShipmentData/v1/shipments/{shipmentId}` | One authoritative shipment aggregate. |
| Shipment quotes | `verilyftShipmentData/v1/quoteLineages/{quoteId}/revisions/{revisionId}` | One quote lineage per shipment; immutable revisions. Legacy `shipmentQuotes` remains separate. |
| Payments | `verilyftShipmentData/v1/payments/{paymentId}` | Provider payment attempts linked to shipment and accepted quote revision. |
| Shipment events | `verilyftShipmentData/v1/shipments/{shipmentId}/events/{eventId}` | Append-only timeline, including material custody events. |
| Parcel intakes | `verilyftShipmentData/v1/parcelIntakes/{intakeId}` | Completed physical intake linked to shipment/parcels, with mandatory photo evidence. |
| Shipment assignments | `verilyftShipmentData/v1/shipments/{shipmentId}/assignments/{assignmentId}` | Responsibility history, distinct from custody. |
| Shipment documents | `verilyftShipmentData/v1/shipments/{shipmentId}/documents/{documentId}` | Immutable versioned metadata and Cloudinary asset identifier; binaries remain in Cloudinary. |
| Notifications | `verilyftShipmentData/v1/notifications/{notificationId}` | Recipient-specific deduplicated intent and append-only delivery attempts. |

Parcels are separately modelled at `verilyftShipmentData/v1/parcels/{parcelId}` with a required `shipmentId` relationship. PUDO personnel remain roster entries under the existing PUDO location record.

Worker roster records, saved customer address/contact records, quote revisions, intake corrections and notification attempts should be embedded or nested under their owning record where that is sufficient. Do not create standalone top-level collections for them without a demonstrated query/security requirement.

## 3. `shipments` authoritative record

Suggested fields (required unless marked optional):

### Identity and attribution
- `shipmentReference`: unique, human-readable reference.
- `customerId`: customer who owns/sends the shipment.
- `createdBy`: actor type and actor ID (customer, Admin or PUDO partner).
- `createdVia`: customer_portal, admin_assisted or pudo_walk_in.
- `createdAt`, `submittedAt`.
- `updatedAt`.

### Sender and recipient snapshots
Store both side by side on the shipment:
- `sender`: customer/contact reference where available plus fullName, phone, email, country, state, city, addressDescription, coordinates (optional), operationalLocationId/PUDO reference (optional).
- `recipient`: customer reference when registered plus fullName, phone, email, country, state, city, addressDescription, coordinates (optional), operationalLocationId/PUDO reference (optional).

These snapshots preserve the exact details used for this shipment even if a saved customer contact is later edited.

### Service and route
- `serviceType`: pudo_to_pudo, door_to_pudo, pudo_to_door, door_to_door.
- `origin` and `destination`: structured endpoint snapshots and endpoint type (PUDO or address).
- `routeDistanceKm`: the distance value used by the configurable transportation-pricing calculation, together with its measurement/source basis where available. Distance is a pricing input, not a route-approval prerequisite. The system does not require individually approved route evidence before issuing a quotation.

### Parcels
Use a shipment-owned parcel list/subcollection because a shipment can contain multiple independently measured parcels. Each parcel has:
- parcel ID/reference;
- description;
- quantity;
- actualWeight and unit;
- length, width, height and unit;
- volumetricWeight and calculation basis;
- declaredValue and currency;
- specialHandlingInstructions;
- prohibitedGoodsDeclarationAccepted (customer/authorised submitting actor and timestamp);
- itemImage metadata/storage references;
- measurement status/lockedAt and amendment references.

All parcels in a shipment share the shipment's single origin and destination. A shipment must not represent a multi-stop A-to-B-to-C route.

### Lifecycle and linked records
- `status`: current customer-facing main status.
- `internalStatus` or restricted operational flags only where genuinely needed; do not leak Admin-only review detail into customer views.
- `quoteId`, `acceptedQuoteRevisionId` (when applicable).
- `paymentStatus` and `paymentId` summary/reference.
- `bookingConfirmedAt` (after verified payment).
- `originPudoId`, `destinationPudoId` where applicable.
- `currentAssignmentId` and `currentCustodySummary` as operational summaries, not proof replacing event evidence.
- `createdAt`, `updatedAt`, `completedAt` as applicable.

Shipment document must not become a duplicate of quote, payment, intake, assignment or event records. It stores current state and references; authoritative details remain with their owning records.

## 4. Quotes and payments

### Quote lineage
One quote lineage per shipment:
- `shipmentId`;
- current revision and revision history;
- origin/destination and service snapshot;
- distance in kilometres and the applicable configurable pricing inputs/version;
- parcel weights/dimensions and pricing basis;
- line items/additional charges;
- subtotal, total, currency;
- pricing configuration/version reference;
- issuedBy (system or Admin), issuedAt, validUntil;
- Admin approval/override attribution where applicable;
- customer decision and acceptedAt;
- immutable accepted snapshot.

An expired unpaid quote is not payable. Obtain a new revision in the same shipment's quote lineage; retain the shipment reference and prior quote revision. Do not create a duplicate shipment solely because a quote expired.

### Payments
Each provider transaction/attempt is recorded with:
- shipmentId;
- provider = paystack;
- amount, currency;
- provider transaction/reference IDs;
- status (initialised, pending, successful, failed, abandoned, refunded/partially_refunded as applicable);
- initiatedAt, verifiedAt;
- server verification result/source;
- related webhook/event reference and idempotency key;
- refund request/status and authorised action metadata.

A retry after a failed attempt creates a new attempt; it must not overwrite the failed attempt. A browser return alone never establishes payment success. If payment succeeds but the customer does not return, send a transactional email with a secure link back to the application/tracking.

### Transportation pricing and manual arrangement

Transportation is manually arranged and managed by Admin in the initial operating model. PUDO locations receive, inspect, ascertain, hold and dispatch parcels according to Admin's instructions; they do not independently approve or allocate road routes.

Distance in kilometres and other configurable commercial variables determine the transportation charge. Rates and related pricing variables must be versioned/configurable so Admin can respond to fuel-price increases or decreases and other cost changes. A quotation stores the exact pricing configuration/version and calculation inputs used when it was issued.

The data model must distinguish:
- transportation price calculation (commercial inputs and calculated charges);
- Admin's manual transportation arrangement (operational instruction/assignment);
- physical dispatch and custody (events proving the parcel was released/received).

A route-distance approval record is not a prerequisite for quotation readiness. The manual arrangement may capture transporter, vehicle, distance, instructions and operational references when known; optional details must not block the initial quote or booking.

## 5. Shipment lifecycle and events

Customer-facing main statuses agreed:
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

Exception statuses agreed:
- Rejected
- Cancelled
- Payment Failed
- Collection Failed
- Delivery Failed
- Returned

Quotation/payment states are reflected in the shipment's overall status. A shipment event records:
- event type;
- previousStatus and newStatus where a status changes;
- actor type, actor ID and display snapshot;
- occurredAt and recordedAt;
- reason/notes;
- location/PUDO reference where relevant;
- evidence/document references;
- visibility classification (customer, recipient, Admin-only).

A shipment cannot be rejected before quotation. After quotation and before customer acceptance/payment, Admin may reject it with a mandatory reason; the current quote is marked withdrawn/void and the rejection is appended to the shipment timeline. A customer or Admin may cancel while the shipment is in `Submitted`, `Under Review`, `Quoted` or `Awaiting Payment`, provided no successful payment/confirmation exists. Cancellation requires an attributable actor and mandatory reason; any active quote is withdrawn. Cancellation after successful payment/confirmation is outside initial scope.

Custody and assignment events must not be inferred from main shipment status. Record actual physical receipt/handover separately.

## 6. PUDO location and identity

### PUDO location
One current-state document should hold:
- partnerId;
- location name and contact;
- structured address including city/state and optional coordinates;
- registration state and registeredAt;
- default operational capabilities assigned automatically at registration;
- operating days and opening/closing periods;
- current location operating availability (including temporary unavailability);
- capacity values where configured;
- active/inactive state;
- createdAt/updatedAt and lifecycle event references.

City-level serviceability is derived from the registered PUDO locations: a city is serviceable when at least one PUDO is registered there. Do not maintain a second manually activated city-availability record. Customer PUDO selection should return suitable registered locations in the requested city and, when coordinates are available, help the customer identify the closest location. A location's temporary operating unavailability affects whether that location can be selected now; it does not erase the underlying registered network location.

Keep only important lifecycle changes in an attributable history. Routine current operating state is updated on the location record.

### PUDO partner
Separate login/profile linked to Auth UID and the PUDO location(s) it is authorised to operate. PUDO partner is not an Admin and cannot approve commercial pricing.

Named workers are roster-only entries stored at `pudoLocations/{locationId}/personnel/{personnelId}`. Each record contains `name`, `role`, `status`, `createdAt`, `createdBy`, `updatedAt` and `updatedBy`; deactivation is retained rather than deletion. The authenticated PUDO partner account creates and maintains the roster. Workers do not receive individual logins in the initial release. Shift schedules and assignment periods are Phase 6 concerns and are not part of this roster record.

## 7. Intake, custody, assignments and delivery

### Parcel intake
One intake record per physical intake event:
- shipmentId and parcelIds;
- intake type (station drop-off, door-pickup collection arrival, transfer arrival);
- PUDO/location;
- receivedBy actor/person;
- receivedAt and recordedAt;
- condition;
- confirmed actual weight/dimensions;
- discrepancies and notes;
- mandatory photo evidence references;
- status/completion time;
- correction/addendum references.

The intake cannot complete until photo upload is confirmed. Store image binaries in Cloudinary and protected asset metadata/references in Firestore; do not use Firebase Storage for shipment images. Store a Cloudinary asset identifier and integrity/access metadata rather than trusting arbitrary client URLs. Submitted evidence is immutable; a correction is appended and linked to the original submission.

### Custody and transfers
Custody means actual physical possession only. Each physical handover/transfer creates a progressive custody event recording releasing party, receiving party, time, location, condition and evidence. An assignment, route dispatch or attempted collection is not custody.

### Assignments
An assignment identifies the person/location currently responsible for a defined activity:
- shipmentId;
- assignee type and ID (PUDO, named PUDO worker, Admin/authorised operator, delivery operator);
- activity type;
- assignedBy;
- startAt, endAt;
- status;
- shift/schedule reference where relevant.

Assignment is responsibility, not proof of possession. The initial scope should support simple assignment periods and optional split shifts where applicable, without building a full workforce scheduling system.

### Delivery confirmation
Record recipient name and phone, delivery photo, signature/confirmation, GPS (when available), timestamp and confirming actor. Failed collection/delivery and returns create events with reason and supporting evidence.

## 8. Documents, tracking and notifications

Document binaries are stored in Cloudinary; Firestore holds shipmentId, document type, version, Cloudinary asset identifier, resource type, format, size/checksum, generatedAt, generatedBy, content snapshot/reference and access classification. Do not treat a public URL as the authoritative document reference.

Required document types: quotation, payment receipt, shipment confirmation, waybill, PUDO intake receipt and delivery confirmation.

Sender sees payment, permitted tracking progress and delivery information. Recipient sees permitted tracking, collection and delivery progress. Both require registered accounts. Internal notes, private Admin decisions, payment details not belonging to the recipient, and sensitive operational information remain restricted.

Initial notification events: payment outcome, shipment progress at meaningful milestones, delivery/failed delivery and other minimum transactional notices. Relevant documents are emailed to sender and recipient according to their access rights. Store notification attempts and delivery status sufficiently to support retries and audit without creating a complex messaging platform.

## 9. Admin access and audit

- Shared Firebase Authentication may be used, but customer, Admin and PUDO partner profiles and access boundaries remain distinct.
- Initial internal responsibility is Admin; do not build a general staff directory, staff invitation system or staff-management workflow into the new schema without a new requirement.
- Enforce Admin-only actions server-side: shipment review, quote issue/override, pricing approval, payment confirmation/exception handling, PUDO management, intake review/recording, assignments, delivery confirmation and permitted cancellation.
- Record material actions with actor, action, affected record, timestamp and reason.
- PUDO partner access is limited to its own location and operational records; customer and recipient access is limited to their own authorised shipment information.

## 10. Resolved business decisions and remaining infrastructure gate

The following workflow decisions are resolved and are the implementation baseline:

1. **Walk-in customer provisioning:** An authenticated PUDO partner may create a minimal pending-registration customer profile on behalf of a walk-in customer. This does not create a Firebase Auth user. The profile remains pending until the customer completes normal registration and identity verification.
2. **Cancellation before confirmation:** The owning customer or Admin may cancel in `Submitted`, `Under Review`, `Quoted` or `Awaiting Payment`, with a mandatory reason and attributable event. Cancellation after successful payment/confirmation is outside initial scope.
3. **Rejection after quotation:** Admin may reject only after quotation and before customer acceptance/payment. Rejection requires a reason, withdraws the current quote and appends an event.
4. **Measurement review completion:** Only Admin may amend declared measurements while the server-opened review is open and close the review. Closure locks declared values. Physical intake measurements remain separate immutable observations.
5. **Service-specific handover semantics:** PUDO-origin services move from `Awaiting Collection` to `Received at PUDO` only after completed origin-PUDO intake with photo evidence. Door-origin services move to `Collected` only after actual physical pickup by the assigned operator. Assignment or attempted pickup alone is not custody.
6. **Environment boundary:** Staging and production use separate Firebase projects. Existing `verilyft-4e691` remains production. Staging must use a dedicated Firebase project; no separate staging database is created inside the production project. The staging project ID, ownership/billing, selected Firestore database ID/location and runtime credentials remain to be provisioned/confirmed before live connection.

## 11. Explicitly outside initial scope

- Customer cancellation after confirmed/paid booking.
- Automated refunds; refund requests go through an authorised process.
- Individual PUDO worker authentication; named roster records do not create accounts.
- Complex staff management and delegation.
- Multi-stop/multi-destination shipments.
- Advanced workforce scheduling and automated route optimisation.
- Complex financial reconciliation and settlement.
- Rebuilding or migrating existing store collections.
- Anonymous recipient tracking.
- New database creation, rules/index deployment or production data changes without separate approval.

## 12. Final architecture and implementation gates

The logical shipment schema in this document is the Phase 3 implementation baseline. The following boundaries remain mandatory:

- Staging and production are separate Firebase projects. `verilyft-4e691` remains production; staging receives its own dedicated project.
- The new shipment records use the versioned `verilyftShipmentData/v1` namespace within the explicitly selected Firestore database in each environment. The database ID (including an explicit `(default)` choice) and location must be confirmed for each project before runtime connection.
- Do not create a staging Firestore database inside the production Firebase project, and do not infer that a Git branch selects a Firebase project.
- Existing store collections, customer drafts, legacy `shipmentQuotes`, Admin access, PUDO partner accounts, PUDO locations and PUDO operational evidence remain authoritative and are not overwritten or dual-written by the shipment model.
- Existing customer/Admin/PUDO partner/PUDO location authorities are read-only references in the same environment-specific Firestore database transaction boundary. Firestore transactions cannot span database instances.
- Firebase Authentication may use the project-local UID namespace. Customer, Admin and PUDO partner identities remain logically distinct; all privileged shipment writes are server-side.
- The adapter receives an explicitly selected Firestore instance and does not fall back to the application's default Firebase Admin app. Runtime project/database selection is explicit and environment-guarded.
- Phase 3 code does not authorise database provisioning, Firestore rules/index deployment, Storage bucket or access-policy changes, migrations, backfills, production data writes or PR merge. Those remain separate approval gates.

The code-level data model and injected persistence adapter may be developed and tested without connecting to production. Live staging verification begins only after the separate staging project and its database/runtime configuration are confirmed.
