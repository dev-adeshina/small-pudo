# VeriLyft Requirement Dependency and Traceability Register

**Document status:** Owner-reviewed traceability baseline (PR #41); DEC-037–DEC-044 dependency crosswalk reconciled in PR #57; detailed technical/source/runtime contracts remain open  
**Prepared:** 31 October 2026  
**Repository baseline:** `main` after PR #59 merge `94c0ac87374248a32b606d82e6d418267a5b0218` (documentation-only)  
**Active application-source inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856` (refreshed in PR #32)  
**Authority:** Derived from the owner-approved priority matrix, A-01–A-20 catalogue, DEC-022–DEC-044, PM-01–PM-12, BP-01–BP-22, and the current actor/workflow/lifecycle drafts. This register is a traceability aid, not a new source of product policy or implementation authorization.

## 1. Purpose and boundaries

This register provides a single navigation point from each cross-domain acceptance area (A-01–A-20) and Admin requirement (ADM-R01–ADM-R54) to its priority, accepted policy dependencies, accountable actor boundaries, shared workflow/lifecycle contract, inspected source position, and outstanding test-specification work.

It consolidates links already present in the source SDD; it does not create new requirements, reprioritize requirements, close policy questions, approve the complete SDD, or claim runtime evidence. Where an underlying document is still a draft, the register preserves that status.

## 2. Baseline and interpretation

- **Priority authority:** `PLATFORM_REQUIREMENT_PRIORITY_MATRIX.md`. P0, Conditional P0, P1 and Deferred classifications are carried forward without reinterpretation.
- **Scenario authority:** `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md`. A-01–A-20 scenario-design refinements were owner-approved and merged in PR #39; these remain scenario outlines, not executable test specifications.
- **Policy authority:** `DECISIONS.md` (DEC-022–DEC-044), `PLATFORM_STAFF_PERMISSION_DECISIONS.md` (PM-01–PM-12), and `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md` (BP-01–BP-22).
- **Workflow and lifecycle references:** `PLATFORM_SHARED_WORKFLOWS.md` and `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`. DEC-038–DEC-044 refine booking confirmation, pricing/measurement, settlement, physical intake/custody, location capabilities, and custody-exception boundaries; these remain policy inputs to technical/operational drafts, not implementation-ready contracts.
- **Source authority:** `IMPLEMENTATION_SOURCE_TRACEABILITY.md`. Source presence is not proof of deployed configuration, runtime behaviour, test success or production readiness.
- **Traceability direction:** An ADM-R requirement can support multiple A areas; an A area can depend on multiple ADM-R requirements and owner decisions. This is many-to-many, not a one-to-one mapping.

### Evidence vocabulary

| Label | Meaning |
|---|---|
| Source present | Relevant source was identified in the inspected tree; runtime/security behaviour remains to be verified. |
| Partial | Some adjacent or narrower source exists, but it does not fulfil the complete requirement. |
| Gap / no active source found | The inspected source inventory found no matching active implementation, or a material requirement gap. |
| Not established | Repository source alone cannot establish deployed or operational readiness. |
| Test design only | Scenario outline exists; no approved executable test specification or test result is implied. |

## 3. Cross-domain dependency and ownership map (A-01–A-20)

The requirement links and source summaries below are transcribed from the current priority, catalogue and source-traceability baselines. Workflow and lifecycle references identify the authoritative draft sections to reconcile; they do not assert those contracts are complete.

| Area | Priority | Linked Admin requirements | Accepted policy dependencies | Primary actors / authority boundary | Shared workflow reference | Lifecycle/contract reference | Inspected source position |
|---|---|---|---|---|---|---|---|
| A-01 | P0 | ADM-R04–R13 | DEC-018, DEC-020–021 | Customer; designated Admin catalogue staff | Workflow A — storefront order/fulfilment; storefront catalogue scope | §4.1 booking/order; §6 request/response validation | Partial-to-present: public catalogue and Admin CRUD paths exist; active/inactive filtering is represented. Category product-count helper has a `category == slug` versus current `categoryId` field mismatch. — Browser visibility, direct API purchase denial for inactive products, CRUD and count/slug-protection tests remain required. |
| A-02 | P0 | ADM-R08, R11, R17, R19, R20 | DEC-005, DEC-018–021 | Guest or authenticated customer; server-side order service | Workflow A — storefront order/fulfilment | §4.1 booking/order; §8 idempotency and concurrency | Present for storefront checkout: server validates current products/prices/stock, normalizes duplicate product lines, reserves stock and creates an order transactionally. — Duplicate-submit, contention/oversell, malformed payload and failure/retry scenarios require current evidence. |
| A-03 | P0 | ADM-R14–R20, R35 | DEC-015, DEC-018–021, DEC-029–030, DEC-037 | Customer; Admin/Operations within assigned action permissions | Workflow A — storefront order/fulfilment | §4.1 booking/order; §4.3 payment; §5 cross-lifecycle invariants | Partial: pending/cancelled/processing/ready-for-shipping/shipped/delivered and payment states exist. This is not the full parcel/shipment lifecycle. — Cancellation, late payment, duplicate/concurrent callbacks, status conflicts and stock restoration need a dated runtime matrix. |
| A-04 | P0 | ADM-R01–R04, R14, R19; DEC-035 | DEC-023–024, DEC-035; BP-01–BP-05, BP-10–BP-22; PM-11 | Customer/guest; Support (limited access); designated Admin for exceptions | Workflows A and I; guest recovery/claim under DEC-035 | §4.1 booking; §7 security; §8 recovery/idempotency | Partial-to-present: authenticated customer profile/order access and guest-token tracking exist. No separate guest-order recovery/claim challenge flow was found. — Ownership, verified-email, cross-account denial, token expiry/replay and DEC-035 recovery/claim tests remain open. |
| A-05 | P0 | ADM-R21–R24, R28, R30–R32, R36–R39 | DEC-023–028, DEC-037–038; BP-01–BP-18; PM-04, PM-06 | Registered authenticated booking party; sender/receiver/payer as distinct parties; internal staff | Workflow B — independent shipment booking and quote | §3 domain relationships; §4.1 booking; §4.2 quote | No active source found. Storefront orders are not independent shipment bookings. — Not implemented/verified in inspected source. |
| A-06 | P0 | ADM-R30–R34 | DEC-026–027, DEC-037, DEC-039–040; PM-04, PM-06 | Booking party; designated Admin pricing staff; authorized measurement/quote reviewers | Workflow D — shared pricing, quote adjustment and settlement | §4.2 quote/adjustment; §5 invariants | Partial only for catalogue item pricing; DEC-026 quote/rate snapshots and independent shipment pricing not represented. — Pricing formula, quote snapshot/reproducibility, expiry and adjustment evidence absent. |
| A-07 | P0 | ADM-R15–R17, R20 | DEC-028–029, DEC-041; PM-05 | Payer/booking party as applicable; payment provider; authorized finance/operations staff | Workflow E — payment events and financial reconciliation | §4.3 payment/financial events; §8 provider recovery | Partial-to-present for Paystack storefront orders: server-side initialization, provider verification, signature validation, transaction updates and webhook event deduplication exist. — VLY-005 scenarios, provider/local divergence, concurrency, replay and late payment remain runtime-unverified. |
| A-08 | P0 | ADM-R16–R20, R34 | DEC-022, DEC-029, DEC-039–041; PM-05 | Finance responsibility; requester and separate authorized approver; payment provider | Workflows D and E — adjustment settlement and financial reconciliation | §4.3 financial events; §8 concurrency/replay | No complete financial-event workflow found. Webhook deduplication records are not a ledger or reconciliation system. — Refund execution, credit, reversal, chargeback and provider/bank reconciliation evidence absent. |
| A-09 | P0 | ADM-R21, R23–R28, R33, R36–R37 | DEC-025, DEC-027–028, DEC-037, DEC-040, DEC-042–044; PM-03, PM-06 | Authorized intake/measurement staff plus active location capability; physical parcel party | Workflow C — physical intake, measurement and custody | §4.4 intake/custody; §5 invariants | No active source found. — No intake, measurement, custody or handover evidence to verify. |
| A-10 | P0 | ADM-R36–R38, R52 | DEC-025, DEC-042–043; PM-03 | Designated Admin configures location capabilities; assigned staff operate enabled services | Workflows C and F — location capability and operational network | §4.4 intake/custody; §7 location/staff authorization | No active source found. — Per-location capabilities and partner/station access not represented in inspected source. |
| A-11 | P0 | ADM-R38–R40 | DEC-031, DEC-043; PM-07 | Operations; designated Admin for configured connections/capabilities | Workflow F — route proposal, assignment, handover and movement | §4.5 route proposal/assignment/movement | No active source found. — Proposal, approval, assignment and route-change evidence absent. |
| A-12 | P0 | ADM-R23–R28, R35, R38–R39 | DEC-030–031, DEC-037, DEC-041–044; PM-03, PM-07, PM-09 | Operations; transport provider/driver as physical actor; internal recorder | Workflows F and G — movement, handover and dispatch authorization | §4.5 movement; §4.6 dispatch; §5 invariants | Partial only for basic paid storefront-order fulfilment; no independent route-leg dispatch, physical handover or movement event model found. — Physical actor, recorder, location, leg and handover proof not represented/verified. |
| A-13 | P0 | ADM-R23–R29 | DEC-032, DEC-044; PM-07; BP-06–BP-08, BP-19–BP-22 | Receiver/authorized collector; delivery staff/driver as physical actor; Operations reviewer | Workflow H — delivery evidence and failed-delivery resolution | §4.7 delivery/failed delivery | Partial: a delivered status exists, but no failed-attempt, collection, return or approved proof-of-delivery workflow found. — Delivery evidence and failure-resolution scenarios absent. |
| A-14 | P0 / Conditional P0 | ADM-R54; DEC-024, DEC-032, DEC-034 | DEC-024, DEC-032, DEC-034; BP-09 | Booking party, sender, receiver, payer, alternative collector; notification service; Admin Telegram gate | Workflow I — notifications and customer tracking | §4.7 delivery outcomes; DEC-034 notification lifecycle section | Partial for a narrow guest tracking email only. Telegram is not established as implemented; DEC-034 gate remains policy. — Event catalogue, recipient entitlement, consent, deduplication, retry and failure visibility unverified/absent. |
| A-15 | P0 | ADM-R01–R04, R07, R51 | DEC-022, DEC-025, DEC-030–033, DEC-042–043; PM-01–PM-03, PM-05–PM-08, PM-12 | Designated Admin, Operations, Finance, Support, Management reporting; authorization reviewer | Cross-workflow authorization; actor/permission model | §4.8 authorization/audit; §7 authorization boundaries | Partial: email allowlist/custom-claim Admin gate and independent API checks exist. No granular Admin/Operations/Finance action permission matrix is represented. — Direct navigation, customer-vs-admin API denial, token revocation and workflow-specific permission tests required. |
| A-16 | P0 | ADM-R07, R24, R48–R51 | DEC-022, DEC-033, DEC-044; PM-08, PM-12; BP-18–BP-22 | Authorized audit/evidence reviewers; action actor; disclosure approver | Workflow J — audit, evidence and controlled disclosure | §4.8 audit lifecycle; §7 evidence access; §8 integrity | No general cross-domain audit/evidence implementation found in inspected active source. — Actor/reason/evidence history, restricted review, correction and retention tests absent. |
| A-17 | P0 | ADM-R07, R18, R28–R35, R46–R50 | DEC-022, DEC-029–033, DEC-040–044; PM-05–PM-08, PM-11–PM-12; BP-04–BP-05, BP-08, BP-19–BP-22 | Requester and separate approver; Support; designated Admin; responsible Finance/Operations staff | Cross-workflow exception catalogue; Workflows E, G, H and J | §4.3–4.8 exception transitions; §7 authorization; §8 replay | Partial and narrow; no general controlled exception, approval or support-resolution workflow found. — DEC-022/029/030 exception authority, separation-of-duties and evidence scenarios remain unverified. |
| A-18 | P0 | ADM-R41–R43, R45; ADM-R40/R44/R53 are P1 under the priority matrix where applicable. | DEC-036; PM-10 | Operations and explicitly assigned Management reporting/oversight | DEC-036 reporting/readiness; minimum operational dashboard | DEC-036 launch-readiness contract; reporting metrics still unspecified | Gap for reliable operational visibility: current dashboard values are not backed by live operational records. — Metric definitions, data accuracy, no-fabrication and date-window tests absent. |
| A-19 | P0 | ADM-R04, R14–R19, R54 | DEC-024, DEC-032–035, DEC-038; PM-08, PM-11; BP-09, BP-14–BP-22 | Booking party, sender, receiver, payer, delegate, Support and authorized disclosure reviewer | Workflow I and J; party entitlements, privacy and disclosure | §7 data/access boundaries; DEC-034/035 lifecycle sections | Partial: access checks exist in inspected endpoints; no complete role-aware event/recipient/message-field policy implementation found. — Disclosure minimization, payer/sender/receiver entitlements, consent and notification tests remain open. |
| A-20 | P0 | ADM-R01–R04, R13, R20, R45, R48–R52, R54; DEC-036 | DEC-036; PM-01, PM-08, PM-12 | Release owner, Admin/security, operations, integration owners and incident reviewers | DEC-036 launch readiness and production evidence | DEC-036 launch-readiness and evidence contract | Not established by repository source inspection. Source configuration does not prove deployed configuration, secret availability, monitoring, backup, restore or incident readiness. — Production-like evidence, deployed rules/config, backup-restore, monitoring, incident response and rollback proof not inspected. |

## 4. Admin requirement traceability (ADM-R01–ADM-R54)

Each row carries the requirement title, approved priority, linked A-area(s), and source-level status from the active-source inventory. Policy dependencies are expanded in Section 5 by decision family; the A-area links in Section 3 provide the corresponding scenario/actor/workflow/lifecycle path.

| Requirement | Requirement name | Priority | Linked A area(s) | Source-level position |
|---|---|---|---|---|
| ADM-R01 | Admin authentication | P0 | A-15 | `lib/auth.ts`, `app/admin/sign-in/**`, sign-up/verify/forgot-password pages — Source present; sign-in/session/revocation runtime evidence required.  |
| ADM-R02 | Server-side admin authorization | P0 | A-15 | `lib/admin-auth.ts`, `app/api/admin/auth/verify/route.ts`, Admin API bearer-token/email checks — Partial: allowlist/custom claim exists; test all protected routes and direct navigation.  |
| ADM-R03 | Minimum role boundaries | P0 | A-15, A-17 | No granular role/action permission model found; `ADMIN_EMAILS` is a broad allowlist. — Gap against DEC-022.  |
| ADM-R04 | Protected data and actions | P0 | A-15, A-19 | `firestore.rules`, Admin API checks, customer API token/ownership checks — Partial; only inspected paths are evidenced; full route/rules matrix absent.  |
| ADM-R05 | Safe user feedback | P0 | A-01–A-20 | Existing pages/components contain loading, validation, success/error states. — Partial; systematic accessibility and runtime failure-state evidence absent.  |
| ADM-R06 | Preserve existing UI and architecture | P0 | Cross-cutting | Existing App Router/components/services/styles remain in use. — Architectural constraint; not a functional feature proven by a route.  |
| ADM-R07 | Audit important privileged actions | P0 | A-08–A-17, A-20 | No general audit service/route found. — Gap.  |
| ADM-R08 | Data integrity | P0 | A-01–A-13 | `app/api/orders/route.ts`, payment routes, Admin order transaction; Firestore rules. — Partial: server-authoritative order/payment guards exist; no equivalent shipment/financial-event integrity layer found.  |
| ADM-R09 | Product administration | P0 | A-01 | `app/admin/products/page.tsx`, product forms/helpers. — Source present; CRUD/security/runtime verification required.  |
| ADM-R10 | Category administration | P0 | A-01 | `app/admin/categories/page.tsx`, category forms/helpers. — Source present; CRUD/security/runtime verification required.  |
| ADM-R11 | Product availability and stock | P0 | A-01–A-03 | Product helpers, storefront filtering, `app/api/orders/route.ts`, cancellation route. — Partial-to-present for storefront; inactive purchase denial and concurrency tests required.  |
| ADM-R12 | Product measurements for shipping | Conditional P0 | A-06, A-09 | Product type/helpers/forms contain no verified shipping weight/dimension workflow in inspected source. — Gap for any service whose approved pricing requires measurements.  |
| ADM-R13 | Image upload reliability | P0 | A-01, A-15, A-20 | `app/api/admin/uploads/images/route.ts`, `lib/cloudinary.ts`, category/product upload components. — Source controls present; successful/denied upload and deployed Cloudinary config unverified (VLY-011).  |
| ADM-R14 | Order review and management | P0 | A-03, A-15 | Admin orders page and `app/api/admin/orders/**`. — Source present for storefront orders; runtime and action authorization evidence required.  |
| ADM-R15 | Payment status visibility | P0 | A-07, A-08 | Admin orders API/page and `lib/types/order.ts`. — Source present for current order payment states; financial-event completeness absent.  |
| ADM-R16 | Payment investigation | P0 | A-07, A-08 | Payment reference/transaction fields and Paystack verify route. — Partial; investigation/reconciliation tooling and role restrictions not established.  |
| ADM-R17 | Payment and order status separation | P0 | A-03, A-07 | Separate `paymentStatus` and `orderStatus` fields; provider verification/webhook guards. — Source present for storefront order model; scenario tests required.  |
| ADM-R18 | Refund accountability | P0 | A-08 | No refund execution/approval route or service found. — Gap.  |
| ADM-R19 | Linked record consistency | P0 | A-03, A-05–A-08 | Order item snapshots and order/payment references exist. — Partial for storefront order/payment; shipment/movement relationships absent.  |
| ADM-R20 | Payment/stock regression safety | P0 | A-02, A-03, A-07, A-08 | Transactional order creation/cancellation and payment verification/webhook source; 11 Firestore rules tests only. — Partial; no current test run or full payment/stock regression evidence in this pass.  |
| ADM-R21 | Shipment record and details | P0 | A-05, A-09–A-13 | No independent shipment record/service found. — Gap.  |
| ADM-R22 | Unified operational shipment view | P0 | A-03, A-05, A-09–A-13 | Admin orders page is storefront-order based. — Gap for unified order/shipment operations.  |
| ADM-R23 | Minimum shipment lifecycle | P0 | A-03, A-05, A-09–A-13 | Order lifecycle only in `lib/types/order.ts` and Admin order API. — Gap for independent shipment lifecycle.  |
| ADM-R24 | Shipment event/history | P0 | A-09, A-11–A-17 | No general shipment event/history service found. — Gap.  |
| ADM-R25 | Intake and measurements | P0 | A-05, A-06, A-09, A-10 | No active intake/custody source found. — Gap.  |
| ADM-R26 | Dispatch and transport handover | P0 | A-11, A-12 | Basic storefront shipping metadata/status only. — Gap for route-leg and physical handover evidence.  |
| ADM-R27 | Delivery/collection completion | P0 | A-13 | Storefront `delivered` order status only. — Partial; no approved proof or collection flow.  |
| ADM-R28 | Basic exceptions | P0 | A-09, A-12, A-13, A-17 | Narrow payment review fields/status guards. — Partial; operational parcel exceptions absent.  |
| ADM-R29 | Returns | Conditional P0 | A-13, A-17 | No return workflow found. — Gap if returns are enabled at launch; otherwise approved manual fallback must be documented.  |
| ADM-R30 | Shared pricing rules | P0 | A-06 | No shared shipment-pricing service found. — Gap.  |
| ADM-R31 | Route-leg pricing | P0 | A-06, A-11 | No route-leg or shipment-pricing source found. — Gap.  |
| ADM-R32 | Quote snapshot | P0 | A-06, A-07 | Storefront order item/price snapshots exist; no shipment quote/rate version snapshot found. — Partial only for product-order facts.  |
| ADM-R33 | Measurement discrepancy | P0 | A-06, A-09 | No intake measurement or discrepancy source found. — Gap.  |
| ADM-R34 | Price adjustment settlement | P0 | A-06–A-08 | No proposed/approved adjustment or settlement event workflow found. — Gap.  |
| ADM-R35 | Dispatch gate | P0 | A-07, A-08, A-12, A-17 | Admin order transition requires paid payment state; no shipment adjustment/exception gate found. — Partial only for storefront paid-order fulfilment.  |
| ADM-R36 | PUDO location records | P0 | A-09, A-10 | No active location-management source found. — Gap.  |
| ADM-R37 | Location type distinction | P0 | A-09, A-10 | No PUDO/station/collection-centre model found. — Gap.  |
| ADM-R38 | Transport connections | P0 | A-11, A-12 | No route connection model found. — Gap.  |
| ADM-R39 | Assignment and dispatch accountability | P0 | A-11, A-12 | No transport assignment/handover source found. — Gap.  |
| ADM-R40 | Network overview | P1 | A-10–A-12, A-18 | No network overview source found. — P1; not a launch blocker under the current priority matrix.  |
| ADM-R41 | Real-data dashboard | P0 | A-18 | `app/admin/page.tsx` uses hardcoded/demo metrics and sample orders. — Gap; VLY-012.  |
| ADM-R42 | Actionable operational overview | P0 | A-18 | Dashboard sample cards/actions; no live operational queues found. — Gap/partial navigation only.  |
| ADM-R43 | Financial terminology | P0 | A-08, A-18 | Dashboard demo financial/statistical content; no authoritative reporting model found. — Gap pending metric definitions and source-backed totals.  |
| ADM-R44 | Date range where time-based metrics exist | P1 | A-18 | No verified date-range metric implementation found. — P1; not a launch blocker under current matrix.  |
| ADM-R45 | Essential alerts | P0 | A-07, A-12, A-15, A-18, A-20 | No general operational alert service/queue found. — Gap.  |
| ADM-R46 | Government-request record | Conditional P0 | A-16, A-19 | No dedicated record/workflow found; basic controlled process could be manual if documented. — No source found; trigger-based legal/manual process needs specification.  |
| ADM-R47 | Government-request authorization | Conditional P0 | A-15, A-16, A-19 | Admin email allowlist only; no disclosure-specific approval/action record found. — Gap against DEC-033 if request occurs.  |
| ADM-R48 | Evidence preservation | P0 | A-16 | No general evidence repository/hold workflow found. — Gap.  |
| ADM-R49 | Retention-hold release | Conditional P0 | A-16 | No hold/release workflow found. — Gap if a hold exists; retention/legal policy still required.  |
| ADM-R50 | Appeal evidence | Conditional P0 | A-08, A-16 | No appeal evidence association/review workflow found. — Gap if appeal process is triggered.  |
| ADM-R51 | Audit access protection | P0 | A-15, A-16 | Firestore rules deny direct client order reads/writes; no audit/evidence store found. — Partial security foundation; no audit/evidence access model to verify.  |
| ADM-R52 | Essential configuration | P0 | A-10, A-14, A-20 | No general operational settings/capability configuration page/service found. — Gap for approved launch configuration.  |
| ADM-R53 | Basic operational reporting | P1 | A-18 | No reliable reporting service found; current dashboard includes demo metrics. — P1; advanced/basic reporting boundary follows priority matrix.  |
| ADM-R54 | Essential notifications | P0 | A-14, A-19 |  P0 / Conditional P0 — Guest tracking email in order creation; no general event-driven notification service found. — Partial only for guest tracking; DEC-034 matrix and runtime evidence open.  |

## 5. Accepted policy dependency register and unresolved specification

The owner decisions below are accepted policy. The unresolved items are technical, operational or numeric details that must be specified before executable test approval. They must not be interpreted as reopening the accepted policy.

| Decision family | Main A areas | Primary requirement links | Accepted policy boundary | Remaining specification dependencies |
|---|---|---|---|---|
| DEC-022 / PM-01–PM-02 / PM-05–PM-08 / PM-12 | A-08, A-15–A-17, A-20 | ADM-R03, R04, R07, R18, R28, R35, R47–R51 | Designated Admin permission administration; action-level least privilege and location/responsibility scope; second-person approval for consequential finance, material measurement adjustments and consequential operational exceptions; restricted audit access/disclosure; controlled emergency access. | Action/resource/scope matrix; permission assignment/revocation and recovery; approver eligibility; materiality/monetary thresholds; break-glass duration and review; event/evidence catalogue; access/export/disclosure contracts. |
| DEC-023–DEC-024 / BP-01–BP-22 | A-04–A-05, A-13–A-14, A-17, A-19 | ADM-R01–R04, R14, R19, R21–R29, R54 | Registered authenticated customer for independent booking; distinct booking party, sender, receiver, payer and authorized collector; lifecycle-stage-specific change authority; limited delegation; payer privacy; support-mediated controlled exceptions; preserved history. | Identity/consent proof methods; change-type/lifecycle gates; business-account representation; collection verification; delegation duration and completion definition; transfer acceptance; dispute/review targets; legal representative handling; support recovery procedure; notification recipient/field matrix. |
| DEC-025 / PM-03 / PM-09 | A-09–A-10, A-12, A-15 | ADM-R25–R28, R36–R39, R52 | Lean location records; each location has independently configured capabilities; each staff action requires both assigned staff permission and active location capability; no direct partner/driver login at launch. | Capability catalogue; location setup/change authority and evidence; staff-to-location assignment; physical actor vs recording staff attribution; location activation/retirement and conflict handling. |
| DEC-026 / PM-04 | A-06, A-08 | ADM-R30–R32, R34 | Service-specific fixed/calculated/hybrid pricing; shared rules where channels overlap; designated Admin controls rate lifecycle; preserve historical rate versions and accepted quote terms. | Rate/input source; formula and bands; distance source; service mapping; minimum charge; taxes/fees/surcharges/discounts; rounding; effective dates; quote validity and accepted-quote expiry treatment; rate version selection. |
| DEC-027 / PM-06 | A-06, A-09 | ADM-R12, R25, R31–R34 | Service-specific measurement fields and units; declared and actual values remain distinct; material quote/financial adjustments require review and applicable second approval; disputed measurements are not silently accepted. | Units/conversions; measuring equipment/source; validation; discrepancy/materiality thresholds; tolerances; evidence/reason; adjustment outcomes and customer consent. |
| DEC-028 | A-07, A-09 | ADM-R15–R17, R20, R25 | Payment-at-intake methods must be configured and supported by attributable evidence; payment state remains distinct from order/shipment lifecycle. | Enabled payment methods; cash/electronic evidence; recorder/collector authority; reconciliation timing; partial/additional payment treatment; provider/local failure recovery. |
| DEC-029 / PM-05 | A-03, A-07–A-08, A-17 | ADM-R15–R20, R29, R34–R35 | Cancellation, late payment, refund request/approval/execution, credits, reversals and reconciliation are distinct outcomes; cancellation is not a refund; consequential finance actions use separation of duties. | Refund/credit/reversal limits; provider and bank reconciliation ownership/tolerance; partial payment; over/underpayment; chargeback handling; late payment disposition; adjustment rejection/service resolution. |
| DEC-030 / PM-07 | A-03, A-12, A-15, A-17 | ADM-R23, R28, R35, R39 | Dispatch is gated by verified payment by default; only narrow, explicitly authorized exceptions with reason/evidence and second approval where consequential; holds remain distinct. | Eligible exception categories; role/permission; requester/approver separation; materiality; required evidence; duration/expiry; interaction with unrelated payment, custody, safety or legal holds. |
| DEC-031 / PM-07 | A-10–A-12, A-17 | ADM-R26, R38–R40 | Evidence-based route proposals and review; route proposal, approval, assignment, dispatch, movement and physical handover are separate events; routine approved work does not automatically require second approval. | Proposal inputs; capacity model; route/leg representation; assignment authority; mandatory milestones; stale proposal/conflict handling; physical actor and recorder; correction/reassignment rules. |
| DEC-032 / PM-07 / BP-06–BP-08 | A-13, A-17, A-19 | ADM-R27–R29, R35, R48, R50 | Delivery/collection requires approved proof and recipient authority; failed attempts, collection, return, refusal and disputes are distinct; disputed collection authority holds release. | Proof methods by service; identity/recipient authority; evidence fields; failure reason catalogue; attempt limits; holding/return/refusal/dispute outcome and communication. |
| DEC-033 / PM-08 / BP-18–BP-22 | A-15–A-17, A-19–A-20 | ADM-R07, R24, R46–R51 | Attributable, integrity-protected audit/evidence; restricted reviewers; corrections preserve originals; retention/legal hold and controlled disclosure; appeal evidence preserved; no blanket Admin access. | Event catalogue; evidence classification; retention periods; hold/release process; correction/redaction rules; access/export/disclosure permission; government request legal-basis and approval procedure; appeal evidence scope. |
| DEC-034 / BP-09 | A-14, A-19 | ADM-R04, R14–R19, R54 | Event-driven communication with party-specific entitlements and minimum disclosure; payer receives payment confirmation/receipt, not unrestricted shipment details; Telegram only after Admin “Assign For Delivery” and separate approved purpose/audience/disclosure. | Event-recipient-channel-field matrix; verified contact methods; consent/preferences; retry/deduplication; failure ownership; Telegram activation and message-field approval. |
| DEC-035 / BP-14–BP-17 | A-04, A-19 | ADM-R01–R04, R14, R19 | Secure guest-order recovery and optional claiming; order ID/email alone do not grant access; delegated access is explicit, limited, revocable and non-transferable; account compromise triggers protective review. | Challenge/proof format and lifetime; rate limits; revocation; claim eligibility; transfer effects; delegated access duration/completed-state definition; Support escalation and exception. |
| DEC-036 | A-18, A-20 | ADM-R41–R45, R48–R54 | Evidence-based P0/P1/deferred boundary; minimum accurate operational dashboard is P0; advanced reporting remains P1; production readiness requires evidence, not merely source/configuration presence. | P0 metric dictionary and source/calculation/freshness; production environment; monitoring/alert owners; backup/restore cadence and recovery objectives; incident response; rollback; blocker ownership; dated release sign-off. |



### 5.1 DEC-037–DEC-044 requirement dependency propagation

The following mapping connects the owner-approved logistics refinements to existing A-area and Admin requirement identifiers. It is a dependency crosswalk, not a new requirement catalogue. The approved priority matrix remains authoritative; a decision reference does not create or change a P0/P1/Conditional P0 classification.

| Decision | Principal A areas | Existing ADM-R links | Dependency carried into traceability |
|---|---|---|---|
| **DEC-037 — logistics-first hierarchy and shared fulfilment boundary** | A-03, A-05, A-06, A-09–A-12 | ADM-R14–R28, R30–R39 | Independent shipment booking is the primary logistics workflow; storefront commerce remains a distinct attached service. Where a storefront order requires delivery, its fulfilment enters the shared operational boundary without conflating the order and shipment concepts. |
| **DEC-038 — independent booking confirmation and responsibility** | A-05, A-06, A-19 | ADM-R01–R04, R21–R24, R28, R30–R32, R54 | Explicit valid-quote acceptance by the authenticated booking party confirms booking and accepted terms; payment and physical intake remain separate; service-specific handover deadline is communicated before acceptance and in confirmation; party identities and authority remain distinct. |
| **DEC-039 — service-specific pricing model and calculation boundaries** | A-06, A-08, A-09 | ADM-R30–R34 | Apply only the service-configured fixed/calculated/hybrid model and approved inputs; trusted server calculation and historical quote explainability remain requirements. Formulas, rate data, units, rounding, and service mappings remain unresolved inputs. |
| **DEC-040 — measurement adjustment and customer resolution** | A-06, A-08, A-09, A-17 | ADM-R25, R30–R34, R07, R28 | Declared and actual measurements remain distinct; material/payment-impacting adjustment follows review and applicable second approval; customer acceptance/rejection is explicit; rejection invokes authorized service resolution and does not itself create cancellation/refund/credit. |
| **DEC-041 — payment, settlement, refund/credit and dispatch boundaries** | A-03, A-07, A-08, A-12, A-17 | ADM-R15–R20, R29, R34–R35, R18, R28 | Payment/settlement, refund/credit/reversal, reconciliation, physical custody, and dispatch are separate facts. Normal dispatch settlement gate remains; eligible partial payment does not satisfy the normal full-settlement gate. |
| **DEC-042 — physical intake, custody and location accountability** | A-09, A-10, A-12, A-15, A-17 | ADM-R03–R04, R07, R21–R28, R35–R37, R39, R51–R52 | Advance-booked intake and staff-created walk-in intake remain distinct; action requires active location, enabled service/action, and independently authorized actor; physical receipt under hold must still record actual custody. |
| **DEC-043 — location capability and operational authority** | A-09, A-10, A-11, A-12, A-15, A-17 | ADM-R03–R04, R07, R25–R28, R36–R39, R51–R52 | Location service support and action capability are separate; actor permission and location capability are cumulative guards. Designated Admin configuration authority is limited and attributable; capability revocation does not erase existing custody. |
| **DEC-044 — custody transfer integrity and physical exceptions** | A-09, A-12, A-13, A-16, A-17 | ADM-R07, R23–R28, R39, R48–R51 | A transfer is complete only on actual handover and receipt; attempts, route assignments and dispatch records do not prove possession change. Preserve last confirmed custody, original evidence and correction history; physical exceptions do not automatically determine liability or financial/customer outcomes. |

**Crosswalk guardrails:** ADM-R40, ADM-R44 and ADM-R53 remain P1. Conditional P0 requirements retain their existing triggers. The mapping does not promote or demote any requirement, approve a detailed technical contract, or establish source/runtime evidence.

## 6. Test-specification readiness and activation gates

**Current state:** A-01–A-20 have owner-approved scenario-design refinements. This register and the acceptance catalogue are not executable test specifications. No test execution or runtime result is asserted.

Before a P0/Conditional P0 scenario can be approved for execution, its test specification must define:

1. Unique test/case identifier and exact requirement/A-area links.
2. Preconditions, environment, seed data and cleanup/reset.
3. Actor identity, assigned action permission, scope and location capability where relevant.
4. Trigger/action and expected state changes **and expected non-state changes**.
5. Negative authorization, replay, duplicate, concurrency, stale-state, timeout and partial-failure behaviour as applicable.
6. Evidence artifact(s), source of truth, timestamps/correlation identifiers and retention/access requirements.
7. Conditional-P0 trigger and explicit activation decision, or approved manual fallback where not enabled.
8. Accountable test owner, independent reviewer and approval record.

### Conditional P0 activation register

| Requirement / capability | Activation trigger | Minimum gate before activation |
|---|---|---|
| ADM-R12 product shipping measurements | An enabled service's approved price/eligibility depends on product measurements | Approved measurement fields/units/source/validation and reproducible pricing vectors. |
| ADM-R29 returns | Returns are offered or operationally accepted | Approved eligibility, authority, custody, customer communication and financial outcomes; otherwise documented/approved manual fallback and customer promise. |
| ADM-R46–R47 government requests | A public-authority request is received | Controlled request intake, authority/legal-basis/scope review, approval, minimum disclosure and audit. |
| ADM-R49 retention-hold release | A legal/investigation hold is placed | Hold, deletion blocking, authorized release, audit and retention rules. |
| ADM-R50 appeal evidence | An appeal/dispute process is activated | Evidence scope, reviewer authorization, preservation, correction/disclosure and retention. |
| Telegram within A-14 | Telegram channel is enabled | Admin “Assign For Delivery” gate plus separate approved purpose, audience, disclosure fields, consent and retry/failure policy. |
| ADM-R40 / R44 / R53 | Future P1 scope is separately approved | Do not treat as launch blockers solely because the requirement appears in a P0 acceptance cross-reference. |

## 7. Priority and scope guardrails

- A-18 minimum operational dashboard remains P0; ADM-R41, R42, R43 and applicable P0 alert requirement ADM-R45 remain launch scope.
- ADM-R40 network overview, ADM-R44 date-range controls, and ADM-R53 broader/basic report generation remain P1 under the priority matrix. Do not silently promote them to P0.
- Conditional P0 remains trigger-dependent; absence of an activation trigger does not mean the capability is implemented or tested.
- Deferred scope remains deferred unless an explicit owner-approved change is recorded.
- Storefront orders and independent shipments retain distinct identities and lifecycles.
- Source-presence labels do not establish security, runtime, deployed configuration or production readiness.

## 8. Open issues and document ownership

- `VLY-015`: detailed specifications, test evidence and complete SDD approval remain open.
- `VLY-019`: platform-wide SDD reconciliation and full approval remain open.
- `VLY-020` and `VLY-021`: owner policy direction is accepted; shared workflow and lifecycle/API/security documents remain drafts requiring technical/operational specification.
- `VLY-023`: general audit/evidence source gap remains open.
- Root `pudo.zip` scope remains unresolved and the archive remains uninspected.
- No application-source changes are represented after the active source baseline; re-inspect source if any source-changing commit is introduced.

## 9. Review and acceptance checklist

- [x] Owner reviewed the A-01–A-20 crosswalk and ADM-R01–ADM-R54 requirement links in PR #41.
- [x] Owner reviewed DEC/PM/BP dependency mapping without reopening accepted policy in PR #41.
- [x] Owner reviewed actor, workflow and lifecycle references as draft navigation anchors in PR #41.
- [x] Owner reviewed P0 / Conditional P0 / P1 boundaries and activation triggers in PR #41.
- [x] Source-status summaries remain tied to the active-source inspection baseline; PR #41 changed documentation only.
- [x] Register accepted as a navigation/traceability baseline only; technical design, test execution, implementation and production release remain unapproved.

**Current status:** The A-01–A-20/ADM-R01–ADM-R54 traceability baseline was owner-reviewed in PR #41; the DEC-037–DEC-044 dependency crosswalk was added in PR #57. This remains a navigation/traceability aid only. No tests were run, no application code was changed, and technical contracts/runtime verification remain open.
