export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  categoryId: string;
  price: number;
  currency: string;
  image: string;
  quantity: number;
  stock: number;
}