# M2 — Configurable Activity-Cost Foundation: Owner Decision and Implementation Contract

**Status:** Owner-approved direction; this document is the final preparation checkpoint for a bounded internal application-code implementation after this PR is merged.  
**Prepared:** 6 November 2026  
**Documentation baseline:** PR #144 merge `3bff2c0604440fa87a1e3286bcc4a5b621c5760f`  
**Application-source baseline:** PR #143 merge `1f731f14f98212f186b0855addd26f1c98f01c08`  
**Authority:** Existing DEC-019, DEC-026, DEC-036, DEC-038–DEC-050 and the owner's explicit 6 November 2026 direction that VeriLyft has not started operations and has no actual operating-cost records yet.

---

## 1. Owner decision and reason for changing the sequence

The business has not started operating. There are therefore no actual supplier invoices, partner charges, transport records, PUDO handling records or other operating-cost evidence to collect today.

**Decision:** Do not make actual operating-cost evidence collection a prerequisite for building the internal activity-cost configuration capability. Proceed with a bounded application-code enhancement that lets VeriLyft configure each existing operational activity independently, save unknown costs as `null`, and explicitly record activities for which no separate operating payment applies.

This changes the order of work, not the commercial controls:

- Build and test the internal configuration capability now.
- Keep unknown costs unknown; never turn `null` into zero.
- Keep unsubstantiated configurations in draft.
- Require attributable supporting evidence and the existing separated review/approval workflow before a configured cost is approved for financial or commercial reliance.
- Add real operating evidence when the business begins operating and records become available.

The earlier PR #144 readiness review remains authoritative except that its actual-evidence-first sequencing and blanket prohibition on internal cost-configuration code are superseded by this decision. No accepted DEC decision is reopened.

## 2. Configuration states and null semantics

Each cost component must explicitly represent one of three states through a server-validated `configurationState`:

| State | Meaning | Amount | Currency / basis | Additional requirement |
|---|---|---|---|---|
| `not_configured` | The business has not yet determined whether or how much this activity costs | `null` | `null` | No claim that the activity is free or has zero cost |
| `configured` | A separate internal operating cost is known and entered | Non-negative decimal string | Explicit currency and unit/basis | Evidence required before submission for review |
| `no_separate_cost` | No separate payable operating cost applies to this component within its declared scope | `null` | `null` | A non-empty reason; supporting policy/contract/operational evidence required before submission |

### Mandatory distinctions

1. `null` is not zero. A missing or `not_configured` amount must never be used in a calculation or interpreted as free.
2. `no_separate_cost` is an explicit business classification, not an arithmetic value. It must not be silently converted to a zero-valued cost component.
3. A configured numeric amount of `"0"`, if ever supported by actual evidence and approval, remains different from `no_separate_cost`.
4. `no_separate_cost` concerns internal operating cost only. It does not mean the customer receives a free service or that the customer-facing price is zero.
5. Existing `treatmentClass` values (`direct`, `shared`, `included`, `exception_related`) remain a separate accounting/treatment dimension. In particular, `included` is not interchangeable with `no_separate_cost`.
6. An unconfigured component is not an approved cost and cannot be included in a customer price.

For the new representation, use an explicit nullable `amount` field. When a component is `not_configured` or `no_separate_cost`, persist `amount: null`; currency and basis are also null/absent. A `no_separate_cost` component must carry a reason. Do not infer `no_separate_cost` from an absent amount.

## 3. Scope of the application-code implementation

### Included

- Extend the existing `OperationalCostComponentInput` and immutable component snapshots with the explicit configuration state, nullable amount semantics and no-separate-cost rationale.
- Reuse the existing activity definitions ACT-01–ACT-11 and the current `operationalCostDefinitions` / version storage.
- Reuse existing APIs, staff workspace, action permissions, approval workflow, workflow events, expected-version concurrency and Firestore client-denial boundary.
- Update the existing editor and read-only detail/history presentation to create, revise and inspect all three states.
- Keep each activity and each cost component independently configurable.
- Reuse the existing `basis` field as the flexible unit/basis description. It may describe an approved unit such as per parcel, kilometre, trip, activity or another evidenced basis. Do not introduce a hard-coded unit catalogue or rates in this slice.
- Enforce all state/value combinations on the server, not only in the browser.
- Preserve historical versions and legacy reads without rewriting existing records.

### Excluded

- Cost aggregation, arithmetic, shared-cost allocation or a cost calculator.
- Customer price/rate configuration, Standard/Express/Scheduled model selection, service-specific pricing rules or a shared pricing engine.
- Storefront delivery-fee changes or independent-shipment quote calculation/issuance/acceptance.
- Currency inference, unit conversion, rounding, tax, surcharge, discount, minimum or distance/weight formula assumptions.
- Booking, payment, parcel creation, PUDO registration/eligibility, route, dispatch, intake, custody, delivery or other physical-operation behaviour.
- New collections, evidence registry, upload store, permissions, workflow states, approval shortcuts, migrations or production data edits.

## 4. Save, submission and approval rules

The implementation must preserve the distinction between configuring a draft and approving a financially relied-upon definition.

### Draft creation and revision

- A draft may contain `not_configured` components with `amount: null`.
- A draft may contain `no_separate_cost` components with `amount: null` and a reason.
- A draft may contain `configured` components with amount/currency/basis.
- The existing immutable versioning and expected-version concurrency checks remain in force.
- Saving any of these states does not approve it or make it available to pricing.

### Submission gate

- Any component still in `not_configured` blocks submission.
- A `configured` component requires a valid amount, explicit currency, basis, structured evidence and a supported `treatmentClass`.
- A `no_separate_cost` component requires a non-empty reason, structured supporting evidence/policy basis and a supported `treatmentClass`.
- Existing proposer, Operations validator, Finance reviewer and independent approver separation remains unchanged.
- A missing real-world source is not to be replaced with synthetic evidence. Without a supportable basis, keep the component as a draft.
- Approval remains approval of an internal cost definition only. It does not authorize customer pricing, service activation or physical operations.

The current workflow submission validator requires amount/currency/basis/evidence for every component. This slice must update that validator carefully to support the explicit `no_separate_cost` case while continuing to reject unconfigured components and incomplete configured components. Do not weaken the evidence gate for configured amounts.

## 5. Compatibility and data integrity

- Existing versions without `configurationState` remain readable and revisable.
- A legacy component with an amount and its existing monetary fields may be displayed as a legacy configured value, but do not rewrite its historical snapshot merely to add the new state.
- A legacy component without an amount must never be inferred to mean `no_separate_cost`; treat its state conservatively as unconfigured for new decisions.
- Do not run a backfill or migration.
- Preserve `evidenceItems`, `treatmentClass`, legacy `evidenceDescription` / `treatment`, activity inputs, version lineage, workflow events and approval history.
- Reject malformed combinations at the server boundary, including an amount attached to `no_separate_cost`, a missing amount/currency/basis for `configured`, or a missing reason for `no_separate_cost`.

## 6. Acceptance criteria for the implementation PR

1. Create and reload a draft component with `not_configured` and explicit `amount: null`.
2. Create and reload a draft component with `no_separate_cost`, `amount: null` and its reason.
3. Create and reload a configured component with decimal amount, explicit currency and flexible basis.
4. Server validation rejects every unsupported state/value combination, even when requests bypass the UI.
5. A definition containing any `not_configured` component cannot be submitted.
6. A configured component cannot be submitted without the existing structured evidence, currency, basis and treatment classification.
7. A `no_separate_cost` component cannot be submitted without its reason and structured supporting evidence/policy basis.
8. Existing separated reviewer/approver rules, audit events, version concurrency and Firestore client denials continue to pass.
9. Legacy snapshots remain readable and revisable without migration or accidental no-charge inference.
10. The UI clearly distinguishes “Not configured” from “No separate cost”; neither is rendered as a monetary zero.
11. No cost total, customer price, quote, booking or physical-operation side effect is introduced.
12. Focused tests, full Emulator-backed tests, TypeScript, lint, production build and diff checks pass before merge; browser verification covers the three states and server-side rejection cases.

## 7. Implementation sequence and authorization

1. Merge this final focused readiness decision.
2. Begin the bounded internal configurable activity-cost application-code PR immediately afterward.
3. Review and verify the implementation against Section 6; merge only after required checks pass.
4. As real business activity begins, populate the existing configuration with attributable evidence and use the existing Operations, Finance and independent approval workflow.
5. Decide Standard, Express and Scheduled pricing independently only when commercial inputs and approvals exist.
6. Complete the shared pricing authority technical contract and its affected DB/API/security/acceptance gates before implementing customer pricing or quotes.

**Implementation authorization:** Once this decision is merged, application-code implementation is authorized only for the internal configurable activity-cost foundation in Sections 2–6. It is not blanket authorization for customer pricing, quote issuance/acceptance, booking, payment, DEC-047 eligibility, PUDO operations, custody, fulfilment or production release.

## 8. Preserved business and release gates

DEC-019/DEC-048 shared pricing authority, DEC-049 quote/booking/parcel boundaries, DEC-047's twelve unavailable-by-default service/endpoint combinations, DEC-050 responsibility boundaries, DB-01–DB-12 capability-specific contracts and DEC-036 production/release evidence remain in force. This decision does not assign the accountable Operations position, identify PUDO inventory, select service models, approve any rates/formulae/currency/fees/taxes or claim that any operational activity has started.

