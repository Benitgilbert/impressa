import React, { useState, useEffect } from "react";
import { FaChartLine, FaWallet, FaArrowUp, FaSync, FaDownload } from "react-icons/fa";
import api from "../../utils/axiosInstance";
import toast from "react-hot-toast";

const FinanceDashboard = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingPayments: 0,
        netProfit: 0,
        monthlyGrowth: 0,
        transactions: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/admin/finance/stats");
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch finance stats:", error);
            toast.error("Failed to load financial data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-charcoal-900 dark:text-white">Finance Dashboard</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time financial performance and transaction tracking</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={fetchStats}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-gray-400 hover:text-terracotta-500 border border-cream-200 dark:border-charcoal-700 transition-all shadow-sm"
                                title="Sync Data"
                            >
                                <FaSync className={loading ? "animate-spin" : ""} />
                            </button>
                            <button className="flex items-center gap-2 bg-charcoal-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-charcoal-800 transition-all shadow-lg">
                                <FaDownload /> Generate Report
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: "Total Revenue", value: stats.totalRevenue, icon: <FaChartLine />, color: "text-blue-500", bg: "bg-blue-50" },
                            { label: "Pending Payments", value: stats.pendingPayments, icon: <FaWallet />, color: "text-orange-500", bg: "bg-orange-50" },
                            { label: "Net Profit", value: stats.netProfit, icon: <FaArrowUp />, color: "text-sage-500", bg: "bg-sage-50" },
                            { label: "Monthly Growth", value: `${stats.monthlyGrowth}%`, icon: <FaChartLine />, color: "text-terracotta-500", bg: "bg-terracotta-50" }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700">
                                <div className={`w-12 h-12 ${stat.bg} dark:bg-charcoal-700 rounded-xl flex items-center justify-center ${stat.color} mb-4 text-xl`}>
                                    {stat.icon}
                                </div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-black text-charcoal-900 dark:text-white">
                                    {typeof stat.value === 'number' ? `RWF ${stat.value.toLocaleString()}` : stat.value}
                                </h3>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Transactions */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                                <div className="p-6 border-b border-cream-100 dark:border-charcoal-700 flex justify-between items-center">
                                    <h3 className="font-black text-charcoal-900 dark:text-white uppercase tracking-wider text-sm">Recent Transactions</h3>
                                    <button className="text-xs font-bold text-terracotta-500 hover:underline">View All</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-cream-50 dark:bg-charcoal-900">
                                            <tr>
                                                <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Transaction</th>
                                                <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                            {stats.transactions && stats.transactions.length > 0 ? stats.transactions.map((t, idx) => (
                                                <tr key={idx} className="hover:bg-cream-50/50 dark:hover:bg-charcoal-700/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-charcoal-900 dark:text-white">{t.type || "Transaction"}</div>
                                                        <div className="text-[10px] text-gray-400 uppercase">ID: {t.id?.slice(-8) || "N/A"}</div>
                                                    </td>
                                                    <td className="px-6 py-4 font-black text-charcoal-900 dark:text-white">RWF {t.amount?.toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            t.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                                        }`}>
                                                            {t.status || "pending"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(t.date || Date.now()).toLocaleDateString()}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">No recent transactions found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Revenue Breakdown / Placeholder for Chart */}
                        <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 p-6 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-cream-50 dark:bg-charcoal-700 rounded-full flex items-center justify-center text-terracotta-500 text-3xl mb-4">
                                <FaChartLine />
                            </div>
                            <h3 className="font-black text-charcoal-900 dark:text-white uppercase tracking-wider text-sm mb-2">Revenue Insights</h3>
                            <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">Detailed revenue breakdown charts and forecasting will appear here.</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default FinanceDashboard;
