import { useState, useEffect } from "react";
import api from "../utils/axiosInstance";
import { FaTrash, FaEdit, FaPlus, FaTags, FaTimes } from "react-icons/fa";

function AdminAttributes() {
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: "", type: "select", values: [] });
    const [newValue, setNewValue] = useState("");
    const [editingId, setEditingId] = useState(null);

    useEffect(() => { fetchAttributes(); }, []);

    const fetchAttributes = async () => {
        try {
            const { data } = await api.get("/attributes");
            setAttributes(data);
        } catch (error) {
            console.error("Error fetching attributes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure? This will remove this attribute from all products.")) {
            try {
                await api.delete(`/attributes/${id}`);
                fetchAttributes();
            } catch (error) {
                console.error("Error deleting attribute:", error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/attributes/${editingId}`, formData);
            } else {
                await api.post("/attributes", formData);
            }
            setShowModal(false);
            setFormData({ name: "", type: "select", values: [] });
            setEditingId(null);
            fetchAttributes();
        } catch (error) {
            console.error("Error saving attribute:", error);
            alert("Failed to save attribute");
        }
    };

    const handleEdit = (attribute) => {
        setEditingId(attribute.id);
        setFormData({ name: attribute.name, type: attribute.type, values: attribute.values });
        setShowModal(true);
    };

    const addValue = () => {
        if (!newValue.trim()) return;
        const slug = newValue.toLowerCase().replace(/ /g, "-");
        setFormData({ ...formData, values: [...formData.values, { name: newValue, slug, value: newValue }] });
        setNewValue("");
    };

    const removeValue = (index) => {
        const newValues = [...formData.values];
        newValues.splice(index, 1);
        setFormData({ ...formData, values: newValues });
    };

    return (
        <div className="min-h-screen flex flex-col transition-all duration-300">
            <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Product Attributes</h1>
                        <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Manage sizes, colors and other variations</p>
                    </div>
                    <button
                        onClick={() => { setEditingId(null); setFormData({ name: "", type: "select", values: [] }); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all"
                    >
                        <FaPlus /> Add Attribute
                    </button>
                </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal-500 dark:text-charcoal-400">Loading attributes...</p>
                            </div>
                        ) : attributes.length === 0 ? (
                            <div className="p-12 text-center">
                                <FaTags className="text-5xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-2">No Attributes Found</h3>
                                <p className="text-charcoal-500 dark:text-charcoal-400">Create one to get started</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden md:table-cell">Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Terms</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {attributes.map((attr) => (
                                            <tr key={attr.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-terracotta-100 dark:bg-terracotta-900/20 flex items-center justify-center">
                                                            <FaTags className="text-terracotta-500" />
                                                        </div>
                                                        <span className="font-medium text-charcoal-800 dark:text-white">{attr.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${attr.type === 'color'
                                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                                                            : attr.type === 'label'
                                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                                                : 'bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-300'
                                                        }`}>
                                                        {attr.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {attr.values.slice(0, 5).map((v, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-sage-100 dark:bg-sage-900/20 text-sage-700 dark:text-sage-400 rounded text-xs">
                                                                {v.name}
                                                            </span>
                                                        ))}
                                                        {attr.values.length > 5 && (
                                                            <span className="px-2 py-0.5 bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-500 rounded text-xs">
                                                                +{attr.values.length - 5} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => handleEdit(attr)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                                                            <FaEdit />
                                                        </button>
                                                        <button onClick={() => handleDelete(attr.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
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
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                            <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">
                                {editingId ? "Edit Attribute" : "Add New Attribute"}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors">
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Size, Color"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white placeholder:text-charcoal-400 outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors"
                                >
                                    <option value="select">Select (Dropdown)</option>
                                    <option value="color">Color</option>
                                    <option value="label">Label</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Terms (Values)</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        placeholder="Add term (e.g. Small)"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
                                        className="flex-1 px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white placeholder:text-charcoal-400 outline-none transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={addValue}
                                        className="px-4 py-2.5 bg-sage-500 hover:bg-sage-600 text-white rounded-xl font-medium transition-all"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.values.map((val, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-terracotta-100 dark:bg-terracotta-900/20 text-terracotta-700 dark:text-terracotta-400 rounded-full text-sm font-medium">
                                            {val.name}
                                            <button type="button" onClick={() => removeValue(idx)} className="ml-1 text-terracotta-500 hover:text-terracotta-700">×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>

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
                                    {editingId ? "Update Attribute" : "Create Attribute"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminAttributes;
