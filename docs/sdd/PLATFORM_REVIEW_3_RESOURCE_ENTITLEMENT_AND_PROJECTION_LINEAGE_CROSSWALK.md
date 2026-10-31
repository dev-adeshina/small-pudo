# Review 3 Resource Entitlement and Projection-Lineage Crosswalk

**Status:** Review 3 technical-design preparation; conceptual access and data-lineage requirements only  
**Prepared:** 31 October 2026  
**Repository baseline:** PR #83 merge commit `986f4ad79232ce1700f4edaa972a17522ed319c8`  
**Application-source inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856`  
**Related:** `PLATFORM_API_PERSISTENCE_AND_INTEGRATION_BOUNDARY_CONTRACT.md`, `PLATFORM_TECHNICAL_DESIGN_COHERENCE_AND_DEPENDENCY_MATRIX.md`, `PLATFORM_DOMAIN_BOUNDARY_AND_IDENTITY_DECISION_MATRIX.md`, `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`, `PLATFORM_STAFF_PERMISSION_DECISIONS.md`, `PLATFORM_REVIEW_3_ACTION_CAPABILITY_CROSSWALK.md`, `PLATFORM_REVIEW_3_LIFECYCLE_TRANSITION_AND_RECOVERY_CROSSWALK.md`, `PLATFORM_REVIEW_3_OWNER_INPUT_TRIAGE.md`, DEC-033–DEC-044, BP-01–BP-22 and PM-01–PM-12.

## 1. Purpose and design boundary

This crosswalk connects accepted party, staff, evidence and domain boundaries to API/query authorization and derived-view lineage. It addresses which principal is asking, what relationship or authority the principal has to the target fact, which resource/field classes may be returned for the purpose, which domain owns the fact, and what to do when the source is stale, missing, delayed, unavailable or contradictory.

It is not a final field catalogue, role matrix, permission-ID catalogue, API specification, Firestore schema, query implementation or disclosure policy. Exact field names and resource shapes must be derived from approved domain contracts and verified against the actual model during implementation design.

## 2. Non-negotiable access principles

- **Identity is not entitlement.** Authentication does not establish booking-party, sender, receiver, payer, handover, collection or staff authority.
- **Relationship is scoped.** A party relationship applies only to the relevant booking/order/shipment/parcel/event and permitted action.
- **Role names do not grant blanket access.** Admin, Operations, Support or Finance labels do not substitute for action-level permission, scope, location/service/action capability or the approved financial/evidence boundary.
- **Authorization is server-side.** Hidden buttons, client filters, route obscurity, caller-supplied UID/role and cached entitlement are not enforcement.
- **Record access and field access are separate.** Entitlement to know that an event occurred does not imply entitlement to addresses, contact details, payment details, evidence, internal notes or third-party identities.
- **Purpose and action matter.** View, search, update, approve, export, disclose, correct, hold, release, reconcile and execute are distinct capabilities where policy requires separation.
- **Location and staff authority are independent.** Staff action permission does not create location capability; location capability does not grant staff authority.
- **No cross-domain inference.** Access to a booking does not automatically grant access to payment instruments, Finance reconciliation, every parcel's evidence, another party's profile or all route/recipient details.
- **Evidence is specially controlled.** DEC-033/PM-08 require distinct audit/evidence view, export and external-disclosure controls.
- **Derived data cannot widen access.** Dashboards, search indexes, exports, notifications and caches must enforce the same or stricter entitlement as their source facts.

## 3. Principal and relationship crosswalk

| Principal / relationship | Entitlement basis | Potentially relevant scope | Explicit non-inference |
|---|---|---|---|
| Public visitor | Public catalogue visibility | Published active products/categories and public service information | No profile, order, booking, quote-specific terms, shipment or evidence access. |
| Registered customer | Authenticated account plus a specific owned/authorized resource relationship | Own profile and orders; booking actions only where the customer is booking party or has valid delegation | Registration/profile ownership alone does not make the customer sender, receiver, payer, handover person or collection authority. |
| Guest-order capability holder | Valid narrow token/claim under DEC-035 | Exact guest-order actions and fields permitted by that capability | Token possession is not general account identity, shipment-party relationship, collection authority or access to other orders. Email/ID match alone is insufficient. |
| Booking party | Verified booking-party relationship and action entitlement for that booking | Quote acceptance, booking changes/cancellation or queries as allowed by policy and service contract | Does not automatically receive every sender/receiver/payer field or staff-only operational data. |
| Sender | Explicit sender relationship to relevant shipment/parcel and permitted purpose | Sender-relevant status, handover instructions and approved event updates | Does not automatically confer booking, payment, collection or recipient authority. |
| Receiver | Explicit receiver relationship and approved event/field policy | Receiver-relevant arrival/delivery/collection information and required action | Does not automatically expose payer details, full commercial quote, internal notes or unrelated parcels. |
| Payer | Verified payment-purpose relationship | Payment request, confirmation, receipt and payer-specific financial information | DEC-034: payer receives payment information by default, not full shipment detail merely by paying. |
| Handover person | Valid authority for the particular physical handover | Information/action needed to present or hand over the specified parcel | Does not automatically become booking party, sender, receiver, payer or future collection authority. |
| Collection authority | Valid, current authority for the particular collection/release | Collection verification and release information for the specified item | Prior sender/receiver/payer/booking-party status does not automatically establish collection authority. |
| Staff member | Active staff identity plus action-level permission, scope and applicable location/service/action capability | Assigned actions and resources within scope; independent approval where required | Admin/Operations title or navigation visibility does not confer all staff permissions. |
| Support | Explicit bounded Support permission and case scope | Assist, acknowledge, verify, record, route and escalate approved information | No implied financial execution, custody transfer, dispatch, privileged approval, audit export or external disclosure. |
| Finance | Explicit Finance responsibility and assigned financial access | Full financial reconciliation within approved scope | Does not automatically grant physical custody or unrelated customer/evidence access. Admin operational visibility remains bounded. |
| Evidence reviewer | Separate evidence-view entitlement, purpose and scope | Review of specific evidence/event under assigned authority | View does not imply export, correction, hold release or external disclosure. |
| Evidence exporter/discloser | Separate export/disclosure authority, scope, purpose and required independent approval | Approved evidence set and recipient/field scope | Admin status or evidence view alone does not grant export/disclosure. |
| External provider/service | Narrow server-to-server credential and correlation context | Operation-specific data necessary for contracted integration | Provider callback/reference is not a general customer or staff principal. |

This table does not establish that every relationship is independently represented in the launch product. DB-07/08 and party-authority decisions remain the source for unresolved delegation and representation detail.

## 4. Resource-to-authority and field-class crosswalk

Field classes are conceptual security groupings, not literal field names.

| Resource / domain | Authoritative source | Candidate field classes requiring separate consideration | Entitlement rule / prohibited widening |
|---|---|---|---|
| Public catalogue | Product/category facts and approved public service information | Public description, published price, image, availability indicator, internal stock/control values | Return only explicitly public fields; do not expose internal stock controls, notes or inactive catalogue records. |
| Customer profile | Customer-owned profile attributes and Firebase identity | Display/contact attributes, verification state, private account metadata, credentials/security data | Customer may access own permitted profile fields. Never expose credentials, tokens, security claims or another user's profile. |
| Storefront cart | Customer's draft client-side intent; server-validated product facts | Product references, requested quantity, client display price, image snapshot | Cart is not an order or price authority. Server recalculates trusted price/stock. |
| Storefront order | Order domain and immutable order-time context | Order identity/status, item/price snapshot, customer contact, delivery address, payment reference/status, internal fulfilment notes | Customer/guest access is limited to order-specific allowed view. Staff access is action/scope-bound. Private contact and internal notes are not public fields. |
| Guest-order capability | Narrow hashed-token entitlement | Token verification result and allowed order projection | Never return stored token/hash or use guest token to expand into account, shipment-party or collection access. |
| Quote | Commercial quote authority | Quote version, service description, input declarations, price breakdown, validity, terms, adjustment history | Show exact quote fields only to entitled booking party and approved delegates. Payer or receiver is not automatically entitled to all commercial inputs. |
| Independent booking | Booking domain | Booking identity, accepted terms reference, service selection, party relationship, handover instructions, cancellation/exception facts | Booking-party rights are distinct from sender/receiver/payer roles. DB-01–05 constrain final unit and relationships. |
| Parcel / shipment | Shipment/parcel authority | Item identity, handling attributes, declared/observed measurement, current custodian, event history, permitted tracking summary | Parcel access is relationship-specific. Do not infer all parcel details from booking/order access. |
| Location / capability | Location configuration authority | Public location details, service availability, operational state, capability matrix, internal closure/capacity data | Public information must not expose internal security/capacity details. Capability administration is separately permissioned. |
| Payment attempt / transaction | Payment domain plus verified provider evidence | Amount/currency/purpose, attempt/result, provider reference, payer identity, reconciliation status, sensitive provider metadata | Payer-specific information only to entitled payer; operational status only to authorized staff; secrets/payment credentials never projected. |
| Financial event / reconciliation | Finance-owned financial record | Charge/refund/credit/reversal/adjustment values, allocation, settlement evidence, reconciliation notes, approval/execution identity | Finance access is purpose-bound. Admin operational view is narrower; Support cannot execute or disclose full financial detail by implication. |
| Intake / custody / movement | Physical-event and custody authority | Event kind/outcome/time/location, physical actor, receiver, recorder, evidence references, last confirmed custodian, exception/hold | Show each party only its permitted event subset. Route/dispatch projection cannot fabricate possession. |
| Route / assignment / dispatch | Operations authority for planning and execution | Proposed route, leg/assignment details, capacity, driver/partner contact, dispatch decision, internal operational notes | Customer tracking is a curated projection, not raw route/assignment data. No direct partner/driver login at launch under PM-09. |
| Delivery / collection | Delivery/collection authority | Attempt/outcome, recipient verification result, proof reference, collection authority, release decision | Receiver sees only permitted delivery/collection information. Identity documents, proof images and signatures are not general shipment fields. |
| Exception / support case | Domain owner for underlying fact; case owner for case workflow | Reported issue, disputed fact, internal investigation, evidence references, resolution, customer-visible summary | Support may manage permitted case work but cannot rewrite the source domain fact. Internal investigation and third-party data remain restricted. |
| Audit/evidence | Accountable records/evidence authority | Event metadata, original evidence, correction lineage, reviewer note, export/disclosure record, legal hold | View/export/correction/hold/disclosure are separate actions. Preserve originals; disclose minimum approved fields only. |
| Notification | Owning domain event plus recipient policy | Recipient, permitted message fields, channel, delivery state, provider reference | Payload is a minimized projection; delivery status never alters source state. |
| Operational reporting | Derived source facts | Aggregates, counts, service performance, financial/operational metrics, freshness and lineage | Metric access is scoped; filters must not reveal protected individual data. Demo/hardcoded metrics are not operational truth. |

## 5. Query authorization decision sequence

Every query returning non-public data must establish at the trusted server boundary:

1. **Principal:** identify authenticated customer/staff/provider principal or validate the narrow guest capability. Reject caller-supplied identity/role as authority.
2. **Target resource:** resolve canonical resource identity and authoritative domain. Do not authorize based only on a client-provided parent ID.
3. **Relationship:** verify the caller's current relationship to that exact resource and relevant parcel/event, including delegation validity.
4. **Purpose/action:** establish whether request is view, search, operational action, financial reconciliation, evidence review, export, correction or disclosure.
5. **Field projection:** construct an allowlisted response for principal, purpose and scope. Avoid serializing a full record then removing a few sensitive fields.
6. **Scope:** apply approved booking/order/parcel/location/region/team scope; exact scope vocabulary remains open.
7. **Fresh authority:** check current relationship and, for mutation, staff action permission, location/service/action capability, record state, holds and independent approval.
8. **Lineage/freshness:** identify source version/time and whether projection is current enough for its stated purpose.
9. **Audit:** record consequential reads/exports/disclosures where required; avoid logging unnecessary sensitive details.
10. **Safe result:** return only authorized data; handle missing, stale, unavailable and unauthorized resources without leaking existence or protected metadata.

A query must not mutate the source fact. If entitlement cannot be established, do not fall back to a broader projection.

## 6. Mutation authorization and response contract

For consequential mutations, independently verify authenticated principal/narrow capability, target resource/domain, current relationship, action entitlement, staff permission/scope, location capability, lifecycle preconditions, relevant holds, required independent approval, trusted input validation, concurrency/replay protection, evidence attribution, and permitted external side effects/recovery.

The response must distinguish accepted command, completed authoritative local fact, pending external outcome, denied, held for review and unknown outcome. Generic success must not imply all external/physical effects completed.

## 7. Projection lineage contract

Every nontrivial projection, dashboard, search result, export and customer tracking view must declare:

| Lineage element | Required meaning |
|---|---|
| Projection identity/purpose | Audience and decision supported, not merely UI page name. |
| Source domain(s) | Authoritative business domains contributing facts. |
| Source record references | Stable references to source facts, subject to caller entitlement. |
| Derivation | Approved calculation, filtering, grouping or transformation for each displayed fact. |
| Source version/time | Version, update sequence or source timestamp, where available. |
| Projection generation time | When computed/refreshed, distinct from event occurrence and capture time. |
| Freshness expectation | Approved freshness class for the view's purpose; no universal time limit. |
| Completeness | Whether expected sources were available/included or some were missing, filtered or held. |
| Entitlement transformation | Fields removed, masked, generalized or included for this principal/purpose. |
| Failure/rebuild behaviour | How stale, incomplete or unavailable projections are marked, refreshed or reconstructed. |
| Auditability | How a consequential displayed value traces to source and calculation. |

Do not claim real-time freshness unless update and propagation behaviour is verified. Eventual consistency may be acceptable for a view, but staleness must be visible where it could affect a customer promise, operational action, financial decision or release gate.

### 7.1 Conceptual freshness and availability classes

These are explanatory classes, not persisted enum values:

- **Current enough for purpose:** satisfies an approved use-specific freshness expectation.
- **Stale:** older than the approved expectation or a newer source version is known; prevent unsafe consequential decisions.
- **Incomplete:** expected sources are missing, held, inaccessible or not yet propagated; state incomplete scope without leaking restricted records.
- **Unavailable:** authoritative source/projection cannot be obtained; do not silently substitute cached data as current.
- **Conflicted:** sources disagree or lineage cannot establish authority; route to responsible domain for reconciliation.
- **Rebuilding:** projection is being reconstructed; show last known freshness and do not imply completion.
- **Not applicable:** no source fact is expected for this resource/purpose; distinguish from missing data.

Exact freshness thresholds, propagation objectives and rebuild targets remain owner/operational inputs. The source domain remains authoritative when its projection is unavailable.

## 8. Cross-domain projection examples

| View | Authoritative inputs | Derived/displayed information | Must not imply |
|---|---|---|---|
| Public product catalogue | Product/category public facts | Published name, description, image, public price and approved availability | Reservation, stock guarantee or shipment service eligibility. |
| Customer order summary | Order domain; permitted payment/fulfilment summaries | Order-time items/amount and permitted payment/fulfilment summary | General shipment custody or complete Finance reconciliation. |
| Guest tracking view | Specific guest-order capability and permitted order facts | Narrow tracking/cancellation projection for that order | Account login, unrelated order ownership or collection authority. |
| Booking confirmation | Booking and accepted quote facts | Booking reference, accepted service/terms and permitted next steps | Parcel intake, custody, payment settlement or dispatch. |
| Customer shipment tracking | Shipment/parcel and verified physical events; permitted route/delivery summary | Curated customer-visible milestone timeline | Raw internal route, staff notes, another party's contact or unsupported custody change. |
| Operations work queue | Booking/shipment, location capability, staff scope, holds, route/dispatch and exceptions | Eligible work items and action affordances | Authority merely because a row is visible; mutation rechecks authority and preconditions. |
| Finance reconciliation view | Payment attempts, provider evidence, financial events, allocations and settlement records | Reconciliation state and traceable financial lineage | Physical custody, delivery completion or broader customer profile access. |
| Evidence review view | Evidence catalogue, event links, reviewer authority, hold and correction lineage | Authorized evidence and audit context | Export/disclosure authority or proof of event without evidence evaluation. |
| Admin operational dashboard | Authoritative operational domains and approved aggregate definitions | Scoped operational counts/queues and freshness | Full Finance access, all staff permissions or physical facts inferred from assignments. |
| Notification | Verified source event and DEC-034 recipient/field policy | Minimal message for entitled recipient | Source-state transition or recipient entitlement beyond the message. |

## 9. Search, list, export and aggregate risks

- **Search:** authorize every result row and snippet before inclusion. Search index membership is not entitlement. Avoid count/existence leaks through totals, autocomplete or error differences.
- **List/pagination:** cursor continuation preserves principal, scope and filter constraints; cursor is not a bearer authorization token. Revoked access must not continue through an old cursor.
- **Filtering/sorting:** fields unavailable for direct display can still leak through filters, sort order or facets. Apply field restrictions to query semantics as well as returned data.
- **Aggregates:** small cohorts, rare filters or repeated differencing can reveal individual facts. Apply approved minimum-disclosure controls where required; no numeric thresholds set here.
- **Exports:** export is separate from view, with purpose, scope, field minimization, recipient, approval and audit.
- **Caching:** cache keys/invalidation include entitlement-relevant dimensions; do not share privileged responses across users/roles. Revocation/hold changes require access re-check or invalidation.
- **Notifications:** payloads are field-minimized and recipient-specific. Avoid sensitive data in previews, subjects, URLs, analytics and logs.
- **Errors:** avoid confirming existence of a protected booking, shipment, evidence item or financial record to an unauthorized principal.

## 10. Source-backed implementation constraints and limits

The recorded source inspection baseline identifies patterns to reuse where compatible: Firebase Authentication and server-side ID-token verification; customer ownership checks; hashed guest-order token checks; Admin email/custom-claim authorization; Firestore rules for catalogue access; server-side order validation and transaction-based stock reservation; Paystack verification/signature validation/event deduplication; constrained Cloudinary upload authorization/validation.

These findings are tied to `e0f69055d33dd9399c23e1d793f359468229c856`, not claims of current runtime security or full coverage. Inspection found coarse Admin authorization, not a complete action-level permission system; storefront order/guest access, not shipment-party authorization; narrow payment integration, not Finance reconciliation; image upload, not general evidence access; and no general projection-lineage/freshness service.

## 11. Unresolved dependencies and owner boundary

- **DB-01–04:** booking/consignment/parcel/route-leg identity and cardinality determine resource entitlement boundaries.
- **DB-05–06/11:** quote scope, adjustment allocation, payment allocation and financial lineage.
- **DB-07–08:** party multiplicity, business representation and delegation evidence/scope/expiry/revocation.
- **DB-09:** location/partner models, capability change authority, closure and queued work.
- **DB-10:** mandatory evidence by event, reviewer eligibility, retention and legal-hold authority.
- **DB-12:** event/recipient/field/channel/consent/timing matrix.
- **DEC-033/PM-08:** evidence reviewer mapping, integrity, correction/redaction, retention, legal hold and disclosure/government-request procedure.
- **DEC-034:** unresolved event-specific recipient/field/channel/consent choices; accepted recipient separation must not be reopened.
- **PM-01–PM-12/DEC-043:** exact permission/scope catalogue, capability matrix and workflow-specific approval boundaries.
- **Production:** named data owners, freshness objectives, cache invalidation/revocation guarantees, backup/restore and projection rebuild evidence.

Technical work can continue by mapping existing APIs/queries/projections, deriving candidate field classes and writing acceptance cases. Owner choices must be presented together in the consolidated package; do not issue serial questions.

## 12. Acceptance-specification obligations (not executed)

Later case-level specifications must include, where applicable:

- customer reads own order but not another customer's order;
- guest token grants only its defined resource/action and cannot broaden access;
- booking party, sender, receiver, payer, handover person and collection authority receive only permitted projections;
- email/ID match and profile ownership alone do not grant unrelated authority;
- Admin/Operations/Support cannot act without assigned action permission and scope;
- location capability and staff permission are independently required;
- payer receives payment information without automatic full shipment detail;
- evidence view does not imply export or disclosure;
- search/list/count/filter/export/cursor/cache paths do not leak protected existence or fields;
- revoked relationship, staff permission, scope, capability or hold is enforced on subsequent access/mutation;
- stale, incomplete, unavailable, conflicted and rebuilding projections are identified and cannot drive unsafe consequential actions;
- source corrections preserve original facts and projection lineage;
- notifications contain only permitted recipient fields and do not mutate source facts;
- audit captures required access/export/disclosure actions without leaking secrets.

Each case specifies principal, relationship, resource, purpose, requested fields, expected allow/deny/mask result, source facts/version, projection state, mutation effect, audit result and cleanup. These are test-design requirements only; no tests are claimed executed.

## 13. Review 3 completion conditions

Before Review 3 is presented:
1. Reconcile this crosswalk against BP-01–BP-22, DEC-033/034, PM-01–PM-12, API/persistence and lifecycle documents.
2. Ensure each resource has one authoritative fact owner and each projection declares lineage/freshness.
3. Ensure each principal's entitlement is relationship-, purpose-, action-, field- and scope-bound.
4. Align query/mutation paths with accepted party/staff/location authority.
5. Trace evidence view/export/disclosure separately.
6. Resolve owner-dependent DB items only in the consolidated owner package.
7. Convert access/freshness risks into case-level P0/Conditional P0 specifications without claiming execution.
8. Keep source, runtime, provider and production claims bounded by actual evidence.

## 14. Approval boundary

This is a documentation-only technical-design crosswalk. It does not establish roles, permission IDs, exact field names, endpoints, schemas, collection names, freshness durations, cache technology, projection architecture, provider behaviour or new owner policy. It does not approve Review 3, Review 4, Review 5, tests, application changes, Firebase configuration/rules, provider activation or deployment.

The owner has reported three of the maximum five approval exchanges used and two remaining. The final exchange must present the complete reconciled SDD and seek explicit implementation authorization. Until that authorization is given, implementation remains frozen.
