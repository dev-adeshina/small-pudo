import { randomBytes } from "node:crypto";

/** Human-readable candidate only. The repository must enforce uniqueness atomically. */
export function generateShipmentReference({ now = new Date(), random = randomBytes } = {}) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new TypeError("now must be a valid Date");
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = random(6);
  let suffix = "";
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `VLY-${date}-${suffix}`;
}

/**
 * Reserve the candidate through the supplied repository. Implementations must
 * enforce uniqueness transactionally and retry collisions; never trust a
 * client-provided reference or rely on the random suffix alone.
 */
export async function reserveUniqueShipmentReference({ repository, attempts = 5, ...options }) {
  if (!repository || typeof repository.reserveUnique !== "function") throw new TypeError("repository.reserveUnique is required");
  if (!Number.isSafeInteger(attempts) || attempts < 1) throw new TypeError("attempts must be a positive integer");
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = generateShipmentReference(options);
    if (await repository.reserveUnique(candidate)) return candidate;
  }
  const error = new Error("Unable to reserve a unique shipment reference.");
  error.code = "REFERENCE_COLLISION_LIMIT";
  throw error;
}
