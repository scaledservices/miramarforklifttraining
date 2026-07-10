import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getProductBySlug, getBulkPrice } from "@/data/catalog";

export interface CartItem {
  courseSlug: string;
  productSlug?: string;
  title: string;
  price: number;
  quantity: number;
  isTeamProduct?: boolean;
  bookingId?: number;
  isBooking?: boolean;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (courseSlug: string) => void;
  updateQuantity: (courseSlug: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "forklift-cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (parsed[0].courseId && !parsed[0].courseSlug) {
          localStorage.removeItem(STORAGE_KEY);
          return [];
        }
        return parsed
          .filter((item: any) => item.courseSlug)
          .map((item: any) => ({
            ...item,
            quantity: item.quantity || 1,
          }));
      }
    }
  } catch {}
  return [];
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const qty = item.quantity || 1;
      const isTeam = item.isTeamProduct || qty > 1;
      const existing = prev.find((i) => i.courseSlug === item.courseSlug);
      if (existing) {
        return prev.map((i) =>
          i.courseSlug === item.courseSlug
            ? { ...i, quantity: qty, price: item.price, isTeamProduct: isTeam }
            : i
        );
      }
      return [...prev, { ...item, quantity: qty, isTeamProduct: isTeam }];
    });
  }, []);

  const removeItem = useCallback((courseSlug: string) => {
    setItems((prev) => prev.filter((i) => i.courseSlug !== courseSlug));
  }, []);

  const updateQuantity = useCallback((courseSlug: string, rawQuantity: number) => {
    // Same 1–100 bounds as the ProductDetail seat picker; the server still
    // recomputes pricing, this just keeps the cart UI sane.
    const quantity = Math.min(100, rawQuantity);
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => {
        if (i.courseSlug !== courseSlug) return i;
        const slug = i.productSlug || i.courseSlug;
        const product = getProductBySlug(slug);
        const newPrice = product ? getBulkPrice(product, quantity) : i.price;
        return { ...i, quantity, price: newPrice, isTeamProduct: quantity > 1 };
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
