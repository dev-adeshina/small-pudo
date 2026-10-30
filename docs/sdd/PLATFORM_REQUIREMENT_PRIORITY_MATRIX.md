# VeriLyft Platform Requirement-Level Launch Priority Matrix

**Status:** Owner-reviewed and merged baseline — not implementation approval or release authorization  
**Date:** 30 October 2026  
**Baseline:** `main` at `c9d9342cfc9dcef2c7d5704074d83927c5f5099c` (PR #30 merged)  
**Authority:** DEC-018 (owner-approved lean launch scope), DEC-022–DEC-035 (accepted policy directions), and DEC-036 (evidence-based launch governance).  
**Related documents:** `DECISIONS.md`, `ADMIN_REQUIREMENTS.md`, `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, `PLATFORM_SHARED_WORKFLOWS.md`, `IMPLEMENTATION_SOURCE_TRACEABILITY.md`, `ISSUES.md`, `PROGRESS.md`.

## 1. Purpose and authority

This document reconciles the existing Admin requirement inventory and the 20 cross-domain acceptance areas into one platform-level launch priority baseline. It does not replace the source requirement definitions or make the conceptual domain draft implementation-ready.

The classification is the owner-reviewed requirement-level priority baseline, merged in PR #31. This approval accepts the priority mapping as the planning baseline; it does not approve the complete SDD, detailed technical contracts, implementation, or release. DEC-036 requires an explicit requirement-level P0/P1/deferred baseline and demonstrable acceptance evidence. No application-code, schema, API, permission, deployment, or runtime change is authorized by this document.

### Priority definitions

- **P0 — Launch blocker:** Required for the DEC-018 launch service, or necessary to protect security, privacy, legal obligations, payment/stock integrity, accurate records, physical custody, safe delivery, or production operation.
- **Conditional P0 — Launch blocker when triggered:** Required before the related feature, location capability, communication channel, legal disclosure, or operational activity is enabled. A conditional P0 must not be silently treated as optional once its trigger occurs.
- **P1 — Post-launch improvement:** Valuable but safely deferrable while a documented manual/lean process remains workable and the deferral does not compromise a P0 obligation.
- **Deferred — Explicitly outside initial scope:** Not to be represented as available at launch. Reconsider only with a concrete owner-approved need.

Priority is independent of implementation and verification status. Every requirement must separately carry:
1. **Design status** — draft, specified, approved.
2. **Source status** — not inspected, source mapped, partial, absent in inspected scope.
3. **Verification status** — not tested, test evidence reported, independently tested, production-like verified.
4. **Release status** — not assessed, blocked, eligible for owner sign-off.

A source file, UI page, successful build, or historical happy-path report is not by itself acceptance evidence.

## 2. Launch scope used for this classification

The P0 baseline covers the lean operating model accepted in DEC-018 and elaborated by DEC-022–DEC-035:

- Existing VeriLyft storefront, catalogue, cart, guest/account checkout, customer account and entitled order access.
- Independent shipment booking by registered authenticated customers.
- Advance shipment booking and staff-created walk-in intake.
- Lean PUDO location records distinguishing staffed stations and registered collection centres, with explicitly configured capabilities.
- Shared hybrid pricing and preserved accepted quotes; actual intake measurements and controlled proposed adjustments.
- Advance online payment and payment-at-intake methods when enabled, with authoritative evidence and reconciliation.
- Hybrid route proposals reviewed by Operations, route-leg assignments, dispatch gate and controlled exceptions.
- Evidence-based custody, movement, delivery, failed-delivery and return/holding outcomes within the actual launch service.
- Minimal hybrid Admin/Operations responsibility model, server-side authorization, least privilege and attributable consequential actions.
- Event-driven customer communications with privacy boundaries; Telegram remains deferred pending its separate trigger/purpose/audience approval.
- Minimum operational visibility, audit/evidence and production operational controls.

A separate Driver Portal, advanced route optimization, full fleet management, enterprise workflow engine, enterprise analytics/warehouse, full payroll/accounting suite, and dedicated Government Requests portal remain deferred under DEC-018 and the existing Admin exclusions.

## 3. Cross-domain priority map

The following classification covers every row in `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md`.

| Matrix ID | Domain | Priority | Launch boundary / condition |
|---|---|---|---|
| A-01 | Public storefront and catalogue | P0 | Accurate active catalogue, server-authoritative price/stock, safe public data exposure. |
| A-02 | Cart and checkout | P0 | Guest and signed-in storefront checkout remain supported; server validates all commercial facts. |
| A-03 | Storefront order lifecycle | P0 | Payment/order/fulfilment separation, cancellation, stock restoration, late/replayed events. |
| A-04 | Customer account and order access | P0 | Customer-scoped access and guest recovery/claiming security under DEC-035. |
| A-05 | Independent shipment booking | P0 | Registered authenticated customers only; booking and physical intake remain distinct. |
| A-06 | Shared pricing and quote acceptance | P0 | Shared rules for supported channels; preserve quote inputs/rate context; no silent repricing. |
| A-07 | Payment initialization and confirmation | P0 | Authoritative provider verification, amount/currency/reference checks, replay safety. |
| A-08 | Refunds, adjustments and reconciliation | P0 | Minimum supported financial events, approval boundaries, traceability and reconciliation; not a full Finance Portal. |
| A-09 | Physical intake, measurement and custody | P0 | Advance and walk-in intake; capability-authorized custody and evidence. |
| A-10 | Location and service capability | P0 | Lean location model and explicit capability configuration before a location performs that service. |
| A-11 | Routing and route proposals | P0 | Hybrid proposal/review/assignment for the launch network; no advanced optimization. |
| A-12 | Dispatch, movement and handover | P0 | Authorized dispatch, route-leg assignment and attributable physical movement/handover evidence. |
| A-13 | Delivery attempt and outcome | P0 | Flexible approved proof, failed-delivery resolution and controlled return/collection outcomes. |
| A-14 | Notifications and Telegram | P0 / Conditional P0 | Minimum event-driven email/communications and privacy controls are P0; each optional channel is conditional on activation. Telegram is deferred until DEC-034's Admin “Assign For Delivery” trigger and separate policy are approved. |
| A-15 | Admin and Operations access | P0 | Every privileged page/API/action enforces server-side authorization and least privilege. |
| A-16 | Audit and evidence | P0 | Minimum attributable records, protected access, correction and legal-hold safeguards. |
| A-17 | Support, exceptions and manual override | P0 | Only defined launch exceptions; explicit permission, reason, approval where required, and traceable outcome. |
| A-18 | Operational dashboard and reporting | P0 | Small accurate operational view with reproducible metrics; no fabricated/demo data. Advanced reporting is P1. |
| A-19 | Customer communications and privacy | P0 | Correct recipient entitlement, minimum disclosure, consent/configuration and safe failure handling. |
| A-20 | Production configuration and operational readiness | P0 | Release-blocking production configuration, security, monitoring, backup/restore, incident and rollback evidence. |

**Conditionality rule:** A P0 capability must be specified and verified before enabling the corresponding operation. If a service, location capability, payment method, delivery channel, or legal disclosure path is not enabled at launch, its feature-specific operational details may remain conditional; the platform must still prevent unauthorized use and must not imply that the capability is available.

## 4. Admin requirement reconciliation

The stable `ADM-R01`–`ADM-R54` identifiers are retained from `ADMIN_REQUIREMENTS.md`. The descriptions and detailed acceptance outcomes remain in that source document; this table changes only their proposed platform launch priority and explains the boundary.

| Requirement | Proposed priority | Cross-domain mapping | Qualification |
|---|---|---|---|
| ADM-R01 Admin authentication | P0 | A-15 | Supported staff sign-in/session handling. |
| ADM-R02 Server-side admin authorization | P0 | A-15 | Direct navigation and direct API requests must both be denied when unauthorized. |
| ADM-R03 Minimum role boundaries | P0 | A-15, A-17 | Minimal hybrid responsibility model; action-level permission detail remains to specify. |
| ADM-R04 Protected data and actions | P0 | A-15, A-19 | Server/API/data boundaries, not UI visibility. |
| ADM-R05 Safe user feedback | P0 | A-01–A-20 | Applicable to every enabled launch workflow; errors must not leak secrets. |
| ADM-R06 Preserve existing UI and architecture | P0 | Cross-cutting | Implementation constraint; reuse existing patterns and prove need before adding architecture. |
| ADM-R07 Audit important privileged actions | P0 | A-08–A-17, A-20 | Minimum audit coverage for consequential actions, approvals, overrides and disclosure. |
| ADM-R08 Data integrity | P0 | A-01–A-13 | Server authority for prices, stock, payment, ownership and privileged operations. |
| ADM-R09 Product administration | P0 | A-01 | Storefront catalogue is in the launch scope. |
| ADM-R10 Category administration | P0 | A-01 | Required to maintain the storefront catalogue. |
| ADM-R11 Product availability and stock | P0 | A-01–A-03 | Active state and stock must be correct at display and purchase. |
| ADM-R12 Product measurements for shipping | Conditional P0 | A-06, A-09 | Required for products/services whose approved pricing uses product weight/dimensions; define units and validation before enabling calculation. |
| ADM-R13 Image upload reliability | P0 | A-01, A-15, A-20 | Existing catalogue images and admin upload security; Cloudinary runtime verification remains outstanding. |
| ADM-R14 Order review and management | P0 | A-03, A-15 | Core storefront order operations. |
| ADM-R15 Payment status visibility | P0 | A-07, A-08 | Show only supported, authoritative states; do not conflate payment and fulfilment. |
| ADM-R16 Payment investigation | P0 | A-07, A-08 | Minimum reference-based investigation and mismatch visibility. |
| ADM-R17 Payment and order status separation | P0 | A-03, A-07 | Required invariant. |
| ADM-R18 Refund accountability | P0 | A-08 | For any refund method enabled; request, approval, execution and provider outcome remain distinct. |
| ADM-R19 Linked record consistency | P0 | A-03, A-05–A-08 | Correct order/shipment/payment identities and links. |
| ADM-R20 Payment/stock regression safety | P0 | A-02, A-03, A-07, A-08 | Required before release, including retries, duplicates, late outcomes and restoration. |
| ADM-R21 Shipment record and details | P0 | A-05, A-09–A-13 | Shipment operational view for owner-approved parcel service. |
| ADM-R22 Unified operational shipment view | P0 | A-03, A-05, A-09–A-13 | Coherent view of storefront deliveries and independent shipments without conflating their identities. |
| ADM-R23 Minimum shipment lifecycle | P0 | A-03, A-05, A-09–A-13 | Allowed transitions, guards, actors and rejection paths must be specified. |
| ADM-R24 Shipment event/history | P0 | A-09, A-11–A-17 | Consequential status, custody and movement history must be attributable. |
| ADM-R25 Intake and measurements | P0 | A-05, A-06, A-09, A-10 | Advance and staff-created walk-in intake are confirmed launch scope. |
| ADM-R26 Dispatch and transport handover | P0 | A-11, A-12 | Required for digitally managed launch transport; distinguish assignment from physical handover. |
| ADM-R27 Delivery/collection completion | P0 | A-13 | Flexible approved proof and authority verification. |
| ADM-R28 Basic exceptions | P0 | A-09, A-12, A-13, A-17 | Delay, failed delivery, damage, missing parcel and disputed custody need controlled outcomes. |
| ADM-R29 Returns | Conditional P0 | A-13, A-17 | A controlled basic return/holding path is required if returns are offered; otherwise document and approve the manual process and customer promise. |
| ADM-R30 Shared pricing rules | P0 | A-06 | Shared storefront/independent-shipment pricing is confirmed. |
| ADM-R31 Route-leg pricing | P0 | A-06, A-11 | Apply only relevant route/service factors; exact formula remains open. |
| ADM-R32 Quote snapshot | P0 | A-06, A-07 | Preserve accepted inputs, itemized charges, currency and rule/effective context. |
| ADM-R33 Measurement discrepancy | P0 | A-06, A-09 | Record actual measurements and proposed difference; threshold/units remain open. |
| ADM-R34 Price adjustment settlement | P0 | A-06–A-08 | Supported increases/decreases/disputes/top-ups/refunds must be explicit financial events, not generic notes. |
| ADM-R35 Dispatch gate | P0 | A-07, A-08, A-12, A-17 | Verified payment default; exception requires explicit permission, approved policy, reason and audit. |
| ADM-R36 PUDO location records | P0 | A-09, A-10 | Lean location management for launch locations. |
| ADM-R37 Location type distinction | P0 | A-09, A-10 | Staffed station vs registered collection centre; capabilities not inferred from label. |
| ADM-R38 Transport connections | P0 | A-11, A-12 | Basic configured connections for the launch network; no mandatory three-layer route. |
| ADM-R39 Assignment and dispatch accountability | P0 | A-11, A-12 | Operations-managed route-leg assignments and attributable handovers. |
| ADM-R40 Network overview | P1 | A-10–A-12, A-18 | A live network map/overview is not required if launch operations can use accurate location and assignment records; promote only if it is operationally necessary. |
| ADM-R41 Real-data dashboard | P0 | A-18 | No hardcoded demonstration values represented as live data. |
| ADM-R42 Actionable operational overview | P0 | A-18 | Minimum launch queues/issues for staff action; exact metrics and definitions remain open. |
| ADM-R43 Financial terminology | P0 | A-08, A-18 | Never label revenue/collections as profit; distinguish financial concepts shown at launch. |
| ADM-R44 Date range where time-based metrics exist | P1 | A-18 | Basic date filtering is useful but may follow if current-state and launch-critical views remain accurate. |
| ADM-R45 Essential alerts | P0 | A-07, A-12, A-15, A-18, A-20 | Surface critical payment, shipment, security and integration failures that exist in enabled workflows. |
| ADM-R46 Government-request record | Conditional P0 | A-16, A-19 | No dedicated page; if a request is received, preserve the basic request/review/disclosure record. |
| ADM-R47 Government-request authorization | Conditional P0 | A-15, A-16, A-19 | No disclosure without authorized review and recorded decision. |
| ADM-R48 Evidence preservation | P0 | A-16 | Preserve evidence for active disputes, appeals, investigations and valid holds. |
| ADM-R49 Retention-hold release | Conditional P0 | A-16 | If a hold exists, release only through authorized recorded decision; routine deletion must respect holds. |
| ADM-R50 Appeal evidence | Conditional P0 | A-08, A-16 | If an appeal/dispute occurs, preserve relevant payment/refund evidence and restrict access. No dedicated case workflow required. |
| ADM-R51 Audit access protection | P0 | A-15, A-16 | Restrict audit/evidence reads and alterations; admin status alone is not blanket access. |
| ADM-R52 Essential configuration | P0 | A-10, A-14, A-20 | Only settings needed by enabled launch workflows; no generic settings framework. |
| ADM-R53 Basic operational reporting | P1 | A-18 | P0 operational dashboard/alerts remain required; broader report generation can follow while staff can obtain necessary operational facts. |
| ADM-R54 Essential notifications | P0 | A-14, A-19 | Minimum event-driven notifications and privacy boundaries; no advanced rules engine. |

### 4.1 P1 Admin requirements

The following existing P1 requirements remain P1. Their promotion triggers in `ADMIN_REQUIREMENTS.md` remain applicable:

| Requirement | P1 scope |
|---|---|
| ADM-P01 | Broad global search across all record types |
| ADM-P02 | Full notification centre with read/unread and resolution controls |
| ADM-P03 | Custom dashboard defaults and extensive date filtering |
| ADM-P04 | More detailed transaction reconciliation tools beyond minimum exception/reconciliation controls |
| ADM-P05 | Dedicated commission and payout oversight |
| ADM-P06 | Expense capture and route-level cost reporting |
| ADM-P07 | Advanced reports and scheduled summaries |
| ADM-P08 | Rich audit-log filtering and export |
| ADM-P09 | More granular staff permissions and account-administration UI beyond the approved minimum |
| ADM-P10 | Formal appeal case workflow and evidence-upload interface |
| ADM-P11 | Advanced return-to-sender workflow and configurable liability |
| ADM-P12 | Configurable retention schedules and archive tooling beyond minimum retention/hold controls |
| ADM-P13 | Collection-centre performance/capacity reporting |
| ADM-P14 | Fleet records beyond basic assignment |
| ADM-P15 | Rich network bottleneck/capacity analysis |

P1 does not permit deferring the minimum control beneath a richer feature. For example, ADM-P08 may defer rich audit filtering/export, but not P0 audit evidence or protected audit access.

## 5. Explicit deferred scope

The following remain deferred for the initial release, consistent with DEC-018 and the existing Admin inventory:

- Separate Driver Portal or driver self-service application.
- Advanced automated/AI route optimization.
- Full fleet management, telematics, maintenance and fuel-management systems.
- Enterprise workflow engine or elaborate multi-stage approval platform.
- Advanced analytics warehouse, forecasting or custom BI/report builder.
- Full payroll, enterprise accounting, commissions/payouts suite.
- Dedicated Government Requests portal or elaborate government-request workflow.
- Standalone enterprise evidence archive where existing protected records suffice.
- Broad automation of all notifications, approvals, returns and exceptions.
- Multi-level organization hierarchy and complex policy inheritance.
- Any duplicate implementation of existing authentication, order, payment, data-access, UI or styling systems.

Deferral never removes a legal, safety, privacy, security, financial-integrity or evidence-preservation obligation. A minimum adequate control remains P0 or Conditional P0 as classified above.

## 6. Priority dependencies and unresolved specification

The priority baseline does not fill in detailed business rules. The following remain design gates for affected P0 workflows:

1. **Staff permissions and approvals (DEC-022, DEC-025):** action-level Admin/Operations permissions, location capabilities, partner access, financial limits, sensitive disclosure, dispatch exceptions and second-person approval cases.
2. **Booking parties and access (DEC-023, DEC-024):** identity/verification checkpoints, sender/receiver consent, payer visibility, change authority by type/stage, collection authority and booking-to-shipment creation point.
3. **Pricing and settlement (DEC-026–DEC-029):** units, formulae, distance source/bands, service mapping, rounding, taxes/fees/discounts, effective dates, quote expiry, adjustment thresholds, consent, refund/credit limits, late-payment handling and reconciliation ownership.
4. **Physical operations (DEC-025, DEC-028, DEC-030–DEC-032):** location capability assignment, intake/measurement proof, custody evidence, collection verification, route constraints/capacity, mandatory movement/delivery evidence, failed-delivery and return authority.
5. **Guest-order recovery (DEC-035):** challenge format/lifetime, rate limits, credential rotation/revocation, eligibility, support exception procedure and cross-account/replay tests.
6. **Notifications (DEC-034):** event/channel/recipient/field matrix, consent, contact verification, retries, deduplication, retention and persistent-failure ownership. Telegram trigger/purpose/audience approval remains a separate gate.
7. **Audit/evidence (DEC-033):** event catalogue, retention periods, reviewer permissions, correction/redaction, deletion/anonymization, legal-hold authority, integrity and disclosure workflow.
8. **Production readiness (DEC-036):** production-like environment definition, release checklist, blocker ownership/exception authority, deployment/rollback, backup/restore, monitoring/alert thresholds, incident response and final sign-off.
9. **Technical contracts:** conceptual relationships, source reuse, API request/response contracts, server authorization, idempotency, compatibility and migration questions must be reconciled against the active source before implementation.

These are detailed specification/evidence tasks under accepted high-level decisions, not a reopening of D-01–D-15.

## 7. Requirement-to-evidence status rules

For every P0 and Conditional P0 requirement, the later acceptance/evidence register must identify:

- Requirement ID and linked A-xx workflow.
- Accepted policy/decision reference.
- Responsible actor and permission boundary.
- Preconditions, allowed transition, rejection/denial path and unchanged data.
- Normal success, failure, duplicate/replay, concurrency and out-of-order cases where relevant.
- Privacy/security and data-integrity assertions.
- Audit/evidence artifact and where it is obtained.
- Source paths inspected and source baseline SHA.
- Test environment, test date, test result and reproducibility notes.
- Production-like configuration/deployment evidence where required.
- Outstanding issue/blocker and accountable owner.
- Owner acceptance status.

Until those are supplied, the requirement remains **not verified** and cannot be counted as release-ready. Conditional P0 requirements must be proven before their trigger/capability is enabled.

## 8. Current evidence position

This priority reconciliation is based on the SDD and the read-only source-traceability inventory. PR #32 refreshed the active-source inspection at `e0f69055d33dd9399c23e1d793f359468229c856` (PR #31 merge). The repository comparison from the earlier source snapshot through PR #39 contains documentation changes only, so this remains the current inspected application-source baseline. It does not establish runtime behaviour or replace a future source inspection after any application-code change.

This work did **not** independently:
- inspect the current application source at the new main head;
- inspect production Firestore data or deployed configuration;
- run browser, API, integration, load, security or end-to-end tests;
- verify Paystack, Cloudinary, email/SMS or other provider credentials;
- prove backup/restore, monitoring, incident response or rollback;
- approve any unresolved workflow policy or implementation design.

Therefore, no requirement is upgraded to implemented, tested, production-verified or launch-approved by this matrix. Existing source and previously reported test results retain the limitations and attribution recorded in `IMPLEMENTATION_SOURCE_TRACEABILITY.md`, `ISSUES.md` and `PROGRESS.md`.

## 9. Review and approval checklist

- [x] Owner accepts the classification of all 20 cross-domain areas (PR #31 owner-reviewed and merged).
- [x] Owner accepts the ADM-R01–ADM-R54 priority reconciliation, including the P1/Conditional P0 adjustments (PR #31 owner-reviewed and merged).
- [x] Owner confirms the lean/manual launch boundary for P1 and non-enabled conditional capabilities through the merged priority baseline.
- [ ] Every P0 and Conditional P0 has an approved detailed specification and executable acceptance scenario.
- [x] Requirement-to-source mapping is refreshed at the inspected application-source baseline `e0f69055`; later merges through PR #39 are documentation-only.
- [ ] Required runtime and production-like evidence is linked to each acceptance criterion.
- [ ] All release blockers, owners and approved exceptions are explicit.
- [ ] The complete platform SDD is reconciled and explicitly approved before application-code changes resume.

**Current status:** Owner-reviewed and merged requirement-level priority baseline (PR #31). Detailed P0 specifications, runtime/production evidence, blocker ownership, and complete platform-wide SDD approval remain open. This is not implementation authorization or launch-readiness approval.
