import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/axiosInstance";
import {
    FaSearch, FaFilter, FaEye, FaChevronLeft, FaChevronRight, FaBox
} from "react-icons/fa";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchOrders = useCallback(async (isPolling = false) => {
        if (!isPolling) setLoading(true);
        try {
            const params = {
                page,
                limit: 10,
                status: statusFilter !== "all" ? statusFilter : undefined,
                search: debouncedSearch
            };
            const { data } = await api.get("/orders", { params });
            setOrders(data.orders);
            setTotalPages(data.pages);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            setLoading(false);
        }
    }, [page, statusFilter, debouncedSearch]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(() => fetchOrders(true), 10000); // 10s polling
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const getStatusBadge = (status) => {
        const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize";
        switch (status) {
            case "pending":
                return `${baseClasses} bg-sand-100 text-sand-700 dark:bg-sand-900/20 dark:text-sand-400`;
            case "processing":
                return `${baseClasses} bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400`;
            case "shipped":
                return `${baseClasses} bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400`;
            case "delivered":
                return `${baseClasses} bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400`;
            case "cancelled":
                return `${baseClasses} bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400`;
            case "refunded":
                return `${baseClasses} bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-300`;
            default:
                return `${baseClasses} bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-300`;
        }
    };

    return (
        <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Page Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">
                            Order Management
                        </h1>
                        <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">
                            Track and manage customer orders
                        </p>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {/* Filters & Search */}
                        <div className="p-4 lg:p-6 border-b border-cream-200 dark:border-charcoal-700">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                                {/* Search */}
                                <div className="relative flex-1 max-w-md">
                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by ID, Customer Name/Email..."
                                        className="w-full pl-11 pr-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-sm text-charcoal-800 dark:text-white placeholder:text-charcoal-400 outline-none transition-colors"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>

                                {/* Status Filter */}
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 rounded-xl border border-cream-200 dark:border-charcoal-600">
                                    <FaFilter className="text-charcoal-400 text-sm" />
                                    <select
                                        className="bg-transparent text-sm text-charcoal-800 dark:text-white outline-none cursor-pointer"
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            setPage(1);
                                        }}
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Orders Table - Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-cream-50 dark:bg-charcoal-900">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Payment</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-charcoal-500 dark:text-charcoal-400">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Loading orders...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center">
                                                <FaBox className="text-4xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3" />
                                                <p className="text-charcoal-500 dark:text-charcoal-400">No orders found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-sm text-charcoal-600 dark:text-charcoal-300">
                                                        #{order.publicId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-300">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                        order.orderType === 'pos' 
                                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800' 
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                                    }`}>
                                                        {order.orderType === 'pos' ? 'POS' : 'Online'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-charcoal-800 dark:text-white">
                                                        {order.customer?.name || order.guestInfo?.name || "Guest"}
                                                    </div>
                                                    <div className="text-xs text-charcoal-500 dark:text-charcoal-400">
                                                        {order.customer?.email || order.guestInfo?.email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-charcoal-800 dark:text-white">
                                                    {(order.grandTotal || order.totals?.grandTotal)?.toLocaleString()} Rwf
                                                </td>
                                                <td className="px-6 py-4 text-sm text-charcoal-500 dark:text-charcoal-400 capitalize">
                                                    {order.payment?.method?.replace("_", " ") || order.paymentMethod?.replace("_", " ")}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={getStatusBadge(order.status)}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Link
                                                        to={`/admin/orders/${order.id}`}
                                                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-terracotta-500 hover:bg-terracotta-50 dark:hover:bg-terracotta-900/20 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <FaEye />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Orders Card List - Mobile */}
                        <div className="md:hidden divide-y divide-cream-100 dark:divide-charcoal-700">
                            {loading ? (
                                <div className="p-8 text-center text-charcoal-500">
                                    <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                    Loading orders...
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="p-8 text-center">
                                    <FaBox className="text-4xl text-charcoal-300 mx-auto mb-3" />
                                    <p className="text-charcoal-500">No orders found</p>
                                </div>
                            ) : (
                                orders.map((order) => (
                                    <div key={order.id} className="p-4 hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-sm text-charcoal-600 dark:text-charcoal-300">
                                                        #{order.publicId}
                                                    </span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                                        order.orderType === 'pos' 
                                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800' 
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                                    }`}>
                                                        {order.orderType === 'pos' ? 'POS' : 'Online'}
                                                    </span>
                                                </div>
                                                <p className="font-medium text-charcoal-800 dark:text-white">
                                                    {order.customer?.name || order.guestInfo?.name || "Guest"}
                                                </p>
                                            </div>
                                            <span className={getStatusBadge(order.status)}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <div>
                                                <span className="text-charcoal-500 dark:text-charcoal-400">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="mx-2 text-charcoal-300">•</span>
                                                <span className="font-semibold text-charcoal-800 dark:text-white">
                                                    {(order.grandTotal || order.totals?.grandTotal)?.toLocaleString()} Rwf
                                                </span>
                                            </div>
                                            <Link
                                                to={`/admin/orders/${order.id}`}
                                                className="p-2 rounded-lg text-terracotta-500 hover:bg-terracotta-50 dark:hover:bg-terracotta-900/20"
                                            >
                                                <FaEye />
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {!loading && orders.length > 0 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 lg:p-6 border-t border-cream-200 dark:border-charcoal-700">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
                                        ${page === 1
                                            ? 'border-cream-200 dark:border-charcoal-700 bg-cream-100 dark:bg-charcoal-700 text-charcoal-400 cursor-not-allowed'
                                            : 'border-cream-200 dark:border-charcoal-600 bg-white dark:bg-charcoal-700 text-charcoal-700 dark:text-white hover:border-terracotta-500 hover:text-terracotta-500'
                                        }
                                    `}
                                >
                                    <FaChevronLeft className="text-xs" /> Previous
                                </button>
                                <span className="text-sm text-charcoal-500 dark:text-charcoal-400">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
                                        ${page === totalPages
                                            ? 'border-cream-200 dark:border-charcoal-700 bg-cream-100 dark:bg-charcoal-700 text-charcoal-400 cursor-not-allowed'
                                            : 'border-cream-200 dark:border-charcoal-600 bg-white dark:bg-charcoal-700 text-charcoal-700 dark:text-white hover:border-terracotta-500 hover:text-terracotta-500'
                                        }
                                    `}
                                >
                                    Next <FaChevronRight className="text-xs" />
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
    );
};

export default AdminOrders;
