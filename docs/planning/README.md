# VeriLyft Planning Package

**Baseline:** v1.0  
**Date:** 26 November 2026

This directory contains the initial coordinated planning baseline for the new VeriLyft implementation.

## Documents

1. [Product Requirements Document](./01-verilyft-prd.md)
2. [Data Architecture](./02-verilyft-data-architecture.md)
3. [UI/UX Blueprint](./03-verilyft-ui-ux-blueprint.md)
4. [Business Workflows and Rules](./04-verilyft-business-workflows.md)

## Status and use

These documents capture decisions discussed to date. They are planning baselines, not evidence that any database, collection, page, feature, integration or workflow has been implemented.

Items identified as open decisions must be confirmed before implementing the affected functionality. Review the documents together so that product scope, data model, interface and workflows remain aligned.

## Key boundaries

- The new implementation is intended to use a separate Firestore database.
- The existing main-version database must remain untouched.
- Existing store data must be preserved.
- The store integration boundary (read-through, controlled copy or migration) remains to be decided.
- The platform has distinct Customer, Admin and PUDO portals.
- Every physical parcel intake requires a photograph.
- Initial scope is deliberately minimal; advanced automation is deferred.
