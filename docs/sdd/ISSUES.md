# VeriLyft Issues, Risks, and Open Questions

**Last updated:** 31 October 2026  
**Repository:** `dev-adeshina/small-pudo`  
**Owner decisions:** D-01–D-15 (DEC-022–DEC-036), DEC-037–DEC-044, PM-01–PM-12, and BP-01–BP-22 have accepted owner-policy outcomes at their recorded levels. Detailed operational procedures, technical contracts, acceptance-test specifications, runtime evidence, and production readiness remain open.

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

### VLY-015 — Requirement priorities, source mapping, and P0 evidence design established; detailed specifications remain open

- **Status:** IN PROGRESS — priority/source mapping, A-01–A-20 scenario review and dependency register are merged; readiness assessment proposed; executable test specifications and full SDD approval remain open
- **Priority:** Blocking for implementation planning and launch evidence approval
- **Evidence:** PR #31 established the owner-reviewed priority matrix; PR #32 refreshed source mapping at `e0f69055d33dd9399c23e1d793f359468229c856`; PR #39 merged all owner-approved A-01–A-20 scenario refinements; PR #41 merged the dependency register; PR #42 (proposed) adds the P0/Conditional P0 readiness assessment.
- **Limit:** These approvals do not approve the complete platform SDD, detailed technical contracts, executable test specifications, implementation, test execution, or production readiness. Source inventory is not runtime evidence.
- **Current readiness:** The matrix contains 45 P0 and 6 Conditional P0 Admin requirements. The catalogue contains 20 A-area outlines and 80 case rows. No P0/Conditional P0 requirement is approved for execution. Narrow source-backed storefront/payment regression specifications can be drafted; independent shipment, pricing, custody, routing, refund/reconciliation, general audit, live dashboard, privacy and production-readiness capabilities remain blocked by absent source or unresolved contracts.
- **Next action:** Owner-review the readiness assessment; confirm initial launch scope and conditional triggers/manual fallbacks; resolve blockers; then author reproducible case-level specifications before any non-production execution.
- **Acceptance:** Every P0/Conditional P0 has an approved contract, source status, repeatable test specification, evidence source and actual verification state; no requirement is labelled implemented/tested/ready without supporting evidence.

### VLY-017 — P0 acceptance scenario catalogue owner review completed

- **Status:** RESOLVED — owner review and policy/scenario-design approval completed; PR #39 merged on 30 October 2026.
- **Priority:** Historical blocker for catalogue owner review; executable specification and evidence gates remain tracked under VLY-015 and VLY-019–VLY-021.
- **Evidence:** The owner explicitly approved all A-01–A-20 sections at the policy/scenario-design level. PR #39 merged the approved refinements into `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md` and updated the continuity records.
- **Limit:** The catalogue remains test design, not executable test scripts or test results. Numeric limits, formulas, proof methods, permission boundaries, retention, retries and other unresolved DEC-022–DEC-036 details remain specification dependencies. No tests were run and implementation/release are not approved.
- **Resolution:** Owner review of the scenario-design approach is complete. The dependency register was merged in PR #41. Continue with case-level specifications only after the readiness blockers and policy inputs are resolved.

### VLY-016 — Shipment/PUDO/pricing operational implementation is not present in the inspected Admin routes

- **Status:** OPEN
- **Priority:** High for the approved parcel-operations launch scope
- **Evidence:** The source-level audit found no dedicated Admin routes in the inspected paths for shipments, PUDO management, delivery pricing, transactions, or audit logs. Existing order shipping metadata does not by itself implement independent shipments or route-leg movements.
- **Latest source check:** The second source pass found no dedicated shipment, pricing, PUDO, route/movement, or audit service module in the active TypeScript source inventory. This is a source-surface finding only; Firestore data and the uninspected `pudo.zip` archive were not checked.
- **Policy update:** DEC-023 resolves D-02: only registered, authenticated customers may create independent shipment bookings at launch. DEC-024 resolves D-03's high-level policy: booking party, sender, receiver/collection recipient, payer, and handover person may differ; payer visibility defaults to payment confirmation/receipt only; payment does not authorize full shipment-detail access; booking does not authorize collection; change authority is defined by type and lifecycle stage. Guest shipment booking remains excluded and storefront guest checkout is unchanged.
- **Still open:** Detailed verification checkpoints, sender/receiver consent, change-type permissions, post-intake/post-dispatch controls, business-account handling, and runtime tests.
- **Next action:** Complete the remaining owner decisions and reconcile the platform-wide SDD, then design the smallest compatible data and workflow representation after SDD approval.
- **Acceptance:** Shipment, order, payment, and transport-movement identities/lifecycles remain distinct; booking creation and customer-scoped access are server-authorized; no schema changes occur before review.

### VLY-023 — Privileged-action audit trail and minimum evidence handling need review

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
- **Evidence:** PRs #7–#10 established the actor, workflow, lifecycle/API/security, and source-traceability drafts. PR #40 reconciled continuity and issue status; PR #41 consolidated the A-01–A-20 and ADM-R01–ADM-R54 dependency register; PR #42 established a P0/Conditional P0 test-specification readiness baseline. PRs #45–#51 recorded owner-approved DEC-038–DEC-044 policy refinements, and PR #52 recorded Milestone 3 completion. PRs #53–#63 advanced the Milestone 4 documentation baseline: PR #55 corrected Admin status/history, PR #56 actor/permission references, PR #57 requirement/priority crosswalks, PR #58 P0 catalogue/readiness crosswalks, PR #60 completed the first status/reference scan, PR #61 corrected the A-10 approval wording against DEC-043, PR #62 aligned DEC-038–DEC-041 status references, and PR #63 clarified the Finance responsibility/deployment boundary. The current verified `main` baseline is PR #63 merge commit `9c764e9f0c3a43ee7cae92f607480e1fc386c704`.
- **Limit:** The register is a navigation/traceability aid, not approval of detailed technical contracts, executable test specifications, runtime evidence, or production readiness. The active source-inspection baseline remains `e0f69055d33dd9399c23e1d793f359468229c856`; repository-history comparison through PR #63 found documentation-only intervening changes. The root `pudo.zip` archive and production environment remain uninspected.
- **Next action:** Complete Milestone 4 in dependency order: reconcile the continuity baseline; compare all accepted decisions across the complete SDD; refresh read-only source traceability (including an explicit scope decision on root `pudo.zip`); complete detailed workflow/lifecycle/security contracts and executable acceptance-test specifications; and plan production-readiness evidence. Application-code implementation remains blocked until the complete platform-wide SDD is explicitly approved.
- **Acceptance:** Every launch-essential workflow has an agreed owner, lifecycle, permissions, data relationships, API/integration expectations, exception handling, and acceptance/test criteria; unresolved technical questions and scope limits are explicit; continuity documents agree; no application code is changed to close this issue.

### VLY-020 — Shared platform workflow specification and implementation contracts remain open

- **Status:** IN PROGRESS — owner policy direction is accepted; workflow detail and implementation contracts remain draft.
- **Priority:** Blocking for detailed implementation planning.
- **Evidence:** `PLATFORM_SHARED_WORKFLOWS.md` was established in PR #8. DEC-022–DEC-044, PM-01–PM-12, and BP-01–BP-22 record accepted owner-policy boundaries. DEC-038 resolves the independent-booking confirmation point, service-specific information principle, handover-deadline policy, separation of booking/payment/intake, and customer/Support/Operations/Admin responsibility boundaries. The shared workflow remains a draft; the current requirement dependency register maps workflow anchors to A-01–A-20 and ADM-R01–ADM-R54.
- **Limit:** Owner policy acceptance does not approve exact service durations, pricing/eligibility values, verification methods, operational status values, data/API contracts, evidence fields, or executable acceptance tests.
- **Next action:** Reconcile remaining technical and operational detail—service-specific handover configuration, quote/pricing inputs, identity/consent evidence, complete change/lifecycle matrix, intake hold/refusal and missed-handover outcomes, payment-at-intake/late-payment rules, transfer-liability procedure, delegated-access actions/duration, notification fields, retention, dispute targets/reviewer/appeal mechanics—and trace them to source and acceptance evidence.
- **Acceptance:** Each launch-essential workflow has agreed triggers, transitions, exception outcomes, permissions, evidence and testable acceptance criteria consistent with accepted owner policy. No application code is changed to close this issue.

### VLY-021 — Conceptual domain, lifecycle, and API/security contracts remain incomplete

- **Status:** IN PROGRESS — owner-policy direction is accepted; detailed domain, lifecycle and API/security contracts remain draft.
- **Priority:** Blocking for implementation design.
- **Evidence:** The domain/lifecycle/API/security draft and source-traceability inventory are merged. PR #40 clarified that accepted owner policies are incorporated without approving the technical contracts. The current dependency register maps the draft lifecycle/security anchors and source-level status to A-01–A-20 and ADM-R01–ADM-R54. The inspected source pass found no independent shipment/PUDO/pricing/routing/general audit implementation; existing storefront and payment source remains partial against the wider platform requirements.
- **Limit:** Source inspection is not runtime verification. The root `pudo.zip` archive, deployed configuration, production data, and operational evidence remain uninspected.
- **Next action:** Confirm whether `pudo.zip` is authoritative/in-scope; specify domain relationships, lifecycle guards/transitions, API validation/authorization/failure contracts, idempotency/concurrency/recovery, and audit/evidence expectations; reconcile each against accepted policy and test criteria.
- **Acceptance:** Launch-essential conceptual relationships and transition rules are specified; API/security contracts define validation, authorization, failure, idempotency, concurrency and audit expectations; source facts and runtime evidence remain distinct; no application code is changed to close this issue.

## Source-traceability checkpoint — 29 October 2026

- PR #10 is merged. A second read-only pass expanded the source map to include category/product client helpers, all four Admin page guards, payment recovery surfaces, and the distinction between webhook deduplication and a general audit ledger.
- `pudo.zip` is present at repository root but has not been inspected; confirm whether it belongs to the active VeriLyft source scope before including it in the SDD evidence model.
- The Admin authorization issue remains a runtime verification task; current source calls `verifyAdminAccess` on all four inspected Admin pages, but no browser reproduction was performed.

- `IMPLEMENTATION_SOURCE_TRACEABILITY.md` records the current read-only source inventory and distinguishes source presence from runtime evidence.
- PR #3 is merged; its source change is present, but browser regression verification remains open under VLY-013.
- PR #4 is closed without merge; do not describe its proposed compatibility fix as part of `main`.
- Historical source checkpoint: `c56be9b121e6007e1e99c6df2d3984e709771a92`. The current active source-inspection baseline is `e0f69055d33dd9399c23e1d793f359468229c856`; the PR #52 comparison identified no later application-source change.
- Application-code implementation remains blocked by VLY-019 until the platform-wide SDD is reconciled and approved.

## Maintenance rule

When new evidence arrives, update the relevant issue in this file and the matching row/session log in `PROGRESS.md`. Record material architecture/product decisions in `DECISIONS.md`. Do not close an issue solely because a source file exists; use actual test results where the acceptance criterion requires runtime behaviour.

### D-05 pricing models, inputs, and quote management — DEC-026

- **Status:** High-level owner policy accepted and refined on 30 October 2026; detailed pricing configuration remains open.
- **Accepted:** Each service explicitly uses fixed, calculated, or hybrid pricing; storefront delivery and independent shipment booking share approved pricing rules wherever inputs overlap; services explicitly configure applicable inputs from the approved categories; quote outcomes include draft, issued, accepted, rejected, expired, superseded, and cancelled; customer acceptance is explicit; an unaccepted expired quote requires a fresh quote; recalculation preserves prior versions; quote, accepted agreement, payment, and booking remain distinct; and historical quote/rate context is preserved.
- **Still open:** Exact formulas/rates, authoritative input sources, service-to-model/input mapping, units/conversion, rounding, effective dates/versioning detail, and tax/fee/discount/minimum/special-handling treatment. DEC-038 already resolves that expiry of an accepted quote does not silently cancel or rewrite the confirmed booking or accepted terms; service-specific quote-validity durations and handover-deadline values remain open.
- **Next action:** Continue the cross-document reconciliation of pricing, measurement, quote, adjustment, and financial-event contracts. No application code changed or tested for this policy decision.

### D-06 measurement standards, discrepancy review, and adjustment approval — DEC-027

- **Status:** High-level owner policy accepted and refined on 30 October 2026; detailed rules remain open.
- **Accepted:** Use a shared measurement-recording framework with service-specific required measurements and explicitly configured units; preserve declared and actual measurements separately; do not silently overwrite, convert, or reinterpret recorded values; record actual-measurement actor/location/time and applicable evidence; use configurable service-appropriate discrepancy thresholds without inventing numeric values; link proposed adjustments to the original quote and accepted agreement; require review for material discrepancies and adjustments affecting existing payments; notify customers of price-changing adjustments and require explicit acceptance before collecting additional charges; hold disputed additional charges pending review; and keep proposals separate from approved charges and settled financial events.
- **Accepted DEC-040 refinement:** A customer rejection triggers an authorized service-resolution decision; it does not automatically cancel, refund, credit, or charge. Continuing under original terms is allowed only where safe and commercially feasible; an alternative requires separately accepted pricing; cancellation follows its own policy; dispatch cannot proceed under a rejected revised price. Silence is not acceptance.
- **Still open:** Required measurements and units by service, conversion rules, numeric thresholds, evidence detail, staff approval limits, second-person rules, service-resolution decision authority and eligibility, feasibility criteria, customer response periods/non-response handling, and detailed tests.
- **Next action:** Reconcile detailed pricing/measurement contracts and acceptance criteria, then continue remaining SDD dependencies. Preserve the platform-wide SDD approval gate; no application code changed or tested for this policy decision.

### D-08 cancellation, late payment, refunds, credits, and reconciliation — DEC-029

- **Status:** High-level owner policy accepted on 30 October 2026 (Option A: explicit financial events with controlled transitions and reconciliation).
- **Accepted:** Cancellation is not a refund; late payments after cancellation/expiry are recorded and reconciled without automatic reactivation; refund request and execution are distinct; credits, additional payments, reversals, and chargebacks remain separate traceable events; provider/bank reconciliation mismatches are investigated; consequential financial actions retain actor/time/reason/reference/evidence; duplicate/replayed provider events must not duplicate financial effects; operational, cancellation, payment, and refund states remain distinct.
- **Additional accepted outcomes:** Rejected quotes create no payment obligation from that quote; accepted adjustments record the revised commercial agreement and amount due; disputed additional charges are held pending review; overpayments/underpayments require authorized resolution; failed attempts are not successful settlement; and adjustment rejection does not automatically create a refund, credit, cancellation, or charge.
- **Still open:** Refund authority/limits/timelines, cancellation fees, partial-refund policy, credit expiry/use, late-payment disposition, reconciliation frequency/ownership, exception handling, and detailed tests.
- **Historical next-action note superseded:** D-09 / DEC-030 was accepted. Remaining payment/settlement specification is tracked under DEC-041 and the financial-settlement issue above; preserve the platform-wide SDD approval gate.

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

### Pricing and calculation specification — DEC-039

- **Status:** OWNER BOUNDARIES ACCEPTED (30 October 2026); service-level pricing specification and technical contracts remain OPEN.
- **Priority:** Blocking for pricing/quote implementation and approval across independent shipment booking and storefront delivery.
- **Accepted boundary:** Service-specific approved fixed/calculated/hybrid models; configured inputs only; trusted server as authoritative calculator; transparent applicable charge components; preservation of historical quote inputs and rule/rate context; no invented formulas, rates, units, fees, or thresholds.
- **Still open:** Service catalogue and model assignment; exact input mapping and authoritative input sources; rate/formula catalogue; distance source/bands; units and conversion; rounding; effective dates/versioning detail; taxes, surcharges, discounts, minimums and special-handling treatment; quote validity; measurement discrepancy thresholds; approval limits; and adjustment-rejection service resolution.
- **Risk:** Client-authoritative totals, undocumented input assumptions, hidden fees, inconsistent service pricing, or mutable historical quotes could create financial disputes and undermine quote reproducibility.
- **Next action:** Complete the remaining Milestone 2 decisions on measurement-based adjustment and payment/settlement outcomes, then specify service-level pricing and testable contracts without inventing values. Reconcile the shared workflow, lifecycle contract, acceptance matrix, traceability and source evidence before implementation.
- **Acceptance:** For every service, an authorized reviewer can identify the approved model, applicable inputs and sources, reproducible calculation/rate version, transparent charge breakdown, server-side authority, and preserved historical quote. No application code is changed to close this issue.


### DEC-040 update — measurement adjustment and customer-resolution policy

The owner has approved the high-level rejection-resolution boundary: customer rejection triggers an authorized service-resolution decision and does not automatically cancel, refund, credit, or charge. Continuing under original terms is conditional on safe and commercially feasible fulfilment; an alternative requires separately accepted pricing; cancellation follows the applicable policy. Customer silence is not acceptance, and dispatch cannot proceed under a rejected revised price. Remaining open details include service-specific thresholds/units, evidence, staff approval authority and separation of duties, service-resolution eligibility, response periods/non-response handling, and runtime acceptance tests. This is policy documentation only; no implementation or runtime verification is implied.


### Financial settlement and reconciliation specification — DEC-041

- **Status:** OWNER-APPROVED HIGH-LEVEL POLICY (30 October 2026); service/location rules, operational authority, technical contracts, and runtime evidence remain OPEN.
- **Priority:** Blocking for complete payment/settlement specification and approval across independent shipment booking and storefront delivery.
- **Accepted boundary:** Both advance online payment and payment at intake remain in scope subject to service/location configuration; booking acceptance is not payment; electronic settlement requires authoritative confirmation; cash requires attributable receipt/equivalent evidence and reconciliation; partial payment is service-permitted only and does not satisfy the normal dispatch gate by itself; underpayment/overpayment require authorized resolution; pending/failed/late payment outcomes remain distinct; refund request/approval/execution are distinct; partial refunds, credits, reversals and chargebacks preserve traceable financial history; reconciliation mismatches are investigated; dispatch requires verified full settlement by default, subject only to separately approved DEC-030 exceptions.
- **Still open:** Partial-payment eligibility and conditions; enabled methods/providers and cash/transaction limits; receipt/evidence requirements; refund limits, approval separation and timelines; partial-refund eligibility; cancellation fees; credit expiry/use/transfer; late-payment disposition; reconciliation cadence/ownership/tolerances/escalation and cash handling; chargeback investigation; dispatch-exception eligibility/limits/evidence; detailed financial event, idempotency, recovery, and acceptance contracts.
- **Risk:** Treating a booking or redirect as payment, dispatching against an unpaid balance, losing payment evidence, duplicating webhook effects, silently changing financial history, or confusing refunds/credits/reversals could cause financial loss and disputes.
- **Next action:** Complete the unresolved service/location and authority decisions; define payment and reconciliation contracts and acceptance scenarios; reconcile against current source and provider behaviour without treating existing implementation as policy approval. Preserve the platform-wide SDD approval gate.
- **Evidence boundary:** This entry records policy only. No application source, schema, payment endpoint, provider integration, permission, runtime behaviour, or test result was changed or verified by this documentation update.

### VLY-024 — Physical intake, custody, and location operations require detailed specification

- **Status:** IN PROGRESS — high-level owner policy accepted in DEC-042; service procedures, technical contracts, and evidence remain open.
- **Priority:** Blocking for implementation design and platform-wide SDD approval.
- **Evidence:** DEC-025 establishes capability-based lean locations and distinct authorized actions. DEC-027/DEC-040 establish declared-versus-actual measurement and controlled adjustment boundaries. DEC-038 separates booking, payment, and physical intake and defines responsibility boundaries. DEC-041 refines settlement controls. DEC-042 establishes separate booked/walk-in intake paths, location/action and actor guards, custody/hold/refusal distinctions, event attribution, inactive-location continuity, and distinct custody transfers.
- **Still open:** Service-specific inspection/prohibited-item checklists; measurement requirements and conversion; identity, acknowledgement and receipt methods; evidence/retention; staff and partner authority/second-person controls; capability configuration; hold ownership/review/maximum duration; transfer proof and correction authority; missing/damaged parcel and failed/disputed handover resolution; liability, compensation and insurance; exact status vocabulary, technical contracts, and acceptance tests.
- **Risk:** Recorded custody may diverge from physical possession; unsupported locations or actors may perform operations; parcels may become unaccounted for during holds/deactivation/transfers; physical events may be confused with payment or fulfilment.
- **Next action:** Complete service-specific physical-operation procedures and authority/evidence rules; reconcile policy against current source read-only; define lifecycle/API/security contracts and test scenarios. Preserve the platform-wide SDD approval gate.
- **Evidence boundary:** DEC-042 is owner-approved high-level business policy only. No application source, schema, Firebase rules/configuration, APIs, permissions, deployment, runtime behaviour, or tests were changed or verified by this documentation update.

### VLY-025 — Location capability administration and service/action eligibility require detailed specification

- **Status:** IN PROGRESS — high-level owner policy accepted in DEC-025 and DEC-043; configuration authority, service mapping, technical contracts, and evidence remain open.
- **Priority:** Blocking for location capability implementation design and platform-wide SDD approval.
- **Evidence:** DEC-025 establishes a lean capability-based location model and distinct actions. DEC-042 applies active-location and explicit action-capability guards to physical custody. DEC-043 confirms service-and-action eligibility, independent actor authorization, designated Admin configuration authority, auditable capability changes, in-flight custody continuity, and the lean launch boundary.
- **Still open:** Exact service/location/action matrix; capability catalogue and future extension governance; designated Admin assignment granularity; staff permission scopes; partner operational arrangements; treatment of queued work not yet physically received; temporary closure/restoration procedure; configuration audit retention; technical representation, API/security contracts, correction/replay handling, and executable acceptance tests.
- **Risk:** A location may accept unsupported work, a staff member may act without appropriate authority, capability changes may silently strand existing work, or configuration may be mistaken for proof of a physical event.
- **Next action:** Reconcile DEC-043 against current source read-only; define service/location/action eligibility and actor-authority contracts; specify configuration and in-flight custody scenarios; map them to acceptance evidence. Preserve the platform-wide SDD approval gate.
- **Evidence boundary:** DEC-043 is owner-approved high-level policy only. No application source, schema, Firebase rules/configuration, APIs, permissions, deployment, runtime behaviour, or tests were changed or verified by this documentation update.



### VLY-026 — Custody transfer integrity and physical exception resolution require detailed specification

- **Status:** IN PROGRESS — high-level owner policy accepted in DEC-044; service-specific procedures, authority, evidence, technical contracts, and runtime evidence remain open.
- **Priority:** Blocking for implementation design and complete platform-wide SDD approval.
- **Evidence:** DEC-042 establishes physical intake/custody and distinct handover events; DEC-043 establishes location capability and actor-authority boundaries; DEC-044 requires custody to reflect actual possession, separates attempted/authorized movement from completed transfer, and establishes controlled handling for failed/disputed/incomplete handovers, missing/damaged parcels, incorrect location assignments, and prolonged holds.
- **Accepted boundary:** A physical handover is a distinct event and completion requires actual receipt of possession. Route assignment, dispatch authorization/record, arrival, or attempted handover does not change custody. Preserve source/receiver/physical actor/recording staff attribution, time/location, outcome, evidence/source/reason, and prior custody history as applicable. Preserve last confirmed custody through failed/disputed handovers. Incomplete documentation after a known physical change requires investigation, not fabricated confirmation. Missing and damaged parcels require distinct, evidence-preserving exceptions and authorized reasoned resolution. Incorrect assignments preserve original history; administrative correction is not physical transfer. Holds retain identifiable custody, reason, and accountable ownership. Corrections preserve original records; unresolved exceptions are not silently closed. No automatic liability or financial/customer outcome is inferred.
- **Still open:** Service-specific handover proof; signatures/photos/OTPs or alternatives; who may confirm/dispute/correct; second-approver requirements; missing-parcel investigation ownership; damage assessment and liability procedures; hold ownership/review intervals/maximum duration; evidence retention; compensation, insurance, refunds, credits, and customer entitlements; exact lifecycle/status vocabulary; data/API/security contracts; and executable acceptance tests.
- **Risk:** Operational records may falsely imply custody transfer; physical possession may become unaccounted for; missing/damaged parcels may be attributed incorrectly; corrections may erase evidence; or physical exceptions may trigger unsupported financial/liability outcomes.
- **Next action:** Continue service-specific proof, confirmation/dispute/correction authority, second-approver rules, investigation ownership, damage assessment, hold controls, evidence retention, customer/financial entitlements, lifecycle/API/security contracts, and executable acceptance prerequisites. The current `main` tree-path inventory found no dedicated shipment/custody/route/location API/library paths; the source findings remain tied to inspected baseline `e0f69055d33dd9399c23e1d793f359468229c856`. Preserve the platform-wide SDD approval gate.
- **Evidence boundary:** DEC-044 is owner-approved high-level business policy only. This documentation update changes no application source, schema, Firebase rules/configuration, APIs, permissions, deployment, runtime behaviour, or tests.


## Milestone 4 continuity baseline update — 31 October 2026

- **Verified repository baseline:** PR #52 merged at `61b8b65777d98950b6a4b6c5c311490e064f3d47`.
- **Source baseline:** `e0f69055d33dd9399c23e1d793f359468229c856`; comparison through PR #52 found intervening documentation-only changes. Runtime and production behaviour remain unverified by this comparison.
- **Milestone status:** Milestones 1–3 are complete at the owner-approved policy/documentation level. DEC-038–DEC-044 are merged in PRs #45–#51; PR #52 records Milestone 3 completion.
- **Current next action:** Reconcile all accepted decisions against the complete SDD; identify stale references, omissions, genuine contradictions, and open dependencies; then complete read-only source traceability, executable acceptance-test specifications, and production-readiness evidence planning.
- **Implementation gate:** VLY-019 remains open and blocks application-code implementation until the complete platform-wide SDD is explicitly approved by the owner.


## Milestone 4 Step 2A — decision/document reconciliation inventory — 31 October 2026

- **Repository baseline:** PR #53 merged at `d17b6440a8c9aca4a07b3797ae4bc1b24520e95c`; PR #53 is documentation-only. The active application-source inspection baseline remains `e0f69055d33dd9399c23e1d793f359468229c856`.
- **Scope:** Initial inventory of all 23 Markdown SDD documents against DEC-001–DEC-044, PM-01–PM-12, and BP-01–BP-22.
- **Findings:** Missing DEC-037–DEC-044 propagation in requirement traceability/priority, actor, staff-permission, P0 evidence, and readiness documents; stale owner-register metadata; outdated Admin requirement priority status; and incorrect historical PR #3/#4 state descriptions.
- **Verified PR states:** PR #3 merged at `c56be9b121e6007e1e99c6df2d3984e709771a92`; PR #4 closed without merge. Do not describe PR #4 as open or merged.
- **Policy assessment:** No confirmed contradiction requiring an accepted owner decision to be reopened was identified in this initial pass. Full reconciliation remains incomplete until each affected document is corrected and rechecked.
- **Next action:** Complete the focused corrective updates listed in `PLATFORM_DECISION_DOCUMENT_RECONCILIATION.md`; then continue source traceability, executable acceptance-test specification, and production-readiness evidence planning.
- **Implementation gate:** VLY-019 remains open. No application-code changes until the complete platform-wide SDD is reconciled and explicitly approved by the owner.
