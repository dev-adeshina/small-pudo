# New-session handoff prompt

Copy and paste the prompt below into a new ChatGPT session, and
attach/share this documentation folder and the current project
repository or ZIP.

------------------------------------------------------------------------

We are continuing an existing Next.js + TypeScript + Firebase e-commerce
project named **VeriLyft --- Beyond Borders**.

Read these documents before proposing implementation: `SPEC.md`,
`PROGRESS.md`, `ISSUES.md`, and `DECISIONS.md`. For Admin Portal
design or implementation tasks, also read `ADMIN_PORTAL.md`.

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
-   Update `PROGRESS.md`, `ISSUES.md`, and `DECISIONS.md` when
    appropriate.

## Current project position

The current feature state and latest verified baseline are recorded in
`PROGRESS.md`. Historical notes in this handoff may be stale; verify the
current repository and tracker before relying on any implementation or
test claim. Do not treat older archive observations as current facts.

## Current priority

The current active task and verified project position are recorded in
`PROGRESS.md`. Always consult that tracker rather than relying on this
handoff's historical description. If the task concerns Admin Portal design,
consult `ADMIN_PORTAL.md` and continue page-by-page design before coding.

Delivery/customer tracking UI and Telegram are deliberately later
phases. Cloudinary is deferred unless a concrete requirement justifies
migration from Firebase Storage.

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
