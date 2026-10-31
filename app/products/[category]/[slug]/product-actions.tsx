"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";

interface ProductActionsProps {
  productId: string;
  name: string;
  slug: string;
  categoryId: string;
  price: number;
  currency: string;
  images: string[];
  stock: number;
}

export default function ProductActions({
  productId,
  name,
  slug,
  categoryId,
  price,
  currency,
  images,
  stock,
}: ProductActionsProps) {
  const router = useRouter();

  const {
    items,
    isReady,
    addToCart,
    updateQuantity,
  } = useCart();

  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const [added, setAdded] = useState(false);

  const isOutOfStock = stock <= 0;

  // Check whether this product is already in the cart.
  const cartItem = items.find(
    (item) => item.productId === productId
  );

  const quantity = cartItem
    ? Math.min(stock, cartItem.quantity)
    : selectedQuantity;

  // Synchronize the requested quantity with the cart.
  const syncCartQuantity = (nextQuantity: number) => {
    if (stock <= 0) return;

    const safeQuantity = Math.max(
      1,
      Math.min(nextQuantity, stock)
    );

    if (cartItem) {
      updateQuantity(productId, safeQuantity);
    } else {
      addToCart({
        productId,
        name,
        slug,
        categoryId,
        price,
        currency,
        image: images?.[0] ?? "",
        quantity: safeQuantity,
        stock,
      });
    }

    setAdded(true);
  };

  // Increase quantity and update the cart immediately.
  const increaseQuantity = () => {
    if (isOutOfStock || quantity >= stock) return;

    const nextQuantity = quantity + 1;

    setSelectedQuantity(nextQuantity);
    syncCartQuantity(nextQuantity);
  };

  // Decrease quantity and update the cart immediately.
  const decreaseQuantity = () => {
    if (isOutOfStock || quantity <= 1) return;

    const nextQuantity = quantity - 1;

    setSelectedQuantity(nextQuantity);
    syncCartQuantity(nextQuantity);
  };

  // Add or synchronize the selected quantity, then open the cart.
  const handleAddToCart = () => {
    if (isOutOfStock || !isReady) return;

    syncCartQuantity(quantity);

    router.push("/cart");
  };

  return (
    <div className="product-actions">
      <div className="product-stock">
        {isOutOfStock ? (
          <span className="out-of-stock">
            Out of stock
          </span>
        ) : (
          <span>{stock} in stock</span>
        )}
      </div>

      <div className="product-quantity">
        <span>Quantity</span>

        <div className="quantity-control">
          <button
            type="button"
            onClick={decreaseQuantity}
            disabled={
              isOutOfStock ||
              quantity <= 1 ||
              !isReady
            }
            aria-label="Decrease quantity"
          >
            −
          </button>

          <span aria-live="polite">
            {quantity}
          </span>

          <button
            type="button"
            onClick={increaseQuantity}
            disabled={
              isOutOfStock ||
              quantity >= stock ||
              !isReady
            }
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        className="product-add-to-cart"
        onClick={handleAddToCart}
        disabled={isOutOfStock || !isReady}
      >
        {isOutOfStock
          ? "Out of Stock"
          : !isReady
            ? "Loading Cart..."
            : added
              ? "Proceed to Cart →"
              : "Add to Cart"}
      </button>
    </div>
  );
}