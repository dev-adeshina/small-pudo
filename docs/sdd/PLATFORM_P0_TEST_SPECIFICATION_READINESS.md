# P0 and Conditional P0 Test-Specification Readiness Assessment

**Document status:** Reconciled readiness/navigation baseline — decision crosswalk merged in PR #58; not approval of executable specifications, test execution or release  
**Prepared:** 31 October 2026  
**Documentation repository baseline:** `main` at PR #70 merge `ad6189a598d3fcbb79c90679a7dac33914ea0474`  
**Active application-source inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856` (refreshed in PR #32)  
**Inputs:** `PLATFORM_REQUIREMENT_PRIORITY_MATRIX.md`, `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md`, `PLATFORM_REQUIREMENT_DEPENDENCY_TRACEABILITY.md`, `IMPLEMENTATION_SOURCE_TRACEABILITY.md`, `ISSUES.md`, and accepted DEC/PM/BP policy records.

## 1. Executive conclusion

**No P0 or Conditional P0 requirement is currently approved for acceptance-test execution.** The catalogue contains 20 owner-approved A-area scenario outlines and 80 case rows (A01-01 through A20-05). Those are test-design inputs, not executable test specifications. The required case-record template and evidence conventions exist, but there are no approved, case-by-case execution packages or current runtime results in this assessment.

The priority matrix contains:
- **45 P0 Admin requirements**;
- **6 Conditional P0 Admin requirements**;
- **3 P1 Admin requirements** (ADM-R40, ADM-R44 and ADM-R53), which are outside this P0 readiness assessment.

Thus, **51 P0/Conditional P0 Admin requirements remain not verified for acceptance**. This is not a claim that every current storefront capability is absent: some source exists and can support narrowly scoped regression-test drafting. It means source presence and earlier reported tests do not substitute for current, reproducible, owner-approved acceptance specifications and evidence.

### Readiness summary

| Measure | Current position |
|---|---|
| Owner-approved A-area scenario outlines | 20 / 20 |
| Scenario case rows in catalogue | 80 |
| P0 Admin requirements | 45 |
| Conditional P0 Admin requirements | 6 |
| P0/Conditional P0 requirements approved for execution | 0 / 51 |
| A-areas with some relevant source in the inspected baseline | A-01–A-04, A-07 and limited A-14/A-15 surfaces |
| A-areas blocked by missing capability or material contract | A-05–A-06, A-08–A-13, A-16–A-20, plus unresolved parts of A-14/A-15 |
| Runtime/production evidence established by this assessment | None newly established |

**Interpretation:** A test specification may be drafted for an existing source-backed slice while the wider A-area remains blocked. Such a narrow specification must state its scope and must not imply that an absent shipment, finance, audit, reporting or production capability has passed.

## 2. Assessment method and evidence limits

Each requirement was assessed against:
1. its owner-approved priority and A-area links;
2. the corresponding scenario outline and required evidence;
3. accepted policy dependencies and unresolved technical/operational inputs;
4. the active source-inspection summary at `e0f69055d33dd9399c23e1d793f359468229c856`;
5. whether the required capability exists sufficiently to define a meaningful, reproducible test.

Readiness labels:

| Label | Meaning |
|---|---|
| **PARTIAL — scoped specification candidate** | Relevant source exists. A narrow regression specification can be drafted, but unresolved contracts or missing adjacent capabilities prevent full A-area acceptance. |
| **BLOCKED — capability absent** | The inspected source inventory found no active implementation for the required capability. A test cannot prove a missing capability; specification/design and implementation gates remain. |
| **BLOCKED — policy/contract input** | The high-level policy is accepted, but a necessary numeric, operational, actor, lifecycle, API, evidence or exception rule is not yet defined. |
| **CONDITIONAL — activation gate** | The requirement becomes mandatory when its recorded trigger occurs. It must be specified and proven before enabling the trigger; otherwise the approved manual fallback or disabled state must be documented. |
| **P1 — excluded from this gate** | Requirement remains P1 and is not silently promoted to P0. |

This assessment is a documentation review. It did not inspect the live application at a new source commit, execute tests, inspect deployed Firebase/Cloudinary/Paystack configuration, access production data, or validate physical operations. The active source baseline remains the one recorded above. The repository comparison from that source-inspection commit through PR #66 reports SDD documentation paths only; this history comparison does not constitute a fresh semantic source review or runtime verification.

## 3. A-area readiness (A-01–A-20)

The catalogue's 80 cases remain scenario outlines. This table identifies whether detailed test-specification drafting can proceed against existing source, or whether a missing capability/contract blocks meaningful acceptance.

| Area | Cases | Requirement links | Readiness assessment | Specification work still required |
|---|---:|---|---|---|
| A-01 | 4 | ADM-R04–R13 | PARTIAL — existing storefront/catalogue source; category-count relationship mismatch and runtime authorization/visibility evidence remain. Draft narrow catalogue regression specs; do not sign off complete A-01. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-02 | 4 | ADM-R08, R11, R17, R19, R20 | PARTIAL — server-side storefront order creation and transactional stock reservation exist. Idempotency and failure-boundary contracts must be made explicit before executable cases. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-03 | 4 | ADM-R14–R20, R35 | PARTIAL — storefront order/payment states exist, but the complete transition table, late-payment disposition and DEC-030 exception contract remain open. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-04 | 4 | ADM-R01–R04, R14, R19; DEC-035 | PARTIAL — authenticated account/order access and guest tracking credential exist. Guest recovery/claim challenge contract is absent; A04-03/A04-04 blocked. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-05 | 4 | ADM-R21–R24, R28, R30–R32, R36–R39; DEC-037–038 | BLOCKED — no independent shipment booking source; booking-party, change-authority and party-entitlement contracts need operational detail. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-06 | 4 | ADM-R30–R34; DEC-026–027, DEC-038–040 | BLOCKED — no shared shipment pricing/quote service; formulas, rate inputs/versioning, units, rounding, expiry and adjustments remain unspecified. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-07 | 4 | ADM-R15–R17, R20; DEC-028–029 | PARTIAL — Paystack initialize/verify/webhook source exists; provider/local failure recovery and full payment regression evidence remain outstanding. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-08 | 4 | ADM-R16–R20, R34; DEC-022, DEC-029, DEC-039–041 | BLOCKED — no complete refund/credit/reversal/reconciliation service; finance approvals and financial-event contracts incomplete. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-09 | 4 | ADM-R21, R23–R28, R33, R36–R37; DEC-025, DEC-027–028, DEC-037, DEC-039–040, DEC-042–044 | BLOCKED — no intake/custody source; location capability, measurement units/thresholds and physical evidence contracts incomplete. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-10 | 3 | ADM-R36–R38, R52; DEC-025, DEC-037, DEC-042–043 | BLOCKED — no active location/capability management source; capability catalogue and assignment rules need specification. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-11 | 4 | ADM-R38–R40; DEC-031, DEC-037, DEC-043 | BLOCKED — no route proposal/connection/assignment source; route inputs, capacity, stale proposal and approval contracts incomplete. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-12 | 4 | ADM-R23–R28, R35, R38–R39; DEC-030–031, DEC-037, DEC-041–044 | BLOCKED — no dispatch/movement/handover source; physical actor/recorder, holds, handover evidence and exception rules incomplete. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-13 | 4 | ADM-R23–R29; DEC-032, DEC-037, DEC-044 | BLOCKED — no approved delivery proof/collection/return source; recipient authority and failed-delivery/return outcomes incomplete. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-14 | 4 | ADM-R54; DEC-024, DEC-032, DEC-034 | PARTIAL / CONDITIONAL — guest tracking email source exists, but general event-recipient-channel-field matrix and retry/failure ownership are absent. Telegram remains separately gated and disabled until its policy is approved. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-15 | 4 | ADM-R01–R04, R07, R51; DEC-022, DEC-025, DEC-030–033, DEC-037–038, DEC-042–044 | PARTIAL — authentication and broad Admin allowlist/custom-claim checks exist; action-level permissions, scope, location capability and complete authorization matrix are absent. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-16 | 4 | ADM-R07, R24, R48–R51; DEC-022, DEC-033, DEC-042, DEC-044; PM-08 | BLOCKED — no general audit/evidence service or retention/hold workflow is established in the inspected source; VLY-023 remains open. Accepted policy explicitly separates audit viewing, exporting and external-disclosure approval. | Specify event/evidence coverage, reviewer-to-permission mapping, source attribution, original/correction integrity, retention/legal-hold authority, disclosure approvals and case-level execution evidence. Preserve the distinction between this policy reconciliation and absent/unverified implementation. |
| A-17 | 4 | ADM-R07, R18, R28–R35, R46–R50; DEC-022, DEC-029–033, DEC-037, DEC-040–044 | BLOCKED — no complete exception catalogue/workflow; requester/approver separation, Support scope and controlled corrections need implementable contracts. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-18 | 4 | ADM-R41–R43, R45; ADM-R40/R44/R53 are P1 under the priority matrix where applicable. | BLOCKED — current Admin dashboard uses demo metrics; metric dictionary/source/calculation/freshness and role visibility are not established. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-19 | 4 | ADM-R04, R14–R19, R54; DEC-024, DEC-032–034, DEC-038, DEC-040, DEC-044 | BLOCKED — party-specific data entitlement, contact verification/consent and disclosure matrix are not implemented/verified. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |
| A-20 | 5 | ADM-R01–R04, R13, R20, R45, R48–R52, R54; DEC-036 | BLOCKED — production configuration, backup/restore, monitoring, incident/rollback and dated release evidence are not established. | Convert each outline into a case record with preconditions, actor/permission, exact action, expected state and non-state changes, replay/failure behavior, evidence source, cleanup and reviewer. Resolve the area-specific gates in Section 5 before marking executable. |


### 3.1 Accepted logistics-policy impact — DEC-037–DEC-044

PR #57 reconciles the existing requirement dependency register and owner-approved priority matrix with DEC-037–DEC-044. This section carries that policy trace into test-specification readiness. It does not change the 80 scenario rows, priority classifications, source findings, or readiness outcome.

| Decision | Existing case families to carry into detailed specifications | Readiness implication |
|---|---|---|
| DEC-037 — Logistics-first hierarchy/shared fulfilment | A03-01; A05-01–A05-04; A09–A13 | Treat independent shipment and shared fulfilment as core launch scope. Storefront order, independent shipment and transport movement must remain distinct in fixtures, assertions and evidence. |
| DEC-038 — Booking confirmation/responsibility | A05-01–A05-04; A06-02–A06-03; A19-01/A19-03 | Specify authenticated booking-party acceptance, party relationships, payer's default receipt-only access, service information and handover-deadline communication. Payment and physical intake are separate. |
| DEC-039 — Service-specific pricing | A06-01–A06-04; A09-03; relevant A08 financial cases | No executable pricing vectors until service inputs, formulas, units, rate versions, charge components and calculation/rounding rules are approved. |
| DEC-040 — Measurement adjustment/customer resolution | A06-03–A06-04; A08-01/A08-03/A08-04; A09-03; A17-03; A19-01 | Preserve declared/quoted inputs, actual measurements, adjustment proposal, customer decision and financial outcome as distinct evidence. Thresholds and entitlements remain open. |
| DEC-041 — Payment/settlement/refund/reconciliation/dispatch | A03-02–A03-04; A07-01–A07-04; A08-01–A08-04; A12-01–A12-03; A17-01–A17-03 | Specify separate financial events, provider/local reconciliation, replay/late-event handling and dispatch gates; cancellation is not refund and payment is not physical custody. |
| DEC-042 — Physical intake/custody/measurement/location operation | A09-01–A09-04; A10-01–A10-03; A12-01/A12-04; A16-01/A16-03/A16-04; A17-03/A17-04 | Test physical arrival, custody, measurement, location capability and exception evidence without inferring receipt from booking, route or dispatch records. |
| DEC-043 — Location capability and actor authority | A09-01/A09-02; A10-01–A10-03; A11-02; A12-01–A12-03; A15-01–A15-04; A17-01/A17-02/A17-04 | Each consequential action requires both the relevant location capability and the actor's action permission; authentication, role labels and location labels alone are insufficient. |
| DEC-044 — Custody transfer and physical exception integrity | A09-04; A12-04; A13-01–A13-03; A16-01/A16-03; A17-03/A17-04 | Attempted handover is not completed transfer. Preserve last confirmed custody, original evidence and correction history; incomplete/disputed/missing/damaged cases remain controlled exceptions. |

The decision crosswalk identifies which existing cases must carry the accepted policy assertions. It does not close the blockers in Section 5 or create an executable test package; unresolved service procedures, authority, proof, numeric values, statuses, technical contracts and evidence retention remain blockers where applicable.

## 4. Requirement-level readiness (ADM-R01–ADM-R54)

The following table preserves the priority matrix classifications. Source-level status is copied from the merged dependency register's inspected-source crosswalk; it is not runtime evidence.

| Requirement | Priority | Linked area(s) | Source-level position | Readiness consequence |
|---|---|---|---|---|
| ADM-R01 Admin authentication | P0 | A-15 | `lib/auth.ts`, `app/admin/sign-in/**`, sign-up/verify/forgot-password pages — Source present; sign-in/session/revocation runtime evidence required. | SPECIFICATION CANDIDATE — define exact coverage and run current authorization/runtime regression evidence; source presence is not a pass. |
| ADM-R02 Server-side admin authorization | P0 | A-15 | `lib/admin-auth.ts`, `app/api/admin/auth/verify/route.ts`, Admin API bearer-token/email checks — Partial: allowlist/custom claim exists; test all protected routes and direct navigation. | PARTIAL — draft a narrowly scoped regression specification for the existing slice; the full requirement remains unverified. |
| ADM-R03 Minimum role boundaries | P0 | A-15, A-17 | No granular role/action permission model found; `ADMIN_EMAILS` is a broad allowlist. — Gap against DEC-022. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R04 Protected data and actions | P0 | A-15, A-19 | `firestore.rules`, Admin API checks, customer API token/ownership checks — Partial; only inspected paths are evidenced; full route/rules matrix absent. | PARTIAL — draft a narrowly scoped regression specification for the existing slice; the full requirement remains unverified. |
| ADM-R05 Safe user feedback | P0 | A-01–A-20 | Existing pages/components contain loading, validation, success/error states. — Partial; systematic accessibility and runtime failure-state evidence absent. | PARTIAL — draft a narrowly scoped regression specification for the existing slice; the full requirement remains unverified. |
| ADM-R06 Preserve existing UI and architecture | P0 | Cross-cutting | Existing App Router/components/services/styles remain in use. — Architectural constraint; not a functional feature proven by a route. | BLOCKED / NOT ESTABLISHED — source inspection does not demonstrate a testable, complete capability. |
| ADM-R07 Audit important privileged actions | P0 | A-08–A-17, A-20 | No general audit service/route found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R08 Data integrity | P0 | A-01–A-13 | `app/api/orders/route.ts`, payment routes, Admin order transaction; Firestore rules. — Partial: server-authoritative order/payment guards exist; no equivalent shipment/financial-event integrity layer found. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R09 Product administration | P0 | A-01 | `app/admin/products/page.tsx`, product forms/helpers. — Source present; CRUD/security/runtime verification required. | SPECIFICATION CANDIDATE — define exact coverage and run current authorization/runtime regression evidence; source presence is not a pass. |
| ADM-R10 Category administration | P0 | A-01 | `app/admin/categories/page.tsx`, category forms/helpers. — Source present; CRUD/security/runtime verification required. | SPECIFICATION CANDIDATE — define exact coverage and run current authorization/runtime regression evidence; source presence is not a pass. |
| ADM-R11 Product availability and stock | P0 | A-01–A-03 | Product helpers, storefront filtering, `app/api/orders/route.ts`, cancellation route. — Partial-to-present for storefront; inactive purchase denial and concurrency tests required. | PARTIAL — draft a narrowly scoped regression specification for the existing slice; the full requirement remains unverified. |
| ADM-R13 Image upload reliability | P0 | A-01, A-15, A-20 | `app/api/admin/uploads/images/route.ts`, `lib/cloudinary.ts`, category/product upload components. — Source controls present; successful/denied upload and deployed Cloudinary config unverified (VLY-011). | BLOCKED / NOT ESTABLISHED — source inspection does not demonstrate a testable, complete capability. |
| ADM-R14 Order review and management | P0 | A-03, A-15 | Admin orders page and `app/api/admin/orders/**`. — Source present for storefront orders; runtime and action authorization evidence required. | SPECIFICATION CANDIDATE — define exact coverage and run current authorization/runtime regression evidence; source presence is not a pass. |
| ADM-R15 Payment status visibility | P0 | A-07, A-08 | Admin orders API/page and `lib/types/order.ts`. — Source present for current order payment states; financial-event completeness absent. | SPECIFICATION CANDIDATE — define exact coverage and run current authorization/runtime regression evidence; source presence is not a pass. |
| ADM-R16 Payment investigation | P0 | A-07, A-08 | Payment reference/transaction fields and Paystack verify route. — Partial; investigation/reconciliation tooling and role restrictions not established. | PARTIAL — draft a narrowly scoped regression specification for the existing slice; the full requirement remains unverified. |
| ADM-R17 Payment and order status separation | P0 | A-03, A-07 | Separate `paymentStatus` and `orderStatus` fields; provider verification/webhook guards. — Source present for storefront order model; scenario tests required. | SPECIFICATION CANDIDATE — define exact coverage and run current authorization/runtime regression evidence; source presence is not a pass. |
| ADM-R18 Refund accountability | P0 | A-08 | No refund execution/approval route or service found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R19 Linked record consistency | P0 | A-03, A-05–A-08 | Order item snapshots and order/payment references exist. — Partial for storefront order/payment; shipment/movement relationships absent. | PARTIAL — draft a narrowly scoped regression specification for the existing slice; the full requirement remains unverified. |
| ADM-R20 Payment/stock regression safety | P0 | A-02, A-03, A-07, A-08 | Transactional order creation/cancellation and payment verification/webhook source; 11 Firestore rules tests only. — Partial; no current test run or full payment/stock regression evidence in this pass. | PARTIAL — draft a narrowly scoped regression specification for the existing slice; the full requirement remains unverified. |
| ADM-R21 Shipment record and details | P0 | A-05, A-09–A-13 | No independent shipment record/service found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R22 Unified operational shipment view | P0 | A-03, A-05, A-09–A-13 | Admin orders page is storefront-order based. — Gap for unified order/shipment operations. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R23 Minimum shipment lifecycle | P0 | A-03, A-05, A-09–A-13 | Order lifecycle only in `lib/types/order.ts` and Admin order API. — Gap for independent shipment lifecycle. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R24 Shipment event/history | P0 | A-09, A-11–A-17 | No general shipment event/history service found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R25 Intake and measurements | P0 | A-05, A-06, A-09, A-10 | No active intake/custody source found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R26 Dispatch and transport handover | P0 | A-11, A-12 | Basic storefront shipping metadata/status only. — Gap for route-leg and physical handover evidence. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R27 Delivery/collection completion | P0 | A-13 | Storefront `delivered` order status only. — Partial; no approved proof or collection flow. | PARTIAL — draft a narrowly scoped regression specification for the existing slice; the full requirement remains unverified. |
| ADM-R28 Basic exceptions | P0 | A-09, A-12, A-13, A-17 | Narrow payment review fields/status guards. — Partial; operational parcel exceptions absent. | PARTIAL — draft a narrowly scoped regression specification for the existing slice; the full requirement remains unverified. |
| ADM-R30 Shared pricing rules | P0 | A-06 | No shared shipment-pricing service found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R31 Route-leg pricing | P0 | A-06, A-11 | No route-leg or shipment-pricing source found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R32 Quote snapshot | P0 | A-06, A-07 | Storefront order item/price snapshots exist; no shipment quote/rate version snapshot found. — Partial only for product-order facts. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R33 Measurement discrepancy | P0 | A-06, A-09 | No intake measurement or discrepancy source found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R34 Price adjustment settlement | P0 | A-06–A-08 | No proposed/approved adjustment or settlement event workflow found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R35 Dispatch gate | P0 | A-07, A-08, A-12, A-17 | Admin order transition requires paid payment state; no shipment adjustment/exception gate found. — Partial only for storefront paid-order fulfilment. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R36 PUDO location records | P0 | A-09, A-10 | No active location-management source found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R37 Location type distinction | P0 | A-09, A-10 | No PUDO/station/collection-centre model found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R38 Transport connections | P0 | A-11, A-12 | No route connection model found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R39 Assignment and dispatch accountability | P0 | A-11, A-12 | No transport assignment/handover source found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R41 Real-data dashboard | P0 | A-18 | `app/admin/page.tsx` uses hardcoded/demo metrics and sample orders. — Gap; VLY-012. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R42 Actionable operational overview | P0 | A-18 | Dashboard sample cards/actions; no live operational queues found. — Gap/partial navigation only. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R43 Financial terminology | P0 | A-08, A-18 | Dashboard demo financial/statistical content; no authoritative reporting model found. — Gap pending metric definitions and source-backed totals. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R45 Essential alerts | P0 | A-07, A-12, A-15, A-18, A-20 | No general operational alert service/queue found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R48 Evidence preservation | P0 | A-16 | No general evidence repository/hold workflow found. — Gap. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R51 Audit access protection | P0 | A-15, A-16 | Firestore rules deny direct client order reads/writes; no audit/evidence store found. — Partial security foundation; no audit/evidence access model to verify. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R52 Essential configuration | P0 | A-10, A-14, A-20 | No general operational settings/capability configuration page/service found. — Gap for approved launch configuration. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R54 Essential notifications | P0 | A-14, A-19 | P0 / Conditional P0 — Guest tracking email in order creation; no general event-driven notification service found. — Partial only for guest tracking; DEC-034 matrix and runtime evidence open. | BLOCKED — capability or control is absent in the inspected source; complete design/implementation before acceptance testing. |
| ADM-R12 Product measurements for shipping | Conditional P0 | A-06, A-09 | Product type/helpers/forms contain no verified shipping weight/dimension workflow in inspected source. — Gap for any service whose approved pricing requires measurements. | CONDITIONAL — do not enable the trigger until the relevant policy, procedure, evidence and case specification are approved; see Section 6. |
| ADM-R29 Returns | Conditional P0 | A-13, A-17 | No return workflow found. — Gap if returns are enabled at launch; otherwise approved manual fallback must be documented. | CONDITIONAL — do not enable the trigger until the relevant policy, procedure, evidence and case specification are approved; see Section 6. |
| ADM-R46 Government-request record | Conditional P0 | A-16, A-19 | No dedicated record/workflow found; basic controlled process could be manual if documented. — No source found; trigger-based legal/manual process needs specification. | CONDITIONAL — do not enable the trigger until the relevant policy, procedure, evidence and case specification are approved; see Section 6. |
| ADM-R47 Government-request authorization | Conditional P0 | A-15, A-16, A-19 | Admin email allowlist only; no disclosure-specific approval/action record found. — Gap against DEC-033 if request occurs. | CONDITIONAL — do not enable the trigger until the relevant policy, procedure, evidence and case specification are approved; see Section 6. |
| ADM-R49 Retention-hold release | Conditional P0 | A-16 | No hold/release workflow found. — Gap if a hold exists; retention/legal policy still required. | CONDITIONAL — do not enable the trigger until the relevant policy, procedure, evidence and case specification are approved; see Section 6. |
| ADM-R50 Appeal evidence | Conditional P0 | A-08, A-16 | No appeal evidence association/review workflow found. — Gap if appeal process is triggered. | CONDITIONAL — do not enable the trigger until the relevant policy, procedure, evidence and case specification are approved; see Section 6. |

### P1 boundary — unchanged

| Requirement | Priority | Treatment |
|---|---|---|
| ADM-R40 Network overview | P1 | Not a P0 launch blocker under the accepted priority matrix. |
| ADM-R44 Date range where time-based metrics exist | P1 | Not a P0 launch blocker under the accepted priority matrix. |
| ADM-R53 Basic operational reporting | P1 | Broader report generation remains P1; it does not remove the P0 minimum live dashboard and essential alerts. |

## 5. Cross-cutting blockers before executable test specifications

These blockers recur across multiple cases. They must be resolved in the owning SDD contract, not guessed inside test scripts.

| Blocker | Affected areas / requirements | Required resolution |
|---|---|---|
| Action-level authorization | A-01, A-04, A-09–A-17, A-19; ADM-R02–R04, R07, R47, R51 | Complete action/resource/scope/location matrix; server-side guard expectations; staff assignment, revocation and recovery; separate requester/approver eligibility. PM-01–PM-12 remain accepted policy, but technical matrix is open. |
| Lifecycle and state-transition contracts | A-03, A-05, A-09, A-11–A-13; ADM-R14, R21–R28, R35, R39 | Explicit state models, transition guards, actor, evidence, allowed/denied outcomes, cancellation/late-payment and hold interactions. Order, payment, shipment, custody, movement and delivery remain distinct. |
| Booking-party identity and authority | A-04–A-05, A-13–A-14, A-19; ADM-R21–R24, R27, R54 | Verification/consent evidence; party-role and field-entitlement matrix; lifecycle-stage change authority; payer default access; collection/delegation and transfer rules. |
| Pricing, measurement and quote | A-06, A-09; ADM-R12, R25, R30–R34 | Approved service inputs and formula/rates; units/conversions; measurement source and materiality thresholds; rounding/taxes/fees; rate versions/effective dates; quote expiry; adjustment/customer-consent and rejection outcomes. |
| Financial event integrity | A-03, A-07–A-08, A-17; ADM-R15–R20, R34–R35 | Payment/charge/refund/credit/reversal/overpayment/late-payment event model; provider/local recovery; reconciliation ownership; approval limits and separation of duties. Cancellation remains distinct from refund. |
| Physical custody and routing | A-09–A-13; ADM-R21–R28, R36–R39 | Location capability catalogue; intake and measurement evidence; physical actor vs recorder; route proposal/assignment/movement/handover; delivery/collection proof; failed attempt, refusal, return and hold outcomes. |
| Audit and evidence | A-15–A-17, A-19–A-20; ADM-R07, R24, R46–R51 | Event/evidence catalogue; integrity and correction chain; reviewer permissions; retention periods; legal-hold/release; disclosure authority and minimum manifest. VLY-023 remains open. |
| Notifications and privacy | A-14, A-19; ADM-R04, R54 | Event/recipient/channel/field matrix; verified contact and consent; retry/deduplication/failure ownership; party entitlements. Telegram is separately gated by Admin “Assign For Delivery” and an approved purpose/audience/disclosure policy. |
| Dashboard and alerts | A-18, A-20; ADM-R41–R45 | P0 metric dictionary with source, calculation, scope, freshness, role visibility and stale/unavailable behavior; alert triggers, owner, severity and resolution. Do not promote R40/R44/R53 from P1. |
| Production operations | A-20; ADM-R01–R04, R13, R20, R45, R48–R52, R54 | Production-like environment; secrets/config validation; deployment/release smoke checks; backup/restore objectives and proof; monitoring/alerts; incident response/rollback; dated blocker and release sign-off. |

## 6. Conditional P0 activation gates

These six requirements are not optional after their trigger occurs. Until the trigger occurs, the capability must remain disabled or follow an explicitly approved manual fallback. The absence of a trigger is not evidence of implementation or testing.

| Requirement | Trigger | Minimum gate before activation | Current assessment |
|---|---|---|---|
| ADM-R12 — Product measurements for shipping | An enabled service's approved pricing/eligibility depends on product weight/dimensions | Service-specific fields and units, source/validation, conversion and reproducible pricing vectors | No verified shipping measurement workflow; BLOCKED if such service is enabled. |
| ADM-R29 — Returns | Returns are offered or operationally accepted | Eligibility, authority, custody, customer communication, financial outcome and holding/return path; otherwise approve and document manual customer promise | No return workflow found; keep feature disabled or approve a documented manual path. |
| ADM-R46 — Government-request record | A public-authority request is received | Controlled request intake, identity/authority/legal-basis/scope review, record and disclosure manifest; no dedicated page required | No source found; manual controlled process needs owner-approved procedure. |
| ADM-R47 — Government-request authorization | A disclosure request is to be actioned | Authorized independent review, decision record, minimum disclosure and audit; no disclosure based solely on request receipt | No disclosure-specific approval record found. |
| ADM-R49 — Retention-hold release | A legal/investigation hold exists and release is requested | Hold blocks routine deletion; authorized release, reason, evidence and audit; approved retention rules | No hold/release workflow found. |
| ADM-R50 — Appeal evidence | An appeal/dispute is activated | Evidence scope, reviewer authority, preservation, correction/disclosure and retention rules | No appeal-evidence association/review workflow found. |

Telegram is not one of the six ADM Conditional P0 rows, but it is a separately conditional channel within A-14. Do not activate it until the Admin “Assign For Delivery” gate and separate purpose, audience, consent and disclosure-field policy are approved.

## 7. Recommended sequence to reach test-specification approval

1. **Apply the accepted launch scope:** DEC-018 already includes the lean independent-shipment and logistics capabilities. DEC-037 confirms that logistics/independent shipment booking is the primary business workflow and storefront commerce is an attached service. Do not classify absent core logistics capabilities as deferred merely because the inspected source does not yet implement them. Conditional triggers remain disabled or manual only where their specific gates require it.
2. **Resolve the blocking logistics contracts:** booking authority and eligibility; action permissions; booking/quote/payment lifecycle; pricing/measurement; physical custody and location capability; routing/dispatch/movement; delivery proof and failed-delivery outcomes; financial events; audit/evidence; notification/privacy; P0 metrics; production operations. Preserve the distinction between storefront orders, independent shipments, and transport movements.
3. **Draft source-backed regression specifications for existing slices:** storefront catalogue, checkout/stock, existing order lifecycle, customer access, Paystack payment, and currently implemented Admin authorization. These supporting commerce specifications must not displace the core logistics contract work. State exactly which source-backed behaviour is covered and which policy-dependent scenario is excluded.
4. **Create new logistics capability specifications as their contracts are approved:** shipment booking, quote/pricing, intake/custody, location capability, routing, dispatch, delivery proof, refunds/reconciliation, general audit, exception handling, live dashboard/alerts and production readiness.
5. **Review every case independently:** require an owner-approved specification, independent reviewer, reproducible fixtures, expected state and non-state changes, evidence capture and cleanup before execution.
6. **Execute only in an approved non-production environment:** use sandbox providers, synthetic identities/data and controlled fault injection. No production customer data, live charges, real customer notifications or physical parcels without separate approval.
7. **Record evidence and defects:** do not mark a requirement accepted from source inspection, a screenshot alone, or an uncorrelated test report. Preserve the exact commit/configuration/test command/results and evidence references.

## 8. Test-specification approval checklist

A case is not ready for execution until all applicable items are true:

- [ ] Unique case ID and exact ADM-R/A-area links.
- [ ] Owner-approved business/policy inputs and version recorded.
- [ ] Preconditions, fixtures, environment and cleanup/reset defined.
- [ ] Actor, authentication, action permission, scope and location capability defined.
- [ ] Exact UI/API/provider/physical action reproducible.
- [ ] Expected response and permitted state transitions specified.
- [ ] Expected non-state changes and invariants specified.
- [ ] Negative authorization, duplicate/replay, concurrency, stale/out-of-order and failure cases included where relevant.
- [ ] Evidence artifacts, source of truth, correlation identifiers, redaction and retention specified.
- [ ] Conditional trigger/manual fallback recorded where relevant.
- [ ] Accountable tester, independent reviewer and owner approval recorded.
- [ ] Safe non-production environment and cleanup verified.

## 9. Issue and approval implications

- **VLY-015** remains open: priority/source mapping and scenario design are established; executable specifications and evidence are not.
- **VLY-016** remains open: independent shipment/PUDO/pricing operational source is absent in the inspected baseline.
- **VLY-019** remains open: platform-wide SDD completeness and explicit approval are still required.
- **VLY-020–VLY-022** remain open: workflow, lifecycle/API/security, and booking-party operational/technical contracts need specification.
- **VLY-023** remains open: audit/evidence source gap.
- Existing implementation issues VLY-005, VLY-009–VLY-014 and other relevant issues remain independent runtime/security defects or verification work; this assessment does not close them.
- The root `pudo.zip` archive remains uninspected and its source-of-truth scope unresolved.

## 10. Review and acceptance

- [x] Priority classifications carried forward without changing P0, Conditional P0 or P1.
- [x] A-01–A-20 catalogue case counts and requirement links reconciled.
- [x] Source status tied to the active inspected source baseline.
- [x] Conditional P0 triggers and minimum gates identified.
- [x] Owner confirms logistics/independent shipment booking as the primary business workflow and storefront commerce as an attached service, consistent with DEC-018. Detailed conditional triggers/manual fallbacks remain governed by their individual gates.
- [ ] Owner approves the blocker list and sequence for detailed test-specification work.
- [ ] Individual P0/Conditional P0 test specifications are authored and approved.
- [ ] Non-production environment is approved and evidenced before test execution.

**Current status:** Reconciled through PR #58, with continuity baseline refreshed through PR #60, as a readiness/navigation baseline only. The existing 80 scenario rows and 45 P0 / 6 Conditional P0 / 3 P1 classifications remain unchanged; 0 of 51 P0/Conditional P0 Admin requirements are approved for test execution by this assessment. DEC-037–DEC-044 are now mapped into the existing case families, but the technical/operational blockers, individual case specifications, approved non-production environment and evidence remain open. No test was executed and no application code was changed.


**Baseline clarification (PR #70):** This assessment is aligned to the current documentation baseline `ad6189a598d3fcbb79c90679a7dac33914ea0474`. The active source-inspection baseline remains `e0f69055d33dd9399c23e1d793f359468229c856`; repository comparison shows only SDD documentation paths changed after that snapshot. No test execution, runtime verification, or production readiness is implied.
