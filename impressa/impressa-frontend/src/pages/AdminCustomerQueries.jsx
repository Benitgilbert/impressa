import { useState, useEffect } from "react";
import api from "../utils/axiosInstance";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FaRobot, FaUser, FaSearch } from "react-icons/fa";

export default function AdminCustomerQueries() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const { data } = await api.get("/chatbot/logs");
            setLogs(data);
        } catch (err) {
            console.error("Failed to fetch logs", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.question.toLowerCase().includes(filter.toLowerCase()) ||
        log.answer.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <Topbar onMenuClick={() => setSidebarOpen(true)} title="Customer Queries" />

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">

                        {/* Header / Stats */}
                        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <FaRobot className="text-teal-500" /> AI Insights
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    See what your customers are asking the AI.
                                </p>
                            </div>
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search queries..."
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none w-64"
                                />
                            </div>
                        </div>

                        {/* Logs Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            {loading ? (
                                <div className="p-12 text-center text-gray-500">Loading insights...</div>
                            ) : logs.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">No queries recorded yet.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                            <tr>
                                                <th className="px-6 py-4 font-medium">Customer</th>
                                                <th className="px-6 py-4 font-medium">Question</th>
                                                <th className="px-6 py-4 font-medium">AI Answer</th>
                                                <th className="px-6 py-4 font-medium">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {filteredLogs.map((log) => (
                                                <tr key={log._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                                                <FaUser size={12} />
                                                            </div>
                                                            {log.user?.name || "Guest"}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-800 dark:text-gray-200 max-w-xs break-words">
                                                        "{log.question}"
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-sm break-words">
                                                        {log.answer}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-500 whitespace-nowrap">
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
