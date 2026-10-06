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

  // ─────────────────────────────────────────
  // FOOD
  // ─────────────────────────────────────────

  {
    id: 1,
    slug: "jollof-rice",
    name: "Jollof Rice",
    category: "food",
    price: 3500,
    description:
      "Freshly prepared Nigerian-style jollof rice.",
    image:
      "https://images.unsplash.com/photo-1574484284002-952d92456975?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
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
    slug: "fried-rice",
    name: "Fried Rice",
    category: "food",
    price: 4000,
    description:
      "Flavorful fried rice prepared with vegetables and carefully selected spices.",
    image:
      "https://images.unsplash.com/photo-1574484284002-952d92456975?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    stock: 18,
    features: [
      "Fresh vegetables",
      "Ready to eat",
      "Rich flavor",
    ],
  },

  {
    id: 3,
    slug: "chicken-shawarma",
    name: "Chicken Shawarma",
    category: "food",
    price: 4500,
    description:
      "Grilled chicken shawarma wrapped with fresh vegetables and creamy sauce.",
    image:
      "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80",
    featured: true,
    stock: 25,
    features: [
      "Grilled chicken",
      "Fresh vegetables",
      "Ready to eat",
    ],
  },

  {
    id: 4,
    slug: "beef-burger",
    name: "Beef Burger",
    category: "food",
    price: 5000,
    description:
      "Juicy beef burger served with fresh vegetables and a soft toasted bun.",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    stock: 15,
    features: [
      "Premium beef",
      "Fresh vegetables",
      "Toasted bun",
    ],
  },

  {
    id: 5,
    slug: "margherita-pizza",
    name: "Margherita Pizza",
    category: "food",
    price: 8500,
    description:
      "Classic pizza topped with tomato sauce, mozzarella and fresh basil.",
    image:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80",
    stock: 10,
    features: [
      "Fresh mozzarella",
      "Tomato sauce",
      "Fresh basil",
    ],
  },

  // ─────────────────────────────────────────
  // FASHION
  // ─────────────────────────────────────────

  {
    id: 6,
    slug: "classic-tshirt",
    name: "Classic T-Shirt",
    category: "fashion",
    price: 12000,
    description:
      "Comfortable everyday cotton t-shirt suitable for casual wear.",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    featured: true,
    stock: 15,
    features: [
      "100% cotton",
      "Unisex",
      "Multiple sizes",
    ],
  },

  {
    id: 7,
    slug: "denim-jacket",
    name: "Denim Jacket",
    category: "fashion",
    price: 35000,
    description:
      "Classic denim jacket designed for everyday casual styling.",
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
    stock: 12,
    features: [
      "Premium denim",
      "Unisex",
      "Classic fit",
    ],
  },

  {
    id: 8,
    slug: "white-sneakers",
    name: "White Sneakers",
    category: "fashion",
    price: 45000,
    description:
      "Clean and versatile sneakers designed for everyday comfort.",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    featured: true,
    stock: 9,
    features: [
      "Comfortable sole",
      "Unisex",
      "Everyday wear",
    ],
  },

  {
    id: 9,
    slug: "ankara-dress",
    name: "Ankara Dress",
    category: "fashion",
    price: 38000,
    description:
      "Stylish Ankara dress combining traditional patterns with modern design.",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
    stock: 7,
    features: [
      "African print",
      "Modern design",
      "Comfortable fit",
    ],
  },

  {
    id: 10,
    slug: "leather-handbag",
    name: "Leather Handbag",
    category: "fashion",
    price: 42000,
    description:
      "Elegant everyday handbag with a spacious interior.",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    stock: 6,
    features: [
      "Premium finish",
      "Spacious interior",
      "Adjustable strap",
    ],
  },

  // ─────────────────────────────────────────
  // SANITARY
  // ─────────────────────────────────────────

  {
    id: 11,
    slug: "bath-soap",
    name: "Bath Soap",
    category: "sanitary",
    price: 1800,
    description:
      "Gentle everyday bath soap suitable for regular family use.",
    image:
      "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=800&q=80",
    stock: 40,
    features: [
      "Gentle formula",
      "Daily use",
      "Family size",
    ],
  },

  {
    id: 12,
    slug: "hand-wash",
    name: "Liquid Hand Wash",
    category: "sanitary",
    price: 2500,
    description:
      "Refreshing liquid hand wash for everyday hygiene.",
    image:
      "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=800&q=80",
    stock: 30,
    features: [
      "Refreshing scent",
      "Easy pump dispenser",
      "Daily hygiene",
    ],
  },

  {
    id: 13,
    slug: "toilet-tissue",
    name: "Toilet Tissue Pack",
    category: "sanitary",
    price: 4500,
    description:
      "Soft multi-roll toilet tissue pack for home and office use.",
    image:
      "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=800&q=80",
    stock: 50,
    features: [
      "Soft texture",
      "Multi-roll pack",
      "Home and office",
    ],
  },

  // ─────────────────────────────────────────
  // HOME WARES
  // ─────────────────────────────────────────

  {
    id: 14,
    slug: "ceramic-plate-set",
    name: "Ceramic Plate Set",
    category: "home-wares",
    price: 18000,
    description:
      "Modern ceramic dinner plates suitable for everyday meals.",
    image:
      "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=800&q=80",
    stock: 14,
    features: [
      "Durable ceramic",
      "Modern design",
      "Dishwasher friendly",
    ],
  },

  {
    id: 15,
    slug: "glass-cup-set",
    name: "Glass Cup Set",
    category: "home-wares",
    price: 10000,
    description:
      "Elegant glass cups for everyday drinks and entertaining.",
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
    stock: 20,
    features: [
      "Clear glass",
      "Six-piece set",
      "Easy to clean",
    ],
  },

  {
    id: 16,
    slug: "kitchen-storage-set",
    name: "Kitchen Storage Set",
    category: "home-wares",
    price: 15000,
    description:
      "Practical storage containers for keeping kitchen ingredients organized.",
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    stock: 16,
    features: [
      "Multiple containers",
      "Stackable",
      "Airtight lids",
    ],
  },

  // ─────────────────────────────────────────
  // STATIONERIES
  // ─────────────────────────────────────────

  {
    id: 17,
    slug: "notebook-set",
    name: "Notebook Set",
    category: "stationeries",
    price: 5000,
    description:
      "Set of clean and durable notebooks for school, work and personal notes.",
    image:
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=800&q=80",
    stock: 25,
    features: [
      "Multiple notebooks",
      "Quality paper",
      "Portable size",
    ],
  },

  {
    id: 18,
    slug: "ballpoint-pen-set",
    name: "Ballpoint Pen Set",
    category: "stationeries",
    price: 2500,
    description:
      "Smooth-writing ballpoint pens for school and office use.",
    image:
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80",
    stock: 35,
    features: [
      "Smooth writing",
      "Comfort grip",
      "Multiple colors",
    ],
  },

  {
    id: 19,
    slug: "desk-organizer",
    name: "Desk Organizer",
    category: "stationeries",
    price: 7500,
    description:
      "Compact organizer for pens, notes and everyday office supplies.",
    image:
      "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=800&q=80",
    stock: 12,
    features: [
      "Multiple compartments",
      "Compact design",
      "Office friendly",
    ],
  },

  // ─────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────

  {
    id: 20,
    slug: "rechargeable-fan",
    name: "Rechargeable Fan",
    category: "utilities",
    price: 28000,
    description:
      "Portable rechargeable fan for home, office and outdoor use.",
    image:
      "https://images.unsplash.com/photo-1596707328377-2c5c5f0f8e2b?auto=format&fit=crop&w=800&q=80",
    stock: 10,
    features: [
      "Rechargeable battery",
      "Portable",
      "Multiple speed settings",
    ],
  },

  {
    id: 21,
    slug: "extension-box",
    name: "Extension Power Box",
    category: "utilities",
    price: 8500,
    description:
      "Multi-socket extension box for safely connecting household electronics.",
    image:
      "https://images.unsplash.com/photo-1558008258-3256797b43f3?auto=format&fit=crop&w=800&q=80",
    stock: 18,
    features: [
      "Multiple sockets",
      "Compact design",
      "Long cable",
    ],
  },

  {
    id: 22,
    slug: "rechargeable-lantern",
    name: "Rechargeable Lantern",
    category: "utilities",
    price: 12000,
    description:
      "Portable rechargeable lantern providing reliable light during power outages.",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    stock: 20,
    features: [
      "Rechargeable",
      "Portable",
      "Long runtime",
    ],
  },

  // ─────────────────────────────────────────
  // AUTOMOBILE
  // ─────────────────────────────────────────

  {
    id: 23,
    slug: "car-phone-holder",
    name: "Car Phone Holder",
    category: "automobile",
    price: 6500,
    description:
      "Adjustable phone holder designed for convenient in-car navigation.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    stock: 22,
    features: [
      "Adjustable mount",
      "Strong grip",
      "Easy installation",
    ],
  },

  {
    id: 24,
    slug: "car-cleaning-kit",
    name: "Car Cleaning Kit",
    category: "automobile",
    price: 15000,
    description:
      "Complete basic cleaning kit for maintaining a clean vehicle interior and exterior.",
    image:
      "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80",
    stock: 14,
    features: [
      "Multiple cleaning tools",
      "Interior and exterior",
      "Reusable",
    ],
  },

  {
    id: 25,
    slug: "car-air-freshener",
    name: "Car Air Freshener",
    category: "automobile",
    price: 3500,
    description:
      "Long-lasting car air freshener with a clean and pleasant fragrance.",
    image:
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    stock: 30,
    features: [
      "Long lasting",
      "Easy to use",
      "Fresh fragrance",
    ],
  },

  // ─────────────────────────────────────────
  // FURNITURE
  // ─────────────────────────────────────────

  {
    id: 26,
    slug: "office-chair",
    name: "Office Chair",
    category: "furniture",
    price: 85000,
    description:
      "Comfortable ergonomic office chair designed for long working sessions.",
    image:
      "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=800&q=80",
    featured: true,
    stock: 8,
    features: [
      "Ergonomic design",
      "Adjustable height",
      "Padded seat",
    ],
  },

  {
    id: 27,
    slug: "modern-sofa",
    name: "Modern Sofa",
    category: "furniture",
    price: 250000,
    description:
      "Modern comfortable sofa suitable for contemporary living spaces.",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
    stock: 5,
    features: [
      "Modern design",
      "Comfortable cushions",
      "Durable frame",
    ],
  },

  {
    id: 28,
    slug: "wooden-coffee-table",
    name: "Wooden Coffee Table",
    category: "furniture",
    price: 65000,
    description:
      "Minimal wooden coffee table suitable for living rooms and lounges.",
    image:
      "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=800&q=80",
    stock: 9,
    features: [
      "Solid wood",
      "Minimal design",
      "Easy to maintain",
    ],
  },

  // ─────────────────────────────────────────
  // LIGHTING
  // ─────────────────────────────────────────

  {
    id: 29,
    slug: "desk-lamp",
    name: "Modern Desk Lamp",
    category: "lighting",
    price: 18000,
    description:
      "Minimal modern desk lamp for home and office.",
    image:
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80",
    stock: 12,
    features: [
      "LED lighting",
      "Modern design",
      "Low energy consumption",
    ],
  },

  {
    id: 30,
    slug: "pendant-light",
    name: "Pendant Light",
    category: "lighting",
    price: 35000,
    description:
      "Modern pendant light designed to add warmth and style to interior spaces.",
    image:
      "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=800&q=80",
    stock: 7,
    features: [
      "Modern design",
      "Warm lighting",
      "Ceiling mount",
    ],
  },

  {
    id: 31,
    slug: "floor-lamp",
    name: "Floor Lamp",
    category: "lighting",
    price: 42000,
    description:
      "Tall modern floor lamp for living rooms, bedrooms and offices.",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    stock: 6,
    features: [
      "Modern design",
      "Floor standing",
      "Ambient lighting",
    ],
  },

  // ─────────────────────────────────────────
  // COSMETICS
  // ─────────────────────────────────────────

  {
    id: 32,
    slug: "face-moisturizer",
    name: "Face Moisturizer",
    category: "cosmetics",
    price: 9500,
    description:
      "Lightweight daily moisturizer designed to keep skin hydrated.",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80",
    stock: 18,
    features: [
      "Lightweight",
      "Daily hydration",
      "Non-greasy",
    ],
  },

  {
    id: 33,
    slug: "body-lotion",
    name: "Body Lotion",
    category: "cosmetics",
    price: 7500,
    description:
      "Daily body lotion designed to leave skin soft and moisturized.",
    image:
      "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=800&q=80",
    stock: 24,
    features: [
      "Daily use",
      "Moisturizing",
      "Light fragrance",
    ],
  },

  {
    id: 34,
    slug: "lip-balm",
    name: "Lip Balm",
    category: "cosmetics",
    price: 3500,
    description:
      "Moisturizing lip balm for everyday lip care.",
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
    stock: 30,
    features: [
      "Moisturizing",
      "Portable",
      "Daily use",
    ],
  },

  // ─────────────────────────────────────────
  // ELECTRONICS
  // ─────────────────────────────────────────

  {
    id: 35,
    slug: "wireless-headphones",
    name: "Wireless Headphones",
    category: "electronics",
    price: 45000,
    description:
      "Wireless headphones with clear sound and long battery life.",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    featured: true,
    stock: 10,
    features: [
      "Bluetooth",
      "Long battery life",
      "Built-in microphone",
    ],
  },

  {
    id: 36,
    slug: "smartphone",
    name: "Modern Smartphone",
    category: "electronics",
    price: 285000,
    description:
      "Modern smartphone with a high-resolution display and reliable performance.",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    featured: true,
    stock: 7,
    features: [
      "High-resolution display",
      "Large storage",
      "Fast processor",
    ],
  },

  {
    id: 37,
    slug: "smart-tv",
    name: "Smart TV",
    category: "electronics",
    price: 350000,
    description:
      "Large-screen smart television for streaming entertainment at home.",
    image:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80",
    stock: 5,
    features: [
      "Smart platform",
      "High-resolution display",
      "Streaming support",
    ],
  },

  {
    id: 38,
    slug: "bluetooth-speaker",
    name: "Bluetooth Speaker",
    category: "electronics",
    price: 28000,
    description:
      "Portable Bluetooth speaker delivering clear audio for indoor and outdoor use.",
    image:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
    stock: 13,
    features: [
      "Bluetooth",
      "Portable",
      "Rechargeable battery",
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

