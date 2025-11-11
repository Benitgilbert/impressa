import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import Product from "../models/Product.js";
import crypto from "crypto";
import logger from "../config/logger.js";

/**
 * Create order from cart (checkout)
 */
export const createOrderFromCart = async (req, res, next) => {
  try {
    const {
      shippingAddress,
      billingAddress,
      sameAsShipping = true,
      paymentMethod = "pending",
      shippingMethod,
    } = req.body;

    // Validate addresses
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine1) {
      const error = new Error("Shipping address is required");
      error.statusCode = 400;
      return next(error);
    }

    // Get cart
    const sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    if (!sessionToken) {
      const error = new Error("Cart session not found");
      error.statusCode = 404;
      return next(error);
    }

    const cart = await Cart.findOne({ sessionToken }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      const error = new Error("Cart is empty");
      error.statusCode = 400;
      return next(error);
    }

    // Validate stock availability
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        const error = new Error(`Product ${item.product.name} not found`);
        error.statusCode = 404;
        return next(error);
      }

      if (product.visibility !== "public") {
        const error = new Error(`Product ${item.product.name} is not available`);
        error.statusCode = 400;
        return next(error);
      }

      if (product.stock < item.quantity) {
        const error = new Error(`Insufficient stock for ${product.name}. Only ${product.stock} available`);
        error.statusCode = 400;
        return next(error);
      }
    }

    // Build order items
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      productName: item.product.name,
      productImage: item.product.image,
      sku: item.product.sku,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      customizations: item.customizations,
    }));

    // Generate public order ID
    const publicId = crypto.randomBytes(6).toString("hex").toUpperCase();

    // Create order
    const orderData = {
      publicId,
      customer: req.user?._id,
      guestInfo: req.user
        ? undefined
        : {
            name: shippingAddress.fullName,
            email: shippingAddress.email,
            phone: shippingAddress.phone,
          },
      items: orderItems,
      shippingAddress,
      billingAddress: sameAsShipping ? shippingAddress : billingAddress,
      sameAsShipping,
      totals: {
        subtotal: cart.totals.subtotal,
        shipping: cart.totals.shipping || 0,
        tax: cart.totals.tax || 0,
        discount: cart.totals.discount || 0,
        grandTotal: cart.totals.total,
      },
      couponCode: cart.couponCode,
      discountAmount: cart.discountAmount,
      payment: {
        method: paymentMethod,
        status: "pending",
      },
      shipping: {
        method: shippingMethod || "standard",
        cost: cart.totals.shipping || 0,
      },
      status: "pending",
    };

    const order = await Order.create(orderData);

    // Update coupon usage if applied
    if (cart.couponCode) {
      try {
        const coupon = await Coupon.findOne({ code: cart.couponCode });
        if (coupon) {
          coupon.usageCount += 1;
          coupon.usedBy.push({
            user: req.user?._id,
            email: req.user?.email || shippingAddress.email,
            orderId: order._id,
          });
          await coupon.save();
        }
      } catch (error) {
        logger.error({ err: error }, "Failed to update coupon usage");
      }
    }

    // Deduct stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity, salesCount: item.quantity },
      });
    }

    // Clear cart
    await cart.clearCart();

    logger.info({ orderId: order._id, publicId }, "Order created from cart");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order._id,
        publicId: order.publicId,
        total: order.totals.grandTotal,
        status: order.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate shipping cost (placeholder - implement actual logic later)
 */
export const calculateShipping = async (req, res, next) => {
  try {
    const { address, items } = req.body;

    // Placeholder logic - in real implementation:
    // - Calculate based on address (zone)
    // - Calculate based on weight/dimensions
    // - Integrate with carrier APIs

    let shippingCost = 0;

    // Simple example: flat rate for now
    if (address?.country === "Rwanda") {
      shippingCost = address.city === "Kigali" ? 2000 : 5000; // RWF
    } else {
      shippingCost = 15000; // International
    }

    res.json({
      success: true,
      data: {
        cost: shippingCost,
        currency: "RWF",
        estimatedDays: address?.country === "Rwanda" ? "2-3" : "7-14",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate tax (placeholder - implement actual logic later)
 */
export const calculateTax = async (req, res, next) => {
  try {
    const { subtotal, address } = req.body;

    // Placeholder logic - in real implementation:
    // - Tax rates by country/region
    // - Tax classes per product
    // - Integration with tax services (TaxJar, Avalara)

    let taxRate = 0;
    let taxAmount = 0;

    // Simple example: Rwanda VAT
    if (address?.country === "Rwanda") {
      taxRate = 0.18; // 18% VAT
      taxAmount = subtotal * taxRate;
    }

    res.json({
      success: true,
      data: {
        taxRate,
        taxAmount,
        currency: "RWF",
      },
    });
  } catch (error) {
    next(error);
  }
};
