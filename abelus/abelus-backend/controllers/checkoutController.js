import prisma from "../prisma.js";
import crypto from "crypto";
import logger from "../config/logger.js";

const calculateCartTotals = (cart, discountAmount = 0) => {
  let subtotal = 0;
  cart.items.forEach(item => {
    let price = 0;
    if (item.product) {
      price = item.product.price;
      if (item.variationId && item.product.variations) {
        const variation = item.product.variations.find(v => v.id === item.variationId || v.sku === item.variationId);
        if (variation) price = variation.price;
      }
    }
    subtotal += price * item.quantity;
  });
  
  const tax = 0;
  const shipping = 0;
  const total = Math.max(0, subtotal - discountAmount + tax + shipping);
  
  return { subtotal, discount: discountAmount, tax, shipping, total };
};

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
      couponCode // Pass it explicitly since it's not saved to Cart in Postgres anymore
    } = req.body;

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine1) {
      const error = new Error("Shipping address is required");
      error.statusCode = 400;
      return next(error);
    }

    const sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    const userId = req.user?.id;
    
    let cart = null;
    if (userId) {
        cart = await prisma.cart.findUnique({ 
            where: { userId }, 
            include: { items: { include: { product: { include: { variations: true } } } } } 
        });
    }
    if (!cart && sessionToken) {
        const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(sessionToken);
        if (isUUID) {
            cart = await prisma.cart.findUnique({ 
                where: { id: sessionToken }, 
                include: { items: { include: { product: { include: { variations: true } } } } } 
            });
        }
    }

    if (!cart || cart.items.length === 0) {
      const error = new Error("Cart is empty");
      error.statusCode = 400;
      return next(error);
    }

    // Validate stock availability
    for (const item of cart.items) {
      const product = item.product;
      if (!product) {
        const error = new Error(`Product not found`);
        error.statusCode = 404;
        return next(error);
      }

      if (product.visibility !== "public") {
        const error = new Error(`Product ${product.name} is not available`);
        error.statusCode = 400;
        return next(error);
      }

      if (product.stock < item.quantity) {
        const error = new Error(`Insufficient stock for ${product.name}. Only ${product.stock} available`);
        error.statusCode = 400;
        return next(error);
      }
    }

    // Validate Coupon
    let discountAmount = 0;
    let validCouponCode = null;
    
    if (couponCode) {
        const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
        if (coupon && coupon.isActive && new Date() <= new Date(coupon.expiresAt)) {
            let tempSubtotal = 0;
            cart.items.forEach(i => {
                let price = i.product?.price || 0;
                tempSubtotal += price * i.quantity;
            });
            
            if (!coupon.minSpend || tempSubtotal >= coupon.minSpend) {
                if (coupon.type === "fixed") {
                    discountAmount = coupon.value;
                } else if (coupon.type === "percentage") {
                    discountAmount = tempSubtotal * (coupon.value / 100);
                    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) discountAmount = coupon.maxDiscount;
                }
                validCouponCode = coupon.code;
            }
        }
    }

    const totals = calculateCartTotals(cart, discountAmount);

    const orderItems = cart.items.map((item) => {
      let price = item.product.price;
      if (item.variationId && item.product.variations) {
          const variation = item.product.variations.find(v => v.id === item.variationId || v.sku === item.variationId);
          if (variation) price = variation.price;
      }
      return {
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.image,
        sku: item.product.sku,
        quantity: item.quantity,
        price: price,
        subtotal: price * item.quantity,
        customizations: item.customizations || {},
      };
    });

    const publicId = crypto.randomBytes(4).toString("hex").toUpperCase();

    const orderData = {
      publicId,
      customerId: userId || null,
      guestInfo: userId ? null : { name: shippingAddress.fullName, email: shippingAddress.email, phone: shippingAddress.phone },
      shippingAddress,
      billingAddress: sameAsShipping ? shippingAddress : billingAddress,
      
      subtotal: totals.subtotal,
      shippingCost: totals.shipping || 0,
      tax: totals.tax || 0,
      discount: totals.discount || 0,
      grandTotal: totals.total,
      
      paymentMethod,
      status: "pending",
      
      items: {
          create: orderItems
      }
    };

    const order = await prisma.order.create({
      data: orderData,
      include: { items: true }
    });

    if (validCouponCode) {
      try {
        const coupon = await prisma.coupon.findUnique({ where: { code: validCouponCode } });
        if (coupon) {
            const usedByList = Array.isArray(coupon.usedBy) ? [...coupon.usedBy] : [];
            usedByList.push({
                user: userId || null,
                email: req.user?.email || shippingAddress.email,
                orderId: order.id
            });
            await prisma.coupon.update({
                where: { id: coupon.id },
                data: {
                    usageCount: { increment: 1 },
                    usedBy: usedByList
                }
            });
        }
      } catch (error) {
        logger.error({ err: error }, "Failed to update coupon usage");
      }
    }

    for (const item of cart.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
            stock: { decrement: item.quantity },
            salesCount: { increment: item.quantity }
        }
      });
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    logger.info({ orderId: order.id, publicId }, "Order created from cart");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.id,
        publicId: order.publicId,
        total: order.grandTotal,
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
    let shippingCost = 0;
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
    let taxRate = 0;
    let taxAmount = 0;
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
