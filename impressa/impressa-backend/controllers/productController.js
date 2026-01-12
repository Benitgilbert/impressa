import Product from "../models/Product.js";
import Fuse from "fuse.js";
import { notifyProductAdded } from "./notificationController.js";

// Create product (seller only)
export const createProduct = async (req, res) => {
  try {
    const body = { ...req.body };

    // Assign seller from authenticated user
    body.seller = req.user.id;

    // Auto-approve if created by admin
    if (req.user.role === 'admin') {
      body.approvalStatus = 'approved';
      body.visibility = 'public';
    }

    // Parse JSON fields
    ["customizationOptions", "tags", "attributes", "variations", "crossSells", "upSells"].forEach(field => {
      if (typeof body[field] === "string") {
        try { body[field] = JSON.parse(body[field]); } catch { body[field] = []; }
      }
    });

    // Coerce booleans and numbers
    if (typeof body.customizable === "string") body.customizable = body.customizable === "true";
    if (typeof body.featured === "string") body.featured = body.featured === "true";
    if (typeof body.isDigital === "string") body.isDigital = body.isDigital === "true";
    if (typeof body.price === "string") body.price = Number(body.price);
    if (typeof body.stock === "string") body.stock = Number(body.stock);

    // Handle File Uploads
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.fieldname === "image") {
          body.image = file.path;
        } else if (file.fieldname.startsWith("variation_image_")) {
          const index = parseInt(file.fieldname.split("_")[2]);
          if (body.variations && body.variations[index]) {
            body.variations[index].image = file.path;
          }
        }
      });
    }

    const product = new Product(body);
    await product.save();

    // 🔔 Notify Admin
    try {
      if (req.user.role === 'seller') {
        notifyProductAdded(req.user.name, product.name);
      }
    } catch (e) { console.error("Notification failed", e); }

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get seller's own products
export const getSellerProducts = async (req, res) => {
  try {
    // Only fetch products belonging to the logged-in seller
    const products = await Product.find({ seller: req.user.id })
      .populate("seller", "name storeName")
      .sort({ createdAt: -1 });

    // Using a common response structure
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all products (public)
export const getAllProducts = async (req, res) => {
  try {
    const q = {};
    if (typeof req.query.featured !== 'undefined') q.featured = req.query.featured === 'true';
    if (req.query.tags) q.tags = { $in: req.query.tags.split(',') };
    // Filter by seller (optional)
    if (req.query.seller) q.seller = req.query.seller;

    // Category
    if (req.query.category) {
      q.category = req.query.category;
    }

    // Price Range
    if (req.query.minPrice || req.query.maxPrice) {
      q.price = {};
      if (req.query.minPrice) q.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) q.price.$lte = Number(req.query.maxPrice);
    }

    let products = await Product.find(q).populate("seller", "name storeName");

    // Fuzzy Search with Fuse.js if search query is present
    if (req.query.search) {
      const fuse = new Fuse(products, {
        keys: ["name", "description", "tags"],
        threshold: 0.4, // Adjust for fuzziness (0.0 exact, 1.0 matches anything)
        includeScore: true
      });
      const results = fuse.search(req.query.search);
      products = results.map(r => r.item);
    }

    const limit = Math.min(parseInt(req.query.limit) || 0, 100) || undefined;
    const sort = req.query.sort || undefined;

    // Apply sorting
    if (sort && !req.query.search) {
      // If we have a search, Fuse.js already sorted by relevance. 
      // Only sort if no search OR if explicit sort is requested (user preference over relevance)
      // For now, let's allow explicit sort to override relevance if requested.
      if (sort === "price-asc") products.sort((a, b) => a.price - b.price);
      else if (sort === "price-desc") products.sort((a, b) => b.price - a.price);
      else if (sort === "newest") products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (limit) products = products.slice(0, limit);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search suggestions (fuzzy)
export const getSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    // Get only approved/active products for suggestions
    const products = await Product.find({ visibility: 'public' })
      .select("name price image _id")
      .limit(100); // Fetch a reasonable amount for fuse to search locally

    const fuse = new Fuse(products, {
      keys: ["name"],
      threshold: 0.4,
      includeScore: true
    });

    const results = fuse.search(q);
    const suggestions = results.slice(0, 8).map(r => r.item);

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 50);
    const products = await Product.find({ featured: true })
      .populate("seller", "name storeName")
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductsByIds = async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean);
    if (!ids.length) return res.json([]);
    const products = await Product.find({ _id: { $in: ids } })
      .populate("seller", "name storeName");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTrendingProducts = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 180);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    // aggregate orders to find top products
    const Order = (await import('../models/Order.js')).default;
    const top = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$product", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: Math.min(parseInt(req.query.limit) || 8, 50) },
    ]);
    const ids = top.map(t => t._id).filter(Boolean);
    const products = await Product.find({ _id: { $in: ids } })
      .populate("seller", "name storeName");
    // maintain ranking order
    const map = new Map(products.map(p => [String(p._id), p]));
    const ordered = ids.map(id => map.get(String(id))).filter(Boolean);

    if (ordered.length === 0) {
      const fallback = await Product.find({ featured: true })
        .populate("seller", "name storeName")
        .limit(5);
      if (fallback.length > 0) return res.json(fallback);

      const latest = await Product.find()
        .populate("seller", "name storeName")
        .sort({ createdAt: -1 })
        .limit(5);
      return res.json(latest);
    }

    res.json(ordered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("crossSells", "name price image slug")
      .populate("upSells", "name price image slug")
      .populate("seller", "name storeName storeDescription storeLogo sellerStatus");

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update product (seller/admin only)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Enforce ownership
    if (req.user.role !== 'admin' && product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied: You do not own this product" });
    }

    const body = { ...req.body };

    // Parse JSON fields
    ["customizationOptions", "tags", "attributes", "variations", "crossSells", "upSells"].forEach(field => {
      if (typeof body[field] === "string") {
        try { body[field] = JSON.parse(body[field]); } catch { body[field] = []; }
      }
    });

    // Coerce booleans and numbers
    if (typeof body.customizable === "string") body.customizable = body.customizable === "true";
    if (typeof body.featured === "string") body.featured = body.featured === "true";
    if (typeof body.isDigital === "string") body.isDigital = body.isDigital === "true";
    if (typeof body.price === "string") body.price = Number(body.price);
    if (typeof body.stock === "string") body.stock = Number(body.stock);

    // Handle File Uploads
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.fieldname === "image") {
          body.image = file.path;
        } else if (file.fieldname.startsWith("variation_image_")) {
          const index = parseInt(file.fieldname.split("_")[2]);
          if (body.variations && body.variations[index]) {
            body.variations[index].image = file.path;
          }
        }
      });
    }

    Object.assign(product, body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete product (seller/admin only)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Enforce ownership
    if (req.user.role !== 'admin' && product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied: You do not own this product" });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Get related products (same category or seller)
export const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const related = await Product.find({
      $and: [
        { _id: { $ne: product._id } },
        {
          $or: [
            { category: product.category },
            { seller: product.seller }
          ]
        }
      ]
    })
      .limit(4)
      .populate("seller", "name storeName");

    res.json(related);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};