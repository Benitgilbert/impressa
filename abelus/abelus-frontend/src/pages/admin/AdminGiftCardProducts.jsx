import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaTimes, FaSearch, FaGift } from "react-icons/fa";
import api from "../../utils/axiosInstance";
import toast from "react-hot-toast";

const AdminGiftCardProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        value: "",
        description: "",
        isActive: true
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get("/giftcards/products");
            setProducts(data);
        } catch (error) {
            toast.error("Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                price: product.price,
                value: product.value,
                description: product.description || "",
                isActive: product.isActive
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: "",
                price: "",
                value: "",
                description: "",
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.put(`/giftcards/products/${editingProduct.id}`, formData);
                toast.success("Product updated");
            } else {
                await api.post("/giftcards/products", formData);
                toast.success("Product created");
            }
            setShowModal(false);
            fetchProducts();
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this product?")) return;
        try {
            await api.delete(`/giftcards/products/${id}`);
            toast.success("Product deleted");
            fetchProducts();
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-charcoal-900 dark:text-white">Gift Card Products</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage physical gift cards available for sale</p>
                        </div>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-terracotta-500/30"
                        >
                            <FaPlus /> New Product
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="mb-6 bg-white dark:bg-charcoal-800 p-4 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full pl-11 pr-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-sm text-charcoal-800 dark:text-white outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <FaSpinner className="animate-spin text-3xl text-terracotta-500 mx-auto mb-3" />
                                <p className="text-charcoal-500 dark:text-charcoal-400 font-bold uppercase tracking-widest text-xs">Loading Products...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Product Name</th>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Value</th>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Price</th>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {filteredProducts.map((p) => (
                                            <tr key={p.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-terracotta-50 dark:bg-terracotta-900/10 flex items-center justify-center text-terracotta-500">
                                                            <FaGift />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-charcoal-900 dark:text-white">{p.name}</div>
                                                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {p.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-black text-charcoal-900 dark:text-white">RWF {p.value.toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-gray-500 dark:text-gray-400">RWF {p.price.toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.isActive ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>
                                                        {p.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleOpenModal(p)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-cream-50 dark:bg-charcoal-700 text-charcoal-600 dark:text-gray-300 hover:bg-terracotta-500 hover:text-white transition-all"
                                                            title="Edit"
                                                        >
                                                            <FaEdit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(p.id)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-cream-50 dark:bg-charcoal-700 text-charcoal-600 dark:text-gray-300 hover:bg-red-500 hover:text-white transition-all"
                                                            title="Delete"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                    <div className="flex justify-end gap-1 group-hover:hidden">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-charcoal-600"></div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-charcoal-600"></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredProducts.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">No gift card products found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Modal */}
                    {showModal && (
                        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-md p-6 transform transition-all animate-in zoom-in duration-200 shadow-2xl" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-black text-charcoal-900 dark:text-white">
                                        {editingProduct ? "Edit Product" : "New Gift Card Product"}
                                    </h2>
                                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Product Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl outline-none focus:border-terracotta-500 dark:text-white"
                                            placeholder="e.g. Premium Silver Card"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Value (RWF)</label>
                                            <input
                                                type="number"
                                                required
                                                className="w-full px-4 py-3 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl outline-none focus:border-terracotta-500 dark:text-white font-bold"
                                                value={formData.value}
                                                onChange={e => setFormData({ ...formData, value: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Price (RWF)</label>
                                            <input
                                                type="number"
                                                required
                                                className="w-full px-4 py-3 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl outline-none focus:border-terracotta-500 dark:text-white font-bold"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Description</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl outline-none focus:border-terracotta-500 dark:text-white h-24 resize-none"
                                            placeholder="Brief product description..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 py-2">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            className="w-5 h-5 rounded border-cream-300 text-terracotta-500 focus:ring-terracotta-500"
                                            checked={formData.isActive}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <label htmlFor="isActive" className="text-sm font-bold text-charcoal-700 dark:text-charcoal-300 cursor-pointer">Product is active and available</label>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 py-3 bg-gray-100 dark:bg-charcoal-700 text-charcoal-800 dark:text-white rounded-xl font-bold hover:bg-gray-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 bg-terracotta-500 text-white rounded-xl font-bold hover:bg-terracotta-600 shadow-lg shadow-terracotta-500/20 transition-all"
                                        >
                                            {editingProduct ? "Update Product" : "Create Product"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminGiftCardProducts;
