import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import FlashSale from "../models/FlashSale.js";
import logger from "../config/logger.js";

/**
 * Get or create cart by session token
 */
export const getCart = async (req, res, next) => {
  try {
    let sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];

    // Generate new session token if not provided
    if (!sessionToken) {
      sessionToken = Cart.generateSessionToken();
    }

    const userId = req.user?.id; // From auth middleware if logged in

    let cart = await Cart.findOrCreateBySession(sessionToken, userId);
    cart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name price image stock visibility shippingClass weight dimensions",
    });

    // Set cookie for session tracking
    res.cookie("cartSession", sessionToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax",
    });

    res.json({
      success: true,
      data: cart,
      sessionToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to cart
 */
export const addToCart = async (req, res, next) => {
  try {
    const itemData = req.body;
    if (!itemData) {
      const error = new Error("Request body is missing");
      error.statusCode = 400;
      return next(error);
    }

    const { productId, quantity = 1, variationId, customizations = {}, price: priceOverride } = itemData;

    if (!productId) {
      const error = new Error("Product ID is required");
      error.statusCode = 400;
      return next(error);
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const error = new Error("Invalid Product ID");
      error.statusCode = 400;
      return next(error);
    }

    // Get session token
    let sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    if (!sessionToken) {
      sessionToken = Cart.generateSessionToken();
    }

    const userId = req.user?.id;

    // Find or create cart
    const cart = await Cart.findOrCreateBySession(sessionToken, userId);

    // Fetch product details
    const product = await Product.findById(productId);
    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      return next(error);
    }

    let price = (priceOverride !== undefined && priceOverride !== null) ? Number(priceOverride) : product.price;
    let name = product.name;
    let image = product.image;

    // Handle Variable Product
    if (variationId) {
      const variation = product.variations.find(v => v.sku === variationId);
      if (!variation) {
        const error = new Error("Invalid variation");
        error.statusCode = 400;
        return next(error);
      }

      price = variation.price;
      // Append attributes to name
      let attrValues = [];
      if (variation.attributes instanceof Map) {
        attrValues = Array.from(variation.attributes.values());
      } else if (variation.attributes && typeof variation.attributes === 'object') {
        attrValues = Object.values(variation.attributes);
      }

      const attrString = attrValues.join(" / ");
      name = `${product.name} - ${attrString}`;
      if (variation.image) image = variation.image;

      // Check variation stock if needed
      // if (variation.stock < quantity) ...
    }

    // --- FLASH SALE CHECK ---
    const now = new Date();
    const activeFlashSale = await FlashSale.findOne({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      "products.product": productId
    });

    if (activeFlashSale) {
      const saleProduct = activeFlashSale.products.find(
        (p) => p.product.toString() === productId.toString()
      );

      if (saleProduct) {
        // Enforce Flash Sale Stock Limit (null or undefined means unlimited)
        const limit = saleProduct.stockLimit;
        const hasLimit = limit !== null && limit !== undefined;

        if (hasLimit) {
          const limitVal = Number(limit);
          const soldVal = Number(saleProduct.soldCount || 0);
          const remaining = Math.max(0, limitVal - soldVal);

          // Check if already in cart to see total requested
          const existingCartItem = cart.items.find(item => item.product.toString() === productId.toString());
          const alreadyInCartQuery = existingCartItem ? existingCartItem.quantity : 0;

          if (quantity + alreadyInCartQuery > remaining) {
            const error = new Error(`Flash sale limit reached. Only ${remaining} items allowed (You have ${alreadyInCartQuery} in cart).`);
            error.statusCode = 400;
            return next(error);
          }
        }

        // Use Flash Sale Price (ensure it's a valid number)
        if (saleProduct.flashSalePrice !== undefined && saleProduct.flashSalePrice !== null) {
          price = Number(saleProduct.flashSalePrice);
          logger.info({ productId, price }, "Applying flash sale price to cart item");
        }
      }
    }
    // ------------------------

    // Add item to cart
    await cart.addItem({
      product: productId,
      quantity,
      price,
      variationId,
      productName: name,
      productImage: image,
      customizations: customizations || {},
    });

    // Reload cart with populated products
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name price image stock visibility",
    });

    // Set cookie
    res.cookie("cartSession", sessionToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    logger.info({ productId, quantity }, "Item added to cart");

    res.json({
      success: true,
      message: "Item added to cart",
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update item quantity in cart
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      const error = new Error("Product ID and quantity are required");
      error.statusCode = 400;
      return next(error);
    }

    const sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    if (!sessionToken) {
      const error = new Error("Cart session not found");
      error.statusCode = 404;
      return next(error);
    }

    const cart = await Cart.findOne({ sessionToken });
    if (!cart) {
      const error = new Error("Cart not found");
      error.statusCode = 404;
      return next(error);
    }

    // If quantity > 0, check stock
    if (quantity > 0) {
      const product = await Product.findById(productId);
      if (product && product.stock < quantity) {
        const error = new Error(`Only ${product.stock} items available in stock`);
        error.statusCode = 400;
        return next(error);
      }

      // --- FLASH SALE CHECK FOR UPDATE ---
      const now = new Date();
      const activeFlashSale = await FlashSale.findOne({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        "products.product": productId
      });

      if (activeFlashSale) {
        const saleProduct = activeFlashSale.products.find(
          (p) => p.product.toString() === productId.toString()
        );

        if (saleProduct) {
          const hasLimit = saleProduct.stockLimit !== null && saleProduct.stockLimit !== undefined;
          if (hasLimit) {
            const limit = Number(saleProduct.stockLimit);
            const sold = Number(saleProduct.soldCount || 0);
            const remaining = limit - sold;
            if (quantity > remaining) {
              const error = new Error(`Flash sale limit reached. Only ${remaining} items allowed.`);
              error.statusCode = 400;
              return next(error);
            }
          }

          // Also update the price in case it changed or was added before sale
          if (saleProduct.flashSalePrice !== undefined && saleProduct.flashSalePrice !== null) {
            const item = cart.items.find((it) => it.product.toString() === productId.toString());
            if (item) {
              item.price = Number(saleProduct.flashSalePrice);
              logger.info({ productId, price: item.price }, "Updating flash sale price during cart update");
            }
          }
        }
      }
      // ------------------------------------
    }

    await cart.updateItemQuantity(productId, quantity);

    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name price image stock visibility",
    });

    res.json({
      success: true,
      message: "Cart updated",
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    if (!sessionToken) {
      const error = new Error("Cart session not found");
      error.statusCode = 404;
      return next(error);
    }

    const cart = await Cart.findOne({ sessionToken });
    if (!cart) {
      const error = new Error("Cart not found");
      error.statusCode = 404;
      return next(error);
    }

    await cart.removeItem(productId);

    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name price image stock visibility",
    });

    res.json({
      success: true,
      message: "Item removed from cart",
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear entire cart
 */
export const clearCart = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    if (!sessionToken) {
      // No session = already cleared
      return res.json({ success: true, message: "Cart cleared (no session)" });
    }

    const cart = await Cart.findOne({ sessionToken });
    if (!cart) {
      // No cart = already cleared
      return res.json({ success: true, message: "Cart cleared (no cart found)" });
    }

    await cart.clearCart();

    res.json({
      success: true,
      message: "Cart cleared",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Apply coupon to cart
 */
export const applyCoupon = async (req, res, next) => {
  try {
    const { couponCode } = req.body;

    if (!couponCode) {
      const error = new Error("Coupon code is required");
      error.statusCode = 400;
      return next(error);
    }

    const sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    if (!sessionToken) {
      const error = new Error("Cart session not found");
      error.statusCode = 404;
      return next(error);
    }

    const cart = await Cart.findOne({ sessionToken });
    if (!cart) {
      const error = new Error("Cart not found");
      error.statusCode = 404;
      return next(error);
    }

    if (cart.items.length === 0) {
      const error = new Error("Cart is empty");
      error.statusCode = 400;
      return next(error);
    }

    // Import Coupon model here to avoid circular dependency
    const Coupon = (await import("../models/Coupon.js")).default;

    // Find and validate coupon
    const coupon = await Coupon.findValidCoupon(couponCode);

    // Check minimum spend
    if (coupon.minSpend && cart.totals.subtotal < coupon.minSpend) {
      const error = new Error(`Minimum spend of ${coupon.minSpend} required`);
      error.statusCode = 400;
      return next(error);
    }

    // Check user eligibility
    const userId = req.user?.id;
    const userEmail = req.user?.email || cart.user?.email;

    if (userId || userEmail) {
      const eligibility = coupon.canUserUse(userId, userEmail);
      if (!eligibility.canUse) {
        const error = new Error(eligibility.reason);
        error.statusCode = 400;
        return next(error);
      }
    }

    // Apply coupon
    await cart.applyCoupon(coupon);

    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name price image stock visibility",
    });

    res.json({
      success: true,
      message: "Coupon applied successfully",
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove coupon from cart
 */
export const removeCoupon = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    if (!sessionToken) {
      const error = new Error("Cart session not found");
      error.statusCode = 404;
      return next(error);
    }

    const cart = await Cart.findOne({ sessionToken });
    if (!cart) {
      const error = new Error("Cart not found");
      error.statusCode = 404;
      return next(error);
    }

    await cart.removeCoupon();

    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name price image stock visibility",
    });

    res.json({
      success: true,
      message: "Coupon removed",
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Merge guest cart with user cart on login
 */
export const mergeCarts = async (req, res, next) => {
  try {
    const { guestSessionToken } = req.body;
    const userId = req.user.id;

    if (!guestSessionToken) {
      return res.json({
        success: true,
        message: "No guest cart to merge",
      });
    }

    const guestCart = await Cart.findOne({ sessionToken: guestSessionToken });
    const userCart = await Cart.findOne({ user: userId });

    if (!guestCart) {
      return res.json({
        success: true,
        message: "No guest cart found",
      });
    }

    const mergedCart = await Cart.mergeCarts(guestCart, userCart);

    // Generate new session token for merged cart
    const newSessionToken = Cart.generateSessionToken();
    mergedCart.sessionToken = newSessionToken;
    await mergedCart.save();

    const populatedCart = await Cart.findById(mergedCart._id).populate({
      path: "items.product",
      select: "name price image stock visibility",
    });

    res.cookie("cartSession", newSessionToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.json({
      success: true,
      message: "Carts merged successfully",
      data: populatedCart,
      sessionToken: newSessionToken,
    });
  } catch (error) {
    next(error);
  }
};
