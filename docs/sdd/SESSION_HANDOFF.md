# New-session handoff prompt

Continue **VeriLyft — Beyond Borders** in `dev-adeshina/small-pudo`.

## Repository baseline

- Latest verified `main`: `574f23787030c4b5374e6ac02ce82b69e1ece1a4` (PR #36 merged 30 October 2026, 18:36:18 UTC).
- Stage 5.3 documentation proposal is PR #37, `docs: reconcile Stage 5.3 pricing and quote policies`, open for owner review on `docs/stage-5-3-pricing-measurement-quote-policy`.
- Source traceability remains pinned to `c56be9b121e6007e1e99c6df2d3984e709771a92`. Later documentation merges do not prove runtime behaviour.
- Work remains documentation-only. Do not change application code until the complete platform-wide SDD is reconciled and explicitly approved.

## Accepted owner policies

- D-01–D-15 are accepted as high-level outcomes under DEC-022–DEC-036.
- PM-01–PM-12 staff permission policies are accepted; technical permission design remains open.
- Stage 5.2 booking-party authority BP-01–BP-22 is accepted under DEC-023/DEC-024; PR #36 is merged.
- Stage 5.3 owner-approved policies:
  1. Each service explicitly uses fixed, calculated, or hybrid pricing.
  2. Pricing inputs are approved categories configured per service; storefront delivery and independent shipment booking share pricing rules wherever inputs overlap.
  3. Measurement requirements and units are service-specific; declared and actual measurements remain separate and attributable.
  4. Quote lifecycle includes draft, issued, accepted, rejected, expired, superseded, and cancelled. Acceptance is explicit; unaccepted expiry requires a fresh quote; historical quote versions are preserved.
  5. Adjustments preserve the original agreement, require review where material/payment-impacting, and require customer consent before collecting additional charges. Disputed additional charges are held pending review.
  6. Financial outcomes remain distinct, including charges, additional payments, over/underpayments, failed attempts, refund requests/execution, credits, reversals, late payments, and reconciliation.
- DEC-026 and DEC-027 are refined; DEC-029 is reconciled with quote/adjustment outcomes.
- Still open: formulas/rates, input sources, units/conversion, rounding/effective dates, taxes/fees/discounts, expiry treatment of already accepted quotes, numeric measurement thresholds, approval limits, and service resolution after adjustment rejection.
- Policy acceptance is not implementation approval, complete SDD approval, or production-readiness evidence.

## Read first

Read `README.md`, `SPEC.md`, `DECISIONS.md`, `PLATFORM_OWNER_DECISION_REGISTER.md`, `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`, `PLATFORM_STAFF_PERMISSION_DECISIONS.md`, `PLATFORM_STAFF_PERMISSION_MATRIX.md`, `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md`, `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md`, `IMPLEMENTATION_SOURCE_TRACEABILITY.md`, `SDD_COMPLETENESS_AUDIT.md`, `ISSUES.md`, and `PROGRESS.md`.

## Working rules

- Preserve the existing Next.js App Router, TypeScript, Firebase Auth/Firestore/Firebase Admin, Paystack, Cloudinary, and current component/service/type/style patterns.
- Do not invent parallel architecture, collections, fields, routes, services, status enums, roles, or permissions.
- Keep accepted policy, source facts, test evidence, and production-readiness evidence distinct.
- Keep changes focused and documentation-only. The owner reviews and merges every PR.
- Never claim tests were run unless they actually were.

## Next sequence

1. Review and merge PR #37, the Stage 5.3 documentation-only consolidation, if its contents are accepted; do not merge it on the owner's behalf.
2. Reconcile remaining DEC-022–DEC-036 dependencies across workflows, lifecycle/API/security contracts, acceptance criteria, source traceability, and evidence planning.
3. Specify remaining pricing/measurement details without inventing formulas, units, thresholds, or approval limits.
4. Confirm whether repository-root `pudo.zip` is authoritative and within active VeriLyft scope; it has not been inspected.
5. Obtain safe non-production runtime evidence for source-present P0 paths and assess production configuration, monitoring, backup/restore, incident response, rollback, and release sign-off.
6. Present the complete reconciled platform-wide SDD for explicit owner approval.
7. Only then plan focused application implementation.

Do not restart the completed D-01–D-15 or PM-01–PM-12 decision sequences.
