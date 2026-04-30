import prisma from "../prisma.js";

/**
 * 📈 Shared Range Logic
 */
const getRangeReport = async (start, end, sellerId) => {
  const where = { createdAt: { gte: start, lt: end } };
  if (sellerId) {
    where.items = { some: { sellerId } };
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true } }, customer: true }
  });

  // Fetch Abonne Debt Collections in the same range
  const abonneWhere = { createdAt: { gte: start, lt: end } };
  if (sellerId) {
    // For sellers, we might only want to show debt collections relevant to them?
    // But debt collection is usually a store-wide thing handled by the cashier.
    // If the seller is managing the store, they see it.
    // However, AbonneTransaction belongs to a "responsible" (the user who did it).
    // Let's filter by responsibleId if it's a seller?
    // Actually, let's keep it simple: if sellerId is provided, filter by responsibleId.
    abonneWhere.responsibleId = sellerId;
  }

  const abonneTransactions = await prisma.abonneTransaction.findMany({
    where: {
        ...abonneWhere,
        amountPaid: { gt: 0 } // Only payments
    }
  });

  const productCount = {};
  const customizationCount = { customText: 0, customFile: 0, cloudLink: 0 };
  let totalRevenue = 0;
  let totalDebtCollected = 0;

  orders.forEach(order => {
    order.items.forEach(item => {
        // If filtering by seller, only count this seller's items
        if (sellerId && item.sellerId !== sellerId) return;

        const name = item.product?.name || item.productName;
        if (name) productCount[name] = (productCount[name] || 0) + item.quantity;
        
        totalRevenue += (item.subtotal || 0);

        const cust = item.customizations || {};
        if (cust.customText) customizationCount.customText++;
        if (cust.customFile) customizationCount.customFile++;
        if (cust.cloudLink) customizationCount.cloudLink++;
    });
  });

  abonneTransactions.forEach(tx => {
    totalDebtCollected += (tx.amountPaid || 0);
  });

  totalRevenue += totalDebtCollected;

  const topProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const topCustomization = Object.entries(customizationCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const summary = {
    total: orders.length,
    totalRevenue,
    totalDebtCollected,
    delivered: orders.filter(o => o.status === "delivered").length,
    pending: orders.filter(o => o.status === "pending").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
    topProduct,
    topCustomization,
  };

  return { orders, summary };
};

/**
 * 📈 Monthly Report
 */
const getMonthlyReport = async ({ month, year, sellerId }) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return await getRangeReport(start, end, sellerId);
};

/**
 * 📈 Weekly Report
 */
const getWeeklyReport = async ({ sellerId }) => {
  const now = new Date();
  const start = new Date(now.setDate(now.getDate() - now.getDay())); // Start of current week (Sunday)
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return await getRangeReport(start, end, sellerId);
};

/**
 * 📈 Daily Report
 */
const getDailyReport = async ({ date, sellerId }) => {
  const day = new Date(date);
  const start = new Date(day.setHours(0, 0, 0, 0));
  const end = new Date(day.setHours(23, 59, 59, 999));
  return await getRangeReport(start, end, sellerId);
};

/**
 * 📈 Custom Range Report
 */
const getCustomRangeReport = async ({ start, end, sellerId }) => {
  return await getRangeReport(new Date(start), new Date(end), sellerId);
};

/**
 * 📈 Status Report
 */
const getStatusReport = async ({ status, sellerId }) => {
  const where = { status };
  if (sellerId) {
    where.items = { some: { sellerId } };
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true } }, customer: true }
  });
  const summary = {
    total: orders.length,
    status,
  };
  return { orders, summary };
};

/**
 * 📈 Customer Report
 */
const getCustomerReport = async ({ customerId, sellerId }) => {
  const where = { customerId };
  if (sellerId) {
    where.items = { some: { sellerId } };
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true } }, customer: true }
  });

  const productCount = {};
  let totalSpent = 0;

  orders.forEach(order => {
    order.items.forEach(item => {
        if (sellerId && item.sellerId !== sellerId) return;

        const name = item.product?.name || item.productName;
        if (name) productCount[name] = (productCount[name] || 0) + item.quantity;
        totalSpent += (item.price * item.quantity);
    });
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

/**
 * 📈 Revenue Report
 */
const getRevenueReport = async ({ start, end, sellerId }) => {
  const where = {
    createdAt: { gte: new Date(start), lt: new Date(end) },
    status: "delivered",
  };
  if (sellerId) {
    where.items = { some: { sellerId } };
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true } } }
  });

  let totalRevenue = 0;
  const productRevenue = {};

  orders.forEach(order => {
    order.items.forEach(item => {
        if (sellerId && item.sellerId !== sellerId) return;

        const rev = item.price * item.quantity;
        totalRevenue += rev;
        const name = item.product?.name || item.productName;
        if (name) productRevenue[name] = (productRevenue[name] || 0) + rev;
    });
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

/**
 * 📈 Central Dispatcher
 */
export const buildReportData = async (type, filters) => {
  try {
    switch (type) {
      case "monthly": {
        if (!filters.month || !filters.year) {
          const now = new Date();
          filters.month = filters.month || (now.getMonth() + 1);
          filters.year = filters.year || now.getFullYear();
        }
        return await getMonthlyReport(filters);
      }
      case "weekly": {
        return await getWeeklyReport(filters);
      }
      case "daily": {
        if (!filters.date) {
          filters.date = new Date().toISOString().split('T')[0];
        }
        return await getDailyReport(filters);
      }
      case "custom-range": {
        if (!filters.start || !filters.end) throw new Error("Custom range requires 'start' and 'end'");
        return await getCustomRangeReport(filters);
      }
      case "customer": {
        if (!filters.customerId) throw new Error("Customer report requires 'customerId'");
        return await getCustomerReport(filters);
      }
      case "status": {
        if (!filters.status) throw new Error("Status report requires 'status'");
        return await getStatusReport(filters);
      }
      case "revenue": {
        if (!filters.start || !filters.end) throw new Error("Revenue report requires 'start' and 'end'");
        return await getRevenueReport(filters);
      }
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  } catch (error) {
    console.error("buildReportData error:", error.message);
    throw error;
  }
};

