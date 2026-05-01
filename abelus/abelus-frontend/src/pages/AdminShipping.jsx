import { useState, useEffect, useCallback } from "react";
import api from "../utils/axiosInstance";
import { FaTrash, FaEdit, FaPlus, FaGlobeAfrica, FaMapMarkerAlt, FaBoxOpen, FaSave, FaTimes } from "react-icons/fa";
import { useToast } from "../context/ToastContext";
import { getProvinces, getDistricts } from "../utils/locationHelpers";

function AdminShipping() {
    const { showSuccess, showError } = useToast();
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // Updated to match backend schema: regions need province (required) and district
    const [formData, setFormData] = useState({ name: "", regions: [{ province: "", district: "" }], methods: [] });
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [availableProvinces, setAvailableProvinces] = useState([]);

    const fetchZones = useCallback(async () => {
        try {
            const { data } = await api.get("/shipping"); // Path is /shipping but displayed as Delivery
            setZones(data.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching zones:", error);
            showError("Failed to load delivery zones");
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchZones();
        setAvailableProvinces(getProvinces());
    }, [fetchZones]);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this zone?")) {
            try {
                await api.delete(`/shipping/${id}`);
                showSuccess("Zone deleted successfully");
                fetchZones();
            } catch (error) {
                console.error("Error deleting zone:", error);
                showError("Failed to delete zone");
            }
        }
    };

    const handleEdit = (zone) => {
        setFormData({
            name: zone.name,
            // Ensure we map back to the form structure if data exists, otherwise default
            regions: zone.regions.length ? zone.regions : [{ province: "", district: "" }],
            methods: zone.methods
        });
        setIsEdit(true);
        setEditId(zone.id);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) await api.put(`/shipping/${editId}`, formData);
            else await api.post("/shipping", formData);

            showSuccess(isEdit ? "Zone updated successfully" : "Zone created successfully");
            setShowModal(false);
            resetForm();
            fetchZones();
        } catch (error) {
            console.error("Error saving zone:", error);
            // improvements: Show specific error message from backend if available
            const msg = error.response?.data?.message || "Failed to save zone";
            showError(msg);
        }
    };

    const resetForm = () => {
        setFormData({ name: "", regions: [{ province: "", district: "" }], methods: [] });
        setIsEdit(false);
        setEditId(null);
    };

    const addMethod = () => setFormData({ ...formData, methods: [...formData.methods, { name: "Standard Delivery", type: "flat_rate", cost: 0, isActive: true }] });
    const updateMethod = (index, field, value) => { const newMethods = [...formData.methods]; newMethods[index][field] = value; setFormData({ ...formData, methods: newMethods }); };
    const removeMethod = (index) => { const newMethods = formData.methods.filter((_, i) => i !== index); setFormData({ ...formData, methods: newMethods }); };

    // Helper to update regions
    const updateRegion = (index, field, value) => {
        const newRegions = [...formData.regions];
        newRegions[index][field] = value;
        // Reset district if province changes
        if (field === 'province') {
            newRegions[index].district = "";
        }
        setFormData({ ...formData, regions: newRegions });
    };

    const addRegion = () => {
        setFormData({ ...formData, regions: [...formData.regions, { province: "", district: "" }] });
    };

    const removeRegion = (index) => {
        const newRegions = formData.regions.filter((_, i) => i !== index);
        setFormData({ ...formData, regions: newRegions });
    };

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Delivery Zones</h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Manage delivery locations and rates</p>
                        </div>
                        <button onClick={() => { resetForm(); setShowModal(true); }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-bold transition-all shadow-md transform active:scale-[0.98]">
                            <FaPlus /> Add Zone
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-charcoal-500 dark:text-charcoal-400">Loading zones...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {zones.map((zone) => (
                                <div key={zone.id} className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
                                    <div className="p-6 pb-4 border-b border-cream-100 dark:border-charcoal-700 flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-sage-100 dark:bg-sage-900/20 flex items-center justify-center text-sage-600 dark:text-sage-400 shrink-0">
                                                <FaGlobeAfrica className="text-2xl" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white line-clamp-1">{zone.name}</h3>
                                                <div className="flex items-center gap-1 text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
                                                    <FaMapMarkerAlt className="text-xs" />
                                                    <span className="line-clamp-1">{zone.regions.map(r => r.district ? `${r.district}, ${r.province}` : r.province).join(" | ") || 'No regions'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(zone)} className="p-2 text-charcoal-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><FaEdit /></button>
                                            <button onClick={() => handleDelete(zone.id)} className="p-2 text-charcoal-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><FaTrash /></button>
                                        </div>
                                    </div>

                                    <div className="p-6 pt-4 flex-1 bg-cream-50/50 dark:bg-charcoal-700/30">
                                        <h4 className="text-xs font-bold text-charcoal-400 uppercase tracking-wider mb-3">Delivery Methods</h4>
                                        <div className="space-y-3">
                                            {zone.methods.length > 0 ? zone.methods.map((method, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-charcoal-700 rounded-xl border border-cream-100 dark:border-charcoal-600">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-cream-100 dark:bg-charcoal-600 flex items-center justify-center text-terracotta-500">
                                                            <FaBoxOpen />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm text-charcoal-800 dark:text-white">{method.name}</p>
                                                            <p className="text-xs text-charcoal-400 capitalize">{method.type.replace("_", " ")}</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-charcoal-800 dark:text-white text-sm">{method.cost} RWF</span>
                                                </div>
                                            )) : (
                                                <div className="text-center py-4 text-charcoal-400 text-sm">No shipping methods defined</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Empty State Card / Add New */}
                            {zones.length === 0 && (
                                <div onClick={() => { resetForm(); setShowModal(true); }} className="border-2 border-dashed border-cream-300 dark:border-charcoal-600 rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-terracotta-400 hover:bg-cream-50 dark:hover:bg-charcoal-800/50 transition-all min-h-[300px]">
                                    <div className="w-16 h-16 rounded-full bg-cream-100 dark:bg-charcoal-700 flex items-center justify-center text-charcoal-400 mb-4">
                                        <FaPlus className="text-2xl" />
                                    </div>
                                    <h3 className="text-lg font-bold text-charcoal-600 dark:text-charcoal-300">Create First Zone</h3>
                                    <p className="text-charcoal-400 text-sm text-center mt-2 max-w-[200px]">Define delivery regions and calculate costs</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                            <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">{isEdit ? 'Edit Delivery Zone' : 'Create New Zone'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"><FaTimes /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-charcoal-800 dark:text-white uppercase tracking-wider">Zone Details</label>
                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Zone Name</label>
                                        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Kigali Metro"
                                            className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">Regions Covered</label>
                                            <button type="button" onClick={addRegion} className="text-xs font-bold text-terracotta-500 hover:text-terracotta-600">+ Add Region</button>
                                        </div>
                                        {formData.regions.map((region, idx) => {
                                            const availableDistricts = region.province ? getDistricts(region.province) : [];
                                            return (
                                                <div key={idx} className="grid grid-cols-12 gap-3 mb-2 relative group">
                                                    <div className="col-span-6">
                                                        <select
                                                            required
                                                            value={region.province}
                                                            onChange={(e) => updateRegion(idx, 'province', e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 appearance-none cursor-pointer"
                                                        >
                                                            <option value="">Select Province</option>
                                                            {availableProvinces.map(prov => (
                                                                <option key={prov} value={prov}>{prov}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-5">
                                                        <select
                                                            value={region.district}
                                                            onChange={(e) => updateRegion(idx, 'district', e.target.value)}
                                                            disabled={!region.province}
                                                            className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 appearance-none cursor-pointer disabled:opacity-50"
                                                        >
                                                            <option value="">All Districts (Entire Province)</option>
                                                            {availableDistricts.map(dist => (
                                                                <option key={dist} value={dist}>{dist}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-1 flex items-center justify-center">
                                                        {formData.regions.length > 1 && (
                                                            <button type="button" onClick={() => removeRegion(idx)} className="p-2 text-charcoal-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><FaTrash size={14} /></button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-cream-200 dark:border-charcoal-700">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-bold text-charcoal-800 dark:text-white uppercase tracking-wider">Delivery Methods</label>
                                        <button type="button" onClick={addMethod} className="text-sm font-bold text-terracotta-500 hover:text-terracotta-600">+ Add Method</button>
                                    </div>

                                    <div className="space-y-3">
                                        {formData.methods.map((method, idx) => (
                                            <div key={idx} className="p-4 bg-cream-50 dark:bg-charcoal-700 rounded-xl border border-cream-200 dark:border-charcoal-600 relative group">
                                                <button type="button" onClick={() => removeMethod(idx)} className="absolute top-2 right-2 p-1.5 text-charcoal-400 hover:text-red-500 rounded-lg hover:bg-cream-100 dark:hover:bg-charcoal-600 opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash size={12} /></button>
                                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                                    <div className="sm:col-span-5">
                                                        <label className="block text-xs font-medium text-charcoal-500 mb-1">Name</label>
                                                        <input type="text" value={method.name} onChange={(e) => updateMethod(idx, "name", e.target.value)}
                                                            className="w-full px-3 py-1.5 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-600 rounded-lg text-sm text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                                    </div>
                                                    <div className="sm:col-span-4">
                                                        <label className="block text-xs font-medium text-charcoal-500 mb-1">Type</label>
                                                        <select value={method.type} onChange={(e) => updateMethod(idx, "type", e.target.value)}
                                                            className="w-full px-3 py-1.5 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-600 rounded-lg text-sm text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500">
                                                            <option value="flat_rate">Flat Rate</option>
                                                            <option value="free_shipping">Free Delivery</option>
                                                            <option value="local_pickup">Local Pickup</option>
                                                        </select>
                                                    </div>
                                                    <div className="sm:col-span-3">
                                                        <label className="block text-xs font-medium text-charcoal-500 mb-1">Cost</label>
                                                        <input type="number" value={method.cost} onChange={(e) => updateMethod(idx, "cost", e.target.value)}
                                                            className="w-full px-3 py-1.5 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-600 rounded-lg text-sm text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                                    </div>
                                                    {method.type === "free_shipping" && (
                                                        <div className="sm:col-span-12">
                                                            <label className="block text-xs font-medium text-charcoal-500 mb-1">Minimum Order Amount</label>
                                                            <input type="number" value={method.minOrderAmount || ''} onChange={(e) => updateMethod(idx, "minOrderAmount", e.target.value)} placeholder="0"
                                                                className="w-full px-3 py-1.5 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-600 rounded-lg text-sm text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {formData.methods.length === 0 && <p className="text-sm text-charcoal-400 italic text-center py-2">No methods added yet.</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-cream-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 flex justify-end gap-3 sticky bottom-0">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-charcoal-600 dark:text-charcoal-300 font-medium hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform active:scale-[0.98] transition-all"><FaSave /> {isEdit ? 'Save Changes' : 'Create Zone'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminShipping;
