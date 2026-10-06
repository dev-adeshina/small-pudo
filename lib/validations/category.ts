import type { CategoryFormData } from "@/lib/types/category"

export function generateSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function generateCategoryId(slug: string): string {
  return `cat_${slug.replace(/-/g, "_")}`
}

export function validateCategory(
  data: CategoryFormData
): Record<string, string> {
  const errors: Record<string, string> = {}

  const name = data.name.trim()
  const slug = data.slug.trim()
  const description = data.description.trim()

  if (!name) {
    errors.name = "Category name is required."
  } else if (name.length > 100) {
    errors.name = "Category name cannot exceed 100 characters."
  }

  if (!slug) {
    errors.slug = "Slug is required."
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug =
      "Slug can only contain lowercase letters, numbers, and hyphens."
  }

  if (!description) {
    errors.description = "Description is required."
  }

  return errors
}