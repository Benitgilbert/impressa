import { useState, useEffect, useCallback } from 'react';
import {
    FaPlus, FaEdit, FaTrash, FaTimes,
    FaHandshake, FaLink, FaToggleOn, FaToggleOff,
    FaImage, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import api from '../utils/axiosInstance';

export default function AdminBrandPartners() {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPartner, setEditingPartner] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState({ name: '', logo: '', websiteUrl: '', isActive: true });
    const [logoFile, setLogoFile] = useState(null);


    const fetchPartners = useCallback(async () => {
        try {
            const res = await api.get('/brand-partners');
            if (res.data.success) setPartners(res.data.data);
        } catch (err) { setError('Failed to fetch brand partners'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPartners(); }, [fetchPartners]);
    useEffect(() => { if (error || success) { const t = setTimeout(() => { setError(''); setSuccess(''); }, 3000); return () => clearTimeout(t); } }, [error, success]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('websiteUrl', form.websiteUrl);
            formData.append('isActive', form.isActive);
            if (logoFile) formData.append('logo', logoFile);
            else if (form.logo) formData.append('logo', form.logo);

            const res = editingPartner ? await api.put(`/brand-partners/${editingPartner.id}`, formData) : await api.post('/brand-partners', formData);
            if (res.data.success) { setSuccess(editingPartner ? 'Brand partner updated!' : 'Brand partner created!'); fetchPartners(); closeModal(); }
            else setError(res.data.message || 'Failed to save');
        } catch (err) { setError('Failed to save brand partner'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this brand partner?')) return;
        try {
            const res = await api.delete(`/brand-partners/${id}`);
            if (res.data.success) { setSuccess('Brand partner deleted!'); fetchPartners(); }
        } catch (err) { setError('Failed to delete'); }
    };

        try {
            const res = await api.patch(`/brand-partners/${id}/toggle`);
            if (res.data.success) fetchPartners();
        } catch (err) { setError('Failed to toggle'); }
    };

    const handleMove = async (index, direction) => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= partners.length) return;
        const newPartners = [...partners];
        [newPartners[index], newPartners[newIndex]] = [newPartners[newIndex], newPartners[index]];
        try {
            const res = await api.post('/brand-partners/reorder', { partners: newPartners.map((p, idx) => ({ id: p.id, order: idx })) });
            if (res.data.success) fetchPartners();
        } catch (err) { setError('Failed to reorder'); }
    };

    const openModal = (partner = null) => {
        if (partner) {
            setEditingPartner(partner);
            setForm({ name: partner.name || '', logo: partner.logo || '', websiteUrl: partner.websiteUrl || '', isActive: partner.isActive !== false });
        } else {
            setEditingPartner(null);
            setForm({ name: '', logo: '', websiteUrl: '', isActive: true });
        }
        setLogoFile(null);
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingPartner(null); setError(''); };

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Brand Partners</h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Manage brand logos displayed on homepage</p>
                        </div>
                        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all">
                            <FaPlus /> Add Partner
                        </button>
                    </div>

                    {/* Alerts */}
                    {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}
                    {success && <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm">{success}</div>}

                    {/* Partners Table */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal-500">Loading brand partners...</p>
                            </div>
                        ) : partners.length === 0 ? (
                            <div className="p-12 text-center">
                                <FaHandshake className="text-5xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-2">No Brand Partners Yet</h3>
                                <p className="text-charcoal-500">Add your first brand partner</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider w-20">Order</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider w-24">Logo</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider hidden md:table-cell">Website</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {partners.map((partner, index) => (
                                            <tr key={partner.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <button onClick={() => handleMove(index, 'up')} disabled={index === 0}
                                                            className={`p-1.5 rounded ${index === 0 ? 'text-charcoal-300 cursor-not-allowed' : 'text-charcoal-500 hover:bg-charcoal-100 dark:hover:bg-charcoal-700'}`}>
                                                            <FaArrowUp className="text-xs" />
                                                        </button>
                                                        <button onClick={() => handleMove(index, 'down')} disabled={index === partners.length - 1}
                                                            className={`p-1.5 rounded ${index === partners.length - 1 ? 'text-charcoal-300 cursor-not-allowed' : 'text-charcoal-500 hover:bg-charcoal-100 dark:hover:bg-charcoal-700'}`}>
                                                            <FaArrowDown className="text-xs" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {partner.logo ? (
                                                        <img src={partner.logo} alt={partner.name} className="w-16 h-12 object-contain bg-white dark:bg-charcoal-700 rounded-lg p-1" />
                                                    ) : (
                                                        <div className="w-16 h-12 bg-cream-200 dark:bg-charcoal-700 rounded-lg flex items-center justify-center">
                                                            <FaImage className="text-charcoal-400" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-charcoal-800 dark:text-white">{partner.name}</span>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    {partner.websiteUrl ? (
                                                        <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-500 hover:underline text-sm">
                                                            <FaLink className="text-xs" /> {partner.websiteUrl.replace(/^https?:\/\//, '').slice(0, 30)}
                                                        </a>
                                                    ) : (
                                                        <span className="text-charcoal-400 text-sm">No link</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${partner.isActive ? 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400' : 'bg-charcoal-100 text-charcoal-500 dark:bg-charcoal-700 dark:text-charcoal-400'}`}>
                                                        {partner.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => handleToggle(partner.id)} className={`p-2 rounded-lg transition-colors ${partner.isActive ? 'text-sage-500 hover:bg-sage-50 dark:hover:bg-sage-900/20' : 'text-charcoal-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-700'}`}>
                                                            {partner.isActive ? <FaToggleOn className="text-lg" /> : <FaToggleOff className="text-lg" />}
                                                        </button>
                                                        <button onClick={() => openModal(partner)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><FaEdit /></button>
                                                        <button onClick={() => handleDelete(partner.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><FaTrash /></button>
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
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">{editingPartner ? 'Edit Brand Partner' : 'Add Brand Partner'}</h3>
                                    <button onClick={closeModal} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"><FaTimes /></button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Brand Name *</label>
                                        <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., TechCorp"
                                            className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                                            <FaImage className="text-charcoal-400" /> Logo Image
                                        </label>
                                        <input type="file" accept="image/*" onChange={e => { if (e.target.files[0]) { setLogoFile(e.target.files[0]); setForm({ ...form, logo: URL.createObjectURL(e.target.files[0]) }); } }}
                                            className="w-full px-4 py-2 bg-cream-100 dark:bg-charcoal-700 rounded-xl text-charcoal-800 dark:text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-terracotta-500 file:text-white file:font-medium file:cursor-pointer" />
                                        {form.logo && (
                                            <div className="mt-3 p-3 bg-cream-50 dark:bg-charcoal-700 rounded-lg">
                                                <img src={form.logo} alt="Preview" className="h-16 object-contain mx-auto" />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                                            <FaLink className="text-charcoal-400" /> Website URL
                                        </label>
                                        <input type="url" value={form.websiteUrl} onChange={e => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://example.com (optional)"
                                            className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                                    </div>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-5 h-5 rounded border-charcoal-300 text-terracotta-500 focus:ring-terracotta-500" />
                                        <span className="text-charcoal-700 dark:text-charcoal-300 font-medium">Active (visible on homepage)</span>
                                    </label>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-cream-200 dark:border-charcoal-700">
                                        <button type="button" onClick={closeModal} className="px-4 py-2 text-charcoal-600 dark:text-charcoal-400 hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-xl font-medium transition-colors">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all">{editingPartner ? 'Update Partner' : 'Add Partner'}</button>
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
