"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

import type { CartItem } from "@/lib/types/cart";

interface CartState {
  items: CartItem[];
}

type CartAction =
  | {
      type: "ADD_ITEM";
      item: CartItem;
    }
  | {
      type: "REMOVE_ITEM";
      productId: string;
    }
  | {
      type: "UPDATE_QUANTITY";
      productId: string;
      quantity: number;
    }
  | {
      type: "CLEAR_CART";
    }
  | {
      type: "LOAD_CART";
      items: CartItem[];
    };

interface CartContextValue {
  items: CartItem[];
  isReady: boolean;

  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  hasItem: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
  getItemCount: () => number;
  getSubtotal: () => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "cart";

const initialState: CartState = {
  items: [],
};

function cartReducer(
  state: CartState,
  action: CartAction
): CartState {
  switch (action.type) {
    case "LOAD_CART":
      return {
        items: action.items,
      };

    case "ADD_ITEM": {
      const existingItem = state.items.find(
        (item) => item.productId === action.item.productId
      );

      if (!existingItem) {
        return {
          items: [...state.items, action.item],
        };
      }

      const newQuantity = Math.min(
        existingItem.quantity + action.item.quantity,
        existingItem.stock
      );

      return {
        items: state.items.map((item) =>
          item.productId === action.item.productId
            ? {
                ...item,
                quantity: newQuantity,
                stock: action.item.stock,
                price: action.item.price,
              }
            : item
        ),
      };
    }

    case "REMOVE_ITEM":
      return {
        items: state.items.filter(
          (item) => item.productId !== action.productId
        ),
      };

    case "UPDATE_QUANTITY": {
      return {
        items: state.items
          .map((item) => {
            if (item.productId !== action.productId) {
              return item;
            }

            const quantity = Math.max(
              1,
              Math.min(action.quantity, item.stock)
            );

            return {
              ...item,
              quantity,
            };
          })
          .filter((item) => item.quantity > 0),
      };
    }

    case "CLEAR_CART":
      return {
        items: [],
      };

    default:
      return state;
  }
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(STORAGE_KEY);

      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);

        if (Array.isArray(parsedCart)) {
          dispatch({
            type: "LOAD_CART",
            items: parsedCart,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state.items)
      );
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, [state.items, isReady]);

  const addToCart = useCallback((item: CartItem) => {
    if (item.stock <= 0) {
      return;
    }

    if (item.quantity <= 0) {
      return;
    }

    dispatch({
      type: "ADD_ITEM",
      item: {
        ...item,
        quantity: Math.min(item.quantity, item.stock),
      },
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      productId,
    });
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (!Number.isFinite(quantity)) {
        return;
      }

      dispatch({
        type: "UPDATE_QUANTITY",
        productId,
        quantity,
      });
    },
    []
  );

  const clearCart = useCallback(() => {
    dispatch({
      type: "CLEAR_CART",
    });
  }, []);

  const hasItem = useCallback(
    (productId: string) => {
      return state.items.some(
        (item) => item.productId === productId
      );
    },
    [state.items]
  );

  const getItemQuantity = useCallback(
    (productId: string) => {
      return (
        state.items.find(
          (item) => item.productId === productId
        )?.quantity ?? 0
      );
    },
    [state.items]
  );

  const getItemCount = useCallback(() => {
    return state.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [state.items]);

  const getSubtotal = useCallback(() => {
    return state.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [state.items]);

  const value = useMemo(
    () => ({
      items: state.items,
      isReady,

      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,

      hasItem,
      getItemQuantity,
      getItemCount,
      getSubtotal,
    }),
    [
      state.items,
      isReady,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      hasItem,
      getItemQuantity,
      getItemCount,
      getSubtotal,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside a CartProvider"
    );
  }

  return context;
}