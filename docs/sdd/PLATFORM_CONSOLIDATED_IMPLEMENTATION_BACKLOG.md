# Consolidated Implementation Backlog

**Status:** Execution plan derived from accepted policy and existing source findings. This is not a new business-policy approval.

## Purpose

Use this as the single implementation pointer. Preserve accepted decisions. Do not invent pricing, service deadlines, measurement thresholds, permission assignments, evidence methods, retention periods, provider capabilities, schema, fields, endpoints, status enums, or production targets. If an enabled capability depends on an unresolved rule, keep that capability disabled until the rule is approved.

The owner's explicit instruction to proceed supersedes the previous blanket implementation freeze. It does not approve unresolved business-policy proposals or remove P0 release evidence requirements.

## Implementation order

### M0 — Baseline and regression safety
- Enforce current administrator authorization using both the Firebase admin custom claim and a server-managed `adminAccess/{uid}` active marker; clients cannot read or write these records.
- Run `npm run admin:reconcile` once after deploying this control and after every `ADMIN_EMAILS` change to reconcile Firebase administrator claims, active markers and refresh-token revocation. An empty allowlist requires the explicit `--confirm-empty-admin-list` argument.
- Confirm branch, commit and clean working tree.
- Run existing TypeScript, build and available tests; record baseline failures.
- Recheck customer/Admin session separation and server-side authorization.
- Recheck storefront order, stock reservation/cancellation, Paystack verification/webhook replay guards and Firestore rules.
- Recheck Cloudinary upload authorization only where test credentials are available.
- Inspect current source before changing any path; the historical source-inspection commit is not proof of current runtime behaviour.

### M1 — Independent shipment booking preparation and shipper portal foundation
**Policy:** DEC-037, DEC-038, DEC-043; BP-01–BP-22.
- Registered, authenticated customers only may create independent shipment bookings at launch.
- The existing customer account and `/account/shipments` draft feature are the foundation only; they are not a completed shipper portal.
- **M1.1 — Draft foundation hardening:** make draft authentication consistent, protect updates against concurrent status changes, improve UI failure/retry handling, add draft-specific automated tests and refresh source traceability. Reuse current patterns; no new business fields or lifecycle states.
- **M1.2 — Shipper journey and portal experience definition:** map the customer-facing journey, surfaces, party-specific visibility, action boundaries and acceptance scenarios against BP-01–BP-22. Do this now; explicitly mark capabilities whose backend policy/dependencies remain gated.
- **M1.3 — Portal foundation delivery:** evolve the existing account and draft surfaces into a coherent customer shipment workspace for enabled capabilities. Do not create separate sender/receiver portals or assume they are required; that product decision remains open.
- Capture only DEC-038 booking concepts: booking party, origin, destination, eligible service, parcel description and service-required declared information.
- Keep booking party, sender, receiver/collection recipient, payer and physical handover person distinct; enforce ownership, authorization and party entitlements server-side.
- Abandoned drafts create no confirmed booking, payment or custody event.
- The target shipper journey includes draft preparation, eligible-service selection, quotation review, explicit quote acceptance, booking confirmation, payment, authoritative shipment visibility, permitted changes/collection/disputes and role-aware communications as the relevant capabilities are approved and delivered.
- Quote issuance and booking confirmation remain gated until the service has approved pricing inputs/formula, charge components, currency, rounding, rule version, quote validity and handover deadline. The authenticated booking party must explicitly accept a valid quote.
- See `PLATFORM_SHIPPER_PORTAL_PRODUCT_SCOPE.md` for the customer journey, present-versus-target boundary, delivery dependencies and acceptance boundary.

### M2 — Service pricing and quotation
**Policy:** DEC-038–DEC-040.
- Implement only service specifications with approved rates, inputs, units, conversions, calculations and rounding.
- Calculate/validate prices on the trusted server.
- Preserve quote input/charge/rule-version snapshots; repricing creates a new revision.
- Preserve declared measurements, actual measurements, adjustment proposals, customer decisions and financial settlement as separate facts.
- No placeholder rates or assumed defaults.

### M3 — Payment and financial events
**Policy:** DEC-028, DEC-029, DEC-041.
- Reuse Paystack only for currently supported and revalidated paths.
- Separate payment attempts, confirmed payments, refunds, credits, reversals, chargebacks and reconciliation.
- Use authoritative provider/bank evidence; protect against duplicate/replayed events and reconcile late success.
- Enforce verified full settlement as the normal dispatch gate. Partial payment only where explicitly permitted for the service.
- Do not add refund, cash or reconciliation automation without approved methods, limits, authority and evidence rules.

### M4 — Locations and physical intake
**Policy:** DEC-025, DEC-042, DEC-043.
- Apply independent location service/action capabilities and actor permissions; both checks are required.
- Keep booking intake and staff-created walk-in intake distinct.
- Record actual physical possession accurately, including custody under hold.
- Distinguish refusal before custody, physical receipt under hold and accepted intake.
- Deactivation blocks new work but does not abandon existing custody.
- External operators remain without direct platform login at launch.

### M5 — Custody, movement, routing, dispatch and delivery
**Policy:** DEC-030–DEC-032, DEC-037, DEC-041–DEC-044.
- Keep route proposal, approval, assignment, dispatch, movement, arrival, handover and custody transfer distinct.
- Change custody only when physical handover occurred and the receiver took possession, supported by applicable evidence.
- Preserve last confirmed custody, failed/disputed handovers, original evidence and attributable corrections.
- Keep missing/damaged investigations separate from liability and financial outcomes.
- Advanced route optimization, full fleet management and Driver Portal remain deferred under DEC-018.

### M6 — Staff authority, exceptions, audit and evidence
**Policy:** DEC-022, DEC-030–DEC-033, DEC-042–DEC-044; PM-01–PM-12.
- Translate accepted staff action, scope, location capability, approval and separation-of-duties policy into server checks.
- Keep Support, Admin, Operations and Finance responsibilities separate.
- Record consequential changes with actor, action, subject, time, reason and applicable evidence.
- Separate audit/evidence viewing, export and external disclosure.
- Do not invent permission IDs, retention periods, legal-hold authority, disclosure roles or second-approval thresholds.

### M7 — Communications and operational visibility
**Policy:** DEC-032–DEC-034, DEC-037, DEC-044.
- Keep existing guest tracking email within its supported purpose until broader recipient/field rules exist.
- Notify only from authoritative events and within party entitlements.
- Payers receive payment information by default, not unrestricted shipment details.
- Preserve Telegram's Admin assignment gate.
- Replace demo dashboard metrics only after metric definitions and authoritative data sources are established.

### M8 — Production and release evidence
**Policy:** DEC-036 and production-readiness contract.
- Verify deployed rules/configuration, secrets, provider settings and environment separation.
- Demonstrate backup/restore, monitoring, incident response, continuity and rollback.
- Record accountable owners/deputies and approved recovery/monitoring objectives.
- Execute approved P0 cases in a production-like environment; unresolved P0 and triggered Conditional P0 controls block release.

## Work that requires no new business decision

- Refresh source traceability against current code before changing each area.
- Map requirements to existing routes, components, services and types; distinguish reuse from missing capability.
- Complete transition tables from accepted lifecycle policies without inventing persisted enums.
- Translate PM-01–PM-12 and DEC-043 into traceable action/resource/scope/location/approval checks; keep unapproved assignments unavailable.
- Complete provider-neutral idempotency and unknown-outcome contracts; make no provider-specific claims without evidence.
- Complete entitlement/projection lineage for known facts without inventing fields or endpoints.
- Draft case-level tests for source-backed slices while retaining A-01–A-20, ADM-R01–ADM-R54 and the existing 80 case IDs/priorities.
- Each test must specify preconditions, actor, permission, action, expected changed/unchanged facts, replay/failure variant, evidence, cleanup and reviewer.
- Reconcile README, progress, handoff and issue references; remove stale freeze wording superseded by the owner's implementation instruction.

## Capability gates and deferrals

A capability remains unavailable where it depends on an unapproved price/rate, quote validity, handover deadline, mandatory evidence, actor/location authority, payment method, custody proof, disclosure entitlement or operational resolution rule. Do not use arbitrary defaults or imply that a UI/data-entry path makes a capability launch-ready.

Keep already deferred scope out of launch: advanced route optimization, full fleet management, Driver Portal, advanced analytics, elaborate location scheduling/capacity, unsupported partner login and unapproved automation.

## Acceptance and definition of done

Link every code/test change to existing requirement and case IDs. Record actual commit, command, date, environment, result and limitations. Keep designed, implemented, tested, production-verified and launch-accepted as distinct states. The existing 0/51 P0/Conditional P0 Admin formal-execution readiness finding remains until case-level specifications and required policies/evidence are complete; it does not invalidate previously reported narrower storefront tests.

**Next implementation target:** review and merge the M1.1 draft-hardening PR, complete the M1.2 shipper-journey definition, then deliver the portal foundation in M1.3. Remaining M0 baseline/regression evidence stays open and must be addressed or explicitly dispositioned; quote issuance and booking confirmation remain gated by approved service pricing and handover details.