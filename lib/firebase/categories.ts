import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { Category, CategoryFormData } from "@/lib/types/category"
import {
  generateCategoryId,
  validateCategory,
} from "@/lib/validations/category"

const COLLECTION_NAME = "categories"

function categoriesCollection() {
  return collection(db, COLLECTION_NAME)
}

function mapCategory(snapshot: any): Category {
  const data = snapshot.data()

  return {
    id: snapshot.id,
    description: data.description ?? "",
    image: data.image ?? "",
    isActive: Boolean(data.isActive),
    name: data.name ?? "",
    slug: data.slug ?? "",
  }
}

/**
 * Get every category.
 */
export async function getCategories(): Promise<Category[]> {
  const snapshot = await getDocs(categoriesCollection())

  return snapshot.docs
    .map(mapCategory)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get one category.
 */
export async function getCategory(
  id: string
): Promise<Category | null> {
  const snapshot = await getDoc(
    doc(db, COLLECTION_NAME, id)
  )

  if (!snapshot.exists()) {
    return null
  }

  return mapCategory(snapshot)
}

/**
 * Check whether a slug already exists.
 */
export async function categorySlugExists(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const snapshot = await getDocs(
    query(
      categoriesCollection(),
      where("slug", "==", slug)
    )
  )

  return snapshot.docs.some((item) => item.id !== excludeId)
}

/**
 * Create a category.
 *
 * Uses a transaction so two admins cannot
 * accidentally create the same predictable ID
 * at the same time.
 */
export async function createCategory(
  data: CategoryFormData
): Promise<Category> {
  const errors = validateCategory(data)

  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0])
  }

  const slug = data.slug.trim().toLowerCase()
  const id = generateCategoryId(slug)

  const categoryRef = doc(
    db,
    COLLECTION_NAME,
    id
  )

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(categoryRef)

    if (existing.exists()) {
      throw new Error(
        `A category with the slug "${slug}" already exists.`
      )
    }

    transaction.set(categoryRef, {
      description: data.description.trim(),
      image: data.image.trim(),
      isActive: data.isActive,
      name: data.name.trim(),
      slug,
    })
  })

  const created = await getDoc(categoryRef)

  if (!created.exists()) {
    throw new Error("Category was created but could not be loaded.")
  }

  return mapCategory(created)
}

/**
 * Update a category without changing its document ID.
 */
export async function updateCategory(
  id: string,
  data: CategoryFormData
): Promise<Category> {
  const errors = validateCategory(data)

  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0])
  }

  const categoryRef = doc(
    db,
    COLLECTION_NAME,
    id
  )

  const existing = await getDoc(categoryRef)

  if (!existing.exists()) {
    throw new Error("Category does not exist.")
  }

  const current = mapCategory(existing)

  const newSlug = data.slug.trim().toLowerCase()

  /*
   * No slug change.
   *
   * This is the normal update path.
   */
  // if (newSlug === current.slug) {
  //   await updateDoc(categoryRef, {
  //     description: data.description.trim(),
  //     image: data.image.trim(),
  //     isActive: data.isActive,
  //     name: data.name.trim(),
  //     slug: newSlug,
  //   })

  //   const updated = await getDoc(categoryRef)

  //   if (!updated.exists()) {
  //     throw new Error("Category could not be loaded after update.")
  //   }

  //   return mapCategory(updated)
  // }

  if (newSlug !== current.slug) {
    const productCount =
      await getCategoryProductCount(current.slug)

    if (productCount > 0) {
      throw new Error(
        `This category has ${productCount} product${productCount === 1 ? "" : "s"
        }. Move those products to another category before changing the slug.`
      )
    }

    const newId = generateCategoryId(newSlug)

    const newCategoryRef = doc(
      db,
      COLLECTION_NAME,
      newId
    )

    await runTransaction(db, async (transaction) => {
      const [oldSnapshot, newSnapshot] =
        await Promise.all([
          transaction.get(categoryRef),
          transaction.get(newCategoryRef),
        ])

      if (!oldSnapshot.exists()) {
        throw new Error(
          "Category does not exist."
        )
      }

      if (newSnapshot.exists()) {
        throw new Error(
          `A category with the slug "${newSlug}" already exists.`
        )
      }

      transaction.set(newCategoryRef, {
        description: data.description.trim(),
        image: data.image.trim(),
        isActive: data.isActive,
        name: data.name.trim(),
        slug: newSlug,
      })

      transaction.delete(categoryRef)
    })

    const updated =
      await getDoc(newCategoryRef)

    if (!updated.exists()) {
      throw new Error(
        "Category could not be loaded after update."
      )
    }

    return mapCategory(updated)
  }

  /*
   * Slug changed.
   *
   * The caller should check products before allowing this.
   */
  const newId = generateCategoryId(newSlug)

  const newCategoryRef = doc(
    db,
    COLLECTION_NAME,
    newId
  )

  await runTransaction(db, async (transaction) => {
    const [oldSnapshot, newSnapshot] = await Promise.all([
      transaction.get(categoryRef),
      transaction.get(newCategoryRef),
    ])

    if (!oldSnapshot.exists()) {
      throw new Error("Category does not exist.")
    }

    if (newSnapshot.exists()) {
      throw new Error(
        `A category with the slug "${newSlug}" already exists.`
      )
    }

    transaction.set(newCategoryRef, {
      description: data.description.trim(),
      image: data.image.trim(),
      isActive: data.isActive,
      name: data.name.trim(),
      slug: newSlug,
    })

    transaction.delete(categoryRef)
  })

  const updated = await getDoc(newCategoryRef)

  if (!updated.exists()) {
    throw new Error("Category could not be loaded after update.")
  }

  return mapCategory(updated)
}

/**
 * Activate/deactivate a category.
 */
export async function setCategoryActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const categoryRef = doc(
    db,
    COLLECTION_NAME,
    id
  )

  await updateDoc(categoryRef, {
    isActive,
  })
}

/**
 * Delete a category.
 */
export async function deleteCategory(
  id: string
): Promise<void> {
  const categoryRef = doc(
    db,
    COLLECTION_NAME,
    id
  )

  const existing = await getDoc(categoryRef)

  if (!existing.exists()) {
    throw new Error("Category does not exist.")
  }

  await deleteDoc(categoryRef)
}

/**
 * Count products belonging to a category.
 *
 * This assumes products contain:
 *
 * category: "food"
 *
 * which matches the category slug.
 */
export async function getCategoryProductCount(
  slug: string
): Promise<number> {
  const productsRef = collection(db, "products")

  const snapshot = await getDocs(
    query(
      productsRef,
      where("category", "==", slug)
    )
  )

  return snapshot.size
}

/**
 * Get product counts for many categories.
 *
 * Useful for displaying the Products column.
 */
export async function getCategoryProductCounts(
  categories: Category[]
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}

  await Promise.all(
    categories.map(async (category) => {
      counts[category.id] =
        await getCategoryProductCount(category.slug)
    })
  )

  return counts
}