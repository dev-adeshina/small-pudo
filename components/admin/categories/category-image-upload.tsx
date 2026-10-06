"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import {
  ImagePlus,
  Loader2,
  X,
} from "lucide-react"

import { uploadCategoryImage } from "@/lib/firebase/storage"

type Props = {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}

export function CategoryImageUpload({
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

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setError("")
    setUploading(true)

    try {
      const url =
        await uploadCategoryImage(file)

      onChange(url)
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

  function removeImage() {
    onChange("")
  }

  return (
    <div className="category-image-upload">
      <div className="category-image-row">
        {value ? (
          <div className="category-image-preview">
            <Image
              src={value}
              alt="Category preview"
              fill
              className="category-image-preview-img"
              sizes="96px"
            />

            {!disabled && (
              <button
                type="button"
                onClick={removeImage}
                className="category-image-remove"
                aria-label="Remove image"
              >
                <X size={13} />
              </button>
            )}
          </div>
        ) : (
          <div className="category-image-placeholder">
            <ImagePlus size={25} />
          </div>
        )}

        <div className="category-image-controls">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled || uploading}
            className="category-image-input"
          />

          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() =>
              inputRef.current?.click()
            }
            className="category-button category-button-secondary"
          >
            {uploading ? (
              <>
                <Loader2
                  size={15}
                  className="category-spinner"
                />
                Uploading...
              </>
            ) : (
              <>
                <ImagePlus size={15} />
                {value
                  ? "Change image"
                  : "Upload image"}
              </>
            )}
          </button>

          <p>
            JPG, PNG, WEBP. Maximum 5MB.
          </p>
        </div>
      </div>

      {error && (
        <p className="category-field-error">
          {error}
        </p>
      )}
    </div>
  )
}
