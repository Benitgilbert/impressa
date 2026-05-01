import { useState, useEffect, useCallback } from 'react';
import {
    FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaClock, FaBox,
    FaSave, FaTimes, FaFire
} from 'react-icons/fa';
import api from '../utils/axiosInstance';

const colorOptions = [
    { label: 'Terracotta → Sand', value: 'from-terracotta-500 to-sand-400' },
    { label: 'Red → Orange', value: 'from-red-500 to-orange-500' },
    { label: 'Purple → Pink', value: 'from-purple-500 to-pink-500' },
    { label: 'Blue → Cyan', value: 'from-blue-500 to-cyan-500' },
    { label: 'Green → Teal', value: 'from-green-500 to-teal-500' },
    { label: 'Indigo → Purple', value: 'from-indigo-500 to-purple-500' },
];

export default function AdminFlashSales() {
    const [flashSales, setFlashSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingSale, setEditingSale] = useState(null);
    const [selectedSale, setSelectedSale] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        bannerColor: 'from-terracotta-500 to-sand-400',
        isActive: true,
    });

    const [productForm, setProductForm] = useState({
        productId: '',
        flashSalePrice: '',
        stockLimit: ''
    });





    const fetchFlashSales = useCallback(async () => {
        try {
            const res = await api.get('/flash-sales');
            if (res.data.success) {
                setFlashSales(res.data.data);
            }
        } catch (err) {
            setError('Failed to fetch flash sales');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            const res = await api.get('/products');
            const productList = Array.isArray(res.data) ? res.data : (res.data.products || res.data.data || []);
            setProducts(productList);
        } catch (err) {
            console.error('Failed to fetch products');
        }
    }, []);

    useEffect(() => {
        fetchFlashSales();
        fetchProducts();
    }, [fetchFlashSales, fetchProducts]);

    const getSaleStatus = (sale) => {
        const now = new Date();
        const start = new Date(sale.startDate);
        const end = new Date(sale.endDate);

        if (!sale.isActive) return { label: 'Inactive', classes: 'bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-400' };
        if (now < start) return { label: 'Upcoming', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' };
        if (now > end) return { label: 'Ended', classes: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' };
        return { label: 'Active', classes: 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400' };
    };

    const toLocalISOString = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const payload = {
                ...form,
                startDate: new Date(form.startDate).toISOString(),
                endDate: new Date(form.endDate).toISOString()
            };

            const res = editingSale 
                ? await api.put(`/flash-sales/${editingSale.id}`, payload)
                : await api.post('/flash-sales', payload);

            if (res.data.success) {
                setSuccess(editingSale ? 'Flash sale updated!' : 'Flash sale created!');
                fetchFlashSales();
                closeModal();
            } else {
                setError(res.data.message || 'Failed to save flash sale');
            }
        } catch (err) {
            setError('Failed to save flash sale');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this flash sale?')) return;

        try {
            const res = await api.delete(`/flash-sales/${id}`);
            if (res.data.success) {
                setSuccess('Flash sale deleted!');
                fetchFlashSales();
            } else {
                setError(res.data.message || 'Failed to delete flash sale');
            }
        } catch (err) {
            setError('Failed to delete flash sale');
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!selectedSale) return;

        try {
            const res = await api.post(`/flash-sales/${selectedSale.id}/products`, {
                productId: productForm.productId,
                flashSalePrice: Number(productForm.flashSalePrice),
                stockLimit: productForm.stockLimit ? Number(productForm.stockLimit) : null
            });

            if (res.data.success) {
                setSuccess('Product added to flash sale!');
                fetchFlashSales();
                setShowProductModal(false);
                setProductForm({ productId: '', flashSalePrice: '', stockLimit: '' });
            } else {
                setError(res.data.message || 'Failed to add product');
            }
        } catch (err) {
            setError('Failed to add product');
        }
    };

    const handleRemoveProduct = async (saleId, productId) => {
        if (!window.confirm('Remove this product from the flash sale?')) return;

        try {
            const res = await api.delete(`/flash-sales/${saleId}/products/${productId}`);
            if (res.data.success) {
                setSuccess('Product removed!');
                fetchFlashSales();
            } else {
                setError(res.data.message || 'Failed to remove product');
            }
        } catch (err) {
            setError('Failed to remove product');
        }
    };

    const openModal = (sale = null) => {
        if (sale) {
            setEditingSale(sale);
            setForm({
                name: sale.name || '',
                description: sale.description || '',
                startDate: toLocalISOString(sale.startDate),
                endDate: toLocalISOString(sale.endDate),
                bannerColor: sale.bannerColor || 'from-terracotta-500 to-sand-400',
                isActive: sale.isActive !== false,
            });
        } else {
            setEditingSale(null);
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            setForm({
                name: '',
                description: '',
                startDate: toLocalISOString(now),
                endDate: toLocalISOString(tomorrow),
                bannerColor: 'from-terracotta-500 to-sand-400',
                isActive: true,
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingSale(null);
        setError('');
    };

    const openProductModal = (sale) => {
        setSelectedSale(sale);
        setProductForm({ productId: '', flashSalePrice: '', stockLimit: '' });
        setShowProductModal(true);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">

                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Flash Sales</h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">
                                Create and manage limited-time discounts
                            </p>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-terracotta-500/20 active:scale-95"
                        >
                            <FaPlus className="text-sm" /> Create Flash Sale
                        </button>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm">
                            {success}
                        </div>
                    )}

                    {/* Loading */}
                    {loading ? (
                        <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-12 text-center border border-cream-200 dark:border-charcoal-700">
                            <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-charcoal-500 dark:text-charcoal-400">Loading flash sales...</p>
                        </div>
                    ) : flashSales.length === 0 ? (
                        <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-12 text-center border border-cream-200 dark:border-charcoal-700">
                            <FaFire className="text-5xl text-terracotta-300 dark:text-terracotta-800 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-2">No Flash Sales Yet</h3>
                            <p className="text-charcoal-500 dark:text-charcoal-400">Create your first flash sale to offer limited-time discounts.</p>
                        </div>
                    ) : (
                        /* Flash Sales Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {flashSales.map((sale) => {
                                const statusInfo = getSaleStatus(sale);
                                return (
                                    <div key={sale.id} className="bg-white dark:bg-charcoal-800 rounded-2xl overflow-hidden border border-cream-200 dark:border-charcoal-700 hover:shadow-lg transition-shadow">
                                        {/* Banner */}
                                        <div className={`relative h-28 bg-gradient-to-r ${sale.bannerColor || 'from-terracotta-500 to-sand-400'} p-4`}>
                                            <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.classes}`}>
                                                {statusInfo.label}
                                            </span>
                                            <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white drop-shadow-md">
                                                {sale.name}
                                            </h3>
                                        </div>

                                        {/* Body */}
                                        <div className="p-4">
                                            {/* Dates */}
                                            <div className="space-y-2 mb-4 pb-4 border-b border-cream-100 dark:border-charcoal-700">
                                                <div className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400">
                                                    <FaCalendarAlt className="text-terracotta-500" />
                                                    <span>Start: {formatDate(sale.startDate)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400">
                                                    <FaClock className="text-sand-500" />
                                                    <span>End: {formatDate(sale.endDate)}</span>
                                                </div>
                                            </div>

                                            {/* Products */}
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="flex items-center gap-1.5 text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                                                        <FaBox className="text-sage-500" />
                                                        {sale.products?.length || 0} Products
                                                    </span>
                                                    <button
                                                        onClick={() => openProductModal(sale)}
                                                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-terracotta-500 hover:bg-terracotta-50 dark:hover:bg-terracotta-900/20 rounded-lg transition-colors"
                                                    >
                                                        <FaPlus /> Add
                                                    </button>
                                                </div>

                                                {sale.products && sale.products.length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        {sale.products.slice(0, 3).map((sp) => (
                                                            <div key={sp.id} className="flex items-center justify-between py-1.5 px-2 bg-cream-50 dark:bg-charcoal-700 rounded-lg">
                                                                <span className="text-xs text-charcoal-700 dark:text-charcoal-300 truncate flex-1">
                                                                    {sp.product?.name || 'Unknown Product'}
                                                                </span>
                                                                <span className="text-xs font-semibold text-terracotta-600 dark:text-terracotta-400 mx-2">
                                                                    {sp.flashSalePrice?.toLocaleString()} Rwf
                                                                </span>
                                                                <button
                                                                    onClick={() => handleRemoveProduct(sale.id, sp.product?.id)}
                                                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                                >
                                                                    <FaTimes className="text-xs" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {sale.products.length > 3 && (
                                                            <p className="text-xs text-charcoal-400 text-center py-1">
                                                                +{sale.products.length - 3} more products
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-charcoal-400 text-center py-2">No products added yet</p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 pt-4 border-t border-cream-100 dark:border-charcoal-700">
                                                <button
                                                    onClick={() => openModal(sale)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(sale.id)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <FaTrash /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Create/Edit Modal */}
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">
                                        {editingSale ? 'Edit Flash Sale' : 'Create Flash Sale'}
                                    </h3>
                                    <button onClick={closeModal} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors">
                                        <FaTimes />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Sale Name *</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="e.g., Christmas Flash Sale"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Description</label>
                                        <textarea
                                            className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors resize-none"
                                            rows={2}
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            placeholder="Sale description"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Start Date *</label>
                                            <input
                                                type="datetime-local"
                                                className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors"
                                                value={form.startDate}
                                                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">End Date *</label>
                                            <input
                                                type="datetime-local"
                                                className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors"
                                                value={form.endDate}
                                                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Banner Color</label>
                                        <div className="grid grid-cols-6 gap-2">
                                            {colorOptions.map((color) => (
                                                <button
                                                    key={color.value}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, bannerColor: color.value })}
                                                    className={`h-10 rounded-lg bg-gradient-to-r ${color.value} transition-all hover:scale-105 ${form.bannerColor === color.value ? 'ring-2 ring-offset-2 ring-charcoal-800 dark:ring-white' : ''}`}
                                                    title={color.label}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.isActive}
                                            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                            className="w-5 h-5 rounded border-charcoal-300 text-terracotta-500 focus:ring-terracotta-500"
                                        />
                                        <span className="text-sm text-charcoal-700 dark:text-charcoal-300">Active (visible to customers)</span>
                                    </label>

                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-terracotta-500/20"
                                    >
                                        <FaSave /> {editingSale ? 'Update Flash Sale' : 'Create Flash Sale'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Add Product Modal */}
                    {showProductModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowProductModal(false)}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">Add Product to Sale</h3>
                                    <button onClick={() => setShowProductModal(false)} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors">
                                        <FaTimes />
                                    </button>
                                </div>

                                <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Select Product *</label>
                                        <select
                                            className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors"
                                            value={productForm.productId}
                                            onChange={(e) => setProductForm({ ...productForm, productId: e.target.value })}
                                            required
                                        >
                                            <option value="">Choose a product</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} ({p.price?.toLocaleString()} Rwf)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Flash Sale Price (Rwf) *</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors"
                                            value={productForm.flashSalePrice}
                                            onChange={(e) => setProductForm({ ...productForm, flashSalePrice: e.target.value })}
                                            placeholder="Discounted price"
                                            required
                                            min="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Stock Limit (Optional)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors"
                                            value={productForm.stockLimit}
                                            onChange={(e) => setProductForm({ ...productForm, stockLimit: e.target.value })}
                                            placeholder="Leave empty for unlimited"
                                            min="1"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-terracotta-500/20"
                                    >
                                        <FaPlus /> Add Product
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
