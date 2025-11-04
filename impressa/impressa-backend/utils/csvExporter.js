const convertToCSV = (orders) => {
  const headers = ["Order ID", "Product", "Customer", "Qty", "Status", "Date"];
  const rows = orders.map(order => [
    order._id.toString(),
    order.product?.name || "",
    order.customer?.email || "",
    order.quantity,
    order.status,
    new Date(order.createdAt).toLocaleDateString(),
  ]);

  return [headers, ...rows].map(row => row.join(",")).join("\n");
};

export default convertToCSV;