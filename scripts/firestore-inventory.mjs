#!/usr/bin/env node

/**
 * Read-only Firestore structural inventory.
 *
 * This utility intentionally does not read or emit document values.
 * It enumerates collection paths, uses count aggregations, observes field
 * paths/types, and identifies relationship-shaped fields without exporting IDs.
 *
 * Required:
 *   --project <firebase-project-id>
 *   --database <firestore-database-id>
 *   --read-only
 *
 * Optional:
 *   --max-docs-per-collection <n>  Limit schema inspection (not count aggregation).
 *   --page-size <n>                Documents fetched per page (default 200).
 *   --out <path>                   Write sanitised JSON report locally; default stdout.
 */

import { writeFile } from "node:fs/promises";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { FieldPath, getFirestore } from "firebase-admin/firestore";

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    if (["read-only", "help"].includes(key)) {
      options[key] = true;
      continue;
    }
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    options[key] = value;
    i += 1;
  }
  return options;
}

function usage() {
  return [
    "Usage: node scripts/firestore-inventory.mjs --project <id> --database <id> --read-only [options]",
    "Options: --max-docs-per-collection <n> --page-size <n> --out <path>",
  ].join("\n");
}

function positiveInteger(value, fallback, name) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`--${name} must be a positive integer`);
  }
  return parsed;
}

function valueType(value) {
  if (value === null) return "null";
  if (value instanceof Date) return "timestamp";
  if ((value?._seconds !== undefined && value?._nanoseconds !== undefined) || (typeof value?.toDate === "function" && Number.isFinite(value?.seconds) && Number.isFinite(value?.nanoseconds))) return "timestamp";
  if ((value?._latitude !== undefined && value?._longitude !== undefined) || (Number.isFinite(value?.latitude) && Number.isFinite(value?.longitude) && typeof value?.toJSON === "function")) return "geopoint";
  if (value && typeof value.path === "string" && typeof value.get === "function") {
    return "document_reference";
  }
  if (Array.isArray(value)) return "array";
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return "bytes";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  if (typeof value === "boolean") return "boolean";
  if (value && typeof value === "object") return "map";
  return typeof value;
}

function safeStructuralPath(path) {
  return path.split("/").map((segment, index) => index % 2 === 1 ? "*" : segment).join("/");
}

function inferRelationship(fieldPath, value) {
  if (value && typeof value.path === "string" && typeof value.get === "function") {
    const parts = value.path.split("/");
    return {
      fieldPath,
      kind: "document_reference",
      targetCollectionPath: parts.length > 1 ? safeStructuralPath(parts.slice(0, -1).join("/")) : "unknown",
    };
  }
  if (/(^|[A-Z_])(id|ids|ref|refs|reference|references)$/i.test(fieldPath)
      || /(Id|Ids|Ref|Refs|Reference|References)$/.test(fieldPath)) {
    return { fieldPath, kind: "name_candidate" };
  }
  return null;
}

function flattenFields(data, prefix = "", output = []) {
  for (const [key, value] of Object.entries(data ?? {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)
        && !(value instanceof Date) && !(value instanceof Uint8Array)
        && typeof value.path !== "string"
        && !((value?._seconds !== undefined && value?._nanoseconds !== undefined) || (typeof value?.toDate === "function" && Number.isFinite(value?.seconds) && Number.isFinite(value?.nanoseconds)))
        && !((value?._latitude !== undefined && value?._longitude !== undefined) || (Number.isFinite(value?.latitude) && Number.isFinite(value?.longitude) && typeof value?.toJSON === "function"))) {
      output.push({ path, type: "map", value });
      flattenFields(value, path, output);
      continue;
    }

    const type = valueType(value);
    output.push({ path, type, value });
    if (type === "array" && value.length > 0) {
      const itemTypes = [...new Set(value.slice(0, 25).map(valueType))].sort();
      output.push({ path: `${path}[]`, type: `array_item:${itemTypes.join("|")}` });
      for (const item of value.slice(0, 25)) {
        if (item && typeof item.path === "string" && typeof item.get === "function") {
          output.push({ path: `${path}[]`, type: "document_reference", value: item });
        }
      }
    }
  }
  return output;
}

async function writeReport(report, outputPath) {
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (outputPath) {
    await writeFile(outputPath, json, { encoding: "utf8", mode: 0o600, flag: "wx" });
    process.stdout.write(`Sanitised inventory report written to ${outputPath}\n`);
  } else {
    process.stdout.write(json);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (!options["read-only"]) {
    throw new Error("Refusing to run without explicit --read-only acknowledgement.");
  }
  if (!options.project || !options.database) {
    throw new Error(`Both --project and --database are required.\n${usage()}`);
  }

  const maxDocs = options["max-docs-per-collection"] === undefined
    ? Infinity
    : positiveInteger(options["max-docs-per-collection"], 0, "max-docs-per-collection");
  const pageSize = Math.min(1000, positiveInteger(options["page-size"], 200, "page-size"));

  const app = initializeApp({
    credential: applicationDefault(),
    projectId: options.project,
  }, `firestore-inventory-${options.project}-${options.database}`);
  const db = getFirestore(app, options.database);

  const report = {
    reportType: "firestore-structural-inventory",
    generatedAt: new Date().toISOString(),
    projectId: options.project,
    databaseId: options.database,
    mode: "read-only",
    valuesExported: false,
    documentIdsExported: false,
    schemaScanLimitPerCollection: Number.isFinite(maxDocs) ? maxDocs : null,
    pageSize,
    collections: [],
    warnings: [],
    summary: {
      collectionPaths: 0,
      documentCountTotal: 0,
      documentsInspectedForSchema: 0,
      completeSchemaCollections: 0,
      partialSchemaCollections: 0,
    },
  };

  const seenCollections = new Set();

  async function inspectCollection(collectionRef, depth = 0) {
    const path = collectionRef.path;
    if (seenCollections.has(path)) return;
    seenCollections.add(path);

    const entry = {
      path: safeStructuralPath(path),
      depth,
      parentDocumentPath: depth > 0 ? safeStructuralPath(path.split("/").slice(0, -1).join("/")) : null,
      documentCount: null,
      documentsInspectedForSchema: 0,
      schemaComplete: true,
      subcollectionDiscoveryComplete: true,
      fields: {},
      relationshipCandidates: {},
      subcollections: [],
      warnings: [],
    };
    report.collections.push(entry);

    try {
      const countSnapshot = await collectionRef.count().get();
      entry.documentCount = countSnapshot.data().count;
      report.summary.documentCountTotal += entry.documentCount;
    } catch (error) {
      entry.warnings.push("Count aggregation failed; inspect access and query permissions.");
      report.warnings.push("A collection count was unavailable; see the affected collection entry.");
    }

    let lastDocument = null;
    let inspected = 0;
    while (inspected < maxDocs) {
      const remaining = Number.isFinite(maxDocs) ? maxDocs - inspected : pageSize;
      const limit = Math.min(pageSize, remaining);
      let query = collectionRef.orderBy(FieldPath.documentId()).limit(limit);
      if (lastDocument) query = query.startAfter(lastDocument);

      const page = await query.get();
      if (page.empty) break;

      for (const document of page.docs) {
        inspected += 1;
        entry.documentsInspectedForSchema += 1;
        report.summary.documentsInspectedForSchema += 1;

        for (const field of flattenFields(document.data())) {
          const stats = entry.fields[field.path] ?? { occurrences: 0, types: [] };
          stats.occurrences += 1;
          if (!stats.types.includes(field.type)) stats.types.push(field.type);
          entry.fields[field.path] = stats;
        }

        for (const field of flattenFields(document.data())) {
          const relationship = inferRelationship(field.path, field.value);
          if (!relationship) continue;
          const key = `${relationship.kind}:${relationship.fieldPath}:${relationship.targetCollectionPath ?? ""}`;
          const candidate = entry.relationshipCandidates[key] ?? {
            fieldPath: relationship.fieldPath,
            kind: relationship.kind,
            targetCollectionPath: relationship.targetCollectionPath ?? null,
            occurrences: 0,
          };
          candidate.occurrences += 1;
          entry.relationshipCandidates[key] = candidate;
        }

        try {
          const children = await document.ref.listCollections();
          for (const child of children) {
            const safeChildPath = safeStructuralPath(child.path);
            if (!entry.subcollections.includes(safeChildPath)) entry.subcollections.push(safeChildPath);
            await inspectCollection(child, depth + 1);
          }
        } catch (error) {
          entry.warnings.push("Could not enumerate a nested collection for one or more documents.");
        }
      }

      lastDocument = page.docs[page.docs.length - 1];
      if (page.size < limit) break;
    }

    if (Number.isFinite(maxDocs) && entry.documentCount !== null
        && entry.documentsInspectedForSchema < entry.documentCount) {
      entry.schemaComplete = false;
      entry.subcollectionDiscoveryComplete = false;
    }
    for (const stats of Object.values(entry.fields)) stats.types.sort();
    entry.subcollections.sort();
    entry.relationshipCandidates = Object.values(entry.relationshipCandidates)
      .sort((a, b) => a.fieldPath.localeCompare(b.fieldPath));

    if (entry.schemaComplete) report.summary.completeSchemaCollections += 1;
    else report.summary.partialSchemaCollections += 1;
  }

  try {
    const roots = await db.listCollections();
    for (const collection of roots) await inspectCollection(collection, 0);
  } catch (error) {
    report.warnings.push(`Top-level collection enumeration failed: ${error.message}`);
    throw error;
  } finally {
    report.summary.collectionPaths = report.collections.length;
    await app.delete();
  }

  await writeReport(report, options.out);
}

main().catch((error) => {
  process.stderr.write(`Firestore inventory failed: ${error.message}\n`);
  process.exitCode = 1;
});
