import Order from "../models/Order.js";

// 📅 Monthly Report
const getMonthlyReport = async ({ month, year }) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return await getRangeReport(start, end);
};

// 📆 Daily Report
const getDailyReport = async ({ date }) => {
  const day = new Date(date);
  const start = new Date(day.setHours(0, 0, 0, 0));
  const end = new Date(day.setHours(23, 59, 59, 999));
  return await getRangeReport(start, end);
};

// 📅 Custom Range Report
const getCustomRangeReport = async ({ start, end }) => {
  return await getRangeReport(new Date(start), new Date(end));
};

// 🧾 Status Report
const getStatusReport = async ({ status }) => {
  const orders = await Order.find({ status }).populate("product customer");
  const summary = {
    total: orders.length,
    status,
  };
  return { orders, summary };
};

// 👤 Customer Report
const getCustomerReport = async ({ customerId }) => {
  const orders = await Order.find({ customer: customerId }).populate("product customer");

  const productCount = {};
  let totalSpent = 0;

  orders.forEach(order => {
    const name = order.product?.name;
    if (name) productCount[name] = (productCount[name] || 0) + 1;
    totalSpent += order.product?.price * order.quantity || 0;
  });

  const mostOrderedProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const summary = {
    total: orders.length,
    delivered: orders.filter(o => o.status === "delivered").length,
    totalSpent,
    mostOrderedProduct,
  };

  return { orders, summary };
};

// 💰 Revenue Report
const getRevenueReport = async ({ start, end }) => {
  const orders = await Order.find({
    createdAt: { $gte: new Date(start), $lt: new Date(end) },
    status: "delivered",
  }).populate("product");

  let totalRevenue = 0;
  const productRevenue = {};

  orders.forEach(order => {
    const price = order.product?.price || 0;
    const revenue = price * order.quantity;
    totalRevenue += revenue;

    const name = order.product?.name;
    if (name) productRevenue[name] = (productRevenue[name] || 0) + revenue;
  });

  const topProduct = Object.entries(productRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const avgOrderValue = orders.length ? (totalRevenue / orders.length).toFixed(2) : 0;

  const summary = {
    totalOrders: orders.length,
    totalRevenue,
    avgOrderValue,
    topProduct,
  };

  return { orders, summary };
};

// 🔁 Shared Range Logic
const getRangeReport = async (start, end) => {
  const orders = await Order.find({ createdAt: { $gte: start, $lt: end } }).populate("product customer");

  const productCount = {};
  const customizationCount = { customText: 0, customFile: 0, cloudLink: 0 };

  orders.forEach(order => {
    const name = order.product?.name;
    if (name) productCount[name] = (productCount[name] || 0) + 1;

    if (order.customText) customizationCount.customText++;
    if (order.customFile) customizationCount.customFile++;
    if (order.cloudLink) customizationCount.cloudLink++;
  });

  const topProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const topCustomization = Object.entries(customizationCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const summary = {
    total: orders.length,
    delivered: orders.filter(o => o.status === "delivered").length,
    pending: orders.filter(o => o.status === "pending").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
    topProduct,
    topCustomization,
  };

  return { orders, summary };
};

// 🧠 Central Dispatcher
export const buildReportData = async (type, filters) => {
  switch (type) {
    case "monthly": return await getMonthlyReport(filters);
    case "daily": return await getDailyReport(filters);
    case "custom-range": return await getCustomRangeReport(filters);
    case "customer": return await getCustomerReport(filters);
    case "status": return await getStatusReport(filters);
    case "revenue": return await getRevenueReport(filters);
    default: throw new Error(`Unsupported report type: ${type}`);
  }
};