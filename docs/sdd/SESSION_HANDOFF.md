Continue **VeriLyft — Beyond Borders** in repository `dev-adeshina/small-pudo`.

## Current owner direction — 31 October 2026

- DEC-045 records the owner's explicit instruction to stop extending the planning cycle and begin implementation using accepted policy. The previous blanket freeze pending Reviews 3–5 is superseded for starting bounded implementation work.
- Use `PLATFORM_CONSOLIDATED_IMPLEMENTATION_BACKLOG.md` as the single execution pointer. Start with M0 baseline/regression safety, then M1 independent shipment booking preparation.
- Do not treat DB-01–DB-12 recommendations as approved policy. Unresolved values and authorities are capability gates; keep affected functionality disabled or excluded rather than inventing defaults.
- DEC-018/DEC-036 launch scope, P0 acceptance evidence and production release requirements remain in force. Implementation start is not launch approval.
- Preserve the existing Next.js App Router, TypeScript, Firebase/Firestore/Auth/Admin, Paystack and Cloudinary architecture. Inspect current source before modifying it; the historical source-inspection baseline is not runtime proof.


## Current verified repository state

- Current `main` baseline: PR #83 is merged; merge commit `986f4ad79232ce1700f4edaa972a17522ed319c8`. The current documentation working branch is `docs/sdd/consolidated-owner-decision-package`; it is not merged.
- PRs #54–#83 are merged documentation-only reconciliation/design changes; PR #58 carries DEC-037–DEC-044 into the P0 catalogue/readiness documents, PR #60 completes the first cross-document status/reference pass, PR #61 aligns the A-10 acceptance row with DEC-043, PR #62 aligns DEC-038–DEC-041 status references, PR #63 clarifies the Finance responsibility/deployment boundary, and PR #64 reconciles DEC-044 custody acceptance evidence; PR #66 aligns A-15 with accepted PM-01–PM-12 permission policy; PR #67 aligns A-16 with DEC-033/PM-08; PR #68 records the approved closure direction; PR #69 reconciles A-17 Support and controlled exception handling.
- The active application-source inspection baseline remains `e0f69055d33dd9399c23e1d793f359468229c856` (refreshed in PR #32). The repository-history comparison through PR #83 reflects documentation-only changes after the source-inspection baseline; The current tree-path inventory found no dedicated shipment/custody/route/location API/library path. This is not a fresh semantic source review and does not verify runtime behaviour or production readiness.
- Admin PR #3 is merged. PR #4 is closed without merge; do not describe it as open or merged.
- DEC-045 authorizes bounded implementation under accepted policy; the old blanket freeze pending Reviews 3–5 is superseded. P0 acceptance and production release gates remain.

## Product hierarchy and accepted policy

VeriLyft is a logistics-first shipment-management platform. Independent shipment booking is the primary customer entry point; storefront commerce is an attached, secondary service. A storefront order requiring delivery enters the same operational fulfilment system as an independently booked shipment. Storefront orders, independent shipments, and transport movements remain distinct business concepts; do not assume a technical schema from that distinction.

The following owner-policy outcomes are accepted at the levels recorded in the authoritative SDD documents:

- DEC-018: accepted lean launch scope and exclusions.
- DEC-022–DEC-036: D-01–D-15 high-level owner decisions.
- DEC-037: logistics-first product hierarchy and shared fulfilment boundary.
- DEC-038: independent shipment booking confirmation, service information, handover deadline, cancellation, and responsibility boundaries.
- DEC-039: service-specific pricing model/input/calculation boundaries.
- DEC-040: measurement-adjustment and customer-resolution boundaries.
- DEC-041: payment, settlement, refund/credit, reconciliation, and dispatch boundaries.
- DEC-042: physical intake, custody, measurement, and location-operation boundaries.
- DEC-043: location capability, service/action eligibility, and actor-authority boundaries.
- DEC-044: custody transfer integrity and physical exception resolution.
- PM-01–PM-12: accepted staff permission policies; detailed technical permission design remains open.
- BP-01–BP-22: accepted booking-party authority policies; operational and technical contracts remain open.

Milestones 1–3 are complete at the owner-approved policy/documentation level. Their completion does not mean all operational procedures, technical contracts, executable tests, or runtime evidence are complete.

## Current work — Milestone 4

**Milestone:** Platform-wide SDD Reconciliation and Implementation Readiness.

Milestone 4 Step 1 continuity baseline was established in PR #53 and refreshed through PR #74. Step 2A inventoried all 23 Markdown SDD documents. PRs #55–#58 corrected Admin baseline/history, actor and staff-permission references, requirement dependency/priority crosswalks, and P0 catalogue/readiness crosswalks; PR #60 completed the first status/reference scan. Step 2D targeted section-level review continues; PR #69 completes the A-17 Support/exception policy-to-acceptance reconciliation. PR #61 corrected stale owner-approval wording in the original A-10 row against accepted DEC-043. PR #62 aligned DEC-038–DEC-041 status wording. PR #63 clarified the Finance responsibility/deployment boundary. PR #64 aligns DEC-044 custody acceptance criteria and evidence cases while preserving service-specific proof, authority, investigation, hold, retention and technical details as open. Detailed reconciliation remains active; do not treat the inventory or crosswalks as full SDD approval.

### Milestone 4 sequence

1. Establish and maintain one authoritative documentation/repository baseline — complete through PR #53; refreshed through PR #67.
2. Reconcile accepted decisions across all SDD documents; identify contradictions, stale references, omissions, and unresolved dependencies without silently reopening accepted policy — Step 2A inventory complete; corrective updates in PRs #55–#58 merged; full review remains open.
3. Trace requirements and policy to the existing application source read-only; distinguish present, partial, absent, not inspected, and not verified.
4. Complete workflow, actor/permission, lifecycle, data/API/security, integration, and exception contracts.
5. Turn approved requirements into detailed, executable acceptance-test specifications and evidence requirements. The existing P0 readiness assessment/catalogue is a navigation/design baseline, not approval to execute tests. The current 80-case catalogue carries DEC-037–DEC-044 references merged in PR #58; no P0/Conditional P0 test is approved for execution.
6. Assess production readiness: environment/configuration, security, deployment, monitoring, backup/restore, incident response, rollback, recovery, and release evidence.
7. Present the complete reconciled SDD for explicit owner approval before any application-code changes.

## Important unresolved boundaries

Do not invent or silently settle:
- Service-specific pricing formulas, rates, input sources/mappings, units, conversion, rounding, fees, taxes, thresholds, quote-validity durations, and adjustment limits. DEC-038's accepted-quote expiry rule is settled at policy level; service-specific durations and handover configuration remain open.
- Payment method/service/location eligibility, partial-payment conditions, cash/transaction limits, refund authority/timelines, credit rules, reconciliation cadence/ownership/tolerances, chargeback handling, and DEC-030 dispatch-exception categories/limits/evidence. DEC-041's high-level payment and default dispatch boundaries are accepted. Full-finance responsibility is distinct from Admin operational visibility; whether it is delivered through a protected module, separate portal, or combination remains unresolved.
- Intake checklists, measurement procedures, handover proof, confirmation/dispute/correction authority, second-approver rules, custody hold limits, missing/damaged parcel investigation ownership, liability, insurance, compensation, or customer entitlements.
- Location/service/action capability catalogue, Admin assignment granularity, staff permission scopes, partner arrangements, queued-work handling, or temporary closure procedures.
- Exact status vocabulary, data representation, collections, fields, APIs, security rules, idempotency/recovery contracts, retention periods, or executable acceptance cases.
- Notification event/recipient/channel details, privacy rules, retries, failure ownership, or evidence retention.
- Production operational thresholds, monitoring, backup/restore proof, incident ownership, rollback, and release exception authority.

Use `ISSUES.md`, `DECISIONS.md`, `PLATFORM_OWNER_DECISION_REGISTER.md`, `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, and `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md` as the relevant navigation sources. Preserve unresolved details as open work.

## Working protocol

- Read `README.md`, `PROGRESS.md`, `ISSUES.md`, `DECISIONS.md`, and this handoff before proposing changes.
- Read the relevant workflow, lifecycle, actor, requirement, acceptance, and source-traceability documents for each domain.
- Inspect the current repository/source read-only when implementation facts are needed. State the exact inspected commit.
- Preserve the existing Next.js App Router, TypeScript, Firebase Authentication/Firestore/Firebase Admin, Paystack, Cloudinary, and existing component/service/type/style patterns.
- Do not invent parallel architecture, collections, fields, routes, services, status enums, roles, or permissions.
- Keep intended behaviour, owner-approved policy, source presence, implemented behaviour, runtime verification, and production-readiness evidence distinct.
- Keep PRs focused and documentation-only while the complete SDD remains unapproved. The owner reviews and merges every PR.
- Never claim a test, build, browser check, deployment check, or production verification was performed unless it actually was.
- Preserve historical roadmap/checkpoint entries as history; use `PROGRESS.md` for the current work pointer.
- Do not reopen completed D-01–D-15, PM-01–PM-12, BP-01–BP-22, or Milestones 1–3 absent genuine contradictory evidence.

**Implementation gate:** No application-code change until the owner explicitly approves the complete reconciled platform-wide SDD.


## Latest baseline verification — PR #64

- PR #64 is merged; merge commit: `d02b2d69156aea45c07b5e2db5511b2486e50471`.
- Comparison from source-inspection baseline `e0f69055d33dd9399c23e1d793f359468229c856` to PR #64 reports SDD documentation paths only (320 commits ahead). The source findings remain tied to the inspected source commit.
- PR #64's DEC-044 acceptance refinement retains 80 unique P0 evidence cases and leaves service-specific proof, authority, investigation, hold, retention, and technical contracts open.
- Next: continue targeted reconciliation of remaining A-01–A-20 and the shared workflow/lifecycle/actor/permission/Admin/source-evidence documents. Do not start application-code changes.


## Latest A-15 reconciliation — PM-01–PM-12

A-15/A15-04 and ADM-R03 are aligned with the accepted action-level permission model. PM-01–PM-12 are accepted at policy level; the exact permission catalogue, technical enforcement, scope representation, materiality thresholds, emergency-access parameters, and runtime evidence remain open. VLY-009/VLY-010 remain unresolved verification issues.

## Latest A-16 reconciliation — DEC-033 and PM-08

A-16, A16-01–A16-04, Workflow J, lifecycle boundaries and ADM-R07/R46–R51 are reconciled with accepted DEC-033 accountable recordkeeping and PM-08's separate audit-view, export and external-disclosure permissions. The four existing A-16 cases remain; the P0 catalogue retains 80 unique case IDs. Event/evidence catalogue, reviewer-to-permission mapping, integrity controls, retention schedule, legal-hold authority, correction/redaction procedures, second-approval cases and executable specifications remain open. VLY-023 remains open; `pudo.zip` remains uninspected. No source/runtime verification or implementation is claimed. Do not make application-code changes before explicit owner approval of the complete reconciled SDD.



## Latest verified baseline and approved closure direction — PR #67 / Reviews 1–2 — 31 October 2026

- Current `main` baseline: PR #67 merged at `04c093927c8d47f9e1fe8351c9f8ecb48920b753`.
- The repository comparison from application-source inspection baseline `e0f69055d33dd9399c23e1d793f359468229c856` to PR #67 reports 360 commits ahead and SDD documentation paths only. This is repository-history evidence, not a fresh semantic source review or runtime/production verification. Keep the source-inspection baseline unchanged.
- Owner approved Reviews 1 and 2 of the five-review closure process. Review 1 approved the gap assessment and closure sequence. Review 2 approved the consolidated policy direction and the deliberate deferral of exact service-specific or numerical values until their operating context is established.
- Preserve all accepted DEC-022–DEC-044, PM-01–PM-12 and BP-01–BP-22 policy outcomes. Do not reopen them absent genuine contradictory evidence.
- Approved closure direction: use service-specific configurable commercial rules; controlled adjustment and settlement procedures; explicit booking-party authority; bounded Support; evidence-backed physical custody and delivery; independent location capability and staff authorization; action-level staff permissions and controlled second approvals; preserved audit/evidence history; and evidence-gated production release.
- Exact rates/formulas, units/thresholds, quote and handover durations, payment/refund/credit tolerances, service-specific proof methods, permission thresholds, retention periods, and recovery/monitoring targets remain open until the relevant service, legal, financial, or operating context is established. Record owners, configuration boundaries, dependencies, and required evidence rather than inventing values.
- The consolidated owner decision package is being prepared on `docs/sdd/consolidated-owner-decision-package`. Its recommendations are proposals, not approved policy; the instruction to prepare it does not approve its contents. Complete the cross-domain reconciliation and assemble source-aware contracts, including data boundaries, APIs, authorization, idempotency, integration, failure/recovery, and evidence contracts before presenting Review 3. Do not invent parallel architecture or alter application code.
- The five review occasions are approval gates, not a limit of five work sessions. Continue autonomous documentation reconciliation between them. The owner reviews and merges every PR.
- The 80 P0 evidence case IDs remain specification/evidence outlines; they are not 80 executed or passed tests. No tests were executed by the baseline refresh. `pudo.zip` remains uninspected and outside source claims unless explicitly brought into scope.

**Implementation gate:** Application-code freeze remains active until Review 5 and explicit owner approval of the complete reconciled platform-wide SDD.


## Latest verified baseline and A-17 reconciliation — PR #69 — 31 October 2026

- PR #69 is merged at `c20493c04c2323e70cc6570426afbecced649846`; current `main` was compared with that merge commit and found identical.
- PR #69 changes only three `docs/sdd/` files. It clarifies Support's bounded role, adds workflow-level controlled exception guidance, expands A-17 with A17-05–A17-07, and refreshes the P0 catalogue baseline. No application code or tests were changed/run.
- Reviews 1 and 2 of 5 are approved. Continue autonomous reconciliation; do not request Review 3 until a coherent source-aware technical architecture/contract package is ready.
- The next focus is cross-domain lifecycle and technical contract completeness: transition ownership/guards, existing data/service boundaries, API authorization, idempotency/concurrency, provider integration, failure/recovery, audit/evidence, and test evidence. Distinguish confirmed source facts from proposed contracts and unresolved owner choices.
- `pudo.zip` remains uninspected and outside source claims pending a scope/authority decision. Do not infer runtime or production behaviour from repository-history comparison.
- No application-code changes until explicit Review 5 approval of the complete reconciled SDD.


## Latest continuation checkpoint — after PR #70

- Current `main` is verified identical to PR #70 merge commit `ad6189a598d3fcbb79c90679a7dac33914ea0474`.
- A direct comparison from `e0f69055d33dd9399c23e1d793f359468229c856` to current `main` reports 379 commits ahead with changes limited to SDD documentation paths. This is repository-history evidence only; it does not refresh semantic source inspection or prove runtime/production behaviour.
- Continue technical contract reconciliation across domain boundaries, mutation guards, authorization, idempotency/concurrency, provider recovery, audit/evidence, acceptance and production readiness. The dedicated addendum remains conceptual and source-aware; it does not settle Firestore schema, routes, enums, thresholds or deployment design.
- Reviews 1 and 2 of 5 are approved. Do not present Review 3 until its consolidated package is complete. No application-code changes before Review 5 approval.


## Latest continuation checkpoint — after PR #71

- PR #71 merged at `37a6ca57f1619d124ebb9718aa6067ed8d40f978`; PR #72 and PR #73 subsequently extended the documentation baseline.
- `PLATFORM_DOMAIN_BOUNDARY_AND_IDENTITY_DECISION_MATRIX.md` now separates domain responsibility, identity/party entitlements, record ownership, unresolved booking/parcel/route/payment relationships (DB-01–DB-12), transaction consistency candidates and source-reuse boundaries.
- The matrix does not settle owner decisions or schema. Resolve launch-essential relationships through the existing owner decision process before finalizing data/API contracts. Do not invent defaults.
- Reviews 1 and 2 of 5 remain approved. Review 3 is still being assembled; Reviews 4 and 5 remain future gates. No application code before Review 5 approval.


## Latest domain-boundary workstream — after PR #72

- `PLATFORM_DOMAIN_BOUNDARY_AND_IDENTITY_DECISION_MATRIX.md` maps record responsibilities, identity/party entitlements, DB-01–DB-12 unresolved relationship/cardinality questions, record ownership, consistency boundaries and source reuse.
- The matrix is not an approved data model. Owner decisions remain required before launch-essential relationships can be finalized. Do not infer one booking equals one parcel, one payment equals one booking, or one parcel equals one route leg.
- Reviews 1 and 2 of 5 remain approved. Review 3 remains in preparation; no application-code changes before explicit Review 5 approval.


## Latest mutation, authorization, and recovery workstream — PR #73 preparation

- `PLATFORM_MUTATION_AUTHORIZATION_AND_RECOVERY_MATRIX.md` provides a common mutation guard sequence and an action-specific contract matrix across commercial, physical, financial, operational, Support, audit and notification domains.
- It specifies reliability obligations for duplicate/concurrent/stale/replayed/delayed/out-of-order requests and unknown provider outcomes, plus recovery ownership and evidence requirements. It does not prescribe schema, endpoints, enums, key formats, retry values or provider-specific mechanisms.
- PR #72 is the verified current documentation baseline at `d17828292f2a0e0424de9461affe4aebc2c94e0b`; the source-inspection baseline remains `e0f69055d33dd9399c23e1d793f359468229c856`.
- Reviews 1 and 2 of 5 remain approved. Review 3 is not yet presented; Reviews 4 and 5 remain future gates. No application-code changes before explicit Review 5 approval.


## Latest lifecycle event/state workstream — PR #74 preparation

- PR #73 merged at `7c07ab701993f027efa9ea17523402bb24b66ae1`; current `main` was compared with that merge commit and found identical.
- `PLATFORM_LIFECYCLE_EVENT_AND_STATE_CONTRACT_MATRIX.md` separates command, decision, observation/provider event, domain fact, current state, projection, evidence, correction and reconciliation responsibilities.
- The matrix preserves DEC-042–DEC-044 physical receipt/custody requirements and prevents assignment, dispatch authorization, arrival, notification or status update from being mistaken for physical proof.
- It does not mandate event sourcing, a generalized event bus, new schema, event names, enums or implementation architecture. It adds requirements for late/out-of-order events, corrections, projections and acceptance scenarios.
- Reviews 1 and 2 of 5 remain approved. Review 3 is still being assembled; Reviews 4 and 5 remain future gates. No application-code changes before explicit Review 5 approval.


## Latest operational-readiness workstream — PR #75 preparation

- Verified PR #74 is merged at `804f51d56def5a6dc6ba9518464886333b9be43a`; current `main` is identical to that merge commit.
- Added `PLATFORM_PRODUCTION_READINESS_AND_OPERATIONAL_EVIDENCE_CONTRACT.md` as a Review 3 support artifact. It defines control objectives, responsibility areas, minimum evidence and failure dispositions for environment/configuration, secrets, privilege, deployment/rollback, observability, backup/restore, incident response, continuity, provider unknown outcomes and release approval.
- The matrix maps directly to A20-01–A20-05 and related A-07/A-08/A-14/A-16/A-18 operational evidence. It adds no acceptance case IDs and claims no tests or production controls have passed.
- No topology, tool, RTO/RPO, backup cadence, retention period, alert threshold, response target or named owner is selected. Those remain explicit decisions for the responsible owners.
- This is documentation-only. The application-source inspection baseline remains `e0f69055d33dd9399c23e1d793f359468229c856`; no new source, runtime, deployment or production verification is claimed.
- Reviews 1 and 2 remain approved; Review 3 remains in preparation; Reviews 4 and 5 remain future gates. Implementation remains frozen until explicit Review 5 approval.


## Completed API, persistence and integration boundary workstream — PR #76 merged

- PR #76 merged at `da4fa5407d899ed5999ce29e61a43be1ef8a89bb`; GitHub comparison confirmed `main` and the merge commit are identical.
- `PLATFORM_API_PERSISTENCE_AND_INTEGRATION_BOUNDARY_CONTRACT.md` defines conceptual command/query/provider/evidence boundaries, authoritative fact ownership, persistence invariants, candidate transaction/consistency boundaries, API contract requirements, query/projection constraints and provider integration obligations.
- Source reuse remains bounded to the recorded inspection baseline: storefront order/stock, guest access, customer account access, Paystack, Admin authorization, catalogue rules, Cloudinary upload and storefront fulfilment. Missing logistics, general financial, audit/evidence and operational capabilities remain gaps, not existing services.
- No route paths, payloads, Firestore collections/fields, schema, enums, cardinalities, new services, event bus, CQRS/event-sourcing/workflow engine, provider selection or deployment design are approved.
- DB-01–DB-12 and related owner/operational inputs remain explicit blockers. No numeric or business defaults are invented.
- Documentation-only; no new source/runtime/deployment/production verification or test execution is claimed. Source-inspection baseline remains `e0f69055d33dd9399c23e1d793f359468229c856`.
- Reviews 1 and 2 remain approved; Review 3 remains in preparation; Reviews 4 and 5 remain future gates. Implementation remains frozen until explicit Review 5 approval.

## Latest technical-design coherence workstream — PR #77 preparation

- PR #76 is the verified current-main baseline: merge commit `da4fa5407d899ed5999ce29e61a43be1ef8a89bb`.
- Added `PLATFORM_TECHNICAL_DESIGN_COHERENCE_AND_DEPENDENCY_MATRIX.md` as a Review 3 synthesis index. It traces A-01–A-20 across authoritative facts/lifecycles, API/persistence/authorization boundaries, external effects/recovery, acceptance/evidence and unresolved owner decisions.
- It includes cross-domain dependency sequencing, source reuse vs capability gaps, DB-01–DB-12 and other open blockers, and a Review 3 completeness checklist.
- It does not resolve business rules/cardinality, approve schema/API/service/provider/operational targets, or authorize implementation.
- Documentation-only; no fresh source/runtime/deployment/production verification or tests are claimed. Source inspection remains at `e0f69055d33dd9399c23e1d793f359468229c856`.
- Reviews 1 and 2 remain approved; Review 3 remains in preparation; Reviews 4 and 5 remain future gates. Implementation remains frozen until explicit Review 5 approval.


## Latest verified baseline and technical-design synthesis — PR #77 — 31 October 2026

- PR #77 is merged at `61c6d5de8a4d28be916856db9e6c715fc24cad36`; GitHub comparison confirmed `main` and the merge commit are identical.
- `PLATFORM_TECHNICAL_DESIGN_COHERENCE_AND_DEPENDENCY_MATRIX.md` is the Review 3 synthesis index across A-01–A-20, tying authoritative facts/lifecycles, API/persistence/authorization, external effects/recovery, acceptance evidence, source reuse/gaps and unresolved owner inputs together.
- Companion design contracts now cover domain boundaries/identity, mutation authorization/recovery, lifecycle events/states, production readiness/operational evidence, and API/persistence/integration boundaries. These remain conceptual SDD artifacts, not approved schemas, routes, services, provider choices or implementation architecture.
- Next: perform the consolidated Review 3 completeness and cross-document consistency audit. Do not present Review 3 until all checklist obligations and companion contracts agree and every unresolved owner input is clearly separated from proposed technical design.
- The application-source inspection baseline remains `e0f69055d33dd9399c23e1d793f359468229c856`. PR #77 is documentation-only; no new source/runtime/deployment/production verification or tests are claimed.
- Reviews 1 and 2 of 5 remain approved; Review 3 remains in preparation; Reviews 4 and 5 remain future gates. The 80 P0/Conditional P0 case rows are not approved for execution. Application-code and production changes remain frozen until explicit Review 5 approval.


## Current Review 3 completeness-audit checkpoint — after PR #78

- Current verified `main`: PR #78 merge commit `8b0c9d5e04669f3051f992b6524c1928b40518db`; GitHub comparison confirms it is identical to `main`.
- Read `PLATFORM_REVIEW_3_COMPLETENESS_AUDIT.md` together with the technical coherence matrix and its companion contracts. The audit rates each of the 15 Review 3 criteria and identifies the precise unresolved inputs; it is not owner approval.
- Review 3 is not yet ready to present. In particular, DB-01–DB-12, detailed action/scope/location capability definitions, service-specific operational evidence and correction authority, provider-specific recovery, and production ownership/targets remain open.
- The next work is to close only those gaps that can be resolved from already accepted policy and existing documents, and to isolate genuinely owner-dependent decisions for the consolidated review. Do not invent defaults or implement.
- Reviews 1–2 remain approved; Reviews 4–5 remain future gates. No application-code, schema, API, Firebase rules/configuration, provider activation or deployment before explicit Review 5 approval.


## Current Review 3 owner-input triage — proposed follow-up

- The current documentation proposal adds `PLATFORM_REVIEW_3_OWNER_INPUT_TRIAGE.md`. It classifies DB-01–DB-12 individually, identifies which accepted DEC/BP/PM policies already settle part of each question, and separates genuine owner choices from technical/source-verification work and future implementation evidence.
- Use this triage to prepare consolidated owner-input packages. Do not reopen accepted policy wholesale, send twelve separate DB questions, or create extra approval exchanges. The owner has set a strict maximum of five back-and-forth approval exchanges and will provide the countdown.
- The proposed triage does not approve a data model or implementation. Reviews 1–2 remain approved; Review 3 is still in preparation; Reviews 4–5 remain future gates. Keep the implementation freeze until explicit Review 5 approval.


## Proposed Review 3 action/capability crosswalk follow-up

- PR #80 merged at `92f3f421500332ea9588f189046757b734e1330f`; the owner-input triage is part of main.
- The current documentation proposal adds `PLATFORM_REVIEW_3_ACTION_CAPABILITY_CROSSWALK.md`. It maps principal staff actions to the independent action-permission, scope, location/service capability, lifecycle/hold, approval and evidence checks already established by PM-01–PM-12 and DEC-033/DEC-037–DEC-044.
- The crosswalk is descriptive technical-design synthesis only. It does not create permission IDs, role bundles, location capability IDs, schema, APIs, Firebase rules, thresholds or new owner policy. Exact catalogue, scopes, location combinations, thresholds, exceptional approvals and runtime verification remain open.
- The owner has confirmed that one of five approval exchanges has been used; four remain. Do not create additional approval rounds. Continue technical/document reconciliation and consolidate all genuinely owner-dependent decisions into the remaining exchanges. Implementation remains frozen until Review 5.
\n\n## Latest lifecycle transition and recovery work — 31 October 2026\n\n- PR #81 merged at `471ebb1d16c33677e12ddcca1c6d3fdef343d239`.\n- The next documentation-only artifact is `PLATFORM_REVIEW_3_LIFECYCLE_TRANSITION_AND_RECOVERY_CROSSWALK.md`. It maps booking, commercial, payment, intake, custody, measurement, routing, dispatch, movement, arrival, delivery, collection/release, exception, evidence and notification transitions.\n- The transition contract requires authoritative fact owner, subject/granularity, actor/receiver/recorder distinction, independent authority checks, preconditions, allowed/denied/held/unknown outcome, state and non-state effects, evidence, concurrency/replay, recovery owner, communication and audit.\n- Preserve DEC-044: custody changes only on actual physical handover plus receiving possession. Assignment, dispatch, arrival, attempt or a system log cannot imply transfer. Preserve all other DEC/BP/PM boundaries and do not infer one domain's fact from another.\n- Provider-neutral recovery distinguishes not submitted, confirmed success, confirmed failure, unknown and reconciled. No blind repeat of a possibly completed side effect; provider idempotency, lookup, callback and reconciliation capabilities must be verified before provider-specific claims.\n- DB-01–DB-12 remain classified as in `PLATFORM_REVIEW_3_OWNER_INPUT_TRIAGE.md`; do not turn them into serial owner questions. Owner has reported two approval exchanges used and three remaining.\n- Next technical work: field/record entitlement and projection-lineage crosswalk, audit/evidence/reviewer/retention/disclosure detail, case-level P0 specifications and production accountability. Then assemble all genuine owner choices into the remaining consolidated exchange(s).\n- Do not perform application-code, schema, API, Firebase-rule/configuration, provider-activation or deployment work before explicit final approval of the complete reconciled SDD.\n\n\n## Latest resource entitlement and projection-lineage work — 31 October 2026\n\n- PR #82 merged at `f3e3df4f212271a84b3a26d45a233bcfc064f5dc`.\n- New documentation-only artifact: `PLATFORM_REVIEW_3_RESOURCE_ENTITLEMENT_AND_PROJECTION_LINEAGE_CROSSWALK.md`. It maps public/customer/guest/booking-party/sender/receiver/payer/handover/collection/staff/Support/Finance/evidence/provider principals to scoped entitlement boundaries without inventing role IDs or blanket access.\n- Resource/field-class mapping covers catalogue, profile, cart/order, guest capability, quote/booking, parcel/shipment, location, payment/finance, physical events, route/dispatch, delivery/collection, exceptions, audit/evidence, notifications and reporting. Exact field names remain unapproved.\n- Query/mutation contracts require server-side identity, resource resolution, relationship, purpose/action, allowlisted field projection, scope, fresh authority, lineage/freshness and audit where required. Search/list/pagination/filter/aggregate/export/cache/error paths are treated as possible information-leak surfaces.\n- Projection lineage records source domain/records, derivation, source version/time, generation time, freshness expectation, completeness, entitlement transformation, failure/rebuild behaviour and auditability. Conceptual freshness classes are not persisted enums or time thresholds.\n- Preserve DEC-034 payer visibility, DEC-033/PM-08 separate evidence view/export/disclosure, BP-01–BP-22 party distinctions, PM-01–PM-12 action permission, DEC-043 location capability and the lifecycle/recovery contracts.\n- Current owner count: three of five approval exchanges used, two remaining. Consolidate the remaining owner choices; reserve the final exchange for complete SDD approval and explicit implementation authorization.\n- No application-code, schema, API, Firebase-rule/configuration, provider-activation or deployment work is authorized before that final approval.\n

## Latest consolidated owner-decision preparation — after PR #83

- Current `main`: PR #83 merge commit `986f4ad79232ce1700f4edaa972a17522ed319c8`. The current unmerged documentation branch is `docs/sdd/consolidated-owner-decision-package`.
- New working artifact: `PLATFORM_CONSOLIDATED_OWNER_DECISION_PACKAGE.md`. It groups DB-01–DB-12 and remaining authority/operational owner choices into five packages, with recommendations, alternatives, consequences and launch deferrals. The recommendations are explicitly pending owner confirmation; no policy or data-model approval is inferred from the request to prepare the package.
- `PLATFORM_REVIEW_3_COMPLETENESS_AUDIT.md` has been refreshed against PR #83. It recognizes PR #81 action/capability, PR #82 lifecycle/transition/recovery and PR #83 resource-entitlement/projection-lineage crosswalks. The audit still identifies material partial/owner-dependent criteria; Review 3 is not ready for presentation or approval.
- `PROGRESS.md` has been refreshed to distinguish current main from the unmerged working branch and to identify the actual next work.
- Source inspection remains bounded by `e0f69055d33dd9399c23e1d793f359468229c856`. No new source/runtime/production verification or test execution is claimed.
- Continue by reconciling the proposed package against the authoritative decision register and technical contracts; complete domain-specific transition, evidence/reviewer, entitlement/freshness and provider-reconciliation details; expand the P0 outlines into case-level specifications; then perform the complete cross-document audit.
- Reviews 1 and 2 remain approved. Review 3 is not yet presented; Reviews 4 and 5 remain future gates. Preserve the final owner review for the complete reconciled SDD and explicit implementation authorization. Keep the application-code/schema/API/Firebase/provider/deployment freeze in force.
