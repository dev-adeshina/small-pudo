// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import { useCart } from "@/context/cart-context";

// const defaultPlaceholderImage = "https://images.unsplash.com/photo-1574484284002-952d92456975?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

// export default function CartPage() {
//   const {
//     items,
//     isReady,
//     updateQuantity,
//     removeFromCart,
//     clearCart,
//     getSubtotal,
//   } = useCart();

//   if (!isReady) {
//     return (
//       <main className="cart-page">
//         <section className="page-heading">
//           <span className="eyebrow">Your order</span>
//           <h1>Your cart</h1>
//           <p>Loading your cart...</p>
//         </section>
//       </main>
//     );
//   }

//   const subtotal = getSubtotal();

//   return (
//     <main className="cart-page">
//       <section className="page-heading">
//         <span className="eyebrow">Your order</span>

//         <h1>Your cart</h1>

//         <p>
//           Review your selected items before continuing.
//         </p>
//       </section>

//       {items.length === 0 ? (
//         <section className="empty-cart">
//           <div className="empty-cart-icon">🛒</div>

//           <h2>Your cart is empty</h2>

//           <p>
//             You haven't added anything to your cart yet.
//           </p>

//           <Link
//             href="/products"
//             className="btn btn-primary"
//           >
//             Browse Products
//           </Link>
//         </section>
//       ) : (
//         <section className="cart-layout">
//           <div className="cart-items">
//             <div className="cart-items-header">
//               <h2>Cart Items</h2>

//               <button
//                 type="button"
//                 className="clear-cart"
//                 onClick={clearCart}
//               >
//                 Clear cart
//               </button>
//             </div>

//             {items.map((item) => (


//               <article
//                 className="cart-item"
//                 key={item.productId}
//               >
//                 <div className="cart-item-image">


//                   {/* {item.image ? (
//                     <Image
//                       src={item.image || defaultPlaceholderImage}
//                       alt={item.name}
//                       width={120}
//                       height={120}
//                     />
//                   ) : (
                    
//                     <div className="cart-image-placeholder">
//                       No image
//                     </div>
//                   )} */}


//                   {items.map((item) => {
//                     const imageSrc =
//                       item.image &&
//                         (
//                           item.image.startsWith("/") ||
//                           item.image.startsWith("http://") ||
//                           item.image.startsWith("https://")
//                         )
//                         ? item.image
//                         : defaultPlaceholderImage;

//                     return (
//                       <div key={item.productId} className="cart-item">
//                         <div className="cart-item-image">
//                           <Image
//                             src={imageSrc}
//                             alt={item.name}
//                             width={120}
//                             height={120}
//                           />
//                         </div>

//                         {/* rest of your cart item */}
//                       </div>
//                     );
//                   })}
//                 </div>

//                 <div className="cart-item-info">
//                   <span className="eyebrow">
//                     Product
//                   </span>

//                   <h2>{item.name}</h2>

//                   <p className="cart-item-price">
//                     {new Intl.NumberFormat("en-NG", {
//                       style: "currency",
//                       currency: item.currency || "NGN",
//                       maximumFractionDigits: 0,
//                     }).format(item.price)}
//                   </p>

//                   <p className="cart-item-stock">
//                     {item.stock} in stock
//                   </p>
//                 </div>

//                 <div className="cart-item-actions">
//                   <div className="quantity">
//                     <button
//                       type="button"
//                       onClick={() =>
//                         updateQuantity(
//                           item.productId,
//                           item.quantity - 1
//                         )
//                       }
//                       disabled={item.quantity <= 1}
//                       aria-label={`Decrease quantity of ${item.name}`}
//                     >
//                       −
//                     </button>

//                     <span>{item.quantity}</span>

//                     <button
//                       type="button"
//                       onClick={() =>
//                         updateQuantity(
//                           item.productId,
//                           item.quantity + 1
//                         )
//                       }
//                       disabled={
//                         item.quantity >= item.stock
//                       }
//                       aria-label={`Increase quantity of ${item.name}`}
//                     >
//                       +
//                     </button>
//                   </div>

//                   <button
//                     type="button"
//                     className="remove"
//                     onClick={() =>
//                       removeFromCart(item.productId)
//                     }
//                   >
//                     Remove
//                   </button>
//                 </div>

//                 <div className="cart-item-total">
//                   {new Intl.NumberFormat("en-NG", {
//                     style: "currency",
//                     currency: item.currency || "NGN",
//                     maximumFractionDigits: 0,
//                   }).format(
//                     item.price * item.quantity
//                   )}
//                 </div>
//               </article>
//             ))}
//           </div>

//           <aside className="cart-summary">
//             <h2>Order summary</h2>

//             <div className="summary-row">
//               <span>Subtotal</span>

//               <strong>
//                 {new Intl.NumberFormat("en-NG", {
//                   style: "currency",
//                   currency: "NGN",
//                   maximumFractionDigits: 0,
//                 }).format(subtotal)}
//               </strong>
//             </div>

//             <div className="summary-row">
//               <span>Delivery</span>

//               <span>Calculated later</span>
//             </div>

//             <div className="summary-total">
//               <span>Total</span>

//               <strong>
//                 {new Intl.NumberFormat("en-NG", {
//                   style: "currency",
//                   currency: "NGN",
//                   maximumFractionDigits: 0,
//                 }).format(subtotal)}
//               </strong>
//             </div>

//             <button
//               type="button"
//               className="btn btn-primary checkout"
//               disabled
//             >
//               Checkout — Coming Soon
//             </button>

//             <Link
//               href="/products"
//               className="continue-shopping"
//             >
//               Continue Shopping
//             </Link>
//           </aside>
//         </section>
//       )}
//     </main>
//   );
// }

"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";

const defaultPlaceholderImage =
  "https://images.unsplash.com/photo-1574484284002-952d92456975?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

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

        <p>Review your selected items before continuing.</p>
      </section>

      {items.length === 0 ? (
        <section className="empty-cart">
          <div className="empty-cart-icon">🛒</div>

          <h2>Your cart is empty</h2>

          <p>You haven't added anything to your cart yet.</p>

          <Link href="/products" className="btn btn-primary">
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

            {items.map((item) => {
              const imageSrc =
                item.image &&
                (item.image.startsWith("/") ||
                  item.image.startsWith("http://") ||
                  item.image.startsWith("https://"))
                  ? item.image
                  : defaultPlaceholderImage;

              return (
                <article className="cart-item" key={item.productId}>
                  <div className="cart-item-image">
                    <Image
                      src={imageSrc}
                      alt={item.name}
                      width={120}
                      height={120}
                    />
                  </div>

                  <div className="cart-item-info">
                    <span className="eyebrow">Product</span>

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
                        disabled={item.quantity >= item.stock}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="remove"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="cart-item-total">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: item.currency || "NGN",
                      maximumFractionDigits: 0,
                    }).format(item.price * item.quantity)}
                  </div>
                </article>
              );
            })}
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

              <span>Calculated at checkout</span>
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

            <Link
              href="/checkout"
              className="btn btn-primary checkout"
            >
              Proceed to Checkout
            </Link>

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