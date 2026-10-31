# New-session handoff prompt

Continue **VeriLyft — Beyond Borders** in repository `dev-adeshina/small-pudo`.

## Current verified repository state

- Current `main` baseline: PR #57 is merged; merge commit `de067c0a872de6e5cffaa2c7cf7c5bbcccab3269`.
- PRs #54–#57 are merged documentation-only reconciliation changes; PR #58 is open for owner review and carries DEC-037–DEC-044 into the P0 catalogue/readiness documents.
- The active application-source inspection baseline remains `e0f69055d33dd9399c23e1d793f359468229c856` (refreshed in PR #32; repository-history comparison refreshed through PR #57). Comparison through PR #57 found only SDD documentation changes after that source baseline. This does not verify runtime behaviour or production readiness.
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

Milestone 4 Step 1 is complete following PR #53. Step 2A inventoried all 23 Markdown SDD documents. PRs #55–#57 corrected Admin baseline/history, actor and staff-permission references, and requirement dependency/priority crosswalks. PR #58 proposes the remaining DEC-037–DEC-044 crosswalks in the 80-case P0 catalogue and readiness assessment. Corrective cross-document reconciliation remains active; do not treat the inventory or crosswalks as full SDD approval.

### Milestone 4 sequence

1. Establish and maintain one authoritative documentation/repository baseline — complete through PR #53; refreshed through PR #57.
2. Reconcile accepted decisions across all SDD documents; identify contradictions, stale references, omissions, and unresolved dependencies without silently reopening accepted policy — Step 2A inventory complete; corrective updates in PRs #55–#57 merged; P0 catalogue/readiness crosswalk proposed in PR #58; full review remains open.
3. Trace requirements and policy to the existing application source read-only; distinguish present, partial, absent, not inspected, and not verified.
4. Complete workflow, actor/permission, lifecycle, data/API/security, integration, and exception contracts.
5. Turn approved requirements into detailed, executable acceptance-test specifications and evidence requirements. The existing P0 readiness assessment/catalogue is a navigation/design baseline, not approval to execute tests. The current 80-case catalogue carries DEC-037–DEC-044 references in PR #58; no P0/Conditional P0 test is approved for execution.
6. Assess production readiness: environment/configuration, security, deployment, monitoring, backup/restore, incident response, rollback, recovery, and release evidence.
7. Present the complete reconciled SDD for explicit owner approval before any application-code changes.

## Important unresolved boundaries

Do not invent or silently settle:
- Service-specific pricing formulas, rates, inputs, units, conversion, rounding, fees, taxes, thresholds, quote validity, or adjustment limits.
- Payment method/service eligibility, partial-payment limits, cash controls, refund authority/timelines, credit rules, reconciliation cadence, chargeback handling, or dispatch exceptions.
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
