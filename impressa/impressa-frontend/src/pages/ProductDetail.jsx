import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import StoreHeader from "../components/StoreHeader";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customText, setCustomText] = useState("");
  const [cloudLink, setCloudLink] = useState("");
  const [cloudPassword, setCloudPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (e) {
        console.error("Failed to load product", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    addItem(product, { quantity, customText, cloudLink, cloudPassword });
    nav("/cart");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : !product ? (
          <div className="text-red-600">Product not found.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 bg-white p-4 rounded border">
            <div>
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full rounded object-cover" />
              ) : (
                <div className="aspect-[4/3] bg-gray-100 rounded flex items-center justify-center text-gray-400">No image</div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-2xl font-semibold">{product.name}</h1>
              <div className="text-gray-600">{product.description || "No description."}</div>
              <div className="text-xl font-semibold">${product.price?.toLocaleString?.() || product.price}</div>

              <div className="flex items-center gap-3 mt-2">
                <label className="text-sm text-gray-600">Quantity</label>
                <input type="number" min={1} value={quantity} onChange={(e)=>setQuantity(parseInt(e.target.value||"1"))} className="w-24 border rounded px-2 py-1" />
              </div>

              {product.customizable && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Customization</h3>
                  {product.customizationOptions?.includes("text") && (
                    <textarea value={customText} onChange={(e)=>setCustomText(e.target.value)} placeholder="Enter custom text" className="w-full border rounded px-3 py-2 text-sm" />
                  )}
                  {product.customizationOptions?.includes("cloud") && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input value={cloudLink} onChange={(e)=>setCloudLink(e.target.value)} placeholder="Cloud link (eg. Google Drive)" className="border rounded px-3 py-2 text-sm" />
                      <input value={cloudPassword} onChange={(e)=>setCloudPassword(e.target.value)} placeholder="Password (optional)" className="border rounded px-3 py-2 text-sm" />
                    </div>
                  )}
                  {!product.customizationOptions?.length && (
                    <div className="text-xs text-gray-500">This item supports customization.</div>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add to Cart</button>
                <button onClick={()=>nav("/cart")} className="px-4 py-2 border rounded hover:bg-gray-50">Go to Cart</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
