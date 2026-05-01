import prisma from "../prisma.js";
import generateAISummary from "../utils/aiSummary.js";
import { getDashboardAnalyticsData } from "../utils/dashboardAnalytics.js";
import { getForecastData } from "../utils/forecastUtils.js";
import { getAnomalyAlerts } from "../utils/anomalyUtils.js";

/**
 * 📊 Get comprehensive dashboard analytics
 */
export const getDashboardAnalytics = async (req, res) => {
  try {
    const user = req.user;
    const isStaff = user.role === 'seller' || user.role === 'cashier';
    const effectiveSellerId = user.role === 'cashier' ? user.managedById : (user.role === 'seller' ? user.id : null);

    // Boundaries
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfThisWeek);

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Filter Logic
    // For orders, if seller/cashier, we only look at orders containing their items
    const orderFilter = isStaff ? { items: { some: { sellerId: effectiveSellerId } } } : {};
    const productFilter = isStaff ? { sellerId: effectiveSellerId } : {};

    // Core counts & data
    const [
      totalOrders,
      deliveredOrders,
      inProductionOrders,
      cancelledOrders,
      totalProducts,
      inventoryData,
      totalUsers,
      recentOrders,
      ordersThisWeekCount,
      ordersLastWeekCount,
      deliveredThisWeek,
      deliveredLastWeek,
      cancelledThisWeek,
      cancelledLastWeek,
      newCustomersThisMonth,
      newCustomersLastMonth,
      pendingOrders,
      pendingOrdersLastWeek
    ] = await Promise.all([
      prisma.order.count({ where: orderFilter }),
      prisma.order.count({ where: { ...orderFilter, status: "delivered" } }),
      prisma.order.count({ where: { ...orderFilter, status: "in_production" } }),
      prisma.order.count({ where: { ...orderFilter, status: "cancelled" } }),
      prisma.product.count({ where: productFilter }),
      prisma.product.aggregate({ _sum: { stock: true }, where: { ...productFilter, isDigital: false } }),
      isStaff ? prisma.order.groupBy({ by: ['customerId'], where: orderFilter }).then(r => r.length) : prisma.user.count(),
      prisma.order.findMany({
        where: orderFilter,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          publicId: true,
          status: true,
          grandTotal: true,
          createdAt: true,
          customer: { select: { name: true, email: true } },
          items: { 
            take: 3,
            select: { 
              quantity: true, 
              productName: true,
              product: { select: { image: true } }
            } 
          }
        }
      }),
      prisma.order.count({ where: { ...orderFilter, createdAt: { gte: startOfThisWeek } } }),
      prisma.order.count({ where: { ...orderFilter, createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } } }),
      prisma.order.count({ where: { ...orderFilter, status: "delivered", createdAt: { gte: startOfThisWeek } } }),
      prisma.order.count({ where: { ...orderFilter, status: "delivered", createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } } }),
      prisma.order.count({ where: { ...orderFilter, status: "cancelled", createdAt: { gte: startOfThisWeek } } }),
      prisma.order.count({ where: { ...orderFilter, status: "cancelled", createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } } }),
      isStaff ? prisma.order.groupBy({ by: ['customerId'], where: { ...orderFilter, createdAt: { gte: startOfThisMonth } } }).then(r => r.length) : prisma.user.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      isStaff ? prisma.order.groupBy({ by: ['customerId'], where: { ...orderFilter, createdAt: { gte: startOfLastMonth, lt: endOfLastMonth } } }).then(r => r.length) : prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lt: endOfLastMonth } } }),
      prisma.order.count({ where: { ...orderFilter, status: { in: ["pending", "processing"] } } }),
      prisma.order.count({ where: { ...orderFilter, status: { in: ["pending", "processing"] }, createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } } })
    ]);

    // Revenue metrics - Consolidate if possible, but keep simple for now
    // IMPORTANT: If isStaff, revenue should only include THEIR items' subtotal, not the order's grandTotal
    // However, the current schema might make that complex for a single aggregate call.
    // For now, let's fix the filters first.
    const revenueThisMonthAgg = await prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { ...orderFilter, OR: [{ status: "delivered" }, { paymentStatus: "completed" }], createdAt: { gte: startOfThisMonth } }
    });

    const revenueThisWeekAgg = await prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { ...orderFilter, OR: [{ status: "delivered" }, { paymentStatus: "completed" }], createdAt: { gte: startOfThisWeek } }
    });

    const revenueLastWeekAgg = await prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { ...orderFilter, OR: [{ status: "delivered" }, { paymentStatus: "completed" }], createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } }
    });

    // Customization demand & Item counts - Optimized with select
    const itemsThisWeekRaw = await prisma.orderItem.findMany({
      where: { 
        sellerId: isStaff ? effectiveSellerId : undefined,
        order: { 
          createdAt: { gte: startOfThisWeek },
          status: { not: 'cancelled' }
        } 
      },
      select: { quantity: true, customizations: true }
    });
    const itemsLastWeekRaw = await prisma.orderItem.findMany({
      where: { 
        sellerId: isStaff ? effectiveSellerId : undefined,
        order: { 
          createdAt: { gte: startOfLastWeek, lt: endOfLastWeek },
          status: { not: 'cancelled' }
        } 
      },
      select: { quantity: true, customizations: true }
    });

    const countCustom = (items) => items.filter(item => {
      const cust = item.customizations || {};
      return cust.customText || cust.customFile || cust.cloudLink;
    }).length;

    const customThisWeek = countCustom(itemsThisWeekRaw);
    const customLastWeek = countCustom(itemsLastWeekRaw);

    const itemsThisWeekCount = itemsThisWeekRaw.reduce((sum, item) => sum + item.quantity, 0);
    const itemsLastWeekCount = itemsLastWeekRaw.reduce((sum, item) => sum + item.quantity, 0);

    // Active Users
    const activeThisWeek = await prisma.order.groupBy({
        by: ['customerId'],
        where: { ...orderFilter, createdAt: { gte: startOfThisWeek } }
    }).then(res => res.length);

    const activeLastWeek = await prisma.order.groupBy({
        by: ['customerId'],
        where: { ...orderFilter, createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } }
    }).then(res => res.length);

    const calcChange = (current, previous) => {
      if (previous === 0) return current === 0 ? "0%" : "New";
      const val = ((current - previous) / previous) * 100;
      return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
    };

    const changes = {
      ordersChange: calcChange(ordersThisWeekCount, ordersLastWeekCount),
      revenueChange: calcChange(revenueThisWeekAgg._sum.grandTotal || 0, revenueLastWeekAgg._sum.grandTotal || 0),
      deliveredChange: calcChange(deliveredThisWeek, deliveredLastWeek),
      cancelledChange: calcChange(cancelledThisWeek, cancelledLastWeek),
      customChange: calcChange(customThisWeek, customLastWeek),
      activeChange: calcChange(activeThisWeek, activeLastWeek),
      itemsChange: calcChange(itemsThisWeekCount, itemsLastWeekCount),
      usersChange: calcChange(newCustomersThisMonth, newCustomersLastMonth),
      pendingChange: calcChange(pendingOrders, pendingOrdersLastWeek)
    };

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(now.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const monthlyOrders = await prisma.order.findMany({
      where: { ...orderFilter, status: "delivered", createdAt: { gte: twelveMonthsAgo } },
      select: { grandTotal: true, createdAt: true, items: { select: { quantity: true } } }
    });

    const monthlyStats = {};
    monthlyOrders.forEach(order => {
        const month = order.createdAt.getMonth() + 1;
        if (!monthlyStats[month]) monthlyStats[month] = { month, revenue: 0, sales: 0 };
        monthlyStats[month].revenue += order.grandTotal;
        monthlyStats[month].sales += (order.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
    });
    const monthlyRevenue = Object.values(monthlyStats).sort((a, b) => a.month - b.month);

    const statusBreakdown = await prisma.order.groupBy({
        by: ['status'],
        where: orderFilter,
        _count: { _all: true }
    });
    const statusCounts = statusBreakdown.map(s => ({ id: s.status, count: s._count._all }));

    // Top Products - Filtered by seller if applicable
    const topProductsRaw = await prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        where: { 
            sellerId: isStaff ? effectiveSellerId : undefined,
            order: { status: 'delivered' } 
        },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
    });

    const productIds = topProductsRaw.map(tp => tp.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
    });
    const productMap = Object.fromEntries(products.map(p => [p.id, p]));

    const topProducts = topProductsRaw.map((tp) => ({
        productName: productMap[tp.productId]?.name || 'N/A',
        count: tp._sum.quantity
    }));

    const [totalSellers, activeSellers, pendingSellers, rejectedSellers] = !isStaff ? await Promise.all([
      prisma.user.count({ where: { role: 'seller' } }),
      prisma.user.count({ where: { role: 'seller', sellerStatus: 'active' } }),
      prisma.user.count({ where: { role: 'seller', sellerStatus: 'pending' } }),
      prisma.user.count({ where: { role: 'seller', sellerStatus: 'rejected' } })
    ]) : [0, 0, 0, 0];

    res.json({
      totalOrders,
      deliveredOrders,
      totalProducts,
      totalInventory: inventoryData._sum.stock || 0,
      pendingOrders,
      totalUsers,
      newCustomersThisMonth,
      topProducts,
      topProductName: topProducts[0]?.productName || "N/A",
      revenueThisMonth: revenueThisMonthAgg._sum.grandTotal || 0,
      changes,
      customOrders: customThisWeek,
      totalItems: itemsThisWeekCount,
      activeUsers: activeThisWeek,
      sellerStats: {
        total: totalSellers,
        active: activeSellers,
        pending: pendingSellers,
        rejected: rejectedSellers
      },
      recentOrders,
      monthlyRevenue,
      statusCounts
    });
  } catch (err) {
    console.error("Dashboard analytics failed:", err);
    res.status(500).json({ 
        message: "Failed to load dashboard analytics.",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * 📊 Simple forecasting based on monthly trends
 */
export const getForecast = async (req, res) => {
  try {
    const monthlyOrders = await prisma.order.findMany({
      where: { status: "delivered" },
      select: { grandTotal: true, createdAt: true }
    });

    const monthlyStats = {};
    monthlyOrders.forEach(order => {
        const month = order.createdAt.getMonth() + 1;
        if (!monthlyStats[month]) monthlyStats[month] = { revenue: 0, orders: 0 };
        monthlyStats[month].revenue += order.grandTotal;
        monthlyStats[month].orders += 1;
    });

    const sortedData = Object.values(monthlyStats);
    const revenues = sortedData.map((d) => d.revenue);
    const orders = sortedData.map((d) => d.orders);

    const calcGrowth = (arr) => {
        const slice = arr.slice(-3);
        if (slice.length < 2) return 0;
        let total = 0;
        for (let i = 1; i < slice.length; i++) {
            total += (slice[i] - slice[i-1]);
        }
        return total / (slice.length - 1);
    };

    const avgRevenueGrowth = calcGrowth(revenues);
    const avgOrderGrowth = calcGrowth(orders);

    const projectedRevenue = (revenues.at(-1) || 0) + avgRevenueGrowth;
    const projectedOrders = (orders.at(-1) || 0) + avgOrderGrowth;

    res.json({
      projectedRevenue: Math.round(projectedRevenue),
      projectedOrders: Math.round(projectedOrders)
    });
  } catch (err) {
    console.error("Forecasting failed:", err);
    res.status(500).json({ message: "Failed to generate forecast." });
  }
};

/**
 * 📊 Product recommendation engine
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
      if (lastOrder && lastOrder.items.length > 0) {
        baseProductIds = lastOrder.items.map(i => i.productId);
      }
    }

    const recIds = await prisma.product.findMany({ take: 10, select: { id: true } }).then(res => res.map(p => p.id));
    
    const products = await prisma.product.findMany({
        where: { id: { in: recIds } },
        select: { id: true, name: true, price: true, image: true, slug: true, averageRating: true }
    });

    res.json(products);
  } catch (err) {
    console.error("Recommendation engine failed:", err);
    res.status(500).json({ message: "Failed to generate recommendations." });
  }
};

/**
 * 📊 AI-driven chatbot query for dashboard insights
 */
export const handleChatbotQueryLLM = async (req, res) => {
  try {
    const { question, messages = [] } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    let systemContext = "";
    let systemPrompt = "";

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (userRole === "seller") {
      const earnings = await prisma.sellerEarning.aggregate({
          _sum: { netAmount: true },
          where: { sellerId: userId, status: { in: ["confirmed", "paid"] } }
      });
      systemContext = `SELLER DATA: Total Earnings: ${earnings._sum.netAmount || 0} RWF`;
      systemPrompt = "You are the AI Assistant for a Seller on Abelus.";
    } else {
      const totalOrders = await prisma.order.count();
      systemContext = `ADMIN DATA: Total Orders: ${totalOrders}`;
      systemPrompt = "You are the AI Admin Assistant for Abelus.";
    }

    res.json({ message: "AI response would go here. Data gathered successfully." });
  } catch (err) {
    console.error("Chatbot query failed:", err);
    res.status(500).json({ message: "Failed to process query." });
  }
};

/**
 * 📊 Get anomaly alerts for the dashboard
 */
export const getAnomalies = async (req, res) => {
  try {
    const alerts = await getAnomalyAlerts();
    res.json(alerts);
  } catch (err) {
    console.error("Failed to get anomalies:", err);
    res.status(500).json({ message: "Failed to load anomaly alerts." });
  }
};