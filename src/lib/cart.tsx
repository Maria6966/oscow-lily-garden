import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { deliveryPrice } from "./shop";

export type CartItem = {
  slug: string;
  name: string;
  kind: string;
  stems: number;
  price: number;
  qty: number;
};

type CartValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  delivery: number;
  total: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "liliya-cart";
const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* пустая корзина */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartValue>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const delivery = deliveryPrice(subtotal);
    return {
      items,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      subtotal,
      delivery,
      total: subtotal + delivery,
      add: (item, qty = 1) =>
        setItems((prev) => {
          const existing = prev.find((i) => i.slug === item.slug);
          if (existing) {
            return prev.map((i) => (i.slug === item.slug ? { ...i, qty: i.qty + qty } : i));
          }
          return [...prev, { ...item, qty }];
        }),
      setQty: (slug, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((i) => i.slug !== slug)
            : prev.map((i) => (i.slug === slug ? { ...i, qty } : i)),
        ),
      remove: (slug) => setItems((prev) => prev.filter((i) => i.slug !== slug)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart должен использоваться внутри CartProvider");
  return ctx;
}
