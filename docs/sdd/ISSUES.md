# VeriLyft Issues, Risks, and Open Questions

**Last updated:** 30 October 2026  
**Repository:** `dev-adeshina/small-pudo`  
**Owner decisions:** D-01–D-15 (DEC-022–DEC-036) have accepted high-level outcomes. DEC-036 accepts the P0/P1/deferred launch approach; requirement-level classification and evidence mapping remain open.

This is the current issue register. Older archive-based observations have been reconciled where current implementation or later test evidence supersedes them. Source presence is not the same as runtime verification.

Status labels: `OPEN`, `INVESTIGATING`, `BLOCKED`, `DEFERRED`, `RESOLVED`.

## Open / investigating items

### VLY-004 — Guest order recovery and optional claiming policy accepted; implementation/evidence open

- **Status:** POLICY ACCEPTED — DEC-035 (30 October 2026); technical design and runtime verification remain OPEN.
- **Priority:** Medium
- **Evidence:** Guest order access currently relies on a random access token; customer order-history functionality exists. The owner accepted secure recovery through proof of control of the original checkout email and optional account claiming through authenticated account context plus a separate ownership challenge. Current source/runtime behaviour has not been revalidated as implementing this policy.
- **Risk:** A customer may lose access after losing browser storage or changing devices; insufficient verification could expose an order or associate it with the wrong account.
- **Next action:** During the post-SDD source reconciliation, inspect the existing token lifecycle and email recovery facilities; define challenge format/lifetime, rate limits, credential rotation/revocation, eligibility, support exceptions, and detailed tests before implementation.
- **Acceptance:** Order ID or email match alone never grants access; recovery requires proof of control of the original checkout email; claiming requires authenticated account context plus a separate ownership challenge; orders cannot be multiply claimed or silently transferred; credentials/challenges expire and resist replay/abuse; failures do not disclose order existence; recovery/claiming do not alter commercial or fulfilment state.

### VLY-005 — Payment expiry, late events, and stock release need focused verification

- **Status:** INVESTIGATING
- **Priority:** High
- **Evidence:** Order creation, cancellation, Paystack verification, and webhook handling exist. Source review noted signature verification and duplicate-event protection, but the complete runtime matrix has not been independently rerun in this review.
- **Next action:** Test unpaid expiry, retry, cancellation, duplicate webhook, late successful payment after cancellation, and stock restoration.
- **Acceptance:** Repeated events cannot double-process payment or stock; every state transition has a defined outcome.

### VLY-007 — Telegram delivery integration deferred under DEC-034

- **Status:** DEFERRED
- **Priority:** Medium
- **Evidence:** Telegram delivery notifications are not implemented.
- **Policy update:** DEC-034 accepts event-driven notifications with role-based recipient/data access, bounded retries, deduplication, and failure visibility. Telegram remains deferred; any future paid-order Telegram notification requires Admin **Assign For Delivery** approval and a separately approved purpose/audience/disclosure policy.
- **Next action:** Define the detailed event/channel/recipient/field matrix and notification operational ownership. Do not implement Telegram merely because the gate is documented.
- **Constraint:** Paid orders should initially be sent only after an administrator approves delivery assignment. Keep credentials server-side and avoid unnecessary customer data.

### VLY-009 — Security boundary verification is incomplete

- **Status:** INVESTIGATING
- **Priority:** High before production certification
- **Evidence:** Firestore rules are stored in `firestore.rules`; the tracker records two local Emulator runs with 11/11 tests passing. Those tests do not prove that all privileged APIs and the deployed environment are secure.
- **Next action:** Review all privileged API routes and Firestore rules together, verify deployed configuration, and test admin/custom-claim behaviour.
- **Acceptance:** Every privileged action is server-authorized; direct client access is appropriately restricted; no production security certification is claimed without evidence.

### VLY-010 — Admin authorization runtime regression tests outstanding

- **Status:** INVESTIGATING
- **Priority:** High
- **Evidence:** `lib/admin-auth.ts` calls `/api/admin/auth/verify` and `/api/admin/auth/claim`. The verify endpoint checks a verified email against `ADMIN_EMAILS`. The dashboard, products, categories, and orders pages call the shared client guard in current source. A previous report said a normal customer could reach `/admin` after restarting the browser; source inspection alone neither reproduces nor disproves that runtime report.
- **Latest check:** On 28 October 2026 the user reported that `npx tsc --noEmit` passed and `npm run dev` started successfully on Next.js 16.4.2. No browser authorization test has been reported yet.
- **Next action:** With a regular customer account, test direct navigation to `/admin`, `/admin/orders`, `/admin/products`, and `/admin/categories`; verify redirect and session preservation. Then test authorized-admin access and privileged API denial.
- **Acceptance:** Ordinary customers cannot access protected pages or privileged APIs; denial does not unnecessarily sign a customer out; legitimate admin email/password and Google flows remain functional.

### VLY-011 — Cloudinary authorized/unauthorized upload behaviour needs runtime verification

- **Status:** INVESTIGATING
- **Priority:** High
- **Evidence:** Cloudinary is the current selected integration. The inspected upload route has server-side checks for admin authorization, permitted folders, file size, MIME type, and file signature. A previous 401/upload failure was reported; a successful authorized upload and a denied upload have not been confirmed in the current runtime checkpoint.
- **Next action:** Test a permitted upload as an authorized admin and the same endpoint as an ordinary customer; verify the persisted URL and rejection behaviour without exposing credentials.
- **Acceptance:** Authorized valid images upload and persist; unauthorized, oversized, or invalid files are rejected; secrets remain server-side.

### VLY-012 — Admin dashboard still contains demo metrics

- **Status:** OPEN
- **Priority:** High for Admin Portal readiness
- **Evidence:** The source-level audit found hardcoded statistics, sample recent-order entries, and a literal date in `app/admin/page.tsx`.
- **Impact:** The dashboard can display figures that do not represent current Firestore/payment/order records.
- **Next action:** After security verification, define a small set of computable launch metrics and their existing data sources. Replace demo values only through a separately agreed focused implementation task.
- **Acceptance:** No fabricated metrics or activity; definitions distinguish current-state counts from date-filtered totals and do not double-count linked records.

### VLY-013 — Inactive category/product visibility requires runtime regression verification

- **Status:** INVESTIGATING
- **Priority:** Medium
- **Evidence (checked 29 October 2026):** PR #3, `fix: hide inactive categories and products from storefront`, is merged into `main` at `c56be9b121e6007e1e99c6df2d3984e709771a92`. Source inspection confirms inactive category pages return not-found, inactive products are filtered from category listings, and product details reject inactive categories. This source inspection did not run browser tests.
- **Next action:** Verify active/inactive category and product scenarios in the browser and ensure inactive products cannot be purchased through the server order-creation endpoint.
- **Acceptance:** Inactive categories and products are not publicly browsable or purchasable, while admin management remains available; runtime evidence is recorded separately from source presence.

### VLY-014 — Category product-count/slug protection mismatch

- **Status:** INVESTIGATING
- **Priority:** Medium
- **Evidence (checked 29 October 2026):** The current product type and create/update/query helpers use `categoryId`, while `getCategoryProductCount` queries `category == slug`. PR #4 proposes a compatibility fix and is open/unmerged; the prevalence of legacy records has not been checked against production data.
- **Next action:** Review PR #4 against the current schema and existing records; verify the intended behaviour before merging or changing data.
- **Acceptance:** Product counts and category slug-change protection work with the current schema and any explicitly supported legacy records; no unnecessary data migration.

### VLY-015 — Requirement-level launch priority baseline merged; source mapping merged; acceptance evidence design in progress

- **Status:** IN PROGRESS — priority baseline and source mapping merged; detailed acceptance/evidence catalogue drafted
- **Priority:** Blocking for implementation planning until P0 acceptance evidence and full SDD approval are complete
- **Evidence:** PR #31 reviewed and merged to `main` at `e0f69055d33dd9399c23e1d793f359468229c856`. `PLATFORM_REQUIREMENT_PRIORITY_MATRIX.md` now records the owner-reviewed P0, Conditional P0, P1 and Deferred mapping for A-01–A-20 and ADM-R01–ADM-R54.
- **Limit:** Priority acceptance is not approval of the complete platform SDD, technical design, implementation, testing, or production readiness. Detailed policies, contracts, acceptance scenarios and operational evidence remain open.
- **Current source evidence:** Refreshed read-only source traceability at the PR #31 baseline maps all A-01–A-20 and ADM-R01–ADM-R54 to source presence, partial coverage, or no active source found in the inspected tree. Storefront checkout/orders and Paystack paths have source foundations; independent shipment/PUDO/intake/custody/pricing/routing/movement/delivery-proof/general audit/refund/reconciliation capabilities were not found in active source. Runtime and production evidence remain unverified.
- **Next action:** Owner-review `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md`; resolve its policy dependencies and confirm whether root `pudo.zip` is in scope; then produce approved test specifications and collect runtime/production evidence.
- **Acceptance:** Every P0/Conditional P0 has an approved contract, source status, repeatable acceptance scenario, evidence source and actual verification state; no requirement is labelled implemented/tested/ready without supporting evidence.

### VLY-017 — P0 acceptance scenarios and evidence catalogue require owner review

- **Status:** OPEN — draft prepared; owner review pending
- **Priority:** Blocking for implementation approval and launch evidence planning
- **Evidence:** `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md` drafts scenario outlines for all 20 cross-domain areas A-01–A-20 and maps ADM-R01–ADM-R54. It defines required case records, evidence classes, universal pass rules, conditional-P0 activation gates, and unresolved policy dependencies.
- **Limit:** These are test-design scenarios, not executed tests or final approved test scripts. Numeric limits, formulas, proof methods, permission boundaries, retention, retries and other unresolved DEC-022–DEC-036 details remain explicit blockers. No tests were run.
- **Next action:** Review scenario scope and wording; resolve policy dependencies in the authoritative SDD documents; approve test specifications before any execution. Then gather runtime evidence in safe non-production environments and production-readiness evidence separately.
- **Acceptance:** Each P0/Conditional P0 has an approved, reproducible test specification with preconditions, actor, action, expected state and non-state changes, replay/failure behavior, evidence artifacts, cleanup and accountable reviewer. Conditional P0 activation gates are verified before enabling triggers.

### VLY-016 — Shipment/PUDO/pricing operational implementation is not present in the inspected Admin routes

- **Status:** OPEN
- **Priority:** High for the approved parcel-operations launch scope
- **Evidence:** The source-level audit found no dedicated Admin routes in the inspected paths for shipments, PUDO management, delivery pricing, transactions, or audit logs. Existing order shipping metadata does not by itself implement independent shipments or route-leg movements.
- **Latest source check:** The second source pass found no dedicated shipment, pricing, PUDO, route/movement, or audit service module in the active TypeScript source inventory. This is a source-surface finding only; Firestore data and the uninspected `pudo.zip` archive were not checked.
- **Policy update:** DEC-023 resolves D-02: only registered, authenticated customers may create independent shipment bookings at launch. DEC-024 resolves D-03's high-level policy: booking party, sender, receiver/collection recipient, payer, and handover person may differ; payer visibility defaults to payment confirmation/receipt only; payment does not authorize full shipment-detail access; booking does not authorize collection; change authority is defined by type and lifecycle stage. Guest shipment booking remains excluded and storefront guest checkout is unchanged.
- **Still open:** Detailed verification checkpoints, sender/receiver consent, change-type permissions, post-intake/post-dispatch controls, business-account handling, and runtime tests.
- **Next action:** Complete the remaining owner decisions and reconcile the platform-wide SDD, then design the smallest compatible data and workflow representation after SDD approval.
- **Acceptance:** Shipment, order, payment, and transport-movement identities/lifecycles remain distinct; booking creation and customer-scoped access are server-authorized; no schema changes occur before review.

### VLY-017 — Privileged-action audit trail and minimum evidence handling need review

- **Status:** OPEN
- **Priority:** High for operational/legal readiness
- **Evidence:** No dedicated audit-log route was found in the inspected `app/admin` paths. A reusable audit helper or records elsewhere have not been ruled out.
- **Latest source check:** The active TypeScript `app/api` route inventory and `lib/` module inventory do not show a dedicated general audit-log or financial-event service. The Paystack webhook uses `paymentWebhookEvents` for idempotency/outcome handling; this is not a general audit trail. The root `pudo.zip` archive has not been inspected and is not treated as active source.
- **Next action:** Confirm whether `pudo.zip` is in scope; if not, continue with the active Next.js app and define the minimum audit/evidence requirements in the SDD.
- **Acceptance:** Important privileged decisions are traceable with actor, timestamp, action, target, reason where appropriate, and outcome; do not build an elaborate audit platform before verifying existing facilities.

### VLY-018 — Guest order-tracking email inbox placement

- **Status:** INVESTIGATING
- **Priority:** Low
- **Evidence:** Guest order-tracking email via Resend and a verified sender domain were reported working, but an early test landed in junk.
- **Next action:** Monitor delivery/inbox placement and maintain correct sender/domain configuration.
- **Acceptance:** Successful sends are observable and failures are handled without leaking API credentials or guest access tokens.

## Resolved / superseded historical items

### VLY-001 — Full repository TypeScript/build status unavailable in the original archive

- **Status:** RESOLVED for the original archive limitation; ongoing build verification remains a routine release check.
- **Evidence:** The current repository has root configuration. On 28 October 2026 the user reported `npx tsc --noEmit` passed and `npm run dev` reached ready state under Next.js 16.4.2. A current production build was not run in this checkpoint.
- **Follow-up:** Rerun `npx tsc --noEmit` and `npm run build` after application-code changes.

### VLY-002 — Authenticated order/customer UID association

- **Status:** RESOLVED based on the current progress record and prior implementation/testing reports.
- **Evidence:** Authenticated order creation associates orders server-side with the verified Firebase UID while preserving guest checkout.
- **Constraint:** Reinspect current source before modifying this path; clients must never choose another user's UID.

### VLY-003 — Customer account experience

- **Status:** RESOLVED based on implemented and previously tested flows.
- **Evidence:** Customer registration, sign-in/out, recovery, dashboard, profile, and customer-scoped order history/details are recorded as implemented. Profile persistence and cross-customer order-detail denial were reported tested.
- **Constraint:** Keep customer identity separate from admin authorization.

### VLY-006 — Customer-facing order tracking

- **Status:** RESOLVED based on current progress and reported tests.
- **Evidence:** A guest order-tracking page under `app/track-order/`, token-protected tracking API, and guest tracking email are recorded as implemented. Continue regression testing.

### VLY-008 — Cloudinary hosting decision

- **Status:** RESOLVED as a product decision; integration runtime verification is tracked by VLY-011.
- **Evidence:** Cloudinary was selected because of the Firebase free-tier/storage constraints, and the current code includes the integration.
- **Decision reference:** DEC-008 in `DECISIONS.md`.

## Accepted owner policies and remaining specification work

All 15 tracked high-level owner decisions are accepted and recorded in DEC-022–DEC-036. The following are unresolved details or verification tasks, not pending D-01–D-15 decisions:

1. **Guest-order recovery/claiming (DEC-035):** challenge format/lifetime, rate limits, token rotation/revocation, post-fulfilment eligibility, account closure, support exception procedure, and runtime evidence.
2. **Shipment lifecycle:** booking-to-shipment gate, parcel cardinality, detailed transitions, amendment/cancellation authority, route-leg relationships, and return outcomes.
3. **Pricing and adjustments (DEC-026–DEC-027):** formulas, units, distance/rate configuration, fees/taxes/discounts, discrepancy thresholds, consent, approval limits, and dispute/refusal outcomes.
4. **Physical operations (DEC-025, DEC-028, DEC-030–DEC-032):** staff assignment, partner access, measurement requirements, payment evidence, collection verification, route constraints, mandatory movement/delivery evidence, and exception-resolution authority.
5. **Financial operations (DEC-028–DEC-030):** payment method/provider configuration, refund limits/timelines, credit rules, late-payment disposition, reconciliation cadence/ownership, and approval thresholds.
6. **Notifications (DEC-034):** event timing, recipient/channel/field matrix, consent/preferences, contact verification, retry/deduplication semantics, retention, and persistent-failure ownership.
7. **Audit/evidence (DEC-033):** event catalogue, retention schedule, reviewer/access matrix, correction/redaction controls, deletion/anonymization, legal-hold authority, evidence integrity, and disclosure procedure.
8. **Staff and actor permissions (DEC-022, DEC-025):** action-level permission matrix, assignment, sensitive-action approval limits, second-person cases, and partner/external access.
9. **Launch readiness (DEC-036):** requirement-level P0/P1/deferred mapping, concrete acceptance scenarios/evidence, production-like environment, blocker ownership, backup/restore, monitoring, incident response, rollback, and dated sign-off.

Specify these details, trace them to existing source, and support them with acceptance/evidence plans before implementation. Do not reopen accepted high-level decisions unless new evidence reveals a genuine conflict.

### VLY-019 — Platform-wide SDD completeness and reconciliation

- **Status:** OPEN
- **Priority:** Blocking for new application-code implementation under the current owner-approved working direction.
- **Evidence:** PR #7 (actor/responsibility), PR #8 (shared workflows), PR #9 (domain/lifecycle/API/security draft), and PR #10 (implementation source traceability) are merged. The follow-up source pass is recorded in `IMPLEMENTATION_SOURCE_TRACEABILITY.md`; it checked current TypeScript helpers, Admin pages, Firestore rules/tests, payment routes, and design decisions. The drafts and source map expose remaining owner decisions, scope questions, and runtime verification work; merging documents does not approve unresolved policy.
- **Next action:** Confirm whether the root `pudo.zip` archive is in scope for the active source review; resolve remaining owner decisions in `DECISIONS.md`; reconcile the source findings with the completeness audit and acceptance criteria. D-01's high-level staff model is accepted as DEC-022, while action-level permissions and approval rules remain design work. Application-code implementation remains blocked until the platform-wide SDD is reviewed and approved.
- **Acceptance:** Every launch-essential workflow has an agreed owner, lifecycle, permissions, data relationships, API/integration expectations, exception handling, and acceptance/test criteria; unresolved business rules are explicitly listed for owner decision; continuity docs agree on status and evidence; no application code is changed to close this issue.

### VLY-020 — Shared platform workflows require owner review

- **Status:** OPEN
- **Priority:** Blocking for detailed implementation planning
- **Evidence:** `PLATFORM_SHARED_WORKFLOWS.md` was reviewed and merged in PR #8 on 29 October 2026. It establishes a reviewed workflow-draft baseline but leaves detailed policy unresolved by design.
- **Policy update:** DEC-024 and BP-01–BP-22 in `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md` now resolve the owner-policy direction for booking-party changes/cancellation, sender/receiver requests, collection authority, transfer/withdrawal, delegated access, privacy, disputes, and appeals. These topics must not continue to be described as unanswered owner choices.
- **Next action:** Specify the remaining operational/technical details—verification and consent evidence, complete change/lifecycle matrix, exception authority, transfer-liability procedure, delegated-access action/duration, notification fields, retention, dispute targets/reviewer/appeal mechanics—and reconcile them with source and acceptance evidence. Keep the issue open until launch-essential workflows have implementable contracts and testable acceptance criteria.
- **Acceptance:** Each launch-essential workflow has an agreed owner, trigger, transitions, exception outcomes, permissions, evidence, and testable acceptance criteria—or a clearly recorded owner decision/blocker. No application code is changed to close this issue.

### VLY-021 — Conceptual domain, lifecycle, and API/security contracts require review

- **Status:** OPEN
- **Priority:** Blocking for implementation design
- **Evidence:** The domain/lifecycle/API/security draft is merged but remains a draft for owner review. `IMPLEMENTATION_SOURCE_TRACEABILITY.md` now includes a second source pass: all four inspected Admin pages call `verifyAdminAccess`; category/product helpers use client Firestore writes behind custom-claim rules; checkout uses the server order route while a legacy client-side order helper remains; the webhook event record is for deduplication rather than a general audit ledger. Independent booking/PUDO/pricing/routing/audit source surfaces and complete runtime evidence remain unresolved. No tests were executed and production configuration/data were not inspected.
- **Next action:** Confirm whether `pudo.zip` is authoritative/in-scope; then resolve the open domain, pricing, custody, routing, financial-event, and audit decisions and reconcile the full SDD acceptance matrix. Do not implement until the complete SDD is approved.
- **Acceptance:** Owner-approved conceptual relationships and transition rules exist for launch-essential flows; API/security contracts define validation, authorization, failure, idempotency, concurrency, and audit expectations; source facts and runtime evidence are documented separately; no application code is changed to close this issue.

## Source-traceability checkpoint — 29 October 2026

- PR #10 is merged. A second read-only pass expanded the source map to include category/product client helpers, all four Admin page guards, payment recovery surfaces, and the distinction between webhook deduplication and a general audit ledger.
- `pudo.zip` is present at repository root but has not been inspected; confirm whether it belongs to the active VeriLyft source scope before including it in the SDD evidence model.
- The Admin authorization issue remains a runtime verification task; current source calls `verifyAdminAccess` on all four inspected Admin pages, but no browser reproduction was performed.

- `IMPLEMENTATION_SOURCE_TRACEABILITY.md` records the current read-only source inventory and distinguishes source presence from runtime evidence.
- PR #3 is merged; its source change is present, but browser regression verification remains open under VLY-013.
- PR #4 remains open/unmerged; do not describe its proposed compatibility fix as part of `main`.
- Current baseline inspected: `c56be9b121e6007e1e99c6df2d3984e709771a92`.
- Application-code implementation remains blocked by VLY-019 until the platform-wide SDD is reconciled and approved.

## Maintenance rule

When new evidence arrives, update the relevant issue in this file and the matching row/session log in `PROGRESS.md`. Record material architecture/product decisions in `DECISIONS.md`. Do not close an issue solely because a source file exists; use actual test results where the acceptance criterion requires runtime behaviour.

### D-06 measurement discrepancy and adjustment approval — DEC-027

- **Status:** High-level owner policy accepted; detailed rules remain open.
- **Accepted:** Use configurable, service-appropriate thresholds; preserve quoted and actual intake measurements separately; retain actor/location/time and applicable evidence; link proposals to the original quote; require review for material discrepancies and adjustments affecting existing payments; keep proposed adjustments separate from approved charges and settled financial events.
- **Still open:** Numeric thresholds, units and service-specific measurement requirements, staff approval limits, second-person rules, customer notification/consent, and explicit acceptance/dispute/refusal outcomes.
- **Next action:** Resolve D-07 payment-at-intake methods and evidence, then continue the dependency-ordered owner decisions. Keep the platform-wide SDD approval gate in force; no application code changed or tested for this policy decision.


### D-08 cancellation, late payment, refunds, credits, and reconciliation — DEC-029

- **Status:** High-level owner policy accepted on 30 October 2026 (Option A: explicit financial events with controlled transitions and reconciliation).
- **Accepted:** Cancellation is not a refund; late payments after cancellation/expiry are recorded and reconciled without automatic reactivation; refund request and execution are distinct; credits, additional payments, reversals, and chargebacks remain separate traceable events; provider/bank reconciliation mismatches are investigated; consequential financial actions retain actor/time/reason/reference/evidence; duplicate/replayed provider events must not duplicate financial effects; operational, cancellation, payment, and refund states remain distinct.
- **Still open:** Refund authority/limits/timelines, cancellation fees, partial-refund policy, credit expiry/use, late-payment disposition, reconciliation frequency/ownership, exception handling, and detailed tests.
- **Next action:** Continue to D-09 dispatch exception authority. Preserve the platform-wide SDD approval gate; no application code changed or tested for this policy decision.

### D-09 dispatch exception authority — DEC-030

- **Status:** High-level owner policy accepted on 30 October 2026 (Option A: narrow, controlled dispatch exceptions).
- **Accepted:** Verified payment remains the default dispatch prerequisite; exceptions are limited to explicitly defined operational circumstances under an approved policy; only staff with explicitly assigned permission may approve; the requester must not automatically approve their own request; material exceptions require a second approver; exceptions preserve payment status and cannot bypass unrelated safety, custody, identity, legal, or other operational holds; parcel/shipment, reason, requester, approver(s), timestamp, supporting evidence, and outcome must be attributable.
- **Still open:** Eligible circumstances, exact permission assignment, materiality/second-approval rules, monetary or operational limits, category-specific evidence, pre-dispatch revocation, and detailed acceptance tests.
- **Next action:** D-10 routing, route-leg assignment, and movement evidence is accepted as DEC-031. Continue to D-11 delivery proof and failed-delivery resolution. Preserve the platform-wide SDD approval gate; no application code changed or tested for this policy decision.


### D-10 routing, route-leg assignment, and movement evidence — DEC-031

- **Status:** High-level owner policy accepted on 30 October 2026 (Option A: controlled, evidence-based movement).
- **Accepted:** Route proposal, approval, route-leg assignment, dispatch, physical handover, and arrival confirmation are distinct; proposal/assignment is not proof of movement; Operations manages launch-time proposals and assignments; route changes require explicitly assigned authority and preserve history, actor, and reason; movement evidence distinguishes physical actor from staff recorder when staff enter provider/driver events; delays, missed handovers, missing parcels, damage, and disputed custody transfers remain explicit exceptions; Driver Portal remains deferred.
- **Still open:** Route constraints, exact permissions and any two-person approvals, mandatory milestones/evidence, provider/resource/capacity rules, correction authority, detailed exception outcomes, and acceptance tests.
- **Next action:** Continue to D-11 delivery proof and failed-delivery resolution. Preserve the platform-wide SDD approval gate; no application code changed or tested for this policy decision.


### D-11 delivery proof and failed-delivery resolution — DEC-032

- **Status:** High-level owner policy accepted on 30 October 2026 (Option A: evidence-based delivery with controlled outcomes).
- **Accepted:** Attempt, successful delivery, failed delivery, customer collection, and return are distinct; successful delivery requires approved service-appropriate evidence and a staff status update alone is insufficient; recipient authority follows DEC-024; proof methods remain flexible by service; failed attempts retain reasons; reattempt, return, holding, refusal, cancellation, and financial adjustments require explicit authority; significant notifications respect party entitlements; disputed delivery preserves original evidence/history.
- **Still open:** Mandatory methods by service, OTP requirement, attempt limits, resolution authority, holding duration, failure-reason catalogue, loss/damage/refusal/dispute handling, customer-contact details, and detailed acceptance tests.
- **Next action:** Continue to D-12 audit, evidence retention, correction, and disclosure. Preserve the platform-wide SDD approval gate; no application code changed or tested for this policy decision.


### D-12 audit, evidence retention, correction, and disclosure — DEC-033

- **Status:** High-level owner policy accepted on 30 October 2026 (Option A: accountable, evidence-based recordkeeping).
- **Accepted:** Consequential actions require attributable history; actor/action/resource/time/reason and relevant evidence are recorded; physical actor is distinguished from staff recorder; audit entries alone do not prove physical events; original records/evidence are preserved; corrections/redactions remain separately authorized and traceable; retention/deletion is category- and purpose-appropriate with legal holds respected; audit/evidence access is restricted and sensitive access/disclosure is auditable; government requests require recorded authority, basis, scope, approval, and disclosure details and do not grant unrestricted access.
- **Still open:** Retention periods, full event/evidence catalogue, reviewer/access matrix, two-person approval cases, deletion/anonymization procedures, legal-hold authority, detailed government-request workflow, evidence integrity/verification, and acceptance tests.
- **Historical checkpoint:** This next-decision instruction was superseded when D-13 / DEC-034 was accepted and merged in PR #27. Continue with detailed notification specification under DEC-034.


### D-13 customer notifications and Telegram boundary — DEC-034

- **Status:** High-level owner policy accepted on 30 October 2026 (Option A: controlled, event-driven notifications with role-based information access).
- **Accepted:** Notifications derive from meaningful, verified business events and do not change or independently establish business state; recipient eligibility follows DEC-024/DEC-032 party relationships and entitlements; payer receives relevant financial notifications by default, not full shipment details; message content is minimized and authenticated links preserve access controls; email is primary where configured, SMS optional with explicit configuration and applicable consent/contact verification, and in-platform notifications may serve authenticated experiences; Telegram remains deferred and any future paid-order Telegram notification must follow Admin **Assign For Delivery** approval plus separately approved purpose/audience/disclosure policy; duplicate sends are prevented per event/recipient/channel; bounded retries and attributable attempts/outcomes are required; persistent failures are surfaced without silent fallback.
- **Still open:** Final event catalogue/timing, mandatory/optional channel matrix, customer preferences/consent/contact verification, message templates/field matrix, retry limits/intervals, deduplication semantics, failure ownership/escalation, retention, and detailed acceptance tests.
- **Historical checkpoint:** This next-decision instruction was superseded when D-14 / DEC-035 was accepted and merged in PR #28. Continue with technical recovery/claiming specification under DEC-035.


### D-15 launch priority and production-readiness — DEC-036

- **Status:** High-level owner policy accepted on 30 October 2026 (Option A: evidence-based launch with a clearly bounded P0 scope).
- **Accepted:** Establish P0/P1/deferred priorities; P0 requirements are launch blockers and require demonstrable evidence. P1 may follow only if deferral does not compromise essential workflows, safety, security, financial integrity, legal obligations, or approved scope. Deferred items remain unavailable for initial launch. P0 must support DEC-018 and the reconciled essential requirements. Source presence, rendered pages, schemas, or passing type/build checks alone are not launch evidence. Readiness evidence must cover applicable functional, security/authorization, financial, operational/physical-event, and production/recovery dimensions. Designed, implemented, tested, production-like verified, and owner-accepted states remain distinct. Unverified P0 and material launch-critical security/financial/operational/production gaps block release absent resolution or separately approved lawful exception.
- **Still open:** Requirement-level priority mapping; exact P0 scenarios/evidence; production-like environment; blocker ownership/exception authority; deployment/rollback runbook; backup/restore proof; monitoring thresholds; incident response ownership; and dated release checklist/sign-off.
- **Next action:** Reconcile the entire platform-wide SDD, source traceability, requirement-level priority matrix, acceptance scenarios, and evidence plan; obtain explicit owner approval of the complete SDD before implementation work.

### VLY-022 — Booking-party authority operational and technical contracts remain open

- **Status:** OWNER POLICY ACCEPTED — BP-01–BP-22 under DEC-023/DEC-024 (30 October 2026); operational specification, source reconciliation, and runtime evidence remain OPEN.
- **Priority:** Blocking for independent-shipment booking implementation and approval.
- **Evidence:** The owner explicitly accepted the booking-party authority policy covering pre-intake changes/cancellation, sender/receiver requests, Support/Admin escalation, collection, booking transfer/withdrawal, exceptional legal circumstances, delegated access, compromised accounts, deletion/retention, disputes, timeframes, and appeals. The accepted policies are consolidated in `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`.
- **Risk:** Incomplete verification, consent, lifecycle, financial-liability, collection, or dispute controls could permit unauthorized booking changes, disclosure, financial responsibility transfer, or parcel release.
- **Next action:** Define the outstanding dependencies listed in Section 4 of the policy record; reconcile shared workflows, lifecycle/security contracts, actor responsibilities, acceptance scenarios, and current source before any implementation proposal.
- **Acceptance:** Each accepted policy has a defined actor, trigger, verification/authorization, lifecycle preconditions, evidence, failure/exception outcome, audit history, and testable acceptance criteria. No application code is changed to close this issue.
