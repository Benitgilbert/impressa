import Order from "../models/Order.js";

export const getForecastData = async () => {
  try {
    const monthlyData = await Order.aggregate([
      { $match: { status: "delivered" } },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: { $multiply: ["$product.price", "$quantity"] } },
          orders: { $sum: "$quantity" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const revenues = monthlyData.map((d) => d.revenue);
    const orders = monthlyData.map((d) => d.orders);

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

    const projectedRevenue = revenues.at(-1) + avgRevenueGrowth;
    const projectedOrders = orders.at(-1) + avgOrderGrowth;

    return {
      projectedRevenue: Math.round(projectedRevenue),
      projectedOrders: Math.round(projectedOrders)
    };
  } catch (err) {
    console.error("Forecasting failed:", err);
    return {
      projectedRevenue: 0,
      projectedOrders: 0
    };
  }
};