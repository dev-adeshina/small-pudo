import type { DocumentReference, Timestamp } from "firebase/firestore";

export type PaymentStatus =
  | "pending"
  | "successful"
  | "failed"
  | "refunded";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready_for_shipping"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface OrderDelivery {
  address: string;
  city: string;
  state: string;
  country: string;
  instructions: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;

  userId: DocumentReference | null;

  customer: OrderCustomer;

  delivery: OrderDelivery;

  items: OrderItem[];

  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;

  paymentStatus: PaymentStatus;
  paymentReference: string | null;

  orderStatus: OrderStatus;

  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface CreateOrderData {
  userId: DocumentReference | null;

  customer: OrderCustomer;

  delivery: OrderDelivery;

  items: OrderItem[];

  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;

  paymentStatus?: PaymentStatus;
  paymentReference?: string | null;

  orderStatus?: OrderStatus;
}