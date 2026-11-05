# VeriLyft — Current implementation status

**As of:** 5 November 2026
**Repository:** dev-adeshina/small-pudo
**Documentation baseline:** main at 364909e15dcdb719ac64ff96b10592f8b4e183f5 (PR #139)
**Application-source baseline:** 55dff8c2a4f4cf6f0e983676e692f0f126f7ec27 (PR #137; PRs #138 and #139 are documentation-only)
**Purpose:** Current, source-aligned execution summary. This document supersedes older “current” checkpoint wording in historical SDD sections where dates/baselines differ; accepted decisions and historical records remain intact.

## Repository position

- PR #135 reconciled the SDD after PRs #133 and #134.
- PR #136 merged staff invitations, staff directory and permission-management foundations (399473be54e50224ebfd7841ab5d10d6eee9ab14).
- PR #137 moved staff activation into the authenticated staff workspace (55dff8c2a4f4cf6f0e983676e692f0f126f7ec27).
- PR #138 reconciled the SDD with the PR #137 application-source baseline; merge f1d4f29ed0645145a277af5558b8fbcd8f537b4c.
- PR #139 added the owner-approved M2 pre-implementation review package; merge 364909e15dcdb719ac64ff96b10592f8b4e183f5.
- PRs #138 and #139 are documentation-only. The application-source baseline remains PR #137.
- No application-code change is part of this SDD reconciliation.

## Accomplished

### Customer/storefront foundation

Product/category catalogue, cart, checkout, storefront order creation, stock reservation/cancellation, Paystack initialization/verification/webhook, customer authentication/profile/order history, Admin order management and Cloudinary upload integration have been implemented in earlier work. This storefront is an attached service, not the independent shipment-booking journey.

### Independent shipment preparation

Customer-scoped shipment drafts, draft editing/dashboard integration, and internal quote-lineage/immutable-version persistence foundations exist. These are preparation and persistence foundations only; they do not issue customer quotes or confirm shipment bookings.

### Operational-cost definitions

Versioned internal activity-cost definitions, components/inputs, immutable revision history, separated Operations/Finance/independent approval workflow, server-side action permissions and the staff interface at /admin/operational-cost-definitions are implemented. Permission expiry is enforced in the workflow store. Approval remains internal; it does not calculate customer prices, issue quotations, activate services or authorize physical operations.

### Staff management and activation

PR #136 adds invitation delivery/expiry/revocation, verified-email matching, email/password and Google identity flows, staffDirectory, /admin/staff, audited assignment/suspension/expiry/revocation for the five approved operational-cost permissions, and designated-permission-administrator authorization. PR #137 moves activation into the signed-in staff workspace. Activation creates the staff directory record and does not grant operational permissions.

## Verification evidence and limits

**User-reported local PR #137 verification:** Firestore Emulator-backed suite: 100 tests across 14 suites, 100 passed, 0 failed, 0 skipped; npx tsc --noEmit, npm run lint, npm run build and git diff --check passed. The command used was:

    npx firebase-tools emulators:exec --only firestore --project demo-verilyft-staff-management "npm test"

These are owner-reported local results, not independently reproduced by this documentation review and not production verification. Expected permission-denial logs in negative Rules tests do not indicate suite failure.

**Owner-reported live browser verification:** the user subsequently reported successful live browser testing after PR #138. The available status record does not enumerate the exact scenarios exercised, so it does not support claiming that every invitation, permission lifecycle, actor-separation or operational-cost workflow case was covered. Do not keep generic browser testing open; retain only specific cases shown to be untested by the user's scenario record.

The guarded initial permission-administrator provisioning CLI has not successfully run. The user's prior invocation was refused because explicit --confirm-initial-designation confirmation was absent. Do not describe the designation as technically provisioned or run it against production without a separately reviewed and explicitly approved operation.

## What remains

1. **Scenario-specific staff/operational-cost evidence:** reconcile the successful owner-reported live browser test against the precise invitation, permission lifecycle, actor-separation, audit and expiry cases. Keep only uncovered cases open; keep initial permission-administrator provisioning separate.
2. **PUDO capability readiness:** accountable Operations position remains unassigned; authoritative initial inventory source is unidentified; no verified PUDO inventory or capability matrix is available. DEC-050 responsibility boundaries remain accepted.
3. **M2 pricing and quotation:** DEC-048 commercial unit/governance decisions are accepted, but Standard/Express/Scheduled pricing models, actual cost evidence, rates/formulas, inputs/units/conversions, monetary treatment, quote validity and handover deadlines remain unresolved. Quote issuance and acceptance remain disabled.
4. **DEC-047 eligibility:** all twelve service/endpoint combinations remain pending verification and unavailable by default.
5. **Independent shipment fulfilment:** confirmed booking, independent shipment payment, physical parcel intake, custody transfers, route/dispatch execution, delivery proof and operational exceptions are not a complete implemented customer journey. Route/dispatch intent must never be represented as completed physical custody.
6. **Technical contracts:** the bounded DB-01/DB-02/DB-05 physical persistence/API/security design is owner-approved in PR #117; DB-03, DB-04 and DB-06–DB-12 remain capability-specific open contracts and must be resolved before implementing the affected capabilities.
7. **Production/release readiness:** DEC-036 P0/Conditional P0 evidence, deployed Rules/configuration parity, privileged API/revocation checks, backup/restore, monitoring, incident response, rollback and named operational ownership remain outstanding.

## Next execution sequence

1. Complete and review the consolidated M2 SDD reconciliation PR.
2. Complete one final implementation-readiness review and publish a consolidated, staged implementation plan with source traceability, dependencies, acceptance criteria and capability-specific blockers.
3. Obtain the owner's explicit approval of that implementation plan before application-code changes.
4. Implement only independently Ready slices through small, reviewable PRs; do not treat approval of the M2 requirements package as blanket implementation or quote-issuance authorization.
5. Do not invent rates, formulas, currency, fees, durations, PUDO inventory, operational owners or service eligibility to make a feature appear complete.

## Authority and guardrails

Accepted policy remains in DECISIONS.md and the relevant approved policy documents. Current source establishes what is implemented; reported tests establish only the scope/environment reported; production readiness requires DEC-036 evidence. Preserve these distinctions:

- draft preparation is not confirmed booking;
- quote lineage is not quote calculation, issuance or acceptance;
- internal cost definitions are not customer prices;
- staff activation is not permission assignment;
- Admin status is not staff permission-administration authority;
- dispatch intent is not physical custody transfer;
- source presence or a passing build is not production readiness.
