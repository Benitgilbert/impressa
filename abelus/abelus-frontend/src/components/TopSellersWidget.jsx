import { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { FaStore, FaMedal, FaChartLine } from "react-icons/fa";

function TopSellersWidget({ refreshKey }) {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get("/dashboard/analytics");
                setSellers(res.data.topSellers || []);
            } catch (err) {
                console.error("Failed to fetch top sellers:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refreshKey]);

    const getMedalColor = (index) => {
        switch (index) {
            case 0: return 'text-yellow-500 drop-shadow-sm'; // Gold
            case 1: return 'text-gray-400 drop-shadow-sm'; // Silver
            case 2: return 'text-amber-600 drop-shadow-sm'; // Bronze
            default: return 'text-gray-300 dark:text-charcoal-600';
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-cream-100 dark:border-charcoal-700 p-6 h-full">
                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-4">Top Sellers</h3>
                <div className="animate-pulse h-40 bg-gray-100 dark:bg-charcoal-700 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-cream-100 dark:border-charcoal-700 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white flex items-center gap-2">
                    <FaChartLine className="text-terracotta-500" />
                    Top Sellers (30 Days)
                </h3>
            </div>

            {sellers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-charcoal-700 rounded-full flex items-center justify-center mb-3">
                        <FaStore className="text-gray-400 text-xl" />
                    </div>
                    <p className="font-medium text-charcoal-800 dark:text-white">No sales data yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Revenue data will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sellers.map((seller, idx) => (
                        <div key={seller.sellerId} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-charcoal-700/50 hover:bg-gray-100 dark:hover:bg-charcoal-700 transition-colors">
                            <div className={`text-xl flex-shrink-0 w-8 text-center ${getMedalColor(idx)}`}>
                                {idx < 3 ? <FaMedal /> : <span className="font-bold text-sm text-gray-400">#{idx + 1}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-charcoal-800 dark:text-white truncate">
                                    {seller.storeName || seller.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {seller.orders} orders
                                </p>
                            </div>
                            <div className="font-mono font-bold text-terracotta-600 dark:text-terracotta-400 whitespace-nowrap">
                                {seller.revenue?.toLocaleString()} <span className="text-[10px] text-gray-400">RWF</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TopSellersWidget;
