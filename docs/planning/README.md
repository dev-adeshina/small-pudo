# VeriLyft Planning Package

**Baseline:** v1.1  
**Date:** 27 November 2026

This directory contains the coordinated planning baseline for the new VeriLyft implementation.

## Documents

1. [Product Requirements Document](./01-verilyft-prd.md)
2. [Data Architecture](./02-verilyft-data-architecture.md)
3. [UI/UX Blueprint](./03-verilyft-ui-ux-blueprint.md)
4. [Business Workflows and Rules](./04-verilyft-business-workflows.md)
5. [Design System & Dashboard Experience Specification](./05-verilyft-design-system-dashboard-experience.md)
6. [Firestore Inventory and Legacy Data Assessment](./06-firestore-inventory-and-data-assessment.md)

## Supporting utility

- Read-only Firestore structural inventory: `../../scripts/firestore-inventory.mjs`
- The utility reports collection paths, counts, field paths/types, nested subcollections and relationship candidates.
- It does not export document values or IDs and does not write to Firestore.
- Run it only against an explicitly selected project/database using authorised read-only credentials. Keep generated reports outside Git.

Example:

```bash
node scripts/firestore-inventory.mjs \
  --project verilyft-4e691 \
  --database '(default)' \
  --read-only \
  --out ./firestore-inventory-report.json
```

## Product and architecture boundary

VeriLyft is **one application**, with one shared authentication infrastructure and three distinct role-aware experiences: Customer, Admin/Staff and PUDO. The experiences share design tokens, components and interaction standards while retaining separate navigation, data visibility and permissions.

These documents capture planning decisions; they are not evidence that a database, collection, page, feature, integration or workflow has been implemented.

## Data preservation and safety boundaries

- The existing main-version database must remain untouched by the new implementation unless a separately approved integration decision says otherwise.
- Existing store data must be preserved.
- The store integration boundary (read-through, controlled copy or migration) remains to be decided based on inventory and ownership review.
- The new implementation is intended to use a separately identified Firestore database; do not create or deploy it until its ID, location, rules and environment strategy are approved.
- No migration, production Firestore data change, rules deployment or index deployment is authorised by this planning package.
- Every physical parcel intake requires a photograph.
- Initial scope is deliberately minimal; advanced automation is deferred.

## Status and use

Review the PRD, data architecture, UI/UX blueprint, business workflows and design system together. Use the inventory report and application-code review to classify existing collections before deciding what to retain, reuse, reference, copy, migrate or exclude. Open decisions must be resolved before implementing the affected functionality.
