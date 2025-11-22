import { createContext, useContext, useEffect, useState } from "react";
import * as api from "../services/api";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Local-only mapping of files per cart line item index
  const [files, setFiles] = useState([]);

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const syncFilesWithCart = (nextCart) => {
    const length = nextCart?.items?.length || 0;
    setFiles((prev) => prev.slice(0, length));
  };

  const setCartSafe = (nextCart) => {
    setCart(nextCart);
    syncFilesWithCart(nextCart);
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      const payload = await api.getCart(); // { success, data: cartDoc, sessionToken }
      setCartSafe(payload.data || null);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add item to cart.
   * Frontend callers can pass either a product ID or a full product object,
   * plus an options object with quantity/customizations.
   */
  const addItem = async (productOrId, options = {}) => {
    const {
      quantity = 1,
      variationId = null,
      customText,
      cloudLink,
      cloudPassword,
    } = options;

    const productId =
      typeof productOrId === "string" ? productOrId : productOrId?._id;

    if (!productId) {
      throw new Error("Product ID is required to add to cart");
    }

    const customizations = {};
    if (customText) customizations.customText = customText;
    if (cloudLink) customizations.cloudLink = cloudLink;
    if (cloudPassword) customizations.cloudPassword = cloudPassword;

    try {
      const payload = await api.addToCart(
        productId,
        quantity,
        variationId,
        Object.keys(customizations).length ? customizations : null
      );
      setCartSafe(payload.data || null);
      return payload;
    } catch (err) {
      // Log full backend error details to understand 400 responses
      const backendMessage = err?.response?.data?.message;
      console.error("Failed to add item:", {
        message: err.message,
        status: err?.response?.status,
        backendMessage,
        data: err?.response?.data,
      });
      throw err;
    }
  };

  const updateItem = async (productId, quantity, variationId = null) => {
    try {
      const payload = await api.updateCartItem(productId, quantity, variationId);
      setCartSafe(payload.data || null);
      return payload;
    } catch (err) {
      console.error("Failed to update item:", err);
      throw err;
    }
  };

  const removeItem = async (productIdOrIndex) => {
    try {
      let productId = productIdOrIndex;
      // Allow passing an index for convenience
      if (typeof productIdOrIndex === "number") {
        const rawItems = cart?.items || [];
        const target = rawItems[productIdOrIndex];
        productId = target?.product?._id || target?.product;
      }

      if (!productId) throw new Error("Product ID is required to remove item");

      const payload = await api.removeFromCart(productId);
      setCartSafe(payload.data || null);
      return payload;
    } catch (err) {
      console.error("Failed to remove item:", err);
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      const payload = await api.clearCart();
      setCartSafe(payload.data || null);
      return payload;
    } catch (err) {
      console.error("Failed to clear cart:", err);
      throw err;
    }
  };

  const applyCoupon = async (couponCode) => {
    try {
      const payload = await api.applyCoupon(couponCode);
      setCartSafe(payload.data || null);
      return payload;
    } catch (err) {
      console.error("Failed to apply coupon:", err);
      throw err;
    }
  };

  const removeCoupon = async () => {
    try {
      const payload = await api.removeCoupon();
      setCartSafe(payload.data || null);
      return payload;
    } catch (err) {
      console.error("Failed to remove coupon:", err);
      throw err;
    }
  };

  // Derived view items: flatten backend customizations for easier UI use
  const rawItems = cart?.items || [];
  const items = rawItems.map((it) => ({
    product: it.product,
    quantity: it.quantity,
    customText: it.customizations?.customText || "",
    cloudLink: it.customizations?.cloudLink || "",
    cloudPassword: it.customizations?.cloudPassword || "",
    _id: it.product?._id || it.product,
  }));

  const itemCount =
    items.reduce((count, item) => count + (item.quantity || 0), 0) || 0;

  const totals = {
    subtotal: cart?.totals?.subtotal || 0,
    discount: cart?.totals?.discount || 0,
    shipping: cart?.totals?.shipping || 0,
    tax: cart?.totals?.tax || 0,
    grandTotal: cart?.totals?.total || 0,
    itemCount,
  };

  // Helpers expected by existing pages
  const updateQty = async (index, quantity) => {
    const target = items[index];
    if (!target) return;
    const productId = target._id;
    return updateItem(productId, quantity);
  };

  const setFile = (index, file) => {
    setFiles((prev) => {
      const next = [...prev];
      next[index] = file || null;
      return next;
    });
  };

  const getFile = (index) => files[index] || null;

  const removeMany = async (indices) => {
    const uniqueIndices = Array.from(new Set(indices)).sort((a, b) => a - b);
    const raw = cart?.items || [];
    const ids = uniqueIndices
      .map((i) => raw[i])
      .filter(Boolean)
      .map((it) => it.product?._id || it.product);

    // Remove each product from cart sequentially to keep things simple
    for (const id of ids) {
      await removeItem(id);
    }
  };

  const clear = clearCart;

  const value = {
    cart,
    loading,
    error,
    items,
    itemCount,
    totals,
    coupon: cart?.couponCode || null,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    clear,
    applyCoupon,
    removeCoupon,
    updateQty,
    setFile,
    getFile,
    removeMany,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
