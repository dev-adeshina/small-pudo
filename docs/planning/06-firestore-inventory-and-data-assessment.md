# Firestore Inventory and Legacy Data Assessment

**Read-only discovery and adaptation policy | v1.1 | 27 November 2026**

## 1. Objective

Understand the existing Firestore data and application dependencies so the new VeriLyft implementation can use the simplest data structure that fully supports the approved workflows.

The inventory is evidence about the legacy system. It is not a target schema and does not create a presumption that legacy collections should be reused.

The governing principle is:

> **Build the simplest data structure that fully supports the approved VeriLyft workflows. Do not carry forward complexity simply because it already exists.**

The collection-by-collection treatment is defined in [07 — Existing Data Adaptation and Replacement Matrix](./07-existing-data-adaptation-and-replacement-matrix.md).

## 2. Scope and database identity

The inventory operator must explicitly identify:
- Firebase project ID.
- Firestore database ID (including `(default)` where applicable).
- Environment and intended purpose of the database.
- Date/time of inventory and identity of the operator.
- Whether the database contains the existing store, current operational application or another workload.

The inventory used for the first assessment was run against `verilyft-4e691/(default)`. The new implementation is planned for a separately identified Firestore database. Do not create or deploy that database until its ID, location, rules and environment strategy are approved.

Do not assume databases are interchangeable or automatically share documents. Authentication may be shared at Firebase project level, but database rules, indexes and connection configuration are database-specific.

## 3. Required inventory outputs

For every discovered collection path, report:
1. Full collection path and whether it is top-level or nested.
2. Exact document count from a Firestore count aggregation.
3. Number of documents inspected for schema discovery.
4. Whether schema inspection was complete or capped.
5. Field paths and observed value types, without field values.
6. Field occurrence counts where available.
7. Nested subcollection paths and their document counts.
8. Candidate relationships, including DocumentReference targets and ID/reference-shaped field names.
9. Scan warnings, inaccessible paths and incomplete traversal.

The report must not contain document IDs, customer names, email addresses, phone numbers, addresses, parcel details, payment references, image URLs, credentials or raw document values.

## 4. Schema and relationship interpretation

Field names and types are observations, not a confirmed data contract. Relationship candidates remain candidates until verified against application code and business rules.

Similar field names do not prove that records share the same lifecycle or authority. Record optionality and inconsistent historical shapes where detected. Do not silently normalise field names or values during inventory.

## 5. Assessment decisions

Do not use the earlier assumption that existing structures should be broadly retained or reused. Classify each collection using the decisions below:

| Classification | Meaning |
| --- | --- |
| **Keep** | The existing concept and a simple form of its structure fit the target architecture. |
| **Adapt** | Keep the useful business concept but redesign its fields and lifecycle. |
| **Consolidate** | Merge overlapping legacy concepts into a simpler target record or event stream. |
| **Replace** | Replace the legacy structure's role in the new application with the approved target model. This does not authorise deletion of legacy records. |
| **Leave untouched** | Preserve in the source system and exclude from the new application's operational model for now. |

A collection must not be classified based on its name alone. Consider:
- Its actual fields and observed shapes.
- Application read/write paths and server-side stores.
- Firestore rules and Storage usage.
- Business ownership and lifecycle authority.
- Whether its purpose is already represented elsewhere.
- Whether the approved initial product scope requires it.

## 6. Preservation and security rules

- Existing store data must be preserved.
- Preserving historical data does not require reusing its existing schema.
- No collection or document is deleted, renamed, rewritten or bulk-copied during inventory or assessment.
- Do not deploy Firestore rules or indexes as part of this task.
- Do not print field values or identifiers in logs.
- Use authorised credentials with the minimum read access required.
- Keep generated reports local and access-controlled; do not commit live inventory output to GitHub.
- Avoid running a full scan during peak traffic without considering read volume and cost.
- Do not expose credentials, service-account JSON, tokens or environment files.
- Any later migration, copy or production database/rules change requires separate explicit approval.

## 7. Read-only utility

The companion utility is `scripts/firestore-inventory.mjs`.

It:
- Requires an explicit project ID and database ID.
- Loads local `.env.local` Firebase Admin service-account variables when configured; falls back to Application Default Credentials only when no service-account variables are configured.
- Never prints, serialises or writes credential material to the report.
- Requires an explicit `--read-only` acknowledgement.
- Uses Firestore reads and count aggregation only.
- Enumerates top-level and nested subcollections.
- Scans field names/types, not field values.
- Supports a per-collection traversal cap and reports incomplete schema/subcollection discovery where applicable.
- Writes a sanitised structural report to stdout or a local path supplied by the operator.
- Does not alter Firestore data, rules, indexes or database configuration.

Example:

```bash
node scripts/firestore-inventory.mjs \
  --project verilyft-4e691 \
  --database '(default)' \
  --read-only \
  --out ./firestore-inventory-report.json
```

Keep `.env.local` out of Git. Never paste or print its values. The utility's read-only code path does not reduce IAM permissions held by the credential. Assess read volume and operational impact before a complete recursive scan.

## 8. Required review workflow

1. Run inventory against the explicitly selected database.
2. Review collection counts, field schemas, subcollections and warnings.
3. Cross-reference collections with application code, Firestore rules, Storage paths and business workflows.
4. Identify authoritative owners for customers, store orders, payments, shipments, PUDO records and identity.
5. Apply the adaptation decisions: keep, adapt, consolidate, replace or leave untouched.
6. Map required business information to the approved minimal target model.
7. Identify duplicate concepts, legacy-only structures and unresolved relationships.
8. Define only the necessary read-through/reference boundary for preserved store functionality.
9. Draft a copy/migration plan only if a specific approved workflow proves it necessary.
10. Obtain explicit approval before any data migration or production database/rules change.

## 9. Deliverables

- Sanitised Firestore inventory report (kept outside Git).
- [Existing Data Adaptation and Replacement Matrix](./07-existing-data-adaptation-and-replacement-matrix.md).
- Application-code dependency cross-check.
- Existing-store preservation and integration boundary.
- Minimal target data model aligned with the approved Data Architecture.
- Migration or controlled-copy plan only if demonstrably required and separately approved.

## 10. Limitations

An inventory utility cannot establish business meaning, legal retention requirements, authoritative ownership or whether a field is still in use. Code review and workflow validation are required.

Document counts may change while a live database is being written; record the scan time and treat the report as a point-in-time discovery snapshot, not a transactional export. The first code cross-check is not an exhaustive trace of every read/write path, scheduled process, Storage object or security rule.

The purpose of this assessment is not to preserve legacy complexity. It is to protect valuable historical information while implementing the approved VeriLyft workflows with a smaller, clearer and more maintainable data model.
