/**
 * Transaction-scoped commands for the remaining Phase 3 shipment records.
 * Authentication is verified by the calling server boundary; this module
 * enforces role, ownership and record relationships before persistence.
 */
import { ShipmentDomainError, deriveHandoverStatus, isPudoOriginService } from "./domain.mjs";
import { createParcelIntakeContract, createShipmentAssignmentContract, createShipmentDocumentContract, createNotificationContract, createNotificationAttemptContract } from "./records.mjs";
import { createShipmentEventContract } from "./contracts.mjs";
import { assertCompleteShipmentRepositoryPorts, runIdempotentCommand } from "./repositories.mjs";

function fail(code, message) { throw new ShipmentDomainError(code, message); }
function nowIso(clock) { return clock().toISOString(); }

export function createShipmentRecordCommands({
  ports,
  idFactory = prefix => \`\${prefix}-\${globalThis.crypto?.randomUUID?.() ?? Date.now()}\`,
  clock = () => new Date(),
  // Resolve current partner/location authority before entering a retryable transaction.
  authorizePudoLocation = async () => false,
} = {}) {
  assertCompleteShipmentRepositoryPorts(ports);

  async function requireShipment(tx, shipmentId) {
    const shipment = await ports.shipments.getById(tx, shipmentId);
    if (!shipment) fail("SHIPMENT_NOT_FOUND", "Shipment does not exist.");
    return shipment;
  }

  return Object.freeze({
    async recordParcelIntake({ actor, idempotencyKey, intake }) {
      if (!["admin", "pudo_partner"].includes(actor?.type) || !actor?.id) fail("FORBIDDEN_ACTOR", "Only Admin or an authenticated PUDO partner may record intake.");
      if (actor.type === "pudo_partner" && !(await authorizePudoLocation(actor.id, intake.pudoLocationId))) {
        fail("FORBIDDEN_PUDO_LOCATION", "PUDO partner is not authorised for this intake location.");
      }
      return runIdempotentCommand({
        transaction: ports.transaction, idempotency: ports.idempotency, actor,
        key: idempotencyKey, command: "record_parcel_intake",
        handler: async tx => {
          const shipment = await requireShipment(tx, intake.shipmentId);
          const parcels = await ports.parcels.listByShipment(tx, shipment.shipmentId);
          const parcelIds = new Set(parcels.map(parcel => parcel.parcelId));
          if (!intake.parcelIds?.length || intake.parcelIds.some(id => !parcelIds.has(id))) {
            fail("PARCEL_SHIPMENT_MISMATCH", "Every intake parcel must belong to the shipment.");
          }
          if (intake.intakeType === "station_drop_off") {
            if (!isPudoOriginService(shipment.serviceType) || shipment.origin?.pudoLocationId !== intake.pudoLocationId) {
              fail("ORIGIN_INTAKE_LOCATION_MISMATCH", "Station drop-off intake must occur at the shipment's origin PUDO.");
            }
          }
          if (intake.intakeType === "door_pickup_arrival" && !isDoorOriginService(shipment.serviceType)) {
            fail("INTAKE_SERVICE_MISMATCH", "Door-pickup arrival intake requires a door-origin service.");
          }
          const timestamp = nowIso(clock);
          const record = createParcelIntakeContract({
            ...intake, intakeId: idFactory("intake"),
            receivedBy: actor, recordedAt: timestamp,
            receivedAt: timestamp,
            completedAt: timestamp, status: "completed",
          });
          await ports.intakes.create(tx, record);
          let nextStatus = shipment.status;
          if (record.intakeType === "station_drop_off") {
            nextStatus = deriveHandoverStatus({
              serviceType: shipment.serviceType,
              evidence: {
                kind: "pudo_intake", completed: true,
                photoEvidenceRefs: record.photoEvidenceRefs,
                pudoLocationId: record.pudoLocationId,
              },
            });
            await ports.shipments.update(tx, shipment.shipmentId, { status: nextStatus, updatedAt: timestamp });
          }
          const event = createShipmentEventContract({
            eventId: idFactory("event"), shipmentId: shipment.shipmentId,
            eventType: "parcel_intake_completed",
            actor, occurredAt: timestamp, visibility: ["customer", "pudo", "admin"],
            summary: "Physical parcel intake completed with photo evidence.",
            evidenceRefs: record.photoEvidenceRefs, idempotencyKey: idempotencyKey,
          });
          await ports.events.append(tx, event);
          return { intakeId: record.intakeId, shipmentId: shipment.shipmentId, status: nextStatus };
        },
      });
    },

    async createAssignment({ actor, idempotencyKey, assignment }) {
      if (!["admin", "pudo_partner"].includes(actor?.type) || !actor?.id) fail("FORBIDDEN_ACTOR", "Only Admin or an authenticated PUDO partner may create an assignment.");
      if (actor.type === "pudo_partner" && !(await authorizePudoLocation(actor.id, assignment.assignee))) {
        fail("FORBIDDEN_PUDO_LOCATION", "PUDO partner may assign only within its authorised location.");
      }
      return runIdempotentCommand({
        transaction: ports.transaction, idempotency: ports.idempotency, actor,
        key: idempotencyKey, command: "create_shipment_assignment",
        handler: async tx => {
          await requireShipment(tx, assignment.shipmentId);
          const timestamp = nowIso(clock);
          const record = createShipmentAssignmentContract({
            ...assignment, assignmentId: idFactory("assignment"),
            assignedBy: actor, createdAt: timestamp,
          });
          await ports.assignments.create(tx, record.shipmentId, record);
          return { assignmentId: record.assignmentId, shipmentId: record.shipmentId, status: record.status };
        },
      });
    },

    async createShipmentDocument({ actor, idempotencyKey, document }) {
      if (!["admin", "system"].includes(actor?.type) || !actor?.id) fail("FORBIDDEN_ACTOR", "Only Admin or a trusted system actor may create shipment documents.");
      return runIdempotentCommand({
        transaction: ports.transaction, idempotency: ports.idempotency, actor,
        key: idempotencyKey, command: "create_shipment_document",
        handler: async tx => {
          await requireShipment(tx, document.shipmentId);
          const record = createShipmentDocumentContract({
            ...document, documentId: idFactory("document"),
            generatedBy: actor, generatedAt: nowIso(clock),
          });
          await ports.documents.create(tx, record.shipmentId, record);
          return { documentId: record.documentId, shipmentId: record.shipmentId, version: record.version };
        },
      });
    },

    async queueShipmentNotification({ actor, idempotencyKey, notification }) {
      if (!["admin", "system"].includes(actor?.type) || !actor?.id) fail("FORBIDDEN_ACTOR", "Only Admin or a trusted system actor may queue shipment notifications.");
      return runIdempotentCommand({
        transaction: ports.transaction, idempotency: ports.idempotency, actor,
        key: idempotencyKey, command: "queue_shipment_notification",
        handler: async tx => {
          await requireShipment(tx, notification.shipmentId);
          const existing = await ports.notifications.findByDeduplicationKey(tx, notification.deduplicationKey);
          if (existing) return { notificationId: existing.notificationId, deduplicated: true };
          const timestamp = nowIso(clock);
          const record = createNotificationContract({
            ...notification, notificationId: idFactory("notification"),
            createdAt: timestamp, updatedAt: timestamp, status: "pending",
          });
          await ports.notifications.create(tx, record);
          return { notificationId: record.notificationId, deduplicated: false };
        },
      });
    },

    async recordNotificationAttempt({ actor, idempotencyKey, notificationId, attempt }) {
      if (actor?.type !== "system" || !actor?.id) fail("FORBIDDEN_ACTOR", "Only a trusted system actor may record delivery attempts.");
      return runIdempotentCommand({
        transaction: ports.transaction, idempotency: ports.idempotency, actor,
        key: idempotencyKey, command: "record_notification_attempt",
        handler: async tx => {
          const notification = await ports.notifications.getById(tx, notificationId);
          if (!notification) fail("NOTIFICATION_NOT_FOUND", "Notification does not exist.");
          const timestamp = nowIso(clock);
          const record = createNotificationAttemptContract({
            ...attempt, attemptId: idFactory("notification-attempt"),
            notificationId, attemptedAt: timestamp,
          });
          await ports.notifications.appendAttempt(tx, notificationId, record);
          await ports.notifications.updateStatus(tx, notificationId, {
            status: record.status, updatedAt: timestamp, lastAttemptAt: timestamp,
          });
          return { notificationId, attemptId: record.attemptId, status: record.status };
        },
      });
    },
  });
}
