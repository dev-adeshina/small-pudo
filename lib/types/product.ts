import type { Timestamp } from "firebase/firestore"

export type Product = {
  id: string
  categoryId: string
  slug: string
  name: string
  description: string
  price: number
  currency: string
  images: string[]
  stock: number
  isActive: boolean
  featured: boolean
  features: string[]
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type ProductFormData = {
  categoryId: string
  name: string
  slug: string
  description: string
  price: number
  currency: string
  images: string[]
  stock: number
  isActive: boolean
  featured: boolean
  features: string[]
}