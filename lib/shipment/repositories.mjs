/**
 * Persistence ports for Phase 3. These are dependency-injected contracts;
 * this module deliberately imports no Firebase or database SDK.
 */
const REQUIRED_METHODS = Object.freeze({
  customers: ["create", "getById"],
  shipments: ["create", "getById", "getByReference", "update"],
  parcels: ["createMany", "listByShipment", "getById"],
  quotes: ["createLineage", "appendRevision", "getCurrent", "withdraw"],
  payments: ["createAttempt", "getById", "getByProviderReference", "updateAttempt"],
  events: ["append", "listByShipment"],
  idempotency: ["get", "create"],
  references: ["reserveUnique"],
});

export function assertRepositoryPorts(ports) {
  if (!ports || typeof ports !== "object") throw new TypeError("Repository ports are required");
  for (const [name, methods] of Object.entries(REQUIRED_METHODS)) {
    for (const method of methods) {
      if (typeof ports[name]?.[method] !== "function") {
        throw new TypeError(`Repository port ${name}.${method} is required`);
      }
    }
  }
  if (typeof ports.transaction?.run !== "function") {
    throw new TypeError("transaction.run is required; shipment writes must be transactional");
  }
  return ports;
}

/**
 * Run a command once per actor-scoped idempotency key. The transaction adapter
 * must provide serialisable/atomic read-before-create semantics. The handler
 * must write its aggregate changes and idempotency result in that same tx.
 */
export async function runIdempotentCommand({ transaction, idempotency, actor, key, command, handler }) {
  if (typeof transaction?.run !== "function") throw new TypeError("transaction.run is required");
  if (typeof idempotency?.get !== "function" || typeof idempotency?.create !== "function") {
    throw new TypeError("idempotency get/create methods are required");
  }
  if (!actor?.type || !actor?.id || typeof key !== "string" || !key.trim()) {
    throw new TypeError("actor and idempotency key are required");
  }
  if (typeof command !== "string" || !command.trim() || typeof handler !== "function") {
    throw new TypeError("command and handler are required");
  }
  const scopedKey = `${actor.type}:${actor.id}:${command}:${key.trim()}`;
  return transaction.run(async tx => {
    const existing = await idempotency.get(tx, scopedKey);
    if (existing) return existing.result;
    const result = await handler(tx);
    await idempotency.create(tx, scopedKey, {
      command,
      actor: { type: actor.type, id: actor.id },
      result,
      completedAt: new Date().toISOString(),
    });
    return result;
  });
}

export const SHIPMENT_REPOSITORY_PORTS = REQUIRED_METHODS;
