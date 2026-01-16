import { useState, useEffect } from "react";
import api from "../utils/axiosInstance";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FaRobot, FaUser, FaSearch, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

export default function AdminCustomerQueries() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [filter, setFilter] = useState("");
    const [selectedLogs, setSelectedLogs] = useState([]); // Array of IDs

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const { data } = await api.get("/chatbot/logs");
            setLogs(data);
        } catch (err) {
            // Silently fail or minimal logging in production
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.question.toLowerCase().includes(filter.toLowerCase()) ||
        log.answer.toLowerCase().includes(filter.toLowerCase())
    );

    // Bulk selection handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedLogs(filteredLogs.map(log => log._id));
        } else {
            setSelectedLogs([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedLogs.includes(id)) {
            setSelectedLogs(selectedLogs.filter(logId => logId !== id));
        } else {
            setSelectedLogs([...selectedLogs, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedLogs.length} queries?`)) return;

        try {
            await api.delete("/chatbot/logs", { data: { ids: selectedLogs } });

            // Update UI
            setLogs(logs.filter(log => !selectedLogs.includes(log._id)));
            setSelectedLogs([]);
            toast.success("Query deleted successfully");
        } catch (err) {
            toast.error("Failed to delete logs");
        }
    };

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
                <Topbar onMenuClick={() => setSidebarOpen(true)} title="Customer Queries" />

                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white flex items-center gap-2">
                                <FaRobot className="text-terracotta-500" /> AI Insights
                            </h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 mt-1">
                                See what your customers are asking the AI.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {selectedLogs.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-all animate-fade-in"
                                >
                                    <FaTrash /> Delete ({selectedLogs.length})
                                </button>
                            )}
                            <div className="relative">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
                                <input
                                    type="text"
                                    placeholder="Search queries..."
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="pl-11 pr-4 py-2.5 rounded-xl border border-cream-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-800 dark:text-white focus:border-terracotta-500 outline-none w-64 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Logs Table */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal-500 dark:text-charcoal-400">Loading insights...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="p-12 text-center text-charcoal-500 dark:text-charcoal-400">No queries recorded yet.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-6 py-4 w-12 text-center">
                                                <input
                                                    type="checkbox"
                                                    onChange={handleSelectAll}
                                                    checked={filteredLogs.length > 0 && selectedLogs.length === filteredLogs.length}
                                                    className="w-4 h-4 rounded border-gray-300 text-terracotta-500 focus:ring-terracotta-500"
                                                />
                                            </th>
                                            <th className="px-6 py-4 font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-4 font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Question</th>
                                            <th className="px-6 py-4 font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">AI Answer</th>
                                            <th className="px-6 py-4 font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {filteredLogs.map((log) => (
                                            <tr key={log._id} className={`hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors ${selectedLogs.includes(log._id) ? 'bg-terracotta-50/50 dark:bg-terracotta-900/10' : ''}`}>
                                                <td className="px-6 py-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLogs.includes(log._id)}
                                                        onChange={() => handleSelectOne(log._id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-terracotta-500 focus:ring-terracotta-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 font-medium">
                                                    <div className="flex items-center gap-2 text-charcoal-800 dark:text-white">
                                                        <div className="w-8 h-8 rounded-full bg-cream-100 dark:bg-charcoal-700 flex items-center justify-center text-charcoal-400">
                                                            <FaUser size={12} />
                                                        </div>
                                                        {log.user?.name || "Guest"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-charcoal-800 dark:text-gray-200 max-w-xs break-words">
                                                    "{log.question}"
                                                </td>
                                                <td className="px-6 py-4 text-charcoal-600 dark:text-gray-400 max-w-sm break-words">
                                                    {log.answer}
                                                </td>
                                                <td className="px-6 py-4 text-charcoal-500 dark:text-gray-500 whitespace-nowrap">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
