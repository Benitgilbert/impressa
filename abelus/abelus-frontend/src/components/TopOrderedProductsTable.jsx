import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

function TopOrderedProductsTable({ refreshKey }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const res = await axios.get("/analytics/top-products");
        setProducts(res.data);
      } catch (err) {
        console.error("Failed to fetch top products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, [refreshKey]);

  if (loading) return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="animate-pulse text-gray-400 dark:text-gray-500 text-sm">Loading top products...</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-4">Most Ordered Products</h3>
      <div className="flex flex-col gap-3">
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
            No product data available.
          </div>
        )}
        {products.map((product, idx) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-charcoal-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-charcoal-700 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0
                ${idx === 0 ? "bg-yellow-500 shadow-md shadow-yellow-500/30" :
                    idx === 1 ? "bg-gray-400 shadow-md shadow-gray-400/30" :
                      idx === 2 ? "bg-orange-400 shadow-md shadow-orange-400/30" :
                        "bg-blue-500 dark:bg-blue-600"}`}
              >
                #{idx + 1}
              </div>
              <div>
                <p className="font-medium text-charcoal-800 dark:text-white text-sm line-clamp-1">{product.productName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{product.totalOrders} orders</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-charcoal-800 dark:text-white text-sm">{product.totalQuantity} units</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">sold</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TopOrderedProductsTable;
