# VeriLyft Staff Permission — Owner Decisions

**Status:** All PM-01–PM-12 accepted by the owner; detailed implementation specification remains open.  
**Date:** 30 October 2026  
**Decision baseline:** PR #34 merged to `main` at `06fc1485019073f573047783c7773546a23e789b`.  
**Related:** `PLATFORM_STAFF_PERMISSION_MATRIX.md`, `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md`, `DECISIONS.md`, `PROGRESS.md`, `SESSION_HANDOFF.md`.

## 1. Scope and authority

This record captures the owner's explicit acceptance of the recommended outcomes for PM-01–PM-12 in the staff action-level permission matrix. It resolves those owner-policy questions at the stated level. It does not approve a technical role hierarchy, permission schema, Firebase custom claims, Firestore rules, APIs, UI, deployment, or implementation.

The accepted outcomes must be reconciled with the complete platform SDD and existing source before implementation. No application-code changes are authorized by this decision record.

## 2. Accepted owner decisions

### PM-01 — Authority to grant and revoke staff permissions

**Accepted:** Only designated Admin users may grant, change, or revoke staff permissions. Admin status alone does not confer permission-management authority. Every change must identify the administrator, target staff member, exact permission/scope, time, reason, and outcome in the audit history. A controlled recovery process is required if the designated administrator becomes unavailable.

### PM-02 — Permission assignment model

**Accepted:** Assign permissions at the individual action level, with permission sets available as a convenience where appropriate. Scope permissions to relevant locations and operational responsibilities. One permission does not imply another. Assignment, modification, suspension, expiry, and revocation must be auditable.

### PM-03 — PUDO location capability configuration

**Accepted:** Designated Admin users control each location's operational capabilities. Capabilities are independently configurable (for example, intake, measurement, custody acceptance, payment collection, and parcel release). Enabling one capability does not enable another. A staff action requires both the staff member's assigned permission and the location's active capability. Configuration changes must be attributable and auditable.

### PM-04 — Pricing and rate configuration

**Accepted:** Designated Admin users control pricing and rate configuration, including creating, changing, activating, and retiring rates. Preserve historical rate versions. Record the responsible administrator, reason, effective date, and time for each change. Existing accepted quotes retain their original terms and applicable rate version. Measurement or quote-adjustment permissions do not grant pricing-configuration authority.

### PM-05 — Financial actions requiring second approval

**Accepted:** Require a second authorized person for consequential financial actions, including refund execution, customer credits, material financial adjustments, manual changes to recorded payment outcomes, and exceptional financial actions outside the normal approved workflow. Routine payment recording, receipt issuance, and reconciliation do not automatically require second approval. The requester cannot approve their own action. Monetary thresholds and materiality criteria remain to be defined.

### PM-06 — Measurement adjustments requiring second approval

**Accepted:** Routine measurement recording does not require second approval. Material discrepancies and adjustments that materially change an accepted quote or financial obligation require review and, where applicable, a second authorized approver. Disputed measurements must not silently become approved charges. The proposer cannot approve their own adjustment. Exact thresholds, units, and materiality criteria remain to be defined.

### PM-07 — Routing, dispatch, and delivery actions requiring second approval

**Accepted:** Require second approval for consequential operational exceptions, including dispatch exceptions, material route changes with significant cost/custody/security implications, exceptional shipment reassignment outside the approved process, overrides of normal delivery or custody controls, and sensitive failed-delivery resolutions. Routine route planning, approved assignments, movement recording, and ordinary delivery confirmation do not automatically require second approval. The requester cannot approve their own exception. Record reason, evidence, requester, approver, and outcome. Materiality criteria remain to be defined.

### PM-08 — Audit evidence access and disclosure authority

**Accepted:** Restrict audit/evidence access to explicitly authorized reviewers. Viewing, exporting, and approving external disclosure are separate permissions. Admin status alone does not grant unrestricted audit access. Access, exports, and disclosures must be attributable and auditable. External disclosures, including government requests, require review of legal basis, scope, and authorization; disclose only necessary and authorized information.

### PM-09 — Direct partner and driver access at launch

**Accepted:** Collection-centre partners and drivers do not receive direct platform login access at launch. Authorized internal staff manage operational records. Partners and drivers may be identified as physical actors in custody, handover, and delivery records. Dedicated partner/driver access may be considered later after its requirements and security controls are defined.

### PM-10 — Management responsibility

**Accepted:** Management is not a separate operational role at launch. Management access initially consists of explicitly assigned reporting and oversight permissions. Reporting access does not automatically grant operational or administrative authority. A distinct Management role may be considered later if justified by business needs.

### PM-11 — Support responsibility at launch

**Accepted:** Support is a defined responsibility at launch, not a separate portal. Support personnel receive limited, explicitly assigned customer/order access and may assist with enquiries, account/order recovery, complaints, and operational escalations. Support access does not automatically grant financial, custody, dispatch, or unrestricted audit permissions. Sensitive actions are escalated to appropriately authorized personnel.

### PM-12 — Emergency access

**Accepted:** Establish a controlled, time-limited emergency-access ("break-glass") procedure. Use is restricted to genuine urgent operational/security needs, requires a documented reason, and grants only minimum necessary permissions. Access expires automatically after a defined period. Every access event and consequential action is audited. A designated Admin or authorized reviewer conducts a post-incident review, and emergency permissions are revoked when no longer needed. Emergency access must not silently bypass financial controls, evidence preservation, or legal restrictions.

## 3. Cross-cutting implementation constraints still to specify

The owner decisions establish policy direction but leave detailed design work open. Before implementation, the SDD must specify and reconcile:

- The exact permission catalogue, permission-set composition, staff identity lifecycle, and assignment scope.
- How designated permission administrators are initially appointed, changed, suspended, and recovered; whether any grants/revocations need second approval.
- Technical enforcement at every server-side boundary, including pages, APIs, background jobs, and direct client attempts.
- Location record/capability representation, capability activation/deactivation, and conflict handling with staff permissions.
- Rate versioning, effective-time semantics, and any second-review requirement for pricing changes.
- Which financial actions are "material" or exceptional, monetary thresholds if any, requester/approver eligibility, and provider reconciliation semantics.
- Measurement units, service-specific thresholds, adjustment proposal/acceptance/dispute handling, and approval rules.
- Material route-change criteria, reassignment authority, delivery/custody override catalogue, and exception transitions.
- Reviewer eligibility, evidence categories, export controls, disclosure approval, retention, legal holds, and audit integrity.
- How physical actors without platform accounts are identified and verified.
- Management reporting scope, permitted metrics/drill-down, and privacy boundaries.
- Support visibility, escalation paths, and controlled assistance for guest-order recovery/claiming.
- Emergency activation authority, eligible responders, maximum duration, notification, renewal, review, and failure/recovery procedures.

Do not invent numeric thresholds, universal approval requirements, technical roles/claims, or data structures while resolving these details.

## 4. Status and next gate

- PM-01–PM-12: **Accepted by owner**.
- Staff permission policy direction: **Agreed at owner-decision level**.
- Complete action-level technical authorization design: **Not yet finalized**.
- Platform-wide SDD: **Not yet fully reconciled or approved**.
- Application implementation: **Not authorized**.

Next work is to reconcile this decision record with all affected actor, workflow, lifecycle, authorization, acceptance, traceability, and continuity documents. Then continue resolving remaining policy and technical dependencies. The owner must explicitly approve the complete platform-wide SDD before application-code work resumes.
