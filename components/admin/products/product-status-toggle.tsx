"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import type { Product } from "@/lib/types/product"

import {
  setProductActive,
} from "@/lib/firebase/products"

type Props = {
  product: Product
  onChanged: (product: Product) => void
}

export function ProductStatusToggle({
  product,
  onChanged,
}: Props) {
  const [loading, setLoading] =
    useState(false)

  async function toggle() {
    setLoading(true)

    try {
      const next =
        !product.isActive

      await setProductActive(
        product.id,
        next
      )

      onChanged({
        ...product,
        isActive: next,
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
      className={`product-status ${
        product.isActive
          ? "active"
          : "inactive"
      }`}
    >
      {loading && (
        <Loader2
          size={11}
          className="category-spinner"
        />
      )}

      {product.isActive
        ? "Active"
        : "Inactive"}
    </button>
  )
}