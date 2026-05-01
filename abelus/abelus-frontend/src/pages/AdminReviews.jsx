import { useState, useEffect, useCallback } from 'react';
import {
    FaStar, FaCheck, FaTimes, FaEye, FaReply, FaTrash,
    FaClock, FaCheckCircle, FaTimesCircle, FaFlag,
    FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import api from '../utils/axiosInstance';

export default function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, reported: 0, averageRating: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [ratingFilter, setRatingFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedReview, setSelectedReview] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);



    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: currentPage, limit: 15, ...(statusFilter !== 'all' && { status: statusFilter }), ...(ratingFilter && { rating: ratingFilter }) });
            const res = await api.get(`/reviews-admin?${params}`);
            if (res.data.success) { setReviews(res.data.data); setStats(res.data.stats); setTotalPages(res.data.pagination.pages); }
        } catch (err) { setError('Failed to fetch reviews'); }
        finally { setLoading(false); }
    }, [currentPage, statusFilter, ratingFilter]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const viewReviewDetails = async (id) => {
        try {
            const res = await api.get(`/reviews-admin/${id}`);
            if (res.data.success) { setSelectedReview(res.data.data); setShowModal(true); }
        } catch (err) { setError('Failed to fetch review details'); }
    };

    const approveReview = async (id) => {
        setProcessing(true);
        try {
            const res = await api.put(`/reviews-admin/${id}/approve`);
            if (res.data.success) { setSuccess('Review approved'); fetchReviews(); if (showModal) setShowModal(false); }
        } catch (err) { setError('Failed to approve'); }
        finally { setProcessing(false); }
    };

    const rejectReview = async (id, reason) => {
        setProcessing(true);
        try {
            const res = await api.put(`/reviews-admin/${id}/reject`, { reason });
            if (res.data.success) { setSuccess('Review rejected'); fetchReviews(); if (showModal) setShowModal(false); }
        } catch (err) { setError('Failed to reject'); }
        finally { setProcessing(false); }
    };

    const deleteReview = async (id) => {
        if (!window.confirm('Delete this review permanently?')) return;
        try {
            const res = await api.delete(`/reviews-admin/${id}`);
            if (res.data.success) { setSuccess('Review deleted'); fetchReviews(); if (showModal) setShowModal(false); }
        } catch (err) { setError('Failed to delete'); }
    };

    const replyToReview = async (id, text) => {
        if (!text) return;
        setProcessing(true);
        try {
            const res = await api.post(`/reviews-admin/${id}/reply`, { text });
            if (res.data.success) { setSuccess('Reply added'); setSelectedReview(res.data.data); }
        } catch (err) { setError('Failed to reply'); }
        finally { setProcessing(false); }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const renderStars = (rating) => [...Array(5)].map((_, i) => (
        <FaStar key={i} className={i < rating ? 'text-sand-500' : 'text-charcoal-200 dark:text-charcoal-600'} />
    ));

    const getStatusBadge = (status) => {
        const badges = {
            pending: { icon: <FaClock />, text: 'Pending', classes: 'bg-sand-100 text-sand-700 dark:bg-sand-900/20 dark:text-sand-400' },
            approved: { icon: <FaCheckCircle />, text: 'Approved', classes: 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400' },
            rejected: { icon: <FaTimesCircle />, text: 'Rejected', classes: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' }
        };
        const badge = badges[status] || badges.pending;
        return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.classes}`}>{badge.icon} {badge.text}</span>;
    };

    useEffect(() => { if (error || success) { const timer = setTimeout(() => { setError(''); setSuccess(''); }, 3000); return () => clearTimeout(timer); } }, [error, success]);

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header with Avg Rating */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Review Management</h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Moderate customer reviews</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-sand-100 dark:bg-sand-900/20 rounded-xl">
                            <span className="text-2xl font-bold text-sand-700 dark:text-sand-400">{typeof stats.averageRating === 'number' ? stats.averageRating.toFixed(1) : '0.0'}</span>
                            <FaStar className="text-sand-500" />
                            <span className="text-sm text-sand-600 dark:text-sand-400">Avg Rating</span>
                        </div>
                    </div>

                    {/* Alerts */}
                    {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}
                    {success && <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm">{success}</div>}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <button onClick={() => { setStatusFilter('all'); setCurrentPage(1); }} className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'all' ? 'bg-terracotta-50 dark:bg-terracotta-900/20 border-terracotta-200 dark:border-terracotta-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-terracotta-200'}`}>
                            <span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.total}</span>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400 mt-1">Total Reviews</p>
                        </button>
                        <button onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }} className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'pending' ? 'bg-sand-50 dark:bg-sand-900/20 border-sand-200 dark:border-sand-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-sand-200'}`}>
                            <span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.pending}</span>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400 mt-1">Pending</p>
                        </button>
                        <button onClick={() => { setStatusFilter('approved'); setCurrentPage(1); }} className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'approved' ? 'bg-sage-50 dark:bg-sage-900/20 border-sage-200 dark:border-sage-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-sage-200'}`}>
                            <span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.approved}</span>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400 mt-1">Approved</p>
                        </button>
                        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-2"><FaFlag className="text-red-500" /><span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.reported}</span></div>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400 mt-1">Reported</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-charcoal-600 dark:text-charcoal-400">Status:</label>
                            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                className="px-3 py-2 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 text-sm">
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-charcoal-600 dark:text-charcoal-400">Rating:</label>
                            <select value={ratingFilter} onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
                                className="px-3 py-2 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 text-sm">
                                <option value="">All Ratings</option>
                                <option value="5">5 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="3">3 Stars</option>
                                <option value="2">2 Stars</option>
                                <option value="1">1 Star</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal-500 dark:text-charcoal-400">Loading reviews...</p>
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="p-12 text-center">
                                <FaStar className="text-5xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-2">No Reviews Found</h3>
                                <p className="text-charcoal-500 dark:text-charcoal-400">No reviews match your filters</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden md:table-cell">Customer</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Rating</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden lg:table-cell">Comment</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {reviews.map((review) => (
                                            <tr key={review.id} className={`hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors ${review.reported ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-charcoal-800 dark:text-white">{review.product?.name || 'Unknown'}</span>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <span className="text-charcoal-600 dark:text-charcoal-400">{review.user?.name || 'Anonymous'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-0.5">{renderStars(review.rating)}</div>
                                                </td>
                                                <td className="px-6 py-4 hidden lg:table-cell">
                                                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400 line-clamp-2">{review.comment?.substring(0, 80)}...</p>
                                                </td>
                                                <td className="px-6 py-4">{getStatusBadge(review.status)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => viewReviewDetails(review.id)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View"><FaEye /></button>
                                                        {review.status !== 'approved' && (
                                                            <button onClick={() => approveReview(review.id)} className="p-2 rounded-lg text-sage-500 hover:bg-sage-50 dark:hover:bg-sage-900/20 transition-colors" title="Approve"><FaCheck /></button>
                                                        )}
                                                        {review.status !== 'rejected' && (
                                                            <button onClick={() => viewReviewDetails(review.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Reject"><FaTimes /></button>
                                                        )}
                                                        <button onClick={() => deleteReview(review.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete"><FaTrash /></button>
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

                    {/* Modal */}
                    {showModal && selectedReview && (
                        <ReviewModal review={selectedReview} onClose={() => { setShowModal(false); setSelectedReview(null); }} onApprove={approveReview} onReject={rejectReview} onReply={replyToReview} onDelete={deleteReview} processing={processing} renderStars={renderStars} formatDate={formatDate} getStatusBadge={getStatusBadge} />
                    )}
                </main>
            </div>
        </div>
    );
}

// Review Modal Component
function ReviewModal({ review, onClose, onApprove, onReject, onReply, onDelete, processing, renderStars, formatDate, getStatusBadge }) {
    const [rejectReason, setRejectReason] = useState('');
    const [replyText, setReplyText] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">Review Details</h3>
                    <button onClick={onClose} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"><FaTimes /></button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                    {/* Rating & Status */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                            <span className="text-lg font-bold text-charcoal-800 dark:text-white">{review.rating}/5</span>
                        </div>
                        {getStatusBadge(review.status)}
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-cream-50 dark:bg-charcoal-700 rounded-xl">
                        <div>
                            <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase">Product</label>
                            <p className="font-medium text-charcoal-800 dark:text-white">{review.product?.name}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase">Customer</label>
                            <p className="font-medium text-charcoal-800 dark:text-white">{review.user?.name}</p>
                            <p className="text-xs text-charcoal-500">{review.user?.email}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase">Date</label>
                            <p className="font-medium text-charcoal-800 dark:text-white">{formatDate(review.createdAt)}</p>
                        </div>
                    </div>

                    {/* Comment */}
                    <div>
                        <h5 className="text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-2">Review Comment</h5>
                        <p className="text-charcoal-600 dark:text-charcoal-400">{review.comment}</p>
                    </div>

                    {/* Existing Reply */}
                    {review.reply?.text && (
                        <div className="p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 rounded-xl">
                            <h5 className="text-sm font-bold text-sage-700 dark:text-sage-400 mb-2">Admin Reply</h5>
                            <p className="text-charcoal-600 dark:text-charcoal-400">{review.reply.text}</p>
                            <span className="text-xs text-charcoal-500 mt-2 block">{formatDate(review.reply.createdAt)}</span>
                        </div>
                    )}

                    {/* Reply Form */}
                    {!review.reply?.text && (
                        <div>
                            <h5 className="text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-2">Add Reply</h5>
                            <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your reply..."
                                rows={3} className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors resize-none" />
                            <button onClick={() => onReply(review.id, replyText)} disabled={processing || !replyText}
                                className="flex items-center gap-2 mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all">
                                <FaReply /> Send Reply
                            </button>
                        </div>
                    )}

                    {/* Rejection Reason */}
                    {review.status !== 'rejected' && (
                        <div>
                            <h5 className="text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-2">Rejection Reason (if rejecting)</h5>
                            <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..."
                                className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors" />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-cream-200 dark:border-charcoal-700">
                        {review.status !== 'approved' && (
                            <button onClick={() => onApprove(review.id)} disabled={processing} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sage-500 hover:bg-sage-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all">
                                <FaCheck /> Approve
                            </button>
                        )}
                        {review.status !== 'rejected' && (
                            <button onClick={() => onReject(review.id, rejectReason)} disabled={processing} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all">
                                <FaTimes /> Reject
                            </button>
                        )}
                        <button onClick={() => onDelete(review.id)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-charcoal-500 hover:bg-charcoal-600 text-white rounded-xl font-medium transition-all">
                            <FaTrash /> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
