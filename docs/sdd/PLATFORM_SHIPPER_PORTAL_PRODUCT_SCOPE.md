# Shipper Portal — Product Scope and Delivery Plan

**Status:** Product workstream explicitly included in the implementation roadmap; this document is a scope boundary, not a UI specification, API contract, persistence design, or new business-policy approval.  
**Date:** 1 November 2026  
**Authority:** DEC-037, DEC-038, DEC-043; BP-01–BP-22; DEC-036 release requirements.  
**Execution pointer:** `PLATFORM_CONSOLIDATED_IMPLEMENTATION_BACKLOG.md`.

## 1. Product outcome

VeriLyft must provide a customer-facing shipper experience for independent shipment booking and management. The existing customer account and shipment-draft page are only the foundation; they are not a completed shipper portal.

The portal's purpose is to let an eligible registered customer, acting as the booking party, prepare and manage shipments through the capabilities that the platform has actually enabled. It must present trustworthy shipment information and actions without implying that a draft is a booking, a quote is a payment, a payment is physical intake, or a dispatch event is a custody transfer.

The storefront remains a separate, secondary product journey. Storefront orders must not be treated as independent shipments.

## 2. Intended customer journey

The eventual shipper experience is expected to cover these stages, as each underlying capability becomes approved, implemented and verified:

1. **Account and access** — authenticated, registered customer access; the booking party's authority and any permitted delegated access follow BP-01–BP-22.
2. **Prepare shipment** — create, review, save and manage a customer-owned draft using only approved booking concepts.
3. **Select an eligible service** — show only services available for the relevant journey and supported by approved service/location capabilities.
4. **Receive and review a quotation** — present a server-calculated quote with its applicable inputs, charge components, currency, rule/version and validity information once those rules are approved.
5. **Accept and confirm** — require the authenticated booking party's explicit acceptance of a valid quote before a booking can be confirmed.
6. **Pay** — present and reconcile payment using approved payment methods and the authoritative payment state.
7. **Follow shipment progress** — show customer-entitled status and history based on authoritative operational facts, not inferred movement or custody.
8. **Manage permitted changes and exceptions** — expose only booking-party or properly delegated actions allowed by accepted policy, including applicable amendment, cancellation, collection and dispute processes.
9. **Receive notifications and support** — disclose only information and actions permitted for each party and communication channel.

These stages are a product journey, not authorization to enable every stage immediately. Quotation and booking confirmation remain gated by approved pricing inputs/formula, charge components, currency, rounding, rule version, quote validity and handover deadline. Payment, intake, custody, dispatch, delivery, exceptions and disclosure remain subject to their respective accepted policies and release evidence.

## 3. Party and authority boundaries

The portal must preserve the distinctions already accepted in BP-01–BP-22:

- **Booking party:** the customer authority holder for the independent shipment, subject to the accepted policy.
- **Sender:** a distinct shipment party; being named as sender does not automatically make that person the booking party.
- **Receiver / collection recipient:** a distinct party with only the collection or information entitlements accepted by policy.
- **Payer:** payment information does not grant unrestricted access to shipment details or booking control.
- **Physical handover person:** the person who physically presents the parcel; that fact does not automatically confer booking authority.
- **Delegate / representative:** access or action is limited to the authority actually granted and permitted by policy.
- **Support, Admin, Operations and Finance:** staff actions remain governed by their separate responsibilities and permissions.

Only registered, authenticated customers may create independent shipment bookings at launch. This does not mean every party needs a separate portal. The initial product direction is one customer-facing shipper experience with policy-governed access; whether separate sender/receiver-facing surfaces are ever needed remains undecided and must not be assumed.

## 4. Current foundation versus target experience

### Present foundation (source-reviewed)

- Customer account entry exists.
- `/account/shipments` provides shipment-draft creation, listing and editing.
- Draft API routes enforce verified-customer authentication and customer ownership.
- Drafts are stored under the owning user's shipment-draft subcollection.
- Draft preparation does not itself create a confirmed booking, quote, payment obligation or custody event.
- Firestore client rules deny direct client access to shipment drafts; the server routes use the Admin SDK.

This is a source-level description of the reviewed paths, not a claim of current production runtime verification.

### Not yet established as a complete portal

- A complete shipment dashboard and customer shipment detail experience.
- Approved eligible-service discovery and selection.
- Shipment quotation, quote history/revision and explicit quote acceptance.
- Independent shipment booking confirmation.
- Shipment payment and financial-event presentation.
- Authoritative shipment timeline and party-specific visibility.
- Policy-governed amendment, cancellation, collection, delegated access, disputes and exception journeys.
- Customer notification preferences and role-aware communications.

Do not mark these capabilities complete merely because navigation, placeholder UI, draft fields or an API shell exists.

## 5. Delivery plan and dependencies

| Work item | Outcome | Dependency / gate |
|---|---|---|
| **M1.1 — Draft foundation hardening** | Consistent authentication handling, safe concurrent draft updates, resilient UI failure/retry behaviour, draft-specific automated tests and corrected source traceability. | Existing approved draft scope; no new business fields or lifecycle states. |
| **M1.2 — Shipper journey and portal experience definition** | Map the end-to-end customer journey, page/surface responsibilities, role-based visibility, action boundaries, empty/loading/error states and acceptance scenarios against accepted policy. | BP-01–BP-22 and relevant DEC decisions; unresolved authority or disclosure questions remain open. |
| **M1.3 — Portal foundation delivery** | Evolve existing account and shipment-draft surfaces into a coherent customer shipment workspace for capabilities that are actually available. | M1.1 and M1.2; reuse existing App Router, Firebase and UI patterns. No parallel architecture. |
| **M2 — Service pricing and quotation** | Trusted server pricing, quote snapshots/revisions and explicit booking-party acceptance. | Approved service rates, inputs, units, conversions, formula, charge components, rounding, currency, rule version, validity and handover deadline. |
| **M3 — Payment and financial events** | Payment journey and customer-visible financial state. | Approved payment, settlement, refund/credit/reversal and reconciliation rules. |
| **M4–M5 — Intake, custody, movement and delivery** | Accurate customer-visible operational progress. | Location capability, actor authority, physical possession and evidence policies. A route or dispatch action is not a completed custody transfer. |
| **M6–M7 — Authority, exceptions and communications** | Delegated actions, support/dispute journeys, audit/evidence and role-aware notifications. | Approved staff permissions, party entitlements, disclosure, evidence and communication rules. |
| **M8 — Release evidence** | Demonstrated production and operational readiness. | DEC-036 P0/Conditional P0 acceptance and release evidence. |

The sequence does not require waiting to design the customer journey until every backend capability exists. The journey can be mapped now, while unavailable stages are clearly marked as gated and not offered as active actions.

## 6. Experience principles

- Make the distinction between draft, quote, confirmed booking, payment, physical intake, custody and delivery understandable to the customer.
- Show only facts supported by authoritative records and the customer's entitlement.
- Do not promise a service, price, deadline, collection option or delivery outcome that has not been approved and enabled.
- Explain why an action is unavailable without exposing internal controls or another party's private information.
- Preserve the existing application architecture and visual conventions; implement in small, reviewable increments.
- Design accessible loading, empty, validation, success, failure and retry states.
- Do not use storefront order status as a substitute for independent shipment lifecycle.

## 7. Acceptance boundary

The portal workstream is **defined at product-scope level only**. Detailed page specifications, interaction design, route/API contracts, persisted fields, status enums, role-permission assignments and test cases must be derived from accepted policy and reviewed before implementation. This document creates none of those technical approvals.

A portal stage is complete only when its policy, source implementation, tests, runtime/deployment evidence and applicable DEC-036 release requirements are recorded separately. A visually complete customer journey does not make a gated backend capability operational or launch-ready.
