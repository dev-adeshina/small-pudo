# VeriLyft DB-01–DB-12 Technical Contracts and Acceptance Specifications

**Status:** Owner-reviewed logical technical-contract and case-level acceptance baseline, reconciled with DEC-049; no physical schema, API routes, status enums, permission catalogue, provider activation, or application implementation is approved by this document.  
**Prepared:** 2 November 2026  
**Repository/source baseline:** `main` at `730581ba6b4a6f5ea25718d8d11face40aaed0dd` (PR #111 merge; confirmed identical to the user's synchronized baseline).  
**Fresh source-review scope:** Current M1.3 shipment-draft UI, API, authentication, Firestore store and tests; existing storefront order/payment paths; current Firestore rules and Firebase Admin boundary. This is a bounded read-only review, not a full repository semantic audit, runtime verification, deployed-configuration review, or production inspection.  
**Authority:** DEC-018, DEC-019, DEC-023–DEC-049 as applicable, PM-01–PM-12, BP-01–BP-22, and the existing approved workflow/lifecycle/authorization/evidence documents.  
**Related:** `PLATFORM_CONSOLIDATED_OWNER_DECISION_PACKAGE.md`, `PLATFORM_M2_COMMERCIAL_PRICING_OWNER_DECISIONS.md`, `PLATFORM_M2_PRICING_AND_QUOTATION_READINESS_SPECIFICATION.md`, `PLATFORM_API_PERSISTENCE_AND_INTEGRATION_BOUNDARY_CONTRACT.md`, `PLATFORM_TECHNICAL_CONTRACT_RECONCILIATION.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, `PLATFORM_MUTATION_AUTHORIZATION_AND_RECOVERY_MATRIX.md`, `PLATFORM_LIFECYCLE_EVENT_AND_STATE_CONTRACT_MATRIX.md`, `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md`.

## 1. Purpose and decision boundary

This document consolidates DB-01–DB-12 relationship, ownership, cardinality, API, persistence, authorization, transaction, replay, recovery and acceptance requirements. DEC-049 subsequently resolves the logical DB-01/DB-02/DB-05 booking, parcel and quote relationships; their physical representation remains open.

It has four jobs:

1. Record the current source facts, including the M1.3 draft workspace added after the older platform-wide source baseline.
2. Translate accepted policy into technical invariants without inventing Firestore collections, fields, document shapes, indexes, API paths, payloads, enums, claims or permission identifiers.
3. Separate accepted minimum-launch business boundaries from technical candidates and genuinely unresolved owner/operational inputs.
4. Turn the existing 80 P0 scenario outlines into a first case-level acceptance specification for the booking foundation and its critical cross-domain boundaries, while marking cases that cannot yet be executed safely.

**This is not a database schema or API specification.** A logical relationship in this document does not prescribe whether Firestore uses a collection, subcollection, embedded data, reference, projection or another existing compatible representation. Physical representation requires a separate source-aligned design review before implementation.

DEC-045 permits bounded implementation under accepted policy. It does not permit unresolved rules to be filled in by code. This document does not authorize implementation by itself; the owner must review and merge the technical contract and acceptance specification before the next code slice.

## 2. Fresh source review at current main

### 2.1 Baseline and method

The repository comparison from the user's synchronized commit `730581ba6b4a6f5ea25718d8d11face40aaed0dd` to `main` is identical. A comparison from the earlier focused administrator-review baseline `0e4dfd8e198ef2c14ed22ef393ddf801372b7613` to current main shows intervening application changes, including the M1.3 shipper dashboard and shipment-draft workspace. Therefore, the earlier source inventory must not be used as the sole current description of the shipper foundation.

The current review re-fetched the following paths read-only:

- `app/account/page.tsx` and `app/account/shipments/page.tsx`;
- `app/api/account/shipment-booking-drafts/route.ts` and `app/api/account/shipment-booking-drafts/[draftId]/route.ts`;
- `lib/server/customer-auth.ts`, `lib/server/shipment-booking-draft-api.ts`, `lib/server/shipment-booking-draft-store-core.ts`, `lib/server/shipment-booking-draft-store.ts`, `lib/server/shipment-booking-drafts.ts`, and `lib/validations/shipment-booking-draft.ts`;
- `tests/shipment-booking-draft-api.test.mjs`, `tests/shipment-booking-draft-store.test.mjs`, and `tests/shipment-booking-drafts.test.mjs`;
- `app/api/orders/route.ts`, the Paystack initialize/verify/webhook routes, `lib/types/order.ts`, `lib/firebase-admin.ts`, and `firestore.rules`.

The review did not inspect production Firestore records, deployed rules, credentials, provider dashboards, real payments, customer data, physical operations, or the root `pudo.zip` archive. Source presence is not runtime or production proof.

### 2.2 Current M1.3 draft-workspace facts

The current draft workspace is preparation-only:

- The customer UI requires a signed-in, email-verified customer and sends a Firebase bearer ID token to the server.
- The server verifies the token through Firebase Admin and derives the customer UID from the verified token. The caller cannot choose the owner UID.
- The current Firestore store writes drafts beneath the authenticated user's existing document path, in a `shipmentBookingDrafts` subcollection. It records the verified UID as the booking-party owner, draft-only status, origin, destination, parcel description and server timestamps.
- Listing is scoped to that UID, ordered by most recently updated and limited to the latest 50 returned drafts.
- Updating is scoped to the same UID and uses a Firestore transaction to confirm the existing record remains editable before applying the update.
- The current draft validator accepts trimmed origin, destination and parcel-description strings with explicit length limits. These are draft-workspace inputs, not an approved final booking input catalogue.
- The API exposes draft listing, creation and update only. No quote issuance, quote acceptance, confirmed booking, parcel/shipment creation, payment, intake, custody, location eligibility, route assignment or dispatch operation is implemented by this workspace.
- The source tests cover verified-customer authentication, validation, owner isolation, draft update guards and Firestore store behaviour. The emulator-backed store suite is skipped when `FIRESTORE_EMULATOR_HOST` is absent.

**Contract consequence:** Keep a draft distinct from a quote, accepted booking, parcel, payment and physical shipment. The current draft Firestore path and shape are implementation facts for this bounded feature, not a template or approval for future booking, quote, parcel, payment or custody records.

### 2.3 Existing storefront and infrastructure facts

- `app/api/orders/route.ts` is the existing storefront order-creation boundary. It validates submitted customer/delivery/items, merges duplicate product lines, reads current product records, recalculates trusted prices and checks active state/stock on the server, then reserves stock and creates the storefront order in a Firestore transaction.
- The current order type contains commerce/customer/delivery/item totals, payment status/reference and storefront fulfilment/shipping metadata. It is not an independent shipment, parcel, custody, route-leg or general financial-event contract.
- Paystack initialization, verification and webhook routes are scoped to existing storefront orders. They verify provider references and amount/currency, verify webhook signatures, and use transactional state checks and a deterministic webhook-event record. These are reusable patterns only where compatible; they do not establish multi-purpose shipment payment, pooled allocation, refund execution or a financial ledger.
- `firestore.rules` denies direct client reads and writes to `orders`. The inspected draft store uses Firebase Admin server-side access, so its authorization contract is enforced by its server handler rather than by client Firestore rules.
- `lib/firebase-admin.ts` initializes the existing Firebase Admin application and Firestore/Auth access.
- No shared shipment quote/rate service, independent confirmed-booking API, general parcel/intake/custody service, PUDO capability service, route-leg/movement service or general financial reconciliation service was established by this bounded review.

**Reuse rule:** Preserve the existing App Router, Firebase Auth, Firestore, Firebase Admin, Paystack and current component/service/type patterns. Reuse a source pattern only for the same compatible responsibility. Do not extend storefront order/payment records into unrelated shipment facts merely because they already exist.

## 3. Accepted invariants after DEC-048

The following are accepted policy and must not be reopened without contradictory evidence:

1. Independent shipment booking is for registered, authenticated customers at launch. Storefront guest checkout remains separate.
2. A valid quote explicitly accepted by the authenticated booking party confirms the independent booking and accepted commercial terms.
3. Booking confirmation, payment, physical intake, custody transfer, dispatch, movement and delivery are separate facts.
4. One independent booking has one parcel and one itemized quote for the minimum launch. Multi-parcel bookings, parcel splitting/merging and cross-obligation allocation are deferred.
5. Each service uses an explicitly approved service-specific pricing configuration. No Standard, Express or Scheduled fixed/calculated/hybrid model has been selected.
6. Minimum-necessary service-specific inputs must have approved authoritative sources, actor/source classification, unit, precision, explicit permitted conversions, validation and missing/unavailable behaviour. Actual mappings remain open.
7. Quote validity and physical handover deadline are separate commitments. Both must be communicated before quote acceptance. Numerical durations, triggers and missed-deadline consequences remain unresolved.
8. Pricing governance separates proposal, Operations validation, Finance review and independent approval, aligned with PM-01–PM-12. Named approvers, permission assignment, thresholds and effective-date/publication mechanics remain open.
9. Storefront delivery and independent shipment pricing use one shared pricing-rule authority wherever inputs overlap. Product catalogue price remains distinct from delivery/shipment price.
10. Standard, Express and Scheduled are the customer-facing launch services. Each is evaluated independently across address-address, address-PUDO, PUDO-address and PUDO-PUDO journeys.
11. Under DEC-047, all twelve service/endpoint combinations remain unavailable until their own eligibility, location actions, coverage, valid route, operating availability/capacity and Operations approval are evidenced. Missing, stale or revoked evidence fails closed.
12. Booking-party, sender, receiver/collection recipient, payer, handover person, collection person, legal representative and delegate are distinct relationships. One person may occupy multiple roles, but one relationship does not grant another relationship's entitlement.
13. Payment alone does not grant shipment-detail or collection authority. Payer access defaults to payment confirmation/receipt only.
14. Staff action permission and location/service/action capability are independent checks.
15. Custody changes only on actual physical handover and receiving-party possession under DEC-044. Route assignment, dispatch, arrival or attempted handover is not completed transfer.
16. Payment verification, refund approval, provider execution and financial reconciliation are distinct. Finance owns reconciliation.
17. Support may verify, acknowledge, record, route and escalate; it does not inherit booking, payment, custody, dispatch or unrestricted evidence authority.
18. Evidence viewing, export, correction, retention/legal hold and external disclosure are separately controlled. Preserve original facts and attributable corrections.
19. Notifications report verified business events and expose only fields permitted for the recipient's relationship. Notification delivery does not change the underlying business fact.
20. DEC-036 P0/Conditional P0 release evidence remains an independent release gate. A passing build or source presence does not establish launch readiness.

## 4. DB-01–DB-12 relationship and ownership contracts

The terms **accepted**, **technical candidate**, **open input** and **deferred** are used deliberately. A recommendation from an earlier owner package is not an approved business rule merely because it appears in a design document.

| ID | Authoritative fact / relationship contract | Accepted minimum-launch boundary | Technical candidate or unresolved input | Launch disposition |
|---|---|---|---|---|
| DB-01 | Quote acceptance confirms the commercial booking obligation; booking confirmation is separate from the physical parcel/shipment lifecycle. | Under DEC-038/049, authenticated booking-party acceptance of the exact current, valid quote version confirms the booking. It creates no parcel and implies no payment, intake, possession, custody, route or dispatch. | Physical parcel identity is created only when authorized intake accepts actual possession. Refusal before possession creates no parcel/custody; physical receipt retained under an authorized hold records parcel plus actual custody. Missed-handover financial/liability outcomes remain unresolved. | Logical timing is accepted. Quote acceptance remains unavailable until pricing, quote terms, DEC-047 eligibility and technical prerequisites are approved. |
| DB-02 | Booking and parcel are distinct concepts; commercial minimum launch is one parcel per independent booking. | Under DEC-048/049, zero parcels before accepted physical possession and exactly one parcel after accepted possession; each parcel in this independent-booking path belongs to exactly one originating booking. Multi-parcel, split, merge, partial acceptance and ordinary reassignment are unsupported. Walk-in intake remains separate. | Physical Firestore representation, stable identity/identifier, correction representation and transaction implementation remain to be designed. | Logical cardinality and creation trigger are accepted. Parcel/intake remains unavailable until location/action authority and physical evidence contracts are approved. |
| DB-03 | A parcel may move through multiple transport movements; proposal, approval, assignment, dispatch, movement, arrival and physical custody transfer are distinct. | Physical custody follows DEC-044; Operations manages route proposals/assignments at launch; Driver Portal is deferred. | Sequential legs, one active assigned/in-progress leg per parcel, shared transport capacity, reassignment history, split legs and parallel movement rules remain technical/policy candidates, not accepted cardinality. | Route/leg implementation remains blocked pending approved relationship, capacity and movement/evidence contracts. |
| DB-04 | Storefront order is the purchase authority; logistics fulfilment is a separate operational obligation. | Logistics-first hierarchy; an order without delivery is not a shipment. | Exact creation/association trigger for delivery-eligible storefront fulfilment, cancellation/unpaid behaviour and order-to-parcel linkage remain unresolved. | Preserve current order and stock transaction. Do not convert every order into a shipment or infer a parcel from shipping metadata. |
| DB-05 | Quote is the commercial offer and immutable accepted context for one independent booking. | Under DEC-048/049, one logical quote lineage per independent booking; immutable issued versions; one current offer version; exact-version acceptance binds the accepted version/snapshot to exactly one confirmed booking. Later configuration changes do not rewrite accepted terms. | Physical quote/booking linkage, version identifiers, snapshot representation, acceptance-evidence fields and local stale-version/idempotency mechanism remain to be designed. Rates, formulas, currency, arithmetic, fees and numerical deadlines remain unapproved. | Logical lineage/version/acceptance semantics are accepted. Quote issuance/acceptance remains blocked by commercial, DEC-047 and physical technical prerequisites. |
| DB-06 | Payment instruction/provider transaction is for a defined business purpose; payment is distinct from booking and settlement. | DEC-041 governs full settlement as the normal dispatch prerequisite; partial payment only where explicitly supported by approved service configuration/procedure. | One-obligation-per-payment allocation is a conservative candidate, not a fully approved allocation policy. Multi-obligation allocation, partial failures, extra payments, refunds and chargebacks need explicit Finance rules. | Reuse Paystack only for compatible verified provider interactions. Do not generalize the storefront order payment flow to shipment bookings. |
| DB-07 | Identity and party relationships govern record access and actions; role labels are not interchangeable. | BP-01–BP-22; multiple relationships per person allowed; payer, sender, receiver and booking-party entitlements remain distinct. | Relationship persistence, verification checkpoint/method, consent, delegation scope, expiry/revocation and compromised-account handling need technical contracts. | No access based solely on matching email, UID, booking ID, payer status or possession of a reference. |
| DB-08 | A registered customer may arrange a business shipment when the business and relationship are identified. | DEC-038 permits business-arranged bookings; no separate enterprise account platform is assumed. | Business identity source, authority evidence, verification/dispute path and multi-user access remain open. A self-declared relationship is not blanket authority. | Disable business-arranged booking where required verification/evidence cannot be provided. |
| DB-09 | Location owns active state and approved service/action capabilities; staff own independently assigned action authority. | DEC-025/043 and PM-01–PM-12; no direct partner/driver login under the current launch boundary. | Actual service/location/action matrix, coverage/capacity sources, accountable operator model, configuration granularity, partner arrangements and queued-work handling remain open. | All twelve DEC-047 combinations remain unavailable. Do not infer eligibility from a location label or staff permission. |
| DB-10 | Consequential business/physical facts have attributable evidence and controlled access/correction/disclosure. | DEC-033, PM-08 and DEC-044; preserve originals; physical custody requires actual handover and receiving possession. | Event-specific evidence catalogue, source confidence, time/location integrity, correction/reviewer authority, retention schedule, legal-hold authority and disclosure process need completion. | A capability is blocked if mandatory evidence or reviewer authority is undefined. Do not use status, route assignment, Cloudinary upload or a generic log as physical proof. |
| DB-11 | Financial events and reconciliation are Finance-owned; original financial facts and corrections remain traceable. | DEC-029/041; payment attempts, provider transactions, charges, refunds, credits, reversals, adjustments and approvals/execution are distinct. | One-obligation linkage and financial-event relationship/cardinality are technical candidates; pooled balances, cross-obligation allocation, reconciliation cadence/tolerances, cash handling and escalation remain open. | No general ledger/refund/reconciliation implementation inferred from order payment fields or webhook deduplication records. |
| DB-12 | Notifications communicate verified business events to recipients entitled to the disclosed fields. | DEC-034; payer default is payment confirmation/receipt; Telegram paid-order notice remains behind Admin “Assign For Delivery” gate. | Event/recipient/field matrix, verified contact/consent, channels, timing, deduplication/retry, receipts, retention and failure ownership remain open. | No general notification engine or new channel is activated until the matrix and controls are approved. |

### 4.1 Cross-domain ownership rules

- The quote authority owns the issued offer and accepted commercial snapshot; the booking authority owns the confirmed service instruction; the parcel/shipment authority owns physical-item identity and physical lifecycle; the payment/provider boundary owns verified provider outcomes; Finance owns financial reconciliation.
- Storefront order and independent shipment booking remain distinct commercial origins. A delivery-eligible order may enter shared logistics fulfilment only through an explicitly approved relationship.
- A parcel may reference the booking/order that authorizes its handling, but a reference does not make the parcel, order and booking the same business record.
- The physical custodian is established from actual receipt/transfer evidence, not the actor who created a record or assigned a route.
- A projection may combine facts for display, but each fact retains its authoritative owner, entitlement, freshness and repair path.

## 5. Common API and command contract

These are logical operation responsibilities, not endpoint names or HTTP payload designs.

### 5.1 Operation classes

| Class | Contract |
|---|---|
| Draft command/query | Save, list and update preparation data under the authenticated customer's own entitlement. A draft must not trigger quote, booking, payment, intake or custody side effects. |
| Quote command/query | Calculate/issue, retrieve, revise, expire and accept a quote as distinct operations. Calculation requires approved service configuration and trusted input mappings. |
| Booking command/query | Confirm only on explicit acceptance of the exact valid quote by the authenticated booking party. Read and change actions require relationship-specific entitlement and lifecycle authority. |
| Parcel/intake command | Establish physical-item identity and record actual receipt only under approved booking/walk-in path, active location capability, assigned staff authority and required evidence. |
| Payment/provider command | Bind an external payment instruction to one defined business purpose and target obligation; verify with authoritative provider evidence. |
| Financial resolution command | Separate request, approval, execution, provider/bank confirmation and reconciliation. Finance controls reconciliation. |
| Route/dispatch command | Separate proposal, approval, assignment, dispatch authorization, observed movement, arrival and physical handover. |
| Evidence action | Capture, view, export, correct, hold, redact or disclose evidence under distinct permissions and approvals. |
| Notification command | Send only after the underlying business event is authoritative; resolve recipient entitlement and permitted fields independently. |
| Projection/query | Read only; derive from authoritative facts, enforce field-level entitlement and state freshness/unavailability. |

### 5.2 Mandatory mutation decision sequence

Every consequential mutation must re-evaluate, at mutation time:

1. Authenticated principal or trusted provider/system identity.
2. Target resolution without treating a record identifier as a credential.
3. Explicit relationship/entitlement to that target and action.
4. Exact action permission for staff operations.
5. Scope (record, service, task, region and/or location) where applicable.
6. Active location and service/action capability for location-bound actions.
7. Authoritative lifecycle preconditions and all relevant holds.
8. Server-side validation of input, relationships, amounts, units, provider references and evidence.
9. Independent approval only where accepted policy requires it; never impose universal second approval.
10. Concurrency, stale-write and replay protection appropriate to that operation.
11. Required evidence, actor/receiver/physical-performer/recorder attribution and audit context.
12. Consistent local commit and truthful response, with an owned recovery path for external unknown outcomes.

Authentication, relationship, permission, scope, location capability, lifecycle validity, approval and evidence are separate checks. A UI guard, email match, UID supplied by the browser, Admin label or successful HTTP response is not a substitute.

### 5.3 Query and projection contract

- Resolve record entitlement on the server; do not expose protected data merely because a caller knows an identifier.
- Apply purpose- and relationship-specific field disclosure. Payer access defaults to payment confirmation/receipt, not full shipment details.
- A customer dashboard may summarize drafts/bookings/orders, but it must not imply that a draft is a confirmed booking or that a booking is a received parcel.
- Mark stale, disputed, unknown or unavailable facts truthfully. A projection is not the mutation authority.
- Support access remains limited to approved support purposes; audit/evidence export and external disclosure are separate actions.

## 6. Persistence, transaction and recovery invariants

### 6.1 Persistence invariants

Any later physical representation must preserve:

- one authoritative write owner for each business fact;
- explicit and validated relationships and cardinality;
- stable business identity and traceable relationship changes;
- accepted quote snapshots and historical commercial context;
- separate current-state and historical decision/event facts where required;
- no conflation of booking, payment, intake, custody, movement, delivery or financial resolution;
- least-privilege reads and writes, including field-level disclosure;
- attributable evidence, corrections and original-history preservation;
- category-specific retention/legal-hold behaviour once approved;
- reproducible, permission-aware projections and a repair/rebuild approach.

Logical separation does not require a separate Firestore collection or service for every domain. No event-sourcing framework, universal event bus, CQRS layer, workflow engine or microservice is implied.

### 6.2 Local transaction candidates

| Boundary | Local atomicity objective | Non-atomic effect / failure | Required contract |
|---|---|---|---|
| Storefront order + stock reservation | Preserve the existing transaction that validates current product/stock and creates the order/reservation together. | Payment provider initialization happens outside the transaction. | Regression-test concurrent stock, duplicate submission, transaction failure and cancellation/payment races. |
| Draft update | Preserve owner scoping and transactional status check before updating an editable draft. | No external side effect is present in the current draft update. | Test owner isolation, non-draft update denial, missing record and concurrent state change. |
| Quote acceptance + booking confirmation | Accepted quote version and booking confirmation must not diverge. | Concurrent expiry/revision or duplicate acceptance. | Implement the approved logical consistency objective (DEC-049) only after a separate physical design selects a local consistency mechanism and executable acceptance fixtures. |
| Booking + parcel relationship | Preserve the approved one-parcel commercial limit and explicit creation timing. | Physical parcel may be presented later or intake may be refused. | Do not create a parcel or physical receipt/custody at booking acceptance; create the parcel identity only when authorized intake accepts actual possession, with refusal-before-possession and receipt-under-hold distinguished. |
| Payment provider + local financial state | Bind provider request/result to a defined obligation and verified amount/currency/purpose. | Provider can succeed while local persistence/callback fails; event may be delayed/replayed. | Provider-specific unknown-outcome and reconciliation; no blind repeat of a potentially successful external side effect. |
| Intake/custody event | Persist an accepted physical fact and its required evidence consistently. | Evidence upload/capture may fail or be delayed; physical event may already have occurred. | Define controlled incomplete-evidence investigation and preserve last confirmed custody. |
| Route assignment + movement | Assignment decision and observed movement remain distinct. | Capacity or assignment may change after proposal; movement event may arrive late. | Detect stale assignments; preserve history; do not infer departure, arrival or transfer. |
| Financial resolution | Approval, provider execution, provider confirmation and reconciliation remain distinct. | External refund/credit may succeed while local confirmation fails. | Reconcile authoritative provider/bank evidence; preserve original event and attributable correction. |
| Notification | Business event commit is independent of message delivery. | Send may time out or be duplicated. | Retry/deduplicate only under an approved channel-specific policy; never roll back the business fact because a notification failed. |

### 6.3 Replay, concurrency and recovery

- Each consequential operation must specify its own deduplication identity, scope, retention, response to duplicate delivery and recovery owner. Do not impose one universal idempotency key.
- Re-evaluate permissions and lifecycle preconditions when the mutation is executed, not only when the UI was loaded.
- Stale quote acceptance, booking amendment, cancellation, location capability, route assignment and custody changes must not overwrite a newer decision.
- Provider success plus local failure is an unknown local outcome, not permission to charge/refund again blindly.
- Duplicate webhook delivery must not create duplicate financial effects. Existing `paymentWebhookEvents` is a storefront Paystack event-processing pattern, not a general ledger.
- Physical events retain occurrence time separately from capture time where delayed/offline capture is allowed. Late or out-of-order evidence is reconciled; it is not silently reordered.
- Corrections link to preserved original facts and evidence. A correction is not a new physical event.
- Recovery ownership follows the domain: Finance for financial reconciliation; Operations for route/custody/delivery exceptions; designated security/admin authority for access; evidence reviewers for evidence corrections/disclosure; notification owner for delivery failures.

## 7. Security and entitlement contract

| Principal / relationship | Default permitted boundary | Explicitly not implied |
|---|---|---|
| Registered customer / booking party | Create an independent booking only after authenticated access and valid quote acceptance; access own entitled booking information and permitted pre-intake actions. | Access to another customer's booking, staff authority, or physical custody. |
| Sender | Information/actions specifically allowed by BP policy and the booking relationship. | Booking-party change/cancellation authority or unrestricted financial detail. |
| Receiver / collection recipient | Information and collection actions after the required identity/authority checks. | Full quote/payment access or authority to nominate another collector by default. |
| Payer | Payment confirmation/receipt for the defined payment purpose. | Shipment detail, booking changes, collection or custody authority. |
| Handover person | Participate in physical presentation/hand-over under the applicable intake verification process. | Booking-party authority merely because the person presents the parcel. |
| Staff | Only explicitly assigned action, scope and location responsibility. | Universal authority from Admin/Operations/Finance/Support title or authentication. |
| Location | Only active, approved service/action capabilities. | Staff permissions, route eligibility or proof that a physical event occurred. |
| Provider/system | Only the authenticated event/request purpose and target obligation. | Ability to create an unrelated payment, booking or physical fact. |
| Support | Verify, acknowledge, record, route, escalate and communicate permitted status. | Booking, refund, dispatch, custody, collection release or unrestricted evidence authority. |

Business-arranged bookings require a separately verified business/relationship authority. Where the evidence or dispute path is not ready, that capability remains disabled; a declaration alone does not grant blanket access to all business shipments.

## 8. Case-level acceptance specification

### 8.1 Specification conventions

The existing `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md` contains 80 A-01–A-20 scenario outlines. They remain the authoritative high-level P0 inventory and are not replaced or renumbered here.

The cases below expand the independent booking foundation and critical cross-domain invariants into repeatable case-level specifications. Each case must be run only in an approved non-production environment with synthetic identities and records. A case is **Ready** only when its required fixtures, approved policy and evidence are available. **Blocked** means the expected business outcome still depends on an unapproved input or unresolved technical relationship. A blocked case must not be marked passed.

Each execution record retains: case ID and version; requirement/decision references; application commit and environment; configuration/policy version; synthetic fixtures; actor and entitlements; exact action/request; response; expected changed facts; protected facts that must remain unchanged; duplicate/concurrent/failure variants; evidence/correlation references; pass/fail/blocked/not-run result; tester and independent reviewer; and cleanup confirmation.

### 8.2 Draft-workspace cases — current implemented preparation boundary

| Case | Preconditions / actor | Action | Expected result | Must remain unchanged | Replay / failure / evidence | Readiness |
|---|---|---|---|---|---|---|
| TCC-DRAFT-01 Create draft | Verified registered customer; no draft required. | Submit valid origin, destination and parcel description. | Draft is stored under the authenticated customer's ownership; response identifies a draft only. | No quote, confirmed booking, parcel, payment, intake, custody or route record is created. | Repeat with missing/invalid bearer token and unverified account; retain request/response and owner-scoped Firestore assertions. | Ready; current source tests cover the principal path. |
| TCC-DRAFT-02 Customer isolation | Synthetic customers A and B each have a draft. | A lists and attempts to update B's draft by identifier. | A sees only A's drafts; update of B's draft returns a non-disclosing not-found outcome. | B's draft content, ownership and timestamps remain unchanged. | Repeat with altered caller-supplied owner fields; verify token UID remains authoritative. | Ready; current API/store tests cover isolation. |
| TCC-DRAFT-03 Editable-state guard | Customer owns an editable draft; separate fixture is no longer draft. | Update each fixture. | Only the draft remains editable; a missing or non-draft record is not updated. | Ownership and creation history remain unchanged. | Race an update against a controlled lifecycle change; inspect transaction outcome and record snapshot. | Ready for draft lifecycle; current helper/store tests cover status guard, with concurrency evidence required for full runtime acceptance. |
| TCC-DRAFT-04 Validation and safe failure | Verified customer; synthetic malformed and boundary inputs. | Submit malformed JSON, missing fields and over-limit strings. | Invalid input is rejected without creating/updating a draft. | Existing drafts and all downstream business facts remain unchanged. | Capture response and before/after record counts. | Ready; current validation/API tests cover these cases. |

### 8.3 Booking and commercial acceptance cases

| Case | Preconditions / actor | Action | Expected result | Must remain unchanged | Replay / failure / evidence | Readiness |
|---|---|---|---|---|---|---|
| TCC-BOOK-01 Confirm from valid quote | Registered verified booking party; supported service/endpoint combination; approved issued quote with unexpired validity and separately communicated handover deadline. | Booking party explicitly accepts the exact current quote version. | Exactly one confirmed commercial booking is bound to that accepted quote version and immutable accepted terms. | No parcel, payment instruction, physical presentation/intake, custody, route assignment/movement or delivery is created or inferred. | Concurrent/duplicate acceptance yields at most one booking; authorized replay resolves to the original outcome; stale/superseded/expired version is rejected without mutation. Acceptance and booking confirmation do not diverge. | Logical contract accepted by DEC-049; execution remains blocked by pricing configuration, DEC-047 service eligibility, quote/handover values and physical API/persistence/security design. |
| TCC-BOOK-02 Reject non-booking-party acceptance | Quote exists; authenticated sender/receiver/payer or unrelated customer is not the booking party. | Attempt quote acceptance and booking retrieval/mutation. | Acceptance/mutation is denied unless the specific BP policy explicitly grants that action. | Quote and booking remain unchanged; protected data is not leaked. | Direct API attempt, not UI-only; retain entitlement decision evidence. | Policy accepted; technical relationship and executable fixtures pending. |
| TCC-BOOK-03 Reject guest shipment booking | Signed-out visitor or storefront guest token holder. | Attempt independent booking creation or quote acceptance. | Denied; independent shipment booking remains registered-customer-only. | No quote acceptance, booking, parcel or payment instruction is created. | Test direct API as well as UI; storefront guest checkout must continue to work independently. | Policy accepted; booking API not yet implemented. |
| TCC-BOOK-04 One parcel per booking | Confirmed independent booking with no parcel; authorized intake actor, eligible location/action and required physical-possession evidence are established. | Accept physical possession of the presented item; separately attempt duplicate/concurrent intake or a second parcel, split or merge. | The first accepted possession creates exactly one parcel linked to that booking. Refusal before possession creates no parcel/custody. Physical receipt retained under an authorized hold creates parcel plus actual custody. | Booking and accepted quote remain unchanged; no second parcel or unsupported split/merge is created. | Test concurrent intake, replay, stale linkage, wrong location, missing evidence and direct API bypass. | Logical cardinality/timing accepted by DEC-049; execution blocked pending location/action authority, physical evidence and persistence/API/security design. |
| TCC-QUOTE-01 Preserve accepted quote | One quote lineage has an issued current version under an approved configuration; authenticated booking party accepts that exact version. | Issue a revised version before acceptance; attempt acceptance of the superseded version; after acceptance change current pricing configuration and retrieve the historical quote/booking. | Issued versions are immutable; a revision supersedes the prior unaccepted offer; only the current version is acceptable; exact accepted version/snapshot is bound to one booking and remains reconstructable. | Later configuration does not rewrite accepted inputs, itemized charges, total, currency, rule version/effective context or payment history. | Concurrent revision/acceptance and duplicate acceptance; compare accepted snapshot to original fixture and verify stale version denial. | Logical lineage/version/snapshot rules accepted by DEC-049; execution blocked by service pricing values, quote terms, DEC-047 and physical persistence/API design. |
| TCC-QUOTE-02 Separate quote expiry and handover deadline | Approved service quote with distinct approved quote validity and handover deadline. | Attempt acceptance after quote expiry; separately miss handover after an accepted booking. | Expired unaccepted quote cannot be accepted; expiry of accepted quote does not silently cancel the booking; missed handover follows an approved service-specific outcome. | No automatic refund, fee, compensation or physical custody is inferred. | Boundary-time and delayed-request variants; retain policy version and timestamps. | Blocked: numerical durations, triggers and missed-handover outcomes remain unresolved. |
| TCC-QUOTE-03 No placeholder charge | Service has incomplete pricing configuration or an unapproved fee/tax component. | Request a quote. | Quote issuance fails closed or the service remains unavailable; no assumed zero/placeholder charge is presented as an approved quote. | No booking or payment instruction is created. | Test missing source, stale rate and partial configuration. | Policy accepted; blocked pending actual commercial evidence and approval. |

### 8.4 Payment, physical operations and cross-domain cases

| Case | Preconditions / actor | Action | Expected result | Must remain unchanged | Replay / failure / evidence | Readiness |
|---|---|---|---|---|---|---|
| TCC-PAY-01 Bind payment to purpose | Confirmed payable obligation and an explicitly approved payment configuration. | Initialize and verify payment using a provider sandbox. | Provider reference, purpose, target obligation, amount and currency match the authoritative payable context before settlement is recorded. | Payment does not alter custody, intake or delivery. | Duplicate/concurrent callbacks, forged signature, mismatched reference/amount/currency and provider-success/local-write-failure. | Blocked for independent shipment: DB-06/DB-11 and payment configuration/provider-purpose contract remain open. Existing storefront tests remain separate. |
| TCC-PAY-02 Cancellation and late success | Payment attempt exists; booking/order is cancelled or expires under an approved rule. | Deliver a late provider-success event. | Event is linked to its original purpose and routed to the approved financial review/resolution path; cancelled work is not silently reactivated. | No automatic refund, credit, dispatch or custody transition. | Replayed and out-of-order provider events; preserve provider evidence and original obligation history. | Policy accepted; shipment payment allocation and late-payment disposition details remain open. |
| TCC-INTAKE-01 Record actual intake | Valid confirmed booking or separately approved staff-created walk-in path; active location with explicit intake capability; staff with intake permission; required proof standard configured. | Record presentation and either refusal before possession, accepted physical receipt, or receipt retained under an authorized hold. | Refusal before possession records the attempt/outcome but creates no parcel or custody. Accepted physical possession creates exactly one parcel for the confirmed booking and records actual intake/custody with physical actor, receiving location, recorder, occurrence/capture context and required evidence. Receipt under hold still records possession/custody. | Booking/quote terms remain unchanged; no parcel is created from quote acceptance, payment or presentation alone; no unsupported measurement/adjustment is inferred. | Duplicate/concurrent intake, wrong location, missing evidence, false refusal despite possession and staff/location authorization denial. | Logical trigger/cardinality accepted by DEC-049; execution blocked by location/action authority, event proof/evidence catalogue and physical persistence/API/security design. |
| TCC-CUSTODY-01 Failed or disputed handover | Parcel has a last confirmed custodian; handover is attempted but receiving possession is not established or is disputed. | Submit failed, incomplete or conflicting handover evidence. | Last confirmed custody is preserved; case is held for authorized investigation; no completed transfer is asserted. | No route assignment, dispatch, arrival or status edit changes custody. | Delayed evidence and attributable correction variants; preserve both original accounts and source evidence. | Policy accepted under DEC-044; event-specific proof/reviewer and technical representation remain open. |
| TCC-LOCATION-01 Independent staff and location checks | Synthetic staff with/without action permission; active/inactive locations with/without a configured action. | Attempt a location-bound action through the direct API. | Action succeeds only when both actor permission and location/service/action capability are valid. | Denial leaves parcel, custody, booking and capability configuration unchanged. | Revoke permission/capability between page load and mutation; verify mutation-time recheck. | Policy accepted; actual capability matrix, permission catalogue and technical implementation remain open. |
| TCC-ROUTE-01 Assignment is not movement | Valid route proposal/assignment fixture and separate physical movement fixture. | Assign route, then separately record dispatch/movement/arrival/handover. | Assignment alone changes only planned responsibility; movement and custody require their own authorized, attributable observed events. | No assignment or dispatch command fabricates physical movement or custody transfer. | Stale proposal, reassignment, wrong parcel/leg, duplicate movement and delayed event variants. | Policy accepted at boundary; DB-03 cardinality, capacity and event evidence details remain open. |
| TCC-FIN-01 Approval is not financial execution | Authorized refund/adjustment request and independent approver under an approved Finance policy. | Approve, execute and reconcile as separate steps. | Approval authorizes the next step only; provider/bank confirmation and reconciliation establish the resulting financial outcome. | Approval alone does not mark refunded/credited or alter custody/delivery. | Duplicate execution request and provider-success/local-failure recovery; preserve original financial event. | Policy accepted; DB-11 representation, permissions, provider methods and Finance operating rules remain open. |
| TCC-EVIDENCE-01 Preserve originals and control access | Consequential event with original evidence; synthetic users with distinct view/export/disclosure authority. | Attempt unauthorized access, then perform an authorized correction/export under approved process. | Unauthorized access is denied; authorized action is attributable and linked to original evidence; original remains reconstructable. | Correction is not a new physical event; Admin status alone does not grant evidence access. | Replay correction, altered location claim and disclosure request; retain access manifest and integrity comparison. | Policy accepted; event catalogue, reviewer matrix, retention/legal-hold and technical evidence store remain open. |
| TCC-NOTIFY-01 Entitled notification fields | Verified business event; booking party and payer are distinct; approved recipient/field/channel matrix exists. | Trigger payment and operational notifications. | Each recipient receives only the fields permitted by their relationship; payer default receives payment confirmation/receipt only. | Notification does not change booking, payment, custody or delivery. | Duplicate event, timeout, bounce and unverified contact variants; retain redacted message and delivery-provider evidence. | Policy accepted; DB-12 matrix/channel/consent/retry/failure ownership remain open. |
| TCC-STOREFRONT-01 Preserve commerce/logistics boundary | Synthetic storefront orders with and without delivery eligibility. | Create and progress each order under approved fulfilment policy. | Order without delivery remains commerce-only; delivery-eligible order enters logistics only through the approved fulfilment relationship. | Do not create an independent booking or parcel for every order; preserve existing stock transaction. | Cancelled/unpaid/duplicate order and delivery-eligibility changes; verify stock and order history. | DEC-037 boundary accepted; exact DB-04 trigger/linkage remains open. |

### 8.5 Case execution rules

- The four TCC-DRAFT cases are executable against the current draft workspace. Existing automated tests provide source-level test coverage; this document does not claim they were rerun for this review.
- Cases marked Blocked are specifications of the required behaviour, not permission to invent missing fixtures, rates, statuses, evidence standards, API paths or data fields.
- A blocked case may become Ready only when its named policy/technical dependencies are approved and a non-production fixture can represent them without real customer, payment or physical-operation data.
- The existing 80 P0 scenario outlines remain intact. Their full case-by-case executable conversion, including A-01–A-20 and ADM-R01–ADM-R54, is a continuing acceptance workstream; this document expands the booking foundation and critical dependencies first.
- Conditional P0 cases must be completed before the associated capability is enabled. Otherwise, the capability remains disabled.

## 9. Implementation sequence and capability gates

The next implementation step must not start with quote calculation or confirmed booking while the following remain unresolved:

- DEC-047 actual eligibility outcomes and Operations evidence for the twelve service/endpoint combinations;
- per-service pricing model, approved input/source/unit/conversion mapping, rates/formulas, currency/arithmetic and explicit fee/tax treatment;
- quote validity and separate physical handover deadlines, including triggers and missed-deadline outcomes;
- Physical representation, transaction mechanism and API/security enforcement of the accepted DEC-049 DB-01/DB-02/DB-05 logical rules;
- DB-03 parcel-to-route-leg relationship and capacity/movement evidence rules;
- DB-06 payment allocation and DB-11 financial-event linkage/reconciliation rules;
- DB-07/DB-08 relationship verification, delegation and business authority evidence;
- DB-09 capability configuration, operational accountability and coverage/capacity evidence;
- DB-10 event-specific evidence/reviewer/retention/legal-hold/disclosure controls;
- DB-12 recipient/field/channel/consent/retry/failure ownership;
- exact API/security/concurrency/replay/recovery contracts and the case-level acceptance fixtures for the capability being enabled.

Following the owner review/merge of this technical-contract baseline and the DEC-049 relationship reconciliation, proceed with a separate source-aligned physical persistence/API/security design review. Only after that design and the relevant commercial/operational prerequisites are approved may an implementation slice be selected. Keep every blocked capability unavailable; do not create a placeholder booking/quote schema.

### 9.1 Recommended execution order

1. Treat DEC-049 as the accepted logical authority for DB-01/DB-02/DB-05; keep DB-03, DB-04, DB-06–DB-12 open where marked.
2. Conduct a separate read-only source-aligned physical persistence/API/security design review for the accepted booking/parcel/quote rules, including local consistency, access enforcement, indexes, migration/recovery and source reuse.
3. Resolve only owner/operational inputs that block the next intended capability; preserve deferred capabilities under DEC-045/DEC-047.
4. Finalize executable acceptance cases and synthetic fixtures for the exact implementation slice.
5. Obtain owner review/merge of the physical design before any physical schema/API implementation.
6. Begin implementation only for the approved Ready slice, preserving the existing application architecture; add automated tests and non-production verification alongside each implementation PR. Do not claim launch readiness until DEC-036 P0/Conditional P0 evidence and operational release requirements are satisfied.

## 10. Explicit non-approvals

This document does not approve:

- Firestore collection/subcollection/document names, field names, indexes, identifiers, status enums, schemas or migration/backfill plans;
- API route paths, HTTP methods, request/response payloads, token formats or new services;
- fixed/calculated/hybrid pricing model for any service, actual rates/formulas/coefficients, units/conversions, currency, precision, rounding, taxes, surcharges, discounts or fee values;
- quote validity, handover deadlines, Scheduled windows/cutoffs, estimate durations or guarantee policy;
- service/location/action eligibility, coverage, capacity, route algorithm, provider/driver access or partner system login;
- payment methods/providers for shipment booking, cross-obligation allocation, pooled balances, refund/credit execution limits or reconciliation tolerances;
- staff permission IDs, claims, named approvers, thresholds, universal second-person approval or emergency-access duration;
- physical proof methods, evidence retention periods, legal-hold authority, disclosure recipients or notification retry counts/timeouts;
- production deployment, provider activation, runtime behaviour, launch readiness or release sign-off.

**Approval boundary:** The owner-reviewed technical baseline and DEC-049 accept only the explicitly stated logical invariants and case-level acceptance direction. Any physical schema, endpoint, permission implementation, provider configuration, operational numeric value or capability activation still requires its own approved specification and evidence.


## 17. DEC-049 relationship decision reconciliation — 2 November 2026

PR #114 was reviewed and merged at `26d93cb2748041c8fa0e34bb8a65693949bce0e8`; the owner accepted the consolidated DB-01/DB-02/DB-05 recommendations, recorded as DEC-049.

The relationship table and case-level specifications above are reconciled to the accepted logical rules:
- quote acceptance confirms one commercial booking and creates no parcel/payment/intake/custody/route side effect;
- one parcel is created only on authorized acceptance of actual physical possession; refusal before possession creates no parcel/custody; receipt under hold records actual custody;
- one quote lineage per independent booking has immutable issued versions, one current offer and exact-version acceptance bound to one immutable accepted snapshot;
- concurrent/replayed acceptance and intake cannot create duplicate bookings or parcels.

**Readiness remains blocked:** pricing models/values/arithmetic/quote and handover durations, DEC-047 service/endpoint evidence, location/action authority, physical proof/evidence, and concrete API/persistence/security design remain unresolved. DB-03, DB-04, DB-06–DB-12 and M0/DEC-036 remain independent gates. The case specifications express required behaviour; they are not executable tests and do not make the capabilities available.

**Next:** perform a separate source-aligned physical persistence/API/security design review for only the accepted DB-01/02/05 rules, without implementing quote issuance, booking acceptance or parcel intake while their independent prerequisites remain blocked.


## 10. Physical design follow-on — PR #116 baseline (2 November 2026)

The Review 5 sequence is now owner-approved and PR #116 is merged at `0ca77ea2cff30d38ea10e279810f4e0cae65cd90`. The focused source re-fetch at that baseline is recorded in `PLATFORM_DB01_DB02_DB05_PHYSICAL_PERSISTENCE_API_SECURITY_DESIGN.md`.

That companion proposal formalizes the physical representation, transaction/replay boundaries, API and authorization responsibilities, Rules/default-deny implications, query/index policy, additive migration and synthetic acceptance fixtures for DB-01/DB-02/DB-05. It remains a proposal for owner review; this logical contract is not retroactively converted into an approved schema or endpoint specification.

The next implementation slice, after owner approval of the companion physical contract, is limited to quote-lineage and immutable-version persistence primitives and synthetic Emulator/Rules tests. Quote issuance/acceptance and parcel/intake remain disabled until their separate commercial, DEC-047, authorization, location and evidence prerequisites are approved.

## 18. PR #117 physical-contract approval and M2 package reconciliation — 5 November 2026

PR #117's owner-approved DB-01/DB-02/DB-05 physical design is the governing physical contract for the bounded relationship foundation. This corrects older wording in this document that continued to call the companion design a proposal awaiting approval. Preserve the companion document's explicit exclusions and do not broaden its approval.

DEC-049 remains the logical relationship authority. DEC-048 remains the commercial-unit authority. The accepted minimum launch is one parcel and one itemized quote per independent booking, but that commercial choice does not itself determine additional persistence cardinalities or settle DB-03, DB-06 or DB-11. The physical contract does not make quote issuance or acceptance ready.

**Open capability contracts remain:** DB-03 route/leg relationships; DB-04 and other operational lifecycle dependencies; DB-06 payment allocation/settlement; DB-07/DB-08 identity, relationship, delegation and business authority; DB-09 location/service/action eligibility and operational accountability; DB-10 event evidence, reviewer authority, retention and legal hold; DB-11 financial-event linkage/reconciliation; and DB-12 notification recipient, field, channel, consent, retry and failure ownership. Each blocks only the affected capability under DEC-045; none may be treated as resolved by the DB-01/02/05 physical approval.
