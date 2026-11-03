# Operational Activity Cost Configuration — Technical Contract

**Status:** Proposed technical contract; owner approval required before application-code changes.  
**Repository baseline:** `main` at PR #123 merge commit `e687750bb86fd998a99bcdcd5502238dcca24de1`.  
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

The current version payload contains `activityName`, `activityDescription` and `inputs`. Input metadata supports string, number, boolean and date types, with optional source, unit, precision and conversion descriptions.

**Current gap:** the persisted version describes activity/input metadata. It does not yet represent configurable monetary cost components, their currency and basis, or an applicability scope.

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

The current application has a workflow transition route. The bounded repository tree review did not find create, revise, list or read API routes for operational cost definitions, nor a management UI.

Firestore Rules explicitly deny client reads and writes to operational cost definitions and versions. Staff action permission records are also server-only/default-denied to clients. The Admin SDK is the existing persistence boundary.

## 4. Recommended domain boundary

Keep the existing definition lineage, immutable version snapshots and approval workflow. Extend them rather than creating a parallel collection, workflow engine or permission system.

A version should describe:

1. **Activity identity:** a stable catalogue reference for ACT-01–ACT-11, with ACT-12 unavailable until Operations confirms it.
2. **Activity description:** the human-readable activity name and description already supported.
3. **Applicability:** the scope in which the definition applies. The contract recommends supporting a general definition and, when backed by an existing authoritative location identity, a location-specific definition. The implementation must reuse the existing location identity and must not create a new location registry. The exact location source/path must be confirmed during the focused implementation source trace before a location reference is persisted.
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

## 8. API and UI recommendation

The current workflow endpoint remains the only discovered application route for this feature. The recommended next application slice is a server-only management API backed by the existing stores, with no customer-facing surface.

Proposed operations:

- create a draft definition/version;
- retrieve a definition and its version/workflow history;
- revise the current eligible version into a new immutable version;
- invoke the existing workflow transition endpoint for submit, validation, Finance review, changes requested, approval or rejection.

Mutating definition operations must use the authenticated Firebase UID and the existing `operational_cost_definition.propose` permission. Workflow transitions continue to use their existing action-specific permissions.

**Read authorization is an explicit contract item:** the existing permission set has no read/view action. Before exposing list/read APIs or a management UI, approve a dedicated `operational_cost_definition.view` permission or another explicit least-privilege read rule. Do not silently treat general Admin access or possession of a mutation permission as unrestricted read authority.

No staff-management UI or permission-grant endpoint is included. Permission provisioning remains outside the application through the trusted Admin SDK process.

## 9. First implementation slice — proposed boundary

After this contract is approved, implement one bounded internal configuration slice:

1. Extend the existing version input model and validation to support activity identity, approved applicability representation and configurable cost components.
2. Preserve transaction-backed create/revise semantics and immutable snapshots.
3. Add only the server API operations required to create, retrieve and revise internal definitions, with explicit action-level authorization. Read routes remain blocked until the read permission decision in Section 8 is approved.
4. Reuse the existing workflow route/store and four-person separation; do not duplicate workflow state or events.
5. Keep Firestore client Rules default-deny for definitions, versions, workflow records and staff permissions.
6. Add synthetic Firestore Emulator integration tests for create, read authorization, revision, stale-version conflict, immutable history, validation failures and approved-version lineage.
7. Add Rules-denial tests for unauthenticated, ordinary-customer and generic-admin clients.
8. Update the SDD progress record with actual code commit and test evidence after implementation.

The exact location reference and read permission must be resolved before their corresponding API capabilities are implemented. No location model or permission is to be invented in code.

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
- staff-management UI, permission-grant API or a generic workflow engine;
- new location registry, partner registry or personnel identity system.

DEC-047 service/endpoint combinations remain unavailable pending their independent verification. M0 regression requirements and DEC-036 P0/Conditional P0 release evidence remain separate.

## 11. Acceptance criteria for the contract

The implementation contract is ready only when:

- every field is traceable to an owner-confirmed requirement or a clearly labelled technical recommendation;
- the existing location identity source is confirmed before location-scoped records are implemented;
- read/list authorization is explicitly approved before read APIs are exposed;
- monetary representation preserves precision and requires an explicit currency without selecting a default;
- cost basis remains configurable and no unit/formula is assumed;
- every revision creates a new immutable version and stale writes cannot overwrite the current version;
- the existing four-person approval workflow remains authoritative;
- approval does not activate customer pricing or operational execution;
- direct client access remains denied and all server mutations enforce action-specific authorization;
- emulator acceptance tests cover persistence, concurrency, version history, permissions and denial cases.

## 12. Decision requested

Approve or amend this technical direction before code implementation, particularly:

1. The proposed versioned cost-component representation (configurable amount, explicit currency, configurable basis and evidence description; no formula).
2. General definitions with optional location-specific overrides, using only the existing authoritative location identity.
3. A dedicated least-privilege view permission before any list/read API is exposed.
4. The bounded first implementation slice and its exclusions.

**Current conclusion:** PRs #121–#123 provide the persistence, approval and owner-reviewed activity foundations. The next code slice should extend those foundations into configurable internal activity-cost definitions while keeping pricing, payroll, incident liability and operational execution outside the scope.
