# Operational Cost Definition Approval Foundation

**Scope:** PR #122 implementation record.  
**Status:** Implemented and verified on PR head `01d1933f398b549d9d62cf00f4198dc8c3a1ebab`.

## Authority and provisioning boundary

The workflow does not treat an Admin claim, an active `adminAccess` record, or authentication alone as authority to act.

Each action is authorized by an active record at:

```text
staffActionPermissions/{uid}/permissions/{permissionId}
```

The permission IDs are:

- `operational_cost_definition.propose`
- `operational_cost_definition.validate`
- `operational_cost_definition.finance_review`
- `operational_cost_definition.approve`

Assignments are provisioned outside the application request surface through a trusted Firebase Admin SDK process. Assignment records must retain the assigning authority, reason and assignment timestamp. This PR does not provide a permission-grant API or staff-management UI. Client access to these records is denied by Firestore's default-deny rules.

## Workflow persistence

The existing `operationalCostDefinitions/{definitionId}` lineage and immutable `versions/{versionId}` snapshots are retained.

Each version has a separate workflow document:

```text
operationalCostDefinitions/{definitionId}/versions/{versionId}/approval/workflow
  state
  proposerUid
  operationsValidatorUid
  financeReviewerUid
  independentApproverUid
  createdAt
  createdBy
  updatedAt
  updatedBy

operationalCostDefinitions/{definitionId}/versions/{versionId}/approval/workflow/events/{eventId}
  action
  actorUid
  previousState
  resultingState
  reason
  timestamp
```

Workflow state and decision history are separate from the immutable version snapshot. The definition lineage records the last approved version ID and number. Approval does not publish or activate a customer pricing rule.

## State transitions

- `draft` → `pending_operations_validation` by submit.
- `pending_operations_validation` → `pending_finance_review` by Operations validation.
- `pending_operations_validation` → `changes_requested` by Operations.
- `pending_finance_review` → `pending_independent_approval` by Finance review.
- `pending_finance_review` → `changes_requested` by Finance.
- `pending_independent_approval` → `approved` or `rejected` by the independent approver.

A reason is mandatory for return-for-changes and rejection. Each transition and its event record are written in one Firestore transaction. Only the current version can advance. A repeated or concurrent transition cannot advance the same stage twice.

## Separation of duties

For one version, the proposer, Operations validator, Finance reviewer and final approver must be four different UIDs. The proposer cannot validate or approve their own proposal. Operations and Finance reviewers cannot perform the final approval. These constraints are checked server-side in the transactional workflow store.

A returned proposal must be revised into a new version before it can be resubmitted. An unsubmitted draft may also be superseded by a new immutable version. A version cannot be superseded while Operations, Finance or independent approval is in progress, or after rejection. A new version may be submitted when its predecessor was an unsubmitted draft, had changes requested, or was previously approved. The prior version and its decision events remain available for audit.

## API and security

The workflow transition endpoint verifies the Firebase ID token with revocation checking and derives the actor UID from the verified token. It does not accept an actor UID from the request body. The server store checks the action-specific permission before applying the transition.

Firestore client access to operational cost definitions and workflow records remains denied. Staff permission assignment records are also server-only. The Admin SDK is the only persistence path in this slice.

## Deliberate exclusions

No cost values, formulas, pricing calculations, quote generation, automatic activation, payroll, generic approval engine, Finance portal, staff-management UI, or permission-grant endpoint is introduced.

## Verification

On PR head `01d1933f398b549d9d62cf00f4198dc8c3a1ebab` (`01d1933`), the Firestore Emulator-backed test suite passed **70 tests with 0 failures**. The standalone TypeScript check (`npx tsc --noEmit`), ESLint (`npm run lint`) and production build (`npm run build`) also passed. The production build compiled successfully, completed its TypeScript stage and generated all static pages. The Firestore permission-denied log entries are expected assertions from tests that verify denied client access; they did not represent test failures.
