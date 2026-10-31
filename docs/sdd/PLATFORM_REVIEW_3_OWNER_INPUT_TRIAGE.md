# Review 3 Owner-Input Triage and Consolidation

**Status:** Review 3 preparation artifact; classification only, not an owner decision or approved data model  
**Prepared:** 31 October 2026  
**Repository baseline:** PR #79 merge commit `d9532b2173500d36057a2d2cdb4e64a30853e32f`  
**Source-inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856`  
**Related:** `PLATFORM_REVIEW_3_COMPLETENESS_AUDIT.md`, `PLATFORM_OWNER_DECISION_REGISTER.md`, `PLATFORM_DOMAIN_BOUNDARY_AND_IDENTITY_DECISION_MATRIX.md`, `PLATFORM_BOOKING_PARTY_AUTHORITY_DECISIONS.md`, `PLATFORM_STAFF_PERMISSION_DECISIONS.md`, `PLATFORM_API_PERSISTENCE_AND_INTEGRATION_BOUNDARY_CONTRACT.md`

## 1. Purpose and approval discipline

This document reduces repeated owner questions by distinguishing:

1. **Already accepted policy** — preserve and reconcile; do not ask for approval again.
2. **Owner choice still required** — present as a consolidated choice with consequences; do not silently choose.
3. **Technical specification or source verification** — resolve through read-only analysis and design traceability, not a business-policy approval.
4. **Future implementation or test evidence** — keep as a later gate; do not describe as complete during SDD design.

The owner has set a strict maximum of five back-and-forth approval exchanges before implementation. This artifact is intended to consolidate related unresolved matters into the remaining planned exchanges. It does not create additional approval rounds. The owner will provide the countdown; each owner-facing package must be complete and must not be fragmented into serial questions.

**Implementation remains frozen.** This triage does not authorize code, schema, API, Firebase rules/configuration, provider activation, or deployment.

## 2. DB-01–DB-12: what is settled and what remains

| Key | Already settled — preserve | Still genuinely unresolved | Classification / next treatment |
|---|---|---|---|
| DB-01 Booking → shipment creation | DEC-038: acceptance of a valid quote by the authenticated booking party confirms the independent booking. Booking confirmation is not intake, custody, payment, or fulfilment. | Whether a distinct shipment/consignment obligation is established at booking confirmation or only at a later operational milestone; missed handover and refused-intake consequences. | **Owner choice.** Present the lifecycle alternatives and their cancellation/reporting consequences together with DB-02. Do not equate booking confirmation with physical receipt. |
| DB-02 Booking → parcel cardinality | A booking and a physical parcel are distinct concepts; no one-to-one assumption is permitted. | Whether launch bookings may contain multiple parcels; whether split, merge, partial acceptance, or parcel-level cancellation is in launch scope. | **Owner choice.** Decide the minimum launch cardinality and explicitly defer unsupported split/merge behaviour if appropriate. Technical representation follows the choice. |
| DB-03 Parcel → route-leg cardinality | Logistics may involve multiple transport movements; route proposal, approval, assignment, dispatch, physical handover, movement and arrival remain distinct. | Whether a parcel may be assigned to multiple sequential legs, split across legs, travel with other parcels, or be independently reassigned; capacity reservation semantics. | **Owner choice plus technical design.** Confirm launch movement model and exception scope; technical design then specifies consistency and history without inventing route states. |
| DB-04 Storefront order → shipment | DEC-037: logistics-first hierarchy; a storefront order requiring delivery enters the same operational fulfilment system as an independent shipment. Commerce and logistics facts remain distinct. | Whether the launch relationship is an operational fulfilment link only or creates a distinct shipment record for each delivery-eligible order; handling of orders without delivery. | **Partly settled; narrow owner choice.** Preserve shared fulfilment. Decide only the remaining operational identity boundary; do not reopen the logistics-first policy. |
| DB-05 Quote scope | DEC-038/039: explicit booking-party acceptance confirms the booking; service-specific pricing inputs and fixed/calculated/hybrid models; accepted quote context is historically preserved. | Whether quote scope is per booking, per parcel, per service component, or a composite; allocation of adjustments across parcels/components. | **Owner choice.** Decide the commercial unit(s) for launch. Rates, formulas, units, rounding and fee treatment remain separate service-configuration inputs, not assumed defaults. |
| DB-06 Payment allocation | DEC-041: payment purpose and authoritative outcome are explicit; payment, booking and physical events are distinct; Finance owns full reconciliation; partial payment is service-eligible only; request/approval/execution are distinct. | Whether one payment may cover multiple bookings/orders; which launch services permit split/partial payments; allocation and reversal rules for combined payments. | **Owner choice.** Present a minimal launch allocation policy. Do not infer payment allocation from provider transaction shape. |
| DB-07 Party multiplicity | BP-01–BP-22 and DEC-023/024 distinguish booking party, sender, receiver, payer, handover person and collection authority. One person may occupy multiple roles, but role entitlements remain distinct. | Whether and how one identity can represent multiple businesses/bookings and the verification/consent evidence for each relationship; detailed delegation lifecycle. | **Partly settled; technical/owner detail.** Do not ask whether roles should be distinct again. Consolidate only the required representation, delegation, expiry and revocation rules. |
| DB-08 Business representation | DEC-038 permits a registered customer to arrange a business shipment when the business and relationship are identified. A separate business-account platform is not assumed at launch. | How the relationship is evidenced, who may delegate, scope and expiry of delegation, revocation, and exceptional disputes. | **Partly settled; owner input required for authority evidence.** Keep the no-separate-business-account boundary. Do not introduce an enterprise account model. |
| DB-09 Location and partner model | DEC-043: location/service/action capability is checked independently from staff action permission. PM-09 defers direct partner/driver login at launch. | Launch location ownership/operation categories, partner-operated or collection-only arrangements, capability-change authority, closure and queued-work treatment. | **Owner choice.** Confirm which operating models are actually in launch scope. Partner access must not be inferred from a location relationship. |
| DB-10 Evidence linkage | DEC-033/PM-08: audit/evidence access, export and disclosure are separately controlled; preserve originals and attributable corrections. DEC-044: custody transfer requires actual physical handover and receiving possession. | Event-specific mandatory evidence, evidence applicability to parcel/shipment/shared events, integrity verification, reviewer access, retention and legal holds. | **Mixed.** Event/evidence catalogue and reviewer map are technical/policy specification work; retention periods, legal-hold authority and disclosure procedure require owner input. |
| DB-11 Financial-event linkage | DEC-041: payment, refund, credit, reversal, adjustment, reconciliation and approval/execution are distinct; Finance owns complete reconciliation. | Whether financial events may be allocated across multiple business obligations; detailed links among attempts, provider transactions, charges, refunds, credits and adjustments; limits and tolerances. | **Mixed.** Owner confirms allocation policy and financial authority boundaries; technical design documents immutable event lineage and provider reconciliation. Numeric limits remain open configuration decisions. |
| DB-12 Notification recipients | DEC-034: event-driven notifications; recipients and fields follow party entitlement; payer receives payment information by default, not full shipment detail; delivery does not establish business state. Telegram paid-order notice remains gated by Admin “Assign For Delivery” and separate approval. | Exact event/recipient/field/channel/timing matrix, contact verification, consent, retries, deduplication, retention and failure ownership. | **Mostly specification work, with bounded owner choices.** Do not reopen recipient separation or Telegram gate. Produce one event-to-recipient matrix; ask only for unresolved business choices such as mandatory channels and consent defaults. |

## 3. Other Review 3 gaps: avoid unnecessary owner rounds

| Area | Accepted baseline | Work that can proceed without another policy approval | Owner input still required |
|---|---|---|---|
| Staff permissions and location capability | PM-01–PM-12; DEC-043; action permission and location capability are independent; no authority from Admin label alone; requester cannot approve own consequential action. | Build a traceable action/resource/scope/capability crosswalk from existing requirements and workflows; mark unsupported or ambiguous actions. Do not invent role names or permissions. | Confirm only unresolved business authorities, staff lifecycle ownership, emergency-access boundaries and second-person approval cases/thresholds. |
| Lifecycle transitions | DEC-038–044 and shared workflow principles. Payment, intake, custody, dispatch, movement, delivery and notification do not imply one another. | Complete transition inventory using actor, precondition, authoritative fact, effect, evidence, denial, hold, correction and recovery owner columns. Leave unknown status vocabulary open. | Decide unresolved service-specific outcomes, liability/compensation and exceptional authority where the existing decisions do not settle them. |
| Provider unknown outcomes | External provider effects are not atomic with local persistence; unknown outcomes require reconciliation. | Specify provider-neutral decision points: query before retry where possible, distinguish confirmed/failed/unknown, preserve idempotency and evidence obligations. | Provider-specific retrieval semantics, supported idempotency, reconciliation ownership and closure evidence require provider capability verification and named operational ownership. Do not invent retry intervals. |
| API/query and projections | Authoritative domain ownership, least privilege, record/field entitlement and freshness are required. | Build conceptual resource/field entitlement and projection-lineage matrices from accepted actor policies; do not invent endpoints or payloads. | Owner confirms any genuinely disputed disclosure/business visibility policy. |
| Audit/evidence | DEC-033 and PM-08 accepted; original evidence retained distinctly from corrections; view/export/disclosure separate. | Draft event catalogue, evidence purpose/source/actor/receiver/recorder map, integrity and correction requirements. | Retention periods, legal-hold activation/release authority, disclosure approval and government-request procedure. |
| Production readiness | DEC-036 evidence-gated release; P0 blockers remain blockers; no unsupported numeric targets. | Map each control objective to an evidence artifact and release gate; identify missing named owners. | Named accountable owners/deputies, environment topology, approved recovery/monitoring targets, incident and release authority. |
| P0 acceptance evidence | Existing 80 scenario rows and 51 P0/Conditional P0 Admin requirements are mapped at catalogue/readiness level. | Convert scenarios into executable case specifications with fixtures, actors, permissions, exact action, expected state/non-state changes, replay/failure variants, evidence and cleanup. | Owner accepts the completed P0 baseline at the later consolidated SDD review; execution evidence follows implementation and is not a Review 3 design claim. |
| Existing application source | Source claims are bounded to `e0f69055d33dd9399c23e1d793f359468229c856`; PR #79 did not refresh source inspection. | Refresh read-only inspection only where a design claim depends on it; preserve source-present/partial/absent/not-inspected/not-verified distinctions. | No owner preference can substitute for source or runtime evidence. |

## 4. Consolidated owner-input package design

Do not send twelve separate DB questions or a sequence of small approval prompts. Prepare one coherent owner-facing package grouped by business decision dependencies:

1. **Booking and physical service unit:** DB-01–DB-03, with DB-04 where storefront delivery identity is affected.
2. **Commercial and financial unit:** DB-05–DB-06 and the owner-dependent portion of DB-11.
3. **Party and operating model:** DB-07–DB-09 plus unresolved delegation, location and partner scope.
4. **Evidence and disclosure:** DB-10, DB-12 and the owner-dependent DEC-033/DEC-034 details.
5. **Authority and operational accountability:** unresolved staff approvals, exception ownership, production accountability and release responsibilities.

Each package must state: (a) what is already accepted and therefore not being reopened; (b) the exact unresolved decision; (c) a recommended minimum-launch option where evidence supports one; (d) realistic alternatives; (e) operational, security, financial and technical consequences; (f) what is explicitly deferred; and (g) which technical documents will be updated after the choice.

Recommendations are not decisions. The owner must explicitly accept, reject or defer a recommendation. A deferral must include the resulting launch exclusion or blocker; silence is not approval.

## 5. Review 3 work that does not consume owner approval exchanges

Before presenting the consolidated Review 3 package, complete these internally:

- Reconcile the DB-01–DB-12 table against the authoritative decision register, domain-boundary matrix, lifecycle contracts and API/persistence contract.
- Build the action/resource/scope/location-capability/approval crosswalk against PM-01–PM-12 and DEC-043.
- Complete the launch transition inventory, including denied transitions, holds, corrections and recovery responsibility.
- Produce provider-neutral unknown-outcome and per-domain reconciliation ownership contracts; verify provider capabilities only where source/documentation evidence is available.
- Produce per-domain record/field entitlement and projection-lineage crosswalks.
- Draft the event/evidence/reviewer matrix and isolate the owner-dependent retention/disclosure choices.
- Convert existing P0 scenario outlines into case-level specifications without changing accepted priorities or claiming execution.
- Refresh source claims only where necessary; keep runtime and production verification explicitly outstanding.
- Perform a final continuity scan across README, PROGRESS, SESSION_HANDOFF, ISSUES, DECISIONS and all affected matrices.

## 6. Approval and implementation gate

This document is a triage and consolidation aid. It does not constitute Review 3 approval, Review 4 approval, final SDD approval, or implementation authorization.

The five-exchange limit is a maximum, not a requirement to use every exchange for questions. Reuse already accepted decisions, resolve technical details internally, and consolidate all genuinely owner-dependent choices. The fifth and final exchange must be reserved for explicit approval of the complete reconciled SDD and authorization to begin implementation. Until then, no application-code, schema, API, Firebase-rule/configuration, provider-activation or deployment work is authorized.
