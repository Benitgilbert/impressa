import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaFileExport, FaEye, FaTrash } from "react-icons/fa";
import api from "../../utils/axiosInstance";
import toast from "react-hot-toast";

const AdminOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get("/orders");
            // Handle both structured {success, orders} and legacy array responses
            const ordersList = data.orders || (Array.isArray(data) ? data : (data.data || []));
            
            // Map grandTotal to totalAmount if missing for UI compatibility
            const normalizedOrders = ordersList.map(o => ({
                ...o,
                totalAmount: o.totalAmount ?? o.grandTotal ?? 0
            }));

            setOrders(normalizedOrders);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this order?")) return;
        try {
            await api.delete(`/orders/${id}`);
            toast.success("Order deleted");
            fetchOrders();
        } catch (error) {
            toast.error("Failed to delete order");
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-charcoal-900 dark:text-white">Order Management</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Track and process customer orders across the platform</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-gray-300 px-5 py-2.5 rounded-xl font-bold border border-cream-200 dark:border-charcoal-700 hover:bg-cream-50 transition-all shadow-sm">
                                <FaFileExport /> Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="mb-6 bg-white dark:bg-charcoal-800 p-4 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 flex flex-col lg:flex-row gap-4 justify-between items-center">
                        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
                            <div className="relative w-full md:w-80">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search order ID or customer..."
                                    className="w-full pl-11 pr-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-sm text-charcoal-800 dark:text-white outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-transparent rounded-xl text-sm font-bold text-charcoal-800 dark:text-white outline-none cursor-pointer"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Showing: <span className="text-charcoal-900 dark:text-white">{filteredOrders.length} Orders</span>
                        </div>
                    </div>

                    {/* Content Table */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal-500 dark:text-charcoal-400 font-bold uppercase tracking-widest text-[10px]">Syncing Orders...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Order ID</th>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Total</th>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {filteredOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                                                <td className="px-6 py-4 font-mono font-black text-terracotta-500">
                                                    #{order.id.slice(-8).toUpperCase()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-charcoal-900 dark:text-white">{order.user?.name || "Guest"}</div>
                                                    <div className="text-[10px] text-gray-400">{order.user?.email || "No email"}</div>
                                                </td>
                                                <td className="px-6 py-4 font-black text-charcoal-900 dark:text-white">
                                                    RWF {order.totalAmount?.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                        order.status === 'delivered' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' :
                                                        order.status === 'pending' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20' :
                                                        order.status === 'cancelled' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' :
                                                        'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 text-xs">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-cream-50 dark:bg-charcoal-700 text-charcoal-600 dark:text-gray-300 hover:bg-terracotta-500 hover:text-white transition-all"
                                                            title="View Details"
                                                        >
                                                            <FaEye size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(order.id)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-cream-50 dark:bg-charcoal-700 text-charcoal-600 dark:text-gray-300 hover:bg-red-500 hover:text-white transition-all"
                                                            title="Delete"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminOrders;
