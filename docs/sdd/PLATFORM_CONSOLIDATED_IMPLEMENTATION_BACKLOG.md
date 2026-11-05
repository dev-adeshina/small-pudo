# Consolidated Implementation Backlog

**Status:** Execution plan derived from accepted policy and existing source findings. This is not a new business-policy approval.

## Purpose

Use this as the single implementation pointer. Preserve accepted decisions. Do not invent pricing, service deadlines, measurement thresholds, permission assignments, evidence methods, retention periods, provider capabilities, schema, fields, endpoints, status enums, or production targets. If an enabled capability depends on an unresolved rule, keep that capability disabled until the rule is approved.

The owner's explicit instruction to proceed supersedes the previous blanket implementation freeze. It does not approve unresolved business-policy proposals or remove P0 release evidence requirements.

## Current position — PR #137 merged; post-merge execution — 5 November 2026

**Current baseline:** main at 55dff8c2a4f4cf6f0e983676e692f0f126f7ec27 (PR #137). PR #136 delivered staff invitations, staff directory and permission administration; PR #137 moved activation into the signed-in staff workspace. See CURRENT_IMPLEMENTATION_STATUS.md for the consolidated status and evidence ledger.

**Verification:** the owner reported 100/100 Firestore Emulator-backed tests across 14 suites, plus successful TypeScript, lint, production build and git diff --check. Browser verification remains outstanding. The initial designated Staff Permission Administrator provisioning CLI has not successfully run; do not treat the policy appointment as technical provisioning.

**Immediate next work:** controlled browser verification of staff onboarding, directory visibility, permission lifecycle and the separated operational-cost workflow. Then review DB-01–DB-12 and capability gates to select one bounded Ready implementation slice. The older PR #133/#134 checkpoint and the historical cost-configuration-discovery-next instructions below are superseded: operational-cost persistence/API/workflow and the staff interface have since been implemented.

**Still gated:** customer pricing/quotation and quote acceptance; all twelve DEC-047 service/endpoint combinations; PUDO inventory and accountable Operations ownership; confirmed shipment booking/payment; parcel intake/custody; route/dispatch/delivery; and DEC-036 P0/Conditional P0 release evidence.

## Historical checkpoint — PR #133 and PR #134 merged (3 November 2026; superseded by the PR #137 checkpoint above)

**Completed:** PR #133 merged the staff interface at `/admin/operational-cost-definitions` over the existing list/create/read/revise/workflow APIs. It reuses the existing Firestore stores, immutable versions, action permissions, default-deny Rules and transaction semantics. No new persistence model, API or permission catalogue was introduced.

**PR #133 verification:** user-reported local checks passed: Firestore Emulator suite 86/86, TypeScript, lint, production build and `git diff --check`. Browser verification with accounts carrying the relevant operational-cost action permissions remains outstanding. A generic Admin without those assignments is correctly denied; Admin status alone grants no operational-cost action permission.

**PR #134:** records the initial Designated Staff Permission Administrator appointment under PM-01. The appointment permits staff action-permission administration under policy but grants no operational-cost, Finance, custody, shipment, pricing, audit-review or other action permissions. Firebase technical provisioning is not activated; its trusted mechanism, audit evidence and successor/suspension/recovery lifecycle remain open.

**Next:** after this focused SDD reconciliation is merged, review DB-01–DB-12 contracts and the existing capability gates to select the highest-priority genuinely buildable implementation slice. Do not restart platform-wide reconciliation or reopen accepted decisions without new evidence or a concrete conflict.

**Hard boundaries retained:** no customer pricing, quote issuance/acceptance, booking confirmation, payment, PUDO eligibility, service activation, parcel intake/custody, route or dispatch execution is enabled by PR #133 or PR #134. DEC-045 remains bounded implementation authority; DEC-047's twelve combinations remain unavailable; Operations ownership and initial inventory source remain unresolved; DEC-036 P0/Conditional P0 release evidence remains mandatory.

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
- **M1.1 — Draft foundation hardening: COMPLETE and verified.** PR #97 merged. Shared verified-customer authentication is used by draft GET/POST/PATCH; PATCH checks current draft status transactionally; the existing UI has separate load/save failures and retry handling; 12 focused tests were added. On 1 November, the user reported 29/29 tests passing with the Firestore Emulator, plus TypeScript, lint and production build passing. See the progress tracker and current source traceability. No new business fields or lifecycle states.
- **M1.2 — Shipper journey and portal experience definition: COMPLETE.** Defined in `PLATFORM_SHIPPER_JOURNEY_AND_PORTAL_EXPERIENCE.md` and merged in PR #98 at `71225e3bdd6d827b288a883debb61a03695daef5`. It covers the end-to-end journey, current/target surfaces, party visibility/action principles, lifecycle truth, experience states, 20 acceptance scenarios, M1.3 boundaries and unresolved gates. Documentation only; no application capability is implemented or verified by this work.
- **M1.3 — Portal foundation delivery (COMPLETE for the bounded draft-workspace foundation; not a complete shipper portal):** the first dashboard slice is implemented in PR #100 (merged 1 November 2026 at `79f59726940ae5fbe56558c13976350e5f2d40f1`). `/account` now loads the authenticated customer's latest drafts through the existing GET endpoint, shows a bounded count and latest-three summary, handles loading/empty/error/retry states, links to `/account/shipments`, and keeps storefront orders separate. User-reported verification on 1 November: Firestore Emulator test suite 29/29, TypeScript passed, lint passed, and Next.js production build passed (34 static pages). This verifies the reported local checks only; it is not production verification or completion of the shipper portal.
- **M1.3 workspace and persistence foundation — COMPLETE for the current draft-only scope:** PR #102 delivered workspace hardening and dependency-injected API handlers; PR #103 corrected Node test-runner compatibility; PR #104 added Firestore Admin-store Emulator integration coverage and was reviewed and merged. On 1 November, the user reported 48/48 tests passing under `npx firebase-tools emulators:exec --only firestore "npm test"`, plus TypeScript, lint, production build and `git diff --check` passing. The nine new integration tests exercise the actual store against the Emulator, including customer-scoped persistence, timestamps, ordering, the 50-record cap, protected-field preservation and guarded updates. Manual production smoke checks on 1 November also passed for editing, persistence after refresh and isolation between two registered customer accounts; see `PROGRESS.md` section 64. This completes the bounded draft-workspace foundation, not the full shipper portal. No quote, confirmed booking, payment, intake, custody or downstream operational capability is implemented by this milestone.
- Capture only DEC-038 booking concepts: booking party, origin, destination, eligible service, parcel description and service-required declared information.
- Keep booking party, sender, receiver/collection recipient, payer and physical handover person distinct; enforce ownership, authorization and party entitlements server-side.
- Abandoned drafts create no confirmed booking, payment or custody event.
- The target shipper journey includes draft preparation, eligible-service selection, quotation review, explicit quote acceptance, booking confirmation, payment, authoritative shipment visibility, permitted changes/collection/disputes and role-aware communications as the relevant capabilities are approved and delivered.
- Quote issuance and booking confirmation remain gated until the service has approved pricing inputs/formula, charge components, currency, rounding, rule version, quote validity and handover deadline. The authenticated booking party must explicitly accept a valid quote.
- See `PLATFORM_SHIPPER_PORTAL_PRODUCT_SCOPE.md` for the customer journey, present-versus-target boundary, delivery dependencies and acceptance boundary.

### M2 — Service pricing and quotation
**Policy:** DEC-019, DEC-026–DEC-029, DEC-038–DEC-040 and DEC-046.
- The high-level launch catalogue is approved: Standard, Express and Scheduled. Standard is regular delivery with a journey-specific estimate; Express is priority delivery with a shorter estimate than Standard for the same comparable eligible journey; Scheduled offers a confirmed available date/time option. Estimates are not guarantees.
- For each service, From and To independently support physical-address or eligible registered PUDO-centre endpoints. The four combinations are address-to-address, address-to-PUDO, PUDO-to-address and PUDO-to-PUDO. Each service's support for a combination remains subject to explicit eligibility and operational availability.
- Show only services the Shipper can actually book for the selected journey/date. Eligibility and availability must be enforced and revalidated server-side. If no service is available, explain that the journey cannot currently be booked; do not silently substitute a service, endpoint or route.
- The Shipper does not choose In-PUDO/Out-PUDO/Trans-PUDO route types; the system determines the actual route from approved service, endpoint, location/action eligibility and routing rules. Direct In-PUDO-to-In-PUDO remains valid.
- Scheduled options are limited to available dates/time windows and revalidated before booking confirmation. Preserve the confirmed scheduled commitment; preserve the Standard/Express estimate shown to the Shipper with the quote/booking history.
- **DEC-047 eligibility gate:** Evaluate all 12 service/endpoint combinations independently. Until each combination has an explicit eligible/conditional/not-eligible decision and verified coverage, required PUDO actions, valid route, date/time availability/capacity and Operations approval, keep it unavailable. Pending verification is not a final not-eligible classification. See the DEC-047 matrix in Workflow B and the shipper journey specification.
- Implement pricing only for service specifications with approved fixed/calculated/hybrid model, rates, inputs, units, conversions, calculations, charges, currency and rounding. Calculate/validate prices on the trusted server.
- Enforce the DEC-047 eligibility and operational-verification gate server-side and revalidate it at consequential submission; fail closed on missing, stale or revoked evidence. Do not infer eligibility from a PUDO label or from another service's approval.
- Preserve quote input/charge/rule-version snapshots; repricing creates a new revision. Keep quote validity and service-specific handover deadline separate from scheduled delivery time.
- Preserve declared measurements, actual measurements, adjustment proposals, customer decisions and financial settlement as separate facts. No placeholder rates or assumed defaults.

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

**Next ordered milestone:** M2 — service pricing and quotation. DEC-046's high-level catalogue and DEC-047's conservative eligibility/operational-verification policy are approved. The 12 service/endpoint combinations remain unavailable pending explicit outcomes and operational evidence. Continue with the consolidated per-service pricing and quotation readiness specification before feature coding. M2 remains gated by approved service-specific rates, inputs and units, conversions, calculation formulas, charge components, currency and rounding, rule version, quote validity and separate handover deadline, plus concrete coverage/capacity evidence, estimates and scheduling inputs. Do not invent defaults or placeholder rates. M1.3 is complete only for the bounded draft-workspace foundation; the full shipper portal remains incomplete. M0 baseline/regression evidence and DEC-036 production/release requirements remain independently open.


## M2 pricing/quotation readiness gate — consolidated specification — 2 November 2026

The owner-approved catalogue and conservative eligibility policy are now recorded in DEC-046 and DEC-047 (PR #107 and PR #108). The next M2 specification is `PLATFORM_M2_PRICING_AND_QUOTATION_READINESS_SPECIFICATION.md`.

Before feature coding, complete and approve per-service configuration for Standard, Express and Scheduled independently:
- fixed/calculated/hybrid model selection;
- required/optional/conditional input mapping and authoritative sources;
- units, precision and explicit conversions;
- rates/formulas, distance source/bands, minimums, volumetric-weight treatment and special handling where applicable;
- currency, monetary precision, rounding and explicit tax/surcharge/discount/fee treatment;
- rate ownership, approval, versioning, effective dates and publication/withdrawal controls;
- quote validity and the separate physical handover deadline and missed-handover/refused-intake outcomes;
- immutable quote input/charge/total/currency/rule-version/effective-context snapshot and exact-version acceptance;
- DB-01–DB-03 and DB-05 quote/booking/shipment/parcel/route relationships, plus relevant DB-04/DB-06/DB-11 cross-domain effects;
- Standard/Express estimate methodology and Scheduled availability/cutoff/reservation/change rules;
- DEC-047 actual service/endpoint eligibility outcomes and attributable Operations coverage/capacity evidence.

**Recommended policy boundary:** one shared pricing-rule authority for storefront delivery and independent shipment bookings wherever inputs overlap; keep product catalogue prices distinct from delivery pricing. The current storefront delivery fee is zero in source and is not evidence of an approved shipment or delivery rate.

No service is quote-ready on current approved inputs. Do not implement placeholder rates, assume NGN, assume fees are zero, or infer one service's model from another. Keep payment (DEC-041), measurement adjustments (DEC-040), physical intake/custody and dispatch separate.

**Next ordered activity:** finish the owner-facing service-specific pricing/quotation readiness review and resolve only the genuinely owner-dependent commercial choices in one consolidated approval package. Then complete technical ownership/cardinality/source contracts and executable acceptance specifications before implementation.


## M2 commercial pricing owner decision package — 2 November 2026

The consolidated owner-facing choices are recorded in `PLATFORM_M2_COMMERCIAL_PRICING_OWNER_DECISIONS.md`. This is a proposal package, not approved policy.

The owner has now accepted or deferred these commercial choices in DEC-048. The accepted direction and remaining gates are recorded in the following section. No Standard/Express/Scheduled model, rate, formula, currency, unit, fee, duration, technical schema or service eligibility outcome is approved. DEC-047's twelve combinations remain pending verification and unavailable by default.


## M2 owner commercial decisions accepted — DEC-048 — 2 November 2026

The owner accepted the minimum-launch unit of one parcel and one itemized quote per independent booking; minimum-necessary service-specific input requirements; separate quote-validity and physical-handover deadlines; separated pricing governance; and DEC-019's shared pricing authority. Multi-parcel/cross-obligation allocation is deferred. The owner deferred all three service model selections and all actual rates/formulas/arithmetic/charge values pending evidence.

**Historical next step completed:** the DB-01–DB-12 logical contract was reconciled through DEC-049; the physical DB-01/02/05 contract was approved in PR #117; the bounded quote-lineage/version persistence foundation was implemented in PR #118. The M2 commercial gates remain open.


## DB-01–DB-12 technical-contract and acceptance-specification workstream — 2 November 2026

The consolidated proposal is `PLATFORM_DB01_DB12_TECHNICAL_CONTRACT_AND_ACCEPTANCE_SPECIFICATION.md`. It records current-main M1.3 draft source facts, separates accepted DEC-048 commercial boundaries from unresolved technical representation and owner/operational inputs, and defines case-level acceptance tests for the draft foundation and the booking/payment/physical/financial/evidence/notification boundaries.

**Owner review gate:** Review/merge the technical-contract and acceptance package before starting the next application-code slice. Approval of logical contracts does not approve Firestore schema, API routes/payloads, enums, permissions, provider activation or unresolved commercial/operational values.

**Implementation direction:** Under DEC-045, begin the smallest implementation slice whose policy, technical relationship, authorization, test fixtures and evidence are Ready. Keep all blocked capabilities disabled. In particular, quote issuance and all twelve DEC-047 service/endpoint combinations remain unavailable until their independent prerequisites are approved and verified.


## DEC-049 accepted logical relationships — 2 November 2026

The owner accepted the DB-01/DB-02/DB-05 logical relationship package in PR #114 (merge `26d93cb2748041c8fa0e34bb8a65693949bce0e8`). See DEC-049 and the reconciled case-level requirements in `PLATFORM_DB01_DB12_TECHNICAL_CONTRACT_AND_ACCEPTANCE_SPECIFICATION.md`.

- Booking confirmation occurs on acceptance of the exact current, valid quote version; no parcel, payment, intake, custody or route side effect is implied.
- A parcel is created only when authorized intake accepts actual physical possession. Refusal before possession creates no parcel/custody; receipt retained under hold records actual custody. One independent booking has zero parcels before possession and exactly one after; walk-in intake remains separate.
- One quote lineage per booking uses immutable issued versions and exact-version acceptance bound to one immutable accepted snapshot.

**Next ordered activity:** conduct a separate source-aligned physical persistence/API/security design review for these accepted logical relationships. This review must not invent schema or make blocked capabilities available. Quote issuance/acceptance remains blocked by service-specific pricing, quote/handover terms and DEC-047 evidence. Parcel/intake remains blocked by location/action authority and physical evidence contracts. DB-03, DB-04, DB-06–DB-12 and M0/DEC-036 remain independent gates.


## DB-01 / DB-02 / DB-05 physical persistence/API/security design — 2 November 2026

PR #116 merged at `0ca77ea2cff30d38ea10e279810f4e0cae65cd90`; Review 5 is owner-approved as CONDITIONALLY READY under DEC-045. The relevant Firebase/Firestore, authorization, shipment-draft and test paths were re-fetched at this baseline.

**Design proposal:** `PLATFORM_DB01_DB02_DB05_PHYSICAL_PERSISTENCE_API_SECURITY_DESIGN.md`.

The proposal recommends:
- root-level, centrally queryable quote-lineage, confirmed-booking and parcel records;
- immutable quote-version documents nested beneath their quote lineage;
- exact accepted-version linkage to one booking and a one-time booking-to-parcel link;
- Firestore transactions as the serialization boundary for quote revision/acceptance and later parcel intake;
- server-only access, default-deny client Rules, explicit API authorization and no speculative indexes;
- additive compatibility with existing customer drafts and storefront orders.

**Approval:** PR #117 was reviewed and merged by the owner on 2 November 2026. The physical root paths, quote-version subcollection representation, relationship boundaries, server-only access and bounded first-slice direction are approved as recorded in the design artifact. This does not approve quote issuance, acceptance, booking, parcel/intake or custody capability.

**First implementation slice:** PR #118 was reviewed and merged at `d54f337439947207e1967d1b915a02018e0b856a`. It added internal quote-lineage/immutable-version persistence primitives, synthetic Firestore Emulator integration tests and direct-client Rules-denial tests. It added no customer route/UI, quote calculation/issuance, booking acceptance, parcel/intake, indexes or Rules allow access. The user reported successful local verification: 57 tests passed with zero failures, including the seven quote-store tests; TypeScript, lint and production build also passed.

**Independent gates remain:** pricing model/inputs/rates/arithmetic, quote validity and separate handover terms, DEC-047 service/endpoint eligibility, consequential customer token-revocation policy, booking acceptance authorization, staff/location/action authority, DB-10 physical evidence, and DEC-036 release evidence.

The persistence foundation is a bounded technical prerequisite and does not replace or approve the ordered M2 commercial pricing/quotation readiness work. Quote issuance and acceptance remain disabled until M2 and the other independent prerequisites are approved and evidenced.


## Current M2 execution checkpoint — DEC-048 reconciled; evidence collection next — 2 November 2026

- **Repository baseline:** PR #118 merged at `d54f337439947207e1967d1b915a02018e0b856a`; user reports local `main` synchronized.
- **Completed foundation:** PR #117 approved the DB-01/DB-02/DB-05 physical contract. PR #118 implemented the internal quote-lineage/immutable-version persistence foundation and Rules/Emulator tests. The user reported 57 tests passing with zero failures, and TypeScript, lint and production build passing.
- **Commercial authority:** DEC-048 remains authoritative. One parcel and one itemized quote per independent booking; minimum-necessary service-specific inputs; separate quote-validity and physical-handover deadlines; separated pricing proposal/Operations validation/Finance review/independent approval; one shared pricing-rule authority under DEC-019. Service models and all actual rates/formulas/arithmetic/monetary treatment remain deferred.
- **New evidence artifact:** `PLATFORM_M2_SERVICE_COST_AND_INPUT_EVIDENCE_WORKBOOK.md` is an evidence-collection template only. It introduces no commercial defaults or approvals.
- **M2 readiness specification reconciled:** DB-05 is no longer described as pending. DEC-048/DEC-049 and PRs #117/#118 are reflected as the accepted commercial unit, physical design and implemented persistence foundation. Quote issuance/acceptance remain disabled.
- **Next ordered activity:** collect attributable service-specific cost and operating evidence for Standard, Express and Scheduled; complete the minimum-input/source/unit matrix; obtain Operations validation and Finance review; then record a model recommendation for each service for independent approval. Do not select any model before the evidence exists.
- **Separate operational gate:** all twelve DEC-047 service/endpoint combinations remain pending verification and unavailable by default. This evidence workbook does not activate them.
- **No application implementation next:** do not add pricing calculation, rate configuration, quote issuance or customer acceptance until the corresponding service-specific commercial, operational, authorization and executable acceptance gates are approved.
- **Independent work:** DB-03, DB-04, DB-06–DB-12, M0 and DEC-036 P0/Conditional P0 release evidence remain separate.


## Current M2 direction — Standard operational scope captured; bounded cost-configuration discovery next — 2 November 2026

- **Latest confirmed documentation baseline:** PR #119 merged at 3d324d4a7b9a5eb751106b0da30defe79ea332ce. Its workbook is an evidence template, not pricing approval.
- **Owner's latest priority:** keep the remaining evidence work minimal and move toward implementation.
- **Standard operating facts captured:** shipper selects the origin PUDO centre on the website and must present the parcel there; physical verification occurs at that selected centre; sender-doorstep collection is not in the current Standard scope; centre substitution requires Operations authorisation plus customer notification/acceptance if the selected centre becomes unavailable.
- **Cost configuration direction captured:** each operational activity has an independently configurable unit-cost definition and its own applicable variables. Staff compensation remains flexible and undecided. Transportation supports business-owned vehicles, driver-owned vehicles and external partners, with configurable per-trip/distance/per-parcel/fixed/time/hybrid/negotiated agreement options. No separate fuel/vehicle operating-expense reimbursement is provided to driver-owned-vehicle drivers or external partners under the described arrangement; business-owned vehicle treatment remains open.
- **Parcel and exception direction:** support extensible characteristics including weight and dimensions; preserve customer declarations separately from actual measurements; support recalculation with customer acceptance, rejection or Operations review; record failed attempts and Return-to-Sender without automatic customer charges or false custody transitions.
- **Evidence limitation:** no actual activity rates, units, formulas, cost allocation, staff payment method, partner contract, source evidence or Finance/Operations validation has been supplied. No service pricing model is selected.
- **Next:** conduct a fresh, read-only source review of current-main Firebase Admin, Firestore stores, validation, authorization and Emulator tests. Use that review to propose a minimal technical contract for internal activity-cost configuration. Do not begin code until the contract and security/acceptance tests are approved.
- **Potential first code slice:** configuration persistence/validation and immutable version history with Emulator integration and direct-client Rules-denial tests only, subject to source review and an approved contract. No pricing calculation, customer quote, storefront fee, customer UI, staff compensation execution, route/dispatch/intake/custody or DEC-047 activation.
- **Preserve:** DEC-048 quote governance; all twelve DEC-047 combinations unavailable; PR #118 quote-lineage foundation; existing storefront, draft, order, payment and admin flows unchanged. M0 and DEC-036 release evidence remain independent.
