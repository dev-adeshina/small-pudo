"use client"

import { useEffect, useState } from "react"

import {
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react"

import type { Category } from "@/lib/types/category"

import {
  deleteCategory,
  getCategoryProductCount,
} from "@/lib/firebase/categories"

type Props = {
  category: Category
  onDeleted: (id: string) => void
  onCancel: () => void
}

export function DeleteCategoryDialog({
  category,
  onDeleted,
  onCancel,
}: Props) {
  const [checking, setChecking] =
    useState(true)

  const [deleting, setDeleting] =
    useState(false)

  const [productCount, setProductCount] =
    useState<number | null>(null)

  const [error, setError] =
    useState("")

  useEffect(() => {
    let cancelled = false

    async function checkProducts() {
      setChecking(true)
      setProductCount(null)
      setError("")

      try {
        const count =
          await getCategoryProductCount(
            category.slug
          )

        if (!cancelled) {
          setProductCount(count)
        }
      } catch {
        if (!cancelled) {
          setError(
            "Unable to check products belonging to this category."
          )
        }
      } finally {
        if (!cancelled) {
          setChecking(false)
        }
      }
    }

    checkProducts()

    return () => {
      cancelled = true
    }
  }, [category.slug])

  async function handleDelete() {
    if (
      productCount === null ||
      productCount > 0
    ) {
      return
    }

    setDeleting(true)
    setError("")

    try {
      await deleteCategory(category.id)

      onDeleted(category.id)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete category."
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="category-delete-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-category-title"
    >
      <div className="category-delete-dialog">
        <div className="category-delete-header">
          <div className="category-delete-icon">
            <AlertTriangle size={19} />
          </div>

          <div>
            <span className="section-label">
              CATEGORY / DELETE
            </span>

            <h2 id="delete-category-title">
              Delete category?
            </h2>

            <p>
              You are about to delete{" "}
              <strong>
                {category.name}
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
          {checking ? (
            <div className="category-delete-checking">
              <Loader2
                size={17}
                className="category-spinner"
              />

              Checking products...
            </div>
          ) : productCount === null ? (
            <div className="category-delete-error">
              {error}
            </div>
          ) : productCount > 0 ? (
            <div className="category-delete-warning">
              <strong>
                This category cannot be deleted.
              </strong>

              <p>
                {productCount} product
                {productCount === 1
                  ? ""
                  : "s"} currently belong
                {productCount === 1
                  ? "s"
                  : ""} to this category.
              </p>

              <p>
                Move or remove those products
                first.
              </p>
            </div>
          ) : (
            <div className="category-delete-confirmation">
              <p>
                No products currently belong to
                this category.
              </p>

              <p>
                This action cannot be undone.
              </p>
            </div>
          )}

          {error &&
            !checking &&
            productCount !== null && (
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
            disabled={
              checking ||
              deleting ||
              productCount === null ||
              productCount > 0
            }
            className="category-button category-button-danger"
          >
            {deleting && (
              <Loader2
                size={15}
                className="category-spinner"
              />
            )}

            Delete category
          </button>
        </div>
      </div>
    </div>
  )
}
