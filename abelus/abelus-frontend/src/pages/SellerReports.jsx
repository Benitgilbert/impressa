import { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { supabase } from "../utils/supabaseClient";
import { FaDownload, FaFilePdf, FaFileCsv, FaHistory, FaCheckCircle, FaExclamationTriangle, FaMoneyBillWave, FaTimes } from "react-icons/fa";

function SellerReports() {
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
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="flex-1 p-4 lg:p-8 max-w-[1200px] w-full mx-auto">
          <div className="max-w-5xl mx-auto">
            {/* Header section - Cloned from PDF Header Style */}
            <div className="mb-10 border-b-2 border-[#1E3A8A] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-3xl font-black text-[#1E3A8A] tracking-tight">
                  REPORT CENTER
                </h2>
                <p className="text-[#64748B] font-medium mt-1 uppercase text-xs tracking-widest">Store Performance & Audit Statement</p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-[#94A3B8] text-sm font-medium">Internal Documentation Portal</p>
                <p className="text-[#94A3B8] text-xs">Generated View: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Filter Card - Professional Box Style */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 shadow-sm mb-10">
              <div className="mb-6">
                <h3 className="text-[#1E3A8A] font-bold text-sm uppercase tracking-wider">Report Configuration</h3>
              </div>
              
              <form onSubmit={handleStartGenerate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Report Type</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all text-sm font-medium text-[#1E293B]"
                  >
                    <option value="daily">Daily Report</option>
                    <option value="weekly">Weekly Report</option>
                    <option value="monthly">Monthly Report</option>
                    <option value="revenue">Revenue Report</option>
                    <option value="custom-range">Custom Range</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                    {type === "daily" ? "Select Date" : type === "monthly" ? "Month (Implicit)" : "Start Date"}
                  </label>
                  <input 
                    type="date" 
                    value={from} 
                    onChange={(e) => setFrom(e.target.value)}
                    disabled={type === "monthly" || type === "weekly"}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all text-sm font-medium disabled:opacity-50 text-[#1E293B]"
                  />
                </div>

                {(type === "custom-range" || type === "revenue") && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">End Date</label>
                    <input 
                      type="date" 
                      value={to} 
                      onChange={(e) => setTo(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all text-sm font-medium text-[#1E293B]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Export Format</label>
                  <div className="flex bg-[#F8FAFC] p-1 rounded-lg border border-[#CBD5E1]">
                    <button 
                      type="button"
                      onClick={() => setFormat("pdf")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all text-xs font-bold ${format === 'pdf' ? 'bg-[#1E3A8A] text-white shadow-md' : 'text-[#64748B] hover:text-[#1E3A8A]'}`}
                    >
                      <FaFilePdf /> <span>PDF</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormat("csv")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all text-xs font-bold ${format === 'csv' ? 'bg-[#059669] text-white shadow-md' : 'text-[#64748B] hover:text-[#059669]'}`}
                    >
                      <FaFileCsv /> <span>CSV</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <FaDownload className="text-xs" />
                        <span className="uppercase text-xs tracking-widest">Generate Report</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {message && (
                <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 border ${message.startsWith('✅') ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]' : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'}`}>
                   {message.startsWith('✅') ? <FaCheckCircle className="text-sm" /> : <FaExclamationTriangle className="text-sm" />}
                   <span className="text-xs font-bold">{message}</span>
                </div>
              )}
            </div>

            {/* History Table - Cloned from PDF Table Style */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
              <div className="px-8 py-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                <div className="flex items-center gap-3">
                  <FaHistory className="text-[#1E3A8A] text-sm" />
                  <h3 className="font-bold text-[#1E3A8A] text-sm uppercase tracking-wider">Statement History</h3>
                </div>
                <button onClick={fetchLogs} className="text-[10px] text-[#1E3A8A] hover:underline font-bold uppercase tracking-widest">Refresh Logs</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#1E3A8A] text-[10px] font-bold text-white uppercase tracking-widest">
                      <th className="px-8 py-4">Report Type</th>
                      <th className="px-8 py-4">Format</th>
                      <th className="px-8 py-4">Generation Date</th>
                      <th className="px-8 py-4 text-right">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {logsLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan="4" className="px-8 py-5"><div className="h-4 bg-[#F1F5F9] rounded w-full"></div></td>
                        </tr>
                      ))
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-8 py-16 text-center text-[#94A3B8] text-sm font-medium italic">No recent reports found in archives</td>
                      </tr>
                    ) : (
                      logs.map((log, idx) => (
                        <tr key={log.id} className={`${idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'} hover:bg-[#F1F5F9] transition-colors group`}>
                          <td className="px-8 py-4 capitalize font-bold text-[#1E293B] text-sm">{log.type} Statement</td>
                          <td className="px-8 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${log.format === 'pdf' ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]' : 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'}`}>
                              {log.format}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-xs font-medium text-[#64748B]">
                            {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="px-8 py-4 text-right">
                             <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-tighter">#{log.id.slice(-8)}</span>
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

      {/* Shift Verification Modal - Audit Style */}
      {showShiftPrompt && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#E2E8F0]">
                <FaMoneyBillWave className="text-[#1E3A8A] text-2xl" />
              </div>
              <h3 className="text-xl font-black text-center text-[#1E3A8A] mb-2 uppercase tracking-tight">Shift Verification</h3>
              <p className="text-[#64748B] text-center text-sm font-medium mb-8 leading-relaxed">
                A POS shift is currently active. To ensure financial reconciliation, please enter the physical cash amount currently in your drawer.
              </p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-3 text-center">Physical Drawer Amount (RWF)</label>
                  <input 
                    type="number"
                    value={drawerAmount}
                    onChange={(e) => setDrawerAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-2xl font-black text-[#1E293B] text-center placeholder-[#CBD5E1]"
                  />
                </div>
                
                <div className="flex gap-4 pt-2">
                  <button 
                    onClick={() => executeGenerate()}
                    className="flex-1 px-4 py-4 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    Skip Audit
                  </button>
                  <button 
                    onClick={() => executeGenerate(drawerAmount)}
                    disabled={!drawerAmount}
                    className="flex-[2] px-4 py-4 rounded-xl bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-xs uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg"
                  >
                    Verify & Generate
                  </button>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowShiftPrompt(false)}
              className="absolute top-6 right-6 text-[#94A3B8] hover:text-[#1E3A8A] transition-colors"
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
