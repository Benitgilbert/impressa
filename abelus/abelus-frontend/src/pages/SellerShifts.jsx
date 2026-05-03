import { useState, useEffect } from "react";
import { FaHistory, FaCalendarAlt, FaArrowRight, FaTimes, FaClock, FaClipboardList, FaExclamationTriangle } from "react-icons/fa";
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

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                            {reportLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                                    <p>Loading full report...</p>
                                </div>
                            ) : shiftReport ? (
                                <>
                                    {/* Financial Summary Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-sm">
                                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Total Revenue</p>
                                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                                {formatCurrency((shiftReport.totalCashSales || 0) + (shiftReport.totalMomoSales || 0))}
                                            </p>
                                        </div>
                                        <div className="p-6 bg-red-500/10 rounded-2xl border border-red-500/20 shadow-sm">
                                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Total Expenses</p>
                                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                                {formatCurrency(shiftReport.totalExpenses || 0)}
                                            </p>
                                        </div>
                                        <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-sm">
                                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Net Profit</p>
                                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                                {formatCurrency(((shiftReport.totalCashSales || 0) + (shiftReport.totalMomoSales || 0)) - (shiftReport.totalExpenses || 0))}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Difference Note */}
                                    {selectedShift.status === 'closed' && (
                                        <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center gap-4">
                                            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <FaExclamationTriangle />
                                            </div>
                                            <p className="text-sm font-medium">
                                                <span className="font-bold">Difference Note:</span> There is a difference of <span className="font-black underline">{formatCurrency(shiftReport.actualEndingDrawerAmount - shiftReport.expectedEndingDrawerAmount)}</span> between your physical drawer and recorded sales.
                                            </p>
                                        </div>
                                    )}

                                    {/* Shift Activity Table */}
                                    <div className="space-y-4">
                                        <h3 className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-widest px-1">Shift Activity Overview</h3>
                                        <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-900 dark:bg-gray-950 text-white text-[10px] uppercase font-bold tracking-widest">
                                                    <tr>
                                                        <th className="px-4 py-3">Period</th>
                                                        <th className="px-4 py-3">Opening Cash</th>
                                                        <th className="px-4 py-3">Closing Cash</th>
                                                        <th className="px-4 py-3">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-4 py-4 text-xs">
                                                            {new Date(selectedShift.startTime).toLocaleTimeString()} - {selectedShift.endTime ? new Date(selectedShift.endTime).toLocaleTimeString() : "Ongoing"}
                                                        </td>
                                                        <td className="px-4 py-4 font-bold">{formatCurrency(shiftReport.startingDrawerAmount)}</td>
                                                        <td className="px-4 py-4 font-bold">{formatCurrency(shiftReport.actualEndingDrawerAmount)}</td>
                                                        <td className="px-4 py-4">{getStatusBadge(selectedShift.status)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Transaction Detail Table */}
                                    <div className="space-y-4">
                                        <h3 className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-widest px-1">Transaction Detail</h3>
                                        <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-900 dark:bg-gray-950 text-white text-[10px] uppercase font-bold tracking-widest">
                                                    <tr>
                                                        <th className="px-4 py-3">Item Name</th>
                                                        <th className="px-4 py-3 text-center">Qty</th>
                                                        <th className="px-4 py-3">Cash</th>
                                                        <th className="px-4 py-3">Momo</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {shiftReport.orders?.length > 0 ? (
                                                        shiftReport.orders.map((order, idx) => (
                                                            <tr key={order.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-700/30'}>
                                                                <td className="px-4 py-3">
                                                                    <p className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">Order #{order.publicId}</p>
                                                                    <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</p>
                                                                </td>
                                                                <td className="px-4 py-3 text-center font-medium">{order.items?.length || 0}</td>
                                                                <td className="px-4 py-3 font-medium">
                                                                    {order.paymentMethod === 'cash' ? formatCurrency(order.grandTotal) : '-'}
                                                                </td>
                                                                <td className="px-4 py-3 font-medium">
                                                                    {order.paymentMethod === 'momo' ? formatCurrency(order.grandTotal) : '-'}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" className="px-4 py-12 text-center text-gray-400 italic">No transactions found for this shift.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                                <tfoot className="bg-gray-50 dark:bg-gray-900 font-black">
                                                    <tr>
                                                        <td colSpan="2" className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-gray-500">Totals</td>
                                                        <td className="px-4 py-3 text-blue-600 dark:text-blue-400">{formatCurrency(shiftReport.totalCashSales)}</td>
                                                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">{formatCurrency(shiftReport.totalMomoSales)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Expenses Section */}
                                    {shiftReport.expenses?.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-widest px-1">Expenses Breakdown</h3>
                                            <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-gray-900 dark:bg-gray-950 text-white text-[10px] uppercase font-bold tracking-widest">
                                                        <tr>
                                                            <th className="px-4 py-3">Description</th>
                                                            <th className="px-4 py-3">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                        {shiftReport.expenses.map((exp, idx) => (
                                                            <tr key={exp.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-700/30'}>
                                                                <td className="px-4 py-3 font-medium">{exp.description}</td>
                                                                <td className="px-4 py-3 font-black text-red-500">{formatCurrency(exp.amount)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {shiftReport.notes && (
                                        <div className="p-6 bg-yellow-500/5 rounded-2xl border border-yellow-500/20">
                                            <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-2">Shift Notes</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{shiftReport.notes}"</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-center text-gray-500 py-12">Failed to load shift details.</p>
                            )}
                        </div>

                        <div className="p-6 md:p-8 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex gap-4">
                             <button
                                onClick={() => window.print()}
                                className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-2xl font-black transition-all active:scale-[0.98]"
                            >
                                Print View
                            </button>
                            <button
                                onClick={() => { setSelectedShift(null); setShiftReport(null); }}
                                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                            >
                                Done
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </main>
    );
};

export default SellerShifts;
