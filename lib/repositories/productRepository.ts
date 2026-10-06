// import products from "@/lib/data/products.json"
// import type { Product } from "@/lib/types/product"

// const data = products as Product[]

// export async function getProducts(): Promise<Product[]> {
//   return data.filter(product => product.isActive)
// }

// export async function getProductBySlug(
//   slug: string
// ): Promise<Product | undefined> {
//   return data.find(
//     product =>
//       product.slug === slug &&
//       product.isActive
//   )
// }

// export async function getProductById(
//   id: string
// ): Promise<Product | undefined> {
//   return data.find(
//     product =>
//       product.id === id &&
//       product.isActive
//   )
// }

// export async function getProductsByCategory(
//   categoryId: string
// ): Promise<Product[]> {
//   return data.filter(
//     product =>
//       product.categoryId === categoryId &&
//       product.isActive
//   )
// }

// export async function getFeaturedProducts(): Promise<Product[]> {
//   return data.filter(
//     product =>
//       product.featured &&
//       product.isActive
//   )
// }


// import {
//   collection,
//   getDocs,
//   getDoc,
//   doc,
//   query,
//   where,
// } from "firebase/firestore";

// import { db } from "@/lib/firebase";
// import type { Product } from "@/lib/types/product";

// const COLLECTION_NAME = "products";

// export async function getProducts(): Promise<Product[]> {
//   const snapshot = await getDocs(
//     collection(db, COLLECTION_NAME)
//   );

//   return snapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//   })) as Product[];
// }

// export async function getProductBySlug(
//   slug: string
// ): Promise<Product | undefined> {
//   const q = query(
//     collection(db, COLLECTION_NAME),
//     where("slug", "==", slug),
//     where("isActive", "==", true)
//   );

//   const snapshot = await getDocs(q);

//   if (snapshot.empty) {
//     return undefined;
//   }

//   const productDoc = snapshot.docs[0];

//   return {
//     id: productDoc.id,
//     ...productDoc.data(),
//   } as Product;
// }

// export async function getProductById(
//   id: string
// ): Promise<Product | undefined> {
//   const productDoc = await getDoc(
//     doc(db, COLLECTION_NAME, id)
//   );

//   if (!productDoc.exists()) {
//     return undefined;
//   }

//   const product = {
//     id: productDoc.id,
//     ...productDoc.data(),
//   } as Product;

//   if (!product.isActive) {
//     return undefined;
//   }

//   return product;
// }

// export async function getProductsByCategory(
//   categoryId: string
// ): Promise<Product[]> {
//   const q = query(
//     collection(db, COLLECTION_NAME),
//     where("categoryId", "==", categoryId),
//     where("isActive", "==", true)
//   );

//   const snapshot = await getDocs(q);

//   return snapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//   })) as Product[];
// }

// export async function getFeaturedProducts(): Promise<Product[]> {
//   const q = query(
//     collection(db, COLLECTION_NAME),
//     where("featured", "==", true),
//     where("isActive", "==", true)
//   );

//   const snapshot = await getDocs(q);

//   return snapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//   })) as Product[];
// }


import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Product } from "@/lib/types/product";

const COLLECTION_NAME = "products";

export async function getProducts(): Promise<Product[]> {
  const snapshot = await getDocs(
    collection(db, COLLECTION_NAME)
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];
}

export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("slug", "==", slug),
    where("isActive", "==", true)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return undefined;
  }

  const productDoc = snapshot.docs[0];

  return {
    id: productDoc.id,
    ...productDoc.data(),
  } as Product;
}

export async function getProductById(
  id: string
): Promise<Product | undefined> {
  const productDoc = await getDoc(
    doc(db, COLLECTION_NAME, id)
  );

  if (!productDoc.exists()) {
    return undefined;
  }

  const product = {
    id: productDoc.id,
    ...productDoc.data(),
  } as Product;

  if (!product.isActive) {
    return undefined;
  }

  return product;
}

export async function getProductsByCategory(
  categoryId: string
): Promise<Product[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("categoryId", "==", categoryId),
    where("isActive", "==", true)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("featured", "==", true),
    where("isActive", "==", true)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];
}