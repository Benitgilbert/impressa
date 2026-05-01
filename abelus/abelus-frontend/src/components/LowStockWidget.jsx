import { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { FaExclamationTriangle, FaBox } from "react-icons/fa";

function LowStockWidget({ refreshKey }) {
    const [products, setProducts] = useState([]);
    const [outOfStock, setOutOfStock] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get("/dashboard/analytics");
                setProducts(res.data.lowStockProducts || []);
                setOutOfStock(res.data.outOfStockCount || 0);
            } catch (err) {
                console.error("Failed to fetch low stock:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refreshKey]);

    const getStockClass = (stock) => {
        if (stock <= 3) return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
        if (stock <= 5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;

        // Ensure we don't have double slashes or missing slashes
        const baseUrl = process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';
        const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

        return `${baseUrl}${cleanPath}`;
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-cream-100 dark:border-charcoal-700 p-6 h-full">
                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-4">Inventory Alerts</h3>
                <div className="animate-pulse h-40 bg-gray-100 dark:bg-charcoal-700 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-cream-100 dark:border-charcoal-700 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white flex items-center gap-2">
                    <FaExclamationTriangle className="text-terracotta-500" />
                    Inventory Alerts
                </h3>
                {outOfStock > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                        {outOfStock} out of stock
                    </span>
                )}
            </div>

            {products.length === 0 && outOfStock === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                        <FaBox className="text-green-600 dark:text-green-400 text-xl" />
                    </div>
                    <p className="font-medium text-charcoal-800 dark:text-white">All stocked up!</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No low stock items</p>
                </div>
            ) : (
                <div className="space-y-3 overflow-y-auto pr-1 max-h-[300px] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-charcoal-600">
                    {products.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-charcoal-700/50 hover:bg-gray-100 dark:hover:bg-charcoal-700 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-charcoal-600 border border-gray-100 dark:border-charcoal-500 overflow-hidden flex-shrink-0">
                                    {product.image ? (
                                        <img
                                            src={getImageUrl(product.image)}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://via.placeholder.com/150?text=No+Img";
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <FaBox />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-charcoal-800 dark:text-white truncate max-w-[120px] sm:max-w-[150px]">
                                        {product.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {product.seller?.storeName || product.seller?.name || 'Unknown seller'}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStockClass(product.stock)}`}>
                                {product.stock} left
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default LowStockWidget;
