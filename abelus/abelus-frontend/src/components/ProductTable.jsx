import { useEffect, useMemo, useState } from "react";
import api from "../utils/axiosInstance";
import { FaSearch, FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown, FaBox, FaCheck } from "react-icons/fa";
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
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkValue, setBulkValue] = useState("");

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      const q = search.trim().toLowerCase();
      const next = products.filter((p) => {
        return q ? (p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) : true;
      });
      setFiltered(next);
      setPage(1);
    }, 200);
    return () => clearTimeout(id);
  }, [search, products]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      if (res.data.success) {
        setProducts(res.data.data);
        setFiltered(res.data.data);
      } else {
        // Fallback for older API or direct array response
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setProducts(data);
        setFiltered(data);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setMessage("error:Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setMessage("success:Product deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      setMessage("error:Failed to delete product");
    }
  };

  const handleSaved = (saved) => {
    if (editing) {
      setProducts((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      setEditing(null);
      setMessage("success:Product updated");
    } else {
      setProducts((prev) => [saved, ...prev]);
      setCreating(false);
      setMessage("success:Product created");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pageItems.length) setSelectedIds([]);
    else setSelectedIds(pageItems.map(p => p.id));
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    if (!window.confirm(`Apply ${bulkAction} to ${selectedIds.length} products?`)) return;

    try {
      if (bulkAction === "delete") {
        await Promise.all(selectedIds.map(id => api.delete(`/products/${id}`)));
        setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
        setMessage(`success:Deleted ${selectedIds.length} products`);
      } else if (bulkAction === "stock") {
        const val = parseInt(bulkValue);
        if (isNaN(val)) return alert("Invalid stock value");
        await Promise.all(selectedIds.map(id => api.put(`/products/${id}`, { stock: val })));
        setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, stock: val } : p));
        setMessage(`success:Updated stock for ${selectedIds.length} products`);
      } else if (bulkAction === "price") {
        const val = parseFloat(bulkValue);
        if (isNaN(val)) return alert("Invalid price value");
        await Promise.all(selectedIds.map(id => api.put(`/products/${id}`, { price: val })));
        setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, price: val } : p));
        setMessage(`success:Updated price for ${selectedIds.length} products`);
      }
      setSelectedIds([]);
      setBulkAction("");
      setBulkValue("");
    } catch (err) {
      console.error("Bulk action failed:", err);
      setMessage("error:Bulk action failed");
    }
  };

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = (a[sortKey] ?? "").toString().toLowerCase();
      const bv = (b[sortKey] ?? "").toString().toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
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

  const SortIcon = ({ column }) => {
    if (sortKey !== column) return <FaSort className="text-charcoal-300 dark:text-charcoal-600" />;
    return sortDir === "asc" ? <FaSortUp className="text-terracotta-500" /> : <FaSortDown className="text-terracotta-500" />;
  };

  const formatPrice = (v) => (typeof v === 'number' ? `RWF ${v.toLocaleString()}` : v);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-charcoal-500 dark:text-charcoal-400">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-charcoal-800 dark:text-white">All Products</h2>
          <span className="px-2.5 py-1 bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300 rounded-full text-xs font-semibold">
            {total} items
          </span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-xl text-sm ${message.startsWith("success")
            ? "bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400"
            : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
          }`}>
          {message.split(":")[1]}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
        <input
          type="text"
          placeholder="Search name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white placeholder:text-charcoal-400 outline-none transition-colors"
        />
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-terracotta-50 dark:bg-terracotta-900/20 border border-terracotta-200 dark:border-terracotta-800 rounded-xl">
          <span className="text-sm font-medium text-terracotta-700 dark:text-terracotta-400">{selectedIds.length} selected</span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-lg text-sm text-charcoal-800 dark:text-white outline-none"
          >
            <option value="">-- Bulk Action --</option>
            <option value="delete">Delete</option>
            <option value="stock">Set Stock</option>
            <option value="price">Set Price</option>
          </select>
          {(bulkAction === "stock" || bulkAction === "price") && (
            <input
              type="number"
              placeholder="Value"
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              className="w-24 px-3 py-1.5 bg-white dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-lg text-sm text-charcoal-800 dark:text-white outline-none"
            />
          )}
          <button onClick={handleBulkAction} className="px-3 py-1.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg text-sm font-medium transition-all">
            Apply
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-cream-200 dark:border-charcoal-700">
        <table className="w-full">
          <thead className="bg-cream-50 dark:bg-charcoal-900">
            <tr>
              <th className="px-4 py-4 w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.length === pageItems.length && pageItems.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-charcoal-300 text-terracotta-500 focus:ring-terracotta-500"
                />
              </th>
              <th onClick={() => setSort("name")} className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider cursor-pointer hover:text-charcoal-700 dark:hover:text-charcoal-200">
                <span className="flex items-center gap-2">Name <SortIcon column="name" /></span>
              </th>
              <th onClick={() => setSort("price")} className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider cursor-pointer hover:text-charcoal-700 dark:hover:text-charcoal-200">
                <span className="flex items-center gap-2">Price <SortIcon column="price" /></span>
              </th>
              <th onClick={() => setSort("stock")} className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider cursor-pointer hover:text-charcoal-700 dark:hover:text-charcoal-200">
                <span className="flex items-center gap-2">Stock <SortIcon column="stock" /></span>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden md:table-cell">Image</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden lg:table-cell">Customization</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700 bg-white dark:bg-charcoal-800">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <FaBox className="text-4xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3" />
                  <p className="text-charcoal-500 dark:text-charcoal-400">No products match your filters</p>
                </td>
              </tr>
            ) : (
              pageItems.map((p) => {
                const isLowStock = p.stock !== null && p.stock < 5;
                return (
                  <tr key={p.id} className={`hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors ${isLowStock ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4 rounded border-charcoal-300 text-terracotta-500 focus:ring-terracotta-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-charcoal-800 dark:text-white">{p.name}</div>
                      <div className="text-xs text-charcoal-500 dark:text-charcoal-400 line-clamp-1">{p.description}</div>
                    </td>
                    <td className="px-6 py-4 text-charcoal-800 dark:text-white font-medium">{formatPrice(p.price)}</td>
                    <td className="px-6 py-4">
                      {p.stock !== null ? (
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${p.stock < 5
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-300'
                          }`}>
                          {p.stock}
                        </span>
                      ) : (
                        <span className="text-charcoal-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {p.image ? (
                        <img src={p.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-charcoal-100 dark:bg-charcoal-700"></div>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {p.customizable ? (
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(p.customizationOptions) && p.customizationOptions.length > 0 ? (
                            p.customizationOptions.slice(0, 2).map((opt) => (
                              <span key={opt} className="px-2 py-0.5 bg-sage-100 dark:bg-sage-900/20 text-sage-700 dark:text-sage-400 rounded text-xs">
                                {opt}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-0.5 bg-sage-100 dark:bg-sage-900/20 text-sage-700 dark:text-sage-400 rounded text-xs">
                              <FaCheck className="inline mr-1" /> Enabled
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-charcoal-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditing(p)}
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-cream-200 dark:border-charcoal-700">
        <p className="text-sm text-charcoal-500 dark:text-charcoal-400">Page {page} of {totalPages}</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-charcoal-500 dark:text-charcoal-400">Rows:</label>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
              className="px-2 py-1 bg-white dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-lg text-sm text-charcoal-800 dark:text-white outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${page === 1
                  ? "bg-cream-100 dark:bg-charcoal-700 text-charcoal-400 cursor-not-allowed"
                  : "bg-white dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 text-charcoal-700 dark:text-white hover:border-terracotta-500"
                }`}
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${page === totalPages
                  ? "bg-cream-100 dark:bg-charcoal-700 text-charcoal-400 cursor-not-allowed"
                  : "bg-terracotta-500 hover:bg-terracotta-600 text-white"
                }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
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
