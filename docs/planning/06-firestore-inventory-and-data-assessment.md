# Firestore Inventory and Legacy Data Assessment

**Read-only discovery plan | v1.0 | 27 November 2026**

## 1. Objective

Create a factual inventory of the existing Firestore database before deciding what VeriLyft Minimal should reuse, reference, copy, migrate or leave untouched.

This is discovery, not migration. The inventory must not write to Firestore, change rules or indexes, create databases, modify documents, or change Firebase configuration.

## 2. Scope and database identity

The inventory operator must explicitly identify:
- Firebase project ID.
- Firestore database ID (including `(default)` where applicable).
- Environment and intended purpose of the database.
- Date/time of inventory and identity of the operator.
- Whether the database contains the existing store, the current operational application, or another workload.

Do not assume that the default database and any separately named database are interchangeable. Do not infer a Stage database exists. Inventory only the exact project/database explicitly selected by the operator.

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

The report must not contain document IDs, customer names, email addresses, phone numbers, addresses, parcel details, payment references, image URLs, credentials or raw document values. It must not export record contents.

## 4. Schema and relationship interpretation

Field names and types are observations, not a confirmed data contract. Relationship candidates must be labelled as candidates until verified against application code and business rules.

Examples:
- A `customerId` string suggests a possible customer relationship.
- A Firestore DocumentReference exposes a target document path; report only the target collection/path pattern, not the referenced document ID.
- A `shipmentId` field may refer to a shipment but must be validated.
- Similar field names across collections do not prove that records share the same lifecycle or authority.

Record optionality and inconsistent historical shapes where detected. Do not silently normalise field names or values during inventory.

## 5. Collection classification

After inventory and code review, classify each collection:

| Classification | Meaning | Default treatment |
| --- | --- | --- |
| Retain | Required by the existing application/store | Leave in place and untouched |
| Reuse | Suitable source structure for the new application | Reuse only after ownership and access review |
| Reference | New application needs a trusted read/reference to source data | Read through a controlled server-side boundary |
| Copy | A bounded, justified subset needs a separate copy | Define field mapping, provenance and reconciliation first |
| Migrate | Records must move to a new authoritative structure | Requires an approved migration plan and rollback strategy |
| Exclude | Not required for the minimal product | Leave source data untouched; do not copy |

Do not classify a collection based on its name alone. Inspect its fields, application usage, relationships, write paths, rules and business ownership.

## 6. Preservation and security rules

- Existing store data must be preserved.
- No collection or document is deleted, renamed, rewritten or bulk-copied during inventory.
- Do not deploy Firestore rules or indexes as part of this task.
- Do not print field values or identifiers in logs.
- Use authorised credentials with the minimum read access required.
- Keep generated reports local and access-controlled; do not commit live inventory output to GitHub.
- Avoid running a full scan during peak traffic without considering read volume and cost.
- Do not expose credentials, service-account JSON, tokens or environment files.
- Any later migration requires separate explicit approval.

## 7. Read-only utility

The companion utility is `scripts/firestore-inventory.mjs`.

It:
- Requires an explicit project ID and database ID.
- Uses Application Default Credentials; no service-account key is stored in the repository.
- Requires an explicit `--read-only` acknowledgement.
- Uses Firestore reads and count aggregation only.
- Enumerates top-level and nested subcollections.
- Scans field names/types, not field values.
- Supports a per-collection traversal cap; when used, exact document counts remain separate from the number inspected. Schema and nested-subcollection discovery are marked incomplete when the cap prevents inspection of every parent document.
- Writes a sanitised structural report to stdout or a local path supplied by the operator.
- Does not alter Firestore data, rules, indexes or database configuration.

Example invocation:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/secure/path/to/read-only-service-account.json \
  node scripts/firestore-inventory.mjs \
  --project verilyft-4e691 \
  --database '(default)' \
  --read-only \
  --out ./firestore-inventory-report.json
```

Prefer an authorised read-only identity. If the operator uses Application Default Credentials from a local login, verify the active account and project before execution. Never copy credentials into the repository or report.

For a bounded scan, add `--max-docs-per-collection 500`. The report will identify schema inspection and nested-subcollection discovery as incomplete where parent documents were not traversed, while preserving the separate count aggregation result. A complete scan may read every document and recursively enumerate each document's subcollections; assess cost and operational impact first.

## 8. Review and migration decision workflow

1. Run inventory against the explicitly selected database.
2. Review collection counts, field schemas, subcollections and warnings.
3. Cross-reference collections with application code, Firestore rules, indexes, Storage paths and business workflows.
4. Identify authoritative owners for customers, store orders, payments, shipments, PUDO records and identity.
5. Produce a collection-by-collection classification with rationale.
6. Map required records and references to the proposed VeriLyft Minimal architecture.
7. Identify duplicate concepts, legacy-only structures and unresolved relationships.
8. Draft a migration/read-through/copy plan only for the necessary data.
9. Review privacy, access, retention, reconciliation, rollback and verification requirements.
10. Obtain explicit approval before any data migration or production database/rules change.

## 9. Deliverables

- Sanitised Firestore inventory report (kept outside Git).
- Collection classification matrix.
- Relationship and ownership map.
- Existing-store preservation map.
- Data integration decision: retain, read-through/reference, controlled copy or migration.
- Migration plan only if the inventory demonstrates it is needed.

## 10. Limitations

An inventory utility cannot by itself establish business meaning, legal retention requirements, authoritative ownership or whether a field is still in use. Code review and workflow validation are required. Document counts may change while a live database is being written; record the scan time and treat the report as a point-in-time discovery snapshot, not a transactional export.
