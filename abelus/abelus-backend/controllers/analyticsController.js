import prisma from "../prisma.js";

/**
 * 📈 Get weekly profit data (admin)
 */
export const getWeeklyProfit = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "delivered",
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      select: { grandTotal: true, createdAt: true }
    });

    // MongoDB $dayOfWeek returns 1 (Sunday) to 7 (Saturday)
    // JS getDay() returns 0 (Sunday) to 6 (Saturday)
    const profitByDay = {};
    for (let i = 1; i <= 7; i++) profitByDay[i] = 0;

    orders.forEach(order => {
      const day = order.createdAt.getDay() + 1;
      profitByDay[day] += order.grandTotal;
    });

    const formattedData = Object.entries(profitByDay).map(([day, profit]) => ({
      day: parseInt(day),
      profit
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Weekly profit data fetch failed:", err);
    res.status(500).json({ message: "Failed to load weekly profit data." });
  }
};

/**
 * 📈 Get recent orders (admin)
 */
export const getRecentOrders = async (req, res) => {
  try {
    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        items: { include: { product: { select: { name: true, image: true } } } },
        customer: { select: { name: true, email: true } }
      }
    });

    res.json(recentOrders);
  } catch (err) {
    console.error("Recent orders fetch failed:", err);
    res.status(500).json({ message: "Failed to load recent orders." });
  }
};

/**
 * 📈 Get customization demand stats
 */
export const getCustomizationDemand = async (req, res) => {
  try {
    // Note: In high-scale apps, this should be a periodic aggregation or use raw SQL JSON paths
    const items = await prisma.orderItem.findMany({
        select: { customizations: true }
    });

    let customText = 0;
    let customFile = 0;
    let cloudLink = 0;

    items.forEach(item => {
      const c = item.customizations || {};
      if (c.customText) customText++;
      if (c.customFile) customFile++;
      if (c.cloudLink) cloudLink++;
    });

    const total = customText + customFile + cloudLink;

    res.json({
      customText,
      customFile,
      cloudLink,
      total
    });
  } catch (err) {
    console.error("Customization demand fetch failed:", err);
    res.status(500).json({ message: "Failed to load customization demand." });
  }
};

/**
 * 📈 Get top products by volume
 */
export const getTopProducts = async (req, res) => {
  try {
    const topProductsRaw = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: { productId: true },
      where: { order: { status: { not: 'cancelled' } } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    const topProducts = await Promise.all(topProductsRaw.map(async (tp) => {
      const product = await prisma.product.findUnique({ 
          where: { id: tp.productId },
          select: { name: true }
      });
      return {
        _id: tp.productId,
        productName: product?.name || "Unknown Product",
        totalQuantity: tp._sum.quantity,
        totalOrders: tp._count.productId
      };
    }));

    res.json(topProducts);
  } catch (err) {
    console.error("Top products fetch failed:", err);
    res.status(500).json({ message: "Failed to load top products." });
  }
};

/**
 * 📈 Get revenue data over time (admin)
 */
export const getRevenueData = async (req, res) => {
  try {
    const { period = "month" } = req.query;
    const now = new Date();
    let startDate = new Date();

    if (period === "day") startDate.setDate(now.getDate() - 30);
    else if (period === "week") startDate.setDate(now.getDate() - 12 * 7);
    else startDate.setMonth(now.getMonth() - 12);

    const orders = await prisma.order.findMany({
      where: { status: "delivered", createdAt: { gte: startDate } },
      include: { items: true }
    });

    const stats = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    orders.forEach(order => {
      let label;
      if (period === "day") label = order.createdAt.toISOString().split('T')[0];
      else if (period === "week") {
          // ISO Week (simplified)
          const onejan = new Date(order.createdAt.getFullYear(), 0, 1);
          const week = Math.ceil((((order.createdAt.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
          label = `Week ${week}`;
      } else {
          label = months[order.createdAt.getMonth()];
      }

      if (!stats[label]) stats[label] = { revenue: 0, sales: 0 };
      stats[label].revenue += order.grandTotal;
      stats[label].sales += order.items.reduce((sum, i) => sum + i.quantity, 0);
    });

    const formattedData = Object.entries(stats).map(([label, data]) => ({
      label,
      revenue: data.revenue,
      sales: data.sales
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Revenue data fetch failed:", err);
    res.status(500).json({ message: "Failed to load revenue data." });
  }
};

/**
 * 📈 Get revenue data for a specific seller
 */
export const getSellerRevenueData = async (req, res) => {
  try {
    const { period = "day" } = req.query;
    const sellerId = req.user.id;
    const now = new Date();
    let startDate = new Date();

    if (period === "week") startDate.setDate(now.getDate() - 12 * 7);
    else if (period === "month") startDate.setMonth(now.getMonth() - 12);
    else startDate.setDate(now.getDate() - 30);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: { status: "delivered", createdAt: { gte: startDate } },
        product: { sellerId: sellerId }
      },
      include: { order: true }
    });

    const stats = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    orderItems.forEach(item => {
      let label;
      if (period === "day") label = item.order.createdAt.toISOString().split('T')[0];
      else if (period === "week") {
          const onejan = new Date(item.order.createdAt.getFullYear(), 0, 1);
          const week = Math.ceil((((item.order.createdAt.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
          label = `Week ${week}`;
      } else {
          label = months[item.order.createdAt.getMonth()];
      }

      if (!stats[label]) stats[label] = { revenue: 0, sales: 0 };
      stats[label].revenue += (item.price * item.quantity);
      stats[label].sales += item.quantity;
    });

    const formattedData = Object.entries(stats).map(([label, data]) => ({
      label,
      revenue: data.revenue,
      sales: data.sales
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Seller revenue data fetch failed:", err);
    res.status(500).json({ message: "Failed to load seller revenue data." });
  }
};
