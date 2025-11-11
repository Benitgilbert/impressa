import { useEffect, useMemo, useState } from "react";
import api from "../utils/axiosInstance";
import ProductCreateEditModal from "./ProductCreateEditModal";

function ProductTable() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      const q = search.trim().toLowerCase();
      const next = products.filter((p) => {
        const matchesQ = q
          ? (p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
          : true;
        return matchesQ;
      });
      setFiltered(next);
      setPage(1);
    }, 200);
    return () => clearTimeout(id);
  }, [search, products]);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setMessage("❌ Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setMessage("✅ Product deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      setMessage("❌ Failed to delete product");
    }
  };

  const handleSaved = (saved) => {
    if (editing) {
      setProducts((prev) => prev.map((p) => (p._id === saved._id ? saved : p)));
      setEditing(null);
      setMessage("✅ Product updated");
    } else {
      setProducts((prev) => [saved, ...prev]);
      setCreating(false);
      setMessage("✅ Product created");
    }
  };

  const sorted = useMemo(() => {
    const s = [...filtered].sort((a, b) => {
      const av = (a[sortKey] ?? "").toString().toLowerCase();
      const bv = (b[sortKey] ?? "").toString().toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return s;
  }, [filtered, sortKey, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const setSort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded shadow w-full">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  const formatPrice = (v) => (typeof v === 'number' ? v.toLocaleString() : v);

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow w-full">
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-semibold">Product Catalog</h2>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-sm text-gray-500">{total} items</div>
            <button
              onClick={() => setCreating(true)}
              className="inline-flex items-center justify-center px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 shadow"
            >
              + Add Product
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-3 text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{message}</div>
      )}

      <div className="flex flex-wrap gap-3 mb-3 items-center">
        <input
          type="text"
          placeholder="Search name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[880px] w-full text-sm text-left border">
          <thead className="bg-gray-100">
            <tr>
              <th onClick={() => setSort("name")} className="p-2 cursor-pointer select-none">Name {sortKey === "name" && (sortDir === "asc" ? "▲" : "▼")}</th>
              <th onClick={() => setSort("price")} className="p-2 cursor-pointer select-none">Price {sortKey === "price" && (sortDir === "asc" ? "▲" : "▼")}</th>
              <th onClick={() => setSort("stock")} className="p-2 cursor-pointer select-none">Stock {sortKey === "stock" && (sortDir === "asc" ? "▲" : "▼")}</th>
              <th className="p-2">Image</th>
              <th className="p-2">Customization</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">No products match your filters.</td>
              </tr>
            )}
            {pageItems.map((p, idx) => (
              <tr key={p._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="p-2">
                  <div className="font-medium text-gray-800">{p.name}</div>
                  <div className="text-xs text-gray-500 line-clamp-1 sm:line-clamp-2">{p.description}</div>
                </td>
                <td className="p-2">{formatPrice(p.price)}</td>
                <td className="p-2">{p.stock ?? '-'}</td>
                <td className="p-2">
                  {p.image ? (
                    <img src={p.image} alt="" className="h-10 w-10 object-cover rounded" />
                  ) : (
                    <div className="h-10 w-10 bg-gray-100 border rounded"></div>
                  )}
                </td>
                <td className="p-2">
                  {p.customizable ? (
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(p.customizationOptions) && p.customizationOptions.length > 0 ? (
                        p.customizationOptions.map((opt) => (
                          <span key={opt} className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 border text-gray-700">
                            {opt}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">enabled</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(p)}
                      className="inline-flex items-center px-2.5 py-1.5 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="inline-flex items-center px-2.5 py-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50 text-xs"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-500">Page {page} of {totalPages}</div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Rows per page</label>
          <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }} className="px-2 py-1 border rounded text-sm">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <div className="flex items-center gap-2 ml-2">
            <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={`px-3 py-1 rounded border text-sm ${page === 1 ? "text-gray-400 border-gray-200" : "hover:bg-gray-50"}`}>Prev</button>
            <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={`px-3 py-1 rounded border text-sm ${page === totalPages ? "text-gray-400 border-gray-200" : "hover:bg-gray-50"}`}>Next</button>
          </div>
        </div>
      </div>

      {(creating || editing) && (
        <ProductCreateEditModal
          product={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

export default ProductTable;


