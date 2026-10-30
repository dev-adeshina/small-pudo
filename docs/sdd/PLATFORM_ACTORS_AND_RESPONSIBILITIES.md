# VeriLyft Platform Actors and Responsibility Model

**Document status:** Draft for owner review — not approved for implementation  
**Last updated:** 29 October 2026  
**Scope:** Platform-level human/system actors, responsibility boundaries, and portal/module distinctions  
**Related decisions:** DEC-010, DEC-012, DEC-014, DEC-015, DEC-016, DEC-018, DEC-019, DEC-021, DEC-022–DEC-036

## 1. Purpose and status

This document defines a first-pass conceptual actor and responsibility model for the existing VeriLyft platform. It is a design artefact, not a claim that the listed roles, screens, permissions, or workflows already exist in source code.

The model preserves the owner-confirmed launch scope: storefront orders and independent shipments are distinct; booking is not physical intake; payment and physical shipment state are separate; Operations reviews route proposals and approves route-leg assignments; the Driver Portal is deferred; and full finance operations are outside the Admin Portal.

**Status vocabulary**
- **Confirmed:** explicitly supported by an accepted decision or owner-confirmed launch requirement.
- **Proposed:** a minimal responsibility boundary offered for review; it does not become an approved permission rule until accepted.
- **Unresolved:** requires an owner decision or workflow-specific design before implementation.

## 2. Modelling principles

1. A person, organization, system integration, functional responsibility, and deployed portal are different concepts.
2. One person may act in more than one business capacity—for example, a storefront customer may also book an independent shipment. This does not by itself establish that account identities or records should be merged.
3. A shipment sender, receiver, payer, booking party, and person physically handing over or collecting a parcel may be different people. DEC-024 accepts distinct relationships; permissions, proof requirements, and access must follow the relevant workflow rather than being inferred from one role.
4. A role describes responsibility; a portal or page is only an interface. Do not create a separate application solely because a functional area has its own name.
5. Authentication establishes identity, not permission. Customer identity never implies Admin or staff access.
6. Privileged actions require server-side authorization. Sensitive approvals, overrides, payment adjustments, custody changes, and disclosures should be attributable and auditable.
7. Payment state, order state, shipment state, and individual transport-movement state must not be treated as interchangeable.
8. The least authority needed for the approved task should be granted. DEC-022 accepts a minimal hybrid model: Admin and Operations are distinct responsibilities, routine actions may be shared where assigned permissions allow, and sensitive actions require explicit permission/approval boundaries. The action-by-action authorization matrix remains unresolved.

## 3. Actor catalogue

| Actor / actor class | Status | Main responsibility or interaction | Boundaries and unresolved points |
|---|---|---|---|
| Public visitor | Proposed | Browse public storefront information and products; may enter the independent shipment-booking journey only through registration/sign-in before booking creation. | Public quote/rate visibility and pre-registration information remain to be defined; a visitor cannot create a shipment booking as a guest. |
| Storefront customer — guest | Confirmed in principle | Purchase VeriLyft's own products without mandatory account registration; access an order using the approved guest-access mechanism. | Guest checkout is preserved. DEC-035 accepts secure recovery through proof of control of the original checkout email and optional account claiming through a separate ownership challenge; technical details and verification remain open (VLY-004). |
| Storefront customer — signed in | Confirmed | Manage own account/profile and access only orders associated with verified ownership. | Account identity does not grant staff/Admin access. Optional claiming of an eligible guest order is accepted by DEC-035; ownership verification, eligibility, credential mechanics, and runtime evidence remain to be specified. |
| Independent shipper / booking party | Confirmed | A registered, authenticated customer may book a shipment independently of a storefront purchase, as an individual or business subject to the still-open business-account policy. | Guest shipment booking is excluded at launch. Booking access must be authorized server-side and scoped to the authenticated customer's entitlement. Under DEC-024, booking-party status does not grant blanket change or collection authority. Detailed amendment/cancellation permissions and business-account handling remain unresolved. Do not assume a separate Shipper Portal is required. |
| Sender | Conceptual business participant | Supplies or confirms parcel and origin information and may hand a parcel over. | Sender may differ from the booking party and payer. Identity verification, handover authority, and evidence requirements follow the approved intake policy; sender status alone does not imply full booking access or blanket change authority. |
| Receiver / collection recipient | Conceptual business participant | Receives a delivered parcel or collects it through an approved collection workflow. | Receiver/collection identity checks and collection authorization are required under the approved policy. Receiver status does not by itself authorize changes to a booking; detailed verification and evidence requirements remain open. |
| Authorized Admin staff | Confirmed as a privileged actor class; hybrid model accepted | Manage the storefront catalogue and oversee orders, shipments, transactions, pricing, network, settings, and operational visibility within approved permissions. | Exact action-by-action permissions and approval rules remain to be defined. Customer authentication alone is insufficient; sensitive actions must have explicit server-enforced boundaries. |
| Operations staff | Confirmed responsibility; hybrid staff model accepted | Review/adjust proposed route legs, approve transport assignments, manage shipment operations, record launch-time milestones, and review consequential failed-delivery exceptions. | Driver Portal is deferred. Exact lifecycle transitions, approval limits, and workflow-specific separation-of-duties rules remain unresolved; a separate portal is not implied. |
| Staffed PUDO station staff | Location type confirmed; actor permissions proposed | Support authorized physical intake, measurement, custody, handover, and/or collection at a staffed station according to its configured capabilities. | Exact station actions, staff identity model, and permission scope must be approved in the intake/custody workflows. Do not infer that every station performs every operation. |
| Registered collection-centre operator / partner | Location type confirmed; actor permissions unresolved | Operate a registered collection centre for explicitly configured services. | Outgoing-parcel acceptance is not automatic. Whether partners receive system access or all actions are recorded by VeriLyft staff is unresolved. |
| Transport provider / carrier | Confirmed as a conceptual external party | Performs an assigned transport leg and supplies agreed handover/movement information. | Provider onboarding, service-level commitments, proof format, and integration versus manual recording are unresolved. |
| Driver / courier | Conceptual operational participant; separate Driver Portal deferred | Physically performs assigned transport/delivery work and may provide movement or delivery evidence through the launch process. | At launch, Operations staff manage assignments and record milestones. Do not assume drivers have direct system accounts or portal access. |
| Finance staff / Finance function | Finance responsibility boundary confirmed; deployment model unresolved | Handle financial operations such as reconciliation, refunds/credits, expenses, commissions/payouts, payroll scope, and financial reporting according to approved policy. | Admin may show operational financial summaries but is not the full Finance function. Whether Finance is a separate deployed portal, a protected module, or both remains a product/architecture decision. |
| Management / business owner | Management experience is a documented need; role boundary unresolved | Review business performance and operational outcomes to support decisions. | Metric definitions, permitted drill-down, approval authority, and whether Management is a distinct role or permission set are unresolved. Do not assume broad access to personal or financial data. |
| Customer support / service staff | Unresolved candidate actor | May assist with enquiries, order/shipment lookup, and escalation if a support workflow is included. | A distinct support role, case-management workflow, data visibility, and authority to change records have not been approved. Do not build a dedicated support portal on this basis. |
| Government/public authority requester | Confirmed as a request context, not a privileged platform role | Submits a request that may require an authorized review, decision, evidence reference, and recorded disclosure. | A requester receives no internal access merely by making a request. No dedicated Government Requests page or elaborate workflow is planned; legal handling and approval boundaries still need detail. |
| Payment provider (Paystack) | Existing integration named in project architecture | Processes online payment and sends payment outcomes/events for server-side verification. | The server remains authoritative; callback/browser state is not payment proof. Payment-at-intake method(s), reconciliation, refunds, late events, and integration failure handling need workflow contracts. |
| Cloudinary | Selected external integration | Hosts uploaded category/product images through the server-side upload integration. | Credentials remain server-side; authorized success, unauthorized denial, and persisted URL behaviour still require runtime verification (VLY-011). |
| Notification channel / Telegram | Telegram deferred | Potentially carries approved operational notifications after the required trigger and approval. | Telegram is not the primary customer order interface. Initial paid-order delivery notification is gated by Admin approval of delivery assignment; recipient access, fields, retries, and deduplication need specification. |

## 4. Responsibility domains — first-pass boundary

The table below describes functional responsibility, not a commitment to create separate deployed portals.

| Domain | Proposed accountable function | Responsibilities in the launch design | Must not silently own |
|---|---|---|---|
| Storefront and customer account | Customer-facing product function | Product discovery, cart/checkout, customer profile, own-order access, guest order access. | Admin privileges; authority to set trusted prices/payment status or read another customer's records. |
| Independent shipment booking | Shipper-facing function | Capture booking intent and shipment details, present the approved quote, support approved payment choice, provide booking reference/receipt. | Physical receipt/custody confirmation; direct override of server-calculated price or payment state. |
| Intake and PUDO | Operations with location-specific handling | Record actual physical receipt, required measurements, custody/handover evidence, and only the services enabled for that location. | Treating advance booking as intake; assuming every collection centre accepts outgoing parcels. |
| Routing and transport | Operations | Review route proposals, approve assignments, record route-leg handovers and movement milestones, resolve operational exceptions under policy. | Assuming algorithmic proposals are approvals; assuming a separate Driver Portal at launch. |
| Delivery and failed-delivery resolution | Operations under approved policy | Record delivery outcome and approved proof; review exception recommendations and approve consequential changes. | Treating a delivery attempt as successful delivery without required evidence; inventing return/redelivery policies. |
| Pricing | Shared pricing capability, used by storefront and shipment booking | Apply the same approved rule set to relevant service/route inputs; preserve the quote and inputs/rates used; propose remeasurement adjustments. | Silently rewriting an accepted quote or treating an unapproved adjustment as settled. |
| Payment and financial events | Server-side payment integration plus authorized Finance/operations responsibilities | Verify payment outcomes, record payment events, distinguish charges/credits/refunds, reconcile exceptions under approved permissions. | Browser callback as proof; operational status as payment status; unpaid-dispatch exception as payment success. |
| Admin oversight | Authorized Admin staff | Catalogue administration, operational summaries, authorized record maintenance, privileged approvals/settings/audit access as granted. | Full accounting/payroll/reconciliation by default; unrestricted access simply because a user is staff. |
| Finance | Finance function | Financial controls and reporting beyond Admin's operational financial visibility. | Duplicating order/shipment operational truth or creating conflicting payment states. |
| Management | Management reporting/decision function | Approved business metrics and drill-downs once defined. | Undefined metrics, invented profit figures, or automatic access to every record. |
| Audit, evidence, and disclosure | Cross-domain responsibility; accountable actor depends on workflow | Attribute important actions and approvals to an actor, timestamp, target, reason/outcome where applicable; protect evidence and record authorized disclosure. | Treating a log entry as proof that the underlying event occurred unless the evidence source supports it. |

## 5. Access-control model to carry forward

The following are design constraints; the detailed matrix is not yet approved.

- **Public:** access only to explicitly public content and public journey entry points.
- **Customer:** authenticated access to their own account and records; guest access only through the established guest entitlement mechanism.
- **Staff:** no staff access from customer sign-in alone; each privileged page, API, and data operation must enforce server-side authorization.
- **Operational actions:** intake, custody, route assignment, dispatch, delivery outcome, and failed-delivery resolution require explicitly authorized actors and defined transition rules.
- **Financial actions:** payment verification is server-side; refunds, credits, additional charges, reconciliation, and unpaid-dispatch exceptions require distinct approved permissions and audit evidence.
- **Location partners / providers / drivers:** no direct application access is assumed. If access is later required, define identity proofing, minimum data visibility, permitted actions, and revocation before implementation.
- **Management / reporting:** expose only approved metrics and drill-downs; define row-level and personal/financial data restrictions before implementation.
- **Sensitive disclosures:** a government request or other external request does not itself authorize disclosure; record the authorized decision and the disclosed evidence/reference.

No role names, custom claims, Firestore rules, collections, or permission code are prescribed by this conceptual draft.

## 6. Remaining actor and permission specification work

The high-level owner choices for staff model, booking eligibility, party relationships, location capabilities, dispatch exceptions, audit/disclosure, and launch boundary are accepted in DEC-022–DEC-036. This draft remains unapproved as a complete actor/permission specification. The following detail is still required:

1. **Action-level staff permissions:** Translate the minimal hybrid Admin/Operations model into a workflow/action matrix. Authentication or Admin status alone must not imply every permission. Define assignment, revocation, and authorization checks at each privileged boundary.
2. **Approval separation:** Identify which sensitive financial, measurement, dispatch, route, delivery, correction, and disclosure actions require a second approver, and define materiality/limits without contradicting accepted decisions.
3. **Location and partner access:** DEC-025 requires separately configured location capabilities. Specify who configures/assigns them, whether collection-centre partners ever receive direct access, and how staff-recorded actions identify the physical actor.
4. **Finance deployment boundary:** Financial responsibility remains distinct from Admin operational visibility. Decide whether Finance is a separate portal, a permission-protected module, or a later deployment choice.
5. **Management access:** Define whether Management is a separate role or reporting permission set, and which metrics/records may be drilled into.
6. **Shipper/business accounts:** DEC-023 requires registered, authenticated customers for independent booking. Define business-account handling and whether multiple authorized users may act for one business.
7. **Sender/receiver/payer authority:** DEC-024 accepts distinct parties and the default payer privacy boundary. Specify verification checkpoints, consent, change-type permissions, and lifecycle-stage restrictions.
8. **Support responsibility:** Decide whether support requires a distinct launch responsibility or remains with existing authorized staff; any support-assisted guest-order recovery/transfer must follow DEC-035 and DEC-033.
9. **External actor access:** Confirm whether transport providers, drivers, or collection-centre partners require direct login. Current launch boundary does not imply a Driver Portal; Operations records provider/driver movement evidence.
10. **Notification recipient scope:** Apply DEC-034 party entitlements and minimum disclosure to each event; no party relationship alone grants broader access than accepted policy.

These are detailed design questions under accepted high-level policy, not a reopening of the completed D-01–D-15 decision queue.

## 7. Acceptance criteria for the actor/responsibility model

- Every launch-essential journey names the initiating actor, accountable function, other participants, and any external system.
- Each responsibility is assigned to a function without assuming that function requires a separate portal.
- Customer, Admin, Operations, Finance, and Management responsibilities are distinguishable; the accepted minimal hybrid model is reflected, and unresolved action-level permission/approval rules are explicitly recorded.
- Sender, receiver, booking party, payer, and physical custodian are not assumed to be the same party; access, change authority, and collection entitlement are independently checked according to DEC-024.
- Every privileged or consequential action is assigned an authorization boundary and required audit/evidence fields, with unresolved rules flagged.
- The model preserves DEC-010, DEC-012, DEC-014, DEC-015, DEC-016, DEC-018, DEC-019, and DEC-021.
- The Driver Portal remains deferred at launch unless the owner changes scope.
- No schema, route, API, claim, role implementation, or portal is approved by this conceptual document alone.

## 8. Next workstream

After the owner reviews this actor/responsibility draft and resolves the decisions needed for the launch baseline, specify the shared workflows in this order:

1. Booking, quote, payment choice, and payment verification.
2. Physical intake, measurement, quote discrepancy review, and custody.
3. Route proposal, Operations review, route-leg assignment, and handover.
4. Dispatch gate and payment exceptions.
5. Delivery evidence and failed-delivery resolution.
6. Refunds, credits, additional charges, reconciliation, and related audit events.

This order is a proposed documentation sequence, not approval of unresolved business rules.


## Stage 5.1 — action-level permission specification

The proposed action-level staff authorization baseline is maintained in `PLATFORM_STAFF_PERMISSION_MATRIX.md`. It translates DEC-022 and related workflow decisions into a draft matrix without creating technical roles, claims, schemas, or implementation authority. The matrix remains subject to owner review; its open PM-01–PM-12 decisions must be resolved before the staff permission model is considered complete.


## Stage 5.1 — action-level permission specification

The proposed action-level staff authorization baseline is maintained in `PLATFORM_STAFF_PERMISSION_MATRIX.md`. It translates DEC-022 and related workflow decisions into a draft matrix without creating technical roles, claims, schemas, or implementation authority. The matrix remains subject to owner review; its open PM-01–PM-12 decisions must be resolved before the staff permission model is considered complete.
