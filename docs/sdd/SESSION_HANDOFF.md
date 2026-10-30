# New-session handoff prompt

Continue **VeriLyft — Beyond Borders** in `dev-adeshina/small-pudo`.

## Verified repository state

- Latest verified `main`: `6e643827fc8ef91d0e63493703198808363a90ed` — PR #44 merged.
- PR #43 corrected post-PR #42 continuity metadata; it was documentation-only.
- The PR #42 readiness assessment remains accepted as a readiness/navigation baseline only; it does not approve executable tests, test execution, implementation, or release.
- Active application-source traceability baseline: `e0f69055d33dd9399c23e1d793f359468229c856` (refreshed in PR #32). PRs #40–#44 changed SDD documentation only; they do not establish runtime behaviour.
- Application-code changes remain prohibited until the complete platform-wide SDD is reconciled and explicitly approved.

## Accepted policy and product hierarchy

- D-01–D-15 high-level owner outcomes are accepted under DEC-022–DEC-036. DEC-037 records the logistics-first product hierarchy. DEC-038 records the owner-approved independent shipment booking confirmation, information, lifecycle, handover-deadline, and responsibility policy. DEC-039 records the owner-approved pricing input/calculation boundaries.
- DEC-018 already records the accepted lean launch scope: independent shipment booking; advance booking and staff-created walk-in intake; lean PUDO location management; shared hybrid delivery pricing; advance online payment and payment at intake; Operations-reviewed route proposals and route-leg assignments; flexible proof of delivery; and controlled failed-delivery resolution.
- DEC-037 is now owner-accepted: VeriLyft is fundamentally a logistics and shipment-management platform. Independent shipment booking is the primary customer entry point. Storefront commerce is an attached, secondary service.
- Storefront orders and independent shipments remain distinct business concepts and order sources. Storefront orders requiring delivery enter the same operational fulfilment system used by independent shipments; do not create separate competing fulfilment processes or assume a particular schema.
- DEC-018 exclusions remain: advanced route optimization, full fleet management, separate Driver Portal/application, enterprise workflow engine, and advanced analytics are deferred unless explicitly changed.
- PM-01–PM-12 staff permission policies are accepted; technical permission design remains open.
- Stage 5.2 booking-party authority BP-01–BP-22 is accepted and consolidated in merged PR #36.
- Stage 5.3 pricing/measurement/quote/adjustment/financial-outcome policy areas are accepted and consolidated in merged PR #37. Detailed formulas/rates, inputs, units/conversion, rounding/effective dates, taxes/fees/discounts, discrepancy thresholds, approval limits, and adjustment-rejection service resolution remain open.
- Milestone 1 independent shipment booking policy is owner-approved as DEC-038: valid quote acceptance by the authenticated booking party confirms the booking; service-specific booking information and business-arranged bookings are supported; payment, intake/custody, and fulfilment remain separate; each service communicates a separate handover deadline; missed handover may close as unfulfilled with financial history preserved; customer/Support/Operations/Admin responsibilities are bounded. Its documentation-only consolidation was merged in PR #45.

## Current stage — Milestone 2 Part 1 approved; pricing/payment SDD reconciliation continues

Stage 5.4 is complete: all A-01–A-20 scenario-design refinements were owner-approved and consolidated in PR #39. This is not approval of executable test specifications, test execution, implementation, or release.

Stage 5.5:
1. PR #40 corrected continuity records, duplicate issue identifiers, and stale approval/status statements; first-pass DEC-022–DEC-036 policy alignment was recorded.
2. PR #41 consolidated the A-01–A-20 and ADM-R01–ADM-R54 dependency/traceability register as a navigation baseline.
3. PR #42 assessed all 45 P0 and 6 Conditional P0 requirements, the 80 scenario outlines, source-backed candidates, missing capabilities, policy/contract blockers, and conditional activation gates. This is a readiness/navigation baseline only; no requirement is approved for execution.
4. PR #43 reconciled the post-PR #42 continuity metadata.
5. DEC-037 records the owner's logistics-first product hierarchy and shared fulfilment principle.
6. DEC-038 records the owner-approved independent shipment booking confirmation, information, lifecycle, handover-deadline, and responsibility policy; it was merged in PR #45.
7. DEC-039 records the owner-approved pricing input/calculation boundaries: service-specific models and configured inputs, server-authoritative calculation, transparent applicable charges, preserved quote history, and no invented rates/formulas. Its documentation-only consolidation is pending review/merge.

The readiness assessment's source findings remain valid: independent shipment booking, pricing, custody, routing and related operational capabilities are absent or materially incomplete in the inspected source baseline. That is an implementation gap against the accepted launch scope, not a reason to classify these core capabilities as deferred.

## Next work

- Review and merge the Milestone 2 Part 1 documentation-only PR after inspecting its full diff.
- Continue Milestone 2 Part 2 — measurement-based adjustments, customer consent/rejection outcomes, payment-at-intake and advance-payment verification, partial/late payment, refunds/credits/reversals, and reconciliation. Preserve DEC-026–DEC-029 and DEC-039; do not invent values.
- Then proceed through physical intake/measurement/custody, location capability, routing/dispatch/movement, delivery proof/failed-delivery resolution, audit/evidence, notifications/privacy, and production operations.
- Continue reconciling DEC-018, DEC-037, and DEC-038 through requirement priorities, acceptance scenarios, source traceability, and launch-readiness evidence.
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
