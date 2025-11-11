import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "impressa_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // transient file attachments per cart line (not persisted)
  const [files, setFiles] = useState({});
  const setFile = (index, file) => setFiles((prev) => ({ ...prev, [index]: file }));
  const getFile = (index) => files[index] || null;

  const addItem = (product, { quantity = 1, customText = "", cloudLink = "", cloudPassword = "" } = {}) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.product._id === product._id && it.cloudLink === cloudLink && it.customText === customText);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { product, quantity, customText, cloudLink, cloudPassword }];
    });
  };

  const removeItem = (productId, key = null) => {
    setItems((prev) => prev.filter((it, i) => it.product._id !== productId || (key !== null && i !== key)));
  };

  const updateQty = (index, quantity) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, quantity: Math.max(1, quantity) } : it)));
  };

  const clear = () => setItems([]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + (it.product.price || 0) * it.quantity, 0);
    return { subtotal, itemCount: items.reduce((c, it) => c + it.quantity, 0) };
  }, [items]);

  const value = { items, addItem, removeItem, updateQty, clear, totals, setFile, getFile, files };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
