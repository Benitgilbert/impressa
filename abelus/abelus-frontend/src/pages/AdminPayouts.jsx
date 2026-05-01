import { useState, useEffect, useCallback } from 'react';
import {
    FaCheck, FaTimes, FaEye,
    FaClock, FaSpinner, FaCheckCircle, FaTimesCircle,
    FaChevronLeft, FaChevronRight, FaStore, FaHandHoldingUsd, FaReceipt
} from 'react-icons/fa';
import api from '../utils/axiosInstance';

export default function AdminPayouts() {
    const [payouts, setPayouts] = useState([]);
    const [stats, setStats] = useState({ pendingCount: 0, pendingAmount: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    const fetchPayouts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ 
                page: currentPage, 
                limit: 15, 
                ...(statusFilter !== 'all' && { status: statusFilter }) 
            });
            const res = await api.get(`/commissions/payouts?${params.toString()}`);
            if (res.data.success) { 
                setPayouts(res.data.data); 
                setStats(res.data.stats || { pendingCount: 0, pendingAmount: 0 }); 
                setTotalPages(res.data.pagination?.pages || 1); 
            }
        } catch (err) { 
            console.error('Payout fetch error:', err);
            setError('Failed to fetch payouts'); 
        } finally { 
            setLoading(false); 
        }
    }, [currentPage, statusFilter]);

    useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

    const handleProcess = async (action, transactionId = '', rejectionReason = '') => {
        setProcessing(true);
        try {
            const res = await api.put(`/commissions/payouts/${selectedPayout.id || selectedPayout.id}`, {
                action, transactionId, rejectionReason
            });
            if (res.data.success) { 
                setSuccess(res.data.message); 
                setShowModal(false); 
                setSelectedPayout(null); 
                fetchPayouts(); 
            } else {
                setError(res.data.message || 'Failed to process payout');
            }
        } catch (err) { 
            setError('Failed to process payout'); 
        } finally { 
            setProcessing(false); 
        }
    };

    const formatCurrency = (amount) => `RWF ${amount?.toLocaleString() || 0}`;
    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
            processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
            completed: 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400',
            rejected: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
            cancelled: 'bg-charcoal-100 text-charcoal-700 dark:bg-charcoal-700 dark:text-charcoal-400'
        };
        const icons = {
            pending: <FaClock className="text-xs" />,
            processing: <FaSpinner className="text-xs animate-spin" />,
            completed: <FaCheckCircle className="text-xs" />,
            rejected: <FaTimesCircle className="text-xs" />,
            cancelled: <FaTimes className="text-xs" />
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}>
                {icons[status] || icons.pending} {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header with Stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Payout Requests</h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Manage seller withdrawal requests</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="px-4 py-2 bg-white dark:bg-charcoal-800 rounded-xl border border-cream-200 dark:border-charcoal-700 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-600 dark:text-yellow-400"><FaClock /></div>
                                <div><p className="text-xs text-charcoal-500 dark:text-charcoal-400">Pending</p><p className="font-bold text-charcoal-800 dark:text-white">{stats.pendingCount}</p></div>
                            </div>
                            <div className="px-4 py-2 bg-white dark:bg-charcoal-800 rounded-xl border border-cream-200 dark:border-charcoal-700 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-sage-100 dark:bg-sage-900/20 flex items-center justify-center text-sage-600 dark:text-sage-400"><FaHandHoldingUsd /></div>
                                <div><p className="text-xs text-charcoal-500 dark:text-charcoal-400">Amount</p><p className="font-bold text-charcoal-800 dark:text-white">{formatCurrency(stats.pendingAmount)}</p></div>
                            </div>
                        </div>
                    </div>

                    {/* Alerts */}
                    {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}
                    {success && <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm">{success}</div>}

                    {/* Content Section */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {/* Filters */}
                        <div className="p-4 border-b border-cream-200 dark:border-charcoal-700 overflow-x-auto">
                            <div className="flex gap-2">
                                {['pending', 'processing', 'completed', 'rejected', 'all'].map((status) => (
                                    <button key={status} onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === status ? 'bg-terracotta-500 text-white' : 'text-charcoal-600 dark:text-charcoal-400 hover:bg-cream-100 dark:hover:bg-charcoal-700'}`}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Table */}
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal-500">Loading payouts...</p>
                            </div>
                        ) : payouts.length === 0 ? (
                            <div className="p-12 text-center">
                                <FaReceipt className="text-5xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-2">No Payouts Found</h3>
                                <p className="text-charcoal-500">No payout requests matching your filter</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Seller</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Method</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Requested</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {payouts.map((payout) => (
                                            <tr key={payout.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-mono text-charcoal-600 dark:text-charcoal-400">{payout.payoutId}</td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-charcoal-800 dark:text-white">{payout.seller?.storeName || payout.seller?.name}</p>
                                                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{payout.seller?.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-charcoal-800 dark:text-white">{formatCurrency(payout.amount)}</td>
                                                <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400 capitalize">{payout.paymentMethod?.replace('_', ' ')}</td>
                                                <td className="px-6 py-4">{getStatusBadge(payout.status)}</td>
                                                <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400">{formatDate(payout.createdAt)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => { setSelectedPayout(payout); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="View Details"><FaEye /></button>
                                                        {payout.status === 'pending' && (
                                                            <>
                                                                <button onClick={() => { setSelectedPayout(payout); setShowModal(true); }} className="p-2 text-sage-500 hover:bg-sage-50 dark:hover:bg-sage-900/20 rounded-lg transition-colors" title="Approve"><FaCheck /></button>
                                                                <button onClick={() => { setSelectedPayout(payout); setShowModal(true); }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Reject"><FaTimes /></button>
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-cream-200 dark:border-charcoal-700">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className="p-2 rounded-lg text-charcoal-500 hover:bg-cream-100 dark:hover:bg-charcoal-700 disabled:opacity-50"><FaChevronLeft /></button>
                                <span className="text-sm text-charcoal-600 dark:text-charcoal-400">Page {currentPage} of {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg text-charcoal-500 hover:bg-cream-100 dark:hover:bg-charcoal-700 disabled:opacity-50"><FaChevronRight /></button>
                            </div>
                        )}
                    </div>

                    {/* Payout Modal */}
                    {showModal && selectedPayout && (
                        <PayoutModal payout={selectedPayout} onClose={() => { setShowModal(false); setSelectedPayout(null); }} onProcess={handleProcess} processing={processing} formatCurrency={formatCurrency} formatDate={formatDate} getStatusBadge={getStatusBadge} />
                    )}
                </main>
            </div>
        </div>
    );
}

function PayoutModal({ payout, onClose, onProcess, processing, formatCurrency, formatDate, getStatusBadge }) {
    const [transactionId, setTransactionId] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">Payout Details - {payout.payoutId}</h3>
                    <button onClick={onClose} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"><FaTimes /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Seller Info */}
                    <div className="flex items-start gap-4 p-4 bg-cream-50 dark:bg-charcoal-700/50 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-terracotta-100 dark:bg-terracotta-900/20 flex items-center justify-center text-terracotta-600 dark:text-terracotta-400 shrink-0">
                            <FaStore className="text-xl" />
                        </div>
                        <div>
                            <h4 className="font-bold text-charcoal-800 dark:text-white">{payout.seller?.storeName || payout.seller?.name}</h4>
                            <p className="text-sm text-charcoal-500 dark:text-charcoal-400">{payout.seller?.email}</p>
                            {payout.seller?.storePhone && <p className="text-sm text-charcoal-500 dark:text-charcoal-400">{payout.seller.storePhone}</p>}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-cream-50 dark:bg-charcoal-700/50 rounded-xl">
                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1">Amount</p>
                            <p className="font-bold text-charcoal-800 dark:text-white">{formatCurrency(payout.amount)}</p>
                        </div>
                        <div className="p-3 bg-cream-50 dark:bg-charcoal-700/50 rounded-xl">
                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1">Status</p>
                            <div className="mt-1">{getStatusBadge(payout.status)}</div>
                        </div>
                        <div className="p-3 bg-cream-50 dark:bg-charcoal-700/50 rounded-xl">
                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1">Payment Method</p>
                            <p className="text-sm font-medium text-charcoal-800 dark:text-white capitalize">{payout.paymentMethod?.replace('_', ' ')}</p>
                        </div>
                        <div className="p-3 bg-cream-50 dark:bg-charcoal-700/50 rounded-xl">
                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1">Orders Included</p>
                            <p className="text-sm font-medium text-charcoal-800 dark:text-white">{payout.earningsCount} orders</p>
                        </div>
                    </div>

                    {/* Payment Information */}
                    {payout.paymentDetails && (
                        <div>
                            <h5 className="text-sm font-bold text-charcoal-800 dark:text-white mb-3">Payment Information</h5>
                            <div className="space-y-2 text-sm">
                                {payout.paymentDetails.mobileNumber && (
                                    <div className="flex justify-between py-2 border-b border-cream-100 dark:border-charcoal-700">
                                        <span className="text-charcoal-500 dark:text-charcoal-400">Mobile Number</span>
                                        <span className="font-medium text-charcoal-800 dark:text-white">{payout.paymentDetails.mobileNumber}</span>
                                    </div>
                                )}
                                {payout.paymentDetails.bankName && (
                                    <>
                                        <div className="flex justify-between py-2 border-b border-cream-100 dark:border-charcoal-700">
                                            <span className="text-charcoal-500 dark:text-charcoal-400">Bank</span>
                                            <span className="font-medium text-charcoal-800 dark:text-white">{payout.paymentDetails.bankName}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-cream-100 dark:border-charcoal-700">
                                            <span className="text-charcoal-500 dark:text-charcoal-400">Account</span>
                                            <span className="font-medium text-charcoal-800 dark:text-white">{payout.paymentDetails.accountNumber}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {payout.status === 'pending' && (
                        <div className="pt-4 border-t border-cream-200 dark:border-charcoal-700 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Transaction ID (for approval)</label>
                                <input type="text" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="Enter transaction reference"
                                    className="w-full px-4 py-2 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Rejection Reason</label>
                                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Reason for rejection..." rows={2}
                                    className="w-full px-4 py-2 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button onClick={() => onProcess('complete', transactionId)} disabled={processing}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sage-500 hover:bg-sage-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all">
                                    <FaCheck /> {processing ? 'Processing...' : 'Approve'}
                                </button>
                                <button onClick={() => onProcess('reject', '', rejectionReason)} disabled={processing}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all">
                                    <FaTimes /> Reject
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
