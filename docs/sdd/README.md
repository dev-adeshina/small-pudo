# VeriLyft — Beyond Borders

## Spec-driven development documentation

This folder is the continuity and specification guide for VeriLyft — Beyond Borders, a logistics-first shipment-management platform built on the existing Next.js, TypeScript, Firebase/Firestore, Firebase Authentication, Firebase Admin, Paystack, and Cloudinary application. Storefront commerce is an attached, secondary service; it is not the primary platform workflow.

### Documents

- `SPEC.md` — product requirements, user flows, architecture, implementation principles, UI conventions, security expectations, acceptance criteria, and historical roadmap (not the current work order).
- `SDD_COMPLETENESS_AUDIT.md` — platform-wide documentation coverage, inconsistencies, gaps, and the SDD completion sequence.
- `PLATFORM_DECISION_DOCUMENT_RECONCILIATION.md` — decision-to-document coverage, stale references, omissions, and unresolved reconciliation work.
- `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md` — platform actor catalogue, accepted responsibility boundaries, portal/module distinction, and remaining role/permission design questions.
- `PLATFORM_STAFF_PERMISSION_DECISIONS.md` — owner-accepted outcomes for PM-01–PM-12; policy decisions are accepted, while detailed technical permission design remains open.
- `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md` — owner-accepted BP-01–BP-22 under DEC-023/DEC-024; operational and technical parameters remain open.
- `PLATFORM_STAFF_PERMISSION_MATRIX.md` — proposed action-level staff permission, location-capability, approval, and separation-of-duties matrix; draft for owner review, not implementation approval.
- `PLATFORM_SHARED_WORKFLOWS.md` — draft cross-domain workflows for storefront fulfilment, independent shipment booking, intake/custody, pricing, payments, routing, dispatch, delivery, notifications, and audit/evidence.
- `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md` — draft conceptual domain relationships, lifecycle boundaries, API/service contract expectations, security controls, and source-validation checklist.
- `IMPLEMENTATION_SOURCE_TRACEABILITY.md` — read-only source inventory mapped to the platform SDD, with evidence limits, implementation gaps, and verification follow-ups.
- `PLATFORM_REQUIREMENT_PRIORITY_MATRIX.md` — owner-reviewed and merged P0/P1/conditional-P0/deferred mapping for all 20 cross-domain areas and ADM-R01–ADM-R54; this is a priority baseline, not complete SDD or implementation approval.
- `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md` — draft scenario outlines and evidence requirements for A-01–A-20 and ADM-R01–ADM-R54, including conditional-P0 activation gates and unresolved policy dependencies; not executed tests or implementation approval.
- `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md` — draft cross-domain acceptance matrix for workflows, actors, lifecycle boundaries, security, failure recovery, audit evidence, and outstanding specification/verification work; not implementation approval.
- `PLATFORM_OWNER_DECISION_REGISTER.md` — dependency-ordered record of D-01–D-15 outcomes, DEC-037–DEC-044 policy refinements, PM-01–PM-12 and BP-01–BP-22 accepted policies, and remaining detailed design questions; the complete SDD is not yet approved.
- `ADMIN_REQUIREMENTS.md` — consolidated Admin Portal requirements, startup priorities, scope boundaries, and requirements-baseline approval checklist.
- `ADMIN_REQUIREMENTS_AUDIT.md` — source-level validation matrix for requirements versus existing code, including evidence, gaps, and outstanding verification.
- `ADMIN_PORTAL.md` — Admin Portal page-by-page design, confirmed decisions, scope boundaries, and unresolved design items.
- `PROGRESS.md` — current project status, active phase, next actions, and completion checklist. Update it whenever work is completed or the active task changes.
- `ISSUES.md` — known gaps, risks, verification tasks, and decisions that must not be silently assumed.
- `DECISIONS.md` — architecture and product decisions, including constraints that future sessions must preserve.
- `SESSION_HANDOFF.md` — copy/paste instructions for starting a new ChatGPT session with these documents.

### SDD-first working protocol

1. Complete and reconcile the platform-wide SDD before application-code changes.
2. Use approved SDD documents as the source of intended product behaviour; use source inspection to establish current implementation facts and test/deployment evidence to establish verified behaviour.
3. Record conflicts between intended behaviour, source, and evidence. Do not silently treat implementation as product approval or documentation as proof of implementation.
4. Use `SDD_COMPLETENESS_AUDIT.md` as the platform-wide documentation-gap checklist, the workflow/domain documents as drafts for owner review, and `IMPLEMENTATION_SOURCE_TRACEABILITY.md` for observed source facts and gaps.
5. Read-only source inspection is allowed when needed to document the current system; do not implement new routes, collections, fields, services, or portal pages until the relevant SDD is reviewed and approved.
6. Treat dated roadmap/checkpoint entries as historical unless revalidated. `PROGRESS.md` is the active-task pointer, reconciled with `ISSUES.md`, `IMPLEMENTATION_SOURCE_TRACEABILITY.md`, and the current branch/PR state.

### How to use these documents in a new session

1. Share the folder/repository link or upload these files.
2. Paste the handoff instructions from `SESSION_HANDOFF.md`.
3. Tell the session the specific task you want to work on.
4. Ask the session to read `SPEC.md`, `PROGRESS.md`, `ISSUES.md`, and `DECISIONS.md` before proposing changes. For Admin Portal work, also read `ADMIN_REQUIREMENTS.md` and `ADMIN_PORTAL.md`.
5. Before application-code changes, reconcile `README.md`, `SPEC.md`, `DECISIONS.md`, `ISSUES.md`, `PROGRESS.md`, and `SESSION_HANDOFF.md` with the completeness audit, relevant requirements, `IMPLEMENTATION_SOURCE_TRACEABILITY.md`, current source, and test evidence. Keep them updated as work is completed.

### Authority and evidence precedence

Use each source for the kind of fact it can establish:

1. **Intended product behaviour:** the reviewed/approved SDD and accepted decisions in `DECISIONS.md`. A draft requirement is not approved merely because it is written down.
2. **Current implementation facts:** the current repository source, configuration, and schema. Source presence does not prove that a feature works or that the behaviour is product-approved.
3. **Verified behaviour:** dated test results and deployment/runtime evidence. A reported result must be attributed to the reporter until independently reproduced.
4. **Current work status:** `PROGRESS.md`, reconciled with open items in `ISSUES.md` and the actual current branch/PR state.
5. **Domain-specific detail:** use `ADMIN_REQUIREMENTS.md`, `ADMIN_REQUIREMENTS_AUDIT.md`, and `ADMIN_PORTAL.md` for Admin requirements, source-level evidence, and page design respectively.
6. **Prior chat history:** only when available and consistent with the current approved decisions and evidence.

When sources conflict, do not silently favour code or documentation. Record the discrepancy, identify whether it concerns intended behaviour, implementation, or verification, and resolve it explicitly. The current repository is the evidence for what exists; the approved SDD is the authority for what the system is intended to do.

### Current Milestone 4 status

The latest verified `main` baseline is PR #66 merge commit `f5b274874693db1dbd7a46f17f3e1840a0d372d6`. The active application-source inspection baseline remains `e0f69055d33dd9399c23e1d793f359468229c856`; repository-history comparison through PR #65 found documentation-only changes after that source baseline. The current tree-path inventory found no dedicated shipment/custody/route/location API/library path. This is source/path-history evidence, not runtime or production verification.

Milestones 1–3 are complete at the owner-approved policy/documentation level: DEC-038 through DEC-044 are recorded in the SDD, with the relevant documentation PRs merged through PR #51. PR #52 reconciled the Milestone 3 completion record. The 15 high-level owner decisions D-01–D-15, staff permission policies PM-01–PM-12, and booking-party authority policies BP-01–BP-22 remain accepted at their recorded policy levels.

Milestone 4 is the active workstream: platform-wide SDD reconciliation and implementation-readiness assessment. Step 1's continuity baseline was established in PR #53 and refreshed through PR #64. Step 2A inventoried all 23 Markdown SDD documents; PRs #55–#58 corrected Admin history, actor/permission and requirement crosswalks, and P0 catalogue/readiness references. PR #60 completed the first full-document status/reference scan. PR #61 corrected the A-10/DEC-043 approval wording, PR #62 aligned DEC-038–DEC-041 status references, PR #63 clarified the Finance responsibility/deployment boundary, and PR #64 reconciled DEC-044 custody acceptance evidence; PR #66 aligns A-15 with accepted PM-01–PM-12 permission policy. The current A-16 audit/evidence reconciliation is recorded in the progress tracker and decision-to-document reconciliation report. PR #64's DEC-044 follow-up refines A-09 and existing P0 evidence cases for actual receipt, custody history, failed/disputed handovers, corrections and controlled investigation. Service-specific proof, authority, investigation, hold, retention and technical contracts remain open. See `PLATFORM_DECISION_DOCUMENT_RECONCILIATION.md`; full reconciliation remains open.

**Implementation gate:** No application-code changes are authorized until the complete platform-wide SDD has been reconciled and explicitly approved by the owner. Policy approval, documentation presence, source presence, passing builds, and readiness catalogues are not interchangeable with executable test approval or production evidence. Preserve the distinction between intended behaviour, current source facts, runtime verification, and production readiness.

See `PROGRESS.md` for the active work pointer, `SESSION_HANDOFF.md` for the current session instructions, `ISSUES.md` for unresolved work, and `SDD_COMPLETENESS_AUDIT.md` for the platform-wide reconciliation plan.


The latest A-15 reconciliation distinguishes accepted action-level staff permissions (PM-02) and the accepted PM-01–PM-12 policy from the still-open technical permission catalogue, enforcement, scope and threshold details. See `PLATFORM_DECISION_DOCUMENT_RECONCILIATION.md` and `SDD_COMPLETENESS_AUDIT.md`. This is not runtime security verification; VLY-009/VLY-010 remain open.


The A-16 reconciliation aligns DEC-033 accountable recordkeeping and PM-08's separate audit-view, export and external-disclosure permissions with A16-01–A16-04, Workflow J, lifecycle boundaries and ADM-R07/R46–R51. The four existing A-16 case IDs and 80-case catalogue are retained. VLY-023 remains open; no audit architecture or implementation is approved, and the implementation freeze remains active.