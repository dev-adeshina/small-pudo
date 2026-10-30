# New-session handoff prompt

Continue the existing **VeriLyft — Beyond Borders** project in `dev-adeshina/small-pudo`.

## Current verified repository state

- Latest verified `main` head: `beb2d03e88df7894a8805af79a9d68fd74cc143f` — PR #35 merged on 30 October 2026 at 15:17:11 UTC.
- Current documentation proposal: `docs/stage-5-2-booking-party-authority` (verify its PR/state before continuing).
- The active work is documentation-only. No application-code changes are authorized until the complete platform-wide SDD is reconciled and explicitly approved.
- The source traceability inventory remains pinned to `c56be9b121e6007e1e99c6df2d3984e709771a92`; documentation-only merges after that source baseline do not independently prove runtime behaviour.

## Current owner-policy position

- D-01–D-15 have accepted high-level outcomes recorded as DEC-022–DEC-036.
- PM-01–PM-12 staff permission policies are accepted and recorded in `PLATFORM_STAFF_PERMISSION_DECISIONS.md`; technical permission design remains open.
- Stage 5.2 booking-party authority policies BP-01–BP-22 are accepted under DEC-023/DEC-024 and consolidated in `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`.
- Accepted booking policies cover pre-intake changes/cancellation; sender/receiver requests through Support; booking-party unavailability; collection and alternative collectors; disputed collection authority; party-specific notifications; booking transfer and financial responsibility; withdrawal; death/legal incapacity; delegated access, expiry, and non-transferability; account compromise; deletion/retention; record disputes; resolution targets; appeals and further review.
- Acceptance is policy-level only. Verification/consent methods, exact lifecycle/change matrix, evidence standards, exception authority, transfer-liability procedure, delegated-access action/duration, notification fields, retention/legal-hold rules, and dispute/appeal operating parameters remain open.

## Read first

Read `README.md`, `SPEC.md`, `DECISIONS.md`, `PLATFORM_OWNER_DECISION_REGISTER.md`, `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`, `PLATFORM_STAFF_PERMISSION_DECISIONS.md`, `PLATFORM_STAFF_PERMISSION_MATRIX.md`, `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md`, `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md`, `IMPLEMENTATION_SOURCE_TRACEABILITY.md`, `SDD_COMPLETENESS_AUDIT.md`, `ISSUES.md`, and `PROGRESS.md`. For Admin details, also read `ADMIN_REQUIREMENTS.md`, `ADMIN_REQUIREMENTS_AUDIT.md`, and `ADMIN_PORTAL.md`.

## Working principles

- Preserve the existing Next.js App Router, TypeScript, Firebase Auth/Firestore/Firebase Admin, Paystack, Cloudinary, and existing component/service/type/style patterns.
- Do not rebuild the application or invent parallel architecture, collections, fields, routes, services, status enums, roles, or permissions.
- Keep accepted policy, source facts, reported tests, independently verified behaviour, and production-readiness evidence distinct.
- Read-only source inspection is allowed. Do not modify application code until the complete platform-wide SDD is reconciled and explicitly approved.
- Keep changes focused and documentation-only while completing the SDD. Use branches and PRs; the owner reviews and merges every PR.
- Never claim tests were run unless they actually were; state environment, scope, and evidence.

## Next sequence

1. Verify the live `main` head and the status of the Stage 5.2 documentation PR; inspect its complete diff and review feedback.
2. After the owner reviews and merges the Stage 5.2 PR, proceed to **Stage 5.3 — pricing, measurements, and quote adjustments** (DEC-026/DEC-027).
3. Continue reconciling detailed policy and technical dependencies across DEC-022–DEC-036, workflows, lifecycle/API/security contracts, acceptance criteria, source traceability, and evidence planning.
4. Confirm whether repository-root `pudo.zip` is authoritative and within active VeriLyft source scope; it has not been inspected.
5. Obtain safe non-production runtime evidence for source-present P0 paths and assess production configuration, monitoring, backup/restore, incident response, rollback, and release sign-off.
6. Present the complete reconciled platform-wide SDD for explicit owner approval.
7. Only after that approval, plan focused application implementation.

Never merge on the owner's behalf. Do not restart the completed D-01–D-15 or PM-01–PM-12 decision sequences.
