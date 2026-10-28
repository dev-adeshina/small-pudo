# VeriLyft — Beyond Borders

## Spec-driven development documentation

This folder is the continuity and implementation guide for the existing VeriLyft Next.js + TypeScript + Firebase ecommerce and delivery project.

### Documents

- `SPEC.md` — product requirements, user flows, architecture, implementation principles, UI conventions, security expectations, acceptance criteria, and phased roadmap.
- `ADMIN_REQUIREMENTS.md` — consolidated Admin Portal requirements, startup priorities, scope boundaries, and requirements-baseline approval checklist.
- `ADMIN_REQUIREMENTS_AUDIT.md` — source-level validation matrix for requirements versus existing code, including evidence, gaps, and outstanding verification.
- `ADMIN_PORTAL.md` — Admin Portal page-by-page design, confirmed decisions, scope boundaries, and unresolved design items.
- `PROGRESS.md` — current project status, active phase, next actions, and completion checklist. Update it whenever work is completed or the active task changes.
- `ISSUES.md` — known gaps, risks, verification tasks, and decisions that must not be silently assumed.
- `DECISIONS.md` — architecture and product decisions, including constraints that future sessions must preserve.
- `SESSION_HANDOFF.md` — copy/paste instructions for starting a new ChatGPT session with these documents.

### How to use these documents in a new session

1. Share the folder/repository link or upload these files.
2. Paste the handoff instructions from `SESSION_HANDOFF.md`.
3. Tell the session the specific task you want to work on.
4. Ask the session to read `SPEC.md`, `PROGRESS.md`, `ISSUES.md`, and `DECISIONS.md` before proposing changes. For Admin Portal work, also read `ADMIN_REQUIREMENTS.md` and `ADMIN_PORTAL.md`.
5. Keep `PROGRESS.md` and `ISSUES.md` updated as work is completed.

### Source-of-truth order

1. The current working repository and its actual code.
2. `PROGRESS.md` for the latest declared project position.
3. `SPEC.md` for intended product behaviour and architecture principles.
4. `ADMIN_REQUIREMENTS.md` for the proposed startup requirements and priorities for the Admin Portal.
5. `ADMIN_REQUIREMENTS_AUDIT.md` for the current code-to-requirement validation evidence and gaps.
6. `ADMIN_PORTAL.md` for Admin Portal page-level design.
7. `DECISIONS.md` for accepted decisions.
8. `ISSUES.md` for known gaps and unverified claims.
9. Prior chat history, only when available and consistent with the above.

If the code differs from this documentation, do not blindly rewrite code to match the document. Report the difference, determine whether the code or specification is stale, and update the relevant document after an explicit decision.

### Important status caveat

The requirements baseline contains proposed priorities and startup-scope assumptions; it is not owner-approved until the launch scope and P0/P1/deferred classification are reviewed. Requirements do not prove implementation. Verify current code and actual test results before claiming that a feature is implemented or tested.
