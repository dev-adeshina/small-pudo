# VeriLyft Consolidated Owner Decision Package

**Status:** Proposed minimum-launch recommendations; not owner-approved policy and not an approved data model  
**Prepared:** 31 October 2026  
**Preparation baseline:** PR #83 merge commit `986f4ad79232ce1700f4edaa972a17522ed319c8`  
**Related:** `PLATFORM_OWNER_DECISION_REGISTER.md`, `PLATFORM_REVIEW_3_OWNER_INPUT_TRIAGE.md`, `PLATFORM_DOMAIN_BOUNDARY_AND_IDENTITY_DECISION_MATRIX.md`, `PLATFORM_REVIEW_3_COMPLETENESS_AUDIT.md`, `PLATFORM_REVIEW_3_ACTION_CAPABILITY_CROSSWALK.md`, `PLATFORM_REVIEW_3_LIFECYCLE_TRANSITION_AND_RECOVERY_CROSSWALK.md`, `PLATFORM_REVIEW_3_RESOURCE_ENTITLEMENT_AND_PROJECTION_LINEAGE_CROSSWALK.md`

## 1. Purpose and approval boundary

This package consolidates the remaining owner-dependent choices into five decision groups. It is intended to avoid twelve separate DB questions and repeated approval rounds.

It distinguishes:
- **Accepted policy:** decisions already recorded in DEC-018, DEC-022–DEC-044, PM-01–PM-12 and BP-01–BP-22. These are preserved and are not reopened here.
- **Proposed recommendation:** a conservative minimum-launch choice for owner consideration. It is not accepted until the owner explicitly confirms it.
- **Technical specification:** work that can be completed from accepted policy and source evidence without asking the owner to choose a business rule.
- **Release blocker / deferred scope:** a matter that must be resolved before the affected capability can launch; deferral is not permission to invent a default.

The owner's statement to proceed with preparation authorizes this consolidation work only. It does not approve each recommendation, a data model, schema, field, collection, endpoint, status vocabulary, permission implementation, Firebase rule/configuration, provider activation, deployment, or application-code change.

**Implementation remains frozen until the complete reconciled platform-wide SDD has passed the agreed final review and the owner explicitly authorizes implementation.**

## 2. Package A — Booking and physical service unit (DB-01–DB-04)

### A1. Booking confirmation and shipment obligation (DB-01)

**Already accepted**
- Under DEC-038, a valid quote accepted by the authenticated booking party confirms the independent booking.
- Booking confirmation is distinct from payment, physical intake, custody and fulfilment.
- Missed handover, refusal before custody and actual physical receipt must not be conflated.

**Recommendation**
- Treat acceptance as creation of the confirmed commercial booking obligation.
- Treat the parcel/shipment's physical operational lifecycle as a separate obligation that becomes actionable through the applicable intake/fulfilment process.
- Record refusal, expiry, cancellation and missed handover as distinct outcomes under the applicable service policy; none may fabricate physical possession.

**Alternative**
- Defer creation of the operational shipment obligation until a later service-specific acceptance/intake milestone. This reduces early operational records but complicates customer visibility, handover deadlines and cancellation/reporting.

**Minimum-launch deferral**
- Do not invent liability, fee, refund or compensation outcomes for missed handover/refusal. A service without an approved outcome policy must be blocked from accepting the affected case or must use a documented owner-approved manual resolution.

### A2. Booking-to-parcel cardinality (DB-02)

**Already accepted**
- Booking and physical parcel are distinct concepts. No existing decision authorizes a universal one-to-one relationship.

**Recommendation**
- Limit initial independent bookings to one parcel each.
- Defer multi-parcel booking, parcel splitting/merging, partial parcel acceptance and parcel-level cancellation.
- Keep the conceptual boundary capable of later extension without pre-approving a schema.

**Alternative**
- Permit multiple parcels per booking at launch, but only with separately defined parcel-level quote allocation, intake acceptance, custody, exception and cancellation rules.

**Consequence**
- The recommended option reduces partial-acceptance and allocation complexity. It must be reflected in customer-facing booking limits and service acceptance criteria.

### A3. Parcel-to-route-leg cardinality (DB-03)

**Already accepted**
- A parcel may involve multiple transport movements over time.
- Route proposal, approval, assignment, dispatch, actual movement, arrival and physical custody transfer are distinct facts.
- DEC-044 requires actual handover and receiving possession before custody changes.

**Recommendation**
- Use sequential movement legs for each parcel: at most one active assigned/in-progress leg for that parcel at a time.
- A transport leg may carry multiple parcels where capacity and operating controls permit, but each parcel retains its own movement and custody evidence.
- Reassignment requires an attributable operational decision; it must not rewrite prior movement or custody history.
- Defer parcel splitting across legs and simultaneous parallel legs.

**Alternative**
- Permit concurrent or split movements at launch, requiring parcel-level allocation, capacity reservation, partial progress, reconciliation and exception handling.

**Consequence**
- The recommended option simplifies dispatch and custody accountability while preserving multi-leg transport.

### A4. Storefront order-to-fulfilment relationship (DB-04)

**Already accepted**
- DEC-037 establishes the logistics-first hierarchy. A storefront order requiring delivery enters the shared operational fulfilment system.
- Commerce order identity and logistics facts remain distinct. An order without delivery must not be treated as a shipment.

**Recommendation**
- Preserve the commerce order as the source of the purchase.
- Create or associate only the operational fulfilment obligation required for a delivery-eligible order; do not convert every order into an independent shipment booking.
- Keep delivery eligibility, fulfilment acceptance and parcel/intake facts explicit.

**Alternative**
- Create a distinct shipment obligation for every delivery-eligible order at order confirmation, even if physical intake is later. This may simplify logistics reporting but requires a firm rule for cancelled, unpaid, unfulfilled and split orders.

**Consequence**
- The recommended option preserves shared fulfilment without collapsing commerce and logistics identities.

## 3. Package B — Commercial and financial unit (DB-05, DB-06, DB-11)

### B1. Quote scope (DB-05)

**Already accepted**
- DEC-038/039 require explicit booking-party acceptance, service-specific fixed/calculated/hybrid pricing, preserved accepted quote context and no silent retroactive recalculation.
- Quote, booking, payment and intake are separate facts.

**Recommendation**
- Issue and accept one commercial quote for the independent booking obligation.
- Itemise applicable service components within that quote.
- Preserve declared/actual parcel measurements and any proposed adjustment as separate, attributable facts linked to the original accepted quote.
- Defer cross-parcel and multi-obligation allocation until the service supports it.

**Alternative**
- Quote each parcel or service component independently, then aggregate the accepted components into one booking-level agreement. This requires explicit partial acceptance and adjustment rules.

**Consequence**
- The recommended option aligns with the one-parcel launch limit and avoids complex allocation. It does not choose rates, formulas, units, rounding, taxes, fees or quote-validity durations.

### B2. Payment allocation (DB-06)

**Already accepted**
- DEC-041 distinguishes payment purpose, provider outcome, settlement, refund, credit, reversal, adjustment and reconciliation.
- Partial payment is permitted only where a service explicitly supports it.
- Verified full settlement of the amount currently due is the normal dispatch prerequisite; exceptions require approved policy and authority.

**Recommendation**
- Each payment instruction and resulting financial event applies to one booking/order obligation.
- Permit partial payment only for services whose approved configuration and operating procedure explicitly allow it.
- Keep additional payments, refunds, credits and reversals separately attributable to the original obligation and transaction lineage.
- Do not permit one payment to silently settle multiple bookings/orders.

**Alternative**
- Permit a payer to make one combined payment across multiple obligations, but only after allocation, partial failure, refund, chargeback and reconciliation rules are approved.

**Consequence**
- The recommended option avoids cross-obligation allocation and simplifies reconciliation. It does not select providers, methods, transaction limits or numeric tolerances.

### B3. Financial-event linkage (DB-11)

**Already accepted**
- Finance owns complete financial reconciliation.
- Payment attempts, provider transactions, charges, refunds, credits, reversals, adjustments, approvals and execution are distinct.
- Corrections and reconciliations must preserve original history and attributable evidence.

**Recommendation**
- Keep each financial event tied to one business obligation in the initial launch.
- Preserve links from the obligation to its payment attempts/provider transactions and from each financial resolution to the original financial event.
- Defer cross-obligation allocation and pooled balances.

**Alternative**
- Introduce explicit multi-obligation allocation with per-obligation amounts, reversals, partial refunds and reconciliation ownership.

**Consequence**
- The recommended option is consistent with B2. Finance must still approve operational reconciliation ownership, cadence, tolerances, cash handling and escalation before the affected financial capability launches.

## 4. Package C — Party and operating model (DB-07–DB-09)

### C1. Multiple roles and identity relationships (DB-07)

**Already accepted**
- DEC-023/024 and BP-01–BP-22 distinguish booking party, sender, receiver, payer, handover person, collection person, legal representative and delegate.
- One person may occupy multiple roles; role entitlements remain distinct.
- Payment or possession of a booking identifier alone grants no shipment or collection authority.

**Recommendation**
- Allow one authenticated identity to hold multiple explicit relationships to a booking/business.
- Evaluate access and permitted actions from the specific relationship, lifecycle stage, purpose and applicable evidence—not from email equality or role coincidence.
- Preserve separate relationship history where authority changes.

**Alternative**
- Restrict each identity to one role per booking. This is simpler but conflicts with ordinary cases where the booking party is also sender, receiver or payer and adds unnecessary account friction.

**Consequence**
- The recommended option follows accepted policy. Verification, consent, delegation scope, expiry and revocation mechanics remain technical/policy specification work; do not invent them.

### C2. Business representation (DB-08)

**Already accepted**
- DEC-038 permits a registered customer to arrange a business shipment when the business and relationship are identified.
- A separate enterprise account platform is not assumed for launch.

**Recommendation**
- Permit an individual registered customer to declare the business they represent and the basis of their authority for that booking.
- Treat the authority as booking/business-specific unless a separately approved delegation is established.
- Do not grant general access to all business shipments or employee accounts from a single declaration.

**Alternative**
- Restrict launch to personal bookings only and defer business-arranged shipments until representation verification is defined.

**Consequence**
- If the evidence and dispute procedure are not ready, business-arranged bookings should be disabled rather than accepted on an unverified blanket assertion.

### C3. Location and partner operating model (DB-09)

**Already accepted**
- DEC-025/043 establish a lean location model with independently configured service/action capabilities and independently authorized staff actions.
- PM-09 defers direct partner/driver login at launch.
- Deactivation blocks new work but does not abandon parcels already in custody.

**Recommendation**
- Launch with company-operated or directly managed locations whose accountable operator, staff authority and capabilities are known.
- Defer partner-operated locations unless VeriLyft retains explicit operational accountability and the required controls are documented.
- Do not grant external operators direct system access under the current launch boundary.

**Alternative**
- Include selected partner-operated locations under a documented service agreement, internal accountable owner, capability approval, evidence and exception process, without direct partner login.

**Consequence**
- The recommended option narrows location coverage but avoids implying that registration as a collection point grants custody, intake, payment or release authority.

## 5. Package D — Evidence and disclosure (DB-10, DB-12)

### D1. Evidence linkage, retention and disclosure (DB-10)

**Already accepted**
- DEC-033/PM-08 separate audit/evidence viewing, export and external disclosure.
- DEC-044 requires actual physical handover and receiving possession for completed custody transfer.
- Preserve original evidence and separately attributable corrections; a status or route event cannot substitute for physical proof.

**Recommendation**
- Define a mandatory evidence catalogue by consequential event before enabling that event in production.
- Each evidence requirement identifies purpose, source, actor/recorder, subject, time/location context, integrity expectations, reviewer entitlement and correction path.
- Treat retention schedule, legal-hold activation/release and external disclosure as explicit governed policies; do not choose durations or approval authorities by assumption.
- Where a required evidence standard or reviewer is missing, block the affected event/capability from launch.

**Alternative**
- Launch a narrower service set with a smaller approved event/evidence catalogue, then expand only as additional evidence rules are approved.

**Consequence**
- The recommended approach makes evidence readiness a launch gate rather than allowing incomplete proof standards to be filled in by implementation.

### D2. Notification recipients and information (DB-12)

**Already accepted**
- DEC-034 requires event-driven notifications whose recipients and fields follow party entitlement.
- Payers receive payment information by default, not full shipment details.
- A notification does not establish the underlying business or physical event.
- The Telegram paid-order notice remains behind the Admin “Assign For Delivery” gate.

**Recommendation**
- Produce one event-to-recipient-to-field matrix before enabling notifications.
- Send only minimum information needed for the recipient's authorized relationship and the event's purpose.
- Require verified contact details and applicable consent before sending non-essential channels.
- Keep retries, deduplication, delivery receipts and notification failures separate from the underlying business event.
- Preserve the Telegram approval gate.

**Alternative**
- Launch with a limited set of essential transactional notifications and defer optional channels and promotional messaging.

**Consequence**
- The recommended option protects party boundaries. Exact channels, timing, consent rules, retry policy, retention and failure ownership remain to be specified.

## 6. Package E — Authority and operational accountability

This package consolidates the owner-dependent remainder across staff permissions, exceptional actions, evidence review and production readiness. It does not reopen PM-01–PM-12 or DEC-043.

**Already accepted**
- Admin authentication is not universal authorization.
- Staff action permission, scope, location capability and independent approval are separate checks.
- A requester must not approve their own consequential action where separation of duties is required.
- Support is bounded and does not acquire booking, financial execution, custody or unrestricted evidence authority.
- Release is evidence-gated; P0 blockers and triggered Conditional P0 controls cannot be silently waived.

**Recommendation**
1. Complete the action/resource/scope/location-capability/approval crosswalk from accepted PM/DEC policy and the existing workflows. Do not invent role names, permission IDs or blanket Admin powers.
2. Require a named accountable operational owner and deputy for each launch-critical function: booking support, intake/custody, routing/dispatch, delivery exceptions, Finance reconciliation, evidence review, security/access administration and production incident/release control.
3. Identify which consequential actions require a second approver from risk and existing policy; do not invent numeric thresholds. Where no approved authority exists, keep the action unavailable or require a documented manual escalation.
4. Define assignment, revocation, temporary access, emergency access and queued-work handling before the affected staff capability launches.
5. Map each production control objective to evidence, owner, reviewer and release decision. Recovery/monitoring targets must be approved by the accountable operator, not guessed.

**Alternatives**
- Launch only the subset of services for which named owners, permission boundaries, evidence and operational fallback are complete.
- Delay launch until all planned services have owners and controls.

**Consequence**
- The recommended option permits a controlled, smaller launch rather than weakening authority or evidence requirements to meet a date.

## 7. Technical work that does not require another owner decision

The following work should proceed from accepted policy and source evidence:

- Reconcile DB-01–DB-12 against the decision register, domain-boundary matrix, lifecycle contracts, API/persistence contract and PR #81–#83 crosswalks.
- Complete the transition inventory with actor, precondition, authoritative fact, allowed/denied/held/unknown outcome, state and non-state effects, evidence, concurrency/replay, recovery owner and communication boundary.
- Complete action/resource/scope/location-capability/approval mapping from PM-01–PM-12 and DEC-043.
- Complete provider-neutral unknown-outcome contracts. Provider-specific lookup/idempotency claims require provider capability evidence.
- Complete domain-specific record/field entitlement and projection-lineage mapping without inventing fields or endpoints.
- Draft event/evidence/reviewer matrices and clearly isolate owner-dependent retention, legal-hold and disclosure rules.
- Convert the 80 existing P0 scenario outlines into case-level specifications. Each case requires fixtures, actors, permissions, exact action, expected state and unchanged facts, replay/failure variants, evidence, cleanup and independent reviewer.
- Refresh source claims only where a technical design claim depends on them. Preserve the source-inspection boundary and do not claim runtime/production verification.
- Reconcile README, PROGRESS, SESSION_HANDOFF, ISSUES, DECISIONS and affected cross-domain documents.

## 8. Explicitly not approved by this package

This package does not approve:
- Firestore collections, document shapes, field names, identifiers, indexes, API routes, request/response payloads, status enums or permission IDs.
- Pricing formulas, rates, distance sources, measurement units, conversions, rounding, fees, taxes, thresholds, quote validity or handover durations.
- Payment providers/methods, transaction limits, refund/credit limits, reconciliation tolerances or numeric approval thresholds.
- Evidence technology, retention durations, legal-hold periods, disclosure authorities or government-request procedures.
- Production topology, monitoring/recovery targets, backup/restore objectives, incident ownership or release exceptions.
- Any application-code, schema, Firebase rules/configuration, provider-activation, deployment or production change.

A recommendation becomes accepted policy only after explicit owner confirmation and reconciliation into the authoritative decision register and affected SDD documents.

## 9. Consolidated owner response and final gate

At the consolidated owner review, the owner may:
- accept the recommended minimum-launch baseline as a package;
- accept it with clearly identified exceptions;
- reject a recommendation and choose a stated alternative; or
- defer an item, with its affected capability explicitly excluded or blocked from launch.

No silence, elapsed time, PR merge, technical feasibility or assistant recommendation counts as policy approval.

The final SDD review must also disclose unresolved blockers, source-evidence limitations, P0 specification status, production ownership/evidence gaps and any scope excluded from launch. Implementation may begin only after the owner explicitly approves the complete reconciled SDD and lifts the implementation freeze.


## 10. Implementation direction update — DEC-045 (31 October 2026)

The owner has explicitly directed the project to begin implementation now and stop extending the planning cycle. DEC-045 supersedes the final-gate language above only insofar as it previously prohibited all application-code changes until Reviews 3–5 were complete.

The recommendations in this package remain proposals and are **not** approved business policy. Implementation may proceed using accepted decisions and verified source conventions. Any capability that depends on an unresolved recommendation or owner-dependent value remains disabled or excluded until that dependency is resolved. The instruction to begin coding does not approve a schema, pricing value, permission assignment, evidence standard, provider capability, retention period or operational target.

Use `PLATFORM_CONSOLIDATED_IMPLEMENTATION_BACKLOG.md` as the execution pointer. DEC-018/DEC-036 launch scope, P0 acceptance evidence and production release requirements remain in force.
