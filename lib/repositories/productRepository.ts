import products from "@/lib/data/products.json"
import type { Product } from "@/lib/types/product"

const data = products as Product[]

export async function getProducts(): Promise<Product[]> {
  return data.filter(product => product.isActive)
}

export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  return data.find(
    product =>
      product.slug === slug &&
      product.isActive
  )
}

export async function getProductById(
  id: string
): Promise<Product | undefined> {
  return data.find(
    product =>
      product.id === id &&
      product.isActive
  )
}

export async function getProductsByCategory(
  categoryId: string
): Promise<Product[]> {
  return data.filter(
    product =>
      product.categoryId === categoryId &&
      product.isActive
  )
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return data.filter(
    product =>
      product.featured &&
      product.isActive
  )
}