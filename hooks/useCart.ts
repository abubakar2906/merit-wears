"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (product_id: string, size: string) => void;
  updateQuantity: (product_id: string, size: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const idx = state.items.findIndex(
            (i) => i.product_id === item.product_id && i.size === item.size
          );
          if (idx >= 0) {
            const next = [...state.items];
            next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
            return { items: next };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (product_id, size) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product_id === product_id && i.size === size)
          )
        })),
      updateQuantity: (product_id, size, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === product_id && i.size === size
              ? { ...i, quantity: Math.max(1, qty) }
              : i
          )
        })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((n, i) => n + i.quantity, 0)
    }),
    { name: "merit-cart" }
  )
);
