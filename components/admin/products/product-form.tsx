"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, X } from "lucide-react"

import type { Category } from "@/lib/types/category"
import type {
  Product,
  ProductFormData,
} from "@/lib/types/product"

import {
  createProduct,
  updateProduct,
} from "@/lib/firebase/products"

import {
  generateSlug,
} from "@/lib/validations/category"

import {
  validateProduct,
} from "@/lib/validations/product"

import { ProductImageUpload } from "./product-image-upload"

type Props = {
  product?: Product | null
  categories: Category[]
  onSuccess: (product: Product) => void
  onCancel: () => void
}

const emptyForm: ProductFormData = {
  categoryId: "",
  name: "",
  slug: "",
  description: "",
  price: 0,
  currency: "NGN",
  images: [],
  stock: 0,
  isActive: true,
  featured: false,
  features: [],
}

export function ProductForm({
  product,
  categories,
  onSuccess,
  onCancel,
}: Props) {
  const isEditing = Boolean(product)

  const [form, setForm] =
    useState<ProductFormData>(emptyForm)

  const [errors, setErrors] =
    useState<Record<string, string>>({})

  const [saving, setSaving] =
    useState(false)

  const [slugManuallyEdited, setSlugManuallyEdited] =
    useState(false)

  const [featureInput, setFeatureInput] =
    useState("")

  useEffect(() => {
    if (product) {
      setForm({
        categoryId: product.categoryId,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        currency: product.currency,
        images: product.images,
        stock: product.stock,
        isActive: product.isActive,
        featured: product.featured,
        features: product.features,
      })

      setSlugManuallyEdited(true)
    } else {
      setForm(emptyForm)
      setSlugManuallyEdited(false)
    }

    setErrors({})
    setFeatureInput("")
  }, [product])

  function updateField<
    K extends keyof ProductFormData
  >(
    field: K,
    value: ProductFormData[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setErrors((current) => ({
      ...current,
      [field]: "",
      form: "",
    }))
  }

  function handleNameChange(
    value: string
  ) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: slugManuallyEdited
        ? current.slug
        : generateSlug(value),
    }))

    setErrors((current) => ({
      ...current,
      name: "",
      slug: "",
      form: "",
    }))
  }

  function handleSlugChange(
    value: string
  ) {
    setSlugManuallyEdited(true)

    updateField(
      "slug",
      generateSlug(value)
    )
  }

  function addFeature() {
    const feature =
      featureInput.trim()

    if (!feature) {
      return
    }

    if (
      form.features.some(
        (item) =>
          item.toLowerCase() ===
          feature.toLowerCase()
      )
    ) {
      setFeatureInput("")
      return
    }

    updateField(
      "features",
      [...form.features, feature]
    )

    setFeatureInput("")
  }

  function removeFeature(
    index: number
  ) {
    updateField(
      "features",
      form.features.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    )
  }

  function handleFeatureKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      event.preventDefault()
      addFeature()
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const validationErrors =
      validateProduct(form)

    if (
      Object.keys(validationErrors)
        .length
    ) {
      setErrors(validationErrors)
      return
    }

    setSaving(true)
    setErrors({})

    try {
      const saved = isEditing
        ? await updateProduct(
            product!.id,
            form
          )
        : await createProduct(form)

      onSuccess(saved)
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "Unable to save product.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="product-form"
    >
      {errors.form && (
        <div className="product-form-error">
          {errors.form}
        </div>
      )}

      <div className="product-form-grid">
        <div className="product-form-field">
          <label htmlFor="product-name">
            Product name
          </label>

          <input
            id="product-name"
            value={form.name}
            onChange={(event) =>
              handleNameChange(
                event.target.value
              )
            }
            placeholder="e.g. Jollof Rice"
            disabled={saving}
          />

          {errors.name && (
            <p className="category-field-error">
              {errors.name}
            </p>
          )}
        </div>

        <div className="product-form-field">
          <label htmlFor="product-category">
            Category
          </label>

          <select
            id="product-category"
            value={form.categoryId}
            onChange={(event) =>
              updateField(
                "categoryId",
                event.target.value
              )
            }
            disabled={saving}
          >
            <option value="">
              Select category
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
                {!category.isActive
                  ? " — Inactive"
                  : ""}
              </option>
            ))}
          </select>

          {errors.categoryId && (
            <p className="category-field-error">
              {errors.categoryId}
            </p>
          )}
        </div>

        <div className="product-form-field">
          <label htmlFor="product-slug">
            Slug
          </label>

          <input
            id="product-slug"
            value={form.slug}
            onChange={(event) =>
              handleSlugChange(
                event.target.value
              )
            }
            placeholder="jollof-rice"
            disabled={saving}
          />

          {errors.slug && (
            <p className="category-field-error">
              {errors.slug}
            </p>
          )}
        </div>

        <div className="product-form-field">
          <label htmlFor="product-currency">
            Currency
          </label>

          <input
            id="product-currency"
            value={form.currency}
            maxLength={3}
            onChange={(event) =>
              updateField(
                "currency",
                event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "")
              )
            }
            disabled={saving}
          />

          {errors.currency && (
            <p className="category-field-error">
              {errors.currency}
            </p>
          )}
        </div>

        <div className="product-form-field">
          <label htmlFor="product-price">
            Price
          </label>

          <input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) =>
              updateField(
                "price",
                Number(event.target.value)
              )
            }
            disabled={saving}
          />

          {errors.price && (
            <p className="category-field-error">
              {errors.price}
            </p>
          )}
        </div>

        <div className="product-form-field">
          <label htmlFor="product-stock">
            Stock
          </label>

          <input
            id="product-stock"
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(event) =>
              updateField(
                "stock",
                Number(event.target.value)
              )
            }
            disabled={saving}
          />

          {errors.stock && (
            <p className="category-field-error">
              {errors.stock}
            </p>
          )}
        </div>

        <div className="product-form-field product-form-field-full">
          <label htmlFor="product-description">
            Description
          </label>

          <textarea
            id="product-description"
            rows={5}
            value={form.description}
            onChange={(event) =>
              updateField(
                "description",
                event.target.value
              )
            }
            placeholder="Freshly prepared Nigerian-style jollof rice."
            disabled={saving}
          />

          {errors.description && (
            <p className="category-field-error">
              {errors.description}
            </p>
          )}
        </div>

        <div className="product-form-field product-form-field-full">
          <label>Product images</label>

          <ProductImageUpload
            value={form.images}
            onChange={(images) =>
              updateField(
                "images",
                images
              )
            }
            disabled={saving}
          />
        </div>

        <div className="product-form-field product-form-field-full">
          <label>Features</label>

          <div className="product-feature-input">
            <input
              value={featureInput}
              onChange={(event) =>
                setFeatureInput(
                  event.target.value
                )
              }
              onKeyDown={
                handleFeatureKeyDown
              }
              placeholder="e.g. Ready to eat"
              disabled={saving}
            />

            <button
              type="button"
              onClick={addFeature}
              disabled={
                saving ||
                !featureInput.trim()
              }
              className="category-button category-button-secondary"
            >
              <Plus size={15} />
              Add
            </button>
          </div>

          {form.features.length > 0 && (
            <div className="product-features">
              {form.features.map(
                (feature, index) => (
                  <span
                    key={`${feature}-${index}`}
                  >
                    {feature}

                    <button
                      type="button"
                      onClick={() =>
                        removeFeature(
                          index
                        )
                      }
                      disabled={saving}
                      aria-label={`Remove ${feature}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                )
              )}
            </div>
          )}

          {errors.features && (
            <p className="category-field-error">
              {errors.features}
            </p>
          )}
        </div>
      </div>

      <div className="product-toggle-grid">
        <label className="product-toggle-field">
          <span>
            <strong>Active</strong>
            <small>
              Show this product in the
              storefront.
            </small>
          </span>

          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) =>
              updateField(
                "isActive",
                event.target.checked
              )
            }
            disabled={saving}
          />
        </label>

        <label className="product-toggle-field">
          <span>
            <strong>Featured</strong>
            <small>
              Mark this product as
              featured.
            </small>
          </span>

          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) =>
              updateField(
                "featured",
                event.target.checked
              )
            }
            disabled={saving}
          />
        </label>
      </div>

      <div className="category-form-actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="category-button category-button-secondary"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="category-button category-button-primary"
        >
          {saving && (
            <Loader2
              size={15}
              className="category-spinner"
            />
          )}

          {isEditing
            ? "Update product"
            : "Create product"}
        </button>
      </div>
    </form>
  )
}