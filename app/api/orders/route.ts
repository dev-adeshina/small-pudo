import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { Resend } from "resend";

export const runtime = "nodejs";

class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

interface NormalizedItem {
  productId: string;
  quantity: number;
}

interface ValidatedOrderItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  subtotal: number;
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

function requiredString(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new OrderValidationError(
      `${fieldName} is required.`
    );
  }

  return value.trim();
}


function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

export async function POST(request: Request) {
  try {


    // Guest checkout remains available when no token is supplied.
    let customerUid: string | null = null;

    const authorization = request.headers.get("authorization");

    if (authorization !== null) {
      if (!authorization.startsWith("Bearer ")) {
        return NextResponse.json(
          { error: "Invalid authorization header." },
          { status: 401 }
        );
      }

      const idToken = authorization.slice("Bearer ".length).trim();

      if (!idToken) {
        return NextResponse.json(
          { error: "Missing authentication token." },
          { status: 401 }
        );
      }

      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        if (decodedToken.email_verified !== true) {
          return NextResponse.json(
            { error: "Please verify your email before placing an account order." },
            { status: 403 }
          );
        }

        customerUid = decodedToken.uid;
      } catch {
        return NextResponse.json(
          { error: "Your session is invalid or expired. Please sign in again." },
          { status: 401 }
        );
      }
    }

    const userId = customerUid
      ? adminDb.collection("users").doc(customerUid)
      : null;
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Invalid order data." },
        { status: 400 }
      );
    }

    /*
     * 1. Validate customer information.
     */
    if (!isRecord(body.customer)) {
      throw new OrderValidationError(
        "Customer information is required."
      );
    }

    const customer = {
      name: requiredString(
        body.customer.name,
        "Customer name"
      ),
      email: requiredString(
        body.customer.email,
        "Customer email"
      ),
      phone: requiredString(
        body.customer.phone,
        "Customer phone"
      ),
    };

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        customer.email
      )
    ) {
      throw new OrderValidationError(
        "Please provide a valid email address."
      );
    }

    /*
     * 2. Validate delivery information.
     */
    if (!isRecord(body.delivery)) {
      throw new OrderValidationError(
        "Delivery information is required."
      );
    }

    const delivery = {
      address: requiredString(
        body.delivery.address,
        "Delivery address"
      ),
      city: requiredString(
        body.delivery.city,
        "Delivery city"
      ),
      state: requiredString(
        body.delivery.state,
        "Delivery state"
      ),
      country: requiredString(
        body.delivery.country,
        "Delivery country"
      ),
      instructions:
        typeof body.delivery.instructions ===
          "string"
          ? body.delivery.instructions.trim()
          : "",
    };

    /*
     * 3. Validate the cart.
     */
    if (
      !Array.isArray(body.items) ||
      body.items.length === 0 ||
      body.items.length > 50
    ) {
      throw new OrderValidationError(
        "Your cart must contain between 1 and 50 items."
      );
    }

    /*
     * Combine duplicate product IDs so a customer
     * cannot bypass the stock check with duplicate lines.
     */
    const quantities = new Map<string, number>();

    for (const rawItem of body.items) {
      if (!isRecord(rawItem)) {
        throw new OrderValidationError(
          "Invalid cart item."
        );
      }

      const productId = requiredString(
        rawItem.productId,
        "Product ID"
      );

      const quantity = rawItem.quantity;

      if (
        typeof quantity !== "number" ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0 ||
        quantity > 1000
      ) {
        throw new OrderValidationError(
          "Each product quantity must be a positive integer no greater than 1000."
        );
      }

      const combinedQuantity =
        (quantities.get(productId) ?? 0) +
        quantity;

      if (combinedQuantity > 1000) {
        throw new OrderValidationError(
          "The requested quantity is too large."
        );
      }

      quantities.set(
        productId,
        combinedQuantity
      );
    }

    const normalizedItems: NormalizedItem[] =
      Array.from(
        quantities,
        ([productId, quantity]) => ({
          productId,
          quantity,
        })
      );

    /*
     * Prepare references before starting the transaction.
     */
    const productReferences: Array<{
      item: NormalizedItem;
      ref: DocumentReference;
    }> = normalizedItems.map((item) => ({
      item,
      ref: adminDb
        .collection("products")
        .doc(item.productId),
    }));

    const orderRef = adminDb
      .collection("orders")
      .doc();

    // Generate a unique, unguessable order-management token.
    const orderAccessToken = randomBytes(32).toString("hex");

    // Store only the SHA-256 hash in Firestore.
    const orderAccessTokenHash = createHash("sha256")
      .update(orderAccessToken)
      .digest("hex");

    /*
     * 4. Validate products, reserve stock, and create
     * the order atomically.
     */
    const result = await adminDb.runTransaction(
      async (transaction) => {
        const productSnapshots = [];

        /*
         * Complete all reads before writing.
         */
        for (const entry of productReferences) {
          const snapshot = await transaction.get(
            entry.ref
          );

          if (!snapshot.exists) {
            throw new OrderValidationError(
              `Product ${entry.item.productId} was not found.`
            );
          }

          productSnapshots.push({
            item: entry.item,
            ref: entry.ref,
            snapshot,
          });
        }

        let subtotal = 0;

        const validatedItems: ValidatedOrderItem[] =
          [];

        /*
         * Validate current Firestore data and
         * calculate prices on the server.
         */
        for (const entry of productSnapshots) {
          const product = entry.snapshot.data();

          if (!product) {
            throw new OrderValidationError(
              "Unable to read product information."
            );
          }

          if (product.isActive !== true) {
            throw new OrderValidationError(
              `${product.name ?? "This product"} is no longer available.`
            );
          }

          if (
            typeof product.price !== "number" ||
            !Number.isFinite(product.price) ||
            product.price < 0
          ) {
            throw new OrderValidationError(
              `Invalid price for ${product.name ?? "a product"}.`
            );
          }

          if (
            typeof product.stock !== "number" ||
            !Number.isSafeInteger(product.stock) ||
            product.stock < 0
          ) {
            throw new OrderValidationError(
              `Invalid stock for ${product.name ?? "a product"}.`
            );
          }

          if (
            product.stock < entry.item.quantity
          ) {
            throw new OrderValidationError(
              `Insufficient stock for ${product.name ?? "this product"}. Available: ${product.stock}.`
            );
          }

          const itemSubtotal =
            product.price * entry.item.quantity;

          if (!Number.isFinite(itemSubtotal)) {
            throw new OrderValidationError(
              "The order total is invalid."
            );
          }

          subtotal += itemSubtotal;

          validatedItems.push({
            productId: entry.snapshot.id,
            name:
              typeof product.name === "string"
                ? product.name
                : "Product",
            slug:
              typeof product.slug === "string"
                ? product.slug
                : "",
            price: product.price,
            quantity: entry.item.quantity,
            subtotal: itemSubtotal,
          });
        }

        if (
          !Number.isFinite(subtotal) ||
          subtotal < 0
        ) {
          throw new OrderValidationError(
            "The order subtotal is invalid."
          );
        }

        /*
         * Delivery is free for now.
         */
        const deliveryFee = 0;
        const total = subtotal + deliveryFee;
        const currency = "NGN";

        if (!Number.isFinite(total)) {
          throw new OrderValidationError(
            "The order total is invalid."
          );
        }

        /*
         * Reserve stock by decreasing the current
         * quantity. Firestore retries transactions
         * when concurrent changes conflict.
         */
        for (const entry of productSnapshots) {
          const product = entry.snapshot.data()!;

          transaction.update(entry.ref, {
            stock:
              product.stock - entry.item.quantity,
            updatedAt:
              FieldValue.serverTimestamp(),
          });
        }

        /*
         * Create the order in the same transaction.
         * Either all these writes succeed or none do.
         */
        transaction.create(orderRef, {
          userId,
          orderAccessTokenHash,
          customer,
          delivery,
          items: validatedItems,

          subtotal,
          deliveryFee,
          total,
          currency,

          paymentStatus: "pending",
          paymentReference: "",
          orderStatus: "pending",

          createdAt:
            FieldValue.serverTimestamp(),
          updatedAt:
            FieldValue.serverTimestamp(),
        });

        return {
          orderId: orderRef.id,
          orderAccessToken,
          subtotal,
          deliveryFee,
          total,
          currency,
        };
      }
    );


    let trackingEmailSent = false;

    // Guest customers need an email link to recover their tracking access.
    // Registered customers continue using authenticated order tracking.
    if (!customerUid) {
      try {
        const apiKey = process.env.RESEND_API_KEY;
        const emailFrom = process.env.EMAIL_FROM;
        const appUrl = process.env.APP_URL;

        if (!apiKey || !emailFrom || !appUrl) {
          throw new Error(
            "Resend or application URL configuration is incomplete."
          );
        }

        const trackingUrl = new URL("/track-order", appUrl);

        trackingUrl.searchParams.set("orderId", result.orderId);

        // The fragment is not included in the HTTP request to the server.
        trackingUrl.hash = `token=${result.orderAccessToken}`;

        const resend = new Resend(apiKey);

        const safeCustomerName = escapeHtml(customer.name);
        const safeOrderId = escapeHtml(result.orderId);
        const safeTrackingUrl = escapeHtml(trackingUrl.toString());

        const { error } = await resend.emails.send({
          from: emailFrom,
          to: customer.email,
          subject: `Track your VeriLyft order ${result.orderId}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
              <h1>Thank you for ordering with VeriLyft</h1>

              <p>Hello ${safeCustomerName},</p>

              <p>
                Your order has been created successfully.
                You can use the link below to check its payment and delivery status.
              </p>

              <p>
                <strong>Order reference:</strong> ${safeOrderId}
              </p>

              <p style="margin: 28px 0;">
                <a
                  href="${safeTrackingUrl}"
                  style="background: #111; color: #fff; padding: 12px 20px;
                         text-decoration: none; border-radius: 5px;"
                >
                  Track your order
                </a>
              </p>

              <p>
                Keep this email private because its tracking link grants access
                to your order information. If you need assistance, contact
                VeriLyft support through our official website.
              </p>

              <p>Thank you for choosing VeriLyft — Beyond Borders.</p>
            </div>
          `,
          text: [
            "Thank you for ordering with VeriLyft.",
            "",
            `Hello ${customer.name},`,
            "",
            "Your order has been created successfully.",
            `Order reference: ${result.orderId}`,
            "",
            `Track your order: ${trackingUrl.toString()}`,
            "",
            "Keep this email private because its tracking link grants access to your order information.",
            "",
            "Thank you for choosing VeriLyft — Beyond Borders.",
          ].join("\n"),
        });

        if (error) {
          // Email failure must not invalidate an order already created.
          console.error("Resend could not send the guest tracking email.");
        } else {
          trackingEmailSent = true;
        }
      } catch {
        // Never roll back a successful order because email delivery failed.
        console.error(
          "Guest tracking email could not be sent. The order was created successfully."
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        ...result,
        trackingEmailSent,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.error(
      "Failed to create order:",
      error
    );

    return NextResponse.json(
      { error: "Unable to create order." },
      { status: 500 }
    );
  }
}