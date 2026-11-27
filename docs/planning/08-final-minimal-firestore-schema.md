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
- A shipment cannot be submitted without a customer identity. Customer-facing submission requires sign-up/sign-in before final submission. PUDO walk-in representation requires the customer to be represented by the PUDO operator; the precise account-provisioning rule remains open in section 10.
- Every submitted shipment receives a unique shipment reference.
- Sender and recipient information is stored side by side as shipment snapshots. A signed-in customer may select saved contacts/addresses or enter new ones.
- Address structure: country, state, city, street/address description, coordinates when available, and PUDO/operational-location reference where applicable.
- Initial services: PUDO-to-PUDO, door-to-PUDO, PUDO-to-door and door-to-door.
- One shipment may contain multiple parcels, but all parcels in that shipment share one origin and one destination. Different destinations require separate shipments/intakes.
- Parcel data includes description, quantity, actual weight, dimensions, volumetric weight, declared value, special handling, and item images. VeriLyft does not accept goods prohibited by applicable law; the initial release needs a clear customer declaration/confirmation and an Admin/PUDO escalation path, not a complex prohibited-goods catalogue.
- Submitted parcel measurements may be amended only during Admin/PUDO review; after that review is completed they are locked. The exact review lock point must be enforced server-side.
- The shipment lifecycle begins at **Submitted**. There is no customer-facing Draft shipment status.
- Main shipment status includes the agreed statuses and exception states in section 5. Quotation and payment are reflected in the shipment's overall status.
- Status/event history records previous and new state, actor, timestamp and reason. Some internal events/status details are Admin-only.
- Shipment status and physical custody are separate facts.
- Each shipment has one quote lineage with revisions. Automated system and authorised Admin can generate quotes; Admin approves/overrides them. Accepted quote is an immutable snapshot.
- Payment is through Paystack and must be verified server-side before shipment confirmation. Retry is allowed only after a failed payment attempt. Refund requests use an authorised manual process initially.
- PUDO locations share the same default capabilities. One location record holds current identity, address, lifecycle, capability and operational summary. Registration, verification, approval and activation are stages of one lifecycle.
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
- New shipment implementation uses a separately identified Firestore database. Existing main-version database and store records remain untouched. Database creation/deployment requires separate approval.
- Avoid unnecessary collections, deep subcollections, duplicated records and excessive version histories.

## 2. Minimal logical collection model

The following is the proposed starting point. Use subcollections only where records genuinely repeat or must be append-only.

| Logical collection | Responsibility |
|---|---|
| `customers` | Minimal customer profile linked to Auth UID; saved contacts/addresses may be held as customer-owned subcollections if required. |
| `admins` | Admin profile and active access state; permissions are enforced server-side. |
| `pudoPartners` | PUDO partner login/profile, separate from Admin identity. |
| `pudoLocations` | One current location record: identity, address, lifecycle, shared default capabilities, schedule, availability and capacity summary. Each location owns a small `personnel` subcollection for named roster entries. |
| `shipments` | The single authoritative shipment aggregate across all three creation channels. |
| `shipmentQuotes` | One quote lineage per shipment with current quote and necessary revisions/snapshots. |
| `payments` | Payment attempts/provider transactions linked to shipment; retries create attempts only after failure. |
| `shipmentEvents` | Append-only timeline for shipment lifecycle and operational events; may be a subcollection under shipment. |
| `parcelIntakes` | One record per physical intake, linked to shipment and affected parcel(s), with mandatory photo evidence. |
| `shipmentAssignments` | Current and historical operational responsibility for pickup, PUDO handling, transfer or delivery. |
| `shipmentDocuments` | Shipment-linked generated document metadata, version and Storage path. |
| `notifications` | Minimum notification/delivery attempts needed for payment, progress and delivery communication. |

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
- `routeDistance`: approved distance value/unit and evidence reference when available; do not treat straight-line distance as road-route evidence.

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
- distance and road-route evidence reference;
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

A submitted shipment cannot be rejected before quotation. The exact point and authority for rejection after quotation must be settled. Cancellation after confirmation/payment is not supported initially; the Cancelled exception state is retained only if a permitted pre-confirmation cancellation path is approved.

Custody and assignment events must not be inferred from main shipment status. Record actual physical receipt/handover separately.

## 6. PUDO location and identity

### PUDO location
One current-state document should hold:
- partnerId;
- location name and contact;
- structured address and optional coordinates;
- registration/verification/approval/activation lifecycle state;
- shared default capability reference/value;
- operating days and opening/closing periods;
- current availability;
- capacity values;
- active/inactive state;
- createdAt/updatedAt and lifecycle event references.

Keep only important lifecycle/approval changes in an attributable history. Routine current operating state is updated on the location record.

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

The intake cannot complete until photo upload is confirmed. Store image binaries in Firebase Storage and protected metadata/references in Firestore. Submitted evidence is immutable; a correction is appended and linked to the original submission.

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

Documents are stored in Firebase Storage; Firestore holds shipmentId, document type, version, storage path, generatedAt, generatedBy, content snapshot/reference and access classification.

Required document types: quotation, payment receipt, shipment confirmation, waybill, PUDO intake receipt and delivery confirmation.

Sender sees payment, permitted tracking progress and delivery information. Recipient sees permitted tracking, collection and delivery progress. Both require registered accounts. Internal notes, private Admin decisions, payment details not belonging to the recipient, and sensitive operational information remain restricted.

Initial notification events: payment outcome, shipment progress at meaningful milestones, delivery/failed delivery and other minimum transactional notices. Relevant documents are emailed to sender and recipient according to their access rights. Store notification attempts and delivery status sufficiently to support retries and audit without creating a complex messaging platform.

## 9. Admin access and audit

- Shared Firebase Authentication may be used, but customer, Admin and PUDO partner profiles and access boundaries remain distinct.
- Initial internal responsibility is Admin; do not build a general staff directory, staff invitation system or staff-management workflow into the new schema without a new requirement.
- Enforce Admin-only actions server-side: shipment review, quote issue/override, pricing approval, payment confirmation/exception handling, PUDO management, intake review/recording, assignments, delivery confirmation and permitted cancellation.
- Record material actions with actor, action, affected record, timestamp and reason.
- PUDO partner access is limited to its own location and operational records; customer and recipient access is limited to their own authorised shipment information.

## 10. Remaining business decisions

The following are the only material workflow decisions still left open in the current baseline. They must be resolved before implementing the affected transition or workflow:

1. **Walk-in customer provisioning:** A PUDO partner may submit on behalf of a walk-in customer, but every shipment must have a customer identity. Decide whether the partner may create a customer profile on the customer's behalf (with account access activated only after the customer completes registration) or whether customer registration must occur before submission. Until decided, do not create anonymous shipments or silently create Auth accounts.
2. **Cancellation before confirmation:** Customer cancellation after payment/booking confirmation is outside initial scope. Decide whether a customer or Admin may cancel a submitted/quoted shipment before payment, and the exact permitted statuses and audit reason. Until decided, expose no customer cancellation action.
3. **Rejection after quotation:** A shipment must not be rejected before a quotation is issued. Decide whether Admin may reject after quotation but before acceptance/payment, and whether the quote is marked withdrawn/void with a reason.
4. **Measurement review completion:** Customer-declared measurements may be corrected only during the authorised Admin/PUDO review. The implementation should use an explicit review-completed action as the lock point. Confirm which role may close that review. Physical measurements recorded at intake are a separate immutable observation and must not overwrite the original customer-declared values.
5. **Service-specific handover status semantics:** `Awaiting Collection` means the shipment is awaiting physical handover from the sender. For PUDO-origin services, that may mean sender drop-off at the origin PUDO; for door-pickup services it means waiting for the assigned pickup. `Collected` is recorded only when a door-pickup operator physically collects the parcel. A PUDO drop-off proceeds to `Received at PUDO` after photo-evidenced intake. Confirm these labels and transitions against the four service types before coding the state machine.
6. **Database target details:** Confirm the separately named shipment database ID and Firestore location, and the exact environment configuration. The current instruction is that no separate Stage Firestore database is to be created. Do not create a database, deploy rules/indexes or write production shipment data until this infrastructure decision is explicitly approved.

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

- Existing default Firestore database and existing store collections remain untouched by the new shipment implementation.
- The intended shipment data boundary is a separately named Firestore database in the existing Firebase project `verilyft-4e691`; its database ID, location and deployment configuration are not yet approved or created.
- Do not create a separate Stage Firestore database. Do not infer that a staging branch authorises a staging database.
- Do not point new shipment writes at the existing default database as a workaround for the pending infrastructure decision.
- Firebase Authentication may use the existing project-level UID namespace. Role profiles and authorization remain logically distinct in the target database and all privileged writes remain server-side.
- Existing store data remains authoritative in the existing database. Any store read-through must use a deliberate server-side boundary; no copying or dual writes are implied.
- Phase 3 code may be developed against an injected database interface and test doubles. It must not initialize or write to production Firestore until the target database details and deployment are explicitly approved.

This schema baseline authorises planning and code preparation only. It does not authorise database creation, Firestore rules/index deployment, Storage changes, migrations or production data writes.
