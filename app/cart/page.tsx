// "use client"

// import Link from "next/link"
// import { useEffect, useState } from "react"
// import { products } from "@/lib/products"
// import { useCart } from "@/context/cart-context";



// type CartItem = {
//   productId: number
//   quantity: number
// }

// export default function CartPage() {

//   const {
//   items,
//   isReady,
//   updateQuantity,
//   removeFromCart,
//   clearCart,
//   getSubtotal,
// } = useCart()



//   const [cart, setCart] = useState<CartItem[]>([])

//   useEffect(() => {
//     const stored = localStorage.getItem("cart")

//     if (stored) {
//       setCart(JSON.parse(stored))
//     }
//   }, [])

//   const updateCart = (newCart: CartItem[]) => {
//     setCart(newCart)
//     localStorage.setItem("cart", JSON.stringify(newCart))
//   }

//   const increase = (productId: number) => {
//     const newCart = cart.map((item) =>
//       item.productId === productId
//         ? {
//             ...item,
//             quantity: item.quantity + 1,
//           }
//         : item
//     )

//     updateCart(newCart)
//   }

//   const decrease = (productId: number) => {
//     const newCart = cart
//       .map((item) =>
//         item.productId === productId
//           ? {
//               ...item,
//               quantity: item.quantity - 1,
//             }
//           : item
//       )
//       .filter((item) => item.quantity > 0)

//     updateCart(newCart)
//   }

//   const remove = (productId: number) => {
//     updateCart(
//       cart.filter(
//         (item) => item.productId !== productId
//       )
//     )
//   }

//   const cartProducts = cart
//     .map((item) => {
//       const product = products.find(
//         (product) => product.id === item.productId
//       )

//       return product
//         ? {
//             ...product,
//             quantity: item.quantity,
//           }
//         : null
//     })
//     .filter(Boolean) as Array<
//     (typeof products)[number] & {
//       quantity: number
//     }
//   >

//   const subtotal = cartProducts.reduce(
//     (total, product) =>
//       total + product.price * product.quantity,
//     0
//   )

//   return (
//     <main className="cart-page">
//       <section className="page-heading">
//         <span className="eyebrow">Your order</span>

//         <h1>Your cart</h1>

//         <p>
//           Review your selected services before continuing.
//         </p>
//       </section>

//       {cartProducts.length === 0 ? (
//         <section className="empty-cart">
//           <div className="empty-cart-icon">🛒</div>

//           <h2>Your cart is empty</h2>

//           <p>
//             You haven't added anything to your cart yet.
//           </p>

//           <Link
//             href="/"
//             className="btn btn-primary"
//           >
//             Browse services
//           </Link>
//         </section>
//       ) : (
//         <section className="cart-layout">
//           <div className="cart-items">
//             {cartProducts.map((product) => (
//               <article
//                 className="cart-item"
//                 key={product.id}
//               >
//                 <img
//                   src={product.image}
//                   alt={product.name}
//                 />

//                 <div className="cart-item-info">
//                   <span className="eyebrow">
//                     {product.category}
//                   </span>

//                   <h2>{product.name}</h2>

//                   <p>
//                     ₦{product.price.toLocaleString()}
//                   </p>
//                 </div>

//                 <div className="quantity">
//                   <button
//                     onClick={() =>
//                       decrease(product.id)
//                     }
//                   >
//                     −
//                   </button>

//                   <span>{product.quantity}</span>

//                   <button
//                     onClick={() =>
//                       increase(product.id)
//                     }
//                   >
//                     +
//                   </button>
//                 </div>

//                 <div className="cart-item-total">
//                   ₦
//                   {(
//                     product.price *
//                     product.quantity
//                   ).toLocaleString()}
//                 </div>

//                 <button
//                   className="remove"
//                   onClick={() => remove(product.id)}
//                 >
//                   Remove
//                 </button>
//               </article>
//             ))}
//           </div>

//           <aside className="cart-summary">
//             <h2>Order summary</h2>

//             <div className="summary-row">
//               <span>Subtotal</span>

//               <strong>
//                 ₦{subtotal.toLocaleString()}
//               </strong>
//             </div>

//             <div className="summary-row">
//               <span>Delivery</span>

//               <span>Calculated later</span>
//             </div>

//             <div className="summary-total">
//               <span>Total</span>

//               <strong>
//                 ₦{subtotal.toLocaleString()}
//               </strong>
//             </div>

//             <button className="btn btn-primary checkout">
//               Continue to checkout
//             </button>
//           </aside>
//         </section>
//       )}
//     </main>
//   )
// }


"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";

const defaultPlaceholderImage = "https://images.unsplash.com/photo-1574484284002-952d92456975?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

export default function CartPage() {
  const {
    items,
    isReady,
    updateQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
  } = useCart();

  if (!isReady) {
    return (
      <main className="cart-page">
        <section className="page-heading">
          <span className="eyebrow">Your order</span>
          <h1>Your cart</h1>
          <p>Loading your cart...</p>
        </section>
      </main>
    );
  }

  const subtotal = getSubtotal();

  return (
    <main className="cart-page">
      <section className="page-heading">
        <span className="eyebrow">Your order</span>

        <h1>Your cart</h1>

        <p>
          Review your selected items before continuing.
        </p>
      </section>

      {items.length === 0 ? (
        <section className="empty-cart">
          <div className="empty-cart-icon">🛒</div>

          <h2>Your cart is empty</h2>

          <p>
            You haven't added anything to your cart yet.
          </p>

          <Link
            href="/products"
            className="btn btn-primary"
          >
            Browse Products
          </Link>
        </section>
      ) : (
        <section className="cart-layout">
          <div className="cart-items">
            <div className="cart-items-header">
              <h2>Cart Items</h2>

              <button
                type="button"
                className="clear-cart"
                onClick={clearCart}
              >
                Clear cart
              </button>
            </div>

            {items.map((item) => (
              <article
                className="cart-item"
                key={item.productId}
              >
                <div className="cart-item-image">
                  {item.image ? (
                    <Image
                      src={defaultPlaceholderImage}
                      // src={item.image}
                      alt={item.name}
                      width={120}
                      height={120}
                    />
                  ) : (
                    <div className="cart-image-placeholder">
                      No image
                    </div>
                  )}
                </div>

                <div className="cart-item-info">
                  <span className="eyebrow">
                    Product
                  </span>

                  <h2>{item.name}</h2>

                  <p className="cart-item-price">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: item.currency || "NGN",
                      maximumFractionDigits: 0,
                    }).format(item.price)}
                  </p>

                  <p className="cart-item-stock">
                    {item.stock} in stock
                  </p>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity - 1
                        )
                      }
                      disabled={item.quantity <= 1}
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity + 1
                        )
                      }
                      disabled={
                        item.quantity >= item.stock
                      }
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="remove"
                    onClick={() =>
                      removeFromCart(item.productId)
                    }
                  >
                    Remove
                  </button>
                </div>

                <div className="cart-item-total">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: item.currency || "NGN",
                    maximumFractionDigits: 0,
                  }).format(
                    item.price * item.quantity
                  )}
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Order summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>

              <strong>
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  maximumFractionDigits: 0,
                }).format(subtotal)}
              </strong>
            </div>

            <div className="summary-row">
              <span>Delivery</span>

              <span>Calculated later</span>
            </div>

            <div className="summary-total">
              <span>Total</span>

              <strong>
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  maximumFractionDigits: 0,
                }).format(subtotal)}
              </strong>
            </div>

            <button
              type="button"
              className="btn btn-primary checkout"
              disabled
            >
              Checkout — Coming Soon
            </button>

            <Link
              href="/products"
              className="continue-shopping"
            >
              Continue Shopping
            </Link>
          </aside>
        </section>
      )}
    </main>
  );
}