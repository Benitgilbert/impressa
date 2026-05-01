import { useState, useEffect, useCallback } from "react";
import api from "../utils/axiosInstance";
import { FaCheck, FaCheckDouble, FaTrash, FaBell, FaInfoCircle, FaBox, FaMoneyBillWave, FaUserCheck, FaExclamationTriangle } from "react-icons/fa";

const SellerNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    const fetchNotifications = useCallback(async (isPolling = false) => {
        try {
            if (!isPolling) setLoading(true);
            const res = await api.get(`/notifications?unreadOnly=${filter === 'unread'}`);
            if (res.data.success) { setNotifications(res.data.data); }
        } catch (error) { console.error("Failed to fetch notifications:", error); }
        finally { if (!isPolling) setLoading(false); }
    }, [filter]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(() => fetchNotifications(true), 5000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) { console.error("Failed to mark as read:", error); }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.put("/notifications/mark-all-read");
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) { console.error("Failed to mark all as read:", error); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this notification?")) return;
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) { console.error("Failed to delete notification:", error); }
    };

    const handleClearAll = async () => {
        if (!window.confirm("Clear ALL your notifications? This cannot be undone.")) return;
        try {
            await api.delete("/notifications");
            setNotifications([]);
        } catch (error) { console.error("Failed to clear notifications:", error); }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'order_placed':
            case 'order_status': return <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-500"><FaBox /></div>;
            case 'payout_processed':
            case 'payout_rejected': return <div className="w-10 h-10 rounded-full bg-sage-100 dark:bg-sage-900/20 flex items-center justify-center text-sage-500"><FaMoneyBillWave /></div>;
            case 'product_approved': return <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-500"><FaCheckDouble /></div>;
            case 'seller_verification': return <div className="w-10 h-10 rounded-full bg-terracotta-100 dark:bg-terracotta-900/20 flex items-center justify-center text-terracotta-500"><FaUserCheck /></div>;
            case 'violation_report': return <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500"><FaExclamationTriangle /></div>;
            default: return <div className="w-10 h-10 rounded-full bg-charcoal-100 dark:bg-charcoal-700 flex items-center justify-center text-charcoal-500"><FaInfoCircle /></div>;
        }
    };

    return (
        <main className="flex-1 p-4 lg:p-6 max-w-[1200px] w-full mx-auto">
                    {/* Header with Filters & Actions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Inbox</h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Manage system alerts and updates</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="p-1 bg-white dark:bg-charcoal-800 rounded-xl border border-cream-200 dark:border-charcoal-700 flex">
                                <button onClick={() => setFilter('all')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === 'all' ? 'bg-cream-100 dark:bg-charcoal-600 text-charcoal-900 dark:text-white shadow-sm' : 'text-charcoal-500 hover:text-charcoal-700 dark:text-charcoal-400 dark:hover:text-charcoal-200'}`}>
                                    All
                                </button>
                                <button onClick={() => setFilter('unread')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === 'unread' ? 'bg-cream-100 dark:bg-charcoal-600 text-charcoal-900 dark:text-white shadow-sm' : 'text-charcoal-500 hover:text-charcoal-700 dark:text-charcoal-400 dark:hover:text-charcoal-200'}`}>
                                    Unread
                                </button>
                            </div>
                            <div className="h-8 w-px bg-cream-300 dark:bg-charcoal-600 hidden md:block"></div>
                            <button onClick={handleMarkAllAsRead} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-terracotta-600 hover:bg-terracotta-50 dark:hover:bg-terracotta-900/10 rounded-xl transition-colors">
                                <FaCheckDouble /> Mark All Read
                            </button>
                            <button onClick={handleClearAll} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
                                <FaTrash /> Clear All
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden min-h-[400px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-[400px]">
                                <div className="w-12 h-12 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-charcoal-500 dark:text-charcoal-400">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                                <div className="w-20 h-20 bg-cream-100 dark:bg-charcoal-700 rounded-full flex items-center justify-center text-charcoal-300 dark:text-charcoal-600 mb-4">
                                    <FaBell className="text-4xl" />
                                </div>
                                <h3 className="text-xl font-bold text-charcoal-800 dark:text-white mb-2">All Caught Up!</h3>
                                <p className="text-charcoal-500 dark:text-charcoal-400 max-w-sm">You have no new notifications. Check back later for updates on orders, payouts, and system alerts.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                {notifications.map(n => (
                                    <div key={n.id} className={`group p-6 flex gap-4 transition-colors hover:bg-cream-50 dark:hover:bg-charcoal-700/50 ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/5' : ''}`}>
                                        <div className="shrink-0 pt-1">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-base truncate pr-4 ${!n.isRead ? 'font-bold text-charcoal-900 dark:text-white' : 'font-medium text-charcoal-700 dark:text-gray-200'}`}>
                                                    {n.title}
                                                </h4>
                                                <span className="text-xs text-charcoal-400 whitespace-nowrap shrink-0">
                                                    {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-charcoal-600 dark:text-charcoal-400 leading-relaxed mb-3">{n.message}</p>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!n.isRead && (
                                                    <button onClick={() => handleMarkAsRead(n.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors">
                                                        <FaCheck /> Mark as Read
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(n.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-charcoal-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                    <FaTrash /> Delete
                                                </button>
                                            </div>
                                        </div>
                                        {!n.isRead && (
                                            <div className="shrink-0 pt-3">
                                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm ring-4 ring-blue-100 dark:ring-blue-900/20"></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
        </main>
    );
};

export default SellerNotifications;
