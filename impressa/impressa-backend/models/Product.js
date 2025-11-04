import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    default: 0,
  },
  image: {
    type: String, // filename or URL
    default: null,
  },
  customizable: {
    type: Boolean,
    default: false,
  },
  customizationOptions: {
    type: [String], // e.g., ["text", "image", "pdf", "cloud"]
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model("Product", productSchema);

export default Product;