import type { Firestore, Transaction } from "firebase-admin/firestore";

type Grant = {
  targetUid?: unknown;
  grantorUid?: unknown;
  permissionId?: unknown;
  status?: unknown;
  delegable?: unknown;
  parentGrantId?: unknown;
  expiresAt?: unknown;
  rootGrantId?: unknown;
  source?: unknown;
};

function expiryMillis(value: unknown): number | null {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object" && "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate(): Date }).toDate().getTime();
  }
  return Number.NaN;
}

function isUnexpired(value: unknown, now: number): boolean {
  const expiry = expiryMillis(value);
  return expiry === null || (Number.isFinite(expiry) && expiry > now);
}

function hasAuditedLegacyAssignment(value: Record<string, unknown> | undefined, now: number): boolean {
  return value?.active === true &&
    isUnexpired(value.expiresAt, now) &&
    typeof value.assignedBy === "string" && Boolean(value.assignedBy.trim()) &&
    typeof value.reason === "string" && Boolean(value.reason.trim()) &&
    Boolean(value.assignedAt);
}

async function validGrantLineage(
  transaction: Transaction,
  db: Firestore,
  grantId: string,
  expectedTargetUid: string,
  permissionId: string,
  now: number,
  visited = new Set<string>(),
): Promise<boolean> {
  if (visited.has(grantId)) return false;
  visited.add(grantId);
  const snapshot = await transaction.get(db.collection("staffActionPermissionGrants").doc(grantId));
  if (!snapshot.exists) return false;
  const grant = snapshot.data() as Grant;
  if (grant.targetUid !== expectedTargetUid ||
      grant.permissionId !== permissionId ||
      grant.status !== "active" ||
      !isUnexpired(grant.expiresAt, now)) return false;

  if (typeof grant.parentGrantId !== "string" || !grant.parentGrantId) {
    return grant.source === "administrator" && grant.rootGrantId === grantId &&
      typeof grant.grantorUid === "string" && grant.grantorUid.startsWith("admin:");
  }

  if (typeof grant.grantorUid !== "string" || !grant.grantorUid ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(grant.parentGrantId)) return false;

  const parentSnapshot = await transaction.get(
    db.collection("staffActionPermissionGrants").doc(grant.parentGrantId),
  );
  if (!parentSnapshot.exists) return false;
  const parent = parentSnapshot.data() as Grant;
  if (parent.targetUid !== grant.grantorUid ||
      parent.permissionId !== permissionId ||
      parent.delegable !== true ||
      parent.status !== "active" ||
      !isUnexpired(parent.expiresAt, now)) return false;

  const childExpiry = expiryMillis(grant.expiresAt);
  const parentExpiry = expiryMillis(parent.expiresAt);
  if (parentExpiry !== null &&
      (childExpiry === null || !Number.isFinite(childExpiry) || childExpiry > parentExpiry)) return false;

  return validGrantLineage(
    transaction, db, grant.parentGrantId, grant.grantorUid, permissionId, now, visited,
  );
}

/**
 * Authoritative permission check. New assignments are validated through their
 * complete grant lineage; pre-lineage assignments remain valid until changed.
 */
export async function hasStaffActionPermissionInTransaction(
  transaction: Transaction,
  db: Firestore,
  uid: string,
  permissionId: string,
): Promise<boolean> {
  const now = Date.now();
  const [projection, grantQuery] = await Promise.all([
    transaction.get(db.collection("staffActionPermissions").doc(uid)
      .collection("permissions").doc(permissionId)),
    transaction.get(db.collection("staffActionPermissionGrants").where("targetUid", "==", uid)),
  ]);
  const grants = grantQuery.docs.filter((document) => document.data().permissionId === permissionId);
  if (grants.length === 0) {
    const data = projection.data();
    if (data?.grantModelVersion === 1) return false;
    return projection.exists && hasAuditedLegacyAssignment(data, now);
  }

  for (const grant of grants) {
    if (await validGrantLineage(transaction, db, grant.id, uid, permissionId, now)) return true;
  }
  return false;
}

export async function hasStaffActionPermission(
  db: Firestore,
  uid: string,
  permissionId: string,
): Promise<boolean> {
  return db.runTransaction((transaction) =>
    hasStaffActionPermissionInTransaction(transaction, db, uid, permissionId),
  );
}

export async function findDelegableStaffActionGrantInTransaction(
  transaction: Transaction,
  db: Firestore,
  uid: string,
  permissionId: string,
): Promise<{ grantId: string; grant: Record<string, unknown> } | null> {
  const snapshot = await transaction.get(
    db.collection("staffActionPermissionGrants").where("targetUid", "==", uid),
  );
  for (const document of snapshot.docs) {
    const grant = document.data();
    if (grant.permissionId !== permissionId || grant.delegable !== true ||
        grant.status !== "active") continue;
    if (await validGrantLineage(transaction, db, document.id, uid, permissionId, Date.now())) {
      return { grantId: document.id, grant };
    }
  }
  return null;
}
