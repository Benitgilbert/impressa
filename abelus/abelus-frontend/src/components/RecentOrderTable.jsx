import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

function RecentOrderTable({ endpoint = "/analytics/recent-orders", refreshKey }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecentOrders = async (isPolling = false) => {
      try {
        if (!isPolling) setLoading(true);
        const res = await axios.get(endpoint);
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to fetch recent orders:", err?.response?.data || err.message);
        setError(err?.response?.data?.message || "Failed to load recent orders.");
      } finally {
        if (!isPolling) setLoading(false);
      }
    };

    fetchRecentOrders(!!refreshKey);
  }, [endpoint, refreshKey]);

  if (loading) return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="animate-pulse text-gray-400 dark:text-gray-500 text-sm">Loading recent orders...</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">Recent Orders</h3>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-charcoal-700 px-2 py-1 rounded-full">
          {orders.length} items
        </span>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-charcoal-600">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-charcoal-700">
              <th className="py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
              <th className="py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
              <th className="py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
              <th className="py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-charcoal-700/50">
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 dark:text-charcoal-500 text-sm">
                  No recent orders found.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-charcoal-700/30 transition-colors group">
                <td className="py-3 text-sm font-mono text-charcoal-600 dark:text-charcoal-300">
                  #{order.publicId || order.id.slice(-6).toUpperCase()}
                </td>
                <td className="py-3 text-sm text-charcoal-800 dark:text-gray-200 font-medium">
                  {order.customer?.name || order.guestInfo?.name || "Guest"}
                </td>
                <td className="py-3 text-sm text-charcoal-600 dark:text-gray-400 max-w-[150px] truncate" title={order.items?.map(i => i.productName).join(", ")}>
                  {order.items?.map(i => i.productName).join(", ") || "N/A"}
                </td>
                <td className="py-3 text-sm text-charcoal-600 dark:text-gray-400">
                  {order.items?.reduce((sum, i) => sum + i.quantity, 0) || order.quantity}
                </td>
                <td className="py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                    ${order.status === "delivered" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" :
                      order.status === "cancelled" ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" :
                        order.status === "in_production" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" :
                          order.status === "processing" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400" :
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                    }`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-3 text-sm text-gray-500 dark:text-gray-400 text-right">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentOrderTable;
