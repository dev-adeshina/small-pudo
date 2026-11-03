## Current continuation — PR #133/#134 SDD reconciliation

- **Repository:** `dev-adeshina/small-pudo`; PR #133 merge `f38b65be67e365bdc8ba6ba5994c5354228d9c2cc`; PR #134 merge `c05b01340d5f858826223c5b12d13f90973eb973`.
- **Scope:** one final reconciliation of `PROGRESS.md`, `PLATFORM_CONSOLIDATED_IMPLEMENTATION_BACKLOG.md`, `ISSUES.md`, `README.md` and this handoff. Preserve historical records and accepted decisions; no application-code changes.
- **PR #133:** staff UI at `/admin/operational-cost-definitions` uses existing APIs, persistence, workflow and action permissions. User-reported local checks passed: 86/86 Firestore Emulator tests, TypeScript, lint, production build and `git diff --check`. Browser verification with accounts carrying view/propose/validate/finance_review/approve remains outstanding. Generic Admin denial is expected when the action permission is absent.
- **PR #134:** records the initial Designated Staff Permission Administrator appointment under PM-01. It grants no operational-cost or other action permissions. Firebase technical provisioning is not activated; trusted mechanism, audit evidence and recovery/successor lifecycle remain open.
- **Preserve:** DEC-045 bounded authority; DEC-047's twelve unavailable combinations; DEC-036 P0/Conditional P0 release gates; unassigned Operations accountability and unidentified initial PUDO inventory source; DB-01–DB-12 unresolved technical contracts. DEC-050 responsibility split remains accepted.
- **Next:** finish this single reconciliation PR. Once merged, review DB-01–DB-12 contract readiness and capability gates, then select the next buildable implementation slice. Do not restart platform-wide reconciliation or reopen accepted decisions without new evidence or a concrete conflict.
- **Guardrails:** draft preparation is not booking; internal cost definitions are not customer prices; appointment is not technical provisioning or permission grant; route/dispatch intent is not actual physical custody.

## Historical continuation — PR #129 merged; current-main readiness reconciliation — 3 November 2026

- PR #129 is merged at a2247efd2d0a7103c85d156f89ea210a696b33e2. The latest application-source baseline remains PR #125 at e7966332024fd38eb7cb5b8a1adebc0b584ac894; PRs #126–#129 changed SDD documentation only.
- A proposed five-area verification checklist and evidence framework is in `PLATFORM_PUDO_LOCATION_VERIFICATION_CHECKLIST_AND_EVIDENCE.md`: physical existence/site identity; name/address; operating arrangement and authority to participate; readiness for the proposed purpose; attributable evidence and reasoned outcome.
- This checklist is a proposal, not a mandatory procedure yet. It does not require universal contracts, legal documents, photos, GPS coordinates, or a map provider. Evidence must be appropriate to the actual site operating arrangement and validated by Operations.
- There is **no verified PUDO location inventory**. The user has confirmed that the accountable Operations position has not yet been assigned; do not infer an owner from Admin or general staff roles. The authoritative source of the initial candidate inventory is also unidentified. Formal assignment and source identification are prerequisites before treating the checklist as final or starting a governed inventory exercise.
- Firestore remains authoritative. Google Maps Platform remains a candidate for future evaluation only; no provider/API/geocoding/geolocation integration is approved.
- **Next:** the business must formally assign the accountable Operations position and identify the authoritative inventory source; obtain real examples of the site arrangements (including staffed stations and registered collection centres); validate evidence sufficiency and inspection procedure; reconcile authority and lifecycle rules with DEC-043/PM-01–PM-12; then prepare the source-aligned technical contract. No registry code or customer PUDO selector yet; all DEC-047 combinations remain unavailable until independently evidenced and approved.

## Historical continuation — PR #126 merged; DEC-050 PUDO location governance approved — 3 November 2026

- PR #126, `docs: define PUDO location capability foundation`, is merged at `b666d7e8e9bc37ad12c2f12d025cd920263295cf`. It is documentation-only. The bounded application-source inspection baseline remains PR #125 merge `e7966332024fd38eb7cb5b8a1adebc0b584ac894`.
- The owner approved DEC-050's responsibility split: Admin or explicitly designated staff register proposed PUDO locations; Operations physically verifies the location, address, operating arrangement and relevant evidence, then approves operational readiness; a separately authorised staff member activates only after Operations approval. Registration, verification, approval and activation are distinct and attributable. Exact permission grants remain subject to DEC-043/PM-01–PM-12 reconciliation.
- There is **no verified PUDO location inventory** today. The initial inventory must be bootstrapped from an accountable business/Operations source and physically verified. Do not infer locations from free-text shipment drafts, map listings or directories.
- Firestore remains the authoritative registry. Google Maps Platform is only a candidate for future evaluation; no provider/API/geocoding/geolocation integration has been selected or approved. Mapping may assist discovery later but cannot establish location verification, authorisation, activation, capability or eligibility.
- The workflow is recorded in `PLATFORM_PUDO_LOCATION_REGISTRATION_AND_VERIFICATION_WORKFLOW.md`; DEC-050 is in `DECISIONS.md`; VLY-025, `PROGRESS.md` and `README.md` are reconciled.
- **Next task:** define the practical Operations verification checklist and evidence sufficiency; identify the accountable Operations owner and source for the initial inventory; reconcile edit/suspension/reactivation and activation authority with DEC-043/PM-01–PM-12; then complete the source-aligned technical contract. Do not code the registry, map integration, or customer PUDO selector yet. All DEC-047 combinations remain unavailable until their independent evidence and Operations approval are recorded.

Continue **VeriLyft — Beyond Borders** in repository `dev-adeshina/small-pudo`.


## Historical continuation — PR #119 merged; Standard costing boundary captured — 2 November 2026

- PR #119 merged at 3d324d4a7b9a5eb751106b0da30defe79ea332ce. PR #118's internal quote-lineage/version foundation is also merged and remains internal-only.
- The owner has confirmed Standard origin-centre selection: the shipper selects the PUDO centre on the website and must present the parcel at that selected centre. Physical verification occurs there; sender-doorstep collection is not part of the currently described Standard scope.
- If the selected centre becomes unavailable before presentation, Operations may authorise a change to another eligible nearby centre, with customer notification and acceptance.
- Each operational activity needs an independently configurable unit-cost definition and its own applicable variables. Staff compensation remains flexible and undecided. Transportation supports business-owned vehicles, driver-owned vehicles and external transport partners, with configurable agreement methods.
- No separate fuel/vehicle operating-expense reimbursement is provided to driver-owned-vehicle drivers or external transport partners under the described arrangement; business-owned vehicle cost treatment remains open.
- Parcel characteristics are extensible; declared and actual measurements remain separate. Discrepancy, failed-attempt and Return-to-Sender workflows must preserve customer acceptance, authorisation, evidence and physical custody truth.
- **Current next task:** perform a fresh read-only source review of current-main Firebase Admin, Firestore persistence, validation, authorization and Emulator test patterns. Then propose a minimal technical contract for internal activity-cost configuration. No code before that contract is approved.
- **Code boundary:** candidate first slice is server-only configuration persistence/validation, activity-specific variable metadata, immutable version history and Emulator/Rules-denial tests. No customer pricing calculation, quote issuance/acceptance, storefront delivery fee, customer UI, staff compensation execution, dispatch, intake, custody or DEC-047 activation.
- DEC-048 remains authoritative. No model, rates, formulas, currency, units, conversions, fees, taxes, quote validity or handover deadlines are approved. All twelve DEC-047 combinations remain unavailable. M0 and DEC-036 release evidence remain independent.

## Historical continuation — pre-PR118 — 2 November 2026

- **PR #117 is reviewed and merged.** The user's local `main` is synchronized to short commit `feb8019` (from the supplied pull output). PR #117 approves the physical DB-01/DB-02/DB-05 persistence/API/security contract. Its changes were documentation-only.
- The relevant source paths were re-fetched from current `main` before this implementation slice: Firebase Admin initialization, the existing dependency-injected shipment-draft store and adapter, Firestore Rules/configuration, package scripts, and the Rules/Firestore-store tests. The application-source inspection remains bounded; no full-repository or production audit is claimed.
- **Current implementation:** PR #118 is open on branch `feat/shipment-quote-lineage-foundation`.
- **Current bounded scope:** internal quote-lineage and immutable-version persistence primitives, synthetic Firestore Emulator integration tests, and direct-client Rules-denial tests for `shipmentQuotes`, quote versions, `shipmentBookings` and `shipmentParcels`.
- The implementation must not add customer routes/UI, quote calculation/issuance, quote acceptance, confirmed-booking creation, parcel/intake/custody, speculative indexes, or direct client access. Existing draft, storefront, stock, Paystack and admin flows remain unchanged.
- The quote snapshot is intentionally opaque. Pricing models/values/inputs, service eligibility (DEC-047), quote validity, separate handover deadline, stable operation/replay identity and consequential customer token-revocation policy remain open. Do not expose this store as a customer command or retryable quote-issuance API.
- No local tests, TypeScript, lint, build or Emulator execution has yet been performed for this branch. Vercel's preview deployment was rejected by its free-tier daily deployment limit (more than 100 deployments in 24 hours); this is an infrastructure rate limit, not a code build result. The user must run and report the local checks before the code slice can be considered verified.
- **Next:** review the implementation PR, run the focused Firestore Emulator tests plus the full test/type/lint/build checks locally, fix any failures within this same focused slice, and merge only after review. The M2 commercial pricing/quotation readiness work and DEC-036 release evidence remain independent gates.


## Current owner direction — 31 October 2026 (continuity; current task pointer at end of file)

- DEC-045 records the owner's explicit instruction to stop extending the planning cycle and begin implementation using accepted policy. The previous blanket freeze pending Reviews 3–5 is superseded for starting bounded implementation work.
- Use `PLATFORM_CONSOLIDATED_IMPLEMENTATION_BACKLOG.md` as the single execution pointer. M0 baseline/regression verification remains active; M1.3 draft-workspace foundation is implemented. DEC-049 accepts the DB-01/DB-02/DB-05 logical booking, parcel and quote relationships; the next booking-related activity is a separate source-aligned physical persistence/API/security design review.
- Do not infer Firestore layout, fields, indexes, APIs, enums or permissions from DEC-049. Quote issuance/acceptance and parcel/intake remain disabled until their independent commercial, DEC-047, location/action and evidence prerequisites are approved.
- DEC-018/DEC-036 launch scope, P0 acceptance evidence and production release requirements remain in force. Implementation start is not launch approval.
- Preserve the existing Next.js App Router, TypeScript, Firebase/Firestore/Auth/Admin, Paystack and Cloudinary architecture. Inspect current source before modifying it; the historical source-inspection baseline is not runtime proof.


## Current implementation-readiness handoff — PR #131 baseline — 3 November 2026

1. Start from `main` at PR #131 merge `58018e3`; verify `git status -sb` and preserve the three known untracked local files.
2. Treat PR #131 as the latest application-code change. Its scope is shared Admin API authorization decision extraction plus focused automated regression tests; do not interpret it as a full Admin runtime or production audit.
3. Keep the existing policy: valid/non-revoked Firebase token, verified allowlisted email, `admin === true`, and active `adminAccess/{uid}`; empty allowlist and Firestore lookup failure fail closed. Staff action permissions remain a separate authorization layer.
4. The user reported 11/11 focused authorization tests and 86/86 full Emulator-backed tests passing on the PR head. TypeScript, lint and build were recorded as passing during PR verification. Do not claim deployed/browser verification of all Admin API routes.
5. Keep outstanding M0 evidence visible: live revocation, authenticated non-admin rejection on representative routes, upload-route denial and deployed configuration parity.
6. Use `PLATFORM_CONSOLIDATED_IMPLEMENTATION_BACKLOG.md` as the execution pointer. The Operations position remains unassigned; PUDO verification and initial inventory approval are blocked until accountable ownership and the authoritative inventory source are identified.
7. Preserve all DEC-047, pricing, quote, booking, payment, intake, custody and route-execution gates. Do not reopen accepted decisions or infer new permissions from Admin status.

## Historical verified repository state — PR #111 baseline

- Current `main` baseline: PR #111 is merged; merge commit `730581ba6b4a6f5ea25718d8d11face40aaed0dd`. The user's local `main` is synchronized to this commit. The current documentation review branch is `docs/db01-db12-technical-contract-acceptance`.
- PRs #54–#83 are merged documentation-only reconciliation/design changes; PR #58 carries DEC-037–DEC-044 into the P0 catalogue/readiness documents, PR #60 completes the first cross-document status/reference pass, PR #61 aligns the A-10 acceptance row with DEC-043, PR #62 aligns DEC-038–DEC-041 status references, PR #63 clarifies the Finance responsibility/deployment boundary, and PR #64 reconciles DEC-044 custody acceptance evidence; PR #66 aligns A-15 with accepted PM-01–PM-12 permission policy; PR #67 aligns A-16 with DEC-033/PM-08; PR #68 records the approved closure direction; PR #69 reconciles A-17 Support and controlled exception handling.
- The current bounded source re-fetch is at PR #111 baseline `730581ba6b4a6f5ea25718d8d11face40aaed0dd`; the M1.3 source baseline `5017cc9` has no intervening application-source changes through PR #111. The current draft workspace is implemented but remains draft-only. No independent quote, confirmed-booking, parcel/intake/custody, PUDO capability, route/movement or general financial-reconciliation service was established by the bounded review. This is not a full repository semantic audit or runtime/production verification.
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
7. For each capability, obtain owner review/merge of the relevant policy, technical contract and acceptance specification before its code change. DEC-045 permits bounded implementation under accepted policy; complete SDD and DEC-036 evidence remain release gates.

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
- Keep PRs focused. Documentation remains the right deliverable while policy/technical inputs are unresolved; bounded application changes may proceed under DEC-045 only when the relevant SDD contract, authorization, acceptance cases and evidence are Ready. The owner reviews and merges every PR.
- Never claim a test, build, browser check, deployment check, or production verification was performed unless it actually was.
- Preserve historical roadmap/checkpoint entries as history; use `PROGRESS.md` for the current work pointer.
- Do not reopen completed D-01–D-15, PM-01–PM-12, BP-01–BP-22, or Milestones 1–3 absent genuine contradictory evidence.

**Implementation gate:** DEC-045 permits bounded implementation under accepted policy; it supersedes the earlier blanket freeze pending completion of Reviews 3–5. Do not implement a capability whose business inputs, technical relationships, authorization, acceptance criteria or evidence remain unresolved. DEC-036 P0/Conditional P0 release requirements remain independent.


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
- Historical PR #83 checkpoint: the earlier blanket freeze pending Review 5 was superseded by DEC-045. Current implementation gate is recorded in the active work pointer at the end of this file.


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
- Reviews 1 and 2 remain approved. Review 3 is not yet presented; Reviews 4 and 5 remain future gates. That PR #83 planning checkpoint is historical. DEC-045 now permits bounded implementation under accepted policy; the current DB-01–DB-12 technical-contract package is the review gate for the next booking-related slice.


## Latest M2 eligibility-policy checkpoint — 2 November 2026

- **Verified main baseline before this documentation PR:** PR #107 merged at `938ae9718394abcb120aa702727b83cf23b065ff`. The current working branch is `docs/m2-service-eligibility-verification-matrix`; it contains a documentation-only DEC-047 reconciliation and is not yet merged.
- **Owner-approved policy:** DEC-047 establishes a conservative eligibility/operational-verification gate for Standard, Express and Scheduled across address-to-address, address-to-PUDO, PUDO-to-address and PUDO-to-PUDO. Each of the twelve combinations is pending verification and unavailable by default; pending is not the same as a final not-eligible decision.
- **Activation evidence:** responsible Operations authority must verify approved origin/destination coverage, active PUDO centres and each required action, an operationally valid route, and operating availability/capacity for the requested date/time. Approval and supporting evidence must be attributable. The server enforces and revalidates; missing, stale, revoked or insufficient evidence fails closed.
- **Documents reconciled on this branch:** DECISIONS.md (DEC-047), PLATFORM_OWNER_DECISION_REGISTER.md, PLATFORM_SHARED_WORKFLOWS.md (explicit 3×4 conservative matrix), PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md, PLATFORM_SHIPPER_JOURNEY_AND_PORTAL_EXPERIENCE.md, PLATFORM_CONSOLIDATED_IMPLEMENTATION_BACKLOG.md, IMPLEMENTATION_SOURCE_TRACEABILITY.md, ISSUES.md and PROGRESS.md.
- **Still open:** Actual eligible/conditional/not-eligible outcomes and conditions for all twelve combinations; concrete service/location/action coverage; proximity discovery/privacy; operational coverage/capacity sources; estimate methodology and numerical timeframes; guarantee policy; Scheduled windows/cutoffs/reservation/expiry/change rules; pricing specifications; quote validity and separate handover deadlines; technical/evidence contracts and executable tests.
- **Evidence boundary:** Documentation-only. No application source, schema, API, permissions, provider, route/scheduling algorithm, runtime behaviour, production capability or tests were changed or verified. Do not treat any of the twelve combinations as operationally eligible. M0 and DEC-036 P0/Conditional P0 release evidence remain independent.
- **Next action:** Review the single consolidated documentation PR. After merge, continue M2 by resolving actual service-specific pricing/quotation inputs and remaining operational dependencies without inventing rates, formulas, units, timeframes or technical contracts.


## Latest M2 pricing and quotation readiness work — PR preparation — 2 November 2026

- **Baseline:** PR #108 merge commit `047a234cc641493d8a44a88e41ab722e6818ab5c`.
- **New specification:** `PLATFORM_M2_PRICING_AND_QUOTATION_READINESS_SPECIFICATION.md` consolidates service-specific pricing inputs, calculation authority, charge transparency, rate governance, quote preservation/acceptance, expiry/handover, shared storefront pricing and technical blockers.
- **Accepted policy preserved:** DEC-019, DEC-026, DEC-038–DEC-041 and DEC-046–DEC-047. No new DEC or business-policy default is introduced.
- **Service model status:** Standard, Express and Scheduled have no selected fixed/calculated/hybrid model yet. Rates/formulas, input mappings/sources, units/conversions, currency/rounding, fees/taxes, quote validity and handover deadlines remain pending.
- **Eligibility status:** All twelve DEC-047 service/endpoint combinations remain pending verification and unavailable by default. No service is quote-ready.
- **Source findings:** Current storefront order API recalculates product prices server-side but hard-codes delivery fee zero and NGN. Product catalogue price is distinct from delivery pricing. Paystack initialization/verification is storefront-order scoped. Shipment drafts remain draft-only. No shared shipment quote/rate service was identified in the bounded review.
- **Technical blockers:** DB-01–DB-03 and DB-05 block final booking/shipment/parcel/route and quote-scope design; DB-04, DB-06 and DB-11 require cross-domain reconciliation. The existing one-quote-per-booking recommendation is pending, not accepted.
- **Evidence boundary:** Documentation-only; no application source, schema, API, rules, permissions, provider, runtime or production behaviour changed. No tests/build/lint were run.
- **Next:** Review the single consolidated M2 pricing/quotation documentation PR. Do not begin quote-engine implementation until service-specific configurations, DB-05 quote scope, DEC-047 operational evidence, service commitments, technical relationships and executable acceptance specifications are approved. M0 and DEC-036 release evidence remain independent.


## Latest M2 commercial pricing owner decision package — 2 November 2026

- **Baseline:** PR #109 merge commit `dcaeb9e82b027e6bb98fc2e665bf10f22eb3e38d`.
- **New owner package:** `PLATFORM_M2_COMMERCIAL_PRICING_OWNER_DECISIONS.md` groups seven decisions: commercial unit (DB-01/02/05), per-service model-selection method, input/source/unit matrix, rates/formulas and monetary treatment, quote validity/handover deadline, pricing governance and DEC-019 shared authority.
- **Recommended minimum launch:** one parcel and one itemized quote per independent booking, subject to explicit owner acceptance and technical reconciliation. Multi-parcel/cross-obligation complexity is deferred.
- **Pricing model status:** no model is selected for Standard, Express or Scheduled. Recommend evidence-first selection based on each service's cost and operational facts.
- **Commercial values:** actual rates/formulas, units/conversions, currency, rounding, taxes/fees and numerical quote/handover durations remain unprovided and unapproved.
- **Accepted policy preserved:** DEC-019, DEC-026, DEC-038–DEC-041 and DEC-046–DEC-048. DEC-047's twelve service/endpoint combinations remain pending verification and unavailable by default.
- **Status:** the owner response is accepted and recorded as DEC-048 below. No application code, schema, API, permission, provider, runtime or production change. No application tests/build/lint run.
- **Next:** complete technical ownership/cardinality/source/API/security and executable acceptance contracts before pricing/quote implementation. M0 and DEC-036 release requirements remain independent.


## Current owner decision — DEC-048 — 2 November 2026

- **Accepted:** minimum-launch independent booking commercial unit is one parcel and one itemized quote per booking; multi-parcel/cross-obligation allocation is deferred.
- **Accepted:** each service uses only its minimum necessary pricing inputs, with approved authoritative source, source classification, unit, precision, explicit conversion and validation behaviour. Actual mappings remain to be evidenced and approved.
- **Accepted:** quote validity and physical-handover deadline are separate service-specific requirements, both communicated before quote acceptance; numerical durations/triggers/outcomes remain unresolved.
- **Accepted:** pricing governance separates proposal, Operations validation, Finance review and independent approval, aligned with PM-01–PM-12.
- **Accepted:** DEC-019 shared pricing-rule authority remains the single authority wherever storefront delivery and independent shipment inputs overlap.
- **Deferred:** no fixed/calculated/hybrid model selected for Standard, Express or Scheduled until service-specific cost and operating evidence exists.
- **Deferred:** no actual rates, formulas, coefficients, distance bands, minimums, currency, rounding, taxes, surcharges, discounts or other fee treatment approved.
- **Technical boundary:** DB-01 shipment creation timing, DB-02/DB-05 technical persistence/cardinality, DB-03 parcel-to-route-leg, DB-06 payment allocation and DB-11 financial-event linkage remain open. No schema/API/permission/provider/code change is approved by DEC-048.
- **Next:** technical ownership/cardinality/source/API/security/transaction/replay/recovery contracts for DB-01–DB-12 and executable acceptance specifications. Keep quote issuance and all twelve DEC-047 service/endpoint combinations unavailable until all independent commercial, operational and technical prerequisites are verified. M0 and DEC-036 release requirements remain separate.


## Current work pointer — DB-01–DB-12 technical contracts and acceptance — 2 November 2026

- **Current main:** PR #111 merge `730581ba6b4a6f5ea25718d8d11face40aaed0dd`; user confirmed local `main` is synchronized.
- **Active branch:** `docs/db01-db12-technical-contract-acceptance`.
- **Current proposal:** `PLATFORM_DB01_DB12_TECHNICAL_CONTRACT_AND_ACCEPTANCE_SPECIFICATION.md`.
- **Source review:** Current-main re-fetch of the M1.3 draft UI/API/authentication/validation/Firestore store/tests and existing storefront order/Paystack/Firestore rules. M1.3 remains draft-only; do not reinterpret its persistence as a confirmed booking or parcel model.
- **Next:** Review/merge the consolidated technical-contract and acceptance package. Then proceed with the smallest Ready implementation slice under DEC-045; do not wait for every future capability, but keep all blocked services/endpoint combinations and quote issuance disabled.
- **Accepted commercial boundary:** DEC-048: one parcel and one itemized quote per independent booking for minimum launch; multi-parcel/cross-obligation allocation deferred; service model/rates/arithmetic/fees remain deferred.
- **Accepted by DEC-049:** DB-01 booking-confirmation/parcel-creation timing; DB-02 one-booking/one-parcel logical cardinality and actual-possession trigger; DB-05 one quote lineage with immutable versions and exact-version acceptance. Their physical representation/API/security design remains open.
- **Still open:** DB-03 parcel-to-route-leg relationship; DB-04 storefront delivery association; DB-06 payment allocation; DB-07/08 party/business verification; DB-09 location/action capability; DB-10 evidence/reviewer/retention; DB-11 financial-event linkage; DB-12 notification matrix; DEC-047 operational evidence; service-specific pricing/quote/handover values; and executable fixtures for blocked cases.
- **No code has been changed in this proposal.** No tests/build/lint were run for this documentation PR. Preserve existing untracked local files and the user's normal review → merge → local pull workflow.


## Latest relationship decision — DEC-049 accepted — 2 November 2026

- PR #114 merged at `26d93cb2748041c8fa0e34bb8a65693949bce0e8`; owner acceptance is recorded as DEC-049.
- Accepted DB-01: exact valid quote acceptance confirms the commercial booking; it creates no parcel or physical/payment/route side effect.
- Accepted DB-02: zero parcels before accepted physical possession and exactly one thereafter; parcel belongs to one originating booking. Refusal before possession creates no parcel/custody; receipt under hold records actual custody. Walk-in intake remains separate.
- Accepted DB-05: one quote lineage per independent booking; immutable issued versions, one current offer and exact-version acceptance bound to an immutable accepted snapshot.
- Physical Firestore representation, API, fields, indexes, permissions and implementation remain unapproved. Quote issuance/acceptance remains blocked by pricing, quote/handover terms and DEC-047 evidence; parcel/intake remains blocked by location/action/evidence contracts.
- User-reported Firestore Emulator result after PR #113: 49 passed, 0 failed, 0 cancelled. Draft-workspace evidence only.
- **Next:** source-align the minimum physical persistence/API/security design for the accepted logical relationships before selecting any implementation slice.


## Current decision — DEC-049 — 2 November 2026

PR #114 was reviewed and merged at `26d93cb2748041c8fa0e34bb8a65693949bce0e8`. The owner accepted the consolidated DB-01/DB-02/DB-05 logical contracts:

- Quote acceptance by the authenticated booking party of the exact current, valid version confirms the commercial booking; it does not create a parcel or imply payment/intake/custody/route.
- A parcel is created only when authorized intake accepts actual physical possession. Refusal before possession creates no parcel/custody; receipt retained under an authorized hold records actual custody. One independent booking has zero parcels before accepted possession and exactly one after. Walk-in intake remains separate.
- One quote lineage per independent booking, immutable issued versions, one current offer, exact-version acceptance and immutable accepted snapshot. Concurrent/replayed acceptance cannot create multiple bookings; concurrent intake cannot create multiple parcels.
- DEC-049 approves logical rules only. No Firestore layout, schema, fields, indexes, identifiers, API, enums, permission IDs/claims, pricing values, durations, location eligibility, evidence technology, provider or code is approved.
- The DB-01/02/05 rows and TCC-BOOK-01/04, TCC-QUOTE-01/02 and TCC-INTAKE-01 assertions are reconciled in `PLATFORM_DB01_DB12_TECHNICAL_CONTRACT_AND_ACCEPTANCE_SPECIFICATION.md`.
- Quote issuance/acceptance remains disabled pending approved pricing, quote/handover terms, DEC-047 eligibility and technical prerequisites. Parcel/intake remains disabled pending location/action authority and physical evidence contracts. DB-03, DB-04, DB-06–DB-12 and M0/DEC-036 remain independent gates.

**Next:** source-align the minimum physical persistence/API/security design to the accepted logical contracts. Do not begin quote or intake implementation until the separate readiness gates are closed.


## Current authoritative handoff — Review 5 approved (2 November 2026)

**Repository baseline:** PR #115 merge `acf27604799f5142be0c6b6f14591ee053344b54`, branch `main`. This supersedes earlier PR #111 / `730581ba6b4a6f5ea25718d8d11face40aaed0dd` as the latest documentation baseline. The application-source review in the DB-01–DB-12 technical contract remains bounded to its stated commit and inspected paths; it is not a full-repository or production audit.

**Owner approval:** The owner approved Review 5 on 2 November 2026. The result is **CONDITIONALLY READY** for bounded implementation under DEC-045. Do not describe the platform as launch-ready or treat this approval as approval of unresolved business rules, physical schema, API routes, permission identifiers, pricing values, provider activation or production deployment.

**Accepted direction from Reviews 1–4:**
- Preserve separate quote lineage/immutable versions, confirmed booking, parcel, payment and custody facts.
- Exact valid quote-version acceptance by the authorized booking party confirms one commercial booking.
- Quote acceptance does not create a parcel or imply payment, intake, custody or movement.
- Create one parcel only when authorized staff accept actual physical possession; refusal before possession creates no parcel; receipt under an authorized hold still records actual possession/custody.
- Enforce customer ownership, staff action authority and location/service/action capability server-side at mutation time.
- Use local transactions and operation-specific replay/concurrency controls for acceptance, intake and custody operations.
- Keep trusted business records server-controlled; derive indexes from approved queries.
- Preserve the existing Next.js App Router/Firebase architecture, storefront orders and customer draft workspace.

**Immediate next task:** Prepare and obtain review/merge of a focused, source-aligned physical persistence/API/security contract for accepted DB-01/DB-02/DB-05 logical rules. It must settle the minimum Firestore representation, ownership/reference validation, transaction/idempotency, query/index requirements, rules and Admin SDK enforcement, migration/recovery and synthetic Emulator acceptance fixtures. No application code or schema is authorized by the Review 5 approval itself.

**First implementation target after that contract is approved:** quote-lineage and immutable-version technical foundation only. Do not enable quote issuance or acceptance until pricing, quote/handover terms, DEC-047 service eligibility and the relevant authorization/acceptance contracts are Ready. Do not enable parcel/intake until location/action authority and physical evidence requirements are Ready.

**Still independent and unresolved:** DB-03, DB-04, DB-06–DB-12; service pricing and operational availability; DEC-047 twelve service/endpoint evidence outcomes; staff/location capability configuration; intake/custody evidence and correction authority; financial reconciliation; notification and retention contracts; M0/DEC-036 P0 release evidence and production operational readiness.

**Protocol:** DEC-045 supersedes the earlier blanket freeze pending Reviews 3–5. Proceed only with a bounded slice whose accepted policy, technical contract, authorization, acceptance cases and evidence are Ready. Keep unresolved capabilities unavailable. Do not invent collections, fields, routes, status enums, permission IDs, rates, durations, evidence standards or production targets. Preserve focused PRs and owner review/merge.


## Current authoritative handoff — PR #116 merged; physical design proposal prepared (2 November 2026)

- **Current `main`:** PR #116 merged at `0ca77ea2cff30d38ea10e279810f4e0cae65cd90`; user reports local `main` synchronized.
- **Review 5:** owner-approved CONDITIONALLY READY for bounded implementation under DEC-045. The approved sequence is to review/merge the physical DB-01/02/05 contract before beginning the quote-lineage and immutable-version technical foundation.
- **Source baseline:** relevant source paths have been re-fetched at the current commit. The review remains bounded to Firebase Admin, Firestore Rules/configuration, customer/admin authorization, draft persistence/API/validation and associated tests; it is not a full source audit or runtime/production verification.
- **Current proposal:** `PLATFORM_DB01_DB02_DB05_PHYSICAL_PERSISTENCE_API_SECURITY_DESIGN.md`. Review the recommended root-level quote/booking/parcel records, quote-version subcollection, immutable snapshot, transaction serialization points, server-only access, default-deny Rules and query-driven index policy.
- **Important open point:** customer token revocation is not currently checked by `authenticateVerifiedCustomer`; the proposal recommends an explicit owner decision before consequential quote acceptance. Staff authorization and location/action capability are not implemented in the inspected source and must not be replaced by admin status.
- **Next:** owner review of the physical design proposal. If approved, the first implementation PR is limited to quote-lineage/version persistence primitives and synthetic Emulator/Rules tests. No public quote/booking API or UI, quote issuance/acceptance, parcel/intake or custody capability is included.
- **Keep blocked:** pricing/quote terms, DEC-047 eligibility, customer revocation policy, staff/location/action authority, physical evidence/DB-10, DB-03/04/06–12, M0 and DEC-036 release evidence remain separate gates.
- **No claims:** no tests, build, lint, Emulator, deployment or production checks were run for this documentation proposal.


## Current authoritative handoff — M2 service evidence collection — 2 November 2026

**Repository baseline:** PR #118 merged at `d54f337439947207e1967d1b915a02018e0b856a`; the user reports local `main` synchronized.

**Completed since the earlier handoff:**
- PR #117 approved the physical DB-01/DB-02/DB-05 persistence/API/security contract.
- PR #118 implemented internal quote-lineage and immutable-version persistence, synthetic Firestore Emulator integration tests and direct-client Rules-denial tests.
- The user reported local verification: 57 tests passed with zero failures (including seven quote-store tests); TypeScript, ESLint and Next.js production build passed.
- M2 readiness documentation has been reconciled with DEC-048/DEC-049 and PRs #117/#118. DB-05 is accepted and the physical quote-lineage foundation is implemented; neither fact enables customer quote issuance or acceptance.

**Current documentation PR:** branch `docs/m2-service-evidence-workbook`; adds `PLATFORM_M2_SERVICE_COST_AND_INPUT_EVIDENCE_WORKBOOK.md`, updates the M2 readiness specification, and refreshes backlog/progress/handoff. It is documentation-only and remains subject to owner review/merge.

**Accepted commercial constraints — DEC-048:**
- One parcel and one itemized quote per independent booking for minimum launch; multi-parcel/cross-obligation allocation deferred.
- Minimum necessary pricing inputs for each service, with approved source, source classification, unit, precision, explicit conversion, validation and missing-value behaviour.
- Separate service-specific quote validity and physical-handover deadline, both communicated before acceptance.
- Pricing proposal, Operations validation, Finance review and independent approval remain separated under PM-01–PM-12.
- One shared pricing-rule authority wherever storefront delivery and independent shipment inputs overlap under DEC-019.
- No fixed/calculated/hybrid model selected for Standard, Express or Scheduled. No rates, formulas, coefficients, distance bands, minimums, currency, precision, rounding, taxes, surcharges, discounts or other fee treatment approved.

**Immediate next work:** collect attributable cost and operating evidence independently for Standard, Express and Scheduled; complete each service's minimum-input/source/unit/precision/conversion/validation matrix; obtain Operations validation and Finance review; then prepare a model recommendation for each service for independent approval. Do not select models before the evidence exists.

**Still blocked:** all 12 DEC-047 service/endpoint combinations remain pending verification and unavailable by default. No customer quote issuance/acceptance, pricing calculation, confirmed booking, parcel/intake or custody capability is enabled by the quote persistence foundation. Quote validity and handover durations/outcomes, estimate methodology, Scheduled windows/cutoffs, shared storefront integration and remaining DB-03/04/06–DB-12 relationships remain open as applicable.

**Do not invent:** commercial rates, formulae, input values, units/conversions, currency, rounding, taxes/fees, timeframes, eligibility outcomes, capacity, evidence standards, permission IDs or approval thresholds. The evidence workbook is a blank collection/decision aid, not approval.

**Independent gates:** M0 residual verification and DEC-036 P0/Conditional P0 release evidence remain independent of M2. Payment, intake, custody, route/movement, delivery and Finance reconciliation are not enabled by this work.



## Current authoritative handoff — Standard cost configuration discovery — 2 November 2026

**Repository baseline:** PR #119 merged at 3d324d4a7b9a5eb751106b0da30defe79ea332ce. The user wants to keep the evidence process minimal and move toward implementation.

**Latest owner-confirmed Standard direction:**
- Shipper selects the origin PUDO centre on the website and must present the parcel at that centre. Physical verification happens there. Sender-doorstep collection is not part of the currently described Standard scope.
- If the selected centre becomes unavailable before presentation, Operations may authorise a change to another eligible nearby centre, with customer notification and acceptance.
- Each operational activity needs an independently configurable unit-cost definition; each activity defines its own applicable variables.
- Staff compensation must remain flexible; no payment method, productivity target or allocation formula is selected.
- Transportation must support business-owned vehicles, driver-owned vehicles and external transport partners. Agreements may be per trip, distance-based, per parcel, fixed, time-based, hybrid or negotiated. No separate fuel/vehicle operating-expense reimbursement is provided to driver-owned-vehicle drivers or external partners under the described arrangement. Business-owned vehicle cost treatment remains open.
- Parcel characteristics must be extensible. Customer-declared and staff-verified values remain separate. Discrepancies support recalculation with customer acceptance, rejection or Operations review.
- Failed attempts and Return-to-Sender are separately recorded operational workflows. No automatic customer charge or false custody transfer is implied.

**Authoritative detail:** Section 12 of the M2 service cost and input evidence workbook and Section 18 of the M2 pricing and quotation readiness specification.

**Immediate next task:** Perform a fresh, read-only review of current-main Firebase Admin, Firestore persistence, validation, authorization and Emulator test patterns. Identify the smallest source-aligned internal activity-cost configuration slice. Do not assume the global Firebase admin claim is sufficient for separate Operations/Finance proposal, validation and approval responsibilities.

**Candidate first code slice, subject to a separate approved technical contract:** server-only configuration persistence/validation, activity-specific variable metadata, immutable version history and Emulator/Rules-denial tests. No public/customer pricing, formula execution, quote issuance/acceptance, storefront delivery fee, customer UI, staff compensation execution, dispatch, intake, custody or DEC-047 activation.

**Commercial boundary:** DEC-048 remains authoritative. No fixed/calculated/hybrid model, rate, formula, currency, unit, conversion, fee, tax, quote-validity duration or handover deadline is approved. All twelve DEC-047 service/endpoint combinations remain pending and unavailable. Express and Scheduled must be evidenced independently; Standard decisions do not automatically apply to them.

**Do not invent:** activity IDs, measurement units, cost amounts, formulas, staff compensation methods, partner terms, business-owned vehicle expenses, permission IDs, schema, endpoints, evidence standards or approval thresholds.

**Preserve:** PR #118 quote-lineage foundation, existing storefront/draft/order/payment/admin behaviour, M0 residual verification and DEC-036 P0/Conditional P0 release requirements.


## Historical implementation-readiness handoff — PR #129 baseline — 3 November 2026

1. Start from current main at PR #129 (a2247efd2d0a7103c85d156f89ea210a696b33e2); verify the branch and working tree before local changes.
2. Treat PR #125 (e7966332024fd38eb7cb5b8a1adebc0b584ac894) as the latest application-source baseline until a later application-code PR is confirmed.
3. Read IMPLEMENTATION_SOURCE_TRACEABILITY.md Section 21, PROGRESS.md current checkpoint, ISSUES.md VLY-027 and VLY-025, PLATFORM_CONSOLIDATED_IMPLEMENTATION_BACKLOG.md, and the relevant DB-01–DB-12 / physical persistence contract sections.
4. Preserve source boundaries: draft preparation is not booking; internal quote lineage is not quote issuance; operational-cost definitions are not customer pricing; route/dispatch intent is not physical custody transfer.
5. The Firestore Rules test source explicitly denies direct client access to quote, quote-version, booking, parcel and operational-cost records. It was inspected in this audit but not executed. Do not claim deployed Rules or server API security verification from that test alone.
6. Keep customer quote issuance gated on approved service-specific pricing inputs and commercial rules. Keep all twelve DEC-047 combinations unavailable until their own operational evidence and approvals exist.
7. The accountable Operations position remains unassigned. Do not conduct or approve PUDO physical verification or inventory on behalf of an invented owner.
8. Choose the next independent code slice only after its specific policy, source reuse, physical/API representation, authorization, and acceptance criteria are ready. DEC-045 allows bounded work; unresolved capability gates are not a blanket code freeze.
9. Before implementation, define tests for success, denial, ownership/isolation, stale/concurrent updates, retries/replay, failure recovery, and audit evidence as applicable. Reuse the existing Next.js/Firebase patterns; avoid parallel architecture.
10. After this documentation reconciliation is merged, move to the selected code objective rather than reopening already-approved decisions or repeating completed reviews.
