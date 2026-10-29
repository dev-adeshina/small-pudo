# New-session handoff prompt

Copy and paste the prompt below into a new ChatGPT session, and
attach/share this documentation folder and the current project
repository or ZIP.

------------------------------------------------------------------------

We are continuing an existing Next.js + TypeScript + Firebase e-commerce
project named **VeriLyft --- Beyond Borders**.

Read these documents before proposing implementation: `SPEC.md`,
`PROGRESS.md`, `ISSUES.md`, and `DECISIONS.md`. For Admin Portal
design or implementation tasks, also read `ADMIN_REQUIREMENTS.md`,
`ADMIN_REQUIREMENTS_AUDIT.md`, and `ADMIN_PORTAL.md`.

Treat them as the project continuity documents. Then inspect the actual
current repository before editing. Do not assume the ZIP baseline is
identical to the live working tree.

## Non-negotiable working principles

-   Continue the existing architecture; do not rebuild or redesign
    unnecessarily.
-   Make focused, minimal changes and reuse existing files, types,
    Firebase helpers, auth patterns, components, and CSS conventions.
-   Do not invent requirements, dependencies, routes, fields, or
    patterns without explaining why.
-   Server-side code must validate prices, stock, payment state, order
    ownership, and privileged operations.
-   Preserve guest checkout unless I explicitly change that decision.
-   Keep customer authorization separate from admin authorization.
-   Use `app/globals.css` and existing Tailwind patterns; do not
    introduce a new CSS framework or broad redesign.
-   Be honest about which tests you actually ran.
-   Complete and reconcile the platform-wide SDD before application-code changes; read-only source inspection is allowed to establish implementation facts.
-   Keep intended behaviour (approved SDD), implementation facts (source), and verified behaviour (test/deployment evidence) distinct.
-   Do not change application code until the active task, acceptance criteria, and outstanding verification are recorded consistently.

## Current project position

The current repository baseline, active phase, implementation notes, and dated verification claims are recorded in `PROGRESS.md`. The platform-wide audit was reviewed against the historical baseline `cccad3c4eebe398c8369d5ce90ea05ee551589cf`; current `main` is `d57dd3baec63313b429718aa2d569ccf9351b9ff` (PR #5 merge). Historical notes and roadmap entries are not current task instructions unless revalidated. Do not treat older archive observations as current facts.

## Current priority

For platform-wide design work, start with `SDD_COMPLETENESS_AUDIT.md`, `SPEC.md`, `DECISIONS.md`, `ISSUES.md`, and `PROGRESS.md`. For Admin Portal details, also use `ADMIN_REQUIREMENTS.md`, `ADMIN_REQUIREMENTS_AUDIT.md`, and `ADMIN_PORTAL.md`. The owner-confirmed operating model is recorded, but the consolidated P0/P1/deferred priority baseline and detailed page specifications remain under review. The current active task and evidence are in `PROGRESS.md`; check the current repository/PR states rather than relying on this handoff alone.

Current active task: review and accept the proposed continuity-document reconciliation. After that checkpoint, define the platform actors and responsibility boundaries, then specify shared shipment/pricing/payment/intake/transport/delivery workflows before completing portal-level requirements and acceptance criteria. Do not resume application-code changes until the platform-wide SDD is reviewed and approved. Runtime Admin authorization and Cloudinary tests remain outstanding; they are verification tasks, not proof that the SDD work is complete.

Guest order tracking and email have implementation evidence recorded in `PROGRESS.md`; Telegram remains deferred. Cloudinary is the selected image-hosting integration, but runtime upload verification is still required.

## How to work

1.  Summarize the relevant current state from the docs and code.
2.  Identify the smallest set of files that need to change for my
    requested task.
3.  State acceptance criteria and any essential uncertainty.
4.  Implement only the agreed task.
5.  Run relevant tests/build checks if the environment permits.
6.  Report changed files, actual test results, remaining risks, and the
    single next recommended task.
7.  Update the progress and issue trackers.

My task for this session is: \[PASTE THE SPECIFIC TASK HERE\]
