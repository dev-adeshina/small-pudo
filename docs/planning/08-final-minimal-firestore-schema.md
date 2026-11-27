# VeriLyft Final Minimal Firestore Schema — Decision Draft

**Version:** 0.1  
**Date:** 27 November 2026  
**Status:** Decision draft based on product-owner answers; not implementation authorisation.

> Governing rule: Build the simplest data structure that fully supports the approved VeriLyft workflows. Do not carry forward complexity simply because it already exists.

This document translates the product-owner's answers into a field-level schema proposal. It deliberately records unresolved business decisions instead of silently choosing behaviour. Collection names are logical proposals; nothing in this document creates a database or authorises data, rules, index or Storage changes.

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
- Parcel data includes description, quantity, actual weight, dimensions, volumetric weight, declared value, special handling, and item images.
- Submitted parcel measurements may be amended only during Admin/PUDO review; after that review is completed they are locked. The exact review lock point must be enforced server-side.
- The shipment lifecycle begins at **Submitted**. There is no customer-facing Draft shipment status.
- Main shipment status includes the agreed statuses and exception states in section 5. Quotation and payment are reflected in the shipment's overall status.
- Status/event history records previous and new state, actor, timestamp and reason. Some internal events/status details are Admin-only.
- Shipment status and physical custody are separate facts.
- Each shipment has one quote lineage with revisions. Automated system and authorised Admin can generate quotes; Admin approves/overrides them. Accepted quote is an immutable snapshot.
- Payment is through Paystack and must be verified server-side before shipment confirmation. Retry is allowed only after a failed payment attempt. Refund requests use an authorised manual process initially.
- PUDO locations share the same default capabilities. One location record holds current identity, address, lifecycle, capability and operational summary. Registration, verification, approval and activation are stages of one lifecycle.
- PUDO partner identity is separate from Admin identity. One PUDO partner account is planned for a location; the interpretation of worker records/login is unresolved in section 10.
- Physical intake is a separate shipment-linked record. It requires a photograph, time, PUDO, receiving person, condition, measured weight/dimensions and discrepancy notes. Intake evidence is immutable; corrections append to the original record.
- Assignments and custody are distinct. Assignments identify who is responsible for an activity and when; custody events prove physical possession/handover.
- PUDO transfers are supported. Failed collection, failed delivery and returns have event records and reasons.
- Delivery confirmation captures recipient name/phone, photo, signature or confirmation, GPS and timestamp.
- One chronological shipment event history powers tracking and Admin monitoring. Sender/recipient visibility is restricted by role and privacy.
- Recipient must have an account to access tracking and delivery information.
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
| `pudoLocations` | One current location record: identity, address, lifecycle, shared default capabilities, schedule, availability and capacity summary. |
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

An expired unpaid quote is not payable. The system must obtain a fresh quote before payment. Whether this means a new quote revision on the same shipment or a new shipment is an open decision in section 10; do not create duplicate shipments automatically.

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

The exact model for named workers (for example, John — bike man; Cynthia — station staff), whether they have individual logins, and how shift periods are recorded remains open. Do not create individual worker authentication or a complex workforce module until clarified.

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

## 10. Decisions still requiring clarification

These points are deliberately not silently resolved:

1. **Walk-in customer account:** You require a registered customer before shipment submission, but also say a PUDO operator represents a walk-in customer in good authority. Should the PUDO operator create a customer profile/account on the customer's behalf (without giving that customer login access until they complete sign-up), or must the customer complete registration before the PUDO can submit?
2. **PUDO workers:** You specified one PUDO partner account, but also said every person working at a PUDO should be registered with a name and role (e.g. bike man, station staff). Should these be roster-only worker records under the location, with no individual login, while the partner account performs the system actions? Or did you intend only Admins to be recorded as personnel?
3. **Expired quotation:** Does “start a new booking” mean issue a new quote revision for the same submitted shipment, or create a completely new shipment reference?
4. **Cancellation:** You retained Cancelled as an exception status but said cancellation after confirmation or payment is not allowed. Is cancellation allowed before payment/confirmation only, or should cancellation be unavailable to customers and Admins in the first release?
5. **Rejection:** A submitted shipment cannot be rejected before quotation. Can Admin reject it after issuing a quote but before customer acceptance/payment, and what happens to the quote?
6. **Measurement lock:** At what exact point does the Admin/PUDO review close and parcel weight/dimensions become permanently locked: when Admin issues the final quote, when customer accepts it, or when the parcel is physically received?
7. **Recipient account:** Must the recipient already have a registered account when the shipment is submitted, or can the sender enter recipient details and the recipient register later before accessing tracking?
8. **PUDO personnel wording:** The earlier statement that “we only have Admin as PUDO personnel” conflicts with the examples of PUDO workers. The proposed interpretation is a single PUDO partner login plus simple named worker roster entries, not individual worker accounts. Confirm or correct this.
9. **PUDO-to-PUDO collection:** Confirm whether “Awaiting Collection” means awaiting sender drop-off at the origin PUDO, while “Collected” means the parcel has physically been picked up/received by the responsible operator. Status labels may need service-specific event meanings while remaining in one lifecycle.

## 11. Explicitly outside initial scope

- Customer cancellation after confirmed/paid booking.
- Automated refunds; refund requests go through an authorised process.
- Individual PUDO worker authentication unless confirmed.
- Complex staff management and delegation.
- Multi-stop/multi-destination shipments.
- Advanced workforce scheduling and automated route optimisation.
- Complex financial reconciliation and settlement.
- Rebuilding or migrating existing store collections.
- Anonymous recipient tracking.
- New database creation, rules/index deployment or production data changes without separate approval.

## 12. Approval and implementation gate

This is a schema decision draft, not an implementation authorisation. Once the nine questions in section 10 are answered, update this proposal to a final version and align the PRD, business workflows, permissions and page map. Only after the final schema and infrastructure boundary are approved should implementation begin. Creating the separate Firestore database and deploying rules/indexes remains a separate explicit approval.
