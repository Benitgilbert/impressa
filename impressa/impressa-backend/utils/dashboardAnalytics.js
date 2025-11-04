import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { startOfThisWeek, startOfLastWeek, endOfLastWeek } from "../utils/dateUtils.js";
import calcChange from "../utils/calcChange.js";

export const getDashboardAnalyticsData = async () => {
  const [
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    pendingOrders,
    revenueThisMonthAgg,
    topProductsAgg,
    customTextCount,
    customFileCount,
    cloudLinkCount,
    ordersThisWeek,
    ordersLastWeek,
    revenueLastWeekAgg,
    deliveredThisWeek,
    deliveredLastWeek,
    cancelledThisWeek,
    cancelledLastWeek,
    customThisWeek,
    customLastWeek,
    activeThisWeek,
    activeLastWeek,
    usersThisWeek,
    usersLastWeek,
    pendingThisWeek,
    pendingLastWeek,
    itemsTotalAgg,
    itemsThisWeekAgg,
    itemsLastWeekAgg

  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: "delivered" }),
    Order.countDocuments({ status: "cancelled" }),
    Order.countDocuments({ status: { $in: ["pending", "processing"] } }),
    Order.aggregate([
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
          _id: null,
          total: { $sum: { $multiply: ["$product.price", "$quantity"] } }
        }
      }
    ]),
    Order.aggregate([
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
          _id: "$product._id",
          product: { $first: "$product" },
          totalQuantity: { $sum: "$quantity" }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]),
    Order.countDocuments({ customText: { $exists: true } }),
    Order.countDocuments({ customFile: { $exists: true } }),
    Order.countDocuments({ cloudLink: { $exists: true } }),
    Order.countDocuments({ createdAt: { $gte: startOfThisWeek } }),
    Order.countDocuments({ createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
    Order.aggregate([
      { $match: { status: "delivered", createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } } },
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
          _id: null,
          total: { $sum: { $multiply: ["$product.price", "$quantity"] } }
        }
      }
    ]),
    Order.countDocuments({ status: "delivered", createdAt: { $gte: startOfThisWeek } }),
    Order.countDocuments({ status: "delivered", createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
    Order.countDocuments({ status: "cancelled", createdAt: { $gte: startOfThisWeek } }),
    Order.countDocuments({ status: "cancelled", createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
    Order.countDocuments({
      createdAt: { $gte: startOfThisWeek },
      $or: [
        { customText: { $exists: true } },
        { customFile: { $exists: true } },
        { cloudLink: { $exists: true } }
      ]
    }),
    Order.countDocuments({
      createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek },
      $or: [
        { customText: { $exists: true } },
        { customFile: { $exists: true } },
        { cloudLink: { $exists: true } }
      ]
    }),
    Order.distinct("customer", { createdAt: { $gte: startOfThisWeek } }).then((u) => u.length),
    Order.distinct("customer", { createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }).then((u) => u.length),
    User.countDocuments({ createdAt: { $gte: startOfThisWeek } }),
    User.countDocuments({ createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
    Order.countDocuments({ status: { $in: ["pending", "processing"] }, createdAt: { $gte: startOfThisWeek } }),
    Order.countDocuments({ status: { $in: ["pending", "processing"] }, createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
    Order.aggregate([
      { $match: { status: { $not: { $regex: "^cancelled$", $options: "i" } } } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]),
    Order.aggregate([
      { $match: { status: { $not: { $regex: "^cancelled$", $options: "i" } }, createdAt: { $gte: startOfThisWeek } } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]),
    Order.aggregate([
      { $match: { status: { $not: { $regex: "^cancelled$", $options: "i" } }, createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ])
  ]);

  const totalItems = itemsTotalAgg[0]?.total || 0;
const itemsThisWeek = itemsThisWeekAgg[0]?.total || 0;
const itemsLastWeek = itemsLastWeekAgg[0]?.total || 0;

  const revenueThisMonth = revenueThisMonthAgg[0]?.total || 0;
 const topProducts = Array.isArray(topProductsAgg) && topProductsAgg.length
  ? topProductsAgg.map(p => ({
      productName: p.product?.name || "N/A",
      count: p.count || p.totalQuantity || 0
    }))
  : [];

  const customOrders = customTextCount + customFileCount + cloudLinkCount;

  const changes = {
    ordersChange: calcChange(ordersThisWeek, ordersLastWeek),
    revenueChange: calcChange(revenueThisMonth, revenueLastWeekAgg[0]?.total || 0),
    usersChange: calcChange(usersThisWeek, usersLastWeek),
    pendingChange: calcChange(pendingThisWeek, pendingLastWeek),
    deliveredChange: calcChange(deliveredThisWeek, deliveredLastWeek),
    cancelledChange: calcChange(cancelledThisWeek, cancelledLastWeek),
    customChange: calcChange(customThisWeek, customLastWeek),
    activeChange: calcChange(activeThisWeek, activeLastWeek),
    itemsChange: calcChange(itemsThisWeek, itemsLastWeek) 
  };

  const topProductChange = changes.ordersChange;

  return {
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    pendingOrders,
    revenueThisMonth,
    topProducts,
    customOrders,
    changes,
    topProductChange,
    totalItems
  };
};