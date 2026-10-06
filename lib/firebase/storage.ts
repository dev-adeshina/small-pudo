import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage"

import { storage } from "@/lib/firebase"

export async function uploadImage(
  file: File,
  folder: string
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error(
      "Please select an image file."
    )
  }

  const maxSize = 5 * 1024 * 1024

  if (file.size > maxSize) {
    throw new Error(
      "Image must be less than 5MB."
    )
  }

  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() || "jpg"

  const filename =
    `${crypto.randomUUID()}.${extension}`

  const storageRef = ref(
    storage,
    `${folder}/${filename}`
  )

  await uploadBytes(
    storageRef,
    file,
    {
      contentType: file.type,
    }
  )

  return getDownloadURL(storageRef)
}

export async function uploadCategoryImage(
  file: File
): Promise<string> {
  return uploadImage(file, "categories")
}

export async function uploadProductImage(
  file: File
): Promise<string> {
  return uploadImage(file, "products")
}