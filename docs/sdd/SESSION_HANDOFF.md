# New-session handoff prompt

Continue **VeriLyft — Beyond Borders** in repository `dev-adeshina/small-pudo`.

## Current verified repository state

- Current `main` baseline: PR #64 is merged; merge commit `d02b2d69156aea45c07b5e2db5511b2486e50471`.
- PRs #54–#64 are merged documentation-only reconciliation changes; PR #58 carries DEC-037–DEC-044 into the P0 catalogue/readiness documents, PR #60 completes the first cross-document status/reference pass, PR #61 aligns the A-10 acceptance row with DEC-043, PR #62 aligns DEC-038–DEC-041 status references, and PR #63 clarifies the Finance responsibility/deployment boundary, and PR #64 reconciles DEC-044 custody acceptance evidence.
- The active application-source inspection baseline remains `e0f69055d33dd9399c23e1d793f359468229c856` (refreshed in PR #32). Repository comparison through PR #64 found documentation-only changes after that source baseline; the current tree-path inventory found no dedicated shipment/custody/route/location API/library path. This does not mean source was re-inspected at PR #63 and does not verify runtime behaviour or production readiness.
- Admin PR #3 is merged. PR #4 is closed without merge; do not describe it as open or merged.
- No application-code changes are authorized until the owner explicitly approves the complete reconciled platform-wide SDD.

## Product hierarchy and accepted policy

VeriLyft is a logistics-first shipment-management platform. Independent shipment booking is the primary customer entry point; storefront commerce is an attached, secondary service. A storefront order requiring delivery enters the same operational fulfilment system as an independently booked shipment. Storefront orders, independent shipments, and transport movements remain distinct business concepts; do not assume a technical schema from that distinction.

The following owner-policy outcomes are accepted at the levels recorded in the authoritative SDD documents:

- DEC-018: accepted lean launch scope and exclusions.
- DEC-022–DEC-036: D-01–D-15 high-level owner decisions.
- DEC-037: logistics-first product hierarchy and shared fulfilment boundary.
- DEC-038: independent shipment booking confirmation, service information, handover deadline, cancellation, and responsibility boundaries.
- DEC-039: service-specific pricing model/input/calculation boundaries.
- DEC-040: measurement-adjustment and customer-resolution boundaries.
- DEC-041: payment, settlement, refund/credit, reconciliation, and dispatch boundaries.
- DEC-042: physical intake, custody, measurement, and location-operation boundaries.
- DEC-043: location capability, service/action eligibility, and actor-authority boundaries.
- DEC-044: custody transfer integrity and physical exception resolution.
- PM-01–PM-12: accepted staff permission policies; detailed technical permission design remains open.
- BP-01–BP-22: accepted booking-party authority policies; operational and technical contracts remain open.

Milestones 1–3 are complete at the owner-approved policy/documentation level. Their completion does not mean all operational procedures, technical contracts, executable tests, or runtime evidence are complete.

## Current work — Milestone 4

**Milestone:** Platform-wide SDD Reconciliation and Implementation Readiness.

Milestone 4 Step 1 continuity baseline was established in PR #53 and refreshed through PR #64. Step 2A inventoried all 23 Markdown SDD documents. PRs #55–#58 corrected Admin baseline/history, actor and staff-permission references, requirement dependency/priority crosswalks, and P0 catalogue/readiness crosswalks; PR #60 completed the first status/reference scan. Step 2D targeted section-level review continues. PR #61 corrected stale owner-approval wording in the original A-10 row against accepted DEC-043. PR #62 aligned DEC-038–DEC-041 status wording. PR #63 clarified the Finance responsibility/deployment boundary. PR #64 aligns DEC-044 custody acceptance criteria and evidence cases while preserving service-specific proof, authority, investigation, hold, retention and technical details as open. Detailed reconciliation remains active; do not treat the inventory or crosswalks as full SDD approval.

### Milestone 4 sequence

1. Establish and maintain one authoritative documentation/repository baseline — complete through PR #53; refreshed through PR #64.
2. Reconcile accepted decisions across all SDD documents; identify contradictions, stale references, omissions, and unresolved dependencies without silently reopening accepted policy — Step 2A inventory complete; corrective updates in PRs #55–#58 merged; full review remains open.
3. Trace requirements and policy to the existing application source read-only; distinguish present, partial, absent, not inspected, and not verified.
4. Complete workflow, actor/permission, lifecycle, data/API/security, integration, and exception contracts.
5. Turn approved requirements into detailed, executable acceptance-test specifications and evidence requirements. The existing P0 readiness assessment/catalogue is a navigation/design baseline, not approval to execute tests. The current 80-case catalogue carries DEC-037–DEC-044 references merged in PR #58; no P0/Conditional P0 test is approved for execution.
6. Assess production readiness: environment/configuration, security, deployment, monitoring, backup/restore, incident response, rollback, recovery, and release evidence.
7. Present the complete reconciled SDD for explicit owner approval before any application-code changes.

## Important unresolved boundaries

Do not invent or silently settle:
- Service-specific pricing formulas, rates, input sources/mappings, units, conversion, rounding, fees, taxes, thresholds, quote-validity durations, and adjustment limits. DEC-038's accepted-quote expiry rule is settled at policy level; service-specific durations and handover configuration remain open.
- Payment method/service/location eligibility, partial-payment conditions, cash/transaction limits, refund authority/timelines, credit rules, reconciliation cadence/ownership/tolerances, chargeback handling, and DEC-030 dispatch-exception categories/limits/evidence. DEC-041's high-level payment and default dispatch boundaries are accepted. Full-finance responsibility is distinct from Admin operational visibility; whether it is delivered through a protected module, separate portal, or combination remains unresolved.
- Intake checklists, measurement procedures, handover proof, confirmation/dispute/correction authority, second-approver rules, custody hold limits, missing/damaged parcel investigation ownership, liability, insurance, compensation, or customer entitlements.
- Location/service/action capability catalogue, Admin assignment granularity, staff permission scopes, partner arrangements, queued-work handling, or temporary closure procedures.
- Exact status vocabulary, data representation, collections, fields, APIs, security rules, idempotency/recovery contracts, retention periods, or executable acceptance cases.
- Notification event/recipient/channel details, privacy rules, retries, failure ownership, or evidence retention.
- Production operational thresholds, monitoring, backup/restore proof, incident ownership, rollback, and release exception authority.

Use `ISSUES.md`, `DECISIONS.md`, `PLATFORM_OWNER_DECISION_REGISTER.md`, `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, and `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md` as the relevant navigation sources. Preserve unresolved details as open work.

## Working protocol

- Read `README.md`, `PROGRESS.md`, `ISSUES.md`, `DECISIONS.md`, and this handoff before proposing changes.
- Read the relevant workflow, lifecycle, actor, requirement, acceptance, and source-traceability documents for each domain.
- Inspect the current repository/source read-only when implementation facts are needed. State the exact inspected commit.
- Preserve the existing Next.js App Router, TypeScript, Firebase Authentication/Firestore/Firebase Admin, Paystack, Cloudinary, and existing component/service/type/style patterns.
- Do not invent parallel architecture, collections, fields, routes, services, status enums, roles, or permissions.
- Keep intended behaviour, owner-approved policy, source presence, implemented behaviour, runtime verification, and production-readiness evidence distinct.
- Keep PRs focused and documentation-only while the complete SDD remains unapproved. The owner reviews and merges every PR.
- Never claim a test, build, browser check, deployment check, or production verification was performed unless it actually was.
- Preserve historical roadmap/checkpoint entries as history; use `PROGRESS.md` for the current work pointer.
- Do not reopen completed D-01–D-15, PM-01–PM-12, BP-01–BP-22, or Milestones 1–3 absent genuine contradictory evidence.

**Implementation gate:** No application-code change until the owner explicitly approves the complete reconciled platform-wide SDD.


## Latest baseline verification — PR #64

- PR #64 is merged; merge commit: `d02b2d69156aea45c07b5e2db5511b2486e50471`.
- Comparison from source-inspection baseline `e0f69055d33dd9399c23e1d793f359468229c856` to PR #64 reports SDD documentation paths only (320 commits ahead). The source findings remain tied to the inspected source commit.
- PR #64's DEC-044 acceptance refinement retains 80 unique P0 evidence cases and leaves service-specific proof, authority, investigation, hold, retention, and technical contracts open.
- Next: continue targeted reconciliation of remaining A-01–A-20 and the shared workflow/lifecycle/actor/permission/Admin/source-evidence documents. Do not start application-code changes.
