import { useState, useEffect, useCallback } from 'react';
import {
    FaExclamationTriangle, FaEye, FaTimes, FaCheck,
    FaClock, FaUserSlash, FaBan, FaChartLine,
    FaExclamationCircle, FaCheckCircle
} from 'react-icons/fa';
import api from '../utils/axiosInstance';

export default function AdminViolations() {
    const [violations, setViolations] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, warning: 0, review: 0, suspension: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedViolation, setSelectedViolation] = useState(null);
    const [showModal, setShowModal] = useState(false);


    const fetchViolations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/violations?status=${statusFilter}&type=${typeFilter}&page=${currentPage}`);
            const data = res.data;

            setViolations(data.violations || []);
            setStats(data.stats || { total: 0, active: 0, warning: 0, review: 0, suspension: 0 });
        } catch (err) {
            console.error(err);
            setError('Failed to fetch violations');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, typeFilter, currentPage]);

    useEffect(() => {
        fetchViolations();
    }, [fetchViolations]);

    const handleDismiss = async (id) => {
        if (!window.confirm('Dismiss this violation? This will remove penalty points from the seller.')) return;
        try {
            const res = await api.put(`/violations/${id}/status`, { status: 'dismissed' });

            if (res.data) {
                setSuccess('Violation dismissed');
                fetchViolations();
            } else {
                setError('Failed to dismiss violation');
            }
        } catch (err) {
            setError('Failed to dismiss violation');
        }
    };

    const handleEscalate = async (id) => {
        if (!window.confirm('Escalate this violation? This may lead to seller suspension.')) return;
        try {
            const res = await api.put(`/violations/${id}/status`, { status: 'suspension' });

            if (res.data) {
                setSuccess('Violation escalated');
                fetchViolations();
            } else {
                setError('Failed to escalate violation');
            }
        } catch (err) {
            setError('Failed to escalate violation');
        }
    };



    const getTypeBadge = (type) => {
        const types = {
            high_cancellation_rate: { icon: <FaBan />, label: 'High Cancellations', classes: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
            slow_fulfillment: { icon: <FaClock />, label: 'Slow Fulfillment', classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
            low_rating: { icon: <FaChartLine />, label: 'Low Rating', classes: 'bg-sand-100 text-sand-700 dark:bg-sand-900/20 dark:text-sand-400' },
            policy_violation: { icon: <FaExclamationTriangle />, label: 'Policy Violation', classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' }
        };
        const badge = types[type] || types.policy_violation;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${badge.classes}`}>
                {badge.icon} {badge.label}
            </span>
        );
    };

    const getSeverityBadge = (severity) => {
        const badges = {
            low: 'bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-300',
            medium: 'bg-sand-100 text-sand-700 dark:bg-sand-900/20 dark:text-sand-400',
            high: 'bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/20 dark:text-terracotta-400',
            critical: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${badges[severity] || badges.medium}`}>
                {severity}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: { icon: <FaExclamationCircle />, text: 'Active', classes: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
            warning: { icon: <FaExclamationTriangle />, text: 'Warning', classes: 'bg-sand-100 text-sand-700 dark:bg-sand-900/20 dark:text-sand-400' },
            review: { icon: <FaClock />, text: 'Under Review', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
            suspension: { icon: <FaUserSlash />, text: 'Suspension', classes: 'bg-charcoal-800 text-white dark:bg-charcoal-600' },
            dismissed: { icon: <FaCheckCircle />, text: 'Dismissed', classes: 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400' }
        };
        const badge = badges[status] || badges.active;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.classes}`}>
                {badge.icon} {badge.text}
            </span>
        );
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => { setError(''); setSuccess(''); }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">

                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Page Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Seller Violations</h1>
                        <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Monitor and manage policy violations</p>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm animate-fade-in">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm animate-fade-in">
                            {success}
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'all'
                                ? 'bg-terracotta-50 dark:bg-terracotta-900/20 border-terracotta-200 dark:border-terracotta-800'
                                : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-terracotta-200'
                                }`}
                        >
                            <p className="text-3xl font-bold text-charcoal-800 dark:text-white">{stats.total}</p>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">Total Violations</p>
                        </button>

                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'active'
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-red-200'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <FaExclamationCircle className="text-red-500" />
                                <span className="text-3xl font-bold text-charcoal-800 dark:text-white">{stats.active}</span>
                            </div>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">Active</p>
                        </button>

                        <button
                            onClick={() => setStatusFilter('warning')}
                            className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'warning'
                                ? 'bg-sand-50 dark:bg-sand-900/20 border-sand-200 dark:border-sand-800'
                                : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-sand-200'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <FaExclamationTriangle className="text-sand-500" />
                                <span className="text-3xl font-bold text-charcoal-800 dark:text-white">{stats.warning}</span>
                            </div>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">Warnings</p>
                        </button>

                        <button
                            onClick={() => setStatusFilter('suspension')}
                            className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === 'suspension'
                                ? 'bg-charcoal-100 dark:bg-charcoal-700 border-charcoal-300 dark:border-charcoal-600'
                                : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 hover:border-charcoal-300'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <FaUserSlash className="text-charcoal-600 dark:text-charcoal-400" />
                                <span className="text-3xl font-bold text-charcoal-800 dark:text-white">{stats.suspension}</span>
                            </div>
                            <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">Suspensions</p>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        <select
                            value={typeFilter}
                            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2.5 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 rounded-xl text-sm text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 transition-colors"
                        >
                            <option value="all">All Types</option>
                            <option value="high_cancellation_rate">High Cancellations</option>
                            <option value="slow_fulfillment">Slow Fulfillment</option>
                            <option value="low_rating">Low Rating</option>
                            <option value="policy_violation">Policy Violation</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2.5 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 rounded-xl text-sm text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 transition-colors"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="warning">Warning Issued</option>
                            <option value="suspension">Suspension</option>
                            <option value="dismissed">Dismissed</option>
                        </select>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal-500 dark:text-charcoal-400">Loading violations...</p>
                            </div>
                        ) : violations.length === 0 ? (
                            <div className="p-12 text-center">
                                <FaCheckCircle className="text-5xl text-sage-400 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-2">No Violations Found</h3>
                                <p className="text-charcoal-500 dark:text-charcoal-400">All sellers are in good standing</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-cream-50 dark:bg-charcoal-900">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Seller</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Violation Type</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Severity</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Points</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                            {violations.map((violation) => (
                                                <tr key={violation.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-charcoal-800 dark:text-white">
                                                            {violation.seller?.storeName || violation.seller?.name}
                                                        </div>
                                                        <div className="text-xs text-charcoal-500 dark:text-charcoal-400">
                                                            {violation.seller?.email}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">{getTypeBadge(violation.type)}</td>
                                                    <td className="px-6 py-4">{getSeverityBadge(violation.severity)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm">
                                                            -{violation.penaltyPoints}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">{getStatusBadge(violation.status)}</td>
                                                    <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400">
                                                        {formatDate(violation.createdAt)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => { setSelectedViolation(violation); setShowModal(true); }}
                                                                className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                                title="View Details"
                                                            >
                                                                <FaEye />
                                                            </button>
                                                            {violation.status !== 'dismissed' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleDismiss(violation.id)}
                                                                        className="p-2 rounded-lg text-sage-500 hover:bg-sage-50 dark:hover:bg-sage-900/20 transition-colors"
                                                                        title="Dismiss"
                                                                    >
                                                                        <FaCheck />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEscalate(violation.id)}
                                                                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                        title="Escalate"
                                                                    >
                                                                        <FaExclamationTriangle />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="md:hidden divide-y divide-cream-100 dark:divide-charcoal-700">
                                    {violations.map((violation) => (
                                        <div key={violation.id} className="p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-medium text-charcoal-800 dark:text-white">
                                                        {violation.seller?.storeName || violation.seller?.name}
                                                    </h3>
                                                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{violation.seller?.email}</p>
                                                </div>
                                                {getStatusBadge(violation.status)}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {getTypeBadge(violation.type)}
                                                {getSeverityBadge(violation.severity)}
                                                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold">
                                                    -{violation.penaltyPoints} pts
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-charcoal-500">{formatDate(violation.createdAt)}</span>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => { setSelectedViolation(violation); setShowModal(true); }}
                                                        className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    {violation.status !== 'dismissed' && (
                                                        <>
                                                            <button onClick={() => handleDismiss(violation.id)} className="p-2 rounded-lg text-sage-500 hover:bg-sage-50 dark:hover:bg-sage-900/20">
                                                                <FaCheck />
                                                            </button>
                                                            <button onClick={() => handleEscalate(violation.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                                <FaExclamationTriangle />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Modal */}
                    {showModal && selectedViolation && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">Violation Details</h3>
                                    <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors">
                                        <FaTimes />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Seller</label>
                                        <p className="mt-1 text-charcoal-800 dark:text-white font-medium">
                                            {selectedViolation.seller?.storeName} ({selectedViolation.seller?.email})
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Type</label>
                                        <div className="mt-1">{getTypeBadge(selectedViolation.type)}</div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Description</label>
                                        <p className="mt-1 text-charcoal-700 dark:text-charcoal-300">{selectedViolation.description}</p>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-1 p-3 bg-cream-50 dark:bg-charcoal-700 rounded-xl">
                                            <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase">Current</label>
                                            <p className="text-xl font-bold text-terracotta-600 dark:text-terracotta-400 mt-1">{selectedViolation.metrics?.currentValue}</p>
                                        </div>
                                        <div className="flex-1 p-3 bg-cream-50 dark:bg-charcoal-700 rounded-xl">
                                            <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase">Threshold</label>
                                            <p className="text-xl font-bold text-charcoal-800 dark:text-white mt-1">{selectedViolation.metrics?.threshold}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                                        <label className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Penalty Points</label>
                                        <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">-{selectedViolation.penaltyPoints}</p>
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
