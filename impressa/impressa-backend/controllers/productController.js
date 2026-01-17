import Order from "../models/Order.js";
import Product from "../models/Product.js";
import FlashSale from "../models/FlashSale.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";
import Fuse from "fuse.js";
import { notifyProductAdded, notifyProductDeleted } from "./notificationController.js";
import User from "../models/User.js";



/**
 * Smart Recommendation Engine
 * Uses Collaborative Filtering (Co-occurrence) to recommend products.
 * Context: 'productId' (Item-based) or 'userId' (User-based)
 */
export const getProductRecommendations = async (req, res) => {
  try {
    const { productId } = req.query;
    const userId = req.user?.id;

    // 1. Determine Base Context
    let baseProductIds = [];
    if (productId) {
      baseProductIds = [productId];
    } else if (userId) {
      // User-based: Find last purchased items
      const lastOrder = await Order.findOne({ customer: userId }).sort({ createdAt: -1 });
      if (lastOrder && lastOrder.items) {
        baseProductIds = lastOrder.items.map(i => i.product.toString());
      }
    }

    // 2. Fetch Orders for Co-occurrence Analysis
    // Optimization: Analyze last 1000 delivered orders to find patterns
    // (In production, this should be pre-calculated via cron job)
    const orders = await Order.find({ status: "delivered" })
      .sort({ createdAt: -1 })
      .limit(1000)
      .select("items.product");

    if (orders.length === 0) return res.json([]);

    // 3. Build Matrices
    const pairCounts = {};   // { "ProdA_ProdB": 5 }
    const itemCounts = {};   // { "ProdA": 20 }

    orders.forEach(order => {
      // Unique products in this order
      const productsInOrder = [...new Set(order.items.map(i => i.product.toString()))];

      productsInOrder.forEach(p1 => {
        itemCounts[p1] = (itemCounts[p1] || 0) + 1;

        productsInOrder.forEach(p2 => {
          if (p1 !== p2) {
            // Sort to ensure "A_B" is same as "B_A" if undirected, 
            // BUT for recommendations "Bought A -> Buy B", direction matters if we want "Next Best Action".
            // Here we assume symmetric relation "Frequently Bought Together".
            const key = `${p1}_${p2}`;
            pairCounts[key] = (pairCounts[key] || 0) + 1;
          }
        });
      });
    });

    // 4. Score Candidates
    let candidates = [];

    // Iterate all pairs
    for (const key in pairCounts) {
      const [pA, pB] = key.split("_");

      // Filter: We only care if pA is in our baseProductIds
      if (baseProductIds.length > 0 && !baseProductIds.includes(pA)) continue;

      // Confidence = P(B|A) = Count(A & B) / Count(A)
      const confidence = pairCounts[key] / (itemCounts[pA] || 1);

      // Thresholds to reduce noise
      if (confidence > 0.15 && pairCounts[key] >= 2) {
        candidates.push({
          recommendedId: pB,
          confidence,
          support: pairCounts[key]
        });
      }
    }

    // Deduplicate candidates (pick max confidence if same product recommended by multiple base items)
    const uniqueCandidates = {};
    candidates.forEach(c => {
      if (!uniqueCandidates[c.recommendedId] || c.confidence > uniqueCandidates[c.recommendedId].confidence) {
        uniqueCandidates[c.recommendedId] = c;
      }
    });

    // Sort by Confidence
    const sortedRecs = Object.values(uniqueCandidates)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8); // Top 8

    if (sortedRecs.length === 0) {
      // Fallback: Trending Products
      // Logic handled by frontend calling /trending endpoint or we return empty
      return res.json([]);
    }

    // 5. Hydrate Products
    const recommendedIds = sortedRecs.map(r => r.recommendedId);
    const products = await Product.find({
      _id: { $in: recommendedIds },
      visibility: "public",
      approvalStatus: "approved"
    }).select("name price image slug averageRating seller").populate("seller", "storeName");

    // Merge score
    const result = products.map(p => {
      const score = uniqueCandidates[p._id.toString()];
      return {
        ...p.toObject(),
        recommendationScore: score.confidence,
        boughtTogetherCount: score.support
      };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore);

    res.json(result);

  } catch (err) {
    console.error("Recommendation Error:", err);
    res.status(500).json({ message: "Failed to generate recommendations" });
  }
};

// Helper to attach flash sale info to products
const attachFlashSaleInfo = async (products) => {
  const isArray = Array.isArray(products);
  const items = isArray ? products : [products];
  if (items.length === 0) return products;

  const now = new Date();
  const activeSales = await FlashSale.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });

  const productSaleMap = new Map();
  activeSales.forEach(sale => {
    sale.products.forEach(sp => {
      productSaleMap.set(sp.product.toString(), {
        flashSalePrice: sp.flashSalePrice,
        stockLimit: sp.stockLimit,
        soldCount: sp.soldCount,
        saleId: sale._id,
        saleName: sale.name,
        endDate: sale.endDate
      });
    });
  });

  const results = items.map(p => {
    // FIX: flattenMaps ensures attributes Map is converted to Object for JSON
    const plain = p.toObject ? p.toObject({ flattenMaps: true }) : p;
    const saleInfo = productSaleMap.get(plain._id.toString());
    if (saleInfo) {
      plain.flashSaleInfo = saleInfo;
    }
    return plain;
  });

  return isArray ? results : results[0];
};

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
        const user = await User.findById(req.user.id).select('name');
        notifyProductAdded(user?.name || "Seller", product.name);
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
    const q = {
      visibility: "public",
      approvalStatus: "approved"
    };
    if (typeof req.query.featured !== 'undefined') q.featured = req.query.featured === 'true';
    if (req.query.tags) q.tags = { $in: req.query.tags.split(',') };
    // Filter by seller (optional)
    if (req.query.seller) q.seller = req.query.seller;

    // Category
    if (req.query.category) {
      if (mongoose.Types.ObjectId.isValid(req.query.category)) {
        // It's an ID
        // 1. Try to find products linked relationally
        // 2. Also try to find products with the matching Category Name string
        const category = await Category.findById(req.query.category);
        if (category) {
          q.$or = [
            { categories: req.query.category },
            { category: category.name },
            // Handle case where category field might store the ID as string
            { category: req.query.category }
          ];
        } else {
          q.categories = req.query.category;
        }
      } else {
        // It's a string name
        q.category = req.query.category;
      }
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

    const enriched = await attachFlashSaleInfo(products);
    res.json(enriched);
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
    const products = await Product.find({
      visibility: 'public',
      approvalStatus: 'approved'
    })
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
    const products = await Product.find({
      featured: true,
      visibility: "public",
      approvalStatus: "approved"
    })
      .populate("seller", "name storeName")
      .sort({ createdAt: -1 })
      .limit(limit);

    const enriched = await attachFlashSaleInfo(products);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductsByIds = async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean);
    if (!ids.length) return res.json([]);
    const products = await Product.find({
      _id: { $in: ids },
      visibility: "public",
      approvalStatus: "approved"
    }).populate("seller", "name storeName");

    const enriched = await attachFlashSaleInfo(products);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTrendingProducts = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 180);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const Order = (await import('../models/Order.js')).default;
    const top = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$product", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: Math.min(parseInt(req.query.limit) || 8, 50) },
    ]);
    const ids = top.map(t => t._id).filter(Boolean);
    const products = await Product.find({
      _id: { $in: ids },
      visibility: "public",
      approvalStatus: "approved"
    }).populate("seller", "name storeName");
    // maintain ranking order
    const map = new Map(products.map(p => [String(p._id), p]));
    const ordered = ids.map(id => map.get(String(id))).filter(Boolean);

    if (ordered.length === 0) {
      const fallback = await Product.find({
        featured: true,
        visibility: "public",
        approvalStatus: "approved"
      })
        .populate("seller", "name storeName")
        .limit(5);
      if (fallback.length > 0) {
        const enriched = await attachFlashSaleInfo(fallback);
        return res.json(enriched);
      }

      const latest = await Product.find({
        visibility: "public",
        approvalStatus: "approved"
      })
        .populate("seller", "name storeName")
        .sort({ createdAt: -1 })
        .limit(5);
      const enriched = await attachFlashSaleInfo(latest);
      return res.json(enriched);
    }

    const enriched = await attachFlashSaleInfo(ordered);
    res.json(enriched);
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

    // Attach sale info
    const enriched = await attachFlashSaleInfo(product);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
    console.error("Update Product Error:", err);
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

    // Capture details before deletion
    const productName = product.name;

    await product.deleteOne();

    // 🔔 Notify Admin if deleted by Seller
    try {
      if (req.user.role === 'seller') {
        const user = await User.findById(req.user.id).select('name');
        notifyProductDeleted(user?.name || "Seller", productName);
      }
    } catch (e) { }

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
        { visibility: "public" },
        { approvalStatus: "approved" },
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