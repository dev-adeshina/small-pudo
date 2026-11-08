# PUDO-2 — Physical Verification and Operations Approval Contract

**Status:** Owner-approved operational and implementation baseline (8 November 2026).  
**Repository baseline:** PUDO-1 merged in PR #149; main merge commit `8b6e6f4e1a1637cba39a52bff2339b5942177728`.  
**Policy baseline:** DEC-043, DEC-045, DEC-047, DEC-050, DEC-051, DEC-052 and DEC-053; owner approval recorded as DEC-054.  
**Milestone:** PUDO-2 — Candidate physical verification and Operations approval.  
**Purpose:** Define the bounded PUDO-2 behaviour before source-aligned technical implementation. This contract does not authorise PUDO-3 activation or capability configuration, PUDO-4 discovery/routing, or any shipment fulfilment operation.

## 1. Delivery boundary

PUDO-1 registers an individual candidate and leaves it in `draft` or `submitted`. A submitted candidate is not a verified, approved, active, capable, or customer-selectable PUDO location.

PUDO-2 adds the controlled Operations process for:
1. reviewing a submitted candidate;
2. physically inspecting the actual site in person;
3. recording inspection findings and relevant supporting evidence;
4. resolving discrepancies or requesting correction/additional information; and
5. recording an attributable Operations decision on whether the candidate may proceed to the separate activation stage.

PUDO-2 does not activate a location. It does not grant service support, action capability, staff permissions beyond the explicit PUDO-2 activities, DEC-047 eligibility, customer discovery, route coverage, or operational availability.

## 2. Accountability and authority

### 2.1 Organisational accountability

The business owner remains the highest organisational accountability authority for the PUDO inventory, verification governance, and Operations approval.

An **Operations Owner** role is approved, initially capable of being held by one person. The role oversees:
- the practical physical-inspection standard;
- evidence sufficiency for the actual operating arrangements;
- verification decisions and unresolved discrepancies;
- consistency and accountability of Operations records; and
- when re-verification should be required under the approved operational criteria.

The role designation does not itself grant application access. The named person has not been assigned by this decision. Designation and activity permissions are handled separately through the existing platform-wide staff delegation model (DEC-052).

### 2.2 Activity authority

- Only staff explicitly assigned the applicable PUDO-2 activity and scope may perform protected verification or Operations decision actions.
- Registration authority does not imply verification or approval authority.
- Admin status, staff membership, job title, or the Operations Owner title alone does not bypass explicit server-side authorization.
- The system must attribute the registering actor, physical verifier, Operations decision-maker, and any later activation actor independently. The same person may not be presumed to have performed every stage.
- Any additional separation-of-duties constraint must follow the approved authority framework; this contract does not invent new permission identifiers or named assignments.
- Activation remains a separate authority and milestone under PUDO-3.

## 3. Mandatory physical inspection

A physical, in-person inspection of the actual candidate site by an Operations representative is mandatory before an approval-to-proceed decision.

The verifier must:
- attend and physically observe the actual site;
- identify the site sufficiently to distinguish it from nearby or similarly named premises;
- establish that the site observed corresponds to the submitted candidate;
- compare the submitted identity/address details with the actual site;
- examine whether the stated operating arrangement is real and understood; and
- record discrepancies, limitations, and unresolved questions.

A directory listing, map result, coordinate, geocoding result, unsupported photograph, or verbal assertion alone cannot substitute for the in-person physical inspection.

## 4. Inspection record and evidence standard

### 4.1 Mandatory inspection record

Each completed inspection must leave an attributable record sufficient for another authorised reviewer to understand what was checked and why the resulting decision was made. At minimum, the record must identify:
- the candidate/site inspected;
- the verifier;
- the inspection date and time;
- the nature of the in-person inspection;
- findings against the verification areas below;
- discrepancies, limitations, and unresolved matters;
- supporting evidence actually reviewed, where applicable; and
- the resulting recommendation or decision and its reason.

These are logical record requirements, not approved database field names or a physical schema.

### 4.2 Verification areas

Operations assesses the candidate against these five areas:

1. **Physical existence and site identity:** the actual site exists and corresponds to the candidate submitted.
2. **Name, address, and location identity:** the site's identifying details and practical directions accurately identify the inspected place; ambiguity and duplicates are addressed.
3. **Operating arrangement and authority:** the actual operator/controller and the basis on which the site participates in the intended PUDO arrangement are understood and supported.
4. **Operational readiness for the proposed purpose:** the arrangement can genuinely be carried out at the site and material constraints are recorded. This is not a grant of any service or action capability.
5. **Evidence review and reasoned outcome:** the verifier and decision-maker can identify what was inspected, what evidence was reviewed, its limitations, and why the outcome was reached.

### 4.3 Arrangement-dependent evidence

Supporting evidence must be relevant to the candidate's actual operating arrangement. Operations determines what is appropriate in context.

There is no universal mandatory document list in this contract. Contracts, permissions, business records, operator/contact confirmation, inspection notes, photographs, or other material may be relevant in a particular arrangement, but none is universally required merely by this contract. Photographs are not mandatory.

Evidence must be genuine, attributable, relevant, and sufficiently current for the question it is used to establish. Evidence that is unavailable, conflicting, unauthenticated, unreliable, or insufficient must not be treated as a pass.

Coordinates and map results may assist geographic identification but do not prove physical existence, operating authority, or verification.

### 4.4 Capture and retention boundary

The inspection findings and evidence reviewed must be represented in a way that preserves attribution and allows the decision to be reconstructed. The exact file formats, storage mechanism, attachment/reference design, access controls, retention duration, and deletion/legal-hold procedure are not selected here. They must be handled in the source-aligned technical design and applicable records policy; no retention period is invented by this approval.

## 5. Operations outcomes

The Operations process must support these decision meanings:

| Outcome | Meaning | Consequence |
|---|---|---|
| **May proceed to activation** | Physical inspection and relevant evidence support the candidate's readiness for the proposed arrangement. | Records Operations approval only. The candidate awaits the separate PUDO-3 activation action. |
| **Further information or correction required** | A discrepancy, missing detail, unresolved authority question, or insufficient evidence prevents a sound approval decision but may be resolved. | Candidate remains unavailable. The requested clarification/correction and reason are recorded. |
| **Not approved** | The candidate does not meet the requirements for proceeding, or the arrangement is not acceptable. | Candidate remains unavailable. The decision and reason are recorded. |

These are business meanings, not approved persisted status strings or enum values. The technical design must preserve the PUDO-1 `draft`/`submitted` lifecycle meaning and introduce no direct submitted-to-active transition.

## 6. Correction, re-review, and re-verification

- A request for correction or further information must identify what is unresolved and why.
- Corrections must not silently rewrite the original submission, prior inspection findings, evidence references, or previous decisions.
- A subsequent review must retain the lineage of the original submission, correction, later inspection/review, and decision.
- A material change to the physical site, address/identity, operator, owner/controller, or operating arrangement may require a new physical inspection and decision.
- Evidence withdrawn, expired, contradicted, or found unreliable may require renewed review.
- Reactivation after a material change or suspension must not rely automatically on an old approval.

The exact re-verification triggers, intervals, evidence-freshness rules, suspension/reactivation criteria, and review/appeal authority remain subject to further operational policy. No periodic interval is created here.

## 7. Audit and record integrity

The process must allow the organisation to reconstruct:
- who registered the candidate and the source of its information;
- who physically inspected it and when;
- what was observed and what evidence was reviewed;
- what discrepancies or limitations were identified;
- who made each Operations decision, when, and for what reason;
- what correction or additional information was requested and supplied; and
- the subsequent verification/decision history.

The original submission and prior decision/evidence history must remain available to authorised reviewers. Candidate changes and their audit events must be attributable and protected against client-supplied actor identities or timestamps. The technical design must use the repository's established server-side persistence and audit conventions rather than introduce a parallel architecture.

## 8. Acceptance criteria for the PUDO-2 technical design

The implementation proposal must demonstrate that:

1. Only submitted candidates enter the PUDO-2 review queue.
2. Unauthenticated, inactive, out-of-scope, or unassigned staff cannot access protected PUDO-2 actions.
3. A decision to proceed cannot be recorded without an attributable in-person Operations inspection record.
4. The inspection record identifies the candidate, verifier, date/time, findings, discrepancies/limitations, evidence reviewed, and decision rationale as applicable.
5. The evidence model permits arrangement-specific references without imposing universal documents or mandatory photographs.
6. Insufficient or conflicting evidence cannot produce an approval-to-proceed outcome.
7. Further-information/correction and not-approved outcomes leave the candidate unavailable for customer selection and operational work.
8. Corrections and subsequent reviews preserve original submissions and append-only history.
9. The Operations decision-maker is separately attributable from the verifier, without inventing an unapproved rule that they must always be different people.
10. An approval-to-proceed outcome does not activate the location or grant service/action capability, staff permission, route coverage, capacity, or DEC-047 eligibility.
11. No submitted candidate can transition directly to active.
12. Server-side authorization and mutation are authoritative; client Firestore writes cannot alter privileged candidate, verification, decision, or audit records.
13. Tests cover authorization denial, missing inspection, evidence insufficiency/conflict, each outcome, correction/history preservation, replay/concurrency, and audit attribution.
14. The repository's established emulator-backed tests, TypeScript, lint, build, and relevant browser scenarios are reported accurately; no test is claimed without execution.

## 9. Explicit exclusions and preserved guardrails

PUDO-2 does not include:
- activation or deactivation controls (PUDO-3);
- service support or location/action capability configuration (PUDO-3);
- customer-facing discovery, proximity ranking, route distance, or routing (PUDO-4);
- customer shipment selection, booking, quote, payment, parcel intake, custody, collection/release, dispatch, or transport;
- automatic approval based on coordinates, maps, photographs, directory listings, or candidate submission;
- invented partner terms, legal-document requirements, opening hours, capacity, rates, or service promises;
- a new role system, implicit Admin authority, new permission IDs, or named staff assignment;
- a universal evidence checklist, mandatory photograph, retention duration, or fixed re-inspection interval.

All twelve DEC-047 service/endpoint combinations remain unavailable until independently evidenced and approved. Physical custody continues to mean actual physical possession; dispatch, route assignment, arrival, or attempted handover is not a completed custody transfer. DEC-036 release evidence remains an independent gate.

## 10. Implementation readiness and next sequence

The owner-approved operational baseline in this contract closes the PUDO-2 business decision on mandatory inspection, the five verification areas, arrangement-dependent evidence, insufficiency handling, auditable outcomes, and the Operations Owner role.

The remaining work is a focused source-aligned technical design: reconcile PUDO-2 activity permissions and scopes with the existing staff delegation model; define the minimum persistence/API/security representation and evidence-reference handling; and specify executable acceptance fixtures. These are technical design tasks, not reasons to reopen the approved operational baseline.

Evidence-retention duration and records-policy details remain open. They must not be fabricated; the technical design must not promise a retention period that has not been approved.

PUDO-3 and PUDO-4 remain separately gated. Once the focused PUDO-2 technical design is reconciled against the repository, implementation may proceed only within this contract's boundaries and the approved technical design.
