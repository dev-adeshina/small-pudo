# PUDO Registry and Staff Delegation — Final Implementation Readiness Contract

**Status:** PUDO-1 implementation contract completed in PR #149; PUDO-2 operational baseline owner-approved 8 November 2026. This document remains the PUDO-1 and milestone-boundary reference; see `PLATFORM_PUDO2_VERIFICATION_AND_OPERATIONS_APPROVAL_CONTRACT.md` for PUDO-2.  
**Decision baseline:** DEC-043, DEC-045, DEC-047, DEC-050, DEC-051, DEC-052 and DEC-053.  
**Scope:** First PUDO registry implementation slice and the shared staff activity-delegation foundation it depends on.  
**Important:** This contract authorises only the bounded behaviour described below when merged. It does not activate PUDO locations, customer PUDO discovery, service eligibility, or physical shipment operations.

## 1. Purpose and delivery decision

The next implementation milestone is a real, incremental PUDO candidate registry backed by Firestore and controlled through the existing authenticated staff and permission foundations.

Locations are registered **one at a time through a staff form**. The inventory grows as candidates are identified; the system must not depend on a complete initial spreadsheet or bulk import. Staff may register on behalf of the business owner when the registration activity has been assigned to them.

The business owner remains the top organisational accountability authority for the PUDO inventory, verification governance, and Operations approval. This is an accountability relationship, not an implicit application permission. The owner's Admin identity does not automatically confer every operational activity.

The platform-wide staff authority model is activity-based:
- Admins may assign permitted activities to staff within their own assignment authority.
- Staff may assign activities to other staff only when they have explicit delegation authority for that activity.
- Delegation cannot exceed the delegator's own permission, scope, or constraints.
- Assignment lineage, changes, and revocations are auditable.

## 2. First implementation slice

### Included

1. Staff-facing PUDO candidate registration form.
2. Save and reopen an incomplete draft.
3. Individual submission of a candidate with a name, physical address, and valid geographic coordinates.
4. Server-side validation and Firestore persistence using Firebase Admin.
5. Explicit staff activity authorization and scope checks.
6. Reuse/extension of the existing staff permission assignment model to support controlled staff-to-staff delegation and assignment lineage.
7. Attributable, append-only audit events for candidate creation, edits, submission, permission assignment, delegation, and revocation.
8. Automated tests for authorization, validation, geolocation, audit, and Firestore access.

### Not included in this slice

- Bulk location import or automatic population from public directories/maps.
- Customer-facing PUDO discovery, nearby-centre selector, or customer booking eligibility.
- Google Maps or another mapping/geocoding provider integration.
- Road-distance or route-time calculation.
- Location-kind classification where the real operating arrangements have not yet been supplied.
- Service support or location/action capability assignment.
- DEC-047 service/endpoint eligibility or availability.
- Physical parcel intake, custody, collection/release, payment, routing, dispatch, or transport.
- PUDO-2 verification/approval implementation (now governed by the owner-approved PUDO-2 contract and a separate source-aligned technical design). Activation remains excluded and separately gated under PUDO-3.
- Invented partner agreements, opening hours, capacity, rates, or operating costs.

The first slice must produce a saved and submitted candidate record, not a location that customers or operations can already use.

## 3. Registration form and validation contract

The form creates one candidate at a time.

### Required business inputs for submission

| Input | Requirement |
|---|---|
| Location name | Required, trimmed, non-empty. |
| Physical address | Required, sufficiently specific to identify the site. Preserve the submitted address; do not silently replace it with a geocoded result. |
| Latitude | Required for submission; WGS 84 decimal degrees; range -90 through +90. |
| Longitude | Required for submission; WGS 84 decimal degrees; range -180 through +180. |

The form may also record an optional registration note/source description to help Operations understand how the candidate was identified. The registering staff identity and timestamps are system-attributed, not user-editable.

### Draft and submission behaviour

- An incomplete draft may be saved and reopened without fabricating missing values.
- Draft status is not a submitted candidate, verified location, approval, or activation.
- Submission is blocked until name, address, latitude, and longitude pass server-side validation.
- A submitted candidate remains unavailable for customer selection and operational work.
- Editing a submitted candidate must preserve the original submitted values and create an attributable correction/change event.
- Duplicate detection may warn about likely duplicates, but must not merge or discard records automatically.

### Geolocation capture

- Provide a clear **Use device location** action using the browser's native geolocation capability, subject to the user's permission and device support.
- Provide manual latitude/longitude entry as a fallback; record the capture method rather than pretending manual entry was GPS-captured.
- Capture method, capture time, and capturing staff actor must be attributable. If device accuracy is supplied by the browser, preserve it as accuracy metadata; do not invent an accuracy value.
- A future map pin or geocoding interface requires a separately selected provider and is not part of this slice.
- Coordinates must represent the physical PUDO site, not the registering staff member's home/office or a nearby landmark.

### Distance semantics

Coordinates support geographic proximity and straight-line distance (for example, a Haversine calculation). The UI and API must label this as geographic/straight-line distance. It must not be described as road distance, driving distance, route length, or delivery estimate. Road distance and route-time require a separately approved routing source and method.

Coordinates do not prove site existence, address accuracy, operating authority, physical verification, approval, activation, location capability, or service eligibility.

## 4. Proposed logical data contract

The following is the proposed minimum persistence shape. Before coding, reconcile exact names with the repository's existing TypeScript and Firestore conventions; do not create a parallel location or staff model if a compatible existing abstraction exists.

### PUDO candidate

One authoritative Firestore record per candidate, proposed path:

`pudoLocations/{locationId}`

| Logical field | Meaning |
|---|---|
| `name` | Submitted location name. |
| `address` | Submitted physical address, structured consistently with existing project conventions. |
| `geo.latitude` | WGS 84 latitude. |
| `geo.longitude` | WGS 84 longitude. |
| `geo.captureMethod` | Device geolocation or manual entry. |
| `geo.capturedAt` | Server-attributed capture time where available. |
| `geo.capturedBy` | Authenticated staff UID. |
| `geo.accuracyMeters` | Optional device-reported accuracy; absent when unavailable. |
| `lifecycle` | Draft or submitted candidate state for this first slice. |
| `createdBy`, `createdAt` | Original creator and server timestamp. |
| `updatedBy`, `updatedAt` | Most recent editor and server timestamp. |
| `submittedBy`, `submittedAt` | Submission actor and server timestamp, present only after submission. |
| `schemaVersion` | Explicit version for future safe evolution. |

Do not persist a location type, operating partner, service matrix, capability, approval, or activation value merely to fill a field. Those require their own business evidence and authority decisions.

### Audit

Use an append-only location event record associated with the candidate (proposed subcollection `pudoLocations/{locationId}/auditEvents/{eventId}`, unless an existing audit abstraction is demonstrably the repository standard). Each event identifies:
- actor UID and effective staff assignment;
- event/action type;
- affected location;
- server timestamp;
- changed field names or a safe before/after representation;
- reason where relevant; and
- related permission-assignment lineage where relevant.

Never let client input supply the actor UID or authoritative timestamps. Do not put secrets or unnecessary personal data into audit payloads.

## 5. Shared staff activity delegation contract

This is a platform-wide staff-management capability, not a PUDO-only role system.

### Assignment rules

1. An Admin can assign an activity to a staff member only within the Admin's explicit assignment authority.
2. A staff member can assign an activity to another staff member only if the staff member has explicit delegation authority for that activity.
3. The delegated activity must be one the delegator currently holds and is permitted to delegate.
4. The recipient's scope and constraints must be equal to or narrower than the delegator's.
5. No actor may assign an activity to themselves, self-grant delegation authority, or elevate another staff member beyond the delegator's authority.
6. Sensitive approval, activation, financial, custody, and other consequential actions keep their independent approval and separation-of-duties requirements.
7. A staff member's ability to register a PUDO candidate does not imply authority to verify, approve, activate, assign capabilities, accept custody, or dispatch.

### Assignment lineage

Extend the existing staff permission assignment representation. Do not create a second permission catalogue or duplicate staff directory.

Each assignment must make the following logical facts reconstructable:
- assigning actor;
- recipient staff identity;
- activity/permission;
- scope and constraints;
- whether onward delegation is allowed;
- parent assignment, when delegated;
- creation time and reason; and
- revocation actor, time, and reason.

A derived assignment is effective only while every required upstream assignment in its lineage remains valid. Revoking an upstream assignment must prevent new actions under descendant assignments. Historical actions and assignment records remain intact.

### Runtime authorization

Every protected server action must verify:
- authenticated identity;
- active staff membership;
- explicit activity permission;
- applicable scope;
- valid delegation lineage;
- required location state/capability, where relevant; and
- independent approval or separation-of-duties conditions, where relevant.

Admin status alone is not a substitute for these checks. Browser hiding/disabled controls are usability only; server-side authorization is authoritative.

## 6. Server and Firestore boundaries

- Preserve the existing Next.js App Router, Firebase Auth, Firebase Admin, Firestore and server-side validation patterns.
- All PUDO candidate mutations go through authenticated server handlers using Firebase Admin. Do not grant direct client Firestore writes to the new registry.
- Firestore rules remain default-deny for direct client mutation of PUDO registry and audit records.
- Reuse the existing staff directory, permission catalogue, assignment and audit conventions. Extend them only where needed for explicit delegation lineage.
- Use server timestamps and transaction/batch semantics where a candidate mutation and its audit event must succeed or fail together.
- Do not trust submitted UID, role, permission, status, approval, activation, or audit timestamp values from the browser.
- Validate latitude/longitude bounds on the server as well as in the form.
- Preserve existing records and history on correction; no destructive overwrite of prior evidence.

Exact route names and UI placement should follow the repository's current staff workspace conventions rather than creating an unrelated portal.

## 7. Lifecycle boundary

For this first slice, only these candidate states are required:

- **Draft:** editable incomplete or complete preparation; not submitted.
- **Submitted:** candidate details and coordinates have passed validation; awaiting the separately governed verification process.

The later conceptual stages remain distinct and must not be collapsed:
1. physical verification;
2. Operations decision (approve to proceed, request correction/information, or reject);
3. separately authorised activation;
4. independent service support and action capability configuration;
5. DEC-047 journey eligibility.

Do not add a transition from submitted directly to active. Do not expose an activation control in the first slice. The owner-approved PUDO-2 evidence and inspection baseline is defined in `PLATFORM_PUDO2_VERIFICATION_AND_OPERATIONS_APPROVAL_CONTRACT.md`. Verification/approval controls still require the focused source-aligned technical design. The activation actor must hold separate explicit authority after approval.

## 8. Acceptance criteria

### PUDO registration
- An authorised staff member can open the registration form and create a draft.
- An incomplete draft can be saved, reopened, and corrected without losing its incomplete state.
- One location is created per submission; no bulk import is required.
- Submission without a name, address, valid latitude, or valid longitude is rejected server-side.
- Device geolocation permission denial or unsupported devices do not prevent manual coordinate entry.
- Device-captured and manually entered coordinates are distinguishable in persisted data.
- A submitted candidate is not active, customer-selectable, or eligible for operational work.
- A duplicate-looking candidate is flagged for review without automatic merging.
- Every create, update, and submission is attributable and auditable.

### Staff delegation
- Admin can assign a permitted activity to staff within explicit authority.
- Staff without delegation authority cannot assign activities.
- Staff with delegation authority can delegate only activities and scopes they are permitted to delegate.
- A delegated grant cannot broaden permission, scope, or constraints.
- Self-assignment and self-escalation are denied.
- Revoking an upstream grant makes dependent grants ineffective for new actions.
- Admin identity alone does not authorize PUDO registration or other operational actions.
- Sensitive approval/activation separation remains enforced.

### Security and quality
- Unauthenticated and unauthorized server requests are denied.
- Direct client Firestore writes to PUDO registry/audit are denied.
- Emulator-backed Firestore tests cover the new authorization and persistence behaviour.
- Unit tests cover coordinate bounds, draft/submission validation, delegation lineage, revocation, and audit creation.
- Run the repository's established checks: emulator-backed test suite, `npx tsc --noEmit`, lint, and production build.
- Do not report browser verification as complete until the actual UI cases have been tested.

## 9. Follow-on milestones and explicit gates

| Milestone | Scope | Gate |
|---|---|---|
| PUDO-1 — Candidate registry | Incremental staff registration, coordinates, draft/submission, audit, and staff activity delegation foundation. | This contract reviewed and merged. |
| PUDO-2 — Verification and approval | Physical in-person inspection, arrangement-dependent evidence, correction/rejection, auditable Operations decision. | Operational baseline approved 8 November 2026; complete source-aligned technical design, permission/scope reconciliation, evidence-reference handling, and executable acceptance fixtures before implementation. Retention duration remains open and must not be invented. |
| PUDO-3 — Activation and capabilities | Separate activation, service/action capability assignment and revocation. | Explicit permission catalogue, separation-of-duties rules, and approved service/location/action matrix. |
| PUDO-4 — Discovery and routing | Nearby eligible-centre discovery and route-distance support. | DEC-047 evidence for affected journeys plus approved geolocation/routing provider, privacy, cost, and route-distance method. |

## 10. Release and non-regression guardrails

- All twelve DEC-047 service/endpoint combinations remain unavailable until independently evidenced and approved.
- No candidate record becomes an operational PUDO merely because it has coordinates or a submitted status.
- Location activation does not grant service/action capability, staff permission, route coverage, capacity, or customer eligibility.
- A location capability does not grant an individual staff member permission; both checks remain independent.
- Revocation/deactivation blocks new dependent work but does not erase historical records or in-flight custody.
- Dispatch, route assignment, attempted handover, and arrival do not establish physical custody transfer.
- No actual costs, rates, service promises, partner terms, opening hours, or capacity are invented.
- Preserve DEC-036 P0/Conditional P0 evidence gates; passing tests/builds do not alone establish launch readiness.

## 11. Owner review checklist

This PR asks the owner to approve the bounded technical proposal for PUDO-1:
- incremental, one-at-a-time staff registration;
- required coordinates before candidate submission;
- device geolocation with manual fallback and no selected mapping provider;
- straight-line distance semantics distinct from road distance;
- reuse of the existing staff permission model with controlled staff-to-staff delegation;
- draft/submitted candidate boundary; and
- explicit deferral of verification approval, activation, capability assignment, customer discovery, and route-distance calculation until their evidence gates are met.

Once this contract is merged, proceed directly to the focused PUDO-1 application implementation PR. Do not reopen the already accepted M2 pricing decisions or create another general planning/review sequence.


## PUDO-2 owner-approved baseline — 8 November 2026

The owner approved the operational baseline in `PLATFORM_PUDO2_VERIFICATION_AND_OPERATIONS_APPROVAL_CONTRACT.md`. This approval supersedes the earlier PUDO-2 gate wording in this document that treated the inspection procedure and evidence sufficiency as awaiting owner validation.

The baseline requires an in-person physical inspection by Operations, an attributable inspection record, evidence appropriate to the actual operating arrangement, no universal mandatory document list or photograph requirement, no approval where evidence is insufficient or conflicting, auditable correction and decision history, and a distinct Operations Owner accountability role. The named role-holder, retention duration, technical fields, permission IDs, and implementation representation remain unassigned/unapproved.

PUDO-2 remains a separate milestone from PUDO-3 activation/capability configuration and PUDO-4 discovery/routing.
