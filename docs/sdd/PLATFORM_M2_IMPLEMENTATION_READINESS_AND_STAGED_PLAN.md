# VeriLyft M2 — Implementation Readiness Review and Staged Plan

**Status:** Consolidated readiness assessment submitted for owner review; planning only  
**Prepared:** 5 November 2026  
**Documentation baseline:** PR #140 merge `8b62d218847beea5e49dc7afcee203f44bc68da9`  
**Application-source baseline:** PR #137 merge `55dff8c2a4f4cf6f0e983676e692f0f126f7ec27`  
**Requirements baseline:** Owner-approved M2 package in PR #139; reconciled by PR #140  
**Authority:** DEC-019, DEC-036, DEC-038–DEC-049, DEC-047, DEC-048, DEC-049, DEC-050; BP-01–BP-22; PM-01–PM-12; existing approved DB-01/02/05 physical contract (PR #117) and internal quote-lineage persistence implementation (PR #118)

---

## 1. Executive readiness outcome

**No customer-facing M2 pricing, quote or booking capability is ready for application-code implementation today.** The existing foundations are real and reusable, but the commercial, evidence, eligibility and downstream technical gates are not complete.

The next bounded application-code candidate is an **internal structured cost-evidence enhancement to the existing operational-cost definition model**. It is not a new cost registry, pricing engine or customer feature. It is **conditionally ready for technical-contract closure**, not yet implementation-ready: the exact evidence representation, compatibility rules, submission validation and acceptance fixtures must first be specified against the existing store and workflow, then reviewed and approved.

The owner’s approval of this plan may authorize preparation of that focused technical contract and review package. It must not be interpreted as blanket permission to change application code, approve monetary values, calculate prices, issue quotes, accept bookings, enable services or execute physical operations. The first code PR requires the separate, explicit approval stated in Section 10.

### Readiness summary

| Capability / foundation | Current state | Readiness decision |
|---|---|---|
| Internal activity-cost definitions, components/inputs, immutable versions, staff UI and separated Operations → Finance → independent approval | Implemented on PR #125/#133/#136/#137 | Reuse; do not rebuild |
| Internal quote-lineage/version persistence | Implemented on PR #118 under approved PR #117 design | Reuse; persistence only |
| Structured cost-evidence capture | Existing free-text evidence description only; required source attribution and evidence detail are not independently structured | First bounded candidate; contract closure required |
| Actual cost evidence and service operating evidence | No actual monetary evidence or approved allocation method supplied | Blocked on real Operations/Finance evidence |
| Standard / Express / Scheduled pricing models | No model selected for any service | Blocked on explicit service-specific decision |
| Shared pricing-rule authority | Required by DEC-019, not established by the inspected source | Design and implementation blocked on contract |
| Trusted server-side price calculation | Not implemented | Blocked on approved inputs, arithmetic, rules and tests |
| Customer quote calculation / issuance | Not implemented | Blocked |
| Exact-version quote acceptance / booking confirmation | Not implemented; DB-01/02/05 physical foundation exists but does not expose these commands | Blocked |
| DEC-047 service/endpoint eligibility | All twelve combinations pending verification and unavailable by default | Blocked |
| Independent shipment payment, intake, custody, routing and delivery | Not a complete implemented journey | Separate future gates |
| Production/release readiness | DEC-036 P0/Conditional P0 evidence and operational release controls remain outstanding | Not ready |

---

## 2. Verified implementation baseline to preserve

The PR #137 source baseline, reconciled through PR #140, establishes the following:

1. **Operational-cost configuration already exists.** The current versioned store persists activity identity, activity-specific input metadata and a `costComponents` array. Cost components support key, label, optional description, decimal-string amount, explicit currency code, basis, free-form treatment and free-text evidence description. Submission requires a component and amount/currency/basis/evidence description. The staff interface and existing server-side APIs are implemented.
2. **The approval workflow already exists.** Operations validation, Finance review and independent approval are separate workflow transitions with action-specific permissions and actor separation. Reuse the existing workflow and audit events.
3. **Known evidence-model gaps are specific.** The current component does not independently persist a structured evidence object/source reference with source owner/type, represented scope, observation period, original value/unit/precision, sample/population/method, limitations and review outcome. Treatment remains free-form. Applicability is general-only. No automatic cost calculation, aggregation, allocation or shipment-cost consumption exists.
4. **Quote-lineage persistence already exists.** PR #118 implemented the internal immutable lineage/version store and its bounded transaction/replay test foundation. It is not a pricing calculator, quote issuer, customer acceptance workflow or confirmed booking command.
5. **The existing draft workspace remains draft-only.** It must not be silently promoted into a quote or booking flow.
6. **No duplicate architecture is justified.** Do not recreate the cost-definition store, cost-component persistence, approval workflow, permission catalogue, quote-lineage store or activity taxonomy.

The source refresh is bounded and read-only at PR #137. The owner-reported local 100/100 Emulator suite, TypeScript, lint and production-build results remain attributed to the owner; this review did not rerun them or inspect production state.

---

## 3. First bounded application-code candidate — internal cost-evidence enhancement

### Objective

Improve the completeness and traceability of evidence attached to existing activity-cost components so Operations and Finance can record and review attributable facts. This remains an internal configuration capability only.

### Reuse and scope

- Extend the existing `costComponents` representation inside the current immutable operational-cost definition/version model.
- Reuse the existing API routes, validation/store boundary, staff page, workflow transitions, action permissions, audit events and Firestore Rules posture.
- Reuse ACT-01–ACT-11. ACT-12 remains inactive until Operations confirms actual or contractually required work.
- Preserve existing decimal-string monetary representation and explicit currency/basis requirements.
- Keep general applicability only. Do not invent location IDs or implement location-specific applicability before an authoritative PUDO location model exists.
- Preserve existing draft and approved snapshots. Any approved-definition change creates a new immutable version through the existing revision path.

### Evidence requirements to represent

The technical contract must map the accepted requirements to source-backed fields and authoritative workflow evidence, without duplicating data already held by the current workflow:

- stable evidence/source reference and source owner/type;
- the scope represented and observation period;
- original value, unit and precision where relevant;
- sample/population and collection or measurement method;
- limitations, exclusions and uncertainty;
- the existing Operations validation and Finance review outcomes, actors, timestamps and reasons, using the current workflow history where sufficient;
- approved version/effective context through the existing immutable definition version.

A blank or unknown value remains an evidence gap; it is never interpreted as zero or a default.

### Decisions the technical contract must settle before code

1. Whether evidence metadata is embedded within each existing cost component or references an authoritative existing evidence artifact. No new evidence registry, file store or collection is assumed or approved.
2. The exact field names, types, required/optional rules, size limits, normalization and validation behaviour.
3. How legacy `evidenceDescription` values are preserved and displayed, and whether/how they can be progressively enriched without destructive migration.
4. Whether the accepted treatment classifications (direct, shared, included, exception-related) can be represented by a controlled value while preserving existing historical free-form values. No allocation formula or cost-consumption behaviour is included.
5. Which source facts belong on the component and which are already represented by workflow events, to avoid duplicate reviewer, approval or audit records.
6. Draft-versus-submission completeness rules, including safe behaviour for incomplete historical versions.
7. API/UI compatibility, Firestore Rules denial, transaction/version concurrency and recovery behaviour.
8. Exact positive, negative, legacy compatibility, permission-denial, actor-separation, concurrency and replay fixtures.

### Explicit exclusions

No automated cost calculation, aggregation, allocation, margin, customer price, rate publication, quote, quote API, quote acceptance, booking, payment, payroll, reimbursement, incident liability, PUDO eligibility, location registry, route, dispatch, intake or custody behaviour.

**Readiness decision:** candidate for the next technical-contract/design slice. It becomes a code-ready slice only after that contract and its acceptance fixtures are reviewed and explicitly approved.

---

## 4. Staged implementation plan and exit gates

| Stage | Work | Entry conditions | Exit / acceptance conditions |
|---|---|---|---|
| 0 — Evidence-model contract | Produce the source-aligned technical contract for the internal cost-evidence enhancement described in Section 3 | PR #140 merged; current source paths rechecked; no conflicting owner decision | Exact data representation, compatibility, validation, workflow reuse, security, failure/replay behaviour and executable test cases specified; owner approves the bounded contract |
| 1 — Internal cost-evidence enhancement | Implement only the approved additive enhancement within the existing cost-definition model and staff workflow | Stage 0 approved; exact code scope and tests explicitly authorized | Legacy records remain readable; new evidence is validated; immutable versioning and existing actor separation remain intact; no customer pricing or operational capability is exposed; Emulator, Rules-denial, TypeScript, lint and build checks pass |
| 2 — Real operating/cost evidence collection | Populate the existing register from actual operating records and agreements for ACT-01–ACT-11 | Accountable Operations and Finance participants are assigned; authoritative evidence sources are available | Operations validates actual activities, triggers, scope and completion; Finance validates amounts, currency, basis, source quality, duplicate/included treatment and direct/shared/exception classification; unknowns remain explicit |
| 3 — Service-specific commercial decisions | Decide Standard, Express and Scheduled independently | Stage 2 evidence is sufficient for the particular service; DEC-047 evidence work proceeds independently | Explicit owner decision for each service's fixed/calculated/hybrid model, required inputs, trusted sources, units/conversions, arithmetic, currency, precision/rounding, charges, rates, effective context, quote validity and separate handover deadline |
| 4 — Shared pricing authority contract | Specify one pricing-rule authority for overlapping storefront delivery and independent shipment inputs | DEC-019 preserved; relevant source paths and existing storefront fee flow inspected; no duplicate formula | Owner-approved authority, source of truth, version/effective-date rules, trusted server boundary, storefront integration boundary, audit and rollback contract |
| 5 — Shared pricing authority implementation | Implement only the approved shared rule authority and its tests | Stage 4 approved; relevant source and migration/compatibility requirements closed | Existing storefront behaviour preserved or intentionally migrated under an approved plan; no divergent shipment formula; rules/version tests pass; no customer quote feature enabled by implication |
| 6 — Per-service pricing configuration | Configure one service at a time | Stage 3 decision for that service; evidence and authority implementation ready | Complete approved service configuration; no placeholder values; missing/stale/unavailable inputs fail closed; effective version and approval traceable |
| 7 — Trusted server-side calculation | Implement calculation for one approved service/eligible journey | Stage 6 complete; DEC-047 combination eligible; arithmetic and inputs approved; impacted DB-03/04/06/11 contracts resolved | Server-only calculation; deterministic itemization and total; exact currency/precision/rounding; source/version trace; invalid, stale, missing and out-of-range inputs fail closed; positive/negative/property/boundary tests pass |
| 8 — Quote issuance and immutable snapshot | Expose quote issuance only for the ready service/endpoint slice | Stage 7 complete; quote validity and separate handover deadline approved; DEC-047 revalidation; quote API/security/operation identity/recovery cases ready | Quote contains approved itemized snapshot, rule/version/effective context and distinct deadlines; lineage/version store reused; no booking, payment, parcel or custody side effect; expiry/revision/replay/concurrency tests pass |
| 9 — Exact-version acceptance and booking | Add booking-party acceptance of the exact current valid quote version | Stage 8 complete; DB-01/02/05 approved contract preserved; remaining DB-03/04/06–12 dependencies resolved where applicable; customer token-revocation policy decided; booking-party authority and operation identity approved | One exact accepted version binds to one booking; concurrency/replay resolve to one result; stale/expired/non-party attempts fail; no payment, parcel, intake, custody or route side effect |
| 10 — Payment, intake and fulfilment | Separate payment, physical intake/custody, route/dispatch, delivery and exception slices | Each domain's Finance/Operations, authority, evidence, technical contract and DEC-036 gates independently satisfied | Each operation records only its actual event; payment is not custody; route/dispatch intent is not transfer; parcel creation occurs only on authorized actual physical possession; independent acceptance and recovery tests pass |

Stages 2 and 3 are evidence and owner-decision work, not reasons to insert assumed values into code. Stages 4–10 are not automatically authorized by completion of earlier stages. A stage may be split into smaller independently reviewed PRs where that reduces risk.

---

## 5. Commercial and operational blockers that remain hard gates

### Commercial — DEC-048

- One parcel and one itemized quote per independent booking is accepted for minimum launch; multi-parcel and cross-obligation allocation remain deferred.
- Minimum necessary service-specific inputs and their source/unit/precision/conversion/missing-value requirements are accepted as principles; actual mappings and values are not complete.
- Separate quote validity and physical handover deadline are required; numerical values, triggers and missed-deadline outcomes remain unresolved.
- Pricing governance separation and one shared pricing-rule authority are accepted.
- No Standard, Express or Scheduled pricing model is selected.
- No rates, formulas, currency, arithmetic, rounding, tax, surcharge, discount, minimum, margin, special-handling fee or shared-cost allocation method is approved.
- No NGN default may be inferred from storefront payments.

### Eligibility — DEC-047 / DEC-050

All twelve Standard/Express/Scheduled × Address→Address, Address→PUDO, PUDO→Address and PUDO→PUDO combinations remain unavailable by default. The accountable PUDO Operations position remains unassigned; the authoritative initial inventory source and verified inventory/capability matrix are absent. Location registration, physical verification, operational approval, activation, endpoint action capability and service eligibility remain distinct.

### Technical — DB-01–DB-12

- DB-01/02/05 physical design: approved by PR #117.
- Internal quote-lineage/version persistence: implemented by PR #118.
- DB-03, DB-04 and DB-06–DB-12 remain capability-specific open contracts. Resolve only those that affect the selected stage; do not reopen the approved PR #117 design without new source evidence or a concrete conflict.
- Quote acceptance also requires an explicit consequential-customer-mutation token-revocation decision. The inspected design notes that the current customer helper does not check token revocation; do not silently change a shared helper without caller review.

### Release — DEC-036

P0/Conditional P0 evidence, deployed Firestore Rules/configuration parity, privileged API/revocation checks, backup/restore, monitoring, incident response, rollback and named operational ownership remain separate production-release requirements.

---

## 6. Verification strategy

Every code stage must have a stage-specific test matrix and source traceability. At minimum, as applicable:

- successful creation/revision and immutable historical snapshot;
- incomplete, malformed, unsupported, stale or unknown evidence/input;
- unauthorized actor, expired/revoked permission and direct-client Firestore access denial;
- Operations/Finance/independent-approver actor separation and self-review denial;
- legacy record read/update compatibility and no destructive backfill;
- duplicate, replay, concurrent revision and unknown-outcome recovery;
- exact unchanged protected facts after failed operations;
- TypeScript, lint, production build, focused tests and full Firestore Emulator suite;
- browser verification only for the specific changed workflow, with scenario IDs and observed outcomes;
- production checks only under a separately approved release procedure.

A passing build or source inspection is not production readiness. Historical test and browser results remain attributed to the owner and are not represented as freshly reproduced by this plan.

---

## 7. Separate workstreams — do not use as hidden M2 dependencies

- Initial designated Staff Permission Administrator technical provisioning remains a separate controlled administrative action. The guarded provisioning CLI has not successfully run; no production execution is authorized by this plan.
- Specific invitation/permission/browser scenarios should be reconciled against the owner's successful live-browser test record. Do not repeat generic browser testing or claim exact coverage without the scenario inventory.
- PUDO location inventory and Operations accountability require business action under DEC-050; they are hard dependencies for DEC-047, not prerequisites for improving internal cost-evidence capture.
- Storefront order/payment work remains distinct from independent shipment pricing and shipment payment.

---

## 8. Implementation authorization boundary

This document is a proposed execution plan. Approval of the plan authorizes the team to proceed to the first bounded technical-contract review in Stage 0. It does **not** itself authorize Stage 1 application-code changes.

Before Stage 1, the owner must explicitly approve:
1. the completed Stage 0 technical contract and exact data/compatibility decisions;
2. the bounded implementation scope and files/services to be changed;
3. the acceptance/test matrix and non-production verification approach.

No later stage may be implemented solely because this plan or an earlier stage is approved. Each capability remains disabled until its own policy, evidence, technical, authorization and release prerequisites are met.

---

## 9. Owner review checklist

- [ ] Accept the readiness conclusion: no customer-facing M2 pricing/quote/booking slice is currently ready.
- [ ] Accept the internal structured cost-evidence enhancement as the first bounded technical-contract candidate, reusing the existing store/workflow.
- [ ] Confirm that Stage 0 may proceed to a detailed technical contract and acceptance fixtures.
- [ ] Preserve the explicit rule that Stage 1 code requires a separate owner approval after the technical contract is reviewed.
- [ ] Preserve all DEC-047, DEC-048, DEC-049, DB-03/04/06–12 and DEC-036 gates.

**Requested decision:** approve or request changes to this staged plan. No application-code implementation is included in this document.
