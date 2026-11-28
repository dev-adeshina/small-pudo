/**
 * Explicit Firebase Admin runtime selection for the Phase 3 shipment adapter.
 *
 * This is intentionally separate from lib/firebase-admin.ts: the shipment
 * system must never inherit whichever Firebase app happens to be first in the
 * process. Every deployment supplies an environment, both project IDs, a
 * database ID, and environment-scoped service credentials.
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createShipmentFirestorePorts } from "./firestore-adapter.mjs";

const PRODUCTION_PROJECT_ID = "verilyft-4e691";

function required(env, key) {
  const value = env[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required shipment Firebase configuration: ${key}`);
  }
  return value.trim();
}

export function resolveShipmentFirebaseConfig(env = process.env) {
  const environment = required(env, "SHIPMENT_ENVIRONMENT");
  if (!["staging", "production"].includes(environment)) {
    throw new Error("SHIPMENT_ENVIRONMENT must be staging or production.");
  }

  const stagingProjectId = required(env, "STAGING_FIREBASE_PROJECT_ID");
  const productionProjectId = required(env, "PRODUCTION_FIREBASE_PROJECT_ID");
  if (productionProjectId !== PRODUCTION_PROJECT_ID) {
    throw new Error(`Production shipment data must remain in Firebase project ${PRODUCTION_PROJECT_ID}.`);
  }
  if (stagingProjectId === productionProjectId) {
    throw new Error("Staging and production Firebase projects must be different.");
  }

  const projectId = required(env, "SHIPMENT_FIREBASE_PROJECT_ID");
  const expectedProjectId = environment === "staging" ? stagingProjectId : productionProjectId;
  if (projectId !== expectedProjectId) {
    throw new Error(
      `Shipment Firebase project mismatch for ${environment}: expected ${expectedProjectId}, received ${projectId}.`
    );
  }

  const databaseId = required(env, "SHIPMENT_FIRESTORE_DATABASE_ID");
  const clientEmail = required(env, "SHIPMENT_FIREBASE_CLIENT_EMAIL");
  const privateKey = required(env, "SHIPMENT_FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  return Object.freeze({
    environment,
    projectId,
    databaseId,
    clientEmail,
    privateKey,
    appName: `verilyft-shipment-${environment}`,
  });
}

/**
 * Creates the environment-specific Firestore repositories.
 *
 * Calling this function establishes a Firebase Admin connection. Do not call
 * it until the target project/database and deployment credentials have been
 * separately provisioned and approved.
 */
export function createShipmentFirestoreRuntime({ env = process.env, namespace, version } = {}) {
  const config = resolveShipmentFirebaseConfig(env);
  const existingApp = getApps().find(app => app.name === config.appName);
  if (existingApp && existingApp.options.projectId !== config.projectId) {
    throw new Error("An existing shipment Firebase app is bound to a different project.");
  }

  const app = existingApp ?? initializeApp({
    credential: cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }),
    projectId: config.projectId,
  }, config.appName);

  if (app.options.projectId !== config.projectId) {
    throw new Error("Firebase Admin resolved a project different from the approved shipment target.");
  }

  // The database ID is mandatory; even the default database must be explicit.
  const db = getFirestore(app, config.databaseId);
  const ports = createShipmentFirestorePorts({ db, namespace, version });
  return Object.freeze({ app, db, ports, config: Object.freeze({
    environment: config.environment,
    projectId: config.projectId,
    databaseId: config.databaseId,
    appName: config.appName,
  }) });
}
