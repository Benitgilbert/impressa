import prisma from "../prisma.js";

/**
 * 📊 Get forecasted data based on monthly trends
 */
export const getForecastData = async () => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: "delivered" },
      select: { grandTotal: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    const monthlyStats = {};
    orders.forEach(order => {
        const monthKey = `${order.createdAt.getFullYear()}-${order.createdAt.getMonth() + 1}`;
        if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { revenue: 0, count: 0 };
        monthlyStats[monthKey].revenue += order.grandTotal;
        monthlyStats[monthKey].count += 1;
    });

    const dataPoints = Object.values(monthlyStats);
    const revenues = dataPoints.map(d => d.revenue);
    const counts = dataPoints.map(d => d.count);

    const calcAverageGrowth = (arr) => {
        const slice = arr.slice(-3);
        if (slice.length < 2) return 0;
        let totalGrowth = 0;
        for (let i = 1; i < slice.length; i++) {
            totalGrowth += (slice[i] - slice[i-1]);
        }
        return totalGrowth / (slice.length - 1);
    };

    const avgRevenueGrowth = calcAverageGrowth(revenues);
    const avgOrderGrowth = calcAverageGrowth(counts);

    const lastRevenue = revenues.at(-1) || 0;
    const lastCount = counts.at(-1) || 0;

    return {
      projectedRevenue: Math.round(lastRevenue + avgRevenueGrowth),
      projectedOrders: Math.round(lastCount + avgOrderGrowth)
    };
  } catch (err) {
    console.error("Forecasting failed:", err);
    return { projectedRevenue: 0, projectedOrders: 0 };
  }
};