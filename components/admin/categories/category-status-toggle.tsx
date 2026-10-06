"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import type { Category } from "@/lib/types/category"

import { setCategoryActive } from "@/lib/firebase/categories"

type Props = {
  category: Category
  onChanged: (category: Category) => void
}

export function CategoryStatusToggle({
  category,
  onChanged,
}: Props) {
  const [loading, setLoading] =
    useState(false)

  async function toggle() {
    setLoading(true)

    try {
      const nextStatus =
        !category.isActive

      await setCategoryActive(
        category.id,
        nextStatus
      )

      onChanged({
        ...category,
        isActive: nextStatus,
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
      className={`category-status-toggle ${
        category.isActive
          ? "is-active"
          : "is-inactive"
      }`}
      aria-label={
        category.isActive
          ? "Deactivate category"
          : "Activate category"
      }
    >
      {loading ? (
        <Loader2
          size={12}
          className="category-spinner"
        />
      ) : (
        <span />
      )}

      {category.isActive
        ? "Active"
        : "Inactive"}
    </button>
  )
}

