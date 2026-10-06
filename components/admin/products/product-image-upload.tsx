"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import {
  ImagePlus,
  Loader2,
  X,
} from "lucide-react"

import { uploadProductImage } from "@/lib/firebase/storage"

type Props = {
  value: string[]
  onChange: (images: string[]) => void
  disabled?: boolean
}

export function ProductImageUpload({
  value,
  onChange,
  disabled = false,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement>(null)

  const [uploading, setUploading] =
    useState(false)

  const [error, setError] =
    useState("")

  async function handleFiles(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files ?? []
    )

    if (!files.length) {
      return
    }

    setError("")
    setUploading(true)

    try {
      const uploaded: string[] = []

      for (const file of files) {
        const url =
          await uploadProductImage(file)

        uploaded.push(url)
      }

      onChange([
        ...value,
        ...uploaded,
      ])
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to upload image."
      )
    } finally {
      setUploading(false)

      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  function removeImage(index: number) {
    onChange(
      value.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    )
  }

  return (
    <div className="product-image-upload">
      <div className="product-image-grid">
        {value.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="product-image-item"
          >
            <Image
              src={image}
              alt={`Product image ${index + 1}`}
              fill
              sizes="100px"
              className="product-image-item-img"
            />

            {!disabled && (
              <button
                type="button"
                onClick={() =>
                  removeImage(index)
                }
                className="product-image-remove"
                aria-label={`Remove image ${index + 1}`}
              >
                <X size={13} />
              </button>
            )}

            {index === 0 && (
              <span className="product-image-primary">
                Main
              </span>
            )}
          </div>
        ))}

        {!disabled && (
          <button
            type="button"
            disabled={uploading}
            onClick={() =>
              inputRef.current?.click()
            }
            className="product-image-add"
          >
            {uploading ? (
              <Loader2
                size={22}
                className="category-spinner"
              />
            ) : (
              <ImagePlus size={22} />
            )}

            <span>
              {uploading
                ? "Uploading"
                : "Add images"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        disabled={disabled || uploading}
        className="product-image-input"
      />

      <p className="product-image-help">
        JPG, PNG or WEBP. Maximum 5MB per image.
      </p>

      {error && (
        <p className="category-field-error">
          {error}
        </p>
      )}
    </div>
  )
}