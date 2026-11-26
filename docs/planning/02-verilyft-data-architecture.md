# VeriLyft Data Architecture

**Proposed logical model for the new Firestore database | v1.0 | 26 November 2026**

> WORKING BASELINE — collection names below are proposed logical names, not confirmation that collections have been created. Inventory the actual databases and schemas before implementation.

## 1. Architecture principles

- Use a separate Firestore database for the new implementation while leaving the existing main-version database unchanged.
- Use one authoritative shipment record across customer, PUDO and Admin workflows. Portals are access surfaces, not separate copies of business data.
- Keep customer, internal staff and PUDO partner identities logically distinct. Apply least-privilege access and server-side authorisation.
- Preserve existing store data and relationships. Do not rename, delete or restructure existing collections as part of this work.
- Treat the collection names below as proposed logical names only. Inventory the actual databases and existing schemas before creating collections.

## 2. Database and application boundary

- Firebase project currently discussed: `verilyft-4e691`.
- Proposed arrangement: existing default Firestore database remains for the main version; a separately named Firestore database is created for the new implementation.
- Do not create or deploy the new database until its ID, location, rules and environment strategy are approved.
- Firebase Authentication can be shared at project level if that is the chosen identity design, but user identity mapping, database rules and application permissions must be explicit for each database.
- Store integration is unresolved: the new app may read selected store data from the existing database through a trusted server-side boundary, use a controlled data copy, or later migrate selected data. Avoid dual writes until consistency and ownership are designed.

## 3. Logical collection groups

### Identity and access
- `customers`
- `staff`
- `adminAccess`
- `pudoPartners`
- `pudoPersonnel`

### PUDO network
- `pudoLocations`
- `pudoVerifications`
- `pudoActivations`
- `pudoCapabilities` (or a versioned shared capability definition)
- `pudoAssignments`
- `pudoOperations`
- `custodyRecords`

### Shipment core
- `shipments`
- `shipmentPriceRequests`
- `shipmentPriceCalculations`
- `shipmentQuotes`
- `shipmentBookings`
- `shipmentEvents`
- `shipmentTrackingAccess`
- `shipmentDeliveryConfirmations`

### Pricing
- `transportationRateCards`
- `pricingRules`
- `commercialPricingDefinitions` (reconcile with existing domain naming before creation)

### Payments
- `payments`
- `refunds`

Each payment should reference its business subject (shipment booking or store order) and identify transaction type. Do not create duplicate payment records for the same provider transaction.

### Routing and delivery
- `deliveryPersonnel`
- `vehicles`
- `deliveryAssignments`
- `transportTransfers`

### Communication and support
- `chatSessions`
- `chatMessages`
- `chatParticipants`
- `supportCases`

### Documents and notifications
- `shipmentDocuments`
- `shipmentDocumentDeliveries`
- `notifications`
- `emailDeliveryLogs`

### Store
Preserve existing store collections in the existing database unless the selected integration decision explicitly calls for a controlled copy or migration.

## 4. Core entities and relationships

- **Customer:** one account may act as shopper, sender and recipient. Shipment ownership is a customer reference where known; recipient contact details may be stored on the shipment snapshot to preserve the details used at booking.
- **Shipment:** central aggregate linking owner/customer, createdBy actor, request channel, sender/recipient snapshots, origin/destination, parcel details, pickup mode, pricing/quote, booking, payment references, PUDO references, assignments, documents and status summary.
- **Created-by attribution:** record whether the request was created by the customer or on behalf of the customer by a PUDO operator. Keep customer ownership separate from the actor who entered the request.
- **Shipment events:** append-only timeline entries with event type, occurredAt, recordedAt, actor identity/type, relevant location, evidence references and source operation. A current status field on shipment may be maintained as a derived summary.
- **Quotation:** reference shipment, calculation inputs, pricing configuration version, road distance evidence/source, weight basis, line items, totals, currency, validity, issuer and issue time. Accepted/declined state should be traceable.
- **Booking:** references accepted quotation and shipment. Booking confirmation is not proof of physical collection or custody.
- **PUDO intake:** `parcelIntakeRecords` should reference shipment, PUDO location, receiving actor, time, measured parcel details and evidence. Require photo evidence before marking physical receipt complete.
- **Parcel photos:** store binary images in Firebase Storage. Store metadata and secure object references in `parcelIntakePhotos` or as evidence metadata attached to `parcelIntakeRecords`. Avoid public object URLs; use authorised access or short-lived signed access patterns.
- **Payments:** reference the shipment booking or store order; include provider transaction reference, amount, currency, status, timestamps and verification source. Payment success must be confirmed server-side, not trusted solely from browser state.
- **Documents:** `shipmentDocuments` references shipment and document type, version, storage path, generatedAt, generatedBy and content snapshot/version. Delivery records separately capture sender/recipient destination, attempt status and timestamps.

## 5. Mandatory parcel intake evidence

Add these proposed logical entities:

### `parcelIntakeRecords`
One record per physical intake event. Suggested fields:
- `shipmentId`
- `pudoLocationId`
- `receivedBy` (actor type and ID)
- `receivedAt`
- `recordedAt`
- `intakeChannel` (walk_in, door_pickup_arrival, or another approved value)
- parcel condition/notes
- measured weight and dimensions
- `photoEvidenceIds`
- status

### `parcelIntakePhotos`
One metadata record per captured photo. Suggested fields:
- `intakeRecordId`
- `shipmentId`
- `storagePath`
- `contentType`
- `fileSize`
- `capturedAt`
- `uploadedAt`
- `capturedBy`
- `photoPurpose`
- checksum if supported
- access classification

**Validation:** a physical intake cannot transition to received/complete unless the required photo evidence is present and the upload is confirmed. The exact minimum number of photos and photo angles can be specified in the PUDO workflow.

A door-pickup assignment is not an intake. A door pickup collection event and arrival/intake at the station may be separate physical events, each with its own evidence requirements if the business requires it.

## 6. Status and data integrity

- Use explicit status enums and validated transitions; do not let arbitrary client writes change authoritative shipment, payment, custody or approval status.
- Distinguish `occurredAt` (when an event happened) from `recordedAt` (when the system recorded it).
- Keep evidence and financial records auditable. Prefer append-only events and compensating records over destructive edits.
- Use server-side transactions or idempotent operations for booking creation, payment processing and event recording where appropriate.
- Use stable document IDs and explicit references. Avoid storing large duplicated nested histories in a single Firestore document.
- Define retention, deletion, correction and privacy handling for sensitive identity data and parcel images before production.

## 7. Access model

- **Customer:** read own profile, own shipments and orders, own permitted messages, documents and payment summaries; create allowed requests; cannot set authoritative price, payment success, custody or delivery completion.
- **Admin/staff:** access according to role and permission. Pricing authority, refunds, PUDO approval and sensitive identity evidence should be restricted to designated roles.
- **PUDO partner:** access only its own partner/location, authorised personnel and operational records associated with its location. It must not automatically see customer–Admin private pricing conversations or unrelated shipments.
- **PUDO personnel:** if individual login is enabled, access only assigned tasks and the minimum information needed to perform them.
- **Recipient:** access a limited recipient view through a verified account or secure tracking access mechanism. Do not expose sender payment details, internal chat or unrelated personal information.

## 8. Indexes, storage and deployment

- Create composite indexes only after query patterns are specified and validated. Likely query dimensions include customerId + createdAt, pudoLocationId + status + createdAt, shipmentId + event time, and transaction subject + createdAt.
- Use Firebase Storage for parcel photos and generated PDFs; Firestore stores metadata and references.
- Maintain separate configuration for database ID, Storage paths, environment and service credentials. Never commit secrets.
- Deploy rules and indexes deliberately to the new database; do not alter existing main-version rules or data without explicit approval.
- Test access rules against customer, Admin, PUDO partner and unauthorised identities before enabling live workflows.

## 9. Open schema decisions

- Confirm final collection names after inventorying existing structures and avoiding duplicate concepts.
- Choose whether customer/staff/PUDO authentication maps to one Firebase Auth UID namespace or separate sign-in flows with distinct profile documents.
- Choose where store customer/order/payment data is authoritative and how the new database accesses it.
- Confirm PUDO personnel individual accounts, assignment model and role scope.
- Confirm pricing line-item schema, weight basis, route evidence reference and pricing version format.
- Confirm payment provider and whether payment records live in the new database, existing store database, or a defined shared financial service.
- Confirm shipment status transitions, intake evidence requirements, photo retention and document retention.
