'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// DECISIÓN: El carrito se almacena en localStorage para que funcione sin login.
// Al hacer checkout, se verifica la sesión. Esto permite navegación libre sin autenticación.

export interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  precio_original: number;
  talle: string;
  slug: string;
  imagen: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        localStorage.removeItem('cart');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  function addItem(item: CartItem) {
    // DECISIÓN: Stock siempre = 1, no se puede agregar el mismo producto dos veces
    setItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearCart() {
    setItems([]);
  }

  const itemCount = items.length;
  const total = items.reduce((sum, item) => sum + item.precio, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, itemCount, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context;
}
