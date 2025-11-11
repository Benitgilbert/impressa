import { useState } from "react";
import StoreHeader from "../components/StoreHeader";
import api from "../utils/axiosInstance";

export default function TrackOrder() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setResult(null);
    if (!query) return;
    try {
      setLoading(true);
      const res = await api.get(`/orders/track/${encodeURIComponent(query)}`);
      setResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || "Order not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader />
      <main className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-3">Track your order</h1>
        <form onSubmit={submit} className="flex gap-2 mb-4">
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Enter tracking ID" className="flex-1 border rounded px-3 py-2" />
          <button disabled={loading} className={`px-4 rounded text-white ${loading? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}>{loading? 'Checking…':'Check'}</button>
        </form>
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        {result && (
          <div className="bg-white rounded border p-4">
            <div className="text-sm text-gray-600">Tracking ID</div>
            <div className="font-mono">{result.publicId}</div>
            <div className="mt-2 text-sm text-gray-600">Product</div>
            <div>{result.product}</div>
            <div className="mt-2 text-sm text-gray-600">Status</div>
            <div className="font-medium capitalize">{result.status}</div>
            <div className="mt-2 text-sm text-gray-600">Placed</div>
            <div>{new Date(result.createdAt).toLocaleString()}</div>
          </div>
        )}
      </main>
    </div>
  );
}
