import type { DocumentReference, Timestamp } from "firebase/firestore";

export type PaymentStatus =
  | "pending"
  | "successful"
  | "failed"
  | "refunded"
  | "cancelled"
  | "chargeback"
  | "disputed"
  | "paid"
  | "processing";

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

export interface OrderShipping {
  provider: string | null;
  trackingNumber: string | null;
  shippedAt: Timestamp | null;
  estimatedDeliveryAt: Timestamp | null;
  deliveredAt: Timestamp | null;
  notes: string | null;
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

  /** Optional for compatibility with orders created before shipping fields existed. */
  shipping?: OrderShipping;

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

  shipping?: Partial<OrderShipping>;
}