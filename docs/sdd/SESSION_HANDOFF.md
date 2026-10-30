# New-session handoff prompt

Continue **VeriLyft — Beyond Borders** in `dev-adeshina/small-pudo`.

## Verified repository state

- Latest verified `main`: `b238a1861c4c3825fc8a31cac122b2b14b6c7e79` — PR #37 merged on 30 October 2026 at 19:11:48 UTC.
- Current documentation-only work branch: `docs/stage-5-4-p0-evidence-review`.
- Source traceability remains pinned to `c56be9b121e6007e1e99c6df2d3984e709771a92`. Documentation-only merges after that baseline do not prove application runtime behaviour.
- Application-code changes remain prohibited until the complete platform-wide SDD is reconciled and explicitly approved.

## Accepted policy and completed documentation stages

- D-01–D-15 high-level owner outcomes are accepted under DEC-022–DEC-036.
- PM-01–PM-12 staff permission policies are accepted; technical permission design remains open.
- Stage 5.2 booking-party authority BP-01–BP-22 is accepted and consolidated in merged PR #36.
- Stage 5.3's six pricing/measurement/quote/adjustment/financial-outcome policy areas are accepted and consolidated in merged PR #37. DEC-026, DEC-027, and DEC-029 were reconciled across the owner register, shared workflows, lifecycle contracts, cross-domain acceptance matrix, issues, progress, and handoff.
- Stage 5.3 policy acceptance does not settle detailed formulae/rates, input sources, units/conversion, rounding/effective dates, taxes/fees/discounts, expiry treatment of already accepted quotes, numeric discrepancy thresholds, approval limits, or adjustment-rejection service resolution.

## Current stage — Stage 5.4 P0 acceptance-evidence review

The next owner-review task is `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md`. It currently drafts scenario outlines for cross-domain areas A-01–A-20 and maps ADM-R01–ADM-R54. It is a test-design catalogue, not approved executable test scripts and not evidence that tests have run.

Review its scope and wording against DEC-018 and DEC-022–DEC-036, the requirement priority matrix, shared workflows, lifecycle contracts, cross-domain acceptance matrix, source traceability, and issue register. Refine policy-dependent cases without inventing unresolved thresholds, formulas, permission limits, proof methods, retention periods, or retry/time-out values.

Before any test execution, each P0/Conditional P0 needs an approved, reproducible test specification with preconditions, actor, action, expected state and non-state changes, replay/failure behaviour, evidence artifacts, cleanup, and accountable reviewer. Execute only in a safe non-production environment after approval. Production-readiness evidence is a separate workstream.

Other unresolved gates:
- Confirm whether repository-root `pudo.zip` belongs to the active VeriLyft source-of-truth scope; it has not been inspected.
- Reconcile remaining DEC-022–DEC-036 technical dependencies and source traceability.
- Define production-like environment, blocker ownership, deployment/rollback, backup/restore proof, monitoring/alerts, incident response, and dated release sign-off.
- Obtain explicit owner approval of the complete platform-wide SDD before implementation.

## Working rules

- Preserve the existing Next.js App Router, TypeScript, Firebase Auth/Firestore/Firebase Admin, Paystack, Cloudinary, and current component/service/type/style patterns.
- Do not invent parallel architecture, collections, fields, routes, services, status enums, roles, or permissions.
- Keep accepted policy, source facts, test evidence, and production-readiness evidence distinct.
- Keep changes focused and documentation-only while the SDD is incomplete. Use branches and PRs; the owner reviews and merges every PR.
- Never claim tests were run unless they actually were.

Do not restart the completed D-01–D-15, PM-01–PM-12, Stage 5.2, or Stage 5.3 decision sequences.
