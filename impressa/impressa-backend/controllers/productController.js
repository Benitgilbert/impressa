import Product from "../models/Product.js";

// Create product (admin only)
export const createProduct = async (req, res) => {
  try {
    const body = { ...req.body };
    // Coerce booleans and arrays if coming from multipart/form-data
    if (typeof body.customizable === "string") body.customizable = body.customizable === "true";
    if (typeof body.customizationOptions === "string") {
      try { body.customizationOptions = JSON.parse(body.customizationOptions); } catch { body.customizationOptions = []; }
    }
    if (req.file) {
      body.image = `/uploads/${req.file.filename}`;
    }
    if (typeof body.price === "string") body.price = Number(body.price);
    if (typeof body.stock === "string") body.stock = Number(body.stock);
    const product = new Product(body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all products (public)
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update product (admin only)
export const updateProduct = async (req, res) => {
  try {
    const body = { ...req.body };
    if (typeof body.customizable === "string") body.customizable = body.customizable === "true";
    if (typeof body.customizationOptions === "string") {
      try { body.customizationOptions = JSON.parse(body.customizationOptions); } catch { body.customizationOptions = []; }
    }
    if (req.file) {
      body.image = `/uploads/${req.file.filename}`;
    }
    if (typeof body.price === "string") body.price = Number(body.price);
    if (typeof body.stock === "string") body.stock = Number(body.stock);
    const product = await Product.findByIdAndUpdate(req.params.id, body, {
      new: true,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete product (admin only)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};