import { useEffect, useState } from "react";
import SellerSidebar from "../components/SellerSidebar";
import Topbar from "../components/Topbar";
import api from "../utils/axiosInstance";
import { supabase } from "../utils/supabaseClient";
import { FaDownload, FaFilePdf, FaFileCsv, FaHistory, FaCheckCircle, FaExclamationTriangle, FaMoneyBillWave, FaTimes } from "react-icons/fa";

function SellerReports() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [type, setType] = useState("daily");
  const [format, setFormat] = useState("pdf");
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Shift Prompt State
  const [showShiftPrompt, setShowShiftPrompt] = useState(false);
  const [drawerAmount, setDrawerAmount] = useState("");
  const [activeShift, setActiveShift] = useState(null);

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      // For sellers, we'll fetch logs they generated
      const res = await api.get("/orders/report/logs", { params: { page: 1, limit: 10 } });
      setLogs(res.data?.logs || []);
    } catch (err) {
      console.error("Failed to load report logs:", err?.response?.data || err.message);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleStartGenerate = async (e) => {
    e.preventDefault();
    setMessage("");
    
    // Check for active shift if it's today's daily report
    const today = new Date().toISOString().slice(0, 10);
    if (type === "daily" && from === today) {
        try {
            const res = await api.get("/shifts/current");
            if (res.data.success && res.data.data) {
                setActiveShift(res.data.data);
                setShowShiftPrompt(true);
                return; // Wait for user to input drawer amount
            }
        } catch (err) {
            console.error("Failed to check shift status");
        }
    }

    // Otherwise, proceed directly
    executeGenerate();
  };

  const executeGenerate = async (verificationAmount = null) => {
    setLoading(true);
    setShowShiftPrompt(false);
    try {
      const paramsObj = { type, format };
      if (type === "monthly") {
        const now = new Date();
        paramsObj.month = (now.getMonth() + 1).toString();
        paramsObj.year = now.getFullYear().toString();
      } else if (type === "daily") {
        paramsObj.date = from;
      } else if (type === "weekly") {
        // weekly logic is handled on backend
      } else if (["custom-range", "revenue"].includes(type)) {
        if (from) paramsObj.start = from;
        if (to) paramsObj.end = to;
      }

      // Add verification info if available
      if (verificationAmount) {
        paramsObj.verificationAmount = verificationAmount;
        paramsObj.shiftId = activeShift?.id;
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
        window.open(blobUrl, "_blank");
      } else {
        const res = await api.get("/orders/report", { params: paramsObj, responseType: "blob" });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `seller-${type}-report.csv`);
        document.body.appendChild(link);
        link.click();
      }
      setMessage("✅ Report generated successfully");
      fetchLogs();
    } catch (err) {
      console.error("Report generation failed:", err);
      setMessage(`❌ Failed to generate report: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
      setDrawerAmount("");
    }
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-white">
      <SellerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title="Business Reports" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header section */}
            <div className="mb-8">
              <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                REPORT CENTER
              </h2>
              <p className="text-gray-400 mt-2">Generate and export your store performance data.</p>
            </div>

            {/* Filter Card */}
            <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-6 shadow-xl mb-8">
              <form onSubmit={handleStartGenerate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Report Type</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  >
                    <option value="daily">Daily Report</option>
                    <option value="weekly">Weekly Report</option>
                    <option value="monthly">Monthly Report</option>
                    <option value="revenue">Revenue Report</option>
                    <option value="custom-range">Custom Range</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    {type === "daily" ? "Select Date" : type === "monthly" ? "Month (Implicit)" : "Start Date"}
                  </label>
                  <input 
                    type="date" 
                    value={from} 
                    onChange={(e) => setFrom(e.target.value)}
                    disabled={type === "monthly" || type === "weekly"}
                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm disabled:opacity-50"
                  />
                </div>

                {(type === "custom-range" || type === "revenue") && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">End Date</label>
                    <input 
                      type="date" 
                      value={to} 
                      onChange={(e) => setTo(e.target.value)}
                      className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Format</label>
                  <div className="flex bg-[#0f172a] p-1 rounded-xl border border-white/10">
                    <button 
                      type="button"
                      onClick={() => setFormat("pdf")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${format === 'pdf' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                      <FaFilePdf /> <span>PDF</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormat("csv")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${format === 'csv' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                      <FaFileCsv /> <span>CSV</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <FaDownload />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {message && (
                <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${message.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                   {message.startsWith('✅') ? <FaCheckCircle /> : <FaExclamationTriangle />}
                   <span className="text-sm font-medium">{message}</span>
                </div>
              )}
            </div>

            {/* History Table */}
            <div className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaHistory className="text-gray-400" />
                  <h3 className="font-bold">Recent Generations</h3>
                </div>
                <button onClick={fetchLogs} className="text-xs text-blue-400 hover:text-blue-300 font-medium">Refresh</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#0f172a]/50 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <th className="px-6 py-4">Report Type</th>
                      <th className="px-6 py-4">Format</th>
                      <th className="px-6 py-4">Date Generated</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logsLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan="4" className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-full"></div></td>
                        </tr>
                      ))
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic">No reports found</td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 capitalize font-medium">{log.type}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${log.format === 'pdf' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                              {log.format}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className="text-xs text-gray-500 italic">System Log</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Shift Verification Modal */}
      {showShiftPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                <FaMoneyBillWave className="text-blue-400 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Shift Verification Required</h3>
              <p className="text-gray-400 text-center text-sm mb-6">
                You have an active POS shift. Please enter the current amount of cash in your drawer to include it in the report verification.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Current Drawer Amount (Rwf)</label>
                  <input 
                    type="number"
                    value={drawerAmount}
                    onChange={(e) => setDrawerAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => executeGenerate()}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-all"
                  >
                    Skip
                  </button>
                  <button 
                    onClick={() => executeGenerate(drawerAmount)}
                    disabled={!drawerAmount}
                    className="flex-[2] px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-bold transition-all"
                  >
                    Verify \u0026 Generate
                  </button>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowShiftPrompt(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerReports;
