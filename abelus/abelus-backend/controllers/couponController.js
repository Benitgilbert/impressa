import prisma from "../prisma.js";

// Helper functions (formerly in Mongoose Model)
const findValidCoupon = async (code) => {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) throw new Error("Coupon not found");
  if (!coupon.isActive) throw new Error("Coupon is not active");
  
  const now = new Date();
  if (now < new Date(coupon.validFrom)) throw new Error("Coupon is not valid yet");
  if (now > new Date(coupon.expiresAt)) throw new Error("Coupon has expired");
  
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    throw new Error("Coupon usage limit reached");
  }
  return coupon;
};

const canUserUse = (coupon, userId, userEmail) => {
  const usageHistory = coupon.usedBy || [];
  let userUsageCount = 0;
  
  for (const usage of usageHistory) {
    if ((userId && usage.userId === userId) || (userEmail && usage.email === userEmail)) {
      userUsageCount++;
    }
  }
  
  if (userUsageCount >= coupon.perUserLimit) {
    return { canUse: false, reason: "You have reached the usage limit for this coupon" };
  }
  
  return { canUse: true };
};

const calculateDiscount = (coupon, subtotal) => {
  if (coupon.type === "fixed") {
    return coupon.value;
  } else if (coupon.type === "percentage") {
    let discount = subtotal * (coupon.value / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
    return discount;
  }
  return 0; // free_shipping might handle shipping cost instead
};

/**
 * Get all coupons (admin)
 */
export const getAllCoupons = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const coupons = await prisma.coupon.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single coupon by ID (admin)
 */
export const getCouponById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      const error = new Error("Coupon not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate coupon (public - for checkout)
 */
export const validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { subtotal, userId, userEmail } = req.body;

    const coupon = await findValidCoupon(code);

    if (coupon.minSpend && subtotal < coupon.minSpend) {
      return res.json({
        success: false,
        valid: false,
        reason: `Minimum spend of ${coupon.minSpend} required`,
      });
    }

    if (userId || userEmail) {
      const eligibility = canUserUse(coupon, userId, userEmail);
      if (!eligibility.canUse) {
        return res.json({
          success: false,
          valid: false,
          reason: eligibility.reason,
        });
      }
    }

    const discount = calculateDiscount(coupon, subtotal);

    res.json({
      success: true,
      valid: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
        description: coupon.description,
      },
    });
  } catch (error) {
    res.json({
      success: false,
      valid: false,
      reason: error.message,
    });
  }
};

/**
 * Create coupon (admin)
 */
export const createCoupon = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.validFrom) data.validFrom = new Date(data.validFrom);
    if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);
    if (data.value) data.value = Number(data.value);
    if (data.minSpend) data.minSpend = Number(data.minSpend);
    if (data.maxDiscount) data.maxDiscount = Number(data.maxDiscount);
    if (data.usageLimit) data.usageLimit = Number(data.usageLimit);
    if (data.perUserLimit) data.perUserLimit = Number(data.perUserLimit);
    
    // Remove unsupported relations if any were passed
    delete data.applicableCategories;
    delete data.applicableProducts;

    const coupon = await prisma.coupon.create({ data });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update coupon (admin)
 */
export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.validFrom) data.validFrom = new Date(data.validFrom);
    if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);
    if (data.value) data.value = Number(data.value);
    if (data.minSpend) data.minSpend = Number(data.minSpend);
    if (data.maxDiscount) data.maxDiscount = Number(data.maxDiscount);
    if (data.usageLimit) data.usageLimit = Number(data.usageLimit);
    if (data.perUserLimit) data.perUserLimit = Number(data.perUserLimit);

    delete data.applicableCategories;
    delete data.applicableProducts;

    const coupon = await prisma.coupon.update({
      where: { id },
      data
    });

    res.json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const err = new Error("Coupon not found");
      err.statusCode = 404;
      return next(err);
    }
    next(error);
  }
};

/**
 * Delete coupon (admin)
 */
export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });

    res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const err = new Error("Coupon not found");
      err.statusCode = 404;
      return next(err);
    }
    next(error);
  }
};

/**
 * Get coupon usage statistics (admin)
 */
export const getCouponStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      const error = new Error("Coupon not found");
      error.statusCode = 404;
      return next(error);
    }

    const uniqueUsers = Array.isArray(coupon.usedBy) ? coupon.usedBy.length : 0;

    const stats = {
      code: coupon.code,
      usageCount: coupon.usageCount,
      usageLimit: coupon.usageLimit,
      remainingUses: coupon.usageLimit ? coupon.usageLimit - coupon.usageCount : "unlimited",
      uniqueUsers,
      isActive: coupon.isActive,
      isExpired: new Date() > new Date(coupon.expiresAt),
      totalDiscount: 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
