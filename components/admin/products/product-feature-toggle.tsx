"use client"

import { useState } from "react"
import { Loader2, Star } from "lucide-react"

import type { Product } from "@/lib/types/product"

import {
  setProductFeatured,
} from "@/lib/firebase/products"

type Props = {
  product: Product
  onChanged: (product: Product) => void
}

export function ProductFeatureToggle({
  product,
  onChanged,
}: Props) {
  const [loading, setLoading] =
    useState(false)

  async function toggle() {
    setLoading(true)

    try {
      const next =
        !product.featured

      await setProductFeatured(
        product.id,
        next
      )

      onChanged({
        ...product,
        featured: next,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`product-featured ${
        product.featured
          ? "active"
          : ""
      }`}
      aria-label={
        product.featured
          ? "Unmark featured"
          : "Mark featured"
      }
    >
      {loading ? (
        <Loader2
          size={12}
          className="category-spinner"
        />
      ) : (
        <Star size={12} />
      )}

      {product.featured
        ? "Featured"
        : "Feature"}
    </button>
  )
}