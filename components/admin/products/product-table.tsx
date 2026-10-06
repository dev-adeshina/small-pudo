"use client"

import Image from "next/image"
import {
  Edit,
  Trash2,
} from "lucide-react"

import type { Category } from "@/lib/types/category"
import type { Product } from "@/lib/types/product"

import {
  ProductStatusToggle,
} from "./product-status-toggle"

import {
  ProductFeatureToggle,
} from "./product-feature-toggle"

type Props = {
  products: Product[]
  categories: Category[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onChanged: (product: Product) => void
}

export function ProductTable({
  products,
  categories,
  onEdit,
  onDelete,
  onChanged,
}: Props) {
  const categoryMap = new Map(
    categories.map((category) => [
      category.id,
      category.name,
    ])
  )

  if (products.length === 0) {
    return (
      <div className="product-empty">
        <strong>
          No products found
        </strong>

        <p>
          Try another search or add
          your first product.
        </p>
      </div>
    )
  }

  return (
    <div className="product-table-wrap">
      <div className="product-table-scroll">
        <table className="product-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="product-table-identity">
                    <div className="product-table-image">
                      {/* {product.images[0] ? (
                        <Image
                          src={
                            product.images[0]
                          }
                          alt={
                            product.name
                          }
                          fill
                          sizes="52px"
                          className="product-table-image-img"
                        />
                      ) : (
                        <span>—</span>
                      )} */}
                    </div>

                    <div>
                      <strong>
                        {product.name}
                      </strong>

                      <span>
                        {product.slug}
                      </span>
                    </div>
                  </div>
                </td>

                <td>
                  <span className="product-category-name">
                    {categoryMap.get(
                      product.categoryId
                    ) ?? "Unknown category"}
                  </span>
                </td>

                <td>
                  <strong className="product-price">
                    {product.currency}{" "}
                    {product.price.toLocaleString()}
                  </strong>
                </td>

                <td>
                  <strong
                    className={
                      product.stock === 0
                        ? "product-stock out"
                        : "product-stock"
                    }
                  >
                    {product.stock}
                  </strong>
                </td>

                <td>
                  <ProductStatusToggle
                    product={product}
                    onChanged={onChanged}
                  />
                </td>

                <td>
                  <ProductFeatureToggle
                    product={product}
                    onChanged={onChanged}
                  />
                </td>

                <td>
                  <div className="product-row-actions">
                    <button
                      type="button"
                      className="category-row-button"
                      onClick={() =>
                        onEdit(product)
                      }
                    >
                      <Edit size={14} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="category-row-button category-row-button-danger"
                      onClick={() =>
                        onDelete(product)
                      }
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