import { useState, useEffect } from 'react';
import {
    FaPlus, FaEdit, FaTrash, FaTimes,
    FaDesktop, FaCalendarAlt, FaLink, FaToggleOn, FaToggleOff
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function AdminBanners() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState(false);

    const [form, setForm] = useState({
        title: '', subtitle: '', badge: 'Limited Time Offer', buttonText: 'Shop Now', buttonLink: '/shop',
        backgroundImage: '', gradientFrom: '#8b5cf6', gradientTo: '#d946ef', startDate: '', endDate: '', position: 'hero', isActive: true
    });

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const BASE_URL = API_URL.replace(/\/api$/, '');

    const presetGradients = [
        { from: '#8b5cf6', to: '#d946ef', label: 'Violet → Fuchsia' },
        { from: '#ef4444', to: '#f97316', label: 'Red → Orange' },
        { from: '#3b82f6', to: '#06b6d4', label: 'Blue → Cyan' },
        { from: '#10b981', to: '#14b8a6', label: 'Emerald → Teal' },
        { from: '#C67C4E', to: '#b45309', label: 'Terracotta' },
        { from: '#6b7280', to: '#374151', label: 'Dark Slate' },
    ];

    useEffect(() => { fetchBanners(); }, []);
    useEffect(() => { if (error || success) { const t = setTimeout(() => { setError(''); setSuccess(''); }, 3000); return () => clearTimeout(t); } }, [error, success]);

    const fetchBanners = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/banners`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setBanners(data.data);
        } catch (err) { setError('Failed to fetch banners'); }
        finally { setLoading(false); }
    };

    const getStatusInfo = (banner) => {
        if (!banner.isActive) return { label: 'Inactive', classes: 'bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-400' };
        const now = new Date();
        if (banner.startDate && new Date(banner.startDate) > now) return { label: 'Scheduled', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' };
        if (banner.endDate && new Date(banner.endDate) < now) return { label: 'Expired', classes: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' };
        return { label: 'Active', classes: 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400' };
    };

    const toLocalISOString = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
            const data = await res.json();
            if (data.success) setForm({ ...form, backgroundImage: `${BASE_URL}${data.data.url}` });
            else setError('Failed to upload image');
        } catch (err) { setError('Error uploading image'); }
        finally { setUploading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('authToken');
            const url = editingBanner ? `${API_URL}/banners/${editingBanner._id}` : `${API_URL}/banners`;
            const payload = {
                ...form,
                startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
                endDate: form.endDate ? new Date(form.endDate).toISOString() : null
            };
            const res = await fetch(url, {
                method: editingBanner ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) { setSuccess(editingBanner ? 'Banner updated!' : 'Banner created!'); fetchBanners(); closeModal(); }
            else setError(data.message || 'Failed to save banner');
        } catch (err) { setError('Failed to save banner'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this banner?')) return;
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/banners/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) { setSuccess('Banner deleted!'); fetchBanners(); }
            else setError(data.message);
        } catch (err) { setError('Failed to delete'); }
    };

    const handleToggle = async (id) => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/banners/${id}/toggle`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
            if ((await res.json()).success) fetchBanners();
        } catch (err) { setError('Failed to toggle'); }
    };

    const openModal = (banner = null) => {
        if (banner) {
            setEditingBanner(banner);
            setForm({
                title: banner.title || '', subtitle: banner.subtitle || '', badge: banner.badge || 'Limited Time Offer',
                buttonText: banner.buttonText || 'Shop Now', buttonLink: banner.buttonLink || '/shop', backgroundImage: banner.backgroundImage || '',
                gradientFrom: banner.gradientFrom || '#8b5cf6', gradientTo: banner.gradientTo || '#d946ef',
                startDate: toLocalISOString(banner.startDate),
                endDate: toLocalISOString(banner.endDate),
                position: banner.position || 'hero', isActive: banner.isActive !== false
            });
        } else {
            setEditingBanner(null);
            setForm({ title: '', subtitle: '', badge: 'Limited Time Offer', buttonText: 'Shop Now', buttonLink: '/shop', backgroundImage: '', gradientFrom: '#8b5cf6', gradientTo: '#d946ef', startDate: '', endDate: '', position: 'hero', isActive: true });
        }
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingBanner(null); setError(''); };

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
                <Topbar onMenuClick={() => setSidebarOpen(true)} title="Banners" />
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Promotional Banners</h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Manage homepage banners and promotions</p>
                        </div>
                        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all">
                            <FaPlus /> Create Banner
                        </button>
                    </div>

                    {/* Alerts */}
                    {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}
                    {success && <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm">{success}</div>}

                    {/* Banners Grid */}
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-charcoal-500">Loading banners...</p>
                        </div>
                    ) : banners.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-charcoal-800 rounded-2xl border border-cream-200 dark:border-charcoal-700">
                            <FaDesktop className="text-5xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-2">No Banners Yet</h3>
                            <p className="text-charcoal-500">Create your first promotional banner</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {banners.map((banner) => {
                                const statusInfo = getStatusInfo(banner);
                                return (
                                    <div key={banner._id} className="bg-white dark:bg-charcoal-800 rounded-2xl border border-cream-200 dark:border-charcoal-700 overflow-hidden shadow-sm">
                                        {/* Preview */}
                                        <div className="relative h-40" style={{ background: banner.backgroundImage ? `url(${banner.backgroundImage}) center/cover` : `linear-gradient(135deg, ${banner.gradientFrom}, ${banner.gradientTo})` }}>
                                            <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.classes}`}>{statusInfo.label}</span>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                                                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium mb-2">{banner.badge}</span>
                                                <h3 className="text-xl font-bold drop-shadow-md">{banner.title}</h3>
                                                {banner.subtitle && <p className="text-sm opacity-90 mt-1">{banner.subtitle}</p>}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-4 space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400">
                                                <FaLink className="text-charcoal-400" />
                                                <span>{banner.buttonLink}</span>
                                                <span className="ml-auto px-2 py-0.5 bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300 rounded text-xs capitalize">{banner.position}</span>
                                            </div>
                                            {(banner.startDate || banner.endDate) && (
                                                <div className="flex items-center gap-2 text-sm text-charcoal-500">
                                                    <FaCalendarAlt className="text-charcoal-400" />
                                                    <span>{banner.startDate && new Date(banner.startDate).toLocaleDateString()}{banner.startDate && banner.endDate && ' – '}{banner.endDate && new Date(banner.endDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between px-4 py-3 border-t border-cream-200 dark:border-charcoal-700">
                                            <button onClick={() => handleToggle(banner._id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${banner.isActive ? 'text-sage-600 hover:bg-sage-50 dark:hover:bg-sage-900/20' : 'text-charcoal-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-700'}`}>
                                                {banner.isActive ? <FaToggleOn className="text-lg" /> : <FaToggleOff className="text-lg" />}
                                                {banner.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                            <div className="flex gap-1">
                                                <button onClick={() => openModal(banner)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><FaEdit /></button>
                                                <button onClick={() => handleDelete(banner._id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><FaTrash /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Modal */}
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">{editingBanner ? 'Edit Banner' : 'Create Banner'}</h3>
                                    <button onClick={closeModal} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"><FaTimes /></button>
                                </div>

                                <div className="p-6 overflow-y-auto max-h-[70vh]">
                                    {/* Live Preview */}
                                    <div className="mb-6 rounded-xl overflow-hidden h-40" style={{ background: form.backgroundImage ? `url(${form.backgroundImage}) center/cover` : `linear-gradient(135deg, ${form.gradientFrom}, ${form.gradientTo})` }}>
                                        <div className="h-full flex flex-col items-center justify-center text-center text-white p-4">
                                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium mb-2">{form.badge || 'Badge'}</span>
                                            <h3 className="text-2xl font-bold drop-shadow-md">{form.title || 'Your Title Here'}</h3>
                                            {form.subtitle && <p className="text-sm opacity-90 mt-1">{form.subtitle}</p>}
                                            <span className="mt-3 px-4 py-1.5 bg-white text-charcoal-900 rounded-lg font-semibold text-sm">{form.buttonText || 'Button'}</span>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Title *</label>
                                                <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Up to 50% Off"
                                                    className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Badge</label>
                                                <input type="text" value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="Limited Time"
                                                    className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Position</label>
                                                <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none">
                                                    <option value="hero">Hero (Top)</option>
                                                    <option value="middle">Middle</option>
                                                    <option value="bottom">Bottom</option>
                                                    <option value="sidebar">Sidebar</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Subtitle</label>
                                                <input type="text" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="Don't miss our biggest sale..."
                                                    className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Button Text</label>
                                                <input type="text" value={form.buttonText} onChange={e => setForm({ ...form, buttonText: e.target.value })} placeholder="Shop Now"
                                                    className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Button Link</label>
                                                <input type="text" value={form.buttonLink} onChange={e => setForm({ ...form, buttonLink: e.target.value })} placeholder="/shop"
                                                    className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Start Date</label>
                                                <input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">End Date</label>
                                                <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Background Image</label>
                                                <div className="flex gap-2">
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading}
                                                        className="flex-1 px-4 py-2 bg-cream-100 dark:bg-charcoal-700 rounded-xl text-charcoal-800 dark:text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-terracotta-500 file:text-white file:font-medium file:cursor-pointer" />
                                                    {form.backgroundImage && <button type="button" onClick={() => setForm({ ...form, backgroundImage: '' })} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><FaTimes /></button>}
                                                </div>
                                                {uploading && <span className="text-xs text-blue-500 mt-1">Uploading...</span>}
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Gradient Colors</label>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {presetGradients.map((preset, i) => (
                                                        <div key={i} onClick={() => setForm({ ...form, gradientFrom: preset.from, gradientTo: preset.to })} title={preset.label}
                                                            className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ${form.gradientFrom === preset.from && form.gradientTo === preset.to ? 'ring-2 ring-terracotta-500 ring-offset-2' : ''}`}
                                                            style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }} />
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <input type="color" value={form.gradientFrom} onChange={e => setForm({ ...form, gradientFrom: e.target.value })} className="h-8 w-12 rounded cursor-pointer" />
                                                    <span className="text-charcoal-400">→</span>
                                                    <input type="color" value={form.gradientTo} onChange={e => setForm({ ...form, gradientTo: e.target.value })} className="h-8 w-12 rounded cursor-pointer" />
                                                </div>
                                            </div>
                                            <label className="col-span-2 flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-5 h-5 rounded border-charcoal-300 text-terracotta-500 focus:ring-terracotta-500" />
                                                <span className="text-charcoal-700 dark:text-charcoal-300 font-medium">Banner is active</span>
                                            </label>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-cream-200 dark:border-charcoal-700">
                                            <button type="button" onClick={closeModal} className="px-4 py-2 text-charcoal-600 dark:text-charcoal-400 hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-xl font-medium transition-colors">Cancel</button>
                                            <button type="submit" className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all">{editingBanner ? 'Update Banner' : 'Create Banner'}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
