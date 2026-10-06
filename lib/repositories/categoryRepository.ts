import categories from "@/lib/data/categories.json"
import type { Category } from "@/lib/types/category"

export async function getCategories(): Promise<Category[]> {
  return categories as Category[]
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | undefined> {
  return (categories as Category[]).find(
    category => category.slug === slug
  )
}

export async function getCategoryById(
  id: string
): Promise<Category | undefined> {
  return (categories as Category[]).find(
    category => category.id === id
  )
}