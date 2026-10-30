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

The current repository baseline, active phase, implementation notes, and dated verification claims are recorded in `PROGRESS.md`. The platform-wide audit's original comparison baseline `cccad3c4eebe398c8369d5ce90ea05ee551589cf` is historical. The latest source inspection used `main` at `c56be9b121e6007e1e99c6df2d3984e709771a92`, which includes PR #9 and PR #3. Historical notes and roadmap entries are not current task instructions unless revalidated. Do not treat older archive observations as current facts.

## Current priority

For platform-wide design work, start with `SDD_COMPLETENESS_AUDIT.md`, `SPEC.md`, `DECISIONS.md`, `ISSUES.md`, `PROGRESS.md`, `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md`, `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, and `IMPLEMENTATION_SOURCE_TRACEABILITY.md`. For Admin Portal details, also use `ADMIN_REQUIREMENTS.md`, `ADMIN_REQUIREMENTS_AUDIT.md`, and `ADMIN_PORTAL.md`. The owner-confirmed operating model is recorded, but the consolidated P0/P1/deferred priority baseline and detailed page specifications remain under review. The current active task and evidence are in `PROGRESS.md`; check the current repository/PR states rather than relying on this handoff alone.

PR #8 and PR #9 are merged; PR #13 (cross-domain acceptance matrix), PR #14 (owner decision register), and PR #15 (D-01 hybrid staff-model reconciliation) are merged. The owner accepted D-01 Option C (minimal hybrid staff model), D-02 Option B (registered, authenticated customers only for independent shipment booking at launch), the recommended D-03 party/access policy, and the recommended D-04 capability-based location policy, recorded as DEC-022, DEC-023, DEC-024, and DEC-025 respectively. Under DEC-024, booking party, sender, receiver/collection recipient, payer, and handover person may differ; payer visibility defaults to payment confirmation/receipt only; payment does not grant full shipment-detail access; booking does not authorize collection; and change authority is defined by change type and lifecycle stage. Guest shipment booking is out of launch scope; storefront guest checkout remains unchanged. The initial source map records current storefront order/payment/fulfilment, customer access, Admin authorization, Cloudinary upload, and Firestore-rule evidence; it also records missing or not-yet-found source surfaces for independent booking, PUDO/pricing/routing/movement, general financial events, and audit. Search remaining source for reusable helpers/data and distinguish source presence from runtime verification. PR #3 is merged; PR #4 remains open/unmerged. D-01's action-level permissions and approval thresholds remain open. D-02's additional verification checkpoints, business-account handling, quote validity, and booking amendment/cancellation rules remain open. D-03's detailed verification checkpoints, sender/receiver consent, change-type permissions, post-intake/post-dispatch controls, collection-proof requirements, and notification field matrix remain open. Continue to record further owner choices in `DECISIONS.md` and reconcile affected documents. D-04 is resolved at the high level by DEC-025: per-location capabilities govern walk-in intake creation, measurement, custody acceptance, payment recording, and parcel release as separate actions; initial location records remain lean (name, address, active status, configured capabilities). Exact staff assignment, partner access, measurement/discrepancy rules, payment evidence, collection verification, and second-person approval requirements remain open. D-05 is resolved at the high level by DEC-026: select fixed/calculated pricing by service; share pricing rules across storefront delivery and independent shipment booking wherever inputs overlap; configure quote validity by service; preserve accepted quote inputs, itemized charges, total, currency, and rate/rule version/effective context. Exact formulas, units, service mapping, distance source/bands, rounding, effective dates, expiry/re-quote behaviour, taxes/fees/discounts, and adjustment thresholds remain open. D-06 is resolved at the high level by DEC-027: use configurable service-appropriate thresholds to distinguish routine measurement variation from material discrepancies; preserve quoted inputs and actual intake measurements separately with actor/location/time and applicable evidence; link proposed adjustments to the original quote; require review for material discrepancies and adjustments affecting existing payments; and never silently mutate accepted terms or treat a proposal/dispute as a settled financial event. Numeric thresholds, measurement units/service requirements, authority limits, second-person rules, customer consent/notification, and acceptance/dispute/refusal outcomes remain open. D-07 payment-at-intake methods/evidence is accepted as DEC-028. D-08 cancellation, late payment, refunds, credits, and reconciliation is accepted as DEC-029: cancellation is not a refund; late payments after cancellation/expiry are reconciled without automatic reactivation; refund requests/execution, credits, additional payments, reversals, and chargebacks remain distinct traceable events; mismatches are investigated; duplicate/replayed provider events must not duplicate financial effects; operational, cancellation, payment, and refund states remain distinct. Approval limits, refund timelines, fees, partial refunds, credit expiry/use, late-payment disposition, reconciliation cadence/ownership remain open. D-09 dispatch exception authority is accepted as DEC-030 (30 October 2026): narrow, controlled exceptions only for explicitly defined operational circumstances; explicit assigned permission; no automatic self-approval; second approver for material exceptions; no change to payment status and no bypass of unrelated safety, custody, identity, legal, or other operational holds; attributable parcel/reason/requester/approver/time/evidence/outcome. Eligible circumstances, permission assignment, materiality/second-approval rules, limits, category-specific evidence, and pre-dispatch revocation remain open. D-10 routing, route-leg assignment, and movement evidence is accepted as DEC-031 (30 October 2026): route proposal, approval, route-leg assignment, dispatch, physical handover, and arrival confirmation remain distinct; proposal/assignment is not proof of movement; Operations manages launch-time assignments; assignment changes require explicitly assigned authority and preserve history/actor/reason; movement records distinguish physical actor from staff recorder; delays, missed handovers, missing parcels, damage, and disputed custody transfers remain explicit exceptions; Driver Portal remains deferred. Route constraints, exact permissions/two-person approvals, mandatory milestones/evidence, provider/resource/capacity rules, correction authority, and detailed exception outcomes remain open. Do not resume application-code changes until the complete platform-wide SDD is reviewed and approved. Admin authorization, Cloudinary, payment edge-case, and inactive catalogue browser tests remain outstanding.

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


D-08 / DEC-029 was accepted on 30 October 2026 (Option A: explicit financial events with controlled transitions and reconciliation) and merged in PR #22. D-09 / DEC-030 was accepted on 30 October 2026 (Option A: narrow, controlled dispatch exceptions) and merged in PR #23. Do not resume application-code changes until the complete platform-wide SDD is reviewed and explicitly approved.


D-11 delivery proof and failed-delivery resolution is accepted as DEC-032 (30 October 2026, Option A: evidence-based delivery with controlled outcomes): delivery attempt, successful delivery, failed delivery, customer collection, and return are distinct; successful delivery requires approved service-appropriate evidence and a staff status update alone is insufficient; recipient authorization follows DEC-024 party/access boundaries; proof methods remain flexible by service and examples such as recipient confirmation, OTP, signed acknowledgement, and attributable staff evidence are not universally mandated; failed attempts retain reasons; reattempt, return, holding, refusal, cancellation, and financial adjustment require explicit authority; significant notifications respect party entitlements; disputed delivery preserves original evidence/history. Mandatory methods, OTP policy, attempt limits, resolution authority, holding duration, failure catalogue, loss/damage/refusal/dispute handling, customer-contact details, and acceptance tests remain open. Continue with D-12 audit, evidence retention, correction, and disclosure. Do not resume application-code changes until the complete platform-wide SDD is reviewed and approved.


D-12 audit, evidence retention, correction, and disclosure is accepted as DEC-033 (30 October 2026, Option A: accountable, evidence-based recordkeeping): consequential actions require attributable actor/action/resource/time/reason/evidence; physical actor and staff recorder remain distinguishable; audit entries alone do not prove physical events; original records/evidence are preserved and corrections/redactions remain separately authorized and traceable; retention/deletion is category- and purpose-appropriate with legal holds respected; audit/evidence access is restricted and sensitive access/disclosure is auditable; government requests require recorded authority, legal basis, scope, approval, and disclosure details and do not grant unrestricted platform access. Retention periods, full event/evidence catalogue, reviewer matrix, two-person approval cases, deletion/anonymization, legal-hold authority, detailed disclosure procedure, evidence integrity requirements, and acceptance tests remain open. Continue with D-13 customer notifications and Telegram boundary. Do not resume application-code changes until the complete platform-wide SDD is reviewed and approved.


D-13 customer notifications and Telegram boundary is accepted as DEC-034 (30 October 2026, Option A: controlled, event-driven notifications with role-based information access): notifications derive from meaningful, verified business events and cannot change or independently establish order, payment, shipment, dispatch, custody, or delivery state; recipients follow DEC-024/DEC-032 party relationships and entitlements; payer notices default to relevant financial information, not full shipment details; message content is minimized and authenticated links preserve access controls; email is primary where configured, SMS is optional subject to explicit configuration and applicable consent/contact verification, and in-platform notifications may serve authenticated experiences; Telegram remains deferred, and any future paid-order Telegram notification must follow authorized Admin **Assign For Delivery** approval plus separately approved Telegram purpose/audience/disclosure policy; duplicate sends are prevented per event/recipient/channel, bounded retries and attributable attempt/outcome history are required, and persistent failures are surfaced without silent fallback. Final event/timing/channel matrix, preferences/consent/contact verification, templates/fields, retry limits, deduplication semantics, failure ownership, retention, Telegram audience/purpose, and acceptance tests remain open. Continue with D-14 guest-order recovery or claiming. Do not resume application-code changes until the complete platform-wide SDD is reviewed and explicitly approved.
