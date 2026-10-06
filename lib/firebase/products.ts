import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore"

import { db } from "@/lib/firebase"


import type {
  Product,
  ProductFormData,
} from "@/lib/types/product"

const productsCollection =
  collection(db, "products")

function mapProduct(
  id: string,
  data: Record<string, unknown>
): Product {
  return {
    id,
    categoryId:
      typeof data.categoryId === "string"
        ? data.categoryId
        : "",

    slug:
      typeof data.slug === "string"
        ? data.slug
        : "",

    name:
      typeof data.name === "string"
        ? data.name
        : "",

    description:
      typeof data.description === "string"
        ? data.description
        : "",

    price:
      typeof data.price === "number"
        ? data.price
        : 0,

    currency:
      typeof data.currency === "string"
        ? data.currency
        : "NGN",

    images:
      Array.isArray(data.images)
        ? data.images.filter(
          (image): image is string =>
            typeof image === "string"
        )
        : [],

    stock:
      typeof data.stock === "number"
        ? data.stock
        : 0,

    isActive:
      typeof data.isActive === "boolean"
        ? data.isActive
        : true,

    featured:
      typeof data.featured === "boolean"
        ? data.featured
        : false,

    features:
      Array.isArray(data.features)
        ? data.features.filter(
          (feature): feature is string =>
            typeof feature === "string"
        )
        : [],

    createdAt:
      (data.createdAt as Product["createdAt"]) ??
      null,

    updatedAt:
      (data.updatedAt as Product["updatedAt"]) ??
      null,
  }
}

export async function getProducts(): Promise<Product[]> {
  const snapshot =
    await getDocs(productsCollection)

  const products = snapshot.docs.map((item) =>
    mapProduct(item.id, item.data())
  )

  return products.sort((a, b) => {
    const aTime =
      a.createdAt?.toMillis() ?? 0

    const bTime =
      b.createdAt?.toMillis() ?? 0

    return bTime - aTime
  })
}

export async function getProduct(
  id: string
): Promise<Product | null> {
  const snapshot = await getDoc(
    doc(db, "products", id)
  )

  if (!snapshot.exists()) {
    return null
  }

  return mapProduct(
    snapshot.id,
    snapshot.data()
  )
}

export async function productSlugExists(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const snapshot = await getDocs(
    query(
      productsCollection,
      where("slug", "==", slug)
    )
  )

  return snapshot.docs.some(
    (item) => item.id !== excludeId
  )
}

export async function createProduct(
  data: ProductFormData
): Promise<Product> {
  if (await productSlugExists(data.slug)) {
    throw new Error(
      "A product with this slug already exists."
    )
  }

  const cleanData = {
    categoryId: data.categoryId,
    name: data.name.trim(),
    slug: data.slug.trim(),
    description: data.description.trim(),
    price: data.price,
    currency: data.currency
      .trim()
      .toUpperCase(),
    images: data.images,
    stock: data.stock,
    isActive: data.isActive,
    featured: data.featured,
    features: data.features
      .map((feature) => feature.trim())
      .filter(Boolean),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const reference = await addDoc(
    productsCollection,
    cleanData
  )

  const created = await getDoc(reference)

  if (!created.exists()) {
    throw new Error(
      "Product was created but could not be loaded."
    )
  }

  return mapProduct(
    created.id,
    created.data()
  )
}

export async function updateProduct(
  id: string,
  data: ProductFormData
): Promise<Product> {
  if (
    await productSlugExists(
      data.slug,
      id
    )
  ) {
    throw new Error(
      "A product with this slug already exists."
    )
  }

  const reference = doc(
    db,
    "products",
    id
  )

  const existing = await getDoc(reference)

  if (!existing.exists()) {
    throw new Error(
      "Product no longer exists."
    )
  }

  await updateDoc(reference, {
    categoryId: data.categoryId,
    name: data.name.trim(),
    slug: data.slug.trim(),
    description: data.description.trim(),
    price: data.price,
    currency: data.currency
      .trim()
      .toUpperCase(),
    images: data.images,
    stock: data.stock,
    isActive: data.isActive,
    featured: data.featured,
    features: data.features
      .map((feature) => feature.trim())
      .filter(Boolean),
    updatedAt: serverTimestamp(),
  })

  const updated = await getDoc(reference)

  if (!updated.exists()) {
    throw new Error(
      "Product was updated but could not be loaded."
    )
  }

  return mapProduct(
    updated.id,
    updated.data()
  )
}

export async function setProductActive(
  id: string,
  isActive: boolean
): Promise<void> {
  await updateDoc(
    doc(db, "products", id),
    {
      isActive,
      updatedAt: serverTimestamp(),
    }
  )
}

export async function setProductFeatured(
  id: string,
  featured: boolean
): Promise<void> {
  await updateDoc(
    doc(db, "products", id),
    {
      featured,
      updatedAt: serverTimestamp(),
    }
  )
}

export async function deleteProduct(
  id: string
): Promise<void> {
  await deleteDoc(
    doc(db, "products", id)
  )
}

export async function getProductsByCategory(
  categoryId: string
): Promise<Product[]> {
  const snapshot = await getDocs(
    query(
      productsCollection,
      where("categoryId", "==", categoryId)
    )
  )

  return snapshot.docs
    .map((item) =>
      mapProduct(
        item.id,
        item.data()
      )
    )
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    )
}

export async function getProductBySlug(
  slug: string
): Promise<Product | null> {
  const productsRef = collection(db, "products");

  const q = query(
    productsRef,
    where("slug", "==", slug),
    where("isActive", "==", true)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const document = snapshot.docs[0];

  return {
    id: document.id,
    ...document.data(),
  } as Product;
}