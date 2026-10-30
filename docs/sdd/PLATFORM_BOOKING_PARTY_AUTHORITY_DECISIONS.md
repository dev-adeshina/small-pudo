# VeriLyft Booking-Party Authority — Accepted Owner Policy

**Status:** BP-01–BP-22 accepted by the owner; detailed operational and technical specification remains open.  
**Decision date:** 30 October 2026  
**Parent decisions:** DEC-023 and DEC-024  
**Related:** `DECISIONS.md`, `PLATFORM_OWNER_DECISION_REGISTER.md`, `PLATFORM_SHARED_WORKFLOWS.md`, `PLATFORM_DOMAIN_LIFECYCLES_AND_CONTRACTS.md`, `PLATFORM_CROSS_DOMAIN_ACCEPTANCE_MATRIX.md`, `PLATFORM_ACTORS_AND_RESPONSIBILITIES.md`, `ISSUES.md`, `PROGRESS.md`.

## 1. Purpose and authority

This document records the owner's accepted detailed policy direction for independent-shipment booking parties, amendment authority, cancellation, collection, transfer, delegated access, privacy, and disputes. BP-01–BP-22 refine DEC-023 and DEC-024; they do not create new top-level D-01–D-15 decisions.

The policies apply to independent shipment bookings. They do not change the separate guest-checkout rules for storefront orders. Only registered, authenticated customers may create independent shipment bookings at launch (DEC-023).

This is an owner-policy record, not an implementation specification. It does not approve collections, fields, APIs, routes, status values, permission claims, identity-verification products, notification templates, or code changes. No application-code changes are authorized until the complete platform-wide SDD is reconciled and explicitly approved.

## 2. Accepted owner policies

### BP-01 — Booking-party changes before physical intake

The authenticated booking party may initiate permitted booking changes before physical parcel intake. Every change is subject to server validation. A change affecting price or service requires an updated quote and customer acceptance. Changes to sender, receiver, or collection details require the applicable verification. Every change is recorded in booking history. Sender, receiver, and payer status alone does not grant independent booking-edit permission. After physical intake, changes use a controlled, staff-mediated process.

### BP-02 — Sender and receiver detail amendments

The booking party may request sender or receiver changes before physical intake. The affected original or replacement party must undergo appropriate verification or consent checks. Staff review is required where the change could affect identity, collection authority, security, or liability. Original details are preserved; the change record identifies the requester, requested change, verification evidence, and outcome.

### BP-03 — Booking cancellation

Before physical intake, the authenticated booking party may request cancellation. A sender, receiver, or payer cannot independently cancel merely because they are associated with the booking. Cancellation triggers the applicable payment/refund assessment but does not itself approve or complete a refund. Requests and outcomes are recorded. After physical intake, cancellation is controlled and staff-mediated.

### BP-04 — Sender or receiver requests through Support

A sender or receiver may contact Support to request a booking change but cannot directly modify the booking. Support records the request and verifies the person's identity and relationship to the booking. The authenticated booking party must authorize the change unless an approved exception applies. Any approved change remains subject to applicable verification, review, and audit requirements.

### BP-05 — Booking party unavailable

Support must not assume authority when the booking party is unavailable. Support may escalate to a designated Admin. An exception may be authorized only after review of the circumstances, available evidence, and potential impact on identity, custody, payment, or liability. The reason, authorizing person, evidence, decision, and outcome are recorded. If authorization cannot be established, existing booking details remain unchanged.

### BP-06 — Parcel collection authority

Booking-party status does not itself grant parcel collection authority. The receiver may collect after identity and collection-authority verification. The booking party may nominate another collection person, subject to verification and applicable staff review. A payer cannot collect solely because they paid. Collection authorization and actual physical handover are recorded as distinct events with supporting evidence.

### BP-07 — Receiver-nominated alternative collector

The receiver may request an alternative collection person. The request is verified against the receiver's identity and authority, and the booking party is notified. Staff review is required where the change creates a security, identity, or liability concern. The alternative collector's identity and authorization must be verified before release. Original collection details and the change history are preserved.

### BP-08 — Disagreement over collection authority

Neither the booking party nor receiver automatically overrides the other's legitimate interests. A disputed collection-authority change is placed on hold. Staff review the booking record, existing authorization, identity evidence, and relevant communications. A designated Admin may resolve the dispute under the applicable policy. The parcel must not be released until authority is established. The decision, evidence, reviewer, and outcome are recorded.

### BP-09 — Shipment notification recipients

The authenticated booking party receives booking, payment, status, and cancellation notifications. Senders and receivers receive notifications relevant to their respective roles. Payers receive payment confirmations and receipts, not unrestricted shipment information. Alternative collection persons receive only information necessary to complete the authorized collection. Sensitive shipment details are not disclosed merely because contact information appears on a booking. Notification preferences and communication consent are respected.

### BP-10 — Transfer of booking ownership

The booking party may request transfer to another authenticated customer. The proposed new booking party must explicitly accept. Identity and authorization checks are required. Financial obligations, payment history, and audit records remain intact. Transfer does not grant access to unrelated customer information. After physical intake or dispatch, transfer requires designated Admin review. The original and new booking-party identities, reason, approvals, and effective time are recorded.

### BP-11 — Financial obligations after transfer

Existing payment obligations remain attached to the booking. Transfer does not automatically make the new booking party personally liable for outstanding charges. The new booking party must explicitly accept any financial responsibility being transferred. Completed payments and refunds remain in the original financial history. Unresolved payment disputes are reviewed before transfer is finalized. Preserve who originally incurred each obligation and who later accepted responsibility.

### BP-12 — Booking-party withdrawal

The booking party may request withdrawal from that role. Withdrawal does not automatically cancel the booking or erase its history. A replacement booking party must be nominated and accept responsibility before the original party is released. Outstanding financial obligations must be resolved or explicitly accepted through an authorized transfer. If no replacement is available, Support escalates to a designated Admin for controlled review. Requests, decisions, and resulting changes are auditable.

### BP-13 — Death or legal incapacity

Support places affected ownership or authority changes on hold while the report is verified and requests appropriate documentary evidence. A designated Admin reviews the evidence and determines next steps subject to applicable law. A verified legal representative may request an ownership or authority change. Financial obligations, custody records, and payment history remain preserved. No automatic ownership transfer, cancellation, refund, or parcel release occurs solely because the situation is reported. Decisions and evidence are recorded with restricted access.

### BP-14 — Delegated shipment access

The booking party may authorize another authenticated customer to view limited shipment information and perform only separately specified actions. Access is explicit and limited to the information and actions authorized. Viewing access does not automatically permit modification, cancellation, transfer, or collection. The booking party may revoke delegated access, subject to applicable legal or operational restrictions. Grants, changes, revocations, and access-sensitive actions are auditable. Delegation must not expose unrelated customer information.

### BP-15 — Expiry of delegated access

Delegated access has an expiry date or duration and may be revoked earlier by the booking party. It normally ends when the shipment reaches its completed lifecycle state unless a legitimate operational or legal requirement requires continued access. Renewal requires explicit authorization. Grants, renewals, expiries, and revocations are recorded. The exact duration and completed-state definition remain open for specification.

### BP-16 — Delegated access is non-transferable

Delegated access is personal and non-transferable. A delegate cannot authorize another person or modify the original access permissions. Each additional person requires separate authorization from the booking party. An attempted share or transfer does not grant additional access. Authorization changes remain auditable.

### BP-17 — Compromised booking-party account

Suspected account compromise triggers a security review. Sensitive booking changes, ownership transfers, collection-authority changes, and delegated-access grants may be temporarily restricted. Support follows an established identity-recovery process before sensitive authority is restored. Shipment and financial records remain preserved. A designated Admin may authorize necessary protective measures. Restrictions, investigation, recovery decisions, and restored permissions are recorded. Security restrictions must not unnecessarily prevent essential physical custody and safety operations.

### BP-18 — Booking deletion and retention

The booking party may request deletion of a booking that has not progressed into physical intake. Deletion must not erase financial, security, legal, or audit records that must be retained. If payment occurred, financial reconciliation precedes any permitted deletion or anonymisation. After physical intake, dispatch, or delivery, customers cannot permanently delete bookings through a customer action. Where privacy obligations require removal of personal information, controlled anonymisation or restricted retention may be considered. Every request and decision is recorded.

### BP-19 — Disputing booking information

The booking party, sender, or receiver may dispute information relevant to their role. Support records the dispute without silently changing the original booking. Relevant evidence and the disputed information are preserved. A designated reviewer investigates. Corrections are recorded as amendments preserving the original value and history. Disputed information is not automatically treated as verified or accurate while under review. The person raising the dispute receives an appropriate outcome notification, subject to privacy restrictions.

### BP-20 — Dispute-resolution timeframes

Every dispute receives acknowledgement and assignment to an appropriate reviewer. Resolution targets reflect severity and operational impact. Affected parties are informed of delays. Urgent disputes involving parcel release, custody, identity, or financial exposure receive priority. Resolution targets are configurable rather than hard-coded.

### BP-21 — Appeal of a dispute decision

An affected party may appeal an outcome, identifying the disputed decision and providing additional evidence or explanation. Wherever reasonably possible, a person other than the original decision-maker reviews the appeal. The original decision and evidence remain preserved. The appeal outcome, reviewer, reasons, and resulting amendments are recorded. Urgent custody or parcel-release restrictions remain in effect until the appeal is resolved or an authorized reviewer determines otherwise.

### BP-22 — Further review after an appeal

A normal appeal receives one independent review. Further review is permitted only where there is significant new evidence, a procedural failure, or a material error in the previous decision. A designated Admin who was not involved in earlier decisions must authorize further review. Repeated appeals without new grounds do not automatically restart the process. All further-review decisions are documented.

## 3. Consolidated authority boundaries

| Person / relationship | Accepted authority boundary |
|---|---|
| Authenticated booking party | Initiates permitted pre-intake changes, cancellation, transfer, withdrawal, collector nomination, and delegated-access grants; does not automatically override receiver rights or collection safeguards. |
| Sender | May raise a relevant request or dispute through Support; no direct booking-edit or cancellation authority from sender status alone. |
| Receiver | May raise a relevant request or dispute; may request an alternative collector subject to verification and review; may collect only after authority verification. |
| Payer | Receives payment confirmation/receipt information by default; payment alone grants neither full shipment access nor collection/cancellation/edit authority. |
| Alternative collector | Receives only information needed for the authorized collection; identity and authorization must be verified before parcel release. |
| Support | Records and verifies requests, acknowledges and routes disputes, and escalates sensitive/exceptional cases; does not assume booking-party authority. |
| Designated Admin / reviewer | Reviews specified exceptions, sensitive changes, disputes, and appeals within explicitly assigned authority; decisions and evidence are recorded. |
| Delegated customer | Receives only explicitly granted, time-limited, non-transferable access; cannot sub-delegate or expand permissions. |
| Verified legal representative | May request an appropriate change after documentary verification and designated Admin review, subject to applicable law. |

## 4. Remaining specification dependencies

Accepted policy does not yet define all operational or technical parameters. The SDD must still resolve and reconcile:

1. Identity, contact, consent, and collection-verification methods and the checkpoints at which each applies.
2. The complete change-type matrix, including which changes are customer self-service, which require Support handling, and which require staff/Admin review.
3. The precise lifecycle gate for booking acceptance, quote acceptance, physical intake, dispatch, completion, cancellation, and any post-dispatch amendment.
4. The evidence standard and exception authority when the booking party is unavailable, deceased, legally incapacitated, or has a compromised account.
5. Transfer and withdrawal procedure, including financial-responsibility acceptance, existing disputes, and the exact point at which the original party is released.
6. The information/action catalogue for delegated access, expiry duration, renewal, revocation exceptions, and post-completion legal/operational access.
7. The deletion/anonymisation and retention schedule, financial reconciliation prerequisites, and legal-hold interaction under DEC-033.
8. Notification event, recipient, field, channel, consent, and failure-handling matrix under DEC-034.
9. Dispute severity categories, configurable acknowledgement/resolution targets, reviewer eligibility, appeal submission windows, independence rules, escalation, and final decision authority.
10. Acceptance scenarios, negative authorization tests, concurrency/replay behaviour, evidence requirements, and source/runtime verification.

Do not invent numeric timeframes, identity methods, legal conclusions, retention periods, status enums, schemas, permission claims, or endpoints while resolving these dependencies.

## 5. Status and implementation gate

- BP-01–BP-22: **Accepted by owner at policy level**.
- DEC-023/DEC-024 detailed booking-party policy direction: **Agreed**.
- Detailed operational procedures and technical contracts: **Open**.
- Source reconciliation and runtime acceptance evidence: **Open**.
- Complete platform-wide SDD: **Not yet approved**.
- Application-code implementation: **Not authorized**.

This record is documentation of accepted policy only. It is not evidence that the described functionality exists, has been tested, or is production-ready.
