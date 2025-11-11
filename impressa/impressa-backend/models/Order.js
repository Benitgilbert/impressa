import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  addressLine1: { type: String, required: true },
  addressLine2: String,
  city: { type: String, required: true },
  state: String,
  postalCode: String,
  country: { type: String, default: "Rwanda" },
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: String, // Store at order time
  productImage: String,
  sku: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
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

const orderNoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  authorName: String,
  isCustomerVisible: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema(
  {
    publicId: { 
      type: String, 
      index: true, 
      unique: true, 
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    guestInfo: {
      name: String,
      email: String,
      phone: String,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [arr => arr.length > 0, "Order must have at least one item"],
    },
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    sameAsShipping: { type: Boolean, default: true },
    totals: {
      subtotal: { type: Number, required: true, default: 0 },
      shipping: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true, default: 0 },
    },
    couponCode: String,
    discountAmount: { type: Number, default: 0 },
    payment: {
      method: {
        type: String,
        enum: ["cash", "stripe", "paypal", "mtn_momo", "airtel_money", "pending"],
        default: "pending",
      },
      status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,
      paidAt: Date,
    },
    shipping: {
      method: String,
      cost: { type: Number, default: 0 },
      trackingNumber: String,
      carrier: String,
      shippedAt: Date,
      deliveredAt: Date,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "payment_pending",
        "payment_failed",
        "confirmed",
        "processing",
        "in-production",
        "ready",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },
    notes: [orderNoteSchema],
    // For backward compatibility (single product orders)
    legacy: {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number,
      customText: String,
      customFile: String,
      cloudLink: String,
      cloudPassword: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate totals
orderSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    // Calculate subtotal from items
    const subtotal = this.items.reduce((sum, item) => {
      item.subtotal = item.price * item.quantity;
      return sum + item.subtotal;
    }, 0);
    
    this.totals.subtotal = subtotal;
    
    // Calculate grand total
    this.totals.grandTotal = 
      this.totals.subtotal + 
      this.totals.shipping + 
      this.totals.tax - 
      this.totals.discount;
  }
  
  next();
});

// Indexes for performance
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ "guestInfo.email": 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "payment.status": 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
