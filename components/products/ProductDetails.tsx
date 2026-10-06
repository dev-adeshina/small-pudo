// "use client";

// import { useState } from 'react';
// import Image from 'next/image';
// import { Product } from '@/lib/types/product';
// import { useCart } from "@/context/cart-context";
// // import { useCart } from '@/components/providers/CartProvider';
// import { formatPrice } from '@/lib/utils/format';
// import { features } from 'process';

// interface ProductActionsProps {
//   productId: string;
//   name: string;
//   slug: string;
//   categoryId: string;
//   price: number;
//   currency: string;
//   images: string[];
//   stock: number;
// }

// export default function ProductDetails(
//   // { product }: { product: Product }
//   {
//   productId,
//   name,
//   slug,
//   categoryId,
//   price,
//   currency,
//   images,
//   stock,
//   }: ProductActionsProps) {
//   const [selectedImage, setSelectedImage] = useState(images[0]);
//   const [quantity, setQuantity] = useState(1);
//   const { addToCart } = useCart();

//   const isOutOfStock = stock === 0;

//   const handleQuantityChange = (delta: number) => {
//     setQuantity((prev) => Math.max(1, Math.min(prev + delta, stock)));
//   };

//   const handleAddToCart = () => {
//     if (isOutOfStock) return;

//     // addToCart({
//     //   productId: productId,
//     //   name: name,
//     //   slug: slug,
//     //   price: price,
//     //   currency: currency,
//     //   image: images[0],
//     //   stock: stock,
//     // }, quantity);

//     addToCart({
//       productId,
//       name,
//       slug,
//       categoryId,
//       price,
//       currency,
//       image: images[0] ?? "",
//       quantity,
//       stock,
//     });


//   };

//   return (
//     <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
//       {/* Image Gallery */}
//       <div className="w-full md:w-1/2 flex flex-col gap-4">
//         <div className="relative aspect-square w-full rounded-lg overflow-hidden border bg-gray-50">
//           {selectedImage && (
//             <Image
//               src={selectedImage}
//               alt={name}
//               fill
//               className="object-cover"
//               priority
//             />
//           )}
//         </div>
//         {images.length > 1 && (
//           <div className="flex gap-4 overflow-x-auto pb-2">
//             {images.map((img, idx) => (
//               <button
//                 key={idx}
//                 onClick={() => setSelectedImage(img)}
//                 className={`relative w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 transition-all ${selectedImage === img ? 'border-primary' : 'border-transparent hover:border-gray-300'
//                   }`}
//               >
//                 <Image src={img} alt={`${name} thumbnail`} fill className="object-cover" />
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Product Info */}
//       <div className="w-full md:w-1/2 flex flex-col gap-6">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">{name}</h1>
//           <p className="text-2xl font-semibold text-gray-900">
//             {formatPrice(price, currency)}
//           </p>
//         </div>

//         <div className="prose prose-sm text-gray-600">
//           {/* <p>{description}</p> */}
//         </div>

//         {features && features.length > 0 && (
//           <ul className="space-y-2">
//             {features.map((feature, idx) => (
//               <li key={idx} className="flex items-center text-gray-700">
//                 <span className="mr-2 text-green-500">✓</span> {feature}
//               </li>
//             ))}
//           </ul>
//         )}

//         <div className="pt-6 border-t border-gray-200">
//           <div className="flex items-center gap-4 mb-4">
//             <span className="text-sm font-medium text-gray-700">Quantity</span>
//             <div className="flex items-center border border-gray-300 rounded-md">
//               <button
//                 onClick={() => handleQuantityChange(-1)}
//                 disabled={quantity <= 1 || isOutOfStock}
//                 className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
//               >-</button>
//               <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
//               <button
//                 onClick={() => handleQuantityChange(1)}
//                 disabled={quantity >= stock || isOutOfStock}
//                 className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
//               >+</button>
//             </div>
//             <span className="text-sm text-gray-500">
//               {isOutOfStock ? 'Out of stock' : `${stock} available`}
//             </span>
//           </div>

//           <button
//             onClick={handleAddToCart}
//             disabled={isOutOfStock}
//             className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
//           >
//             {isOutOfStock ? 'Currently Unavailable' : 'Add to Cart'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }




"use client";

import { useState } from "react";
import Image from "next/image";
import { Product } from "@/lib/types/product";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/utils/format";

export default function ProductDetails({
  product,
}: {
  product: Product;
}) {
  const [selectedImage, setSelectedImage] = useState(
    product.images[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { addToCart } = useCart();

  const isOutOfStock = product.stock <= 0;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) =>
      Math.max(
        1,
        Math.min(prev + delta, product.stock)
      )
    );
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      return;
    }

    if (quantity > product.stock) {
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId,
      price: product.price,
      currency: product.currency,
      image: product.images[0] ?? "",
      quantity,
      stock: product.stock,
    });

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
      {/* Image Gallery */}
      <div className="w-full md:w-1/2 flex flex-col gap-4">
        <div className="relative aspect-square w-full rounded-lg overflow-hidden border bg-gray-50">
          {selectedImage && (
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          )}
        </div>

        {product.images.length > 1 && (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`relative w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 transition-all ${
                  selectedImage === img
                    ? "border-primary"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <Image
                  src={img}
                  alt={`${product.name} thumbnail`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {product.name}
          </h1>

          <p className="text-2xl font-semibold text-gray-900">
            {formatPrice(
              product.price,
              product.currency
            )}
          </p>
        </div>

        <div className="prose prose-sm text-gray-600">
          <p>{product.description}</p>
        </div>

        {product.features &&
          product.features.length > 0 && (
            <ul className="space-y-2">
              {product.features.map(
                (feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center text-gray-700"
                  >
                    <span className="mr-2 text-green-500">
                      ✓
                    </span>

                    {feature}
                  </li>
                )
              )}
            </ul>
          )}

        {/* Quantity */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-medium text-gray-700">
              Quantity
            </span>

            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                type="button"
                onClick={() =>
                  handleQuantityChange(-1)
                }
                disabled={
                  quantity <= 1 ||
                  isOutOfStock
                }
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                -
              </button>

              <span className="px-4 py-2 min-w-[3rem] text-center">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() =>
                  handleQuantityChange(1)
                }
                disabled={
                  quantity >= product.stock ||
                  isOutOfStock
                }
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                +
              </button>
            </div>

            <span className="text-sm text-gray-500">
              {isOutOfStock
                ? "Out of stock"
                : `${product.stock} available`}
            </span>
          </div>

          {/* Add to Cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isOutOfStock
              ? "Currently Unavailable"
              : added
                ? "Added to Cart ✓"
                : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

