import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaEye, FaFilter, FaBox } from "react-icons/fa";
import api from "../utils/axiosInstance";
import SellerSidebar from "../components/SellerSidebar";
import Header from "../components/Header";

const SellerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");

    const fetchOrders = useCallback(async (isPolling = false) => {
        try {
            if (!isPolling) setLoading(true);
            const res = await api.get("/orders/seller/my-orders");
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            if (!isPolling) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(() => fetchOrders(true), 10000); // 10s polling
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const getStatusBadge = (status) => {
        const badges = {
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
            processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
            shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
            delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
            cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
            paid: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
        };
        const style = badges[status?.toLowerCase()] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
                {status || "Unknown"}
            </span>
        );
    };

    const filteredOrders = filterStatus === "all"
        ? orders
        : orders.filter(o => o.status === filterStatus);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
            <SellerSidebar />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Orders</h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage your customer orders</p>
                            </div>

                            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                <FaFilter className="text-gray-400 ml-2" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="border-none bg-transparent outline-none text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer pr-8 focus:ring-0"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                                Loading orders...
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center flex flex-col items-center justify-center">
                                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                                    <FaBox className="text-gray-400 dark:text-gray-500 text-3xl" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Orders Found</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-sm">Orders will appear here once customers purchase your products.</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                            <tr>
                                                <th className="px-6 py-4 font-medium text-sm">Order ID</th>
                                                <th className="px-6 py-4 font-medium text-sm">Date</th>
                                                <th className="px-6 py-4 font-medium text-sm">Source</th>
                                                <th className="px-6 py-4 font-medium text-sm">Customer</th>
                                                <th className="px-6 py-4 font-medium text-sm">Items</th>
                                                <th className="px-6 py-4 font-medium text-sm">Total</th>
                                                <th className="px-6 py-4 font-medium text-sm">Status</th>
                                                <th className="px-6 py-4 font-medium text-sm">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {filteredOrders.map(order => (
                                                <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-medium">#{order.publicId}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                            order.orderType === 'pos' 
                                                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800' 
                                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                                        }`}>
                                                            {order.orderType === 'pos' ? 'POS' : 'Online'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{order.user?.name || order.guestInfo?.name || 'Guest'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{order.items?.length || 0} items</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">RWF {order.totals?.grandTotal?.toLocaleString() || order.grandTotal?.toLocaleString()}</td>
                                                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                                                    <td className="px-6 py-4">
                                                        <Link
                                                            to={`/seller/orders/${order._id}`}
                                                            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex items-center justify-center w-fit"
                                                            title="View Details"
                                                        >
                                                            <FaEye className="text-lg" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SellerOrders;
