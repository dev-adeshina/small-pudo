# VeriLyft — Beyond Borders

## Spec-driven development documentation

This folder is the continuity and implementation guide for the existing VeriLyft Next.js + TypeScript + Firebase ecommerce and delivery project.

### Documents

- `SPEC.md` — product requirements, user flows, architecture, implementation principles, UI conventions, security expectations, acceptance criteria, and historical roadmap (not the current work order).
- `SDD_COMPLETENESS_AUDIT.md` — platform-wide documentation coverage, inconsistencies, gaps, and the proposed SDD completion sequence.
- `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md` — platform actor catalogue, responsibility boundaries, portal/module distinction, and unresolved owner decisions.
- `PLATFORM_SHARED_WORKFLOWS.md` — draft cross-domain workflows for storefront fulfilment, independent shipment booking, intake/custody, pricing, payments, routing, dispatch, delivery, notifications, and audit/evidence.
- `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md` — draft conceptual domain relationships, lifecycle boundaries, API/service contract expectations, security controls, and source-validation checklist.
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
4. Use `SDD_COMPLETENESS_AUDIT.md` as the current checklist for platform-wide documentation gaps and `PLATFORM_SHARED_WORKFLOWS.md` for the current shared-workflow draft.
5. Read-only source inspection is allowed when needed to document the current system; do not implement new routes, collections, fields, services, or portal pages until the relevant SDD is reviewed and approved.
6. Treat dated roadmap/checkpoint entries as historical unless revalidated. `PROGRESS.md` is the active-task pointer, reconciled with `ISSUES.md` and the current branch/PR state.

### How to use these documents in a new session

1. Share the folder/repository link or upload these files.
2. Paste the handoff instructions from `SESSION_HANDOFF.md`.
3. Tell the session the specific task you want to work on.
4. Ask the session to read `SPEC.md`, `PROGRESS.md`, `ISSUES.md`, and `DECISIONS.md` before proposing changes. For Admin Portal work, also read `ADMIN_REQUIREMENTS.md` and `ADMIN_PORTAL.md`.
5. Before application-code changes, reconcile `README.md`, `SPEC.md`, `DECISIONS.md`, `ISSUES.md`, `PROGRESS.md`, and `SESSION_HANDOFF.md` with the completeness audit, relevant requirements, current source, and test evidence. Keep them updated as work is completed.

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

The launch operating model was owner-confirmed on 28 October 2026 and is recorded in `ADMIN_REQUIREMENTS.md` and `DECISIONS.md`. The consolidated P0/P1/deferred priority baseline still needs review. Requirements do not prove implementation. Reconcile the progress/issues/decision records before code changes, and verify current code and actual test results before claiming that a feature is implemented or tested.
