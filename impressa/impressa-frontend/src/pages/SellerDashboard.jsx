import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaChartLine, FaDollarSign, FaBox, FaShoppingCart, FaStar,
    FaExclamationTriangle, FaClock, FaCheckCircle, FaArrowUp,
    FaArrowDown, FaEye, FaMoneyBillWave
} from 'react-icons/fa';
import api from '../utils/axiosInstance';
import Topbar from '../components/Topbar';
import SellerSidebar from '../components/SellerSidebar';
import AdminChatBot from '../components/AdminChatBot';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function SellerDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        totalProducts: 0,
        activeProducts: 0,
        pendingProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalEarnings: 0,
        availableBalance: 0,
        pendingPayouts: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [revenueData, setRevenueData] = useState({ labels: [], datasets: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(() => fetchDashboardData(true), 15000); // 15s polling
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async (isPolling = false) => {
        try {
            if (!isPolling) setLoading(true);

            // Get user info (only once effectively, but cheap)
            if (!user) {
                const userRes = await api.get('/auth/me');
                setUser(userRes.data);
            }

            // Get seller's products stats
            const productsRes = await api.get('/products/seller/my-products?limit=5');
            if (productsRes.data.success) {
                setTopProducts(productsRes.data.data.slice(0, 5));
                setStats(prev => ({
                    ...prev,
                    totalProducts: productsRes.data.pagination?.total || productsRes.data.data.length
                }));
            }

            // Get earnings summary
            try {
                const earningsRes = await api.get('/commissions/my-earnings');
                if (earningsRes.data.success) {
                    const earningsData = earningsRes.data.data || {};
                    const totalEarnings = (earningsData.totalPaid || 0) + (earningsData.availableBalance || 0);

                    setStats(prev => ({
                        ...prev,
                        totalEarnings: totalEarnings,
                        availableBalance: earningsData.availableBalance || 0,
                        pendingPayouts: earningsData.pendingPayouts || 0
                    }));
                }
            } catch (err) { }

            // Get recent orders for this seller
            try {
                const ordersRes = await api.get('/orders/seller/my-orders?limit=5');
                if (ordersRes.data.success) {
                    const allOrders = ordersRes.data.data || [];
                    setRecentOrders(allOrders.slice(0, 5));
                    setStats(prev => ({
                        ...prev,
                        totalOrders: ordersRes.data.pagination?.total || allOrders.length || 0
                    }));
                }
            } catch (err) { }

            // Get revenue data (Sales Chart) - Only fetch initially to save bandwidth
            if (!isPolling) {
                try {
                    const revenueRes = await api.get('/analytics/seller/revenue?period=day');
                    const data = Array.isArray(revenueRes.data) ? revenueRes.data : [];
                    const labels = data.map(item => item.label);
                    const revenues = data.map(item => item.revenue);

                    setRevenueData({
                        labels,
                        datasets: [
                            {
                                label: 'Sales Revenue',
                                data: revenues,
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                fill: true,
                                tension: 0.4,
                                pointRadius: 4,
                                pointHoverRadius: 6
                            }
                        ]
                    });
                } catch (err) { }
            }

        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    const formatCurrency = (amount) => `RWF ${(amount || 0).toLocaleString()}`;
    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
            processing: { class: 'bg-blue-100 text-blue-800', text: 'Processing' },
            shipped: { class: 'bg-indigo-100 text-indigo-800', text: 'Shipped' },
            delivered: { class: 'bg-green-100 text-green-800', text: 'Delivered' },
            cancelled: { class: 'bg-red-100 text-red-800', text: 'Cancelled' }
        };
        const badge = badges[status?.toLowerCase()] || badges.pending;
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>{badge.text}</span>;
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' }, // Chart.js grid doesn't automatically support dark mode via tailwind classes, would need js logic. Keeping light for now or can use "rgba(0,0,0,0.1)"
                ticks: { fontSize: 10 }
            },
            x: {
                grid: { display: false },
                ticks: { fontSize: 10 }
            }
        },
        maintainAspectRatio: false
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <SellerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                    <Topbar onMenuClick={() => setSidebarOpen(true)} title="Dashboard" />
                    <main className="flex-1 p-8 flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading dashboard...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <SellerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <Topbar onMenuClick={() => setSidebarOpen(true)} title="Dashboard" />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Welcome Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome back, {user?.name || 'Seller'}!</h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your store today.</p>
                            </div>
                            <Link
                                to="/seller/products"
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                            >
                                <FaBox className="text-sm" /> Manage Products
                            </Link>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Total Earnings */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-all">
                                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                                    <FaDollarSign size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earnings</p>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.totalEarnings)}</h3>
                                </div>
                            </div>

                            {/* Available Balance */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-all">
                                <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                    <FaMoneyBillWave size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Balance</p>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.availableBalance)}</h3>
                                </div>
                            </div>

                            {/* Total Orders */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-all">
                                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                    <FaShoppingCart size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalOrders}</h3>
                                </div>
                            </div>

                            {/* Total Products */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-all">
                                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                    <FaBox size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</p>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalProducts}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Sales Chart Section */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 transition-colors">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Sales Overview (Last 30 Days)</h3>
                            <div className="h-72 w-full">
                                {revenueData.labels.length > 0 ? (
                                    <Line options={chartOptions} data={revenueData} />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                        <FaChartLine size={48} className="mb-2 opacity-20" />
                                        <p>No sales data available for this period</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Recent Orders */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col transition-colors">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
                                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <FaShoppingCart className="text-gray-400 text-sm" /> Recent Orders
                                    </h3>
                                    <Link to="/seller/orders" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">View All</Link>
                                </div>
                                <div className="p-0 overflow-x-auto">
                                    {recentOrders.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">No orders yet</div>
                                    ) : (
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 font-medium">Order ID</th>
                                                    <th className="px-6 py-3 font-medium">Customer</th>
                                                    <th className="px-6 py-3 font-medium">Total</th>
                                                    <th className="px-6 py-3 font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {recentOrders.map(order => (
                                                    <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">#{order.publicId}</td>
                                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{order.user?.name || order.guestInfo?.name || 'Customer'}</td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatCurrency(order.totals?.grandTotal)}</td>
                                                        <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            {/* Top Products */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col transition-colors">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
                                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <FaBox className="text-gray-400 text-sm" /> Your Products
                                    </h3>
                                    <Link to="/seller/products" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">View All</Link>
                                </div>
                                <div className="p-0">
                                    {topProducts.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">No products found</div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {topProducts.map(product => (
                                                <div key={product._id} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 overflow-hidden flex-shrink-0">
                                                        {product.image ? (
                                                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-gray-400"><FaBox /></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-gray-900 dark:text-white truncate">{product.name}</h4>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(product.price)}</p>
                                                    </div>
                                                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                                                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <AdminChatBot storageKey="sellerChatMessages" title="Seller Assistant" />
            </div>
        </div>
    );

}
