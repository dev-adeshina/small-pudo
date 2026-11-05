# M2 Stage 0 — Structured Cost Evidence Technical Contract and Acceptance Plan

**Status:** Proposed source-aligned technical contract for owner review. No application-code implementation is authorized by this document.  
**Source baseline:** `main` at PR #141 merge `0ed56ee0e62b6792d7b3b4e0d5af4fc982e1d199`.  
**Application-source baseline:** PR #137 merge `55dff8c2a4f4cf6f0e983676e692f0f126f7ec27`; the relevant current source paths were re-read at the PR #141 merge baseline.  
**Scope:** Internal structured evidence attached to existing operational-cost components and immutable definition versions.  
**Purpose:** Close Stage 0 of `PLATFORM_M2_IMPLEMENTATION_READINESS_AND_STAGED_PLAN.md` and provide one review checkpoint for the exact Stage 1 code scope and acceptance matrix.

---

## 1. Stage 0 decision

The current implementation already provides the definition lineage, cost components, immutable versions, server-side APIs, staff interface, action permissions, and separated Operations → Finance → independent approval workflow.

The first implementation slice should **add structured evidence metadata inside each existing cost component**, persisted as part of the existing immutable version snapshot.

Do not create:
- a new evidence collection, registry, document store or generic evidence service;
- a second cost-definition store or workflow;
- a new permission family or staff role;
- a cost calculation, aggregation, allocation or pricing capability;
- a customer-facing route, API, quote, booking or operational action.

This is a recommended contract, not an owner-approved data-model change. Stage 1 remains blocked until the owner approves this document and its exact implementation scope.

## 2. Re-inspected source baseline

The following paths were inspected on current `main` at `0ed56ee0e62b6792d7b3b4e0d5af4fc982e1d199`:

| Area | Current source | Observed behaviour relevant to this contract |
|---|---|---|
| Component model and validation | `lib/server/operational-cost-definition-store-core.ts` | `OperationalCostComponentInput` currently supports `key`, `label`, optional `description`, decimal-string `amount`, `currencyCode`, `basis`, free-form `treatment` and free-text `evidenceDescription`. Strict plain-map and allowed-key validation is used. |
| Definition persistence | Same store core; `lib/server/operational-cost-definition-store.ts` | Definition lineage is stored in `operationalCostDefinitions/{definitionId}`; each immutable version is stored in its `versions/{versionId}` subcollection. Create and revise operations use Firestore transactions. |
| Version concurrency | Same store core | Revisions require `expectedCurrentVersionNumber`; stale revisions return `stale_version`; a successful revision creates a new version and advances the lineage pointer. Prior snapshots are retained. Revision is blocked while review is active or after rejection. |
| Workflow validation and transitions | `lib/server/operational-cost-definition-workflow-store-core.ts` | Submission currently requires at least one component, with amount, uppercase three-letter currency code, basis and non-empty `evidenceDescription`. Operations validation, Finance review and independent approval are separate transitions. |
| Workflow audit | Same workflow store core | Each transition creates an event containing action, actor UID, previous/resulting state, reason and timestamp. Approval updates the approved-version pointer on the lineage document. |
| Request authorization | `lib/server/operational-cost-definition-request-auth.ts` | Definition list/read and create/revise requests verify a Firebase ID token with revocation checking and require the corresponding active audited action permission. |
| API routes | `app/api/admin/operational-cost-definitions/route.ts`; `[definitionId]/route.ts`; `[definitionId]/workflow/route.ts` | Existing list/read/create/revise and workflow routes call the existing stores. The workflow route verifies the token with revocation checking; the workflow store checks the action permission and separation of duties. |
| Staff interface | `app/admin/operational-cost-definitions/page.tsx` | The existing page edits the current component fields, saves drafts/revisions through the existing API, invokes the existing workflow and displays immutable versions/events. Evidence is currently a single free-text field. |
| Client security | `firestore.rules` | Client reads and writes are denied for operational cost definitions, versions and staff action permissions. Admin SDK is the persistence boundary. |
| Existing tests | `tests/operational-cost-definition-store.test.mjs`; `tests/operational-cost-definition-workflow.test.mjs`; `tests/firestore.rules.test.mjs`; `tests/staff-action-permissions.rules.test.mjs` | Existing test foundations cover version creation/revision, stale and concurrent revisions, incomplete drafts, monetary validation, workflow actor separation, expiry, immutable decision events and direct-client denial. |

The repository tree contains no authoritative structured cost-evidence record or evidence registry. The image-upload route is not an evidence-domain store and must not be repurposed as one without a separate contract.

**Evidence limit:** This is a read-only source inspection. No tests, build, emulator, browser, production configuration or Firestore data were executed or inspected for this Stage 0 review.

## 3. Proposed component representation

### 3.1 Keep the existing component envelope

Retain the current fields and their meanings:

| Field | Contract |
|---|---|
| `key` | Existing stable component identifier; unchanged. |
| `label` | Existing human-readable label; unchanged. |
| `description` | Existing optional description; unchanged. |
| `amount` | Existing optional non-negative decimal string; no JavaScript floating-point arithmetic. |
| `currencyCode` | Existing explicit uppercase three-letter code when an amount is present; no default currency. |
| `basis` | Existing optional free-text basis/unit; no assumed per-parcel, per-trip, distance, time or other basis. |
| `treatment` | Preserve as a legacy free-form field for compatibility and historical display. Do not silently reinterpret it. |
| `evidenceDescription` | Preserve as a legacy narrative field. Do not delete, overwrite or automatically convert it. |

### 3.2 Add structured evidence items

Recommended additive field:

```ts
interface OperationalCostEvidenceItem {
  sourceReference: string;
  sourceOwner: string;
  sourceType: string;
  representedScope: string;
  observationPeriod: {
    startDate?: string;
    endDate?: string;
    description?: string;
  };
  coverage: string;
  collectionMethod: string;
  originalValue?: string;
  originalUnit?: string;
  originalCurrencyCode?: string;
  originalPrecision?: number;
  limitations?: string;
}

interface OperationalCostComponentInput {
  // Existing fields remain unchanged.
  evidenceItems?: OperationalCostEvidenceItem[];
}
```

This is a **proposed TypeScript shape for review**, not code already present.

#### Field semantics

- `sourceReference`: stable identifier or locator for the authoritative source record. It is a reference, not a new upload or document store.
- `sourceOwner`: organisation, counterparty, system or accountable source that owns or issued the evidence. Do not infer an owner from the staff member who entered it.
- `sourceType`: descriptive source category, kept configurable text rather than a hard-coded enum. Examples are illustrative only and do not approve any source.
- `representedScope`: what activity, supplier arrangement, journey, location or operating population the evidence actually represents. Do not imply universal applicability.
- `observationPeriod`: date-only `YYYY-MM-DD` start/end where known, or a descriptive period when the source has no meaningful date range. If dates are supplied, both must be valid and ordered. Do not invent dates.
- `coverage`: sample, population, quantity or coverage represented by the source; explicitly describe the coverage rather than implying a representative sample.
- `collectionMethod`: how the source value was obtained, observed or measured.
- `originalValue`, `originalUnit`, `originalCurrencyCode`, `originalPrecision`: preserve the source's original value and representation when relevant. Keep the value as a string to preserve precision. If an original value is supplied, its unit/precision must be recorded where relevant; if monetary, its original currency must be explicit. No conversion or calculation is performed.
- `limitations`: known limitations, exclusions, uncertainty or data-quality caveats. An absent value must not be represented as proof that no limitations exist.

An evidence item describes a source and its context; it is not itself an approval, a financial responsibility decision, a calculation or permission to consume the component in customer pricing.

### 3.3 Evidence cardinality

Recommendation: allow multiple evidence items on a component. A cost component may be supported by more than one source, and a single source may cover only part of the represented scope. The list must preserve the order supplied by the proposer and must not merge, deduplicate or aggregate evidence automatically.

A component may be saved as an incomplete draft with no evidence items. Submission for review should require at least one valid structured evidence item for each cost component. This is stricter than the current free-text-only submission rule and is the proposed Stage 1 validation change.

No binary attachments, raw file contents, credentials, personal secrets or unnecessary personal data should be embedded in the component. If a source is access-controlled, the reference must point to an authorised source location; this slice does not implement evidence access or disclosure.

## 4. Treatment classification

Recommended additive field: `treatmentClass`, with the controlled values:

- `direct`
- `shared`
- `included`
- `exception_related`

Preserve the existing free-form `treatment` value unchanged for historical compatibility. Do not automatically map old text into a new value. A new value is a proposal to be reviewed, not a financial allocation instruction.

The proposed controlled value must not trigger cost allocation, duplication removal, customer charging, liability assignment, pricing or any calculation. Shared-cost allocation remains unapproved and out of scope. Finance review remains the existing authority for the treatment classification; no new approval stage is added.

**Submission recommendation:** require a valid `treatmentClass` for newly submitted versions. Existing legacy versions remain readable even when this field is absent. A revised version must explicitly choose a controlled value rather than inherit a guessed classification.

## 5. Legacy compatibility and immutable version rules

1. Existing versions without `evidenceItems` or `treatmentClass` remain valid historical snapshots and remain readable.
2. The existing `evidenceDescription` and `treatment` fields remain available and unchanged. No destructive migration or background backfill is permitted.
3. Existing draft records remain editable through the current revision path.
4. New drafts may omit structured evidence and treatment classification while being prepared.
5. A new submission must satisfy the proposed structured-evidence and controlled-treatment requirements.
6. A legacy version may remain approved as a historical record. The system must not silently mark it as newly compliant with the new evidence requirements.
7. A revised version is a new immutable snapshot. It may copy legacy narrative fields for continuity, but the proposer must add structured evidence and explicitly select the treatment classification before submission.
8. Do not rewrite an old version to retrofit evidence. The approved-version pointer and prior snapshots remain governed by the existing store/workflow.
9. A stale revision remains a conflict; no last-write-wins behaviour is introduced.
10. No workflow event schema change is required for this slice. The existing event already records reviewer identity, action, state transition, reason and timestamp. Do not duplicate those facts inside every evidence item.

## 6. Validation contract

All new validation belongs in the existing server-side store boundary. UI validation is for usability only and cannot replace server validation.

### 6.1 Component-level validation

- Continue all existing strict-map, supported-key, stable-key, unique-key, string-length, decimal-string, currency and basis validation.
- Accept only the explicitly supported new fields; reject unknown fields.
- `evidenceItems` must be an array when supplied. Every item must be a plain map with only the documented keys.
- Each item must have non-empty `sourceReference`, `sourceOwner`, `sourceType`, `representedScope`, `coverage` and `collectionMethod`.
- `observationPeriod` must be a plain map. If dates are used, both dates must be valid date-only strings and start must not be after end. If the source has no meaningful date range, a non-empty description must explain the period representation.
- Optional original-value fields must be internally consistent. Preserve original value as a string; do not parse it into a floating-point number. If `originalValue` is supplied, require the applicable unit and precision; if the source value is monetary, require an explicit uppercase three-letter original currency code.
- `originalPrecision` must be a non-negative safe integer when supplied.
- Optional descriptive fields must have explicit maximum lengths. The exact caps must be selected consistently with the existing validation conventions and reviewed before implementation; do not silently truncate.
- Do not accept an empty object as an evidence item. Do not treat a placeholder, whitespace or the word "unknown" as a source reference.

### 6.2 Draft and submission rules

| Operation | Required behaviour |
|---|---|
| Create draft | Existing minimum activity/component structure; evidence and treatment may be incomplete. |
| Save revised draft | Same draft allowance, subject to existing expected-version and workflow-state guards. |
| Submit for Operations validation | At least one component; every component has existing amount/currency/basis requirements, at least one valid structured evidence item, and a controlled treatment classification. |
| Operations validation | Existing actor/state rules remain authoritative. The validator reviews activity/scope and evidence relevance; outcome is recorded by the existing workflow event. |
| Finance review | Existing actor/state rules remain authoritative. Finance reviews source quality, amount/currency/basis, treatment classification, duplication/inclusion and limitations; no calculation is performed. |
| Independent approval | Existing actor/state rules remain authoritative. Approval approves the exact immutable definition version only; it does not activate any other capability. |

If a required source fact is unavailable, the proposer must obtain the source or keep the draft unsubmitted/request changes. Do not invent zero, a default, an inferred period, a conversion or a representative sample.

## 7. API, UI, security and persistence impact

### Existing components to extend

- `lib/server/operational-cost-definition-store-core.ts`: add types and strict validation for the new optional fields; preserve existing validation and Firestore transaction semantics.
- `lib/server/operational-cost-definition-workflow-store-core.ts`: extend the current submission guard to validate structured evidence and `treatmentClass`; preserve current action permissions, actor separation, state transitions and immutable event writes.
- `app/admin/operational-cost-definitions/page.tsx`: add repeatable evidence-item editing and controlled treatment selection; display legacy narrative separately from structured evidence; make incomplete draft versus submission requirements clear.
- Existing list/read/create/revise/workflow API routes: reuse without adding routes or weakening authentication/authorization.
- `firestore.rules`: preserve explicit client denial; no client-side writes or new collection.
- Existing store/workflow/Rules tests: extend the current Emulator-backed suites; no parallel test framework.

### Persistence shape

The new fields are nested in the existing version's `costComponents` array. They are written by the existing Admin SDK transaction and become part of the immutable version snapshot. There is no additional collection, document reference, query, index or migration.

### Authorization and workflow

- Reuse `operational_cost_definition.view`, `propose`, `validate`, `finance_review` and `approve`.
- Do not add permission IDs or infer authority from Admin status.
- Do not change the existing four-person separation or permission-expiry checks.
- Do not allow the proposer to validate, Finance to review their own proposal/Operations validation, or any prior actor to independently approve.
- Keep the existing workflow event as the authoritative record of review actor, decision, reason and timestamp.
- The workflow API must remain server-authoritative and token-revocation checked.

## 8. Stage 1 implementation boundary

If and only if this contract is approved, Stage 1 may:

1. Add the optional `evidenceItems` and `treatmentClass` fields to the existing component type.
2. Add strict server validation for those fields.
3. Tighten the submission guard for newly submitted versions.
4. Extend the existing staff page to create, edit, read and review the new fields.
5. Preserve legacy `evidenceDescription` and `treatment` without migration or destructive conversion.
6. Add/extend unit and Emulator acceptance tests.
7. Update SDD status/traceability after the implementation PR is complete.

Stage 1 must not:
- create or change collections, subcollections, Firestore Rules permissions or permission assignments;
- change the workflow states, actor model, event schema or approval authority;
- add evidence uploads, a file/document store or a new evidence registry;
- calculate, aggregate, allocate, normalize, convert or consume costs;
- introduce location applicability, ACT-12, personnel/partner registries or new operational input catalogues;
- publish rates, create shared pricing rules, calculate customer prices, issue/accept quotes or confirm bookings;
- add payment, payroll, reimbursement, incident-liability, PUDO, route, dispatch, intake, custody or fulfilment behaviour.

## 9. Acceptance and executable test matrix

The following cases are the minimum Stage 1 acceptance suite. They are test specifications, not claims that tests have been written or run.

| ID | Scenario | Expected result |
|---|---|---|
| CE-01 | Create a draft with no evidence items and no treatment classification | Draft is saved; no workflow transition occurs. |
| CE-02 | Create a draft with multiple valid evidence items on one component | Draft persists all items in supplied order within the version snapshot. |
| CE-03 | Read a pre-enhancement version containing only `evidenceDescription` and free-form `treatment` | Read succeeds; both legacy values are displayed unchanged; missing new fields are not treated as corruption. |
| CE-04 | Revise a legacy version and add structured evidence and controlled treatment | A new immutable version is created; the old snapshot remains byte-for-byte/domain-value unchanged. |
| CE-05 | Submit with a component missing structured evidence | Submission is rejected; workflow remains in its prior state; no event is created. |
| CE-06 | Submit with missing/invalid treatment classification | Submission is rejected; no workflow state/event/approved pointer mutation occurs. |
| CE-07 | Submit with valid amount, currency, basis, evidence and treatment for every component | Existing transition to pending Operations validation succeeds for the authorized proposer. |
| CE-08 | Evidence item missing source reference, owner, type, scope, coverage or method | Server rejects malformed data; no partial version write occurs. |
| CE-09 | Invalid date format, one-sided date range or end before start | Server rejects the evidence item. |
| CE-10 | Original value supplied with missing applicable unit/precision or missing original currency for monetary evidence | Server rejects inconsistent original-value metadata. |
| CE-11 | Numeric JSON value supplied where original value/amount must preserve decimal text | Server rejects it; no floating-point coercion. |
| CE-12 | Duplicate component keys, unknown evidence fields, malformed map, oversized field or unsupported treatment value | Server rejects input without writing a version. |
| CE-13 | Two concurrent revisions against the same current version | Exactly one advances; the other receives stale-version conflict; no history is overwritten. |
| CE-14 | Attempt revision during active review or after rejection | Existing workflow-state guard rejects it. |
| CE-15 | Proposer attempts Operations validation; Operations validator attempts Finance review; prior actor attempts independent approval | Existing separation-of-duties checks reject each self/overlapping action. |
| CE-16 | Missing, inactive, expired or unaudited permission assignment | Server denies the relevant API/workflow action. |
| CE-17 | Customer, ordinary signed-in user or generic Admin attempts direct client read/write to definitions, versions or permissions | Firestore Rules deny access. |
| CE-18 | Two submissions/replays against the same version | At most one valid transition/event is committed; replay is rejected by current workflow state. |
| CE-19 | Failed validation or transaction retry | No partial version, workflow event or approved pointer is written. |
| CE-20 | Approve a valid version | Only the existing approved-version pointer and workflow audit are updated; no price, quote, booking or operational side effect occurs. |

### Required automated checks

- Focused operational-cost store tests.
- Focused operational-cost workflow tests.
- Firestore Rules Emulator denial tests.
- Staff action permission expiry/denial tests.
- Existing full Firestore Emulator suite.
- `npx tsc --noEmit`.
- `npm run lint`.
- `npm run build`.
- `git diff --check`.

Browser checks, if needed for the changed form, should be limited to the new evidence editor, legacy display, save/revise/submit flows and the specific role actions affected. Do not repeat generic browser verification already reported by the owner.

## 10. Decisions requiring owner approval at this checkpoint

The recommendations below are presented as one consolidated decision set. The owner may approve the set as written or request changes.

| ID | Proposed decision | Reason / boundary |
|---|---|---|
| D0-01 | Embed an `evidenceItems` array in each existing cost component/version snapshot. | No authoritative evidence registry exists in the inspected source; avoids a new collection and preserves immutable version context. |
| D0-02 | Permit multiple evidence items per component. | Supports several attributable sources without aggregation or deduplication. |
| D0-03 | Keep `sourceType` as configurable descriptive text, not a persisted enum. | Avoids hardcoding a source taxonomy before Operations validates real source types. |
| D0-04 | Require source reference, owner, type, represented scope, coverage, collection method and a meaningful observation-period representation at submission. | Makes evidence attributable and interpretable without inventing source values. |
| D0-05 | Keep original value/unit/currency/precision optional where not relevant; enforce consistency when original value is supplied. | Preserves original representation without forcing an irrelevant numeric value or conversion. |
| D0-06 | Add controlled `treatmentClass` values `direct`, `shared`, `included`, `exception_related`; preserve legacy `treatment` unchanged. | Captures the accepted classification vocabulary without allocating or charging costs. |
| D0-07 | Require a controlled treatment classification for new submissions; allow incomplete drafts and preserve legacy approved versions. | Prevents newly approved evidence from retaining an ambiguous treatment while avoiding destructive historical migration. |
| D0-08 | Keep reviewer outcomes, actors, reasons and timestamps exclusively in existing workflow state/events. | Avoids duplicated or conflicting audit facts on each evidence item. |
| D0-09 | No attachments, file storage, new collections, migration, permission changes or workflow changes. | Keeps Stage 1 additive and bounded to existing source architecture. |
| D0-10 | Require a structured evidence item for every component at submission; legacy `evidenceDescription` remains displayable but does not alone satisfy the new submission gate. | Establishes a clear forward standard while preserving historical records. |

## 11. Stage 0 completion and Stage 1 authorization

Stage 0 is complete for owner review when the owner has decided D0-01 through D0-10 and approved the acceptance matrix in Section 9.

**Approval of this document must be explicit.** It is the separate owner checkpoint required by PR #141 before Stage 1 code. Approval should identify:
1. acceptance of the proposed data representation and legacy compatibility;
2. acceptance of the submission-validation rules and treatment classifications;
3. acceptance of the Stage 1 file/service boundary and exclusions;
4. acceptance of the Stage 1 acceptance matrix and non-production verification plan.

No application code is authorized until that approval is received. Even after Stage 1 approval, only the internal evidence enhancement described here may be implemented. All commercial pricing, quote, booking, eligibility, payment and physical-operation gates remain unchanged.

---

**Source paths reviewed:**  
`lib/server/operational-cost-definition-store-core.ts`; `lib/server/operational-cost-definition-store.ts`; `lib/server/operational-cost-definition-workflow-store-core.ts`; `lib/server/operational-cost-definition-workflow-store.ts`; `lib/server/operational-cost-definition-request-auth.ts`; `app/api/admin/operational-cost-definitions/route.ts`; `app/api/admin/operational-cost-definitions/[definitionId]/route.ts`; `app/api/admin/operational-cost-definitions/[definitionId]/workflow/route.ts`; `app/admin/operational-cost-definitions/page.tsx`; `firestore.rules`; `tests/operational-cost-definition-store.test.mjs`; `tests/operational-cost-definition-workflow.test.mjs`; `tests/firestore.rules.test.mjs`; `tests/staff-action-permissions.rules.test.mjs`.
