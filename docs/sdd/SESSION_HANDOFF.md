# New-session handoff prompt

Continue the existing **VeriLyft — Beyond Borders** project in `dev-adeshina/small-pudo`.

## Current verified state

- Latest verified `main` head before this proposal: `c9d9342cfc9dcef2c7d5704074d83927c5f5099c` (PR #30 merged). This documentation proposal is on `docs/requirement-level-priority-baseline` and must be reviewed/merged by the owner before it becomes main.
- All 15 tracked high-level owner decisions (D-01–D-15; DEC-022–DEC-036) are accepted. The decision queue is complete, but the platform-wide SDD is not yet complete or approved.
- Source inspection baseline: `c56be9b121e6007e1e99c6df2d3984e709771a92`. Comparison through latest main showed intervening commits changed SDD documentation only, not application source. Treat source traceability as a read-only snapshot to be reconciled and refreshed.
- Current task: **Stage 2 — requirement-level launch priority reconciliation**. Proposed mapping is in `PLATFORM_REQUIREMENT_PRIORITY_MATRIX.md`; review it with `DECISIONS.md` DEC-018/DEC-036, `ADMIN_REQUIREMENTS.md`, and `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md`.

## Read first

Read `README.md`, `SPEC.md`, `DECISIONS.md`, `PLATFORM_OWNER_DECISION_REGISTER.md`, `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md`, `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md`, `IMPLEMENTATION_SOURCE_TRACEABILITY.md`, `SDD_COMPLETENESS_AUDIT.md`, `ISSUES.md`, and `PROGRESS.md`. For Admin details, also read `ADMIN_REQUIREMENTS.md`, `ADMIN_REQUIREMENTS_AUDIT.md`, and `ADMIN_PORTAL.md`.

## Accepted owner decisions — preserve

- DEC-022: minimal hybrid Admin/Operations responsibility model; exact action permissions and approval boundaries remain to be specified.
- DEC-023: independent shipment booking is for registered, authenticated customers at launch; storefront guest checkout remains supported.
- DEC-024: booking party, sender, receiver, payer, and handover person may differ; payer default access is payment confirmation/receipt only; payment does not grant full shipment detail; booking does not authorize collection.
- DEC-025: lean location records and separately configured per-location capabilities for walk-in intake, measurement, custody, payment recording, and parcel release.
- DEC-026–DEC-027: service-appropriate fixed/calculated pricing, quote preservation, configurable discrepancy thresholds, and controlled proposed adjustments; exact values and approval details remain open.
- DEC-028–DEC-029: configured payment-at-intake methods with evidence; cancellation, late payment, refunds, credits, reversals, chargebacks, and reconciliation are distinct traceable events.
- DEC-030: narrow controlled dispatch exceptions with explicit permission, no automatic self-approval, second approval for material exceptions, and no falsification of payment state.
- DEC-031: route proposal/approval/assignment/dispatch/physical movement are distinct; Operations manages launch assignments; Driver Portal deferred.
- DEC-032: delivery attempt, success, failure, collection, and return are distinct; successful delivery requires service-appropriate evidence.
- DEC-033: accountable evidence-based audit/disclosure; preserve history, controlled corrections, purpose-appropriate retention, restricted review, and recorded government-request disclosures.
- DEC-034: event-driven notifications with role-based access; email primary where configured, SMS optional subject to configuration/consent, Telegram deferred and gated by Admin **Assign For Delivery** plus separate policy approval.
- DEC-035: secure guest-order recovery through proof of control of original checkout email; optional account claiming requires authenticated account plus a separate ownership challenge; no multiple claims or silent transfer.
- DEC-036: evidence-based launch with explicit P0/P1/deferred scope; every P0 requirement needs demonstrable evidence; code presence/build success alone is insufficient.

## Working principles

- Preserve existing Next.js App Router, TypeScript, Firebase Auth/Firestore/Firebase Admin, Paystack, Cloudinary, and existing component/service/type/style patterns.
- Do not rebuild the application or invent parallel architecture, collections, fields, routes, services, status enums, roles, or permissions.
- Keep accepted policy, source facts, reported tests, independently verified behaviour, and production-readiness evidence distinct.
- Read-only source inspection is allowed. Do not modify application code until the complete platform-wide SDD is reconciled and explicitly approved.
- Keep changes focused and documentation-only while completing the SDD. Use branches and PRs; the owner reviews and merges every PR.
- Never claim tests were run unless they actually were; state environment, scope, and evidence.

## Remaining sequence

1. Review/merge the requirement-level priority proposal only after owner approval.
2. Refresh read-only source traceability against the current source head and map each P0/Conditional P0 requirement to source evidence, a gap, or an explicit unverified/not-inspected state.
3. Define detailed cross-domain acceptance scenarios and evidence requirements.
4. Assess production-readiness evidence and unresolved release blockers.
5. Reconcile all SDD documents and present the complete baseline for explicit owner approval.
6. Only after approval, plan focused implementation work.

Do not restart the completed 15-decision sequence. Start by verifying the live `main` head and PR state, then continue from `PROGRESS.md`. Never merge on the owner's behalf.
