# VeriLyft --- Beyond Borders

## Spec-driven development documentation

This folder is the continuity and implementation guide for the existing
VeriLyft Next.js + TypeScript + Firebase e-commerce project.

### Documents

- `SPEC.md` — product requirements, user flows, architecture,
  implementation principles, UI conventions, security expectations,
  acceptance criteria, and phased roadmap.
- `ADMIN_PORTAL.md` — Admin Portal page-by-page design, confirmed
  decisions, scope boundaries, and unresolved design items.
- `PROGRESS.md` — current project status, the active phase, next
  actions, and completion checklist. Update it whenever work is
  completed or the active task changes.
- `ISSUES.md` — known gaps, risks, verification tasks, and decisions
  that must not be silently assumed.
- `DECISIONS.md` — architecture and product decisions, including
  constraints that future sessions must preserve.
- `SESSION_HANDOFF.md` — copy/paste instructions for starting a new
  ChatGPT session with these documents.

### How to use these documents in a new session

1. Share the folder/repository link or upload these files.
2. Paste the handoff instructions from `SESSION_HANDOFF.md`.
3. Tell the session the specific task you want to work on.
4. Ask it to read `SPEC.md`, `PROGRESS.md`, `ISSUES.md`, and
   `DECISIONS.md` before proposing changes. For Admin Portal tasks,
   also read `ADMIN_PORTAL.md`.
5. Keep `PROGRESS.md` and `ISSUES.md` updated as work is completed.

### Source-of-truth order

1.  The current working repository and its actual code.
2.  `PROGRESS.md` for the latest declared project position.
3.  `SPEC.md` for intended product behaviour and architecture
    principles.
4.  `ADMIN_PORTAL.md` for Admin Portal design tasks only.
5.  `DECISIONS.md` for accepted decisions.
6.  `ISSUES.md` for known gaps and unverified claims.
7.  Prior chat history, only when available and consistent with the
    above.

If the code differs from this documentation, do not blindly rewrite code
to match the document. Report the difference, determine whether the code
or specification is stale, and update the relevant document after an
explicit decision.

### Important status caveat

Some historical notes in this documentation originated from the
`pudo(5).zip` archive and project context available on 17 October 2026.
That archive lacked root project configuration and could not support a
complete install/build verification. Treat those statements as
historical, not as current repository facts. For the latest declared
project position, use `PROGRESS.md`; verify current code and test
results directly before claiming a feature is implemented or tested.
