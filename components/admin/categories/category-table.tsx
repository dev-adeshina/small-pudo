
"use client"

import Image from "next/image"

import {
  Edit,
  Trash2,
} from "lucide-react"

import type { Category } from "@/lib/types/category"

import { CategoryStatusToggle } from "./category-status-toggle"

type Props = {
  categories: Category[]
  productCounts: Record<string, number>
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onStatusChanged: (category: Category) => void
}

export function CategoryTable({
  categories,
  productCounts,
  onEdit,
  onDelete,
  onStatusChanged,
}: Props) {
  if (categories.length === 0) {
    return (
      <div className="category-empty">
        <div className="category-empty-icon">
          <span>—</span>
        </div>

        <strong>No categories found</strong>

        <p>
          Try another search or create a new
          category.
        </p>
      </div>
    )
  }

  return (
    <div className="category-table-wrap">
      <div className="category-table-scroll">
        <table className="category-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Category</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Products</th>
              <th className="category-table-actions-heading">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>
                  <div className="category-table-image">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="category-table-image-img"
                        sizes="52px"
                      />
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </td>

                <td>
                  <div className="category-table-name">
                    <strong>
                      {category.name}
                    </strong>

                    <span>
                      {category.description}
                    </span>
                  </div>
                </td>

                <td>
                  <code className="category-slug">
                    {category.slug}
                  </code>
                </td>

                <td>
                  <CategoryStatusToggle
                    category={category}
                    onChanged={onStatusChanged}
                  />
                </td>

                <td>
                  <strong className="category-product-count">
                    {productCounts[
                      category.id
                    ] ?? 0}
                  </strong>
                </td>

                <td>
                  <div className="category-row-actions">
                    <button
                      type="button"
                      onClick={() =>
                        onEdit(category)
                      }
                      className="category-row-button"
                      aria-label={`Edit ${category.name}`}
                    >
                      <Edit size={14} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(category)
                      }
                      className="category-row-button category-row-button-danger"
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

