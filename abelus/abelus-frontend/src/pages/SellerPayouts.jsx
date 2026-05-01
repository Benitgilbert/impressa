import { useState, useEffect } from "react";
import { FaMoneyBillWave, FaHistory, FaCheckCircle, FaClock, FaExclamationCircle } from "react-icons/fa";
import api from "../utils/axiosInstance";
import SellerSidebar from "../components/SellerSidebar";
import Header from "../components/Header";

const SellerPayouts = () => {
    const [summary, setSummary] = useState(null);
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [earningRes, payoutRes] = await Promise.all([
                api.get("/commissions/my-earnings"),
                api.get("/commissions/my-payouts")
            ]);

            if (earningRes.data.success) {
                setSummary(earningRes.data.data);
            }
            if (payoutRes.data?.success) {
                setPayouts(payoutRes.data.data);
            }
        } catch (err) {
            console.error("Failed to load payout data", err);
        } finally {
            setLoading(false);
        }
    };

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleRequestClick = () => {
        setShowConfirmModal(true);
    };

    const confirmPayout = async () => {
        setShowConfirmModal(false);
        setRequesting(true);
        try {
            // Send default payment method
            const res = await api.post("/commissions/my-payouts", {
                paymentMethod: 'mobile_money'
            });

            if (res.data.success) {
                setMessage({ type: 'success', text: 'Payout requested successfully!' });
                fetchData(); // Refresh data
            }
        } catch (err) {
            console.error("Payout request failed details:", err);
            const errorMsg = err.response?.data?.message
                || err.response?.data?.error?.message
                || err.message
                || "Unknown error occurred";

            setMessage({
                type: 'error',
                text: `Failed: ${errorMsg}`
            });
        } finally {
            setRequesting(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800';
            case 'pending': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800';
            case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600';
        }
    };

    return (
        <main className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Payouts & Earnings</h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your earnings and withdrawal requests</p>
                            </div>
                            {summary?.availableBalance >= (summary?.minimumPayout || 0) && (
                                <button
                                    onClick={handleRequestClick}
                                    disabled={requesting}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-green-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <FaMoneyBillWave /> {requesting ? "Processing..." : "Request Payout"}
                                </button>
                            )}
                        </div>

                        {message && (
                            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                                }`}>
                                {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                                {message.text}
                            </div>
                        )}

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                    <FaMoneyBillWave /> Available Balance
                                </div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                    RWF {summary?.availableBalance?.toLocaleString() || 0}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                    <FaClock /> Pending Payouts
                                </div>
                                <div className="text-3xl font-bold text-orange-500 dark:text-orange-400">
                                    {summary?.pendingPayouts || 0}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                    <FaCheckCircle /> Total Withdrawn
                                </div>
                                <div className="text-3xl font-bold text-green-600 dark:text-green-500">
                                    RWF {summary?.totalPaid?.toLocaleString() || 0}
                                </div>
                            </div>
                        </div>

                        {/* Minimum Payout Info */}
                        {summary?.availableBalance < (summary?.minimumPayout || 0) && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 mb-8 flex items-center gap-3">
                                <FaExclamationCircle className="text-xl flex-shrink-0" />
                                <p>Minimum payout amount is <span className="font-bold">RWF {summary?.minimumPayout?.toLocaleString()}</span>. Keep selling to reach the threshold!</p>
                            </div>
                        )}

                        {/* Payout History */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <FaHistory className="text-gray-400" /> Payout History
                                </h3>
                            </div>

                            {loading ? (
                                <div className="p-12 text-center text-gray-500 dark:text-gray-400">Loading history...</div>
                            ) : payouts.length === 0 ? (
                                <div className="p-12 text-center text-gray-500 dark:text-gray-400">No payout history found.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                            <tr>
                                                <th className="px-6 py-4 font-medium text-sm">Date</th>
                                                <th className="px-6 py-4 font-medium text-sm">Amount</th>
                                                <th className="px-6 py-4 font-medium text-sm">Method</th>
                                                <th className="px-6 py-4 font-medium text-sm">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {payouts.map(payout => (
                                                <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                        {new Date(payout.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                        RWF {payout.amount.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 capitalize">
                                                        {payout.method?.replace('_', ' ')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusStyle(payout.status)}`}>
                                                            {payout.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Custom Confirmation Modal */}
                    {showConfirmModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                        <FaMoneyBillWave className="text-3xl text-green-600 dark:text-green-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        Request Payout?
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-300 mb-6">
                                        Are you sure you want to request a payout for your available balance of <span className="font-bold text-gray-900 dark:text-white">RWF {summary?.availableBalance?.toLocaleString()}</span>?
                                    </p>

                                    <div className="flex gap-3 w-full">
                                        <button
                                            onClick={() => setShowConfirmModal(false)}
                                            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmPayout}
                                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-lg shadow-green-600/20 transition-colors"
                                        >
                                            Confirm Request
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
        </main>
    );
};

export default SellerPayouts;
