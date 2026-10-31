# VeriLyft Domain Boundary and Identity Decision Matrix

**Status:** Technical design support; candidate boundaries and blocked owner decisions, not an approved data model  
**Prepared:** 31 October 2026  
**Documentation baseline:** PR #71 merge commit `37a6ca57f1619d124ebb9718aa6067ed8d40f978`  
**Application-source inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856`  
**Related:** `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, `PLATFORM_TECHNICAL_CONTRACT_RECONCILIATION.md`, `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md`, `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`, `PLATFORM_OWNER_DECISION_REGISTER.md`, `IMPLEMENTATION_SOURCE_TRACEABILITY.md`

## 1. Purpose and guardrails

The platform requirements now distinguish a storefront order from independent shipment booking, commercial quote, parcel, physical intake, custody, route assignment, movement, delivery, payment and financial resolution. The remaining design risk is allowing these concepts to collapse into one overloaded record or identity relationship.

This matrix makes those boundaries explicit and shows which unresolved owner decisions block technical modelling. It does **not** choose a Firestore schema, collection/document names, field names, route paths, enums, identifiers, cardinality, retention periods or numerical thresholds. The concepts below are responsibilities and relationship questions, not approved persistence objects.

Preserve these rules:

- Existing Next.js App Router, Firebase Auth/Firestore/Admin, Paystack and Cloudinary remain the architecture to reuse where suitable.
- A current source-backed record or endpoint must not be extended into a different business responsibility without an explicit contract and traceability.
- One person may occupy multiple business roles, but the relationships and authority must be explicit where access, consent, payment, notification, change or collection are affected.
- A record identifier is a locator, not an access credential.
- Physical events, financial events and authorization decisions remain separately evidenced.
- No unresolved cardinality or owner input may be silently selected for implementation.
- Application-code changes remain frozen until Review 5.

## 2. Domain responsibility and authority matrix

| Domain concept | Business fact it owns | Inputs it may reference | Authority that may change it | Must not own or imply |
|---|---|---|---|---|
| Customer account / authenticated principal | Authentication identity and account profile context | Verified account credentials and profile data | Account holder through approved account controls; authorized security process | Booking-party, sender, receiver, payer or collection authority by default |
| Booking party | Commercial instruction and acceptance of the booking/quote | Party details, selected service, origin/destination, quote version | Authenticated booking party within pre-intake change rules; approved controlled process after intake | Physical custody, payment success or authority to collect for another party |
| Sender | Declared sending relationship and applicable contact/consent context | Booking/parcel reference and approved sender details | Authorized booking/change process subject to BP policy | Automatic account access, quote acceptance or collection entitlement |
| Receiver / collection recipient | Intended recipient and collection entitlement context | Shipment reference and verification evidence | Approved booking-party change process before relevant cutoff; controlled review afterward | Access to full booking/financial data merely by being named |
| Payer | Payment instruction/transaction and receipt entitlement | Defined payment purpose, amount, currency, provider reference | Payer for own payment instruction; Finance for financial resolution | Booking change, parcel access, custody, route or delivery authority |
| Handover person | Person physically presenting or transferring the parcel | Booking/parcel reference and required physical verification | Authorized intake/operations process | Booking-party authority merely because they present a parcel |
| Staff principal | Authenticated staff identity and assigned responsibility | Staff lifecycle, assignment, location/service scope | Authorized staff-administration process | Unrestricted operational authority from Admin label alone |
| Location | Place, operational state and approved service/action capabilities | Service configuration, operating status and approved partner/location facts | Authorized location configuration owner | Staff action permission or proof that a physical event occurred |
| Service configuration | Approved eligibility, pricing model inputs, evidence requirements and operational constraints for a service | Versioned owner-approved policy/configuration | Designated service/pricing/operations owner | Retroactive rewriting of accepted quote, payment or historical event |
| Quote | Issued commercial offer and immutable accepted commercial context | Service config version, trusted input facts, pricing result | Authorized quote calculation/issuance process; acceptance by booking party | Payment, booking intake, custody or physical service completion |
| Booking | Confirmed commercial instruction and accepted service/quote terms | Booking party, quote, service, party relationships | Booking party within allowed window; staff only under approved authority | Parcel custody, route movement or financial settlement |
| Shipment / parcel | Physical service obligation and identity of the physical item(s) | Confirmed booking/intake, parcel description and approved links | Authorized operational process; exact lifecycle authority open | Assumption that one booking equals one parcel or one route leg |
| Intake event | Actual receipt, inspection/measurement and accept/refuse outcome | Booking/shipment reference, location capability, actor and evidence | Authorized intake staff at capable location | Booking confirmation, payment verification or transfer to a later custodian unless physically evidenced |
| Custody event | Actual transfer of possession and responsible custodian | Prior custodian, receiving party, physical evidence, time/location | Authorized physical handover process | Route assignment, dispatch approval, arrival or status-only updates |
| Route proposal | Candidate operational plan | Origin/destination, service, capacity and route constraints | Authorized routing/operations process | Approved assignment, departure, movement or custody transfer |
| Route/transport assignment | Authorized planned resource/leg responsibility | Route proposal, availability/capability, staff/provider permission | Authorized Operations action; required second approval where policy says | Actual physical movement or custody |
| Movement event | Observed physical milestone | Assigned leg, physical actor, recorder, time/location and proof | Authorized actor records event; reviewer corrects through attributable process | Planned movement, customer notification or assignment alone |
| Delivery attempt / outcome | Actual attempt and service-specific outcome | Recipient entitlement, location, assigned leg and proof | Authorized delivery actor under service policy | Successful delivery without approved proof |
| Payment attempt / provider transaction | Attempted external or approved local collection for a defined purpose | Amount, currency, purpose, provider reference and verified result | Trusted provider integration; Finance controls financial exception | Booking acceptance, physical intake, custody or delivery |
| Financial event | Charge, refund, credit, reversal, write-off or reconciliation result | Original payment/business purpose and evidence | Finance or explicitly authorized financial process with required approvals | Silent changes to physical lifecycle or mere approval without execution |
| Audit/evidence record | Attributable record of action, decision and supporting proof | Actor, target, reason, event, source and evidence references | Controlled append/correction/disclosure process | Unrestricted access, silent overwrite or automatic proof of external events |
| Notification attempt | Attempt to communicate an approved business event | Recipient entitlement, permitted fields/channel and consent | Approved notification service/process | Underlying booking, payment, custody or delivery fact |

## 3. Identity relationship and access decision matrix

DEC-023/DEC-024 and BP-01–BP-22 require distinct business relationships. The matrix below states minimum separation, not final verification mechanics.

| Relationship | Minimum access/authority boundary | Explicitly not granted by relationship alone | Owner decisions still needed |
|---|---|---|---|
| Authenticated customer who is booking party | Access to own booking and permitted booking actions | Access to unrelated orders or another person's shipment | Account recovery and change authentication details |
| Booking party who is not sender | Commercial acceptance/change authority only as approved | Automatic sender contact or physical handover authority | Delegation, representation and consent evidence |
| Sender | Only sender-specific information and actions explicitly approved | Full account, payer or receiver data; collection authority | Sender verification, change notification and cutoff |
| Receiver / named collection recipient | Only collection/delivery information needed for intended receipt, after entitlement verification | Quote/financial detail, booking changes or alternate-recipient authority | Proof method, failed verification, substitution/delegation |
| Payer | Payment confirmation/receipt for own payment by default | Full shipment details, booking changes, custody or collection | Multi-payer, split payment, payer correction and receipt disclosure |
| Physical handover person | Ability to present parcel for controlled intake/handover; staff verifies the booking and authority | Booking ownership or authority to change parties/terms | Acceptable evidence, mismatch/refusal and record of presenter |
| Business representative | Actions explicitly delegated by the booking business/party | General access for all employees or unrestricted business account control | Representation proof, delegation scope, expiry and revocation |
| Support agent | Intake, verification, acknowledgement, routing, escalation and permitted status communication | Booking authority transfer, financial execution, custody/dispatch, unrestricted audit access | Verification method, response target and appeal reviewer |
| Admin/Operations staff | Only assigned action permissions and scopes; location capability checked independently | Finance, evidence export/disclosure, or every Admin action by default | Complete permission catalogue, scope model and assignment lifecycle |
| Finance staff | Financial review/reconciliation and explicitly assigned financial actions | Physical custody, dispatch, customer booking change or unrestricted evidence access | Financial action catalogue and approval thresholds |
| Management | Oversight and explicitly assigned approvals | Routine execution or self-approval of own consequential request | Exact approval and review scopes |
| External provider/partner | Narrow service-to-service or assigned task purpose | Platform-wide account or customer access | Provider identity, task scope, data minimization and revocation |

A successful identity check answers who the actor is. An entitlement check answers why that actor may access this record or perform this action. An action permission check answers whether this staff actor may perform this operation. A location capability check answers whether the location may perform this service/action. None substitutes for another.

## 4. Relationship/cardinality decisions that block the data model

| Decision key | Question not yet settled | Safe invariant before decision | Technical consequences blocked |
|---|---|---|---|
| DB-01 Booking → shipment creation | At what event does a confirmed booking create or become linked to a shipment/consignment? | Booking acceptance is not physical receipt; intake is separately evidenced | Record identity, lifecycle ownership, booking cancellation after confirmation |
| DB-02 Booking → parcel cardinality | Can a booking contain one or multiple parcels? Can a parcel be split/merged? | Never infer one-to-one cardinality from the word “booking” | Aggregate identity, per-parcel quote/measurement, intake and delivery |
| DB-03 Parcel → route leg cardinality | Can parcels travel together, split across legs, or be reassigned independently? | Route proposal, assignment and physical movement remain distinct | Routing/dispatch records, capacity reservation, scan/movement reconciliation |
| DB-04 Storefront order → shipment | Does every delivered storefront order create a shipment, or only an operational fulfilment link? | Storefront order remains a commerce record; delivery fulfilment does not prove custody | Shared fulfilment identity, stock/order lifecycle isolation and shipment reporting |
| DB-05 Quote scope | Is a quote per booking, per parcel, per service component, or a composite? | Accepted quote inputs/rates/total/currency/version remain reconstructable | Pricing snapshot, adjustment and allocation model |
| DB-06 Payment allocation | Can one payment settle multiple bookings/orders? Are split/partial payments permitted by service? | Every payment has a defined purpose, amount/currency and authoritative provider outcome | Allocation records, settlement reconciliation, refund and chargeback attribution |
| DB-07 Party relationship multiplicity | Can the same person occupy multiple roles or represent multiple bookings/businesses? | Roles are explicit even when identity is shared; role does not imply unrelated authority | Relationship records, consent, notification, entitlement evaluation |
| DB-08 Business representation | How is a customer acting for a business evidenced without a separate business-account platform at launch? | No new business-account platform is presumed; representative authority is explicit and scoped | Customer/business link, delegation, revocation and audit |
| DB-09 Location and partner model | Which locations are owned, operated, partner-operated or collection-only, and who controls capability changes? | Location capability and staff permission remain independent | Location ownership, capability lifecycle, partner authorization and settlement |
| DB-10 Evidence linkage | Is evidence attached to one event, one parcel, one shipment, or shared across linked records? | Evidence is attributable, purpose-limited and independently access-controlled | Evidence references, retention, redaction and disclosure |
| DB-11 Financial event linkage | How do payment attempts, provider transactions, charges, refunds, credits, reversals and reconciliation adjustments relate? | Original financial events remain immutable/reconstructable; request/approval/execution are separate | Financial event graph, ledger/reconciliation and idempotency keys |
| DB-12 Notification recipients | Which party receives which event/fields/channel, and when is contact verified? | Payer gets payment receipt by default, not full shipment detail; minimum disclosure | Recipient policy, contact proof, consent, retries and notification audit |

The owner decision register must resolve the business question before a persistence design can be approved. Technical design may present options and consequences, but may not select a default solely to unblock implementation.

## 5. Record responsibility and write-boundary rules

The following are design constraints for future record ownership. They do not require one physical database record per row.

1. **One authoritative owner per business fact.** A cached/display copy may exist, but its source and synchronization contract must be explicit.
2. **Commercial history is immutable in meaning.** Current catalogue/service configuration cannot rewrite an issued/accepted quote or completed payment. Revisions and adjustments link to the original context.
3. **Operational state does not own financial truth.** Shipment/order status cannot manufacture a charge, refund, credit or settlement.
4. **Financial state does not own physical truth.** Payment success cannot create intake, custody, dispatch, movement or delivery evidence.
5. **Physical events are append-oriented.** Intake, custody transfer, movement, attempt and delivery proof are recorded as distinct attributable facts. Correction preserves original evidence and links to an authorized amendment.
6. **Authorization is evaluated at mutation time.** UI visibility, a prior page load or a stale permission snapshot is insufficient for a consequential action.
7. **Location capability is time-sensitive.** Validate the relevant location/service/action capability at the time of the action, including operational closure/hold.
8. **External provider state is not assumed atomic with Firestore.** Model unknown outcomes and reconciliation; do not claim cross-system transactions.
9. **Derived dashboards are not authoritative.** Metrics must identify source records, calculation, freshness and exception handling.
10. **Notification delivery is not a business transition.** A failed message does not reverse an approved business action; successful delivery does not prove a physical event.

## 6. Transaction and consistency boundary candidates

| Boundary | Candidate consistency requirement | External side effect / recovery concern | Decision still required |
|---|---|---|---|
| Storefront order + stock | Preserve existing server-side Firestore transaction and stock invariants | No provider action in the stock reservation transaction | Recheck existing tests and failure paths; do not redesign without evidence |
| Booking + quote acceptance | Acceptance of the exact valid quote and booking confirmation must not diverge | Customer retry or concurrent quote revision | Record relationship and acceptance semantics; technical transaction boundary after source/data design |
| Intake + custody | Physical receipt and initial custody must be recorded consistently with evidence | Physical act can precede delayed/offline recording | Offline capture policy, event time vs record time, reconciliation and correction |
| Payment provider + business record | Provider operation and local persistence are separate; unknown outcomes require reconciliation | Provider succeeds while local write fails or callback is delayed | Provider-specific idempotency/retrieval and reconciliation mechanism |
| Route assignment + resource capacity | Conflicting assignments must be detected; assignment remains distinct from movement | Resource availability may change outside transaction | Capacity authority, reservation semantics and expiry |
| Physical handover + custody record | Record transfer only when actual possession changes under DEC-044 | Receiving actor or evidence may be disputed | Proof standard, offline capture, hold and investigation |
| Refund/credit + provider/bank | Request, approval, execution and confirmation remain separate | Provider response unknown or later reversal | Finance controls, provider capabilities, reconciliation ownership |
| Notification + business event | Business event remains committed independently from message delivery | Provider timeout after send, duplicate trigger | Event outbox/dedup design, retry and recipient matrix |
| Audit/evidence + protected mutation | Consequential action and its audit reference must be reliably linked | Separate writes can leave untraceable action or orphan evidence | Atomicity/append pattern and evidence storage integrity design |

Do not assume Firestore transactions can include Cloudinary, Paystack, messaging, physical actions or other external systems. For each boundary, choose a suitable persistence/reconciliation pattern only after its authoritative records and provider behaviour are known.

## 7. Source reuse and extension discipline

| Existing inspected source boundary | Appropriate reuse | Do not stretch it into |
|---|---|---|
| `app/api/orders/route.ts` and order types | Storefront order creation, server-side price/stock validation and order-time snapshot | Independent shipment booking or physical intake |
| `app/api/orders/[orderId]/track/route.ts` and cancellation route | Narrow guest order capability-token access and pending/unpaid cancellation rules | General customer identity, party delegation or parcel collection entitlement |
| `app/api/account/orders/route.ts` and detail route | Authenticated customer order ownership checks | Sender/receiver/payer/representative entitlements without explicit policy |
| `app/api/payments/initialize/route.ts`, verify and webhook | Existing Paystack boundary, provider verification and webhook deduplication patterns | General financial ledger, refunds, multi-booking allocations or physical lifecycle |
| `lib/admin-auth.ts`, Admin verification/claim routes and Admin APIs | Existing coarse Admin authentication/allowlist checks | Granular Operations/Finance/Support/Management permissions |
| `firestore.rules` and rules tests | Existing catalogue write gates and direct-client order denial baseline | Complete API authorization, deployed-rules proof or full platform permission model |
| `app/api/admin/orders/[orderId]/route.ts` | Current storefront order fulfilment transitions | Route-leg assignment, physical custody or delivery proof |
| `app/api/admin/uploads/images/route.ts` | Validated Cloudinary upload boundary | General evidence vault without new policy/security review |

The source baseline and exact observations are in `IMPLEMENTATION_SOURCE_TRACEABILITY.md`. This matrix does not claim that new logistics, finance or audit services exist.

## 8. Minimum owner decision package for each blocked relationship

For each DB-01–DB-12 item, the accountable owner should provide:
- business meaning and why the distinction matters;
- allowed cardinalities and exceptional cases;
- lifecycle point at which the relationship is created, changed or ended;
- actor authorized to create/change it and evidence/consent required;
- consequences for pricing, payment, custody, notifications, reporting and retention;
- launch scope versus deferred scope;
- at least one normal case, one denied/invalid case and one exception/recovery case.

The owner decision register should capture the selected policy and rationale. The technical SDD then maps the decision to conceptual record ownership, source reuse, authorization, transaction/recovery and acceptance evidence. No owner decision is implied by this checklist.

## 9. Review 3 readiness impact

This matrix advances technical design by exposing the precise relationship questions that must be resolved before data/API contracts are finalized. It does not close them. Review 3 must not claim a complete data model while any launch-essential DB decision remains unresolved.

Review 3 may distinguish:
- **Approved policy:** business meaning and authority already accepted.
- **Source fact:** implementation present at the recorded source baseline.
- **Technical candidate:** a safe option with consequences, not yet approved.
- **Owner decision required:** business relationship/cardinality or operating rule that blocks final design.
- **Verification required:** runtime, security, provider or production evidence not yet available.

**Current gate:** Reviews 1 and 2 of 5 remain approved. Review 3 is still in preparation; Reviews 4 and 5 remain future gates. No application code, schema, API, Firebase rules or deployment implementation is authorized before explicit Review 5 approval of the complete SDD.
