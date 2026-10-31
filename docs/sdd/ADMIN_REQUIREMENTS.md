# VeriLyft Admin Portal — Requirements Inventory and Prioritization

**Last updated:** 31 October 2026  
**Document status:** Owner-approved startup launch-scope baseline; requirement-level verification pending  
**Workstream:** Admin Portal  
**Purpose:** Consolidate the Admin Portal requirements, prioritize them for a startup launch, remove unnecessary enterprise scope, and record what must be decided before detailed design.

This document is a requirements and prioritization baseline. It is not a page design, implementation plan, or claim that any requirement is implemented or tested. Read it alongside `ADMIN_PORTAL.md`, `DECISIONS.md`, and `PROGRESS.md`.

## 1. Prioritization rules

- **P0 — Launch essential:** Required for the launch operations actually selected by VeriLyft, or necessary for security, payment integrity, accurate records, or safe parcel handling.
- **P1 — Add when the operation needs it:** Important for a growing operation, but not a launch blocker if the associated workflow is not yet active.
- **Deferred — Not in the startup scope:** Do not build unless a concrete business, legal, safety, or scale requirement justifies it.
- **Conditional P0:** Essential only if the corresponding operating model is included in the initial launch (for example, staffed PUDO intake or independent parcel booking).

Priority is not the same as implementation status. Existing functionality must be inspected and verified before being marked complete.

## 2. Startup scope assumptions and boundaries

### 2.1 Product and operating model

- VeriLyft's storefront sells VeriLyft's own products. It is not a third-party marketplace.
- Independent individuals and businesses may use VeriLyft to ship parcels without listing products on the storefront.
- A storefront order and a shipment are distinct concepts. An order may link to a shipment; an independent shipment does not require an order.
- Payments are distinct financial records linked to the relevant order or shipment.
- A shipment may have multiple transport movements.
- Payment status and physical shipment status must remain separate.
- Admin Portal pages should reuse the existing Next.js App Router, TypeScript, Firebase/Firestore, Firebase Authentication/Admin, API, component, and styling patterns wherever suitable.
- The Admin Portal is not the full Finance Portal. It provides the operational financial visibility needed by administrators; payroll, detailed accounting, commissions/payouts, and comprehensive financial reporting can remain outside this initial scope.
- No new collection, field, route, domain type, service, or migration should be assumed until repository inspection shows the need and the design is approved.

### 2.2 Explicit startup exclusions unless a concrete need arises

- No separate Government Requests page.
- No enterprise workflow engine or elaborate multi-stage approval platform.
- No advanced route-optimization engine.
- No sophisticated fleet maintenance/telematics system.
- No advanced analytics warehouse or business-intelligence platform.
- No full payroll or enterprise accounting suite inside the Admin Portal.
- No specialized evidence-archive platform when protected existing storage and records can satisfy the need.
- No broad redesign, duplicate styling system, or replacement of working architecture.

### 2.3 Confirmed launch-scope decisions — 28 October 2026

The owner has confirmed the following planning choices. These decisions establish intended launch scope; they do not prove implementation or runtime readiness.

- **Independent shipment booking:** Included alongside storefront order fulfilment. Independent shipments do not require a storefront order.
- **Booking and physical intake:** Both advance booking and staff-created walk-in shipment intake are supported in the planned workflow. Booking is not proof of physical receipt.
- **PUDO locations:** Use one lean location-management page with a location type distinguishing staffed PUDO stations from registered collection centres. Record address/contact, operating hours, supported services, parcel-handling capabilities, and active/inactive status.
- **Collection-centre capability:** Outgoing-parcel acceptance is explicitly configured; it is not automatically assumed for every collection centre.
- **Shipment pricing and payment:** Use one shared hybrid pricing approach for storefront delivery and independent shipments. Support fixed rates where suitable and calculated pricing where required. Support advance online payment and payment at intake, subject to approved service rules.
- **Pricing discrepancies:** Calculate a proposed adjustment from actual intake measurements; require review for material discrepancies or adjustments affecting an existing payment. Preserve the original quote and payment history.
- **Routing:** Use hybrid routing: configured rules propose route legs and authorised Operations staff can review or adjust them. A shipment need not use all three PUDO layers.
- **Transport assignments:** Use a basic provider directory and route-leg assignment history. Operations staff approve assignments; recommendations may be used only where reliable resource data exists.
- **Driver portal:** Deferred. Operations staff manage assignments and record milestones at launch; data and permissions should allow a driver interface later without a redesign.
- **Dispatch and payment:** Verified payment is the default dispatch prerequisite. Any unpaid-dispatch exception must be explicitly authorised, policy-based, and audited; an exception never marks the payment as paid.
- **Delivery evidence:** Support approved flexible proof-of-delivery methods. The exact mandatory method by delivery type remains a policy item to define.
- **Failed delivery:** Use a hybrid workflow: recommend next actions, with Operations reviewing exceptions and approving consequential changes.
- **Startup boundary:** No advanced route optimisation, full fleet-management suite, separate driver application, enterprise workflow engine, or advanced analytics platform is required for the initial release.

Operational requirements previously marked conditional should now be prioritized according to these confirmed choices. Numerical thresholds, detailed service policies, retention periods, and exact status transitions remain unresolved until their respective workflows are specified.


## 3. P0 — Launch-essential requirements

### 3.1 Identity, access, and application integrity

| ID | Requirement | Minimum acceptance outcome |
|---|---|---|
| ADM-R01 | Admin authentication | Existing supported sign-in flows continue to work; sign-out/session expiry are handled clearly. |
| ADM-R02 | Server-side admin authorization | A normal customer cannot access admin pages or privileged APIs by direct URL or direct request. |
| ADM-R03 | Minimum role boundaries | Access to sensitive operations is limited to explicitly authorized staff; customer identity alone never grants admin rights. |
| ADM-R04 | Protected data and actions | Server/API/data boundaries enforce authorization; hiding UI controls alone is insufficient. |
| ADM-R05 | Safe user feedback | Pages provide meaningful loading, empty, validation, success, and error states without exposing secrets or sensitive internals. |
| ADM-R06 | Preserve existing UI and architecture | Existing pages/components/styles/services are inspected and reused; changes stay focused and responsive. |
| ADM-R07 | Audit important privileged actions | Record significant administrative changes, approvals, overrides, and sensitive disclosures with actor, time, action, and target where supported. |
| ADM-R08 | Data integrity | The server remains authoritative for prices, stock, payment state, ownership, and privileged operations. |

### 3.2 Storefront administration

| ID | Requirement | Minimum acceptance outcome |
|---|---|---|
| ADM-R09 | Product administration | Authorized staff can create, view, and update the storefront's own products using existing patterns. |
| ADM-R10 | Category administration | Authorized staff can maintain categories and product associations without corrupting existing records. |
| ADM-R11 | Product availability and stock | Product active/inactive status and stock are represented accurately; public listings do not expose inactive products. |
| ADM-R12 | Product measurements for shipping | Authorized staff can record the product weight/dimensions needed by the approved pricing model; exact units and validation are specified during design. |
| ADM-R13 | Image upload reliability | Authorized uploads validate file type/size, store valid image references, and reject unauthorized requests. Current Cloudinary integration requires verification. |

### 3.3 Orders, payments, and transactions

| ID | Requirement | Minimum acceptance outcome |
|---|---|---|
| ADM-R14 | Order review and management | Staff can inspect an order and its current status and perform only approved order actions. |
| ADM-R15 | Payment status visibility | The UI distinguishes successful, pending, failed, refunded, and other states actually supported by the current payment model. |
| ADM-R16 | Payment investigation | Staff can locate a transaction using available order/payment references and see a clear outcome without treating browser state as proof of payment. |
| ADM-R17 | Payment and order status separation | A payment result does not falsely imply order fulfilment, intake, dispatch, or delivery. |
| ADM-R18 | Refund accountability | Where refunds are supported, the system records the decision, authorization, amount, reference/status, and outcome; do not claim a refund is complete before confirmation. |
| ADM-R19 | Linked record consistency | Orders, shipments, and payments link to the correct records without conflating their IDs or double-counting them. |
| ADM-R20 | Payment/stock regression safety | Existing initialization, verification, webhook, cancellation, retries, duplicate events, late outcomes, and stock restoration receive regression testing before release. |

### 3.4 Shipment operations — P0 for the owner-confirmed parcel launch scope

| ID | Requirement | Minimum acceptance outcome |
|---|---|---|
| ADM-R21 | Shipment record and details | Authorized staff can find a shipment and inspect its sender/receiver, parcel, service, current status, and relevant linked records. |
| ADM-R22 | Unified operational shipment view | Storefront deliveries and independent shipments can be managed coherently, with their source identified; technical representation must be confirmed against the current code before implementation. |
| ADM-R23 | Minimum shipment lifecycle | Approved statuses and permitted transitions cover the actual launch journey without inventing unused states. |
| ADM-R24 | Shipment event/history | Important status changes and movement events are traceable with time and actor/source where available. |
| ADM-R25 | Intake and measurements | If staffed intake is part of launch, staff can record receipt and actual parcel measurements. |
| ADM-R26 | Dispatch and transport handover | If managed digitally at launch, staff can record what was dispatched, its destination/connection, responsible driver or carrier, and handover outcome. |
| ADM-R27 | Delivery/collection completion | The system records the supported completion outcome and minimum necessary proof. |
| ADM-R28 | Basic exceptions | Staff can record and follow up common problems such as delay, failed delivery, damage, or missing parcel. |
| ADM-R29 | Returns | If returns are offered at launch, an authorized, auditable basic return process exists; otherwise document the temporary manual procedure. |

### 3.5 Pricing and price adjustments — P0 for the owner-confirmed delivery launch scope

| ID | Requirement | Minimum acceptance outcome |
|---|---|---|
| ADM-R30 | Shared pricing rules | Storefront delivery and independent shipment booking use one agreed pricing service/rule set where both channels are supported. |
| ADM-R31 | Route-leg pricing | Charges use only the applicable route/transport legs and configured PUDO type/distance/service factors. |
| ADM-R32 | Quote snapshot | The booked quote and the inputs/rates used are preserved; later rate changes do not silently change existing bookings. |
| ADM-R33 | Measurement discrepancy | Where actual measurements are checked, the discrepancy and its effect on price are recorded. |
| ADM-R34 | Price adjustment settlement | Increases, decreases, disputes, top-ups, refunds, and authorized exceptions have an explicit outcome and record. |
| ADM-R35 | Dispatch gate | If the policy requires settlement before dispatch, unpaid adjustments block dispatch unless a permitted, audited exception applies. |

### 3.6 PUDO and transport — P0 for the owner-confirmed network launch scope

| ID | Requirement | Minimum acceptance outcome |
|---|---|---|
| ADM-R36 | PUDO location records | Staff can maintain the locations actually used at launch, with active/inactive status and the minimum operational details. |
| ADM-R37 | Location type distinction | Staffed PUDO stations are distinguished from registered nearby collection centres; permitted actions are explicit. |
| ADM-R38 | Transport connections | If routes are managed digitally, the system records the actual connections between locations without forcing every parcel through a fixed sequence. |
| ADM-R39 | Assignment and dispatch accountability | If transport is managed in-app, assignments and handovers identify the relevant shipment, movement, destination, and responsible party. |
| ADM-R40 | Network overview | Dashboard/network summary reflects real configured locations and operational records; it must not simulate connections, movements, or capacity. |

### 3.7 Dashboard and essential operational visibility

| ID | Requirement | Minimum acceptance outcome |
|---|---|---|
| ADM-R41 | Real-data dashboard | Remove hardcoded demonstration metrics and show only metrics backed by actual records. |
| ADM-R42 | Actionable operational overview | Show the small set of current order/shipment/payment issues that staff need to act on at launch. Exact queues depend on approved lifecycle definitions. |
| ADM-R43 | Financial terminology | Distinguish gross/recorded revenue, payment totals, delivery charges, refunds, balances, and profit; do not label revenue as profit. |
| ADM-R44 | Date range where time-based metrics exist | Provide useful date filtering without incorrectly applying a historical range to current-state operational counts. |
| ADM-R45 | Essential alerts | Surface critical payment, shipment, security, or integration problems where those records exist; advanced notification management is not required for launch. |

### 3.8 Evidence and legal accountability — minimum adequate implementation

| ID | Requirement | Minimum acceptance outcome |
|---|---|---|
| ADM-R46 | Government-request record | If a request is received, record basic authority/reference/date/details, reviewer, decision, and any disclosure. No separate page is required. |
| ADM-R47 | Government-request authorization | Only an authorized person may approve or carry out disclosure; record the decision and action. |
| ADM-R48 | Evidence preservation | Preserve evidence needed for an active dispute, appeal, investigation, or valid retention/legal hold; do not routinely delete it. |
| ADM-R49 | Retention-hold release | A hold is released only through an authorized, recorded decision under the applicable policy. |
| ADM-R50 | Appeal evidence | Relevant payment/refund/dispute evidence can be associated with the case and accessed only by authorized personnel. |
| ADM-R51 | Audit access protection | Audit/evidence records are protected from unauthorized reading or alteration, using existing suitable infrastructure where possible. |

### 3.9 Minimum settings, reports, and notifications

| ID | Requirement | Minimum acceptance outcome |
|---|---|---|
| ADM-R52 | Essential configuration | Only settings required by approved launch workflows are configurable; avoid a generic settings framework. |
| ADM-R53 | Basic operational reporting | Staff can obtain the minimum operational summaries needed to manage the launch; reports use reliable source data and do not double-count linked records. |
| ADM-R54 | Essential notifications | The system surfaces the small set of launch-critical events; no advanced notification rules engine is required. |

## 4. P1 — Add when operations require them

These are not automatic launch blockers. Promote an item to P0 only when the corresponding operation or concrete need is confirmed.

| ID | Requirement | Trigger to promote |
|---|---|---|
| ADM-P01 | Broad global search across all record types | Manual navigation becomes too slow or staff need cross-record investigation regularly. |
| ADM-P02 | Notification centre with read/unread state, resolution history, and deduplication controls | Alert volume makes basic alerts insufficient. |
| ADM-P03 | Custom dashboard defaults and more extensive date filtering | Regular users need saved preferences beyond the basic period filters. |
| ADM-P04 | More detailed transaction reconciliation tools | Provider settlement volume or discrepancies justify a dedicated workflow. |
| ADM-P05 | Dedicated commission and payout oversight | Commission-based agents, drivers, or collection centres are active and need reconciliation. |
| ADM-P06 | Expense capture and route-level cost reporting | Actual operating expenses are consistently recorded and useful cost reports can be produced. |
| ADM-P07 | More advanced reports and scheduled summaries | The team has stable data and recurring reporting needs. |
| ADM-P08 | Rich audit-log filtering and export | Investigation volume requires more than basic protected records and retrieval. |
| ADM-P09 | More granular staff permissions and account administration UI | Team size and responsibilities outgrow the initial small role set. |
| ADM-P10 | Formal appeal case workflow and evidence uploads | Appeal volume or customer commitments justify a dedicated case interface. |
| ADM-P11 | Advanced return-to-sender workflow and configurable liability | Return volume/policies justify a dedicated workflow. |
| ADM-P12 | Configurable retention schedules and archive tooling | Legal/business obligations and record volume require explicit lifecycle management beyond a basic hold/release control. |
| ADM-P13 | Collection-centre performance/capacity reporting | A material network of registered collection centres is operating. |
| ADM-P14 | Fleet records beyond basic assignment | VeriLyft owns or manages enough vehicles to justify fleet administration. |
| ADM-P15 | Rich network bottleneck/capacity analysis | Sufficient operational data exists and the analysis will influence decisions. |

## 5. Deferred — explicitly outside initial startup scope

Do not build these as part of the initial Admin Portal unless a concrete need is approved:

- Advanced automated route optimization or AI-based dispatch.
- Enterprise fleet telematics, maintenance planning, and fuel-management systems.
- A generalized business-process/workflow engine.
- A separate Government Requests portal or elaborate multi-stage government-request workflow.
- A standalone enterprise evidence-archive product with advanced restoration/search automation.
- A full payroll/accounting suite inside Admin Portal.
- Enterprise-grade business intelligence, analytics warehouse, forecasting, and custom report builder.
- Multi-level organization hierarchy and complex policy inheritance.
- Broad automation of all notifications, approvals, returns, and exceptions.
- Any duplicate implementation of existing authentication, orders, payments, data access, UI, or styling.

Deferral is not permission to ignore legal retention, security, or payment obligations. Those obligations must be met using the simplest adequate design.

## 6. Cross-cutting acceptance requirements

Every approved P0 feature must satisfy the applicable requirements below:

1. **Authorization:** protected reads and writes are enforced server-side.
2. **Source of truth:** payment, stock, shipment status, and pricing are not trusted from client input alone.
3. **Consistency:** linked orders, shipments, payments, and movements retain distinct identities and correct relationships.
4. **Traceability:** consequential actions and decisions can be investigated afterward.
5. **Usability:** meaningful loading, empty, validation, success, and error states exist.
6. **UI preservation:** existing components and styling are reused unless an approved requirement justifies a change.
7. **No fabricated data:** dashboard cards, reports, and activity feeds use actual records only.
8. **Verification:** relevant tests are performed and their real results documented.
9. **Minimal implementation:** no new collection, field, route, type, service, dependency, or migration is introduced without repository inspection and a documented need.
10. **Documentation accuracy:** distinguish proposed, approved, implemented, and tested states.

## 7. Stage 1 completion checklist

| Deliverable | Status |
|---|---|
| Consolidated requirement inventory with stable IDs | Drafted in this document |
| P0/P1/deferred startup prioritization | Owner-reviewed and approved in `PLATFORM_REQUIREMENT_PRIORITY_MATRIX.md` (PR #31); this document remains the requirements inventory |
| Startup exclusions and scope boundaries | Drafted in this document |
| Known cross-cutting requirements recorded | Drafted in this document |
| Requirements distinguished from pages/features/implementation | Established |
| Owner-confirmed launch operating model | Recorded in §2.3; detailed policies and implementation still need validation |
| Existing code reconciled against every requirement | Partial — first-pass source audit in `ADMIN_REQUIREMENTS_AUDIT.md`; runtime and broader source checks remain |
| Detailed page/navigation flows | Partial — initial navigation/dashboard design is in `ADMIN_PORTAL.md`; detailed page specifications remain under review |
| Feature and workflow specifications | Not done; later design stage |
| Architecture/API/data mapping | Not done; later design stage |
| Owner approval of the P0/P1/deferred priority baseline | Approved in `PLATFORM_REQUIREMENT_PRIORITY_MATRIX.md` (PR #31); detailed workflow, source, and runtime verification remain separate |

**Stage 1 status: Requirements inventory drafted; the consolidated P0/P1/deferred priority baseline is owner-reviewed and approved in `PLATFORM_REQUIREMENT_PRIORITY_MATRIX.md` (PR #31). Detailed page specifications, source reconciliation, runtime verification, and implementation remain separate open work.**

Do not mark the Admin Portal requirements phase complete solely because priority classification is approved. The first-pass source audit is in `ADMIN_REQUIREMENTS_AUDIT.md`; source/runtime evidence gaps and page-level specifications remain open and must be resolved through the platform-wide SDD and its approval gate.
