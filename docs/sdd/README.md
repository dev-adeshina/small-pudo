# VeriLyft — Beyond Borders

## Spec-driven development documentation

This folder is the continuity and specification guide for VeriLyft — Beyond Borders, a logistics-first shipment-management platform built on the existing Next.js, TypeScript, Firebase/Firestore, Firebase Authentication, Firebase Admin, Paystack, and Cloudinary application. Storefront commerce is an attached, secondary service; it is not the primary platform workflow.

### Documents

- `PLATFORM_PUDO_LOCATION_REGISTRY_AND_CAPABILITY_FOUNDATION.md` — proposed PUDO location registry, independent service/action capabilities, configuration authority, customer endpoint discovery, and DEC-047 eligibility boundaries; no physical schema or implementation is approved.
- `PLATFORM_PUDO_LOCATION_REGISTRATION_AND_VERIFICATION_WORKFLOW.md` — owner-approved DEC-050 responsibility split for proposed-location registration, Operations physical verification/approval, and separately authorised activation.
- `PLATFORM_PUDO_LOCATION_VERIFICATION_CHECKLIST_AND_EVIDENCE.md` — proposed five-area Operations verification checklist and evidence categories; requires validation by the accountable Operations owner and is not yet a mandatory evidence policy.
- `CURRENT_IMPLEMENTATION_STATUS.md` — current source-aligned implementation, verification, outstanding gates and next execution sequence as of 5 November 2026.

- `PLATFORM_CONSOLIDATED_IMPLEMENTATION_BACKLOG.md` — single ordered implementation plan

- `PLATFORM_CONSOLIDATED_IMPLEMENTATION_BACKLOG.md` — single ordered implementation plan derived from accepted policy and existing source findings; identifies buildable work, unresolved capability gates, deferred scope and acceptance evidence without inventing business rules or technical schema.

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
- `PLATFORM_OWNER_DECISION_REGISTER.md` — dependency-ordered record of D-01–D-15 outcomes, DEC-037–DEC-048 policy refinements, PM-01–PM-12 and BP-01–BP-22 accepted policies, and remaining detailed design questions; the complete SDD is not yet approved.
- `PLATFORM_CONSOLIDATED_OWNER_DECISION_PACKAGE.md` — historical grouped owner-decision proposal; its commercial groups were accepted or deferred in DEC-048, while remaining DB-01–DB-12 recommendations remain proposals unless separately accepted.
- `PLATFORM_REVIEW_3_OWNER_INPUT_TRIAGE.md` — classifies DB-01–DB-12 and other Review 3 gaps, separates accepted policy from genuine owner choices and technical work, and consolidates owner-input packages to respect the five-exchange limit.
- `PLATFORM_REVIEW_3_ACTION_CAPABILITY_CROSSWALK.md` — maps staff action authority, scope, location/service capability, independent approval and evidence requirements without inventing a permission catalogue or implementation model.
- `PLATFORM_REVIEW_3_LIFECYCLE_TRANSITION_AND_RECOVERY_CROSSWALK.md` — maps lifecycle transitions, physical-event distinctions, unknown outcomes and recovery boundaries without defining persisted status enums.
- `PLATFORM_REVIEW_3_RESOURCE_ENTITLEMENT_AND_PROJECTION_LINEAGE_CROSSWALK.md` — maps principal/resource/field-class entitlements, query/mutation checks, projection lineage and freshness obligations without approving concrete fields or APIs.
- `ADMIN_REQUIREMENTS.md` — consolidated Admin Portal requirements, startup priorities, scope boundaries, and requirements-baseline approval checklist.
- `ADMIN_REQUIREMENTS_AUDIT.md` — source-level validation matrix for requirements versus existing code, including evidence, gaps, and outstanding verification.
- `ADMIN_PORTAL.md` — Admin Portal page-by-page design, confirmed decisions, scope boundaries, and unresolved design items.
- `PROGRESS.md` — current project status, active phase, next actions, and completion checklist. Update it whenever work is completed or the active task changes.
- `ISSUES.md` — known gaps, risks, verification tasks, and decisions that must not be silently assumed.
- `DECISIONS.md` — architecture and product decisions, including constraints that future sessions must preserve.
- `SESSION_HANDOFF.md` — copy/paste instructions for starting a new ChatGPT session with these documents.

### Historical execution direction — PR #133 and PR #134 merged (3 November 2026; superseded by the PR #137 direction above)

PR #133 merged the staff-facing operational-cost definition interface at `/admin/operational-cost-definitions`, reusing the existing APIs, Firestore persistence, workflow and action permissions. User-reported local checks passed: 86/86 Firestore Emulator tests, TypeScript, lint, production build and `git diff --check`. Browser verification with accounts holding the relevant action permissions remains outstanding. A generic Admin without those permissions is correctly denied; Admin status alone grants no operational-cost action permission.

PR #134 records the initial Designated Staff Permission Administrator appointment under PM-01. It does not grant operational-cost, Finance, custody, shipment, pricing, audit-review or other action permissions. Firebase technical permission provisioning is not activated; its trusted mechanism, audit evidence and successor/suspension/recovery lifecycle remain open.

DEC-050's registration/verification/activation responsibility split remains accepted. The accountable Operations position is still unassigned and the authoritative initial PUDO inventory source is unidentified; no verified PUDO inventory exists. All twelve DEC-047 service/endpoint combinations remain unavailable pending independent operational evidence and approvals. DEC-045 permits bounded implementation under accepted policy; DEC-036 P0/Conditional P0 release evidence remains a separate launch gate.

After this focused reconciliation is merged, review DB-01–DB-12 contracts and capability gates to select the next buildable implementation slice. Do not reopen accepted decisions without new evidence or a concrete conflict.

### Current execution direction — PR #137 merged (5 November 2026)

Current main is 55dff8c2a4f4cf6f0e983676e692f0f126f7ec27 (PR #137). PR #136 implemented staff invitations and permission management; PR #137 moved staff activation into the signed-in staff workspace. The owner reports 100/100 Firestore Emulator-backed tests across 14 suites and passing TypeScript, lint, production build and git diff --check. Browser verification and technical provisioning of the designated permission administrator remain outstanding.

The current consolidated status and execution order are in CURRENT_IMPLEMENTATION_STATUS.md. The previous PR #133/#134 checkpoint and later historical continuation notes must not be used as the current work pointer. Immediate next work is controlled browser verification, followed by DB-01–DB-12/capability-gate review and selection of one bounded Ready implementation slice.

Customer pricing/quotation, all twelve DEC-047 combinations, verified PUDO inventory, confirmed shipment booking/payment, intake/custody, route/dispatch/delivery and DEC-036 P0/Conditional P0 release evidence remain independently gated.

### SDD-first working protocol

1. Complete and reconcile the relevant SDD slice before its application-code changes; DEC-045 permits bounded implementation under accepted policy while unresolved capabilities remain gated.
2. Use approved SDD documents as the source of intended product behaviour; use source inspection to establish current implementation facts and test/deployment evidence to establish verified behaviour.
3. Record conflicts between intended behaviour, source, and evidence. Do not silently treat implementation as product approval or documentation as proof of implementation.
4. Use `SDD_COMPLETENESS_AUDIT.md` as the platform-wide documentation-gap checklist, the workflow/domain documents as drafts for owner review, and `IMPLEMENTATION_SOURCE_TRACEABILITY.md` for observed source facts and gaps. Use the DB-01–DB-12 technical-contract and acceptance specification as the current review package for the next booking-related implementation slice.
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

### Historical Milestone 4 status — baseline through PR #129 (superseded by the 5 November 2026 direction above)

The current main baseline is PR #129 merge commit a2247efd2d0a7103c85d156f89ea210a696b33e2. The latest application-source baseline remains PR #125 at e7966332024fd38eb7cb5b8a1adebc0b584ac894; the PR #125-to-#129 compare confirms only SDD documentation paths changed. Current source findings and their limits are recorded in IMPLEMENTATION_SOURCE_TRACEABILITY.md Sections 20–21. This does not constitute runtime, deployed-configuration or production verification.

Milestones 1–3 are complete at the owner-approved policy/documentation level: DEC-038 through DEC-044 are recorded in the SDD, with the relevant documentation PRs merged through PR #51. PR #52 reconciled the Milestone 3 completion record. The 15 high-level owner decisions D-01–D-15, staff permission policies PM-01–PM-12, and booking-party authority policies BP-01–BP-22 remain accepted at their recorded policy levels.

Milestone 4 is the active workstream: platform-wide SDD reconciliation and implementation-readiness assessment. Step 1's continuity baseline was established in PR #53 and refreshed through PR #65. Step 2A inventoried all 23 Markdown SDD documents; PRs #55–#58 corrected Admin history, actor/permission and requirement crosswalks, and P0 catalogue/readiness references. PR #60 completed the first full-document status/reference scan. PR #61 corrected the A-10/DEC-043 approval wording, PR #62 aligned DEC-038–DEC-041 status references, PR #63 clarified the Finance responsibility/deployment boundary, and PR #64 reconciled DEC-044 custody acceptance evidence; PR #66 aligns A-15 with accepted PM-01–PM-12 permission policy. The A-16 audit/evidence reconciliation is recorded in the progress tracker and decision-to-document reconciliation report. PR #80 adds a Review 3 owner-input triage that classifies DB-01–DB-12 and separates accepted policy from owner choices and technical work. PR #81 adds the staff action/location-capability crosswalk; PR #82 adds the lifecycle transition/recovery crosswalk; PR #83 adds the resource-entitlement/projection-lineage crosswalk. PR #110's commercial proposal was accepted/deferred under DEC-048 and recorded in PR #111. The current active work is the consolidated DB-01–DB-12 technical-contract and acceptance proposal on the branch `docs/db01-db12-technical-contract-acceptance`. PR #64's DEC-044 follow-up refines A-09 and existing P0 evidence cases for actual receipt, custody history, failed/disputed handovers, corrections and controlled investigation. Service-specific proof, authority, investigation, hold, retention and technical contracts remain open. See `PLATFORM_DECISION_DOCUMENT_RECONCILIATION.md`; full reconciliation remains open.

**Implementation gate:** DEC-045 authorizes bounded implementation under accepted policy before Reviews 3–5 are formally closed. Unresolved policy inputs remain capability gates. Policy approval, documentation presence, source presence, passing builds, and readiness catalogues are not interchangeable with executable test approval or production evidence. Preserve the distinction between intended behaviour, current source facts, runtime verification, and production readiness.

See `PROGRESS.md` for the active work pointer, `SESSION_HANDOFF.md` for the current session instructions, `ISSUES.md` for unresolved work, and `SDD_COMPLETENESS_AUDIT.md` for the platform-wide reconciliation plan.


The latest A-15 reconciliation distinguishes accepted action-level staff permissions (PM-02) and the accepted PM-01–PM-12 policy from the still-open technical permission catalogue, enforcement, scope and threshold details. See `PLATFORM_DECISION_DOCUMENT_RECONCILIATION.md` and `SDD_COMPLETENESS_AUDIT.md`. This is not runtime security verification; VLY-009/VLY-010 remain open.


The A-16 reconciliation aligns DEC-033 accountable recordkeeping and PM-08's separate audit-view, export and external-disclosure permissions with A16-01–A16-04, Workflow J, lifecycle boundaries and ADM-R07/R46–R51. The four existing A-16 case IDs and 80-case catalogue are retained. VLY-023 remains open; no audit architecture or implementation is approved, and DEC-045 continues to permit bounded implementation under accepted policy; unresolved audit/evidence requirements remain separate capability and release gates.

The current technical-contract reconciliation is tracked in `PLATFORM_TECHNICAL_CONTRACT_RECONCILIATION.md`. It maps source-backed capabilities and gaps to proposed contract boundaries, mutation/authorization/replay/recovery expectations, acceptance evidence, and unresolved design inputs. It is a design/reconciliation artifact, not implementation authorization.


The domain and identity decision crosswalk is tracked in `PLATFORM_DOMAIN_BOUNDARY_AND_IDENTITY_DECISION_MATRIX.md`. It separates business record responsibilities, party entitlements, unresolved relationship/cardinality decisions, consistency boundaries and source-reuse constraints. It is a design support artifact, not an approved data model or implementation authorization.

- `PLATFORM_MUTATION_AUTHORIZATION_AND_RECOVERY_MATRIX.md` — action-level mutation guards, authorization sequence, concurrency/idempotency, external unknown-outcome handling, recovery ownership, and acceptance evidence obligations.

- `PLATFORM_LIFECYCLE_EVENT_AND_STATE_CONTRACT_MATRIX.md` — separates commands, decisions, observed/provider events, domain facts, current state, projections, evidence, corrections and reconciliation across lifecycle domains.


- `PLATFORM_PRODUCTION_READINESS_AND_OPERATIONAL_EVIDENCE_CONTRACT.md` — production control objectives, ownership/evidence expectations, environment/configuration, deployment/rollback, observability, backup/restore, incident response, continuity and evidence-gated release; no topology or numeric operational targets are pre-approved.


- `PLATFORM_API_PERSISTENCE_AND_INTEGRATION_BOUNDARY_CONTRACT.md` — conceptual API/query/provider/evidence responsibilities, authoritative fact ownership, persistence invariants, candidate transaction boundaries, integration contracts and source-reuse guardrails; no schema or API is pre-approved.
- `PLATFORM_DB01_DB12_TECHNICAL_CONTRACT_AND_ACCEPTANCE_SPECIFICATION.md` — consolidated DB-01–DB-12 relationship, ownership, cardinality, API/security/transaction/recovery contracts and case-level acceptance specifications after DEC-048/DEC-049; the bounded DB-01/02/05 physical persistence/API/security design is separately owner-approved in PR #117, without enabling quote issuance, booking acceptance, parcel intake or custody.


- `PLATFORM_TECHNICAL_DESIGN_COHERENCE_AND_DEPENDENCY_MATRIX.md` — Review 3 synthesis index mapping A-01–A-20 across authoritative facts, lifecycle, API/persistence/authorization, external effects, acceptance evidence and unresolved dependencies; no implementation architecture is approved.
- `PLATFORM_REVIEW_3_COMPLETENESS_AUDIT.md` — criterion-by-criterion assessment of the Review 3 checklist, supporting contract evidence, remaining gaps and the conditions for presenting the consolidated review; not an owner approval or implementation authorization.


The Review 3 technical-design synthesis remains a supporting cross-domain reference. The current focused review package for DB-01–DB-12 is `PLATFORM_DB01_DB12_TECHNICAL_CONTRACT_AND_ACCEPTANCE_SPECIFICATION.md`. It expands the 80 P0 scenario outlines with case-level booking-foundation and cross-domain acceptance specifications; cases with unresolved policy/technical inputs remain blocked. DEC-045 permits bounded implementation after the relevant SDD slice is reviewed and approved; it does not waive DEC-036 P0/Conditional P0 release evidence.


**Review 3 preparation:** PR #77's technical-design coherence matrix is merged, and `PLATFORM_REVIEW_3_COMPLETENESS_AUDIT.md` records the earlier 15-criterion assessment. DB-01–DB-12 now have a consolidated technical-contract and case-level acceptance proposal for owner review. Remaining service-specific commercial, operational, authority and evidence inputs remain explicit gates. DEC-045 supersedes the earlier blanket implementation freeze; only bounded work within reviewed/approved policy may proceed.


The commercial owner-decision proposal was accepted/deferred in DEC-048 and recorded through PR #111. The consolidated M2 pre-implementation review package is now accepted and merged in PR #139. The active work is one consolidated specialist SDD reconciliation, followed by a single implementation-readiness review and staged implementation plan. Application-code changes begin only after the owner explicitly approves that plan. Do not infer schema, APIs, permissions, providers, rates, durations or operational eligibility from the requirements; keep unresolved capabilities disabled under DEC-045/DEC-047.
