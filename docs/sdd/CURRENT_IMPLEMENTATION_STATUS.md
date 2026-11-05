# VeriLyft — Current implementation status

**As of:** 5 November 2026
**Repository:** dev-adeshina/small-pudo
**Current baseline:** main at 55dff8c2a4f4cf6f0e983676e692f0f126f7ec27 (PR #137)
**Purpose:** Current, source-aligned execution summary. This document supersedes older “current” checkpoint wording in historical SDD sections where dates/baselines differ; accepted decisions and historical records remain intact.

## Repository position

- PR #135 reconciled the SDD after PRs #133 and #134.
- PR #136 merged staff invitations, staff directory and permission-management foundations (399473be54e50224ebfd7841ab5d10d6eee9ab14).
- PR #137 moved staff activation into the authenticated staff workspace (55dff8c2a4f4cf6f0e983676e692f0f126f7ec27).
- GitHub review found no open pull requests and no open issues at this checkpoint.
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

**Still unverified in browser/runtime:** invitation delivery and complete email/password/Google onboarding; pending/expired/mismatched/revoked invitation cases; activation and staff-directory visibility; permission assignment/suspension/expiry/revocation; designated administrator access versus generic Admin denial; and the complete Operations → Finance → independent approval workflow using correctly permissioned, distinct test accounts.

The guarded initial permission-administrator provisioning CLI has not successfully run. The user's prior invocation was refused because explicit --confirm-initial-designation confirmation was absent. Do not describe the designation as technically provisioned or run it against production without a separately reviewed and explicitly approved operation.

## What remains

1. **Staff and operational-cost browser verification:** use controlled test accounts; verify positive and negative paths, actor separation, audit events and permission expiry. Keep production provisioning separate.
2. **PUDO capability readiness:** accountable Operations position remains unassigned; authoritative initial inventory source is unidentified; no verified PUDO inventory or capability matrix is available. DEC-050 responsibility boundaries remain accepted.
3. **M2 pricing and quotation:** DEC-048 commercial unit/governance decisions are accepted, but Standard/Express/Scheduled pricing models, actual cost evidence, rates/formulas, inputs/units/conversions, monetary treatment, quote validity and handover deadlines remain unresolved. Quote issuance and acceptance remain disabled.
4. **DEC-047 eligibility:** all twelve service/endpoint combinations remain pending verification and unavailable by default.
5. **Independent shipment fulfilment:** confirmed booking, independent shipment payment, physical parcel intake, custody transfers, route/dispatch execution, delivery proof and operational exceptions are not a complete implemented customer journey. Route/dispatch intent must never be represented as completed physical custody.
6. **Technical contracts:** DB-01–DB-12 must be assessed against current implementation and evidence before selecting another booking-related slice; open DB contracts remain separate gates.
7. **Production/release readiness:** DEC-036 P0/Conditional P0 evidence, deployed Rules/configuration parity, privileged API/revocation checks, backup/restore, monitoring, incident response, rollback and named operational ownership remain outstanding.

## Next execution sequence

1. Complete and review this SDD reconciliation PR.
2. Perform controlled staff/operational-cost browser verification and record results without claiming production readiness.
3. Review DB-01–DB-12 and current capability gates; select one bounded, independently Ready implementation slice under DEC-045.
4. Do not invent rates, formulas, currency, fees, durations, PUDO inventory, operational owners or service eligibility to make a feature appear complete.

## Authority and guardrails

Accepted policy remains in DECISIONS.md and the relevant approved policy documents. Current source establishes what is implemented; reported tests establish only the scope/environment reported; production readiness requires DEC-036 evidence. Preserve these distinctions:

- draft preparation is not confirmed booking;
- quote lineage is not quote calculation, issuance or acceptance;
- internal cost definitions are not customer prices;
- staff activation is not permission assignment;
- Admin status is not staff permission-administration authority;
- dispatch intent is not physical custody transfer;
- source presence or a passing build is not production readiness.
