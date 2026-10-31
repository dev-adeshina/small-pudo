# VeriLyft API, Persistence and Integration Boundary Contract

**Status:** Review 3 technical-design support; conceptual boundaries only, not an approved schema, API catalogue, implementation architecture or deployment design  
**Prepared:** 31 October 2026  
**Documentation baseline:** PR #75 merge commit `f9ad98fe0c76929d139849bde1376592e21a4454`  
**Application-source inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856`  
**Related:** `PLATFORM_TECHNICAL_CONTRACT_RECONCILIATION.md`, `PLATFORM_DOMAIN_BOUNDARY_AND_IDENTITY_DECISION_MATRIX.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, `PLATFORM_LIFECYCLE_EVENT_AND_STATE_CONTRACT_MATRIX.md`, `PLATFORM_MUTATION_AUTHORIZATION_AND_RECOVERY_MATRIX.md`, `PLATFORM_PRODUCTION_READINESS_AND_OPERATIONAL_EVIDENCE_CONTRACT.md`, `PLATFORM_REQUIREMENT_DEPENDENCY_TRACEABILITY.md`, `PLATFORM_CONSOLIDATED_OWNER_DECISION_PACKAGE.md`

## 1. Purpose and authority

This document translates the accepted business/domain boundaries into conceptual API, persistence, transaction and external-integration responsibilities. It is intended to keep future implementation aligned with existing Next.js App Router, Firebase Authentication, Firestore, Firebase Admin, Paystack and Cloudinary boundaries where those are suitable, while preventing unrelated business facts from being collapsed into an overloaded order or status record.

It is a design contract, not an implementation prescription. It does not approve:
- route paths, HTTP methods, request/response field names, collection/document names, indexes, schemas, enums, identifiers or cardinalities;
- a new service, microservice, portal, event bus, event-sourcing architecture, CQRS framework, workflow engine or generalized repository layer;
- a provider, payment method, pricing formula, shipment rate, unit, threshold, timeout, retry count, retention period or numerical service level;
- a Firestore transaction boundary for future domains before the relationship and consistency decisions are settled.

The authoritative owner decisions remain in the decision register and accepted DEC/PM/BP documents. This contract must not silently resolve DB-01–DB-12 or other business-policy blockers.

## 2. Evidence provenance and limitations

The source-backed observations in this document are bounded by the recorded source inspection baseline `e0f69055d33dd9399c23e1d793f359468229c856` and the crosswalk in `PLATFORM_TECHNICAL_CONTRACT_RECONCILIATION.md`. They are not a fresh source review, runtime result, deployed configuration check, production-data observation or provider-dashboard verification.

At that inspection baseline, source-backed capabilities include:
- storefront order creation with server-side validation, duplicate product-line normalization, trusted current price/stock checks, stock reservation and order creation in a Firestore transaction;
- guest-order access using a narrowly scoped token whose hash is stored, with token-derived authorization for tracking/cancellation;
- authenticated customer account/order endpoints using Firebase ID-token verification and customer ownership checks;
- Paystack initialization, verification and webhook handling with server-side reference/amount/currency checks, webhook signature validation and event-processing/deduplication patterns;
- coarse Admin authentication/authorization checks in server-side helpers and protected Admin API paths;
- catalogue client writes constrained by Firestore rules and Admin claim/verified-email requirements;
- a constrained Cloudinary image-upload endpoint with server-side authorization and upload validation;
- storefront-order fulfilment fields and Admin transitions for paid non-cancelled orders.

The inspected source inventory did not establish independent shipment booking, shared shipment pricing/quotes, PUDO location capability management, physical intake/custody, route proposal/assignment, transport movement/handover, service-specific delivery proof, general audit/evidence, general financial reconciliation/refund/credit, or general event notifications.

## 3. Architecture guardrails

1. **Reuse before extension.** A requirement must first be mapped to an existing route, helper, Firebase boundary, provider integration or component. Propose an extension only where a documented capability gap remains.
2. **One authoritative owner per business fact.** A screen, API response, denormalized view or cached copy may display a fact but must identify its authoritative source and freshness/repair contract.
3. **Logical separation does not mandate physical separation.** Different business concepts may share an existing application or database boundary where the consistency and authorization contract supports it. This document does not require one collection, service or API per domain.
4. **No overloaded lifecycle.** Storefront order, independent booking, quote, parcel, intake, custody, route assignment, movement, delivery, payment and financial resolution remain distinguishable concepts.
5. **Server-side authority.** Client state, hidden controls, caller-supplied role/UID, browser totals, callback query parameters and notification delivery do not establish privileged or business facts.
6. **External effects are not database transactions.** A Firestore transaction cannot make a remote provider charge, refund, upload, physical handover or message send atomic. Define an explicit unknown-outcome and reconciliation path.
7. **Physical and financial truth are separately evidenced.** Payment does not prove intake; dispatch does not prove custody transfer; delivery status does not prove delivery; an approved refund does not prove provider execution.
8. **No speculative platform architecture.** Do not introduce event sourcing, a universal event bus, generalized workflow engine, microservices or a second portal merely because a domain is new.

## 4. Logical operation categories

The future API and application design must distinguish these operation purposes. These are conceptual responsibilities, not a mandate for separate routes or services.

| Operation category | Responsibility | Contract |
|---|---|---|
| Command | Requests a state-changing business action | Authenticate principal; establish entitlement and action authority; validate trusted inputs and current lifecycle; enforce concurrency/replay rules; record outcome/evidence; return an unambiguous result |
| Query | Reads a business fact or permitted projection | Establish record-level entitlement; return only permitted fields; identify stale/unavailable data where material; never mutate business state as a side effect |
| Provider interaction | Requests or verifies an external effect | Use server-held credentials; bind reference to purpose/amount/currency/target; authenticate provider events; handle unknown outcomes and reconciliation |
| Physical-event capture | Records an observed physical fact | Identify actual physical actor, receiver where relevant, recorder, event time, capture time, location, target, outcome, evidence and reason |
| Evidence action | Views, exports, corrects, holds or discloses evidence | Apply the distinct permission and approval rules from DEC-033/PM-08; preserve original evidence and attribute all amendments/disclosures |
| Projection/report | Presents derived or aggregated information | Declare source facts, calculation, freshness, scope and stale/unavailable behaviour; never become an alternate authority by display alone |

A command's successful HTTP response is evidence that the application returned a response. It is not independent proof of a provider-side payment, physical transfer, recipient possession or message receipt.

## 5. Domain API and persistence responsibility matrix

The following matrix states the required ownership and boundary, not the physical storage layout.

| Domain / fact | Authoritative responsibility | Command and query boundary | Consistency / external-effect concern | Source position and reuse constraint |
|---|---|---|---|---|
| Catalogue and product availability | Product/category business facts and approved catalogue visibility | Public catalogue query; authorized catalogue administration commands | Checkout must revalidate active status, current price and stock on the server | Existing product/category helpers, Admin pages and Firestore rules are source-backed; preserve existing patterns and verify category relationship assumptions before extension |
| Customer identity/profile | Firebase Authentication identity plus explicitly owned profile attributes | Authenticated profile commands and own-profile queries | Identity changes and profile writes must not grant shipment-party or staff authority | Existing account/profile endpoints and Firebase Auth patterns are source-backed; do not infer sender/receiver/payer/booking-party entitlements from profile existence |
| Storefront cart | Customer's current purchase intent, not an order or reservation | Client cart may remain a draft; server command validates every submitted line | Client price/stock/quantity are untrusted; repeated checkout and stock contention require safe outcomes | Existing local cart and server order route exist; no client cart value becomes authoritative commercial or stock fact |
| Storefront order | Confirmed purchase order and immutable order-time commercial/item context | Order creation/cancel/customer access/Admin management are distinct commands and queries | Preserve existing transactional stock reservation/release; payment and fulfilment are separate; cancellation/payment race requires explicit recovery | Existing `app/api/orders/**`, account-order routes and Admin-order routes are source-backed for storefront orders only |
| Guest order entitlement | Narrow guest capability for the specific permitted order actions | Token-based tracking/cancellation only within its defined scope; DEC-035 recovery/claiming is a separate protected process | Token secrecy, expiry/replay/revocation and recovery challenge must not expose another party's data | Existing hashed guest token pattern is source-backed; it is not an account identity, shipment-party relationship or collection authority |
| Commercial quote | Versioned offer with trusted input/rate context and explicit acceptance | Quote calculation/issuance, retrieval, acceptance and expiry are distinct logical operations | Acceptance must bind to the exact valid quote; later rate changes must not rewrite accepted terms | No shared shipment quote/rate service found; formulas, units, rounding, validity and rate ownership remain blocked |
| Independent shipment booking | Confirmed service instruction and accepted commercial terms | Booking-party command confirms an accepted quote; permitted party queries/actions are entitlement-specific | Booking creation is not physical intake; booking/parcel relationship and change rights remain unresolved | No active independent booking source found; DB-01 and related party/cardinality decisions block final design |
| Shipment / parcel identity | Physical item(s) and their approved relationship to a booking/order | Parcel creation/link/split/merge operations only after cardinality policy is approved | Booking-to-parcel and parcel-to-leg cardinality cannot be inferred; preserve stable identity across events | No independent shipment/parcel source found; DB-01–DB-03 block final persistence design |
| Payment attempt/provider transaction | Provider interaction for a defined business purpose | Initialize, verify, webhook processing and status query remain separate responsibilities | Provider success, local persistence, duplicate callback and unknown outcome must reconcile; amount/currency/purpose checked server-side | Paystack paths exist for current storefront orders; reuse compatible verification and event-deduplication patterns, not assume general multi-purpose settlement is implemented |
| Financial event/reconciliation | Finance-owned charge/refund/credit/reversal/write-off/reconciliation facts | Request, independent approval, provider execution, confirmation and reconciliation are separate commands/facts | External provider effect is not atomic with local persistence; no blind retry; preserve original amount, purpose and history | No complete refund/credit/financial ledger/reconciliation service found; Finance boundaries and thresholds remain open |
| Location and service capability | Approved location state, service enablement and action capability | Authorized capability configuration commands; location/service eligibility query | Location capability and staff action permission are independent; revocation must not erase existing custody/history | No active location-capability source found; exact service/location/action matrix remains owner input |
| Intake and measurement | Actual physical receipt, inspection and measured facts | Authorized physical-event capture; separate declared and actual measurement facts | Occurrence time vs capture time, offline capture, duplicate scan and discrepancy review must be handled; units/thresholds unresolved | No active intake/measurement source found; do not reuse order status as intake |
| Custody transfer | Actual change of physical possession and last confirmed custodian | Transfer is recorded only after actual handover and receiving-party possession under DEC-044 | Failed/disputed/incompletely evidenced handover preserves last confirmed custody; corrections preserve originals | No active custody service found; no status-only or dispatch-only substitute is acceptable |
| Route proposal and assignment | Proposed route and authorized assignment decision | Proposal, approval, assignment, reassignment and movement remain separate operations | Stale proposal/capacity conflict/concurrent assignment require explicit resolution; assignment is not movement | No active route/assignment source found; DB-03 parcel/route-leg relationship remains open |
| Movement and dispatch | Authorized dispatch decision and separately observed movement facts | Dispatch authorization and physical movement capture are separate | Actor/recorder and location/time evidence; delayed/offline/out-of-order events reconcile without rewriting history | No route-leg/movement/handover source found; storefront shipping metadata is not a transport event model |
| Delivery / collection / return | Attempt, successful proof, collection, failure and return outcomes | Attempt and completion are separate commands/events; receiver entitlement is independently checked | Proof must meet approved service-specific standard; failed attempt does not silently close; return is conditional and separately gated | Existing storefront `delivered` state is not general proof-of-delivery or collection/return evidence |
| Support / exception | Case intake, verification, recordkeeping and escalation | Support can assist and route a request but cannot assume Finance, custody, dispatch, audit disclosure or approval authority | Disputed facts remain held for authorized review; Support note does not change authoritative domain fact | No general exception workflow found; DEC-030 and accepted Support boundary control future design |
| Audit / evidence | Attributable consequential-action and evidence history | Capture, view, export, correction, hold and external disclosure are distinct permissions/actions | Preserve originals; append attributable correction; access/export/disclosure separately controlled; legal hold overrides ordinary disposal | No general audit/evidence service found; Cloudinary image uploads are not a general evidence vault |
| Notifications | Delivery attempt for a verified business event and entitled recipient | Trigger, compose, send attempt, provider outcome and retry are separate | Notification never changes the underlying business state; duplicate/unknown delivery must be safe | Narrow guest tracking communication exists; no general recipient/channel/field/retry matrix or Telegram activation |
| Operational reporting | Derived view of authoritative domain facts | Queries/projections with explicit metric definitions and role scopes | Freshness, missing source, duplicates and calculation lineage must be visible | Existing Admin dashboard contains demo metrics; do not treat them as operational truth |

## 6. Persistence and record-integrity contract

Any future persistence design must demonstrate these properties before schema approval:

1. **Authoritative ownership:** each business fact has one declared write authority. Copies and projections identify their source and repair/rebuild approach.
2. **Relationship integrity:** booking, quote, order, parcel, payment, financial event, location, custody, route leg, movement and evidence relationships are explicit and validated. Do not assume one-to-one or one-to-many cardinality where DB-01–DB-12 remain unresolved.
3. **Accepted commercial snapshot:** the accepted quote/order context remains explainable after catalogue, rate or configuration changes. Current configuration cannot silently rewrite historical agreement.
4. **State and history:** current state is consistent with the authoritative event/decision history; corrections link to preserved originals and do not fabricate a physical event.
5. **Cross-domain independence:** payment, booking, order, intake, custody, movement, delivery and financial resolution are not collapsed into one status or inferred from one another.
6. **Access isolation:** record identity is not authorization. Queries and mutations enforce the actor's entitlement and action permission at the trusted boundary.
7. **Evidence linkage:** consequential facts point to attributable evidence as required by the applicable policy; evidence access is purpose-limited and separately authorized.
8. **Deletion/retention:** deletion, redaction, archival and legal hold follow approved category-specific policy. This document sets no retention duration.
9. **Recoverability:** backups, restores, provider reconciliation and correction preserve relationships and history; no recovery silently overwrites an authoritative external fact.
10. **Projection integrity:** dashboards and summaries are derived, permission-aware, reproducible and explicit when stale or unavailable.

This is a set of invariants. It does not prescribe document normalization, denormalization, subcollections, collection names, event sourcing or a universal record-per-event rule.

## 7. Transaction and consistency boundary candidates

A technical design must state which facts need atomic local persistence, which external effects occur outside that boundary, and how a partial/unknown outcome is reconciled.

| Candidate boundary | Local consistency objective | Non-atomic side effect / failure risk | Required design evidence before implementation |
|---|---|---|---|
| Storefront order + stock reservation | Preserve existing Firestore transaction that validates current product/stock and creates the order/reservation together | Payment initialization occurs outside the local transaction; checkout may be abandoned or provider outcome may be unknown | Regression evidence for concurrent stock, duplicate submission, transaction failure, cancellation/payment race and at-most-once stock release |
| Payment provider + local payment/order state | Local transition must be protected against duplicate/concurrent processing and linked to the provider reference | Provider can succeed while local write/callback fails; callbacks can be delayed/replayed | Provider sandbox cases, signature/reference/purpose/amount/currency checks, event deduplication, unknown-outcome reconciliation and Finance review path |
| Quote acceptance + booking confirmation | Accepted quote version and booking confirmation must not diverge | Concurrent quote revision/expiry or duplicate acceptance | Approved booking/quote cardinality, acceptance authority, version semantics and local consistency decision |
| Booking + parcel relationship | Approved booking-to-parcel link must remain consistent | Physical parcel may be presented before all system data is available | Owner-approved cardinality, parcel identity and offline/intake reconciliation |
| Intake + initial custody | Accepted physical receipt and initial custody must be represented consistently | Physical event may precede delayed/offline capture or evidence upload | Proof standard, event/capture times, actor/receiver attribution, location capability, duplicate/conflict resolution |
| Custody transfer + evidence | Transfer fact and required evidence must not diverge into a falsely completed transfer | Evidence storage may fail or be delayed; receiver may dispute possession | DEC-044 proof criteria, hold/review path, evidence persistence/integrity and correction design |
| Route assignment + dispatch authorization | Approved assignment and dispatch gate must be checked against current work/holds | Concurrent assignment/reassignment or external carrier instruction may be unknown | Role/approval matrix, route/parcel cardinality, conditional update and external instruction reconciliation |
| Provider refund/credit + local financial state | Request, approval, provider execution, confirmation and local financial event remain separately attributable | Provider execution may succeed while local persistence is unavailable | Provider-specific reference and query mechanism, safe retry, reconciliation owner and approval separation |
| Audit/evidence + consequential mutation | Required audit/evidence must be reliably linked to the action | Separate writes may leave an untraceable mutation or orphan evidence | Approved evidence catalogue, atomicity/append strategy, failure containment and integrity review |
| Notification + business event | Business event remains authoritative regardless of notification outcome | Provider may accept/deliver message while response is lost | Trigger identity, recipient entitlement, duplicate suppression, unknown delivery and safe retry policy |

No future cross-domain atomic transaction is assumed. The final design must choose the smallest safe consistency boundary supported by the actual platform and approved domain relationships. Where physical action cannot be made atomic with digital capture, the operating procedure must preserve event time, capture time, evidence and reconciliation.

## 8. API contract requirements

Each proposed API operation must have a specification record before implementation, containing:

- business purpose and authoritative domain owner;
- command/query/provider/evidence category;
- actor principal and authentication method;
- record entitlement and booking-party/party relationship checks;
- exact action permission and scope; location capability where relevant;
- lifecycle preconditions, holds and independent-approval requirement;
- trusted input source, validation and server-side recalculation;
- expected business fact/state transition and fields that must remain unchanged;
- concurrency, stale-write and duplicate/replay behaviour;
- provider interaction and unknown-outcome/reconciliation route where relevant;
- evidence/audit attribution and privacy constraints;
- success, denial, validation, conflict, pending/unknown and failure response semantics;
- observability/correlation requirements and secret/PII redaction;
- acceptance cases, fixture/cleanup plan, evidence artifacts and independent reviewer.

A request must not return a definitive success when the underlying outcome is pending, unknown, disputed or merely proposed. Error responses must not leak protected record existence, secrets, provider signatures, another party's data or internal authorization details.

No HTTP status catalogue, route naming convention, rate limit, payload schema or versioning policy is invented here; those are to be specified consistently with the existing App Router and API conventions when the domain contracts are approved.

## 9. Query, projection and reporting contracts

A query must define:
- its authoritative source and owner;
- which identities/relationships may see the record and which fields;
- whether the result is current authoritative state or a derived projection;
- source freshness and expected update lag, if applicable;
- how missing, stale, partial or unavailable data is represented;
- pagination/filter/sort limits appropriate to the data sensitivity and operational use;
- whether a query can expose financial, personal, location, custody or evidence details;
- the audit/access record required for sensitive evidence view/export;
- reconciliation or rebuild path if a projection diverges from its source.

The Admin/Operations dashboard must not combine storefront orders, independent shipments, parcels, route movements, payment attempts and financial settlement into ambiguous totals. Each metric requires an approved definition, authoritative source, inclusion/exclusion rules, calculation, freshness, access scope and reproducible evidence. Demo/sample data must be visibly distinguished from live operational data.

A projection may improve read performance but cannot become an independent source of truth or grant access that the underlying record does not permit.

## 10. External integration contract

Each integration must have a provider-specific contract covering:

1. business purpose and authoritative domain owner;
2. provider account/environment and server-side credential ownership;
3. request identity/reference and the business operation it represents;
4. trusted amount, currency, target, recipient or object constraints as applicable;
5. request signing/authentication and inbound callback authenticity;
6. provider success, rejection, timeout, duplicate, delayed and unknown outcomes;
7. safe query/reconciliation before retrying an uncertain side effect;
8. local persistence boundary and correction/history requirements;
9. provider/local divergence owner and escalation;
10. privacy, retention, access, monitoring and production enablement evidence.

### 10.1 Current integration boundaries

| Integration | Current source-backed use | Required constraint |
|---|---|---|
| Firebase Authentication | Customer/Admin identity and token verification | Identity proves principal, not record entitlement, staff action permission, location capability or business-party authority |
| Firestore / Firebase Admin | Current business records, server transactions and privileged server access | Client rules and server route checks are both required at their respective boundaries; Admin SDK privilege must be constrained by server authorization |
| Paystack | Current storefront payment initialization, verification and webhook processing | Provider event authenticity and reference/amount/currency/purpose checks; unknown outcomes reconciled; current integration does not establish a general Finance ledger/refund workflow |
| Cloudinary | Constrained Admin category/product image upload | Upload authorization, folder/type/size/content validation and object verification; this is not a general parcel evidence vault |
| Email/other notification provider | Narrow guest order/tracking communication | Message attempt is not business-state proof; recipient entitlement and duplicate/unknown delivery must be defined before generalization |

### 10.2 Future provider categories

Future courier, route, mapping, messaging, location or payment providers must not be selected or integrated by assumption. The owner-approved service model and provider capability review must determine whether the provider is authoritative for any fact, merely supplies an observation, or performs an external side effect. A carrier status is not automatically proof of physical possession or delivery under DEC-044.

## 11. Security, privacy and authorization enforcement

- All privileged mutations require server-side enforcement; UI navigation/visibility is supplementary.
- Authentication, record entitlement, staff action permission, scope, location capability and independent approval are separate checks.
- Customer access must respect booking-party, sender, receiver, payer, handover-person and business-representative distinctions under DEC-023/024 and BP-01–BP-22.
- Finance responsibility does not imply physical custody or unrestricted audit/evidence access.
- Support may assist, verify, record and escalate; it does not gain authority to change booking terms, release parcels, approve refunds, dispatch work or disclose evidence by virtue of Support status.
- Audit/evidence view, export, correction, retention-hold and external disclosure are distinct protected actions under DEC-033/PM-08.
- Provider secrets, access tokens, webhook signatures and credential-bearing URLs must never be returned to clients or included in logs/evidence exports.
- Query results, notifications and operational reports must expose only fields permitted to the relevant recipient/role/purpose.

## 12. Acceptance and verification mapping

The design must generate executable specifications only after the relevant policy and technical inputs are resolved. At minimum, map these contract families to the existing acceptance catalogue:

| Contract family | Existing requirement/area links | Required verification families |
|---|---|---|
| Catalogue, cart, order and stock | A-01–A-03; ADM-R08–R14, R19–R20 | Server-trusted price/stock, inactive item denial, duplicate submit, concurrency/oversell, cancellation/payment race and no unintended stock movement |
| Customer/guest entitlement | A-04, A-19; ADM-R01–R04, R14, R54; DEC-035 | Own-order access, guest token scope, unauthorized party denial, recovery/claim challenge, replay/expiry and no authority inferred from email or payer status |
| Quote/booking/parcel | A-05–A-06; ADM-R21, R30–R34; DEC-038–040 | Exact quote acceptance, stale/expired quote, booking-party authority, accepted-term preservation, relationship/cardinality and idempotent booking creation |
| Payment/financial events | A-07–A-08; ADM-R15–R20; DEC-029/041 | Forged/duplicate/replayed callback, provider success/local failure, amount/purpose mismatch, late payment, refund/credit separation and reconciliation |
| Location/intake/custody | A-09–A-10; ADM-R25, R33, R36–R37; DEC-042–044 | Location capability plus staff permission, physical receipt proof, measurement units, failed/disputed handover, last confirmed custodian and offline/late event reconciliation |
| Route/dispatch/movement/delivery | A-11–A-13; ADM-R23–R29, R38–R39; DEC-030–032/044 | Proposal vs assignment vs movement, holds, actor/receiver/recorder, failed attempt, delivery proof, collection/return trigger and correction history |
| Staff authorization/audit/evidence | A-15–A-17; ADM-R03–R07, R46–R51; PM-01–PM-12; DEC-033 | Direct API bypass, action/scope denial, independent approval, requester/approver separation, view/export/disclosure, original/correction/hold integrity |
| Notifications/reporting | A-14, A-18–A-19; ADM-R41–R45, R54; DEC-034 | Recipient/field/channel entitlement, duplicate/unknown send, no business-state mutation, metric source/freshness and permission-aware projections |
| Production and operations | A-20; ADM-R52; DEC-036 | Environment/configuration, secrets, deployed rules, provider readiness, backup/restore, incident response, rollback, monitoring and explicit release sign-off |

A scenario outline is not an executable test. Every executable case still needs the case-level preconditions, exact actor/permission, controlled fixture, action, expected result and unchanged facts, replay/failure variants, evidence source, cleanup and independent reviewer specified by the P0 test-readiness contract.

## 13. Unresolved design dependencies

The following prevent final API/persistence design and must remain visible in the owner decision register or technical blocker list:

- DB-01–DB-03: booking-to-shipment, booking-to-parcel and parcel-to-route-leg cardinality; split/merge/reassignment.
- DB-04–DB-06 and DB-10–DB-12: remaining record relationships and evidence linkage/ownership, as defined in the domain-boundary decision matrix.
- DB-07–DB-09: party multiplicity/business representation and location/partner ownership/capability lifecycle.
- service catalogue, eligibility, pricing inputs/formulas/units/conversions/rounding/effective versions;
- quote validity, handover deadlines, cancellation/change rules and booking-party delegation;
- payment purposes/methods, partial/split eligibility, refund/credit limits and reconciliation policy;
- service-specific intake/custody/delivery evidence, measurement thresholds and correction authority;
- action-level permission catalogue, scopes, location assignment and revocation, independent approvals;
- guest recovery/claim challenge and customer party-entitlement details;
- audit/evidence event catalogue, retention/legal hold, correction/redaction and disclosure procedure;
- provider-specific capabilities, callback/query semantics, safe retry and reconciliation ownership;
- query/report metric definitions, freshness and access scope;
- technical choices for local consistency, indexes, API versioning and deployment configuration after the above decisions are settled.

Do not resolve these by guessing a default, copying storefront-order cardinality into shipments, or choosing a technical structure merely because it is convenient in Firestore.

## 14. Review 3 readiness implications

This contract closes no owner decision and approves no implementation. It provides a common technical boundary vocabulary for the consolidated Review 3 package.

Before final technical design is presented:
- domain fact ownership must agree across lifecycle, identity, event/state and mutation documents;
- each proposed API/persistence responsibility must trace to an accepted requirement and an owner-approved business relationship;
- every existing source reuse claim must be bounded by the recorded inspection baseline;
- all missing capabilities must remain explicit rather than represented as existing services;
- transaction and external side-effect boundaries must have a failure/reconciliation owner;
- query projections must preserve data entitlement and source lineage;
- P0 acceptance cases and production evidence must map to these boundaries;
- unresolved DB/policy/operational inputs must be presented as blockers, not silently defaulted.

**Current gate:** Reviews 1 and 2 of 5 remain approved. Review 3 remains in preparation; Reviews 4 and 5 remain future consolidated approvals. This document does not authorize application code, schema, API, Firebase rules, configuration, provider enablement or deployment. The implementation freeze remains until explicit Review 5 approval of the complete reconciled SDD.


## 14. Consolidated owner-decision package boundary

The owner-dependent booking, parcel, route-leg, party/business, location/partner and financial-event relationships are consolidated in `PLATFORM_CONSOLIDATED_OWNER_DECISION_PACKAGE.md`. Its recommendations remain pending and are not approved persistence rules. This contract must continue to represent unresolved cardinalities as open until the owner confirms the relevant business rule and the technical design is reconciled. No collection, field, index, endpoint or transaction boundary may be inferred from the package.
