'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export interface CartItem {
  priceId      : string;
  name         : string;
  displayPrice : string;
  slug         : string;
  category     : string;
}

interface CartContextValue {
  items    : CartItem[];
  addItem  : (item: CartItem) => void;
  removeItem: (priceId: string) => void;
  clearCart: () => void;
  isOpen   : boolean;
  open     : () => void;
  close    : () => void;
  toggle   : () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'expert_cart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items,    setItems]    = useState<CartItem[]>([]);
  const [isOpen,   setIsOpen]   = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]); // eslint-disable-line react-hooks/set-state-in-effect
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => prev.some(i => i.priceId === item.priceId) ? prev : [...prev, item]);
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((priceId: string) => {
    setItems(prev => prev.filter(i => i.priceId !== priceId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const open      = useCallback(() => setIsOpen(true),  []);
  const close     = useCallback(() => setIsOpen(false), []);
  const toggle    = useCallback(() => setIsOpen(v => !v), []);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, isOpen, open, close, toggle }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
