export type Category = 
  | "food"
  | "fashion"
  | "sanitary"
  | "home-wares"
  | "stationeries"
  | "utilities"
  | "automobile"
  | "furniture"
  | "lighting"
  | "cosmetics"
  | "electronics"



export type Product = {
  id: number
  slug: string
  name: string
  category: Category
  price: number
  description: string
  image: string
  featured?: boolean
  stock: number
  features: string[]
}

export const categories = [
  {
    name: "Food",
    slug: "food",
  },
  {
    name: "Fashion",
    slug: "fashion",
  },
  {
    name: "Sanitary",
    slug: "sanitary",
  },
  {
    name: "Home Wares",
    slug: "home-wares",
  },
  {
    name: "Stationeries",
    slug: "stationeries",
  },
  {
    name: "Utilities",
    slug: "utilities",
  },
  {
    name: "Automobile",
    slug: "automobile",
  },
  {
    name: "Furniture",
    slug: "furniture",
  },
  {
    name: "Lighting",
    slug: "lighting",
  },
  {
    name: "Cosmetics",
    slug: "cosmetics",
  },
  {
    name: "Electronics",
    slug: "electronics",
  },
] as const


export const products: Product[] = [
  {
    id: 1,
    slug: "jollof-rice",
    name: "Jollof Rice",
    category: "food",
    price: 3500,
    description:
      "Freshly prepared Nigerian-style jollof rice.",
    image: "https://images.unsplash.com/photo-1574484284002-952d92456975?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    featured: true,
    stock: 20,
    features: [
      "Freshly prepared",
      "Ready to eat",
      "Local ingredients",
    ],
  },

  {
    id: 2,
    slug: "classic-tshirt",
    name: "Classic T-Shirt",
    category: "fashion",
    price: 12000,
    description:
      "Comfortable everyday cotton t-shirt.",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    stock: 15,
    features: [
      "100% cotton",
      "Unisex",
      "Multiple sizes",
    ],
  },

  {
    id: 3,
    slug: "bath-soap",
    name: "Bath Soap",
    category: "sanitary",
    price: 1800,
    description:
      "Gentle everyday bath soap.",
    image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    stock: 40,
    features: [
      "Gentle formula",
      "Daily use",
      "Family size",
    ],
  },

  {
    id: 4,
    slug: "wireless-headphones",
    name: "Wireless Headphones",
    category: "electronics",
    price: 45000,
    description:
      "Wireless headphones with clear sound and long battery life.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    featured: true,
    stock: 10,
    features: [
      "Bluetooth",
      "Long battery life",
      "Built-in microphone",
    ],
  },

  {
    id: 5,
    slug: "desk-lamp",
    name: "Modern Desk Lamp",
    category: "lighting",
    price: 18000,
    description:
      "Minimal modern desk lamp for home and office.",
    image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    stock: 12,
    features: [
      "LED lighting",
      "Modern design",
      "Low energy consumption",
    ],
  },

  {
    id: 6,
    slug: "office-chair",
    name: "Office Chair",
    category: "furniture",
    price: 85000,
    description:
      "Comfortable ergonomic office chair.",
    image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    stock: 8,
    features: [
      "Ergonomic design",
      "Adjustable height",
      "Padded seat",
    ],
  },
]




export function getProduct(slug: string) {
  return products.find(
    (product) => product.slug === slug
  )
}

export function getProductsByCategory(
  category: Category
) {
  return products.filter(
    (product) => product.category === category
  )
}