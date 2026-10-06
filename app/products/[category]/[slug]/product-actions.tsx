"use client";

import { useState } from "react";
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
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const isOutOfStock = stock <= 0;

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    setQuantity((current) =>
      Math.min(stock, current + 1)
    );
  };

  // const handleAddToCart = () => {
  //   if (stock <= 0) {
  //     return;
  //   }

  //   if (quantity > stock) {
  //     return;
  //   }

  //   addToCart({
  //     productId,
  //     name,
  //     slug,
  //     categoryId,
  //     price,
  //     currency,
  //     image: images[0] ?? "",
  //     quantity,
  //     stock,
  //   });
  // };

  const handleAddToCart = () => {
    if (stock <= 0) {
      return;
    }

    if (quantity > stock) {
      return;
    }

    addToCart({
      productId,
      name,
      slug,
      categoryId,
      price,
      currency,
      image: images[0] ?? "",
      quantity,
      stock,
    });

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 2000);
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
            disabled={isOutOfStock || quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>

          <span>{quantity}</span>

          <button
            type="button"
            onClick={increaseQuantity}
            disabled={
              isOutOfStock ||
              quantity >= stock
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
        disabled={isOutOfStock}
      >
        {isOutOfStock
          ? "Out of Stock"
          : added
            ? "Added to Cart ✓"
            : "Add to Cart"}
      </button>
    </div>
  );
}

