# VeriLyft — Current implementation status

**As of:** 6 November 2026
**Repository:** dev-adeshina/small-pudo
**Documentation baseline:** main at 1f731f14f98212f186b0855addd26f1c98f01c08 (PR #143)
**Application-source baseline:** 1f731f14f98212f186b0855addd26f1c98f01c08 (PR #143)
**Purpose:** Current, source-aligned execution summary. This document supersedes older “current” checkpoint wording in historical SDD sections where dates/baselines differ; accepted decisions and historical records remain intact.

## Repository position

- PR #135 reconciled the SDD after PRs #133 and #134.
- PR #136 merged staff invitations, staff directory and permission-management foundations (399473be54e50224ebfd7841ab5d10d6eee9ab14).
- PR #137 moved staff activation into the authenticated staff workspace (55dff8c2a4f4cf6f0e983676e692f0f126f7ec27).
- PR #138 reconciled the SDD with the PR #137 application-source baseline; merge f1d4f29ed0645145a277af5558b8fbcd8f537b4c.
- PR #139 added the owner-approved M2 pre-implementation review package; merge 364909e15dcdb719ac64ff96b10592f8b4e183f5.
- PR #140 reconciled the specialist M2 SDD documents against the PR #137 source baseline; merge 8b62d218847beea5e49dc7afcee203f44bc68da9.
- PRs #138–#140 are documentation-only. The application-source baseline remains PR #137.
- No application-code change is part of this SDD reconciliation.

## Accomplished

### Customer/storefront foundation

Product/category catalogue, cart, checkout, storefront order creation, stock reservation/cancellation, Paystack initialization/verification/webhook, customer authentication/profile/order history, Admin order management and Cloudinary upload integration have been implemented in earlier work. This storefront is an attached service, not the independent shipment-booking journey.

### Independent shipment preparation

Customer-scoped shipment drafts and draft editing/dashboard integration exist. PR #118 also implemented the internal quote-lineage/immutable-version persistence foundation approved by PR #117. These are preparation and persistence foundations only; they do not calculate or issue customer quotes, accept quotes or confirm shipment bookings.

### Operational-cost definitions

Versioned internal activity-cost definitions, components/inputs, immutable revision history, separated Operations/Finance/independent approval workflow, server-side action permissions and the staff interface at /admin/operational-cost-definitions are implemented. Permission expiry is enforced in the workflow store. Approval remains internal; it does not calculate customer prices, issue quotations, activate services or authorize physical operations.

### Staff management and activation

PR #136 adds invitation delivery/expiry/revocation, verified-email matching, email/password and Google identity flows, staffDirectory, /admin/staff, audited assignment/suspension/expiry/revocation for the five approved operational-cost permissions, and designated-permission-administrator authorization. PR #137 moves activation into the signed-in staff workspace. Activation creates the staff directory record and does not grant operational permissions.

## Verification evidence and limits

**User-reported local PR #137 verification:** Firestore Emulator-backed suite: 100 tests across 14 suites, 100 passed, 0 failed, 0 skipped; npx tsc --noEmit, npm run lint, npm run build and git diff --check passed. The command used was:

    npx firebase-tools emulators:exec --only firestore --project demo-verilyft-staff-management "npm test"

These are owner-reported local results, not independently reproduced by this documentation review and not production verification. Expected permission-denial logs in negative Rules tests do not indicate suite failure.

**Owner-reported live browser verification:** the user subsequently reported successful live browser testing after PR #138. The available status record does not enumerate the exact scenarios exercised, so it does not support claiming that every invitation, permission lifecycle, actor-separation or operational-cost workflow case was covered. Do not keep generic browser testing open; retain only specific cases shown to be untested by the user's scenario record.

**PR #143 owner-reported verification boundary:** the owner reported targeted browser testing of the operational-cost editor/detail flow. Operations submission and Finance validation were not included in the reported test. The PR description did not claim that the local automated verification commands had been run; do not claim new automated test results from the merge alone.\n\nThe guarded initial permission-administrator provisioning CLI has not successfully run. The user's prior invocation was refused because explicit --confirm-initial-designation confirmation was absent. Do not describe the designation as technically provisioned or run it against production without a separately reviewed and explicitly approved operation.

## What remains

1. **Scenario-specific staff/operational-cost evidence:** reconcile the successful owner-reported live browser test against the precise invitation, permission lifecycle, actor-separation, audit and expiry cases. Keep only uncovered cases open; keep initial permission-administrator provisioning separate.
2. **PUDO capability readiness:** accountable Operations position remains unassigned; authoritative initial inventory source is unidentified; no verified PUDO inventory or capability matrix is available. DEC-050 responsibility boundaries remain accepted.
3. **M2 pricing and quotation:** DEC-048 commercial unit/governance decisions are accepted, but Standard/Express/Scheduled pricing models, actual cost evidence, rates/formulas, inputs/units/conversions, monetary treatment, quote validity and handover deadlines remain unresolved. Quote issuance and acceptance remain disabled.
4. **DEC-047 eligibility:** all twelve service/endpoint combinations remain pending verification and unavailable by default.
5. **Independent shipment fulfilment:** confirmed booking, independent shipment payment, physical parcel intake, custody transfers, route/dispatch execution, delivery proof and operational exceptions are not a complete implemented customer journey. Route/dispatch intent must never be represented as completed physical custody.
6. **Technical contracts:** the bounded DB-01/DB-02/DB-05 physical persistence/API/security design is owner-approved in PR #117; DB-03, DB-04 and DB-06–DB-12 remain capability-specific open contracts and must be resolved before implementing the affected capabilities.
7. **Production/release readiness:** DEC-036 P0/Conditional P0 evidence, deployed Rules/configuration parity, privileged API/revocation checks, backup/restore, monitoring, incident response, rollback and named operational ownership remain outstanding.

## Next execution sequence

1. PR #143 completes M2 Stage 1: structured cost evidence in the existing operational-cost component/version workflow.
2. The consolidated readiness review is `PLATFORM_M2_SHARED_PRICING_AUTHORITY_READINESS_REVIEW.md`.
3. Execute Stage 2A–2D: collect real evidence for applicable ACT-01–ACT-11 activities; obtain Operations validation, Finance review and independent approval using the existing workflow.
4. Complete separate evidence packs and input-feasibility matrices for Standard, Express and Scheduled. Do not infer that a cost applies to every service or journey.
5. Only after service evidence and explicit commercial decisions are approved, reconcile affected DB-01–DB-12 contracts and produce the shared pricing authority technical contract and executable acceptance fixtures.
6. Seek explicit owner approval of that bounded technical contract before any shared pricing or quote implementation.
7. Keep DEC-047 eligibility, quote issuance/acceptance, booking, payment, intake, custody, routing/dispatch and DEC-036 release evidence separately gated.
8. Do not invent rates, formulas, currency, fees, durations, PUDO inventory, operational owners or service eligibility.

## Authority and guardrails

Accepted policy remains in DECISIONS.md and the relevant approved policy documents. Current source establishes what is implemented; reported tests establish only the scope/environment reported; production readiness requires DEC-036 evidence. Preserve these distinctions:

- draft preparation is not confirmed booking;
- quote lineage is not quote calculation, issuance or acceptance;
- internal cost definitions are not customer prices;
- staff activation is not permission assignment;
- Admin status is not staff permission-administration authority;
- dispatch intent is not physical custody transfer;
- source presence or a passing build is not production readiness.


## M2 Stage 0 — current status

PR #142 merged at `9a95bd8f71e1599a5714e572eafe05b4c48d92fb`. Stage 0 technical contract is closed.

## M2 Stage 1 — structured cost-evidence implementation

PR #143 merged at `1f731f14f98212f186b0855addd26f1c98f01c08`. Stage 1 is complete. Structured evidence items and controlled `direct`, `shared`, `included` and `exception_related` treatment classifications are persisted within the existing immutable cost-component/version snapshot. Existing versioning, workflow, APIs, permissions, reviewer separation and Firestore client-denial boundary are reused. No new collection, evidence registry, migration, permission or workflow state was introduced.

The structured submission gate requires the existing cost amount/currency/basis together with at least one structured evidence item and a supported treatment classification. Legacy narrative evidence remains readable but does not satisfy the new submission gate for new submissions.

**Verification boundary:** the owner reported targeted browser testing of the editor/detail flow. Operations submission and Finance validation were not tested in the reported scenario. PR #143's description explicitly did not claim local automated test/typecheck/lint/build results. Treat automated verification as unconfirmed unless a separate dated run is recorded.

## M2 Stage 2 — actual operating-cost evidence

**Current status:** ready for business evidence collection; not yet evidenced as complete. Use the existing operational-cost definitions and PR #143 structured evidence workflow. Operations must validate activity scope, real procedure, actors, location, capacity and input feasibility. Finance must review source quality, cost basis, currency/unit interpretation, duplicate/included treatment and any proposed shared-cost allocation. Independent approval remains separate.

The existing evidence workbook and ACT-01–ACT-11 catalogue are the collection templates/baseline. ACT-12 remains conditional/inactive until Operations confirms it is actually performed or contractually required. Synthetic/test values are not actual operating-cost evidence and must not be submitted as approved business facts.

## M2 shared pricing authority — readiness outcome

The consolidated review is `PLATFORM_M2_SHARED_PRICING_AUTHORITY_READINESS_REVIEW.md`. The shared pricing authority is accepted as business policy, but customer pricing implementation remains blocked pending actual cost evidence, per-service model/input/rate decisions, currency and charge treatment, separate quote/handover terms, affected technical contracts and executable acceptance fixtures.

Standard, Express and Scheduled are independently not ready for quote issuance. All twelve DEC-047 service/endpoint combinations remain unavailable by default. No application-code implementation of customer pricing, quote issuance/acceptance or booking is authorized by the readiness review.
