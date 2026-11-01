import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/server/admin-authorization";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_FOLDERS = new Set([
  "categories",
  "products",
]);

function detectImageType(buffer: Buffer): string | null {
  // JPEG
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // PNG
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  ) {
    return "image/png";
  }

  // WebP
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function uploadToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      reject(new Error("Cloudinary is not configured on the server."));
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: randomUUID(),
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        // if (error || !result?.secure_url) {
        //   reject(new Error("Cloudinary could not upload this image."));
        //   return;
        // }

        if (error || !result?.secure_url) {
          console.error("Cloudinary upload failure details:", {
            message: error?.message,
            name: error?.name,
            http_code: error?.http_code,
            resultReceived: Boolean(result),
          });

          reject(new Error("Cloudinary could not upload this image."));
          return;

        }
        resolve(result.secure_url);
      }
    );

    Readable.from([buffer]).pipe(stream);
  });
}

export async function POST(request: Request) {
  const authorization = await authorizeAdminRequest(request, "You are not authorized to upload images.");

  if (!authorization.ok) {
    return authorization.response;
  }

  const cloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (!cloudinaryConfigured) {
    return NextResponse.json(
      { error: "Cloudinary is not configured on the server." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");

    if (typeof folder !== "string" || !ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json(
        { error: "Invalid upload folder." },
        { status: 400 }
      );
    }

    if (
      !file ||
      typeof file === "string" ||
      typeof file.arrayBuffer !== "function"
    ) {
      return NextResponse.json(
        { error: "Please select an image file." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The selected image is empty." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be 5MB or smaller." },
        { status: 413 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedType = detectImageType(buffer);

    if (!detectedType || detectedType !== file.type) {
      return NextResponse.json(
        { error: "The file is not a valid JPG, PNG, or WebP image." },
        { status: 400 }
      );
    }

    const url = await uploadToCloudinary(buffer, folder);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Image upload failed:", error);

    return NextResponse.json(
      { error: "Unable to upload image. Please try again." },
      { status: 500 }
    );
  }
}
