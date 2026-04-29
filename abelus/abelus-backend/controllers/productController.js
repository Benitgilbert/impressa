import prisma from "../prisma.js";
import Fuse from "fuse.js";
import { notifyProductAdded, notifyProductDeleted } from "./notificationController.js";

/**
 * Smart Recommendation Engine
 */
export const getProductRecommendations = async (req, res) => {
  try {
    const { productId } = req.query;
    const userId = req.user?.id;

    let baseProductIds = [];
    if (productId) {
      baseProductIds = [productId];
    } else if (userId) {
      const lastOrder = await prisma.order.findFirst({
        where: { customerId: userId },
        orderBy: { createdAt: 'desc' },
        include: { items: true }
      });
      if (lastOrder && lastOrder.items) {
        baseProductIds = lastOrder.items.map(i => i.productId);
      }
    }

    const orders = await prisma.order.findMany({
      where: { status: "delivered" },
      orderBy: { createdAt: 'desc' },
      take: 1000,
      select: { items: { select: { productId: true } } }
    });

    if (orders.length === 0) return res.json([]);

    const pairCounts = {};
    const itemCounts = {};

    orders.forEach(order => {
      const productsInOrder = [...new Set(order.items.map(i => i.productId))];
      productsInOrder.forEach(p1 => {
        itemCounts[p1] = (itemCounts[p1] || 0) + 1;
        productsInOrder.forEach(p2 => {
          if (p1 !== p2) {
            const key = `${p1}_${p2}`;
            pairCounts[key] = (pairCounts[key] || 0) + 1;
          }
        });
      });
    });

    let candidates = [];
    for (const key in pairCounts) {
      const [pA, pB] = key.split("_");
      if (baseProductIds.length > 0 && !baseProductIds.includes(pA)) continue;

      const confidence = pairCounts[key] / (itemCounts[pA] || 1);
      if (confidence > 0.15 && pairCounts[key] >= 2) {
        candidates.push({ recommendedId: pB, confidence, support: pairCounts[key] });
      }
    }

    const uniqueCandidates = {};
    candidates.forEach(c => {
      if (!uniqueCandidates[c.recommendedId] || c.confidence > uniqueCandidates[c.recommendedId].confidence) {
        uniqueCandidates[c.recommendedId] = c;
      }
    });

    const sortedRecs = Object.values(uniqueCandidates)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);

    if (sortedRecs.length === 0) return res.json([]);

    const recommendedIds = sortedRecs.map(r => r.recommendedId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: recommendedIds },
        visibility: "public",
        approvalStatus: "approved"
      },
      select: {
        id: true, name: true, price: true, image: true, slug: true,
        seller: { select: { id: true, storeName: true } }
      }
    });

    const result = products.map(p => {
      const score = uniqueCandidates[p.id];
      return {
        ...p,
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

const attachFlashSaleInfo = async (products) => {
  const isArray = Array.isArray(products);
  const items = isArray ? products : [products];
  if (items.length === 0) return products;

  const now = new Date();
  const activeSales = await prisma.flashSale.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now }
    },
    include: { products: true }
  });

  const productSaleMap = new Map();
  activeSales.forEach(sale => {
    sale.products.forEach(sp => {
      productSaleMap.set(sp.productId, {
        flashSalePrice: sp.flashSalePrice,
        stockLimit: sp.stockLimit,
        soldCount: sp.soldCount,
        saleId: sale.id,
        saleName: sale.name,
        endDate: sale.endDate
      });
    });
  });

  const results = items.map(p => {
    const saleInfo = productSaleMap.get(p.id);
    if (saleInfo) {
      return { ...p, flashSaleInfo: saleInfo };
    }
    return p;
  });

  return isArray ? results : results[0];
};

export const createProduct = async (req, res) => {
  try {
    const body = { ...req.body };
    const sellerId = req.user.id;

    if (req.user.role === 'admin') {
      body.approvalStatus = 'approved';
      body.visibility = 'public';
    }

    // Parse arrays and objects from potential string inputs (multipart/form-data)
    ["customizationOptions", "tags", "variations", "crossSells", "upSells", "attributes", "categories", "category"].forEach(field => {
      if (typeof body[field] === "string") {
        try { body[field] = JSON.parse(body[field]); } catch { }
      }
    });

    const variations = body.variations || [];
    const crossSells = body.crossSells || [];
    const upSells = body.upSells || [];

    delete body.variations;
    delete body.crossSells;
    delete body.upSells;

    if (typeof body.customizable === "string") body.customizable = body.customizable === "true";
    if (typeof body.featured === "string") body.featured = body.featured === "true";
    if (typeof body.isDigital === "string") body.isDigital = body.isDigital === "true";
    if (typeof body.price === "string") body.price = Number(body.price);
    if (typeof body.stock === "string") body.stock = Number(body.stock);

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.fieldname === "image") {
          body.image = file.path;
        }
      });
    }

    // Connect categories if provided
    let categoryConnect = undefined;
    const rawCategories = body.categories || body.category;

    if (rawCategories) {
      let catArray = Array.isArray(rawCategories) ? rawCategories : [];
      if (!Array.isArray(rawCategories)) {
        try {
          catArray = typeof rawCategories === 'string' && rawCategories.startsWith('[') 
            ? JSON.parse(rawCategories) 
            : [rawCategories];
        } catch (e) {
          catArray = [rawCategories];
        }
      }

      if (catArray.length > 0) {
        const resolvedCategories = [];
        for (let item of catArray) {
          if (!item) continue;
          
          let searchItem = item;
          if (typeof item === 'object' && item !== null) {
            searchItem = item.id || item._id || item.name || item.slug;
          }
          
          if (!searchItem) continue;
          if (typeof searchItem === 'string') searchItem = searchItem.trim();

          const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchItem);
          if (isId) {
            resolvedCategories.push({ id: searchItem });
            continue;
          }

          const slug = typeof searchItem === 'string' ? searchItem.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
          const found = await prisma.category.findFirst({
            where: {
              OR: [
                { slug: slug },
                { name: { equals: searchItem, mode: 'insensitive' } },
                { slug: { equals: searchItem, mode: 'insensitive' } }
              ]
            }
          });

          if (found) {
            resolvedCategories.push({ id: found.id });
          }
        }

        if (resolvedCategories.length > 0) {
          categoryConnect = { connect: resolvedCategories };
        }
      }
    }
    delete body.categories;
    delete body.category;

    // Ensure slug is unique or fallback
    if (!body.slug) {
        body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    }

    const product = await prisma.product.create({
      data: {
        ...body,
        sellerId,
        ...(categoryConnect && { categories: categoryConnect }),
        ...(variations.length > 0 && {
          variations: {
            create: variations.map(v => ({
              sku: v.sku || `sku-${Date.now()}-${Math.random()}`,
              price: Number(v.price) || 0,
              stock: Number(v.stock) || 0,
              image: v.image || null,
              attributes: v.attributes || {},
              isActive: v.isActive !== false
            }))
          }
        }),
        ...(crossSells.length > 0 && {
          crossSells: { connect: crossSells.map(id => ({ id })) }
        }),
        ...(upSells.length > 0 && {
          upSells: { connect: upSells.map(id => ({ id })) }
        })
      }
    });

    try {
      if (req.user.role === 'seller') {
        const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
        notifyProductAdded(user?.name || "Seller", product.name);
      }
    } catch (e) { console.error("Notification failed", e); }

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { sellerId: req.user.id },
      include: { 
        seller: { select: { id: true, name: true, storeName: true } },
        categories: { select: { id: true, name: true } },
        variations: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const where = {
      visibility: "public",
      approvalStatus: "approved"
    };

    if (typeof req.query.featured !== 'undefined') where.featured = req.query.featured === 'true';
    if (req.query.tags) where.tags = { hasSome: req.query.tags.split(',') };
    if (req.query.seller) where.sellerId = req.query.seller;

    if (req.query.category) {
      where.OR = [
        { categories: { some: { id: req.query.category } } },
        { categories: { some: { name: req.query.category } } }
      ];
    }

    if (req.query.minPrice || req.query.maxPrice) {
      where.price = {};
      if (req.query.minPrice) where.price.gte = Number(req.query.minPrice);
      if (req.query.maxPrice) where.price.lte = Number(req.query.maxPrice);
    }

    let products = await prisma.product.findMany({
      where,
      include: { seller: { select: { id: true, name: true, storeName: true } } },
      take: 200 // Prevent massive loads before fuse search
    });

    if (req.query.search) {
      const fuse = new Fuse(products, {
        keys: ["name", "description", "tags"],
        threshold: 0.4,
        includeScore: true
      });
      const results = fuse.search(req.query.search);
      products = results.map(r => r.item);
    }

    const limit = Math.min(parseInt(req.query.limit) || 0, 100) || undefined;
    const sort = req.query.sort || undefined;

    if (sort && !req.query.search) {
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

export const getSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const products = await prisma.product.findMany({
      where: {
        visibility: 'public',
        approvalStatus: 'approved'
      },
      select: { id: true, name: true, price: true, image: true },
      take: 100
    });

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
    const take = Math.min(parseInt(req.query.limit) || 8, 50);
    const products = await prisma.product.findMany({
      where: {
        featured: true,
        visibility: "public",
        approvalStatus: "approved"
      },
      include: { seller: { select: { id: true, name: true, storeName: true } } },
      orderBy: { createdAt: 'desc' },
      take
    });

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
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        visibility: "public",
        approvalStatus: "approved"
      },
      include: { seller: { select: { id: true, name: true, storeName: true } } }
    });

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
    
    // Prisma aggregation alternative for popular items
    const topItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { createdAt: { gte: since } }
      },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: Math.min(parseInt(req.query.limit) || 8, 50)
    });

    const ids = topItems.map(t => t.productId).filter(Boolean);
    
    let products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        visibility: "public",
        approvalStatus: "approved"
      },
      include: { seller: { select: { id: true, name: true, storeName: true } } }
    });

    if (products.length === 0) {
      const fallback = await prisma.product.findMany({
        where: { featured: true, visibility: "public", approvalStatus: "approved" },
        include: { seller: { select: { id: true, name: true, storeName: true } } },
        take: 5
      });
      if (fallback.length > 0) return res.json(await attachFlashSaleInfo(fallback));

      const latest = await prisma.product.findMany({
        where: { visibility: "public", approvalStatus: "approved" },
        include: { seller: { select: { id: true, name: true, storeName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      return res.json(await attachFlashSaleInfo(latest));
    }

    const enriched = await attachFlashSaleInfo(products);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        seller: { select: { id: true, name: true, storeName: true, storeDescription: true, storeLogo: true, sellerStatus: true } },
        categories: true,
        variations: true
      }
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    const enriched = await attachFlashSaleInfo(product);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Product not found" });

    if (req.user.role !== 'admin' && existing.sellerId !== req.user.id) {
      return res.status(403).json({ message: "Access denied: You do not own this product" });
    }

    const body = { ...req.body };

    ["customizationOptions", "tags", "variations", "crossSells", "upSells", "attributes", "categories", "category"].forEach(field => {
      if (typeof body[field] === "string") {
        try { body[field] = JSON.parse(body[field]); } catch { }
      }
    });

    const variations = body.variations || [];
    const crossSells = body.crossSells || [];
    const upSells = body.upSells || [];

    delete body.variations;
    delete body.crossSells;
    delete body.upSells;

    if (typeof body.customizable === "string") body.customizable = body.customizable === "true";
    if (typeof body.featured === "string") body.featured = body.featured === "true";
    if (typeof body.isDigital === "string") body.isDigital = body.isDigital === "true";
    if (typeof body.price === "string") body.price = Number(body.price);
    if (typeof body.stock === "string") body.stock = Number(body.stock);

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.fieldname === "image") {
          body.image = file.path;
        }
      });
    }

    let categoryConnect = undefined;
    const rawCategories = body.categories || body.category;

    if (rawCategories) {
      let catArray = Array.isArray(rawCategories) ? rawCategories : [];
      if (!Array.isArray(rawCategories)) {
        try {
          catArray = typeof rawCategories === 'string' && rawCategories.startsWith('[') 
            ? JSON.parse(rawCategories) 
            : [rawCategories];
        } catch (e) {
          catArray = [rawCategories];
        }
      }

      if (catArray.length > 0) {
        const resolvedCategories = [];
        for (let item of catArray) {
          if (!item) continue;
          
          let searchItem = item;
          if (typeof item === 'object' && item !== null) {
            searchItem = item.id || item._id || item.name || item.slug;
          }

          if (!searchItem) continue;
          if (typeof searchItem === 'string') searchItem = searchItem.trim();

          const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchItem);
          if (isId) {
            resolvedCategories.push({ id: searchItem });
            continue;
          }

          const slug = typeof searchItem === 'string' ? searchItem.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
          const found = await prisma.category.findFirst({
            where: {
              OR: [
                { slug: slug },
                { name: { equals: searchItem, mode: 'insensitive' } },
                { slug: { equals: searchItem, mode: 'insensitive' } }
              ]
            }
          });

          if (found) {
            resolvedCategories.push({ id: found.id });
          } else {
            console.warn(`Category not found: ${searchItem}`);
          }
        }

        if (resolvedCategories.length > 0) {
          categoryConnect = { set: resolvedCategories };
        }
      }
    }
    delete body.categories;
    delete body.category;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...body,
        ...(categoryConnect && { categories: categoryConnect }),
        variations: {
          deleteMany: {}, // Simplest way to sync variations is to recreate them
          create: variations.map(v => ({
            sku: v.sku || `sku-${Date.now()}-${Math.random()}`,
            price: Number(v.price) || 0,
            stock: Number(v.stock) || 0,
            image: v.image || null,
            attributes: v.attributes || {},
            isActive: v.isActive !== false
          }))
        },
        crossSells: {
          set: crossSells.map(id => ({ id }))
        },
        upSells: {
          set: upSells.map(id => ({ id }))
        }
      }
    });

    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        categories: { select: { id: true, name: true } },
        variations: true,
        seller: { select: { id: true, name: true, storeName: true } }
      }
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(400).json({ message: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Product not found" });

    if (req.user.role !== 'admin' && existing.sellerId !== req.user.id) {
      return res.status(403).json({ message: "Access denied: You do not own this product" });
    }

    await prisma.product.delete({ where: { id: req.params.id } });

    try {
      if (req.user.role === 'seller') {
        const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
        notifyProductDeleted(user?.name || "Seller", existing.name);
      }
    } catch (e) { }

    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRelatedProducts = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ 
      where: { id: req.params.id },
      include: { categories: true }
    });
    
    if (!product) return res.status(404).json({ message: "Product not found" });

    const categoryIds = product.categories.map(c => c.id);

    const related = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        visibility: "public",
        approvalStatus: "approved",
        OR: [
          { categories: { some: { id: { in: categoryIds } } } },
          { sellerId: product.sellerId }
        ]
      },
      take: 4,
      include: { seller: { select: { id: true, name: true, storeName: true } } }
    });

    res.json(related);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};