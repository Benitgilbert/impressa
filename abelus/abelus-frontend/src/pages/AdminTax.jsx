
import { useState, useEffect } from "react";
import api from "../utils/axiosInstance";
import { FaTrash, FaEdit, FaPlus, FaCloudDownloadAlt, FaGlobeAfrica, FaPercentage, FaCheck, FaTimes, FaShippingFast } from "react-icons/fa";

function AdminTax() {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: "", country: "*", city: "*", rate: 0, priority: 1, shipping: true });
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => { fetchRates(); }, []);
    useEffect(() => { if (error || success) { const t = setTimeout(() => { setError(''); setSuccess(''); }, 3000); return () => clearTimeout(t); } }, [error, success]);

    const fetchRates = async () => {
        try {
            const { data } = await api.get("/taxes");
            setRates(data.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching rates:", error);
            setError("Failed to fetch tax rates");
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this tax rate?")) {
            try { await api.delete(`/ taxes / ${id} `); setSuccess("Tax rate deleted"); fetchRates(); } catch (error) { console.error("Error deleting rate:", error); setError("Failed to delete rate"); }
        }
    };

    const handleFetchLiveRates = async () => {
        setFetching(true);
        try {
            const { data } = await api.post("/taxes/fetch");
            setSuccess(data.message || "Rates fetched successfully");
            fetchRates();
        } catch (error) {
            console.error("Error fetching live rates:", error);
            setError("Failed to fetch live rates");
        } finally { setFetching(false); }
    };

    const handleEdit = (rate) => {
        setFormData({ name: rate.name, country: rate.country, city: rate.city, rate: rate.rate, priority: rate.priority, shipping: rate.shipping });
        setIsEdit(true); setEditId(rate.id); setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) await api.put(`/ taxes / ${editId} `, formData);
            else await api.post("/taxes", formData);
            setShowModal(false); resetForm(); fetchRates(); setSuccess(isEdit ? "Tax rate updated" : "Tax rate added");
        } catch (error) { console.error("Error saving rate:", error); setError("Failed to save tax rate"); }
    };

    const resetForm = () => {
        setFormData({ name: "", country: "*", city: "*", rate: 0, priority: 1, shipping: true });
        setIsEdit(false); setEditId(null);
    };

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1200px] w-full mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Tax Management</h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Configure tax rates by location</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleFetchLiveRates} disabled={fetching} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-300 rounded-xl hover:bg-cream-50 dark:hover:bg-charcoal-700 transition-colors shadow-sm disabled:opacity-50">
                                <FaCloudDownloadAlt /> {fetching ? "Fetching..." : "Fetch Live Rates"}
                            </button>
                            <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-bold transition-all shadow-md">
                                <FaPlus /> Add Rate
                            </button>
                        </div>
                    </div>

                    {/* Alerts */}
                    {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}
                    {success && <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm">{success}</div>}

                    {/* Table */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center text-charcoal-500">Loading tax rates...</div>
                        ) : rates.length === 0 ? (
                            <div className="p-12 text-center text-charcoal-500">
                                <FaPercentage className="text-4xl mx-auto mb-3 opacity-20" />
                                <p>No tax rates defined</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Location</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Rate</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Priority</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Shipping</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {rates.map((rate) => (
                                            <tr key={rate.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-charcoal-800 dark:text-white">{rate.name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-sm text-charcoal-600 dark:text-charcoal-400">
                                                        <FaGlobeAfrica className="text-xs text-charcoal-400" />
                                                        <span>{rate.country === '*' ? 'All Countries' : rate.country}</span>
                                                        <span className="text-charcoal-300">/</span>
                                                        <span>{rate.city === '*' ? 'All Cities' : rate.city}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                                        <FaPercentage className="text-[10px]" /> {rate.rate}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400">{rate.priority}</td>
                                                <td className="px-6 py-4">
                                                    {rate.shipping ? (
                                                        <span className="text-sage-500 flex items-center gap-1 text-sm"><FaCheck /> Applies</span>
                                                    ) : (
                                                        <span className="text-charcoal-400 text-sm">--</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleEdit(rate)} className="p-2 text-charcoal-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><FaEdit /></button>
                                                        <button onClick={() => handleDelete(rate.id)} className="p-2 text-charcoal-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><FaTrash /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Modal */}
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">{isEdit ? 'Edit Tax Rate' : 'Add Tax Rate'}</h3>
                                    <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"><FaTimes /></button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Tax Name</label>
                                        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. VAT"
                                            className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Country Code</label>
                                            <input type="text" required value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="*"
                                                className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">City</label>
                                            <input type="text" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="*"
                                                className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Rate (%)</label>
                                            <div className="relative">
                                                <input type="number" required step="0.01" value={formData.rate} onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 pr-8" />
                                                <FaPercentage className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 text-xs" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Priority</label>
                                            <input type="number" required value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-3 p-3 bg-cream-50 dark:bg-charcoal-700 rounded-xl cursor-pointer hover:bg-cream-100 dark:hover:bg-charcoal-600 transition-colors">
                                            <input type="checkbox" checked={formData.shipping} onChange={(e) => setFormData({ ...formData, shipping: e.target.checked })} className="w-5 h-5 text-terracotta-500 rounded focus:ring-terracotta-500 border-gray-300" />
                                            <div className="flex items-center gap-2">
                                                <FaShippingFast className="text-charcoal-500" />
                                                <span className="text-sm font-medium text-charcoal-800 dark:text-white">Apply to Shipping Cost</span>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="pt-2 flex justify-end gap-3">
                                        <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-charcoal-600 dark:text-charcoal-300 font-medium hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-xl transition-colors">Cancel</button>
                                        <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-xl shadow-md transition-all"><FaEdit /> {isEdit ? 'Update Rate' : 'Add Rate'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default AdminTax;
