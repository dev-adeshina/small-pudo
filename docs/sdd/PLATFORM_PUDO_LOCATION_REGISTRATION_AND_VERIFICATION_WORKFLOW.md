> **8 November 2026 owner-approved PUDO-2 addendum:** The physical inspection and evidence baseline is now approved. Operations must conduct an in-person physical inspection; record verifier, site, date/time, findings, discrepancies/limitations, evidence reviewed, and reasoned outcome; assess evidence according to the actual operating arrangement; and withhold approval where evidence is insufficient or conflicting. No universal document list, mandatory photograph, or retention duration is imposed. An Operations Owner role is approved initially for one person, but no named role-holder is assigned. See `PLATFORM_PUDO2_VERIFICATION_AND_OPERATIONS_APPROVAL_CONTRACT.md`. This addendum supersedes earlier statements below that PUDO-2 inspection procedure and evidence sufficiency await owner validation. Technical representation and implementation remain separate work.

> **7 November 2026 update — DEC-051 to DEC-053:** The business owner is now the accountable top organisational authority for PUDO inventory and governance. Staff may register candidate locations individually through the form when assigned that activity; the registry is populated incrementally rather than by assumed bulk import. Every submitted candidate must include attributable geographic coordinates. The platform-wide staff delegation policy is recorded in DEC-052. This update supersedes the earlier statements in this workflow that the accountable owner and inventory bootstrap approach were still unassigned. The verification evidence sufficiency and retention details remain open and must not be invented. See `PLATFORM_PUDO_FINAL_IMPLEMENTATION_READINESS.md` for the consolidated technical proposal.

# PUDO Location Registration, Verification, Approval, and Activation Workflow

**Status:** Owner-approved operational responsibility workflow (3 November 2026). The workflow does not approve a physical data schema, status enum, API, permission identifier, evidence-retention period, location inventory, service/location/action assignment, map provider, or application implementation.

**Related policy:** DEC-018, DEC-025, DEC-043, DEC-047, and owner-approved DEC-050 in `DECISIONS.md`.  
**Related design:** `PLATFORM_PUDO_LOCATION_REGISTRY_AND_CAPABILITY_FOUNDATION.md`.

## 1. Purpose and current starting point

VeriLyft needs an authoritative registry of real PUDO locations before the Shipper Portal can safely offer PUDO endpoints.

There is currently **no verified operational PUDO location inventory**. The first registry population must therefore begin with a controlled location-identification and verification exercise. Existing free-text shipment-draft addresses are not a location inventory and must not be promoted into verified PUDO records.

This workflow establishes who may register, verify, approve, and activate a location. It is a business/operational workflow, not a physical database or UI specification.

## 2. Owner-approved responsibility split

The following responsibilities are distinct and must not be collapsed into one unreviewed action:

| Stage | Responsible authority | Responsibility | Boundary |
|---|---|---|---|
| Registration | Admin or explicitly designated registration staff | Submit a proposed PUDO location and identify the source of the information. | Submission does not prove physical existence, operational readiness, or eligibility. |
| Physical and operational verification | Operations | Verify the actual location, address, operating arrangement, and relevant supporting evidence. | A submitted record, map result, photograph, or address match alone does not constitute Operations approval. |
| Operational approval | Operations | Decide whether the verified location is operationally ready to be activated, or whether further information/correction is required. | Approval is not activation and does not grant every service or action capability. |
| Activation | A separately authorised staff member | Perform activation only after the required Operations approval is recorded. | The actor must hold separately assigned activation authority; an Admin claim or general staff access does not implicitly grant it. |

The registration actor, Operations verifier/approver, and activation actor must be attributable. The system must preserve the distinction between the person who submitted the location, the person who physically verified it, the Operations decision-maker, and the person who activated it. Separation-of-duties enforcement and exact permission grants must be reconciled with PM-01–PM-12 and DEC-043 before implementation; this workflow does not invent permission IDs or assign named individuals.

## 3. Registration and initial inventory bootstrap

Because no verified inventory exists, the initial population is an explicit operational bootstrap exercise:

1. Designated registration staff identify candidate staffed stations and registered collection centres from an accountable business/operations source.
2. Each candidate is submitted as a proposed location, with the source of the information and enough identifying detail for Operations to find and verify the physical site.
3. The candidate remains unverified and unavailable for customer selection and operational work while review is pending.
4. Operations verifies the candidate in the real world and records the evidence and decision through the approved operational process.
5. Only locations that complete verification, Operations approval, and separately authorised activation may become active registry entries.

Do not invent a location list, treat a web search/map result as proof of an operating PUDO centre, or assume that a historical address, partner name, shop listing, or draft shipment address is an authorised location. The actual inventory, source records, accountable Operations owner, and verification schedule remain to be supplied.

## 4. Verification and approval

Operations must verify, at minimum, the owner-approved subjects:

- that the physical location exists;
- that its address and identifying details correspond to the actual site;
- that the stated operating arrangement is real and understood; and
- that relevant supporting evidence has been reviewed.

The particular evidence types, evidence sufficiency criteria, site-visit method, verification checklist, reviewer scope, and retention period are not fixed by this workflow. Operations must define them from the actual operating arrangements before technical implementation. Do not silently require or accept specific legal documents, photographs, coordinates, contracts, opening hours, or other evidence not yet approved.

Operations records one of the following decision meanings in the operational process: approval to proceed to activation, rejection, or a request for additional information/correction. These are conceptual outcomes only; no persisted status vocabulary or enum is approved here.

## 5. Activation and capability boundaries

Activation is a separate action performed by a staff member with explicitly assigned activation authority after Operations approval.

Activation means only that the location is active in the authoritative registry. It does **not** automatically:

- support Standard, Express, or Scheduled service;
- support any particular endpoint pattern;
- have outgoing intake, walk-in intake, measurement, custody acceptance, payment, collection/release, or custody-handover capability;
- authorize any individual staff member to perform those actions;
- prove route coverage, operating availability, capacity, or DEC-047 eligibility; or
- make the location selectable for every customer journey.

Service support, action capability, actor permission, and DEC-047 journey eligibility remain independent gates. Each must be explicitly configured and evidenced under DEC-025/DEC-043/DEC-047. Unverified service/location/action combinations remain unavailable.

## 6. Changes, suspension, and in-flight work

Material location-detail changes, changes to the operating arrangement, deactivation, reactivation, and capability changes must follow separately authorised and auditable actions. The precise edit/approval matrix remains subject to the existing DEC-043 configuration-authority design.

If a location becomes unavailable, unsafe, inaccurate, or no longer authorised:

- prevent new dependent work where the applicable authority requires it;
- preserve the location's history and the reason/evidence for the change;
- identify and resolve existing bookings, parcels, and custody responsibilities through the relevant Operations process; and
- do not erase, abandon, or silently transfer in-flight custody.

Reactivation requires the relevant verification and approval to be current. A prior approval must not be assumed to cover a materially changed site or operating arrangement.

## 7. Auditability and correction

The workflow must allow the organisation to reconstruct who registered the candidate, who verified it, who made the Operations decision, who activated or deactivated it, when each action occurred, what changed, and the supporting reason/evidence and approval.

Corrections must preserve the original record and its history. A correction to an address or administrative detail is not evidence of a physical move, custody transfer, or approval. Audit retention, correction authority, and evidence storage remain technical/policy decisions to be specified.

## 8. Mapping and geographic services

Firestore remains the authoritative source for registered PUDO identity, verification, approval, activation, and explicitly configured capabilities.

Google Maps Platform is a **candidate for future evaluation**, not a selected or approved provider. No Google Maps API, billing arrangement, geocoding, map display, device geolocation, proximity ranking, coordinate source, route service, or provider integration is authorised by this workflow.

If a mapping provider is approved later, it may support address search, map presentation, or geographic assistance. It must not determine whether a PUDO location is genuine, verified, approved, active, authorised, capable, or eligible. Those decisions remain grounded in VeriLyft's authoritative records and Operations evidence. Provider selection must separately consider product need, technical fit, privacy, terms, cost, API-key security, and operational ownership.

## 9. Explicit exclusions and unresolved inputs

This workflow does not approve:

- a location inventory or named Operations owner;
- a physical Firestore schema, collection/document/field names, status enums, indexes, API routes, or UI;
- permission IDs, named staff, or automatic role-based activation;
- the exact location-kind representation for staffed stations versus registered collection centres;
- a mandatory document/evidence checklist or retention period;
- service/location/action capability assignments or any DEC-047 eligibility outcome;
- customer PUDO selection or proximity discovery;
- Google Maps or any other map/geocoding/geolocation provider; or
- application-code implementation.

## 10. Readiness conditions for the next technical design

Before registry implementation is proposed, the next SDD slice must:

1. identify the accountable Operations owner and source of the initial candidate inventory;
2. define the practical verification checklist and evidence sufficiency for the real operating arrangements;
3. reconcile registration, verification, Operations approval, activation, edit, suspension, and reactivation authorities with DEC-043 and PM-01–PM-12;
4. settle the minimum authoritative location identity and the staffed-station/registered-collection-centre representation;
5. define auditable decision/correction expectations without inventing retention or technical fields; and
6. preserve independent service support, action capability, actor permission, and DEC-047 eligibility gates.

Until those inputs are resolved, no location registry implementation or customer-facing PUDO selection is authorised by this workflow.
