import { NextResponse } from "next/server";
import {
  createHash,
  timingSafeEqual,
} from "node:crypto";
import {
  FieldValue,
} from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

interface CancelRequestBody {
  orderAccessToken: string;
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hashToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function hashesMatch(
  storedHash: unknown,
  suppliedHash: string
): boolean {
  if (
    typeof storedHash !== "string" ||
    !/^[a-f0-9]{64}$/i.test(storedHash)
  ) {
    return false;
  }

  const stored = Buffer.from(storedHash, "hex");
  const supplied = Buffer.from(suppliedHash, "hex");

  return (
    stored.length === supplied.length &&
    timingSafeEqual(stored, supplied)
  );
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ orderId: string }>;
  }
) {
  try {
    const { orderId } = await context.params;

    if (
      !orderId ||
      orderId.length > 150 ||
      orderId.includes("/")
    ) {
      return NextResponse.json(
        { error: "Invalid order ID." },
        { status: 400 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (
      !isRecord(body) ||
      typeof body.orderAccessToken !== "string" ||
      !/^[a-f0-9]{64}$/i.test(body.orderAccessToken)
    ) {
      return NextResponse.json(
        { error: "A valid order-management token is required." },
        { status: 400 }
      );
    }

    const suppliedHash = hashToken(
      body.orderAccessToken
    );

    const orderRef = adminDb
      .collection("orders")
      .doc(orderId);

    const result = await adminDb.runTransaction(
      async (transaction) => {
        /*
         * Read the order first.
         */
        const orderSnapshot =
          await transaction.get(orderRef);

        if (!orderSnapshot.exists) {
          return {
            status: 404,
            error: "Order not found.",
          };
        }

        const order = orderSnapshot.data();

        if (!order) {
          return {
            status: 404,
            error: "Order not found.",
          };
        }

        /*
         * Verify that the requester possesses the
         * order-management token.
         */
        if (
          !hashesMatch(
            order.orderAccessTokenHash,
            suppliedHash
          )
        ) {
          return {
            status: 403,
            error: "Invalid order-management token.",
          };
        }

        /*
         * Do not restore stock twice.
         */
        if (order.orderStatus === "cancelled") {
          return {
            status: 409,
            error: "This order has already been cancelled.",
          };
        }

        /*
         * Only unpaid, pending orders can use this
         * cancellation endpoint.
         */
        if (
          order.orderStatus !== "pending" ||
          order.paymentStatus !== "pending"
        ) {
          return {
            status: 409,
            error:
              "This order can no longer be cancelled through this endpoint.",
          };
        }

        if (
          !Array.isArray(order.items) ||
          order.items.length === 0
        ) {
          return {
            status: 409,
            error: "The order has invalid item data.",
          };
        }

        const quantitiesByProduct = new Map<string, number>();

        for (const item of order.items) {
          if (!isRecord(item)) {
            return {
              status: 409,
              error: "The order contains invalid item data.",
            };
          }

          const productId = item.productId;
          const quantity = item.quantity;

          if (
            typeof productId !== "string" ||
            !productId.trim() ||
            typeof quantity !== "number" ||
            !Number.isSafeInteger(quantity) ||
            quantity <= 0
          ) {
            return {
              status: 409,
              error: "The order contains invalid item data.",
            };
          }

          const currentQuantity =
            quantitiesByProduct.get(productId) ?? 0;

          const combinedQuantity =
            currentQuantity + quantity;

          if (!Number.isSafeInteger(combinedQuantity)) {
            return {
              status: 409,
              error: "The order contains invalid item quantities.",
            };
          }

          quantitiesByProduct.set(
            productId,
            combinedQuantity
          );
        }

        const items = Array.from(
          quantitiesByProduct,
          ([productId, quantity]) => ({
            productId,
            quantity,
            ref: adminDb
              .collection("products")
              .doc(productId),
          })
        );

        /*
         * Read every product before performing any writes.
         */
        const productSnapshots = [];

        for (const item of items) {
          const snapshot = await transaction.get(
            item.ref
          );

          if (!snapshot.exists) {
            return {
              status: 409,
              error:
                "A product in this order no longer exists. Stock was not restored.",
            };
          }

          productSnapshots.push({
            item,
            snapshot,
          });
        }

        /*
         * Verify current stock values before restoring.
         */
        for (const entry of productSnapshots) {
          const product = entry.snapshot.data();

          if (
            !product ||
            typeof product.stock !== "number" ||
            !Number.isSafeInteger(product.stock) ||
            product.stock < 0 ||
            !Number.isSafeInteger(
              product.stock + entry.item.quantity
            )
          ) {
            return {
              status: 409,
              error:
                "Unable to safely restore product stock.",
            };
          }
        }

        /*
         * All reads are complete. Restore stock and
         * cancel the order atomically.
         */
        for (const entry of productSnapshots) {
          const product = entry.snapshot.data()!;

          transaction.update(entry.item.ref, {
            stock:
              product.stock + entry.item.quantity,
            updatedAt:
              FieldValue.serverTimestamp(),
          });
        }

        transaction.update(orderRef, {
          orderStatus: "cancelled",
          updatedAt: FieldValue.serverTimestamp(),
          cancelledAt: FieldValue.serverTimestamp(),
        });

        return {
          status: 200,
          success: true,
          orderId,
          message:
            "Order cancelled and reserved stock restored.",
        };
      }
    );

    return NextResponse.json(
      result,
      { status: result.status }
    );
  } catch (error) {
    console.error(
      "Failed to cancel order:",
      error
    );

    return NextResponse.json(
      { error: "Unable to cancel order." },
      { status: 500 }
    );
  }
}