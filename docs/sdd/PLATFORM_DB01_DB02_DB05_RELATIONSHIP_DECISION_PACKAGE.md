# DB-01, DB-02 and DB-05 — Consolidated Booking, Parcel and Quote Relationship Decision Package

**Status:** Logical recommendations accepted by the owner and recorded as DEC-049 after PR #114 merged. This document is retained as decision rationale. No physical schema, Firestore collection/document layout, fields, indexes, API routes/payloads, status enums, permissions or application implementation is approved by this package.  
**Prepared:** 2 November 2026  
**Repository baseline:** `main` after PR #113 merge, `4217c1d`.  
**Related authority:** DEC-018, DEC-019, DEC-023, DEC-024, DEC-025, DEC-033, DEC-038–DEC-045, DEC-047, DEC-048; BP-01–BP-22; PM-01–PM-12; `PLATFORM_DB01_DB12_TECHNICAL_CONTRACT_AND_ACCEPTANCE_SPECIFICATION.md`; `PLATFORM_API_PERSISTENCE_AND_INTEGRATION_BOUNDARY_CONTRACT.md`; `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`; `PLATFORM_SHARED_WORKFLOWS.md`.

## 1. Purpose and decision boundary

This package closes the next focused relationship-design gap: when an independent booking becomes confirmed, when a parcel identity comes into existence, and how the issued quote is preserved and accepted.

It consolidates DB-01, DB-02 and DB-05 rather than treating them as three unrelated owner questions. It applies the accepted DEC-048 commercial unit:

- one independent booking;
- no more than one parcel associated with that booking for minimum launch;
- one itemized quote lineage for that booking;
- multi-parcel, parcel splitting/merging, partial parcel acceptance and cross-obligation allocation deferred.

The recommendations below are deliberately separated into:
1. **Already accepted policy** — must not be reopened.
2. **Recommended logical contract** — proposed relationship and lifecycle semantics for owner acceptance.
3. **Physical implementation decisions** — explicitly not approved here.

DEC-045 permits bounded implementation under accepted policy, but does not permit unresolved relationships to be invented. The merged DB-01–DB-12 specification remains the controlling technical baseline; this package narrows the next owner review to the decisions needed for the booking/parcel/quote boundary.

## 2. Source and verification baseline

The source review recorded in the merged DB-01–DB-12 specification found:

- M1.3 is a preparation-only draft workspace. It does not issue quotes, confirm bookings, create parcel/shipment identities, initiate payments, record intake/custody or assign routes.
- Drafts are owned by the verified customer and stored under that customer's existing Firestore user document. That storage path and shape are specific to drafts and are not a template for booking, quote or parcel persistence.
- Existing storefront orders and Paystack flows are separate commerce/payment responsibilities and must not be repurposed as independent shipment records or shipment payment authority.
- No independent confirmed-booking, quote/rate, parcel/intake/custody service was found in the bounded source review.

After PR #113 merged, the owner ran the Firestore Emulator-backed suite against a demo project. The reported result was **49 tests passed, 0 failed, 0 cancelled**, including the concurrent draft update/status-change test. This verifies the current draft boundary only; it does not verify booking, quote or parcel behaviour.

## 3. Accepted policy — fixed boundaries

The following are not questions in this package:

1. A registered, authenticated customer is the independent booking party at launch. Storefront guest checkout remains separate.
2. Explicit acceptance by the authenticated booking party of a valid, unexpired quote confirms the commercial booking and accepted terms (DEC-038).
3. Booking confirmation, payment, physical presentation, intake, custody, dispatch, movement and delivery are separate facts.
4. DEC-048 accepts one parcel and one itemized quote per independent booking for minimum launch. Multi-parcel and cross-obligation allocation are deferred.
5. Quote validity and the physical handover deadline are separate requirements and must both be communicated before acceptance. Their numerical durations, triggers and missed-deadline outcomes remain unresolved.
6. The accepted quote's inputs, itemized charges, total, currency, pricing-rule/rate version and effective context must remain historically reconstructable. Actual pricing models, rates, formulas, currency, arithmetic and fee/tax treatment are not approved.
7. The three launch services and four endpoint patterns remain subject to DEC-047. All twelve service/endpoint combinations remain unavailable until their own operational eligibility and evidence are approved.
8. Actual physical custody changes only when the physical handover and receiving possession are established (DEC-044). Booking acceptance, parcel record creation, route assignment or dispatch cannot fabricate custody.
9. The booking party, sender, receiver, payer and physical handover person may differ; their permissions are not interchangeable.
10. A staff-created walk-in intake is a distinct operational path, not a customer booking or a way to bypass the booking/quote boundary.

## 4. Recommended owner decision DB-01 — booking confirmation versus parcel creation

### Recommendation

**Confirm the commercial booking at exact quote acceptance; do not create a parcel identity or record physical receipt/custody at that moment. Create the parcel identity only when an authorized intake actor accepts physical possession of the presented item.**

The proposed sequence is:

1. **Quote issued:** an authenticated booking party receives an itemized, versioned offer. An issued quote is not a booking.
2. **Quote accepted:** the server revalidates the exact quote version, validity, booking-party authority and all prerequisites. A successful acceptance confirms one commercial booking bound to the accepted quote snapshot and the separately communicated handover deadline.
3. **Awaiting handover:** the booking exists as a confirmed commercial instruction. It may await an allowed payment path and physical presentation. No parcel, intake, custody, route or delivery fact is implied.
4. **Intake presentation/check:** an authorized intake workflow identifies the confirmed booking, active location capability, staff authority and required checks. A presentation or attempted intake alone does not establish receipt.
5. **Possession accepted:** when the receiving actor actually takes possession (including physical receipt retained under an authorized hold), the system establishes the single parcel identity and records the corresponding intake/custody fact with the required actor, location, occurrence/capture context and evidence.
6. **Refusal before possession:** record the refusal/attempt outcome against the booking/intake attempt under the approved intake evidence process, but do not create a parcel or claim custody. If staff already possess the item, the system must instead record the actual custody and hold; it must not disguise possession as refusal.
7. **Missed handover:** any unfulfilled closure follows the approved service-specific rule when defined. Do not infer a fee, refund, credit, liability or compensation outcome.

### Why this is the recommended boundary

- It preserves DEC-038: quote acceptance confirms the commercial booking.
- It preserves DEC-044: custody follows actual possession, not a booking event.
- It avoids creating a purported physical shipment for an item that has not yet been presented or received.
- It still permits the intake workflow to distinguish an attempted/refused handover from accepted possession.
- It does not make payment a precondition for booking confirmation where an approved service allows payment at intake.

### Alternatives and consequences

| Option | Consequence | Recommendation |
|---|---|---|
| Create booking and parcel together at quote acceptance | Assigns a parcel identity before the physical item is presented; risks implying an operational physical item exists when it does not. | Reject for minimum launch. |
| Create booking at quote acceptance; create parcel when authorized staff accept possession | Cleanly separates commercial obligation from physical item/custody; supports refused-before-possession and received-under-hold outcomes. | **Recommend.** |
| Delay both booking and parcel until physical intake | Contradicts the accepted rule that quote acceptance confirms the booking. | Reject. |

**Owner decision requested:** Accept or reject the recommended timing boundary. If rejected, specify the alternative event that creates the parcel identity without conflating booking confirmation, presentation, receipt and custody.

## 5. Recommended logical contract DB-02 — booking-to-parcel relationship

Subject to the DB-01 timing recommendation:

- An independent booking may have **zero or one** parcel before physical possession is accepted.
- Once a parcel is established, that booking has **exactly one** parcel for the minimum-launch workflow.
- Each independent-booking parcel belongs to exactly one originating booking. A parcel cannot be attached to multiple independent bookings.
- Parcel identity is stable after creation. Corrections to an erroneous relationship require an attributable, authorized correction that preserves the original fact and audit history; ordinary reassignment is not a supported workflow.
- No parcel is created from a draft, an issued quote, quote acceptance alone, payment, route assignment or a customer-supplied parcel identifier.
- A second parcel, parcel split/merge, partial parcel acceptance and parcel-level cancellation are rejected or absent from the launch capability.
- Walk-in intake remains a separately authorized path and must not be forced into a confirmed independent booking relationship.

This is a **logical cardinality proposal**, not a Firestore one-to-one document layout. It does not prescribe an embedded object, reference, subcollection, top-level collection, denormalized projection or identifier format.

## 6. Recommended logical contract DB-05 — quote identity, version and acceptance

### Recommendation

Use **one logical quote lineage for one independent booking**, with immutable issued versions. A revision is a new immutable version within that same quote lineage, not a second simultaneously acceptable quote. Only one current version may be offered for acceptance at a time.

The issued quote exists before the confirmed booking. It is owned by the authenticated booking party and carries the validated request context. On acceptance, the exact accepted quote/version is uniquely linked to the newly confirmed booking. This avoids requiring a confirmed booking to exist before the quote that creates it can be accepted.

### Version and snapshot rules

1. Every issued version is immutable. A changed offer creates a new version; it does not overwrite the prior issued version.
2. The current offer version is the only version eligible for acceptance. Superseded, expired, withdrawn or otherwise invalid versions cannot be accepted.
3. Acceptance names the exact quote version. The server rechecks that it remains current and valid at mutation time.
4. The accepted snapshot preserves, at minimum, the approved input facts and their source/actor classification, units/precision/conversions, itemized charge components, total, currency, pricing-rule/rate version and effective context, plus the separate quote-validity and physical-handover terms. The actual field catalogue and values remain subject to the relevant approved service configuration.
5. Acceptance evidence identifies the authenticated booking party, quote identity and version, explicit acceptance action, authoritative acceptance time, and the exact terms accepted. The customer must have been shown both quote validity and the separate handover deadline before acceptance.
6. After acceptance, the accepted version and snapshot are immutable. Later rate/configuration changes cannot rewrite it. Any post-acceptance change requires a separately approved amendment/adjustment workflow; it is not a quote revision.
7. A quote can be accepted into at most one confirmed booking. A confirmed booking references exactly one accepted quote version. No cross-booking quote reuse or allocation is supported.
8. Expiry of an unaccepted quote version prevents acceptance and requires a fresh valid offer. Expiry of an already accepted quote does not silently cancel or rewrite the booking.
9. Quote calculation/issuance fails closed when any required service input, authoritative source, pricing configuration, charge treatment, currency/arithmetic rule, eligibility evidence or deadline is missing or unapproved. No placeholder, zero-value or guessed charge is an acceptable quote.

### Alternatives and consequences

| Option | Consequence | Recommendation |
|---|---|---|
| Overwrite a quote when its values change | Destroys the exact offer shown to the customer and weakens stale-version protection/auditability. | Reject. |
| Create multiple independent quote records that can all be accepted for one booking | Conflicts with DEC-048's one-quote-per-booking minimum and creates ambiguity over which offer governs. | Reject. |
| One quote lineage with immutable versions and one accepted version | Preserves one commercial quote per booking while allowing a controlled refreshed offer before acceptance. | **Recommend.** |

## 7. Cross-boundary transaction, replay and authorization contract

The following is the recommended logical transaction contract; it does not prescribe a physical Firestore transaction or idempotency field:

- At acceptance, re-authenticate the registered customer and derive the booking-party identity from the verified token. Do not trust a caller-supplied UID.
- Re-resolve the quote, exact version and current status. Recheck expiry, supersession/withdrawal, required service/endpoint eligibility and all required commercial prerequisites.
- Confirm that the actor is the booking party authorized to accept this quote. Sender, receiver, payer, handover person or possession of a quote identifier is not sufficient by itself.
- Atomically persist the acceptance decision and exactly one confirmed booking bound to the exact accepted quote version, so the quote cannot be marked accepted without its booking and the booking cannot exist without its accepted quote.
- Concurrent or duplicate submissions for the same quote version must not create multiple bookings. A replay by the same authorized booking party returns or resolves to the original outcome; an attempt to accept a stale/superseded version is rejected without mutation.
- No payment instruction, parcel identity, intake, custody, route, movement or delivery side effect is part of quote acceptance.
- At parcel creation, recheck that no parcel is already linked to the booking and that the intake actor, location/service/action capability, physical possession and required evidence are valid. Concurrent attempts must not create two parcels.
- Any external provider or evidence-upload side effect has its own unknown-outcome/recovery contract. Do not claim an atomic transaction spans Firestore and an external service.

## 8. Acceptance cases to add or refine

The merged technical-contract specification already defines TCC-BOOK-01, TCC-BOOK-04, TCC-QUOTE-01, TCC-QUOTE-02 and TCC-INTAKE-01. On acceptance of this package, refine them with these explicit assertions:

| Case | Additional executable assertions | Readiness |
|---|---|---|
| Booking confirmation (TCC-BOOK-01) | Exact current quote version accepted once; concurrent/replayed acceptance yields one booking; no parcel, payment, intake, custody or route record is created. | Blocked until quote prerequisites and DEC-047 eligibility evidence are approved. |
| One parcel (TCC-BOOK-04) | Booking has no parcel before accepted physical possession; one accepted intake creates exactly one parcel; concurrent duplicate intake cannot create a second; second parcel/split/merge is denied. | Logical policy proposed; physical intake evidence/location contracts remain blocked. |
| Quote preservation (TCC-QUOTE-01) | Issued versions are immutable; revised version supersedes prior unaccepted version; acceptance binds exact version; later pricing configuration changes do not mutate accepted snapshot. | Blocked until service pricing and quote inputs/arithmetic are approved. |
| Quote expiry/handover (TCC-QUOTE-02) | Quote expiry prevents pre-acceptance acceptance; accepted quote expiry does not cancel booking; missed handover follows only the separately approved service policy. | Blocked until numerical durations, triggers and outcomes are approved. |
| Intake (TCC-INTAKE-01) | Refusal before possession creates no parcel/custody; receipt retained under hold creates parcel plus actual custody; the physical actor, receiving actor, recorder, location and evidence remain attributable. | Blocked until service/location/action and event evidence contracts are approved. |

All tests use synthetic data in an approved non-production environment. Blocked cases must not be marked passed or used to enable a capability.

## 9. What this package does not unblock

Even if the owner accepts the recommendations:

- Quote issuance and acceptance remain disabled until per-service pricing models/inputs/sources/units/conversions/rates/formulas/currency/arithmetic/charge treatment and quote/handover durations are approved.
- All twelve DEC-047 service/endpoint combinations remain unavailable until each combination has attributable Operations eligibility, location-action, coverage, route and availability/capacity evidence.
- Physical parcel creation/intake remains disabled until location capabilities, staff authority, intake evidence, identity/inspection and custody contracts are approved.
- Payment, refund, allocation and reconciliation remain separately gated by DB-06, DB-11 and DEC-041.
- Route-leg, movement and dispatch implementation remains separately gated by DB-03 and the custody/evidence contracts.
- Business authority, evidence retention/reviewer/disclosure, notification and DEC-036/M0 release gates remain independent.

No confirmed-booking or quote-engine implementation should be inferred as ready from acceptance of this relationship package alone.

## 10. Explicit non-approvals

This package does not approve:

- Firestore collection/subcollection/document names, fields, indexes, physical references, denormalization, migrations or identifier formats;
- API paths, HTTP methods, request/response payloads, status enums, permission IDs or claims;
- any service pricing model, rates, formulas, units, conversions, currency, rounding, tax, surcharge, discount or fee values;
- quote validity or physical handover numerical durations, triggers or missed-handover financial outcomes;
- any DEC-047 service/endpoint eligibility or location capability;
- payment provider activation, payment allocation, refunds or reconciliation;
- physical proof technology, evidence retention, legal-hold or disclosure authority;
- production deployment, capability activation or release sign-off.

**Approval requested:** Review the DB-01 timing recommendation in Section 4 and the logical DB-02/DB-05 contracts in Sections 5–7 as one coherent package. Accept, reject with an alternative, or defer the recommendations. If accepted, record the owner decision and reconcile the technical acceptance cases before a source-aligned physical persistence design review.  


## 11. Owner decision outcome — DEC-049 — 2 November 2026

The owner reviewed and merged PR #114 at `26d93cb2748041c8fa0e34bb8a65693949bce0e8`. The recommendations in Sections 4–7 are accepted as logical business/relationship contracts and are recorded in `DECISIONS.md` as DEC-049. The acceptance cases are reconciled in `PLATFORM_DB01_DB12_TECHNICAL_CONTRACT_AND_ACCEPTANCE_SPECIFICATION.md`.

This acceptance does **not** approve physical Firestore representation, fields, indexes, identifiers, APIs, status enums, permission IDs/claims, pricing values, quote/handover durations, DEC-047 eligibility, location capabilities, evidence technology, providers or application code. Quote issuance/acceptance and parcel/intake remain unavailable until their independent prerequisites are approved and verified. A separate source-aligned physical persistence/API/security design review is required before implementation.
