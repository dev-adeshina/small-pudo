# VeriLyft Production Readiness and Operational Evidence Contract

**Status:** Technical/operational contract support for Review 3; not an approved deployment topology, operational service level, runbook implementation, or release authorization  
**Prepared:** 31 October 2026  
**Documentation baseline:** PR #74 merge commit `804f51d56def5a6dc6ba9518464886333b9be43a`  
**Application-source inspection baseline:** `e0f69055d33dd9399c23e1d793f359468229c856`  
**Related:** `PLATFORM_TECHNICAL_CONTRACT_RECONCILIATION.md`, `PLATFORM_P0_TEST_SPECIFICATION_READINESS.md`, `PLATFORM_P0_ACCEPTANCE_EVIDENCE_CATALOGUE.md`, `PLATFORM_MUTATION_AUTHORIZATION_AND_RECOVERY_MATRIX.md`, `PLATFORM_LIFECYCLE_EVENT_AND_STATE_CONTRACT_MATRIX.md`, `DECISIONS.md`

## 1. Purpose and boundaries

This contract turns the accepted DEC-036 production-readiness direction and the existing A-20 scenarios into a traceable set of operational control objectives, ownership responsibilities, evidence requirements, failure dispositions, and release gates.

It is intended to prevent production readiness from being inferred from a successful build, a source-code feature, a deployment notification, or a one-time smoke check. Readiness is a separately evidenced operational property.

This document:
- defines the minimum control domains that must be addressed before production launch and continued operation;
- maps each control to accountable responsibility areas and reproducible evidence;
- distinguishes configuration, deployment, runtime operation, recovery and release approval;
- identifies failure conditions that block release or require containment;
- preserves conditional-feature gates and existing P0 acceptance requirements.

It does **not** approve a cloud topology, hosting/provider choice, monitoring product, backup technology, deployment pipeline, incident platform, numerical service level, backup interval, recovery time objective (RTO), recovery point objective (RPO), retention duration, alert threshold, staffing roster, or named individual. It does not create a new service, portal, collection, field, API, or implementation architecture. Reuse the existing Next.js App Router, Firebase Authentication/Firestore/Firebase Admin, Paystack and Cloudinary boundaries where suitable; prove a gap before proposing an extension.

The active application-source inspection baseline remains the commit recorded above. This document does not claim fresh source inspection, runtime tests, deployed configuration verification, production-data review, provider-dashboard review, or operational exercises.

## 2. Readiness vocabulary

| Term | Meaning | Insufficient substitute |
|---|---|---|
| Control objective | A required security, reliability or operational outcome | A tool or product name |
| Configuration baseline | Approved, environment-specific settings and versions needed to reproduce a deployment | A developer's local environment |
| Deployment evidence | A traceable record of what artifact/configuration was deployed, by whom/what authority, and with what result | A green build alone |
| Smoke check | A bounded post-deployment check of critical user and integration paths | Full acceptance or production-readiness evidence |
| Operational signal | A metric, log, trace, provider result or business-state indicator used to detect a condition | An uncorrelated log line or screenshot |
| Incident | An event that materially threatens confidentiality, integrity, availability, financial correctness, physical custody, or customer trust | Every transient error |
| Recovery | A controlled restoration/reconciliation that returns service and records to an approved state | Blind retry or manual status editing |
| Restore verification | Evidence that restored data is complete, internally consistent and usable for the intended recovery scope | A successful backup job |
| Release gate | A required condition that must be evidenced before release or feature activation | An informal assurance |
| Exception | A documented, authorized deviation with scope, owner, reason, expiry/review and evidence | An undocumented bypass |

A control may be technically present but operationally unverified. A test may pass in staging while production configuration remains wrong. A provider may report success while local persistence is unknown. The evidence must identify which environment and boundary it proves.

## 3. Operational control and evidence matrix

The table is normative at the control-objective level. Owners are responsibility areas, not named people; the owner register must assign named accountable parties before launch.

| Control domain | Required control objective | Accountable responsibility areas | Minimum evidence to retain | Failure / release disposition |
|---|---|---|---|---|
| Environment separation | Development, test/staging and production contexts are distinguishable; test data and credentials cannot silently cross into production; production access is restricted and attributable. | Technical owner; Security/Admin; Operations | Environment inventory; approved configuration baseline; access review; evidence that test fixtures and provider sandbox settings are isolated. | Block release if environment identity, data boundary or access cannot be established. |
| Configuration inventory | Every required runtime setting, integration endpoint, callback/webhook setting, Firebase project/rules/index version and feature gate is inventoried by environment, with an owner and validation method. | Technical owner; integration owners; Security/Admin | Versioned redacted configuration manifest; automated validation results; deployed-version comparison; documented owner for each setting. | Missing, invalid, unexpected or cross-environment configuration must fail safely; do not report dependent operations as successful. |
| Secret management | Credentials are server-side, least-privilege, access-controlled, reviewable, rotatable/revocable and excluded from client bundles, logs, screenshots and ordinary evidence exports. Exposure has a containment and rotation response. | Security/Admin; Technical owner; integration owners | Secret inventory by purpose/owner (never secret values); access review; rotation/revocation record; redacted leak-response exercise or incident record. | Any suspected exposed credential triggers containment and review; release is blocked while privileged exposure or uncontrolled secret access remains unresolved. |
| Identity and privilege | Production administrative and service identities have only required authority; privileged actions are attributable; staff action permissions, location capability and independent approvals remain separate as accepted. | Security/Admin; Operations; relevant domain owner | Deployed authorization/rules verification; privileged identity inventory; permission assignment/revocation evidence; denied-action tests; independent-approval evidence where required. | Authentication alone or broad Admin status cannot substitute for action authority. Critical authorization bypass blocks release. |
| Data and rules integrity | Deployed Firestore rules, indexes, Admin SDK privilege boundaries and relevant data/configuration versions match the approved release baseline. Server-side trust boundaries are tested directly. | Technical owner; Security/Admin | Rules/index deployment version; automated rules/security results; direct API denial tests; controlled data-integrity checks. | Unknown deployed rules/configuration or a material unauthorized read/write path blocks release. |
| Provider readiness | Each enabled provider integration has environment-specific credentials/configuration, callback verification, reference/purpose/amount checks where applicable, failure handling and a reconciliation owner. | Integration owner; Finance for financial providers; Technical owner | Provider sandbox evidence; callback/signature verification; configuration comparison; provider/local reconciliation examples; owner-approved production enablement record. | Provider/local unknown outcomes remain unresolved until authoritative reconciliation; never repeat a charge/refund or physical instruction blindly. |
| Deployment and release | A release is traceable to an approved source revision and artifact; required configuration/rules are checked; deployment is authorized; smoke checks run; rollback/containment is prepared and its limits are understood. | Technical/release owner; Security/Admin; Operations | Source commit and artifact identity; approval record; deployment result; configuration/rules manifest; smoke-check report; rollback plan and result from a controlled exercise. | Failed deployment or smoke check blocks promotion. A rollback that cannot safely reverse data effects must use a documented forward-recovery/reconciliation plan. |
| Application and integration observability | Critical errors, authentication denials, payment divergence, webhook failures, stuck lifecycle work, notification failures, upload failures and sensitive evidence access can be detected and correlated without logging secrets or unnecessary personal data. | Technical owner; Security/Admin; integration/domain owners | Signal catalogue; redacted sample logs/metrics/traces; correlation example across request/business record/provider result; access controls for operational telemetry. | Unobservable critical financial, authorization or custody paths block release; persistent blind spots require explicit risk disposition and owner approval. |
| Alerting and escalation | Each actionable alert has severity, accountable responder, escalation path, acknowledgement/containment expectation and closure evidence. Thresholds are set by owners from service/risk context, not invented in this matrix. | Technical/Operations owner; Security; Finance for financial alerts | Alert-to-owner register; test alert delivery; escalation exercise; incident/ticket record demonstrating acknowledgement and closure. | Unowned critical alerts or an untested escalation route block launch for the affected capability. |
| Backup and recovery | Required business records, configuration and recovery dependencies are within an approved backup/export and restoration plan; backup success and restore usability are separately verified. | Technical owner; Data owner; Finance/Operations for domain validation | Scope/inventory; backup job/result; protected backup access; isolated restore log; integrity/relationship checks; reconciliation against authoritative sources; signed restore review. | A backup without a successful isolated restore and domain validation is not proof of recoverability. Critical unrecoverable data loss risk blocks release. |
| Incident response | Security, availability, financial divergence, data integrity and physical custody incidents have triage, containment, preservation, communication, recovery and review responsibilities. | Incident lead; Technical; Security/Admin; Operations; Finance/Support as relevant | Incident classification and contact/escalation register; response runbook; exercise timeline; preserved evidence; recovery decision; post-incident review and tracked corrective actions. | Uncontained compromise, unresolved financial divergence or unaccounted physical custody blocks affected operations; do not erase or overwrite incident evidence. |
| Operational continuity/manual fallback | Where physical work must continue during a system outage, an approved bounded fallback preserves identity, authority, actual event time, actor/receiver, location, evidence, sequence and later reconciliation. | Operations; location owner; Security/Admin; Technical owner | Approved fallback procedure; controlled offline record sample; reconciliation evidence; duplicate/conflict handling; review of unresolved records. | Manual fallback must not bypass custody proof, booking-party authority, location capability, staff permission, payment/dispatch holds or evidence preservation. If safe fallback is unavailable, suspend the affected operation. |
| Customer and stakeholder communication | Incident and service communications are accurate, authorized, privacy-minimized and distinguish confirmed facts from unknown outcomes. | Support; Communications/Operations; relevant domain owner; Security for disclosures | Approved message/recipient matrix; incident communication record; redaction/privacy review; evidence that uncertain provider or physical outcomes are not represented as confirmed. | Do not disclose another party's data or claim payment, custody or delivery success without authoritative evidence. |
| Operational dashboard and reporting | Minimum P0 operational metrics have defined meaning, source, calculation, freshness, access scope and unavailable/stale indication; orders, shipments, payments, refunds and movements are not conflated. | Operations; Finance for financial measures; Technical owner; Management for oversight | Metric dictionary; source lineage; calculation checks against controlled records; stale/unavailable tests; role-visibility tests. | Demo, stale, ambiguous or double-counted metrics cannot be presented as operational truth; block the affected P0 reporting claim. |
| Audit and evidence readiness | Consequential actions and access/disclosure events are attributable; originals and corrections remain distinguishable; view/export/disclosure permissions and legal holds follow DEC-033/PM-08. | Security/Compliance; domain owners; designated reviewers | Event/evidence coverage map; access/export/disclosure tests; correction-history sample; hold/release authorization and preservation evidence. | Admin status alone grants no blanket access. Missing evidence integrity or unauthorized disclosure is a release blocker for affected workflows. |
| Feature activation and conditional controls | Each Conditional P0 trigger is explicitly identified; either the feature is disabled and its disabled state verified, or all trigger-specific acceptance and operational evidence passes before enablement. | Product owner; Technical owner; Operations; relevant policy owner | Trigger register; deployed feature/config state; negative pre-activation test; passing activation evidence and approval. | A disabled trigger is not a passed requirement. Unverified conditional capability remains disabled. |

## 4. Environment and configuration contract

The release record must distinguish at least the environments actually used by the project (for example, development, isolated test/staging and production); this document does not mandate that a particular number or hosting arrangement be created.

For each environment, record:
- purpose and permitted data classification;
- source revision/artifact identity;
- Firebase project and deployed rules/index baseline;
- server-side integration/provider mode and callback destinations;
- required configuration keys by name/purpose, never their values;
- secret owner, access boundary and rotation/revocation procedure;
- enabled feature/conditional-trigger state;
- deployment identity and approval;
- validation/smoke-check evidence and known deviations.

Test and staging must use synthetic or specifically approved non-production data and provider sandbox/test modes. Production credentials and real customer/payment/parcel data must not be copied into ordinary test fixtures. A production exercise requires its own explicit scope, authority, customer/data safeguards and evidence plan.

Configuration validation must fail closed for missing or invalid critical settings. Error output may identify the missing setting by safe name, but must not reveal secret values, tokens, signatures or credential-bearing URLs. A client-side feature flag or hidden UI element is not an authorization boundary; server-side checks remain authoritative.

## 5. Deployment, change and rollback contract

A production release package must identify:
1. approved source revision and immutable build/artifact identity;
2. release owner and approval;
3. dependency/build result and security review appropriate to the change;
4. environment-specific configuration manifest and secret references;
5. Firebase rules/index version and verification result where relevant;
6. provider integration mode and callback/webhook verification;
7. pre-release data/configuration compatibility assessment;
8. post-deployment smoke checks for critical customer, Admin, payment and enabled operational paths;
9. monitoring/alert coverage and named responders;
10. rollback or forward-recovery procedure, including data effects that cannot safely be reversed;
11. release decision, outstanding risks and evidence links.

A rollback is not automatically safe merely because an earlier application artifact can be redeployed. If a release has created or transformed business records, external provider effects, financial events, custody facts or customer communications, the recovery plan must state how those effects are preserved and reconciled. Do not delete or rewrite authoritative history to make a rollback appear clean.

Any emergency change must be attributable, limited to the necessary scope, reviewed after containment and linked to a corrective follow-up. It does not waive the accepted separation-of-duty, audit, customer privacy or evidence requirements.

## 6. Observability, alerting and operational ownership

The signal catalogue must be derived from the enabled business capabilities and risk. At minimum, assess:
- service availability and application/runtime errors;
- authentication failures and privileged authorization denials;
- repeated or abnormal privileged actions;
- payment initialization/verification/webhook divergence and unknown outcomes;
- stock/order consistency failures for the storefront;
- stuck or contradictory booking, intake, custody, movement and delivery work when those capabilities are enabled;
- provider callback delays/failures and reconciliation backlog;
- image upload/provider errors;
- notification attempt/failure and duplicate-send protection;
- backup failures and restore-test outcomes;
- audit/evidence access, export, disclosure, correction and retention/hold failures.

Each signal definition must identify its source, business meaning, environment, correlation method, sensitivity, access scope, freshness, responder and escalation. Correlation identifiers must not themselves contain credentials or unnecessary personal data. Logs are diagnostic evidence; they do not independently prove payment settlement, physical receipt, custody transfer or delivery.

Do not invent universal alert thresholds or response times. The responsible owner must set them from service criticality, provider behaviour, legal/financial obligations and actual operating capacity, then record the approved value and rationale in the authoritative owner register/runbook.

## 7. Backup, restore and data reconciliation

The backup/restore plan must identify:
- authoritative data and configuration in scope, including relevant Firestore data, security/rules/configuration artifacts and required operational metadata;
- dependencies that cannot be recovered from a database backup alone, including provider-side payment/settlement records and external evidence;
- backup/export mechanism, protection, access, integrity verification and accountable owner;
- approved backup interval and retention, once decided by the responsible owner;
- isolated restore target and protection against overwriting production;
- record counts, key relationships, integrity constraints and representative business workflows to validate after restore;
- reconciliation with external authoritative sources where local and provider facts can diverge;
- recovery objectives and the evidence required to demonstrate them;
- restore-test result, reviewer and corrective actions.

A successful backup job proves only that the job reported success. It does not prove the data can be restored, that relationships remain consistent, or that external financial/provider state matches. A restore exercise must be isolated, repeatable, reviewed and must not overwrite production. Any recovery that produces an uncertain financial, custody or delivery position must remain in controlled reconciliation rather than being silently marked complete.

No backup frequency, retention duration, RTO or RPO is approved by this document.

## 8. Incident response and continuity

The incident procedure must support, at minimum, these incident families:
- suspected credential or privileged-access compromise;
- unauthorized data access/disclosure or evidence tampering;
- application, database/rules or hosting outage;
- payment/provider divergence, duplicate effect or unknown financial outcome;
- loss/corruption of business records or failed restore;
- physical parcel/custody discrepancy, failed handover or unsafe location operation;
- provider outage affecting uploads, communications or another enabled service;
- failed release, rollback failure or incompatible data/configuration change.

For each family, define detection/source, initial severity, accountable incident lead, containment authority, evidence-preservation steps, affected capability suspension criteria, customer/partner communication owner, recovery/reconciliation owner, escalation and post-incident review.

The runbook must distinguish:
- containment from resolution;
- service restoration from data/financial reconciliation;
- a reported physical event from a verified physical fact;
- a customer communication from a business-state transition;
- a temporary exception from a permanent policy change.

Manual/offline operation is permitted only where an approved procedure defines the scope and evidence. It must preserve actual occurrence time separately from capture time, actor and receiver attribution, location, target, source, sequence and reason. On restoration, records must be reconciled for duplicates, conflicts and late/out-of-order events under the lifecycle contract. If the evidence or authority is insufficient, preserve the last confirmed state and hold the affected operation.

## 9. Provider-specific unknown outcomes

For every external integration, the owner must document the authoritative source of truth, reference/identity checks, event authenticity, duplicate/replay scope, timeout/unknown outcome treatment, reconciliation route, safe retry conditions and customer communication.

For payment operations, a timeout or missing callback is not proof of failure. Verify against the authoritative provider record and local financial record before any retry or settlement decision. Refund request, approval, provider execution and confirmed financial result remain separate. Never blindly repeat a charge or refund.

For notifications, a send attempt/provider acceptance is not proof that a recipient read or acted on the message. A retry must not create misleading duplicate instructions or disclose fields to an unauthorized recipient.

For image/object storage, an upload failure or ambiguous result must not create a public record pointing to an unverified object. Verify the stored object and access policy before treating the upload as complete.

For any future mapping, routing, courier or other operational provider, distinguish proposal/estimate from assignment, physical movement, handover and delivery. A provider response is not proof of physical possession.

## 10. Release and feature-activation gates

A production release is eligible for approval only when all applicable conditions are evidenced:

1. Every P0 requirement has an approved specification, a passing acceptance result, a named owner and traceable evidence.
2. Every triggered Conditional P0 requirement has passing evidence before activation. A disabled trigger is explicitly recorded and independently verified as disabled; this is not a pass.
3. No unresolved P0 blocker, critical authorization defect, material data-integrity defect, uncontained security incident or unknown financial/custody outcome is being represented as resolved.
4. The deployed configuration, rules/indexes, provider settings and secret references match the approved environment baseline.
5. Critical smoke checks pass in the target environment, with known limitations recorded.
6. Monitoring, alert ownership, escalation and incident communication are operational for the enabled capabilities.
7. Backup/restore has been exercised and independently reviewed against the approved recovery objectives.
8. Rollback or forward-recovery has a tested, data-aware procedure.
9. Support, Operations, Finance, Security and Technical owners have reviewed the evidence relevant to their responsibility.
10. The release owner records an explicit go/no-go decision, unresolved risks, exceptions, evidence links and any capability that remains disabled.

No informal waiver can convert an unresolved P0 into a pass. Any exception must have a policy-authorized decision-maker, narrow scope, reason, compensating controls, review/expiry condition and attributable evidence. Where accepted policy says an unresolved P0 blocks launch, this matrix does not create an override.

## 11. Ownership and decision register inputs

The final SDD owner register must assign named accountable roles/individuals and deputies for:
- technical service and release ownership;
- environment/configuration and secret management;
- Firebase rules/data integrity and recovery;
- each external provider integration;
- application monitoring and alert response;
- security/privacy incident response and evidence preservation;
- Finance reconciliation and payment/refund incidents;
- Operations/location continuity, custody and physical exceptions;
- Support/customer communication;
- backup/restore review and release go/no-go authority.

Where one person holds multiple responsibilities, separation-of-duty rules still apply: a requester must not approve their own consequential action; the independent reviewer must be eligible and separately authorized. The role catalogue and approval thresholds remain governed by accepted PM/DEC policies and unresolved owner decisions.

## 12. Open operational decisions — do not default

| Decision input | Required accountable owner | Why it remains open |
|---|---|---|
| Exact environment topology and permitted data classifications | Technical + Security | Must fit actual hosting, provider and privacy constraints |
| Configuration key inventory and secret-management mechanism | Technical + Security | Depends on deployment platform and least-privilege design |
| Monitoring/telemetry products, signal thresholds and retention | Technical + Operations + Security | Must be selected from real operating capacity and risk |
| Alert severity, response/acknowledgement and escalation targets | Operations + Technical + Security/Finance as relevant | No approved service levels or staffing model supplied |
| Backup scope, interval, retention and restore responsibilities | Technical + data/domain owners | Must reflect data loss tolerance, provider limits and cost |
| RTO/RPO and acceptable degraded operation | Business owner + Technical + Operations | Requires explicit business impact and feasibility assessment |
| Incident severity definitions, incident lead and communications targets | Operations + Security + Support | Requires named ownership and capacity |
| Manual/offline operation scope and reconciliation deadlines | Operations + Security + relevant domain owners | Physical operations and evidence procedures are service-specific |
| Production release approvers and emergency-change authority | Product/business owner + Technical + Security | Must align with accepted separation-of-duty policy |
| Provider production enablement and reconciliation cadence | Integration owner; Finance for financial providers | Provider-specific contracts and operating obligations differ |
| Dashboard metric definitions, freshness and availability expectations | Operations + Finance + Management | Existing demo metrics are not an approved metric dictionary |

These inputs must be resolved in the relevant authoritative policy/owner documents. This matrix records the required decision and evidence boundary; it does not assign a numeric default.

## 13. Mapping to existing acceptance cases

| Existing case / requirement | Operational contract coverage | Required evidence emphasis |
|---|---|---|
| A20-01 — invalid/missing configuration | Sections 4–5 | Safe startup/integration failure; no client/log secret leakage; configuration validation |
| A20-02 — release candidate verification | Sections 4–6 and 10 | Artifact/configuration/rules/provider baseline; authorization and critical-path smoke checks |
| A20-03 — backup and restore | Section 7 | Backup result plus isolated restore, integrity/relationship checks and external reconciliation |
| A20-04 — incident and rollback | Sections 5 and 8 | Alert, escalation, containment, communication, data-aware rollback/forward recovery and incident timeline |
| A20-05 — final release sign-off | Sections 10–12 | Requirement/evidence matrix, conditional trigger state, owner review, blocker register and go/no-go decision |
| A-18 / ADM-R41–R42 — operational dashboard | Section 6 | Metric dictionary, source lineage, freshness/staleness, permission-aware views and reproducibility |
| A-14 / ADM-R54 — notifications | Sections 6 and 9 | Recipient/channel authorization, delivery-attempt semantics, duplicate protection and failure ownership |
| A-16 / ADM-R46–R51 — audit/evidence | Sections 6, 8 and 10 | Attribution, restricted access, correction integrity, retention/hold and disclosure controls |
| A-07/A-08 / ADM-R15–R20 — payment/financial events | Sections 6–9 | Provider/local correlation, unknown-outcome reconciliation, duplicate-effect prevention and Finance ownership |
| A-09–A-13 — physical operations when enabled | Sections 6 and 8–10 | Location/staff authority, physical proof, last-confirmed custody, offline capture and reconciliation |

This mapping adds no case IDs and changes no priority. The existing 80-case catalogue remains scenario design until separately approved executable specifications and actual test evidence exist.

## 14. Review 3 and release-gate status

This document contributes an operational control contract to the consolidated Review 3 package. It does not complete Review 3 by itself.

- Reviews 1 and 2 of 5 remain approved.
- Review 3 remains in preparation until technical, domain, identity, lifecycle, mutation/recovery, evidence and operational contracts are reconciled together.
- Reviews 4 and 5 remain future consolidated approval gates.
- The complete SDD remains unapproved.
- No application code, schema, API, Firebase rules, configuration, deployment, provider enablement or operational process implementation is authorized by this document.
- Application implementation remains frozen until explicit Review 5 approval of the complete reconciled SDD.
