# New-session handoff prompt

Continue **VeriLyft — Beyond Borders** in `dev-adeshina/small-pudo`.

## Verified repository state

- Latest verified `main` before the current proposal: PR #50 / DEC-043 merged on 30 October 2026 at `06d485f351246b5304227d79d5e03eeed0c1b9c1`. The current documentation-only proposal records owner-approved DEC-044 on branch `docs/dec-044-custody-exceptions` and is pending owner review.
- PR #43 corrected post-PR #42 continuity metadata; it was documentation-only.
- The PR #42 readiness assessment remains accepted as a readiness/navigation baseline only; it does not approve executable tests, test execution, implementation, or release.
- Active application-source traceability baseline: `e0f69055d33dd9399c23e1d793f359468229c856` (refreshed in PR #32). PRs #40–#44 changed SDD documentation only; they do not establish runtime behaviour.
- Application-code changes remain prohibited until the complete platform-wide SDD is reconciled and explicitly approved.

## Accepted policy and product hierarchy

- D-01–D-15 high-level owner outcomes are accepted under DEC-022–DEC-036. DEC-037 records the logistics-first product hierarchy. DEC-038 records the owner-approved independent shipment booking policy. DEC-039 records pricing input/calculation boundaries. DEC-040 records measurement-adjustment and service-resolution boundaries (PR #47 merged). DEC-041 records payment and financial-settlement boundaries (current proposal).
- DEC-018 already records the accepted lean launch scope: independent shipment booking; advance booking and staff-created walk-in intake; lean PUDO location management; shared hybrid delivery pricing; advance online payment and payment at intake; Operations-reviewed route proposals and route-leg assignments; flexible proof of delivery; and controlled failed-delivery resolution.
- DEC-037 is now owner-accepted: VeriLyft is fundamentally a logistics and shipment-management platform. Independent shipment booking is the primary customer entry point. Storefront commerce is an attached, secondary service.
- Storefront orders and independent shipments remain distinct business concepts and order sources. Storefront orders requiring delivery enter the same operational fulfilment system used by independent shipments; do not create separate competing fulfilment processes or assume a particular schema.
- DEC-018 exclusions remain: advanced route optimization, full fleet management, separate Driver Portal/application, enterprise workflow engine, and advanced analytics are deferred unless explicitly changed.
- PM-01–PM-12 staff permission policies are accepted; technical permission design remains open.
- Stage 5.2 booking-party authority BP-01–BP-22 is accepted and consolidated in merged PR #36.
- Stage 5.3 pricing/measurement/quote/adjustment/financial-outcome policy areas are accepted and consolidated in merged PR #37, with subsequent refinements DEC-039–DEC-041. Detailed formulas/rates, units/conversion, rounding/effective dates, taxes/fees/discounts, discrepancy thresholds, authority limits, service-resolution eligibility, payment/refund limits, and reconciliation procedures remain open.
- Milestone 1 independent shipment booking policy is owner-approved as DEC-038: valid quote acceptance by the authenticated booking party confirms the booking; service-specific booking information and business-arranged bookings are supported; payment, intake/custody, and fulfilment remain separate; each service communicates a separate handover deadline; missed handover may close as unfulfilled with financial history preserved; customer/Support/Operations/Admin responsibilities are bounded. Its documentation-only consolidation was merged in PR #45.

## Historical stage record — Milestone 2 Part 1 and Part 2; superseded by later merged decisions

Stage 5.4 is complete: all A-01–A-20 scenario-design refinements were owner-approved and consolidated in PR #39. This is not approval of executable test specifications, test execution, implementation, or release.

Stage 5.5:
1. PR #40 corrected continuity records, duplicate issue identifiers, and stale approval/status statements; first-pass DEC-022–DEC-036 policy alignment was recorded.
2. PR #41 consolidated the A-01–A-20 and ADM-R01–ADM-R54 dependency/traceability register as a navigation baseline.
3. PR #42 assessed all 45 P0 and 6 Conditional P0 requirements, the 80 scenario outlines, source-backed candidates, missing capabilities, policy/contract blockers, and conditional activation gates. This is a readiness/navigation baseline only; no requirement is approved for execution.
4. PR #43 reconciled the post-PR #42 continuity metadata.
5. DEC-037 records the owner's logistics-first product hierarchy and shared fulfilment principle.
6. DEC-038 records the owner-approved independent shipment booking confirmation, information, lifecycle, handover-deadline, and responsibility policy; it was merged in PR #45.
7. DEC-039 records the owner-approved pricing input/calculation boundaries and was merged in PR #46.
8. DEC-040 records measurement-adjustment and customer-resolution policy and was merged in PR #47.
9. DEC-041 records payment completion, partial settlement, refund/credit, reconciliation, and dispatch boundaries; its documentation-only consolidation is pending review in the current PR.

The readiness assessment's source findings remain valid: independent shipment booking, pricing, custody, routing and related operational capabilities are absent or materially incomplete in the inspected source baseline. That is an implementation gap against the accepted launch scope, not a reason to classify these core capabilities as deferred.

## Next work

- Review and merge the Milestone 2 Part 3 documentation-only PR after inspecting its full diff.
- Keep the DEC-041 unresolved financial details open; do not invent service/location limits, refund authority/timelines, credit rules, reconciliation cadence, or exception eligibility.
- Continue physical operations, logistics execution, exceptions/accountability, and platform-readiness SDD reconciliation.
- Then proceed through physical intake/measurement/custody, location capability, routing/dispatch/movement, delivery proof/failed-delivery resolution, audit/evidence, notifications/privacy, and production operations.
- Continue reconciling DEC-018 and DEC-037–DEC-041 through requirement priorities, acceptance scenarios, source traceability, and launch-readiness evidence.
- Preserve storefront catalogue, cart, checkout, customer account and payment requirements as the attached commerce service. Its existing source-backed slices may be specified and regression-tested, but must not displace the core logistics workflow.
- Keep source facts, designed requirements, implemented behaviour, runtime evidence, and production-readiness evidence distinct. Do not invent unresolved thresholds, formulas, permission limits, proof methods, retention periods, or retry/time-out values.
- Preserve the active source baseline at `e0f69055` unless a source-changing commit is inspected.
- Obtain explicit owner approval of the complete platform-wide SDD before implementation.

## Working rules

- Preserve the existing Next.js App Router, TypeScript, Firebase Auth/Firestore/Firebase Admin, Paystack, Cloudinary, and current component/service/type/style patterns.
- Do not invent parallel architecture, collections, fields, routes, services, status enums, roles, or permissions.
- Keep accepted policy, source facts, test evidence, and production-readiness evidence distinct.
- Keep changes focused and documentation-only while the SDD is incomplete. Use branches and PRs; the owner reviews and merges every PR.
- Never claim tests were run unless they actually were.
- Do not restart the completed D-01–D-15, PM-01–PM-12, Stage 5.2, Stage 5.3, or Milestone 1 decision sequences.


## Milestone 2 Part 2 owner approval — DEC-040

The owner approved the measurement-adjustment and customer-resolution direction on 30 October 2026. DEC-040 was consolidated and merged in PR #47 (merge commit `df6341953f459456b13e2efbf274ad581b2e765f`). Core boundaries: service-configured materiality review; original quote/agreement preserved; explicit customer acceptance (silence is not acceptance); acceptance is not settlement; disputed additional charge held pending review; rejection triggers an authorized service-resolution decision and is not automatic cancellation/refund/credit/charge; continuation under original terms requires safe and commercially feasible fulfilment; alternative service requires separately accepted pricing; cancellation follows its applicable policy; and dispatch cannot proceed under a rejected revised price.

Next: Part 2 is complete. Part 3 payment/settlement policy is recorded as DEC-041 and is pending review in the current documentation-only PR. Keep exact thresholds, units/conversion, evidence, approval limits/separation of duties, service-resolution eligibility, customer response periods, and runtime acceptance tests open. Preserve the complete platform-wide SDD approval gate; no application code is authorized.


## Milestone 2 Part 3 owner approval — DEC-041

The owner approved the payment and financial-settlement refinement on 30 October 2026. DEC-041 is being consolidated in a documentation-only PR. Preserve both advance online payment and payment at intake subject to service/location configuration; quote acceptance is booking confirmation, not payment; electronic settlement requires authoritative confirmation; cash requires attributable receipt/equivalent evidence and reconciliation; partial payment is permitted only where a service explicitly allows it and does not by itself satisfy the normal dispatch gate; underpayment/overpayment require authorized resolution; pending/failed/retry/late-success outcomes remain distinct; refund request/approval/initiation/execution are distinct; partial refunds, credits, reversals and chargebacks preserve traceable history; reconciliation mismatches are investigated; and verified full settlement of the amount currently due remains the default dispatch prerequisite. DEC-030 exceptions do not change payment status or bypass unrelated holds.

Next: review and merge the Part 3 documentation-only PR. Keep service/location payment configuration, partial-payment eligibility, methods/limits/evidence, refund authority/timelines, cancellation fees, credit expiry/use/transfer, late-payment disposition, reconciliation cadence/ownership/tolerances, chargeback handling, and dispatch-exception eligibility/limits/evidence unresolved pending further specification. Continue platform-wide SDD reconciliation and obtain explicit owner approval of the complete SDD before implementation. No application-code change is authorized.

## Milestone 3 Part 1 owner approval — DEC-042

The owner approved the high-level physical intake and custody approach on 30 October 2026. DEC-042 is consolidated in the Milestone 3 Part 1 documentation-only PR.

Preserve the distinction between advance-booked intake and staff-created walk-in intake; require an active location with explicit capability and an authorized actor for consequential actions; distinguish refusal before custody, accepted custody, and physical receipt retained under a hold; record custody whenever physical possession exists; keep booking, accepted terms, custody, payment, dispatch, and delivery separate; apply service-specific inspection and evidence requirements; preserve declared and actual measurements separately; attribute custody and transfers to the relevant parcel, actors, location, time, outcome and evidence/reason; identify external event sources; ensure inactive locations cannot accept new work while parcels already held remain accounted for; and treat each physical handover as a distinct event.

Next: review and merge the Milestone 3 Part 1 documentation-only PR. Keep service-specific inspection/prohibited-item checklists, measurement/conversion, identity/acknowledgement/receipt methods, evidence/retention, staff/partner authority and second-person controls, capability assignment, hold ownership/review/maximum duration, transfer proof/correction, exception resolution, liability/compensation/insurance, technical contracts, and executable acceptance tests open. Continue platform-wide SDD reconciliation and preserve the explicit owner-approval gate before application-code changes.

No application-code change is authorized.

## Milestone 3 Part 2 owner approval — DEC-043

The owner approved the PUDO location capability and operational-authority approach on 30 October 2026. DEC-043 is consolidated in the Milestone 3 Part 2 documentation-only PR.

Preserve explicit service-and-action configuration at each location; keep outgoing intake, walk-in intake creation, measurement, custody acceptance, payment collection/recording, parcel collection/release, and custody handover distinct; and require both an active supported location capability and independently assigned actor authority. Designated Admin users may configure capabilities only within assigned authority; location editing, activation/deactivation, capability administration, and staff permission assignment remain distinct responsibilities. Capability changes must be attributable and auditable. Revocation/unavailability blocks new work but does not erase or abandon parcels already in custody or silently transfer responsibility. External partners, collection-centre operators, carriers, and drivers retain the no-direct-login launch boundary. Automated operating hours, capacity calculations, and availability scheduling remain outside the lean initial location model.

Next: review and merge the Milestone 3 Part 2 documentation-only PR. Keep the service/location/action matrix, exact capability catalogue, Admin authority granularity, staff permission scopes, partner arrangements, queued-work handling, temporary closure procedure, audit retention, technical contracts, and executable acceptance tests open. After merge, proceed to Milestone 3 Part 3 — custody transfers and physical exceptions. Continue platform-wide SDD reconciliation and preserve the explicit owner-approval gate before application-code changes.

No application-code change is authorized.



## Milestone 3 Part 3 owner approval — DEC-044

The owner approved the high-level custody-transfer and physical-exception approach on 30 October 2026. DEC-044 is consolidated in the Milestone 3 Part 3 documentation-only proposal.

Preserve the central invariant: recorded custody reflects established physical possession. A route assignment, dispatch authorization/record, arrival, or attempted handover does not automatically transfer custody. Every physical handover is distinct; completion requires actual handover and receiving-party possession. Record applicable source/previous custodian, intended recipient/destination, actual receiver, physical handover actor, recording staff member if different, time/location, outcome, evidence/source, and reason. Preserve prior custody history.

Failed, disputed, and incompletely documented handovers remain distinct from completed transfers. Preserve last confirmed custody and competing reports. If possession changed but documentation is incomplete, investigate rather than invent confirmation. Missing parcels require a controlled investigation preserving discovery context, last confirmed custody/location, movement history, and available evidence. Damaged parcels require attributable discovery/condition evidence and surrounding custody history; last custodian alone does not prove fault. Incorrect location assignments preserve the original assignment; administrative correction is not physical transfer. Prolonged holds retain identifiable custody, reason, and accountable ownership. Corrections preserve original events/evidence, and unresolved exceptions are not silently closed. No automatic liability, refund, credit, compensation, insurance, or customer outcome is implied.

**Still unresolved:** Service-specific handover proof methods; who may confirm/dispute/correct transfers; second-approver rules; missing-parcel investigation ownership; damage assessment/liability procedures; hold ownership/review/maximum periods; evidence retention; compensation/insurance/refund/credit/customer entitlements; exact lifecycle/status vocabulary; technical data/API/security contracts; and executable acceptance tests.

**Next:** Review and merge the Milestone 3 Part 3 documentation-only PR. After merge, Milestone 3 Parts 1–3 are complete at the owner-approved policy level. Continue platform-wide SDD reconciliation, read-only source traceability, acceptance-test specification, and production-readiness evidence planning. Obtain explicit owner approval of the complete platform-wide SDD before any application-code changes. No application-code change is authorized.
