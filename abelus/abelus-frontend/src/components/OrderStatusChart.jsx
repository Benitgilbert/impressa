import { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function OrderStatusChart({ refreshKey }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get("/dashboard/analytics");
                const statusCounts = res.data.statusCounts || [];

                // Map status to colors
                const statusColors = {
                    pending: '#f59e0b',    // amber-500
                    processing: '#3b82f6', // blue-500
                    shipped: '#8b5cf6',    // violet-500
                    delivered: '#10b981',  // emerald-500
                    cancelled: '#ef4444',  // red-500
                    refunded: '#6b7280'    // gray-500
                };

                const labels = statusCounts.map(s => s.id?.charAt(0).toUpperCase() + s.id?.slice(1) || 'Unknown');
                const values = statusCounts.map(s => s.count);
                const colors = statusCounts.map(s => statusColors[s.id] || '#9ca3af');

                setData({
                    labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                });
            } catch (err) {
                console.error("Failed to fetch status data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refreshKey]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    },
                    color: document.documentElement.className.includes('dark') ? '#e2e8f0' : '#475569'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                padding: 12,
                titleFont: { size: 13 },
                bodyFont: { size: 12 },
                callbacks: {
                    label: function (context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                        return `${context.label}: ${context.parsed} (${percentage}%)`;
                    }
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-cream-100 dark:border-charcoal-700 p-6 h-full">
                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-4">Order Status</h3>
                <div className="animate-pulse h-[220px] bg-gray-100 dark:bg-charcoal-700 rounded-xl"></div>
            </div>
        );
    }

    if (!data || data.labels.length === 0) {
        return (
            <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-cream-100 dark:border-charcoal-700 p-6 h-full">
                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-4">Order Status Distribution</h3>
                <div className="flex flex-col items-center justify-center h-[200px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-charcoal-700/50 rounded-lg border border-dashed border-gray-200 dark:border-charcoal-600">
                    <p className="font-medium">No orders yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-cream-100 dark:border-charcoal-700 p-6 h-full">
            <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-6">Order Status Distribution</h3>
            <div className="h-[220px]">
                <Pie data={data} options={options} />
            </div>
        </div>
    );
}

export default OrderStatusChart;
