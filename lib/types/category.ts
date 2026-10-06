export type Category = {
  id: string
  description: string
  image: string
  isActive: boolean
  name: string
  slug: string
}

export type CategoryFormData = {
  name: string
  slug: string
  description: string
  image: string
  isActive: boolean
}