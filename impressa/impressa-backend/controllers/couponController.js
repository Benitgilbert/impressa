import Coupon from "../models/Coupon.js";

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

    const coupons = await Coupon.find(filter)
      .populate("applicableCategories", "name slug")
      .populate("applicableProducts", "name price")
      .sort({ createdAt: -1 });

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

    const coupon = await Coupon.findById(id)
      .populate("applicableCategories", "name slug")
      .populate("applicableProducts", "name price");

    if (!coupon) {
      const error = new Error("Coupon not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      success: true,
      data: coupon,
    });
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

    const coupon = await Coupon.findValidCoupon(code);

    // Check minimum spend
    if (coupon.minSpend && subtotal < coupon.minSpend) {
      return res.json({
        success: false,
        valid: false,
        reason: `Minimum spend of ${coupon.minSpend} required`,
      });
    }

    // Check user eligibility
    if (userId || userEmail) {
      const eligibility = coupon.canUserUse(userId, userEmail);
      if (!eligibility.canUse) {
        return res.json({
          success: false,
          valid: false,
          reason: eligibility.reason,
        });
      }
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(subtotal);

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
    const coupon = await Coupon.create(req.body);

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

    const coupon = await Coupon.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      const error = new Error("Coupon not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete coupon (admin)
 */
export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      const error = new Error("Coupon not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get coupon usage statistics (admin)
 */
export const getCouponStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      const error = new Error("Coupon not found");
      error.statusCode = 404;
      return next(error);
    }

    const stats = {
      code: coupon.code,
      usageCount: coupon.usageCount,
      usageLimit: coupon.usageLimit,
      remainingUses: coupon.usageLimit ? coupon.usageLimit - coupon.usageCount : "unlimited",
      uniqueUsers: coupon.usedBy.length,
      isActive: coupon.isActive,
      isExpired: new Date() > coupon.expiresAt,
      totalDiscount: 0, // Would need to calculate from orders
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
