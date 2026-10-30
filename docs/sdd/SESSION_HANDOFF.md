# New-session handoff prompt

Continue **VeriLyft — Beyond Borders** in `dev-adeshina/small-pudo`.

## Verified repository state

- Latest verified `main`: `832378948a003b5848029758a05050632e9d5373` — PR #42 merged.
- The PR #42 readiness assessment is merged and accepted as a readiness/navigation baseline only; it does not approve executable tests, test execution, implementation, or release.
- Active-source traceability baseline: `e0f69055d33dd9399c23e1d793f359468229c856` (refreshed in PR #32). Changes through PR #42 are documentation-only; they do not establish runtime behaviour.
- Application-code changes remain prohibited until the complete platform-wide SDD is reconciled and explicitly approved.

## Accepted policy and completed documentation stages

- D-01–D-15 high-level owner outcomes are accepted under DEC-022–DEC-036.
- PM-01–PM-12 staff permission policies are accepted; technical permission design remains open.
- Stage 5.2 booking-party authority BP-01–BP-22 is accepted and consolidated in merged PR #36.
- Stage 5.3's six pricing/measurement/quote/adjustment/financial-outcome policy areas are accepted and consolidated in merged PR #37. DEC-026, DEC-027, and DEC-029 were reconciled across the owner register, shared workflows, lifecycle contracts, cross-domain acceptance matrix, issues, progress, and handoff.
- Stage 5.3 policy acceptance does not settle detailed formulae/rates, input sources, units/conversion, rounding/effective dates, taxes/fees/discounts, expiry treatment of already accepted quotes, numeric discrepancy thresholds, approval limits, or adjustment-rejection service resolution.

## Current stage — Stage 5.5 readiness baseline accepted; launch scope next

Stage 5.4 is complete. The owner explicitly approved the policy/scenario-design approach for all 20 sections A-01–A-20, and PR #39 merged the refinements into `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md`. This is not approval of executable test specifications, test execution, implementation, or release.

Stage 5.5 proceeds in four controlled steps:
1. **Completed in PR #40:** Correct continuity records, duplicate issue identifiers, and stale approval/status statements.
2. **First-pass alignment recorded in PR #40:** Reconcile DEC-022–DEC-036 against actor, shared-workflow, lifecycle, and cross-domain acceptance documents. Accepted policies remain accepted; unresolved technical contracts remain open.
3. **Completed in PR #41:** Consolidated dependency/traceability register for A-01–A-20 and ADM-R01–ADM-R54, accepted as a navigation baseline only.
4. **Completed in PR #42:** `PLATFORM_P0_TEST_SPECIFICATION_READINESS.md` assesses all 45 P0 and 6 Conditional P0 requirements, the 80 scenario outlines, source-backed test-specification candidates, missing capabilities, policy/contract blockers, and conditional activation gates. The owner-reviewed assessment is accepted as a readiness/navigation baseline only. No requirement is approved for execution.

Do not invent unresolved thresholds, formulas, permission limits, proof methods, retention periods, or retry/time-out values. Before any test execution, each P0/Conditional P0 needs an approved, reproducible test specification with preconditions, actor, action, expected state and non-state changes, replay/failure behaviour, evidence artifacts, cleanup, and accountable reviewer. Production-readiness evidence is a separate workstream.

Other unresolved gates:
- Confirm whether repository-root `pudo.zip` belongs to the active VeriLyft source-of-truth scope; it has not been inspected.
- **Next decision:** Confirm the intended initial launch scope and explicitly classify each capability as (a) included at launch, (b) disabled/not offered at launch, or (c) supported through an approved manual fallback. Begin with service scope and do not assume independent-shipment operations are launch-enabled.
- After launch scope is approved, sequence the detailed blockers/contracts and author individual reproducible test specifications; preserve the active source baseline at `e0f69055` unless a source-changing commit is inspected.
- Define production-like environment, blocker ownership, deployment/rollback, backup/restore proof, monitoring/alerts, incident response, and dated release sign-off.
- Obtain explicit owner approval of the complete platform-wide SDD before implementation.

## Working rules

- Preserve the existing Next.js App Router, TypeScript, Firebase Auth/Firestore/Firebase Admin, Paystack, Cloudinary, and current component/service/type/style patterns.
- Do not invent parallel architecture, collections, fields, routes, services, status enums, roles, or permissions.
- Keep accepted policy, source facts, test evidence, and production-readiness evidence distinct.
- Keep changes focused and documentation-only while the SDD is incomplete. Use branches and PRs; the owner reviews and merges every PR.
- Never claim tests were run unless they actually were.

Do not restart the completed D-01–D-15, PM-01–PM-12, Stage 5.2, or Stage 5.3 decision sequences.
