import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  type DocumentReference,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type {
  CreateOrderData,
  Order,
} from "@/lib/types/order";

const COLLECTION_NAME = "orders";

const ordersCollection = collection(db, COLLECTION_NAME);

export async function createOrder(
  data: CreateOrderData
): Promise<string> {
  const orderData = {
    userId: data.userId,

    customer: data.customer,

    delivery: data.delivery,

    items: data.items,

    subtotal: data.subtotal,
    deliveryFee: data.deliveryFee,
    total: data.total,
    currency: data.currency,

    paymentStatus: data.paymentStatus ?? "pending",
    paymentReference: data.paymentReference ?? null,

    orderStatus: data.orderStatus ?? "pending",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const orderRef = await addDoc(
    ordersCollection,
    orderData
  );

  return orderRef.id;
}

export async function getOrderById(
  orderId: string
): Promise<Order | null> {
  const orderRef = doc(db, COLLECTION_NAME, orderId);

  const snapshot = await getDoc(orderRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,
    ...(data as Omit<Order, "id">),
  };
}

