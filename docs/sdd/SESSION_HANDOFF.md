# New-session handoff prompt

Continue the existing **VeriLyft — Beyond Borders** project in `dev-adeshina/small-pudo`.

## Current verified state

- Latest verified `main` head: `c6dd28cd5450b598b19a19afa12a7331440320f0` (PR #32 merged 30 October 2026).
- All 15 tracked high-level owner decisions (D-01–D-15; DEC-022–DEC-036) are accepted. The decision queue is complete, but the platform-wide SDD is not yet complete or approved.
- Refreshed source inspection baseline: `e0f69055d33dd9399c23e1d793f359468229c856` (PR #32 changed SDD documentation only). `IMPLEMENTATION_SOURCE_TRACEABILITY.md` maps A-01–A-20 and ADM-R01–ADM-R54 against the active source tree at that exact source commit.
- Current task: **Stage 4 — owner review and refinement of P0/Conditional P0 acceptance scenarios and evidence requirements**. PR #31 priority baseline and PR #32 source traceability are merged. The complete platform-wide SDD remains unapproved.

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

1. Confirm whether root `pudo.zip` is authoritative and within active VeriLyft source scope; it has not been inspected.
2. Owner-review `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md`; resolve its policy dependencies and approve test specifications for every P0/Conditional P0 requirement.
3. Obtain runtime evidence for source-present P0 paths in safe non-production environments; do not treat source presence as runtime proof.
4. Assess production configuration, monitoring, backup/restore, incident response, rollback and release sign-off.
5. Reconcile all SDD documents and present the complete platform-wide baseline for explicit owner approval.
6. Only after complete SDD approval, plan focused implementation work.

Do not restart the completed 15-decision sequence. Start by verifying the live `main` head and PR state, then continue from `PROGRESS.md`. Never merge on the owner's behalf.
