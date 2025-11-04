import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  customText: String,
  customFile: String, // image or PDF filename
  cloudLink: String,
  cloudPassword: String,
  status: {
    type: String,
    enum: ["pending", "approved", "in-production", "ready", "delivered", "cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);

export default Order;