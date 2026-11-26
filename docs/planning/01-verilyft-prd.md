# VeriLyft Product Requirements Document

**Initial minimal platform scope | Planning baseline v1.0 | 26 November 2026**

> WORKING BASELINE — decisions marked open must be confirmed before the affected feature is implemented.

## 1. Purpose and product vision

VeriLyft is a logistics and commerce platform supporting independent shipment requests and bookings, PUDO-based parcel operations, delivery coordination, customer communication, tracking and the existing online store.

The initial release should provide a usable end-to-end operating platform without implementing advanced automation before it is operationally necessary.

## 2. Product structure and user groups

- **Customer Portal:** one customer account supports online shopping, sending shipments and receiving shipments. A recipient may be a registered customer or a contact without an account, subject to the final access design.
- **Admin Portal:** internal Admin and staff manage and oversee the business through role-appropriate permissions.
- **PUDO Portal:** PUDO partners and authorised station personnel manage their own station profile, parcel intake, relevant shipments, personnel and assignments. PUDO identity and access remain separate from internal staff identity and permissions.

## 3. Initial product scope

- **Customer:** account/profile, shipment request, quotation review and acceptance, payment, shipment history, tracking, relevant messages and notifications, shipment documents, and access to existing store functionality.
- **Admin:** business dashboard; customer records; shipment requests and bookings; quotations and pricing; store orders; transactions; PUDO partner/location administration; routing and delivery assignments; messages/support; documents; notifications; staff and permissions.
- **PUDO:** partner/station dashboard; parcel intake; mandatory parcel photography; station shipment list; door-pickup visibility; personnel registration; basic work scheduling/assignments; relevant notifications and messages.
- **Shared capabilities:** authentication, authorisation, shipment record and event history, server-side pricing, payment status recording, PDF generation and email delivery, secure file storage, audit-relevant actor/timestamp metadata.

## 4. Shipment entry channels

1. **Direct customer request:** customer enters shipment details in the Customer Portal.
2. **PUDO walk-in:** an authorised PUDO operator enters a shipment request on behalf of a visiting customer. The customer remains the shipment owner; the operator is recorded as the submitting actor.
3. **Door pickup:** customer requests collection from an address. The request is linked to a PUDO and assigned personnel where appropriate. A schedule/assignment is not proof that collection occurred.

All three channels create or update one authoritative shipment record. Do not create separate duplicate shipment records for each portal.

## 5. Core business rules

- One customer account supports shopping, sending and receiving; store orders and independent shipment bookings remain distinct transaction types.
- Admin has authority over the final shipment quotation and approved pricing configuration. PUDO partners do not independently approve transportation prices.
- Indicative price calculation and Admin-issued quotation are distinct, traceable stages. The applicable pricing configuration/version is retained with each calculation/quotation.
- The shipment chat session begins when the initial indicative price is presented and Admin joins the pricing discussion; it does not begin merely because a draft request was started.
- Physical custody means actual physical possession only. A request, booking, route, dispatch assignment or attempted collection does not itself prove custody.
- Every physical parcel intake must include at least one parcel photograph. The intake record must not be completed as received without the required photo evidence.
- Parcel photographs are stored in Firebase Storage; Firestore stores secure references and metadata. Evidence must be access-controlled and should not be silently overwritten.
- Sender and recipient are both intended recipients of relevant shipment PDF documents by email. Document-specific content and privacy rules must prevent disclosure of information inappropriate to either party.
- Current PUDO capabilities use a common default capability set. The initial approval process determines whether a PUDO is fit for approval; per-location capability differentiation is deferred.
- Personnel assignment schedules (including start/end times) describe planned availability/assignment only. They are not proof of attendance or completed work.

## 6. Initial pricing model

Indicative transportation fee:

`road-route distance (km) × parcel weight (kg) × configured rate per km per kg`

Illustrative agreed example: 8.9 km × 1 kg × ₦100 = ₦890 transportation fee. With an illustrative ₦300 PUDO fee, subtotal is ₦1,190; an illustrative 10% addition is ₦119; total is ₦1,309.

These figures are examples, not final commercial approval. The exact meaning and applicability of the 10% charge, weight rounding, dimensional/volumetric weight, minimum charges, other charges, route provider/source and rounding policy remain to be confirmed.

Road-route distance is required for operational pricing; straight-line distance is not a substitute for road-route distance.

## 7. Documents, notifications and communication

- Planned shipment PDFs include quotation, payment receipt, PUDO intake receipt, shipment waybill and delivery confirmation; refund receipt may be produced when a refund is completed.
- Store each generated document as an immutable version with metadata and a secure storage reference. Corrections should create a new version/document rather than silently replacing evidence.
- Email relevant PDFs or secure document links to both sender and recipient, and record delivery outcomes, failures and resend attempts. Exact recipient/content matrix and attachment-versus-secure-link policy require confirmation.
- Email is in initial scope. SMS and advanced notification analytics are deferred. Notifications are separate from chat messages.

## 8. Explicitly deferred from initial scope

- Complex financial reconciliation, automated PUDO settlements/payouts, commission distribution and advanced financial reporting.
- Advanced fleet management, route optimisation and automated driver availability management.
- Complex recipient verification, third-party collection authorisation and automated redelivery management.
- Advanced customer preference centres, SMS notifications and notification analytics.
- Complex support escalation workflows and advanced audit dashboards.

These exclusions do not prevent Admin from viewing relevant records or handling basic operations manually.

## 9. Existing store preservation and database boundary

- The current main-version Firestore database and its data must remain untouched by this new implementation unless separately authorised.
- The proposed new implementation uses a separate Firestore database. The existing Firebase project may host multiple Firestore databases, subject to project configuration and deployment support.
- Existing store data (products, categories, inventory, pricing, customers, orders, order items and store payment records) must be preserved. Whether the new implementation reads the existing store database, imports a controlled copy, or later migrates selected data is an explicit architecture decision still to be made.
- Do not assume Firestore databases automatically share data. Authentication may be shared at Firebase project level, but each database requires its own rules, indexes and connection configuration.

## 10. Success criteria

- A customer can submit a shipment request through the supported channel and the request is visible to authorised Admin users.
- Admin can review details, issue a traceable quotation and communicate with the customer.
- A customer can accept a quotation and proceed through payment/booking states.
- A PUDO operator can create a walk-in request on behalf of a customer and record a physical intake with mandatory photograph evidence.
- Door-pickup assignments are distinguishable from actual collection and custody evidence.
- Sender and recipient can access authorised tracking information and receive relevant shipment PDFs by email.
- Admin can view store orders, shipment bookings and transaction records without merging store orders and shipment bookings.
- Unauthorised users cannot access another customer's shipment data, another PUDO's operational data or restricted identity/financial information.

## 11. Open decisions before implementation

- New Firestore database ID/name, region, rules/index deployment approach and environment strategy.
- Store integration boundary: read existing database, controlled copy, or migration; identify the exact existing store collections and ownership model.
- Final pricing policy: 10% charge definition, PUDO fee rules, weight basis/rounding, dimensional weight, other charges and route-distance source.
- Payment provider, supported methods, webhook/verification flow, refund authority and reconciliation expectations.
- Recipient access model: account, secure tracking link, verification requirements and exact information visible to recipient.
- Document recipient matrix, PDF templates, email provider, attachment/link approach and retention policy.
- Shipment status model and the evidence required for each transition.
- Whether PUDO personnel use individual login accounts in the initial release or are managed only as partner-entered personnel records.
- Final PUDO approval evidence checklist and exact default capability list.
