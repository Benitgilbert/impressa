import Order from "../models/Order.js";

export const getWeeklyProfit = async (req, res) => {
  try {
    const weeklyProfit = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
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
          _id: { $dayOfWeek: "$createdAt" },
          profit: { $sum: { $multiply: ["$product.price", "$quantity"] } }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Format the response to match frontend expectations
    const formattedData = weeklyProfit.map((item) => ({
      day: item._id,
      profit: item.profit
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Weekly profit data fetch failed:", err);
    res.status(500).json({ message: "Failed to load weekly profit data." });
  }
};

export const getRecentOrders = async (req, res) => {
  try {
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("product customer");

    res.json(recentOrders);
  } catch (err) {
    console.error("Recent orders fetch failed:", err);
    res.status(500).json({ message: "Failed to load recent orders." });
  }
};

export const getCustomizationDemand = async (req, res) => {
  try {
    const demandData = await Order.aggregate([
      {
        $group: {
          _id: null,
          customText: { $sum: { $cond: [{ $ifNull: ["$customText", false] }, 1, 0] } },
          customFile: { $sum: { $cond: [{ $ifNull: ["$customFile", false] }, 1, 0] } },
          cloudLink: { $sum: { $cond: [{ $ifNull: ["$cloudLink", false] }, 1, 0] } }
        }
      }
    ]);

    const result = demandData[0] || { customText: 0, customFile: 0, cloudLink: 0 };
    const total = result.customText + result.customFile + result.cloudLink;

    res.json({
      customText: result.customText,
      customFile: result.customFile,
      cloudLink: result.cloudLink,
      total
    });
  } catch (err) {
    console.error("Customization demand fetch failed:", err);
    res.status(500).json({ message: "Failed to load customization demand." });
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { 
        $group: { 
          _id: "$product", 
          totalQuantity: { $sum: "$quantity" },
          totalOrders: { $sum: 1 }
        } 
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          productName: "$product.name",
          totalQuantity: 1,
          totalOrders: 1
        }
      }
    ]);

    res.json(topProducts);
  } catch (err) {
    console.error("Top products fetch failed:", err);
    res.status(500).json({ message: "Failed to load top products." });
  }
};

export const getRevenueData = async (req, res) => {
  try {
    const monthlyRevenue = await Order.aggregate([
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
          sales: { $sum: "$quantity" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Format the response to match frontend expectations
    const formattedData = monthlyRevenue.map((item) => ({
      month: item._id,
      revenue: item.revenue,
      sales: item.sales
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Revenue data fetch failed:", err);
    res.status(500).json({ message: "Failed to load revenue data." });
  }
};
