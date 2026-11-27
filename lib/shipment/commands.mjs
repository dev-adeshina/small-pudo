/**
 * Shipment application commands.
 *
 * These orchestration functions accept only verified server-side actor context
 * and injected persistence ports. They do not initialise Firebase or select a
 * database. The caller is responsible for authenticating the request and
 * constructing the actor from verified claims/session data.
 */
import { createWalkInCustomerProfile } from "./domain.mjs";
import {
  createShipmentContract,
  createParcelContract,
  createShipmentEventContract,
} from "./contracts.mjs";
import { assertRepositoryPorts, runIdempotentCommand } from "./repositories.mjs";
import { reserveUniqueShipmentReference } from "./references.mjs";

function requireActor(actor) {
  if (!actor || !["customer", "admin", "pudo_partner"].includes(actor.type) || typeof actor.id !== "string" || !actor.id.trim()) {
    const error = new Error("A verified customer, Admin or PUDO partner actor is required.");
    error.code = "FORBIDDEN_ACTOR";
    throw error;
  }
  if (actor.type === "pudo_partner" && (typeof actor.pudoLocationId !== "string" || !actor.pudoLocationId.trim())) {
    const error = new Error("A verified PUDO partner location context is required.");
    error.code = "FORBIDDEN_LOCATION";
    throw error;
  }
  return Object.freeze({
    type: actor.type,
    id: actor.id.trim(),
    ...(actor.type === "pudo_partner" ? { pudoLocationId: actor.pudoLocationId.trim() } : {}),
  });
}

function requireArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    const error = new Error(`${field} must contain at least one item.`);
    error.code = "INVALID_INPUT";
    throw error;
  }
  return value;
}

/**
 * Creates the Phase 3 shipment submission use case.
 *
 * Transaction adapter contract: transaction.run(callback) supplies tx;
 * every repository method called by this command must use that same tx.
 * references.reserveUnique(tx, candidate) must atomically reserve the
 * candidate within the transaction. Idempotency storage must be unique by
 * scoped key and participate in the same transaction.
 */
export function createShipmentCommands({ ports, idFactory, clock = () => new Date(), referenceAttempts = 5 }) {
  assertRepositoryPorts(ports);
  if (typeof idFactory !== "function") throw new TypeError("idFactory is required");
  if (typeof clock !== "function") throw new TypeError("clock must be a function");

  async function submitShipment({ actor: actorInput, idempotencyKey, shipment: shipmentInput, parcels: parcelInputs }) {
    const actor = requireActor(actorInput);
    const createdVia = actor.type === "customer"
      ? "customer_portal"
      : actor.type === "admin"
        ? "admin_assisted"
        : "pudo_walk_in";
    const now = clock();
    if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new TypeError("clock must return a valid Date");
    const submittedAt = now.toISOString();
    const inputs = requireArray(parcelInputs, "parcels");

    return runIdempotentCommand({
      transaction: ports.transaction,
      idempotency: ports.idempotency,
      actor,
      key: idempotencyKey,
      command: "submit_shipment",
      handler: async tx => {
        let customerId = shipmentInput?.customerId ?? null;
        let customerAccountStatus = null;

        if (createdVia === "pudo_walk_in") {
          if (
            shipmentInput?.origin?.type !== "pudo" ||
            shipmentInput.origin.pudoLocationId !== actor.pudoLocationId ||
            !["pudo_to_pudo", "pudo_to_door"].includes(shipmentInput.serviceType)
          ) {
            const error = new Error("A PUDO walk-in shipment must originate at the authenticated partner's own PUDO location.");
            error.code = "PUDO_ORIGIN_MISMATCH";
            throw error;
          }
          const profile = createWalkInCustomerProfile(shipmentInput?.walkInCustomer, actor);
          customerId = idFactory("customer");
          customerAccountStatus = profile.accountStatus;
          await ports.customers.create(tx, customerId, profile);
        } else {
          if (createdVia === "customer_portal") customerId = actor.id;
          if (typeof customerId !== "string" || !customerId.trim()) {
            const error = new Error("customerId is required for Admin-assisted shipment submission.");
            error.code = "INVALID_CUSTOMER";
            throw error;
          }
          const customer = await ports.customers.getById(tx, customerId);
          if (!customer) {
            const error = new Error("The selected customer does not exist.");
            error.code = "CUSTOMER_NOT_FOUND";
            throw error;
          }
          customerAccountStatus = customer.accountStatus ?? "registered";
        }

        const shipmentId = idFactory("shipment");
        const shipmentReference = await reserveUniqueShipmentReference({
          repository: { reserveUnique: candidate => ports.references.reserveUnique(tx, candidate) },
          attempts: referenceAttempts,
          now,
        });
        const shipment = createShipmentContract({
          ...shipmentInput,
          ...(createdVia === "pudo_walk_in" ? {
            sender: {
              ...shipmentInput.sender,
              fullName: shipmentInput.walkInCustomer.fullName,
              phone: shipmentInput.walkInCustomer.phone,
              email: shipmentInput.walkInCustomer.email ?? null,
            },
          } : {}),
          walkInCustomer: undefined,
          customerId,
          customerAccountStatus,
          shipmentReference,
          createdBy: actor,
          createdVia,
          status: "Submitted",
          measurementReviewStatus: "open",
          submittedAt,
          createdAt: submittedAt,
          updatedAt: submittedAt,
        });
        const parcels = inputs.map((parcelInput, index) => ({
          parcelId: idFactory("parcel"),
          shipmentId,
          ...createParcelContract({
            ...parcelInput,
            parcelReference: parcelInput.parcelReference ?? `${shipmentReference}-${String(index + 1).padStart(2, "0")}`,
          }),
          createdAt: submittedAt,
        }));
        const event = createShipmentEventContract({
          eventId: idFactory("shipment_event"),
          shipmentId,
          eventType: "shipment_submitted",
          actor,
          occurredAt: submittedAt,
          visibility: ["customer", "recipient", "admin", ...(actor.type === "pudo_partner" ? ["pudo"] : [])],
          summary: "Shipment submitted.",
          evidenceRefs: [],
          idempotencyKey,
        });

        await ports.shipments.create(tx, shipmentId, shipment);
        await ports.parcels.createMany(tx, shipmentId, parcels);
        await ports.events.append(tx, event);

        return Object.freeze({
          shipmentId,
          shipmentReference,
          customerId,
          status: shipment.status,
          parcelIds: Object.freeze(parcels.map(parcel => parcel.parcelId)),
        });
      },
    });
  }

  return Object.freeze({ submitShipment });
}
