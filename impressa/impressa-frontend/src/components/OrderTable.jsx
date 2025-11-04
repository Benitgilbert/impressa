import { useEffect, useState } from "react";
import axios from "axios";

function OrderTable({ readOnly = false }) {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState({});

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

const handleStatusChange = async (orderId, newStatus) => {
  try {
    const token = localStorage.getItem("authToken");
    await axios.put(
      `http://localhost:5000/api/orders/${orderId}/status`, // ✅ fixed path
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchOrders(); // Refresh after update
  } catch (err) {
    console.error("Failed to update status:", err);
  }
};

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">All Orders</h2>
      <table className="w-full text-sm text-left border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Order ID</th>
            <th className="p-2">Customer</th>
            <th className="p-2">Product</th>
            <th className="p-2">Status</th>
            <th className="p-2">Date</th>
            <th className="p-2">{readOnly ? "Status" : "Actions"}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id} className="border-t">
              <td className="p-2">{order._id.slice(-6)}</td>
              <td className="p-2">{order.customer?.name || "N/A"}</td>
              <td className="p-2">{order.product?.name || "N/A"}</td>
              <td className="p-2 capitalize">{order.status}</td>
              <td className="p-2">{new Date(order.createdAt).toLocaleDateString()}</td>
              <td className="p-2">
                {readOnly ? (
                  <span className="text-sm capitalize">{order.status}</span>
                ) : (
                  <>
                    <select
                      value={statusUpdate[order._id] || order.status}
                      onChange={(e) =>
                        setStatusUpdate({ ...statusUpdate, [order._id]: e.target.value })
                      }
                      className="border px-2 py-1 rounded text-sm"
                    >
                      {["pending", "approved", "in-production", "ready", "delivered", "cancelled"].map(
                        (status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        )
                      )}
                    </select>
                    <button
                      onClick={() => handleStatusChange(order._id, statusUpdate[order._id])}
                      className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Update
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


export default OrderTable;