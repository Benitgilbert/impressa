import { useState, useEffect, useCallback } from 'react';
import {
    FaSearch, FaEye, FaTrash, FaUserCheck, FaClock, FaUserTimes,
    FaStore, FaUsers, FaChevronLeft, FaChevronRight, FaTimes, FaUser,
    FaFileAlt, FaChartLine, FaBox, FaIdCard, FaBuilding, FaDownload,
    FaExclamationCircle, FaCheck, FaEnvelope
} from 'react-icons/fa';
import api from '../utils/axiosInstance';
const BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

export default function AdminSellers() {
    const [sellers, setSellers] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, rejected: 0, pendingVerification: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalTab, setModalTab] = useState('info');
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchSellers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: 15,
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(searchTerm && { search: searchTerm })
            });

            const res = await api.get(`/sellers?${params}`);
            const data = res.data;

            if (data.success) {
                setSellers(data.data);
                setStats(data.stats || { total: 0, pending: 0, active: 0, rejected: 0 });
                setTotalPages(data.pagination?.pages || 1);
            } else {
                setError(data.message || 'Failed to fetch sellers');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch sellers');
        } finally {
            setLoading(false);
        }
    }, [currentPage, statusFilter, searchTerm]);

    useEffect(() => {
        fetchSellers();
    }, [fetchSellers]);

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchSellers();
    };

    const updateSellerStatus = async (id, status, reason = '') => {
        setProcessing(true);
        try {
            const res = await api.put(`/sellers/${id}/status`, { status, reason });
            if (res.data.success) {
                setSuccess(res.data.message || `Seller ${status === 'active' ? 'approved' : 'rejected'}`);
                setShowModal(false);
                setRejectionReason('');
                fetchSellers();
            } else {
                setError(res.data.message || 'Failed to update status');
            }
        } catch (err) {
            setError('Failed to update seller status');
        } finally {
            setProcessing(false);
        }
    };

    const verifyDocuments = async (id, action, reason = '') => {
        if (action === 'reject' && !reason.trim()) {
            setError('Please provide a rejection reason');
            return;
        }
        setProcessing(true);
        try {
            const res = await api.put(`/seller-verification/${id}/verify`, { action, rejectionReason: reason });
            if (res.data.success) {
                setSuccess(res.data.message);
                setShowModal(false);
                setRejectionReason('');
                fetchSellers();
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            setError('Failed to verify documents');
        } finally {
            setProcessing(false);
        }
    };

    const viewSellerDetails = async (id) => {
        try {
            const res = await api.get(`/sellers/${id}`);
            if (res.data.success) {
                setSelectedSeller(res.data.data);
                setModalTab('info');
                setShowModal(true);
                setRejectionReason('');
            }
        } catch (err) {
            setError('Failed to fetch seller details');
        }
    };

    const deleteSeller = async (id) => {
        if (!window.confirm('Delete this seller permanently? This cannot be undone.')) return;
        try {
            const res = await api.delete(`/sellers/${id}`);
            if (res.data.success) {
                setSuccess('Seller deleted');
                fetchSellers();
            } else {
                setError(res.data.message || 'Failed to delete');
            }
        } catch (err) {
            setError('Failed to delete seller');
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { icon: <FaClock />, text: 'Pending', classes: 'bg-sand-100 text-sand-700 dark:bg-sand-900/20 dark:text-sand-400' },
            active: { icon: <FaUserCheck />, text: 'Active', classes: 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400' },
            rejected: { icon: <FaUserTimes />, text: 'Rejected', classes: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.classes}`}>
                {badge.icon} {badge.text}
            </span>
        );
    };

    const getDocStatusBadge = (status) => {
        const badges = {
            not_submitted: 'bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-400',
            pending_review: 'bg-sand-100 text-sand-700 dark:bg-sand-900/20 dark:text-sand-400',
            approved: 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400',
            rejected: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        };
        const labels = { not_submitted: 'Not Submitted', pending_review: 'Pending', approved: 'Verified', rejected: 'Rejected' };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badges[status] || badges.not_submitted}`}>
                {labels[status] || 'Not Submitted'}
            </span>
        );
    };

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => { setError(''); setSuccess(''); }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    return (
        <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Page Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Seller Management</h1>
                        <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Manage seller accounts and verifications</p>
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

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <button onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                            className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'all' ? 'bg-terracotta-50 dark:bg-terracotta-900/20 border-terracotta-200 dark:border-terracotta-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-terracotta-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <FaUsers className="text-terracotta-500" />
                                <span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.total}</span>
                            </div>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">Total Sellers</p>
                        </button>

                        <button onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
                            className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'pending' ? 'bg-sand-50 dark:bg-sand-900/20 border-sand-200 dark:border-sand-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-sand-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <FaClock className="text-sand-500" />
                                <span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.pending}</span>
                            </div>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">Pending</p>
                        </button>

                        <button onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
                            className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'active' ? 'bg-sage-50 dark:bg-sage-900/20 border-sage-200 dark:border-sage-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-sage-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <FaUserCheck className="text-sage-500" />
                                <span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.active}</span>
                            </div>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">Active</p>
                        </button>

                        <button onClick={() => { setStatusFilter('rejected'); setCurrentPage(1); }}
                            className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-red-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <FaUserTimes className="text-red-500" />
                                <span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.rejected}</span>
                            </div>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">Rejected</p>
                        </button>
                    </div>

                    {/* Search & Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <form onSubmit={handleSearch} className="relative flex-1">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, store, or TIN..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 rounded-xl text-charcoal-800 dark:text-white placeholder:text-charcoal-400 outline-none focus:border-terracotta-500 transition-colors"
                            />
                        </form>

                        <div className="flex gap-2 overflow-x-auto">
                            {['all', 'pending', 'active', 'rejected'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === status
                                        ? 'bg-terracotta-500 text-white'
                                        : 'bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 hover:border-terracotta-500'
                                        }`}
                                >
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
                                <p className="text-charcoal-500 dark:text-charcoal-400">Loading sellers...</p>
                            </div>
                        ) : sellers.length === 0 ? (
                            <div className="p-12 text-center">
                                <FaStore className="text-5xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-2">No Sellers Found</h3>
                                <p className="text-charcoal-500 dark:text-charcoal-400">{searchTerm ? 'No matches for your search' : 'No sellers registered yet'}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Seller</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden md:table-cell">Store / Business</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden lg:table-cell">TIN</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden lg:table-cell">Documents</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {sellers.map((seller) => (
                                            <tr key={seller.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-terracotta-100 dark:bg-terracotta-900/20 flex items-center justify-center overflow-hidden">
                                                            {seller.storeLogo ? (
                                                                <img src={seller.storeLogo} alt={seller.storeName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-sm font-bold text-terracotta-600 dark:text-terracotta-400">
                                                                    {(seller.storeName || seller.name || '').substring(0, 2).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-charcoal-800 dark:text-white">{seller.name}</div>
                                                            <div className="text-xs text-charcoal-500 dark:text-charcoal-400 md:hidden">{seller.storeName}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <div className="text-charcoal-800 dark:text-white">{seller.storeName || <span className="text-charcoal-400">Not set</span>}</div>
                                                    {seller.rdbVerification?.businessName && (
                                                        <div className="text-xs text-charcoal-500">{seller.rdbVerification.businessName}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-charcoal-600 dark:text-charcoal-400 hidden lg:table-cell">
                                                    {seller.rdbVerification?.tinNumber || <span className="text-charcoal-400">—</span>}
                                                </td>
                                                <td className="px-6 py-4 hidden lg:table-cell">
                                                    {getDocStatusBadge(seller.rdbVerification?.documentStatus || 'not_submitted')}
                                                </td>
                                                <td className="px-6 py-4">{getStatusBadge(seller.sellerStatus)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => viewSellerDetails(seller.id)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View">
                                                            <FaEye />
                                                        </button>
                                                        {seller.sellerStatus === 'pending' && (
                                                            <>
                                                                <button onClick={() => updateSellerStatus(seller.id, 'active')} className="p-2 rounded-lg text-sage-500 hover:bg-sage-50 dark:hover:bg-sage-900/20 transition-colors" title="Approve">
                                                                    <FaCheck />
                                                                </button>
                                                                <button onClick={() => updateSellerStatus(seller.id, 'rejected')} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Reject">
                                                                    <FaTimes />
                                                                </button>
                                                            </>
                                                        )}
                                                        {seller.sellerStatus === 'active' && (
                                                            <button onClick={() => updateSellerStatus(seller.id, 'rejected')} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Suspend">
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                        {seller.sellerStatus === 'rejected' && (
                                                            <button onClick={() => updateSellerStatus(seller.id, 'active')} className="p-2 rounded-lg text-sage-500 hover:bg-sage-50 dark:hover:bg-sage-900/20 transition-colors" title="Reactivate">
                                                                <FaCheck />
                                                            </button>
                                                        )}
                                                        <button onClick={() => deleteSeller(seller.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                                                            <FaTrash />
                                                        </button>
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
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${currentPage === 1 ? 'bg-cream-100 dark:bg-charcoal-700 text-charcoal-400 cursor-not-allowed' : 'bg-white dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 text-charcoal-700 dark:text-white hover:border-terracotta-500'}`}
                                >
                                    <FaChevronLeft /> Prev
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${currentPage === totalPages ? 'bg-cream-100 dark:bg-charcoal-700 text-charcoal-400 cursor-not-allowed' : 'bg-terracotta-500 hover:bg-terracotta-600 text-white'}`}
                                >
                                    Next <FaChevronRight />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Seller Details Modal */}
                    {showModal && selectedSeller && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                {/* Modal Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">Seller Details</h3>
                                    <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors">
                                        <FaTimes />
                                    </button>
                                </div>

                                {/* Modal Tabs */}
                                <div className="flex border-b border-cream-200 dark:border-charcoal-700 px-6">
                                    {[{ id: 'info', icon: <FaUser />, label: 'Profile' }, { id: 'documents', icon: <FaFileAlt />, label: 'Documents' }, { id: 'performance', icon: <FaChartLine />, label: 'Performance' }].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setModalTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${modalTab === tab.id
                                                ? 'text-terracotta-600 border-terracotta-500'
                                                : 'text-charcoal-500 border-transparent hover:text-charcoal-700 dark:text-charcoal-400'
                                                }`}
                                        >
                                            {tab.icon} {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 overflow-y-auto max-h-[60vh]">
                                    {/* Profile Tab */}
                                    {modalTab === 'info' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 pb-4 border-b border-cream-100 dark:border-charcoal-700">
                                                <div className="w-16 h-16 rounded-2xl bg-terracotta-100 dark:bg-terracotta-900/20 flex items-center justify-center overflow-hidden">
                                                    {selectedSeller.storeLogo ? (
                                                        <img src={selectedSeller.storeLogo} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FaUser className="text-2xl text-terracotta-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-lg font-bold text-charcoal-800 dark:text-white">{selectedSeller.name}</h4>
                                                        {getStatusBadge(selectedSeller.sellerStatus)}
                                                    </div>
                                                    <p className="text-sm text-charcoal-500 flex items-center gap-1"><FaEnvelope /> {selectedSeller.email}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <h5 className="flex items-center gap-2 text-sm font-bold text-charcoal-700 dark:text-charcoal-300"><FaStore /> Store Information</h5>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between"><span className="text-charcoal-500">Store Name</span><span className="text-charcoal-800 dark:text-white font-medium">{selectedSeller.storeName || 'Not set'}</span></div>
                                                        <div className="flex justify-between"><span className="text-charcoal-500">Phone</span><span className="text-charcoal-800 dark:text-white">{selectedSeller.storePhone || 'Not set'}</span></div>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <h5 className="flex items-center gap-2 text-sm font-bold text-charcoal-700 dark:text-charcoal-300"><FaClock /> Account Details</h5>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between"><span className="text-charcoal-500">Joined</span><span className="text-charcoal-800 dark:text-white">{formatDate(selectedSeller.createdAt)}</span></div>
                                                        <div className="flex justify-between"><span className="text-charcoal-500">Approved</span><span className={selectedSeller.approvedAt ? 'text-charcoal-800 dark:text-white' : 'text-charcoal-400'}>{selectedSeller.approvedAt ? formatDate(selectedSeller.approvedAt) : 'Not approved'}</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Documents Tab */}
                                    {modalTab === 'documents' && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-cream-50 dark:bg-charcoal-700 rounded-xl">
                                                    <label className="flex items-center gap-2 text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase mb-1"><FaIdCard /> TIN Number</label>
                                                    <p className="text-lg font-bold text-terracotta-600 dark:text-terracotta-400">{selectedSeller.rdbVerification?.tinNumber || 'Not provided'}</p>
                                                </div>
                                                <div className="p-4 bg-cream-50 dark:bg-charcoal-700 rounded-xl">
                                                    <label className="flex items-center gap-2 text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase mb-1"><FaBuilding /> Business Name</label>
                                                    <p className="text-sm font-medium text-charcoal-800 dark:text-white">{selectedSeller.rdbVerification?.businessName || 'Not provided'}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h5 className="text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-3">Uploaded Documents</h5>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {selectedSeller.rdbVerification?.rdbCertificate ? (
                                                        <a href={selectedSeller.rdbVerification.rdbCertificate.startsWith('http')
                                                            ? selectedSeller.rdbVerification.rdbCertificate
                                                            : `${BASE_URL}${selectedSeller.rdbVerification.rdbCertificate.startsWith('/') ? '' : '/'}${selectedSeller.rdbVerification.rdbCertificate}`}
                                                            target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-3 p-3 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 rounded-xl hover:bg-sage-100 transition-colors">
                                                            <FaFileAlt className="text-sage-500" />
                                                            <span className="flex-1 text-sm font-medium text-charcoal-700 dark:text-charcoal-300">RDB Certificate</span>
                                                            <FaDownload className="text-sage-500" />
                                                        </a>
                                                    ) : (
                                                        <div className="flex items-center gap-3 p-3 bg-charcoal-50 dark:bg-charcoal-700 rounded-xl">
                                                            <FaExclamationCircle className="text-charcoal-400" />
                                                            <span className="text-sm text-charcoal-500">RDB Certificate not uploaded</span>
                                                        </div>
                                                    )}
                                                    {selectedSeller.rdbVerification?.nationalId ? (
                                                        <a href={selectedSeller.rdbVerification.nationalId.startsWith('http')
                                                            ? selectedSeller.rdbVerification.nationalId
                                                            : `${BASE_URL}${selectedSeller.rdbVerification.nationalId.startsWith('/') ? '' : '/'}${selectedSeller.rdbVerification.nationalId}`}
                                                            target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-3 p-3 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 rounded-xl hover:bg-sage-100 transition-colors">
                                                            <FaIdCard className="text-sage-500" />
                                                            <span className="flex-1 text-sm font-medium text-charcoal-700 dark:text-charcoal-300">National ID</span>
                                                            <FaDownload className="text-sage-500" />
                                                        </a>
                                                    ) : (
                                                        <div className="flex items-center gap-3 p-3 bg-charcoal-50 dark:bg-charcoal-700 rounded-xl">
                                                            <FaExclamationCircle className="text-charcoal-400" />
                                                            <span className="text-sm text-charcoal-500">National ID not uploaded</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {selectedSeller.rdbVerification?.documentStatus === 'pending_review' && (
                                                <div className="space-y-3 pt-4 border-t border-cream-200 dark:border-charcoal-700">
                                                    <textarea
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        placeholder="Rejection reason (required if rejecting)..."
                                                        rows={2}
                                                        className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors resize-none"
                                                    />
                                                    <div className="flex gap-3">
                                                        <button onClick={() => verifyDocuments(selectedSeller.id, 'approve')} disabled={processing}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sage-500 hover:bg-sage-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all">
                                                            <FaCheck /> Approve
                                                        </button>
                                                        <button onClick={() => verifyDocuments(selectedSeller.id, 'reject', rejectionReason)} disabled={processing}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all">
                                                            <FaTimes /> Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Performance Tab */}
                                    {modalTab === 'performance' && (
                                        <div>
                                            {selectedSeller.stats ? (
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="p-4 bg-cream-50 dark:bg-charcoal-700 rounded-xl text-center">
                                                        <FaBox className="text-2xl text-blue-500 mx-auto mb-2" />
                                                        <p className="text-2xl font-bold text-charcoal-800 dark:text-white">{selectedSeller.stats.productCount || 0}</p>
                                                        <p className="text-xs text-charcoal-500">Products</p>
                                                    </div>
                                                    <div className="p-4 bg-cream-50 dark:bg-charcoal-700 rounded-xl text-center">
                                                        <FaChartLine className="text-2xl text-sage-500 mx-auto mb-2" />
                                                        <p className="text-2xl font-bold text-charcoal-800 dark:text-white">{selectedSeller.stats.totalOrders || 0}</p>
                                                        <p className="text-xs text-charcoal-500">Orders</p>
                                                    </div>
                                                    <div className="p-4 bg-terracotta-50 dark:bg-terracotta-900/20 rounded-xl text-center">
                                                        <p className="text-xl font-bold text-terracotta-600 dark:text-terracotta-400">RWF {(selectedSeller.stats.totalRevenue || 0).toLocaleString()}</p>
                                                        <p className="text-xs text-charcoal-500 mt-1">Revenue</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <FaChartLine className="text-4xl text-charcoal-300 mx-auto mb-3" />
                                                    <p className="text-charcoal-500">No performance data yet</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div className="flex justify-end gap-3 px-6 py-4 border-t border-cream-200 dark:border-charcoal-700">
                                    <button onClick={() => setShowModal(false)} className="px-4 py-2 text-charcoal-600 dark:text-charcoal-400 hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-xl font-medium transition-colors">
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
    );
}
