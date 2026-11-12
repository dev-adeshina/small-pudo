# Operational Activity Cost Configuration — Technical Contract

**Status:** Internal operational-cost configuration foundation implemented: persistence/API (PR #125), staff interface (PR #133), and staff invitation/permission lifecycle integration (PRs #136–#137).
**Application-source baseline:** PR #137 merge `55dff8c2a4f4cf6f0e983676e692f0f126f7ec27`. PRs #138–#139 update documentation only.
**Related foundations:** PR #121 operational cost-definition persistence; PR #122 approval workflow; PR #123 owner-reviewed activity catalogue.  
**Scope:** Internal, server-authoritative configuration of operational activity costs. This contract does not authorize customer pricing or operational capability activation.

## 1. Purpose

Translate the owner-confirmed operational activity catalogue and cost direction into the smallest safe extension of the existing operational cost-definition foundation.

The system must allow VeriLyft to configure costs as the startup's activities, staffing arrangements, locations and supplier arrangements evolve. Cost values, units, currencies, bases and applicable inputs must not be hardcoded into application logic.

This is an internal configuration foundation. It is not a customer pricing engine, payroll system, accounting ledger, operational incident adjudication system or automatic cost calculator.

## 2. Accepted business direction

The following are treated as owner-confirmed requirements:

1. ACT-01–ACT-11 are the working operational activity families. ACT-12 remains inactive until Operations confirms the activity is actually performed or contractually required.
2. Each activity has an independently configurable cost definition and may declare its own applicable inputs.
3. Both VeriLyft-employed personnel and registered/authorised personnel may perform the same operational tasks. Personnel supplied through an InPUDO arrangement must be registered and approved by VeriLyft staff/agents before performing those tasks.
4. Cost arrangements must remain adaptable; no permanent wage model, partner model, cost amount, rate, unit, formula, currency, allocation method or customer charge is approved by this contract.
5. For damaged items, the sender and VeriLyft may bear costs depending on the circumstances and the resulting decision. The system must not automatically assign liability merely because damage is reported.
6. For RTS, the recipient or sender may bear the cost depending on the circumstances and applicable decision. The system must not automatically assign liability.
7. A cost-definition approval is separate from customer pricing, quotation, payment, payroll and the decision about who is financially responsible for an incident.
8. Historical approved versions and the exact version referenced by any later internal costing process must remain traceable.

These requirements do not constitute independent Operations validation, Finance approval or observed cost evidence.

## 3. Current source baseline — read-only findings

The bounded review covered the current operational cost-definition store, workflow store, workflow route, Firestore Rules, relevant Emulator tests and the three related SDD artifacts. It is not a full repository or production audit.

### 3.1 Existing persistence

The application already has:

- `operationalCostDefinitions/{definitionId}` as a definition-lineage document.
- `versions/{versionId}` as immutable version snapshots.
- Transaction-backed first-version creation.
- Transaction-guarded revisions using an expected current version number.
- Preservation of prior version snapshots.
- A guard preventing revision while review is active or after rejection.

The current immutable version payload persists activityCode (ACT-01–ACT-11), activityName, optional activityDescription, applicability (currently restricted to general), activity-specific inputs and costComponents.

Input metadata supports a stable key, label, optional description, value type (string, number, boolean or date), required flag, and optional source, unit, numeric precision and conversion description. Each cost component supports a stable key and label, optional description, optional decimal-string amount, optional three-letter uppercase currency code, optional basis, optional treatment string and optional evidence description.

The store validates unique input/component keys, supported activity codes, general-only applicability, decimal-string monetary representation, explicit currency and basis when an amount is supplied, and input precision constraints. The workflow submission guard requires at least one cost component and requires each submitted component to contain an amount, explicit currency, basis and evidence description. The version snapshot is persisted immutably and revised through the existing expected-version transaction.

**Remaining model limitations:** cost-component treatment is a free-form optional string rather than a controlled Finance-approved classification; evidence is a free-text description rather than a structured, independently addressable evidence record; no source-owner, source-type, observation-period, sample/method, limitations, Operations-validation or Finance-review evidence object is persisted on the component; and applicability is general-only. These are gaps to assess against the accepted requirements, not permission to create a parallel evidence registry or location model.

### 3.2 Existing approval and authorization

PR #122 provides:

- Four separate actors for proposal, Operations validation, Finance review and independent approval.
- Action-specific permissions:
  - `operational_cost_definition.propose`
  - `operational_cost_definition.validate`
  - `operational_cost_definition.finance_review`
  - `operational_cost_definition.approve`
- Permission assignments provisioned through a trusted Admin SDK process.
- Transactional workflow transitions and immutable decision events.
- An approved-version pointer on the definition lineage.

Approval does not publish or activate a customer pricing rule.

### 3.3 Existing API and Rules boundary

PR #125 added the list/create/read/revise API routes over the existing store, plus the existing workflow transition route. The API requires a valid, non-revoked Firebase ID token and the dedicated action permission. PR #133 added the staff interface at /admin/operational-cost-definitions, reusing those APIs, stores and workflow; it did not add a new persistence model or workflow engine. PRs #136–#137 added staff invitation/activation and permission-administration foundations and expiry enforcement in the operational-cost workflow store. The current UI exposes activity identity, applicable inputs and cost-component fields, and explicitly states that saving or approving a definition does not calculate customer prices, issue quotations, activate services or authorize parcel operations.

Firestore Rules explicitly deny client reads and writes to operational cost definitions and versions. Staff action permission records are also server-only/default-denied to clients. The Admin SDK is the existing persistence boundary.

## 4. Recommended domain boundary

Keep the existing definition lineage, immutable version snapshots and approval workflow. Extend them rather than creating a parallel collection, workflow engine or permission system.

A version should describe:

1. **Activity identity:** a stable catalogue reference for ACT-01–ACT-11, with ACT-12 unavailable until Operations confirms it.
2. **Activity description:** the human-readable activity name and description already supported.
3. **Applicability:** the current implementation supports general applicability only. The source trace found no authoritative PUDO location registry or active location-management service in the current application source. The existing shipment-draft origin/destination strings are not stable location identities. Location-specific definitions are deferred until an authoritative location model exists; no location registry or surrogate location ID is introduced here.
4. **Operational inputs:** the existing activity-specific input metadata, extended only when a validated activity requires it.
5. **Cost components:** one or more independently configurable cost entries associated with the activity version.

A cost component should be able to describe, without application hardcoding:

- a stable component key and human-readable label/description;
- a configurable monetary amount represented without binary floating-point rounding;
- an explicit currency code, with no default currency;
- a configurable basis/unit label, with no assumed per-parcel, per-trip, time, distance or other unit;
- a Finance-reviewed treatment classification where applicable (direct, shared, included or exception);
- source/evidence description and an optional reference to an existing authorised evidence record, if such a record type is identified by source review.

No actual values, currencies, bases, treatment classifications or formulas are supplied or approved here. A draft may be incomplete while being prepared; submission for review must enforce only the minimum fields approved in the eventual implementation contract. The implementation must not invent a default amount, currency, unit or formula.

## 5. Configuration and version lifecycle

1. A proposer creates a draft definition/version through the existing server-side store boundary.
2. The proposer may revise a draft by creating a new immutable version, subject to the existing current-version concurrency check.
3. Submission and subsequent review use the existing PR #122 workflow.
4. Operations validates whether the activity, scope, operational inputs and supporting operational evidence are accurate.
5. Finance reviews the cost evidence, amount/currency/basis, direct/shared/included/exception treatment and duplicate-cost risk.
6. An independent approver approves or rejects the reviewed version.
7. Any change to an approved definition creates a new version; it never edits the approved snapshot.
8. The approved-version pointer remains a reference to the approved definition version. Approval alone does not activate pricing, customer quotation, payroll, payment, reimbursement or automatic cost calculation.

The four-person separation and existing action permissions remain unchanged for this slice.

## 6. Applicability and future flexibility

- Keep activity identity separate from the scope in which a cost definition applies.
- Prefer a general definition where one configuration genuinely applies across the operation.
- Permit a location-specific definition only by referencing the existing authoritative PUDO location identity after source traceability is confirmed.
- Do not invent location records, personnel categories, employment statuses, partner types or persisted enums in this slice.
- Personnel supplied by an InPUDO agent and VeriLyft-employed personnel may perform the same activity. If their cost treatment differs, represent that difference through separately scoped, approved definitions only after the relevant operating arrangement and source identity are established.
- Do not assume that every activity occurs at every location or under every service/endpoint combination.
- ACT-12 remains unavailable until Operations confirms actual activity and scope.

## 7. Cost responsibility and incident boundary

Cost configuration must not decide who is liable for a damaged or missing parcel, failed attempt or RTS event.

For damage and RTS:

- preserve the operational incident and its evidence separately from cost configuration;
- record the authorised responsibility decision separately from the cost definition;
- allow the applicable cost to be identified/configured without automatically charging the sender, recipient, partner or VeriLyft;
- retain the decision actor, reason, timestamp and supporting evidence when a responsibility decision is later implemented;
- do not infer a percentage split or automatic liability from the owner's high-level direction.

Incident case management and financial responsibility execution remain separate future contracts unless an already-approved source contract explicitly covers them.

## 8. API and staff interface boundary

PR #125 implements the list, create, read and revise API operations over the existing stores. The existing workflow route/store remains authoritative for submission, Operations validation, Finance review, changes requested, independent approval and rejection.

The bounded staff-facing interface is authorized at `/admin/operational-cost-definitions`. It may:
- list and read definitions, immutable versions and workflow events;
- create an incomplete draft using the existing activity catalogue ACT-01–ACT-11;
- revise an eligible current version into a new immutable version;
- invoke only the existing workflow transitions and display their server-confirmed outcomes.

The page uses the existing Admin page access guard. That page guard is not a substitute for the action-level permission checks on every API request. The API requires a valid, non-revoked Firebase bearer token and:
- `operational_cost_definition.view` for list/read;
- `operational_cost_definition.propose` for create/revise;
- `operational_cost_definition.propose`, `validate`, `finance_review` or `approve` as appropriate for workflow transitions.

The server store enforces the active audited permission assignment and the four-person separation of duties. Admin status alone grants none of these permissions. Permission assignment remains outside the application through the trusted Admin SDK process. No staff permission-grant UI or endpoint is included.

The interface is an internal configuration tool only. It must make the non-activation boundary explicit and must not present a definition approval as a customer price, quote, service approval or operational authorization.## 9. Bounded staff-interface implementation slice

The implementation reuses PR #125 APIs and existing stores; it does not extend the persistence model or workflow engine.

1. Add the staff-facing management page and existing-Admin dashboard entry.
2. Support incomplete draft creation and revision through the existing API. Revisions must include the current expected version number and create a new immutable version.
3. Display current definition details, operational inputs, cost components, workflow state, version history and immutable decision events.
4. Expose existing workflow actions only for the corresponding states. The server remains authoritative for action permission, actor separation, current-version checks, evidence requirements and transition outcomes.
5. Show API authorization/validation failures without treating Admin access as action permission.
6. Keep Firestore client Rules default-deny for definitions, versions, workflow records and staff permissions.
7. Keep ACT-12, location-specific scope, customer pricing, cost calculation, service activation and operational execution outside this interface.
8. Update the SDD progress, backlog, issue register and handoff in the same PR; record only checks actually run and reported.

General applicability only is supported until an authoritative PUDO location identity exists. Incomplete drafts may be prepared; the existing server workflow still rejects submission unless the current version meets its minimum cost-component and evidence requirements. Operations and Finance validation remain required.
## 10. Explicit exclusions

This slice does not implement:

- cost calculation, aggregation, allocation or accounting recognition;
- customer pricing, delivery fees, quote calculation, quote issuance or quote acceptance;
- publication/activation of cost definitions or automatic consumption by another subsystem;
- staff payroll, wages, productivity targets, reimbursements or compensation execution;
- automatic damage, loss, failed-attempt or RTS liability assignment or customer charging;
- payment, refunds, settlement or partner invoicing;
- route planning, dispatch, parcel intake, custody transfer or delivery execution;
- ACT-12 activity activation;
- staff permission-grant UI/API or a generic workflow engine;
- new location registry, partner registry or personnel identity system.

DEC-047 service/endpoint combinations remain unavailable pending their independent verification. M0 regression requirements and DEC-036 P0/Conditional P0 release evidence remain separate.

## 11. Acceptance criteria for the contract

The implementation and interface are acceptable only when:

- every field is traceable to an owner-confirmed requirement or a clearly labelled technical recommendation;
- the existing location identity source is confirmed before location-scoped records are implemented;
- read/list authorization is explicitly approved before read APIs are exposed;
- monetary representation preserves precision and requires an explicit currency without selecting a default;
- cost basis remains configurable and no unit/formula is assumed;
- every revision creates a new immutable version and stale writes cannot overwrite the current version;
- the existing four-person approval workflow remains authoritative;
- approval does not activate customer pricing or operational execution;
- direct client access remains denied and all server mutations enforce action-specific authorization;
- existing Emulator tests continue to cover persistence, concurrency, version history, permissions and denial cases;
- browser checks confirm permitted view/propose/review actions and server-side denial for users without the corresponding permission;
- no UI action bypasses the existing four-person separation or presents approval as customer pricing/service activation.

## 12. Current conclusion

PRs #121–#125 provide the versioned persistence, four-person approval workflow, owner-reviewed activity catalogue, technical contract and server APIs. The current bounded interface extends those existing foundations for staff usability only. It does not change the policy, persistence, action permissions or workflow authority. Independent Operations validation, Finance review and source-backed evidence remain necessary before actual cost definitions can progress through approval. Customer pricing, quote issuance, service eligibility, PUDO activation, payroll, incident liability and operational execution remain outside this scope.

## 13. PR #137 current-source reconciliation — 5 November 2026

The later source-aligned review supersedes the stale statements in earlier sections that described cost components or the staff interface as absent. The current application-source baseline is PR #137 (55dff8c2a4f4cf6f0e983676e692f0f126f7ec27); PRs #138 and #139 are documentation-only.

### Confirmed source paths

- lib/server/operational-cost-definition-store-core.ts: persists activityCode, activityName, activityDescription, applicability, inputs and costComponents inside immutable version snapshots.
- lib/server/operational-cost-definition-workflow-store-core.ts: enforces the existing Operations → Finance → independent approval transitions, action-specific permission checks, actor separation and submission completeness.
- app/api/admin/operational-cost-definitions/route.ts and sibling definition/workflow routes: server-authoritative list/create/read/revise and workflow operations.
- app/admin/operational-cost-definitions/page.tsx: staff-facing management interface; it reuses the existing API and clearly labels the tool as internal configuration only.
- tests/operational-cost-definition-store.test.mjs and tests/operational-cost-definition-workflow.test.mjs: store, version, validation and workflow test sources.
- firestore.rules: direct client access to operational-cost definitions and versions remains denied.

### Exact persisted cost-component boundary

A cost component currently supports key, label, optional description, amount, currencyCode, basis, treatment and evidenceDescription. Amounts are non-negative decimal strings, not JavaScript floating-point values. If an amount is supplied, the store requires a three-letter uppercase currency code and a non-empty basis. Submission requires a non-empty component array and requires amount, currency, basis and evidence description for every component.

This is a useful configurable foundation, but it is not yet the complete evidence register described in the M2 package. In particular, treatment is not constrained to an approved classification vocabulary; evidence remains descriptive text rather than a structured source reference with owner/type/period/scope/measurement/limitations and reviewer outcomes; and there is no automatic calculation, aggregation, allocation or shipment-cost consumption.

### Applicability, governance and boundaries

- Only general applicability is supported. No location-specific applicability or authoritative PUDO registry is established by this source.
- ACT-01–ACT-11 are accepted by the store; ACT-12 is rejected.
- Existing permissions are operational_cost_definition.view, operational_cost_definition.propose, operational_cost_definition.validate, operational_cost_definition.finance_review and operational_cost_definition.approve. The staff-management source enforces designated permission-administrator authority for assignments; the operational-cost workflow continues to enforce the four distinct proposal/review/approval actors.
- Approval remains an internal cost-definition outcome. It does not publish customer prices, calculate shipment costs, issue quotes, activate a service, or authorize physical operations.
- No cost-definition collection, duplicate workflow, parallel permission catalogue or new evidence registry is approved by this reconciliation.

**Verification boundary:** the source paths above were read at the PR #137 application-source baseline. The owner reported 100/100 Firestore Emulator-backed tests, TypeScript, lint, production build and git diff --check passing after PR #137. This documentation review did not rerun those commands or inspect production data/runtime state.

### 13.1 ACT-04 transport arrangement metadata — Chunk 3 Part 1

**Scope:** Vehicle and transport arrangement metadata on ACT-04 operational cost components.

**Status:** Implementation and documentation complete; focused PR review and merge pending.

The existing operational-cost definition lineage, immutable version snapshots, server-side persistence boundary and four-person approval workflow remain authoritative. This change extends the existing cost-component schema; it does not introduce a parallel transport-cost model, collection, workflow, permission or approval process.

#### ACT-04 component metadata

An ACT-04 cost component may optionally record:

- `transportArrangement`:
  - `business_owned_vehicle`
  - `driver_owned_vehicle`
  - `external_transport_partner`
- `agreementBasis`:
  - `per_trip`
  - `distance`
  - `per_parcel`
  - `fixed`
  - `time`
  - `hybrid`
  - `negotiated`

Both fields are optional. An unspecified value remains unspecified; the system must not infer or select a default arrangement or agreement basis. These fields are descriptive metadata and do not establish a cost amount, payment obligation, reimbursement entitlement, cost allocation or customer charge.

The metadata is permitted only on ACT-04 components. Unsupported values and use on other activity codes must be rejected by server-side validation.

#### Cost and evidence boundaries

Transport metadata does not replace or relax the existing cost-component configuration requirements. A component submitted for review must continue to satisfy the existing configuration-state, amount, currency, cost-basis, treatment-classification and structured-evidence requirements.

In particular:

- A driver-owned vehicle or external transport-partner arrangement does not, by itself, establish a separate fuel or vehicle-operating-expense payment.
- No separate fuel or operating-expense reimbursement is to be assumed on top of a driver or partner charge unless an actual agreement or source record establishes that separate payment.
- Business-owned vehicle cost treatment remains unconfigured until supported by actual source records and the existing Operations and Finance review.
- The `agreementBasis` metadata is not a substitute for the existing cost-component `basis` field.

#### Versioning and approval

The metadata is stored as part of the existing immutable cost-definition version. Revisions continue to create new versions under the existing concurrency and lineage rules. Historical versions remain unchanged.

Submission, Operations validation, Finance review and independent approval continue through the existing workflow, permissions and four-person separation of duties. Transport metadata does not bypass submission evidence requirements or create an alternative approval path.

#### Explicit exclusions

This slice does not implement or authorize:

- transport rates, monetary defaults, coefficients or calculation formulas;
- automatic fuel, vehicle or driver-expense reimbursement;
- route-distance measurement, distance bands or route-based pricing;
- automatic cost aggregation, allocation or shipment-cost consumption;
- customer-facing prices, quotations or charges;
- service activation under DEC-047 or physical operational execution.

These remain subject to their own evidence, business decisions and implementation gates.
