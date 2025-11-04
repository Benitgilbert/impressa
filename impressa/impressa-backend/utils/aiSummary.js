const generateAISummary = (type, summary) => {
  const formatRWF = (amount) =>
    typeof amount === "number" ? `${amount.toLocaleString()} RWF` : "N/A";

  switch (type) {
    case "monthly":
      return `This month, impressa processed ${summary.total || 0} orders. Top product: ${summary.topProduct || "N/A"}. Delivered: ${summary.delivered || 0}, Cancelled: ${summary.cancelled || 0}.`;

    case "daily":
      return `Today’s report includes ${summary.total || 0} orders. Most requested customization: ${summary.topCustomization || "N/A"}.`;

    case "product":
      return `Product report shows ${summary.total || 0} orders. Top customer: ${summary.topCustomer || "N/A"}. Delivered: ${summary.delivered || 0}.`;

    case "customer":
      return `Customer placed ${summary.total || 0} orders. Total spent: ${formatRWF(summary.totalSpent)}. Favorite product: ${summary.mostOrderedProduct || "N/A"}.`;

    case "status":
      return `There are ${summary.total || 0} orders currently marked as "${summary.status || "unknown"}".`;

    case "revenue":
      return `Revenue totaled ${formatRWF(summary.totalRevenue)}. Average order value: ${formatRWF(summary.avgOrderValue)}. Top product: ${summary.topProduct || "N/A"}.`;

    case "custom-range":
      return `Custom range includes ${summary.total || 0} orders. Top product: ${summary.topProduct || "N/A"}. Delivered: ${summary.delivered || 0}.`;

    default:
      return `Report includes ${summary.total || summary.totalOrders || 0} entries.`;
  }
};

export default generateAISummary;