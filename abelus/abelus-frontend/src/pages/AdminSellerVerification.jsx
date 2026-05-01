import { useState, useEffect, useCallback } from 'react';
import {
    FaFileAlt, FaCheck, FaTimes, FaEye,
    FaClock, FaCheckCircle, FaTimesCircle, FaBuilding,
    FaIdCard, FaPhone, FaEnvelope, FaDownload, FaUser
} from 'react-icons/fa';
import api from '../utils/axiosInstance';

export default function AdminSellerVerification() {
    const [sellers, setSellers] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending_review');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const BASE_URL = (api.defaults.baseURL || '').replace(/\/api$/, '');

    const fetchSellers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: currentPage, limit: 15, status: statusFilter });
            const res = await api.get(`/seller-verification/pending?${params}`);
            if (res.data.success) { setSellers(res.data.data); setStats(res.data.stats); setTotalPages(res.data.pagination.pages); }
        } catch (err) { setError('Failed to fetch sellers'); }
        finally { setLoading(false); }
    }, [currentPage, statusFilter]);

    useEffect(() => { fetchSellers(); }, [fetchSellers]);

    const viewSellerDetails = async (id) => {
        try {
            const res = await api.get(`/seller-verification/${id}`);
            if (res.data.success) { setSelectedSeller(res.data.data); setShowModal(true); setRejectionReason(''); }
        } catch (err) { setError('Failed to fetch seller details'); }
    };

    const handleVerify = async (action) => {
        if (action === 'reject' && !rejectionReason.trim()) { setError('Please provide a rejection reason'); return; }
        setProcessing(true);
        try {
            const res = await api.put(`/seller-verification/${selectedSeller.id}/verify`, { action, rejectionReason: action === 'reject' ? rejectionReason : undefined });
            if (res.data.success) { setSuccess(res.data.message); setShowModal(false); setSelectedSeller(null); fetchSellers(); }
            else setError(res.data.message);
        } catch (err) { setError('Failed to process verification'); }
        finally { setProcessing(false); }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
            approved: 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400',
            rejected: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
            not_submitted: 'bg-charcoal-100 text-charcoal-700 dark:bg-charcoal-700 dark:text-charcoal-400'
        };
        const icons = {
            pending_review: <FaClock className="text-xs" />,
            approved: <FaCheckCircle className="text-xs" />,
            rejected: <FaTimesCircle className="text-xs" />,
            not_submitted: <FaFileAlt className="text-xs" />
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending_review}`}>
                {icons[status] || icons.pending_review} {status === 'pending_review' ? 'Pending Review' : status === 'not_submitted' ? 'Not Submitted' : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Seller Verification</h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Review and approve seller documents</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {['pending_review', 'approved', 'rejected'].map(status => (
                            <div key={status} onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                                className={`cursor-pointer bg-white dark:bg-charcoal-800 p-4 rounded-xl border transition-all shadow-sm hover:shadow-md flex items-center gap-4 ${statusFilter === status ? 'border-terracotta-500 ring-1 ring-terracotta-500' : 'border-cream-200 dark:border-charcoal-700 hover:border-terracotta-300'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${status === 'pending_review' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' : status === 'approved' ? 'bg-sage-100 text-sage-600 dark:bg-sage-900/20 dark:text-sage-400' : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                                    {status === 'pending_review' ? <FaClock /> : status === 'approved' ? <FaCheckCircle /> : <FaTimesCircle />}
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-charcoal-800 dark:text-white">{status === 'pending_review' ? stats.pending : status === 'approved' ? stats.approved : stats.rejected}</p>
                                    <p className="text-sm text-charcoal-500 dark:text-charcoal-400 capitalize">{status.replace('_', ' ')}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Alerts */}
                    {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}
                    {success && <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm">{success}</div>}

                    {/* Table */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal-500">Loading sellers...</p>
                            </div>
                        ) : sellers.length === 0 ? (
                            <div className="p-12 text-center">
                                <FaFileAlt className="text-5xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-2">No Sellers to Review</h3>
                                <p className="text-charcoal-500">No sellers matching your filter</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Seller</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Business Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">TIN Number</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Store Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Applied</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {sellers.map((seller) => (
                                            <tr key={seller.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-cream-200 dark:bg-charcoal-600 flex items-center justify-center text-charcoal-500 dark:text-charcoal-300">
                                                            <FaUser />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-charcoal-800 dark:text-white">{seller.name}</p>
                                                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{seller.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400">{seller.rdbVerification?.businessName || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400 font-mono">{seller.rdbVerification?.tinNumber || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400">{seller.storeName || 'N/A'}</td>
                                                <td className="px-6 py-4">{getStatusBadge(seller.rdbVerification?.documentStatus)}</td>
                                                <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400">{formatDate(seller.createdAt)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => viewSellerDetails(seller.id)} className="p-2 text-terracotta-500 hover:bg-terracotta-50 dark:hover:bg-terracotta-900/20 rounded-lg transition-colors" title="Review Documents">
                                                        <FaEye />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-cream-200 dark:border-charcoal-700">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className="px-4 py-2 text-sm font-medium text-charcoal-600 dark:text-charcoal-400 hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-lg disabled:opacity-50">Previous</button>
                                <span className="text-sm text-charcoal-600 dark:text-charcoal-400">Page {currentPage} of {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                    className="px-4 py-2 text-sm font-medium text-charcoal-600 dark:text-charcoal-400 hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-lg disabled:opacity-50">Next</button>
                            </div>
                        )}
                    </div>

                    {/* Verification Modal */}
                    {showModal && selectedSeller && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">Seller Verification Review</h3>
                                    <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"><FaTimes /></button>
                                </div>

                                <div className="p-6 overflow-y-auto space-y-6">
                                    {/* Personal Info */}
                                    <div className="bg-cream-50 dark:bg-charcoal-700/50 p-4 rounded-xl">
                                        <h4 className="text-sm font-bold text-charcoal-800 dark:text-white mb-3 uppercase tracking-wider">Personal Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="flex items-center gap-3">
                                                <FaUser className="text-charcoal-400" />
                                                <div><p className="text-xs text-charcoal-500">Full Name</p><p className="font-medium text-charcoal-800 dark:text-white">{selectedSeller.name}</p></div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <FaEnvelope className="text-charcoal-400" />
                                                <div><p className="text-xs text-charcoal-500">Email</p><p className="font-medium text-charcoal-800 dark:text-white truncate max-w-[150px]" title={selectedSeller.email}>{selectedSeller.email}</p></div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <FaPhone className="text-charcoal-400" />
                                                <div><p className="text-xs text-charcoal-500">Phone</p><p className="font-medium text-charcoal-800 dark:text-white">{selectedSeller.storePhone || 'Not provided'}</p></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Business Info */}
                                    <div className="bg-cream-50 dark:bg-charcoal-700/50 p-4 rounded-xl">
                                        <h4 className="text-sm font-bold text-charcoal-800 dark:text-white mb-3 uppercase tracking-wider">Business Information (RDB)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="flex items-center gap-3">
                                                <FaBuilding className="text-charcoal-400" />
                                                <div><p className="text-xs text-charcoal-500">Business Name</p><p className="font-medium text-charcoal-800 dark:text-white">{selectedSeller.rdbVerification?.businessName}</p></div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <FaIdCard className="text-charcoal-400" />
                                                <div><p className="text-xs text-charcoal-500">TIN Number</p><p className="font-medium text-charcoal-800 dark:text-white font-mono bg-white dark:bg-charcoal-600 px-2 py-0.5 rounded">{selectedSeller.rdbVerification?.tinNumber}</p></div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <FaFileAlt className="text-charcoal-400" />
                                                <div><p className="text-xs text-charcoal-500">Business Type</p><p className="font-medium text-charcoal-800 dark:text-white capitalize">{selectedSeller.rdbVerification?.businessType?.replace(/_/g, ' ')}</p></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Documents */}
                                    <div>
                                        <h4 className="text-sm font-bold text-charcoal-800 dark:text-white mb-3 uppercase tracking-wider">Uploaded Documents</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedSeller.rdbVerification?.rdbCertificate && (
                                                <a href={`${BASE_URL}${selectedSeller.rdbVerification.rdbCertificate}`} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-4 bg-white dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl hover:border-terracotta-500 transition-colors group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-500"><FaFileAlt /></div>
                                                        <span className="font-medium text-charcoal-800 dark:text-white">RDB Certificate</span>
                                                    </div>
                                                    <FaDownload className="text-charcoal-400 group-hover:text-terracotta-500" />
                                                </a>
                                            )}
                                            {selectedSeller.rdbVerification?.nationalId && (
                                                <a href={`${BASE_URL}${selectedSeller.rdbVerification.nationalId}`} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-4 bg-white dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl hover:border-terracotta-500 transition-colors group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-500"><FaIdCard /></div>
                                                        <span className="font-medium text-charcoal-800 dark:text-white">National ID</span>
                                                    </div>
                                                    <FaDownload className="text-charcoal-400 group-hover:text-terracotta-500" />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Terms */}
                                    <div className="bg-cream-50 dark:bg-charcoal-700/50 p-4 rounded-xl text-sm">
                                        <h4 className="font-bold text-charcoal-800 dark:text-white mb-2">Terms & Conditions</h4>
                                        <div className="grid grid-cols-2 gap-2 text-charcoal-600 dark:text-charcoal-400">
                                            <p>Accepted: <span className="font-medium text-charcoal-800 dark:text-white">{selectedSeller.termsAcceptance?.accepted ? 'Yes' : 'No'}</span></p>
                                            <p>Date: <span className="font-medium text-charcoal-800 dark:text-white">{selectedSeller.termsAcceptance?.acceptedAt ? formatDate(selectedSeller.termsAcceptance.acceptedAt) : 'N/A'}</span></p>
                                            <p className="col-span-2">Digital Signature: <span className="font-medium text-charcoal-800 dark:text-white font-mono">{selectedSeller.termsAcceptance?.digitalSignature}</span></p>
                                        </div>
                                    </div>

                                    {/* Rejection Reason Input */}
                                    {selectedSeller.rdbVerification?.documentStatus === 'pending_review' && (
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Rejection Reason (if rejecting)</label>
                                            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Explain why documents are being rejected..." rows={3}
                                                className="w-full px-4 py-3 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 resize-none" />
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {selectedSeller.rdbVerification?.documentStatus === 'pending_review' && (
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cream-200 dark:border-charcoal-700">
                                            <button onClick={() => handleVerify('approve')} disabled={processing}
                                                className="flex items-center justify-center gap-2 px-6 py-3 bg-sage-500 hover:bg-sage-600 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md">
                                                <FaCheck /> {processing ? 'Processing...' : 'Approve Seller'}
                                            </button>
                                            <button onClick={() => handleVerify('reject')} disabled={processing}
                                                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md">
                                                <FaTimes /> Reject Application
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
