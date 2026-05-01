import { useState, useEffect, useCallback } from 'react';
import {
    FaFileAlt, FaDownload, FaStore, FaCalendarAlt,
    FaArrowUp, FaArrowDown, FaShoppingCart, FaStar, FaDollarSign
} from 'react-icons/fa';
import api from '../utils/axiosInstance';

export default function AdminSellerReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [error, setError] = useState('');

    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/sellers/performance-reports?date=${selectedMonth}`);
            if (res.data.success) {
                setReports(res.data.data);
            } else {
                setError(res.data.message || 'Failed to fetch reports');
            }
        } catch (err) {
            console.error('Fetch reports error:', err);
            setError(err.response?.data?.message || 'Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const getScoreBadge = (score) => {
        let colorClasses = 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800';
        if (score >= 90) colorClasses = 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400 border-sage-200 dark:border-sage-800';
        else if (score >= 70) colorClasses = 'bg-sand-100 text-sand-700 dark:bg-sand-900/20 dark:text-sand-400 border-sand-200 dark:border-sand-800';
        else if (score >= 50) colorClasses = 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800';

        return (
            <div className={`flex items-center gap-1 px-3 py-2 rounded-xl border ${colorClasses}`}>
                <span className="text-2xl font-bold">{score}</span>
                <span className="text-xs opacity-70">/ 100</span>
            </div>
        );
    };

    const getStatusBadge = (status) => {
        const badges = {
            excellent: { text: 'Excellent', classes: 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400' },
            good: { text: 'Good', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
            needs_improvement: { text: 'Needs Improvement', classes: 'bg-sand-100 text-sand-700 dark:bg-sand-900/20 dark:text-sand-400' },
            poor: { text: 'Poor', classes: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' }
        };
        const badge = badges[status] || badges.good;
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.classes}`}>{badge.text}</span>;
    };

    const getTrendIcon = (value) => {
        if (value > 0) return <span className="flex items-center gap-1 text-sage-600 dark:text-sage-400 text-xs font-medium"><FaArrowUp /> +{value}%</span>;
        if (value < 0) return <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-medium"><FaArrowDown /> {value}%</span>;
        return <span className="text-charcoal-400 text-xs">—</span>;
    };

    const formatCurrency = (amount) => `RWF ${(amount || 0).toLocaleString()}`;

    const exportReport = (report) => {
        const content = `
Seller Performance Report
=========================
Seller: ${report.seller.storeName}
Period: ${report.period.month}/${report.period.year}
Performance Score: ${report.performanceScore}/100

Metrics:
- Total Orders: ${report.metrics.totalOrders}
- Completed Orders: ${report.metrics.completedOrders}
- Total Revenue: RWF ${report.metrics.totalRevenue.toLocaleString()}
- Average Rating: ${report.metrics.averageRating}/5
- Avg Response Time: ${report.metrics.responseTime}h
- Avg Fulfillment Time: ${report.metrics.fulfillmentTime}h
- Return Rate: ${report.metrics.returnRate}%
        `;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${report.seller.storeName}_${report.period.month}_${report.period.year}.txt`;
        a.click();
    };

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">

                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Page Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Seller Performance Reports</h1>
                        <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Monthly performance metrics for all sellers</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Month Selector */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 rounded-xl">
                            <FaCalendarAlt className="text-terracotta-500" />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-transparent text-charcoal-800 dark:text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* Reports Grid */}
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-charcoal-500 dark:text-charcoal-400">Loading reports...</p>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-charcoal-800 rounded-2xl border border-cream-200 dark:border-charcoal-700">
                            <FaFileAlt className="text-5xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-2">No Reports Found</h3>
                            <p className="text-charcoal-500 dark:text-charcoal-400">No performance reports for this month</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {reports.map((report) => (
                                <div key={report.id} className="bg-white dark:bg-charcoal-800 rounded-2xl border border-cream-200 dark:border-charcoal-700 overflow-hidden hover:shadow-lg transition-shadow">
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between p-5 border-b border-cream-100 dark:border-charcoal-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-terracotta-100 dark:bg-terracotta-900/20 flex items-center justify-center">
                                                <FaStore className="text-xl text-terracotta-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-charcoal-800 dark:text-white">{report.seller.storeName}</h4>
                                                <span className="text-sm text-charcoal-500 dark:text-charcoal-400">{report.seller.email}</span>
                                            </div>
                                        </div>
                                        {getScoreBadge(report.performanceScore)}
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-3 gap-4 p-5">
                                        <div className="text-center p-3 bg-cream-50 dark:bg-charcoal-700 rounded-xl">
                                            <FaShoppingCart className="text-blue-500 mx-auto mb-2" />
                                            <p className="text-xl font-bold text-charcoal-800 dark:text-white">{report.metrics.totalOrders}</p>
                                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1">Orders</p>
                                            {getTrendIcon(report.trends.orders)}
                                        </div>
                                        <div className="text-center p-3 bg-cream-50 dark:bg-charcoal-700 rounded-xl">
                                            <FaDollarSign className="text-sage-500 mx-auto mb-2" />
                                            <p className="text-lg font-bold text-charcoal-800 dark:text-white">{formatCurrency(report.metrics.totalRevenue)}</p>
                                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1">Revenue</p>
                                            {getTrendIcon(report.trends.revenue)}
                                        </div>
                                        <div className="text-center p-3 bg-cream-50 dark:bg-charcoal-700 rounded-xl">
                                            <FaStar className="text-sand-500 mx-auto mb-2" />
                                            <p className="text-xl font-bold text-charcoal-800 dark:text-white">{report.metrics.averageRating}</p>
                                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1">Rating</p>
                                            {getTrendIcon(report.trends.rating)}
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="flex items-center justify-between px-5 py-4 bg-cream-50 dark:bg-charcoal-900">
                                        {getStatusBadge(report.status)}
                                        <button
                                            onClick={() => exportReport(report)}
                                            className="flex items-center gap-2 px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-sm font-medium transition-all"
                                        >
                                            <FaDownload /> Export
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
