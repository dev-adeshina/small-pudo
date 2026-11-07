> **7 November 2026 update — DEC-051 to DEC-053:** The business owner has been identified as the accountable top organisational authority for PUDO inventory and verification governance. Candidate locations will be registered individually and incrementally by staff explicitly assigned registration activity. Submitted records require attributable WGS 84 latitude/longitude for distance calculation. Coordinates assist geographic calculation but do not establish physical existence, authority, or verification. The earlier statements that the Operations owner and incremental registration approach were unassigned are superseded. Evidence sufficiency, evidence capture format, and retention remain open for the business owner to validate. See `PLATFORM_PUDO_FINAL_IMPLEMENTATION_READINESS.md`.

# PUDO Location Verification Checklist and Evidence Requirements

**Status:** Proposed operational checklist for owner and Operations review; not yet approved as a mandatory evidence policy. The accountable Operations position has not yet been assigned (confirmed by the owner on 3 November 2026).  
**Prepared:** 3 November 2026  
**Related decisions:** DEC-018, DEC-025, DEC-043, DEC-047, DEC-050.  
**Related workflow:** `PLATFORM_PUDO_LOCATION_REGISTRATION_AND_VERIFICATION_WORKFLOW.md`.  
**Related foundation:** `PLATFORM_PUDO_LOCATION_REGISTRY_AND_CAPABILITY_FOUNDATION.md`.

## 1. Purpose and limits

This document proposes a practical, evidence-led checklist for Operations to use when verifying a candidate PUDO location under DEC-050.

The current starting point is that **no verified operational PUDO location inventory exists**. The first inventory must be assembled from an accountable business/Operations source and each candidate must be physically verified. A free-text shipment-draft address, directory entry, search result, map pin, or customer suggestion is only a lead; it is not proof that a site exists, is authorised, or is suitable for VeriLyft operations.

This checklist is a proposal for review. It does not yet impose a particular legal document, contract, photograph, GPS coordinate, survey, opening-hours record, insurance certificate, or other fixed evidence item. The evidence appropriate to a candidate depends on the actual operating arrangement and must be confirmed by Operations. No physical schema, field, status enum, API, permission identifier, retention period, or application implementation is approved here.

## 2. Five verification areas

Operations should assess each candidate against the following areas. The checks establish whether the location can proceed through the DEC-050 approval and activation process; they do not grant service/action capability or DEC-047 journey eligibility.

### 2.1 Physical existence and site identification

**Question:** Does the physical site exist, and can Operations unambiguously identify the place being proposed?

Proposed checks:
- An Operations verifier physically visits or otherwise performs an in-person inspection of the actual site.
- The verifier can identify the site and distinguish it from nearby or similarly named premises.
- The site observed corresponds to the candidate submitted for registration.
- Any discrepancy between the submitted description and the observed site is recorded and resolved before approval.

Evidence principle:
- Direct physical observation by Operations is the core verification activity.
- A map result, website listing, photograph supplied without verification, or verbal assertion alone does not substitute for the physical check.
- Whether and how Operations captures supporting photographs, inspection notes, or other proof remains for Operations to approve.

### 2.2 Name, address, and location identity

**Question:** Do the candidate's identifying details accurately point to the physical site inspected?

Proposed checks:
- Confirm the name by which the site is known in the actual operating arrangement.
- Confirm the address or other practical directions sufficiently identify the inspected site.
- Resolve ambiguous, incomplete, inconsistent, or duplicate location descriptions.
- Record material differences between submitted details and observed reality.

Evidence principle:
- The evidence should corroborate the actual site and its identity.
- The acceptable corroborating source may differ by operating arrangement; this document does not mandate a specific address document or mapping provider.
- Coordinates, geocoding, and map pins are not required or approved by this checklist and cannot independently prove identity or authorisation.

### 2.3 Operating arrangement and authority to participate

**Question:** Who operates or controls the site, and on what basis is it participating in VeriLyft's PUDO network?

Proposed checks:
- Identify the actual operating arrangement, based on the real relationship rather than an assumed label.
- Establish who is accountable for the site in that arrangement.
- Establish the basis on which the site may be used for the intended VeriLyft PUDO purpose.
- Confirm that the arrangement described by the registering person is consistent with what Operations verifies.
- Record unresolved ownership, control, consent, partner, or authority questions and withhold approval until they are resolved.

Evidence principle:
- Operations must review evidence appropriate to the actual arrangement.
- A contract, appointment, permission letter, business registration, property document, or named contact may be relevant in a particular case, but none is made universally mandatory by this proposal.
- The actual evidence categories, acceptable alternatives, sufficiency standard, and reviewer authority require Operations validation. Do not infer a contractual relationship or ownership from a shop sign, map listing, or the fact that someone has submitted the location.

### 2.4 Operational readiness for the proposed purpose

**Question:** Is the site genuinely prepared to participate in the operating arrangement being proposed?

Proposed checks:
- Confirm with the accountable operator/contact the intended role of the site.
- Confirm that the stated operating arrangement can be carried out at the physical site.
- Identify practical constraints, restrictions, or unresolved dependencies that would prevent the site from performing its proposed role.
- Record which activities the location is being considered for, without treating this checklist as approval of those activities.

Boundary:
- Operational readiness for activation is not the same as a service-support or action-capability grant.
- The checklist does not assume that every site can accept outgoing parcels, perform walk-in intake, measure parcels, accept custody, collect/record payment, release parcels, or perform custody handovers.
- The exact service/location/action mapping and any activity-specific readiness checks remain a separate Operations decision under DEC-025/DEC-043.
- This document does not assess route coverage, schedules, opening hours, capacity, service eligibility, customer booking availability, or any of the twelve DEC-047 combinations.

### 2.5 Evidence review and reasoned outcome

**Question:** Can another authorised reviewer understand what Operations checked and why it reached its decision?

Proposed checks:
- Identify the registering person and the source of the candidate information.
- Attribute the physical verification to the Operations verifier.
- Record the date/time and nature of the verification activity through the approved operational process.
- Identify the evidence actually reviewed and any limitations or discrepancies.
- Record the Operations decision, decision-maker, reason, outstanding conditions (if any), and whether the candidate may proceed to the separate activation step.
- Preserve the original submission and prior evidence when corrections or re-verification occur.

Boundary:
- These are logical audit expectations, not approved database fields or an approved evidence-storage design.
- No retention duration, evidence format, signature method, photograph requirement, or status vocabulary is selected here.

## 3. Evidence categories — proposed, not universally mandatory

Operations should determine the appropriate evidence set for each candidate from its actual operating arrangement. The following categories are prompts for that assessment, not a universal document checklist:

| Evidence category | What it may help establish | Current status |
|---|---|---|
| Direct physical inspection by Operations | The site exists and corresponds to the candidate being reviewed. | Required verification activity under DEC-050; capture method remains open. |
| Site identity/address corroboration | The actual name and address/directions identify the inspected site. | Evidence required to support the finding; acceptable source(s) remain open. |
| Operator or accountable-contact confirmation | Who operates or controls the site and who can answer for the arrangement. | Relevant where applicable; required form and sufficiency remain open. |
| Operating/participation authority evidence | The basis on which the site is available for the intended PUDO arrangement. | Must be assessed for the actual arrangement; no universal document type is mandated. |
| Site photographs or inspection notes | Additional corroboration of the observed site and any material constraints. | Potentially useful; not universally required or approved as a format. |
| Agreement, appointment, consent, or other business record | Evidence of a particular partner, staff, or premises arrangement. | Only where relevant to the actual arrangement; document type and approval standard remain open. |
| Geographic coordinates or map result | Geographic assistance or later discovery/presentation. | Not proof of existence, identity, authority, verification, activation, capability, or eligibility; provider and method unapproved. |

Evidence must be genuine, attributable, relevant to the claim being verified, and sufficiently current for the decision. Where evidence conflicts, is unavailable, cannot be authenticated, or does not establish the relevant claim, Operations should request clarification or withhold approval rather than infer a positive result.

## 4. Proposed review outcomes

The operational process should be able to express these decision meanings:

1. **May proceed to activation:** Operations has completed the required physical and arrangement-specific checks and approves operational readiness. A separate authorised activation action is still required.
2. **Further information or correction required:** A material point is missing, inconsistent, or not sufficiently evidenced. The candidate remains unavailable.
3. **Not approved:** The candidate fails a required check, the operating arrangement cannot be established, or the site is not suitable for the proposed participation.

These are conceptual decision meanings only. They do not approve persisted statuses, enum values, automatic transitions, appeal procedures, or who may reverse a decision. Re-submission and re-verification must preserve the earlier submission and decision history.

## 5. Re-verification triggers — proposed

Operations should consider whether a fresh physical or documentary verification is needed when:
- the site moves or its identity/address materially changes;
- the operator, owner, partner, or operating arrangement changes;
- material restrictions or complaints call the site's suitability or authority into question;
- evidence used for the original decision is withdrawn, expires, or is found unreliable; or
- a location is proposed for reactivation after a material change or suspension.

The exact triggers, review frequency, evidence freshness rules, and authority to suspend/reactivate remain open. No periodic inspection interval is invented here.

## 6. Separation from capability, activation, and customer discovery

Passing this checklist means only that Operations may approve the candidate's operational readiness and allow it to proceed to the separately authorised activation step.

It does not automatically:
- activate the location;
- assign a staffed-station or registered-collection-centre persisted type;
- grant any service support or action capability;
- authorize a staff member or external operator to perform a platform action;
- establish route coverage, operating hours, capacity, or availability;
- satisfy any DEC-047 service/endpoint combination;
- make the location selectable by a customer; or
- authorise Google Maps or another mapping provider.

Firestore remains the intended authoritative registry under DEC-050. Google Maps Platform remains a candidate for future evaluation only. A mapping result cannot substitute for physical verification or evidence of the operating arrangement.

## 7. Bootstrap of the initial location inventory

No verified inventory exists today. Before registration can be populated at scale, the business must identify:
- the accountable Operations owner for the inventory exercise;
- the authoritative business/Operations source from which candidate sites will be identified;
- whether that source includes both VeriLyft-staffed stations and registered collection centres;
- who can attest to each candidate's operating arrangement; and
- the process for resolving duplicate, stale, disputed, or unsupported candidates.

Potential source materials may include internal operating records, approved partner/site records, or a current list maintained by the responsible business function. These are examples only, not claims that such records exist. Do not use public directories, map listings, customer drafts, or unverified recollection as the authoritative inventory.

The initial inventory should be treated as a candidate register until each site completes the DEC-050 physical verification, Operations approval, and separate activation process.

## 8. Decisions and inputs still required

| Input | Why it is needed | Current state |
|---|---|---|
| Accountable Operations position and role-holder | Accountability for the inventory, verification standard, reviewer assignment, and unresolved cases. | Position not yet assigned, as confirmed by the owner on 3 November 2026; formal business assignment required. |
| Authoritative source of candidate inventory | Establishes where the initial candidate list comes from and who maintains it. | Not identified; business/Operations input required. |
| Operating-arrangement categories and real examples | Prevents a one-size-fits-all evidence checklist from being applied to unlike arrangements. | Actual arrangements and examples not yet supplied. |
| Evidence sufficiency by arrangement | Establishes what proof is acceptable and who may accept alternatives. | Proposed categories only; Operations validation required. |
| Physical inspection and evidence-capture procedure | Makes the DEC-050 physical verification repeatable and auditable. | Method, template, and capture requirements open. |
| Re-verification, suspension, and reactivation criteria | Keeps the registry current without inventing intervals or triggers. | Open. |
| Review/appeal and correction authority | Defines how disputed or mistaken findings are handled. | Open; reconcile with DEC-043 and PM-01–PM-12. |
| Technical evidence/audit representation | Enables later source-aligned design without prematurely inventing fields or retention. | Not approved. |

## 9. Implementation gate

This checklist must be reviewed and completed with the formally assigned accountable Operations owner before it is treated as a mandatory operational procedure. The owner has confirmed that the position has not yet been assigned; therefore, operational adoption and a governed initial inventory exercise remain blocked pending that organisational assignment. The following must remain unresolved until supported by actual business evidence and owner/Operations approval:

- no assumed location inventory or source;
- no assumed named Operations owner;
- no universal legal/contractual document requirement;
- no mandatory photograph, coordinate, geocoding, or map-provider requirement;
- no invented location-kind, lifecycle status, Firestore schema, API, or permission ID;
- no default service/action capability or DEC-047 eligibility;
- no customer-facing PUDO selection; and
- no application-code implementation.

After Operations validates the checklist and inventory source, the next SDD step is to reconcile the precise authority and evidence process with DEC-043/PM-01–PM-12 and then prepare the source-aligned technical contract for owner review.
