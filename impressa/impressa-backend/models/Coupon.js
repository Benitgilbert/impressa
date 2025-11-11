import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: 200,
    },
    type: {
      type: String,
      required: true,
      enum: ["fixed", "percentage", "free_shipping"],
      default: "fixed",
    },
    value: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Value cannot be negative"],
    },
    minSpend: {
      type: Number,
      default: 0,
      min: [0, "Minimum spend cannot be negative"],
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, "Per user limit must be at least 1"],
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    applicableCategories: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
      default: [],
    },
    applicableProducts: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      default: [],
    },
    excludedCategories: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
      default: [],
    },
    excludedProducts: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      default: [],
    },
    // Usage tracking per user
    usedBy: {
      type: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        email: String,
        usedAt: { type: Date, default: Date.now },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Validate percentage value
couponSchema.pre("save", function (next) {
  if (this.type === "percentage" && this.value > 100) {
    return next(new Error("Percentage discount cannot exceed 100%"));
  }
  
  if (this.expiresAt <= this.validFrom) {
    return next(new Error("Expiration date must be after valid from date"));
  }
  
  next();
});

// Method to check if coupon is valid
couponSchema.methods.isValid = function () {
  const now = new Date();
  
  if (!this.isActive) {
    return { valid: false, reason: "Coupon is inactive" };
  }
  
  if (now < this.validFrom) {
    return { valid: false, reason: "Coupon is not yet valid" };
  }
  
  if (now > this.expiresAt) {
    return { valid: false, reason: "Coupon has expired" };
  }
  
  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    return { valid: false, reason: "Coupon usage limit reached" };
  }
  
  return { valid: true };
};

// Method to check if user can use coupon
couponSchema.methods.canUserUse = function (userId, userEmail) {
  const userUsage = this.usedBy.filter(
    (usage) => 
      (userId && usage.user && usage.user.equals(userId)) || 
      (userEmail && usage.email === userEmail)
  );
  
  if (userUsage.length >= this.perUserLimit) {
    return { 
      canUse: false, 
      reason: `You have already used this coupon ${this.perUserLimit} time(s)` 
    };
  }
  
  return { canUse: true };
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function (subtotal, items = []) {
  // Check if coupon is applicable to items
  if (this.applicableProducts.length > 0 || this.applicableCategories.length > 0) {
    // Filter applicable items (implementation depends on item structure)
    // For now, assume all items are applicable
  }
  
  let discount = 0;
  
  if (this.type === "fixed") {
    discount = this.value;
  } else if (this.type === "percentage") {
    discount = (subtotal * this.value) / 100;
    
    // Apply max discount if set
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else if (this.type === "free_shipping") {
    // Shipping discount handled separately
    discount = 0;
  }
  
  // Discount cannot exceed subtotal
  if (discount > subtotal) {
    discount = subtotal;
  }
  
  return discount;
};

// Static method to find valid coupon by code
couponSchema.statics.findValidCoupon = async function (code) {
  const coupon = await this.findOne({ 
    code: code.toUpperCase(),
    isActive: true,
  });
  
  if (!coupon) {
    throw new Error("Coupon not found");
  }
  
  const validation = coupon.isValid();
  if (!validation.valid) {
    throw new Error(validation.reason);
  }
  
  return coupon;
};

// Indexes
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ expiresAt: 1 });
couponSchema.index({ validFrom: 1, expiresAt: 1, isActive: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
