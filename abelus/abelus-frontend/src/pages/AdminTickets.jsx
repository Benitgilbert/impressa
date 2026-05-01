import { useState, useEffect, useCallback } from 'react';
import {
    FaTicketAlt, FaEye, FaReply, FaTrash,
    FaClock, FaCheckCircle, FaSpinner, FaExclamationTriangle,
    FaChevronLeft, FaChevronRight, FaTimes, FaUser
} from 'react-icons/fa';
import api from '../utils/axiosInstance';

export default function AdminTickets() {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, waiting: 0, resolved: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('open');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [processing, setProcessing] = useState(false);


    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: currentPage, limit: 15, ...(statusFilter !== 'all' && { status: statusFilter }) });
            const res = await api.get(`/tickets/admin?${params}`);
            if (res.data.success) { setTickets(res.data.data); setStats(res.data.stats); setTotalPages(res.data.pagination.pages); }
        } catch (err) { setError('Failed to fetch tickets'); }
        finally { setLoading(false); }
    }, [currentPage, statusFilter]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    const viewTicketDetails = async (id) => {
        try {
            const res = await api.get(`/tickets/admin/${id}`);
            if (res.data.success) { setSelectedTicket(res.data.data); setShowModal(true); }
        } catch (err) { setError('Failed to fetch details'); }
    };

    const sendReply = async () => {
        if (!replyText.trim()) return;
        setProcessing(true);
        try {
            const res = await api.post(`/tickets/admin/${selectedTicket.id}/message`, { message: replyText });
            if (res.data.success) { setSelectedTicket(res.data.data); setReplyText(''); setSuccess('Reply sent'); }
        } catch (err) { setError('Failed to send reply'); }
        finally { setProcessing(false); }
    };

    const updateStatus = async (id, status) => {
        try {
            const res = await api.put(`/tickets/admin/${id}/status`, { status });
            if (res.data.success) { setSuccess(`Ticket ${status.replace('_', ' ')}`); fetchTickets(); if (showModal && selectedTicket?.id === id) setSelectedTicket({ ...selectedTicket, status }); }
        } catch (err) { setError('Failed to update status'); }
    };

    const deleteTicket = async (id) => {
        if (!window.confirm('Delete this ticket?')) return;
        try {
            const res = await api.delete(`/tickets/admin/${id}`);
            if (res.data.success) { setSuccess('Ticket deleted'); fetchTickets(); if (showModal) setShowModal(false); }
        } catch (err) { setError('Failed to delete'); }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const getStatusBadge = (status) => {
        const badges = {
            open: { icon: <FaClock />, text: 'Open', classes: 'bg-sand-100 text-sand-700 dark:bg-sand-900/20 dark:text-sand-400' },
            in_progress: { icon: <FaSpinner />, text: 'In Progress', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
            waiting: { icon: <FaExclamationTriangle />, text: 'Waiting', classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
            resolved: { icon: <FaCheckCircle />, text: 'Resolved', classes: 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400' },
            closed: { icon: <FaCheckCircle />, text: 'Closed', classes: 'bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-300' }
        };
        const badge = badges[status] || badges.open;
        return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.classes}`}>{badge.icon} {badge.text}</span>;
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            urgent: 'bg-red-500 text-white',
            high: 'bg-orange-500 text-white',
            medium: 'bg-blue-500 text-white',
            low: 'bg-charcoal-400 text-white'
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${colors[priority] || colors.medium}`}>{priority}</span>;
    };

    useEffect(() => { if (error || success) { const timer = setTimeout(() => { setError(''); setSuccess(''); }, 3000); return () => clearTimeout(timer); } }, [error, success]);

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Support Tickets</h1>
                        <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Manage customer support requests</p>
                    </div>

                    {/* Alerts */}
                    {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}
                    {success && <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm">{success}</div>}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <button onClick={() => { setStatusFilter('all'); setCurrentPage(1); }} className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'all' ? 'bg-terracotta-50 dark:bg-terracotta-900/20 border-terracotta-200 dark:border-terracotta-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-terracotta-200'}`}>
                            <span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.total}</span>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400 mt-1">Total</p>
                        </button>
                        <button onClick={() => { setStatusFilter('open'); setCurrentPage(1); }} className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'open' ? 'bg-sand-50 dark:bg-sand-900/20 border-sand-200 dark:border-sand-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-sand-200'}`}>
                            <span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.open}</span>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400 mt-1">Open</p>
                        </button>
                        <button onClick={() => { setStatusFilter('in_progress'); setCurrentPage(1); }} className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'in_progress' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-blue-200'}`}>
                            <span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.inProgress}</span>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400 mt-1">In Progress</p>
                        </button>
                        <button onClick={() => { setStatusFilter('waiting'); setCurrentPage(1); }} className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'waiting' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-orange-200'}`}>
                            <span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.waiting}</span>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400 mt-1">Waiting</p>
                        </button>
                        <button onClick={() => { setStatusFilter('resolved'); setCurrentPage(1); }} className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'resolved' ? 'bg-sage-50 dark:bg-sage-900/20 border-sage-200 dark:border-sage-800' : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-sage-200'}`}>
                            <span className="text-2xl font-bold text-charcoal-800 dark:text-white">{stats.resolved}</span>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400 mt-1">Resolved</p>
                        </button>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {['open', 'in_progress', 'waiting', 'resolved', 'all'].map(s => (
                            <button key={s} onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === s ? 'bg-terracotta-500 text-white' : 'bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 hover:border-terracotta-500'}`}>
                                {s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal-500 dark:text-charcoal-400">Loading tickets...</p>
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="p-12 text-center">
                                <FaTicketAlt className="text-5xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-2">No Tickets</h3>
                                <p className="text-charcoal-500 dark:text-charcoal-400">No tickets match your filter</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Subject</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden md:table-cell">From</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden lg:table-cell">Category</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Priority</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {tickets.map(ticket => (
                                            <tr key={ticket.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-sm text-terracotta-600 dark:text-terracotta-400">{ticket.ticketId}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-charcoal-800 dark:text-white">{ticket.subject?.substring(0, 40)}...</span>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <span className="text-charcoal-600 dark:text-charcoal-400">{ticket.createdBy?.name || 'Unknown'}</span>
                                                </td>
                                                <td className="px-6 py-4 hidden lg:table-cell">
                                                    <span className="px-2 py-0.5 bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300 rounded text-xs capitalize">{ticket.category}</span>
                                                </td>
                                                <td className="px-6 py-4">{getPriorityBadge(ticket.priority)}</td>
                                                <td className="px-6 py-4">{getStatusBadge(ticket.status)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => viewTicketDetails(ticket.id)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View"><FaEye /></button>
                                                        <button onClick={() => deleteTicket(ticket.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete"><FaTrash /></button>
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

                    {/* Ticket Modal */}
                    {showModal && selectedTicket && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                    <div>
                                        <span className="font-mono text-sm text-terracotta-600 dark:text-terracotta-400">{selectedTicket.ticketId}</span>
                                        <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">{selectedTicket.subject}</h3>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"><FaTimes /></button>
                                </div>

                                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                                    {/* Meta Info */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-cream-50 dark:bg-charcoal-700 rounded-xl">
                                        <div><label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase">From</label><p className="font-medium text-charcoal-800 dark:text-white text-sm">{selectedTicket.createdBy?.name}</p></div>
                                        <div><label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase">Role</label><p className="font-medium text-charcoal-800 dark:text-white text-sm capitalize">{selectedTicket.createdByRole}</p></div>
                                        <div><label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase">Priority</label><div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div></div>
                                        <div><label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase">Status</label><div className="mt-1">{getStatusBadge(selectedTicket.status)}</div></div>
                                    </div>

                                    {/* Messages */}
                                    <div>
                                        <h5 className="text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-3">Conversation</h5>
                                        <div className="space-y-3 max-h-60 overflow-y-auto">
                                            {selectedTicket.messages?.map((msg, i) => (
                                                <div key={i} className={`p-3 rounded-xl ${msg.senderRole === 'admin' ? 'bg-terracotta-50 dark:bg-terracotta-900/20 ml-4' : 'bg-cream-100 dark:bg-charcoal-700 mr-4'}`}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <FaUser className="text-xs text-charcoal-400" />
                                                        <span className="font-medium text-sm text-charcoal-800 dark:text-white">{msg.sender?.name || 'Unknown'}</span>
                                                        <span className="px-1.5 py-0.5 bg-charcoal-200 dark:bg-charcoal-600 text-charcoal-600 dark:text-charcoal-300 rounded text-xs capitalize">{msg.senderRole}</span>
                                                        <span className="text-xs text-charcoal-400 ml-auto">{formatDate(msg.createdAt)}</span>
                                                    </div>
                                                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{msg.message}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Reply */}
                                    {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                                        <div>
                                            <h5 className="text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-2">Reply</h5>
                                            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..."
                                                rows={3} className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors resize-none" />
                                            <button onClick={sendReply} disabled={processing || !replyText.trim()}
                                                className="flex items-center gap-2 mt-2 px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all">
                                                <FaReply /> {processing ? 'Sending...' : 'Send Reply'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Status Actions */}
                                    <div>
                                        <h5 className="text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-2">Update Status</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {['in_progress', 'waiting', 'resolved', 'closed'].map(s => (
                                                <button key={s} onClick={() => updateStatus(selectedTicket.id, s)} disabled={selectedTicket.status === s}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed capitalize ${s === 'in_progress' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400' :
                                                        s === 'waiting' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400' :
                                                            s === 'resolved' ? 'bg-sage-100 text-sage-700 hover:bg-sage-200 dark:bg-sage-900/20 dark:text-sage-400' :
                                                                'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200 dark:bg-charcoal-700 dark:text-charcoal-300'
                                                        }`}>
                                                    {s.replace('_', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
