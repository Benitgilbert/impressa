import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from "../utils/axiosInstance";
import { supabase } from "../utils/supabaseClient";
import { FaDownload, FaFileAlt, FaFilePdf, FaFileCsv, FaHistory, FaSearch } from "react-icons/fa";

function AdminReports() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [type, setType] = useState("monthly");
  const [format, setFormat] = useState("pdf");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await api.get("/orders/report/logs", { params: { page: 1, limit: 20 } });
      setLogs(res.data?.logs || []);
    } catch (err) {
      console.error("Failed to load report logs:", err?.response?.data || err.message);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const paramsObj = { type, format };
      if (type === "monthly") {
        const now = new Date();
        paramsObj.month = (now.getMonth() + 1).toString();
        paramsObj.year = now.getFullYear().toString();
      } else if (type === "daily") {
        paramsObj.date = (from || new Date().toISOString().slice(0, 10));
      } else if (["custom-range", "revenue", "customer-analytics"].includes(type)) {
        if (from) paramsObj.start = from;
        if (to) paramsObj.end = to;
      } else if (from) {
        paramsObj.from = from;
        if (to) paramsObj.to = to;
      }

      if (format === "pdf") {
        const params = new URLSearchParams(paramsObj);
        const url = `${api.defaults.baseURL.replace(/\/$/, "")}/orders/report?${params.toString()}`;
        
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to generate PDF");
          } else throw new Error(`Failed to generate PDF(Status: ${res.status})`);
        }

        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const w = window.open(blobUrl, "_blank");
        if (!w) {
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${type}-report.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        const res = await api.get("/orders/report", { params: paramsObj, responseType: "blob" });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${type}-report.csv`);
        document.body.appendChild(link);
        link.click();
      }
      setMessage("✅ Report generated successfully");
      fetchLogs();
    } catch (err) {
      console.error("Report generation failed:", err);
      setMessage(`❌ Failed to generate report: ${err.response?.data?.message || err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadLogsCsv = async () => {
    try {
      const res = await api.get("/orders/report/logs", { params: { format: "csv" }, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "report-logs.csv");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("Logs CSV download failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title="Reports" />
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Reports</h1>
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Generate PDF/CSV reports and view history</p>
            </div>
            <button onClick={downloadLogsCsv} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 hover:bg-cream-50 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 rounded-xl font-medium transition-all shadow-sm">
              <FaDownload className="text-charcoal-500" /> Download Logs CSV
            </button>
          </div>

          {/* Feedback Message */}
          {message && (
            <div className={`mb-4 p-4 rounded-xl text-sm font-medium border ${message.startsWith("✅") ? 'bg-sage-50 dark:bg-sage-900/20 text-sage-700 dark:text-sage-400 border-sage-200 dark:border-sage-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Generation Form */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-cream-200 dark:border-charcoal-700 sticky top-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-terracotta-100 dark:bg-terracotta-900/20 rounded-xl flex items-center justify-center text-terracotta-600 dark:text-terracotta-400">
                    <FaFileAlt />
                  </div>
                  <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">Generate Report</h3>
                </div>

                <form onSubmit={handleGenerate} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Report Type</label>
                    <div className="relative">
                      <select value={type} onChange={(e) => setType(e.target.value)}
                        className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 appearance-none">
                        <option value="monthly">Monthly Report</option>
                        <option value="daily">Daily Report</option>
                        <option value="custom-range">Custom Date Range</option>
                        <option value="customer">By Customer</option>
                        <option value="customer-analytics">Customer Analytics</option>
                        <option value="status">By Order Status</option>
                        <option value="revenue">Revenue & Sales</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none">▼</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Format</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`cursor-pointer flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${format === 'pdf' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' : 'bg-cream-50 dark:bg-charcoal-700 border-cream-200 dark:border-charcoal-600 text-charcoal-600 dark:text-charcoal-400'}`}>
                        <input type="radio" value="pdf" checked={format === 'pdf'} onChange={(e) => setFormat(e.target.value)} className="hidden" />
                        <FaFilePdf /> PDF
                      </label>
                      <label className={`cursor-pointer flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${format === 'csv' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-cream-50 dark:bg-charcoal-700 border-cream-200 dark:border-charcoal-600 text-charcoal-600 dark:text-charcoal-400'}`}>
                        <input type="radio" value="csv" checked={format === 'csv'} onChange={(e) => setFormat(e.target.value)} className="hidden" />
                        <FaFileCsv /> CSV
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">From</label>
                      <div className="relative">
                        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                          className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 min-w-0" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">To</label>
                      <div className="relative">
                        <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                          className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 min-w-0" />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform active:scale-[0.98]">
                    {loading ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Generating...</>
                    ) : (
                      "Generate Report"
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Logs Table */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden h-full flex flex-col">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-cream-200 dark:border-charcoal-700 bg-cream-50 dark:bg-charcoal-900/50">
                  <FaHistory className="text-charcoal-400" />
                  <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">Generation History</h3>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-cream-50 dark:bg-charcoal-900 border-b border-cream-100 dark:border-charcoal-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Format</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                      {logsLoading ? (
                        <tr><td colSpan={5} className="p-12 text-center text-charcoal-500">Loading history...</td></tr>
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center text-charcoal-400">
                              <FaSearch className="text-4xl mb-3 opacity-20" />
                              <p>No report history found</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log._id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                            <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleDateString()} <span className="text-xs opacity-70 ml-1">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-charcoal-800 dark:text-white capitalize whitespace-nowrap">
                              {log.type.replace('-', ' ')}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${log.format === 'pdf' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                {log.format}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400">
                              <div className="font-medium text-charcoal-800 dark:text-white">{log.generatedBy?.name || 'Unknown'}</div>
                              <div className="text-xs opacity-70 truncate max-w-[150px]">{log.generatedBy?.email}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400">
                              <div className="truncate max-w-[200px] group-hover:whitespace-normal group-hover:overflow-visible group-hover:break-words transition-all" title={log.aiSummary}>
                                {log.aiSummary || '-'}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminReports;
