// app/products/[category]/[slug]/product-gallery.tsx

"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}


const defaultPlaceholderImage = "https://images.unsplash.com/photo-1574484284002-952d92456975?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const productImages = images?.length ? images : [defaultPlaceholderImage];

  const [selectedImage, setSelectedImage] = useState(productImages[0]);

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <Image
          // src={selectedImage}
          src={defaultPlaceholderImage}
          alt={productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="product-gallery-main-image"
        />
      </div>

      {productImages.length > 1 && (
        <div className="product-gallery-thumbnails">
          {productImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedImage(image)}
              className={`product-gallery-thumbnail ${
                selectedImage === image ? "active" : ""
              }`}
              aria-label={`View ${productName} image ${index + 1}`}
            >
              <Image
                src={image}
                alt={`${productName} ${index + 1}`}
                fill
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}