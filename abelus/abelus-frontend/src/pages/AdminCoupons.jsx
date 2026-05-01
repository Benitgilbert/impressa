import { useState, useEffect, useCallback } from "react";
import api from "../utils/axiosInstance";
import { FaTrash, FaEdit, FaPlus, FaTag, FaTimes, FaPercent, FaTruck } from "react-icons/fa";

const getTypeIcon = (type) => {
    if (type === 'percentage') return <FaPercent className="text-purple-500" />;
    if (type === 'free_shipping') return <FaTruck className="text-blue-500" />;
    return <FaTag className="text-terracotta-500" />;
};

const isExpired = (date) => new Date(date) < new Date();

function AdminCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ code: "", type: "fixed", value: "", minSpend: "", usageLimit: "", expiresAt: "", isActive: true });
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);

    const fetchCoupons = useCallback(async () => {
        try {
            const { data } = await api.get("/coupons");
            setCoupons(data.data);
        } catch (error) {
            console.error("Error fetching coupons:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this coupon?")) {
            try {
                await api.delete(`/coupons/${id}`);
                fetchCoupons();
            } catch (error) {
                console.error("Error deleting coupon:", error);
            }
        }
    };

    const handleEdit = (coupon) => {
        setFormData({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minSpend: coupon.minSpend || "",
            usageLimit: coupon.usageLimit || "",
            expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : "",
            isActive: coupon.isActive
        });
        setIsEdit(true);
        setEditId(coupon.id);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, value: Number(formData.value), minSpend: formData.minSpend ? Number(formData.minSpend) : 0, usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null };
            if (isEdit) { await api.put(`/coupons/${editId}`, payload); }
            else { await api.post("/coupons", payload); }
            setShowModal(false);
            setFormData({ code: "", type: "fixed", value: "", minSpend: "", usageLimit: "", expiresAt: "", isActive: true });
            setIsEdit(false);
            setEditId(null);
            fetchCoupons();
        } catch (error) {
            console.error("Error saving coupon:", error);
            alert(error.response?.data?.message || "Failed to save coupon");
        }
    };



    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">

                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Coupon Codes</h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Manage discount coupons</p>
                        </div>
                        <button
                            onClick={() => { setFormData({ code: "", type: "fixed", value: "", minSpend: "", usageLimit: "", expiresAt: "", isActive: true }); setIsEdit(false); setShowModal(true); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all"
                        >
                            <FaPlus /> Add Coupon
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal-500 dark:text-charcoal-400">Loading coupons...</p>
                            </div>
                        ) : coupons.length === 0 ? (
                            <div className="p-12 text-center">
                                <FaTag className="text-5xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-2">No Coupons Found</h3>
                                <p className="text-charcoal-500 dark:text-charcoal-400">Create one to get started</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Code</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden md:table-cell">Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Value</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden lg:table-cell">Usage</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden md:table-cell">Expiry</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {coupons.map((coupon) => (
                                            <tr key={coupon.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-terracotta-100 dark:bg-terracotta-900/20 flex items-center justify-center">
                                                            {getTypeIcon(coupon.type)}
                                                        </div>
                                                        <span className="font-mono font-bold text-terracotta-600 dark:text-terracotta-400">{coupon.code}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <span className="px-2.5 py-1 bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300 rounded-full text-xs font-medium capitalize">
                                                        {coupon.type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-charcoal-800 dark:text-white">
                                                        {coupon.type === 'percentage' ? `${coupon.value}%` : coupon.type === 'free_shipping' ? 'Free' : `RWF ${coupon.value}`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 hidden lg:table-cell">
                                                    <span className="text-charcoal-600 dark:text-charcoal-400">
                                                        {coupon.usageCount || 0} / {coupon.usageLimit || '∞'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <span className={`text-sm ${isExpired(coupon.expiresAt) ? 'text-red-500' : 'text-charcoal-600 dark:text-charcoal-400'}`}>
                                                        {new Date(coupon.expiresAt).toLocaleDateString()}
                                                        {isExpired(coupon.expiresAt) && <span className="ml-1 text-xs">(expired)</span>}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${coupon.isActive ? 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400' : 'bg-charcoal-100 text-charcoal-500 dark:bg-charcoal-700 dark:text-charcoal-400'}`}>
                                                        {coupon.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => handleEdit(coupon)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                                                            <FaEdit />
                                                        </button>
                                                        <button onClick={() => handleDelete(coupon.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                                                            <FaTrash />
                                                        </button>
                                                    </div>
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                            <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">
                                {isEdit ? 'Edit Coupon' : 'Create Coupon'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors">
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Coupon Code</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. SUMMER2024"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white placeholder:text-charcoal-400 outline-none transition-colors uppercase font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Discount Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors"
                                    >
                                        <option value="fixed">Fixed Amount</option>
                                        <option value="percentage">Percentage</option>
                                        <option value="free_shipping">Free Shipping</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Value</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="0"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white placeholder:text-charcoal-400 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Min Spend</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Optional"
                                        value={formData.minSpend}
                                        onChange={(e) => setFormData({ ...formData, minSpend: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white placeholder:text-charcoal-400 outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Usage Limit</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Unlimited"
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white placeholder:text-charcoal-400 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Expiry Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors"
                                />
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 rounded border-charcoal-300 text-terracotta-500 focus:ring-terracotta-500"
                                />
                                <span className="text-charcoal-700 dark:text-charcoal-300 font-medium">Coupon is active</span>
                            </label>

                            <div className="flex justify-end gap-3 pt-4 border-t border-cream-200 dark:border-charcoal-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-charcoal-600 dark:text-charcoal-400 hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all"
                                >
                                    {isEdit ? 'Save Changes' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminCoupons;
