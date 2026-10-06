"use client"

import { Loader2, X } from "lucide-react"
import { useState } from "react"

import type { Product } from "@/lib/types/product"

import {
  deleteProduct,
} from "@/lib/firebase/products"

type Props = {
  product: Product
  onDeleted: (id: string) => void
  onCancel: () => void
}

export function DeleteProductDialog({
  product,
  onDeleted,
  onCancel,
}: Props) {
  const [deleting, setDeleting] =
    useState(false)

  const [error, setError] =
    useState("")

  async function handleDelete() {
    setDeleting(true)
    setError("")

    try {
      await deleteProduct(
        product.id
      )

      onDeleted(product.id)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete product."
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="category-delete-backdrop">
      <div className="category-delete-dialog">
        <div className="category-delete-header">
          <div>
            <span className="section-label">
              PRODUCT / DELETE
            </span>

            <h2>
              Delete product?
            </h2>

            <p>
              You are about to delete{" "}
              <strong>
                {product.name}
              </strong>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="category-delete-close"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <div className="category-delete-body">
          <div className="category-delete-warning">
            This action cannot be undone.
          </div>

          {error && (
            <p className="category-field-error category-delete-inline-error">
              {error}
            </p>
          )}
        </div>

        <div className="category-delete-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="category-button category-button-secondary"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="category-button category-button-danger"
          >
            {deleting && (
              <Loader2
                size={15}
                className="category-spinner"
              />
            )}

            Delete product
          </button>
        </div>
      </div>
    </div>
  )
}