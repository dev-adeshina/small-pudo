// "use client";

// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// export type CartItem = {
//   productId: string;
//   name: string;
//   slug: string;
//   price: number;
//   currency: string;
//   image: string;
//   quantity: number;
//   stock: number;
// };

// type CartContextType = {
//   items: CartItem[];
//   addToCart: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
//   removeFromCart: (productId: string) => void;
//   updateQuantity: (productId: string, quantity: number) => void;
//   clearCart: () => void;
//   cartTotal: number;
//   cartCount: number;
// };

// const CartContext = createContext<CartContextType | undefined>(undefined);

// export function CartProvider({ children }: { children: ReactNode }) {
//   const [items, setItems] = useState<CartItem[]>([]);
//   const [isInitialized, setIsInitialized] = useState(false);

//   // Hydrate from localStorage
//   useEffect(() => {
//     const savedCart = localStorage.getItem('ecommerce-cart');
//     if (savedCart) {
//       try {
//         setItems(JSON.parse(savedCart));
//       } catch (error) {
//         console.error('Failed to parse cart', error);
//       }
//     }
//     setIsInitialized(true);
//   }, []);

//   // Persist to localStorage
//   useEffect(() => {
//     if (isInitialized) {
//       localStorage.setItem('ecommerce-cart', JSON.stringify(items));
//     }
//   }, [items, isInitialized]);

//   const addToCart = (newItem: Omit<CartItem, 'quantity'>, quantity: number) => {
//     setItems((currentItems) => {
//       const existingItem = currentItems.find((item) => item.productId === newItem.productId);
      
//       if (existingItem) {
//         const newQuantity = Math.min(existingItem.quantity + quantity, existingItem.stock);
//         return currentItems.map((item) => 
//           item.productId === newItem.productId ? { ...item, quantity: newQuantity } : item
//         );
//       }
      
//       return [...currentItems, { ...newItem, quantity: Math.min(quantity, newItem.stock) }];
//     });
    
//     // Fallback native toast/alert if no custom UI toast exists in the project yet
//     alert(`${newItem.name} added to cart!`); 
//   };

//   const removeFromCart = (productId: string) => {
//     setItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
//   };

//   const updateQuantity = (productId: string, quantity: number) => {
//     setItems((currentItems) => 
//       currentItems.map((item) => {
//         if (item.productId === productId) {
//           return { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) };
//         }
//         return item;
//       })
//     );
//   };

//   const clearCart = () => setItems([]);

//   const cartTotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
//   const cartCount = items.reduce((count, item) => count + item.quantity, 0);

//   return (
//     <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
//       {children}
//     </CartContext.Provider>
//   );
// }

// export const useCart = () => {
//   const context = useContext(CartContext);
//   if (context === undefined) {
//     throw new Error('useCart must be used within a CartProvider');
//   }
//   return context;
// };

"use client";

import React, { createContext, useContext, useReducer, useEffect, useState } from "react";
import { Product } from "@/lib/types/product"; 

type CartItem = {
  product: Product;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: "INITIALIZE_CART"; payload: CartItem[] }
  | { type: "ADD_ITEM"; payload: { product: Product; quantity: number } }
  | { type: "REMOVE_ITEM"; payload: { productId: string } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number } }
  | { type: "CLEAR_CART" };

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  hasItem: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
  getSubtotal: () => number;
  getItemCount: () => number;
  isInitialized: boolean;
}

const initialState: CartState = {
  items: [],
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "INITIALIZE_CART":
      return { ...state, items: action.payload };

    case "ADD_ITEM": {
      const { product, quantity } = action.payload;
      
      if (product.stock <= 0) return state;

      const existingItemIndex = state.items.findIndex(
        (item) => item.product.id === product.id
      );

      if (existingItemIndex > -1) {
        const existingItem = state.items[existingItemIndex];
        const newQuantity = Math.min(
          existingItem.quantity + quantity,
          product.stock // Prevent exceeding stock
        );

        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
        };
        return { ...state, items: updatedItems };
      } else {
        const newQuantity = Math.min(quantity, product.stock);
        return {
          ...state,
          items: [...state.items, { product, quantity: newQuantity }],
        };
      }
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(
          (item) => item.product.id !== action.payload.productId
        ),
      };

    case "UPDATE_QUANTITY": {
      const { productId, quantity } = action.payload;
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.product.id === productId) {
            const newQuantity = Math.min(Math.max(1, quantity), item.product.stock);
            return { ...item, quantity: newQuantity };
          }
          return item;
        }),
      };
    }

    case "CLEAR_CART":
      return { ...state, items: [] };

    default:
      return state;
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Hydration-safe initialization from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("ecommerce-cart");
      if (savedCart) {
        dispatch({ type: "INITIALIZE_CART", payload: JSON.parse(savedCart) });
      }
    } catch (error) {
      console.error("Failed to parse cart from local storage", error);
    }
    setIsInitialized(true);
  }, []);

  // Sync to localStorage on cart change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("ecommerce-cart", JSON.stringify(state.items));
    }
  }, [state.items, isInitialized]);

  const addToCart = (product: Product, quantity: number = 1) => {
    dispatch({ type: "ADD_ITEM", payload: { product, quantity } });
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { productId } });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  const hasItem = (productId: string) => {
    return state.items.some((item) => item.product.id === productId);
  };

  const getItemQuantity = (productId: string) => {
    const item = state.items.find((item) => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const getSubtotal = () => {
    return state.items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  const getItemCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        hasItem,
        getItemQuantity,
        getSubtotal,
        getItemCount,
        isInitialized,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}