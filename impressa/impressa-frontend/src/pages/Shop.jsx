import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axiosInstance";
import StoreHeader from "../components/StoreHeader";
import { useCart } from "../context/CartContext";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const { addItem } = useCart();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data || []);
      } catch (e) {
        console.error("Failed to load products", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Shop</h1>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search products..." className="border rounded px-3 py-2 text-sm w-64" />
        </div>

        {loading ? (
          <div className="text-gray-500">Loading products…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <div key={p._id} className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="aspect-[4/3] object-cover" />
                ) : (
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
                )}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <Link to={`/product/${p._id}`} className="font-medium hover:text-blue-700">{p.name}</Link>
                  <div className="text-sm text-gray-600 line-clamp-2">{p.description || "No description"}</div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="text-lg font-semibold">${p.price?.toLocaleString?.() || p.price}</div>
                    <div className="flex gap-2">
                      <Link to={`/product/${p._id}`} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">View</Link>
                      <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700" onClick={()=>addItem(p,{quantity:1})} disabled={p.customizable} title={p.customizable?"Open product to customize":"Add to cart"}>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
