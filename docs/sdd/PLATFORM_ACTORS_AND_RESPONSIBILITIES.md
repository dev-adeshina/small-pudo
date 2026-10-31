# VeriLyft Platform Actors and Responsibility Model

**Document status:** Draft actor/technical responsibility model — accepted owner policies incorporated; detailed specification and full SDD approval remain open  
**Last updated:** 31 October 2026  
**Scope:** Platform-level human/system actors, responsibility boundaries, and portal/module distinctions  
**Related decisions:** DEC-010, DEC-012, DEC-014–DEC-016, DEC-018–DEC-021, DEC-022–DEC-044; PM-01–PM-12; BP-01–BP-22

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
| Independent shipper / booking party | Confirmed | A registered, authenticated customer may book a shipment independently of a storefront purchase, individually or on behalf of a business. Under DEC-038, the business and the customer's relationship to it must be identified; a separate business-account system is not assumed at launch. | Guest shipment booking is excluded. Booking access is server-authorized and customer-scoped. Booking-party status does not grant blanket change or collection authority. Exact business identity/relationship representation and multiple-user authority remain open. Do not assume a separate Shipper Portal. |
| Sender | Conceptual business participant | Supplies or confirms parcel and origin information and may hand a parcel over. | Sender may differ from the booking party and payer. Identity verification, handover authority, and evidence requirements follow the approved intake policy; sender status alone does not imply full booking access or blanket change authority. |
| Receiver / collection recipient | Conceptual business participant | Receives a delivered parcel or collects it through an approved collection workflow. | Receiver/collection identity checks and collection authorization are required under the approved policy. Receiver status does not by itself authorize changes to a booking; detailed verification and evidence requirements remain open. |
| Authorized Admin staff | Confirmed as a privileged actor class; hybrid model accepted | Manage the storefront catalogue and oversee orders, shipments, transactions, pricing, network, settings, and operational visibility within approved permissions. | Exact action-by-action permissions and approval rules remain to be defined. Customer authentication alone is insufficient; sensitive actions must have explicit server-enforced boundaries. |
| Operations staff | Confirmed responsibility; hybrid staff model accepted | Review/adjust proposed route legs, approve transport assignments, manage shipment operations, record launch-time milestones, and review consequential failed-delivery exceptions. | Driver Portal is deferred. Exact lifecycle transitions, approval limits, and workflow-specific separation-of-duties rules remain unresolved; a separate portal is not implied. |
| Staffed PUDO station staff | Operational actor; authority is capability- and permission-scoped | Perform only the intake, measurement, custody, payment, handover, or collection actions enabled for the location and assigned to the staff member. | Each action requires the staff member's assigned permission and the location's active capability (DEC-025 / PM-03). Do not infer that every station performs every operation. |
| Registered collection-centre operator / partner | External physical actor; no direct platform login at launch | Perform only the physical services configured for the collection-centre location; authorized internal staff manage platform records. | PM-09 excludes direct partner login at launch. The physical actor must remain distinguishable from the staff member who records the event. |
| Transport provider / carrier | Confirmed as a conceptual external party | Performs an assigned transport leg and supplies agreed handover/movement information. | Provider onboarding, service-level commitments, proof format, and integration versus manual recording are unresolved. |
| Driver / courier | External physical actor; no direct platform login at launch | Physically performs assigned transport/delivery work and may supply movement or delivery evidence to VeriLyft staff. | PM-09 excludes direct driver login at launch. Operations staff manage assignments and record milestones while identifying the physical actor. |
| Finance staff / Finance function | Finance responsibility boundary confirmed; deployment model unresolved | Handle financial operations such as reconciliation, refunds/credits, expenses, commissions/payouts, payroll scope, and financial reporting according to approved policy. | Admin may show operational financial summaries but is not the full Finance function. Whether Finance is a separate deployed portal, a protected module, or both remains a product/architecture decision. |
| Management / business owner | Accepted launch policy: reporting/oversight responsibility, not a separate operational role | Review approved business-performance and operational information through explicitly assigned reporting/oversight permissions. | PM-10: no separate Management operational role at launch. Metric definitions, permitted drill-down, and exact reporting access remain open; no operational or administrative authority is implied. |
| Customer support / service staff | Accepted launch responsibility; no separate portal | Assist with enquiries, limited customer/order lookup, recovery, complaints, and operational escalation within explicitly assigned access. | PM-11: Support access does not imply financial, custody, dispatch, or unrestricted audit privileges. Sensitive actions are escalated to appropriately authorized staff; detailed visibility and case procedure remain open. |
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

The owner-policy boundaries below are accepted in DEC-022–DEC-038, PM-01–PM-12, and BP-01–BP-22. This actor model remains a draft because detailed technical representation, workflow contracts, evidence, and full SDD approval are still open. The following are specification dependencies, not pending owner-policy decisions:

1. **Action-level authorization contract:** Complete the action/resource/scope matrix, assignment lifecycle, server-side enforcement points, revocation behaviour, and compatibility with the existing Admin allowlist/custom-claim source. PM-01–PM-04 and PM-08 define policy constraints; they do not approve a technical permission schema.
2. **Approval separation:** Apply the accepted second-person rules for consequential financial actions, material measurement adjustments, and consequential operational exceptions. Monetary/materiality thresholds, approver eligibility, and detailed case boundaries remain open under PM-05–PM-08.
3. **Location and staff assignment:** Specify how designated Admin users configure location capabilities and assign staff permissions/scopes; the action requires both assigned staff permission and active location capability (DEC-025 / PM-03).
4. **Finance boundary:** Finance responsibility remains distinct from Admin operational visibility. Deployment as a separate portal or protected module is not decided; do not infer a Finance staff permission model from Admin access.
5. **Management reporting:** PM-10 accepts reporting/oversight permissions only and no separate operational role at launch. Metric definitions, drill-down scope, and permitted sensitive-data visibility remain open.
6. **Business booking representation:** DEC-038 permits a registered customer to arrange a shipment for a business, identifying the business and the customer's relationship. Exact representation and multiple-user authority remain open; a separate business-account system is not assumed for launch.
7. **Party verification and consent:** BP-01–BP-22 define accepted change, collection, transfer, delegation, privacy, dispute, and appeal boundaries. Identity/consent methods, evidence, exact lifecycle gates, and technical enforcement remain open.
8. **Support access and process:** PM-11 accepts a limited Support responsibility without a separate portal. Define the detailed customer/order visibility, case/evidence handling, escalation, and recovery procedure without granting automatic finance, custody, dispatch, or unrestricted audit access.
9. **External physical actors:** PM-09 excludes direct partner/driver login at launch. Define how internal staff record and attribute physical events while distinguishing the physical actor from the recording staff member.
10. **Notification scope:** Apply DEC-034 and BP-09 recipient entitlements, consent/preferences, minimum fields, retries, and failure ownership; these details remain open.

These are technical and operational specification dependencies under accepted owner policy, not a reopening of completed owner decisions.

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

The high-level actor and responsibility policies are accepted. Continue the Stage 5.5 cross-document reconciliation by aligning these boundaries with the shared workflows, lifecycle contracts, source traceability, and A-01–A-20 / ADM-R01–ADM-R54 evidence mapping. Resolve technical and operational dependencies without reopening accepted owner policy or authorizing implementation.


## Stage 5.1 — action-level permission specification

The proposed action-level staff authorization baseline is maintained in `PLATFORM_STAFF_PERMISSION_MATRIX.md`. PM-01–PM-12 are accepted owner-policy decisions recorded in `PLATFORM_STAFF_PERMISSION_DECISIONS.md`; the matrix remains a proposed technical/action-level translation. It does not approve a technical role/claim schema, API, Firestore rules, or implementation.


## 9. Owner decision update — staff permissions and launch responsibility boundaries

The actor catalogue above contains earlier unresolved statements that predate the owner's resolution of PM-01–PM-12. For the launch policy baseline, the later accepted decisions in `PLATFORM_STAFF_PERMISSION_DECISIONS.md` supersede those earlier unresolved statements:

- **Staff permission administration:** only designated Admin users may grant/change/revoke permissions; Admin status alone is insufficient.
- **Permission assignment:** action-level permissions, optionally grouped into permission sets, with relevant location scope.
- **Location capabilities:** designated Admin users configure each capability independently; staff require both assigned permission and active location capability.
- **Pricing:** designated Admin users control pricing/rate configuration; accepted quotes retain their original terms/rate version.
- **Partner and driver access:** no direct platform login at launch; internal staff record operational events and identify physical actors.
- **Management:** no separate operational role at launch; explicitly assigned reporting/oversight permissions only.
- **Support:** a defined launch responsibility with limited customer/order access and escalation boundaries; no separate portal.
- **Emergency access:** controlled, justified, minimum-scope, time-limited, audited, reviewed, and revoked.

Second-approval policy is accepted for consequential financial, measurement, and operational exceptions as specified in `PLATFORM_STAFF_PERMISSION_DECISIONS.md`. Exact materiality/monetary thresholds, permission catalogue, technical assignment/enforcement model, Support visibility, Management reporting scope, and emergency-access parameters remain open.

This addendum resolves owner-policy questions only. It does not approve technical roles, Firebase claims, Firestore rules, schemas, APIs, portals, or implementation. The complete platform-wide SDD remains subject to reconciliation and explicit owner approval before application-code changes.

## Booking-party and shipment-party authority update — DEC-023 / DEC-024

The owner has accepted detailed policy BP-01–BP-22 in `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`. This accepted policy supersedes earlier actor-catalogue wording that described booking amendment/cancellation authority, Support, or delegated access as wholly unresolved.

- **Booking party:** authenticated customer who may initiate permitted pre-intake changes/cancellation and request transfers, withdrawal, collector nominations, or delegated access under BP policy. This is not blanket authority over every party, financial obligation, or parcel release.
- **Sender and receiver:** may raise relevant change/dispute requests through Support; they do not directly edit/cancel the booking solely by virtue of being listed. Receiver collection and receiver-nominated alternative collection require verification.
- **Payer:** payment confirmation/receipt visibility by default; no inferred shipment-detail, edit, cancellation, or collection authority.
- **Support:** records and verifies party requests, acknowledges/routes disputes, and escalates exceptions; does not assume booking-party authority.
- **Designated Admin/reviewer:** handles defined exceptions, sensitive changes, disputes, and appeals only within explicitly assigned authority.
- **Delegated customer:** receives only explicit, limited, time-bounded, revocable, non-transferable access; no sub-delegation.

Verification methods, detailed staff permissions, business identity/relationship representation and multiple-user authority, operational evidence, and technical enforcement remain open. This policy addendum does not approve a separate Support portal, role schema, permission claim, or application implementation.


## Independent shipment booking responsibility update — DEC-038

The owner has accepted the independent shipment booking policy recorded in DEC-038. The following responsibilities are accepted at the business-policy level; the detailed permission matrix and technical enforcement remain open.

- **Booking party/customer:** Must provide accurate booking, parcel, and relevant party information; review the quotation and communicated service-specific handover deadline; explicitly accept the valid quotation; choose an allowed payment path; and arrange timely physical handover. The authenticated booking party may initiate permitted pre-intake changes/cancellation under BP-01–BP-03. A customer arranging a business shipment must identify the business and their relationship to it; a separate business-account system is not assumed for launch.
- **Sender / receiver / payer / handover person:** These are distinct relationships and may be occupied by different people. Their association does not automatically confer booking-edit, cancellation, full shipment-detail, payment, or collection authority. Verification and access follow BP policy and the relevant workflow.
- **Support:** Helps customers, records and verifies enquiries/change/dispute requests, and routes or escalates them. Support must not assume booking-party authority, independently mutate a booking without the required authorization, approve a refund, alter custody evidence, or release a parcel merely because a request was received.
- **Operations / authorized location staff:** Prepares and manages operational work; verifies service/location capability; records actual intake, measurements, custody, movement and delivery events only within assigned permissions; and handles post-intake changes through controlled staff-mediated procedures. Booking confirmation is not evidence of physical receipt.
- **Admin:** Handles designated exceptions, authority disputes, sensitive changes, and approvals only within explicitly assigned permissions. Admin status does not automatically authorize every financial or operational action.
- **Staff-assisted booking:** Staff may assist a customer, but must not impersonate the customer or accept a quotation on the customer's behalf without an explicitly approved authorization process. A staff-created walk-in intake is distinct from an independent customer booking.
- **External physical actors:** Drivers, transport providers, and collection-centre operators may perform assigned physical activities. No direct platform login or unrestricted shipment access is implied at launch; authorized internal staff record and verify operational events while identifying the physical actor.

This policy does not approve specific screens, portals, roles, claims, permission sets, data fields, APIs, or application-code changes. The complete platform-wide SDD approval gate remains in force.


## 10. Decision-propagation reconciliation — DEC-037–DEC-044

This section makes the accepted logistics, booking, pricing, measurement, settlement, intake, location-capability, and custody policies explicit in the actor model. It does not create new roles, grant permissions, settle unresolved procedures, or authorize technical implementation.

| Decision | Actor responsibilities and boundary | Explicit non-inference / unresolved specification |
|---|---|---|
| **DEC-037 — logistics-first hierarchy** | The independent shipper/booking party is the primary customer actor for the core logistics workflow. Storefront customers remain a supported, secondary order source. Operations owns the shared fulfilment work for shipments and storefront orders requiring delivery; Admin provides only its assigned oversight/configuration/exception responsibilities. | Storefront orders and independent shipments remain distinct business records/concepts. Shared fulfilment does not approve a duplicate fulfilment process, new data model, or separate portal. |
| **DEC-038 — booking confirmation and responsibilities** | The authenticated booking party supplies accurate, service-required booking/party information; reviews the valid quote and service-specific handover deadline; explicitly accepts the quote; chooses an allowed payment path; and arranges timely handover. Support records and verifies requests and escalates; it does not impersonate the customer or assume booking-party authority. Operations/authorized location staff manage actual intake and post-intake operational changes. Designated Admin/reviewers handle exceptions only within assigned authority. | Sender, receiver, payer, booking party, and physical handover person may differ. Their relationship does not confer edit, cancellation, payment, shipment-detail, or collection authority by itself. Staff-assisted booking authorization, service-specific information, identity checkpoints, and detailed lifecycle/API contracts remain open. |
| **DEC-039 — pricing boundaries** | The trusted server is the authoritative calculator. The customer may provide declared inputs; staff-assisted quoting must use the same approved service configuration and rule/rate authority. Designated Admin users control pricing/rate configuration under assigned authority. Staff who measure parcels do not thereby gain pricing authority. | No actor may invent formulas, rates, units, fees, or inputs. Service-to-model/input mapping, source data, rounding, effective dates, quote validity, and configuration-review rules remain open. |
| **DEC-040 — measurement adjustment and service resolution** | Assigned location staff record actual measurements separately from declared values and may propose an adjustment only within assigned authority. An authorized reviewer applies the required review/second-approval rule before a proposal is approved. The customer makes an explicit accept/reject decision. An authorized service-resolution decision-maker determines any permitted operational outcome after rejection. | Routine measurement does not automatically require second approval; material/payment-impacting adjustments require review and applicable second approval, with proposer not self-approving. Silence is not acceptance. Rejection does not itself cancel, refund, credit, or authorize a charge. Exact thresholds, units, approver eligibility, response periods, and service-resolution authority remain open. |
| **DEC-041 — payment and settlement** | The system/provider supplies authoritative electronic payment confirmation; assigned staff may record permitted intake collections and investigate/reconcile discrepancies. Finance responsibility handles financial operations within its separately specified authority. Operations checks the settlement gate before dispatch and does not treat a dispatch exception as payment. | Booking acceptance, physical custody, payment, refund request/approval/execution, credit, reversal, and chargeback remain distinct. Partial payment is permitted only for an explicitly eligible service and does not satisfy the normal full-settlement dispatch gate. Exact methods, limits, receipt standards, reconciliation ownership, and financial permissions remain open. |
| **DEC-042 — intake and custody** | The booking party arranges handover; the physical handover person may be different. Assigned staff at an active, service/action-capable location verify relevant authority and record the actual physical outcome. Staff-created walk-in intake is distinct from customer booking. Where a parcel is physically retained pending review, staff record custody and the hold rather than leaving possession ambiguous. | Refusal before custody, accepted custody, and receipt under hold remain distinct. Booking, payment, intake, and dispatch are not interchangeable. Service-specific inspection, measurement, identity, acknowledgement, evidence, hold, and partner procedures remain open. |
| **DEC-043 — location capabilities** | Designated Admin users configure location capabilities only within explicitly assigned configuration authority. Each operational actor must independently hold the relevant action permission and scope; the location must independently be active and enabled for the service and action. Internal staff record external partner/driver physical activity and identify the physical actor/source. | Location type/name, Admin status, staff permission, or one enabled capability does not imply another capability. Revocation blocks new work but does not erase or transfer existing custody. Exact service/location/action mapping and assignment mechanics remain open. |
| **DEC-044 — custody transfers and physical exceptions** | The physical handover actors perform the transfer; the actual receiving actor takes possession; authorized internal staff record the event and distinguish physical actor from recorder. Authorized reviewers/investigators handle failed/disputed/incomplete transfers, missing/damaged parcels, incorrect location assignments, and prolonged holds. A correction actor records a traceable correction while preserving the original event/evidence. | Proposed/attempted transfer, route assignment, dispatch authorization, arrival, or staff record alone does not prove possession changed. Preserve last confirmed custody until physical change is established. No automatic fault, liability, refund, credit, compensation, insurance, or customer entitlement follows from a physical exception. Exact proof, confirmation/dispute/correction authority, investigation ownership, hold controls, and retention remain open. |

### 10.1 Cross-cutting actor rules

- The actor who performs a physical act, the person who reports it, and the staff member who records it are distinct identities where applicable; records must not imply direct observation when staff rely on a third-party report.
- A location capability and an individual's assigned permission are independent, cumulative guards for location-dependent actions. Both must be satisfied server-side.
- Pricing authority, measurement authority, payment-recording authority, custody authority, dispatch authority, evidence-review authority, and correction authority are separate; one does not imply another.
- A customer's commercial acceptance, payer relationship, sender/receiver listing, or booking-party status does not by itself establish physical custody or parcel-release entitlement.
- Physical exceptions preserve the last confirmed custody and evidence history. Administrative correction is not a physical transfer.
- The above are actor-responsibility translations of accepted policy. They do not resolve exact identity methods, service-specific procedures, permission catalogues, status vocabulary, data/API contracts, evidence retention, or executable tests.
