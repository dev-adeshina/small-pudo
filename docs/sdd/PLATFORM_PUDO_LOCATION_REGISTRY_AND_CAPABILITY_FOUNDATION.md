# PUDO Location Registry, Capability, and Shipper Discovery Foundation

**Status:** Technical-design proposal for owner review. This document translates accepted DEC-018, DEC-025, DEC-038, DEC-043, DEC-046, and DEC-047 policy into a bounded location-foundation design. It does not approve a physical schema, API, permission catalogue, provider, service/location assignment, or application implementation.

**Prepared:** 3 November 2026  
**Repository baseline:** PR #125 merge `e7966332024fd38eb7cb5b8a1adebc0b584ac894`  
**Working branch:** `docs/shipper-location-capability-foundation`

## 1. Purpose

The Shipper Portal needs a trustworthy source of registered PUDO locations before it can offer customers a PUDO-centre selector. The current shipment-draft origin and destination values are free-text preparation details. They are not stable location identities and must not be treated as verified centres, service eligibility, route instructions, or operational authority.

This proposal defines the responsibilities and decision boundaries for establishing that source while preserving the lean launch scope. It is deliberately a design proposal: the relevant owner decisions accept high-level policy but leave detailed service/location mapping, configuration authority, technical representation, and evidence open.

## 2. Accepted policy this design must preserve

### 2.1 Lean location record

DEC-025 accepts a minimal location record containing:
- name;
- address;
- active status; and
- explicitly configured capabilities.

DEC-018 distinguishes staffed stations from registered collection centres. The exact representation of that distinction is not approved by the decisions above and must not be silently invented as a persisted field or enum.

### 2.2 Service support and action capability are separate

Under DEC-043, a location may perform only the services and operational actions explicitly enabled for that location. Service support and the ability to perform a particular action are separate configuration questions.

The accepted action boundaries include:
- outgoing parcel intake;
- staff-created walk-in intake;
- measurement;
- custody acceptance;
- payment collection/recording;
- parcel collection/release; and
- custody handover.

These are distinct capabilities. A location label, location type, name, staff login, or Admin claim does not imply any of them. Enabling one action does not enable another.

### 2.3 Actor authority is independent

A location capability does not authorize every staff member. The staff actor must separately hold the assigned permission and scope for the exact action. Conversely, staff permission cannot make an inactive or unsupported location capable.

External collection-centre operators, carriers, and drivers remain physical actors without direct platform login at launch. Authorized internal staff record applicable events and distinguish the physical actor from the staff member who records the event.

### 2.4 Configuration changes are accountable

Location creation/editing, activation/deactivation, capability grant/revocation, and staff permission assignment are distinct administrative responsibilities. Admin status alone does not grant unrestricted authority.

Capability changes must be attributable and auditable. Making a location inactive or revoking a capability prevents new dependent work but does not erase, abandon, or transfer parcels already in its custody. Existing custody remains visible until an authorized resolution or separately evidenced physical transfer.

### 2.5 Customer selection is journey-based

The Shipper describes where the parcel starts and where it must go. Each endpoint may be a physical address or an eligible registered PUDO centre. The Shipper does not select In-PUDO, Out-PUDO, Trans-PUDO, or route legs; the system determines operational routing from approved service, endpoints, location/action eligibility, and routing rules.

A PUDO centre is selectable for a particular endpoint only when it is active and explicitly eligible for the selected service and the action required at that endpoint. A label or category is insufficient.

## 3. Current source findings

A bounded read-only source review was performed against `main` at `e7966332024fd38eb7cb5b8a1adebc0b584ac894`.

- The active repository tree contains no dedicated PUDO location registry, location-management service, location capability store, customer PUDO directory, or location-management API/UI paths.
- The existing `/account/shipments` draft page captures origin and destination as free-text values. These are preparation details, not authoritative location identities.
- The current draft API/store persists customer-owned draft preparation. It does not establish location identity, service eligibility, route validity, or physical custody.
- Existing staff permission and Admin authorization foundations are not an implemented location-configuration authority model.
- The source tree contains no location capability assignment or service/location/action eligibility implementation.
- Existing Firestore server-side patterns and default-deny client access are potential reuse points, not approval of new location paths or rules.

This review is bounded to repository paths and the relevant SDD/source patterns. It is not a production data audit, operational location inventory, or runtime verification.

## 4. Proposed responsibility boundaries

### 4.1 Authoritative location registry

The platform needs one authoritative source for registered operational locations. It must distinguish registered location identity and lifecycle from:
- a free-text address entered into a shipment draft;
- a customer-selected endpoint;
- a route or route leg;
- a location's service support;
- a location's action capabilities; and
- an actual custody event.

The logical location record should remain consistent with DEC-025's lean record. Any additional representation needed for the staffed-station/registered-collection-centre distinction, contact details, coordinates, coverage, or administrative grouping requires source evidence and explicit technical review before becoming persisted data.

### 4.2 Capability configuration

Configuration must express service support and action capability independently. It must not create broad bundles that imply unrelated actions.

The concrete service-to-location/action matrix is not approved. Do not assign Standard, Express, or Scheduled to any location by default. Do not infer a required action from a location label or from a route category.

### 4.3 Customer-facing discovery projection

The Shipper Portal should consume a trusted, read-only projection of registered locations that are eligible for the exact endpoint context being prepared. It must not expose an unfiltered list and imply that every active centre can accept or release every shipment.

The projection must be context-sensitive to the service and endpoint action once those mappings are approved. Until then, the customer draft may retain free-text preparation details, but no PUDO centre may be represented as bookable or eligible merely because it exists in the registry.

### 4.4 Operational eligibility remains an independent gate

DEC-047 requires each of the twelve combinations—three services across four endpoint patterns—to be evaluated independently. Each remains unavailable until its own service policy, coverage, required location/action capabilities, valid route, date/time availability/capacity, and Operations approval are evidenced.

A location registry or capability configuration alone cannot activate any of those combinations. Runtime eligibility must be revalidated server-side at consequential submission and fail closed when evidence is missing, stale, or revoked.

### 4.5 Proximity discovery

The owner requested that the PUDO selector help a Shipper find a nearby suitable centre. The technical method remains open, including:
- whether the customer may search by entered locality/address without granting device location;
- whether device geolocation is optional and how consent/denial is handled;
- geocoding and map providers, if any;
- coordinate source and quality;
- proximity calculation and ranking; and
- privacy, retention, and disclosure of location-derived data.

No provider, map, geolocation permission prompt, coordinate field, ranking formula, or distance threshold is approved here. A location permission denial must not be treated as customer refusal to use VeriLyft or as proof that no centre exists.

## 5. Conceptual query and mutation contracts

These are responsibility-level contracts only. They do not approve route names, HTTP methods, payloads, persisted fields, status enums, collection paths, or permission identifiers.

| Operation | Responsibility | Required guards |
|---|---|---|
| Create/register location | Establish a new authoritative location identity. | Authenticated staff principal; explicitly assigned location-creation authority and scope; required source-backed location details; attributable audit. |
| Revise location details | Correct/update permitted descriptive details without rewriting historical operational facts. | Exact edit authority; valid current record; reason and audit where consequential; concurrency protection. |
| Activate/deactivate location | Control whether new dependent work may use the location. | Separate activation authority; reason; auditable before/after state; preserve in-flight custody and responsibilities. |
| Grant/revoke service support | Configure whether the location supports a particular service. | Explicit configuration authority; service-specific evidence and Operations approval; independent audit. |
| Grant/revoke action capability | Configure a particular operational action independently of service support. | Explicit action-configuration authority; exact action and location scope; evidence/approval where required; independent audit. |
| Read administrative location details | Support authorized location administration and review. | Authenticated staff; separately assigned read authority; scope checks. |
| Discover eligible customer endpoints | Return only locations eligible for the exact service/endpoint context. | Authenticated booking party; server-side active-location, service, action, coverage, and DEC-047 eligibility checks; no client-supplied eligibility assertion. |

Location-creation authority, location-edit authority, activation authority, service-support configuration authority, action-capability configuration authority, and staff-permission administration must remain distinguishable. The final permission catalogue and assignment process are unresolved; this proposal does not invent permission IDs or grant Admin claims implicit access.

## 6. Persistence, security, and history requirements

The eventual technical contract must:
- use the existing Firebase Admin/Firestore server-side patterns where they fit, rather than introduce a parallel persistence architecture;
- keep privileged location and capability mutations server-side;
- preserve Firestore client denial for privileged location configuration;
- enforce authenticated principal, exact action permission, scope, target relationship, current lifecycle, and any required independent approval at the trusted server boundary;
- protect concurrent configuration changes and replayed requests;
- preserve attributable history for location and capability changes;
- ensure deactivation/revocation blocks new dependent work without erasing existing custody or historical evidence; and
- return customer-facing eligibility only from authoritative, current server-side facts.

No concrete collection, document layout, field names, indexes, rules exceptions, API paths, permission IDs, audit-retention period, or evidence-storage mechanism is approved by this proposal. Those must be reconciled with the current source and the relevant owner/Operations authority before implementation.

## 7. Explicit exclusions

This foundation does not introduce:
- operating-hours management, capacity calculations, reservation slots, or elaborate scheduling;
- a route-planning or route-optimization engine;
- driver, carrier, or collection-centre operator logins;
- automatic service eligibility from location type/name;
- a universal service/location/action matrix;
- pricing, quote calculation, quote issuance, or booking acceptance;
- parcel creation, intake, custody, payment, collection, or delivery execution;
- a map/geocoding/geolocation provider; or
- automatic customer-visible claims that a location or service is available.

## 8. Acceptance scenarios for the future implementation

1. An inactive location is not returned as an eligible endpoint and cannot accept new dependent work.
2. A location name, label, or physical classification alone never grants service support or an action capability.
3. Service support without the required action capability is insufficient.
4. An action capability without explicit service support is insufficient.
5. A location capability does not authorize an individual staff actor.
6. A staff permission does not override inactive or unsupported location configuration.
7. Revoking a capability blocks new dependent work but preserves existing custody and responsibilities.
8. Location and capability changes preserve actor, target, change, time, reason, and applicable approval evidence.
9. External collection-centre operators, carriers, and drivers are not granted direct platform accounts by this design.
10. A customer cannot select an unverified or ineligible centre for a service/endpoint context.
11. All twelve DEC-047 combinations remain unavailable until their independent verification and Operations approval are recorded.
12. The customer selects endpoints, not operational route types or route legs.
13. Free-text draft origin/destination values cannot be used as authoritative location IDs.
14. A failed, stale, unauthorized, or replayed configuration mutation cannot silently change capability or custody facts.

These scenarios require detailed preconditions, actors, expected unchanged facts, replay/failure variants, evidence, cleanup, and reviewers before they become executable acceptance tests.

## 9. Open decisions and evidence required before implementation

| Open item | Required resolution |
|---|---|
| Location inventory and accountable owner | Obtain the actual list/source of staffed stations and registered collection centres, ownership, and evidence that each is operationally registered. |
| Location kind representation | Determine how the DEC-018 distinction is represented without adding unsupported types or enums. |
| Location details | Confirm the minimum authoritative name/address and any justified additional information from actual operating records. |
| Service/action matrix | Operations must specify the actions required at each endpoint for each service and journey pattern. |
| Capability catalogue governance | Confirm whether the DEC-025/DEC-043 action set is complete for launch and who may approve additions. |
| Configuration authority | Identify designated Admin authority and separate grants for creation, editing, activation, service support, action capabilities, and staff permission administration. |
| Actor scope | Reconcile staff permission and location/region scope with PM-01–PM-12; do not infer access from Admin status. |
| Coverage and endpoint eligibility | Supply evidence for each of the twelve DEC-047 combinations; pending cells remain unavailable. |
| Proximity discovery | Approve privacy-preserving search/geolocation behaviour and any provider only after a concrete product/operational need is evidenced. |
| Audit and correction | Define applicable evidence, correction authority, review, and retention without inventing durations. |
| Technical representation | Review source-aligned Firestore ownership, API/security boundaries, concurrency, indexes, and executable acceptance fixtures before schema or code. |

## 10. Recommended implementation sequence after this proposal is approved

1. Reconcile the real location inventory and accountable Operations owner.
2. Approve the minimal authoritative location identity and lifecycle representation.
3. Approve the exact service-support/action-capability model and configuration authorities.
4. Define and implement the server-only location registry and audited administrative configuration, with Emulator and Rules tests.
5. Populate service/location/action evidence and obtain Operations decisions; do not activate unverified combinations.
6. Implement the customer-facing PUDO discovery projection only for contexts whose DEC-047 eligibility is approved.
7. Integrate the selector into the existing shipper workspace while preserving address endpoints and draft-only behaviour for unavailable contexts.

The next code slice must be limited to the approved registry/configuration foundation. Customer PUDO selection, quote issuance, booking confirmation, payment, intake, and custody remain separately gated.

## 11. Evidence boundary

This document is a technical-design proposal based on accepted policy and a bounded read-only source review. It does not claim operational location inventory, Operations approval, an approved service/location/action matrix, an approved schema/API/permission catalogue, code changes, tests, deployed behaviour, or production readiness.
