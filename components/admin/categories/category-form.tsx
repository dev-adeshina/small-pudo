"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import type {
  Category,
  CategoryFormData,
} from "@/lib/types/category"

import {
  createCategory,
  updateCategory,
} from "@/lib/firebase/categories"

import { generateSlug } from "@/lib/validations/category"

import { CategoryImageUpload } from "./category-image-upload"

type Props = {
  category?: Category | null
  onSuccess: (category: Category) => void
  onCancel: () => void
}

const emptyForm: CategoryFormData = {
  name: "",
  slug: "",
  description: "",
  image: "",
  isActive: true,
}

export function CategoryForm({
  category,
  onSuccess,
  onCancel,
}: Props) {
  const isEditing = Boolean(category)

  const [form, setForm] =
    useState<CategoryFormData>(emptyForm)

  const [errors, setErrors] =
    useState<Record<string, string>>({})

  const [saving, setSaving] = useState(false)

  const [slugManuallyEdited, setSlugManuallyEdited] =
    useState(false)

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        isActive: category.isActive,
      })

      setSlugManuallyEdited(true)
    } else {
      setForm(emptyForm)
      setSlugManuallyEdited(false)
    }

    setErrors({})
  }, [category])

  function updateField<K extends keyof CategoryFormData>(
    field: K,
    value: CategoryFormData[K]
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

  function handleNameChange(value: string) {
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

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true)

    updateField("slug", generateSlug(value))
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setSaving(true)
    setErrors({})

    try {
      const saved = isEditing
        ? await updateCategory(category!.id, form)
        : await createCategory(form)

      onSuccess(saved)
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "Unable to save category.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="category-form"
    >
      {errors.form && (
        <div className="category-form-error">
          {errors.form}
        </div>
      )}

      <div className="category-form-field">
        <label htmlFor="category-name">
          Category name
        </label>

        <input
          id="category-name"
          value={form.name}
          onChange={(event) =>
            handleNameChange(event.target.value)
          }
          placeholder="e.g. Beauty"
          disabled={saving}
        />

        {errors.name && (
          <p className="category-field-error">
            {errors.name}
          </p>
        )}
      </div>

      <div className="category-form-field">
        <label htmlFor="category-slug">
          Slug
        </label>

        <input
          id="category-slug"
          value={form.slug}
          onChange={(event) =>
            handleSlugChange(event.target.value)
          }
          placeholder="beauty"
          disabled={saving}
        />

        <p className="category-field-help">
          Used in product/category URLs and as the
          predictable category identifier.
        </p>

        {errors.slug && (
          <p className="category-field-error">
            {errors.slug}
          </p>
        )}
      </div>

      <div className="category-form-field">
        <label htmlFor="category-description">
          Description
        </label>

        <textarea
          id="category-description"
          value={form.description}
          onChange={(event) =>
            updateField(
              "description",
              event.target.value
            )
          }
          placeholder="Beauty and personal care products"
          rows={4}
          disabled={saving}
        />

        {errors.description && (
          <p className="category-field-error">
            {errors.description}
          </p>
        )}
      </div>

      <div className="category-form-field">
        <label>Category image</label>

        <CategoryImageUpload
          value={form.image}
          onChange={(value) =>
            updateField("image", value)
          }
          disabled={saving}
        />
      </div>

      <div className="category-status-field">
        <div>
          <strong>Category status</strong>

          <p>
            Inactive categories won't appear in the
            storefront.
          </p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() =>
            updateField(
              "isActive",
              !form.isActive
            )
          }
          className={`category-switch ${
            form.isActive
              ? "is-active"
              : ""
          }`}
          aria-label={
            form.isActive
              ? "Deactivate category"
              : "Activate category"
          }
          aria-pressed={form.isActive}
        >
          <span />
        </button>
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
            ? "Update category"
            : "Create category"}
        </button>
      </div>
    </form>
  )
}
