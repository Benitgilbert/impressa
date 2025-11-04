import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

function TopOrderedProductsTable() {
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
  }, []);

  if (loading) return <div className="p-4">Loading top products...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Most Ordered Products</h3>
      <div className="space-y-3">
        {products.map((product, idx) => (
          <div 
            key={product._id} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                idx === 0 ? 'bg-yellow-500' :
                idx === 1 ? 'bg-gray-400' :
                idx === 2 ? 'bg-orange-400' :
                'bg-blue-500'
              }`}>
                #{idx + 1}
              </div>
              <div>
                <p className="font-medium text-gray-800">{product.productName}</p>
                <p className="text-xs text-gray-500">{product.totalOrders} orders</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-800">{product.totalQuantity} units</p>
              <p className="text-xs text-gray-500">sold</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TopOrderedProductsTable;
