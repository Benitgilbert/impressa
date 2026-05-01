import { useState, useEffect, useCallback } from 'react';
import {
    FaClipboardCheck, FaSearch, FaCheck, FaTimes, FaEye,
    FaClock, FaCheckCircle, FaTimesCircle, FaImage,
    FaChevronLeft, FaChevronRight, FaStore
} from 'react-icons/fa';
import api from '../utils/axiosInstance';

export default function AdminProductApproval() {
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
    const [bulkRejectReason, setBulkRejectReason] = useState('');

    const BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

    const getImageUrl = (image) => {
        if (!image) return null;
        if (image.startsWith('http')) return image;
        return `${BASE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
    };

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: currentPage, limit: 15, status: statusFilter, ...(searchTerm && { search: searchTerm }) });
            const res = await api.get(`/product-approval?${params}`);
            if (res.data.success) { setProducts(res.data.data); setStats(res.data.stats); setTotalPages(res.data.pagination.pages); }
        } catch (err) { setError('Failed to fetch products'); }
        finally { setLoading(false); }
    }, [currentPage, statusFilter, searchTerm]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleSearch = (e) => { e.preventDefault(); setCurrentPage(1); fetchProducts(); };

    const viewProductDetails = async (id) => {
        try {
            const res = await api.get(`/product-approval/${id}`);
            if (res.data.success) { setSelectedProduct(res.data.data); setShowModal(true); }
        } catch (err) { setError('Failed to fetch product details'); }
    };

    const approveProduct = async (id, note = '') => {
        setProcessing(true);
        try {
            const res = await api.put(`/product-approval/${id}/approve`, { note });
            if (res.data.success) { setSuccess('Product approved!'); setShowModal(false); setSelectedProduct(null); fetchProducts(); }
            else { setError(res.data.message); }
        } catch (err) { setError('Failed to approve product'); }
        finally { setProcessing(false); }
    };

    const rejectProduct = async (id, reason) => {
        if (!reason) { setError('Please provide a rejection reason'); return; }
        setProcessing(true);
        try {
            const res = await api.put(`/product-approval/${id}/reject`, { reason });
            if (res.data.success) { setSuccess('Product rejected'); setShowModal(false); setSelectedProduct(null); fetchProducts(); }
            else { setError(res.data.message); }
        } catch (err) { setError('Failed to reject product'); }
        finally { setProcessing(false); }
    };

    const bulkApprove = async () => {
        if (!selectedIds.length || !window.confirm(`Approve ${selectedIds.length} products?`)) return;
        try {
            const res = await api.post('/product-approval/bulk-approve', { productIds: selectedIds });
            if (res.data.success) { setSuccess(res.data.message); setSelectedIds([]); fetchProducts(); }
        } catch (err) { setError('Failed to bulk approve'); }
    };

    const bulkReject = async () => {
        if (!selectedIds.length || !bulkRejectReason.trim()) { setError('Please provide a rejection reason'); return; }
        try {
            const res = await api.post('/product-approval/bulk-reject', { productIds: selectedIds, reason: bulkRejectReason });
            if (res.data.success) { setSuccess(res.data.message); setSelectedIds([]); setShowBulkRejectModal(false); setBulkRejectReason(''); fetchProducts(); }
        } catch (err) { setError('Failed to bulk reject'); }
    };

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const toggleSelectAll = () => selectedIds.length === products.length ? setSelectedIds([]) : setSelectedIds(products.map(p => p.id));
    const formatCurrency = (amount) => `RWF ${amount?.toLocaleString() || 0}`;

    const getStatusBadge = (status) => {
        const badges = {
            pending: { icon: <FaClock />, text: 'Pending', classes: 'bg-sand-100 text-sand-700 dark:bg-sand-900/20 dark:text-sand-400' },
            approved: { icon: <FaCheckCircle />, text: 'Approved', classes: 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400' },
            rejected: { icon: <FaTimesCircle />, text: 'Rejected', classes: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' }
        };
        const config = badges[status] || badges.pending;
        return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.classes}`}>{config.icon} {config.text}</span>;
    };

    useEffect(() => { if (error || success) { const timer = setTimeout(() => { setError(''); setSuccess(''); }, 3000); return () => clearTimeout(timer); } }, [error, success]);

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Product Approval</h1>
                        <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Review and approve new product listings</p>
                    </div>

                    {/* Bulk Actions */}
                    {selectedIds.length > 0 && statusFilter === 'pending' && (
                        <div className="flex items-center gap-3 mb-4 p-3 bg-terracotta-50 dark:bg-terracotta-900/20 border border-terracotta-200 dark:border-terracotta-800 rounded-xl">
                            <span className="text-sm font-medium text-terracotta-700 dark:text-terracotta-400">{selectedIds.length} selected</span>
                            <button onClick={bulkApprove} className="flex items-center gap-1.5 px-3 py-1.5 bg-sage-500 hover:bg-sage-600 text-white rounded-lg text-sm font-medium transition-all">
                                <FaCheck /> Approve
                            </button>
                            <button onClick={() => setShowBulkRejectModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all">
                                <FaTimes /> Reject
                            </button>
                        </div>
                    )}

                    {/* Alerts */}
                    {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}
                    {success && <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm">{success}</div>}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <button onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }} className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'pending' ? 'bg-sand-50 dark:bg-sand-900/20 border-sand-200 dark:border-sand-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-sand-200'}`}>
                            <div className="flex items-center gap-2 mb-1"><FaClock className="text-sand-500" /><span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.pending}</span></div>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">Pending Review</p>
                        </button>
                        <button onClick={() => { setStatusFilter('approved'); setCurrentPage(1); }} className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'approved' ? 'bg-sage-50 dark:bg-sage-900/20 border-sage-200 dark:border-sage-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-sage-200'}`}>
                            <div className="flex items-center gap-2 mb-1"><FaCheckCircle className="text-sage-500" /><span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.approved}</span></div>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">Approved</p>
                        </button>
                        <button onClick={() => { setStatusFilter('rejected'); setCurrentPage(1); }} className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-red-200'}`}>
                            <div className="flex items-center gap-2 mb-1"><FaTimesCircle className="text-red-500" /><span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.rejected}</span></div>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">Rejected</p>
                        </button>
                    </div>

                    {/* Search & Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <form onSubmit={handleSearch} className="relative flex-1">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
                            <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 rounded-xl text-charcoal-800 dark:text-white placeholder:text-charcoal-400 outline-none focus:border-terracotta-500 transition-colors" />
                        </form>
                        <div className="flex gap-2">
                            {['pending', 'approved', 'rejected', 'all'].map((status) => (
                                <button key={status} onClick={() => { setStatusFilter(status); setCurrentPage(1); setSelectedIds([]); }}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === status ? 'bg-terracotta-500 text-white' : 'bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 hover:border-terracotta-500'}`}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal-500 dark:text-charcoal-400">Loading products...</p>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="p-12 text-center">
                                <FaClipboardCheck className="text-5xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-2">No Products to Review</h3>
                                <p className="text-charcoal-500 dark:text-charcoal-400">No products matching your filter</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            {(statusFilter === 'pending' || statusFilter === 'all') && (
                                                <th className="px-4 py-4 w-12">
                                                    <input type="checkbox" checked={selectedIds.length === products.length && products.length > 0} onChange={toggleSelectAll}
                                                        className="w-4 h-4 rounded border-charcoal-300 text-terracotta-500 focus:ring-terracotta-500" />
                                                </th>
                                            )}
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden md:table-cell">Price</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden lg:table-cell">Stock</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {products.map((product) => (
                                            <tr key={product.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                {(statusFilter === 'pending' || statusFilter === 'all') && (
                                                    <td className="px-4 py-4">
                                                        <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleSelect(product.id)}
                                                            className="w-4 h-4 rounded border-charcoal-300 text-terracotta-500 focus:ring-terracotta-500" />
                                                    </td>
                                                )}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-charcoal-100 dark:bg-charcoal-700 flex items-center justify-center overflow-hidden">
                                                            {getImageUrl(product.image) ? <img src={getImageUrl(product.image)} alt="" className="w-full h-full object-cover" /> : <FaImage className="text-charcoal-400" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-charcoal-800 dark:text-white">{product.name}</div>
                                                            <div className="text-xs text-charcoal-500 dark:text-charcoal-400">{product.seller?.storeName || product.seller?.name || 'Unknown'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-charcoal-800 dark:text-white font-medium hidden md:table-cell">{formatCurrency(product.price)}</td>
                                                <td className="px-6 py-4 text-charcoal-600 dark:text-charcoal-400 hidden lg:table-cell">{product.stock}</td>
                                                <td className="px-6 py-4">{getStatusBadge(product.approvalStatus)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => viewProductDetails(product.id)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Review"><FaEye /></button>
                                                        {(product.approvalStatus === 'pending' || !product.approvalStatus) && (
                                                            <>
                                                                <button onClick={() => approveProduct(product.id)} className="p-2 rounded-lg text-sage-500 hover:bg-sage-50 dark:hover:bg-sage-900/20 transition-colors" title="Approve"><FaCheck /></button>
                                                                <button onClick={() => viewProductDetails(product.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Reject"><FaTimes /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-cream-200 dark:border-charcoal-700">
                            <p className="text-sm text-charcoal-500 dark:text-charcoal-400">Page {currentPage} of {totalPages}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${currentPage === 1 ? 'bg-cream-100 dark:bg-charcoal-700 text-charcoal-400 cursor-not-allowed' : 'bg-white dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 text-charcoal-700 dark:text-white hover:border-terracotta-500'}`}>
                                    <FaChevronLeft />
                                </button>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                    className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${currentPage === totalPages ? 'bg-cream-100 dark:bg-charcoal-700 text-charcoal-400 cursor-not-allowed' : 'bg-terracotta-500 hover:bg-terracotta-600 text-white'}`}>
                                    <FaChevronRight />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Product Review Modal */}
                    {showModal && selectedProduct && (
                        <ProductReviewModal product={selectedProduct} onClose={() => { setShowModal(false); setSelectedProduct(null); }} onApprove={approveProduct} onReject={rejectProduct} processing={processing} formatCurrency={formatCurrency} getStatusBadge={getStatusBadge} getImageUrl={getImageUrl} />
                    )}

                    {/* Bulk Reject Modal */}
                    {showBulkRejectModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowBulkRejectModal(false)}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">Reject {selectedIds.length} Products</h3>
                                    <button onClick={() => setShowBulkRejectModal(false)} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"><FaTimes /></button>
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-4">This reason will be applied to all selected products.</p>
                                    <textarea value={bulkRejectReason} onChange={(e) => setBulkRejectReason(e.target.value)} placeholder="Enter rejection reason (required)..."
                                        rows={4} className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors resize-none" />
                                </div>
                                <div className="flex justify-end gap-3 px-6 py-4 border-t border-cream-200 dark:border-charcoal-700">
                                    <button onClick={() => setShowBulkRejectModal(false)} className="px-4 py-2 text-charcoal-600 dark:text-charcoal-400 hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-xl font-medium transition-colors">Cancel</button>
                                    <button onClick={bulkReject} disabled={!bulkRejectReason.trim()} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all"><FaTimes /> Reject All</button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

// Product Review Modal
function ProductReviewModal({ product, onClose, onApprove, onReject, processing, formatCurrency, getStatusBadge, getImageUrl }) {
    const [rejectionReason, setRejectionReason] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">Review Product</h3>
                    <button onClick={onClose} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"><FaTimes /></button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                    {/* Product Overview */}
                    <div className="flex gap-6">
                        <div className="w-32 h-32 rounded-xl bg-charcoal-100 dark:bg-charcoal-700 flex items-center justify-center overflow-hidden shrink-0">
                            {getImageUrl(product.image) ? <img src={getImageUrl(product.image)} alt="" className="w-full h-full object-cover" /> : <FaImage className="text-3xl text-charcoal-400" />}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-bold text-charcoal-800 dark:text-white mb-2">{product.name}</h4>
                            <p className="text-2xl font-bold text-terracotta-600 dark:text-terracotta-400 mb-3">{formatCurrency(product.price)}</p>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div><span className="text-charcoal-500">Stock:</span> <span className="font-medium text-charcoal-800 dark:text-white">{product.stock}</span></div>
                                <div><span className="text-charcoal-500">SKU:</span> <span className="font-medium text-charcoal-800 dark:text-white">{product.sku || 'N/A'}</span></div>
                                <div className="flex items-center gap-2"><span className="text-charcoal-500">Status:</span> {getStatusBadge(product.approvalStatus)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Seller Info */}
                    <div className="p-4 bg-cream-50 dark:bg-charcoal-700 rounded-xl">
                        <h5 className="flex items-center gap-2 text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-2"><FaStore /> Seller Information</h5>
                        <p className="font-medium text-charcoal-800 dark:text-white">{product.seller?.storeName || product.seller?.name}</p>
                        <p className="text-sm text-charcoal-500">{product.seller?.email}</p>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div>
                            <h5 className="text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-2">Description</h5>
                            <p className="text-charcoal-600 dark:text-charcoal-400 text-sm">{product.description}</p>
                        </div>
                    )}

                    {/* Rejection Reason */}
                    {product.approvalStatus === 'pending' && (
                        <div>
                            <h5 className="text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-2">Rejection Reason (if rejecting)</h5>
                            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Explain why this product is being rejected..."
                                rows={3} className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors resize-none" />
                        </div>
                    )}

                    {/* Actions */}
                    {product.approvalStatus === 'pending' && (
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => onApprove(product.id)} disabled={processing} className="flex-1 flex items-center justify-center gap-2 py-3 bg-sage-500 hover:bg-sage-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all">
                                <FaCheck /> {processing ? 'Processing...' : 'Approve'}
                            </button>
                            <button onClick={() => onReject(product.id, rejectionReason)} disabled={processing} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all">
                                <FaTimes /> Reject
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
