# VeriLyft — Beyond Borders

## Spec-driven development documentation

This folder is the continuity and implementation guide for the existing VeriLyft Next.js + TypeScript + Firebase ecommerce and delivery project.

### Documents

- `SPEC.md` — product requirements, user flows, architecture, implementation principles, UI conventions, security expectations, acceptance criteria, and historical roadmap (not the current work order).
- `SDD_COMPLETENESS_AUDIT.md` — platform-wide documentation coverage, inconsistencies, gaps, and the proposed SDD completion sequence.
- `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md` — platform actor catalogue, accepted responsibility boundaries, portal/module distinction, and remaining role/permission design questions.
- `PLATFORM_STAFF_PERMISSION_MATRIX.md` — proposed action-level staff permission, location-capability, approval, and separation-of-duties matrix; draft for owner review, not implementation approval.
- `PLATFORM_SHARED_WORKFLOWS.md` — draft cross-domain workflows for storefront fulfilment, independent shipment booking, intake/custody, pricing, payments, routing, dispatch, delivery, notifications, and audit/evidence.
- `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md` — draft conceptual domain relationships, lifecycle boundaries, API/service contract expectations, security controls, and source-validation checklist.
- `IMPLEMENTATION_SOURCE_TRACEABILITY.md` — read-only source inventory mapped to the platform SDD, with evidence limits, implementation gaps, and verification follow-ups.
- `PLATFORM_REQUIREMENT_PRIORITY_MATRIX.md` — owner-reviewed and merged P0/P1/conditional-P0/deferred mapping for all 20 cross-domain areas and ADM-R01–ADM-R54; this is a priority baseline, not complete SDD or implementation approval.
- `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md` — draft scenario outlines and evidence requirements for A-01–A-20 and ADM-R01–ADM-R54, including conditional-P0 activation gates and unresolved policy dependencies; not executed tests or implementation approval.
- `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md` — draft cross-domain acceptance matrix for workflows, actors, lifecycle boundaries, security, failure recovery, audit evidence, and outstanding specification/verification work; not implementation approval.
- `PLATFORM_OWNER_DECISION_REGISTER.md` — dependency-ordered record of D-01–D-15 owner decisions, accepted constraints, and remaining detailed design questions; the complete SDD is not yet approved.
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

### Important status caveat

All 15 tracked owner decisions (D-01–D-15; DEC-022–DEC-036) have high-level accepted outcomes recorded. DEC-036 accepts an evidence-based P0/P1/deferred launch approach. `PLATFORM_REQUIREMENT_PRIORITY_MATRIX.md` contains the owner-reviewed and merged requirement-level priority baseline. Refreshed source traceability is pinned to the PR #31 merge commit; detailed acceptance scenarios are drafted in `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md`; owner review, policy resolution, runtime/production verification, and complete platform-wide SDD approval remain outstanding. Requirements do not prove implementation. `PROGRESS.md` is the current work pointer; verify source and actual test/deployment evidence before claiming a feature is implemented, tested, or launch-ready.
