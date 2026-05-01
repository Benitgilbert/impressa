import { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { FaUserPlus, FaCheck, FaEye } from "react-icons/fa";
import { Link } from "react-router-dom";

function PendingApprovalsWidget({ refreshKey }) {
    const [approvals, setApprovals] = useState([]);
    const [stats, setStats] = useState({ pending: 0, total: 0, active: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get("/dashboard/analytics");
                setApprovals(res.data.pendingSellerApprovals || []);
                setStats(res.data.sellerStats || { pending: 0, total: 0, active: 0 });
            } catch (err) {
                console.error("Failed to fetch pending approvals:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refreshKey]);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-cream-100 dark:border-charcoal-700 p-6 h-full">
                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-4">Pending Approvals</h3>
                <div className="animate-pulse h-40 bg-gray-100 dark:bg-charcoal-700 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-cream-100 dark:border-charcoal-700 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white flex items-center gap-2">
                    <FaUserPlus className="text-terracotta-500" />
                    Pending Seller Approvals
                </h3>
                {stats.pending > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                        {stats.pending} pending
                    </span>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                <div className="p-2 bg-gray-50 dark:bg-charcoal-700/50 rounded-lg">
                    <span className="block text-lg font-black text-charcoal-800 dark:text-white">{stats.total}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">Total</span>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                    <span className="block text-lg font-black text-green-600 dark:text-green-400">{stats.active}</span>
                    <span className="text-[10px] uppercase font-bold text-green-600/70 dark:text-green-400/70 tracking-wider">Active</span>
                </div>
                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                    <span className="block text-lg font-black text-yellow-600 dark:text-yellow-400">{stats.pending}</span>
                    <span className="text-[10px] uppercase font-bold text-yellow-600/70 dark:text-yellow-400/70 tracking-wider">Pending</span>
                </div>
            </div>

            {approvals.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                        <FaCheck className="text-green-600 dark:text-green-400 text-xl" />
                    </div>
                    <p className="font-medium text-charcoal-800 dark:text-white">All caught up!</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No pending approvals</p>
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[220px] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-charcoal-600">
                        {approvals.map((seller) => (
                            <div key={seller.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-charcoal-700/50 hover:bg-gray-100 dark:hover:bg-charcoal-700 transition-colors">
                                <div className="min-w-0">
                                    <p className="font-semibold text-charcoal-800 dark:text-white text-sm truncate">{seller.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{seller.storeName || 'No store name'}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-mono text-gray-400 bg-white dark:bg-charcoal-600 px-1.5 py-0.5 rounded border border-gray-100 dark:border-charcoal-500">
                                        {formatDate(seller.createdAt)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-center pt-3 border-t border-gray-100 dark:border-charcoal-700">
                        <Link to="/admin/sellers" className="inline-flex items-center gap-2 text-sm font-medium text-terracotta-500 hover:text-terracotta-600 transition-colors">
                            <FaEye /> View All Sellers
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}

export default PendingApprovalsWidget;
