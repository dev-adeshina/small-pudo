import { auth } from "@/lib/firebase";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function uploadImage(
  file: File,
  folder: "categories" | "products"
): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Please select a JPG, PNG, or WebP image.");
  }

  if (file.size === 0) {
    throw new Error("The selected image is empty.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image must be 5MB or smaller.");
  }

  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in again before uploading images.");
  }

  const idToken = await user.getIdToken();
  const formData = new FormData();

  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/admin/uploads/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: formData,
  });

  const result: { url?: string; error?: string } =
    await response.json().catch(() => ({}));

  if (!response.ok || !result.url) {
    throw new Error(result.error || "Unable to upload image.");
  }

  return result.url;
}

export function uploadCategoryImage(file: File): Promise<string> {
  return uploadImage(file, "categories");
}

export function uploadProductImage(file: File): Promise<string> {
  return uploadImage(file, "products");
}
