# VeriLyft Platform Actors and Responsibility Model

**Document status:** Draft for owner review — not approved for implementation  
**Last updated:** 29 October 2026  
**Scope:** Platform-level human/system actors, responsibility boundaries, and portal/module distinctions  
**Related decisions:** DEC-010, DEC-012, DEC-014, DEC-015, DEC-016, DEC-018, DEC-019, DEC-021

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
3. A shipment sender, receiver, payer, booking party, and person physically handing over or collecting a parcel may be different people. Their relationships and proof requirements must be defined in the relevant workflows.
4. A role describes responsibility; a portal or page is only an interface. Do not create a separate application solely because a functional area has its own name.
5. Authentication establishes identity, not permission. Customer identity never implies Admin or staff access.
6. Privileged actions require server-side authorization. Sensitive approvals, overrides, payment adjustments, custody changes, and disclosures should be attributable and auditable.
7. Payment state, order state, shipment state, and individual transport-movement state must not be treated as interchangeable.
8. The least authority needed for the approved task should be granted. DEC-022 accepts a minimal hybrid model: Admin and Operations are distinct responsibilities, routine actions may be shared where assigned permissions allow, and sensitive actions require explicit permission/approval boundaries. The action-by-action authorization matrix remains unresolved.

## 3. Actor catalogue

| Actor / actor class | Status | Main responsibility or interaction | Boundaries and unresolved points |
|---|---|---|---|
| Public visitor | Proposed | Browse public storefront information and products; begin a purchase or shipment-booking journey if offered publicly. | Publicly available shipment-booking steps and rate visibility need workflow definition. |
| Storefront customer — guest | Confirmed in principle | Purchase VeriLyft's own products without mandatory account registration; access an order using the approved guest-access mechanism. | Guest checkout is preserved. Guest-order recovery/claiming is unresolved (VLY-004). |
| Storefront customer — signed in | Confirmed | Manage own account/profile and access only orders associated with verified ownership. | Account identity does not grant staff/Admin access. Whether and how an existing guest order can be claimed remains unresolved. |
| Independent shipper / booking party | Confirmed | Book a shipment independently of a storefront purchase, as an individual or business. | Eligibility, account requirement, booking amendments/cancellation, business accounts, and how the booking party relates to sender/payer are unresolved. Do not assume a separate Shipper Portal is required. |
| Sender | Conceptual business participant | Supplies or confirms parcel and origin information and may hand a parcel over. | Sender may or may not be the booking party or payer. Identity verification and evidence requirements are unresolved. |
| Receiver / collection recipient | Conceptual business participant | Receives a delivered parcel or collects it through an approved collection workflow. | Receiver identity checks, collection authorization, and evidence requirements are unresolved. |
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

## 6. Decisions required before this model can be approved

The high-level staff model is accepted in DEC-022. This draft still requires workflow-specific authorization detail and owner decisions below.

1. **Operations versus PUDO:** Can staffed station personnel record intake/custody directly, or must Operations staff create/approve those records? Can registered collection-centre partners access the system, or are their actions recorded by VeriLyft staff?
3. **Finance deployment boundary:** Should Finance be a distinct portal, a permission-protected module in the existing application, or a later decision? The financial responsibilities remain distinct regardless of deployment.
4. **Management access:** Is Management a separate role, a limited reporting permission set, or part of Admin for the first release? Which sensitive records may be drilled into?
5. **Shipper identity and account:** Must an independent shipper register/sign in, or can a guest book a shipment? Can a customer also be a shipper under one account? This must preserve the accepted guest-checkout principle unless explicitly changed.
6. **Sender, receiver, and payer:** Which party must be identified and verified at booking, intake, collection, and delivery? Who can authorize changes or cancellation?
7. **Support role:** Is customer support a real launch responsibility requiring a distinct role, or should support actions remain with existing authorized staff?
8. **Approval separation:** Which actions require a second person or higher authority, especially unpaid dispatch, material price adjustment, refunds/credits, failed-delivery resolution, and disclosure? DEC-022 requires explicit boundaries for sensitive actions but does not decide every threshold or second-person rule.
9. **External actor access:** Are transport providers, drivers, or collection-centre partners ever expected to log in during launch? Current default in this draft is no direct access; Operations records their movements.

These questions are not answered by the current documents. They must be resolved before implementing fine-grained access rules or role-specific interfaces.

## 7. Acceptance criteria for the actor/responsibility model

- Every launch-essential journey names the initiating actor, accountable function, other participants, and any external system.
- Each responsibility is assigned to a function without assuming that function requires a separate portal.
- Customer, Admin, Operations, Finance, and Management responsibilities are distinguishable; the accepted minimal hybrid model is reflected, and unresolved action-level permission/approval rules are explicitly recorded.
- Sender, receiver, booking party, payer, and physical custodian are not assumed to be the same party.
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
