const convertToCSV = (orders, expenses = []) => {
  const orderHeaders = ["Public ID", "Customer", "Date", "Items", "Total", "Status"];
  const orderRows = orders.map(order => [
    order.publicId || order.id.toString(),
    order.customer?.name || (order.guestInfo ? (typeof order.guestInfo === 'string' ? JSON.parse(order.guestInfo).name : order.guestInfo.name) : "Guest"),
    new Date(order.createdAt).toLocaleDateString(),
    order.items?.map(i => i.productName).join("; ") || "N/A",
    order.grandTotal?.toString() || "0",
    order.status
  ]);

  let csvContent = [orderHeaders, ...orderRows].map(row => row.join(",")).join("\n");

  if (expenses.length > 0) {
    csvContent += "\n\nEXPENSES\n";
    const expenseHeaders = ["Description", "Category", "Date", "Amount", "Recorded By"];
    const expenseRows = expenses.map(exp => [
      exp.description,
      exp.category,
      new Date(exp.date).toLocaleDateString(),
      exp.amount.toString(),
      exp.user?.name || "System"
    ]);
    csvContent += [expenseHeaders, ...expenseRows].map(row => row.join(",")).join("\n");
  }

  return csvContent;
};

export default convertToCSV;