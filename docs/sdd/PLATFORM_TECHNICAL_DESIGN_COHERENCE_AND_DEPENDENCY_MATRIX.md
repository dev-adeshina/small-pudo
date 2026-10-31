# VeriLyft Platform Technical Design Coherence and Dependency Matrix

**Status:** Review 3 technical-design synthesis; not an implementation specification or approval to build  
**Prepared:** 31 October 2026  
**Documentation baseline:** PR #76 merge commit `da4fa5407d899ed5999ce29e61a43be1ef8a89bb`  
**Application-source inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856`

## 1. Purpose

This matrix is the integration index for the platform-wide technical-design artifacts. It tests whether each requirement area has a coherent chain from business purpose and authoritative fact, through lifecycle and authorization, to persistence/API responsibility, external dependencies, acceptance evidence and unresolved owner inputs.

It is not a substitute for the referenced domain contracts. It does not create new business decisions, close blockers, select a schema/API, or authorize implementation. Its purpose is to expose inconsistencies and prevent a technically convenient choice from silently deciding a business rule.

## 2. Authority and interpretation

Apply these sources in order:
1. Accepted owner decisions and approved policy records in `DECISIONS.md` and the relevant DEC/PM/BP documents.
2. Domain lifecycle, identity/party, event/state, mutation/recovery, and audit/evidence contracts.
3. Technical/API/persistence/integration and production-readiness contracts.
4. Requirement traceability, acceptance matrices, P0 test-readiness and evidence catalogue.
5. Source observations from the recorded source-inspection baseline.

A source-backed implementation detail does not override an accepted policy. A proposed acceptance scenario does not resolve a missing business rule. A technical concept in this matrix is not an approved implementation choice.

## 3. Cross-document design invariants

The following must remain true across all technical artifacts:

| Invariant | Required interpretation | Primary contract |
|---|---|---|
| One authoritative fact owner | Every business fact has a declared write authority; copies/projections name their source and repair approach | API/persistence/integration boundary contract |
| Separate identities and entitlements | Authentication, record entitlement, booking-party authority, staff action permission, scope, location capability and approval are separate checks | Domain boundary and identity decision matrix; staff permission decisions |
| Separate lifecycles | Quote, booking, storefront order, payment, financial settlement, parcel, intake, custody, route assignment, movement, delivery, support and notification are not interchangeable states | Domain lifecycles; lifecycle event/state matrix |
| Evidence-backed physical facts | Assignment, dispatch, arrival or attempt alone does not prove possession transfer; DEC-044 requires actual handover plus receiving-party possession | Lifecycle event/state matrix; mutation/recovery matrix |
| External effects are non-atomic | Provider payment/refund/message/upload and physical action cannot be assumed atomic with local persistence; unknown outcomes require reconciliation | Mutation/recovery matrix; API/persistence contract |
| Least privilege and separation | Page visibility is not authorization; every privileged action is checked server-side; consequential approval is separate where policy requires it | Staff permission decisions; mutation/recovery matrix |
| Preserve history | Corrections/redactions are attributable and do not overwrite original business/evidence facts | Audit/evidence policy; lifecycle event/state matrix |
| Projections are not authority | Reports and dashboards declare source, calculation, freshness and access scope; demo values are not live evidence | API/persistence contract; production readiness contract |
| Evidence before release | Source presence is not runtime acceptance; unresolved P0/conditional P0 gates block activation/release as applicable | P0 test readiness; production readiness contract |
| Reuse before extension | Map a requirement to existing App Router/Firebase/provider boundaries before proposing a new service or architecture | Technical contract reconciliation; API/persistence contract |

## 4. Requirement-area technical coherence matrix

The “existing source position” column is bounded by source inspection at `e0f69055d33dd9399c23e1d793f359468229c856`. “Not found” means no active source path was identified in that bounded inspection; it is not a claim that no work exists elsewhere.

| Area | Authoritative business fact / lifecycle | API, persistence and authorization boundary | External effect / recovery concern | Acceptance and evidence anchor | Remaining dependency / design gate |
|---|---|---|---|---|---|
| A-01 Catalogue | Product/category active state, public visibility and trusted catalogue values | Public read; privileged catalogue mutation; server revalidation at purchase | Firestore rules and Admin authorization must remain aligned; stale client catalogue cannot authorize purchase | A-01; source evidence plus public-read and direct-mutation tests | Existing source present; category relationship/data consistency and runtime security regression remain |
| A-02 Cart / checkout | Cart is intent; order and stock reservation are server-confirmed facts | Server validates product, price, quantity and stock; local order/reservation consistency | Duplicate submit, concurrent stock contention, payment-initiation failure and cancellation race | A-02; transaction assertions, duplicate/concurrency/failure evidence | Existing source present; explicit duplicate-submission and race-case specs remain |
| A-03 Storefront order | Order commercial snapshot and order lifecycle remain distinct from payment/fulfilment | Customer/guest entitlement; authorized staff transition; server-owned state | Late/duplicate payment, cancellation and stock release must not double-apply | A-03; lifecycle and transaction evidence | Existing source partial; full transition/late-payment table and runtime evidence remain |
| A-04 Customer / guest access | Authenticated customer identity, own-order entitlement and narrow guest capability are distinct | Customer-owned queries; guest token scope; DEC-035 recovery/claim separate | Token loss, replay, expiry, challenge and account claim/transfer must not leak or transfer entitlement silently | A-04/A-19; VLY-009/VLY-010; guest recovery cases | Existing source partial; recovery challenge, expiry/rate-limit and claim details remain |
| A-05 Independent shipment booking | Confirmed shipment instruction and accepted commercial terms | Booking-party authorized booking command; party-specific queries/actions | Duplicate confirmation, quote expiry and booking/parcel relationship must be controlled | A-05; DEC-018/038 and booking lifecycle cases | No active source found; DB-01–DB-03 and booking-party detail remain |
| A-06 Pricing / quote | Versioned quote, trusted inputs, accepted terms and expiry | Server-owned quote calculation/issuance/acceptance; accepted quote snapshot | Rate changes and quote expiry cannot silently rewrite confirmed terms | A-06; quote vectors and acceptance/expiry evidence | No shared shipment quote service found; formulas, units, rounding, rates and validity remain owner inputs |
| A-07 Payment | Provider attempt/transaction and local payment status are separate facts | Server initialize/verify/webhook; reference, amount, currency and purpose checks | Provider success/local failure, duplicate/out-of-order callbacks, unknown outcome and reconciliation | A-07; provider sandbox plus local-record correlation | Paystack storefront source present; general shipment payment purpose and reconciliation policy remain |
| A-08 Financial resolution | Charge, refund, credit, reversal, write-off and reconciliation are distinct Finance-owned facts | Request, approval, provider execution, confirmation and reconciliation are separate operations | Provider outcome may be unknown; no blind retry or inferred refund success | A-08; Finance approval and provider reconciliation evidence | No complete financial-event workflow found; limits, thresholds, ledger/reconciliation policy remain |
| A-09 Intake / measurement / custody | Actual receipt, declared/actual measurement and confirmed custodian | Physical-event capture with actor, receiver, recorder, time, location, outcome and evidence | Offline/late/duplicate capture; failed/disputed handover preserves last confirmed custody | A-09; DEC-040/042/044; physical evidence catalogue | No active source found; units, conversions, thresholds, service proof and custody correction authority remain |
| A-10 Location capability | Location independently supports a service/action; staff independently holds permission | Capability configuration and eligibility query; action requires both checks | Capability revocation blocks new work but cannot erase existing custody/history | A-10; DEC-043; capability/permission tests | No active source found; exact service/location/action matrix and partner/queued-work policy remain |
| A-11 Routing | Route proposal, review/approval and assignment are separate facts | Authorized proposal/approval/assignment commands and scoped queries | Stale proposal, capacity conflict, reassignment and duplicate assignment require defined outcomes | A-11; route transition and authorization evidence | No active source found; route/leg/parcel cardinality and capacity/approval rules remain |
| A-12 Dispatch / movement / handover | Dispatch authorization and observed movement/handover are separate events | Action-level authorization; physical event attribution and evidence | Provider/carrier instruction, offline movement and disputed transfer are not atomic local updates | A-12; DEC-031/044; handover and recovery cases | No active source found; service-specific evidence, receiver confirmation and correction/hold policy remain |
| A-13 Delivery | Attempt, failed attempt, successful proof, collection and return are distinct outcomes | Entitled receiver/actor; attempt and completion commands separated | Retry/reattempt, refusal, failed proof and return trigger must not close shipment silently | A-13; DEC-032/044; proof and failure evidence | Only storefront delivered status found; service-specific proof, limits and return policy remain |
| A-14 Notifications | Verified business event is source; message attempt/outcome is downstream | Trigger, recipient/field entitlement, send and provider outcome separate | Duplicate/unknown delivery, bounce and retry cannot mutate business state | A-14; DEC-034; channel/recipient/field tests | Narrow email source only; event matrix, consent, retries, Telegram activation and failure owner remain |
| A-15 Staff authorization | Staff identity, assigned action permission, scope and location capability are distinct | Every page/API action has server-side guard; second approval where applicable | Revocation, stale token, emergency access and direct API bypass must fail safely | A-15; PM-01–PM-12; VLY-009/VLY-010 | Coarse Admin source exists; exact permission catalogue, scopes, assignment lifecycle and enforcement verification remain |
| A-16 Audit / evidence | Attributable event history and original evidence explain consequential facts | Capture, view, export, correction, hold and disclosure are separate protected actions | Failed audit/evidence persistence, correction and legal hold must preserve original evidence | A-16; DEC-033/PM-08; VLY-023 | No general audit/evidence source found; event catalogue, integrity, retention, reviewer matrix and disclosure procedure remain |
| A-17 Support / exception | Request, review, decision, correction and appeal are separate; Support assists/escalates | Support cannot inherit Finance, custody, dispatch, booking or evidence-disclosure authority | Holds and disputed facts persist until an authorized decision; no silent override | A-17; DEC-030/040–044; PM-05–PM-08/11–12 | No general exception workflow found; exception eligibility, reviewer mapping, thresholds and technical controls remain |
| A-18 Dashboard / reporting | Metrics are reproducible projections of authoritative facts | Role-scoped queries with source, calculation, freshness and stale/unavailable behaviour | Projection lag, missing source, duplicate relationships and rebuild must be visible | A-18; ADM-R41–R45; operational evidence | Existing demo metrics not live; P0 metric dictionary and source verification remain |
| A-19 Customer privacy / communications | Party relationship determines permitted fields and purpose | Record entitlement and field-level disclosure apply to API/query/notification | Changed contacts, consent, provider failure and duplicate send | A-19; DEC-023/024/034; privacy evidence | Partial account access only; party/field matrix, consent and retention remain |
| A-20 Production readiness | Deployed configuration and operational controls are evidenced separately from source design | Release/configuration gates, secrets, rules, provider setup, monitoring and recovery | Rollback, backup/restore, incident response and provider divergence | A-20; DEC-036; production-readiness contract | No deployment/runtime verification in this pass; owners, topology, RTO/RPO, backup/alert targets and release evidence remain |

## 5. Cross-domain transaction and dependency map

The following dependencies are logical sequencing constraints. They do not imply a single database transaction or a particular service architecture.

| Dependency chain | Required predecessor facts | Must not be inferred from | Failure/hold boundary |
|---|---|---|---|
| Quote → booking | Valid quote version, entitled booking party, explicit acceptance | Current catalogue price, payer identity alone, expired quote | Quote change/expiry or duplicate acceptance is reviewed without silently changing confirmed terms |
| Booking → parcel identity | Approved booking/parcel cardinality and stable parcel identity | Storefront order line or assumed one-to-one relationship | Intake waits for valid identity/link or follows approved manual reconciliation |
| Booking/payment → intake | Service eligibility and any applicable payment/acceptance gate | Payment alone or booking confirmation alone | Physical receipt is separately recorded; payment/booking does not prove intake |
| Intake → custody | Actual receipt, physical actor, receiver/custodian and required evidence | Scan, assignment, dispatch or administrative location correction | Missing/disputed evidence preserves last confirmed custodian |
| Location + staff → action | Active location/service/action capability and independent staff permission | Location type, Admin status or another enabled action | Missing either permission or capability denies new action; existing history remains |
| Route proposal → assignment → dispatch | Approved route proposal, authorized assignment and applicable holds cleared | Proposed route or assigned status as movement evidence | Stale/conflicting assignment is held for resolution |
| Dispatch → movement → custody transfer | Actual physical movement/handover, receiving-party possession and event evidence | Dispatch, arrival, provider status or message | Failed/disputed transfer does not change last confirmed custody |
| Delivery attempt → delivery completion | Approved proof standard, authorized actor and entitled receiver/collection outcome | Attempt, GPS ping, carrier status or notification | Failed attempt remains open/failed; return is separately triggered and authorized |
| Payment provider → financial settlement | Authenticated provider result and purpose-bound transaction reference | Browser callback alone, order status or notification | Unknown provider result is reconciled before retry or final financial decision |
| Business event → notification | Verified event and recipient's party/field entitlement | Client request, stale projection or payment as universal shipment disclosure | Send failure/replay does not alter business lifecycle |
| Consequential action → audit/evidence | Actor, target, decision, reason and applicable evidence/approval | Unattributed log line or screenshot alone | Action cannot be represented as fully evidenced if mandatory evidence failed |
| Domain facts → dashboard | Authoritative sources, metric definition and freshness | Hardcoded/demo values or mixed status counts | Stale/missing source is indicated, not replaced with fabricated totals |

## 6. Existing source reuse and capability-gap discipline

The source-backed inventory remains bounded to the documented inspection baseline. The current technical design must preserve these distinctions:

- **Reuse candidates already present:** Next.js App Router route boundaries; Firebase Authentication token verification; Firestore client/server access patterns; Firebase Admin server authority; storefront order/stock transaction; guest order token hashing; customer profile/order access; Paystack storefront initialize/verify/webhook; Admin order endpoints; catalogue rules; Cloudinary product/category image upload; existing order fulfilment metadata.
- **Do not claim as implemented:** independent shipment booking, shipment quote/rates, location/service capability, intake/measurement/custody, route proposal/assignment, transport movement/handover, service-specific delivery proof/collection/return, general Finance ledger/refund/reconciliation, general audit/evidence, general exception workflow, general event notification/Telegram orchestration, live operational dashboard/alerting, or production readiness.
- **No duplicate architecture by assumption:** the absence of a source path does not automatically justify a new service, portal, collection or event platform. Document the requirement, reuse analysis, domain boundary, failure mode and smallest viable extension before proposing one.
- **No schema inference:** current Firestore document shape, product/order status fields and source relationships cannot be copied as the default model for independent shipment/parcel/route-leg domains.

## 7. Owner decisions and technical blockers that remain open

These are not resolved by the existence of a conceptual technical contract:

| Blocker | Technical design impact | Required owner/policy input |
|---|---|---|
| DB-01–DB-03 | Booking/shipment/parcel/route-leg relationships, split/merge and assignment cardinality | Explicit entity relationship and lifecycle ownership decision |
| DB-04–DB-06 | Remaining domain relationships and ownership | Confirmed relationship, source-of-truth and lifecycle decision as defined in the domain-boundary matrix |
| DB-07–DB-09 | Party multiplicity/business representation and location/partner ownership | Confirmed party cardinality, representation and location/partner authority model |
| DB-10–DB-12 | Remaining evidence/record relationship and persistence constraints | Confirmed record ownership, linkage and lifecycle decision as defined in the domain-boundary matrix |
| Pricing and quote | Input model, calculation and historical commercial snapshot | Service-specific rates, formula, units, conversions, rounding, fees and validity |
| Payment and Finance | Purpose, eligibility, settlement and reconciliation | Partial/split eligibility, provider method, limits, tolerances, refund/credit and approval rules |
| Physical operations | Evidence and state transition requirements | Measurement units/thresholds, custody/delivery proof, failed event, hold and correction authority |
| Staff and location permissions | Guard enforcement and scoped access | Exact action catalogue, staff lifecycle, scope, capability matrix and second-person cases |
| Party privacy and recovery | Record/field entitlements and guest challenge | Verification, consent, delegation, collection, recovery and claim policy details |
| Audit/evidence | Persistence, access, retention and disclosure | Event/evidence catalogue, integrity, retention/legal hold, correction/redaction and disclosure procedure |
| Provider integration | Request identity, callbacks, unknown outcome and reconciliation | Provider-specific capabilities, reference/query semantics, safe retry and accountable owner |
| Reporting/operations | Queries, projections and alert design | Metric dictionary, freshness, severity/threshold, alert ownership and stale-data behaviour |
| Production readiness | Deployment, backup, restore, rollback and release sign-off | Environment topology, RTO/RPO, backup cadence/retention, monitoring targets, named owners and release evidence |

Do not substitute technical defaults for these owner inputs.

## 8. Review 3 technical-design completeness checklist

Review 3 should be presented only when the consolidated design package can demonstrate:

- [ ] Each A-01–A-20 area has an explicit source-backed, missing-capability, deferred or conditional status.
- [ ] Each authoritative business fact has a named logical domain owner and lifecycle.
- [ ] Booking parties, senders, receivers, payers, handover persons, staff and partners are not conflated.
- [ ] Each privileged action has an explicit authentication, entitlement, permission, scope, location-capability and approval boundary as applicable.
- [ ] Each consequential lifecycle transition has its actor, precondition, state effect, evidence, denial and recovery boundary.
- [ ] Cross-domain dependencies do not infer payment, intake, custody, movement, delivery or notification from another domain's status.
- [ ] Persistence invariants and unresolved cardinalities are visible; no speculative schema is selected.
- [ ] Local transaction boundaries are distinguished from external provider/physical effects.
- [ ] Unknown, delayed, duplicate, concurrent and out-of-order outcomes have accountable reconciliation paths.
- [ ] API/query contracts protect record and field entitlements and identify authoritative source/freshness.
- [ ] Audit/evidence access, correction, retention, hold and disclosure are separately controlled.
- [ ] Production control objectives and minimum release evidence are mapped to A-20 without unsupported numeric targets.
- [ ] P0 and conditional P0 acceptance evidence traces to these boundaries and retains unresolved inputs as blockers.
- [ ] Every claim about existing source is bounded by the recorded source-inspection baseline; no runtime/production result is implied.
- [ ] The SDD progress, handoff, issue register and README agree on the current milestone, baseline and next work.

## 9. Review and implementation gates

This matrix is a coherence aid for the consolidated Review 3 package. It does not itself constitute Review 3 approval, Review 4 acceptance-criteria approval or Review 5 final consistency/implementation-freeze release.

- Reviews 1 and 2 of 5 remain approved.
- Review 3 is still in preparation and must be presented as one consolidated technical-design package.
- Review 4 remains the future consolidated SDD and acceptance-criteria review.
- Review 5 remains the final consistency audit and explicit decision on lifting the implementation freeze.
- No application code, schema, API, Firebase rules/configuration, provider activation or deployment is authorized before explicit Review 5 approval.

## 10. Evidence limitations

No new source inspection, runtime test, deployed configuration review, provider-dashboard review, production data inspection or live browser/API test was performed to prepare this matrix. All source-backed statements refer to the existing bounded source-inspection baseline. The root `pudo.zip` archive remains outside the authoritative source baseline pending an explicit scope/authority decision.
