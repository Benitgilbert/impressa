import prisma from "../prisma.js";
import logger from "../config/logger.js";

const formatCartResponse = (cart, couponCode = null, discountAmount = 0) => {
  if (!cart) return null;

  let subtotal = 0;
  const items = cart.items.map(item => {
    let price = 0;
    if (item.product) {
        price = item.product.price;
        // Check variations if applicable
        if (item.variationId && item.product.variations) {
            const variation = item.product.variations.find(v => v.id === item.variationId || v.sku === item.variationId);
            if (variation) price = variation.price;
        }
    }
    const itemSubtotal = price * item.quantity;
    subtotal += itemSubtotal;
    return {
      ...item,
      price,
      subtotal: itemSubtotal
    };
  });

  const tax = 0; 
  const shipping = 0;
  const total = Math.max(0, subtotal - discountAmount + tax + shipping);

  return {
    ...cart,
    items,
    totals: {
      subtotal,
      discount: discountAmount,
      tax,
      shipping,
      total
    },
    couponCode,
    discountAmount
  };
};

const findOrCreateCart = async (sessionToken, userId) => {
    let cart = null;
    if (userId) {
        cart = await prisma.cart.findUnique({ where: { userId } });
    }
    if (!cart && sessionToken) {
        // Find by session token (which is the cart id for guests)
        // Ensure sessionToken is a valid UUID
        const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(sessionToken);
        if (isUUID) {
            cart = await prisma.cart.findUnique({ where: { id: sessionToken } });
        }
    }

    if (!cart) {
        cart = await prisma.cart.create({
            data: userId ? { userId } : {}
        });
    } else if (userId && !cart.userId) {
        // Associate guest cart to user
        cart = await prisma.cart.update({
            where: { id: cart.id },
            data: { userId }
        });
    }
    return cart;
};

const getCartPopulated = async (cartId) => {
    return prisma.cart.findUnique({
        where: { id: cartId },
        include: {
            items: {
                include: {
                    product: {
                        select: { id: true, name: true, price: true, image: true, stock: true, visibility: true, weight: true }
                    }
                }
            }
        }
    });
};

export const getCart = async (req, res, next) => {
  try {
    let sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    const userId = req.user?.id;

    const cart = await findOrCreateCart(sessionToken, userId);
    sessionToken = userId ? sessionToken : cart.id;

    const populatedCart = await getCartPopulated(cart.id);

    res.cookie("cartSession", sessionToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.json({
      success: true,
      data: formatCartResponse(populatedCart),
      sessionToken,
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, variationId, customizations = {} } = req.body;

    if (!productId) {
      const error = new Error("Product ID is required");
      error.statusCode = 400;
      return next(error);
    }

    let sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    const userId = req.user?.id;

    const cart = await findOrCreateCart(sessionToken, userId);
    sessionToken = userId ? sessionToken : cart.id;

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { variations: true }
    });

    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      return next(error);
    }

    // Flash sale checks
    const now = new Date();
    const activeFlashSale = await prisma.flashSale.findFirst({
        where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
            products: { some: { productId } }
        },
        include: { products: true }
    });

    if (activeFlashSale) {
        const saleProduct = activeFlashSale.products.find(p => p.productId === productId);
        if (saleProduct && saleProduct.stockLimit !== null) {
            const remaining = Math.max(0, saleProduct.stockLimit - saleProduct.soldCount);
            
            // Get current quantity in cart
            const currentItem = await prisma.cartItem.findFirst({
                where: { cartId: cart.id, productId }
            });
            const inCart = currentItem ? currentItem.quantity : 0;

            if (quantity + inCart > remaining) {
                const error = new Error(`Flash sale limit reached. Only ${remaining} items allowed (You have ${inCart} in cart).`);
                error.statusCode = 400;
                return next(error);
            }
        }
    }

    // Upsert cart item
    const existingItem = await prisma.cartItem.findFirst({
        where: {
            cartId: cart.id,
            productId,
            ...(variationId ? { variationId } : {}),
            // Customizations comparison can be tricky with JSON in Prisma depending on how it's saved. 
            // We do a simple findFirst, then update it. If customizations differ, we should probably add a new item, but to keep it simple:
        }
    });

    // To handle customization equality, let's pull items and check in JS
    const allItems = await prisma.cartItem.findMany({ where: { cartId: cart.id, productId } });
    const exactMatch = allItems.find(i => 
        i.variationId === variationId && 
        JSON.stringify(i.customizations) === JSON.stringify(customizations || {})
    );

    if (exactMatch) {
        await prisma.cartItem.update({
            where: { id: exactMatch.id },
            data: { quantity: exactMatch.quantity + quantity }
        });
    } else {
        await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId,
                quantity,
                variationId,
                customizations: customizations || {}
            }
        });
    }

    const updatedCart = await getCartPopulated(cart.id);

    res.cookie("cartSession", sessionToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    logger.info({ productId, quantity }, "Item added to cart");

    res.json({
      success: true,
      message: "Item added to cart",
      data: formatCartResponse(updatedCart),
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      const error = new Error("Product ID and quantity are required");
      error.statusCode = 400;
      return next(error);
    }

    const sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    const userId = req.user?.id;
    const cart = await findOrCreateCart(sessionToken, userId);

    if (quantity > 0) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (product && product.stock < quantity) {
        const error = new Error(`Only ${product.stock} items available in stock`);
        error.statusCode = 400;
        return next(error);
      }

      // Flash sale check
      const now = new Date();
      const activeFlashSale = await prisma.flashSale.findFirst({
        where: { isActive: true, startDate: { lte: now }, endDate: { gte: now }, products: { some: { productId } } },
        include: { products: true }
      });

      if (activeFlashSale) {
        const saleProduct = activeFlashSale.products.find(p => p.productId === productId);
        if (saleProduct && saleProduct.stockLimit !== null) {
          const remaining = saleProduct.stockLimit - saleProduct.soldCount;
          if (quantity > remaining) {
            const error = new Error(`Flash sale limit reached. Only ${remaining} items allowed.`);
            error.statusCode = 400;
            return next(error);
          }
        }
      }
    }

    const items = await prisma.cartItem.findMany({ where: { cartId: cart.id, productId } });
    if (items.length > 0) {
        if (quantity <= 0) {
            await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
        } else {
            // Update the first matching product item
            await prisma.cartItem.update({
                where: { id: items[0].id },
                data: { quantity }
            });
        }
    }

    const updatedCart = await getCartPopulated(cart.id);

    res.json({
      success: true,
      message: "Cart updated",
      data: formatCartResponse(updatedCart),
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    const userId = req.user?.id;
    const cart = await findOrCreateCart(sessionToken, userId);

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });

    const updatedCart = await getCartPopulated(cart.id);

    res.json({
      success: true,
      message: "Item removed from cart",
      data: formatCartResponse(updatedCart),
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    const userId = req.user?.id;

    if (!sessionToken && !userId) {
      return res.json({ success: true, message: "Cart cleared (no session)" });
    }

    const cart = await findOrCreateCart(sessionToken, userId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    const updatedCart = await getCartPopulated(cart.id);

    res.json({
      success: true,
      message: "Cart cleared",
      data: formatCartResponse(updatedCart),
    });
  } catch (error) {
    next(error);
  }
};

export const applyCoupon = async (req, res, next) => {
  try {
    const { couponCode } = req.body;
    if (!couponCode) {
      const error = new Error("Coupon code is required");
      error.statusCode = 400;
      return next(error);
    }

    const sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    const userId = req.user?.id;
    const cart = await findOrCreateCart(sessionToken, userId);
    const populatedCart = await getCartPopulated(cart.id);

    if (populatedCart.items.length === 0) {
      const error = new Error("Cart is empty");
      error.statusCode = 400;
      return next(error);
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon || !coupon.isActive || new Date() > new Date(coupon.expiresAt) || new Date() < new Date(coupon.validFrom)) {
        const error = new Error("Invalid or expired coupon");
        error.statusCode = 400;
        return next(error);
    }

    const cartResp = formatCartResponse(populatedCart);
    
    if (coupon.minSpend && cartResp.totals.subtotal < coupon.minSpend) {
      const error = new Error(`Minimum spend of ${coupon.minSpend} required`);
      error.statusCode = 400;
      return next(error);
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        const error = new Error("Coupon usage limit reached");
        error.statusCode = 400;
        return next(error);
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === "fixed") {
        discountAmount = coupon.value;
    } else if (coupon.type === "percentage") {
        discountAmount = cartResp.totals.subtotal * (coupon.value / 100);
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
        }
    }

    res.json({
      success: true,
      message: "Coupon applied successfully",
      data: formatCartResponse(populatedCart, coupon.code, discountAmount),
    });
  } catch (error) {
    next(error);
  }
};

export const removeCoupon = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.cartSession || req.headers["x-cart-session"];
    const userId = req.user?.id;
    const cart = await findOrCreateCart(sessionToken, userId);
    const populatedCart = await getCartPopulated(cart.id);

    res.json({
      success: true,
      message: "Coupon removed",
      data: formatCartResponse(populatedCart),
    });
  } catch (error) {
    next(error);
  }
};

export const mergeCarts = async (req, res, next) => {
  try {
    const { guestSessionToken } = req.body;
    const userId = req.user.id;

    if (!guestSessionToken) {
      return res.json({ success: true, message: "No guest cart to merge" });
    }

    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(guestSessionToken);
    if (!isUUID) {
        return res.json({ success: true, message: "Invalid guest session token" });
    }

    const guestCart = await prisma.cart.findUnique({ where: { id: guestSessionToken }, include: { items: true } });
    let userCart = await prisma.cart.findUnique({ where: { userId }, include: { items: true } });

    if (!userCart) {
        userCart = await prisma.cart.create({ data: { userId }, include: { items: true } });
    }

    if (guestCart && guestCart.id !== userCart.id) {
        for (const guestItem of guestCart.items) {
            const existingItem = userCart.items.find(i => 
                i.productId === guestItem.productId && 
                i.variationId === guestItem.variationId &&
                JSON.stringify(i.customizations) === JSON.stringify(guestItem.customizations)
            );

            if (existingItem) {
                await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: existingItem.quantity + guestItem.quantity }
                });
            } else {
                await prisma.cartItem.create({
                    data: {
                        cartId: userCart.id,
                        productId: guestItem.productId,
                        quantity: guestItem.quantity,
                        variationId: guestItem.variationId,
                        customizations: guestItem.customizations || {}
                    }
                });
            }
        }
        await prisma.cart.delete({ where: { id: guestCart.id } });
    }

    const populatedCart = await getCartPopulated(userCart.id);

    res.cookie("cartSession", userCart.id, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.json({
      success: true,
      message: "Carts merged successfully",
      data: formatCartResponse(populatedCart),
      sessionToken: userCart.id,
    });
  } catch (error) {
    next(error);
  }
};
