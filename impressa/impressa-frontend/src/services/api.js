import axios from "../utils/axiosInstance";

// ==================== CART API ====================

/**
 * Get current cart (creates one if doesn't exist)
 */
export const getCart = async () => {
  const response = await axios.get("/cart");
  return response.data;
};

/**
 * Add item to cart
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to add
 * @param {string} variationId - Optional variation ID
 * @param {Object|null} customizations - Optional customization data (text/cloud/etc.)
 */
export const addToCart = async (
  productId,
  quantity = 1,
  variationId = null,
  customizations = null
) => {
  const payload = {
    productId,
    quantity,
    variationId,
  };

  // Only send customizations if provided so the backend can attach them to the cart item
  if (customizations && Object.keys(customizations).length > 0) {
    payload.customizations = customizations;
  }

  const response = await axios.post("/cart/items", payload);
  return response.data;
};

/**
 * Update cart item quantity
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity
 * @param {string} variationId - Optional variation ID
 */
export const updateCartItem = async (productId, quantity, variationId = null) => {
  const response = await axios.put("/cart/items", {
    productId,
    quantity,
    variationId,
  });
  return response.data;
};

/**
 * Remove item from cart
 * @param {string} productId - Product ID to remove
 */
export const removeFromCart = async (productId) => {
  const response = await axios.delete(`/cart/items/${productId}`);
  return response.data;
};

/**
 * Clear entire cart
 */
export const clearCart = async () => {
  const response = await axios.delete("/cart");
  return response.data;
};

/**
 * Apply coupon to cart
 * @param {string} couponCode - Coupon code to apply
 */
export const applyCoupon = async (couponCode) => {
  const response = await axios.post("/cart/coupon", { couponCode });
  return response.data;
};

/**
 * Remove coupon from cart
 */
export const removeCoupon = async () => {
  const response = await axios.delete("/cart/coupon");
  return response.data;
};

/**
 * Merge guest cart with user cart after login
 * @param {string} guestSessionToken - Guest cart session token
 */
export const mergeCart = async (guestSessionToken) => {
  const response = await axios.post("/cart/merge", { guestSessionToken });
  return response.data;
};

// ==================== COUPON API ====================

/**
 * Validate a coupon code
 * @param {string} code - Coupon code to validate
 */
export const validateCoupon = async (code) => {
  const response = await axios.post(`/coupons/validate/${code}`);
  return response.data;
};

// ==================== CHECKOUT API ====================

/**
 * Calculate shipping cost
 * @param {Object} address - Shipping address with city, state, country, postalCode
 */
export const calculateShipping = async (address) => {
  const response = await axios.post("/checkout/shipping/calculate", address);
  return response.data;
};

/**
 * Calculate tax
 * @param {Object} data - Data with address and cart total
 */
export const calculateTax = async (data) => {
  const response = await axios.post("/checkout/tax/calculate", data);
  return response.data;
};

/**
 * Create order from cart
 * @param {Object} orderData - Order data with billing/shipping address, shipping method, notes
 */
export const createOrder = async (orderData) => {
  const response = await axios.post("/checkout/order", orderData);
  return response.data;
};

// ==================== PAYMENT API (MTN MoMo) ====================

/**
 * Initiate MTN MoMo payment
 * @param {string} orderId - Order ID (publicId)
 * @param {string} phoneNumber - MTN MoMo phone number (250XXXXXXXXX)
 */
export const initiateMTNPayment = async (orderId, phoneNumber) => {
  const response = await axios.post("/payments/mtn/initiate", {
    orderId,
    phoneNumber,
  });
  return response.data;
};

/**
 * Check MTN MoMo payment status
 * @param {string} orderId - Order ID (publicId)
 */
export const checkPaymentStatus = async (orderId) => {
  const response = await axios.get(`/payments/mtn/status/${orderId}`);
  return response.data;
};

/**
 * Verify MTN MoMo account
 * @param {string} phoneNumber - Phone number to verify (250XXXXXXXXX)
 */
export const verifyMTNAccount = async (phoneNumber) => {
  const response = await axios.post("/payments/mtn/verify-account", {
    phoneNumber,
  });
  return response.data;
};

/**
 * Get MTN MoMo account balance (Admin only)
 */
export const getMTNBalance = async () => {
  const response = await axios.get("/payments/mtn/balance");
  return response.data;
};

// ==================== PRODUCT API ====================

/**
 * Get product by ID
 * @param {string} productId - Product ID
 */
export const getProduct = async (productId) => {
  const response = await axios.get(`/products/${productId}`);
  return response.data;
};

/**
 * Get all products with filters
 * @param {Object} filters - Optional filters (category, minPrice, maxPrice, search, page, limit)
 */
export const getProducts = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null) {
      params.append(key, filters[key]);
    }
  });
  
  const response = await axios.get(`/products?${params.toString()}`);
  return response.data;
};

// ==================== ORDER API ====================

/**
 * Get user's orders
 */
export const getUserOrders = async () => {
  const response = await axios.get("/orders/user");
  return response.data;
};

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 */
export const getOrder = async (orderId) => {
  const response = await axios.get(`/orders/${orderId}`);
  return response.data;
};

/**
 * Track order by public ID
 * @param {string} publicId - Order public ID
 */
export const trackOrder = async (publicId) => {
  const response = await axios.get(`/orders/track/${publicId}`);
  return response.data;
};

// ==================== CATEGORY API ====================

/**
 * Get all categories
 */
export const getCategories = async () => {
  const response = await axios.get("/categories");
  return response.data;
};

/**
 * Get category tree
 */
export const getCategoryTree = async () => {
  const response = await axios.get("/categories/tree");
  return response.data;
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Format phone number for MTN MoMo (Rwanda)
 * Converts: 0788123456, +250788123456, 250788123456, etc.
 * To: 250788123456
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  
  // If starts with 0, assume it's Rwanda without country code
  if (cleaned.startsWith("0")) {
    cleaned = "250" + cleaned.substring(1);
  }
  
  // If doesn't start with 250, add it
  if (!cleaned.startsWith("250")) {
    cleaned = "250" + cleaned;
  }
  
  return cleaned;
};

/**
 * Validate Rwanda phone number
 */
export const validatePhoneNumber = (phone) => {
  const formatted = formatPhoneNumber(phone);
  return /^250\d{9}$/.test(formatted);
};

/**
 * Format currency (RWF)
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default {
  // Cart
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  mergeCart,
  
  // Coupons
  validateCoupon,
  
  // Checkout
  calculateShipping,
  calculateTax,
  createOrder,
  
  // Payments
  initiateMTNPayment,
  checkPaymentStatus,
  verifyMTNAccount,
  getMTNBalance,
  
  // Products
  getProduct,
  getProducts,
  
  // Orders
  getUserOrders,
  getOrder,
  trackOrder,
  
  // Categories
  getCategories,
  getCategoryTree,
  
  // Helpers
  formatPhoneNumber,
  validatePhoneNumber,
  formatCurrency,
};
