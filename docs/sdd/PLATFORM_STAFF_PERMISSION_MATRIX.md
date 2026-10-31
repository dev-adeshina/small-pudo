# VeriLyft Staff Action-Level Permission Matrix

**Status:** Owner policy decisions PM-01–PM-12 accepted; detailed action-level design remains open — not implementation approval  
**Date:** 31 October 2026  
**Repository baseline:** PR #55 merged at `e5a7c396f8382e410d15ff2a11a20ccadee26eb2`; this proposed documentation update is based on that mainline.  
**Related:** `PLATFORM_STAFF_PERMISSION_DECISIONS.md`, `DECISIONS.md` (DEC-022, DEC-025–DEC-044), `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md`, `ADMIN_REQUIREMENTS.md`, `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md`, `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md`

## 1. Purpose and boundary

This document translates the accepted minimal hybrid Admin/Operations direction into a proposed action-level authorization baseline for owner review.

It is a business/security policy draft. It does not claim that these permissions exist in the current application, and it does not authorize implementation. It does not prescribe fixed staff roles, Firebase custom claims, Firestore fields/rules, collections, endpoints, a separate portal, a separate Finance deployment, numeric monetary limits, or universal two-person approval.

The design objective is to assign the least authority needed for a task while preserving the accepted lean launch model. A responsibility label (Admin or Operations) is not itself proof of authorization. Each protected action must be checked server-side against the acting staff member's current assigned authority and applicable contextual constraints.

## 2. Authorization principles

1. Authentication establishes identity; it does not grant staff or Admin access.
2. Every privileged operation must be authorized server-side. Hiding UI controls is not a security boundary.
3. Grant authority for the specific action, not a broad assumption that all staff or all Admin users can do everything.
4. Where applicable, constrain permission by assigned location, shipment/order, service, record sensitivity, and lifecycle stage.
5. Location intake, measurement, custody acceptance, payment collection/recording, and parcel release are separate capabilities under DEC-025.
6. Booking, payment, physical custody, dispatch, movement, delivery, refund, and notification are distinct events/states. Permission to record one does not establish another.
7. Financial adjustments, dispatch exceptions, restricted disclosures, privileged access administration, and consequential corrections require explicit authority and attributable evidence.
8. A requester must not approve their own dispatch exception. Other second-approval cases must be explicitly defined by the relevant workflow.
9. Consequential actions record the acting staff identity, target/action, outcome, timestamp, and reason; record approver and supporting evidence when required.
10. Drivers, transport providers, and collection-centre partners do not receive direct platform access merely because they participate physically. The Driver Portal remains deferred.

## 3. Proposed responsibility and permission matrix

The labels below describe proposed responsibility, not existing technical roles or claims.

- **Admin responsibility:** platform/business administration and oversight.
- **Operations responsibility:** shipment and physical-operation execution.
- **Assigned staff:** staff member explicitly granted the action for the relevant scope.
- **System/provider:** trusted server-side processing or authoritative external provider event.
- **Authorized reviewer:** staff member explicitly permitted to review the relevant sensitive record or evidence.

| Action | Proposed permitted actor | Authorization boundary | Approval / separation of duties | Accountability |
|---|---|---|---|---|
| Staff access and permission assignment | Admin responsibility, restricted to explicitly authorized administrators | Grant/change/suspend/revoke staff authority only through a trusted administrative operation; customers cannot self-elevate | Whether privileged grants/revocations need a second approver is unresolved | Granting actor, target, exact authority/scope, time, reason, outcome |
| Storefront catalogue maintenance | Admin responsibility; others only if assigned | Create/update/activate/deactivate products and categories; server validates and protects data integrity | Routine edits need no blanket second approval in this draft; high-impact controls remain open | Actor, affected record, change reference, time, outcome |
| Order review and routine order administration | Admin responsibility; Operations for assigned fulfilment actions | Read only fields needed for assigned task; perform only approved lifecycle actions; no arbitrary override | Consequential exceptions follow the relevant workflow | Order, action, prior/resulting state, actor, time, reason |
| Payment verification and investigation | System/provider verifies; assigned staff investigate/review | Staff cannot mark payment successful from browser state, screenshot, verbal claim, or unsupported note | Manual reconciliation/exception requires separately assigned financial authority; it cannot fabricate provider confirmation | Provider/reference evidence, amount/currency, outcome, correlated record, manual reviewer |
| Refunds, credits, additional charges, financial adjustments | Explicitly assigned financial authority; Finance responsibility where established | Request, review, approve, initiate, record, and confirm are distinct actions; amount and operation must follow approved policy | Requester/approver separation for sensitive adjustments; exact limits and mandatory second approval unresolved | Original transaction, amount/currency, reason, requester, approver if required, provider/bank reference, status/outcome |
| Pricing and rate configuration | Admin responsibility or explicitly assigned pricing authority | Separate quote use/creation from changing rate rules; accepted quote inputs cannot be silently rewritten | Whether rate changes require second approval or scheduled effectiveness remains unresolved | Rule/version, effective context, actor, before/after values, reason, time |
| Location and service capability configuration | Admin responsibility or explicitly assigned location-configuration authority | Configure only approved services/capabilities; location label does not imply capability | Whether capability changes require second approval is unresolved | Location, capability/service changed, actor, time, reason |
| Walk-in intake creation | Staff assigned intake capability at active configured location | Create assisted intake only for enabled services; advance booking is not proof of intake | Does not imply measurement, custody, payment collection, or parcel-release permission | Shipment/parcel, location, staff actor, time, source/context, required evidence |
| Parcel measurement | Staff assigned measurement capability at relevant location | Record actual measurements separately from declared/quoted measurements; approved units/service requirements must be defined | Material discrepancy or payment-impacting adjustment requires authorized review; threshold and second-approval rule open | Original/actual values, units, actor, location, time, evidence, linked quote |
| Physical custody acceptance/handover | Staff assigned custody capability at relevant location | Record physical receipt/transfer only when it occurred; location/service must support it | Booking/payment/status alone cannot substitute for custody evidence | Parcel/shipment, event, physical actors where known, recording actor, location, time, evidence |
| Payment collection at location | Staff assigned payment-collection capability; method enabled at location | Accept only configured methods; electronic payment needs authoritative confirmation; cash needs approved receipt/evidence and reconciliation | Cash limits, methods, second-person verification, and reconciliation controls open | Amount/currency, method, transaction/receipt, collecting/recording actor, location, time, evidence |
| Parcel release / collection | Staff assigned release capability at location | Verify recipient entitlement; booking party, payer, sender, and receiver are not interchangeable; collection-centre capability must allow release | Disputed/exceptional collection follows separately approved resolution; second-person cases open | Parcel, recipient entitlement evidence, physical/recording actors, location, time |
| Route proposal review | Operations responsibility | Review/adjust proposed route legs; proposal is not approval, assignment, dispatch, or proof of movement | Route approval authority is separate where applicable | Proposal/version, route legs, actor, time, reason, outcome |
| Route approval and route-leg assignment | Operations responsibility with explicit assignment authority | Approve, alter, revoke, or reassign within scope; preserve prior decisions | Second approval for high-impact route changes unresolved | Shipment/leg, prior/new assignment, actor, time, reason, approver if required |
| Dispatch | Operations responsibility with explicit dispatch authority | Enforce verified payment by default and all unrelated safety, custody, identity, and legal holds | Unpaid dispatch is not a generic override. Only assigned dispatch-exception authority may approve an eligible exception; requester cannot approve own exception; material exceptions require second approver once materiality is defined | Shipment, payment state, policy/reason, requester, approver(s), evidence, time, decision/outcome |
| Movement milestone recording | Operations staff; provider/driver may be physical actor | Record only supported movement/handover events; distinguish physical actor from staff recorder | Corrections/disputed custody follow controlled review; no fabricated successful movement | Shipment/leg, event, location, physical actor/reporter, recorder, time, evidence |
| Delivery outcome and proof | Operations responsibility or assigned delivery-recording staff | Successful delivery requires approved service-appropriate proof and verified recipient entitlement; attempt is not delivery | Failed-delivery resolution, return, holding, refusal, or consequential correction requires assigned authority | Attempt/outcome, parcel, recipient entitlement, proof, physical actor, recorder, time, reason |
| Failed-delivery resolution / operational override | Operations responsibility with explicit permission per action | Apply only approved resolution path; cannot silently change payment or erase original events | Second-approval cases to be specified; apply requester/approver separation to material exceptions | Original attempt, resolution, actor, approver if required, reason, evidence, time, result |
| Audit/evidence review | Authorized reviewer; Admin status alone is insufficient | Access only evidence categories/records needed for review; sensitive evidence access controlled | Sensitive export/disclosure or legal-hold actions need separately assigned authority; second-approval cases open | Reviewer, scope, purpose, time, access/export/disclosure outcome |
| Government or restricted disclosure | Explicitly authorized disclosure reviewer/approver | Validate authority, legal basis, scope, minimum necessary disclosure, and privacy/hold constraints; request itself grants no access | Approval distinct from requester; whether a second reviewer is mandatory depends on sensitivity and remains open | Requesting authority, basis, scope, decision, approver, disclosure/reference, recipient, actor, time |
| Notification administration | Admin responsibility or assigned configuration authority; system sends events | Configure only approved channels/events/recipients/fields; sending does not change business state or grant record access | Telegram remains deferred and gated by Admin Assign For Delivery plus separate purpose/audience/disclosure approval | Trigger, recipient relationship, channel, attempt/outcome, configuration/approval actor, provider reference |
| Dashboard/report access | Admin and Operations within assigned scope; Management unresolved | Expose only metrics and drill-downs permitted to viewer; no demo values as live data | Export and sensitive drill-down authority explicit; Management role/permission set unresolved | Metric definition/source/window; restricted export/access evidence |
| Consequential correction / redaction | Explicitly assigned correction authority; authorized reviewer for sensitive evidence | Never silently overwrite/erase consequential history; preserve original and distinguish correction/addition/redaction | Second approval for financial, custody, delivery, identity, and disclosure corrections must be decided by relevant workflow | Original reference, correction, actor, approver if required, reason, time, evidence, outcome |

## 4. Proposed permission assignment approach

To avoid inventing a large role hierarchy, the preferred direction is:

1. Keep Admin and Operations as responsibility groupings, not universal permission bundles.
2. Assign only action permissions required for a person's duties.
3. Constrain location-dependent permissions to locations and capabilities for which the person is authorized.
4. Keep high-impact permissions (financial adjustments, dispatch exceptions, restricted disclosures, privileged access administration, consequential corrections) separately identifiable from routine access.
5. Review and revoke permissions when a staff member changes responsibilities or leaves.
6. Enforce the same authorization decision at the server boundary regardless of whether the action originates from a page, API, background job, or direct client attempt.
7. Do not grant direct driver/provider/partner access at launch without a separately approved access model.

**Owner decisions accepted:** PM-01–PM-12 are recorded in `PLATFORM_STAFF_PERMISSION_DECISIONS.md`. The technical assignment model, permission catalogue, temporary-grant mechanics, administrator appointment/recovery, and whether privileged grants require second approval remain to be specified.

## 5. Accepted approval and separation-of-duties controls

The following are supported by accepted decisions:

- A dispatch-exception requester cannot automatically approve their own exception (DEC-030).
- Material dispatch exceptions require a second approver once the owner defines materiality (DEC-030).
- Financial adjustments, refunds/credits, and sensitive disclosures require explicit permission and approval boundaries (DEC-022, DEC-029, DEC-033).
- A payment record cannot prove physical custody, dispatch, or delivery (DEC-025, DEC-028–DEC-032).
- One location capability does not imply another (DEC-025).
- Admin status alone does not grant unrestricted audit/evidence access (DEC-033).
- A government request does not grant privileged access or disclosure authority (DEC-033).

The following are **not approved** and must not be silently treated as policy:

- universal two-person approval for every refund, credit, pricing change, measurement adjustment, route reassignment, custody/delivery correction, audit export, or disclosure;
- monetary, parcel-value, risk-score, or percentage limits;
- a rule that every action by one Admin needs another Admin's approval;
- automatic escalation based only on a role title;
- self-approval restrictions for workflows other than the accepted dispatch-exception restriction, unless the relevant workflow policy establishes them.

## 6. Owner decisions — resolved at policy level

The owner has explicitly accepted all twelve recommendations PM-01–PM-12. The accepted outcomes are authoritative in `PLATFORM_STAFF_PERMISSION_DECISIONS.md` and are summarized here:

| ID | Accepted outcome |
|---|---|
| PM-01 | Only designated Admin users may grant/change/revoke staff permissions; Admin status alone is insufficient; changes are audited and recovery is controlled. |
| PM-02 | Individual action-level permissions, optionally grouped for convenience, with relevant location/operational scope; permissions do not imply one another. |
| PM-03 | Designated Admin users configure independent location capabilities; an action requires both staff permission and active location capability. |
| PM-04 | Designated Admin users control pricing/rates; preserve rate history and accepted quote terms; measurement permissions do not grant pricing authority. |
| PM-05 | Second approval for consequential financial actions; routine payment recording, receipt issuance, and reconciliation do not automatically require it; requester cannot self-approve. |
| PM-06 | Routine measurement needs no second approval; material discrepancies/payment-impacting adjustments require review and applicable second approval; proposer cannot self-approve. |
| PM-07 | Second approval for consequential operational exceptions; routine routing/movement/delivery does not automatically require it; requester cannot self-approve. |
| PM-08 | Viewing, exporting, and external disclosure are separate permissions; authorized reviewers only; external disclosure requires legal-basis/scope review and audit. |
| PM-09 | No direct partner or driver login at launch; internal staff record operations and identify physical actors. |
| PM-10 | No distinct Management operational role at launch; assign reporting/oversight permissions only. |
| PM-11 | Support is a defined launch responsibility, not a separate portal; limited access and escalation boundaries apply. |
| PM-12 | Controlled break-glass access: justified, minimum-scope, time-limited, audited, reviewed, revoked, and not a silent bypass of controls. |

**Important:** Acceptance resolves the owner-policy questions, not every technical or operational parameter. Exact thresholds, permission catalogue, assignment mechanics, reviewer eligibility, emergency-access duration, and workflow-specific evidence remain open. See the decision record for the complete accepted wording and outstanding design dependencies.

## 7. Acceptance requirements for eventual implementation

These are test-design requirements, not implementation evidence or authorization to test production.

1. A signed-out user, ordinary customer, or unassigned staff member cannot access staff-only pages, APIs, records, or actions by direct navigation/request.
2. A staff member with one action permission cannot perform another action merely because both occur in the same portal or location.
3. A location cannot perform a service/action not explicitly configured and active.
4. A staff member cannot grant themselves permissions or exceed assignment scope.
5. Revoked/expired authority is denied server-side; stale UI state does not preserve access.
6. Unauthorized/invalid actions leave protected business, payment, stock, custody, and shipment records unchanged, apart from approved security/audit evidence.
7. Dispatch-exception self-approval is denied; material exceptions require the approved second approver; payment state remains unchanged.
8. Payment verification, refund execution, custody acceptance, movement, delivery, and notification remain distinct actions with separate evidence.
9. Audit/evidence access and external disclosure are independently authorized and attributable.
10. Corrections preserve the original consequential record and identify correcting actor, reason, and approver where required.
11. Direct driver/provider/partner access is denied unless a separately approved launch access model enables it.
12. Every test uses the final owner-approved permission assignment and approval policy; unresolved PM decisions block affected cases.

## 8. Dependencies and unresolved boundaries

This matrix depends on DEC-022 for the hybrid responsibility model; DEC-025 for location capabilities; DEC-027–DEC-030 for adjustment, payment, refund, and dispatch controls; DEC-031–DEC-032 for route, movement, delivery and failed-delivery authority; DEC-033 for audit/evidence/disclosure; and DEC-036 for P0 acceptance and release evidence.

It does not finalize financial limits or second-approval thresholds; Finance deployment/authority; technical permission representation; Firebase claims, Firestore rules, data structures, APIs, or implementation; or the technical relationship between existing Admin authorization and future action-level permissions. PM-09–PM-11 resolve the launch-level partner/driver, Management, and Support policy boundaries, while detailed access and reporting specifications remain open.

These matters must be resolved and reconciled with current source before the complete SDD can be approved. No application-code changes are authorized by this draft.


## 9. Decision-propagation reconciliation — DEC-037–DEC-044

The following maps accepted policy to action-level authorization boundaries. It supplements the proposed matrix above and the authoritative PM-01–PM-12 decisions. It does not establish technical roles, permission identifiers, claims, API guards, schema, numeric thresholds, or new approval requirements.

| Policy area | Required actor/permission separation | Location/service guard | Approval, evidence, and unresolved detail |
|---|---|---|---|
| **Independent booking and shared fulfilment (DEC-037–DEC-038)** | The authenticated booking party accepts a valid quote. Support may assist, verify, record, and escalate but cannot impersonate the customer or accept on their behalf without an approved authorization process. Operations manages physical intake and post-intake operations. | Not applicable to quote acceptance unless a later service contract requires it; actual intake is subject to the location/action guards below. | Booking acceptance is not payment or intake. Preserve distinct booking party, sender, receiver, payer, and handover person. Staff-created walk-in intake is not staff-assisted customer booking. |
| **Pricing configuration and calculation (DEC-039)** | Designated Admin users with the relevant assigned authority control pricing/rate configuration (PM-04). The trusted server calculates authoritative prices. Measurement permission does not grant pricing permission. | Apply only the approved service's configured model, inputs, and rule/rate version. | Preserve input/charge/rate context for each quote. No client-authoritative total or ad hoc staff formula. Exact catalogue, units, sources, rounding, fee treatment, version/effective-time details, and any configuration second review remain open. |
| **Measurement and adjustment (DEC-040; PM-06)** | Assigned staff record actual measurements and may propose a material adjustment within scope. A proposer does not approve their own proposal; authorized review and applicable second approval are required for material/payment-impacting adjustments. Customer acceptance/rejection is a separate decision. | Measurement requires the relevant active location capability and staff measurement permission; service-specific required measurements/units apply. | Routine measurement does not require second approval by default. No universal tolerance is approved. Rejection triggers authorized service resolution; it does not itself cancel, refund, credit, or charge. Silence is not acceptance. |
| **Payment and settlement (DEC-041; PM-05)** | Trusted provider/system confirms electronic settlement. Assigned staff may collect/record enabled payment methods and investigate/reconcile within authority. Financial requests, approvals, initiation, and confirmed execution remain distinct. | Payment-at-intake methods and collection capability must be enabled for the relevant location/service. | Consequential financial actions require the accepted PM-05 second-approval boundary; routine payment recording, receipt issuance, and reconciliation do not automatically require it. Partial payment does not satisfy normal dispatch gate. Do not invent limits or reconciliation procedures. |
| **Physical intake and custody (DEC-042)** | Intake, measurement, custody acceptance, payment collection/recording, parcel release, and custody handover are distinct permissions. Record physical actor, receiving actor, recording staff, event, time/location, outcome, and applicable evidence/source/reason. | Require active location, enabled service/action, identifiable parcel/record, and relevant handover authority; actor permission and location capability are both required. | Distinguish refusal before custody, actual receipt, and receipt under hold. A hold records actual custody and blocks ordinary onward processing as specified by policy. Inspection/evidence details and second-person cases remain service-specific/open. |
| **Location capability administration (DEC-043; PM-03)** | Only designated Admin users with assigned configuration authority may create/change/revoke location capabilities. Location creation, activation, capability configuration, and staff permission assignment are distinct responsibilities. | Service enablement and action capability are separate checks; neither staff permission nor location capability substitutes for the other. | Changes are attributable/auditable. Revocation prevents new work but does not erase or transfer existing custody. Exact assignment granularity, capability catalogue, and service/location/action matrix remain open. |
| **Custody transfer and physical exceptions (DEC-044; PM-07/PM-08 as applicable)** | Physical actor, receiving actor, reporting source, and recording staff remain distinguishable. Authorized reviewers/investigators resolve disputed/incomplete transfers, missing/damaged parcels, incorrect location assignment, and prolonged holds. Corrections require separately assigned authority. | Any transfer action remains subject to applicable location/service capability and assigned staff authority; a route or location assignment is not itself a custody event. | A transfer completes only on actual handover and receipt. Preserve last confirmed custody and original event/evidence. Apply consequential operational second approval where the accepted PM-07 rule makes the exception consequential; do not invent universal second approval. Physical exceptions do not automatically determine liability or financial/customer outcomes. |

### 9.1 Explicit non-inferences and open design inputs

- No DEC-037–DEC-044 policy creates a new staff role, portal, permission code, Firebase custom claim, Firestore field/collection, endpoint, or workflow engine.
- Admin status does not imply pricing configuration, location-capability administration, custody correction, financial adjustment, restricted evidence access, or every operational approval. The designated-authority and assignment rules in PM-01–PM-08 continue to apply.
- Location capability does not authorize a staff member; staff permission does not enable an unsupported/inactive location. Both are required for the relevant location-dependent action.
- A payment record does not prove physical custody, transfer, dispatch, or delivery. A dispatch or route record does not prove a physical handover.
- A proposed/attempted/disputed transfer is not completed custody transfer. Do not replace last confirmed custody without evidence of actual possession change.
- A missing/damaged parcel, incorrect assignment, or hold does not automatically assign fault, liability, refund, credit, compensation, insurance outcome, or customer entitlement.
- Still open: permission catalogue and technical assignment/enforcement; designated Admin appointment/recovery; exact service/location/action matrix; pricing inputs and calculation specification; measurement thresholds and units; payment methods/limits/reconciliation; transfer proof and correction/dispute authority; investigation/hold ownership and timeframes; evidence retention; lifecycle/status and data/API/security contracts; and executable acceptance cases.
