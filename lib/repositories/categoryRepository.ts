import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Category } from "@/lib/types/category";

const COLLECTION_NAME = "categories";

export async function getCategories(): Promise<Category[]> {
  const snapshot = await getDocs(
    collection(db, COLLECTION_NAME)
  );

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  })) as Category[];
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | undefined> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("slug", "==", slug)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return undefined;
  }

  const document = snapshot.docs[0];

  return {
    id: document.id,
    ...document.data(),
  } as Category;
}

export async function getCategoryById(
  id: string
): Promise<Category | undefined> {
  const document = await getDoc(
    doc(db, COLLECTION_NAME, id)
  );

  if (!document.exists()) {
    return undefined;
  }

  return {
    id: document.id,
    ...document.data(),
  } as Category;
}

