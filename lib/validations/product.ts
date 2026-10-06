import type { ProductFormData } from "@/lib/types/product"

export function validateProduct(
  data: ProductFormData
): Record<string, string> {
  const errors: Record<string, string> = {}

  const name = data.name.trim()
  const slug = data.slug.trim()
  const description = data.description.trim()
  const currency = data.currency.trim().toUpperCase()

  if (!data.categoryId) {
    errors.categoryId = "Category is required."
  }

  if (!name) {
    errors.name = "Product name is required."
  } else if (name.length > 150) {
    errors.name =
      "Product name cannot exceed 150 characters."
  }

  if (!slug) {
    errors.slug = "Slug is required."
  } else if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  ) {
    errors.slug =
      "Slug can only contain lowercase letters, numbers, and hyphens."
  }

  if (!description) {
    errors.description =
      "Product description is required."
  }

  if (!Number.isFinite(data.price)) {
    errors.price = "Price is required."
  } else if (data.price < 0) {
    errors.price = "Price cannot be negative."
  }

  if (!Number.isInteger(data.stock)) {
    errors.stock =
      "Stock must be a whole number."
  } else if (data.stock < 0) {
    errors.stock =
      "Stock cannot be negative."
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    errors.currency =
      "Currency must be a valid 3-letter code."
  }

  if (
    !Array.isArray(data.features) ||
    data.features.some(
      (feature) => !feature.trim()
    )
  ) {
    errors.features =
      "Product features cannot contain empty values."
  }

  return errors
}