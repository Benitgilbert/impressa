import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from "../utils/axiosInstance";

function AdminReports() {
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
      // Build params mapping for backend expectations
      const paramsObj = { type, format };
      if (type === "monthly") {
        const now = new Date();
        const month = (now.getMonth() + 1).toString();
        const year = now.getFullYear().toString();
        paramsObj.month = month;
        paramsObj.year = year;
      } else if (type === "daily") {
        paramsObj.date = (from || new Date().toISOString().slice(0,10));
      } else if (type === "custom-range" || type === "revenue") {
        if (from) paramsObj.start = from;
        if (to) paramsObj.end = to;
      } else if (from) {
        // generic filters
        paramsObj.from = from;
        if (to) paramsObj.to = to;
      }

      if (format === "pdf") {
        // Open PDF inline
        const params = new URLSearchParams(paramsObj);
        const url = `${api.defaults.baseURL.replace(/\/$/, "")}/orders/report?${params.toString()}`;
        const token = localStorage.getItem("authToken");
        
        // Fetch PDF as blob with auth
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to generate PDF");
          } else {
            throw new Error(`Failed to generate PDF (Status: ${res.status})`);
          }
        }
        
        // Open PDF in new window
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const w = window.open(blobUrl, "_blank");
        if (!w) {
          // Fallback if popup blocked
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${type}-report.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        // CSV download
        const res = await api.get("/orders/report", {
          params: paramsObj,
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${type}-report.csv`);
        document.body.appendChild(link);
        link.click();
      }
      setMessage("✅ Report generated");
      fetchLogs();
    } catch (err) {
      console.error("Report generation failed:", err);
      const errorMsg = err.response?.data?.message || err.message || "Unknown error";
      setMessage(`❌ Failed to generate report: ${errorMsg}`);
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
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Topbar />
        <main className="p-6 overflow-auto">
          <div className="bg-white rounded shadow p-4 sm:p-6 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-semibold">Reports</h2>
                <p className="text-sm text-gray-500">Generate PDF/CSV and view history.</p>
              </div>
              <button onClick={downloadLogsCsv} className="px-3 py-2 rounded border text-sm hover:bg-gray-50">Download Logs CSV</button>
            </div>

            {message && (
              <div className={`mb-3 text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{message}</div>
            )}

            <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Report Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="monthly">Monthly</option>
                  <option value="daily">Daily</option>
                  <option value="custom-range">Custom Range</option>
                  <option value="customer">By Customer</option>
                  <option value="status">By Status</option>
                  <option value="revenue">Revenue</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button type="submit" disabled={loading} className={`px-4 py-2 rounded text-white text-sm ${loading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}>{loading ? "Generating…" : "Generate Report"}</button>
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full text-sm text-left border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2">Timestamp</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Format</th>
                    <th className="p-2">Generated By</th>
                    <th className="p-2">AI Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading && (
                    <tr><td colSpan={5} className="p-4 text-gray-500">Loading logs…</td></tr>
                  )}
                  {!logsLoading && logs.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">No report logs yet.</td></tr>
                  )}
                  {logs.map((log) => (
                    <tr key={log._id} className="border-t">
                      <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-2 capitalize">{log.type}</td>
                      <td className="p-2 uppercase">{log.format}</td>
                      <td className="p-2">{log.generatedBy?.name} <span className="text-xs text-gray-500">({log.generatedBy?.email})</span></td>
                      <td className="p-2">
                        <div className="line-clamp-2 text-gray-700">{log.aiSummary}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminReports;


