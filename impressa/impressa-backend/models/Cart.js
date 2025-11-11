import mongoose from "mongoose";
import crypto from "crypto";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: String, // Cache for faster access
  productImage: String,
  productPrice: Number,
  variationId: String, // If product has variations
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  customizations: {
    customText: String,
    customFile: String,
    cloudLink: String,
    cloudPassword: String,
  },
}, { _id: false });

const cartSchema = new mongoose.Schema(
  {
    sessionToken: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    totals: {
      subtotal: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    couponCode: String,
    discountAmount: { type: Number, default: 0 },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique session token
cartSchema.statics.generateSessionToken = function () {
  return crypto.randomBytes(32).toString("hex");
};

// Pre-save hook to calculate totals
cartSchema.pre("save", function (next) {
  // Calculate item subtotals
  this.items.forEach((item) => {
    item.subtotal = item.price * item.quantity;
  });

  // Calculate cart subtotal
  this.totals.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);

  // Calculate total (after discount, tax, shipping)
  this.totals.total =
    this.totals.subtotal -
    this.totals.discount +
    this.totals.tax +
    this.totals.shipping;

  // Update last activity
  this.lastActivity = new Date();

  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function (itemData) {
  const { product, quantity = 1, price, customizations } = itemData;

  // Check if item already exists (same product, same customizations)
  const existingItemIndex = this.items.findIndex(
    (item) =>
      item.product.equals(product) &&
      JSON.stringify(item.customizations) === JSON.stringify(customizations || {})
  );

  if (existingItemIndex >= 0) {
    // Update quantity
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product,
      quantity,
      price,
      customizations: customizations || {},
    });
  }

  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function (productId, quantity) {
  const item = this.items.find((item) => item.product.equals(productId));

  if (!item) {
    throw new Error("Item not found in cart");
  }

  if (quantity <= 0) {
    // Remove item
    this.items = this.items.filter((item) => !item.product.equals(productId));
  } else {
    item.quantity = quantity;
  }

  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter((item) => !item.product.equals(productId));
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function () {
  this.items = [];
  this.couponCode = undefined;
  this.discountAmount = 0;
  this.totals = {
    subtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    total: 0,
  };
  return this.save();
};

// Method to apply coupon
cartSchema.methods.applyCoupon = function (coupon) {
  this.couponCode = coupon.code;
  const discount = coupon.calculateDiscount(this.totals.subtotal, this.items);
  this.totals.discount = discount;
  this.discountAmount = discount;
  return this.save();
};

// Method to remove coupon
cartSchema.methods.removeCoupon = function () {
  this.couponCode = undefined;
  this.totals.discount = 0;
  this.discountAmount = 0;
  return this.save();
};

// Static method to find or create cart by session token
cartSchema.statics.findOrCreateBySession = async function (sessionToken, userId = null) {
  let cart = await this.findOne({ sessionToken });

  if (!cart) {
    cart = await this.create({
      sessionToken,
      user: userId,
    });
  } else if (userId && !cart.user) {
    // Associate cart with user on login
    cart.user = userId;
    await cart.save();
  }

  return cart;
};

// Static method to merge carts (localStorage -> server on login)
cartSchema.statics.mergeCarts = async function (sessionCart, userCart) {
  if (!userCart) return sessionCart;

  // Merge items from session cart into user cart
  for (const sessionItem of sessionCart.items) {
    const existingItem = userCart.items.find(
      (item) =>
        item.product.equals(sessionItem.product) &&
        JSON.stringify(item.customizations) === JSON.stringify(sessionItem.customizations)
    );

    if (existingItem) {
      existingItem.quantity += sessionItem.quantity;
    } else {
      userCart.items.push(sessionItem);
    }
  }

  await userCart.save();
  await sessionCart.deleteOne(); // Delete session cart after merge

  return userCart;
};

// Index for automatic cart cleanup
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
