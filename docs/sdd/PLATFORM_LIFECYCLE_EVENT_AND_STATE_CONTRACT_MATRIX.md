# VeriLyft Lifecycle Event and State Contract Matrix

**Status:** Technical lifecycle contract support; not an approved event store, schema, status enum, API, or implementation architecture  
**Prepared:** 31 October 2026  
**Documentation baseline:** PR #73 merge commit `7c07ab701993f027efa9ea17523402bb24b66ae1`  
**Application-source inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856`  
**Related:** `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_DOMAIN_BOUNDARY_AND_IDENTITY_DECISION_MATRIX.md`, `PLATFORM_MUTATION_AUTHORIZATION_AND_RECOVERY_MATRIX.md`, `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md`

## 1. Purpose and limits

The SDD already distinguishes booking, quote, payment, intake, custody, routing, dispatch, movement, delivery, financial resolution and audit/evidence. This matrix makes the distinction operational: **a command requests an action; a recorded event states what was decided or observed; a current state is the authoritative business interpretation of relevant facts.** These are related but are not interchangeable.

The matrix is intended to prevent:
- a requested action, assignment, status update or provider callback from being treated as proof of a physical event;
- a later state snapshot from erasing the facts and decisions that produced it;
- one domain's state from being used as an unapproved shortcut for another domain's transition;
- an event recorded late, corrected or disputed from silently rewriting historical chronology;
- a generic status field from carrying several independent business meanings.

It does **not** require event sourcing, a generalized event bus, a workflow engine, immutable append-only storage technology, a new collection, or a new service. Existing application architecture should be reused where it can satisfy the approved contracts. A future design may use ordinary authoritative records plus attributable history, provided it meets the evidence and recovery requirements.

No Firestore collections/fields, status enums, IDs, routes, event names, timestamp formats, retention periods, retry windows, or data cardinalities are approved here. Conceptual labels below describe business facts, not implementation constants.

## 2. Contract vocabulary

| Term | Meaning | Must not be confused with |
|---|---|---|
| Command/request | An authenticated actor or trusted integration asks the system to attempt an action | Evidence that the action succeeded |
| Decision | An authorized person/system accepts, rejects, holds, or approves a requested action | The physical event that may follow |
| Observed event | A report of something that actually happened, supported by the required source/evidence | A plan, assignment, expected milestone or UI action |
| Provider event | A message/result from an external payment, messaging, mapping, partner or other provider | Automatically trusted truth without identity, reference, scope and outcome validation |
| Business fact | A validated fact owned by a domain, such as accepted quote, verified payment or actual custody transfer | A display label or client-submitted status |
| Current state | The authoritative interpretation of the current business position, subject to recorded facts, holds and unresolved conflicts | The complete history or proof of every underlying event |
| Projection/read model | A view or summary assembled for a workflow or user | An independent authority to change the underlying business fact |
| Evidence | Information supporting a decision or observed event, including its source, actor, time and integrity context | A status label or an audit log alone |
| Correction | An attributable record explaining that a previous fact or its interpretation was wrong/incomplete | Destructive rewriting or deletion of the original history |
| Reconciliation | An owned process comparing conflicting local, provider, physical or financial facts and recording an outcome | Blind retry or choosing the latest timestamp |

A command may be accepted while the resulting event remains pending. A decision may authorize a future action without proving it occurred. An event may be observed but remain unverified or disputed. A projection may lag while reconciliation is pending. Each condition must be represented without falsely reporting completion.

## 3. Universal lifecycle contract

Every consequential lifecycle transition must be specified in this order:

1. **Owner:** Identify the domain that owns the business fact and is authoritative for its state.
2. **Trigger:** Distinguish a customer/staff command, internal decision, provider event, or physical observation.
3. **Authority:** Validate authentication, entitlement, action permission, scope, location/service capability, and any independent approval.
4. **Preconditions:** Evaluate authoritative current state, holds, prior decisions, linked records and required evidence at mutation time.
5. **Decision:** Record whether the requested transition is accepted, rejected, held, or requires review. Do not conflate authorization with execution.
6. **Occurrence:** If a physical or external event is claimed, identify the actual event source and the evidence that supports it.
7. **Commit:** Persist the domain-owned fact and any required attributable history without duplicating non-repeatable effects.
8. **Projection:** Update or rebuild affected read models only from accepted facts; a projection update must not become a second source of truth.
9. **Communication:** Report only what is confirmed. Distinguish requested, authorized, pending, observed, verified, disputed and unknown outcomes as appropriate.
10. **Recovery:** Define who reconciles a timeout, partial failure, late event, contradictory source, or correction, and how the outcome is evidenced.

Not every transition requires a human decision or physical proof. The required level is domain- and action-specific. The design must state which steps apply and why; it must not impose a universal ceremony.

## 4. State and event separation by domain

The following are conceptual fact boundaries. They do not approve exact state values or transition names.

| Domain | State owner / authoritative fact | Commands and decisions | Events/facts that may change the state | Explicit non-equivalences |
|---|---|---|---|---|
| Service/location capability | Authorized service/location configuration owner | Enable, restrict, suspend or restore a configured capability | Attributable configuration decision and effective change | Active location does not imply every service/action is enabled; staff permission does not create location capability |
| Quote | Pricing/quote domain | Request quote, issue, accept, reject, expire, supersede or revise | Valid issuance, explicit booking-party acceptance, customer decision, approved revision/expiry outcome | Quote issued ≠ quote accepted; accepted quote ≠ payment or intake; current rate ≠ historical accepted price |
| Independent booking | Booking domain | Create draft, accept quote, amend, cancel, close as unfulfilled or refer for review | Valid booking-party acceptance and authorized lifecycle decision | Quote alone does not confirm booking; payment or booking does not prove parcel receipt |
| Storefront order | Storefront order domain | Place, cancel, amend where allowed | Server-validated order creation and authorized order decision | Storefront order is not an independent shipment booking; its fulfilment status is not a custody ledger |
| Payment | Payment/provider integration domain, with Finance responsibility for reconciliation | Initialize, verify, record at intake, refund-request, approve, execute, reverse or reconcile | Verified provider result, approved receipt evidence, provider-confirmed refund/reversal, attributable reconciliation | Redirect ≠ payment success; payment intent ≠ settlement; refund request ≠ completed refund |
| Financial position/settlement | Finance-owned financial records and reconciliation | Apply eligible payment, adjustment, credit, refund or write-off under authority | Verified financial event and approved reconciliation outcome | Payment status alone is not a complete ledger; cancellation does not imply refund; operational role does not grant Finance authority |
| Physical intake | Intake/location operations | Present, identify, inspect, measure, accept, refuse or hold | Actual physical receipt or refusal/hold observation with required evidence | Booking/label/appointment/arrival scan does not prove physical receipt |
| Custody | Custody/operations domain | Request/authorize handover; confirm, dispute or investigate | Actual handover plus receiving party possession, supported by required proof | Assignment, dispatch, arrival, attempt, message or administrative update alone does not transfer custody |
| Route proposal | Routing domain | Prepare, revise, review, accept or reject proposal | Attributable proposal/review decision | Proposal ≠ approved assignment or movement |
| Assignment | Authorized Operations domain | Assign, reserve, reassign or release a resource/route leg | Authorized assignment decision and its effective change | Assignment ≠ dispatch, departure, possession or delivery |
| Dispatch | Authorized Operations domain | Request, approve, reject or hold dispatch | Authorized dispatch decision and, separately, actual departure evidence if claimed | Dispatch authorization ≠ physical departure; dispatch ≠ custody transfer or payment success |
| Movement/leg | Movement/operations domain | Record/verify milestone, deviation, handover, arrival or exception | Actual observed milestone with source, actor, time/location and applicable proof | Planned route, assigned vehicle, GPS estimate, scan or arrival claim does not automatically prove a handover |
| Delivery | Delivery domain | Attempt, retry, complete, refuse, hold, return or refer | Actual attempt/outcome and approved successful-delivery proof | Attempt ≠ completion; recipient message/open ≠ possession; delivery status assignment ≠ proof |
| Support/dispute | Support owns intake/verification/routing of request; relevant business domain owns decision | Open, verify, acknowledge, route, escalate, appeal | Verified request, review decision by authorized domain, communicated outcome | Support note/request ≠ booking amendment, refund, custody change, dispatch approval or evidence disclosure |
| Audit/evidence | Audit/evidence governance | Record, view, review, correct, redact, hold, export or disclose | Attributable business event, evidence receipt, review/correction/disclosure decision | Log ≠ proof of physical event; Admin label ≠ blanket audit/export/disclosure authority |
| Notification | Notification delivery process; triggering domain owns the business fact | Request send, retry, suppress or change channel under policy | Provider delivery/acceptance result where available; otherwise an attempt/unknown outcome | Notification sent ≠ recipient read/accepted/possessed; notification failure does not reverse the triggering business fact |

## 5. Physical event contract

For intake, custody, movement, dispatch departure, delivery attempt and delivery completion, the future design must distinguish the following facts where relevant:

- **Physical actor:** the person/provider who actually performed the physical act.
- **Receiving party:** the person/provider who actually took possession, where a transfer is claimed.
- **Recorder:** the authenticated person/system that entered the record; may differ from physical actor.
- **Source:** direct observation, device scan, partner/provider assertion, customer report, or another evidence source.
- **Event occurrence time:** when the physical event is asserted to have happened.
- **Record capture time:** when the platform received or recorded the assertion.
- **Event location:** where the event is asserted to have happened, distinguished from the recorder's current location if different.
- **Target:** the specific parcel/shipment/leg/consignment to which the evidence applies, without assuming unapproved cardinality.
- **Outcome:** completed, refused, failed, disputed, held, unknown, or another owner-approved conceptual outcome; exact values remain undecided.
- **Evidence:** service-specific proof and its source/integrity context.
- **Reason/context:** required for exceptions, corrections, refusal, damage, discrepancy or manual entry.

A system must not claim a transfer of custody unless the accepted DEC-044 condition is met: actual physical handover and receiving-party possession. If a handover is disputed, ambiguous or insufficiently evidenced, preserve the last confirmed custodian and retain the competing accounts/evidence for controlled review. An administrator may correct a record of where an event occurred only through an attributable correction; this does not itself create a physical movement.

Offline or delayed capture must preserve the distinction between event occurrence and record capture. A later upload must not be silently treated as the event's actual time. Clock trust, source confidence, duplicate scans and conflicting chronology require explicit handling in the service-specific contract.

## 6. Event ordering, late arrival and correction

The latest timestamp is not automatically the authoritative fact. A future design must define ordering and conflict resolution per event family, taking account of:
- trusted provider sequence/reference where applicable;
- event occurrence time versus record capture time;
- known clock accuracy and offline capture;
- causal dependencies (for example, actual receipt before a custody transfer from that location);
- current lifecycle preconditions and holds;
- evidence source and confidence;
- whether a later event is a correction, a delayed report, a duplicate, or a genuinely new occurrence.

When a late or out-of-order event arrives:
1. authenticate and validate its source, target, scope and reference;
2. deduplicate only within the appropriate event family and identity scope;
3. retain its asserted occurrence time and actual capture time;
4. compare it with accepted prior facts and lifecycle constraints;
5. do not silently reorder, overwrite or retroactively authorize an invalid transition;
6. route contradiction or uncertainty to the responsible reconciliation owner;
7. record the resolution, evidence and any projection correction;
8. communicate only the currently confirmed position.

A correction must reference the fact being corrected, explain the reason and preserve the original record/evidence according to the approved retention and legal-hold policy. Corrections may change the current interpretation where authorized; they must not make the original action, actor or earlier system knowledge disappear. Redaction or disclosure restrictions are separate controlled actions and must not be implemented as an unrecorded edit.

## 7. Cross-domain dependency rules

| Upstream fact | May enable or inform | Must not automatically mutate |
|---|---|---|
| Valid accepted quote | Confirm independent booking and preserve commercial terms | Payment, intake, custody, route assignment or delivery |
| Verified payment | Satisfy an applicable payment prerequisite or update financial position | Physical receipt, custody, dispatch departure or delivery |
| Authorized unpaid-dispatch exception | Permit a specifically approved dispatch path under DEC-030/DEC-041 | Mark payment as successful or settle the balance |
| Confirmed booking | Permit a valid intake workflow | Claim receipt, custody, route assignment or movement |
| Actual intake | Establish initial physical receipt/custody when DEC-042/044 proof rules are met | Payment settlement, dispatch or delivery |
| Route proposal approval | Permit an authorized assignment decision | Dispatch or physical movement |
| Route/resource assignment | Make a dispatch request eligible subject to remaining checks | Actual departure, handover or custody transfer |
| Dispatch authorization | Permit an actor to perform dispatch | Prove actual departure, transfer, arrival or delivery |
| Movement/arrival observation | Update movement position if validated | Custody transfer unless actual handover and receipt are proven |
| Delivery attempt | Inform retry, hold, refusal or return resolution | Successful delivery without required proof |
| Verified successful delivery | Complete delivery fact under approved proof policy | Automatically settle refund/claim/liability/insurance decisions |
| Customer adjustment acceptance | Establish accepted revised commercial context | Payment settlement or actual collection of additional funds |
| Refund approval | Authorize a provider/financial action | Prove the refund was executed or received |
| Provider refund confirmation | Update the financial event and reconciliation | Reopen/alter physical custody or delivery |
| Support case/request | Trigger verification, routing and review | Change the underlying business fact without its owner's authority |
| Notification delivery result | Inform communication monitoring | Change booking/payment/custody/delivery state |

Dependencies are eligibility conditions, not implied transitions. Each consuming domain rechecks its own preconditions and authority.

## 8. Current-state projections and read models

The platform may need summary views for customers, Admin/Operations, Finance, Support and location staff. A projection is a role- and purpose-specific presentation of authoritative facts; it is not a new authority boundary.

Each proposed projection must specify:
- the authoritative domain facts from which it is derived;
- the intended audience and record entitlement;
- which details are omitted or minimized;
- whether it is real-time, eventually consistent or explicitly stale;
- how unresolved/unknown/disputed facts are presented;
- how a user can reach the underlying authoritative record or permitted evidence;
- how it is rebuilt or corrected if a projection update fails;
- why existing pages/components cannot present the same information without a new portal/module.

A dashboard summary must not convert a proposal into a completed movement, a payment attempt into settlement, or a delivery attempt into success. Stale read models must not be used as the sole basis for consequential mutations. The mutation path rechecks the authoritative domain record.

This section does not prescribe event sourcing or a universal event log. A future implementation can store state and history in the existing persistence model if it preserves domain ownership, traceability, correction and recovery.

## 9. Transition specification template

Every P0 transition must be described in the final design with the following fields. The template is a documentation requirement, not a request to create an implementation form.

| Field | Required content |
|---|---|
| Transition identifier | Stable SDD reference, not a runtime enum |
| Domain/fact owner | One accountable domain owner; identify external authority if applicable |
| Trigger kind | Command, decision, provider event, physical observation, reconciliation or correction |
| Initiator / actor | Authenticated requester, decision-maker, physical actor, recorder and provider distinguished as needed |
| Target and relationship | Relevant record and required entitlement/cardinality decisions |
| Preconditions | Authoritative state, required linked facts, holds, configuration and capability |
| Permission | Exact action permission, scope, location capability and independent approval requirement |
| Decision outcome | Accepted, rejected, held, pending review or another explicitly defined conceptual outcome |
| Resulting fact | What has become true and what has not |
| Side effects | External provider, financial, stock, notification, physical or other action |
| Evidence | Mandatory evidence and source; distinguish proof from a log/status |
| Idempotency/concurrency | Duplicate identity, version/conditional update, stale request and replay response |
| Failure/unknown | Partial failure, timeout, late event, provider unknown and recovery owner |
| Audit/correction | Attribution, reason, history preservation, correction and disclosure control |
| Communication | Audience, permitted fields and truthful outcome wording |
| Acceptance evidence | Reproducible test, record assertions, provider evidence and reviewer sign-off |

If a field is not applicable, the specification must say why. “Handled by Admin” or “update status” is not a sufficient transition definition.

## 10. Required lifecycle acceptance families

The existing 80 A-01–A-20 scenario rows remain scenario outlines, not executable test specifications. For each applicable P0/Conditional P0 transition, derive concrete cases for:

1. valid command and accepted decision;
2. missing/invalid entitlement, action permission, scope or location capability;
3. invalid source, target, relationship, state or hold;
4. explicit rejection and preserved state;
5. duplicate command/event;
6. concurrent and stale mutation;
7. delayed/out-of-order provider or physical event;
8. external success with local persistence failure;
9. local pending with unknown external outcome;
10. contradictory evidence or disputed physical event;
11. attributable correction and preservation of original facts;
12. permitted audience/projection and denied access to restricted detail;
13. recovery/reconciliation by the designated owner;
14. notification wording that reflects the confirmed state only.

Not every row requires all fourteen variants; the case specification must justify which apply. These families supplement, rather than replace, service-specific thresholds, proof methods and owner decisions.

## 11. Open design inputs and decision dependencies

The following remain unresolved and must not be assigned invented values in a technical design:

- DB-01–DB-12 record relationship/cardinality decisions, including booking/shipment/parcel, route-leg, storefront-order/shipment, quote, payment allocation, party multiplicity, business representation, location/partner, evidence and financial-event relationships;
- exact conceptual lifecycle outcomes and permitted transition graph for each launch service;
- service-specific proof for intake, custody, movement, handover, delivery, collection, refusal, return and offline capture;
- trusted source, clock confidence, event ordering and dispute/correction authority by event family;
- provider-specific event identity, sequencing, reconciliation and unknown-outcome handling;
- exact read-model freshness, access, projection-rebuild and operational ownership requirements;
- service-specific pricing, units, quote/handover validity, measurement thresholds and customer response periods;
- payment, refund, credit, reconciliation and approval limits;
- action-level staff permission catalogue, scope and second-person approval cases;
- audit/evidence catalogue, retention/legal holds, redaction and disclosure process;
- notification recipient/channel/consent matrix and failure ownership;
- operational recovery, monitoring, backups, incident response, rollback and recovery objectives.

The owner decision register remains authoritative for policy choices. This document only specifies the technical consequences of the accepted boundaries and exposes dependencies that must be resolved before final schema/API contracts.

## 12. Source and architecture constraints

The source inspection baseline remains `e0f69055d33dd9399c23e1d793f359468229c856`. Existing source findings indicate storefront order, Paystack payment, customer access, Admin order and Cloudinary upload boundaries, but no dedicated active shipment booking, shared shipment quote, intake/custody, route/movement, delivery-proof or cross-domain audit service was identified in the inspected source surface.

That finding is bounded to the recorded source snapshot and does not prove current runtime or deployed behaviour. Do not infer that a new generalized service or event platform is necessary. For each identified gap, the final architecture must first evaluate reuse of existing App Router, Firebase Auth/Firestore/Admin, provider integration and UI patterns, then document why an extension or new boundary is required.

## 13. Review 3 readiness impact

This matrix advances Review 3 preparation but is not itself an approved event/state architecture. Review 3 must not be presented until:
- each P0 domain fact has one authoritative owner and explicit cross-domain dependencies;
- command, decision, observation, provider event, state and projection are consistently distinguished across workflows and API contracts;
- physical-event proof and custody rules comply with DEC-042–DEC-044;
- DB-01–DB-12 are resolved or explicitly identified as non-launch-blocking with approved fallback;
- late, duplicate, out-of-order and corrected facts have domain-specific ordering and reconciliation ownership;
- role-specific projections do not create shadow authority or leak party information;
- transition specifications link to executable acceptance cases and evidence;
- source reuse/gaps and production verification limits are accurately stated.

**Current gate:** Reviews 1 and 2 of 5 remain approved. Review 3 remains in preparation; Reviews 4 and 5 remain future consolidated approvals. This document approves no schema, status enum, event store, API, generalized event architecture, code change or deployment. Application-code, schema, API, Firebase-rule, configuration and deployment work remains frozen until explicit Review 5 approval of the complete reconciled SDD.
