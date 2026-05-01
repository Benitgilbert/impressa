import { useState, useEffect, useCallback } from 'react';
import {
    FaEnvelope, FaSearch, FaTrash, FaDownload, FaUsers,
    FaUserCheck, FaUserTimes, FaChevronLeft, FaChevronRight,
    FaPaperPlane, FaTimes, FaEye
} from 'react-icons/fa';
import api from '../utils/axiosInstance';
import { NEWSLETTER_TEMPLATES } from '../data/newsletterTemplates';

export default function AdminSubscribers() {
    const [subscribers, setSubscribers] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [recipientType, setRecipientType] = useState('subscribers');
    const [recipientId, setRecipientId] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [sending, setSending] = useState(false);

    // Dynamic Template State
    const [activeTemplateKey, setActiveTemplateKey] = useState(null);
    const [templateValues, setTemplateValues] = useState({});
    const [showPreview, setShowPreview] = useState(false);



    useEffect(() => { if (error || success) { const t = setTimeout(() => { setError(''); setSuccess(''); }, 3000); return () => clearTimeout(t); } }, [error, success]);
    useEffect(() => {
        if (activeTemplateKey && NEWSLETTER_TEMPLATES[activeTemplateKey]) {
            const template = NEWSLETTER_TEMPLATES[activeTemplateKey];
            setEmailMessage(typeof template.html === 'function' ? template.html(templateValues) : template.html);
        }
    }, [activeTemplateKey, templateValues]);

    const fetchSubscribers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: currentPage, limit: 20, ...(statusFilter !== 'all' && { status: statusFilter }) });
            const res = await api.get(`/newsletter/subscribers?${params}`);
            if (res.data.success) { setSubscribers(res.data.data); setStats(res.data.stats); setTotalPages(res.data.pagination.pages); }
            else setError(res.data.message || 'Failed to fetch subscribers');
        } catch (err) { setError('Failed to fetch subscribers'); }
        finally { setLoading(false); }
    }, [currentPage, statusFilter]);

    useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this subscriber permanently?')) return;
        try {
            const res = await api.delete(`/newsletter/subscribers/${id}`);
            if (res.data.success) { setSuccess('Subscriber removed'); fetchSubscribers(); }
            else setError(res.data.message || 'Failed to delete');
        } catch (err) { setError('Failed to delete subscriber'); }
    };

    const handleExport = async () => {
        try {
            const res = await api.get('/newsletter/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url; a.download = 'subscribers.csv'; a.click();
            window.URL.revokeObjectURL(url); setSuccess('Export downloaded!');
        } catch (err) { setError('Failed to export'); }
    };

    const handleTemplateSelect = (key) => {
        const template = NEWSLETTER_TEMPLATES[key];
        setActiveTemplateKey(key); setTemplateValues({}); setEmailSubject(template.subject);
    };

    const handleSendNewsletter = async (e) => {
        e.preventDefault(); setSending(true);
        try {
            const res = await api.post('/newsletter/send', { subject: emailSubject, message: emailMessage, recipientType, recipientId: recipientType === 'specific' ? recipientId : undefined });
            if (res.data.success) { setSuccess(res.data.message); setShowModal(false); setEmailSubject(''); setEmailMessage(''); setRecipientType('subscribers'); setRecipientId(''); }
            else setError(res.data.message || 'Failed to send newsletter');
        } catch (err) { setError('Failed to send newsletter'); }
        finally { setSending(false); }
    };

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Newsletter Subscribers</h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Manage subscriptions and campaigns</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-300 rounded-xl hover:bg-cream-50 dark:hover:bg-charcoal-700 transition-colors shadow-sm">
                                <FaDownload /> Export CSV
                            </button>
                            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-bold transition-all shadow-md">
                                <FaPaperPlane /> Send Newsletter
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 flex items-center justify-between">
                            <div>
                                <p className="text-charcoal-500 dark:text-charcoal-400 text-sm font-medium">Total Subscribers</p>
                                <h3 className="text-3xl font-bold text-charcoal-800 dark:text-white mt-1">{stats.total}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl"><FaUsers /></div>
                        </div>
                        <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 flex items-center justify-between">
                            <div>
                                <p className="text-charcoal-500 dark:text-charcoal-400 text-sm font-medium">Active Subscribers</p>
                                <h3 className="text-3xl font-bold text-charcoal-800 dark:text-white mt-1">{stats.active}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-sage-100 dark:bg-sage-900/20 flex items-center justify-center text-sage-600 dark:text-sage-400 text-xl"><FaUserCheck /></div>
                        </div>
                        <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 flex items-center justify-between">
                            <div>
                                <p className="text-charcoal-500 dark:text-charcoal-400 text-sm font-medium">Unsubscribed</p>
                                <h3 className="text-3xl font-bold text-charcoal-800 dark:text-white mt-1">{stats.inactive}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-charcoal-100 dark:bg-charcoal-700 flex items-center justify-center text-charcoal-500 dark:text-charcoal-400 text-xl"><FaUserTimes /></div>
                        </div>
                    </div>

                    {/* Alerts */}
                    {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}
                    {success && <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm">{success}</div>}

                    {/* Filters & Table */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        <div className="p-4 border-b border-cream-100 dark:border-charcoal-700 flex flex-col md:flex-row gap-4 justify-between">
                            <div className="relative w-full md:w-64">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                                <input type="text" placeholder="Search by email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white text-sm outline-none focus:border-terracotta-500" />
                            </div>
                            <div className="flex gap-2">
                                {['all', 'active', 'inactive'].map((status) => (
                                    <button key={status} onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                                        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${statusFilter === status ? 'bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/30 dark:text-terracotta-400' : 'text-charcoal-500 hover:bg-cream-100 dark:hover:bg-charcoal-700'}`}>
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-charcoal-500">Loading subscribers...</div>
                        ) : subscribers.length === 0 ? (
                            <div className="p-12 text-center text-charcoal-500">
                                <FaEnvelope className="text-4xl mx-auto mb-3 opacity-20" />
                                <p>No subscribers found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Source</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Subscribed Date</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {subscribers.map((sub) => (
                                            <tr key={sub.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-charcoal-800 dark:text-white font-medium flex items-center gap-2">
                                                    <FaEnvelope className="text-charcoal-400" /> {sub.email}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sub.isActive ? 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400' : 'bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-400'}`}>
                                                        {sub.isActive ? 'Active' : 'Unsubscribed'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400 capitalize">{sub.source || 'homepage'}</td>
                                                <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400">{new Date(sub.subscribedAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => handleDelete(sub.id)} className="p-2 text-charcoal-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><FaTrash /></button>
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
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 text-charcoal-500 hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-lg disabled:opacity-30"><FaChevronLeft /></button>
                                <span className="text-sm text-charcoal-600 dark:text-charcoal-400">Page {currentPage} of {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 text-charcoal-500 hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-lg disabled:opacity-30"><FaChevronRight /></button>
                            </div>
                        )}
                    </div>

                    {/* Newsletter Modal */}
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">Send Newsletter</h3>
                                    <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"><FaTimes /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6">
                                    <form onSubmit={handleSendNewsletter} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Recipient</label>
                                                <select value={recipientType} onChange={(e) => setRecipientType(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500">
                                                    <option value="subscribers">All Subscribers</option>
                                                    <option value="customers">All Customers</option>
                                                    <option value="sellers">All Sellers</option>
                                                    <option value="specific">Specific User ID</option>
                                                </select>
                                                {recipientType === 'specific' && (
                                                    <input type="text" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} placeholder="Enter User ID" required
                                                        className="mt-3 w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Subject</label>
                                                <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Email Subject" required
                                                    className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3">Templates</label>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(NEWSLETTER_TEMPLATES).map(([key, template]) => (
                                                    <button key={key} type="button" onClick={() => handleTemplateSelect(key)}
                                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${activeTemplateKey === key ? 'bg-terracotta-50 border-terracotta-500 text-terracotta-600 dark:text-terracotta-400' : 'bg-white dark:bg-charcoal-700 border-cream-200 dark:border-charcoal-600 text-charcoal-600 dark:text-charcoal-300'}`}>
                                                        {template.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {activeTemplateKey && NEWSLETTER_TEMPLATES[activeTemplateKey].fields && (
                                            <div className="bg-cream-50 dark:bg-charcoal-700/50 p-4 rounded-xl border border-cream-100 dark:border-charcoal-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {NEWSLETTER_TEMPLATES[activeTemplateKey].fields.map((field) => (
                                                    <div key={field.name} className={field.type === 'textarea' ? 'col-span-2' : ''}>
                                                        <label className="block text-xs font-bold text-charcoal-500 dark:text-charcoal-400 mb-1">{field.label}</label>
                                                        {field.type === 'textarea' ? (
                                                            <textarea value={templateValues[field.name] || ''} onChange={(e) => setTemplateValues(prev => ({ ...prev, [field.name]: e.target.value }))} placeholder={field.placeholder} rows={3}
                                                                className="w-full px-3 py-2 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-600 rounded-lg text-sm text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                                        ) : (
                                                            <input type="text" value={templateValues[field.name] || ''} onChange={(e) => setTemplateValues(prev => ({ ...prev, [field.name]: e.target.value }))} placeholder={field.placeholder}
                                                                className="w-full px-3 py-2 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-600 rounded-lg text-sm text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-sm font-medium text-charcoal-700 dark:text-charcoal-300">Email Content (HTML)</label>
                                                <button type="button" onClick={() => setShowPreview(true)} className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1"><FaEye /> Preview</button>
                                            </div>
                                            <textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} rows={8} required
                                                className="w-full px-4 py-3 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white font-mono text-sm outline-none focus:border-terracotta-500 resize-none" />
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-cream-200 dark:border-charcoal-700">
                                            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-charcoal-600 dark:text-charcoal-300 font-medium hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-xl transition-colors">Cancel</button>
                                            <button type="submit" disabled={sending} className="flex items-center gap-2 px-6 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-70 text-white font-bold rounded-xl shadow-lg transition-all">
                                                {sending ? 'Sending...' : <><FaPaperPlane /> Send Campaign</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview Modal */}
                    {showPreview && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
                            <div className="bg-white rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                                    <h3 className="text-lg font-bold text-gray-800">Email Preview</h3>
                                    <button onClick={() => setShowPreview(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"><FaTimes /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
                                    <div className="bg-white shadow-sm mx-auto max-w-2xl min-h-[400px]" dangerouslySetInnerHTML={{ __html: emailMessage }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
