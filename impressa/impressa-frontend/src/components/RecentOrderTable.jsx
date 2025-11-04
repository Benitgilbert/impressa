import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

function RecentOrderTable() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const res = await axios.get("/analytics/recent-orders");
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to fetch recent orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentOrders();
  }, []);

  if (loading) return <div className="p-4">Loading recent orders...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Orders</h3>
      <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Order ID</th>
            <th className="p-2">Customer</th>
            <th className="p-2">Product</th>
            <th className="p-2">Quantity</th>
            <th className="p-2">Status</th>
            <th className="p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id} className="border-t">
              <td className="p-2">{order._id.slice(-6)}</td>
              <td className="p-2">{order.customer?.name || "N/A"}</td>
              <td className="p-2">{order.product?.name || "N/A"}</td>
              <td className="p-2">{order.quantity}</td>
              <td className="p-2">
                <span className={`px-2 py-1 rounded text-xs capitalize ${
                  order.status === "delivered" ? "bg-green-100 text-green-800" :
                  order.status === "cancelled" ? "bg-red-100 text-red-800" :
                  order.status === "in-production" ? "bg-blue-100 text-blue-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {order.status}
                </span>
              </td>
              <td className="p-2">{new Date(order.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

export default RecentOrderTable;