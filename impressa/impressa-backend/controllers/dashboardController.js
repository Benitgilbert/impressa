import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import generateAISummary from "../utils/aiSummary.js";
import { getDashboardAnalyticsData } from "../utils/dashboardAnalytics.js";
import { getForecastData } from "../utils/forecastUtils.js";
import { getAnomalyAlerts } from "../utils/anomalyUtils.js";

export const getDashboardAnalytics = async (req, res) => {
  try {
    // Week boundaries
    const now = new Date();

    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const endOfLastWeek = new Date(startOfThisWeek); // Sunday of last week

    // Core counts
    const [
      totalOrders,
      deliveredOrders,
      inProductionOrders,
      cancelledOrders,
      totalProducts,
      totalInventory,
      totalUsers,
      recentOrders,
      customizationDemand,
      deliveredThisWeek,
      deliveredLastWeek,
      cancelledThisWeek,
      cancelledLastWeek,
      customThisWeek,
      customLastWeek,
      activeThisWeek,
      activeLastWeek,
      pendingOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "in-production" }),
      Order.countDocuments({ status: "cancelled" }),
      Product.countDocuments(),
      Product.aggregate([
        { $match: { isDigital: { $ne: true } } },
        { $group: { _id: null, total: { $sum: "$stock" } } }
      ]).then(res => res[0]?.total || 0),
      User.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(10).populate("items.product customer"),
      Order.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: null,
            customText: { $sum: { $cond: [{ $ifNull: ["$items.customizations.customText", false] }, 1, 0] } },
            customFile: { $sum: { $cond: [{ $ifNull: ["$items.customizations.customFile", false] }, 1, 0] } },
            cloudLink: { $sum: { $cond: [{ $ifNull: ["$items.customizations.cloudLink", false] }, 1, 0] } }
          }
        }
      ]),
      Order.countDocuments({ status: "delivered", createdAt: { $gte: startOfThisWeek } }),
      Order.countDocuments({ status: "delivered", createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
      Order.countDocuments({ status: "cancelled", createdAt: { $gte: startOfThisWeek } }),
      Order.countDocuments({ status: "cancelled", createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfThisWeek } } },
        { $unwind: "$items" },
        {
          $match: {
            $or: [
              { "items.customizations.customText": { $exists: true, $ne: null } },
              { "items.customizations.customFile": { $exists: true, $ne: null } },
              { "items.customizations.cloudLink": { $exists: true, $ne: null } }
            ]
          }
        },
        { $count: "count" }
      ]).then(res => res[0]?.count || 0),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } } },
        { $unwind: "$items" },
        {
          $match: {
            $or: [
              { "items.customizations.customText": { $exists: true, $ne: null } },
              { "items.customizations.customFile": { $exists: true, $ne: null } },
              { "items.customizations.cloudLink": { $exists: true, $ne: null } }
            ]
          }
        },
        { $count: "count" }
      ]).then(res => res[0]?.count || 0),
      Order.distinct("customer", { createdAt: { $gte: startOfThisWeek } }).then((u) => u.length),
      Order.distinct("customer", { createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }).then((u) => u.length),
      Order.countDocuments({ status: { $in: ["pending", "processing"] } })
    ]);

    // Revenue this month
    const revenueThisMonthAgg = await Order.aggregate([
      {
        $match: {
          $or: [
            { status: "delivered" },
            { "payment.status": "completed" }
          ],
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totals.grandTotal" }
        }
      }
    ]);
    const revenueThisMonth = revenueThisMonthAgg[0]?.totalRevenue || 0;

    // Weekly change metrics
    const [
      ordersThisWeek,
      ordersLastWeek,
      revenueThisWeekAgg,
      revenueLastWeekAgg,
      usersThisWeek,
      usersLastWeek,
      pendingThisWeek,
      pendingLastWeek,
      itemsThisWeekAgg,
      itemsLastWeekAgg
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfThisWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
      Order.aggregate([
        {
          $match: {
            $or: [{ status: "delivered" }, { "payment.status": "completed" }],
            createdAt: { $gte: startOfThisWeek }
          }
        },
        { $group: { _id: null, total: { $sum: "$totals.grandTotal" } } }
      ]),
      Order.aggregate([
        {
          $match: {
            $or: [{ status: "delivered" }, { "payment.status": "completed" }],
            createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek }
          }
        },
        { $group: { _id: null, total: { $sum: "$totals.grandTotal" } } }
      ]),
      User.countDocuments({ createdAt: { $gte: startOfThisWeek } }),
      User.countDocuments({ createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
      Order.countDocuments({ status: { $in: ["pending", "processing"] }, createdAt: { $gte: startOfThisWeek } }),
      Order.countDocuments({ status: { $in: ["pending", "processing"] }, createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: startOfThisWeek } } },
        { $unwind: "$items" },
        { $group: { _id: null, total: { $sum: "$items.quantity" } } }
      ]),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } } },
        { $unwind: "$items" },
        { $group: { _id: null, total: { $sum: "$items.quantity" } } }
      ])
    ]);

    const itemsThisWeek = itemsThisWeekAgg[0]?.total || 0;
    const itemsLastWeek = itemsLastWeekAgg[0]?.total || 0;

    const totalItemsAgg = await Order.aggregate([
      { $match: { status: { $not: { $regex: "^cancelled$", $options: "i" } } } },
      { $unwind: "$items" },
      { $group: { _id: null, total: { $sum: "$items.quantity" } } }
    ]);

    const totalItems = totalItemsAgg[0]?.total || 0;

    // New customers this month
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newCustomersThisMonth = await User.countDocuments({ createdAt: { $gte: startOfThisMonth } });

    // Active users (distinct customers who placed orders this week)
    const activeUsers = activeThisWeek;

    const calcChange = (current, previous) => {
      if (previous === 0) {
        if (current === 0) return "0%";
        return "New"; // no % needed
      }
      return `${(((current - previous) / previous) * 100).toFixed(2)}%`;
    };

    const changes = {
      ordersChange: calcChange(ordersThisWeek, ordersLastWeek),
      revenueChange: calcChange(revenueThisWeekAgg[0]?.total || 0, revenueLastWeekAgg[0]?.total || 0),
      usersChange: calcChange(usersThisWeek, usersLastWeek),
      pendingChange: calcChange(pendingThisWeek, pendingLastWeek),
      deliveredChange: calcChange(deliveredThisWeek, deliveredLastWeek),
      cancelledChange: calcChange(cancelledThisWeek, cancelledLastWeek),
      customChange: calcChange(customThisWeek, customLastWeek),
      activeChange: calcChange(activeThisWeek, activeLastWeek),
      itemsChange: calcChange(itemsThisWeek, itemsLastWeek)
    };

    // Monthly revenue & sales (for line chart)
    const monthlyRevenue = await Order.aggregate([
      { $match: { status: "delivered" } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totals.grandTotal" }, // Sum grandTotal per order
          sales: { $sum: { $sum: "$items.quantity" } } // Sum quantities of all items
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Weekly profit (for bar chart) - Profit = GrandTotal - Cost
    const weeklyProfit = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          profit: {
            $sum: {
              $subtract: [
                "$totals.grandTotal",
                {
                  $sum: {
                    $map: {
                      input: "$items",
                      as: "item",
                      in: { $multiply: [{ $ifNull: ["$$item.cost", 0] }, "$$item.quantity"] }
                    }
                  }
                }
              ]
            }
          }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Order status breakdown (for pie chart)
    const statusCounts = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Top-selling products (for bar chart)
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.product", count: { $sum: "$items.quantity" } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          productName: "$product.name",
          count: 1
        }
      }
    ]);

    const [topThisWeek, topLastWeek] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfThisWeek } } },
        { $unwind: "$items" },
        { $group: { _id: "$items.product", count: { $sum: "$items.quantity" } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" },
        { $project: { productName: "$product.name", count: 1 } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } } },
        { $unwind: "$items" },
        { $group: { _id: "$items.product", count: { $sum: "$items.quantity" } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" },
        { $project: { productName: "$product.name", count: 1 } }
      ])
    ]);

    const topProductChange = topThisWeek[0] && topLastWeek[0]
      ? calcChange(topThisWeek[0].count, topLastWeek[0].count)
      : null;

    const topProductName = topThisWeek[0]?.productName || (topProducts[0]?.productName || "N/A");

    // Seller stats (for multi-vendor dashboard)
    const [totalSellers, activeSellers, pendingSellers, rejectedSellers] = await Promise.all([
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'seller', sellerStatus: 'active' }),
      User.countDocuments({ role: 'seller', sellerStatus: 'pending' }),
      User.countDocuments({ role: 'seller', sellerStatus: 'rejected' })
    ]);

    // Top Sellers by revenue (last 30 days)
    const topSellers = await Order.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.seller',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: '$sellerInfo' },
      {
        $project: {
          sellerId: '$_id',
          name: '$sellerInfo.name',
          storeName: '$sellerInfo.storeName',
          revenue: 1,
          orders: 1
        }
      }
    ]);

    // Pending Seller Approvals (latest 5)
    const pendingSellerApprovals = await User.find({ role: 'seller', sellerStatus: 'pending' })
      .select('name email storeName createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Low Stock Alerts (products with stock < 10)
    const lowStockProducts = await Product.find({ stock: { $gt: 0, $lte: 10 }, visibility: 'public' })
      .select('name stock image seller')
      .populate('seller', 'storeName name')
      .sort({ stock: 1 })
      .limit(5);

    // Out of Stock count
    const outOfStockCount = await Product.countDocuments({ stock: 0, visibility: 'public' });

    res.json({
      // Cards
      totalOrders,
      deliveredOrders,
      inProductionOrders,
      cancelledOrders,
      totalProducts,
      totalInventory,
      pendingOrders,
      totalUsers,
      newCustomersThisMonth,
      activeUsers,
      topProducts,
      topProductName,
      topProductChange,
      revenueThisMonth,
      changes,
      totalItems,
      customOrders:
        (customizationDemand[0]?.customText || 0) +
        (customizationDemand[0]?.customFile || 0) +
        (customizationDemand[0]?.cloudLink || 0),

      // Seller Stats (Multi-vendor)
      sellerStats: {
        total: totalSellers,
        active: activeSellers,
        pending: pendingSellers,
        rejected: rejectedSellers
      },
      topSellers,
      pendingSellerApprovals,

      // Inventory Alerts
      lowStockProducts,
      outOfStockCount,

      // Tables
      recentOrders,
      customizationDemand: customizationDemand[0] || {},

      // Charts
      monthlyRevenue,
      weeklyProfit,
      statusCounts,

      // Real week-over-week changes
      changes
    });
  } catch (err) {
    console.error("Dashboard analytics failed:", err);
    res.status(500).json({ message: "Failed to load dashboard analytics." });
  }
};


export const getForecast = async (req, res) => {
  try {
    // Get monthly revenue and order count
    const monthlyData = await Order.aggregate([
      {
        $match: { status: "delivered" }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totals.grandTotal" },
          orders: { $sum: 1 } // Count of orders, not items
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Extract arrays
    const months = monthlyData.map((d) => d._id);
    const revenues = monthlyData.map((d) => d.revenue);
    const orders = monthlyData.map((d) => d.orders);

    // Simple linear forecast (last 3 months average growth)
    const revenueGrowth = revenues.slice(-3).map((v, i, arr) =>
      i === 0 ? 0 : v - arr[i - 1]
    );
    const orderGrowth = orders.slice(-3).map((v, i, arr) =>
      i === 0 ? 0 : v - arr[i - 1]
    );

    const avgRevenueGrowth =
      revenueGrowth.reduce((a, b) => a + b, 0) / revenueGrowth.length || 0;
    const avgOrderGrowth =
      orderGrowth.reduce((a, b) => a + b, 0) / orderGrowth.length || 0;

    const projectedRevenue =
      revenues[revenues.length - 1] + avgRevenueGrowth;
    const projectedOrders = orders[orders.length - 1] + avgOrderGrowth;

    res.json({
      projectedRevenue: Math.round(projectedRevenue),
      projectedOrders: Math.round(projectedOrders)
    });
  } catch (err) {
    console.error("Forecasting failed:", err);
    res.status(500).json({ message: "Failed to generate forecast." });
  }
};

export const getProductRecommendations = async (req, res) => {
  try {
    const { productId } = req.query;
    const userId = req.user?.id; // Optional if logged in

    // Step 0: Determine Base Product (Context)
    let baseProductIds = [];
    if (productId) {
      baseProductIds = [productId];
    } else if (userId) {
      // Find last product bought by user
      const lastOrder = await Order.findOne({ customer: userId }).sort({ createdAt: -1 });
      if (lastOrder && lastOrder.items.length > 0) {
        baseProductIds = lastOrder.items.map(i => i.product.toString());
      }
    }

    // Optimization: Limit to last 5000 orders for performance
    const orders = await Order.find({ status: "delivered" })
      .sort({ createdAt: -1 })
      .limit(5000)
      .select("items.product customer");

    // Step 2: Build Co-occurrence Matrix
    const pairCounts = {};
    const productCounts = {};

    orders.forEach((order) => {
      const uniqueItems = [...new Set(order.items.map(i => i.product.toString()))];

      uniqueItems.forEach(p1 => {
        productCounts[p1] = (productCounts[p1] || 0) + 1;

        uniqueItems.forEach(p2 => {
          if (p1 !== p2) {
            const key = `${p1}_${p2}`;
            pairCounts[key] = (pairCounts[key] || 0) + 1;
          }
        });
      });
    });

    // Step 3: Generate Rules
    let recommendations = [];
    for (const key in pairCounts) {
      const [baseId, recId] = key.split("_");

      // Filter if we are looking for specific context
      if (baseProductIds.length > 0 && !baseProductIds.includes(baseId)) continue;

      const confidence = pairCounts[key] / productCounts[baseId];
      // Threshold: 20% confidence or at least 2 co-occurrences
      if (confidence > 0.2 || pairCounts[key] > 2) {
        recommendations.push({ baseId, recId, confidence, count: pairCounts[key] });
      }
    }

    // Step 4: Sort by confidence
    recommendations.sort((a, b) => b.confidence - a.confidence);

    // Step 5: Populate
    const recIds = recommendations.slice(0, 10).map(r => r.recId);
    const products = await Product.find({ _id: { $in: recIds } }).select("name price image slug averageRating price");

    const finalResults = products.map(p => {
      const match = recommendations.find(r => r.recId === p._id.toString());
      return {
        ...p.toObject(),
        confidence: match?.confidence,
        matchCount: match?.count
      };
    }).sort((a, b) => b.confidence - a.confidence);

    res.json(finalResults);

  } catch (err) {
    console.error("Recommendation engine failed:", err);
    res.status(500).json({ message: "Failed to generate recommendations." });
  }
};

export const getAnomalies = async (req, res) => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Helper to count orders by status in a time range
    const countByStatus = async (status, start, end) =>
      await Order.countDocuments({
        status,
        createdAt: { $gte: start, $lt: end }
      });

    // Cancelled orders
    const cancelledLastWeek = await countByStatus("cancelled", oneWeekAgo, now);
    const cancelledPrevWeek = await countByStatus("cancelled", twoWeeksAgo, oneWeekAgo);

    // Custom orders
    const countCustom = async (start, end) => {
      const result = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end } } },
        { $unwind: "$items" },
        {
          $match: {
            $or: [
              { "items.customizations.customText": { $exists: true, $ne: null } },
              { "items.customizations.customFile": { $exists: true, $ne: null } },
              { "items.customizations.cloudLink": { $exists: true, $ne: null } }
            ]
          }
        },
        { $count: "count" }
      ]);
      return result[0]?.count || 0;
    };

    const customLastWeek = await countCustom(oneWeekAgo, now);
    const customPrevWeek = await countCustom(twoWeeksAgo, oneWeekAgo);

    const anomalies = [];

    // Cancelled spike
    if (cancelledPrevWeek > 0) {
      const spike = ((cancelledLastWeek - cancelledPrevWeek) / cancelledPrevWeek) * 100;
      if (spike >= 100) {
        anomalies.push({
          type: "Cancelled Orders",
          spike: `+${Math.round(spike)}%`,
          message: "Investigate production delays or customer issues."
        });
      }
    }

    // Custom order surge
    if (customPrevWeek > 0) {
      const spike = ((customLastWeek - customPrevWeek) / customPrevWeek) * 100;
      if (spike >= 100) {
        anomalies.push({
          type: "Custom Orders",
          spike: `+${Math.round(spike)}%`,
          message: "High demand for personalization this week."
        });
      }
    }

    res.json(anomalies);
  } catch (err) {
    console.error("Anomaly detection failed:", err);
    res.status(500).json({ message: "Failed to detect anomalies." });
  }
};



export const handleChatbotQueryLLM = async (req, res) => {
  try {
    const { question, messages = [] } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    let systemContext = "";
    let systemPrompt = "";

    // ---------------------------------------------------------
    // 🛍️ SELLER CONTEXT
    // ---------------------------------------------------------
    if (userRole === "seller") {
      const SellerEarning = (await import("../models/SellerEarning.js")).default;
      const Product = (await import("../models/Product.js")).default;

      // 1. Earnings (Net Amount)
      const earningsAgg = await SellerEarning.aggregate([
        { $match: { seller: new mongoose.Types.ObjectId(userId), status: { $in: ["confirmed", "paid"] } } },
        { $group: { _id: null, total: { $sum: "$netAmount" } } }
      ]);
      const totalEarnings = earningsAgg[0]?.total || 0;

      const pendingAgg = await SellerEarning.aggregate([
        { $match: { seller: new mongoose.Types.ObjectId(userId), status: "pending" } },
        { $group: { _id: null, total: { $sum: "$netAmount" } } }
      ]);
      const pendingEarnings = pendingAgg[0]?.total || 0;

      // 2. Product Stats
      const products = await Product.find({ seller: userId }).select("name stock salesCount").sort({ salesCount: -1 });
      const totalProducts = products.length;
      const lowStock = products.filter(p => p.stock <= 5).slice(0, 5);
      const topProducts = products.slice(0, 3);

      // 3. Recent Sale Items (from SellerEarnings)
      const recentSales = await SellerEarning.find({ seller: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderPublicId productName netAmount status createdAt");

      systemContext = `
SELLER DATA:
- **Financials**:
  - Total Earnings (Confirmed/Paid): ${totalEarnings.toLocaleString()} RWF
  - Pending Earnings (In Progress): ${pendingEarnings.toLocaleString()} RWF

- **Products**:
  - Total Active Products: ${totalProducts}
  - Top Sellers: ${topProducts.map(p => `${p.name} (${p.salesCount} sold)`).join(", ")}
  - ⚠️ Low Stock Alerts: ${lowStock.length > 0 ? lowStock.map(p => `${p.name} (${p.stock})`).join(", ") : "None"}

- **Recent Sales**:
${recentSales.map(s => `  - Order #${s.orderPublicId} | ${s.productName} | ${s.netAmount} RWF | ${s.status}`).join("\n")}
`;

      systemPrompt = `
You are the AI Assistant for a Seller on Impressa.
Access their specific SELLER DATA above to answer their question.

RULES:
1. **Role**: You are assisting a Business Owner. Be professional and encouraging.
2. **Scope**: Only discuss THEIR data (shown above). Do not hallucinate global system stats.
3. **Conciseness**: Answer DIRECTLY. No specific pleasantries unless asked.
   - Example: "You have 50,000 RWF in pending earnings."
4. **Recommendation**: You MAY add one short tip if relevant (e.g. "Restock [Item] soon").

Conversation History:
`;

    }
    // ---------------------------------------------------------
    // 🔐 ADMIN CONTEXT
    // ---------------------------------------------------------
    else {
      // Step 1: Gather comprehensive system data
      // A. Basic Analytics
      const analytics = await getDashboardAnalyticsData();
      const forecast = await getForecastData();
      const anomalies = await getAnomalyAlerts();

      // B. Recent Orders
      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("customer", "name email")
        .select("publicId status totals.grandTotal createdAt payment.status");

      // C. Low Stock
      const lowStock = await Product.find({ stock: { $lte: 10 }, visibility: 'public' })
        .select("name stock")
        .limit(5);

      // D. Top Sellers
      const topSellers = await Order.aggregate([
        { $match: { status: 'delivered', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
        { $unwind: '$p' },
        { $group: { _id: '$p.seller', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { revenue: -1 } },
        { $limit: 3 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
        { $unwind: '$u' },
        { $project: { name: '$u.name', store: '$u.storeName', revenue: 1 } }
      ]);

      // E. Pending Approvals
      const pendingSellers = await User.countDocuments({ role: 'seller', sellerStatus: 'pending' });

      systemContext = `
SYSTEM DATA (ADMIN):
- **General Stats**:
  - Orders: ${analytics.totalOrders} (Delivered: ${analytics.deliveredOrders}, Pending: ${analytics.pendingOrders}, Cancelled: ${analytics.cancelledOrders})
  - Revenue (Month): ${analytics.revenueThisMonth.toLocaleString()} RWF
  - Forecast: ${forecast.projectedRevenue.toLocaleString()} RWF (Next Month)
  - Custom Orders: ${analytics.customOrders}
  - Pending Seller Approvals: ${pendingSellers}

- **Recent Orders**:
${recentOrders.map(o => `  - #${o.publicId} | ${o.customer?.name || 'Guest'} | ${o.status} | ${o.totals?.grandTotal} RWF`).join("\n")}

- **Inventory Alerts**:
${lowStock.length > 0 ? lowStock.map(p => `  - ${p.name}: ${p.stock} left`).join("\n") : "  - No low stock items."}

- **Top Sellers**:
${topSellers.map(s => `  - ${s.store || s.name}: ${s.revenue.toLocaleString()} RWF`).join("\n")}

- **Anomalies**:
${anomalies.length > 0 ? anomalies.map(a => `  - [ALERT] ${a.type}: ${a.spike}`).join("\n") : "  - None detected."}
`;

      systemPrompt = `
You are the AI Admin Assistant for the Impressa E-commerce Platform.
Access the SYSTEM DATA above to answer the Admin's question.

RULES:
1. **Scope**: You have access to "the whole system".
2. **Conciseness**: Answer DIRECTLY. No fluff.
3. **Recommendation**: Optional one-sentence suggestion.

Conversation History:
`;
    }

    // ---------------------------------------------------------
    // 🧠 COMMON LLM EXECUTION
    // ---------------------------------------------------------

    const lastTurns = Array.isArray(messages) ? messages.slice(-6) : [];
    const historyText = lastTurns
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n");

    const fullPrompt = `
${systemContext}

${systemPrompt}
${historyText}

Question: ${question}

Response:
`;

    // Step 3: Call LLM API
    const response = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "command-r-08-2024",
        message: fullPrompt,
        temperature: 0.2
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Cohere API error:", result);
      throw new Error(result.message || "AI service unavailable");
    }

    const answer = result.text || "I couldn't find an answer to that.";

    res.json({ answer });

  } catch (err) {
    console.error("LLM chatbot failed:", err);
    res.status(500).json({ message: "I'm having trouble accessing the system right now." });
  }
};