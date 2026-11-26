# VeriLyft UI/UX Blueprint

**Customer, Admin and PUDO experiences | v1.0 | 26 November 2026**

## 1. Experience architecture

Design three distinct portal experiences over the same business workflows and authoritative shipment records: Customer Portal, Admin Portal and PUDO Portal.

Each portal has its own navigation, dashboard and role-appropriate controls. Reuse a shared component system for consistency without making the portals identical.

Support responsive desktop, tablet and mobile layouts. Prioritise mobile usability for PUDO intake and camera capture.

## 2. Customer Portal sitemap

- **Overview:** active shipments, pending quotations, payments awaiting action, recent store orders, recent activity and quick actions.
- **Send a Parcel:** guided form covering collection method, sender, recipient, origin/destination, parcel description, weight/dimensions and request submission.
- **My Shipments:** searchable/filterable list with reference, recipient, route, status, quote and payment status; opens shipment detail.
- **Shipment Detail:** parties, parcel, route, price calculation, Admin quotation, booking/payment state, timeline, documents, authorised messages and relevant intake evidence.
- **Track a Parcel:** tracking reference or authorised link; limited timeline and recipient-safe information.
- **Messages:** shipment-linked pricing conversation, opened when the initial indicative price is presented and Admin joins.
- **My Orders:** preserve existing store order experience and purchase history.
- **Notifications and My Account:** relevant alerts, profile, contact details, saved addresses and basic security.

## 3. Admin Portal sitemap

- **Dashboard:** business summary cards, activity feed and work requiring attention.
- **Customers:** searchable customer list and customer detail with profile, shipment history, store order history, payment summaries and conversations.
- **Shipments:** all shipment requests across direct, PUDO walk-in and door-pickup channels; filters by status, channel, location and date.
- **Shipment Detail:** customer/recipient, parcel, route, intake photographs, initial calculation, quotation, chat, payment, booking, assignment, events, documents and authorised actions.
- **Bookings:** confirmed bookings and their payment/fulfilment state.
- **Store Orders:** existing order management preserved and kept distinct from shipment bookings.
- **Transactions:** store and shipment transactions with type, subject reference, amount, method, provider reference, status and date.
- **PUDO Network:** partners, locations, registrations, verification, approval, default capabilities, personnel, assignments and operations.
- **Routing & Delivery:** personnel, basic vehicle details, collection/delivery assignments, PUDO transfers and progress.
- **Messages & Support:** customer conversations and basic enquiry/complaint cases.
- **Documents:** quotations, receipts, PUDO intake receipts, waybills and delivery confirmations.
- **Notifications:** delivery and payment notification records and failures.
- **Pricing & Settings:** rate per km per kg, PUDO fee, additional charge and effective/version information.
- **Staff & Permissions:** internal staff accounts, roles and permission assignment.

## 4. PUDO Portal sitemap

- **Dashboard:** station identity/status, today's intake count, parcels at station, door-pickup requests, personnel assignment summary and recent activity.
- **Parcel Intake:** walk-in request creation and physical parcel intake; search existing shipment for a door-pickup arrival.
- **Shipments:** only shipments relevant to the authorised PUDO location, grouped by operational status.
- **Door Pickup:** pickup requests and schedules with customer address, shipment reference, assigned personnel and scheduled times.
- **Personnel:** register and maintain partner personnel records by type (bike man, auto errand personnel, station staff).
- **Assignments:** schedule personnel with date, start time and end time; display upcoming, on-assignment, off-assignment and unavailable states derived from schedule and availability.
- **Messages and Notifications:** only authorised conversations and operational alerts.
- **Station Profile:** partner details, location/geolocation, approval status and common default capabilities.

## 5. Critical page behaviour

- Shipment forms should be guided and progressively disclose fields. Validate required fields and clearly distinguish a request from a confirmed booking.
- Show indicative price as an estimate pending Admin review. Clearly label Admin-issued quotation, validity and acceptance action.
- Shipment detail should be a single source-of-truth workspace. Use tabs or well-organised sections so operators can inspect the complete record without searching across unrelated pages.
- Tables should support search, filters, pagination, clear status badges and permission-appropriate row actions. Do not expose destructive actions for immutable evidence.
- PUDO intake should prioritise camera/photo capture, parcel identification, weight/dimensions, station identity and receiver attribution. Do not show a successful received state until required photo evidence is uploaded and linked.
- Assignment screens must distinguish scheduled work from actual execution. A schedule must not automatically create a completed pickup or custody event.
- Tracking should use a chronological timeline and explain status in customer-friendly language. Show only information authorised for the viewer.
- Documents should have preview/download controls subject to permission. Email delivery state should be visible to authorised Admin users.

## 6. Shared components

- Role-aware application shell, sidebar/navigation, page header and breadcrumbs.
- Dashboard metric cards and activity lists.
- Searchable/filterable data tables, pagination and empty states.
- Forms, validation messages, address/location selectors and parcel dimension inputs.
- Status badges, timeline/event history and confirmation dialogs.
- Shipment summary/detail panels, quote breakdowns and payment status panels.
- Camera capture/photo upload, thumbnail preview and secure evidence viewer.
- PDF/document preview and delivery status.
- Conversation panel, notification centre and assignment schedule components.

## 7. Visual and interaction direction

- **Customer:** simple, reassuring, clear progress and price presentation; mobile-first.
- **Admin:** information-dense but orderly operations interface; desktop-optimised tables and detailed records, responsive on smaller screens.
- **PUDO:** practical, touch-friendly interface with large action targets, minimal typing where possible and camera-first intake.
- Use consistent typography, spacing, colour semantics and interaction patterns. Do not rely on colour alone to communicate status.
- Provide loading, empty, error, success and permission-denied states. Confirm irreversible or financially significant actions.

## 8. Permissions and visibility UX

- Hide or disable actions the current role cannot perform, and enforce the same restrictions server-side.
- Customer sees own shipments/orders and recipient-authorised tracking only.
- PUDO sees only its authorised station and related operational records. Customer–Admin pricing chat is not automatically visible to PUDO.
- Admin screens expose sensitive identity and financial data only to roles with explicit permission.
- Recipient view omits sender payment/account information and internal conversations.

## 9. Recommended design and build order

1. Define shared design tokens, app shell, authentication states and role-based navigation.
2. Design Admin shipment list/detail and the end-to-end shipment workflow because this exposes the full operational model.
3. Design Customer shipment request, quotation, payment, tracking and document views.
4. Design PUDO dashboard, walk-in intake, door-pickup arrival intake and personnel scheduling.
5. Add transactions, store order integration, support, notifications and reporting views.
6. Validate every important screen against its underlying data entity, permission and business workflow before implementation.

## 10. Screens to prototype first

- Admin Dashboard.
- Admin Shipment List and Shipment Detail.
- Customer Send a Parcel wizard and Shipment Detail/Tracking.
- PUDO Dashboard and Parcel Intake camera flow.
- Admin Quotation review and issue screen.
- Customer quotation review/acceptance and linked chat.
- Admin Transactions and Store Orders.
