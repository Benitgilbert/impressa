import prisma from "../prisma.js";
import { startOfThisWeek, startOfLastWeek, endOfLastWeek } from "../utils/dateUtils.js";
import calcChange from "../utils/calcChange.js";

/**
 * 📊 Get dashboard analytics data (Legacy Utility)
 * Note: Newer logic is in dashboardController, but this is kept for compatibility with other modules.
 */
export const getDashboardAnalyticsData = async () => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    pendingOrders,
    revenueThisMonthAgg,
    topProductsRaw,
    ordersThisWeek,
    ordersLastWeek,
    revenueLastWeekAgg,
    deliveredThisWeek,
    deliveredLastWeek,
    cancelledThisWeek,
    cancelledLastWeek,
    activeThisWeekCount,
    activeLastWeekCount,
    usersThisWeek,
    usersLastWeek,
    pendingThisWeek,
    pendingLastWeek,
    itemsTotalAgg,
    itemsThisWeekAgg,
    itemsLastWeekAgg
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "delivered" } }),
    prisma.order.count({ where: { status: "cancelled" } }),
    prisma.order.count({ where: { status: { in: ["pending", "processing"] } } }),
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { status: "delivered", createdAt: { gte: startOfThisMonth } }
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { order: { status: 'delivered' } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    }),
    prisma.order.count({ where: { createdAt: { gte: startOfThisWeek } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } } }),
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { status: "delivered", createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } }
    }),
    prisma.order.count({ where: { status: "delivered", createdAt: { gte: startOfThisWeek } } }),
    prisma.order.count({ where: { status: "delivered", createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } } }),
    prisma.order.count({ where: { status: "cancelled", createdAt: { gte: startOfThisWeek } } }),
    prisma.order.count({ where: { status: "cancelled", createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } } }),
    // Active users (distinct customers)
    prisma.order.groupBy({ by: ['customerId'], where: { createdAt: { gte: startOfThisWeek } } }),
    prisma.order.groupBy({ by: ['customerId'], where: { createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfThisWeek } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } } }),
    prisma.order.count({ where: { status: { in: ["pending", "processing"] }, createdAt: { gte: startOfThisWeek } } }),
    prisma.order.count({ where: { status: { in: ["pending", "processing"] }, createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } } }),
    prisma.orderItem.aggregate({ _sum: { quantity: true }, where: { order: { status: { not: 'cancelled' } } } }),
    prisma.orderItem.aggregate({ _sum: { quantity: true }, where: { order: { status: { not: 'cancelled' }, createdAt: { gte: startOfThisWeek } } } }),
    prisma.orderItem.aggregate({ _sum: { quantity: true }, where: { order: { status: { not: 'cancelled' }, createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } } } })
  ]);

  const topProducts = await Promise.all(topProductsRaw.map(async (p) => {
    const prod = await prisma.product.findUnique({ where: { id: p.productId }, select: { name: true } });
    return { productName: prod?.name || "N/A", count: p._sum.quantity };
  }));

  const revenueThisMonth = revenueThisMonthAgg._sum.grandTotal || 0;
  const itemsThisWeek = itemsThisWeekAgg._sum.quantity || 0;
  const itemsLastWeek = itemsLastWeekAgg._sum.quantity || 0;

  const changes = {
    ordersChange: calcChange(ordersThisWeek, ordersLastWeek),
    revenueChange: calcChange(revenueThisMonth, revenueLastWeekAgg._sum.grandTotal || 0),
    usersChange: calcChange(usersThisWeek, usersLastWeek),
    pendingChange: calcChange(pendingThisWeek, pendingLastWeek),
    deliveredChange: calcChange(deliveredThisWeek, deliveredLastWeek),
    cancelledChange: calcChange(cancelledThisWeek, cancelledLastWeek),
    activeChange: calcChange(activeThisWeekCount.length, activeLastWeekCount.length),
    itemsChange: calcChange(itemsThisWeek, itemsLastWeek)
  };

  return {
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    pendingOrders,
    revenueThisMonth,
    topProducts,
    changes,
    totalItems: itemsTotalAgg._sum.quantity || 0
  };
};