# VeriLyft Admin Portal — Page-by-Page Design

**Last updated:** 28 October 2026  
**Design status:** Under Review  
**Implementation status:** Not approved for implementation yet  
**Scope:** Admin Portal design only. This document records the decisions agreed so far; it is not a claim that these pages or functions are implemented.

## 1. Design principles

- Continue the existing VeriLyft Next.js App Router, TypeScript, Firebase/Firestore, Firebase Authentication, and Firebase Admin architecture.
- Keep changes focused. Reuse existing admin pages, components, layout patterns, form/table/dialog controls, icons, Tailwind conventions, and `app/globals.css`.
- The existing application UI is the primary design reference. Do not introduce a wholesale redesign, a second styling system, or duplicate components without explicit approval.
- Preserve responsive behaviour and provide meaningful loading, empty, success, validation-error, and server-error states.
- Authorization must be enforced by server/API/data boundaries. Hiding a link or button is not authorization.
- Treat this as a design specification. Inspect the current repository before implementation and reconcile any difference between existing code and this document.
- Distinguish **Confirmed**, **Proposed**, and **Unresolved** requirements. Do not invent routes, collections, fields, or business rules while implementing.

## 2. Admin Portal navigation

The following is the proposed navigation structure, subject to permission-aware visibility and reuse of the existing admin layout:

1. Dashboard
2. Orders
3. Shipments
4. Transactions
5. Products
6. Categories
7. Delivery Pricing
8. PUDO Network
9. Transport Management
10. Users & Access
11. Finance Overview
12. Notifications
13. Reports
14. Settings
15. Audit Logs
16. Government Requests — **not a separate page at this stage**

The Finance Portal remains responsible for full finance operations such as expenses, salaries/payroll, commissions, payouts, comprehensive reconciliation, and financial reporting. The Admin Portal may show relevant order/shipment/payment information without replacing Finance Portal responsibilities.

The navigation is a design proposal, not a declaration that every route exists. Exact routes and page boundaries must be checked against the repository before coding.

## 3. Admin sign-in and authorization

**Confirmed requirements**
- Preserve existing Firebase sign-in and Google sign-in flows where already supported.
- Customer authentication does not grant admin access.
- Admin authorization must be verified server-side using the project's existing configured allowlist/custom-claim approach.
- Unauthorized users must be denied even when they navigate directly to an admin URL or call an API.
- Handle signed-out users, unverified email where required by the existing policy, expired sessions, and rejected authorization clearly.

**Not yet verified:** The current live admin authentication and image-upload flows need regression checks. This document does not mark those flows as verified.

## 4. Dashboard — design agreed so far

### Layout
Use the existing admin layout and visual language. The intended structure is:
- Existing sidebar/navigation pattern, with responsive collapse or drawer behaviour consistent with the app.
- Top bar with global search, notifications, and account/session controls, reusing existing components where possible.
- Main dashboard content arranged as a concise business overview, operational activity, then issues requiring attention.

### Business overview
Show actual records, not hardcoded demo figures. Candidate summary cards include:
- Orders
- Shipments
- In transit
- Delivered
- Payment issues
- Shipment issues

### Financial visibility
Show operational financial information such as:
- Successful, pending, and failed payments
- Refund summaries
- Order and shipment revenue summaries
- Delivery charges
- Outstanding balances where supported by real records

Do not label revenue as profit. Expenses, salaries/payroll, full profit-and-loss, commissions/payouts, and comprehensive reconciliation belong in the Finance Portal.

### Date filtering
Support:
- Today
- Last 7 days
- This month
- Custom date range

Allow a user-preferred default range. Time-based totals follow the selected range; current operational counts should reflect current state and must not be misleadingly limited by the selected period.

### Operational activity
Use a combination of:
- Summary cards for relevant operational queues
- A live activity feed based on recorded events
- A useful network overview of PUDO stations/collection centres, connections, active movements, and bottlenecks where data supports it

Potential queue counts include awaiting intake, sorting, dispatch, in transit, at destination, awaiting collection, delayed, unassigned transport, and unresolved exceptions. Their exact definitions depend on the approved shipment lifecycle and must not be invented during implementation. Do not simulate activity.

### Issues requiring attention
Surface actionable issues such as payment verification problems, measurement/price discrepancies, delayed or damaged parcels, routing/dispatch problems, and system/integration failures where those records exist. Use priority levels Critical, High, Medium, and Informational, with read status, action links, resolution tracking, history, permission checks, and duplicate-alert prevention.

### Global search
Provide permission-aware search across relevant records, grouped by type:
- Orders and shipments
- Customers, shippers, and receivers
- Payments and payment references
- Products and categories
- PUDO locations
- Transport assignments
- Staff accounts

Results should link to the relevant details page. Search results and fields must respect the user's permissions.

### Quick actions
Use role-aware quick actions, potentially including create shipment, view orders/shipments, assign a driver, manage PUDO locations, resolve payment issues, manage products/categories, configure pricing/transport, view reports, and manage users/staff. Display actions according to permissions and enforce every action server-side.

### Dashboard states
Include loading, error, empty, refresh, date-range, and responsive states. Cards should navigate to relevant filtered views. Distinguish current-state counts from date-filtered activity. Do not double-count a storefront order and its linked shipment as two orders.

## 5. Orders, shipments, payments, and transport records

**Confirmed conceptual model — linked but separate records**
- Storefront purchases remain **orders**.
- Parcels sent by individuals or independent businesses are **shipments**; independent shippers do not list products on the VeriLyft storefront.
- A storefront order may link to a shipment.
- An independent shipment does not require a storefront order.
- Payments are separate records linked to the relevant order or shipment.
- A shipment may involve multiple transport movements/assignments.
- The Admin Portal should provide a coherent view across linked records without conflating their IDs or lifecycles.

**Confirmed status principle:** operational shipment status and payment status are separate. Payment success does not prove physical intake, dispatch, or delivery; physical receipt does not prove payment.

**Proposed, not finalized:** shipment lifecycle labels include booked, awaiting intake, received, sorting, awaiting dispatch, in transit, at destination, awaiting collection, delivered, exception, and cancelled. Some labels may be events or substatuses instead. The final lifecycle and transitions must be designed before implementation.

## 6. Pricing and measurement oversight

The Admin Portal is expected to provide a Delivery Pricing area, but its exact page/functions remain to be designed.

Agreed principles:
- Use one shared pricing engine for storefront checkout and independent shipper bookings.
- Price using applicable route/transport legs, In-PUDO/Trans-PUDO/Out-PUDO type, distance, parcel characteristics, and configured service/handling rules.
- Do not charge for a network layer the parcel does not use.
- Product measurements for VeriLyft storefront products are entered by authorized staff when maintaining the catalogue; customers should not have to declare them at checkout.
- Independent shippers declare parcel measurements. Staff can record actual measurements at intake.
- Preserve the quote and rate inputs used at booking. Rate changes must not silently rewrite existing quotes.
- Measurement discrepancies follow a configurable policy for top-up, refund/adjustment, hold, dispute, or authorized exception.
- Record original and revised values, reason, payment/refund outcome, and authorization.

Exact rate formulas, distance bands, limits, and policy values remain unresolved.

## 7. PUDO network and transport oversight

The Admin Portal is expected to include PUDO Network and Transport Management areas; exact page designs remain open.

**Confirmed network concepts**
- In-PUDO handles short-distance intra-city movements, with configurable distance guidance around 0.5–5 km.
- Trans-PUDO covers intermediate movements, approximately 10–15 km in the current concept.
- Out-PUDO supports longer-distance movements, including inter-state routes, and primarily provides warehousing, sorting, and dispatching.
- PUDO stations are staffed VeriLyft locations. Registered five-minute-walk In-PUDO collection centres are a distinct concept; their precise permitted operations remain to be defined.
- In-PUDO drivers move between In-PUDO locations; Trans-PUDO drivers move between Trans-PUDO locations; Out-PUDO drivers move between Out-PUDO locations.
- Routes are flexible: a shipment does not have to pass through every PUDO type.
- A PUDO location is a physical place, a transport connection links locations, and a shipment route is a sequence of connections.
- Distances should use road distance where available; the routing/configuration approach is unresolved.

Do not hardcode assumed routes or assume every inter-state parcel must pass through a fixed sequence of PUDO types.

## 8. Notifications, reports, settings, and audit logs

These areas are included in the proposed navigation, but detailed page-by-page functions remain under review.

- **Notifications:** comprehensive, actionable, permission-aware notifications for critical alerts, operations, low stock/capacity, assignments, and system/integration failures.
- **Reports:** show information supported by reliable source records and permission scope. Avoid duplicate counts between linked orders and shipments.
- **Settings:** likely to hold approved operational policies and configuration. Exact settings and role permissions remain to be specified before implementation.
- **Audit Logs:** record significant privileged actions and decisions. Protect logs from unauthorized access or alteration.

## 9. Government requests — intentionally basic

Do not over-engineer this area. There will be **no dedicated Government Requests page or elaborate workflow at this stage**.

Use the existing Admin Portal, records, evidence storage, and audit logs:
- Record the request reference, requesting authority, date, and basic details.
- Record the review and approve/reject decision by an authorized person.
- Attach or reference relevant documents only when necessary.
- Record significant decisions and any disclosure in the existing audit system.
- Restrict sensitive records and evidence to authorized personnel.

No separate approval engine or special portal is planned unless a concrete business need is identified later.

## 10. Finance boundary

The Admin Portal may show order/shipment/payment operational summaries. Full finance work remains in the Finance Portal, including:
- Expenses
- Salaries/payroll
- Commissions and payouts
- Comprehensive payment reconciliation
- Refund processing/financial reporting
- Profit-and-loss reporting

Operational teams may report a problem or request an adjustment, but financial actions and approvals must follow the eventual agreed Finance permissions and controls. Do not design detailed refund/appeal workflows as part of this Admin dashboard specification.

## 11. Page design status

| Page/area | Status | Notes |
|---|---|---|
| Admin sign-in and authorization | Under Review | Preserve existing flows; regression verification remains necessary. |
| Dashboard | Under Review | Main layout, metric groups, date filters, search, notifications, quick actions, and activity approach agreed. |
| Orders | Draft | Detailed list, filters, order detail, and actions still to be designed. |
| Shipments | Draft | Core business concept agreed; lifecycle and page interactions still to be designed. |
| Transactions | Draft | Must link to order/shipment records and avoid duplicating payment truth. |
| Products | Draft | Existing catalogue management; inspect before proposing changes. |
| Categories | Draft | Existing category management; inspect before proposing changes. |
| Delivery Pricing | Draft | Principles agreed; formulas and page controls unresolved. |
| PUDO Network | Draft | Network concepts agreed; location/connection screens unresolved. |
| Transport Management | Draft | Assignments, routes, and movements need detailed design. |
| Users & Access | Draft | Roles, permissions, and admin controls need detailed design. |
| Finance Overview | Draft | Admin-level operational summary only; full finance belongs in Finance Portal. |
| Notifications | Draft | Scope agreed; exact event catalogue and settings unresolved. |
| Reports | Draft | Needs report catalogue and permissions. |
| Settings | Draft | Need to define only the settings required by approved workflows. |
| Audit Logs | Draft | Existing infrastructure to be inspected before implementation. |
| Government requests | Basic scope agreed | Use existing records and audit logs; no dedicated page. |

## 12. Acceptance criteria before implementation

- The page/function design being implemented has been reviewed and explicitly approved.
- The actual repository and existing admin UI are inspected first.
- Existing components, authentication, authorization, API, data-access, and styling patterns are reused where appropriate.
- Data shown is based on real records; no hardcoded demo metrics or simulated activity.
- Server-side authorization protects data and actions.
- Linked order/shipment/payment/movement records remain distinct and are not double-counted.
- Loading, empty, and error states are handled.
- Relevant existing flows receive regression testing.
- Documentation is updated with implementation evidence; design agreement alone does not mark a feature implemented or tested.
