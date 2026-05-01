import { useState, useEffect } from "react";
import { FaHistory, FaCalendarAlt, FaArrowRight, FaTimes, FaClock, FaClipboardList } from "react-icons/fa";
import api from "../utils/axiosInstance";

const SellerShifts = () => {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedShift, setSelectedShift] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [shiftReport, setShiftReport] = useState(null);

    const fetchShifts = async () => {
        try {
            setLoading(true);
            const res = await api.get("/shifts/my-shifts");
            if (res.data.success) {
                setShifts(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch shifts", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchShiftReport = async (shiftId) => {
        try {
            setReportLoading(true);
            setSelectedShift(shifts.find(s => s.id === shiftId));
            const res = await api.get(`/shifts/${shiftId}/report`);
            if (res.data.success) {
                setShiftReport(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch shift report", err);
        } finally {
            setReportLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(amount || 0);
    };

    const getStatusBadge = (status) => {
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                status === 'open' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}>
                {status}
            </span>
        );
    };

    return (
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <FaHistory className="text-indigo-600" /> My Shifts History
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">View and audit your past cashier sessions</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                        <p className="font-medium">Loading your shift history...</p>
                    </div>
                ) : shifts.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-6 text-gray-400">
                            <FaHistory size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Shifts Recorded</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">You haven't started any POS shifts yet. Your sessions will appear here once you open the POS.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {shifts.map((shift) => (
                            <div 
                                key={shift.id} 
                                onClick={() => fetchShiftReport(shift.id)}
                                className="group bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${shift.status === 'open' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
                                        <FaCalendarAlt size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{new Date(shift.startTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <FaClock className="text-xs" /> {new Date(shift.startTime).toLocaleTimeString()} 
                                            {shift.endTime && ` — ${new Date(shift.endTime).toLocaleTimeString()}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Expected</p>
                                        <p className="font-black text-gray-900 dark:text-white">{formatCurrency(shift.expectedEndingDrawerAmount)}</p>
                                    </div>
                                    <div className="text-right border-l dark:border-gray-700 pl-6">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                        {getStatusBadge(shift.status)}
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-4">
                                        <FaArrowRight className="text-indigo-600" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Shift Detail Modal */}
            {selectedShift && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/10 animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    <FaClipboardList className="text-indigo-600" /> Shift Report
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                    {new Date(selectedShift.startTime).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => { setSelectedShift(null); setShiftReport(null); }}
                                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {reportLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                                    <p>Loading full report...</p>
                                </div>
                            ) : shiftReport ? (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Starting Cash</p>
                                            <p className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(shiftReport.startingDrawerAmount)}</p>
                                        </div>
                                        <div className="p-5 bg-sage-50 dark:bg-sage-900/20 rounded-2xl border border-sage-100 dark:border-sage-800/30">
                                            <p className="text-[10px] font-bold text-sage-600 dark:text-sage-400 uppercase tracking-wider mb-2">Expected Total</p>
                                            <p className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(shiftReport.expectedEndingDrawerAmount)}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cash Sales</p>
                                            <p className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(shiftReport.totalCashSales)}</p>
                                        </div>
                                        <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">MoMo Sales</p>
                                            <p className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(shiftReport.totalMomoSales)}</p>
                                        </div>
                                        <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Debt Coll.</p>
                                            <p className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(shiftReport.totalDebtCollected)}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50">
                                        <h3 className="font-black text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-widest">Verification Details</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 font-medium">Actual Amount Counted:</span>
                                                <span className="font-bold dark:text-white">{formatCurrency(shiftReport.actualEndingDrawerAmount)}</span>
                                            </div>
                                            <div className={`flex justify-between items-center text-sm p-3 rounded-xl ${shiftReport.actualEndingDrawerAmount - shiftReport.expectedEndingDrawerAmount === 0 ? 'bg-sage-50 dark:bg-sage-900/20 text-sage-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                                                <span className="font-bold uppercase tracking-wider text-[10px]">Difference:</span>
                                                <span className="font-black text-lg">
                                                    {formatCurrency(shiftReport.actualEndingDrawerAmount - shiftReport.expectedEndingDrawerAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {shiftReport.notes && (
                                        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-800/30">
                                            <p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mb-2">Shift Notes</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{shiftReport.notes}"</p>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="font-black text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-widest">Shift Orders ({shiftReport.orders?.length || 0})</h3>
                                        <div className="space-y-2">
                                            {shiftReport.orders?.map(order => (
                                                <div key={order.publicId} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">#{order.publicId}</span>
                                                        <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{order.paymentMethod}</span>
                                                        <span className="font-bold dark:text-white">{formatCurrency(order.grandTotal)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-center text-gray-500 py-12">Failed to load shift details.</p>
                            )}
                        </div>

                        <div className="p-8 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                            <button
                                onClick={() => { setSelectedShift(null); setShiftReport(null); }}
                                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-lg transition-all active:scale-[0.98]"
                            >
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default SellerShifts;
